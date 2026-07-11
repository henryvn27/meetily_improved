'use client';

import { ThemePreference, useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { MeetilyGlyph, MeetilyGlyphName } from './MeetilyGlyph';

const themes: Array<{ value: ThemePreference; label: string; icon: MeetilyGlyphName }> = [
  { value: 'system', label: 'System theme', icon: 'theme-system' },
  { value: 'light', label: 'Light theme', icon: 'theme-light' },
  { value: 'dark', label: 'Dark theme', icon: 'theme-dark' },
];

export function ThemeControl() {
  const { preference, setPreference } = useTheme();

  return (
    <div aria-label="Appearance" className="no-drag inline-flex items-center border border-border bg-card p-0.5">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={preference === value}
          onClick={() => setPreference(value)}
          className={cn(
            'grid size-7 place-items-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
            preference === value && 'bg-secondary text-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          <MeetilyGlyph name={Icon} className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
