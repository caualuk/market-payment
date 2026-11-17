/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // O chunk do Three.js (~1 MB, ~270 kB gzip) é carregado sob demanda.
    chunkSizeWarningLimit: 1100,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/scene/story.ts', 'src/scene/cash.ts', 'src/components/**'],
      reporter: ['text', 'html'],
    },
  },
})
