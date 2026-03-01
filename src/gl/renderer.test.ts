import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadAtlasImageSource, createTextureFromImageSource, createProgram } = vi.hoisted(() => ({
  loadAtlasImageSource: vi.fn(),
  createTextureFromImageSource: vi.fn(() => ({ kind: 'texture' } as unknown as WebGLTexture)),
  createProgram: vi.fn(() => ({ kind: 'program' } as unknown as WebGLProgram))
}));

vi.mock('./texture', () => ({
  createTextureFromImageSource,
  loadAtlasImageSource
}));

vi.mock('./shader', () => ({
  createProgram
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
  });

  it('starts with pending atlas telemetry before initialization', () => {
    const renderer = new Renderer(createMockCanvas(createMockGl()));

    expect(renderer.telemetry.atlasSourceKind).toBe('pending');
  });

  it('records an authored atlas load in telemetry during initialization', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png'
    });

    await renderer.initialize();

    expect(loadAtlasImageSource).toHaveBeenCalledWith('/atlas/tile-atlas.png');
    expect(createTextureFromImageSource).toHaveBeenCalledWith(gl, authoredBitmap);
    expect(renderer.telemetry.atlasSourceKind).toBe('authored');
  });

  it('records placeholder fallback atlas loads in telemetry during initialization', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const placeholderImage = { kind: 'image' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: placeholderImage,
      sourceKind: 'placeholder',
      sourceUrl: 'data:image/png;base64,placeholder'
    });

    await renderer.initialize();

    expect(createTextureFromImageSource).toHaveBeenCalledWith(gl, placeholderImage);
    expect(renderer.telemetry.atlasSourceKind).toBe('placeholder');
  });
});
