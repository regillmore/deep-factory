import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { build } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';

import { createViteConfig, GITHUB_PAGES_BASE_PATH } from './vite.config';

const tempBuildDirs: string[] = [];
const countExactOccurrences = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;
const LEGACY_ROOT_RELATIVE_AUTHORED_ATLAS_LITERAL = "'/atlas/tile-atlas.png'";

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
    'emits project-site asset URLs, rejects the legacy authored atlas literal across emitted text assets, keeps the joined authored atlas runtime URL, and preserves authored atlas bytes in the production build output',
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
      expect(indexHtml).not.toContain(LEGACY_ROOT_RELATIVE_AUTHORED_ATLAS_LITERAL);

      const emittedAssetNames = await readdir(join(outDir, 'assets'));
      const jsBundleNames = emittedAssetNames.filter((name) => name.endsWith('.js'));
      const cssBundleNames = emittedAssetNames.filter((name) => name.endsWith('.css'));
      expect(jsBundleNames.length).toBeGreaterThan(0);
      if (jsBundleNames.length === 0) {
        throw new Error('Expected the production build to emit at least one JavaScript bundle');
      }

      const jsBundles = await Promise.all(
        jsBundleNames.map(async (name) => readFile(join(outDir, 'assets', name), 'utf8'))
      );
      const authoredAtlasRuntimeUrl = `${GITHUB_PAGES_BASE_PATH}atlas/tile-atlas.png`;
      const authoredAtlasRuntimeUrlOccurrences = jsBundles.reduce(
        (total, bundleContents) => total + countExactOccurrences(bundleContents, authoredAtlasRuntimeUrl),
        0
      );
      expect(authoredAtlasRuntimeUrlOccurrences).toBe(1);
      for (const bundleContents of jsBundles) {
        expect(bundleContents).not.toMatch(/(["'`])\/atlas\/tile-atlas\.png\1/);
      }

      expect(cssBundleNames.length).toBeGreaterThan(0);
      if (cssBundleNames.length === 0) {
        throw new Error('Expected the production build to emit at least one CSS bundle');
      }

      const cssBundles = await Promise.all(
        cssBundleNames.map(async (name) => readFile(join(outDir, 'assets', name), 'utf8'))
      );
      for (const bundleContents of cssBundles) {
        expect(bundleContents).not.toContain(LEGACY_ROOT_RELATIVE_AUTHORED_ATLAS_LITERAL);
      }

      const sourceAtlasPng = await readFile(join(process.cwd(), 'public', 'atlas', 'tile-atlas.png'));
      const emittedAtlasPng = await readFile(join(outDir, 'atlas', 'tile-atlas.png'));
      expect(emittedAtlasPng.byteLength).toBe(sourceAtlasPng.byteLength);
      expect(emittedAtlasPng).toEqual(sourceAtlasPng);
    },
    20000
  );
});
