'use client';

import { Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppState } from '@/components/app-shell/AppState';
import { PageHeader } from '@/components/app-shell/PageHeader';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const router = useRouter();

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="All saved meetings"
        title="Ask meetings"
        description="A local-only question workspace is scheduled for Milestone 4."
      />
      <div className="mt-8">
        <AppState
          kind="model"
          title="Meeting recall is not available yet"
          description="This shell does not fabricate answers. Milestone 4 will connect saved local meeting context to an approved local-model bridge and show source meetings with each answer."
          action={<Button variant="outline" onClick={() => router.push('/settings')}><Settings2 />Review local model settings</Button>}
        />
      </div>
    </div>
  );
}
