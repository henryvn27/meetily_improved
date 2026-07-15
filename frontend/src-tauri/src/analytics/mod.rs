#![allow(clippy::module_inception)] // Preserve the established public module path.

pub mod analytics;
pub mod commands;

pub use analytics::*;
// Don't re-export commands to avoid conflicts - lib.rs will import directly
