import AxeBuilder from '@axe-core/webdriverio';

export async function expectWcag22Aa(browser) {
  const results = await new AxeBuilder({ client: browser })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();

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
