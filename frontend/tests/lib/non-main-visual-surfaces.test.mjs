import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = [
  '../../src/components/AISummary/index.tsx',
  '../../src/components/LanguageSelection.tsx',
  '../../src/components/TranscriptSettings.tsx',
  '../../src/components/ImportAudio/ImportDropOverlay.tsx',
];

const sources = await Promise.all(files.map((file) => readFile(fileURLToPath(new URL(file, import.meta.url)), 'utf8')));
const source = sources.join('\n').replace(/\/\*[\s\S]*?\*\//g, '');

assert.match(source, /from 'lucide-react'/, 'uses the shared icon library on utility surfaces');
assert.match(source, /ClipboardDocumentCheckIcon/, 'uses semantic copy iconography in the summary context menu');
assert.match(source, /TrashIcon/, 'uses semantic delete iconography in the summary context menu');
assert.match(source, /focus-visible:ring-ring/, 'keeps keyboard focus visible in the summary context menu');
assert.match(source, /rounded-\[10px\]/, 'uses the approved independent-surface geometry for import');
assert.doesNotMatch(source, /📋|🗑️|⚡ Parakeet|🏠 Local Whisper|ℹ️ Parakeet|⚠️ Auto Detect|🌐 Translation|rounded-2xl|shadow-xl/, 'removes active legacy emoji and oversized utility-surface styling');

console.log('non-main visual-surface source checks passed');
