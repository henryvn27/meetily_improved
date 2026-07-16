import AxeBuilder from '@axe-core/webdriverio';
import axe from 'axe-core';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

async function analyzeInCurrentWindow(browser) {
  await browser.execute(axe.source);
  return browser.execute(
    async (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
    wcagTags,
  );
}

export async function expectWcag22Aa(browser) {
  const isNativeTauri = await browser.execute(() => window.location.protocol === 'tauri:');
  const startedAt = Date.now();
  const results = isNativeTauri
    ? await analyzeInCurrentWindow(browser)
    : await new AxeBuilder({ client: browser }).withTags(wcagTags).analyze();

  if (process.env.MEETILY_E2E_DIAGNOSTICS === '1') {
    console.info(`[axe-timing] ${isNativeTauri ? 'native' : 'browser'} ${Date.now() - startedAt}ms`);
  }

  const details = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
  }));
  if (details.length > 0) {
    throw new Error(`WCAG 2.2 AA violations:\n${JSON.stringify(details, null, 2)}`);
  }
}
