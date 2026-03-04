import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { build } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';

import { createViteConfig, GITHUB_PAGES_BASE_PATH } from './vite.config';

const tempBuildDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempBuildDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('createViteConfig', () => {
  it('uses the project-site base path for production builds', () => {
    expect(createViteConfig('build').base).toBe(GITHUB_PAGES_BASE_PATH);
  });

  it('keeps root-relative paths during local development', () => {
    expect(createViteConfig('serve').base).toBe('/');
  });

  it(
    'emits project-site asset URLs and preserves authored atlas bytes in the production build output',
    async () => {
      const outDir = await mkdtemp(join(tmpdir(), 'deep-factory-build-'));
      tempBuildDirs.push(outDir);

      await build({
        ...createViteConfig('build'),
        configFile: false,
        logLevel: 'silent',
        root: process.cwd(),
        build: {
          emptyOutDir: true,
          outDir
        }
      });

      const indexHtml = await readFile(join(outDir, 'index.html'), 'utf8');
      expect(indexHtml).toMatch(/\/deep-factory\/assets\/[^"]+\.js/);
      expect(indexHtml).toMatch(/\/deep-factory\/assets\/[^"]+\.css/);

      const emittedAssetNames = await readdir(join(outDir, 'assets'));
      const jsBundleName = emittedAssetNames.find((name) => name.endsWith('.js'));
      expect(jsBundleName).toBeDefined();
      if (!jsBundleName) {
        throw new Error('Expected the production build to emit a JavaScript bundle');
      }

      const jsBundle = await readFile(join(outDir, 'assets', jsBundleName), 'utf8');
      expect(jsBundle).toContain(GITHUB_PAGES_BASE_PATH);
      expect(jsBundle).toContain('atlas/tile-atlas.png');

      const sourceAtlasPng = await readFile(join(process.cwd(), 'public', 'atlas', 'tile-atlas.png'));
      const emittedAtlasPng = await readFile(join(outDir, 'atlas', 'tile-atlas.png'));
      expect(emittedAtlasPng.byteLength).toBe(sourceAtlasPng.byteLength);
      expect(emittedAtlasPng).toEqual(sourceAtlasPng);
    },
    20000
  );
});
