import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('settings has reliable native navigation and appearance controls', async () => {
  const [layout, sidebar, settings, appearance] = await Promise.all([
    readFile(new URL('src/app/layout.tsx', root), 'utf8'),
    readFile(new URL('src/components/Sidebar/index.tsx', root), 'utf8'),
    readFile(new URL('src/app/settings/page.tsx', root), 'utf8'),
    readFile(new URL('src/components/AppearanceSettings.tsx', root), 'utf8'),
  ]);

  assert.match(layout, /event\.metaKey && event\.key === ','/);
  assert.match(layout, /event\.preventDefault\(\)/);
  assert.match(layout, /window\.openSettings\?\.\(\)/);
  assert.match(sidebar, /router\.push\('\/settings'\)/);
  assert.doesNotMatch(sidebar, /window\.location\.assign\('\/settings'\)/);
  assert.match(sidebar, /onClick=\{openSettings\}/);
  assert.match(settings, /<AppearanceSettings \/>/);
  for (const preference of ['system', 'light', 'dark']) {
    assert.match(appearance, new RegExp(`value: '${preference}'`));
  }
  assert.match(appearance, /role="radiogroup"/);
  assert.match(appearance, /aria-checked=\{selected\}/);
  assert.match(appearance, /setPreference\(option\.value\)/);
});
