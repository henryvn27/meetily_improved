'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Bot, ChevronRight, Circle, Mic, Settings2 } from 'lucide-react';
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
        eyebrow="This device / meeting workbench"
        title="Work from what was said."
        description="Capture a conversation, keep the record local, then return to the decisions without a meeting bot in the call."
        actions={
          <Button onClick={() => router.push('/new-meeting')}>
            <Mic aria-hidden="true" />
            New meeting
          </Button>
        }
      />

      <section aria-labelledby="workspace-heading" className="mt-10">
        <Surface className="overflow-hidden rounded-[4px] p-0">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="p-7 sm:p-10">
              <div className="flex items-start gap-5">
                <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-[3px] bg-[hsl(var(--accent-soft))] text-accent">
                  <Mic className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="app-eyebrow">Capture</p>
                  <h2 id="workspace-heading" className="mt-2 text-[1.625rem] font-semibold leading-tight tracking-[-0.045em]">Start a meeting</h2>
                  <p className="mt-2 max-w-xl text-[0.9375rem] leading-6 text-muted-foreground">
                    Record system and microphone audio without adding a bot to the call.
                  </p>
                  <Button className="mt-7" onClick={() => router.push('/new-meeting')}>
                    Open recorder
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>

            <aside aria-label="Local model status" className="border-t border-border bg-secondary/55 p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-3">
                <div className="app-eyebrow flex items-center gap-2">
                  <Bot className="size-3.5" aria-hidden="true" />
                  Local model
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium">
                  <Circle className={`size-2 fill-current ${localModelStatus.ready ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`} aria-hidden="true" />
                  {localModelStatus.ready ? 'Ready' : 'Check setup'}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{localModelStatus.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                  <Settings2 aria-hidden="true" />
                  Settings
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push('/chat')}>
                  Ask notes
                </Button>
              </div>
            </aside>
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

      <section aria-labelledby="recent-heading" className="mt-12">
        <div className="mb-4 flex items-end justify-between border-b border-border pb-4">
          <div>
            <p className="app-eyebrow">Meeting ledger</p>
            <h2 id="recent-heading" className="mt-2 text-lg font-semibold tracking-[-0.03em]">Recent meetings</h2>
          </div>
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
          <div className="divide-y divide-border border-y border-border">
            {recentMeetings.map((meeting) => (
              <button
                key={meeting.id}
                type="button"
                onClick={() => router.push(`/meeting-details?id=${meeting.id}`)}
                className="group flex min-h-14 w-full items-center justify-between gap-4 px-1 py-3 text-left transition-[background,transform] hover:bg-card active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-card text-muted-foreground ring-1 ring-inset ring-border">
                    <Mic className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium">{meeting.title}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
