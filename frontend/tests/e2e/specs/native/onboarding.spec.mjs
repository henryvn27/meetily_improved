import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browser, expect } from '@wdio/globals';
import { expectWcag22Aa } from '../../helpers/accessibility.mjs';
import { expectPageHeading } from '../../helpers/routes.mjs';

const artifactDir = resolve(process.cwd(), 'tests/e2e/artifacts/native');
const appearances = ['Light', 'Dark'];
const releaseSizes = [[1280, 820], [1100, 720]];

describe('Meetily native macOS onboarding', () => {
  before(async () => {
    await mkdir(artifactDir, { recursive: true });
  });

  it('captures the real local-model setup overview without starting downloads or permission prompts', async () => {
    for (const [width, height] of releaseSizes) {
      await browser.setWindowSize(width, height);

      for (const appearance of appearances) {
        await browser.execute((preference) => {
          window.localStorage.setItem('meetily-theme-preference', preference.toLowerCase());
          window.location.reload();
        }, appearance);
        await expectPageHeading('Set up local intelligence.');
        await browser.waitUntil(
          () => browser.execute((theme) => document.documentElement.dataset.theme === theme, appearance.toLowerCase()),
        );
        await expectWcag22Aa(browser);

        const bodyText = await browser.execute(() => document.body.innerText);
        expect(bodyText).toContain('Download Transcription Engine');
        expect(bodyText).toContain('Download Summarization Engine');
        expect(bodyText).not.toContain('Microphone Access');

        await browser.execute(() => {
          document.body.tabIndex = -1;
          document.body.focus();
          document.body.removeAttribute('tabindex');
        });
        await browser.saveScreenshot(resolve(
          artifactDir,
          `onboarding-setup-${appearance.toLowerCase()}-${width}x${height}.png`,
        ));
      }
    }
  });
});
