import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtlasUvRectBoundsWarning } from './atlasValidation';

const { loadAtlasImageSource, createTextureFromImageSource, createProgram, collectAtlasUvRectBoundsWarnings } =
  vi.hoisted(() => ({
  loadAtlasImageSource: vi.fn(),
  createTextureFromImageSource: vi.fn(() => ({ kind: 'texture' } as unknown as WebGLTexture)),
  createProgram: vi.fn(() => ({ kind: 'program' } as unknown as WebGLProgram)),
  collectAtlasUvRectBoundsWarnings:
    vi.fn<(tiles: unknown, atlasWidth: number, atlasHeight: number) => AtlasUvRectBoundsWarning[]>(
      () => []
    )
  }));

vi.mock('./texture', () => ({
  createTextureFromImageSource,
  loadAtlasImageSource
}));

vi.mock('./shader', () => ({
  createProgram
}));

vi.mock('./atlasValidation', () => ({
  collectAtlasUvRectBoundsWarnings
}));

import { Renderer } from './renderer';

const createMockGl = (): WebGL2RenderingContext =>
  ({
    BLEND: 0x0be2,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    getUniformLocation: vi.fn(() => ({ kind: 'uniform' } as unknown as WebGLUniformLocation)),
    enable: vi.fn(),
    blendFunc: vi.fn()
  }) as unknown as WebGL2RenderingContext;

const createMockCanvas = (gl: WebGL2RenderingContext): HTMLCanvasElement =>
  ({
    getContext: vi.fn((kind: string) => (kind === 'webgl2' ? gl : null))
  }) as unknown as HTMLCanvasElement;

describe('Renderer atlas telemetry', () => {
  beforeEach(() => {
    loadAtlasImageSource.mockReset();
    createTextureFromImageSource.mockClear();
    createProgram.mockClear();
    collectAtlasUvRectBoundsWarnings.mockReset();
    collectAtlasUvRectBoundsWarnings.mockReturnValue([]);
    vi.restoreAllMocks();
  });

  it('starts with pending atlas telemetry before initialization', () => {
    const renderer = new Renderer(createMockCanvas(createMockGl()));

    expect(renderer.telemetry.atlasSourceKind).toBe('pending');
    expect(renderer.telemetry.atlasWidth).toBeNull();
    expect(renderer.telemetry.atlasHeight).toBeNull();
    expect(renderer.telemetry.atlasValidationWarningCount).toBeNull();
    expect(renderer.telemetry.atlasValidationFirstWarning).toBeNull();
  });

  it('records an authored atlas load in telemetry during initialization', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: 96,
      height: 64
    });

    await renderer.initialize();

    expect(loadAtlasImageSource).toHaveBeenCalledWith('/atlas/tile-atlas.png');
    expect(createTextureFromImageSource).toHaveBeenCalledWith(gl, authoredBitmap);
    expect(renderer.telemetry.atlasSourceKind).toBe('authored');
    expect(renderer.telemetry.atlasWidth).toBe(96);
    expect(renderer.telemetry.atlasHeight).toBe(64);
    expect(renderer.telemetry.atlasValidationWarningCount).toBe(0);
    expect(renderer.telemetry.atlasValidationFirstWarning).toBeNull();
  });

  it('records placeholder fallback atlas loads in telemetry during initialization', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const placeholderImage = { kind: 'image' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: placeholderImage,
      sourceKind: 'placeholder',
      sourceUrl: 'data:image/png;base64,placeholder',
      width: 64,
      height: 64
    });

    await renderer.initialize();

    expect(createTextureFromImageSource).toHaveBeenCalledWith(gl, placeholderImage);
    expect(renderer.telemetry.atlasSourceKind).toBe('placeholder');
    expect(renderer.telemetry.atlasWidth).toBe(64);
    expect(renderer.telemetry.atlasHeight).toBe(64);
    expect(renderer.telemetry.atlasValidationWarningCount).toBe(0);
    expect(renderer.telemetry.atlasValidationFirstWarning).toBeNull();
  });

  it('records atlas uvRect warnings and logs them during initialization', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: 96,
      height: 64
    });
    collectAtlasUvRectBoundsWarnings.mockReturnValue([
      {
        tileId: 4,
        tileName: 'debug_panel',
        sourcePath: 'render.uvRect',
        summary: 'tile 4 "debug_panel" render.uvRect',
        message:
          'tile 4 "debug_panel" render.uvRect resolves to [60, 48]..[120, 80] outside atlas 96x64'
      }
    ]);

    await renderer.initialize();

    expect(renderer.telemetry.atlasValidationWarningCount).toBe(1);
    expect(renderer.telemetry.atlasValidationFirstWarning).toBe('tile 4 "debug_panel" render.uvRect');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('Atlas uvRect validation found 1 warning(s)');
    expect(warnSpy.mock.calls[0]?.[0]).toContain('tile 4 "debug_panel" render.uvRect');
  });
});
