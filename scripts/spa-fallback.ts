// Copies dist/index.html to dist/404.html after a build.
// GitHub Pages serves 404.html for unknown paths, so deep links like /stop/berlin-1887
// still load the app there (FR-2). Netlify and Vercel use their own rewrite rules.
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] ?? 'dist';
const index = join(outDir, 'index.html');
if (existsSync(index)) {
  copyFileSync(index, join(outDir, '404.html'));
  console.log(`spa-fallback: ${outDir}/404.html written`);
}
