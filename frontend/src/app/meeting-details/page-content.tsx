"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MeetingDetails, MeetingSummary, SummaryResponse, TranscriptSegmentData } from '@/types';
import { useSidebar } from '@/components/Sidebar/SidebarProvider';
import Analytics from '@/lib/analytics';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { TranscriptPanel } from '@/components/MeetingDetails/TranscriptPanel';
import { SummaryPanel } from '@/components/MeetingDetails/SummaryPanel';
import { ModelConfig } from '@/components/ModelSettingsModal';

// Custom hooks
import { useMeetingData } from '@/hooks/meeting-details/useMeetingData';
import { useSummaryGeneration } from '@/hooks/meeting-details/useSummaryGeneration';
import { useTemplates } from '@/hooks/meeting-details/useTemplates';
import { useCopyOperations } from '@/hooks/meeting-details/useCopyOperations';
import { useMeetingOperations } from '@/hooks/meeting-details/useMeetingOperations';
import { useConfig } from '@/contexts/ConfigContext';
import { Button } from '@/components/ui/button';
import { ViewColumnsIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function PageContent({
  meeting,
  summaryData,
  shouldAutoGenerate = false,
  onAutoGenerateComplete,
  onMeetingUpdated,
  onRefetchTranscripts,
  // Pagination props for efficient transcript loading
  segments,
  hasMore,
  isLoadingMore,
  totalCount,
  loadedCount,
  onLoadMore,
}: {
  meeting: MeetingDetails;
  summaryData: MeetingSummary | null;
  shouldAutoGenerate?: boolean;
  onAutoGenerateComplete?: () => void;
  onMeetingUpdated?: () => Promise<void>;
  onRefetchTranscripts?: () => Promise<void>;
  // Pagination props
  segments?: TranscriptSegmentData[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
  loadedCount?: number;
  onLoadMore?: () => void;
}) {
  console.log('📄 PAGE CONTENT: Initializing with data:', {
    meetingId: meeting.id,
    summaryDataKeys: summaryData ? Object.keys(summaryData) : null,
    transcriptsCount: meeting.transcripts?.length
  });

  // State
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isRecording] = useState(false);
  const [summaryResponse] = useState<SummaryResponse | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  useEffect(() => {
    if (!isInspectorOpen) return;

    const closeInspectorOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInspectorOpen(false);
      }
    };

    window.addEventListener('keydown', closeInspectorOnEscape);
    return () => window.removeEventListener('keydown', closeInspectorOnEscape);
  }, [isInspectorOpen]);

  // Ref to store the modal open function from SummaryGeneratorButtonGroup
  const openModelSettingsRef = useRef<(() => void) | null>(null);

  // Sidebar context
  useSidebar();

  // Get model config from ConfigContext
  const { modelConfig, setModelConfig } = useConfig();

  // Custom hooks
  const meetingData = useMeetingData({ meeting, summaryData, onMeetingUpdated });
  const templates = useTemplates();

  // Callback to register the modal open function
  const handleRegisterModalOpen = useCallback((openFn: () => void) => {
    console.log('📝 Registering modal open function in PageContent');
    openModelSettingsRef.current = openFn;
  }, []);

  // Callback to trigger modal open (called from error handler)
  const handleOpenModelSettings = useCallback(() => {
    console.log('🔔 Opening model settings from PageContent');
    if (openModelSettingsRef.current) {
      openModelSettingsRef.current();
    } else {
      console.warn('⚠️ Modal open function not yet registered');
    }
  }, []);

  // Save model config to backend database and sync via event
  const handleSaveModelConfig = useCallback(async (config?: ModelConfig) => {
    if (!config) return;
    try {
      await invoke('api_save_model_config', {
        provider: config.provider,
        model: config.model,
        whisperModel: config.whisperModel,
        apiKey: config.apiKey ?? null,
        ollamaEndpoint: config.ollamaEndpoint ?? null,
      });

      // Emit event so ConfigContext and other listeners stay in sync
      const { emit } = await import('@tauri-apps/api/event');
      await emit('model-config-updated', config);

      toast.success('Model settings saved successfully');
    } catch (error) {
      console.error('Failed to save model config:', error);
      toast.error('Failed to save model settings');
    }
  }, []);

  const summaryGeneration = useSummaryGeneration({
    meeting,
    transcripts: meetingData.transcripts,
    modelConfig: modelConfig,
    isModelConfigLoading: false, // ConfigContext loads on mount
    selectedTemplate: templates.selectedTemplate,
    onMeetingUpdated,
    updateMeetingTitle: meetingData.updateMeetingTitle,
    setAiSummary: meetingData.setAiSummary,
    onOpenModelSettings: handleOpenModelSettings,
  });

  const copyOperations = useCopyOperations({
    meeting,
    transcripts: meetingData.transcripts,
    meetingTitle: meetingData.meetingTitle,
    aiSummary: meetingData.aiSummary,
    blockNoteSummaryRef: meetingData.blockNoteSummaryRef,
  });

  const meetingOperations = useMeetingOperations({
    meeting,
  });

  // Track page view
  useEffect(() => {
    Analytics.trackPageView('meeting_details');
  }, []);

  const hasTranscripts = meetingData.transcripts.length > 0;
  const autoGenerateAttemptRef = useRef<string | null>(null);
  const autoGenerateActionsRef = useRef({
    generate: summaryGeneration.handleGenerateSummary,
    complete: onAutoGenerateComplete,
    provider: modelConfig.provider,
    model: modelConfig.model,
  });

  useEffect(() => {
    autoGenerateActionsRef.current = {
      generate: summaryGeneration.handleGenerateSummary,
      complete: onAutoGenerateComplete,
      provider: modelConfig.provider,
      model: modelConfig.model,
    };
  }, [
    summaryGeneration.handleGenerateSummary,
    onAutoGenerateComplete,
    modelConfig.provider,
    modelConfig.model,
  ]);

  // Auto-generate once the selected meeting has a saved transcript.
  useEffect(() => {
    if (!shouldAutoGenerate) {
      autoGenerateAttemptRef.current = null;
      return;
    }

    if (!hasTranscripts || autoGenerateAttemptRef.current === meeting.id) return;

    let cancelled = false;
    autoGenerateAttemptRef.current = meeting.id;

    const autoGenerate = async () => {
      const actions = autoGenerateActionsRef.current;
      console.log(`🤖 Auto-generating summary with ${actions.provider}/${actions.model}...`);
      await actions.generate('');

      // Notify the route only while this meeting is still mounted.
      if (!cancelled) {
        actions.complete?.();
      }
    };

    void autoGenerate();

    // Cleanup: cancel if component unmounts or meeting changes
    return () => {
      cancelled = true;
    };
  }, [shouldAutoGenerate, meeting.id, hasTranscripts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex h-full flex-col bg-background"
    >
      <div className="flex flex-1 overflow-hidden">
        <SummaryPanel
          meeting={meeting}
          meetingTitle={meetingData.meetingTitle}
          onTitleChange={meetingData.handleTitleChange}
          isEditingTitle={meetingData.isEditingTitle}
          onStartEditTitle={() => meetingData.setIsEditingTitle(true)}
          onFinishEditTitle={async () => {
            if (!meetingData.isTitleDirty || await meetingData.handleSaveMeetingTitle()) {
              meetingData.setIsEditingTitle(false);
            }
          }}
          isTitleDirty={meetingData.isTitleDirty}
          summaryRef={meetingData.blockNoteSummaryRef}
          isSaving={meetingData.isSaving}
          onSaveAll={meetingData.saveAllChanges}
          onCopySummary={copyOperations.handleCopySummary}
          onOpenFolder={meetingOperations.handleOpenMeetingFolder}
          aiSummary={meetingData.aiSummary}
          summaryStatus={summaryGeneration.summaryStatus}
          transcripts={meetingData.transcripts}
          modelConfig={modelConfig}
          setModelConfig={setModelConfig}
          onSaveModelConfig={handleSaveModelConfig}
          onGenerateSummary={summaryGeneration.handleGenerateSummary}
          onStopGeneration={summaryGeneration.handleStopGeneration}
          customPrompt={customPrompt}
          onPromptChange={setCustomPrompt}
          summaryResponse={summaryResponse}
          onSaveSummary={meetingData.handleSaveSummary}
          onSummaryChange={meetingData.handleSummaryChange}
          onDirtyChange={meetingData.setIsSummaryDirty}
          summaryError={summaryGeneration.summaryError}
          onRegenerateSummary={summaryGeneration.handleRegenerateSummary}
          getSummaryStatusMessage={summaryGeneration.getSummaryStatusMessage}
          availableTemplates={templates.availableTemplates}
          selectedTemplate={templates.selectedTemplate}
          onTemplateSelect={templates.handleTemplateSelection}
          isModelConfigLoading={false}
          onOpenModelSettings={handleRegisterModalOpen}
          inspectorControl={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 xl:hidden"
              onClick={() => setIsInspectorOpen(true)}
            >
              <ViewColumnsIcon className="size-4" aria-hidden="true" />
              Transcript
            </Button>
          }
        />
        <TranscriptPanel
          transcripts={meetingData.transcripts}
          onCopyTranscript={copyOperations.handleCopyTranscript}
          onOpenMeetingFolder={meetingOperations.handleOpenMeetingFolder}
          onExportMeeting={meetingOperations.handleExportMeeting}
          isRecording={isRecording}
          disableAutoScroll={true}
          usePagination={true}
          segments={segments}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
          onLoadMore={onLoadMore}
          hasSavedSummary={summaryData !== null}
          meetingId={meeting.id}
          meetingFolderPath={meeting.folder_path}
          onRefetchTranscripts={onRefetchTranscripts}
          transcriptionModel={modelConfig.whisperModel}
          onCloseInspector={() => setIsInspectorOpen(false)}
          className={cn(
            'fixed inset-y-12 right-0 z-40 w-[min(28rem,100vw)] shadow-[-16px_0_32px_hsl(var(--foreground)/0.12)]',
            'xl:static xl:z-auto xl:w-[22rem] xl:shadow-none',
            isInspectorOpen ? 'flex' : 'hidden xl:flex',
          )}
        />
      </div>
    </motion.div>
  );
}
