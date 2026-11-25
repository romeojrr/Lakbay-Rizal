// Validates public/content/*.json and checks every asset it points to (SRS §8.3, FR-61).
// Runs before `npm run build` and `npm test`; exits with code 1 when anything is wrong.
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_FILES, FIL_CONTENT_FILES, V3_CONTENT_FILES } from '../src/content/constants';
import {
  formatProblem,
  validateContent,
  type AssetInfo,
  type Problem,
  type RawContent,
} from '../src/content/validate';
import type { Content } from '../src/content/schemas';
import { validateContentV3, type RawV3Content } from '../src/content/validate.v3';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'public', 'content');

function fail(lines: string[]): never {
  console.error(['', 'validate-content: FAILED', ...lines, ''].join('\n'));
  process.exit(1);
}

// Content paths look like /assets/scenes/x.png. assets/ is the source that
// scripts/copy-assets.ts mirrors into public/assets/, so check it there.
function pngInfo(path: string): AssetInfo | null {
  const file = join(root, path);
  if (!existsSync(file)) return null;
  const header = Buffer.alloc(24);
  const fd = openSync(file, 'r');
  try {
    readSync(fd, header, 0, 24, 0);
  } finally {
    closeSync(fd);
  }
  const bytes = statSync(file).size;
  if (header.toString('latin1', 1, 4) !== 'PNG') return { width: 0, height: 0, bytes };
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20), bytes };
}

const raw: Record<string, unknown> = {};
const readProblems: string[] = [];
for (const name of [...CONTENT_FILES, ...V3_CONTENT_FILES, ...FIL_CONTENT_FILES]) {
  const file = join(contentDir, `${name}.json`);
  if (!existsSync(file)) {
    readProblems.push(`  ERROR ${name}.json: file is missing from public/content/`);
    continue;
  }
  try {
    raw[name] = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    readProblems.push(`  ERROR ${name}.json: not valid JSON (${(error as Error).message})`);
  }
}
if (readProblems.length > 0) fail(readProblems);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const report = (errors: Problem[], warnings: Problem[]) => {
  for (const warning of warnings) console.warn(`  WARN  ${formatProblem(warning)}`);
  if (errors.length === 0) return;
  fail([
    `${plural(errors.length, 'problem')} in public/content/:`,
    ...errors.map((error) => `  ERROR ${formatProblem(error)}`),
    '',
    'Fix the fields above, then run `npm run validate-content` again.',
  ]);
};

// v2 files first: the v3 checks need their characters, items, regions and sources.
const v2 = validateContent(raw as RawContent, { assetInfo: pngInfo });
report(v2.errors, v2.warnings);
const content = v2.content as Content;

const v3 = validateContentV3(raw as RawV3Content, content, { assetInfo: pngInfo });
report(v3.errors, v3.warnings);
const contentV3 = v3.content as NonNullable<typeof v3.content>;

const verified = content.stops.filter((s) => s.status === 'verified').length;
const questions = contentV3['stops.v3'].reduce((n, stop) => n + stop.quiz.length, 0);
const warnings = v2.warnings.length + v3.warnings.length;
console.log(
  `validate-content: OK — ${plural(content.stops.length, 'stop')} (${verified} verified), ` +
    `${plural(content.regions.length, 'region')}, ${plural(Object.keys(content.characters).length, 'character')}, ` +
    `${plural(Object.keys(content.items).length, 'item')}, ${plural(content.sources.length, 'source')}; ` +
    `v3: ${plural(questions, 'question')}, ${plural(contentV3.guide.tour.length, 'tour step')}, ` +
    `${plural(contentV3.gamification.achievements.length, 'achievement')}; ` +
    `Filipino: ${contentV3['i18n/fil.stops'].status}` +
    (warnings > 0 ? `; ${plural(warnings, 'warning')}` : ''),
);
