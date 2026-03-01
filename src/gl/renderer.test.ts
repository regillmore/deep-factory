import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Camera2D } from '../core/camera2d';
import { createPlayerState } from '../world/playerState';
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
    ARRAY_BUFFER: 0x8892,
    BLEND: 0x0be2,
    COLOR_BUFFER_BIT: 0x4000,
    DYNAMIC_DRAW: 0x88e8,
    FLOAT: 0x1406,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    STATIC_DRAW: 0x88e4,
    TEXTURE0: 0x84c0,
    TEXTURE_2D: 0x0de1,
    TRIANGLES: 0x0004,
    bindBuffer: vi.fn(),
    bindTexture: vi.fn(),
    bindVertexArray: vi.fn(),
    bufferData: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    createBuffer: vi.fn(() => ({ kind: 'buffer' } as unknown as WebGLBuffer)),
    createVertexArray: vi.fn(() => ({ kind: 'vao' } as unknown as WebGLVertexArrayObject)),
    deleteBuffer: vi.fn(),
    deleteVertexArray: vi.fn(),
    drawArrays: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getUniformLocation: vi.fn(() => ({ kind: 'uniform' } as unknown as WebGLUniformLocation)),
    uniform1f: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
    activeTexture: vi.fn(),
    enable: vi.fn(),
    blendFunc: vi.fn()
  }) as unknown as WebGL2RenderingContext;

const createMockCanvas = (gl: WebGL2RenderingContext): HTMLCanvasElement =>
  ({
    clientWidth: 320,
    clientHeight: 240,
    width: 320,
    height: 240,
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

  it('renders the standalone player placeholder as an extra world-space draw call', async () => {
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

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    const camera = new Camera2D();
    const playerState = createPlayerState({
      position: { x: 8, y: 24 },
      size: { width: 12, height: 28 },
      facing: 'left'
    });

    renderer.render(camera, {
      standalonePlayer: playerState
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);
    const lastBufferDataCall = bufferData.mock.calls.at(-1);
    expect(lastBufferDataCall?.[0]).toBe(gl.ARRAY_BUFFER);
    expect(lastBufferDataCall?.[1]).toBeInstanceOf(Float32Array);
    expect((lastBufferDataCall?.[1] as Float32Array | undefined)?.length).toBe(24);
    expect(lastBufferDataCall?.[2]).toBe(gl.DYNAMIC_DRAW);
    expect(uniform1f).toHaveBeenCalledWith(expect.anything(), -1);
  });
});
