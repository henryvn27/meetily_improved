"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { ArrowDownTrayIcon, ArrowPathIcon, DocumentDuplicateIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import Analytics from '@/lib/analytics';
import { RetranscribeDialog } from './RetranscribeDialog';
import { useConfig } from '@/contexts/ConfigContext';


interface TranscriptButtonGroupProps {
  transcriptCount: number;
  onCopyTranscript: () => void;
  onOpenMeetingFolder: () => Promise<void>;
  onExportMeeting: () => Promise<void>;
  meetingId?: string;
  meetingFolderPath?: string | null;
  onRefetchTranscripts?: () => Promise<void>;
}


export function TranscriptButtonGroup({
  transcriptCount,
  onCopyTranscript,
  onOpenMeetingFolder,
  onExportMeeting,
  meetingId,
  meetingFolderPath,
  onRefetchTranscripts,
}: TranscriptButtonGroupProps) {
  const { betaFeatures } = useConfig();
  const [showRetranscribeDialog, setShowRetranscribeDialog] = useState(false);

  const handleRetranscribeComplete = useCallback(async () => {
    // Refetch transcripts to show the updated data
    if (onRefetchTranscripts) {
      await onRefetchTranscripts();
    }
  }, [onRefetchTranscripts]);

  return (
    <div className="flex w-full items-center gap-2">
      <ButtonGroup>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => {
            Analytics.trackButtonClick('copy_transcript', 'meeting_details');
            onCopyTranscript();
          }}
          disabled={transcriptCount === 0}
          title={transcriptCount === 0 ? 'No transcript available' : 'Copy Transcript'}
          aria-label="Copy transcript"
        >
          <DocumentDuplicateIcon className="size-4" aria-hidden="true" />
        </Button>

        <Button size="icon" className="size-8" variant="outline" onClick={onExportMeeting} title="Export local meeting as Markdown" aria-label="Export meeting">
          <ArrowDownTrayIcon className="size-[18px]" aria-hidden="true" />
        </Button>

        <Button
          size="icon"
          variant="outline"
          className="size-8"
          onClick={() => {
            Analytics.trackButtonClick('open_recording_folder', 'meeting_details');
            onOpenMeetingFolder();
          }}
          title="Open Recording Folder"
          aria-label="Open recording folder"
        >
          <FolderOpenIcon className="size-[18px]" aria-hidden="true" />
        </Button>

        {betaFeatures.importAndRetranscribe && meetingId && meetingFolderPath && (
          <Button
            size="icon"
            variant="outline"
            className="size-8 border-accent/30 bg-[hsl(var(--accent-soft))] hover:bg-[hsl(var(--accent-soft))]"
            onClick={() => {
              Analytics.trackButtonClick('enhance_transcript', 'meeting_details');
              setShowRetranscribeDialog(true);
            }}
            title="Retranscribe to enhance your recorded audio"
            aria-label="Enhance transcript"
          >
            <ArrowPathIcon className="size-[18px]" aria-hidden="true" />
          </Button>
        )}
      </ButtonGroup>

      {betaFeatures.importAndRetranscribe && meetingId && meetingFolderPath && (
        <RetranscribeDialog
          open={showRetranscribeDialog}
          onOpenChange={setShowRetranscribeDialog}
          meetingId={meetingId}
          meetingFolderPath={meetingFolderPath}
          onComplete={handleRetranscribeComplete}
        />
      )}
    </div>
  );
}
