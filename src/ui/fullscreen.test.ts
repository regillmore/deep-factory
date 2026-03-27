import { describe, expect, it, vi } from 'vitest';

import {
  readBrowserFullscreenState,
  toggleBrowserFullscreen,
  type FullscreenDocumentLike
} from './fullscreen';

const createFullscreenDocument = (
  overrides: Partial<FullscreenDocumentLike> = {}
): FullscreenDocumentLike => {
  const requestFullscreen = vi.fn<() => Promise<void> | void>();
  const exitFullscreen = vi.fn<() => Promise<void> | void>();

  return {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen
    },
    exitFullscreen,
    ...overrides
  };
};

describe('readBrowserFullscreenState', () => {
  it('reports fullscreen as supported and inactive when the standard API is available', () => {
    expect(readBrowserFullscreenState(createFullscreenDocument())).toEqual({
      supported: true,
      active: false
    });
  });

  it('reports fullscreen as active when the document has a fullscreen element', () => {
    const documentLike = createFullscreenDocument();
    expect(
      readBrowserFullscreenState({
        ...documentLike,
        fullscreenElement: {} as Element
      })
    ).toEqual({
      supported: true,
      active: true
    });
  });

  it('reports fullscreen as unsupported when fullscreenEnabled is false', () => {
    expect(
      readBrowserFullscreenState(
        createFullscreenDocument({
          fullscreenEnabled: false
        })
      )
    ).toEqual({
      supported: false,
      active: false
    });
  });

  it('reports fullscreen as unsupported when requestFullscreen is missing', () => {
    expect(
      readBrowserFullscreenState(
        createFullscreenDocument({
          documentElement: {}
        })
      )
    ).toEqual({
      supported: false,
      active: false
    });
  });
});

describe('toggleBrowserFullscreen', () => {
  it('requests fullscreen when supported and currently inactive', async () => {
    let fullscreenElement: Element | null = null;
    const documentElement = {};
    const requestFullscreen = vi.fn(() => {
      fullscreenElement = documentElement as Element;
    });
    const documentLike = {
      fullscreenEnabled: true,
      get fullscreenElement() {
        return fullscreenElement;
      },
      documentElement: {
        requestFullscreen
      },
      exitFullscreen: vi.fn()
    } satisfies FullscreenDocumentLike;

    await expect(toggleBrowserFullscreen(documentLike)).resolves.toEqual({
      supported: true,
      active: true
    });
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('exits fullscreen when supported and currently active', async () => {
    let fullscreenElement: Element | null = {} as Element;
    const exitFullscreen = vi.fn(() => {
      fullscreenElement = null;
    });
    const documentLike = {
      fullscreenEnabled: true,
      get fullscreenElement() {
        return fullscreenElement;
      },
      documentElement: {
        requestFullscreen: vi.fn()
      },
      exitFullscreen
    } satisfies FullscreenDocumentLike;

    await expect(toggleBrowserFullscreen(documentLike)).resolves.toEqual({
      supported: true,
      active: false
    });
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('returns the unsupported state without calling fullscreen methods', async () => {
    const requestFullscreen = vi.fn();
    const exitFullscreen = vi.fn();
    const documentLike = createFullscreenDocument({
      fullscreenEnabled: false,
      documentElement: {
        requestFullscreen
      },
      exitFullscreen
    });

    await expect(toggleBrowserFullscreen(documentLike)).resolves.toEqual({
      supported: false,
      active: false
    });
    expect(requestFullscreen).not.toHaveBeenCalled();
    expect(exitFullscreen).not.toHaveBeenCalled();
  });
});
