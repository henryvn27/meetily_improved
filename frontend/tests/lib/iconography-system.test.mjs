import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const sourceRoot = new URL('../../src/', import.meta.url);
const packageUrl = new URL('../../package.json', import.meta.url);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) return sourceFiles(url);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [url] : [];
  }));
  return nested.flat();
}

test('application source uses one approved icon family', async () => {
  const files = await sourceFiles(sourceRoot);
  const sources = await Promise.all(files.map(async (url) => ({
    path: url.pathname,
    source: await readFile(url, 'utf8'),
  })));
  const legacyImports = sources
    .filter(({ source }) => /from ['"]lucide-react['"]/.test(source))
    .map(({ path }) => path);

  assert.deepEqual(legacyImports, [], 'legacy Lucide imports must not return to reachable source');
  assert.ok(
    sources.some(({ source }) => source.includes('@heroicons/react/24/outline')),
    'the approved Heroicons outline family remains present',
  );
});

test('Lucide is not a direct application dependency', async () => {
  const packageJson = JSON.parse(await readFile(packageUrl, 'utf8'));
  assert.equal(packageJson.dependencies?.['lucide-react'], undefined);
  assert.equal(packageJson.devDependencies?.['lucide-react'], undefined);
});
