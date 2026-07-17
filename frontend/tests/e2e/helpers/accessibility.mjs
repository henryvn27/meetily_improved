import axe from 'axe-core';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

async function analyzeInCurrentWindow(browser, selector) {
  await browser.execute(axe.source);
  return browser.execute(
    async ({ tags, selector }) => {
      const context = selector ? document.querySelector(selector) : document;
      if (!context) throw new Error(`Accessibility context not found: ${selector}`);
      const results = await window.axe.run(context, { runOnly: { type: 'tag', values: tags } });
      return results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      }));
    },
    { tags: wcagTags, selector },
  );
}

export async function expectWcag22Aa(browser, selector) {
  const isNativeTauri = await browser.execute(() => window.location.protocol === 'tauri:');
  const startedAt = Date.now();
  // Run axe in one browser execution for both browser and native modes. The
  // WebdriverIO builder fetches each result node through a long sequence of
  // protocol calls, which can strand the macOS CI worker when Chrome uses BiDi.
  const violations = await analyzeInCurrentWindow(browser, selector);

  if (process.env.MEETILY_E2E_DIAGNOSTICS === '1') {
    console.info(`[axe-timing] ${isNativeTauri ? 'native' : 'browser'} ${Date.now() - startedAt}ms`);
  }

  if (violations.length > 0) {
    throw new Error(`WCAG 2.2 AA violations:\n${JSON.stringify(violations, null, 2)}`);
  }
}
