import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import paths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [solid(), paths(), tailwindcss()],
  resolve: {
    alias: {
      '@src': resolve(__dirname, '../src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  base: '/',
});
