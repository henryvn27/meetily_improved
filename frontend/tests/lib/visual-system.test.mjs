import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('global shell uses the documented signal-orange visual system', async () => {
  const [css, sidebar, mainContent, pageHeader, homePage, themeContext, themeControl, meetingPage, meetingTranscript, meetingSummary, preRecording, postRecording, product, designMarkdown, designJson] = await Promise.all([
    readFile(new URL('src/app/globals.css', root), 'utf8'),
    readFile(new URL('src/components/Sidebar/index.tsx', root), 'utf8'),
    readFile(new URL('src/components/MainContent/index.tsx', root), 'utf8'),
    readFile(new URL('src/components/app-shell/PageHeader.tsx', root), 'utf8'),
    readFile(new URL('src/app/page.tsx', root), 'utf8'),
    readFile(new URL('src/contexts/ThemeContext.tsx', root), 'utf8'),
    readFile(new URL('src/components/app-shell/ThemeControl.tsx', root), 'utf8'),
    readFile(new URL('src/app/meeting-details/page-content.tsx', root), 'utf8'),
    readFile(new URL('src/components/MeetingDetails/TranscriptPanel.tsx', root), 'utf8'),
    readFile(new URL('src/components/MeetingDetails/SummaryPanel.tsx', root), 'utf8'),
    readFile(new URL('src/components/recording/PreRecordingWorkspace.tsx', root), 'utf8'),
    readFile(new URL('src/components/recording/PostRecordingWorkspace.tsx', root), 'utf8'),
    readFile(new URL('../PRODUCT.md', root), 'utf8'),
    readFile(new URL('../DESIGN.md', root), 'utf8'),
    readFile(new URL('../DESIGN.json', root), 'utf8'),
  ]);

  assert.match(css, /--accent: 19 87% 55%/);
  assert.match(css, /\.dark \{/);
  assert.match(css, /min-width: 1100px/);
  assert.match(css, /--sidebar: 225 12% 91%/);
  assert.match(css, /--sidebar-selection: 19 87% 55%/);
  assert.doesNotMatch(css, /--background: 42 26% 96%/);
  assert.match(sidebar, /bg-\[hsl\(var\(--sidebar\)\/0\.94\)\]/);
  assert.match(sidebar, /MeetilyGlyph/);
  assert.doesNotMatch(sidebar, /@heroicons\/react\/24\/outline/);
  assert.match(sidebar, /bg-accent/);
  assert.match(sidebar, /text-accent-foreground/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation-duration: 0\.01ms !important/);
  assert.match(css, /transition-duration: 0\.01ms !important/);
  assert.match(mainContent, /h-11 shrink-0/);
  assert.match(mainContent, /h-dvh min-w-0 overflow-hidden/);
  assert.match(mainContent, /w-\[calc\(100%-4\.5rem\)\]/);
  assert.match(mainContent, /w-\[calc\(100%-17\.5rem\)\]/);
  assert.match(pageHeader, /xl:flex-row/);
  assert.match(homePage, /xl:grid-cols-\[minmax\(0,1fr\)_20rem\]/);
  assert.match(themeContext, /meetily-theme-preference/);
  assert.match(themeContext, /prefers-color-scheme: dark/);
  assert.match(themeContext, /dataset\.theme/);
  assert.match(themeControl, /System theme/);
  assert.match(themeControl, /Light theme/);
  assert.match(themeControl, /Dark theme/);
  assert.match(meetingPage, /setIsInspectorOpen\(true\)/);
  assert.match(meetingPage, /xl:static xl:z-auto xl:w-\[22rem\]/);
  assert.match(meetingPage, /isInspectorOpen \? 'flex' : 'hidden xl:flex'/);
  assert.match(meetingTranscript, /<VirtualizedTranscriptView/);
  assert.match(meetingTranscript, /No recording folder linked/);
  assert.match(meetingTranscript, /Local transcription:/);
  assert.doesNotMatch(meetingTranscript, /from ['"]@\/components\/TranscriptView['"]/);
  assert.match(meetingSummary, /summaryResponse &&/);
  assert.match(meetingSummary, /border-t border-border bg-card/);
  assert.doesNotMatch(meetingSummary, /bg-white/);
  assert.doesNotMatch(preRecording, /rounded-lg/);
  assert.match(preRecording, /xl:grid-cols-\[minmax\(0,1fr\)_22rem\]/);
  assert.doesNotMatch(preRecording, /md:grid-cols-\[minmax\(0,1fr\)_22rem\]/);
  assert.doesNotMatch(postRecording, /rounded-(?:lg|xl)/);

  const combinedDocs = `${product}\n${designMarkdown}\n${designJson}`;
  assert.match(combinedDocs, /Signal Orange/);
  assert.doesNotMatch(combinedDocs, /Electric Rose|#E92C78/i);
});
