import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const modulePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'lib',
  'meeting-history.ts',
);
const source = fs.readFileSync(modulePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module });

const {
  createMeetingRow,
  deriveMeetingHistoryViewState,
  filterMeetingRows,
  sortMeetingRows,
} = module.exports;

const alpha = createMeetingRow(
  { id: 'alpha', title: 'Fallback title' },
  {
    id: 'alpha',
    title: 'Customer discovery',
    created_at: '2026-07-08T10:00:00Z',
    updated_at: '2026-07-09T10:00:00Z',
    folder_path: '/private/path-that-must-not-propagate',
  },
);
const beta = createMeetingRow(
  { id: 'beta', title: 'Weekly planning' },
  {
    id: 'beta',
    title: 'Weekly planning',
    created_at: '2026-07-10T10:00:00Z',
    updated_at: '2026-07-10T10:00:00Z',
  },
);
const missingMetadata = createMeetingRow({ id: 'gamma', title: 'Founder notes' }, null);

assert.equal(alpha.title, 'Customer discovery');
assert.equal('folder_path' in alpha, false);
assert.equal(missingMetadata.metadataAvailable, false);
assert.equal(missingMetadata.title, 'Founder notes');

assert.deepEqual(
  sortMeetingRows([alpha, missingMetadata, beta], 'newest').map((row) => row.id),
  ['beta', 'alpha', 'gamma'],
);
assert.deepEqual(
  sortMeetingRows([alpha, missingMetadata, beta], 'oldest').map((row) => row.id),
  ['alpha', 'beta', 'gamma'],
);

assert.deepEqual(
  filterMeetingRows([alpha, beta], 'customer', []).map((row) => row.id),
  ['alpha'],
);
const transcriptResults = filterMeetingRows([alpha, beta], 'budget', [
  {
    id: 'beta',
    title: 'Weekly planning',
    matchContext: 'We should revisit the launch budget next week.',
    timestamp: '12:04:11',
  },
  {
    id: 'beta',
    title: 'Weekly planning',
    matchContext: 'Duplicate meeting hit',
    timestamp: '12:05:12',
  },
]);
assert.deepEqual(transcriptResults.map((row) => row.id), ['beta']);
assert.equal(transcriptResults[0].matchContext, 'We should revisit the launch budget next week.');

const baseViewState = {
  isLoading: false,
  hasLoadError: false,
  totalRows: 1,
  visibleRows: 1,
  isSearching: false,
};
assert.equal(deriveMeetingHistoryViewState({ ...baseViewState, isLoading: true }), 'loading');
assert.equal(deriveMeetingHistoryViewState({ ...baseViewState, hasLoadError: true }), 'error');
assert.equal(deriveMeetingHistoryViewState({ ...baseViewState, totalRows: 0, visibleRows: 0 }), 'empty');
assert.equal(deriveMeetingHistoryViewState({ ...baseViewState, visibleRows: 0, isSearching: true }), 'searching');
assert.equal(deriveMeetingHistoryViewState({ ...baseViewState, visibleRows: 0 }), 'no-results');
assert.equal(deriveMeetingHistoryViewState(baseViewState), 'list');

console.log('meeting-history tests passed');
