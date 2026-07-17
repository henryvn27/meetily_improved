//! Decision-neutral filesystem migration primitive for a future app-identity change.
//!
//! Nothing in the running app calls this module. A future, explicitly approved
//! identity migration must resolve the old and new app-data directories and pass
//! them in; keeping path discovery out of this helper prevents accidental writes
//! to live user data while the public identifier is still undecided.

use std::ffi::{OsStr, OsString};
use std::fs::{self, File};
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use thiserror::Error;

const MARKER: &str = ".meetily-identity-migration-v1";

#[derive(Debug, Error)]
pub enum MigrationError {
    #[error("migration source is not a directory: {0}")]
    MissingSource(PathBuf),
    #[error("migration source contains a symbolic link: {0}")]
    SymbolicLink(PathBuf),
    #[error("migration source contains the reserved marker: {0}")]
    ReservedMarker(PathBuf),
    #[error("migration destination already exists with different contents: {0}")]
    DestinationExists(PathBuf),
    #[error("migration staging directory already exists: {0}")]
    StagingExists(PathBuf),
    #[error("migration source changed while it was copied")]
    SourceChanged,
    #[error(transparent)]
    Io(#[from] io::Error),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MigrationOutcome {
    Migrated,
    AlreadyMigrated,
}

/// Copy `source` to `destination` without modifying `source`, then publish with
/// one same-directory rename. Existing destinations and stale staging data are
/// refused unless the destination is a byte-identical prior migration.
pub fn migrate_directory(
    source: impl AsRef<Path>,
    destination: impl AsRef<Path>,
) -> Result<MigrationOutcome, MigrationError> {
    let source = source.as_ref();
    let destination = destination.as_ref();
    validate_source(source)?;

    if path_entry_exists(destination)? {
        return if is_completed_copy(source, destination)? {
            Ok(MigrationOutcome::AlreadyMigrated)
        } else {
            Err(MigrationError::DestinationExists(destination.to_path_buf()))
        };
    }

    let staging = staging_path(destination)?;
    if path_entry_exists(&staging)? {
        return Err(MigrationError::StagingExists(staging));
    }

    fs::create_dir(&staging)?;
    let result = (|| {
        copy_directory(source, &staging)?;
        if !directories_equal(source, &staging, false)? {
            return Err(MigrationError::SourceChanged);
        }
        fs::write(staging.join(MARKER), b"complete\n")?;
        fs::rename(&staging, destination)?;
        Ok(MigrationOutcome::Migrated)
    })();

    if result.is_err() && path_entry_exists(&staging).unwrap_or(false) {
        let _ = fs::remove_dir_all(&staging);
    }
    result
}

/// Remove an unchanged destination created by [`migrate_directory`]. The
/// preserved source is the rollback copy; modified destinations are refused.
pub fn rollback_directory(
    source: impl AsRef<Path>,
    destination: impl AsRef<Path>,
) -> Result<bool, MigrationError> {
    let source = source.as_ref();
    let destination = destination.as_ref();
    validate_source(source)?;
    if !path_entry_exists(destination)? {
        return Ok(false);
    }
    if !is_completed_copy(source, destination)? {
        return Err(MigrationError::DestinationExists(destination.to_path_buf()));
    }
    fs::remove_dir_all(destination)?;
    Ok(true)
}

fn validate_source(source: &Path) -> Result<(), MigrationError> {
    let metadata = fs::symlink_metadata(source)
        .map_err(|_| MigrationError::MissingSource(source.to_path_buf()))?;
    if !metadata.is_dir() || metadata.file_type().is_symlink() {
        return Err(MigrationError::MissingSource(source.to_path_buf()));
    }
    if path_entry_exists(&source.join(MARKER))? {
        return Err(MigrationError::ReservedMarker(source.join(MARKER)));
    }
    Ok(())
}

fn staging_path(destination: &Path) -> Result<PathBuf, MigrationError> {
    let name = destination
        .file_name()
        .ok_or_else(|| MigrationError::DestinationExists(destination.to_path_buf()))?;
    let mut staging_name = OsString::from(".");
    staging_name.push(name);
    staging_name.push(".meetily-migration-staging");
    Ok(destination.with_file_name(staging_name))
}

fn copy_directory(source: &Path, destination: &Path) -> Result<(), MigrationError> {
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());
        let file_type = entry.file_type()?;
        if file_type.is_symlink() {
            return Err(MigrationError::SymbolicLink(source_path));
        }
        if file_type.is_dir() {
            fs::create_dir(&destination_path)?;
            copy_directory(&source_path, &destination_path)?;
        } else if file_type.is_file() {
            fs::copy(&source_path, &destination_path)?;
        } else {
            return Err(MigrationError::SymbolicLink(source_path));
        }
    }
    Ok(())
}

fn is_completed_copy(source: &Path, destination: &Path) -> Result<bool, MigrationError> {
    let marker = destination.join(MARKER);
    let marker_type = match fs::symlink_metadata(marker) {
        Ok(metadata) => metadata.file_type(),
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(false),
        Err(error) => return Err(error.into()),
    };
    if !marker_type.is_file() || marker_type.is_symlink() {
        return Ok(false);
    }
    directories_equal(source, destination, true)
}

fn path_entry_exists(path: &Path) -> Result<bool, MigrationError> {
    match fs::symlink_metadata(path) {
        Ok(_) => Ok(true),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(false),
        Err(error) => Err(error.into()),
    }
}

fn directories_equal(
    source: &Path,
    destination: &Path,
    ignore_destination_marker: bool,
) -> Result<bool, MigrationError> {
    let mut source_entries = entry_names(source)?;
    let mut destination_entries = entry_names(destination)?;
    if ignore_destination_marker {
        destination_entries.retain(|name| name != OsStr::new(MARKER));
    }
    if source_entries != destination_entries {
        return Ok(false);
    }

    for name in source_entries.drain(..) {
        let source_path = source.join(&name);
        let destination_path = destination.join(&name);
        let source_type = fs::symlink_metadata(&source_path)?.file_type();
        let destination_type = fs::symlink_metadata(&destination_path)?.file_type();
        if source_type.is_symlink() || destination_type.is_symlink() {
            return Err(MigrationError::SymbolicLink(source_path));
        }
        if source_type.is_dir() != destination_type.is_dir()
            || source_type.is_file() != destination_type.is_file()
        {
            return Ok(false);
        }
        if source_type.is_dir() {
            if !directories_equal(&source_path, &destination_path, false)? {
                return Ok(false);
            }
        } else if !files_equal(&source_path, &destination_path)? {
            return Ok(false);
        }
    }
    Ok(true)
}

fn files_equal(source: &Path, destination: &Path) -> Result<bool, MigrationError> {
    if fs::metadata(source)?.len() != fs::metadata(destination)?.len() {
        return Ok(false);
    }
    let mut source = File::open(source)?;
    let mut destination = File::open(destination)?;
    let mut source_buffer = [0_u8; 64 * 1024];
    let mut destination_buffer = [0_u8; 64 * 1024];
    loop {
        let source_read = source.read(&mut source_buffer)?;
        let destination_read = destination.read(&mut destination_buffer)?;
        if source_read != destination_read
            || source_buffer[..source_read] != destination_buffer[..destination_read]
        {
            return Ok(false);
        }
        if source_read == 0 {
            return Ok(true);
        }
    }
}

fn entry_names(directory: &Path) -> Result<Vec<OsString>, MigrationError> {
    let mut names = fs::read_dir(directory)?
        .map(|entry| entry.map(|entry| entry.file_name()))
        .collect::<Result<Vec<_>, _>>()?;
    names.sort();
    Ok(names)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrates_nested_data_once_and_preserves_the_source() {
        let temp = tempfile::tempdir().unwrap();
        let source = temp.path().join("old");
        let destination = temp.path().join("new");
        fs::create_dir_all(source.join("models/summary")).unwrap();
        fs::write(source.join("meeting_minutes.sqlite"), b"database").unwrap();
        fs::write(source.join("models/summary/model.gguf"), b"model").unwrap();

        assert_eq!(
            migrate_directory(&source, &destination).unwrap(),
            MigrationOutcome::Migrated
        );
        assert_eq!(
            fs::read(source.join("meeting_minutes.sqlite")).unwrap(),
            b"database"
        );
        assert_eq!(
            fs::read(destination.join("models/summary/model.gguf")).unwrap(),
            b"model"
        );
        assert_eq!(
            migrate_directory(&source, &destination).unwrap(),
            MigrationOutcome::AlreadyMigrated
        );
    }

    #[test]
    fn refuses_destination_collisions_and_stale_staging() {
        let temp = tempfile::tempdir().unwrap();
        let source = temp.path().join("old");
        let destination = temp.path().join("new");
        fs::create_dir(&source).unwrap();
        fs::write(source.join("data"), b"old").unwrap();
        fs::create_dir(&destination).unwrap();
        fs::write(destination.join("data"), b"different").unwrap();
        assert!(matches!(
            migrate_directory(&source, &destination),
            Err(MigrationError::DestinationExists(_))
        ));

        fs::remove_dir_all(&destination).unwrap();
        let staging = staging_path(&destination).unwrap();
        fs::create_dir(&staging).unwrap();
        assert!(matches!(
            migrate_directory(&source, &destination),
            Err(MigrationError::StagingExists(_))
        ));
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlinks_and_cleans_partial_staging() {
        use std::os::unix::fs::symlink;

        let temp = tempfile::tempdir().unwrap();
        let source = temp.path().join("old");
        let destination = temp.path().join("new");
        fs::create_dir(&source).unwrap();
        fs::write(source.join("data"), b"data").unwrap();
        symlink(temp.path().join("missing"), &destination).unwrap();
        assert!(matches!(
            migrate_directory(&source, &destination),
            Err(MigrationError::DestinationExists(_))
        ));
        fs::remove_file(&destination).unwrap();

        symlink(source.join("data"), source.join("linked-data")).unwrap();

        assert!(matches!(
            migrate_directory(&source, &destination),
            Err(MigrationError::SymbolicLink(_))
        ));
        assert!(!destination.exists());
        assert!(!staging_path(&destination).unwrap().exists());
        assert_eq!(fs::read(source.join("data")).unwrap(), b"data");
    }

    #[test]
    fn rollback_only_removes_an_unchanged_completed_copy() {
        let temp = tempfile::tempdir().unwrap();
        let source = temp.path().join("old");
        let destination = temp.path().join("new");
        fs::create_dir(&source).unwrap();
        fs::write(source.join("data"), b"data").unwrap();
        migrate_directory(&source, &destination).unwrap();
        fs::write(destination.join("data"), b"changed").unwrap();
        assert!(matches!(
            rollback_directory(&source, &destination),
            Err(MigrationError::DestinationExists(_))
        ));

        fs::write(destination.join("data"), b"data").unwrap();
        assert!(rollback_directory(&source, &destination).unwrap());
        assert!(!destination.exists());
        assert!(!rollback_directory(&source, &destination).unwrap());
        assert_eq!(fs::read(source.join("data")).unwrap(), b"data");
    }
}
