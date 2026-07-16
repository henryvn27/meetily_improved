import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

const [strictConfig, homebrewDetector, indexedDbService, accessibilityHelper, browserQaConfig, browserQaSpec] = await Promise.all([
  readFile(new URL('eslint.strict.config.mjs', root), 'utf8'),
  readFile(new URL('src/components/DatabaseImport/HomebrewDatabaseDetector.tsx', root), 'utf8'),
  readFile(new URL('src/services/indexedDBService.ts', root), 'utf8'),
  readFile(new URL('tests/e2e/helpers/accessibility.mjs', root), 'utf8'),
  readFile(new URL('tests/e2e/wdio.browser.conf.mjs', root), 'utf8'),
  readFile(new URL('tests/e2e/specs/browser/workspace.spec.mjs', root), 'utf8'),
]);

test('strict lint composes core policy with the installed Next TypeScript profile', () => {
  assert.match(strictConfig, /import coreConfig from "\.\/eslint\.config\.mjs"/);
  assert.match(strictConfig, /\.\.\.coreConfig/);
  assert.match(strictConfig, /compat\.extends\("next\/typescript"\)/);
  assert.doesNotMatch(strictConfig, /rules:\s*\{/);
});

test('successful Homebrew migration reports completion before reloading', () => {
  const successIndex = homebrewDetector.indexOf("toast.success('Database imported successfully! Reloading...')");
  const callbackIndex = homebrewDetector.indexOf('onImportSuccess();', successIndex);
  const reloadIndex = homebrewDetector.indexOf('window.location.reload();', callbackIndex);

  assert.ok(successIndex >= 0);
  assert.ok(callbackIndex > successIndex);
  assert.ok(reloadIndex > callbackIndex);
});

test('IndexedDB recovery preserves the backend transcript sequence identifier', () => {
  assert.match(indexedDbService, /sequenceId:\s*transcript\.sequence_id/);
});

test('browser accessibility scans use one in-page axe execution', () => {
  assert.match(accessibilityHelper, /const violations = await analyzeInCurrentWindow\(browser, selector\)/);
  assert.match(accessibilityHelper, /selector \? document\.querySelector\(selector\) : document/);
  assert.match(accessibilityHelper, /return results\.violations\.map/);
  assert.doesNotMatch(accessibilityHelper, /AxeBuilder|@axe-core\/webdriverio/);
  assert.doesNotMatch(browserQaConfig, /wdio:enforceWebDriverClassic/);
  assert.match(browserQaSpec, /before\(async \(\) => \{[\s\S]*installEmptyBackendMocks\(browser\)/);
  assert.doesNotMatch(browserQaSpec, /beforeEach|afterEach/);
});

test('proven-dead generic form components stay removed', async () => {
  for (const file of [
    'src/components/molecules/form-components/form-input-item.tsx',
    'src/components/molecules/form-components/form-input-switch.tsx',
    'src/components/molecules/form-components/form-select-item.tsx',
  ]) {
    await assert.rejects(access(new URL(file, root)));
  }
});
