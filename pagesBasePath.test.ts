import { describe, expect, it } from 'vitest';

import { createViteConfig, GITHUB_PAGES_BASE_PATH } from './vite.config';

describe('createViteConfig', () => {
  it('uses the project-site base path for production builds', () => {
    expect(createViteConfig('build').base).toBe(GITHUB_PAGES_BASE_PATH);
  });

  it('keeps root-relative paths during local development', () => {
    expect(createViteConfig('serve').base).toBe('/');
  });
});
