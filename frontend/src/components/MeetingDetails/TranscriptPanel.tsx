"use client";

import { Transcript, TranscriptSegmentData } from '@/types';
import { VirtualizedTranscriptView } from '@/components/VirtualizedTranscriptView';
import { TranscriptButtonGroup } from './TranscriptButtonGroup';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { ArrowUpIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';
import { invoke } from '@tauri-apps/api/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceCount?: number;
};

type RecallResponse = { answer: string; sources: unknown[] };

interface TranscriptPanelProps {
  transcripts: Transcript[];
  onCopyTranscript: () => void;
  onOpenMeetingFolder: () => Promise<void>;
  onExportMeeting: () => Promise<void>;
  isRecording: boolean;
  disableAutoScroll?: boolean;

  // Optional pagination props (when using virtualization)
  usePagination?: boolean;
  segments?: TranscriptSegmentData[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
  loadedCount?: number;
  onLoadMore?: () => void;
  hasSavedSummary?: boolean;

  // Retranscription props
  meetingId?: string;
  meetingFolderPath?: string | null;
  onRefetchTranscripts?: () => Promise<void>;
  transcriptionModel?: string | null;
  className?: string;
  onCloseInspector?: () => void;
}

export function TranscriptPanel({
  transcripts,
  onCopyTranscript,
  onOpenMeetingFolder,
  onExportMeeting,
  isRecording,
  disableAutoScroll = false,
  usePagination = false,
  segments,
  hasMore,
  isLoadingMore,
  totalCount,
  loadedCount,
  onLoadMore,
  hasSavedSummary = false,
  meetingId,
  meetingFolderPath,
  onRefetchTranscripts,
  transcriptionModel,
  className,
  onCloseInspector,
}: TranscriptPanelProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [askError, setAskError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const transcriptCount = usePagination ? (totalCount ?? segments?.length ?? 0) : transcripts.length;
  const hasMeetingContext = transcriptCount > 0 || hasSavedSummary;

  useEffect(() => {
    setQuestion('');
    setMessages([]);
    setAskError(null);
  }, [meetingId]);

  const askMeeting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || !meetingId || !hasMeetingContext || isAsking) return;
    const turnId = Date.now().toString();
    setMessages((current) => [...current, { id: `user-${turnId}`, role: 'user', content: trimmed }]);
    setQuestion('');
    setIsAsking(true);
    setAskError(null);
    try {
      const result = await invoke<RecallResponse>('api_answer_meetings_locally', {
        question: trimmed,
        meetingId,
        history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
      });
      setMessages((current) => [...current, {
        id: `assistant-${turnId}`,
        role: 'assistant',
        content: result.answer,
        sourceCount: result.sources.length,
      }]);
    } catch (reason) {
      setAskError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setIsAsking(false);
    }
  };

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  // Convert transcripts to segments if pagination is not used but we want virtualization
  const convertedSegments = useMemo(() => {
    if (usePagination && segments) {
      return segments;
    }
    // Convert transcripts to segments for virtualization
    return transcripts.map(t => ({
      id: t.id,
      timestamp: t.audio_start_time ?? 0,
      endTime: t.audio_end_time,
      text: t.text,
      confidence: t.confidence,
    }));
  }, [transcripts, usePagination, segments]);

  return (
    <aside
      aria-label="Meeting assistant inspector"
      className={cn(
        'min-w-0 shrink-0 flex-col border-l border-border bg-card xl:bg-secondary/35',
        className,
      )}
    >
      <section aria-labelledby="meeting-assistant-title" className="border-b border-border bg-card px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-eyebrow">Local assistant</p>
            <h2 id="meeting-assistant-title" className="mt-1 text-base font-semibold tracking-[-0.03em]">Ask this meeting</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Uses this meeting&apos;s saved transcript and summary with your local model.</p>
          </div>
          {onCloseInspector && (
            <Button type="button" variant="ghost" size="icon" className="xl:hidden" onClick={onCloseInspector} aria-label="Close meeting assistant">
              <RectangleGroupIcon className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        {!hasMeetingContext ? (
          <div className="mt-4 border-l border-border pl-3 text-xs leading-5 text-muted-foreground">
            <p className="font-medium text-foreground">No saved transcript or summary yet.</p>
            <p>Record, import, recover, or retranscribe this meeting before asking the local assistant.</p>
          </div>
        ) : null}
        {(messages.length > 0 || askError || isAsking) && (
          <div role="log" aria-live="polite" aria-label="Meeting chat" className="mt-4 max-h-[min(22rem,45vh)] space-y-3 overflow-y-auto pr-1 text-sm leading-6">
            {messages.map((message) => (
              <article
                key={message.id}
                aria-label={message.role === 'user' ? 'You' : 'Local assistant'}
                className={cn(
                  'max-w-[92%]',
                  message.role === 'user'
                    ? 'ml-auto rounded-xl bg-secondary px-3 py-2 text-foreground'
                    : 'border-l border-border pl-3',
                )}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                ) : <p>{message.content}</p>}
                {message.sourceCount ? <p className="mt-1 text-[0.6875rem] text-muted-foreground">{message.sourceCount} local source{message.sourceCount === 1 ? '' : 's'}</p> : null}
              </article>
            ))}
            {isAsking ? <p className="border-l border-border pl-3 text-muted-foreground">Reading this meeting with your local model…</p> : null}
            {askError ? <p className="border-l border-destructive pl-3 text-destructive">{askError}</p> : null}
          </div>
        )}
        <form className="mt-4 flex items-end gap-2 border-b border-border pb-2 focus-within:border-accent" onSubmit={askMeeting}>
          <label htmlFor="meeting-assistant-question" className="sr-only">Ask a question about this meeting</label>
          <textarea
            id="meeting-assistant-question"
            rows={2}
            maxLength={1000}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={submitOnEnter}
            disabled={!hasMeetingContext || isAsking}
            placeholder={hasMeetingContext ? 'Ask about a decision, topic, or follow-up…' : 'No meeting source available'}
            className="min-h-10 min-w-0 flex-1 resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" disabled={!question.trim() || !meetingId || !hasMeetingContext || isAsking} aria-label="Ask this meeting">
            <ArrowUpIcon className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </section>

      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow">Source record</p>
            <h2 className="mt-1 text-base font-semibold tracking-[-0.03em]">Transcript</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.6875rem] text-muted-foreground">
              {usePagination ? (totalCount ?? convertedSegments.length) : convertedSegments.length} segments
            </span>
          </div>
        </div>
        <TranscriptButtonGroup
          transcriptCount={usePagination ? (totalCount ?? convertedSegments.length) : (transcripts?.length || 0)}
          onCopyTranscript={onCopyTranscript}
          onOpenMeetingFolder={onOpenMeetingFolder}
          onExportMeeting={onExportMeeting}
          meetingId={meetingId}
          meetingFolderPath={meetingFolderPath}
          onRefetchTranscripts={onRefetchTranscripts}
        />
        <div className="mt-3 grid gap-1.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Source:</span>{' '}
            {meetingFolderPath ? 'Recording folder linked' : 'No recording folder linked'}
          </p>
          <p>
            <span className="font-medium text-foreground">Local transcription:</span>{' '}
            {transcriptionModel || 'Not configured'}
          </p>
        </div>
      </div>

      {/* Transcript content - use virtualized view for better performance */}
      <div className="min-h-0 flex-1 overflow-hidden pb-4">
        <VirtualizedTranscriptView
          segments={convertedSegments}
          isRecording={isRecording}
          isPaused={false}
          isProcessing={false}
          isStopping={false}
          enableStreaming={false}
          showConfidence={true}
          disableAutoScroll={disableAutoScroll}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
          onLoadMore={onLoadMore}
        />
      </div>

    </aside>
  );
}
