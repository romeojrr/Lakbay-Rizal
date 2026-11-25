// Validates public/content/*.json and checks every asset it points to (SRS §8.3, FR-61).
// Runs before `npm run build` and `npm test`; exits with code 1 when anything is wrong.
import { closeSync, existsSync, openSync, readFileSync, readSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_FILES } from '../src/content/constants';
import {
  formatProblem,
  validateContent,
  type AssetInfo,
  type RawContent,
} from '../src/content/validate';

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
  if (header.toString('latin1', 1, 4) !== 'PNG') return { width: 0, height: 0 };
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

const raw: Partial<RawContent> = {};
const readProblems: string[] = [];
for (const name of CONTENT_FILES) {
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

const { content, errors, warnings } = validateContent(raw as RawContent, { assetInfo: pngInfo });

for (const warning of warnings) console.warn(`  WARN  ${formatProblem(warning)}`);

if (!content) {
  fail([
    `${errors.length} problem${errors.length === 1 ? '' : 's'} in public/content/:`,
    ...errors.map((error) => `  ERROR ${formatProblem(error)}`),
    '',
    'Fix the fields above, then run `npm run validate-content` again.',
  ]);
}

const verified = content.stops.filter((s) => s.status === 'verified').length;
console.log(
  `validate-content: OK — ${content.stops.length} stops (${verified} verified), ` +
    `${content.regions.length} regions, ${Object.keys(content.characters).length} characters, ` +
    `${Object.keys(content.items).length} items, ${content.sources.length} sources` +
    (warnings.length > 0 ? `; ${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : ''),
);
