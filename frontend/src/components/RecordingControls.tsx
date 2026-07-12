'use client';

import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';
import { ArrowPathIcon, PauseIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Analytics from '@/lib/analytics';
import { useRecordingState } from '@/contexts/RecordingStateContext';

interface RecordingControlsProps {
  isRecording: boolean;
  onRecordingStop: (callApi?: boolean) => void;
  onStopInitiated?: () => void;
  isParentProcessing: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  onRecordingStop,
  onStopInitiated,
  isParentProcessing,
}) => {
  const { isPaused } = useRecordingState();
  const [isStopping, setIsStopping] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const stopRecordingAction = useCallback(async () => {
    try {
      const dataDir = await appDataDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const savePath = `${dataDir}/recording-${timestamp}.wav`;

      await invoke('stop_recording', {
        args: { save_path: savePath },
      });

      Analytics.trackTranscriptionSuccess();
      onRecordingStop(true);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      onRecordingStop(false);
    } finally {
      setIsStopping(false);
    }
  }, [onRecordingStop]);

  const handleStopRecording = useCallback(async () => {
    if (!isRecording || isStopping || isPausing || isResuming) return;

    onStopInitiated?.();
    setIsStopping(true);
    Analytics.trackButtonClick('stop_recording', 'recording_controls');
    await stopRecordingAction();
  }, [isRecording, isPausing, isResuming, isStopping, onStopInitiated, stopRecordingAction]);

  const handlePauseRecording = useCallback(async () => {
    if (!isRecording || isPaused || isPausing || isStopping) return;

    setIsPausing(true);
    try {
      await invoke('pause_recording');
      Analytics.trackButtonClick('pause_recording', 'recording_controls');
    } catch (error) {
      console.error('Failed to pause recording:', error);
    } finally {
      setIsPausing(false);
    }
  }, [isPaused, isPausing, isRecording, isStopping]);

  const handleResumeRecording = useCallback(async () => {
    if (!isRecording || !isPaused || isResuming || isStopping) return;

    setIsResuming(true);
    try {
      await invoke('resume_recording');
      Analytics.trackButtonClick('resume_recording', 'recording_controls');
    } catch (error) {
      console.error('Failed to resume recording:', error);
    } finally {
      setIsResuming(false);
    }
  }, [isPaused, isRecording, isResuming, isStopping]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupTranscriptionErrorListener = async () => {
      try {
        unlisten = await listen('transcription-error', (event) => {
          const payload = event.payload as { error?: string; userMessage?: string } | string;
          const message = typeof payload === 'string'
            ? payload
            : payload.userMessage || payload.error || 'Unknown transcription error';

          Analytics.trackTranscriptionError(message);
          onRecordingStop(false);
        });
      } catch (error) {
        console.error('Failed to set up transcription error listener:', error);
      }
    };

    void setupTranscriptionErrorListener();
    return () => unlisten?.();
  }, [onRecordingStop]);

  const pauseBusy = isPausing || isResuming;
  const controlsDisabled = isStopping || isParentProcessing;

  return (
    <TooltipProvider>
      <div className="flex shrink-0 items-center gap-2" aria-label="Recording controls">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={() => void (isPaused ? handleResumeRecording() : handlePauseRecording())}
              disabled={controlsDisabled || pauseBusy}
            >
              {pauseBusy ? (
                <ArrowPathIcon className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : isPaused ? (
                <PlayIcon aria-hidden="true" />
              ) : (
                <PauseIcon aria-hidden="true" />
              )}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPaused ? 'Resume local recording' : 'Pause local recording'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="recording"
              onClick={() => void handleStopRecording()}
              disabled={controlsDisabled || pauseBusy || !isRecording}
            >
              {isStopping ? <ArrowPathIcon className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <StopIcon aria-hidden="true" />}
              {isStopping ? 'Ending...' : 'End recording'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop capture and process the saved meeting</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
