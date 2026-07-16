# FFmpeg binary provenance

Meetily bundles an FFmpeg executable for each supported desktop target. Build-time inputs are pinned in the machine-readable [`ffmpeg-assets.json`](../ffmpeg-build/ffmpeg-assets.json) manifest. The build fails closed unless the target triple, archive byte length, archive SHA-256, and extracted executable SHA-256 all match that manifest.

## Supported inputs

| Rust target | Version and provider | License | Archive SHA-256 | Executable SHA-256 |
| --- | --- | --- | --- | --- |
| `x86_64-pc-windows-msvc` | FFmpeg 8.0.1 essentials, Gyan Doshi | GPL-3.0-or-later | `e2aaeaa0fdbc397d4794828086424d4aaa2102cef1fb6874f6ffd29c0b88b673` | `5af82a0d4fe2b9eae211b967332ea97edfc51c6b328ca35b827e73eac560dc0d` |
| `x86_64-apple-darwin` | FFmpeg 8.0.1-tessus, evermeet.cx | GPL-3.0-or-later | `470e482f6e290eac92984ac12b2d67bad425b1e5269fd75fb6a3536c16e824e4` | `430d60fbf419dab28daee9b679e7929a31ee9bae53f6e42e8ae26b725584290f` |
| `aarch64-apple-darwin` | FFmpeg 8.0, OSXExperts | GPL-3.0-or-later | `0d4efcaf6a098430a708e0af694a84792938921fa126162787ae98c6151d7a95` | `77d2c853f431318d55ec02676d9b2f185ebfdddb9f7677a251fbe453affe025a` |
| `x86_64-unknown-linux-gnu` | FFmpeg 7.0.2, John Van Sickle | GPL-3.0-or-later | `abda8d77ce8309141f83ab8edf0596834087c52467f6badf376a6a2a4c87cf67` | `e7e7fb30477f717e6f55f9180a70386c62677ef8a4d4d1a5d948f4098aa3eb99` |
| `aarch64-unknown-linux-gnu` | FFmpeg 7.0.2, John Van Sickle | GPL-3.0-or-later | `f4149bb2b0784e30e99bdda85471c9b5930d3402014e934a5098b41d0f7201b1` | `6bb182d0d75d23028db82e9e4f723ca69b853d055698486e6984ddb2c06fb8ce` |

The exact approved download URLs and archive sizes are intentionally kept in the JSON manifest so release tooling and reviewers can consume the same source of truth as the build script.

## Verification behavior

1. Meetily selects an asset only by an exact Rust target triple. Unsupported architectures, libc variants, and operating systems fail.
2. A cached executable is hashed before any attempt to execute it. A mismatch is removed and cannot be used.
3. A downloaded archive must match its exact byte length and SHA-256 before extraction.
4. Archive paths are constrained to the temporary extraction root. The archive must contain exactly one FFmpeg executable.
5. The extracted executable is hashed before installation, then the installed copy is hashed again.
6. Only an authenticated executable whose target equals the build host is smoke-tested with `ffmpeg -version`. Cross-compiled executables are never run on the host.

For a controlled offline build, set `MEETILY_FFMPEG_ARCHIVE` to a local copy of the approved archive. Local archives receive the same size, archive-hash, extraction, and executable-hash checks. This variable is not a bypass.

## Source and license

- Windows builds: [Gyan FFmpeg builds](https://www.gyan.dev/ffmpeg/builds/)
- Intel macOS builds: [evermeet.cx FFmpeg](https://evermeet.cx/ffmpeg/)
- Apple Silicon builds: [OSXExperts](https://www.osxexperts.net/)
- Linux builds: [John Van Sickle FFmpeg static builds](https://www.johnvansickle.com/ffmpeg/)
- FFmpeg source and license information: [ffmpeg.org](https://ffmpeg.org/)

These bundled variants identify as GPL version 3 or later. Meetily's own MIT license does not replace the FFmpeg license. See [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) for the redistribution notice and [`FFMPEG-GPL-3.0.txt`](../frontend/src-tauri/resources/licenses/FFMPEG-GPL-3.0.txt) for the license text included in packaged applications.

## Release evidence

For every release commit, archive the following together:

- the exact Git commit SHA;
- `ffmpeg-build/ffmpeg-assets.json` as the FFmpeg SBOM/provenance component;
- `sha256sum` (or `shasum -a 256`) output for every authenticated input and final bundled executable (macOS code signing changes the final Mach-O digest);
- the native packaging log showing the authenticated target and executable digest;
- this notice and the corresponding FFmpeg source/build links.

Any manifest edit is a supply-chain change and requires fresh archive and executable hash verification before merge.
