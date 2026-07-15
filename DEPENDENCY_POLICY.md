# Dependency security policy

Meetily Improved treats its complete macOS, Windows, and Linux Cargo graph as release scope. The required CI command is:

```bash
cargo deny --all-features --locked check -W unmaintained advisories licenses sources
```

Vulnerabilities, yanked crates, disallowed licenses, and unknown sources must fail the gate. Informational `unmaintained` advisories remain warnings only when there is no safe supported migration; they must stay visible and appear in the review register below.

## Temporary vendored dependency

`vendor/notify-rust` is the source from upstream tag [`v4.17.0`](https://github.com/hoodie/notify-rust/releases/tag/v4.17.0), the last release compatible with Meetily's Rust 1.88 floor, plus the single dependency-line change from [notify-rust PR #288](https://github.com/hoodie/notify-rust/pull/288). The patch moves Windows notifications to `tauri-winrt-notification 0.8`, which removes the vulnerable `quick-xml 0.37` parser. The upstream PR is mergeable and its Windows, macOS, Linux, MSRV, format, and semver checks pass. The vendored source retains the original MIT and Apache-2.0 licenses and records exact provenance in `vendor/notify-rust/MEETILY-VENDORING.md`.

- Removal condition: replace the vendored crate with the first crates.io `notify-rust` release containing PR #288 that supports Meetily's declared Rust floor.
- Next review: 2026-07-28.
- Runtime constraint: preserve native notifications on all three supported desktop platforms; do not replace them with a browser or remote service.

## Upstream-constrained warning register

### Tauri Linux GTK3 stack

- Advisories: `RUSTSEC-2024-0370`, `RUSTSEC-2024-0411` through `RUSTSEC-2024-0420`.
- Locked path: Tauri 2's Linux WebKit/GTK runtime pulls GTK3 and its `proc-macro-error` dependency. These crates are selected for Linux; they are not part of the macOS or Windows runtime path.
- Constraint: cargo-deny reports that no safe upgrade is available. Replacing Tauri's supported Linux runtime in the application would be a high-risk platform fork.
- Upstream: [tauri-apps/tauri#7335](https://github.com/tauri-apps/tauri/issues/7335), [tauri-apps/tauri#11942](https://github.com/tauri-apps/tauri/issues/11942), and [tauri-apps/tauri#10910](https://github.com/tauri-apps/tauri/issues/10910).
- Removal condition: adopt Tauri's supported GTK4 runtime once released and complete native Linux recording, tray, dialog, notification, and packaging regression tests.
- Next review: 2026-08-14.

### Tauri URLPattern Unicode stack

- Advisories: `RUSTSEC-2025-0075`, `RUSTSEC-2025-0080`, `RUSTSEC-2025-0081`, `RUSTSEC-2025-0098`, and `RUSTSEC-2025-0100`.
- Locked path: `tauri-utils 2.9.1 -> urlpattern 0.3.0 -> unic-ucd-ident 0.9.0`.
- Constraint: current released Tauri 2 packages still select `urlpattern 0.3`; forcing a different major version under Tauri would bypass its ACL compatibility contract.
- Upstream: the compatible update to `urlpattern 0.6` was merged in [tauri-apps/tauri#15660](https://github.com/tauri-apps/tauri/pull/15660) at commit `dd725f4b13c30a86b398ccc59eb498f151f461c5` but is not present in the currently published `tauri-utils 2.9.3` crate.
- Removal condition: update to the first released Tauri 2 patch containing PR #15660, then rerun the Tauri ACL contract and four-platform dependency audit.
- Next review: 2026-07-28.

## Resolved in the current lockfile

- `spin 0.9.8` was replaced by semver-compatible `spin 0.9.9`; the `flume` maintainer confirmed in [flume#183](https://github.com/zesterer/flume/issues/183) that `flume` did not use the unsound API behind the yank.
- `nnnoiseless` now disables its unused command-line default feature, removing `clap 3`, `atty`, and related binary-only dependencies while retaining the RNNoise library API used by recording.
- `quick-xml 0.37` and both associated RustSec advisory exceptions were removed from the graph through the audited `notify-rust` patch.
