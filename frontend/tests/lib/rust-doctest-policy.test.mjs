import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);
const [ciText, fallbackText] = await Promise.all([
  readFile(new URL('.github/workflows/ci.yml', root), 'utf8'),
  readFile(new URL('frontend/src-tauri/src/audio/devices/fallback.rs', root), 'utf8'),
]);

test('Rust core CI compiles locked workspace doctests explicitly', () => {
  assert.match(
    ciText,
    /- name: Run Rust workspace doctests\n\s+run: cargo \+stable test --locked --workspace --doc --features metal/,
  );
});

test('macOS fallback docs compile without touching hardware and match runtime intent', () => {
  assert.match(fallbackText, /\`\`\`no_run/);
  assert.match(
    fallbackText,
    /use app_lib::audio::devices::fallback::get_safe_recording_devices_macos;/,
  );
  assert.match(fallbackText, /Keeps the active output device, including Bluetooth outputs/);
  assert.match(
    fallbackText,
    /ScreenCaptureKit captures the\n\/\/\/ active output's digital stream before Bluetooth encoding/,
  );
  assert.doesNotMatch(fallbackText, /Checks speaker: if Bluetooth.*override/);
  assert.doesNotMatch(fallbackText, /For EACH Bluetooth device detected/);
});
