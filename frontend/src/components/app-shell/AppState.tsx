import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MeetilyGlyph, type MeetilyGlyphName } from './MeetilyGlyph';

type AppStateKind = 'loading' | 'empty' | 'error' | 'permission' | 'model' | 'recording' | 'disabled';

const stateIcons = {
  loading: 'theme-system',
  empty: 'library',
  error: 'alert',
  permission: 'lock',
  model: 'model',
  recording: 'mic-off',
  disabled: 'unavailable',
} as const satisfies Record<AppStateKind, MeetilyGlyphName>;

interface AppStateProps {
  kind: AppStateKind;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function AppState({ kind, title, description, action, compact = false, className }: AppStateProps) {
  const icon = stateIcons[kind];

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live={kind === 'loading' ? 'polite' : undefined}
      className={cn(
        'flex border border-border bg-card text-card-foreground',
        compact ? 'items-start gap-3 rounded-md p-4' : 'min-h-44 flex-col items-center justify-center rounded-[10px] px-6 py-9 text-center',
        className,
      )}
    >
      <span className={cn('grid shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground', compact ? 'size-9' : 'mb-4 size-10')}>
        <MeetilyGlyph name={icon} className={cn('size-5', kind === 'loading' && 'animate-spin')} />
      </span>
      <div className={cn(compact && 'min-w-0 flex-1')}>
        <h2 className={cn('font-semibold tracking-[-0.01em]', compact ? 'text-sm' : 'text-base')}>{title}</h2>
        <p className={cn('text-sm leading-6 text-muted-foreground', compact ? 'mt-0.5' : 'mt-1 max-w-md')}>{description}</p>
        {action && <div className={compact ? 'mt-3' : 'mt-5'}>{action}</div>}
      </div>
    </div>
  );
}
