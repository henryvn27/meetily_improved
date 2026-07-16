import { $, browser, expect } from '@wdio/globals';
import { expectWcag22Aa } from '../../helpers/accessibility.mjs';
import { installEmptyBackendMocks } from '../../helpers/browser-empty-backend.mjs';
import { expectPageHeading, openSidebarRoute, routes, setAppearance } from '../../helpers/routes.mjs';

const appearances = ['Light', 'Dark'];
const settingsSections = ['General', 'Recordings', 'Transcription', 'Summary', 'Beta'];
const settingsHeadings = {
  General: 'General settings',
  Recordings: 'Recording settings',
  Transcription: 'Transcription settings',
  Summary: 'Summary settings',
  Beta: 'Beta settings',
};

async function expectAccessible(context) {
  try {
    await expectWcag22Aa(browser);
  } catch (error) {
    throw new Error(`${context}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

describe('Meetily browser-mode workspace', () => {
  beforeEach(async () => {
    await browser.url('http://127.0.0.1:3120/');
    await installEmptyBackendMocks(browser);
    try {
      await $('button[aria-label="Settings"]').waitForDisplayed({ timeout: 60_000 });
    } catch (error) {
      await browser.saveScreenshot('/tmp/meetily-browser-qa-bootstrap-failure.png');
      const diagnostic = await browser.execute(() => ({
        url: window.location.href,
        readyState: document.readyState,
        title: document.title,
        text: document.body?.innerText.slice(0, 2_000) ?? '',
        html: document.body?.innerHTML.slice(0, 2_000) ?? '',
      }));
      throw new Error(`Empty-workspace bootstrap did not render: ${JSON.stringify(diagnostic)}. ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  for (const appearance of appearances) {
    for (const route of routes) {
      it(`passes WCAG 2.2 AA on ${appearance} ${route.nav}`, async () => {
        await setAppearance(appearance);
        await openSidebarRoute(route.nav, route.heading, route.path);
        await expectAccessible(`${appearance} / ${route.nav}`);
      });
    }

    for (const section of settingsSections) {
      it(`passes WCAG 2.2 AA on ${appearance} Settings ${section}`, async () => {
        await setAppearance(appearance);
        const selector = `[role="tab"][aria-label="${section}"]`;
        await $(selector).click();
        try {
          await browser.waitUntil(
            () => browser.execute((expectedHeading) => {
              const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
              return activePanel?.querySelector('h2')?.textContent?.trim() === expectedHeading;
            }, settingsHeadings[section]),
            {
              timeout: 15_000,
              timeoutMsg: `Settings did not activate the ${section} panel`,
            },
          );
        } catch (error) {
          await browser.saveScreenshot(`/tmp/meetily-browser-qa-settings-${section.toLowerCase()}-failure.png`);
          const diagnostic = await browser.execute(() => ({
            activeElement: document.activeElement?.outerHTML,
            body: document.body?.innerText.slice(0, 2_000),
            tabs: Array.from(document.querySelectorAll('[role="tab"]')).map((tab) => ({
              label: tab.getAttribute('aria-label'),
              selected: tab.getAttribute('aria-selected'),
              state: tab.getAttribute('data-state'),
            })),
            panels: Array.from(document.querySelectorAll('[role="tabpanel"]')).map((panel) => ({
              state: panel.getAttribute('data-state'),
              heading: panel.querySelector('h2')?.textContent?.trim(),
            })),
          }));
          throw new Error(`${error instanceof Error ? error.message : String(error)}: ${JSON.stringify(diagnostic)}`);
        }
        await expectAccessible(`${appearance} / Settings / ${section}`);
      });
    }

    it(`passes WCAG 2.2 AA on ${appearance} missing-meeting recovery`, async () => {
      await setAppearance(appearance);
      await browser.url('http://127.0.0.1:3120/meeting-details');
      await expectPageHeading('Meeting could not be opened', 2);
      await expectAccessible(`${appearance} / missing-meeting recovery`);
    });
  }

  it('persists theme selection and compares both required workspace sizes', async () => {
    for (const [width, height] of [[1280, 820], [1100, 720]]) {
      await browser.setWindowSize(width, height);

      await setAppearance('Light');
      await $('button[aria-label="Home"]').click();
      await expectPageHeading('Work from what was said.');
      expect(await browser.checkScreen(`home-light-${width}x${height}`, {
        ignoreAntialiasing: true,
        misMatchPercentage: 0.15,
      })).toBeLessThanOrEqual(0.15);

      await setAppearance('Dark');
      await $('button[aria-label="Home"]').click();
      await expectPageHeading('Work from what was said.');
      expect(await browser.checkScreen(`home-dark-${width}x${height}`, {
        ignoreAntialiasing: true,
        misMatchPercentage: 0.15,
      })).toBeLessThanOrEqual(0.15);
    }
  });

  it('keeps keyboard focus visible, reachable, and unobscured with reduced motion', async () => {
    await browser.url('http://127.0.0.1:3120/');
    await $('#main-content').waitForDisplayed();
    await browser.execute(() => {
      document.body.tabIndex = -1;
      document.body.focus();
      document.body.removeAttribute('tabindex');
    });
    await browser.keys(['Tab']);
    const skipLinkFocused = await browser.execute(() => document.activeElement?.matches('a.skip-link') ?? false);
    expect(skipLinkFocused).toBe(true);
    await browser.keys(['Enter']);
    const mainFocused = await browser.execute(() => document.activeElement?.id === 'main-content');
    expect(mainFocused).toBe(true);

    await browser.keys(['Tab']);
    const focusBounds = await browser.execute(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return null;
      const rect = active.getBoundingClientRect();
      return { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    expect(focusBounds).not.toBeNull();
    expect(focusBounds.top).toBeGreaterThanOrEqual(0);
    expect(focusBounds.left).toBeGreaterThanOrEqual(0);
    expect(focusBounds.right).toBeLessThanOrEqual(await browser.execute(() => window.innerWidth));
    expect(focusBounds.bottom).toBeLessThanOrEqual(await browser.execute(() => window.innerHeight));
    expect(focusBounds.width).toBeGreaterThanOrEqual(24);
    expect(focusBounds.height).toBeGreaterThanOrEqual(24);

    expect(await browser.execute(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const timing = await browser.execute(() => {
      const target = document.querySelector('button');
      const style = target ? getComputedStyle(target) : null;
      return style ? { animationDuration: style.animationDuration, transitionDuration: style.transitionDuration } : null;
    });
    expect(timing).not.toBeNull();
    expect(Number.parseFloat(timing.transitionDuration)).toBeLessThanOrEqual(0.00001);
  });
});
