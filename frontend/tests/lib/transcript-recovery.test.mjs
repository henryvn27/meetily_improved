import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../../src/lib/transcript-recovery.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module });
const { formatRecoveryTimestamp, getAudioRecoveryDescription } = module.exports;

assert.match(getAudioRecoveryDescription('success'), /audio checkpoints were recovered/);
assert.match(getAudioRecoveryDescription('partial'), /Only part/);
assert.match(getAudioRecoveryDescription('failed'), /could not be restored/);
assert.match(getAudioRecoveryDescription('none'), /No audio checkpoints/);
assert.equal(formatRecoveryTimestamp('invalid', 65.9), '01:05');
assert.equal(formatRecoveryTimestamp(undefined, undefined), '--:--');

console.log('transcript-recovery tests passed');
