const responses = new Map([
  ['api_get_transcript_config', null],
  ['get_audio_devices', []],
  ['get_menu_bar_enabled', false],
  ['get_notification_settings', null],
  ['get_recording_preferences', {
    preferred_mic_device: null,
    preferred_system_device: null,
    recordings_folder_path: null,
  }],
  ['get_current_audio_backend', 'default'],
  ['get_available_audio_backends', []],
  ['builtin_ai_list_models', []],
  ['builtin_ai_get_recommended_model', ''],
  ['builtin_ai_is_model_ready', false],
  ['parakeet_has_available_models', false],
  ['parakeet_validate_model_ready', false],
  ['parakeet_init', null],
  ['parakeet_get_available_models', []],
  ['whisper_has_available_models', false],
  ['whisper_validate_model_ready', false],
  ['whisper_init', null],
  ['whisper_get_available_models', []],
  ['api_get_model_config', null],
  ['get_ollama_models', []],
  ['get_database_directory', ''],
  ['whisper_get_models_directory', ''],
  ['get_default_recordings_folder_path', ''],
]);

export async function installEmptyBackendMocks(browser) {
  for (const [command, value] of responses) {
    const mock = await browser.tauri.mock(command);
    await mock.mockResolvedValue(value);
  }
}
