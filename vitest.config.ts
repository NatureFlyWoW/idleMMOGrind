import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/balance/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/shared/**', 'tools/art-engine/src/**'],
      exclude: ['**/*.d.ts', '**/index.ts'],
    },
    setupFiles: ['tests/setup.ts'],
    testTimeout: 10000,
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@data': path.resolve(__dirname, 'data'),
    },
  },
});
