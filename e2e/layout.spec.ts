// Layout at 360, 768, 1440 and 1920 px and landscape (owner decisions 2026-11-26): the v2.2
// layout (map | panel with the timeline below; scene + dialogue | info cards; panels below
// on phones), Nunito for reading text and VT323 for the interface, and the soft style.
import { expect, test, type Page } from '@playwright/test';
import { skipIntroOnFreshProfile } from './helpers';

const WIDTHS: [number, number][] = [
  [360, 740],
  [768, 1024],
  [1440, 900],
  [1920, 1080],
  [740, 360], // landscape phone
];

test.beforeEach(async ({ page }, info) => {
  // Each test sets its own viewport, so one project is enough.
  test.skip(info.project.name !== 'desktop', 'viewports are set per test');
  await skipIntroOnFreshProfile(page);
  // Free mode and a finished Berlin story so every element is there.
  await page.addInitScript(() => {
    const key = 'lakbay-rizal:v1';
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      state?: Record<string, unknown>;
    };
    if (saved.state && !saved.state.layoutSeeded) {
      saved.state = { ...saved.state, mode: 'free', visited: ['berlin-1887'], layoutSeeded: true };
      localStorage.setItem(key, JSON.stringify(saved));
    }
  });
});

/** Every visible piece of text: its font family, size and weight. */
async function textStyles(page: Page) {
  return page.evaluate(() => {
    const out: { text: string; family: string; size: number; weight: number }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim();
      const el = node.parentElement;
      if (!text || !el) continue;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width === 0 || style.visibility === 'hidden' || el.closest('.visually-hidden'))
        continue;
      out.push({
        text: text.slice(0, 30),
        family: style.fontFamily,
        size: parseFloat(style.fontSize),
        weight: Number(style.fontWeight),
      });
    }
    return out;
  });
}

async function expectNoSideScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const [width, height] of WIDTHS) {
  test(`${width} × ${height}: no sideways scroll; Nunito to read, VT323 for the interface`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    for (const size of ['normal', 'large'] as const) {
      await page.goto('/settings');
      await page.getByRole('radio', { name: size === 'normal' ? 'Normal' : 'Large' }).check();

      for (const [name, path] of [
        ['map', '/region/europe'],
        ['stop', '/stop/berlin-1887'],
        ['passport', '/passport'],
      ] as const) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeAttached();
        await page.evaluate(() => document.fonts.ready);
        await expectNoSideScroll(page);

        const styles = await textStyles(page);
        // Only the two fonts; the pixel font never below 18 px; only weights the fonts have.
        const wrong = styles.filter(
          (s) =>
            !/VT323|Nunito/.test(s.family) ||
            (s.family.includes('VT323') && (s.size < 18 || s.weight > 400)) ||
            ![400, 700].includes(s.weight),
        );
        expect(wrong, `${name} at ${width}px (${size})`).toEqual([]);

        if (size === 'normal') {
          await page.screenshot({
            path: testInfo().outputPath(`${name}-${width}x${height}.png`),
          });
        }
      }
    }
  });
}

test('reading text is Nunito; headings and buttons are VT323', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/stop/berlin-1887');
  await page.getByRole('button', { name: 'Next ▶' }).click();
  const narration = page.locator('[data-step="narration"] p').first();
  await expect(narration).toHaveCSS('font-family', /Nunito/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /VT323/);
  await expect(page.getByRole('button', { name: 'Next ▶' })).toHaveCSS('font-family', /VT323/);
});

test('map: the side panel beside the map, the timeline across the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/region/europe');
  const panelRole = { name: 'Stops in this region' };
  const map = await page.locator('[data-guide="map"]').boundingBox();
  const panel = await page.getByRole('complementary', panelRole).boundingBox();
  const timeline = await page.locator('[data-guide="timeline"]').boundingBox();
  if (!map || !panel || !timeline) throw new Error('missing');
  expect(panel.x).toBeGreaterThan(map.x + map.width - 1);
  expect(timeline.y).toBeGreaterThan(map.y + map.height - 1);
  expect(timeline.width).toBeGreaterThan(map.width);

  // Phones: the panel goes below the map.
  await page.setViewportSize({ width: 360, height: 740 });
  const phoneMap = await page.locator('[data-guide="map"]').boundingBox();
  const phonePanel = await page.getByRole('complementary', panelRole).boundingBox();
  if (!phoneMap || !phonePanel) throw new Error('missing');
  expect(phonePanel.y).toBeGreaterThan(phoneMap.y + phoneMap.height - 1);
});

test('stop: scene and dialogue box on the left, info cards on the right; below on phones', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/stop/berlin-1887');
  const cardsRole = { name: 'About this stop' };
  const scene = await page.locator('[data-guide="scene"]').boundingBox();
  const text = await page.locator('[data-step]').boundingBox();
  const cards = await page.getByRole('complementary', cardsRole).boundingBox();
  if (!scene || !text || !cards) throw new Error('missing');
  expect(text.y).toBeGreaterThanOrEqual(scene.y + scene.height - 1);
  expect(cards.x).toBeGreaterThan(scene.x + scene.width - 1);
  expect(scene.width / scene.height).toBeCloseTo(16 / 9, 1);

  await page.setViewportSize({ width: 360, height: 740 });
  const phoneText = await page.locator('[data-step]').boundingBox();
  const phoneCards = await page.getByRole('complementary', cardsRole).boundingBox();
  if (!phoneText || !phoneCards) throw new Error('missing');
  expect(phoneCards.y).toBeGreaterThan(phoneText.y);
});

test('the soft style: rounded cards, thin borders, blurred shadows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/region/europe');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const look = await page.evaluate(() =>
    [...document.querySelectorAll('main aside > *')]
      .map((el) => getComputedStyle(el))
      .filter((cs) => cs.borderTopWidth !== '0px')
      .map((cs) => ({
        radius: cs.borderTopLeftRadius,
        width: cs.borderTopWidth,
        shadow: cs.boxShadow,
      })),
  );
  expect(look.length).toBeGreaterThan(0);
  for (const card of look) {
    expect(parseFloat(card.width)).toBeLessThanOrEqual(2);
    // No hard offset shadow (an un-blurred shadow ends in "0px" blur).
    expect(card.shadow).not.toMatch(/\) -?\d+px -?\d+px 0px/);
  }
  expect(look.some((card) => card.radius === '6px')).toBe(true);
  // The header keeps the v2.2 colours.
  await expect(page.getByRole('banner')).toHaveCSS('background-color', 'rgb(31, 26, 36)');
});

function testInfo() {
  return test.info();
}
