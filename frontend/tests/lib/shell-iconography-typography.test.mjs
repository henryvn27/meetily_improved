import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('persistent workspace shell uses the Meetily glyph and native type systems', async () => {
  const [css, tailwind, sidebar, themeControl, settings, glyphs] = await Promise.all([
    readFile(new URL('src/app/globals.css', root), 'utf8'),
    readFile(new URL('tailwind.config.js', root), 'utf8'),
    readFile(new URL('src/components/Sidebar/index.tsx', root), 'utf8'),
    readFile(new URL('src/components/app-shell/ThemeControl.tsx', root), 'utf8'),
    readFile(new URL('src/app/settings/page.tsx', root), 'utf8'),
    readFile(new URL('src/components/app-shell/MeetilyGlyph.tsx', root), 'utf8'),
  ]);

  assert.doesNotMatch(css, /Instrument Sans/);
  assert.match(css, /font-family: -apple-system, BlinkMacSystemFont/);
  assert.match(tailwind, /'SF Pro Text'/);
  assert.match(tailwind, /'SFMono-Regular'/);
  assert.match(sidebar, /MeetilyGlyph/);
  assert.doesNotMatch(sidebar, /@heroicons\/react/);
  assert.match(sidebar, /bg-\[hsl\(var\(--sidebar-hover\)\)\] text-\[hsl\(var\(--sidebar-foreground\)\)\]/);
  assert.match(sidebar, /isActive\(item\.href\) && 'text-accent'/);
  assert.match(themeControl, /MeetilyGlyph/);
  assert.doesNotMatch(themeControl, /from 'lucide-react'/);
  assert.match(themeControl, /bg-secondary text-foreground/);
  assert.match(settings, /MeetilyGlyph/);
  assert.doesNotMatch(settings, /from 'lucide-react'/);

  for (const glyph of ['home', 'capture', 'library', 'recall', 'search', 'settings', 'beta', 'theme-system', 'theme-light', 'theme-dark']) {
    assert.match(glyphs, new RegExp(`'${glyph}'`));
  }
  assert.match(glyphs, /strokeWidth: 1\.45/);
  assert.match(glyphs, /aria-hidden="true"/);
});
