import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { $, browser, expect } from '@wdio/globals';
import { expectWcag22Aa } from '../../helpers/accessibility.mjs';
import { expectPageHeading, openSidebarRoute, routes, setAppearance } from '../../helpers/routes.mjs';

const artifactDir = resolve(process.cwd(), 'tests/e2e/artifacts/native');

describe('Meetily native macOS workspace', () => {
  before(async () => {
    await mkdir(artifactDir, { recursive: true });
  });

  beforeEach(async () => {
    await browser.execute(() => window.location.assign('/'));
    await expectPageHeading('Work from what was said.');
    await browser.waitUntil(
      async () => {
        const theme = await browser.execute(() => document.documentElement.dataset.theme);
        return theme === 'light' || theme === 'dark';
      },
      {
        timeout: 20_000,
        timeoutMsg: 'Theme hydration did not resolve before native assertions',
      },
    );
  });

  it('uses the opt-in native bridge and walks the real empty local workspace', async () => {
    const location = await browser.tauri.execute(() => window.location.href);
    const resolvedTheme = await browser.execute(() => document.documentElement.dataset.theme);
    expect(location).toContain('tauri');
    expect(['light', 'dark']).toContain(resolvedTheme);
    await expectPageHeading('Work from what was said.');
    await expectWcag22Aa(browser);

    for (const route of routes.slice(1)) {
      await openSidebarRoute(route.nav, route.heading, route.path);
    }

    await browser.keys(['Meta', ',']);
    await expectPageHeading('Settings');
    await expectWcag22Aa(browser);

    await browser.execute(() => window.location.assign('/meeting-details'));
    await expectPageHeading('Meeting could not be opened', 2);
  });

  it('captures real Light and Dark native evidence at both release sizes', async () => {
    for (const [width, height] of [[1280, 820], [1100, 720]]) {
      await browser.setWindowSize(width, height);
      await setAppearance('Light');
      await $('button[aria-label="Home"]').click();
      await expectPageHeading('Work from what was said.');
      await browser.saveScreenshot(resolve(artifactDir, `home-light-${width}x${height}.png`));

      await setAppearance('Dark');
      await $('button[aria-label="Home"]').click();
      await expectPageHeading('Work from what was said.');
      await browser.saveScreenshot(resolve(artifactDir, `home-dark-${width}x${height}.png`));
    }
  });
});
