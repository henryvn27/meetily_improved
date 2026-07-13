import { toast } from 'sonner';
import { useState } from 'react';
import Analytics from '@/lib/analytics';

function RecordingConsentToast({ toastId }: { toastId: string | number }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const acknowledgeRecordingNotice = async () => {
    setIsAcknowledging(true);

    try {
      if (dontShowAgain) {
        const { Store } = await import('@tauri-apps/plugin-store');
        const store = await Store.load('preferences.json');
        await store.set('show_recording_notification', false);
        await store.save();
      }
    } catch (notificationError) {
      console.error('Failed to save recording notification preference:', notificationError);
    } finally {
      Analytics.trackButtonClick('recording_notification_acknowledged', 'toast');
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="w-[min(340px,calc(100vw-2rem))] rounded-[10px] border border-border bg-card p-4 text-card-foreground shadow-[0_24px_64px_hsl(var(--shadow-color)/0.18)]">
      <div className="flex gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent" aria-hidden="true">
          <span className="size-3.5 rounded-full bg-current" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold text-accent">Recording is live</p>
          <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">Let participants know</p>
          <p className="text-sm leading-5 text-muted-foreground">Tell everyone in the meeting that recording has started.</p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={dontShowAgain}
          disabled={isAcknowledging}
          onChange={(event) => setDontShowAgain(event.target.checked)}
          className="size-4 rounded border-input accent-[hsl(var(--accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed"
        />
        <span>Don&apos;t show this again</span>
      </label>

      <button
        type="button"
        onClick={acknowledgeRecordingNotice}
        disabled={isAcknowledging}
        className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-md bg-accent px-3 text-sm font-semibold text-accent-foreground transition-[background-color,transform] duration-200 hover:bg-accent/88 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-55"
      >
        {isAcknowledging ? 'Saving…' : 'I’ve notified participants'}
      </button>
    </div>
  );
}

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
      toast.custom((toastId) => <RecordingConsentToast toastId={toastId} />, {
        duration: 10000,
        position: 'bottom-right',
      });
    }
  } catch (notificationError) {
    console.error('Failed to show recording notification:', notificationError);
    // Don't fail the recording if notification fails
  }
}
