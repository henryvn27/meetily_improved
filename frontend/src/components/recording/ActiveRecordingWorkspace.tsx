'use client';

import { ClipboardDocumentIcon, GlobeAltIcon, LockClosedIcon, PauseCircleIcon, SignalIcon } from '@heroicons/react/24/outline';
import { RecordingControls } from '@/components/RecordingControls';
import { AppState } from '@/components/app-shell/AppState';
import { Surface } from '@/components/app-shell/Surface';
import { Button } from '@/components/ui/button';
import { VirtualizedTranscriptView } from '@/components/VirtualizedTranscriptView';
import { useTranscripts } from '@/contexts/TranscriptContext';
import { useConfig } from '@/contexts/ConfigContext';
import { RecordingStatus, useRecordingState } from '@/contexts/RecordingStateContext';
import { formatRecordingDuration } from '@/lib/recording-lifecycle';
import { recordingService } from '@/services/recordingService';
import type { ModalType } from '@/hooks/useModalState';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

interface ActiveRecordingWorkspaceProps {
  isProcessingStop: boolean;
  isStopping: boolean;
  onRecordingStop: (callApi?: boolean) => void;
  onStopInitiated: () => void;
  showModal: (name: ModalType, message?: string) => void;
}

export function ActiveRecordingWorkspace({
  isProcessingStop,
  isStopping,
  onRecordingStop,
  onStopInitiated,
  showModal,
}: ActiveRecordingWorkspaceProps) {
  const { transcripts, transcriptContainerRef, copyTranscript, meetingTitle } = useTranscripts();
  const { transcriptModelConfig } = useConfig();
  const recordingState = useRecordingState();
  const { isPaused, recordingDuration } = recordingState;
  const [speechDetected, setSpeechDetected] = useState(false);
  const displayTitle = meetingTitle && meetingTitle !== '+ New Call'
    ? meetingTitle
    : 'New local meeting';

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    void recordingService.onSpeechDetected(() => setSpeechDetected(true)).then((cleanup) => {
      if (disposed) cleanup();
      else unlisten = cleanup;
    }).catch((error) => {
      console.error('Failed to listen for speech detection:', error);
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  const segments = useMemo(() => transcripts.map(transcript => ({
    id: transcript.id,
    timestamp: transcript.audio_start_time ?? 0,
    endTime: transcript.audio_end_time,
    text: transcript.text,
    confidence: transcript.confidence,
  })), [transcripts]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
      <Surface className="flex shrink-0 flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className={cn(
            'relative grid size-11 shrink-0 place-items-center rounded-md',
            isPaused ? 'bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]' : 'bg-[hsl(var(--accent-soft))] text-accent',
          )}>
            {isPaused ? (
              <PauseCircleIcon className="size-5" aria-hidden="true" />
            ) : (
              <span className="size-3 rounded-full bg-current" aria-hidden="true" />
            )}
            {!isPaused && <span className="absolute size-3 animate-ping rounded-full bg-current opacity-25" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className={cn('text-sm font-semibold', isPaused ? 'text-[hsl(var(--warning))]' : 'text-accent')} role="status" aria-live="polite">
                {isPaused ? 'Recording paused' : 'Recording locally'}
              </p>
              <span className="font-mono text-sm tabular-nums text-muted-foreground" aria-label={`Elapsed recording time ${formatRecordingDuration(recordingDuration)}`}>
                {formatRecordingDuration(recordingDuration)}
              </span>
            </div>
            <h1 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em]">
              {displayTitle}
            </h1>
          </div>
        </div>

        <RecordingControls
          isRecording={recordingState.isRecording}
          onRecordingStop={onRecordingStop}
          onStopInitiated={onStopInitiated}
          isParentProcessing={isProcessingStop}
        />
      </Surface>

      {recordingState.status === RecordingStatus.ERROR && (
        <AppState
          compact
          kind="error"
          title="Recording needs attention"
          description={recordingState.statusMessage || 'The native recording pipeline reported an unexpected error.'}
        />
      )}

      <div ref={transcriptContainerRef} className="min-h-0 flex-1 overflow-hidden">
        <Surface className="flex h-full min-h-0 flex-col overflow-hidden p-0">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/70 px-5 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Live transcript</h2>
                <span className="text-xs text-muted-foreground">{transcripts.length} segment{transcripts.length === 1 ? '' : 's'}</span>
                <span
                  role="status"
                  aria-live="polite"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                    isPaused
                      ? 'border-[hsl(var(--warning)/0.30)] bg-[hsl(var(--warning)/0.10)] text-[hsl(var(--warning))]'
                      : speechDetected
                        ? 'border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.10)] text-[hsl(var(--success))]'
                        : 'border-border bg-secondary text-muted-foreground',
                  )}
                >
                  <SignalIcon className="size-3" aria-hidden="true" />
                  {isPaused ? 'Paused' : speechDetected ? 'Speech detected' : 'Listening'}
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <LockClosedIcon className="size-3.5" aria-hidden="true" />
                Transcript recovery data stays on this device until the meeting is saved.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {transcripts.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyTranscript}>
                  <ClipboardDocumentIcon aria-hidden="true" />
                  Copy
                </Button>
              )}
              {transcriptModelConfig.provider === 'localWhisper' && (
                <Button variant="outline" size="sm" onClick={() => showModal('languageSettings')}>
                  <GlobeAltIcon aria-hidden="true" />
                  Language
                </Button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 py-2">
            <VirtualizedTranscriptView
              segments={segments}
              isRecording={recordingState.isRecording}
              isPaused={isPaused}
              isProcessing={isProcessingStop}
              isStopping={isStopping}
              enableStreaming={recordingState.isRecording}
              showConfidence
              showRecordingStatus={false}
            />
          </div>
        </Surface>
      </div>
    </div>
  );
}
