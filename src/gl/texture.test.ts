import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AUTHORED_ATLAS_HEIGHT,
  AUTHORED_ATLAS_REGIONS,
  AUTHORED_ATLAS_WIDTH
} from '../world/authoredAtlasLayout';
import { buildPlaceholderAtlas, loadAtlasImageSource } from './texture';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('buildPlaceholderAtlas', () => {
  it('sizes and paints the fallback atlas from the authored layout regions', () => {
    const drawOps: Array<{
      kind: 'fill' | 'stroke';
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    const context = {
      fillStyle: '',
      strokeStyle: '',
      fillRect: (x: number, y: number, width: number, height: number) => {
        drawOps.push({ kind: 'fill', x, y, width, height });
      },
      strokeRect: (x: number, y: number, width: number, height: number) => {
        drawOps.push({ kind: 'stroke', x, y, width, height });
      }
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn((contextId: string) => {
        expect(contextId).toBe('2d');
        return context;
      }),
      toDataURL: vi.fn((mimeType: string) => {
        expect(mimeType).toBe('image/png');
        return 'data:image/png;base64,placeholder';
      })
    };
    const documentStub = {
      createElement: vi.fn((tagName: string) => {
        expect(tagName).toBe('canvas');
        return canvas;
      })
    };

    vi.stubGlobal('document', documentStub);

    const result = buildPlaceholderAtlas();

    expect(result).toBe('data:image/png;base64,placeholder');
    expect(canvas.width).toBe(AUTHORED_ATLAS_WIDTH);
    expect(canvas.height).toBe(AUTHORED_ATLAS_HEIGHT);
    expect(documentStub.createElement).toHaveBeenCalledWith('canvas');
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png');
    expect(drawOps.filter((op) => op.kind === 'fill')).toEqual(
      AUTHORED_ATLAS_REGIONS.map((region) => ({
        kind: 'fill' as const,
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height
      }))
    );
    expect(drawOps.filter((op) => op.kind === 'stroke')).toEqual(
      AUTHORED_ATLAS_REGIONS.map((region) => ({
        kind: 'stroke' as const,
        x: region.x + 0.5,
        y: region.y + 0.5,
        width: Math.max(region.width - 1, 0),
        height: Math.max(region.height - 1, 0)
      }))
    );
  });
});

describe('loadAtlasImageSource', () => {
  it('returns a decoded authored atlas image when fetch and bitmap decode succeed', async () => {
    const atlasBlob = new Blob(['atlas']);
    const authoredBitmap = { kind: 'bitmap', width: 96, height: 64 } as unknown as ImageBitmap;
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      blob: async () => atlasBlob
    }));
    const decodeBitmap = vi.fn(async (blob: Blob) => {
      expect(blob).toBe(atlasBlob);
      return authoredBitmap;
    });
    const loadImage = vi.fn(async () => {
      throw new Error('placeholder should not load when authored atlas succeeds');
    });

    const result = await loadAtlasImageSource('/atlas/tile-atlas.png', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      decodeBitmap: decodeBitmap as unknown as typeof createImageBitmap,
      loadImage
    });

    expect(result).toEqual({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: 96,
      height: 64
    });
    expect(fetchImpl).toHaveBeenCalledWith('/atlas/tile-atlas.png');
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('falls back to the generated placeholder atlas when the authored atlas fetch fails', async () => {
    const fallbackImage = {
      kind: 'image',
      naturalWidth: AUTHORED_ATLAS_WIDTH,
      naturalHeight: AUTHORED_ATLAS_HEIGHT
    } as unknown as HTMLImageElement;
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      blob: async () => {
        throw new Error('blob should not be read for failed responses');
      }
    }));
    const decodeBitmap = vi.fn(async () => {
      throw new Error('decode should not run when fetch response is not ok');
    });
    const buildFallbackAtlas = vi.fn(() => 'data:image/png;base64,placeholder');
    const loadImage = vi.fn(async (source: string) => {
      expect(source).toBe('data:image/png;base64,placeholder');
      return fallbackImage;
    });

    const result = await loadAtlasImageSource('/atlas/tile-atlas.png', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      decodeBitmap: decodeBitmap as unknown as typeof createImageBitmap,
      buildFallbackAtlas,
      loadImage
    });

    expect(result).toEqual({
      imageSource: fallbackImage,
      sourceKind: 'placeholder',
      sourceUrl: 'data:image/png;base64,placeholder',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    expect(buildFallbackAtlas).toHaveBeenCalledTimes(1);
    expect(loadImage).toHaveBeenCalledTimes(1);
  });

  it('falls back to the generated placeholder atlas when bitmap decode throws', async () => {
    const atlasBlob = new Blob(['atlas']);
    const fallbackImage = {
      kind: 'image',
      naturalWidth: AUTHORED_ATLAS_WIDTH,
      naturalHeight: AUTHORED_ATLAS_HEIGHT
    } as unknown as HTMLImageElement;
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      blob: async () => atlasBlob
    }));
    const decodeBitmap = vi.fn(async () => {
      throw new Error('decode failed');
    });
    const buildFallbackAtlas = vi.fn(() => 'data:image/png;base64,placeholder');
    const loadImage = vi.fn(async () => fallbackImage);

    const result = await loadAtlasImageSource('/atlas/tile-atlas.png', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      decodeBitmap: decodeBitmap as unknown as typeof createImageBitmap,
      buildFallbackAtlas,
      loadImage
    });

    expect(result).toEqual({
      imageSource: fallbackImage,
      sourceKind: 'placeholder',
      sourceUrl: 'data:image/png;base64,placeholder',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    expect(decodeBitmap).toHaveBeenCalledTimes(1);
    expect(loadImage).toHaveBeenCalledTimes(1);
  });
});
