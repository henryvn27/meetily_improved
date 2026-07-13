use anyhow::Result;
use cpal::traits::{DeviceTrait, HostTrait};
#[cfg(not(target_os = "macos"))]
use cpal::traits::StreamTrait;
#[cfg(not(target_os = "macos"))]
use log::error;

use super::configuration::{AudioDevice, DeviceType};
use super::platform;

/// List all available audio devices on the system
pub async fn list_audio_devices() -> Result<Vec<AudioDevice>> {
    let host = cpal::default_host();

    // Platform-specific device enumeration
    let mut devices = {
        #[cfg(target_os = "windows")]
        {
            platform::configure_windows_audio(&host)?
        }

        #[cfg(target_os = "linux")]
        {
            platform::configure_linux_audio(&host)?
        }

        #[cfg(target_os = "macos")]
        {
            platform::configure_macos_audio(&host)?
        }
    };

    // Add any additional devices from the default host
    if let Ok(other_devices) = host.devices() {
        for device in other_devices {
            if let Ok(name) = device.name() {
                if !devices.iter().any(|d| d.name == name) {
                    devices.push(AudioDevice::new(name, DeviceType::Output));
                }
            }
        }
    }

    Ok(devices)
}

/// Trigger audio permission request on platforms that require it.
///
/// On macOS, ask AVFoundation directly. Trying to create a CPAL stream before
/// authorization can block CoreAudio device discovery and prevent the native
/// permission sheet from appearing.
#[cfg(target_os = "macos")]
pub fn request_audio_permission_on_main(
    result_sender: tokio::sync::oneshot::Sender<Result<bool, String>>,
) {
    use cidre::av;
    use cidre::av::capture::{AuthorizationStatus, Device};
    use cidre::blocks::SendBlock;
    use log::info;

    let media_type = av::MediaType::audio();
    let status = Device::authorization_status_for_media_type(media_type)
        .map_err(|exception| format!("AVFoundation permission check failed: {exception:?}"));

    match status {
        Ok(AuthorizationStatus::Authorized) => {
            let _ = result_sender.send(Ok(true));
        }
        Ok(AuthorizationStatus::Denied | AuthorizationStatus::Restricted) => {
            let _ = result_sender.send(Ok(false));
        }
        Ok(AuthorizationStatus::NotDetermined) => {
            info!("[trigger_audio_permission] Requesting microphone access through AVFoundation");
            let sender = std::sync::Arc::new(std::sync::Mutex::new(Some(result_sender)));
            let completion_sender = sender.clone();
            let mut completion = SendBlock::new1(move |granted: bool| {
                if let Some(sender) = completion_sender
                    .lock()
                    .ok()
                    .and_then(|mut value| value.take())
                {
                    let _ = sender.send(Ok(granted));
                }
            });
            if let Err(exception) =
                Device::request_access_for_media_type_ch(media_type, &mut completion)
            {
                if let Some(sender) = sender.lock().ok().and_then(|mut value| value.take()) {
                    let _ = sender.send(Err(format!(
                        "AVFoundation permission request failed: {exception:?}"
                    )));
                }
            }
        }
        Err(error) => {
            let _ = result_sender.send(Err(error));
        }
    }
}

#[cfg(not(target_os = "macos"))]
pub fn trigger_audio_permission() -> Result<bool> {
    use log::info;

    let host = cpal::default_host();
    let device = match host.default_input_device() {
        Some(d) => d,
        None => {
            info!("[trigger_audio_permission] No default input device found - permission likely denied");
            return Ok(false);
        }
    };

    let config = match device.default_input_config() {
        Ok(c) => c,
        Err(e) => {
            info!("[trigger_audio_permission] Failed to get input config: {} - permission likely denied", e);
            return Ok(false);
        }
    };

    // Build and start an input stream to trigger the permission request
    let stream = match device.build_input_stream(
        &config.into(),
        |_data: &[f32], _: &cpal::InputCallbackInfo| {
            // Do nothing, we just want to trigger the permission request
        },
        |err| error!("Error in audio stream: {}", err),
        None,
    ) {
        Ok(s) => s,
        Err(e) => {
            info!("[trigger_audio_permission] Failed to build input stream: {} - permission likely denied", e);
            return Ok(false);
        }
    };

    // Start the stream to actually trigger the permission dialog
    if let Err(e) = stream.play() {
        info!("[trigger_audio_permission] Failed to play stream: {} - permission likely denied", e);
        return Ok(false);
    }

    // Sleep briefly to allow the permission dialog to appear and for stream to actually work
    std::thread::sleep(std::time::Duration::from_millis(500));

    // If we got here, permission was granted
    info!("[trigger_audio_permission] Stream played successfully - permission granted");

    // Stop the stream
    drop(stream);

    Ok(true)
}
