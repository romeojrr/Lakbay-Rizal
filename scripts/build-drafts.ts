// `npm run build:drafts` — a production build that also shows draft stops (FR-62).
// Use it for classroom testing and deploy previews. Works the same on Windows, macOS and Linux.
import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, INCLUDE_DRAFTS: 'true' },
});
process.exit(result.status ?? 1);
