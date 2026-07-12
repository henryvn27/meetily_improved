import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('recording command treats omitted selected devices as system defaults', async () => {
  const [commands, hook, deviceSelection] = await Promise.all([
    readFile(new URL('src-tauri/src/audio/recording_commands.rs', root), 'utf8'),
    readFile(new URL('src/hooks/useRecordingStart.ts', root), 'utf8'),
    readFile(new URL('src/components/DeviceSelection.tsx', root), 'utf8'),
  ]);

  assert.match(deviceSelection, /deviceName === 'default' \? null : deviceName/);
  assert.match(hook, /selectedDevices\?\.micDevice \|\| null/);
  const customCommand = commands.slice(
    commands.indexOf('pub async fn start_recording_with_devices_and_meeting'),
    commands.indexOf('/// Stop recording with optimized graceful shutdown', commands.indexOf('pub async fn start_recording_with_devices_and_meeting')),
  );

  assert.match(customCommand, /No microphone name provided to custom recording command, using system default/);
  assert.match(customCommand, /default_input_device\(\)/);
  assert.match(customCommand, /No system audio name provided to custom recording command, using system default/);
  assert.match(customCommand, /default_output_device\(\)/);
  assert.doesNotMatch(customCommand, /let mic_device = if let Some\(ref name\) = mic_device_name \{[\s\S]*?\} else \{\s*None\s*\}/);
});
