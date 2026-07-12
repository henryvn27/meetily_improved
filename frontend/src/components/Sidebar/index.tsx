'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ConfirmationModel/confirmation-modal';
import Logo from '@/components/Logo';
import Info from '@/components/Info';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useConfig } from '@/contexts/ConfigContext';
import { useImportDialog } from '@/contexts/ImportDialogContext';
import { useRecordingState } from '@/contexts/RecordingStateContext';
import { cn } from '@/lib/utils';
import Analytics from '@/lib/analytics';
import { APP_VERSION_LABEL } from '@/lib/app-version';
import { MeetilyGlyph } from '@/components/app-shell/MeetilyGlyph';
import { useSidebar } from './SidebarProvider';

const primaryNavigation = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'New meeting', href: '/new-meeting', icon: 'capture' },
  { label: 'Saved meetings', href: '/meetings', icon: 'library' },
  { label: 'Ask meetings', href: '/chat', icon: 'recall' },
] as const;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentMeeting,
    setCurrentMeeting,
    isCollapsed,
    toggleCollapse,
    handleRecordingToggle,
    searchTranscripts,
    searchResults,
    isSearching,
    meetings,
    setMeetings,
  } = useSidebar();
  const { isRecording, isStopping, isProcessing, isSaving } = useRecordingState();
  const isPostProcessing = isStopping || isProcessing || isSaving;
  const { openImportDialog } = useImportDialog();
  const { betaFeatures } = useConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteMeetingId, setDeleteMeetingId] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<{ id: string; title: string } | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const openSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  useEffect(() => {
    window.openSettings = openSettings;
    return () => {
      delete window.openSettings;
    };
  }, [openSettings]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    void searchTranscripts(value);
  }, [searchTranscripts]);

  const visibleMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const matchingIds = new Set(searchResults.map((result) => result.id));
    const query = searchQuery.toLowerCase();
    return meetings.filter((meeting) => matchingIds.has(meeting.id) || meeting.title.toLowerCase().includes(query));
  }, [meetings, searchQuery, searchResults]);

  const openMeeting = (id: string, title: string) => {
    if (isPostProcessing) return;
    setCurrentMeeting({ id, title });
    router.push(`/meeting-details?id=${id}`);
  };

  const handleDelete = async () => {
    if (!deleteMeetingId || isPostProcessing) return;

    try {
      await invoke('api_delete_meeting', { meetingId: deleteMeetingId });
      setMeetings(meetings.filter((meeting) => meeting.id !== deleteMeetingId));
      Analytics.trackMeetingDeleted(deleteMeetingId);
      if (currentMeeting?.id === deleteMeetingId) router.push('/');
      toast.success('Meeting deleted');
    } catch (error) {
      toast.error('Could not delete meeting', {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setDeleteMeetingId(null);
    }
  };

  const beginEditing = (id: string, title: string) => {
    if (isPostProcessing) return;
    setEditingMeeting({ id, title });
    setEditingTitle(title);
  };

  const saveTitle = async () => {
    if (isPostProcessing) return;
    const title = editingTitle.trim();
    if (!editingMeeting || !title) {
      toast.error('Meeting title cannot be empty');
      return;
    }

    try {
      await invoke('api_save_meeting_title', { meetingId: editingMeeting.id, title });
      setMeetings(meetings.map((meeting) => meeting.id === editingMeeting.id ? { ...meeting, title } : meeting));
      if (currentMeeting?.id === editingMeeting.id) setCurrentMeeting({ id: editingMeeting.id, title });
      toast.success('Meeting title updated');
      setEditingMeeting(null);
    } catch (error) {
      toast.error('Could not update meeting title', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/meetings') return pathname === '/meetings' || pathname === '/meeting-details';
    return pathname === href;
  };

  const navigationButton = (item: typeof primaryNavigation[number]) => {
    const button = (
      <button
        key={item.href}
        type="button"
        onClick={() => !isPostProcessing && router.push(item.href)}
        disabled={isPostProcessing}
        aria-disabled={isPostProcessing}
        aria-current={isActive(item.href) ? 'page' : undefined}
        className={cn(
          'group flex min-h-9 items-center rounded-[5px] text-[13px] font-medium tracking-[-0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-45',
          isCollapsed ? 'w-10 justify-center' : 'w-full gap-3 px-3',
          isActive(item.href)
            ? 'bg-[hsl(var(--accent-soft))] text-[hsl(var(--sidebar-foreground))]'
            : 'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]',
        )}
      >
        <MeetilyGlyph name={item.icon} className={cn('size-[1.1rem] shrink-0', isActive(item.href) && 'text-accent')} />
        {!isCollapsed && <span>{item.label}</span>}
      </button>
    );

    if (!isCollapsed) return button;
    return (
      <Tooltip key={item.href}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside
      aria-label="Meetily workspace"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar)/0.94)] text-[hsl(var(--sidebar-foreground))] backdrop-blur-xl transition-[width] duration-200 ease-out',
        isCollapsed ? 'w-[4.5rem]' : 'w-[17.5rem]',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col px-3 pb-4 pt-4">
        <div className={cn('flex min-h-11 items-center border-b border-[hsl(var(--sidebar-border))] pb-3', isCollapsed ? 'justify-center' : 'justify-between gap-2 px-0')}>
          <Logo isCollapsed={isCollapsed} />
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Collapse sidebar"
              className="grid size-9 place-items-center rounded-[3px] text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]"
            >
              <MeetilyGlyph name="chevron-left" className="size-[1.1rem]" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Expand sidebar"
            className="mx-auto mt-3 grid size-10 place-items-center rounded-[3px] text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]"
          >
            <MeetilyGlyph name="chevron-right" className="size-[1.1rem]" />
          </button>
        )}

        {!isCollapsed && <p className="mt-5 px-2 font-mono text-[0.625rem] font-medium uppercase tracking-[0.12em] text-[hsl(var(--sidebar-muted))]">Workbench</p>}
        <nav aria-label="Primary" className={cn('space-y-1', isCollapsed ? 'mt-4' : 'mt-2')}>
          {primaryNavigation.map(navigationButton)}
        </nav>

        {!isCollapsed && (
          <div className="mt-6 min-h-0 flex-1">
            <div className="relative">
              <label htmlFor="meeting-search" className="sr-only">Search saved meetings</label>
              <MeetilyGlyph name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[hsl(var(--sidebar-muted))]" />
              <input
                id="meeting-search"
                type="search"
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                disabled={isPostProcessing}
                placeholder="Search meetings"
                className="h-9 w-full rounded-[6px] border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--card)/0.6)] pl-8 pr-8 text-[13px] text-[hsl(var(--sidebar-foreground))] placeholder:text-[hsl(var(--sidebar-muted))] focus-visible:border-accent/70 focus-visible:ring-offset-[hsl(var(--sidebar))] disabled:cursor-not-allowed disabled:opacity-45"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  disabled={isPostProcessing}
                  aria-label="Clear meeting search"
                  className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]"
                >
                  <MeetilyGlyph name="close" className="size-4" />
                </button>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between px-1">
              <p className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.12em] text-[hsl(var(--sidebar-muted))]">Meeting ledger</p>
              {isSearching && <span className="font-mono text-[0.625rem] text-[hsl(var(--sidebar-muted))]">Searching…</span>}
            </div>

            <div className="app-rail-scrollbar mt-1.5 max-h-[calc(100dvh-25rem)] min-h-20 overflow-y-auto custom-scrollbar">
              {visibleMeetings.length === 0 ? (
                <p className="px-2 py-4 text-xs leading-5 text-[hsl(var(--sidebar-muted))]">
                  {searchQuery ? 'No matching meetings.' : 'Saved meetings will appear here.'}
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {visibleMeetings.map((meeting) => (
                    <li key={meeting.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => openMeeting(meeting.id, meeting.title)}
                        disabled={isPostProcessing}
                        className={cn(
                          'min-h-10 w-full truncate rounded-[3px] py-2 pl-3 pr-16 text-left text-[13px] tracking-[-0.01em] text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))] disabled:cursor-not-allowed disabled:opacity-45',
                          currentMeeting?.id === meeting.id && pathname === '/meeting-details' && 'bg-[hsl(var(--accent-soft))] font-medium text-[hsl(var(--sidebar-foreground))]',
                        )}
                      >
                        {meeting.title}
                      </button>
                      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <button type="button" onClick={() => beginEditing(meeting.id, meeting.title)} disabled={isPostProcessing} aria-label={`Rename ${meeting.title}`} className="grid size-7 place-items-center rounded-md text-[hsl(var(--sidebar-muted))] hover:bg-white/10 hover:text-[hsl(var(--sidebar-foreground))] disabled:cursor-not-allowed disabled:opacity-50">
                          <MeetilyGlyph name="pencil" className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteMeetingId(meeting.id)} disabled={isPostProcessing} aria-label={`Delete ${meeting.title}`} className="grid size-7 place-items-center rounded-md text-[hsl(var(--sidebar-muted))] hover:bg-white/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50">
                          <MeetilyGlyph name="trash" className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className={cn('mt-auto border-t border-[hsl(var(--sidebar-border))] pt-4', isCollapsed ? 'space-y-1.5' : 'space-y-2')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleRecordingToggle}
                disabled={isRecording || isPostProcessing}
                aria-label={isPostProcessing ? 'Finishing meeting' : isRecording ? 'Recording active' : 'Open recorder'}
                className={cn(
                  'flex min-h-10 items-center justify-center rounded-md text-[13px] font-semibold tracking-[-0.01em] transition-[background,color,transform] active:translate-y-px disabled:cursor-default',
                  isCollapsed ? 'w-10' : 'w-full gap-2.5 px-3',
                  isRecording
                    ? 'bg-accent text-accent-foreground'
                    : isPostProcessing
                      ? 'bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-muted))]'
                      : 'bg-primary text-primary-foreground hover:bg-primary/88',
                )}
              >
                {isPostProcessing ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" aria-hidden="true" /> : <MeetilyGlyph name="capture" className="size-4" />}
                {!isCollapsed && <span>{isPostProcessing ? 'Finishing meeting' : isRecording ? 'Recording active' : 'Start recording'}</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">{isPostProcessing ? 'Finishing meeting' : isRecording ? 'Recording active' : 'Start recording'}</TooltipContent>}
          </Tooltip>

          {betaFeatures.importAndRetranscribe && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={() => openImportDialog()} disabled={isPostProcessing} className={cn('flex min-h-9 items-center rounded-md text-[13px] font-medium text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))] disabled:cursor-not-allowed disabled:opacity-45', isCollapsed ? 'w-9 justify-center' : 'w-full gap-2.5 px-2.5')}>
                  <MeetilyGlyph name="import" className="size-[1.1rem]" />
                  {!isCollapsed && <span>Import audio</span>}
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Import audio</TooltipContent>}
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
                <button type="button" onClick={openSettings} disabled={isPostProcessing} aria-current={pathname === '/settings' ? 'page' : undefined} className={cn('flex min-h-9 items-center rounded-md text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45', isCollapsed ? 'w-9 justify-center' : 'w-full gap-2.5 px-2.5', pathname === '/settings' ? 'bg-[hsl(var(--accent-soft))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]')}>
                <MeetilyGlyph name="settings" className={cn('size-[1.1rem]', pathname === '/settings' && 'text-accent')} />
                {!isCollapsed && <span>Settings</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Settings</TooltipContent>}
          </Tooltip>

          <div className={cn('flex items-center text-[hsl(var(--sidebar-muted))]', isCollapsed ? 'justify-center' : 'justify-between px-1')}>
            <Info isCollapsed={isCollapsed} />
            {!isCollapsed && <span className="text-xs tabular-nums">{APP_VERSION_LABEL}</span>}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteMeetingId !== null}
        text="Delete this meeting and its associated local data? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteMeetingId(null)}
      />

      <Dialog open={editingMeeting !== null} onOpenChange={(open) => !open && setEditingMeeting(null)}>
        <DialogContent className="sm:max-w-[26rem]">
          <VisuallyHidden><DialogTitle>Rename meeting</DialogTitle></VisuallyHidden>
          <div className="py-2">
            <label htmlFor="meeting-title" className="mb-2 block text-sm font-medium">Meeting title</label>
            <input
              id="meeting-title"
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void saveTitle();
                if (event.key === 'Escape') setEditingMeeting(null);
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              autoFocus
            />
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setEditingMeeting(null)} className="min-h-10 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Cancel</button>
            <button type="button" onClick={() => void saveTitle()} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

declare global {
  interface Window {
    openSettings?: () => void;
  }
}
