import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** NFR-2: axe finds no serious or critical issues on the page (WCAG 2.1 A/AA rules). */
export async function expectNoSeriousA11yIssues(page: Page, where: string) {
  await page.evaluate(() => document.fonts.ready);
  // Let fade-ins finish (looping ones never do), so contrast is measured on the final colours.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      rule: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
    }));
  expect(serious, `axe issues on ${where}`).toEqual([]);
}
