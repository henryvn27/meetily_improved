import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('persistent workspace shell uses the Meetily glyph and native type systems', async () => {
  const [css, tailwind, sidebar, themeControl, settings, appState, glyphs] = await Promise.all([
    readFile(new URL('src/app/globals.css', root), 'utf8'),
    readFile(new URL('tailwind.config.ts', root), 'utf8'),
    readFile(new URL('src/components/Sidebar/index.tsx', root), 'utf8'),
    readFile(new URL('src/components/app-shell/ThemeControl.tsx', root), 'utf8'),
    readFile(new URL('src/app/settings/page.tsx', root), 'utf8'),
    readFile(new URL('src/components/app-shell/AppState.tsx', root), 'utf8'),
    readFile(new URL('src/components/app-shell/MeetilyGlyph.tsx', root), 'utf8'),
  ]);

  assert.doesNotMatch(css, /Instrument Sans/);
  assert.match(css, /font-family: -apple-system, BlinkMacSystemFont/);
  assert.match(tailwind, /hsl\(var\(--primary\) \/ <alpha-value>\)/);
  assert.match(tailwind, /hsl\(var\(--accent\) \/ <alpha-value>\)/);
  assert.doesNotMatch(tailwind, /221, 83%, 53%/);
  assert.match(sidebar, /MeetilyGlyph/);
  assert.doesNotMatch(sidebar, /@heroicons\/react/);
  assert.match(sidebar, /bg-\[hsl\(var\(--accent-soft\)\)\] text-\[hsl\(var\(--sidebar-foreground\)\)\]/);
  assert.match(sidebar, /isActive\(item\.href\) && 'text-accent'/);
  assert.match(themeControl, /MeetilyGlyph/);
  assert.doesNotMatch(themeControl, /from 'lucide-react'/);
  assert.match(themeControl, /bg-secondary text-foreground/);
  assert.match(settings, /MeetilyGlyph/);
  assert.doesNotMatch(settings, /from 'lucide-react'/);
  assert.match(appState, /MeetilyGlyph/);
  assert.doesNotMatch(appState, /from 'lucide-react'/);
  assert.match(appState, /role=\{kind === 'error' \? 'alert' : 'status'\}/);
  assert.match(appState, /aria-live=\{kind === 'loading' \? 'polite' : undefined\}/);

  for (const glyph of ['home', 'capture', 'library', 'recall', 'search', 'settings', 'beta', 'alert', 'lock', 'model', 'mic-off', 'pencil', 'trash', 'unavailable', 'theme-system', 'theme-light', 'theme-dark']) {
    assert.match(glyphs, new RegExp(`'${glyph}'`));
  }
  assert.match(glyphs, /strokeWidth: 1\.45/);
  assert.match(glyphs, /aria-hidden="true"/);
});
