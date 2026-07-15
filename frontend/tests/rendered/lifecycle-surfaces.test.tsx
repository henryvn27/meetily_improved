import axe from 'axe-core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppState } from '@/components/app-shell/AppState';
import { ConfirmationModal } from '@/components/ConfirmationModel/confirmation-modal';
import { RecordingConsentToast } from '@/lib/recordingNotification';
import { toast } from 'sonner';

const storeSet = vi.fn();
const storeSave = vi.fn();

vi.mock('@tauri-apps/plugin-store', () => ({
  Store: {
    load: vi.fn().mockResolvedValue({ set: storeSet, save: storeSave }),
  },
}));

vi.mock('@/lib/analytics', () => ({
  default: { trackButtonClick: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));

async function expectNoStructuralAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom cannot calculate rendered colors; real-browser E2E owns contrast.
      'color-contrast': { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe('lifecycle and utility surfaces', () => {
  beforeEach(() => {
    storeSet.mockResolvedValue(undefined);
    storeSave.mockResolvedValue(undefined);
  });

  it('announces loading and error states with the correct live semantics', async () => {
    const { container, rerender } = render(
      <AppState kind="loading" title="Loading meetings" description="Reading local meeting records." />,
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await expectNoStructuralAxeViolations(container);

    rerender(<AppState kind="error" title="Meetings unavailable" description="The local database could not be read." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Meetings unavailable');
    await expectNoStructuralAxeViolations(container);
  });

  it('persists the recording notice choice before dismissing the toast', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordingConsentToast toastId="recording-consent" />);

    await user.click(screen.getByRole('checkbox', { name: /Don't show this again/i }));
    await user.click(screen.getByRole('button', { name: /notified participants/i }));

    await waitFor(() => expect(storeSet).toHaveBeenCalledWith('show_recording_notification', false));
    expect(storeSave).toHaveBeenCalledTimes(1);
    expect(toast.dismiss).toHaveBeenCalledWith('recording-consent');
    await expectNoStructuralAxeViolations(container);
  });

  it('traps focus in destructive confirmation and cancels with Escape', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { container } = render(
      <ConfirmationModal
        isOpen
        text="Delete this meeting and its local data?"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    const dialog = await screen.findByRole('dialog', { name: /confirm delete/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    await expectNoStructuralAxeViolations(container);
  });
});
