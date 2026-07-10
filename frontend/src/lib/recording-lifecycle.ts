export type RecordingLifecyclePhase = 'stopping' | 'processing';

export interface NativeRecordingShutdownProgress {
  stage: string;
  message: string;
  progress: number;
  detailed?: boolean;
  elapsed_seconds?: number;
}

export interface RecordingShutdownUpdate {
  phase: RecordingLifecyclePhase;
  message: string;
  nativeProgress: NativeRecordingShutdownProgress;
}

const PROCESSING_STAGES = new Set([
  'processing_transcripts',
  'unloading_model',
]);

const FALLBACK_MESSAGES: Record<string, string> = {
  stopping_audio: 'Stopping audio capture...',
  processing_transcripts: 'Processing remaining transcript chunks...',
  unloading_model: 'Releasing the transcription model...',
  finalizing: 'Finalizing the recording...',
  complete: 'Recording stopped successfully',
};

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, progress));
}

export function getRecordingShutdownUpdate(
  payload: NativeRecordingShutdownProgress,
): RecordingShutdownUpdate {
  const stage = payload.stage?.trim() || 'unknown';
  const message = payload.message?.trim() || FALLBACK_MESSAGES[stage] || 'Finishing the recording...';

  return {
    phase: PROCESSING_STAGES.has(stage) ? 'processing' : 'stopping',
    message,
    nativeProgress: {
      ...payload,
      stage,
      message,
      progress: normalizeProgress(payload.progress),
    },
  };
}

export function getRecordingErrorMessage(payload: unknown): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const candidate = payload as { userMessage?: unknown; message?: unknown; error?: unknown };
    for (const value of [candidate.userMessage, candidate.message, candidate.error]) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return 'Recording stopped because of an unexpected audio error.';
}
