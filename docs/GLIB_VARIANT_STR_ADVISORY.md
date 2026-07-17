# glib VariantStrIter advisory classification

## Decision

GitHub Dependabot alert 1, [GHSA-wrw7-89jp-8q8g](https://github.com/advisories/GHSA-wrw7-89jp-8q8g) / [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html), is present in Meetily's supported Linux dependency graph but is not reachable from the product or its locked dependencies.

Dismissal reason: `not_used`.

This is a narrow reachability classification, not an advisory allowlist. Do not add this advisory to `deny.toml`, disable Dependabot, or weaken the Rust dependency-policy job.

## Affected code and locked path

The advisory covers `glib` versions from `0.15.0` up to, but not including, `0.20.0`. `VariantStrIter::impl_get` passed an immutable reference as a C out-pointer. In optimized builds, Rust may treat the pointer as unchanged and `CStr::from_ptr` can receive null, causing undefined behavior or a crash. The upstream fix changes the local pointer and out-reference to mutable; the first patched release is `glib 0.20.0`.

Meetily locks `glib 0.18.5` through Tauri's Linux GTK3/WebKit stack:

```text
meetily
└── tauri 2.11.1
    ├── gtk 0.18.2
    │   └── glib 0.18.5
    ├── tauri-runtime-wry / wry 0.55.1
    │   ├── gtk 0.18.2
    │   └── webkit2gtk 2.0.2
    │       └── glib 0.18.5
    └── webkit2gtk 2.0.2
        └── glib 0.18.5
```

The tree is verified with:

```sh
cargo tree --locked -i glib@0.18.5 --workspace --target all
```

The gtk-rs fix landed in [gtk-rs-core PR 1343](https://github.com/gtk-rs/gtk-rs-core/pull/1343) after the final `0.18.5` tag. There is no patched `0.18` release. Tauri `2.11.5`, current when this classification was made, still declares `gtk 0.18`; a compatible Tauri or lockfile update therefore cannot move this graph to `glib 0.20`.

## Reachability evidence

A full text search of Meetily's Rust source and every locally installed crate source in the locked graph found `VariantStrIter`, `variant_str_iter`, and `array_iter_str` only in `glib`'s own implementation, tests, and documentation. No product or dependency source calls the affected iterator API.

`frontend/tests/lib/rust-advisory-reachability.test.mjs` keeps the decision fail closed by:

- requiring the exact reviewed `tauri` / `wry` / `webkit2gtk` / `gtk` / `glib` graph and `glib 0.18.5` checksum;
- scanning the complete `frontend/src-tauri/src` tree for the affected API names;
- requiring the cargo-deny advisory ignore list to remain empty; and
- requiring this rationale and its re-review instructions to remain present.

## Re-review triggers

Re-open and re-evaluate the alert before changing the classification when any of these occur:

- `Cargo.lock` changes the vulnerable `glib`, GTK, WebKit, wry, or Tauri package boundary;
- Tauri replaces GTK3 or permits `glib 0.20` or newer on Linux;
- gtk-rs publishes a patched `0.18` release or the advisory range changes;
- Meetily or a dependency begins calling `VariantStrIter`, `variant_str_iter`, or `array_iter_str`; or
- the advisory's affected surface, severity, or exploitability evidence changes.

The durable remediation is removal of the vulnerable package through an upstream-compatible Tauri Linux backend upgrade. Vendoring or forking `glib 0.18`, suppressing the advisory globally, or forcing incompatible GTK crate versions is not an acceptable substitute.
