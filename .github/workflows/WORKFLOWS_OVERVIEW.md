# GitHub Actions workflows

Meetily Improved uses automatic protected checks for every pull request and
manual workflows for platform builds and release operations. Remote actions
must be pinned to a full 40-character commit SHA; the repository also enforces
that rule at the GitHub Actions policy layer.

## Required pull-request checks

### `ci.yml`

Runs on pull requests, pushes to `main`, and manual dispatch.

- **Frontend quality** installs the frozen pnpm graph, audits production
  dependencies, runs source and rendered tests, lints, builds, and enforces the
  route-bundle budget.
- **Rust dependency policy** runs cargo-deny for advisories, licenses, and
  sources.
- **Rust core quality** verifies formatting, Rust 1.88.0 compatibility, strict
  Clippy, and workspace tests with the native helper staged.
- **Native macOS QA bundle** runs browser accessibility/visual QA, isolated
  WebDriver route QA, native bundle identity/signature checks, and uploads
  evidence from an Apple Silicon macOS 26 runner.

### `security.yml`

Runs on pull requests, pushes to `main`, and manual dispatch.

- **Workflow action pinning** rejects movable remote Action references.
- **Dependency review** rejects new dependencies with moderate-or-higher known
  vulnerabilities.
- **CodeQL (JavaScript/TypeScript)** runs the `security-extended` query suite.

Protected `main` requires all seven named checks to be current with the branch,
including the native QA bundle. Admins are subject to the same rules; force
pushes and branch deletion are disabled.

## Production release

### `release.yml`

The Release workflow is manual and creates a gated draft for macOS Apple
Silicon and Windows x64. It does not publish the release.

Dispatch it from `main` with:

- `release_sha`: the exact 40-character current `main` SHA;
- `confirm_signing_ready`: `true` only after Apple, Windows, and updater
  credentials are configured.

The preflight requires the dispatch SHA, workflow SHA, checked-out SHA, and
live remote `main` SHA to match. The committed `X.Y.Z` version is authoritative.
If its tag or release already exists, the workflow fails; it never invents a
suffix or replaces an existing release.

The workflow then:

1. creates a draft targeted at the verified SHA;
2. builds signed macOS and Windows installers through `build.yml`;
3. verifies Developer ID signature, Gatekeeper assessment, notarization and
   stapling for the app and DMG;
4. verifies valid Authenticode signatures on both MSI and NSIS installers;
5. requires Tauri updater signatures and `latest.json`;
6. generates an SPDX JSON SBOM, `RELEASE_PROVENANCE.json`, and deterministic
   `SHA256SUMS`;
7. creates and verifies GitHub build-provenance and SBOM attestations;
8. uploads the evidence to the draft and leaves publication manual.

See [`../../docs/RELEASE_SECURITY.md`](../../docs/RELEASE_SECURITY.md) for the
exact dispatch and clean-download verification procedure. Do not publish the
existing rejected `v0.5.0` draft or any draft that has not passed every gate.

### Required release secrets

macOS signing and notarization:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_ID`
- `APPLE_ID_PASSWORD`
- `APPLE_TEAM_ID`
- `KEYCHAIN_PASSWORD`

Windows DigiCert KeyLocker signing:

- `SM_HOST`
- `SM_API_KEY`
- `SM_CLIENT_CERT_FILE_B64`
- `SM_CLIENT_CERT_PASSWORD`
- `SM_CODE_SIGNING_CERT_SHA1_HASH`

Tauri updater signing:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

Signing credentials are machine/account-owner inputs. Their absence is an
intentional release stop condition, not a reason to weaken the workflow.

## Manual build workflows

| Workflow | Purpose | Platforms | Signing |
| --- | --- | --- | --- |
| `build-devtest.yml` | Development and preflight artifacts | macOS, Windows, Linux | Optional |
| `build-macos.yml` | Standalone Apple Silicon build | macOS | Optional |
| `build-windows.yml` | Standalone MSI/NSIS build | Windows | Optional |
| `build-linux.yml` | DEB, AppImage, and RPM builds | Linux | Updater signing where configured |
| `build-test.yml` | Signed cross-platform test matrix | macOS, Windows, Linux | Required |
| `pr-main-check.yml` | Quick version/branch metadata check | Ubuntu | None |

`build.yml` is the reusable implementation called by `build-test.yml` and
`release.yml`; it is not directly dispatched. Release builds install the
frontend from the frozen lockfile and record the exact source SHA, toolchain,
target, platform verification, and installer hashes as build evidence.

Standalone/manual build artifacts are test outputs. They do not satisfy the
production release gate and must not be substituted for the draft assets
created from an exact protected `main` SHA.

## Routine usage

- Open or update a pull request and wait for all protected CI and Security
  checks. Do not merge around a missing or stale context.
- Use a standalone build workflow only for platform-specific investigation.
- Use `build-test.yml` when signing infrastructure needs a pre-release exercise.
- Use `release.yml` only after the protected release commit and every required
  credential are ready.
- Verify downloaded artifacts, attestations, checksums, signatures, and
  platform trust decisions before publishing a draft.

For dev-test details, see [`README_DEVTEST.md`](README_DEVTEST.md). For GPU
toolchain context, see [`ACCELERATION_GUIDE.md`](ACCELERATION_GUIDE.md).
