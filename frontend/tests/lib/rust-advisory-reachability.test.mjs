import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);
const rustSourceRoot = new URL('frontend/src-tauri/src/', root);

const [cargoLockText, denyText, policyText] = await Promise.all([
  readFile(new URL('Cargo.lock', root), 'utf8'),
  readFile(new URL('deny.toml', root), 'utf8'),
  readFile(new URL('docs/GLIB_VARIANT_STR_ADVISORY.md', root), 'utf8'),
]);

function packageSection(name, version) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cargoLockText.match(
    new RegExp(
      `\\[\\[package\\]\\]\\nname = "${escapedName}"\\nversion = "${escapedVersion}"[\\s\\S]*?(?=\\n\\[\\[package\\]\\]|$)`,
    ),
  );

  assert.ok(match, `expected locked package ${name} ${version}`);
  return match[0];
}

async function rustSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) return rustSourceFiles(url);
      return entry.isFile() && entry.name.endsWith('.rs') ? [url] : [];
    }),
  );

  return nested.flat();
}

test('GHSA-wrw7-89jp-8q8g stays constrained to the reviewed Linux GTK graph', () => {
  const glib = packageSection('glib', '0.18.5');
  const gtk = packageSection('gtk', '0.18.2');
  const webkit = packageSection('webkit2gtk', '2.0.2');
  const wry = packageSection('wry', '0.55.1');
  const tauriRuntimeWry = packageSection('tauri-runtime-wry', '2.11.1');
  const tauri = packageSection('tauri', '2.11.1');

  assert.match(glib, /checksum = "233daaf6e83ae6a12a52055f568f9d7cf4671dabb78ff9560ab6da230ce00ee5"/);
  assert.match(gtk, /"glib 0\.18\.5"/);
  assert.match(webkit, /"glib 0\.18\.5"/);
  assert.match(wry, /"gtk"/);
  assert.match(wry, /"webkit2gtk"/);
  assert.match(tauriRuntimeWry, /"gtk"/);
  assert.match(tauriRuntimeWry, /"webkit2gtk"/);
  assert.match(tauriRuntimeWry, /"wry"/);
  assert.match(tauri, /"gtk"/);
  assert.match(tauri, /"tauri-runtime-wry"/);
  assert.match(tauri, /"webkit2gtk"/);

  const vulnerableGlibVersions = [...cargoLockText.matchAll(
    /\[\[package\]\]\nname = "glib"\nversion = "(\d+)\.(\d+)\.(\d+)"/g,
  )]
    .map(([, major, minor, patch]) => ({ major: Number(major), minor: Number(minor), patch: Number(patch) }))
    .filter(({ major, minor }) => major === 0 && minor >= 15 && minor < 20)
    .map(({ major, minor, patch }) => `${major}.${minor}.${patch}`);

  assert.deepEqual(vulnerableGlibVersions, ['0.18.5']);
});

test('the unused-api classification fails closed without advisory ignores', async () => {
  assert.match(denyText, /\[advisories\]\nignore = \[\]/);
  assert.doesNotMatch(denyText, /GHSA-wrw7-89jp-8q8g|RUSTSEC-2024-0429/);

  const forbiddenApi = /\b(?:VariantStrIter|variant_str_iter|array_iter_str)\b/;
  const sourceFiles = await rustSourceFiles(rustSourceRoot);
  assert.ok(
    sourceFiles.some((sourceFile) => sourceFile.pathname.endsWith('/frontend/src-tauri/src/lib.rs')),
    'expected the Tauri Rust source root',
  );

  for (const sourceFile of sourceFiles) {
    const source = await readFile(sourceFile, 'utf8');
    assert.doesNotMatch(source, forbiddenApi, `${sourceFile.pathname} must not call the affected glib API`);
  }
});

test('the reachability decision and re-review triggers remain documented', () => {
  assert.match(policyText, /GHSA-wrw7-89jp-8q8g/);
  assert.match(policyText, /RUSTSEC-2024-0429/);
  assert.match(policyText, /Dismissal reason: `not_used`/);
  assert.match(policyText, /first patched release is `glib 0\.20\.0`/);
  assert.match(policyText, /Do not add this advisory to `deny\.toml`/);
  assert.match(policyText, /Re-open and re-evaluate/);
});
