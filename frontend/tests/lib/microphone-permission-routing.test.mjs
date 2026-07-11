import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hookPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'hooks',
  'useRecordingStart.ts',
);
const source = fs.readFileSync(hookPath, 'utf8');

assert.match(source, /const ensureMicrophonePermission = useCallback/);
assert.match(source, /const ensureAudioDeviceReady = useCallback/);
assert.equal((source.match(/await ensureMicrophonePermission\(\)/g) || []).length, 3);
assert.equal((source.match(/await ensureAudioDeviceReady\(\)/g) || []).length, 3);

for (const entryPoint of [
  'const handleRecordingStart = useCallback',
  'const checkAutoStartRecording = async',
  'const handleDirectStart = async',
]) {
  const start = source.indexOf(entryPoint);
  const permission = source.indexOf('await ensureMicrophonePermission()', start);
  const deviceReady = source.indexOf('await ensureAudioDeviceReady()', permission);
  const recording = source.indexOf('recordingService.startRecordingWithDevices', start);

  assert.notEqual(start, -1, `${entryPoint} is present`);
  assert.ok(permission > start, `${entryPoint} checks microphone permission`);
  assert.ok(deviceReady > permission, `${entryPoint} checks audio-device readiness after permission`);
  assert.ok(recording > deviceReady, `${entryPoint} checks audio-device readiness before native recording`);
  assert.ok(recording > permission, `${entryPoint} requests permission before native recording`);
}

console.log('microphone-permission-routing tests passed');
