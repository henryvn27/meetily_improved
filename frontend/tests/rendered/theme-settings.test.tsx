import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppearanceSettings } from '@/components/AppearanceSettings';
import { ThemeProvider } from '@/contexts/ThemeContext';

describe('appearance settings', () => {
  let prefersDark = false;
  let listeners: Set<() => void>;

  beforeEach(() => {
    prefersDark = false;
    listeners = new Set();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        get matches() { return prefersDark; },
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('persists explicit themes and follows a changing system appearance', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><AppearanceSettings /></ThemeProvider>);

    expect(screen.getByRole('radio', { name: /System/ })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: /Dark/ }));

    expect(window.localStorage.getItem('meetily-theme-preference')).toBe('dark');
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    await user.click(screen.getByRole('radio', { name: /Light/ }));
    await waitFor(() => expect(document.documentElement).not.toHaveClass('dark'));
    expect(window.localStorage.getItem('meetily-theme-preference')).toBe('light');

    await user.click(screen.getByRole('radio', { name: /System/ }));
    prefersDark = true;
    listeners.forEach((listener) => listener());
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
  });
});
