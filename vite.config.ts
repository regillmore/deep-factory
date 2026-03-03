import { defineConfig } from 'vitest/config';

export const GITHUB_PAGES_BASE_PATH = '/deep-factory/';

export function createViteConfig(command: 'serve' | 'build' = 'serve') {
  return {
    base: command === 'build' ? GITHUB_PAGES_BASE_PATH : '/',
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'pagesBasePath.test.ts']
    }
  };
}

export default defineConfig(({ command }) => createViteConfig(command));
