import { execFileSync } from 'node:child_process';
import { access, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

if (process.platform !== 'darwin') process.exit(0);

const frontend = fileURLToPath(new URL('..', import.meta.url));
const source = path.join(frontend, 'src-tauri/icons/MeetilyImproved.icon');
const output = path.join(frontend, 'src-tauri/icons/.generated-adaptive-icon');

const candidates = [];
try {
  candidates.push(execFileSync('/usr/bin/xcrun', ['--find', 'actool'], { encoding: 'utf8' }).trim());
} catch {
  // Fall through to the standard Xcode application locations.
}
candidates.push(
  '/Applications/Xcode.app/Contents/Developer/usr/bin/actool',
  '/Applications/Xcode-beta.app/Contents/Developer/usr/bin/actool',
);

let actool;
for (const candidate of candidates.filter(Boolean)) {
  try {
    await access(candidate);
    actool = candidate;
    break;
  } catch {
    // Try the next installed Xcode toolchain.
  }
}

if (!actool) {
  throw new Error('Icon Composer packaging requires Xcode actool, but no installed Xcode toolchain provides it.');
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

execFileSync(actool, [
  '--compile', output,
  '--platform', 'macosx',
  '--minimum-deployment-target', '10.13',
  '--app-icon', 'MeetilyImproved',
  '--output-partial-info-plist', path.join(output, 'partial.plist'),
  source,
], { stdio: 'inherit' });

await Promise.all([
  access(path.join(output, 'Assets.car')),
  access(path.join(output, 'MeetilyImproved.icns')),
]);
