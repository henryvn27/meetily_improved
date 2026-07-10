'use client';

import { ArrowRight, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppState } from '@/components/app-shell/AppState';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Surface } from '@/components/app-shell/Surface';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/Sidebar/SidebarProvider';

export default function MeetingsPage() {
  const router = useRouter();
  const { meetings } = useSidebar();

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Library"
        title="Saved meetings"
        description="Meetings stored in your existing local Meetily database."
        actions={<Button onClick={() => router.push('/new-meeting')}><Mic />New meeting</Button>}
      />
      <section aria-label="Saved meeting list" className="mt-8">
        {meetings.length === 0 ? (
          <AppState
            kind="empty"
            title="Nothing saved yet"
            description="Complete a recording or import audio to create your first saved meeting."
            action={<Button onClick={() => router.push('/new-meeting')}>Open recorder</Button>}
          />
        ) : (
          <Surface className="divide-y divide-border/70 overflow-hidden p-0">
            {meetings.map((meeting) => (
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
