/**
 * Browser-mode WDIO loads after the document is ready. This test-only bootstrap
 * supplies deterministic empty local state during React's first effects so the
 * real application shell can mount before the service installs its mock bridge.
 * NEXT_PUBLIC_MEETILY_BROWSER_QA is absent from release builds, allowing this
 * whole branch to be eliminated by Next.js.
 */
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MEETILY_BROWSER_QA === 'true') {
  type TauriInternals = {
    callbacks: Map<number, (payload: unknown) => void>;
    invoke: (command: string, args?: unknown) => Promise<unknown>;
    transformCallback: (callback?: (payload: unknown) => void) => number;
    unregisterCallback: (id: number) => void;
    runCallback: (id: number, payload: unknown) => void;
  };

  const globalWindow = window as typeof window & { __TAURI_INTERNALS__?: TauriInternals };
  let callbackId = 0;
  const callbacks = new Map<number, (payload: unknown) => void>();

  const emptyLists = new Set([
    'api_get_all_meetings',
    'api_get_meetings',
    'builtin_ai_list_models',
    'get_available_audio_backends',
    'get_recording_devices',
    'list_audio_devices',
    'list_system_audio_devices_command',
  ]);
  const falseValues = new Set([
    'check_first_launch',
    'get_menu_bar_enabled',
    'is_import_in_progress_command',
    'is_retranscription_in_progress_command',
  ]);

  globalWindow.__TAURI_INTERNALS__ = {
    callbacks,
    invoke: async (command) => {
      if (emptyLists.has(command)) return [];
      if (falseValues.has(command)) return false;
      if (command === 'get_onboarding_status') {
        return {
          version: '1.0',
          completed: true,
          current_step: 4,
          model_status: {
            parakeet: 'not_downloaded',
            summary: 'not_downloaded',
          },
          last_updated: '1970-01-01T00:00:00.000Z',
        };
      }
      if (command === 'builtin_ai_get_recommended_model') return '';
      if (command === 'builtin_ai_is_model_ready') return false;
      if (command === 'get_current_audio_backend') return 'default';
      return null;
    },
    transformCallback: (callback) => {
      callbackId += 1;
      if (callback) callbacks.set(callbackId, callback);
      return callbackId;
    },
    unregisterCallback: (id) => callbacks.delete(id),
    runCallback: (id, payload) => callbacks.get(id)?.(payload),
  };
}

export {};
