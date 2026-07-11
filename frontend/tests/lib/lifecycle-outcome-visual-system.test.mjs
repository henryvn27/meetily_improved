import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = [
  '../../src/components/DatabaseImport/HomebrewDatabaseDetector.tsx',
  '../../src/components/DatabaseImport/LegacyDatabaseImport.tsx',
  '../../src/components/ImportAudio/ImportAudioDialog.tsx',
  '../../src/components/ModelDownloadProgress.tsx',
  '../../src/components/recording/PreRecordingWorkspace.tsx',
  '../../src/components/recording/PostRecordingWorkspace.tsx',
];
const source = (await Promise.all(files.map(async (file) => readFile(fileURLToPath(new URL(file, import.meta.url)), 'utf8')))).join('\n');

assert.match(source, /hsl\(var\(--success\)\)/, 'uses the shared semantic success token');
assert.match(source, /Database found!/, 'preserves database import outcome copy');
assert.match(source, /Meeting imported/, 'preserves audio-import outcome copy');
assert.match(source, /Download completed, loading model/, 'preserves model download completion copy');
assert.match(source, /statusMeta\[item\.state\]\.label/, 'preserves recording readiness labels');
assert.doesNotMatch(source, /emerald-(?:50|200|400|500|600|700|900)/, 'removes fixed emerald colors from active outcome surfaces');

console.log('lifecycle outcome visual-system source checks passed');
