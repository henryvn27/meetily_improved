import React from 'react';

interface ConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  text: string;
  isOpen: boolean;
}

export function ConfirmationModal({ onConfirm, onCancel, text, isOpen }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md border border-border bg-card p-6 shadow-[0_24px_80px_hsl(var(--shadow-color)/0.28)]">
        <h2 className="app-display mb-4 text-xl">Confirm Delete</h2>
        <p className="mb-6 text-muted-foreground">{text}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="rounded-[3px] px-4 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-[3px] bg-destructive px-4 py-2 text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
