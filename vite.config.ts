import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    target: 'es2020',
    lib: {
      entry: path.resolve(dirname, 'src/index.ts'),
      name: 'vue3-easy-data-table',
      formats: ['es', 'umd'],
      fileName: (format) => `vue3-easy-data-table.${format}.js`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    cssCodeSplit: false,
  },
  plugins: [vue()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@src': path.resolve(dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.{test,spec}.{js,ts}'],
  },
});
