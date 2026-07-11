import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const sidebar = fs.readFileSync(path.join(root, 'components', 'Sidebar', 'SidebarProvider.tsx'), 'utf8');
const startHook = fs.readFileSync(path.join(root, 'hooks', 'useRecordingStart.ts'), 'utf8');

assert.match(sidebar, /if \(pathname !== '\/new-meeting'\) router\.push\('\/new-meeting'\);/);
assert.match(sidebar, /open_recording_setup/);
assert.doesNotMatch(sidebar, /sessionStorage\.setItem\('autoStartRecording'/);
assert.doesNotMatch(sidebar, /start-recording-from-sidebar/);
assert.match(startHook, /sessionStorage\.removeItem\('autoStartRecording'\);/);

console.log('sidebar recording gate tests passed');
