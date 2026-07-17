// Bluetooth device fallback strategy for stable Core Audio recording (macOS-specific)
//
// This module implements automatic microphone fallback to the built-in input
// when a Bluetooth microphone is the system default on macOS. This solves:
// - Bluetooth variable sample rate issues (Core Audio may resample dynamically)
// - Inconsistent sample rates when mixing mic + system audio streams
//
// Strategy (macOS-only):
// 1. Get system default devices (mic + speaker)
// 2. Detect each device kind using InputDeviceKind::detect()
// 3. If the microphone is Bluetooth, prefer the built-in microphone
// 4. Keep the active output device so ScreenCaptureKit captures its digital stream
// 5. Return final devices with detailed rationale logging
//
// A Bluetooth output is intentionally retained. ScreenCaptureKit captures the
// active output's digital stream before Bluetooth encoding, while the stable
// built-in microphone avoids variable input sample rates.

use anyhow::Result;
use log::{info, warn};

use super::configuration::AudioDevice;
use super::microphone::{default_input_device, find_builtin_input_device};
use super::speakers::default_output_device;
use crate::audio::device_detection::InputDeviceKind;

/// Get safe recording devices with automatic Bluetooth fallback (macOS-specific)
///
/// This function intelligently selects audio devices for recording on macOS:
/// - Checks microphone: if Bluetooth → override to built-in mic
/// - Keeps the active output device, including Bluetooth outputs
///
/// # Rationale
///
/// Bluetooth microphones on macOS can have variable sample rates as Core Audio
/// and the Bluetooth stack can resample dynamically. Falling back to the built-in
/// microphone provides a fixed input rate for reliable mixing.
///
/// The output device follows a different rule: ScreenCaptureKit captures the
/// active output's digital stream before Bluetooth encoding. Replacing a
/// Bluetooth output with the built-in speaker would move capture away from the
/// stream the user is actually hearing.
///
/// # Returns
///
/// Tuple of (microphone, system_audio) where:
/// - Some(device) = Device found and safe for recording
/// - None = No device available (non-fatal, recording can continue with single source)
///
/// # Example
///
/// ```no_run
/// use app_lib::audio::devices::fallback::get_safe_recording_devices_macos;
///
/// fn main() -> anyhow::Result<()> {
///     let (microphone, system_audio) = get_safe_recording_devices_macos()?;
///     println!(
///         "microphone available: {}, system audio available: {}",
///         microphone.is_some(),
///         system_audio.is_some(),
///     );
///     Ok(())
/// }
/// ```
#[cfg(target_os = "macos")]
pub fn get_safe_recording_devices_macos() -> Result<(Option<AudioDevice>, Option<AudioDevice>)> {
    info!("🔍 [macOS] Selecting recording devices with Bluetooth detection...");

    // Step 1: Get system defaults
    let default_mic = default_input_device().ok();
    let default_speaker = default_output_device().ok();

    // Step 2: Process microphone with Bluetooth override
    let final_mic = if let Some(ref mic) = default_mic {
        // Detect if microphone is Bluetooth
        // Use placeholder buffer_size/sample_rate (detection uses name + Core Audio API primarily)
        let device_kind = InputDeviceKind::detect(&mic.name, 512, 48000);

        if device_kind.is_bluetooth() {
            warn!("🎧 Bluetooth microphone detected: '{}'", mic.name);
            warn!("   Bluetooth introduces variable sample rates with Core Audio");

            // Try to find built-in microphone as fallback
            match find_builtin_input_device()? {
                Some(builtin_mic) => {
                    info!(
                        "→ ✅ Overriding to stable built-in microphone: '{}'",
                        builtin_mic.name
                    );
                    info!("   Built-in provides consistent sample rates for reliable mixing");
                    Some(builtin_mic)
                }
                None => {
                    warn!("→ ⚠️ No built-in microphone found - using Bluetooth anyway");
                    warn!("   Recording may experience sample rate sync issues");
                    warn!("   Consider using wired microphone for better stability");
                    Some(mic.clone())
                }
            }
        } else {
            // Not Bluetooth - use as-is
            info!(
                "✅ Using wired/built-in microphone: '{}' (device type: {:?})",
                mic.name, device_kind
            );
            Some(mic.clone())
        }
    } else {
        warn!("⚠️ No default microphone found");
        None
    };

    // Step 3: Process speaker/system audio - KEEP AS-IS (macOS-specific behavior)
    // CRITICAL: On macOS, ScreenCaptureKit captures the digital audio stream being
    // sent to the output device BEFORE Bluetooth encoding happens. This means:
    // - If user has Bluetooth AirPods, audio is actively playing through them
    // - ScreenCaptureKit captures from that active output stream (pristine quality)
    // - We MUST keep the Bluetooth speaker as the system device so ScreenCaptureKit
    //   captures from where the audio is actually going
    //
    // If we override to built-in speakers when user is playing through Bluetooth,
    // ScreenCaptureKit will try to capture from built-in, but NO AUDIO IS THERE!
    let final_speaker = if let Some(ref speaker) = default_speaker {
        let device_kind = InputDeviceKind::detect(&speaker.name, 512, 48000);

        if device_kind.is_bluetooth() {
            warn!("🔊 Bluetooth speaker detected: '{}'", speaker.name);
            info!("   macOS: ScreenCaptureKit captures digital stream BEFORE Bluetooth encoding");
            info!("   Keeping Bluetooth speaker - captures from active output (pristine quality)");
            Some(speaker.clone())
        } else {
            info!(
                "✅ Using wired/built-in speaker: '{}' (device type: {:?})",
                speaker.name, device_kind
            );
            Some(speaker.clone())
        }
    } else {
        warn!("⚠️ No default speaker found - system audio will not be recorded");
        None
    };

    // Summary logging
    match (&final_mic, &final_speaker) {
        (Some(mic), Some(speaker)) => {
            info!("📋 [macOS] Recording device selection complete:");
            info!("   Microphone: '{}'", mic.name);
            info!("   System Audio: '{}' (via ScreenCaptureKit)", speaker.name);
        }
        (Some(mic), None) => {
            info!("📋 [macOS] Recording device selection complete:");
            info!("   Microphone: '{}' (system audio unavailable)", mic.name);
        }
        (None, Some(speaker)) => {
            warn!("📋 [macOS] Recording device selection complete:");
            warn!(
                "   System Audio: '{}' (microphone unavailable)",
                speaker.name
            );
        }
        (None, None) => {
            warn!("❌ No recording devices available - cannot start recording");
        }
    }

    Ok((final_mic, final_speaker))
}

// Non-macOS platforms: Just use system defaults (no Bluetooth override needed)
#[cfg(not(target_os = "macos"))]
pub fn get_safe_recording_devices() -> Result<(Option<AudioDevice>, Option<AudioDevice>)> {
    info!("🔍 Selecting default recording devices (no Bluetooth override on this platform)");

    let mic = default_input_device().ok();
    let speaker = default_output_device().ok();

    Ok((mic, speaker))
}
