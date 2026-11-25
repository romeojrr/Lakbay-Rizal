// One-time conversion of the starter pack's content/ into public/content/*.json (SRS §6.1).
// After this, public/content/ is the file the team edits. The script refuses to overwrite
// existing files so it cannot wipe out fact-checking work; pass --force to regenerate anyway.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'content');
const force = process.argv.includes('--force');

interface Seed {
  characters: Record<string, unknown>;
  items: Record<string, unknown>;
  builder: unknown;
  regions: Record<string, Record<string, unknown>>;
  stops: { order: number }[];
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(join(root, path), 'utf8'));
const seed = readJson('content/stops.seed.json') as Seed;
const bibliography = readJson('content/sources.json') as { sources: unknown[] };

// Regions become an array in tab order (SRS §3.3), each with its id.
const REGION_ORDER = ['philippines', 'asia', 'europe', 'america'];
const regions = REGION_ORDER.map((id) => {
  const region = seed.regions[id];
  if (!region) throw new Error(`convert-seed: the seed has no region "${id}"`);
  return { id, ...region };
});

const files: Record<string, unknown> = {
  stops: [...seed.stops].sort((a, b) => a.order - b.order),
  regions,
  characters: seed.characters,
  items: seed.items,
  builder: seed.builder,
  sources: bibliography.sources,
};

const existing = Object.keys(files).filter((name) => existsSync(join(outDir, `${name}.json`)));
if (existing.length > 0 && !force) {
  console.error(
    `convert-seed: public/content/ already has ${existing.map((n) => `${n}.json`).join(', ')}.\n` +
      'Those files may hold fact-checking edits. Run with --force only if you mean to replace them.',
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
for (const [name, data] of Object.entries(files)) {
  const file = join(outDir, `${name}.json`);
  const options = await resolveConfig(file);
  writeFileSync(file, await format(JSON.stringify(data, null, 2), { ...options, filepath: file }));
}
console.log(`convert-seed: wrote ${Object.keys(files).length} files to public/content/`);
