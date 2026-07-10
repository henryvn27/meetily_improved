import React from 'react';
import { FileAudio2, ShieldCheck } from 'lucide-react';
import { getAudioFormatsDisplayList } from '@/constants/audioFormats';

interface ImportDropOverlayProps {
  visible: boolean;
}

export function ImportDropOverlay({ visible }: ImportDropOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm transition-opacity duration-200"
    >
      <div className="w-full max-w-xl rounded-2xl border-2 border-dashed border-foreground/25 bg-card px-8 py-12 text-center shadow-xl">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-foreground">
          <FileAudio2 className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xl font-semibold tracking-[-0.02em] text-foreground">Drop one recording to import</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Meetily will validate the file before any local transcription begins.</p>
        <p className="mt-4 text-xs text-muted-foreground">{getAudioFormatsDisplayList()}</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground"><ShieldCheck className="size-4" aria-hidden="true" />Processed on this device</div>
      </div>
    </div>
  );
}
