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
  'recording-lifecycle.ts',
);
const source = fs.readFileSync(modulePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module });

const {
  formatRecordingDuration,
  getPostRecordingPresentation,
  getRecordingErrorMessage,
  getRecordingShutdownUpdate,
} = module.exports;

assert.equal(
  JSON.stringify(getRecordingShutdownUpdate({
    stage: 'stopping_audio',
    message: 'Stopping audio capture...',
    progress: 20,
  })),
  JSON.stringify({
    phase: 'stopping',
    message: 'Stopping audio capture...',
    nativeProgress: {
      stage: 'stopping_audio',
      message: 'Stopping audio capture...',
      progress: 20,
    },
  }),
);

assert.equal(
  getRecordingShutdownUpdate({
    stage: 'processing_transcripts',
    message: 'Processing 3 chunks',
    progress: 40,
  }).phase,
  'processing',
);
assert.equal(
  getRecordingShutdownUpdate({
    stage: 'unloading_model',
    message: '',
    progress: 170,
  }).nativeProgress.progress,
  100,
);

const unknown = getRecordingShutdownUpdate({
  stage: 'future_stage',
  message: 'Backend-provided detail',
  progress: -5,
});
assert.equal(unknown.phase, 'stopping');
assert.equal(unknown.message, 'Backend-provided detail');
assert.equal(unknown.nativeProgress.progress, 0);

assert.equal(getRecordingErrorMessage(' Microphone disconnected '), 'Microphone disconnected');
assert.equal(getRecordingErrorMessage({ userMessage: 'Audio device failed' }), 'Audio device failed');
assert.equal(
  getRecordingErrorMessage(null),
  'Recording stopped because of an unexpected audio error.',
);

assert.equal(formatRecordingDuration(null), '--:--');
assert.equal(formatRecordingDuration(0), '00:00');
assert.equal(formatRecordingDuration(65.9), '01:05');
assert.equal(formatRecordingDuration(3661), '1:01:01');
assert.equal(formatRecordingDuration(-1), '--:--');

assert.equal(
  JSON.stringify(getPostRecordingPresentation('stopping', 'Stopping audio...', {
    stage: 'stopping_audio',
    message: 'Stopping audio...',
    progress: 20,
  })),
  JSON.stringify({
    eyebrow: 'Audio capture ended',
    title: 'Securing the recording',
    description: 'Stopping audio...',
    nativeProgress: 20,
    steps: ['complete', 'pending', 'pending'],
  }),
);

assert.equal(
  getPostRecordingPresentation('processing', 'Processing 2 remaining chunks...').nativeProgress,
  null,
);
assert.equal(getPostRecordingPresentation('saving', undefined, {
  stage: 'complete',
  message: 'Complete',
  progress: 100,
}).nativeProgress, null);
assert.equal(
  JSON.stringify(getPostRecordingPresentation('completed').steps),
  JSON.stringify(['complete', 'complete', 'complete']),
);
assert.equal(getPostRecordingPresentation('error', 'Disk full').description, 'Disk full');

console.log('recording-lifecycle tests passed');
