import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('sidebar reserves signal orange for active recording state', async () => {
  const sidebar = await readFile(new URL('src/components/Sidebar/index.tsx', root), 'utf8');

  assert.match(sidebar, /isRecording\s*\? 'bg-accent text-accent-foreground'/);
  assert.match(sidebar, /'bg-primary text-primary-foreground hover:bg-primary\/88'/);
  assert.match(sidebar, /isPostProcessing\s*\? 'bg-\[hsl\(var\(--sidebar-hover\)\)\]/);
  assert.match(sidebar, /isRecording \? 'Recording active' : 'Start recording'/);
  assert.match(sidebar, /aria-label=\{isPostProcessing \? 'Finishing meeting' : isRecording \? 'Recording active' : 'Open recorder'\}/);
  assert.doesNotMatch(sidebar, /isRecording \? <MeetilyGlyph name="stop"/);
});

test('native QA can start deterministically in either theme without changing release persistence', async () => {
  const [qaMode, themeContext, layout] = await Promise.all([
    readFile(new URL('src/lib/native-qa-mode.ts', root), 'utf8'),
    readFile(new URL('src/contexts/ThemeContext.tsx', root), 'utf8'),
    readFile(new URL('src/app/layout.tsx', root), 'utf8'),
  ]);

  assert.match(qaMode, /NEXT_PUBLIC_MEETILY_NATIVE_QA_THEME/);
  assert.match(qaMode, /configuredTheme === 'light' \|\| configuredTheme === 'dark'/);
  assert.match(qaMode, /isNativeQaMode/);
  assert.match(themeContext, /nativeQaTheme \?\? 'system'/);
  assert.match(themeContext, /if \(nativeQaTheme\) return/);
  assert.match(themeContext, /useLayoutEffect\(\(\) => \{/);
  assert.match(themeContext, /meetily-theme-preference/);
  assert.match(qaMode, /NEXT_PUBLIC_MEETILY_NATIVE_QA_ROUTE/);
  assert.match(qaMode, /configuredRoute === 'settings' \? '\/settings' : null/);
  assert.match(layout, /window\.location\.assign\(nativeQaRoute\)/);
});
