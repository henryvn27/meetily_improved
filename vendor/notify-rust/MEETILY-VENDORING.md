# Meetily vendoring record

- Upstream: <https://github.com/hoodie/notify-rust>
- Source tag: `v4.17.0` (`567da29c8269ab97d006f254faa1409f567ee0b1`)
- Local source path: `vendor/notify-rust`
- Upstream licenses: `LICENSE-MIT` and `LICENSE-Apache`
- Meetily patch: change the Windows-only `tauri-winrt-notification` requirement from `0.7` to `0.8`, matching upstream [PR #288](https://github.com/hoodie/notify-rust/pull/288).

Meetily uses `v4.17.0` because it declares Rust 1.63 compatibility and therefore remains inside Meetily's Rust 1.88 minimum. Upstream `v4.18.0` raises its minimum to Rust 1.89. Remove this copy when a crates.io release includes PR #288 and supports Meetily's declared Rust floor.
