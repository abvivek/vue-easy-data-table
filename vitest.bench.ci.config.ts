import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CI bench smoke — fast, non-flaky.
 * Only runs `bench/ci-smoke.spec.js` (no wall-clock thresholds, no BENCHMARKS.md write).
 * Full local harness: `npm run bench` → vitest.bench.config.ts
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@src': path.resolve(dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['bench/ci-smoke.spec.js'],
    testTimeout: 60_000,
    fileParallelism: false,
  },
});
