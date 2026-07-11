import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = (file) => fileURLToPath(new URL(file, import.meta.url));
const [tauriConfig, cargoManifest, frontendPackage, releaseWorkflow, updateManifest] = await Promise.all([
  readFile(root('../../src-tauri/tauri.conf.json'), 'utf8'),
  readFile(root('../../src-tauri/Cargo.toml'), 'utf8'),
  readFile(root('../../package.json'), 'utf8'),
  readFile(root('../../../.github/workflows/release.yml'), 'utf8'),
  readFile(root('../../../scripts/generate-update-manifest-github.js'), 'utf8'),
]);

for (const source of [tauriConfig, cargoManifest, frontendPackage]) {
  assert.match(source, /0\.5\.0/, 'ships a consistent public release version');
}

assert.match(tauriConfig, /"productName": "Meetily Improved"/, 'keeps the macOS-visible product name');
assert.match(tauriConfig, /"identifier": "com\.meetily\.ai"/, 'preserves the stable storage and permission identifier');
assert.match(tauriConfig, /henryvn27\/meetily_improved\/releases\/latest\/download\/latest\.json/, 'uses the fork-owned updater endpoint');
assert.match(cargoManifest, /repository = "https:\/\/github\.com\/henryvn27\/meetily_improved"/, 'publishes fork-owned Cargo metadata');
assert.match(releaseWorkflow, /Meetily Improved v/, 'names GitHub releases for the public app');
assert.match(releaseWorkflow, /asset-prefix: "meetily-improved"/, 'names release assets for the public app');
assert.match(updateManifest, /henryvn27\/meetily_improved/, 'generates fork-owned update manifest links');
assert.doesNotMatch(`${tauriConfig}\n${cargoManifest}\n${releaseWorkflow}\n${updateManifest}`, /Zackriya-Solutions\/meeting-minutes/, 'removes upstream release endpoints from active distribution metadata');

console.log('release identity source checks passed');
