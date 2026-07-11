import { useCallback } from 'react';
import { invoke as invokeTauri } from '@tauri-apps/api/core';
import { toast } from 'sonner';

interface UseMeetingOperationsProps {
  meeting: any;
}

export function useMeetingOperations({
  meeting,
}: UseMeetingOperationsProps) {

  // Open meeting folder in file explorer
  const handleOpenMeetingFolder = useCallback(async () => {
    try {
      await invokeTauri('open_meeting_folder', { meetingId: meeting.id });
    } catch (error) {
      console.error('Failed to open meeting folder:', error);
      toast.error(error as string || 'Failed to open recording folder');
    }
  }, [meeting.id]);

  const handleExportMeeting = useCallback(async () => {
    try {
      const result = await invokeTauri<{ saved: boolean }>('api_export_meeting_locally', { meetingId: meeting.id });
      if (result.saved) toast.success('Meeting exported locally');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export local meeting');
    }
  }, [meeting.id]);

  return {
    handleOpenMeetingFolder,
    handleExportMeeting,
  };
}
