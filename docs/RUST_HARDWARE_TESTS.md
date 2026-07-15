# Rust hardware test lane

The default Rust suite must report exactly three ignored tests. These tests are
excluded from hosted CI because they require real macOS audio hardware, explicit
user-granted permissions, active playback, or a real speech recording. They are
required on the native QA Mac before a public release.

## Prerequisites

- Build and test on a release-supported Mac using the release commit.
- Grant microphone and system-audio permissions manually. Automation must not
  change these permissions.
- Close other Meetily development builds so one process owns the audio devices.
- Use a consented, non-sensitive audio file containing clear human speech for
  the import test. Do not commit the recording or fake a meeting fixture.
- Set `CARGO_TARGET_DIR` to a location with enough free space for native Metal
  dependencies.

## Required commands

Run each command from the repository root.

```bash
CARGO_TARGET_DIR=target cargo test --locked -p meetily --features metal \
  audio::capture::core_audio::tests::test_core_audio_capture -- \
  --ignored --exact --nocapture --test-threads=1
```

This passes only after at least one second of system-audio samples is collected
within 15 seconds.

```bash
CARGO_TARGET_DIR=target cargo test --locked -p meetily --features metal \
  audio::system_detector::tests::test_system_audio_detector -- \
  --ignored --exact --nocapture --test-threads=1
```

Begin audible playback after the detector starts. This passes only when a real
`SystemAudioStarted` event arrives within 30 seconds.

```bash
TEST_AUDIO_PATH="/absolute/path/to/consented-speech-audio" \
CARGO_TARGET_DIR=target cargo test --locked -p meetily --features metal \
  audio::import::tests::test_import_pipeline_decode_vad -- \
  --ignored --exact --nocapture --test-threads=1
```

This passes only when the file decodes, converts to Whisper format, and produces
valid non-empty speech segments for both supported VAD redemption windows.

## Evidence record

For each release candidate, attach the following to the release gate issue:

- release commit SHA, macOS version, Mac model, and audio device names;
- exact commands and complete pass/fail output;
- microphone and system-audio permission status;
- imported file format and duration, without the private recording itself;
- any interruption, timeout, missing event, or device fallback as a blocker.

The release is not hardware-verified when any command is skipped, times out, or
runs against synthetic telemetry.
