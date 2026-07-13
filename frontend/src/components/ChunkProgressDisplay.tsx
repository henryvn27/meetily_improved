import React from 'react';
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon, PauseIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';

export interface ChunkStatus {
  chunk_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  start_time?: number;
  end_time?: number;
  duration_ms?: number;
  text_preview?: string;
  error_message?: string;
}

export interface ProcessingProgress {
  total_chunks: number;
  completed_chunks: number;
  processing_chunks: number;
  failed_chunks: number;
  estimated_remaining_ms?: number;
  chunks: ChunkStatus[];
}

interface ChunkProgressDisplayProps {
  progress: ProcessingProgress;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  isPaused?: boolean;
  className?: string;
}

export function ChunkProgressDisplay({
  progress,
  onPause,
  onResume,
  onCancel,
  isPaused = false,
  className = ''
}: ChunkProgressDisplayProps) {
  const completionPercentage = progress.total_chunks > 0
    ? Math.round((progress.completed_chunks / progress.total_chunks) * 100)
    : 0;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimeRemaining = (ms?: number) => {
    if (!ms || ms <= 0) return 'Calculating...';
    return formatDuration(ms);
  };

  const getChunkStatusIcon = (status: ChunkStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="size-4" aria-hidden="true" />;
      case 'processing':
        return <ArrowPathIcon className="size-4 animate-spin" aria-hidden="true" />;
      case 'failed':
        return <ExclamationCircleIcon className="size-4" aria-hidden="true" />;
      case 'pending':
      default:
        return <ClockIcon className="size-4" aria-hidden="true" />;
    }
  };

  const getChunkStatusColor = (status: ChunkStatus['status']) => {
    switch (status) {
      case 'completed':
        return 'border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.10)] text-[hsl(var(--success))]';
      case 'processing':
        return 'border-accent/25 bg-accent/10 text-accent';
      case 'failed':
        return 'border-destructive/25 bg-destructive/10 text-destructive';
      case 'pending':
      default:
        return 'border-border bg-secondary/45 text-muted-foreground';
    }
  };

  return (
    <section aria-label="Transcription processing progress" className={`rounded-[10px] border border-border bg-card p-4 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-foreground">
            Processing Progress
          </h3>
          {isPaused && (
            <span className="border border-[hsl(var(--warning)/0.30)] bg-[hsl(var(--warning)/0.10)] px-2 py-1 text-xs font-medium text-[hsl(var(--warning))]">
              Paused
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isPaused ? (
            <button
              onClick={onPause}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
              disabled={progress.processing_chunks === 0 && progress.completed_chunks === progress.total_chunks}
            >
              <PauseIcon className="size-3.5" /> Pause
            </button>
          ) : (
            <button
              onClick={onResume}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/88"
            >
              <PlayIcon className="size-3.5" /> Resume
            </button>
          )}

          <button
            onClick={onCancel}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/30 bg-card px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <StopIcon className="size-3.5" /> Cancel
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {progress.completed_chunks} of {progress.total_chunks} chunks completed
          </span>
          <span className="text-sm font-medium text-foreground">
            {completionPercentage}%
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercentage}>
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Processing Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
        <div className="text-center">
          <div className="text-lg font-semibold text-[hsl(var(--success))]">
            {progress.completed_chunks}
          </div>
          <div className="text-muted-foreground">Completed</div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-accent">
            {progress.processing_chunks}
          </div>
          <div className="text-muted-foreground">Processing</div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-muted-foreground">
            {progress.total_chunks - progress.completed_chunks - progress.processing_chunks - progress.failed_chunks}
          </div>
          <div className="text-muted-foreground">Pending</div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-destructive">
            {progress.failed_chunks}
          </div>
          <div className="text-muted-foreground">Failed</div>
        </div>
      </div>

      {/* Time Estimate */}
      {progress.estimated_remaining_ms && progress.estimated_remaining_ms > 0 && (
        <div className="mb-4 border border-accent/25 bg-accent/10 p-3">
          <div className="flex items-center space-x-2">
            <ClockIcon className="size-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-foreground">
              Estimated time remaining: {formatTimeRemaining(progress.estimated_remaining_ms)}
            </span>
          </div>
        </div>
      )}

      {/* Recent Chunks Grid */}
      <div className="space-y-2">
        <h4 className="mb-2 text-sm font-medium text-foreground">
          Recent Chunks ({Math.min(progress.chunks.length, 10)} of {progress.total_chunks})
        </h4>

        <div className="max-h-48 overflow-y-auto space-y-1">
          {progress.chunks
            .slice(-10) // Show last 10 chunks
            .reverse() // Most recent first
            .map((chunk) => (
              <div
                key={chunk.chunk_id}
                className={`rounded-md border p-2 text-xs ${getChunkStatusColor(chunk.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{getChunkStatusIcon(chunk.status)}</span>
                    <span className="font-medium">
                      Chunk {chunk.chunk_id}
                    </span>
                    {chunk.duration_ms && (
                      <span className="text-muted-foreground">
                        ({formatDuration(chunk.duration_ms)})
                      </span>
                    )}
                  </div>

                  {chunk.status === 'processing' && (
                    <div className="flex items-center space-x-1">
                      <ArrowPathIcon className="size-3 animate-spin text-accent" aria-label="Processing" />
                    </div>
                  )}
                </div>

                {chunk.text_preview && (
                  <div className="mt-1 truncate text-xs text-foreground">
                    &quot;{chunk.text_preview}&quot;
                  </div>
                )}

                {chunk.error_message && (
                  <div className="mt-1 text-xs text-destructive">
                    Error: {chunk.error_message}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Processing Complete */}
      {progress.completed_chunks === progress.total_chunks && progress.total_chunks > 0 && (
        <div className="mt-4 border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.10)] p-3">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="size-4 text-[hsl(var(--success))]" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              Processing complete. All {progress.total_chunks} chunks have been transcribed.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

// Mini version for sidebar or compact display
export function ChunkProgressMini({ progress, className = '' }: { progress: ProcessingProgress; className?: string }) {
  const completionPercentage = progress.total_chunks > 0
    ? Math.round((progress.completed_chunks / progress.total_chunks) * 100)
    : 0;

  return (
    <div className={`border border-border bg-secondary/45 p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Processing
        </span>
        <span className="text-sm font-medium text-foreground">
          {completionPercentage}%
        </span>
      </div>

      <div className="mb-2 h-1.5 w-full bg-muted">
        <div
          className="h-1.5 bg-accent transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {progress.completed_chunks} / {progress.total_chunks} chunks
        {progress.processing_chunks > 0 && (
          <span className="ml-2 text-accent">
            ({progress.processing_chunks} processing)
          </span>
        )}
      </div>
    </div>
  );
}
