import { describe, expect, it } from 'vitest';
import { installBrowserQaBootstrap, type TauriInternals } from '@/lib/browser-qa-bootstrap';

describe('browser QA Tauri bootstrap', () => {
  it('provides deterministic empty store, event, and recording contracts', async () => {
    installBrowserQaBootstrap();
    const internals = window.__TAURI_INTERNALS__ as TauriInternals;

    const rid = await internals.invoke('plugin:store|load', {
      path: 'analytics.json',
      options: { defaults: { analyticsOptedIn: false } },
    });
    expect(await internals.invoke('plugin:store|get', { rid, key: 'analyticsOptedIn' }))
      .toEqual([false, true]);

    const listener = await internals.invoke('plugin:event|listen');
    expect(listener).toBeTypeOf('number');
    expect(() => window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener('recording-started', Number(listener)))
      .not.toThrow();

    expect(await internals.invoke('get_recording_state')).toEqual({
      is_recording: false,
      is_paused: false,
      is_active: false,
      recording_duration: null,
      active_duration: null,
    });
    expect(await internals.invoke('get_recording_preferences')).toEqual({
      save_folder: '',
      auto_save: true,
      file_format: 'mp4',
      preferred_mic_device: null,
      preferred_system_device: null,
    });
    expect(await internals.invoke('get_audio_backend_info')).toEqual([]);
    expect(await internals.invoke('get_ollama_models')).toEqual([]);
  });
});
