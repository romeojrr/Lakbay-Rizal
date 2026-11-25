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

interface SeedStop {
  id: string;
  order: number;
  place: Record<string, unknown>;
}

interface Seed {
  characters: Record<string, unknown>;
  items: Record<string, unknown>;
  builder: unknown;
  regions: Record<string, Record<string, unknown>>;
  stops: SeedStop[];
}

// Short place names for pins and lists (place.label). Taken from each stop's place.then;
// the seed has no short name, and cutting place.then at a comma gives poor labels.
const PLACE_LABELS: Record<string, string> = {
  'calamba-1861': 'Calamba',
  'binan-1869': 'Biñan',
  'ateneo-1872': 'Ateneo',
  'ust-1877': 'Santo Tomas',
  'barcelona-1882': 'Barcelona',
  'madrid-1882': 'Madrid',
  'paris-1885': 'Paris',
  'heidelberg-1886': 'Heidelberg',
  'wilhelmsfeld-1886': 'Wilhelmsfeld',
  'leipzig-1886': 'Leipzig',
  'berlin-1887': 'Berlin',
  'leitmeritz-1887': 'Leitmeritz',
  'calamba-1887': 'Calamba',
  'japan-1888': 'Tokyo',
  'usa-1888': 'United States',
  'london-1888': 'London',
  'paris-1889': 'Paris',
  'brussels-1890': 'Brussels',
  'biarritz-1891': 'Biarritz',
  'ghent-1891': 'Ghent',
  'hongkong-1891': 'Hong Kong',
  'manila-1892': 'Tondo',
  'dapitan-1892': 'Dapitan',
  'fortsantiago-1896': 'Fort Santiago',
  'bagumbayan-1896': 'Bagumbayan',
};

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

const stops = [...seed.stops]
  .sort((a, b) => a.order - b.order)
  .map((stop) => ({ ...stop, place: { label: PLACE_LABELS[stop.id] ?? '', ...stop.place } }));

const files: Record<string, unknown> = {
  stops,
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
