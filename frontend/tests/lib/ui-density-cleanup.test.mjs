import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('desktop shell keeps route actions clear and compact', async () => {
  const [sidebar, mainContent, home, meetings, settings, transcriptToolbar, summaryPanel] = await Promise.all([
    readFile(new URL('src/components/Sidebar/index.tsx', root), 'utf8'),
    readFile(new URL('src/components/MainContent/index.tsx', root), 'utf8'),
    readFile(new URL('src/app/page.tsx', root), 'utf8'),
    readFile(new URL('src/app/meetings/page.tsx', root), 'utf8'),
    readFile(new URL('src/app/settings/page.tsx', root), 'utf8'),
    readFile(new URL('src/components/MeetingDetails/TranscriptButtonGroup.tsx', root), 'utf8'),
    readFile(new URL('src/components/MeetingDetails/SummaryPanel.tsx', root), 'utf8'),
  ]);

  const homeHeader = home.slice(home.indexOf('<PageHeader'), home.indexOf('/>', home.indexOf('<PageHeader')) + 2);
  const meetingsHeader = meetings.slice(meetings.indexOf('<PageHeader'), meetings.indexOf('/>', meetings.indexOf('<PageHeader')) + 2);

  assert.match(sidebar, /w-\[15rem\]/);
  assert.doesNotMatch(sidebar, /meeting-search|Search saved meetings/);
  assert.match(mainContent, /titlebar h-8/);
  assert.doesNotMatch(mainContent, /ThemeControl/);
  assert.doesNotMatch(homeHeader, /actions=/);
  assert.doesNotMatch(meetingsHeader, /actions=/);
  assert.match(settings, /<AppearanceSettings \/>/);
  assert.match(transcriptToolbar, /aria-label="Copy transcript"/);
  assert.match(transcriptToolbar, /aria-label="Export meeting"/);
  assert.match(transcriptToolbar, /aria-label="Open recording folder"/);
  assert.doesNotMatch(transcriptToolbar, /xl:mr-2|hidden lg:inline/);
  assert.doesNotMatch(summaryPanel, /fixed bottom-0 left-0 right-0/);
});
