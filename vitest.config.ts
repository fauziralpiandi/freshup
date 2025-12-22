import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'freshup',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    coverage: { provider: 'v8' },
  },
});
