import { $, browser } from '@wdio/globals';

export const routes = [
  { nav: 'Home', heading: 'Work from what was said.', path: '/' },
  { nav: 'New meeting', heading: 'New meeting', path: '/new-meeting' },
  { nav: 'Saved meetings', heading: 'Saved meetings', path: '/meetings' },
  { nav: 'Ask meetings', heading: 'Ask meetings', path: '/chat' },
];

export async function expectPageHeading(heading, level = 1) {
  await browser.waitUntil(
    () => browser.execute(({ heading, level }) => {
      return Array.from(document.querySelectorAll(`h${level}`)).some((element) => (
        element.textContent?.trim() === heading && element.getClientRects().length > 0
      ));
    }, { heading, level }),
    { timeout: 60_000, timeoutMsg: `Expected visible h${level} heading "${heading}".` },
  );
}

export async function openSidebarRoute(nav, heading, path) {
  const button = await $(`button[aria-label="${nav}"]`);
  await button.waitForClickable();
  await button.click();
  await browser.waitUntil(
    async () => await browser.execute(() => window.location.pathname) === path,
    { timeout: 30_000, timeoutMsg: `Expected route ${path} after selecting ${nav}.` },
  );
  await expectPageHeading(heading);
}

export async function setAppearance(preference) {
  const settings = await $('button[aria-label="Settings"]');
  await settings.waitForClickable({ timeout: 60_000 });
  await settings.click();
  await browser.waitUntil(
    async () => await browser.execute(() => window.location.pathname) === '/settings',
    { timeout: 30_000, timeoutMsg: 'Expected /settings after selecting Settings.' },
  );
  await expectPageHeading('Settings');

  const generalTab = await $('[role="tab"][aria-label="General"]');
  await generalTab.click();
  await browser.waitUntil(async () => await generalTab.getAttribute('data-state') === 'active');

  const radio = await $(`[role="radio"][aria-label="${preference}"]`);
  await radio.click();
  await browser.waitUntil(async () => {
    const theme = await browser.execute(() => document.documentElement.dataset.theme);
    return preference === 'System' ? theme === 'light' || theme === 'dark' : theme === preference.toLowerCase();
  });
}
