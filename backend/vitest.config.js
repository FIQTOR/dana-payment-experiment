import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Force a deterministic, offline environment for the whole suite.
    env: {
      NODE_ENV: 'test',
      DANA_MOCK_MODE: 'true',
      DB_ENABLED: 'false',
      RATE_LIMIT_MAX: '100000',
    },
    // Run test files sequentially — they share an in-memory store.
    fileParallelism: false,
  },
});
