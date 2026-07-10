'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Bot, Mic, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppState } from '@/components/app-shell/AppState';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Surface } from '@/components/app-shell/Surface';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/contexts/ConfigContext';
import { useSidebar } from '@/components/Sidebar/SidebarProvider';
import { useTranscriptRecovery } from '@/hooks/useTranscriptRecovery';
import { TranscriptRecovery } from '@/components/TranscriptRecovery';
import { getLocalModelStatus } from '@/lib/local-model-status';
import { getAudioRecoveryDescription } from '@/lib/transcript-recovery';

export default function DashboardPage() {
  const router = useRouter();
  const { meetings, refetchMeetings } = useSidebar();
  const { modelConfig, models, error } = useConfig();
  const [showRecovery, setShowRecovery] = useState(false);
  const {
    recoverableMeetings,
    checkForRecoverableTranscripts,
    recoverMeeting,
    loadMeetingTranscripts,
    deleteRecoverableMeeting,
  } = useTranscriptRecovery();
  const recentMeetings = meetings.slice(0, 5);
  const localModelStatus = getLocalModelStatus({
    provider: modelConfig.provider,
    model: modelConfig.model,
    ollamaModelCount: models.length,
    ollamaError: error,
  });

  useEffect(() => {
    void checkForRecoverableTranscripts();
  }, [checkForRecoverableTranscripts]);

  const handleRecovery = async (meetingId: string) => {
    const result = await recoverMeeting(meetingId);
    await refetchMeetings();
    if (result.meetingId) {
      toast.success('Meeting recovered', { description: getAudioRecoveryDescription(result.audioRecoveryStatus?.status) });
      router.push(`/meeting-details?id=${result.meetingId}`);
    }
    return result;
  };

  return (
    <div className="app-page">
      <TranscriptRecovery
        isOpen={showRecovery}
        onClose={() => setShowRecovery(false)}
        recoverableMeetings={recoverableMeetings}
        onRecover={handleRecovery}
        onDelete={deleteRecoverableMeeting}
        onLoadPreview={loadMeetingTranscripts}
      />
      <PageHeader
        eyebrow="Local meeting workspace"
        title="Good morning"
        description="Capture a conversation, return to recent notes, or check your local model setup."
        actions={
          <Button onClick={() => router.push('/new-meeting')}>
            <Mic aria-hidden="true" />
            New meeting
          </Button>
        }
      />

      <section aria-labelledby="workspace-heading" className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Surface className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Start here</p>
              <h2 id="workspace-heading" className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Record without a meeting bot</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Audio, transcripts, and notes stay in Meetily&apos;s existing local workflow.
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Mic className="size-5" aria-hidden="true" />
            </span>
          </div>
          <Button className="mt-8" onClick={() => router.push('/new-meeting')}>
            Open recorder
            <ArrowRight aria-hidden="true" />
          </Button>
        </Surface>

        <Surface className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="size-4" aria-hidden="true" />
              Local model
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
              {localModelStatus.ready ? 'Ready' : 'Needs attention'}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {localModelStatus.description}
            </p>
          </div>
          <div className="mt-6 grid gap-2">
            <Button variant="outline" className="w-full" onClick={() => router.push('/settings')}>
              <Settings2 aria-hidden="true" />
              Review settings
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push('/chat')}>
              <Bot aria-hidden="true" />
              Ask meetings
            </Button>
          </div>
        </Surface>
      </section>

      {recoverableMeetings.length > 0 && (
        <AppState
          compact
          kind="recording"
          className="mt-4"
          title={`${recoverableMeetings.length} interrupted meeting${recoverableMeetings.length === 1 ? '' : 's'} found`}
          description="Review the real local checkpoint before it expires. Recovery preserves available transcript and audio data."
          action={<Button size="sm" variant="outline" onClick={() => setShowRecovery(true)}>Review recovery</Button>}
        />
      )}

      <section aria-labelledby="recent-heading" className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-base font-semibold">Recent meetings</h2>
          {meetings.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => router.push('/meetings')}>
              View all
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>

        {recentMeetings.length === 0 ? (
          <AppState
            kind="empty"
            title="No saved meetings yet"
            description="Your first completed recording will appear here. Meetily does not add sample meetings or fabricated activity."
            action={<Button onClick={() => router.push('/new-meeting')}>Start your first meeting</Button>}
          />
        ) : (
          <Surface className="divide-y divide-border/70 overflow-hidden p-0">
            {recentMeetings.map((meeting) => (
              <button
                key={meeting.id}
                type="button"
                onClick={() => router.push(`/meeting-details?id=${meeting.id}`)}
                className="group flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-[background,transform] hover:bg-secondary/70 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="min-w-0 truncate text-sm font-medium">{meeting.title}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            ))}
          </Surface>
        )}
      </section>
    </div>
  );
}
