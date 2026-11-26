// `npm run lighthouse [baseUrl]` — Performance and Accessibility scores, mobile and desktop
// (SRS §0: both must be ≥ 90). Start a server first, e.g. `npm run build:drafts && npm run preview`.
// Uses the Chromium that Playwright installs. HTML reports go to lighthouse/.
import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '');
const PAGES = ['/', '/region/philippines', '/region/europe', '/stop/calamba-1861', '/passport'];
const MIN = 90;

mkdirSync('lighthouse', { recursive: true });
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox'],
});

interface Row {
  page: string;
  form: string;
  performance: number;
  accessibility: number;
  'LCP s': string;
  'TBT ms': number;
  CLS: string;
}
// Like Lighthouse CI: each page is audited RUNS times and the median run is kept, after one
// warm-up audit that is thrown away (the first audit after Chrome starts is always slow).
const RUNS = 3;

async function audit(url: string, form: 'mobile' | 'desktop') {
  const result = await lighthouse(
    url,
    {
      port: chrome.port,
      output: 'html',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility'],
    },
    form === 'desktop' ? desktopConfig : undefined,
  );
  if (!result) throw new Error(`no Lighthouse result for ${url}`);
  return result;
}

const rows: Row[] = [];
try {
  await audit(base + PAGES[0], 'mobile'); // warm-up
  for (const path of PAGES) {
    for (const form of ['mobile', 'desktop'] as const) {
      const runs: Awaited<ReturnType<typeof audit>>[] = [];
      for (let i = 0; i < RUNS; i++) runs.push(await audit(base + path, form));
      const perf = (r: (typeof runs)[number]) => r.lhr.categories.performance?.score ?? 0;
      runs.sort((a, b) => perf(a) - perf(b));
      const result = runs[Math.floor(RUNS / 2)] ?? runs[0];
      if (!result) continue;
      const { categories, audits } = result.lhr;
      const score = (key: string) => Math.round((categories[key]?.score ?? 0) * 100);
      const value = (key: string) => audits[key]?.numericValue ?? 0;
      rows.push({
        page: path,
        form,
        performance: score('performance'),
        accessibility: score('accessibility'),
        'LCP s': (value('largest-contentful-paint') / 1000).toFixed(2),
        'TBT ms': Math.round(value('total-blocking-time')),
        CLS: value('cumulative-layout-shift').toFixed(3),
      });
      const name = `${path.replace(/\W+/g, '-').replace(/^-/, '')}-${form}.html`;
      writeFileSync(`lighthouse/${name}`, String(result.report));
    }
  }
} finally {
  chrome.kill();
}

console.table(rows);
const failing = rows.filter((r) => r.performance < MIN || r.accessibility < MIN);
if (failing.length > 0) {
  console.error(
    `lighthouse: ${failing.length} result(s) below ${MIN}. Reports are in lighthouse/.`,
  );
  process.exit(1);
}
console.log(`lighthouse: every score is ${MIN} or more. Reports are in lighthouse/.`);
