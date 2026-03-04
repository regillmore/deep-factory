import { defineConfig } from 'vitest/config';

export const GITHUB_PAGES_BASE_PATH = '/deep-factory/';

export function createViteConfig(command: 'serve' | 'build' = 'serve') {
  const base = command === 'build' ? GITHUB_PAGES_BASE_PATH : '/';

  return {
    base,
    define: {
      __AUTHORED_TILE_ATLAS_URL__: JSON.stringify(`${base}atlas/tile-atlas.png`)
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'pagesBasePath.test.ts']
    }
  };
}

export default defineConfig(({ command }) => createViteConfig(command));
