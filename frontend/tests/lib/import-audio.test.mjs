import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../../src/lib/import-audio.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module });

const {
  formatImportDuration,
  formatImportFileSize,
  getImportProgressPresentation,
} = module.exports;

assert.equal(formatImportDuration(65.9), '1:05');
assert.equal(formatImportDuration(3661), '1:01:01');
assert.equal(formatImportDuration(-1), '0:00');
assert.equal(formatImportFileSize(1024), '1.0 KB');
assert.equal(formatImportFileSize(5 * 1024 * 1024), '5.0 MB');
assert.equal(formatImportFileSize(-1), '0 B');

assert.equal(
  JSON.stringify(getImportProgressPresentation({
    stage: 'transcribing',
    progress_percentage: 62.4,
    message: 'Transcribing segment 3 of 8...',
  })),
  JSON.stringify({
    label: 'Transcribing locally',
    percentage: 62,
    message: 'Transcribing segment 3 of 8...',
  }),
);
assert.equal(
  getImportProgressPresentation({ stage: 'future-stage', progress_percentage: 130, message: 'Working' }).percentage,
  100,
);

console.log('import-audio tests passed');
