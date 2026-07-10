export interface NativeImportProgress {
  stage: string;
  progress_percentage: number;
  message: string;
}

const stageLabels: Record<string, string> = {
  copying: 'Preparing local copy',
  decoding: 'Reading audio',
  resampling: 'Preparing audio',
  vad: 'Finding speech',
  transcribing: 'Transcribing locally',
  saving: 'Saving meeting',
  complete: 'Import complete',
};

export function formatImportDuration(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatImportFileSize(bytes: number): string {
  const safeBytes = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (safeBytes < 1024) return `${safeBytes} B`;
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(1)} KB`;
  if (safeBytes < 1024 * 1024 * 1024) return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(safeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getImportProgressPresentation(progress: NativeImportProgress) {
  return {
    label: stageLabels[progress.stage] || progress.stage,
    percentage: Math.min(100, Math.max(0, Math.round(progress.progress_percentage))),
    message: progress.message,
  };
}
