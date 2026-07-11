"use client";

import { Transcript, TranscriptSegmentData } from '@/types';
import { VirtualizedTranscriptView } from '@/components/VirtualizedTranscriptView';
import { TranscriptButtonGroup } from './TranscriptButtonGroup';
import { useMemo } from 'react';
import { PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TranscriptPanelProps {
  transcripts: Transcript[];
  customPrompt: string;
  onPromptChange: (value: string) => void;
  onCopyTranscript: () => void;
  onOpenMeetingFolder: () => Promise<void>;
  isRecording: boolean;
  disableAutoScroll?: boolean;

  // Optional pagination props (when using virtualization)
  usePagination?: boolean;
  segments?: TranscriptSegmentData[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
  loadedCount?: number;
  onLoadMore?: () => void;

  // Retranscription props
  meetingId?: string;
  meetingFolderPath?: string | null;
  onRefetchTranscripts?: () => Promise<void>;
  transcriptionModel?: string | null;
  className?: string;
  onCloseInspector?: () => void;
}

export function TranscriptPanel({
  transcripts,
  customPrompt,
  onPromptChange,
  onCopyTranscript,
  onOpenMeetingFolder,
  isRecording,
  disableAutoScroll = false,
  usePagination = false,
  segments,
  hasMore,
  isLoadingMore,
  totalCount,
  loadedCount,
  onLoadMore,
  meetingId,
  meetingFolderPath,
  onRefetchTranscripts,
  transcriptionModel,
  className,
  onCloseInspector,
}: TranscriptPanelProps) {
  // Convert transcripts to segments if pagination is not used but we want virtualization
  const convertedSegments = useMemo(() => {
    if (usePagination && segments) {
      return segments;
    }
    // Convert transcripts to segments for virtualization
    return transcripts.map(t => ({
      id: t.id,
      timestamp: t.audio_start_time ?? 0,
      endTime: t.audio_end_time,
      text: t.text,
      confidence: t.confidence,
    }));
  }, [transcripts, usePagination, segments]);

  return (
    <aside
      aria-label="Meeting transcript inspector"
      className={cn(
        'min-w-0 shrink-0 flex-col border-l border-border bg-secondary/35',
        className,
      )}
    >
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow">Source record</p>
            <h2 className="mt-1 text-base font-semibold tracking-[-0.03em]">Transcript</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.6875rem] text-muted-foreground">
              {usePagination ? (totalCount ?? convertedSegments.length) : convertedSegments.length} segments
            </span>
            {onCloseInspector && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="xl:hidden"
                onClick={onCloseInspector}
                aria-label="Close transcript inspector"
              >
                <PanelRightClose className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
        <TranscriptButtonGroup
          transcriptCount={usePagination ? (totalCount ?? convertedSegments.length) : (transcripts?.length || 0)}
          onCopyTranscript={onCopyTranscript}
          onOpenMeetingFolder={onOpenMeetingFolder}
          meetingId={meetingId}
          meetingFolderPath={meetingFolderPath}
          onRefetchTranscripts={onRefetchTranscripts}
        />
        <div className="mt-3 grid gap-1.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Source:</span>{' '}
            {meetingFolderPath ? 'Recording folder linked' : 'No recording folder linked'}
          </p>
          <p>
            <span className="font-medium text-foreground">Local transcription:</span>{' '}
            {transcriptionModel || 'Not configured'}
          </p>
        </div>
      </div>

      {/* Transcript content - use virtualized view for better performance */}
      <div className="min-h-0 flex-1 overflow-hidden pb-4">
        <VirtualizedTranscriptView
          segments={convertedSegments}
          isRecording={isRecording}
          isPaused={false}
          isProcessing={false}
          isStopping={false}
          enableStreaming={false}
          showConfidence={true}
          disableAutoScroll={disableAutoScroll}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
          onLoadMore={onLoadMore}
        />
      </div>

      {/* Custom prompt input at bottom of transcript section */}
      {!isRecording && convertedSegments.length > 0 && (
        <div className="border-t border-border p-3">
          <label htmlFor="summary-context" className="app-eyebrow mb-2 block">Summary context</label>
          <textarea
            id="summary-context"
            placeholder="Add context for AI summary. For example people involved, meeting overview, objective etc..."
            className="min-h-[6rem] w-full resize-y rounded-[3px] border border-input bg-card px-3 py-2.5 text-sm leading-5 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/25"
            value={customPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
          />
        </div>
      )}
    </aside>
  );
}
