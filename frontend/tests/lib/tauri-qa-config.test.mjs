import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('QA launcher isolates the native dev instance without changing the release identity', async () => {
  const [packageJson, qaConfig, releaseConfig] = await Promise.all([
    readFile(new URL('package.json', root), 'utf8'),
    readFile(new URL('src-tauri/tauri.qa.conf.json', root), 'utf8'),
    readFile(new URL('src-tauri/tauri.conf.json', root), 'utf8'),
  ]);
  const scripts = JSON.parse(packageJson).scripts;
  const qa = JSON.parse(qaConfig);
  const release = JSON.parse(releaseConfig);

  assert.equal(scripts['tauri:dev:qa'], 'tauri dev --config src-tauri/tauri.qa.conf.json -- --features metal');
  assert.equal(scripts['tauri:build:qa'], 'tauri build --debug --bundles app --config src-tauri/tauri.qa.conf.json --features metal');
  assert.equal(qa.identifier, 'com.meetily.improved.qa');
  assert.equal(qa.productName, 'Meetily Improved QA');
  assert.equal(qa.app.windows[0].title, 'Meetily Improved QA');
  for (const config of [qa, release]) {
    assert.equal(config.app.windows[0].width, 1280);
    assert.equal(config.app.windows[0].height, 820);
    assert.equal(config.app.windows[0].minWidth, 1100);
    assert.equal(config.app.windows[0].minHeight, 720);
  }
  assert.equal(release.identifier, 'com.meetily.ai');
});
