// Copies the starter-pack art in assets/ into public/assets/ so Vite can serve it.
// assets/ is the source of truth; public/assets/ is generated (and gitignored).
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'assets');
const to = join(root, 'public', 'assets');

function countFiles(dir: string): number {
  return readdirSync(dir, { withFileTypes: true }).reduce(
    (n, entry) => n + (entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1),
    0,
  );
}

if (!existsSync(from)) {
  console.error(`copy-assets: source folder not found: ${from}`);
  process.exit(1);
}

rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log(`copy-assets: copied ${countFiles(to)} files from assets/ to public/assets/`);
