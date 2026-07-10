'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Import,
  LoaderCircle,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Search,
  Settings,
  Square,
  Trash2,
  X,
} from 'lucide-react';
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
import { useSidebar } from './SidebarProvider';

const primaryNavigation = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'New meeting', href: '/new-meeting', icon: Mic },
  { label: 'Saved meetings', href: '/meetings', icon: FileText },
  { label: 'Ask meetings', href: '/chat', icon: Bot },
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

  useEffect(() => {
    window.openSettings = () => router.push('/settings');
    return () => {
      delete window.openSettings;
    };
  }, [router]);

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
    const Icon = item.icon;
    const button = (
      <button
        key={item.href}
        type="button"
        onClick={() => !isPostProcessing && router.push(item.href)}
        disabled={isPostProcessing}
        aria-disabled={isPostProcessing}
        aria-current={isActive(item.href) ? 'page' : undefined}
        className={cn(
          'group flex min-h-10 items-center rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          isCollapsed ? 'w-10 justify-center' : 'w-full gap-3 px-3',
          isActive(item.href)
            ? 'bg-[hsl(var(--sidebar-strong))] text-foreground'
            : 'text-muted-foreground hover:bg-[hsl(var(--sidebar-strong)/0.7)] hover:text-foreground',
        )}
      >
        <Icon className="size-[1.1rem] shrink-0" aria-hidden="true" />
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
        'fixed inset-y-0 left-0 z-40 flex border-r border-border/80 bg-[hsl(var(--sidebar))] transition-[width] duration-200 ease-out',
        isCollapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col px-3 pb-3 pt-4">
        <div className={cn('flex min-h-10 items-center', isCollapsed ? 'justify-center' : 'justify-between gap-2 px-1')}>
          <Logo isCollapsed={isCollapsed} />
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Collapse sidebar"
              className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(var(--sidebar-strong))] hover:text-foreground"
            >
              <PanelLeftClose className="size-[1.1rem]" aria-hidden="true" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Expand sidebar"
            className="mx-auto mt-2 grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(var(--sidebar-strong))] hover:text-foreground"
          >
            <PanelLeftOpen className="size-[1.1rem]" aria-hidden="true" />
          </button>
        )}

        <nav aria-label="Primary" className="mt-5 space-y-1">
          {primaryNavigation.map(navigationButton)}
        </nav>

        {!isCollapsed && (
          <div className="mt-6 min-h-0 flex-1">
            <div className="relative">
              <label htmlFor="meeting-search" className="sr-only">Search saved meetings</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="meeting-search"
                type="search"
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                disabled={isPostProcessing}
                placeholder="Search meetings"
                className="h-10 w-full rounded-lg border border-border/80 bg-card/65 pl-9 pr-9 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  disabled={isPostProcessing}
                  aria-label="Clear meeting search"
                  className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent</p>
              {isSearching && <span className="text-xs text-muted-foreground">Searching…</span>}
            </div>

            <div className="mt-2 max-h-[calc(100dvh-27rem)] min-h-20 overflow-y-auto custom-scrollbar">
              {visibleMeetings.length === 0 ? (
                <p className="px-2 py-4 text-sm leading-5 text-muted-foreground">
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
                          'min-h-10 w-full truncate rounded-lg py-2 pl-3 pr-16 text-left text-sm transition-colors hover:bg-[hsl(var(--sidebar-strong)/0.7)] disabled:cursor-not-allowed disabled:opacity-50',
                          currentMeeting?.id === meeting.id && pathname === '/meeting-details' && 'bg-[hsl(var(--sidebar-strong))] font-medium',
                        )}
                      >
                        {meeting.title}
                      </button>
                      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <button type="button" onClick={() => beginEditing(meeting.id, meeting.title)} disabled={isPostProcessing} aria-label={`Rename ${meeting.title}`} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50">
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => setDeleteMeetingId(meeting.id)} disabled={isPostProcessing} aria-label={`Delete ${meeting.title}`} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50">
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className={cn('mt-auto border-t border-border/70 pt-3', isCollapsed ? 'space-y-1' : 'space-y-2')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleRecordingToggle}
                disabled={isRecording || isPostProcessing}
                className={cn(
                  'flex min-h-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-[background,transform] hover:bg-primary/90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55',
                  isCollapsed ? 'w-10' : 'w-full gap-2 px-3',
                )}
              >
                {isPostProcessing ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : isRecording ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
                {!isCollapsed && <span>{isPostProcessing ? 'Finishing meeting' : isRecording ? 'Recording in progress' : 'Start recording'}</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">{isPostProcessing ? 'Finishing meeting' : isRecording ? 'Recording in progress' : 'Start recording'}</TooltipContent>}
          </Tooltip>

          {betaFeatures.importAndRetranscribe && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={() => openImportDialog()} disabled={isPostProcessing} className={cn('flex min-h-10 items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-[hsl(var(--sidebar-strong))] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50', isCollapsed ? 'w-10 justify-center' : 'w-full gap-3 px-3')}>
                  <Import className="size-[1.1rem]" aria-hidden="true" />
                  {!isCollapsed && <span>Import audio</span>}
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Import audio</TooltipContent>}
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => router.push('/settings')} disabled={isPostProcessing} aria-current={pathname === '/settings' ? 'page' : undefined} className={cn('flex min-h-10 items-center rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', isCollapsed ? 'w-10 justify-center' : 'w-full gap-3 px-3', pathname === '/settings' ? 'bg-[hsl(var(--sidebar-strong))] text-foreground' : 'text-muted-foreground hover:bg-[hsl(var(--sidebar-strong))] hover:text-foreground')}>
                <Settings className="size-[1.1rem]" aria-hidden="true" />
                {!isCollapsed && <span>Settings</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Settings</TooltipContent>}
          </Tooltip>

          <div className={cn('flex items-center text-muted-foreground', isCollapsed ? 'justify-center' : 'justify-between px-1')}>
            <Info isCollapsed={isCollapsed} />
            {!isCollapsed && <span className="text-xs tabular-nums">v0.4.0</span>}
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
