import { describe, expect, it, vi } from 'vitest';

import { loadAtlasImageSource } from './texture';

describe('loadAtlasImageSource', () => {
  it('returns a decoded authored atlas image when fetch and bitmap decode succeed', async () => {
    const atlasBlob = new Blob(['atlas']);
    const authoredBitmap = { kind: 'bitmap' } as unknown as ImageBitmap;
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
      sourceUrl: '/atlas/tile-atlas.png'
    });
    expect(fetchImpl).toHaveBeenCalledWith('/atlas/tile-atlas.png');
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('falls back to the generated placeholder atlas when the authored atlas fetch fails', async () => {
    const fallbackImage = { kind: 'image' } as unknown as HTMLImageElement;
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
      sourceUrl: 'data:image/png;base64,placeholder'
    });
    expect(buildFallbackAtlas).toHaveBeenCalledTimes(1);
    expect(loadImage).toHaveBeenCalledTimes(1);
  });

  it('falls back to the generated placeholder atlas when bitmap decode throws', async () => {
    const atlasBlob = new Blob(['atlas']);
    const fallbackImage = { kind: 'image' } as unknown as HTMLImageElement;
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
      sourceUrl: 'data:image/png;base64,placeholder'
    });
    expect(decodeBitmap).toHaveBeenCalledTimes(1);
    expect(loadImage).toHaveBeenCalledTimes(1);
  });
});
