#![allow(clippy::module_inception)] // Preserve the established public module path.

pub mod api;
pub mod commands;

pub use api::*;
// Don't re-export commands to avoid conflicts - lib.rs will import directly
