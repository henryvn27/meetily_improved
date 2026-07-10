'use client';

import { Copy, FileLock2, GlobeIcon, PauseCircle } from 'lucide-react';
import { RecordingControls } from '@/components/RecordingControls';
import { Surface } from '@/components/app-shell/Surface';
import { Button } from '@/components/ui/button';
import { VirtualizedTranscriptView } from '@/components/VirtualizedTranscriptView';
import { useTranscripts } from '@/contexts/TranscriptContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useRecordingState } from '@/contexts/RecordingStateContext';
import { formatRecordingDuration } from '@/lib/recording-lifecycle';
import type { ModalType } from '@/hooks/useModalState';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

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
  const displayTitle = meetingTitle && meetingTitle !== '+ New Call'
    ? meetingTitle
    : 'New local meeting';

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
            'relative grid size-11 shrink-0 place-items-center rounded-xl',
            isPaused ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
          )}>
            {isPaused ? (
              <PauseCircle className="size-5" aria-hidden="true" />
            ) : (
              <span className="size-3 rounded-full bg-current" aria-hidden="true" />
            )}
            {!isPaused && <span className="absolute size-3 animate-ping rounded-full bg-current opacity-25" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className={cn('text-sm font-semibold', isPaused ? 'text-amber-800 dark:text-amber-300' : 'text-red-700 dark:text-red-300')} role="status" aria-live="polite">
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

      <div ref={transcriptContainerRef} className="min-h-0 flex-1 overflow-hidden">
        <Surface className="flex h-full min-h-0 flex-col overflow-hidden p-0">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/70 px-5 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Live transcript</h2>
                <span className="text-xs text-muted-foreground">{transcripts.length} segment{transcripts.length === 1 ? '' : 's'}</span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileLock2 className="size-3.5" aria-hidden="true" />
                Transcript recovery data stays on this device until the meeting is saved.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {transcripts.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyTranscript}>
                  <Copy aria-hidden="true" />
                  Copy
                </Button>
              )}
              {transcriptModelConfig.provider === 'localWhisper' && (
                <Button variant="outline" size="sm" onClick={() => showModal('languageSettings')}>
                  <GlobeIcon aria-hidden="true" />
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
