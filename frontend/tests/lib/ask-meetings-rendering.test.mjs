import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('Ask Meetings renders safe Markdown and dated meeting-level sources', async () => {
  const [chat, api] = await Promise.all([
    readFile(new URL('src/app/chat/page.tsx', root), 'utf8'),
    readFile(new URL('src-tauri/src/api/api.rs', root), 'utf8'),
  ]);

  assert.match(chat, /ReactMarkdown/);
  assert.match(chat, /remarkPlugins=\{\[remarkGfm\]\}/);
  assert.doesNotMatch(chat, /rehypeRaw/);
  assert.match(chat, /source\.meetingDate/);
  assert.match(chat, /new Date\(source\.meetingDate\)\.toLocaleDateString\(\)/);
  assert.match(chat, /getLocalModelStatus/);
  assert.match(chat, /Local recall needs a model/);
  assert.match(chat, /Review local model settings/);
  assert.match(chat, /kind="model"/);

  assert.match(api, /fn build_global_recall_sources/);
  assert.match(api, /find\(\|source\| source\.meeting_id == item\.id\)/);
  assert.match(api, /MAX_GLOBAL_RECALL_MEETINGS/);
  assert.match(api, /Saved summary:/);
  assert.match(api, /MAX_MEETING_RECALL_CONTEXT_CHARS/);
});
