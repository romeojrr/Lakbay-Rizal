// One-time copy of the v2.3 content pack (content/stops.v3.json, guide.json,
// gamification.json, content/i18n/fil.*.json) into public/content/ (SRS §6.1, U2).
// - stops.v3.json: the stops only, in order, with the short place labels the app already
//   uses (place.label from public/content/stops.json). Story and quiz text are copied as is.
// - characters.json: adds `portrait` and `offscreenOnly` from the pack; every other field
//   already in the file is kept.
// - guide.json, gamification.json and the Filipino files: copied as they are.
// The old stops.json stays until the v3 story player works (U3).
// The script refuses to overwrite files it wrote before; pass --force to do it anyway.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'content');
const force = process.argv.includes('--force');

interface V3Stop {
  id: string;
  order: number;
  place: Record<string, unknown>;
}

interface V3Pack {
  characters: Record<string, Record<string, unknown>>;
  stops: V3Stop[];
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(join(root, path), 'utf8'));

const pack = readJson('content/stops.v3.json') as V3Pack;
const current = readJson('public/content/stops.json') as { id: string; place: { label: string } }[];
const characters = readJson('public/content/characters.json') as Record<
  string,
  Record<string, unknown>
>;

const labels = new Map(current.map((stop) => [stop.id, stop.place.label]));
const stops = [...pack.stops]
  .sort((a, b) => a.order - b.order)
  .map((stop) => {
    const label = labels.get(stop.id);
    if (label === undefined) throw new Error(`convert-v3: ${stop.id} is not in stops.json`);
    return { ...stop, place: { label, ...stop.place } };
  });

// Characters: keep the team's file, add the v3 fields (and characters the pack adds).
const mergedCharacters: Record<string, Record<string, unknown>> = { ...characters };
for (const [id, fromPack] of Object.entries(pack.characters)) {
  const { portrait, offscreenOnly } = fromPack;
  mergedCharacters[id] = {
    ...(characters[id] ?? { name: fromPack.name }),
    ...(portrait !== undefined ? { portrait } : {}),
    ...(offscreenOnly !== undefined ? { offscreenOnly } : {}),
  };
}

const newFiles: Record<string, unknown> = {
  'stops.v3.json': stops,
  'guide.json': readJson('content/guide.json'),
  'gamification.json': readJson('content/gamification.json'),
  'i18n/fil.stops.json': readJson('content/i18n/fil.stops.json'),
  'i18n/fil.guide.json': readJson('content/i18n/fil.guide.json'),
  'i18n/fil.gamification.json': readJson('content/i18n/fil.gamification.json'),
};

const existing = Object.keys(newFiles).filter((name) => existsSync(join(outDir, name)));
if (existing.length > 0 && !force) {
  console.error(
    `convert-v3: public/content/ already has ${existing.join(', ')}.\n` +
      'Those files may hold fact-checking edits. Run with --force only if you mean to replace them.',
  );
  process.exit(1);
}

mkdirSync(join(outDir, 'i18n'), { recursive: true });
const files = { ...newFiles, 'characters.json': mergedCharacters };
for (const [name, data] of Object.entries(files)) {
  const file = join(outDir, name);
  const options = await resolveConfig(file);
  writeFileSync(file, await format(JSON.stringify(data, null, 2), { ...options, filepath: file }));
}
console.log(`convert-v3: wrote ${Object.keys(files).length} files to public/content/`);
