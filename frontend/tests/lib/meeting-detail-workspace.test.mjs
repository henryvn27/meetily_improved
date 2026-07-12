import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('meeting detail remains a summary-first reading workspace with a persistent local inspector', async () => {
  const [page, content, summary, transcript, operations, api, emptySummary] = await Promise.all([
    readFile(new URL('src/app/meeting-details/page.tsx', root), 'utf8'),
    readFile(new URL('src/app/meeting-details/page-content.tsx', root), 'utf8'),
    readFile(new URL('src/components/MeetingDetails/SummaryPanel.tsx', root), 'utf8'),
    readFile(new URL('src/components/MeetingDetails/TranscriptPanel.tsx', root), 'utf8'),
    readFile(new URL('src/hooks/meeting-details/useMeetingOperations.ts', root), 'utf8'),
    readFile(new URL('src-tauri/src/api/api.rs', root), 'utf8'),
    readFile(new URL('src/components/EmptyStateSummary.tsx', root), 'utf8'),
  ]);

  assert.match(page, /kind="loading" title="Opening meeting"/);
  assert.match(page, /kind="error"/);
  assert.match(page, /Back to saved meetings/);

  assert.ok(content.indexOf('<SummaryPanel') < content.indexOf('<TranscriptPanel'));
  assert.match(content, /xl:static xl:z-auto xl:w-\[22rem\]/);
  assert.match(content, /usePagination=\{true\}/);
  assert.match(content, /onLoadMore=\{onLoadMore\}/);
  assert.match(content, /onCopySummary=\{copyOperations\.handleCopySummary\}/);
  assert.match(content, /onCopyTranscript=\{copyOperations\.handleCopyTranscript\}/);
  assert.match(content, /onOpenMeetingFolder=\{meetingOperations\.handleOpenMeetingFolder\}/);
  assert.match(content, /onExportMeeting=\{meetingOperations\.handleExportMeeting\}/);

  assert.match(summary, /aria-label="Meeting summary"/);
  assert.match(summary, /EmptyStateSummary/);
  assert.match(emptySummary, /No Summary Generated Yet/);
  assert.match(transcript, /aria-label="Meeting assistant inspector"/);
  assert.match(transcript, /Ask this meeting/);
  assert.match(transcript, /meetingId,/);
  assert.doesNotMatch(transcript, /Summary context/);
  assert.match(summary, /onPromptChange/);
  assert.match(summary, /SummaryGeneratorButtonGroup/);
  assert.match(transcript, /VirtualizedTranscriptView/);
  assert.match(transcript, /Recording folder linked/);
  assert.match(transcript, /Local transcription:/);
  assert.match(transcript, /onExportMeeting/);
  assert.match(operations, /api_export_meeting_locally/);
  assert.match(api, /pub async fn api_export_meeting_locally/);
  assert.match(api, /blocking_save_file\(\)/);
  assert.match(api, /LocalExportResult \{ saved: false \}/);
  assert.match(api, /SELECT timestamp, transcript FROM transcripts WHERE meeting_id = \?/);
});
