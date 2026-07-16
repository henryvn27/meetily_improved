import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

const [packageText, workspaceText, ciText, releaseText, buildText, windowsBuildText, devTestBuildText, workflowOverviewText] = await Promise.all([
  readFile(new URL('package.json', root), 'utf8'),
  readFile(new URL('pnpm-workspace.yaml', root), 'utf8'),
  readFile(new URL('../.github/workflows/ci.yml', root), 'utf8'),
  readFile(new URL('../.github/workflows/release.yml', root), 'utf8'),
  readFile(new URL('../.github/workflows/build.yml', root), 'utf8'),
  readFile(new URL('../.github/workflows/build-windows.yml', root), 'utf8'),
  readFile(new URL('../.github/workflows/build-devtest.yml', root), 'utf8'),
  readFile(new URL('../.github/workflows/WORKFLOWS_OVERVIEW.md', root), 'utf8'),
]);

const packageJson = JSON.parse(packageText);

test('frontend toolchain and patched framework versions are reproducible', () => {
  assert.equal(packageJson.packageManager, 'pnpm@11.7.0');
  assert.equal(packageJson.engines.node, '>=22.18.0 <23');
  assert.equal(packageJson.engines.pnpm, '11.7.0');
  assert.equal(packageJson.dependencies.next, '15.5.20');
  assert.equal(packageJson.devDependencies['eslint-config-next'], '15.5.20');
  assert.equal(packageJson.devDependencies.eslint, '9.39.2');
  assert.equal(packageJson.scripts.lint, 'eslint src --max-warnings 0');
  assert.equal(packageJson.scripts.build, 'node scripts/clean-next-output.mjs && next build');
  assert.equal(packageJson.pnpm, undefined);
});

test('unused Remirror and redundant Tiptap roots stay out of production', () => {
  const directDependencies = Object.keys(packageJson.dependencies);

  assert.equal(directDependencies.some((name) => name.startsWith('@remirror/')), false);
  assert.equal(directDependencies.includes('@tiptap/react'), false);
  assert.equal(directDependencies.includes('@tiptap/starter-kit'), false);
  assert.equal(directDependencies.includes('@tiptap/pm'), true);
});

test('pnpm applies patched transitive versions without advisory ignores', () => {
  assert.match(workspaceText, /"@blocknote\/core@0\.36\.0>uuid": "11\.1\.1"/);
  assert.match(workspaceText, /markdown-it: "14\.3\.0"/);
  assert.match(workspaceText, /postcss: "8\.5\.14"/);
  assert.match(workspaceText, /prosemirror-model: "1\.25\.3"/);
  assert.match(workspaceText, /ignoredOptionalDependencies:\n  - sharp/);
  assert.doesNotMatch(workspaceText, /ignoreGhsas|ignoreCves/);
  assert.equal(packageJson.scripts['audit:prod'], 'pnpm audit --prod --audit-level low');
});

test('CI installs the frozen graph before enforcing the production audit', () => {
  const installIndex = ciText.indexOf('pnpm install --frozen-lockfile');
  const auditIndex = ciText.indexOf('pnpm run audit:prod');
  const testIndex = ciText.indexOf('node --test tests/lib/*.test.mjs');

  assert.ok(installIndex >= 0);
  assert.ok(auditIndex > installIndex);
  assert.ok(testIndex > auditIndex);
  assert.match(ciText, /actions\/checkout@[0-9a-f]{40} # v7/);
  assert.match(ciText, /actions\/setup-node@[0-9a-f]{40} # v7/);
  assert.match(ciText, /pnpm\/action-setup@[0-9a-f]{40} # v6/);
  assert.match(ciText, /actions\/upload-artifact@[0-9a-f]{40} # v7/);
  assert.match(ciText, /CFBundleExecutable/);
  assert.match(ciText, /Mach-O 64-bit executable arm64/);
  assert.match(ciText, /Contents\/Resources\/Assets\.car/);
  assert.doesNotMatch(ciText, /Resources.*index\.html/);
});

test('release workflows keep dispatch inputs and signing secrets out of shell source and logs', () => {
  const signingWorkflows = `${buildText}\n${windowsBuildText}\n${devTestBuildText}`;

  assert.match(releaseText, /RELEASE_SHA_INPUT: \$\{\{ inputs\.release_sha \}\}/);
  assert.match(releaseText, /\[\[ "\$RELEASE_SHA_INPUT" =~ \^\[0-9a-f\]\{40\}\$ \]\]/);
  assert.doesNotMatch(releaseText, /test "\$\{\{ inputs\.release_sha \}\}"/);
  assert.doesNotMatch(releaseText, /\[\[ "\$\{\{ inputs\.release_sha \}\}"/);
  assert.match(buildText, /pnpm install --frozen-lockfile/);
  assert.doesNotMatch(signingWorkflows, /SM_API_KEY[^\n]*Substring|Substring[^\n]*SM_API_KEY/);
  assert.doesNotMatch(signingWorkflows, /"[^"\n]*\$\{\{ secrets\.SM_/);
  assert.match(workflowOverviewText, /seven named checks/);
  assert.match(workflowOverviewText, /release_sha/);
  assert.doesNotMatch(workflowOverviewText, /manual triggers only|Auto-increment versioning/);
});

test('the scoped uuid upgrade preserves the v4 API BlockNote uses', () => {
  const require = createRequire(import.meta.url);
  const blockNoteRequire = createRequire(require.resolve('@blocknote/core'));
  const uuid = blockNoteRequire('uuid');

  assert.match(uuid.v4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('Next remains configured for a Tauri-compatible static export', () => {
  const require = createRequire(import.meta.url);
  const nextConfig = require('../../next.config.js');

  assert.equal(nextConfig.output, 'export');
  assert.equal(nextConfig.outputFileTracingRoot, new URL('../../', import.meta.url).pathname.replace(/\/$/, ''));
  assert.equal(nextConfig.images?.unoptimized, true);
  assert.equal(nextConfig.assetPrefix, '/');
});
