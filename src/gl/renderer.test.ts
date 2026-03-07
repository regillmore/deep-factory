import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Camera2D } from '../core/camera2d';
import { CHUNK_SIZE, TILE_SIZE } from '../world/constants';
import { createPlayerState } from '../world/playerState';
import {
  atlasIndexToUvRect,
  resolveAnimatedTileRenderFrameUvRect,
  resolveLiquidRenderVariantUvRectAtElapsedMs
} from '../world/tileMetadata';
import type { AtlasValidationWarning } from './atlasValidation';
import {
  STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_JUMP_RISE,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE,
  STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS
} from './standalonePlayerPlaceholder';

const { loadAtlasImageSource, createTextureFromImageSource, createProgram, collectAtlasValidationWarnings } =
  vi.hoisted(() => ({
  loadAtlasImageSource: vi.fn(),
  createTextureFromImageSource: vi.fn(() => ({ kind: 'texture' } as unknown as WebGLTexture)),
  createProgram: vi.fn(() => ({ kind: 'program' } as unknown as WebGLProgram)),
  collectAtlasValidationWarnings:
    vi.fn<(tiles: unknown, atlasWidth: number, atlasHeight: number) => AtlasValidationWarning[]>(
      () => []
    )
  }));

vi.mock('./texture', () => ({
  createTextureFromImageSource,
  loadAtlasImageSource,
  resolveAuthoredTileAtlasUrl: vi.fn(() => '/atlas/tile-atlas.png')
}));

vi.mock('./shader', () => ({
  createProgram
}));

vi.mock('./atlasValidation', () => ({
  collectAtlasValidationWarnings
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

const toFloat32 = (value: number): number => Math.fround(value);

const expectStandalonePlayerUniformValues = (
  uniformCalls: Array<[WebGLUniformLocation | null, number]>,
  expected: Array<{ facing: number; pose: number }>
): void => {
  expect(uniformCalls).toHaveLength(expected.length * 3);
  for (let index = 0; index < expected.length; index += 1) {
    const base = index * 3;
    expect(uniformCalls[base]?.[1]).toBe(expected[index]!.facing);
    expect(uniformCalls[base + 1]?.[1]).toBe(expected[index]!.pose);
    expect(uniformCalls[base + 2]?.[1]).toBeGreaterThanOrEqual(0);
    expect(uniformCalls[base + 2]?.[1]).toBeLessThanOrEqual(1);
  }
};

const renderUntilMeshBuildQueueDrains = (
  renderer: Renderer,
  camera: Camera2D,
  maxFrames = 120,
  timeMs = 0
): void => {
  for (let frame = 0; frame < maxFrames; frame += 1) {
    renderer.render(camera, { timeMs });
    if (renderer.telemetry.meshBuildQueueLength === 0 && renderer.telemetry.residentDirtyLightChunks === 0) {
      return;
    }
  }

  throw new Error(
    `Renderer test warm-up did not drain the mesh build queue within ${maxFrames} frames ` +
      `(queue=${renderer.telemetry.meshBuildQueueLength}, ` +
      `dirtyLight=${renderer.telemetry.residentDirtyLightChunks}, ` +
      `animMeshes=${renderer.telemetry.residentAnimatedChunkMeshes}, ` +
      `animQuads=${renderer.telemetry.residentAnimatedChunkQuadCount})`
  );
};

describe('Renderer atlas telemetry', () => {
  beforeEach(() => {
    loadAtlasImageSource.mockReset();
    createTextureFromImageSource.mockClear();
    createProgram.mockClear();
    collectAtlasValidationWarnings.mockReset();
    collectAtlasValidationWarnings.mockReturnValue([]);
    vi.restoreAllMocks();
  });

  it('starts with pending atlas telemetry before initialization', () => {
    const renderer = new Renderer(createMockCanvas(createMockGl()));

    expect(renderer.telemetry.atlasSourceKind).toBe('pending');
    expect(renderer.telemetry.atlasWidth).toBeNull();
    expect(renderer.telemetry.atlasHeight).toBeNull();
    expect(renderer.telemetry.atlasValidationWarningCount).toBeNull();
    expect(renderer.telemetry.atlasValidationFirstWarning).toBeNull();
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(0);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(0);
    expect(renderer.telemetry.residentDirtyLightChunks).toBe(0);
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightFactor).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkY).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY).toBeNull();
  });

  it('flips placeholder shader uv.y so pose rectangles stay upright with top-to-bottom quad UVs', () => {
    new Renderer(createMockCanvas(createMockGl()));

    const createProgramCalls = createProgram.mock.calls as unknown as Array<
      [WebGL2RenderingContext, string, string]
    >;
    const playerProgramFragmentSource = createProgramCalls[1]?.[2];
    expect(playerProgramFragmentSource).toContain('uv.y = 1.0 - uv.y;');
  });

  it('compiles grounded walk and airborne direction pose branches into the placeholder shader', () => {
    new Renderer(createMockCanvas(createMockGl()));

    const createProgramCalls = createProgram.mock.calls as unknown as Array<
      [WebGL2RenderingContext, string, string]
    >;
    const playerProgramFragmentSource = createProgramCalls[1]?.[2];
    expect(playerProgramFragmentSource).toContain('bool walkPoseA');
    expect(playerProgramFragmentSource).toContain('bool walkPoseB');
    expect(playerProgramFragmentSource).toContain('bool jumpRisePose');
    expect(playerProgramFragmentSource).toContain('bool fallPose');
    expect(playerProgramFragmentSource).toContain('bool wallSlidePose');
    expect(playerProgramFragmentSource).toContain('bool ceilingBonkPose');
  });

  it('compiles nearby world-light modulation into the placeholder shader', () => {
    new Renderer(createMockCanvas(createMockGl()));

    const createProgramCalls = createProgram.mock.calls as unknown as Array<
      [WebGL2RenderingContext, string, string]
    >;
    const playerProgramFragmentSource = createProgramCalls[1]?.[2];
    expect(playerProgramFragmentSource).toContain('uniform float u_light;');
    expect(playerProgramFragmentSource).toContain('vec4(color * clamp(u_light, 0.0, 1.0), 1.0);');
  });

  it('compiles world-tile lighting modulation into the chunk shader', () => {
    new Renderer(createMockCanvas(createMockGl()));

    const createProgramCalls = createProgram.mock.calls as unknown as Array<
      [WebGL2RenderingContext, string, string]
    >;
    const worldProgramVertexSource = createProgramCalls[0]?.[1];
    const worldProgramFragmentSource = createProgramCalls[0]?.[2];
    expect(worldProgramVertexSource).toContain('layout(location = 2) in float a_light;');
    expect(worldProgramVertexSource).toContain('v_light = clamp(a_light / 15.0, 0.0, 1.0);');
    expect(worldProgramFragmentSource).toContain('vec4 atlasColor = texture(u_atlas, v_uv);');
    expect(worldProgramFragmentSource).toContain('vec4(atlasColor.rgb * v_light, atlasColor.a);');
  });

  it('configures chunk VAOs with a dedicated per-vertex light attribute', async () => {
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

    const enableVertexAttribArray = vi.mocked(gl.enableVertexAttribArray);
    const vertexAttribPointer = vi.mocked(gl.vertexAttribPointer);
    enableVertexAttribArray.mockClear();
    vertexAttribPointer.mockClear();

    const camera = new Camera2D();
    camera.zoom = 16;
    renderUntilMeshBuildQueueDrains(renderer, camera);

    expect(
      enableVertexAttribArray.mock.calls.some(([index]) => index === 2)
    ).toBe(true);
    expect(
      vertexAttribPointer.mock.calls.some(
        ([index, size, type, normalized, strideBytes, offsetBytes]) =>
          index === 2 &&
          size === 1 &&
          type === gl.FLOAT &&
          normalized === false &&
          strideBytes === 20 &&
          offsetBytes === 16
      )
    ).toBe(true);
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
      width: 96,
      height: 64
    });

    await renderer.initialize();

    expect(createTextureFromImageSource).toHaveBeenCalledWith(gl, placeholderImage);
    expect(renderer.telemetry.atlasSourceKind).toBe('placeholder');
    expect(renderer.telemetry.atlasWidth).toBe(96);
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
    collectAtlasValidationWarnings.mockReturnValue([
      {
        tileId: 4,
        tileName: 'debug_panel',
        kind: 'pixelAlignment',
        sourcePath: 'render.uvRect',
        summary: 'tile 4 "debug_panel" render.uvRect',
        message:
          'tile 4 "debug_panel" render.uvRect resolves to [9.6, 16]..[48, 48] on non-integer atlas pixels for 96x64'
      }
    ]);

    await renderer.initialize();

    expect(renderer.telemetry.atlasValidationWarningCount).toBe(1);
    expect(renderer.telemetry.atlasValidationFirstWarning).toBe('tile 4 "debug_panel" render.uvRect');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('Atlas validation found 1 warning(s)');
    expect(warnSpy.mock.calls[0]?.[0]).toContain('tile 4 "debug_panel" render.uvRect');
  });

  it('resets the active world and clears cached animated meshes for a fresh session', async () => {
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

    renderer.setTile(0, 0, 5);
    const camera = new Camera2D();
    camera.zoom = 16;

    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(renderer.getTile(0, 0)).toBe(5);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);
    expect(renderer.telemetry.residentDirtyLightChunks).toBe(0);

    const deleteBuffer = vi.mocked(gl.deleteBuffer);
    const deleteVertexArray = vi.mocked(gl.deleteVertexArray);
    deleteBuffer.mockClear();
    deleteVertexArray.mockClear();

    renderer.resetWorld();
    renderUntilMeshBuildQueueDrains(renderer, camera);

    expect(renderer.getTile(0, 0)).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(0);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);
    expect(renderer.telemetry.residentDirtyLightChunks).toBe(0);
    expect(deleteBuffer).toHaveBeenCalled();
    expect(deleteVertexArray).toHaveBeenCalled();
  });

  it('invalidates lower-row chunk meshes when a roof edit changes lighting across the y=-1/0 seam', async () => {
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

    const rowStartWorldTileX = 4;
    const rowEndWorldTileX = 13;
    const lowerRowWorldTileY = 0;
    const gapWorldTileY = -1;
    const roofWorldTileY = -2;
    const leftPaddingWorldTileX = rowStartWorldTileX - 1;
    const rightPaddingWorldTileX = rowEndWorldTileX + 1;

    for (let worldTileX = leftPaddingWorldTileX; worldTileX <= rightPaddingWorldTileX; worldTileX += 1) {
      for (let worldTileY = -CHUNK_SIZE; worldTileY <= gapWorldTileY; worldTileY += 1) {
        renderer.setTile(worldTileX, worldTileY, 0);
      }
    }
    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      renderer.setTile(worldTileX, lowerRowWorldTileY, 1);
    }

    const camera = new Camera2D();
    camera.zoom = 16;
    camera.x = ((rowStartWorldTileX + rowEndWorldTileX + 1) * TILE_SIZE) / 2;
    camera.y = -TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, camera);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      renderer.setTile(worldTileX, roofWorldTileY, 1);
      renderer.render(camera, { timeMs: 0 });
    }

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, -1],
        [0, 0]
      ])
    );
  });

  it('invalidates lower-row chunk meshes on both sides of an x chunk boundary when a roof edit changes boundary lighting', async () => {
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

    const rowStartWorldTileX = CHUNK_SIZE - 2;
    const rowEndWorldTileX = CHUNK_SIZE + 7;
    const lowerRowWorldTileY = 0;
    const gapWorldTileY = -1;
    const roofWorldTileY = -2;
    const leftPaddingWorldTileX = rowStartWorldTileX - 1;
    const rightPaddingWorldTileX = rowEndWorldTileX + 1;

    for (let worldTileX = leftPaddingWorldTileX; worldTileX <= rightPaddingWorldTileX; worldTileX += 1) {
      for (let worldTileY = -CHUNK_SIZE; worldTileY <= gapWorldTileY; worldTileY += 1) {
        renderer.setTile(worldTileX, worldTileY, 0);
      }
    }
    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      renderer.setTile(worldTileX, lowerRowWorldTileY, 1);
    }

    const camera = new Camera2D();
    camera.zoom = 16;
    camera.x = ((rowStartWorldTileX + rowEndWorldTileX + 1) * TILE_SIZE) / 2;
    camera.y = -TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, camera);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      renderer.setTile(worldTileX, roofWorldTileY, 1);
      renderer.render(camera, { timeMs: 0 });
    }

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, 0],
        [1, 0]
      ])
    );
  });

  it('invalidates both row-below chunk meshes when a streamed-back bottom-corner boundary blocker recloses', async () => {
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

    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const cornerWorldTileY = CHUNK_SIZE - 1;
    const rowBelowWorldTileY = CHUNK_SIZE;

    for (let worldTileY = 0; worldTileY <= cornerWorldTileY; worldTileY += 1) {
      renderer.setTile(leftBoundaryWorldTileX, worldTileY, 0);
      renderer.setTile(rightBoundaryWorldTileX, worldTileY, 0);
    }
    renderer.setTile(leftBoundaryWorldTileX, rowBelowWorldTileY, 0);
    renderer.setTile(rightBoundaryWorldTileX, rowBelowWorldTileY, 0);
    renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((leftBoundaryWorldTileX + rightBoundaryWorldTileX + 1) * TILE_SIZE) / 2;
    nearCamera.y = CHUNK_SIZE * TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    expect(renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;
    farCamera.y = nearCamera.y;
    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    expect(renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1)).toBe(true);
    renderer.render(nearCamera, { timeMs: 0 });

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, 1],
        [1, 1]
      ])
    );
  });

  it('invalidates both row-below chunk meshes when a streamed-back bottom-corner boundary blocker reopens from the opposite chunk side', async () => {
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

    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const cornerWorldTileY = CHUNK_SIZE - 1;
    const rowBelowWorldTileY = CHUNK_SIZE;

    for (let worldTileY = 0; worldTileY <= cornerWorldTileY; worldTileY += 1) {
      renderer.setTile(leftBoundaryWorldTileX, worldTileY, 0);
      renderer.setTile(rightBoundaryWorldTileX, worldTileY, 0);
    }
    renderer.setTile(leftBoundaryWorldTileX, rowBelowWorldTileY, 0);
    renderer.setTile(rightBoundaryWorldTileX, rowBelowWorldTileY, 0);
    renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((leftBoundaryWorldTileX + rightBoundaryWorldTileX + 1) * TILE_SIZE) / 2;
    nearCamera.y = CHUNK_SIZE * TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;
    farCamera.y = nearCamera.y;
    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    expect(renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    renderer.render(nearCamera, { timeMs: 0 });

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, 1],
        [1, 1]
      ])
    );
  });

  it('invalidates both row-above chunk meshes when a streamed-back top-corner boundary blocker recloses', async () => {
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

    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const cornerWorldTileY = 0;
    const shadowBlockerWorldTileY = -2;

    for (let worldTileY = -CHUNK_SIZE; worldTileY <= cornerWorldTileY; worldTileY += 1) {
      renderer.setTile(leftBoundaryWorldTileX, worldTileY, 0);
      renderer.setTile(rightBoundaryWorldTileX, worldTileY, 0);
    }
    renderer.setTile(leftBoundaryWorldTileX, shadowBlockerWorldTileY, 1);
    renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((leftBoundaryWorldTileX + rightBoundaryWorldTileX + 1) * TILE_SIZE) / 2;
    nearCamera.y = -TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    expect(renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;
    farCamera.y = nearCamera.y;
    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    expect(renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1)).toBe(true);
    renderer.render(nearCamera, { timeMs: 0 });

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, -1],
        [1, -1]
      ])
    );
  });

  it('invalidates both row-above chunk meshes when a streamed-back top-corner boundary blocker recloses from the opposite chunk side', async () => {
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

    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const cornerWorldTileY = 0;
    const shadowBlockerWorldTileY = -2;

    for (let worldTileY = -CHUNK_SIZE; worldTileY <= cornerWorldTileY; worldTileY += 1) {
      renderer.setTile(leftBoundaryWorldTileX, worldTileY, 0);
      renderer.setTile(rightBoundaryWorldTileX, worldTileY, 0);
    }
    renderer.setTile(rightBoundaryWorldTileX, shadowBlockerWorldTileY, 1);
    renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((leftBoundaryWorldTileX + rightBoundaryWorldTileX + 1) * TILE_SIZE) / 2;
    nearCamera.y = -TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    expect(renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;
    farCamera.y = nearCamera.y;
    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    expect(renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1)).toBe(true);
    renderer.render(nearCamera, { timeMs: 0 });

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, -1],
        [1, -1]
      ])
    );
  });

  it('invalidates both row-above chunk meshes when a streamed-back top-corner boundary blocker reopens from the opposite chunk side', async () => {
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

    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const cornerWorldTileY = 0;
    const shadowBlockerWorldTileY = -2;

    for (let worldTileY = -CHUNK_SIZE; worldTileY <= cornerWorldTileY; worldTileY += 1) {
      renderer.setTile(leftBoundaryWorldTileX, worldTileY, 0);
      renderer.setTile(rightBoundaryWorldTileX, worldTileY, 0);
    }
    renderer.setTile(rightBoundaryWorldTileX, shadowBlockerWorldTileY, 1);
    renderer.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((leftBoundaryWorldTileX + rightBoundaryWorldTileX + 1) * TILE_SIZE) / 2;
    nearCamera.y = -TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;
    farCamera.y = nearCamera.y;
    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    expect(renderer.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    renderer.render(nearCamera, { timeMs: 0 });

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, -1],
        [1, -1]
      ])
    );
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
      velocity: { x: -60, y: 0 },
      grounded: true,
      facing: 'left'
    });

    renderer.render(camera, {
      standalonePlayer: playerState,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);
    const lastBufferDataCall = bufferData.mock.calls.at(-1);
    expect(lastBufferDataCall?.[0]).toBe(gl.ARRAY_BUFFER);
    expect(lastBufferDataCall?.[1]).toBeInstanceOf(Float32Array);
    expect((lastBufferDataCall?.[1] as Float32Array | undefined)?.length).toBe(24);
    expect(lastBufferDataCall?.[2]).toBe(gl.DYNAMIC_DRAW);
    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [{ facing: -1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A }]
    );
  });

  it('passes nearby resolved world light into the standalone player shader', async () => {
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

    const world = (renderer as unknown as { world: { getLightLevel: (tileX: number, tileY: number) => number } })
      .world;
    const getLightLevelSpy = vi.spyOn(world, 'getLightLevel').mockReturnValue(9);
    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    renderer.render(new Camera2D(), {
      standalonePlayer: createPlayerState({
        grounded: true,
        velocity: { x: 0, y: 0 },
        facing: 'right'
      }),
      timeMs: 0
    });

    const uniformCalls = uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>;
    expectStandalonePlayerUniformValues(uniformCalls, [
      { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE }
    ]);
    expect(uniformCalls[2]?.[1]).toBeCloseTo(9 / 15, 5);
    expect(getLightLevelSpy).toHaveBeenCalled();
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBe(9);
    expect(renderer.telemetry.standalonePlayerNearbyLightFactor).toBeCloseTo(9 / 15, 5);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBe(-2);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBe(-3);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkX).toBe(-1);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkY).toBe(-1);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX).toBe(30);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY).toBe(29);
  });

  it('clears standalone player nearby-light telemetry when the player is not rendered', async () => {
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

    const world = (renderer as unknown as { world: { getLightLevel: (tileX: number, tileY: number) => number } })
      .world;
    vi.spyOn(world, 'getLightLevel').mockReturnValue(12);

    const camera = new Camera2D();
    renderer.render(camera, {
      standalonePlayer: createPlayerState({
        grounded: true,
        velocity: { x: 0, y: 0 },
        facing: 'right'
      }),
      timeMs: 0
    });
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBe(12);
    expect(renderer.telemetry.standalonePlayerNearbyLightFactor).toBeCloseTo(12 / 15, 5);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBe(-2);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBe(-3);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkX).toBe(-1);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkY).toBe(-1);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX).toBe(30);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY).toBe(29);

    renderer.render(camera, {
      timeMs: 16
    });
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightFactor).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkY).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY).toBeNull();
  });

  it('advances grounded walk placeholder poses across elapsed render time', async () => {
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

    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    const camera = new Camera2D();
    const playerState = createPlayerState({
      grounded: true,
      velocity: { x: 60, y: 0 }
    });

    renderer.render(camera, {
      standalonePlayer: playerState,
      timeMs: 0
    });
    renderer.render(camera, {
      standalonePlayer: playerState,
      timeMs: STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS
    });

    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [
        { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A },
        { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B }
      ]
    );
  });

  it('maps airborne rise and fall velocity into distinct placeholder poses', async () => {
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

    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    const camera = new Camera2D();
    const jumpRiseState = createPlayerState({
      grounded: false,
      velocity: { x: 0, y: -120 }
    });
    const fallState = createPlayerState({
      grounded: false,
      velocity: { x: 0, y: 120 }
    });

    renderer.render(camera, {
      standalonePlayer: jumpRiseState,
      timeMs: 0
    });
    renderer.render(camera, {
      standalonePlayer: fallState,
      timeMs: 0
    });

    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [
        { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_JUMP_RISE },
        { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL }
      ]
    );
  });

  it('maps airborne wall contact into the wall-slide placeholder pose', async () => {
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

    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    const camera = new Camera2D();
    const wallSlideState = createPlayerState({
      grounded: false,
      velocity: { x: 0, y: -120 }
    });

    renderer.render(camera, {
      standalonePlayer: wallSlideState,
      standalonePlayerWallContact: { tileX: 1, tileY: -1, tileId: 3, side: 'right' },
      timeMs: 0
    });

    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [{ facing: -1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE }]
    );
  });

  it('maps airborne ceiling contact into the ceiling-bonk placeholder pose', async () => {
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

    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    const camera = new Camera2D();
    const ceilingBonkState = createPlayerState({
      grounded: false,
      velocity: { x: 0, y: 0 }
    });

    renderer.render(camera, {
      standalonePlayer: ceilingBonkState,
      standalonePlayerWallContact: { tileX: 1, tileY: -1, tileId: 3, side: 'right' },
      standalonePlayerCeilingContact: { tileX: 0, tileY: -2, tileId: 4 },
      timeMs: 0
    });

    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [{ facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK }]
    );
  });

  it('keeps the ceiling-bonk placeholder pose active briefly after live contact clears', async () => {
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

    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    const camera = new Camera2D();
    const fallingState = createPlayerState({
      grounded: false,
      velocity: { x: 0, y: 120 }
    });

    renderer.render(camera, {
      standalonePlayer: fallingState,
      standalonePlayerCeilingBonkHoldUntilTimeMs: STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS,
      timeMs: STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS - 1
    });

    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [{ facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK }]
    );
  });

  it('returns to the fall placeholder pose once the ceiling-bonk hold expires', async () => {
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

    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    const camera = new Camera2D();
    const fallingState = createPlayerState({
      grounded: false,
      velocity: { x: 0, y: 120 }
    });

    renderer.render(camera, {
      standalonePlayer: fallingState,
      standalonePlayerCeilingBonkHoldUntilTimeMs: STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS,
      timeMs: STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS
    });

    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [{ facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL }]
    );
  });

  it('reuploads animated chunk UVs only when the elapsed frame changes', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: 96,
      height: 64
    });
    await renderer.initialize();

    renderer.setTile(0, 0, 5);
    const camera = new Camera2D();
    camera.zoom = 16;

    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);

    const bufferData = vi.mocked(gl.bufferData);
    bufferData.mockClear();

    renderer.render(camera, { timeMs: 0 });
    renderer.render(camera, { timeMs: 179 });
    expect(bufferData).not.toHaveBeenCalled();
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(0);

    renderer.render(camera, { timeMs: 180 });
    expect(bufferData).toHaveBeenCalledTimes(1);
    const frameOneVertices = bufferData.mock.calls[0]?.[1] as Float32Array | undefined;
    const frameOneUv = atlasIndexToUvRect(15);
    expect(frameOneVertices).toBeInstanceOf(Float32Array);
    expect(Array.from(frameOneVertices?.slice(2, 4) ?? [])).toEqual([
      toFloat32(frameOneUv.u0),
      toFloat32(frameOneUv.v0)
    ]);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(frameOneVertices?.byteLength ?? 0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);

    renderer.render(camera, { timeMs: 359 });
    expect(bufferData).toHaveBeenCalledTimes(1);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(0);

    renderer.render(camera, { timeMs: 360 });
    expect(bufferData).toHaveBeenCalledTimes(2);
    const frameZeroVertices = bufferData.mock.calls[1]?.[1] as Float32Array | undefined;
    const frameZeroUv = atlasIndexToUvRect(14);
    expect(Array.from(frameZeroVertices?.slice(2, 4) ?? [])).toEqual([
      toFloat32(frameZeroUv.u0),
      toFloat32(frameZeroUv.v0)
    ]);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(frameZeroVertices?.byteLength ?? 0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);
    performanceNowSpy.mockRestore();
  });

  it('patches animated direct render.uvRect chunk UVs when the elapsed frame changes', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: 96,
      height: 64
    });
    await renderer.initialize();

    renderer.setTile(0, 0, 6);
    const camera = new Camera2D();
    camera.zoom = 16;

    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    expect(renderer.telemetry.residentAnimatedLiquidChunkQuadCount).toBe(0);

    const bufferData = vi.mocked(gl.bufferData);
    bufferData.mockClear();

    renderer.render(camera, { timeMs: 0 });
    renderer.render(camera, { timeMs: 179 });
    expect(bufferData).not.toHaveBeenCalled();
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(0);

    renderer.render(camera, { timeMs: 180 });
    expect(bufferData).toHaveBeenCalledTimes(1);
    const frameOneVertices = bufferData.mock.calls[0]?.[1] as Float32Array | undefined;
    const frameOneUv = resolveAnimatedTileRenderFrameUvRect(6, 1);
    expect(frameOneUv).not.toBeNull();
    expect(frameOneVertices).toBeInstanceOf(Float32Array);
    expect(Array.from(frameOneVertices?.slice(2, 4) ?? [])).toEqual([
      toFloat32(frameOneUv!.u0),
      toFloat32(frameOneUv!.v0)
    ]);
    expect(Array.from(frameOneVertices?.slice(27, 29) ?? [])).toEqual([
      toFloat32(frameOneUv!.u0),
      toFloat32(frameOneUv!.v1)
    ]);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(frameOneVertices?.byteLength ?? 0);

    renderer.render(camera, { timeMs: 359 });
    expect(bufferData).toHaveBeenCalledTimes(1);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(0);

    renderer.render(camera, { timeMs: 360 });
    expect(bufferData).toHaveBeenCalledTimes(2);
    const frameZeroVertices = bufferData.mock.calls[1]?.[1] as Float32Array | undefined;
    const frameZeroUv = resolveAnimatedTileRenderFrameUvRect(6, 0);
    expect(frameZeroUv).not.toBeNull();
    expect(Array.from(frameZeroVertices?.slice(2, 4) ?? [])).toEqual([
      toFloat32(frameZeroUv!.u0),
      toFloat32(frameZeroUv!.v0)
    ]);
    expect(Array.from(frameZeroVertices?.slice(27, 29) ?? [])).toEqual([
      toFloat32(frameZeroUv!.u0),
      toFloat32(frameZeroUv!.v1)
    ]);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadLiquidQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(frameZeroVertices?.byteLength ?? 0);
    performanceNowSpy.mockRestore();
  });

  it('patches animated liquid chunk UVs when the elapsed frame changes', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: 96,
      height: 64
    });
    await renderer.initialize();

    renderer.setTile(0, 0, 7);
    const camera = new Camera2D();
    camera.zoom = 16;

    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);

    const bufferData = vi.mocked(gl.bufferData);
    bufferData.mockClear();

    renderer.render(camera, { timeMs: 0 });
    renderer.render(camera, { timeMs: 179 });
    expect(bufferData).not.toHaveBeenCalled();
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(0);

    renderer.render(camera, { timeMs: 180 });
    expect(bufferData).toHaveBeenCalledTimes(1);
    const frameOneVertices = bufferData.mock.calls[0]?.[1] as Float32Array | undefined;
    const liquidCardinalMask = 0;
    const frameOneUv = resolveLiquidRenderVariantUvRectAtElapsedMs(7, liquidCardinalMask, 180);
    expect(frameOneUv).not.toBeNull();
    expect(frameOneVertices).toBeInstanceOf(Float32Array);
    expect(Array.from(frameOneVertices?.slice(2, 4) ?? [])).toEqual([
      toFloat32(frameOneUv!.u0),
      toFloat32(frameOneUv!.v0)
    ]);
    expect(Array.from(frameOneVertices?.slice(27, 29) ?? [])).toEqual([
      toFloat32(frameOneUv!.u0),
      toFloat32(frameOneUv!.v1)
    ]);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(frameOneVertices?.byteLength ?? 0);

    renderer.render(camera, { timeMs: 359 });
    expect(bufferData).toHaveBeenCalledTimes(1);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(0);

    renderer.render(camera, { timeMs: 360 });
    expect(bufferData).toHaveBeenCalledTimes(2);
    const frameZeroVertices = bufferData.mock.calls[1]?.[1] as Float32Array | undefined;
    const frameZeroUv = resolveLiquidRenderVariantUvRectAtElapsedMs(7, liquidCardinalMask, 360);
    expect(frameZeroUv).not.toBeNull();
    expect(Array.from(frameZeroVertices?.slice(2, 4) ?? [])).toEqual([
      toFloat32(frameZeroUv!.u0),
      toFloat32(frameZeroUv!.v0)
    ]);
    expect(Array.from(frameZeroVertices?.slice(27, 29) ?? [])).toEqual([
      toFloat32(frameZeroUv!.u0),
      toFloat32(frameZeroUv!.v1)
    ]);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(1);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(frameZeroVertices?.byteLength ?? 0);
    performanceNowSpy.mockRestore();
  });

  it('drops resident animated chunk telemetry after streaming prunes an off-screen animated mesh', async () => {
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

    renderer.setTile(0, 0, 5);
    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;

    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;

    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(0);
    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);
    performanceNowSpy.mockRestore();
  });

  it('recovers resident animated chunk telemetry when a pruned animated chunk streams back into view', async () => {
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

    renderer.setTile(0, 0, 5);
    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;

    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;

    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(0);
    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    performanceNowSpy.mockRestore();
  });

  it('skips redundant animated UV reuploads when a pruned animated chunk streams back into view at frame zero', async () => {
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

    renderer.setTile(0, 0, 5);
    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;

    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;

    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(0);

    const bufferData = vi.mocked(gl.bufferData);
    bufferData.mockClear();

    renderUntilMeshBuildQueueDrains(renderer, nearCamera, 120, 0);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);

    const rebuiltAnimatedVertices = dynamicUploads[0]?.[1] as Float32Array | undefined;
    const frameZeroUv = atlasIndexToUvRect(14);
    expect(rebuiltAnimatedVertices).toBeInstanceOf(Float32Array);
    expect(Array.from(rebuiltAnimatedVertices?.slice(2, 4) ?? [])).toEqual([
      toFloat32(frameZeroUv.u0),
      toFloat32(frameZeroUv.v0)
    ]);
    expect(renderer.telemetry.animatedChunkUvUploadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadQuadCount).toBe(0);
    expect(renderer.telemetry.animatedChunkUvUploadBytes).toBe(0);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    performanceNowSpy.mockRestore();
  });

  it('reuploads the elapsed animation frame after a pruned animated chunk streams back into view', async () => {
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

    renderer.setTile(0, 0, 5);
    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;

    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = CHUNK_SIZE * TILE_SIZE * 10;

    renderer.render(farCamera, { timeMs: 0 });

    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(0);

    const bufferData = vi.mocked(gl.bufferData);
    bufferData.mockClear();

    renderUntilMeshBuildQueueDrains(renderer, nearCamera, 120, 180);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(2);

    const rebuiltAnimatedVertices = dynamicUploads.at(-1)?.[1] as Float32Array | undefined;
    const frameOneUv = atlasIndexToUvRect(15);
    expect(rebuiltAnimatedVertices).toBeInstanceOf(Float32Array);
    expect(Array.from(rebuiltAnimatedVertices?.slice(2, 4) ?? [])).toEqual([frameOneUv.u0, frameOneUv.v0]);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    performanceNowSpy.mockRestore();
  });
});
