import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = [
  '../../src/components/ChunkProgressDisplay.tsx',
  '../../src/components/ComplianceNotification.tsx',
  '../../src/components/recording/ActiveRecordingWorkspace.tsx',
];

const sources = await Promise.all(files.map(async (file) => readFile(fileURLToPath(new URL(file, import.meta.url)), 'utf8')));
const source = sources.join('\n');

assert.match(source, /hsl\(var\(--warning\)\)/, 'uses the semantic warning token');
assert.match(source, /hsl\(var\(--success\)\)/, 'uses the semantic success token');
assert.match(source, /Paused/, 'preserves paused status wording');
assert.match(source, /Speech detected/, 'preserves speech-detected status wording');
assert.match(source, /US compliance required/, 'preserves the compliance requirement');
assert.doesNotMatch(source, /(?:amber|emerald)-(?:50|200|300|400|500|700|800)/, 'removes fixed amber and emerald utility colors from active chips');

console.log('recording lifecycle status visual-system source checks passed');
