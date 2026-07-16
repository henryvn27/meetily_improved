use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::Duration;

const MANIFEST_JSON: &str = include_str!("../ffmpeg-assets.json");
const MAX_ARCHIVE_OVERHEAD: u64 = 1024;

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct AssetManifest {
    schema_version: u32,
    assets: Vec<AssetSpec>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct AssetSpec {
    target: String,
    version: String,
    provider: String,
    license: String,
    source_url: String,
    url: String,
    archive_kind: String,
    archive_size: u64,
    archive_sha256: String,
    binary_sha256: String,
}

pub fn ensure_ffmpeg_binary() {
    println!("cargo:rerun-if-env-changed=MEETILY_FFMPEG_ARCHIVE");
    println!("cargo:rerun-if-changed=../../ffmpeg-build/ffmpeg-assets.json");

    if let Err(error) = ensure_ffmpeg_binary_inner() {
        panic!("FFmpeg provenance verification failed: {error}");
    }
}

fn ensure_ffmpeg_binary_inner() -> Result<(), String> {
    let target = std::env::var("TARGET").map_err(|_| "TARGET is not set".to_string())?;
    let host = std::env::var("HOST").map_err(|_| "HOST is not set".to_string())?;
    let manifest = load_manifest()?;
    let asset = asset_for_target(&manifest, &target)?;
    let manifest_dir = PathBuf::from(
        std::env::var("CARGO_MANIFEST_DIR").map_err(|_| "CARGO_MANIFEST_DIR is not set")?,
    );
    let binary_name = if target.contains("windows") {
        format!("ffmpeg-{target}.exe")
    } else {
        format!("ffmpeg-{target}")
    };
    let binary_path = manifest_dir.join("binaries").join(binary_name);

    if binary_path.exists() {
        match verify_file(&binary_path, None, &asset.binary_sha256) {
            Ok(()) => {
                println!(
                    "cargo:warning=FFmpeg cache authenticated for {} ({})",
                    target, asset.binary_sha256
                );
                if target == host {
                    verify_executable(&binary_path)?;
                }
                return Ok(());
            }
            Err(error) => {
                std::fs::remove_file(&binary_path).map_err(|remove_error| {
                    format!(
                        "cached FFmpeg failed authentication ({error}) and could not be removed: {remove_error}"
                    )
                })?;
            }
        }
    }

    std::fs::create_dir_all(binary_path.parent().expect("binary path has parent"))
        .map_err(|error| format!("failed to create binaries directory: {error}"))?;

    let local_archive = std::env::var_os("MEETILY_FFMPEG_ARCHIVE");
    let archive = match local_archive.as_ref() {
        Some(path) => PathBuf::from(path),
        None => download_archive(asset)?,
    };
    let install_result = verify_file(&archive, Some(asset.archive_size), &asset.archive_sha256)
        .and_then(|()| install_from_archive(asset, &archive, &binary_path));
    if local_archive.is_none() {
        let _ = std::fs::remove_file(&archive);
    }
    install_result?;
    verify_file(&binary_path, None, &asset.binary_sha256)?;
    if target == host {
        verify_executable(&binary_path)?;
    }

    println!(
        "cargo:warning=FFmpeg {} from {} authenticated for {} ({}; {})",
        asset.version, asset.provider, target, asset.license, asset.source_url
    );
    Ok(())
}

fn load_manifest() -> Result<AssetManifest, String> {
    let manifest: AssetManifest = serde_json::from_str(MANIFEST_JSON)
        .map_err(|error| format!("invalid FFmpeg asset manifest: {error}"))?;
    if manifest.schema_version != 1 {
        return Err(format!(
            "unsupported FFmpeg asset manifest schema {}",
            manifest.schema_version
        ));
    }
    Ok(manifest)
}

fn asset_for_target<'a>(
    manifest: &'a AssetManifest,
    target: &str,
) -> Result<&'a AssetSpec, String> {
    manifest
        .assets
        .iter()
        .find(|asset| asset.target == target)
        .ok_or_else(|| {
            format!(
                "unsupported target '{target}'; authenticated FFmpeg inputs exist only for: {}",
                manifest
                    .assets
                    .iter()
                    .map(|asset| asset.target.as_str())
                    .collect::<Vec<_>>()
                    .join(", ")
            )
        })
}

fn download_archive(asset: &AssetSpec) -> Result<PathBuf, String> {
    download_archive_from(asset, &asset.url)
}

fn download_archive_from(asset: &AssetSpec, url: &str) -> Result<PathBuf, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|error| format!("failed to create FFmpeg HTTP client: {error}"))?;
    let response = client
        .get(url)
        .send()
        .map_err(|error| format!("failed to download authenticated FFmpeg archive: {error}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "FFmpeg download returned HTTP {} from {}",
            response.status(),
            url
        ));
    }
    if let Some(length) = response.content_length() {
        if length != asset.archive_size {
            return Err(format!(
                "FFmpeg archive size mismatch before download: expected {}, received {}",
                asset.archive_size, length
            ));
        }
    }

    let mut file = tempfile::Builder::new()
        .prefix("meetily-ffmpeg-")
        .suffix(if asset.archive_kind == "zip" {
            ".zip"
        } else {
            ".tar.xz"
        })
        .tempfile()
        .map_err(|error| format!("failed to create temporary archive: {error}"))?;
    let copied = std::io::copy(
        &mut response.take(asset.archive_size + MAX_ARCHIVE_OVERHEAD + 1),
        &mut file,
    )
    .map_err(|error| format!("failed to save FFmpeg archive: {error}"))?;
    if copied != asset.archive_size {
        return Err(format!(
            "FFmpeg archive size mismatch: expected {}, received {}",
            asset.archive_size, copied
        ));
    }
    file.flush()
        .map_err(|error| format!("failed to flush FFmpeg archive: {error}"))?;
    let (_file, path) = file
        .keep()
        .map_err(|error| format!("failed to retain FFmpeg archive: {error}"))?;
    Ok(path)
}

fn verify_file(
    path: &Path,
    expected_size: Option<u64>,
    expected_sha256: &str,
) -> Result<(), String> {
    let metadata = std::fs::metadata(path)
        .map_err(|error| format!("cannot inspect {}: {error}", path.display()))?;
    if let Some(expected_size) = expected_size {
        if metadata.len() != expected_size {
            return Err(format!(
                "{} size mismatch: expected {}, got {}",
                path.display(),
                expected_size,
                metadata.len()
            ));
        }
    }
    let mut file = File::open(path)
        .map_err(|error| format!("cannot open {} for hashing: {error}", path.display()))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file
            .read(&mut buffer)
            .map_err(|error| format!("cannot hash {}: {error}", path.display()))?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    let actual = format!("{:x}", hasher.finalize());
    if actual != expected_sha256 {
        return Err(format!(
            "{} SHA-256 mismatch: expected {}, got {}",
            path.display(),
            expected_sha256,
            actual
        ));
    }
    Ok(())
}

fn install_from_archive(asset: &AssetSpec, archive: &Path, output: &Path) -> Result<(), String> {
    let extract_dir = tempfile::tempdir()
        .map_err(|error| format!("failed to create extraction directory: {error}"))?;
    match asset.archive_kind.as_str() {
        "zip" => extract_zip(archive, extract_dir.path())?,
        "tar.xz" => extract_tar_xz(archive, extract_dir.path())?,
        kind => return Err(format!("unsupported authenticated archive kind '{kind}'")),
    }
    let executable_name = if asset.target.contains("windows") {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    };
    let candidates = find_named_files(extract_dir.path(), executable_name)?;
    if candidates.len() != 1 {
        return Err(format!(
            "authenticated archive must contain exactly one {executable_name}; found {}",
            candidates.len()
        ));
    }
    verify_file(&candidates[0], None, &asset.binary_sha256)?;

    let parent = output
        .parent()
        .ok_or_else(|| "binary output has no parent".to_string())?;
    let mut staged = tempfile::NamedTempFile::new_in(parent)
        .map_err(|error| format!("failed to stage FFmpeg binary: {error}"))?;
    let mut source = File::open(&candidates[0])
        .map_err(|error| format!("failed to open extracted FFmpeg: {error}"))?;
    std::io::copy(&mut source, &mut staged)
        .map_err(|error| format!("failed to stage FFmpeg binary: {error}"))?;
    staged
        .flush()
        .map_err(|error| format!("failed to flush staged FFmpeg binary: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        staged
            .as_file()
            .set_permissions(std::fs::Permissions::from_mode(0o755))
            .map_err(|error| format!("failed to set FFmpeg permissions: {error}"))?;
    }
    staged
        .persist(output)
        .map_err(|error| format!("failed to install authenticated FFmpeg: {error}"))?;
    Ok(())
}

fn extract_zip(archive: &Path, output: &Path) -> Result<(), String> {
    let file = File::open(archive).map_err(|error| format!("failed to open ZIP: {error}"))?;
    let mut zip =
        zip::ZipArchive::new(file).map_err(|error| format!("failed to parse ZIP: {error}"))?;
    for index in 0..zip.len() {
        let mut entry = zip
            .by_index(index)
            .map_err(|error| format!("failed to read ZIP entry {index}: {error}"))?;
        let relative = entry
            .enclosed_name()
            .ok_or_else(|| format!("ZIP entry escapes extraction root: {}", entry.name()))?;
        let destination = output.join(relative);
        if entry.is_dir() {
            std::fs::create_dir_all(&destination)
                .map_err(|error| format!("failed to create ZIP directory: {error}"))?;
        } else {
            if let Some(parent) = destination.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|error| format!("failed to create ZIP parent: {error}"))?;
            }
            let mut destination_file = File::create(&destination)
                .map_err(|error| format!("failed to create ZIP output: {error}"))?;
            std::io::copy(&mut entry, &mut destination_file)
                .map_err(|error| format!("failed to extract ZIP entry: {error}"))?;
        }
    }
    Ok(())
}

fn extract_tar_xz(archive: &Path, output: &Path) -> Result<(), String> {
    let file = File::open(archive).map_err(|error| format!("failed to open TAR.XZ: {error}"))?;
    let decoder = xz2::read::XzDecoder::new(file);
    let mut tar = tar::Archive::new(decoder);
    tar.unpack(output)
        .map_err(|error| format!("failed to safely extract TAR.XZ: {error}"))
}

fn find_named_files(root: &Path, name: &str) -> Result<Vec<PathBuf>, String> {
    let mut matches = Vec::new();
    let mut pending = vec![root.to_path_buf()];
    while let Some(directory) = pending.pop() {
        for entry in std::fs::read_dir(&directory)
            .map_err(|error| format!("failed to inspect {}: {error}", directory.display()))?
        {
            let path = entry
                .map_err(|error| format!("failed to inspect extracted entry: {error}"))?
                .path();
            if path.is_dir() {
                pending.push(path);
            } else if path.file_name().and_then(|value| value.to_str()) == Some(name) {
                matches.push(path);
            }
        }
    }
    Ok(matches)
}

fn verify_executable(path: &Path) -> Result<(), String> {
    let output = std::process::Command::new(path)
        .arg("-version")
        .output()
        .map_err(|error| format!("authenticated FFmpeg could not execute: {error}"))?;
    if !output.status.success() {
        return Err(format!(
            "authenticated FFmpeg exited unsuccessfully: {}",
            output.status
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::TcpListener;
    use std::thread;

    #[test]
    fn manifest_has_unique_exact_targets_and_complete_provenance() {
        let manifest = load_manifest().unwrap();
        assert_eq!(manifest.assets.len(), 5);
        let mut targets = manifest
            .assets
            .iter()
            .map(|asset| asset.target.as_str())
            .collect::<Vec<_>>();
        targets.sort_unstable();
        targets.dedup();
        assert_eq!(targets.len(), manifest.assets.len());
        for asset in &manifest.assets {
            assert!(asset.url.starts_with("https://"));
            assert!(asset.source_url.starts_with("https://"));
            assert_eq!(asset.archive_sha256.len(), 64);
            assert_eq!(asset.binary_sha256.len(), 64);
            assert!(asset.archive_size > 0);
            assert_eq!(asset.license, "GPL-3.0-or-later");
        }
    }

    #[test]
    fn target_matching_is_exact_and_fails_closed() {
        let manifest = load_manifest().unwrap();
        assert!(asset_for_target(&manifest, "aarch64-apple-darwin").is_ok());
        assert!(asset_for_target(&manifest, "armv7-unknown-linux-gnueabihf").is_err());
        assert!(asset_for_target(&manifest, "x86_64-unknown-linux-musl").is_err());
    }

    #[test]
    fn hash_verification_rejects_tampering() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        file.write_all(b"trusted").unwrap();
        verify_file(
            file.path(),
            Some(7),
            "a9a089195c68d2adeee23beaa2c3a93b1d4cdf09046e7a9e520b3b166dff3e6a",
        )
        .unwrap();
        assert!(verify_file(file.path(), None, &"0".repeat(64)).is_err());
    }

    #[test]
    fn tampered_cache_is_rejected_without_execution() {
        let directory = tempfile::tempdir().unwrap();
        let marker = directory.path().join("executed");
        let binary = directory.path().join("ffmpeg");
        std::fs::write(
            &binary,
            format!("#!/bin/sh\ntouch '{}'\n", marker.display()),
        )
        .unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&binary, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        assert!(verify_file(&binary, None, &"0".repeat(64)).is_err());
        assert!(
            !marker.exists(),
            "cache authentication must not execute input"
        );
    }

    #[test]
    fn network_errors_fail_closed() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let server = thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut request = [0_u8; 1024];
            let _ = stream.read(&mut request);
            stream
                .write_all(b"HTTP/1.1 503 Service Unavailable\r\nContent-Length: 0\r\n\r\n")
                .unwrap();
        });
        let manifest = load_manifest().unwrap();
        let result =
            download_archive_from(&manifest.assets[0], &format!("http://{address}/ffmpeg.zip"));
        server.join().unwrap();
        assert!(result.unwrap_err().contains("HTTP 503"));
    }
}
