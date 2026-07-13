"use client";

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { ArrowPathIcon, CheckIcon, DocumentDuplicateIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Analytics from '@/lib/analytics';

interface SummaryUpdaterButtonGroupProps {
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => Promise<void>;
  onCopy: () => Promise<void>;
  onFind?: () => void;
  onOpenFolder: () => Promise<void>;
  hasSummary: boolean;
}

export function SummaryUpdaterButtonGroup({
  isSaving,
  isDirty,
  onSave,
  onCopy,
  onFind,
  onOpenFolder,
  hasSummary
}: SummaryUpdaterButtonGroupProps) {
  return (
    <ButtonGroup>
      {/* Save button */}
      <Button
        variant="outline"
        size="sm"
        className={isDirty ? 'border-accent/30 bg-[hsl(var(--accent-soft))] hover:bg-[hsl(var(--accent-soft))]' : ''}
        title={isSaving ? "Saving" : "Save Changes"}
        onClick={() => {
          Analytics.trackButtonClick('save_changes', 'meeting_details');
          onSave();
        }}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <ArrowPathIcon className="size-4 animate-spin" aria-hidden="true" />
            <span className="hidden 2xl:inline">Saving...</span>
          </>
        ) : (
          <>
            <CheckIcon className="size-4" aria-hidden="true" />
            <span className="hidden 2xl:inline">Save</span>
          </>
        )}
      </Button>

      {/* Copy button */}
      <Button
        variant="outline"
        size="sm"
        title="Copy Summary"
        onClick={() => {
          Analytics.trackButtonClick('copy_summary', 'meeting_details');
          onCopy();
        }}
        disabled={!hasSummary}
        className="cursor-pointer"
      >
        <DocumentDuplicateIcon className="size-4" aria-hidden="true" />
        <span className="hidden 2xl:inline">Copy</span>
      </Button>

      {/* Find button */}
      {/* {onFind && (
        <Button
          variant="outline"
          size="sm"
          title="Find in Summary"
          onClick={() => {
            Analytics.trackButtonClick('find_in_summary', 'meeting_details');
            onFind();
          }}
          disabled={!hasSummary}
          className="cursor-pointer"
        >
          <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
          <span className="hidden lg:inline">Find</span>
        </Button>
      )} */}
    </ButtonGroup>
  );
}
