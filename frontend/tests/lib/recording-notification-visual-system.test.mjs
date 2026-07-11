import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourcePath = fileURLToPath(new URL('../../src/lib/recordingNotification.tsx', import.meta.url));
const source = await readFile(sourcePath, 'utf8');

assert.match(source, /Store\.load\('preferences\.json'\)/, 'preserves local preference persistence');
assert.match(source, /show_recording_notification/, 'preserves the recording-consent preference key');
assert.match(source, /recording_notification_acknowledged/, 'preserves the analytics event');
assert.match(source, /duration: 10000/, 'preserves the ten-second consent window');
assert.match(source, /toast\.custom\(/, 'uses a fully themed consent surface rather than the legacy info toast');
assert.match(source, /toast\.dismiss\(toastId\)/, 'preserves acknowledgement dismissal');
assert.match(source, /disabled=\{isAcknowledging\}/, 'prevents duplicate preference writes while acknowledgement is saving');
assert.match(source, /I’ve notified participants/, 'preserves the participant-notice acknowledgement action');
assert.match(source, /bg-accent/, 'uses the approved recording-state accent token');
assert.match(source, /text-muted-foreground/, 'uses semantic muted text for both themes');
assert.match(source, /focus-visible:ring-ring/, 'uses the shared keyboard focus token');
assert.match(source, /from 'lucide-react'/, 'uses the approved icon library instead of an emoji status marker');
assert.doesNotMatch(source, /🔴|Recording Started/, 'removes the legacy emoji and headline treatment');
assert.doesNotMatch(source, /(?:text|bg|border|ring)-(?:gray|blue)-/, 'removes legacy blue and gray utility colors');

console.log('recording notification visual-system source checks passed');
