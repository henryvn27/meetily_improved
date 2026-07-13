import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { FolderOpenIcon } from '@heroicons/react/24/outline';
import { invoke } from '@tauri-apps/api/core';
import { DeviceSelection, SelectedDevices } from '@/components/DeviceSelection';
import Analytics from '@/lib/analytics';
import { toast } from 'sonner';

export interface RecordingPreferences {
  save_folder: string;
  auto_save: boolean;
  file_format: string;
  preferred_mic_device: string | null;
  preferred_system_device: string | null;
}

interface RecordingSettingsProps {
  onSave?: (preferences: RecordingPreferences) => void;
}

export function RecordingSettings({ onSave }: RecordingSettingsProps) {
  const [preferences, setPreferences] = useState<RecordingPreferences>({
    save_folder: '',
    auto_save: true,
    file_format: 'mp4',
    preferred_mic_device: null,
    preferred_system_device: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRecordingNotification, setShowRecordingNotification] = useState(true);

  // Load recording preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await invoke<RecordingPreferences>('get_recording_preferences');
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load recording preferences:', error);
        // If loading fails, get default folder path
        try {
          const defaultPath = await invoke<string>('get_default_recordings_folder_path');
          setPreferences(prev => ({ ...prev, save_folder: defaultPath }));
        } catch (defaultError) {
          console.error('Failed to get default folder path:', defaultError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Load recording notification preference
  useEffect(() => {
    const loadNotificationPref = async () => {
      try {
        const { Store } = await import('@tauri-apps/plugin-store');
        const store = await Store.load('preferences.json');
        const show = await store.get<boolean>('show_recording_notification') ?? true;
        setShowRecordingNotification(show);
      } catch (error) {
        console.error('Failed to load notification preference:', error);
      }
    };
    loadNotificationPref();
  }, []);

  const handleAutoSaveToggle = async (enabled: boolean) => {
    const newPreferences = { ...preferences, auto_save: enabled };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);

    // Track auto-save setting change
    await Analytics.track('auto_save_recording_toggled', {
      enabled: enabled.toString()
    });
  };

  const handleDeviceChange = async (devices: SelectedDevices) => {
    const newPreferences = {
      ...preferences,
      preferred_mic_device: devices.micDevice,
      preferred_system_device: devices.systemDevice
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);

    // Track default device preference changes
    // Note: Individual device selection analytics are tracked in DeviceSelection component
    await Analytics.track('default_devices_changed', {
      has_preferred_microphone: (!!devices.micDevice).toString(),
      has_preferred_system_audio: (!!devices.systemDevice).toString()
    });
  };

  const handleOpenFolder = async () => {
    try {
      await invoke('open_recordings_folder');
    } catch (error) {
      console.error('Failed to open recordings folder:', error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      setShowRecordingNotification(enabled);
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('preferences.json');
      await store.set('show_recording_notification', enabled);
      await store.save();
      toast.success('Preference saved');
      await Analytics.track('recording_notification_preference_changed', {
        enabled: enabled.toString()
      });
    } catch (error) {
      console.error('Failed to save notification preference:', error);
      toast.error('Failed to save preference');
    }
  };

  const savePreferences = async (prefs: RecordingPreferences) => {
    setSaving(true);
    try {
      await invoke('set_recording_preferences', { preferences: prefs });
      onSave?.(prefs);

      // Show success toast with device details
      const micDevice = prefs.preferred_mic_device || 'Default';
      const systemDevice = prefs.preferred_system_device || 'Default';
      toast.success("Device preferences saved", {
        description: `Microphone: ${micDevice}, System Audio: ${systemDevice}`
      });
    } catch (error) {
      console.error('Failed to save recording preferences:', error);
      toast.error("Failed to save device preferences", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-4 h-4 w-1/4 rounded-[2px] bg-muted"></div>
        <div className="mb-4 h-8 rounded-[2px] bg-muted"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <p className="app-eyebrow mb-2">Capture defaults</p>
        <h3 className="text-lg font-semibold tracking-[-0.03em]">Recording settings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure how your audio recordings are saved during meetings.
        </p>
      </div>

      {/* Auto Save Toggle */}
      <div className="settings-card flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium">Save Audio Recordings</div>
          <div className="text-sm text-muted-foreground">
            Automatically save audio files when recording stops
          </div>
        </div>
        <Switch
          checked={preferences.auto_save}
          onCheckedChange={handleAutoSaveToggle}
          disabled={saving}
        />
      </div>

      {/* Folder Location - Only shown when auto_save is enabled */}
      {preferences.auto_save && (
        <div className="space-y-4">
          <div className="settings-inset">
            <div className="font-medium mb-2">Save Location</div>
            <div className="mb-3 break-all text-sm text-muted-foreground">
              {preferences.save_folder || 'Default folder'}
            </div>
            <button
              onClick={handleOpenFolder}
              className="flex items-center gap-2 rounded-[3px] border border-input bg-card px-3 py-2 text-sm transition-colors hover:bg-secondary"
            >
              <FolderOpenIcon className="h-4 w-4" />
              Open Folder
            </button>
          </div>

          <div className="rounded-[3px] border border-accent/25 bg-[hsl(var(--accent-soft))] p-4">
            <div className="text-sm text-foreground">
              <strong>File Format:</strong> {preferences.file_format.toUpperCase()} files
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Recordings are saved with timestamp: recording_YYYYMMDD_HHMMSS.{preferences.file_format}
            </div>
          </div>
        </div>
      )}

      {/* Info when auto_save is disabled */}
      {!preferences.auto_save && (
        <div className="rounded-[3px] border border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning)/0.08)] p-4">
          <div className="text-sm text-[hsl(var(--warning))]">
            Audio recording is disabled. Enable &quot;Save Audio Recordings&quot; to automatically save your meeting audio.
          </div>
        </div>
      )}

      {/* Recording Notification Toggle */}
      <div className="settings-card flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium">Recording Start Notification</div>
          <div className="text-sm text-muted-foreground">
            Show reminder to inform participants when recording starts
          </div>
        </div>
        <Switch
          checked={showRecordingNotification}
          onCheckedChange={handleNotificationToggle}
        />
      </div>

      {/* Device Preferences */}
      <div className="space-y-4">
        <div className="border-t border-border pt-6">
          <h4 className="mb-2 text-base font-medium">Default audio devices</h4>
          <p className="mb-4 text-sm text-muted-foreground">
            Set your preferred microphone and system audio devices for recording. These will be automatically selected when starting new recordings.
          </p>

          <div className="settings-inset">
            <DeviceSelection
              selectedDevices={{
                micDevice: preferences.preferred_mic_device,
                systemDevice: preferences.preferred_system_device
              }}
              onDeviceChange={handleDeviceChange}
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
