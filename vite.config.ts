import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  define: {
    // FR-62: `INCLUDE_DRAFTS=true npm run build` shows draft stops in a production build.
    __INCLUDE_DRAFTS__: JSON.stringify(process.env.INCLUDE_DRAFTS === 'true'),
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
