// Lists the UI strings that have no Filipino yet (SRS v2.3 §3.10). The game shows the English
// for each of them. Add the Filipino to src/i18n/fil.json under the same key.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Tree = { [key: string]: string | Tree };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => JSON.parse(readFileSync(join(root, file), 'utf8')) as Tree;

function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of leaves(value, path)) out.set(k, v);
  }
  return out;
}

const en = leaves(read('src/i18n/en.json'));
const fil = leaves(read('src/i18n/fil.json'));
// Strings with no words (symbols and placeholders only) never need a translation.
const missing = [...en].filter(
  ([key, value]) => !fil.get(key)?.trim() && /\p{L}/u.test(value.replace(/\{\w+\}/g, '')),
);

for (const [key, value] of missing) console.log(`${key}\t${value}`);
console.log(
  `\ni18n-missing: ${missing.length} of ${en.size} UI strings have no Filipino yet ` +
    `(src/i18n/fil.json). The game shows the English for these.`,
);
