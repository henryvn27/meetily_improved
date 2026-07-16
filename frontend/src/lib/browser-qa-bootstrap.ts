export type TauriInternals = {
  callbacks: Map<number, (payload: unknown) => void>;
  invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
  transformCallback: (callback?: (payload: unknown) => void) => number;
  unregisterCallback: (id: number) => void;
  runCallback: (id: number, payload: unknown) => void;
};

type BrowserQaWindow = typeof window & {
  __TAURI_INTERNALS__?: TauriInternals;
  __TAURI_EVENT_PLUGIN_INTERNALS__?: {
    unregisterListener: (_event: string, eventId: number) => void;
  };
};

const emptyLists = new Set([
  'api_get_all_meetings',
  'api_get_meetings',
  'builtin_ai_list_models',
  'get_audio_backend_info',
  'get_available_audio_backends',
  'get_audio_devices',
  'get_ollama_models',
  'get_recording_devices',
  'get_transcript_history',
  'list_audio_devices',
  'list_system_audio_devices_command',
  'parakeet_get_available_models',
  'whisper_get_available_models',
]);

const falseValues = new Set([
  'check_first_launch',
  'get_menu_bar_enabled',
  'is_import_in_progress_command',
  'is_recording',
  'is_retranscription_in_progress_command',
]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export function installBrowserQaBootstrap() {
  if (typeof window === 'undefined') return;

  const globalWindow = window as BrowserQaWindow;
  let callbackId = 0;
  let eventId = 0;
  let resourceId = 0;
  const callbacks = new Map<number, (payload: unknown) => void>();
  const listeners = new Set<number>();
  const storeIds = new Map<string, number>();
  const stores = new Map<number, Map<string, unknown>>();

  globalWindow.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
    unregisterListener: (_event, id) => listeners.delete(id),
  };

  globalWindow.__TAURI_INTERNALS__ = {
    callbacks,
    invoke: async (command, args = {}) => {
      if (command === 'plugin:event|listen') {
        eventId += 1;
        listeners.add(eventId);
        return eventId;
      }
      if (command === 'plugin:event|unlisten') return null;

      if (command === 'plugin:store|load') {
        const path = String(args.path ?? '');
        const existing = storeIds.get(path);
        if (existing) return existing;

        resourceId += 1;
        const defaults = record(record(args.options).defaults);
        storeIds.set(path, resourceId);
        stores.set(resourceId, new Map(Object.entries(defaults)));
        return resourceId;
      }
      if (command === 'plugin:store|get_store') return storeIds.get(String(args.path ?? '')) ?? null;

      const store = stores.get(Number(args.rid));
      const key = String(args.key ?? '');
      if (command === 'plugin:store|get') return [store?.get(key), store?.has(key) ?? false];
      if (command === 'plugin:store|has') return store?.has(key) ?? false;
      if (command === 'plugin:store|set') {
        store?.set(key, args.value);
        return null;
      }
      if (command === 'plugin:store|save') return null;

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
      if (command === 'get_recording_state') {
        return {
          is_recording: false,
          is_paused: false,
          is_active: false,
          recording_duration: null,
          active_duration: null,
        };
      }
      if (command === 'get_recording_preferences') {
        return {
          save_folder: '',
          auto_save: true,
          file_format: 'mp4',
          preferred_mic_device: null,
          preferred_system_device: null,
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

/**
 * Browser-mode WDIO loads after the document is ready. This test-only bootstrap
 * supplies deterministic empty local state during React's first effects so the
 * real application shell can mount before the service installs its mock bridge.
 * NEXT_PUBLIC_MEETILY_BROWSER_QA is absent from release builds, allowing this
 * whole branch to be eliminated by Next.js.
 */
if (process.env.NEXT_PUBLIC_MEETILY_BROWSER_QA === 'true') {
  installBrowserQaBootstrap();
}
