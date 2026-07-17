import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { nativeVisualMatrix } from '../e2e/helpers/native-visual-matrix.mjs';

const workspaceSpec = await readFile(
  new URL('../e2e/specs/native/workspace.spec.mjs', import.meta.url),
  'utf8',
);

test('native visual QA isolates the complete release matrix into named tests', () => {
  assert.deepEqual(nativeVisualMatrix, [
    { appearance: 'Light', width: 1280, height: 820 },
    { appearance: 'Dark', width: 1280, height: 820 },
    { appearance: 'Light', width: 1100, height: 720 },
    { appearance: 'Dark', width: 1100, height: 720 },
  ]);
  assert.equal(new Set(nativeVisualMatrix.map(({ appearance, width, height }) => (
    `${appearance}-${width}x${height}`
  ))).size, 4);

  assert.match(workspaceSpec, /for \(const visualCase of nativeVisualMatrix\)/);
  assert.match(
    workspaceSpec,
    /it\(`captures every real route and settings section in \$\{appearance\} at \$\{width\}x\$\{height\}`/,
  );
  assert.doesNotMatch(workspaceSpec, /for \(const \[width, height\] of releaseSizes\)/);
});

test('each native matrix unit retains every screenshot and accessibility surface', () => {
  for (const sourceMarker of [
    'for (const route of routes)',
    'for (const section of settingsSections)',
    "window.location.assign('/meeting-details')",
    'captureWorkspaceDialogs(appearance, width, height)',
    'expectWcag22Aa(browser, \'[role="dialog"]\')',
    'import-audio-${slug(appearance)}-${width}x${height}.png',
    'about-${slug(appearance)}-${width}x${height}.png',
  ]) {
    assert.ok(workspaceSpec.includes(sourceMarker), `missing native matrix surface: ${sourceMarker}`);
  }
});
