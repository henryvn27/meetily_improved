import { toast } from 'sonner';
import Analytics from '@/lib/analytics';

/**
 * Shows the recording notification toast with compliance message.
 * Checks user preferences and displays a dismissible toast with:
 * - notice to inform participants
 * - "Don't show again" checkbox
 * - Acknowledgment button
 *
 * @returns Promise<void> - Resolves when notification is shown or skipped
 */
export async function showRecordingNotification(): Promise<void> {
  try {
    const { Store } = await import('@tauri-apps/plugin-store');
    const store = await Store.load('preferences.json');
    const showNotification = await store.get<boolean>('show_recording_notification') ?? true;

    if (showNotification) {
      let dontShowAgain = false;

      const toastId = toast.info('🔴 Recording Started', {
        description: (
          <div className="min-w-[280px] space-y-3 text-foreground">
            <p className="text-sm font-medium">
              Inform all participants this meeting is being recorded.
            </p>
            <label className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-xs text-muted-foreground transition-colors hover:bg-accent-soft">
              <input
                type="checkbox"
                onChange={(e) => {
                  dontShowAgain = e.target.checked;
                }}
                className="rounded border-input text-accent focus:ring-2 focus:ring-ring"
              />
              <span className="select-none">Don&apos;t show this again</span>
            </label>
            <button
              onClick={async () => {
                if (dontShowAgain) {
                  const { Store } = await import('@tauri-apps/plugin-store');
                  const store = await Store.load('preferences.json');
                  await store.set('show_recording_notification', false);
                  await store.save();
                }
                Analytics.trackButtonClick('recording_notification_acknowledged', 'toast');
                toast.dismiss(toastId);
              }}
              className="w-full rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:brightness-95"
            >
              I&apos;ve Notified Participants
            </button>
          </div>
        ),
        duration: 10000,
        position: 'bottom-right',
      });
    }
  } catch (notificationError) {
    console.error('Failed to show recording notification:', notificationError);
    // Don't fail the recording if notification fails
  }
}
