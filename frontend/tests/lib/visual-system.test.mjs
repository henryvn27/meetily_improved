import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('global shell uses the documented signal-orange visual system', async () => {
  const [css, sidebar, product, designMarkdown, designJson] = await Promise.all([
    readFile(new URL('src/app/globals.css', root), 'utf8'),
    readFile(new URL('src/components/Sidebar/index.tsx', root), 'utf8'),
    readFile(new URL('../PRODUCT.md', root), 'utf8'),
    readFile(new URL('../DESIGN.md', root), 'utf8'),
    readFile(new URL('../DESIGN.json', root), 'utf8'),
  ]);

  assert.match(css, /--accent: 19 87% 55%/);
  assert.match(css, /--sidebar: 240 4% 10%/);
  assert.doesNotMatch(css, /--background: 42 26% 96%/);
  assert.match(sidebar, /bg-\[hsl\(var\(--sidebar\)\)\]/);
  assert.match(sidebar, /bg-accent/);
  assert.match(sidebar, /text-accent-foreground/);

  const combinedDocs = `${product}\n${designMarkdown}\n${designJson}`;
  assert.match(combinedDocs, /Signal Orange/);
  assert.doesNotMatch(combinedDocs, /Electric Rose|#E92C78/i);
});
