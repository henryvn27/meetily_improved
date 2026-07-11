import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourcePath = fileURLToPath(new URL('../../src/lib/recordingNotification.tsx', import.meta.url));
const source = await readFile(sourcePath, 'utf8');

assert.match(source, /Store\.load\('preferences\.json'\)/, 'preserves local preference persistence');
assert.match(source, /show_recording_notification/, 'preserves the recording-consent preference key');
assert.match(source, /recording_notification_acknowledged/, 'preserves the analytics event');
assert.match(source, /duration: 10000/, 'preserves the ten-second consent window');
assert.match(source, /toast\.dismiss\(toastId\)/, 'preserves acknowledgement dismissal');
assert.match(source, /bg-accent/, 'uses the approved recording-state accent token');
assert.match(source, /text-muted-foreground/, 'uses semantic muted text for both themes');
assert.match(source, /focus:ring-ring/, 'uses the shared keyboard focus token');
assert.doesNotMatch(source, /(?:text|bg|border|ring)-(?:gray|blue)-/, 'removes legacy blue and gray utility colors');

console.log('recording notification visual-system source checks passed');
