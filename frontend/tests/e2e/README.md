# Rendered and native QA

These checks supplement the existing source-contract tests and the required human release walkthrough. They never replace microphone, system-audio, transcription, summary, or Ask Meetings testing with real local data.

## Commands

```bash
pnpm run test:rendered
pnpm run test:e2e:browser
pnpm run tauri:build:wdio
pnpm run test:e2e:native
```

The browser suite runs the real Next.js shell against a deterministic empty local-backend boundary. It does not create meetings, transcripts, model answers, citations, or permission state. The native suite launches the isolated `com.meetily.improved.qa.wdio` binary against its own empty app-data directory.

## Visual baselines

Baseline updates are an explicit review action:

```bash
pnpm run test:e2e:browser:update
```

Review every changed PNG at 100% scale in both Light and Dark. Confirm the 1280×820 and 1100×720 variants preserve hierarchy, focus visibility, readable text, and non-overlapping controls. Commit approved baselines only; CI never auto-accepts a missing or changed baseline. Actual and diff images are uploaded from `tests/e2e/artifacts/` on failure.

## Security boundary

Normal builds use only `src-tauri/capabilities/main.json` and omit the optional Cargo `wdio` feature. The test binary additionally uses `src-tauri/capabilities/wdio.json`, `withGlobalTauri`, and the two WDIO plugins. CI verifies the public bundle does not contain the test bridge or WDIO permissions.

## Human release gate

Before publishing, a person must still complete the native Light/Dark route walkthrough, permission flow, real microphone/system-audio capture, transcript/summary generation, Ask Meetings grounding, import/recovery, keyboard/focus, reduced-motion, resize, signing, notarization, and clean-install checks. Automation must not grant microphone or system-audio permissions.
