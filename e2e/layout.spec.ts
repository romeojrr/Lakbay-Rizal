// U1 / FR-91 (SRS v2.3 §5.3, §5.5): layout at 360, 768, 1440 and 1920 px and landscape.
// No sideways scroll, VT323 everywhere (never below 18 px, never bold), the v2.2 look kept,
// the scene at a whole-number scale, and screenshots of every width for review.
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
  test(`${width} × ${height}: map and stop fit, VT323 ≥ 18 px, screenshots`, async ({ page }) => {
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
        const wrong = styles.filter(
          (s) => !s.family.includes('VT323') || s.size < 18 || s.weight > 400,
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

test('FR-91: at 1440 px the scene is 3× (1152 px) — at least 70 % of the width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/stop/berlin-1887');
  const img = page.locator('[data-guide="scene"] img');
  await expect(img).toBeVisible();
  const box = await img.boundingBox();
  expect(box?.width).toBe(1152);
  expect(box?.height).toBe(648);
});

test('1920 px: the scene is 4× (1536 px); 768 px fills the width instead of 1×', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/stop/berlin-1887');
  const img = page.locator('[data-guide="scene"] img');
  expect((await img.boundingBox())?.width).toBe(1536);

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(async () => (await img.boundingBox())?.width ?? 0).toBeGreaterThan(600);
});

test('the v2.2 colours, borders and hard shadows are kept', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/region/europe');
  await expect(page.getByRole('heading', { level: 1, name: 'Europe' })).toBeVisible();
  const look = await page.evaluate(() => {
    const css = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el) : null;
    };
    const header = css('header');
    const passport = css('[data-guide="passport-button"]');
    const panel = css('[data-guide="timeline"]');
    const active = css('[data-guide="region-tabs"] [aria-current="page"]');
    return {
      headerBg: header?.backgroundColor,
      headerBorder: header?.borderBottom,
      passportBg: passport?.backgroundColor,
      panelBorder: panel?.border,
      panelShadow: panel?.boxShadow,
      panelRadius: panel?.borderRadius,
      activeTab: active?.backgroundColor,
      pageBg: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(look).toEqual({
    headerBg: 'rgb(31, 26, 36)',
    headerBorder: '4px solid rgb(107, 74, 43)',
    passportBg: 'rgb(217, 164, 65)',
    panelBorder: '3px solid rgb(31, 26, 36)',
    panelShadow: 'rgb(31, 26, 36) 6px 6px 0px 0px',
    panelRadius: '0px',
    activeTab: 'rgb(232, 137, 43)',
    pageBg: 'rgb(244, 238, 223)',
  });
});

test('slim bars: 56 px on desktop, 48 px and bottom navigation on phones', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/region/europe');
  const bar = page.locator('header > div');
  expect((await bar.boundingBox())?.height).toBe(56);
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

  await page.setViewportSize({ width: 360, height: 740 });
  expect((await bar.boundingBox())?.height).toBe(48);
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
});

test('the collapsed side panel is remembered after a refresh', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/region/europe');
  await page.getByRole('button', { name: 'Hide panel' }).click();
  await expect(page.getByRole('link', { name: 'Enter Barcelona ▶' })).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Show panel' })).toBeVisible();
  const rail = await page
    .getByRole('complementary', { name: 'Stops in this region' })
    .boundingBox();
  expect(rail?.width).toBeLessThanOrEqual(48);
});

test('phone: the bottom sheet changes height from its handle', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/region/europe');
  const sheet = page.getByRole('complementary', { name: 'Stops in this region' });
  const small = (await sheet.boundingBox())?.height ?? 0;
  await page.getByRole('button', { name: /Resize panel/ }).click();
  await expect.poll(async () => (await sheet.boundingBox())?.height ?? 0).toBeGreaterThan(small);
});

test('stop Info: drawer on desktop, Story | Info on phones', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/stop/berlin-1887');
  await page.getByRole('button', { name: 'Info', expanded: false }).click();
  const drawer = page.getByRole('region', { name: 'About this stop' });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('[data-guide="sources-card"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();

  await page.setViewportSize({ width: 360, height: 740 });
  await page.getByRole('button', { name: 'Info', pressed: false }).click();
  await expect(page.locator('[data-guide="sources-card"]')).toBeVisible();
  await expect(page.locator('[data-step]')).toBeHidden();
  await page.getByRole('button', { name: 'Story', pressed: false }).click();
  await expect(page.locator('[data-step]')).toBeVisible();
});

function testInfo() {
  return test.info();
}
