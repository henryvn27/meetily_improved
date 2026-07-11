'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemePreference, useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const themes: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'system', label: 'System theme', icon: Monitor },
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
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
            preference === value && 'bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground',
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
