'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { nativeQaTheme } from '@/lib/native-qa-mode';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = 'meetily-theme-preference';

function resolveTheme(preference: ThemePreference) {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(nativeQaTheme ?? 'system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(nativeQaTheme ?? 'light');

  useEffect(() => {
    if (nativeQaTheme) return;
    const stored = window.localStorage.getItem(storageKey);
    const nextPreference: ThemePreference = stored === 'light' || stored === 'dark' ? stored : 'system';
    setPreference(nextPreference);
  }, []);

  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const theme = resolveTheme(preference);
      const root = document.documentElement;
      const isInitialTheme = !root.dataset.theme;

      setResolvedTheme(theme);
      root.classList.toggle('dark', theme === 'dark');
      root.style.colorScheme = theme;

      if (isInitialTheme) {
        // Commit the theme tokens while transition utilities are disabled by
        // html:not([data-theme]), then enable transitions synchronously. A
        // frame callback can be deferred indefinitely in an unfocused WKWebView.
        void root.offsetWidth;
      }
      root.dataset.theme = theme;
    };

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  const updatePreference = (nextPreference: ThemePreference) => {
    window.localStorage.setItem(storageKey, nextPreference);
    setPreference(nextPreference);
  };

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference: updatePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
