export type AudioRecoveryKind = 'success' | 'partial' | 'failed' | 'none';

export function getAudioRecoveryDescription(status?: string | null): string {
  switch (status as AudioRecoveryKind) {
    case 'success': return 'Transcript and available audio checkpoints were recovered.';
    case 'partial': return 'Transcript recovered. Only part of the checkpoint audio was available.';
    case 'failed': return 'Transcript recovered, but the checkpoint audio could not be restored.';
    case 'none': return 'Transcript recovered. No audio checkpoints were available.';
    default: return 'The available local meeting data was recovered.';
  }
}

export function formatRecoveryTimestamp(timestamp?: string, audioStartTime?: number): string {
  if (timestamp) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (Number.isFinite(audioStartTime)) {
    const totalSeconds = Math.max(0, Math.floor(audioStartTime || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return '--:--';
}
