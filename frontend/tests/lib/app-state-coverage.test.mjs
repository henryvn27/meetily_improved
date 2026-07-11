import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('major Phase 1 routes declare truthful reusable non-happy-path states', async () => {
  const [home, meetings, detail, chat, settings, permissions, preRecording, activeRecording] = await Promise.all([
    source('src/app/page.tsx'),
    source('src/app/meetings/page.tsx'),
    source('src/app/meeting-details/page.tsx'),
    source('src/app/chat/page.tsx'),
    source('src/app/settings/page.tsx'),
    source('src/components/PermissionWarning.tsx'),
    source('src/components/recording/PreRecordingWorkspace.tsx'),
    source('src/components/recording/ActiveRecordingWorkspace.tsx'),
  ]);

  assert.match(home, /kind="empty"/);
  assert.match(home, /does not add sample meetings or fabricated activity/);

  assert.match(meetings, /kind="loading"/);
  assert.match(meetings, /kind="error"/);
  assert.match(meetings, /kind="empty"/);
  assert.match(meetings, /Try again/);
  assert.match(meetings, /Clear search/);

  assert.match(detail, /kind="loading"/);
  assert.match(detail, /kind="error"/);
  assert.match(detail, /Back to saved meetings/);

  assert.match(chat, /kind="model"/);
  assert.match(chat, /does not fabricate answers/);
  assert.match(chat, /Review local model settings/);

  assert.match(settings, /kind="error"/);
  assert.match(permissions, /kind="permission"/);
  assert.match(permissions, /Open microphone settings/);
  assert.match(permissions, /Recheck/);
  assert.match(preRecording, /kind="error"/);
  assert.match(preRecording, /Check setup again/);
  assert.match(activeRecording, /kind="error"/);
});

