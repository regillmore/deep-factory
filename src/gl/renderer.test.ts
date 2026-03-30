import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Camera2D } from '../core/camera2d';
import { AUTHORED_ATLAS_HEIGHT, AUTHORED_ATLAS_WIDTH } from '../world/authoredAtlasLayout';
import { CHUNK_SIZE, MAX_LIGHT_LEVEL, MAX_LIQUID_LEVEL, TILE_SIZE } from '../world/constants';
import { createDroppedItemState, type DroppedItemState } from '../world/droppedItem';
import {
  CHUNK_MESH_FLOATS_PER_VERTEX,
  CHUNK_MESH_UV_FLOAT_OFFSET,
  insetTileUvRectForAtlasSampling
} from '../world/mesher';
import { resolveProceduralTerrainTileId } from '../world/proceduralTerrain';
import {
  createPlayerState,
  type PlayerCollisionContacts,
  type PlayerState
} from '../world/playerState';
import { createHostileSlimeState, type HostileSlimeState } from '../world/hostileSlimeState';
import { createPassiveBunnyState, type PassiveBunnyState } from '../world/passiveBunnyState';
import {
  createBombDetonationFlashState,
  type BombDetonationFlashState
} from '../world/bombDetonationFlash';
import { createThrownBombState, type ThrownBombState } from '../world/bombThrowing';
import { createArrowProjectileState, type ArrowProjectileState } from '../world/bowFiring';
import { createStarterWandFireboltState, type StarterWandFireboltState } from '../world/starterWand';
import {
  cloneStandalonePlayerRenderState,
  createStandalonePlayerRenderPresentationState
} from '../world/standalonePlayerRenderState';
import { STARTER_TORCH_TILE_ID } from '../world/starterTorchPlacement';
import { TileWorld } from '../world/world';
import {
  atlasIndexToUvRect,
  getTileEmissiveLightLevel,
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
    vi.fn<
      (
        tiles: unknown,
        atlasWidth: number,
        atlasHeight: number,
        walls?: unknown
      ) => AtlasValidationWarning[]
    >(
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

import { getDroppedItemPlaceholderPalette } from './droppedItemPlaceholder';
import {
  buildBombDetonationFlashPlaceholderVertices,
  resolveBombDetonationFlashPlaceholderVisuals
} from './bombDetonationFlashPlaceholder';
import { Renderer, type RendererEntityFrameState } from './renderer';
import { resolveThrownBombFuseWarningVisuals } from './thrownBombPlaceholder';

const WATER_TILE_ID = 7;

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
    uniform3f: vi.fn(),
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
const sampleUvRect = (uvRect: { u0: number; v0: number; u1: number; v1: number }) =>
  insetTileUvRectForAtlasSampling(uvRect);
const CHUNK_MESH_FLOATS_PER_TILE_QUAD = CHUNK_MESH_FLOATS_PER_VERTEX * 6;
const CHUNK_MESH_BOTTOM_LEFT_UV_FLOAT_OFFSET =
  CHUNK_MESH_UV_FLOAT_OFFSET + CHUNK_MESH_FLOATS_PER_VERTEX * 5;

const expectChunkVerticesToContainSampledUvRect = (
  vertices: Float32Array | undefined,
  sampledUvRect: { u0: number; v0: number; u1: number; v1: number }
): void => {
  expect(vertices).toBeInstanceOf(Float32Array);
  if (!(vertices instanceof Float32Array)) {
    throw new Error('Expected chunk vertices to be uploaded as a Float32Array.');
  }

  const expectedTopLeft = [toFloat32(sampledUvRect.u0), toFloat32(sampledUvRect.v0)];
  const expectedBottomLeft = [toFloat32(sampledUvRect.u0), toFloat32(sampledUvRect.v1)];
  let foundMatch = false;

  for (
    let quadOffset = 0;
    quadOffset <= vertices.length - CHUNK_MESH_FLOATS_PER_TILE_QUAD;
    quadOffset += CHUNK_MESH_FLOATS_PER_TILE_QUAD
  ) {
    const topLeft = Array.from(
      vertices.slice(
        quadOffset + CHUNK_MESH_UV_FLOAT_OFFSET,
        quadOffset + CHUNK_MESH_UV_FLOAT_OFFSET + 2
      )
    );
    const bottomLeft = Array.from(
      vertices.slice(
        quadOffset + CHUNK_MESH_BOTTOM_LEFT_UV_FLOAT_OFFSET,
        quadOffset + CHUNK_MESH_BOTTOM_LEFT_UV_FLOAT_OFFSET + 2
      )
    );
    if (
      topLeft[0] === expectedTopLeft[0] &&
      topLeft[1] === expectedTopLeft[1] &&
      bottomLeft[0] === expectedBottomLeft[0] &&
      bottomLeft[1] === expectedBottomLeft[1]
    ) {
      foundMatch = true;
      break;
    }
  }

  expect(
    {
      foundMatch,
      expectedTopLeft,
      expectedBottomLeft,
      uploadedVertexCount: vertices.length / CHUNK_MESH_FLOATS_PER_VERTEX
    },
    'Expected uploaded chunk vertices to include the animated quad UV rect.'
  ).toEqual({
    foundMatch: true,
    expectedTopLeft,
    expectedBottomLeft,
    uploadedVertexCount: vertices.length / CHUNK_MESH_FLOATS_PER_VERTEX
  });
};

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

const expectHostileSlimeUniformValues = (
  uniformCalls: Array<[WebGLUniformLocation | null, number]>,
  expectedFacingSigns: number[]
): void => {
  expect(uniformCalls).toHaveLength(expectedFacingSigns.length * 2);
  for (let index = 0; index < expectedFacingSigns.length; index += 1) {
    const base = index * 2;
    expect(uniformCalls[base]?.[1]).toBe(expectedFacingSigns[index]);
    expect(uniformCalls[base + 1]?.[1]).toBeGreaterThanOrEqual(0);
    expect(uniformCalls[base + 1]?.[1]).toBeLessThanOrEqual(1);
  }
};

const expectPassiveBunnyUniformValues = (
  uniformCalls: Array<[WebGLUniformLocation | null, number]>,
  expectedFacingSigns: number[]
): void => {
  expect(uniformCalls).toHaveLength(expectedFacingSigns.length * 2);
  for (let index = 0; index < expectedFacingSigns.length; index += 1) {
    const base = index * 2;
    expect(uniformCalls[base]?.[1]).toBe(expectedFacingSigns[index]);
    expect(uniformCalls[base + 1]?.[1]).toBeGreaterThanOrEqual(0);
    expect(uniformCalls[base + 1]?.[1]).toBeLessThanOrEqual(1);
  }
};

const createStandalonePlayerEntityFrameState = (
  currentState: PlayerState,
  options: {
    id?: number;
    previousState?: PlayerState;
    previousWallContact?: PlayerCollisionContacts['wall'] | null;
    previousCeilingContact?: PlayerCollisionContacts['ceiling'] | null;
    previousCeilingBonkHoldUntilTimeMs?: number | null;
    wallContact?: PlayerCollisionContacts['wall'] | null;
    ceilingContact?: PlayerCollisionContacts['ceiling'] | null;
    ceilingBonkHoldUntilTimeMs?: number | null;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'standalone-player',
  snapshot: {
    previous: cloneStandalonePlayerRenderState(
      options.previousState ?? currentState,
      createStandalonePlayerRenderPresentationState(
        {
          wall: options.previousWallContact ?? null,
          ceiling: options.previousCeilingContact ?? null
        },
        options.previousCeilingBonkHoldUntilTimeMs ?? null
      )
    ),
    current: cloneStandalonePlayerRenderState(
      currentState,
      createStandalonePlayerRenderPresentationState(
        {
          wall: options.wallContact ?? null,
          ceiling: options.ceilingContact ?? null
        },
        options.ceilingBonkHoldUntilTimeMs ?? null
      )
    )
  }
});

const createHostileSlimeEntityFrameState = (
  currentState: HostileSlimeState,
  options: {
    id?: number;
    previousState?: HostileSlimeState;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'slime',
  snapshot: {
    previous: options.previousState ?? currentState,
    current: currentState
  }
});

const createDroppedItemEntityFrameState = (
  currentState: DroppedItemState,
  options: {
    id?: number;
    previousState?: DroppedItemState;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'dropped-item',
  snapshot: {
    previous: options.previousState ?? currentState,
    current: currentState
  }
});

const createPassiveBunnyEntityFrameState = (
  currentState: PassiveBunnyState,
  options: {
    id?: number;
    previousState?: PassiveBunnyState;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'bunny',
  snapshot: {
    previous: options.previousState ?? currentState,
    current: currentState
  }
});

const createFireboltEntityFrameState = (
  currentState: StarterWandFireboltState,
  options: {
    id?: number;
    previousState?: StarterWandFireboltState;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'wand-firebolt',
  snapshot: {
    previous: options.previousState ?? currentState,
    current: currentState
  }
});

const createArrowProjectileEntityFrameState = (
  currentState: ArrowProjectileState,
  options: {
    id?: number;
    previousState?: ArrowProjectileState;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'arrow-projectile',
  snapshot: {
    previous: options.previousState ?? currentState,
    current: currentState
  }
});

const createGrapplingHookEntityFrameState = (
  currentState: DroppedItemState,
  options: {
    id?: number;
    previousState?: DroppedItemState;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'grappling-hook',
  snapshot: {
    previous: options.previousState ?? currentState,
    current: currentState
  }
});

const createThrownBombEntityFrameState = (
  currentState: ThrownBombState,
  options: {
    id?: number;
    previousState?: ThrownBombState;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'thrown-bomb',
  snapshot: {
    previous: options.previousState ?? currentState,
    current: currentState
  }
});

const createBombDetonationFlashEntityFrameState = (
  currentState: BombDetonationFlashState,
  options: {
    id?: number;
    previousState?: BombDetonationFlashState;
  } = {}
): RendererEntityFrameState => ({
  id: options.id ?? 1,
  kind: 'bomb-detonation-flash',
  snapshot: {
    previous: options.previousState ?? currentState,
    current: currentState
  }
});

const renderUntilMeshBuildQueueDrains = (
  renderer: Renderer,
  camera: Camera2D,
  maxFrames = 512,
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

const BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT = (() => {
  const world = new TileWorld(0);

  for (let worldTileY = -CHUNK_SIZE * 6; worldTileY < CHUNK_SIZE * 6; worldTileY += 1) {
    for (let worldTileX = -CHUNK_SIZE * 6; worldTileX < CHUNK_SIZE * 15; worldTileX += 1) {
      world.setTile(worldTileX, worldTileY, 0);
    }
  }

  return world.createSnapshot();
})();

const captureAnimatedChunkResidencyTelemetry = (renderer: Renderer) => ({
  residentAnimatedChunkMeshes: renderer.telemetry.residentAnimatedChunkMeshes,
  residentAnimatedChunkQuadCount: renderer.telemetry.residentAnimatedChunkQuadCount,
  residentAnimatedLiquidChunkQuadCount: renderer.telemetry.residentAnimatedLiquidChunkQuadCount
});

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
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentActiveLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkY).toBeNull();
    expect(renderer.telemetry.liquidStepDownwardActiveChunksScanned).toBe(0);
    expect(renderer.telemetry.liquidStepSidewaysCandidateChunksScanned).toBe(0);
    expect(renderer.telemetry.liquidStepSidewaysPairsTested).toBe(0);
    expect(renderer.telemetry.liquidStepDownwardTransfersApplied).toBe(0);
    expect(renderer.telemetry.liquidStepSidewaysTransfersApplied).toBe(0);
    expect(renderer.telemetry.liquidStepPhaseSummary).toBe('none');
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightFactor).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkY).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY).toBeNull();
  });

  it('records zoomed-out no-liquid liquid-step telemetry from the last fixed step', async () => {
    const renderer = new Renderer(createMockCanvas(createMockGl()));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const camera = new Camera2D();
    camera.zoom = 0.1;
    renderUntilMeshBuildQueueDrains(renderer, camera);

    expect(renderer.telemetry.residentWorldChunks).toBe(224);
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentActiveLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkY).toBeNull();
    expect(renderer.stepLiquidSimulation()).toBe(false);
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentActiveLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkY).toBeNull();
    expect(renderer.telemetry.liquidStepDownwardActiveChunksScanned).toBe(0);
    expect(renderer.telemetry.liquidStepSidewaysCandidateChunksScanned).toBe(0);
    expect(renderer.telemetry.liquidStepSidewaysPairsTested).toBe(0);
    expect(renderer.telemetry.liquidStepDownwardTransfersApplied).toBe(0);
    expect(renderer.telemetry.liquidStepSidewaysTransfersApplied).toBe(0);
    expect(renderer.telemetry.liquidStepPhaseSummary).toBe('none');
  });

  it('derives liquid-step phase summary telemetry from applied downward and sideways transfers', async () => {
    const renderer = new Renderer(createMockCanvas(createMockGl()));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    expect(renderer.stepLiquidSimulation()).toBe(false);
    expect(renderer.telemetry.liquidStepPhaseSummary).toBe('none');

    renderer.resetWorld();
    expect(renderer.setTile(5, -19, 1)).toBe(true);
    expect(renderer.setTile(4, -20, WATER_TILE_ID)).toBe(true);
    expect(renderer.stepLiquidSimulation()).toBe(true);
    expect(renderer.telemetry.liquidStepPhaseSummary).toBe('downward');

    renderer.resetWorld();
    const boundaryTileX = CHUNK_SIZE - 1;
    const boundaryTileY = -20;
    expect(renderer.setTile(boundaryTileX - 1, boundaryTileY, 1)).toBe(true);
    expect(renderer.setTile(boundaryTileX, boundaryTileY + 1, 1)).toBe(true);
    expect(renderer.setTile(boundaryTileX + 1, boundaryTileY + 1, 1)).toBe(true);
    expect(renderer.setTile(boundaryTileX, boundaryTileY, WATER_TILE_ID)).toBe(true);
    expect(renderer.stepLiquidSimulation()).toBe(false);
    expect(renderer.stepLiquidSimulation()).toBe(true);
    expect(renderer.telemetry.liquidStepPhaseSummary).toBe('sideways');

    renderer.resetWorld();
    const sourceWorldTileY = -33;
    const targetWorldTileY = sourceWorldTileY + 1;
    expect(renderer.setTile(4, targetWorldTileY + 1, 1)).toBe(true);
    expect(renderer.setTile(5, targetWorldTileY + 1, 1)).toBe(true);
    expect(renderer.setTile(4, sourceWorldTileY, WATER_TILE_ID)).toBe(true);
    expect(renderer.stepLiquidSimulation()).toBe(true);
    expect(renderer.telemetry.liquidStepPhaseSummary).toBe('both');
  });

  it('tracks resident active-liquid chunk counts and bounds in renderer telemetry after liquid edits', async () => {
    const renderer = new Renderer(createMockCanvas(createMockGl()));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const camera = new Camera2D();
    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentActiveLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkY).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkY).toBeNull();

    expect(renderer.setTile(-4, -20, WATER_TILE_ID)).toBe(true);
    expect(renderer.setTile(CHUNK_SIZE + 4, 4, WATER_TILE_ID)).toBe(true);
    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(2);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentActiveLiquidMinChunkX).toBe(-1);
    expect(renderer.telemetry.residentActiveLiquidMinChunkY).toBe(-1);
    expect(renderer.telemetry.residentActiveLiquidMaxChunkX).toBe(1);
    expect(renderer.telemetry.residentActiveLiquidMaxChunkY).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkY).toBeNull();

    expect(renderer.setTile(CHUNK_SIZE + 4, 4, 0)).toBe(true);
    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(1);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentActiveLiquidMinChunkX).toBe(-1);
    expect(renderer.telemetry.residentActiveLiquidMinChunkY).toBe(-1);
    expect(renderer.telemetry.residentActiveLiquidMaxChunkX).toBe(-1);
    expect(renderer.telemetry.residentActiveLiquidMaxChunkY).toBe(-1);
    expect(renderer.telemetry.residentSleepingLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkY).toBeNull();
  });

  it('tracks last-step sideways candidate-band bounds in renderer telemetry', async () => {
    const renderer = new Renderer(createMockCanvas(createMockGl()));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const worldTileX = 4;
    const worldTileY = -20;

    expect(renderer.setTile(-4, worldTileY, 1)).toBe(true);
    expect(renderer.setTile(CHUNK_SIZE + 4, worldTileY, 1)).toBe(true);
    expect(renderer.setTile(worldTileX - 1, worldTileY, 1)).toBe(true);
    expect(renderer.setTile(worldTileX + 1, worldTileY, 1)).toBe(true);
    expect(renderer.setTile(worldTileX, worldTileY + 1, 1)).toBe(true);
    expect(renderer.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(renderer.stepLiquidSimulation()).toBe(false);
    expect(renderer.telemetry.residentActiveLiquidMinChunkX).toBe(0);
    expect(renderer.telemetry.residentActiveLiquidMinChunkY).toBe(-1);
    expect(renderer.telemetry.residentActiveLiquidMaxChunkX).toBe(0);
    expect(renderer.telemetry.residentActiveLiquidMaxChunkY).toBe(-1);
    expect(renderer.telemetry.liquidStepSidewaysCandidateMinChunkX).toBe(-1);
    expect(renderer.telemetry.liquidStepSidewaysCandidateMinChunkY).toBe(-1);
    expect(renderer.telemetry.liquidStepSidewaysCandidateMaxChunkX).toBe(1);
    expect(renderer.telemetry.liquidStepSidewaysCandidateMaxChunkY).toBe(-1);
  });

  it('drops active-liquid telemetry after a settled pool sleeps and raises it again when a nearby edit wakes it', async () => {
    const renderer = new Renderer(createMockCanvas(createMockGl()));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const camera = new Camera2D();
    renderUntilMeshBuildQueueDrains(renderer, camera);

    expect(renderer.setTile(3, -20, 1)).toBe(true);
    expect(renderer.setTile(5, -20, 1)).toBe(true);
    expect(renderer.setTile(4, -19, 1)).toBe(true);
    expect(renderer.setTile(5, -19, 1)).toBe(true);
    expect(renderer.setTile(4, -20, WATER_TILE_ID)).toBe(true);
    renderUntilMeshBuildQueueDrains(renderer, camera);

    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(1);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.stepLiquidSimulation()).toBe(false);
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(1);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.stepLiquidSimulation()).toBe(false);
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(1);
    expect(renderer.telemetry.residentActiveLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentActiveLiquidMaxChunkY).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMinChunkX).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidMinChunkY).toBe(-1);
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkX).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkY).toBe(-1);

    expect(renderer.setTile(5, -20, 0)).toBe(true);
    renderer.render(camera, { timeMs: 0 });
    expect(renderer.telemetry.residentActiveLiquidChunks).toBe(1);
    expect(renderer.telemetry.residentSleepingLiquidChunks).toBe(0);
    expect(renderer.telemetry.residentSleepingLiquidMinChunkX).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMinChunkY).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkX).toBeNull();
    expect(renderer.telemetry.residentSleepingLiquidMaxChunkY).toBeNull();
    expect(renderer.stepLiquidSimulation()).toBe(true);
    expect(renderer.getLiquidLevel(4, -20)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(renderer.getLiquidLevel(5, -20)).toBe(MAX_LIQUID_LEVEL / 2);
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });

    await renderer.initialize();

    expect(loadAtlasImageSource).toHaveBeenCalledWith('/atlas/tile-atlas.png');
    expect(createTextureFromImageSource).toHaveBeenCalledWith(gl, authoredBitmap);
    expect(renderer.telemetry.atlasSourceKind).toBe('authored');
    expect(renderer.telemetry.atlasWidth).toBe(AUTHORED_ATLAS_WIDTH);
    expect(renderer.telemetry.atlasHeight).toBe(AUTHORED_ATLAS_HEIGHT);
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });

    await renderer.initialize();

    expect(createTextureFromImageSource).toHaveBeenCalledWith(gl, placeholderImage);
    expect(renderer.telemetry.atlasSourceKind).toBe('placeholder');
    expect(renderer.telemetry.atlasWidth).toBe(AUTHORED_ATLAS_WIDTH);
    expect(renderer.telemetry.atlasHeight).toBe(AUTHORED_ATLAS_HEIGHT);
    expect(renderer.telemetry.atlasValidationWarningCount).toBe(0);
    expect(renderer.telemetry.atlasValidationFirstWarning).toBeNull();
  });

  it('records atlas wall warnings and logs them during initialization', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    collectAtlasValidationWarnings.mockReturnValue([
      {
        entryKind: 'wall',
        entryId: 2,
        entryName: 'wood_wall',
        kind: 'pixelAlignment',
        sourcePath: 'render.atlasIndex',
        summary: 'wall 2 "wood_wall" render.atlasIndex',
        message:
          'wall 2 "wood_wall" render.atlasIndex resolves to [160, 32]..[176, 48] on non-integer atlas pixels for 96x64'
      }
    ]);

    await renderer.initialize();

    expect(collectAtlasValidationWarnings).toHaveBeenCalledWith(
      expect.any(Array),
      AUTHORED_ATLAS_WIDTH,
      AUTHORED_ATLAS_HEIGHT,
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: 'dirt_wall' }),
        expect.objectContaining({ id: 2, name: 'wood_wall' })
      ])
    );
    expect(renderer.telemetry.atlasValidationWarningCount).toBe(1);
    expect(renderer.telemetry.atlasValidationFirstWarning).toBe('wall 2 "wood_wall" render.atlasIndex');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('Atlas validation found 1 warning(s)');
    expect(warnSpy.mock.calls[0]?.[0]).toContain('wall 2 "wood_wall" render.atlasIndex');
  });

  it('resets the active world and clears cached animated meshes for a fresh session', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const camera = new Camera2D();
    camera.zoom = 16;
    renderUntilMeshBuildQueueDrains(renderer, camera);
    const freshSessionAnimatedTelemetry = captureAnimatedChunkResidencyTelemetry(renderer);

    renderer.loadWorldSnapshot(BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT);
    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(captureAnimatedChunkResidencyTelemetry(renderer)).toEqual({
      residentAnimatedChunkMeshes: 0,
      residentAnimatedChunkQuadCount: 0,
      residentAnimatedLiquidChunkQuadCount: 0
    });

    renderer.setTile(0, 0, 5);

    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(renderer.getTile(0, 0)).toBe(5);
    expect(captureAnimatedChunkResidencyTelemetry(renderer)).toEqual({
      residentAnimatedChunkMeshes: 1,
      residentAnimatedChunkQuadCount: 1,
      residentAnimatedLiquidChunkQuadCount: 0
    });
    expect(renderer.telemetry.residentDirtyLightChunks).toBe(0);

    const deleteBuffer = vi.mocked(gl.deleteBuffer);
    const deleteVertexArray = vi.mocked(gl.deleteVertexArray);
    deleteBuffer.mockClear();
    deleteVertexArray.mockClear();

    renderer.resetWorld();
    renderUntilMeshBuildQueueDrains(renderer, camera);

    expect(renderer.getTile(0, 0)).toBe(resolveProceduralTerrainTileId(0, 0));
    expect(captureAnimatedChunkResidencyTelemetry(renderer)).toEqual(freshSessionAnimatedTelemetry);
    expect(renderer.telemetry.residentDirtyLightChunks).toBe(0);
    expect(deleteBuffer).toHaveBeenCalled();
    expect(deleteVertexArray).toHaveBeenCalled();
  });

  it('creates detached world snapshots from the active world state', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const worldTileX = CHUNK_SIZE + 4;
    const worldTileY = -20;
    renderer.setTile(worldTileX, worldTileY, 6);

    const snapshot = renderer.createWorldSnapshot();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(snapshot);
    expect(restoredWorld.getTile(worldTileX, worldTileY)).toBe(6);

    renderer.setTile(worldTileX, worldTileY, 5);

    const restoredSnapshotWorld = new TileWorld(0);
    restoredSnapshotWorld.loadSnapshot(snapshot);
    expect(restoredSnapshotWorld.getTile(worldTileX, worldTileY)).toBe(6);
  });

  it('reads and writes background walls through the active world state', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const worldTileX = CHUNK_SIZE + 5;
    const worldTileY = -18;

    expect(renderer.setWall(worldTileX, worldTileY, 1)).toBe(true);
    expect(renderer.getWall(worldTileX, worldTileY)).toBe(1);

    const snapshot = renderer.createWorldSnapshot();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(snapshot);
    expect(restoredWorld.getWall(worldTileX, worldTileY)).toBe(1);
  });

  it('invalidates only the owning chunk mesh for wall-only edits on chunk boundaries', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    const worldTileX = CHUNK_SIZE - 1;
    const worldTileY = 0;
    const currentWallId = renderer.getWall(worldTileX, worldTileY);
    const nextWallId = currentWallId === 1 ? 3 : 1;

    expect(renderer.setWall(worldTileX, worldTileY, nextWallId)).toBe(true);

    expect(invalidateChunkMeshSpy.mock.calls).toEqual([[0, 0]]);
  });

  it('resets into seeded procedural terrain when a world seed is provided', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const worldSeed = 0x12345678;
    const worldTileX = 41;
    const worldTileY = -18;

    renderer.resetWorld(worldSeed);

    const snapshot = renderer.createWorldSnapshot();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(snapshot);

    expect(snapshot.worldSeed).toBe(worldSeed);
    expect(restoredWorld.getWorldSeed()).toBe(worldSeed);
    expect(renderer.getTile(worldTileX, worldTileY)).toBe(
      resolveProceduralTerrainTileId(worldTileX, worldTileY, worldSeed)
    );
  });

  it('invalidates chunk meshes when explicit tile-state replay changes only liquid level', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    expect(renderer.setTileState(1, 1, WATER_TILE_ID, MAX_LIQUID_LEVEL)).toBe(true);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    expect(renderer.setTileState(1, 1, WATER_TILE_ID, MAX_LIQUID_LEVEL / 2)).toBe(true);

    expect(renderer.getTile(1, 1)).toBe(WATER_TILE_ID);
    expect(renderer.getLiquidLevel(1, 1)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(invalidateChunkMeshSpy.mock.calls).toEqual([[0, 0]]);
  });

  it('loads a provided world snapshot into the active renderer session and clears cached animated meshes', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const camera = new Camera2D();
    camera.zoom = 16;
    const blankWorldSnapshot = BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT;

    renderer.loadWorldSnapshot(blankWorldSnapshot);
    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(captureAnimatedChunkResidencyTelemetry(renderer)).toEqual({
      residentAnimatedChunkMeshes: 0,
      residentAnimatedChunkQuadCount: 0,
      residentAnimatedLiquidChunkQuadCount: 0
    });

    renderer.setTile(0, 0, 5);
    renderUntilMeshBuildQueueDrains(renderer, camera);
    expect(captureAnimatedChunkResidencyTelemetry(renderer)).toEqual({
      residentAnimatedChunkMeshes: 1,
      residentAnimatedChunkQuadCount: 1,
      residentAnimatedLiquidChunkQuadCount: 0
    });

    const deleteBuffer = vi.mocked(gl.deleteBuffer);
    const deleteVertexArray = vi.mocked(gl.deleteVertexArray);
    deleteBuffer.mockClear();
    deleteVertexArray.mockClear();

    renderer.loadWorldSnapshot(blankWorldSnapshot);
    renderUntilMeshBuildQueueDrains(renderer, camera);

    expect(renderer.getTile(0, 0)).toBe(0);
    expect(captureAnimatedChunkResidencyTelemetry(renderer)).toEqual({
      residentAnimatedChunkMeshes: 0,
      residentAnimatedChunkQuadCount: 0,
      residentAnimatedLiquidChunkQuadCount: 0
    });
    expect(deleteBuffer).toHaveBeenCalled();
    expect(deleteVertexArray).toHaveBeenCalled();

    renderer.setTile(0, 0, 6);

    const restoredSnapshotWorld = new TileWorld(0);
    restoredSnapshotWorld.loadSnapshot(blankWorldSnapshot);
    expect(restoredSnapshotWorld.getTile(0, 0)).toBe(0);
  });

  it('keeps external tile-edit listeners attached across renderer world replacement', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const events: Array<{
      worldTileX: number;
      worldTileY: number;
      previousTileId: number;
      tileId: number;
      editOrigin: 'gameplay' | 'debug-break' | 'debug-history';
    }> = [];
    const detach = renderer.onTileEdited((event) => {
      events.push({
        worldTileX: event.worldTileX,
        worldTileY: event.worldTileY,
        previousTileId: event.previousTileId,
        tileId: event.tileId,
        editOrigin: event.editOrigin
      });
    });

    expect(renderer.setTile(0, -10, 5)).toBe(true);

    renderer.resetWorld();
    expect(renderer.setTile(1, -10, 6, 'debug-break')).toBe(true);

    renderer.loadWorldSnapshot(new TileWorld(0).createSnapshot());
    expect(renderer.setTile(2, -10, 7, 'debug-history')).toBe(true);

    detach();
    expect(renderer.setTile(3, -10, 8)).toBe(true);

    expect(events).toEqual([
      {
        worldTileX: 0,
        worldTileY: -10,
        previousTileId: 0,
        tileId: 5,
        editOrigin: 'gameplay'
      },
      {
        worldTileX: 1,
        worldTileY: -10,
        previousTileId: 0,
        tileId: 6,
        editOrigin: 'debug-break'
      },
      {
        worldTileX: 2,
        worldTileY: -10,
        previousTileId: 0,
        tileId: 7,
        editOrigin: 'debug-history'
      }
    ]);
  });

  it('keeps external wall-edit listeners attached across renderer world replacement', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const events: Array<{
      worldTileX: number;
      worldTileY: number;
      previousWallId: number;
      wallId: number;
      editOrigin: 'gameplay' | 'debug-break' | 'debug-history';
    }> = [];
    const detach = renderer.onWallEdited((event) => {
      events.push({
        worldTileX: event.worldTileX,
        worldTileY: event.worldTileY,
        previousWallId: event.previousWallId,
        wallId: event.wallId,
        editOrigin: event.editOrigin
      });
    });

    expect(renderer.setWall(0, -10, 1)).toBe(true);

    renderer.resetWorld();
    expect(renderer.setWall(1, -10, 2, 'debug-break')).toBe(true);

    renderer.loadWorldSnapshot(new TileWorld(0).createSnapshot());
    expect(renderer.setWall(2, -10, 3, 'debug-history')).toBe(true);

    detach();
    expect(renderer.setWall(3, -10, 4)).toBe(true);

    expect(events).toEqual([
      {
        worldTileX: 0,
        worldTileY: -10,
        previousWallId: 0,
        wallId: 1,
        editOrigin: 'gameplay'
      },
      {
        worldTileX: 1,
        worldTileY: -10,
        previousWallId: 0,
        wallId: 2,
        editOrigin: 'debug-break'
      },
      {
        worldTileX: 2,
        worldTileY: -10,
        previousWallId: 0,
        wallId: 3,
        editOrigin: 'debug-history'
      }
    ]);
  });

  it('recomputes placed torch lighting immediately when loading a snapshot with stale clean light caches', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const tunnelWorldTileY = -20;
    const torchWorldTileX = 1;
    const adjacentAirWorldTileX = 2;
    const sourceWorld = new TileWorld(0);
    for (let worldTileX = 0; worldTileX <= 4; worldTileX += 1) {
      sourceWorld.setTile(worldTileX, tunnelWorldTileY - 1, 1);
      sourceWorld.setTile(worldTileX, tunnelWorldTileY + 1, 1);
      sourceWorld.setTile(worldTileX, tunnelWorldTileY, worldTileX === 0 || worldTileX === 4 ? 1 : 0);
    }
    sourceWorld.setTile(torchWorldTileX, tunnelWorldTileY, STARTER_TORCH_TILE_ID);
    sourceWorld.fillChunkLight(0, -1, 0);
    sourceWorld.markChunkLightClean(0, -1);
    expect(sourceWorld.getLightLevel(torchWorldTileX, tunnelWorldTileY)).toBe(0);
    expect(sourceWorld.getLightLevel(adjacentAirWorldTileX, tunnelWorldTileY)).toBe(0);
    expect(sourceWorld.isChunkLightDirty(0, -1)).toBe(false);

    const snapshot = sourceWorld.createSnapshot();
    const torchLightLevel = getTileEmissiveLightLevel(STARTER_TORCH_TILE_ID);

    renderer.loadWorldSnapshot(snapshot);

    const loadedWorld = (
      renderer as unknown as {
        world: TileWorld;
      }
    ).world;
    expect(loadedWorld.getTile(torchWorldTileX, tunnelWorldTileY)).toBe(STARTER_TORCH_TILE_ID);
    expect(loadedWorld.getLightLevel(torchWorldTileX, tunnelWorldTileY)).toBe(torchLightLevel);
    expect(loadedWorld.getLightLevel(adjacentAirWorldTileX, tunnelWorldTileY)).toBe(torchLightLevel - 1);
    expect(loadedWorld.isChunkLightDirty(0, -1)).toBe(false);
    expect(renderer.telemetry.residentDirtyLightChunks).toBe(0);
  });

  it('invalidates lower-row chunk meshes when a roof edit changes lighting across the y=-1/0 seam', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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

  it('invalidates both lower-row chunk meshes when a streamed-back roof build changes lighting across the y=-1/0 seam', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((rowStartWorldTileX + rowEndWorldTileX + 1) * TILE_SIZE) / 2;
    nearCamera.y = -TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = nearCamera.x;
    farCamera.y = CHUNK_SIZE * TILE_SIZE * 10;
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

    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      renderer.setTile(worldTileX, roofWorldTileY, 1);
      renderer.render(nearCamera, { timeMs: 0 });
    }

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, -1],
        [0, 0]
      ])
    );
  });

  it('invalidates both lower-row chunk meshes when a streamed-back roof build changes lighting across the y=-1/0 seam from right to left', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((rowStartWorldTileX + rowEndWorldTileX + 1) * TILE_SIZE) / 2;
    nearCamera.y = -TILE_SIZE;
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farCamera = new Camera2D();
    farCamera.zoom = nearCamera.zoom;
    farCamera.x = nearCamera.x;
    farCamera.y = CHUNK_SIZE * TILE_SIZE * 10;
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

    for (let worldTileX = rowEndWorldTileX; worldTileX >= rowStartWorldTileX; worldTileX -= 1) {
      renderer.setTile(worldTileX, roofWorldTileY, 1);
      renderer.render(nearCamera, { timeMs: 0 });
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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

  it('invalidates both lower-row chunk meshes when a streamed-back roof build changes boundary lighting across an x chunk boundary', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((rowStartWorldTileX + rowEndWorldTileX + 1) * TILE_SIZE) / 2;
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

    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      renderer.setTile(worldTileX, roofWorldTileY, 1);
      renderer.render(nearCamera, { timeMs: 0 });
    }

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, 0],
        [1, 0]
      ])
    );
  });

  it('invalidates both lower-row chunk meshes when a streamed-back roof build changes boundary lighting across an x chunk boundary from right to left', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = ((rowStartWorldTileX + rowEndWorldTileX + 1) * TILE_SIZE) / 2;
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

    for (let worldTileX = rowEndWorldTileX; worldTileX >= rowStartWorldTileX; worldTileX -= 1) {
      renderer.setTile(worldTileX, roofWorldTileY, 1);
      renderer.render(nearCamera, { timeMs: 0 });
    }

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [0, 0],
        [1, 0]
      ])
    );
  });

  it('invalidates streamed-back boundary-adjacent and recessed-gap solid-face lighting when the chunk adjacent to an opened x-boundary blocker reloads on either side', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const leftExteriorWorldTileX = CHUNK_SIZE - 3;
    const leftInteriorWorldTileX = CHUNK_SIZE - 2;
    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const rightInteriorWorldTileX = CHUNK_SIZE + 1;
    const rightExteriorWorldTileX = CHUNK_SIZE + 2;
    const topShadowWorldTileY = -4;
    const boundarySolidWorldTileY = -3;
    const recessedGapWorldTileY = -2;
    const recessedSolidWorldTileY = -1;

    const initializeLeftToRightWorld = (): void => {
      for (let worldTileY = -CHUNK_SIZE; worldTileY <= recessedSolidWorldTileY; worldTileY += 1) {
        renderer.setTile(leftBoundaryWorldTileX, worldTileY, 0);
      }
      renderer.setTile(leftBoundaryWorldTileX, boundarySolidWorldTileY, 1);

      renderer.setTile(rightBoundaryWorldTileX, topShadowWorldTileY, 1);
      renderer.setTile(rightBoundaryWorldTileX, boundarySolidWorldTileY, 0);
      renderer.setTile(rightBoundaryWorldTileX, recessedGapWorldTileY, 0);

      renderer.setTile(rightInteriorWorldTileX, topShadowWorldTileY, 1);
      renderer.setTile(rightInteriorWorldTileX, boundarySolidWorldTileY, 1);
      renderer.setTile(rightInteriorWorldTileX, recessedGapWorldTileY, 0);
      renderer.setTile(rightInteriorWorldTileX, recessedSolidWorldTileY, 1);

      renderer.setTile(rightExteriorWorldTileX, topShadowWorldTileY, 1);
      renderer.setTile(rightExteriorWorldTileX, boundarySolidWorldTileY, 1);
      renderer.setTile(rightExteriorWorldTileX, recessedGapWorldTileY, 1);
      renderer.setTile(rightExteriorWorldTileX, recessedSolidWorldTileY, 1);
    };

    const initializeRightToLeftWorld = (): void => {
      for (let worldTileY = -CHUNK_SIZE; worldTileY <= recessedSolidWorldTileY; worldTileY += 1) {
        renderer.setTile(rightBoundaryWorldTileX, worldTileY, 0);
      }
      renderer.setTile(rightBoundaryWorldTileX, boundarySolidWorldTileY, 1);

      renderer.setTile(leftBoundaryWorldTileX, topShadowWorldTileY, 1);
      renderer.setTile(leftBoundaryWorldTileX, boundarySolidWorldTileY, 0);
      renderer.setTile(leftBoundaryWorldTileX, recessedGapWorldTileY, 0);

      renderer.setTile(leftInteriorWorldTileX, topShadowWorldTileY, 1);
      renderer.setTile(leftInteriorWorldTileX, boundarySolidWorldTileY, 1);
      renderer.setTile(leftInteriorWorldTileX, recessedGapWorldTileY, 0);
      renderer.setTile(leftInteriorWorldTileX, recessedSolidWorldTileY, 1);

      renderer.setTile(leftExteriorWorldTileX, topShadowWorldTileY, 1);
      renderer.setTile(leftExteriorWorldTileX, boundarySolidWorldTileY, 1);
      renderer.setTile(leftExteriorWorldTileX, recessedGapWorldTileY, 1);
      renderer.setTile(leftExteriorWorldTileX, recessedSolidWorldTileY, 1);
    };

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = (CHUNK_SIZE * TILE_SIZE);
    nearCamera.y = -2 * TILE_SIZE;

    initializeLeftToRightWorld();
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    expect(renderer.setTile(leftBoundaryWorldTileX, boundarySolidWorldTileY, 0)).toBe(true);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farLeftCamera = new Camera2D();
    farLeftCamera.zoom = nearCamera.zoom;
    farLeftCamera.x = ((-4 * CHUNK_SIZE + CHUNK_SIZE / 2) * TILE_SIZE);
    farLeftCamera.y = nearCamera.y;
    renderer.render(farLeftCamera, { timeMs: 0 });

    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

    const invalidateChunkMeshSpy = vi.spyOn(
      renderer as unknown as {
        invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
      },
      'invalidateChunkMesh'
    );
    invalidateChunkMeshSpy.mockClear();

    renderer.render(nearCamera, { timeMs: 0 });

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([[1, -1]])
    );

    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    initializeRightToLeftWorld();
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    expect(renderer.setTile(rightBoundaryWorldTileX, boundarySolidWorldTileY, 0)).toBe(true);
    renderUntilMeshBuildQueueDrains(renderer, nearCamera);

    const farRightCamera = new Camera2D();
    farRightCamera.zoom = nearCamera.zoom;
    farRightCamera.x = ((5 * CHUNK_SIZE + CHUNK_SIZE / 2) * TILE_SIZE);
    farRightCamera.y = nearCamera.y;
    renderer.render(farRightCamera, { timeMs: 0 });

    expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
    expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

    invalidateChunkMeshSpy.mockClear();

    renderer.render(nearCamera, { timeMs: 0 });

    expect(invalidateChunkMeshSpy.mock.calls).toEqual(
      expect.arrayContaining([[0, -1]])
    );
  });

  it('keeps a streamed-back dirty x-boundary blocker at emissive falloff on the first resumed draw when the adjacent emissive source chunk stays clean', async () => {
    const createInitializedRenderer = async (): Promise<Renderer> => {
      const gl = createMockGl();
      const renderer = new Renderer(createMockCanvas(gl));
      const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
      loadAtlasImageSource.mockResolvedValue({
        imageSource: authoredBitmap,
        sourceKind: 'authored',
        sourceUrl: '/atlas/tile-atlas.png',
        width: AUTHORED_ATLAS_WIDTH,
        height: AUTHORED_ATLAS_HEIGHT
      });
      await renderer.initialize();
      return renderer;
    };

    const tunnelWorldTileY = -20;
    const tunnelStartWorldTileX = CHUNK_SIZE - 2;
    const tunnelEndWorldTileX = CHUNK_SIZE + 2;
    const emissiveTileId = 6;
    const expectedBoundaryBlockerLightLevel =
      getTileEmissiveLightLevel(emissiveTileId) - 1;

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = (CHUNK_SIZE * TILE_SIZE);
    nearCamera.y = tunnelWorldTileY * TILE_SIZE;

    const runDirectionalCase = async (options: {
      emissiveWorldTileX: number;
      boundaryBlockerWorldTileX: number;
      shadowedProbeWorldTileX: number;
      farCameraX: number;
      expectedInvalidatedChunkX: number;
      cleanChunkX: number;
    }): Promise<void> => {
      const renderer = await createInitializedRenderer();
      const rendererWorld = (
        renderer as unknown as {
          world: {
            getLightLevel: (worldTileX: number, worldTileY: number) => number;
          };
        }
      ).world;

      for (
        let worldTileX = tunnelStartWorldTileX;
        worldTileX <= tunnelEndWorldTileX;
        worldTileX += 1
      ) {
        renderer.setTile(worldTileX, tunnelWorldTileY - 1, 1);
        renderer.setTile(worldTileX, tunnelWorldTileY, 0);
        renderer.setTile(worldTileX, tunnelWorldTileY + 1, 1);
      }
      renderer.setTile(options.emissiveWorldTileX, tunnelWorldTileY, emissiveTileId);
      renderer.setTile(options.boundaryBlockerWorldTileX, tunnelWorldTileY, 1);

      renderUntilMeshBuildQueueDrains(renderer, nearCamera);
      expect(rendererWorld.getLightLevel(options.boundaryBlockerWorldTileX, tunnelWorldTileY)).toBe(
        expectedBoundaryBlockerLightLevel
      );
      expect(rendererWorld.getLightLevel(options.boundaryBlockerWorldTileX, tunnelWorldTileY)).not.toBe(
        MAX_LIGHT_LEVEL
      );
      expect(rendererWorld.getLightLevel(options.shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(0);

      const farCamera = new Camera2D();
      farCamera.zoom = nearCamera.zoom;
      farCamera.x = options.farCameraX;
      farCamera.y = nearCamera.y;
      renderer.render(farCamera, { timeMs: 0 });

      expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
      expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

      const invalidateChunkMeshSpy = vi.spyOn(
        renderer as unknown as {
          invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
        },
        'invalidateChunkMesh'
      );
      invalidateChunkMeshSpy.mockClear();

      renderer.render(nearCamera, { timeMs: 0 });

      const invalidatedChunkKeys = invalidateChunkMeshSpy.mock.calls.map(
        ([chunkX, chunkY]) => `${chunkX},${chunkY}`
      );
      expect(invalidatedChunkKeys).toContain(`${options.expectedInvalidatedChunkX},-1`);
      expect(invalidatedChunkKeys).not.toContain(`${options.cleanChunkX},-1`);
      expect(rendererWorld.getLightLevel(options.boundaryBlockerWorldTileX, tunnelWorldTileY)).toBe(
        expectedBoundaryBlockerLightLevel
      );
      expect(rendererWorld.getLightLevel(options.boundaryBlockerWorldTileX, tunnelWorldTileY)).not.toBe(
        MAX_LIGHT_LEVEL
      );
      expect(rendererWorld.getLightLevel(options.shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(0);
    };

    await runDirectionalCase({
      emissiveWorldTileX: CHUNK_SIZE - 1,
      boundaryBlockerWorldTileX: CHUNK_SIZE,
      shadowedProbeWorldTileX: CHUNK_SIZE + 1,
      farCameraX: ((-4 * CHUNK_SIZE + CHUNK_SIZE / 2) * TILE_SIZE),
      expectedInvalidatedChunkX: 1,
      cleanChunkX: 0
    });

    await runDirectionalCase({
      emissiveWorldTileX: CHUNK_SIZE,
      boundaryBlockerWorldTileX: CHUNK_SIZE - 1,
      shadowedProbeWorldTileX: CHUNK_SIZE - 2,
      farCameraX: ((5 * CHUNK_SIZE + CHUNK_SIZE / 2) * TILE_SIZE),
      expectedInvalidatedChunkX: 0,
      cleanChunkX: 1
    });
  });

  it('keeps streamed-back dirty neighboring x-boundary air at emissive falloff on the first resumed draw when the adjacent emissive source chunk stays clean', async () => {
    const createInitializedRenderer = async (): Promise<Renderer> => {
      const gl = createMockGl();
      const renderer = new Renderer(createMockCanvas(gl));
      const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
      loadAtlasImageSource.mockResolvedValue({
        imageSource: authoredBitmap,
        sourceKind: 'authored',
        sourceUrl: '/atlas/tile-atlas.png',
        width: AUTHORED_ATLAS_WIDTH,
        height: AUTHORED_ATLAS_HEIGHT
      });
      await renderer.initialize();
      return renderer;
    };

    const tunnelWorldTileY = -20;
    const tunnelStartWorldTileX = CHUNK_SIZE - 2;
    const tunnelEndWorldTileX = CHUNK_SIZE + 2;
    const emissiveTileId = 6;
    const emissiveLightLevel = getTileEmissiveLightLevel(emissiveTileId);
    const expectedBoundaryAirLightLevel = emissiveLightLevel - 1;
    const expectedInteriorAirLightLevel = emissiveLightLevel - 2;

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = CHUNK_SIZE * TILE_SIZE;
    nearCamera.y = tunnelWorldTileY * TILE_SIZE;

    const runDirectionalCase = async (options: {
      emissiveWorldTileX: number;
      boundaryAirWorldTileX: number;
      interiorAirWorldTileX: number;
      farCameraX: number;
      expectedInvalidatedChunkX: number;
      cleanChunkX: number;
    }): Promise<void> => {
      const renderer = await createInitializedRenderer();
      const rendererWorld = (
        renderer as unknown as {
          world: {
            getLightLevel: (worldTileX: number, worldTileY: number) => number;
          };
        }
      ).world;

      for (
        let worldTileX = tunnelStartWorldTileX;
        worldTileX <= tunnelEndWorldTileX;
        worldTileX += 1
      ) {
        renderer.setTile(worldTileX, tunnelWorldTileY - 1, 1);
        renderer.setTile(worldTileX, tunnelWorldTileY, 0);
        renderer.setTile(worldTileX, tunnelWorldTileY + 1, 1);
      }
      renderer.setTile(options.emissiveWorldTileX, tunnelWorldTileY, emissiveTileId);

      renderUntilMeshBuildQueueDrains(renderer, nearCamera);
      expect(rendererWorld.getLightLevel(options.boundaryAirWorldTileX, tunnelWorldTileY)).toBe(
        expectedBoundaryAirLightLevel
      );
      expect(rendererWorld.getLightLevel(options.boundaryAirWorldTileX, tunnelWorldTileY)).not.toBe(
        MAX_LIGHT_LEVEL
      );
      expect(rendererWorld.getLightLevel(options.interiorAirWorldTileX, tunnelWorldTileY)).toBe(
        expectedInteriorAirLightLevel
      );

      const farCamera = new Camera2D();
      farCamera.zoom = nearCamera.zoom;
      farCamera.x = options.farCameraX;
      farCamera.y = nearCamera.y;
      renderer.render(farCamera, { timeMs: 0 });

      expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
      expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

      const invalidateChunkMeshSpy = vi.spyOn(
        renderer as unknown as {
          invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
        },
        'invalidateChunkMesh'
      );
      invalidateChunkMeshSpy.mockClear();

      renderer.render(nearCamera, { timeMs: 0 });

      const invalidatedChunkKeys = invalidateChunkMeshSpy.mock.calls.map(
        ([chunkX, chunkY]) => `${chunkX},${chunkY}`
      );
      expect(invalidatedChunkKeys).toContain(`${options.expectedInvalidatedChunkX},-1`);
      expect(invalidatedChunkKeys).not.toContain(`${options.cleanChunkX},-1`);
      expect(rendererWorld.getLightLevel(options.boundaryAirWorldTileX, tunnelWorldTileY)).toBe(
        expectedBoundaryAirLightLevel
      );
      expect(rendererWorld.getLightLevel(options.boundaryAirWorldTileX, tunnelWorldTileY)).not.toBe(
        MAX_LIGHT_LEVEL
      );
      expect(rendererWorld.getLightLevel(options.interiorAirWorldTileX, tunnelWorldTileY)).toBe(
        expectedInteriorAirLightLevel
      );
    };

    await runDirectionalCase({
      emissiveWorldTileX: CHUNK_SIZE - 1,
      boundaryAirWorldTileX: CHUNK_SIZE,
      interiorAirWorldTileX: CHUNK_SIZE + 1,
      farCameraX: ((-4 * CHUNK_SIZE + CHUNK_SIZE / 2) * TILE_SIZE),
      expectedInvalidatedChunkX: 1,
      cleanChunkX: 0
    });

    await runDirectionalCase({
      emissiveWorldTileX: CHUNK_SIZE,
      boundaryAirWorldTileX: CHUNK_SIZE - 1,
      interiorAirWorldTileX: CHUNK_SIZE - 2,
      farCameraX: ((5 * CHUNK_SIZE + CHUNK_SIZE / 2) * TILE_SIZE),
      expectedInvalidatedChunkX: 0,
      cleanChunkX: 1
    });
  });

  it('keeps streamed-back emissive boundary-air nearby-light telemetry on the first resumed draw when the source chunk stays clean', async () => {
    const createInitializedRenderer = async (): Promise<Renderer> => {
      const gl = createMockGl();
      const renderer = new Renderer(createMockCanvas(gl));
      const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
      loadAtlasImageSource.mockResolvedValue({
        imageSource: authoredBitmap,
        sourceKind: 'authored',
        sourceUrl: '/atlas/tile-atlas.png',
        width: AUTHORED_ATLAS_WIDTH,
        height: AUTHORED_ATLAS_HEIGHT
      });
      await renderer.initialize();
      return renderer;
    };

    const tunnelWorldTileY = -20;
    const tunnelStartWorldTileX = CHUNK_SIZE - 4;
    const tunnelEndWorldTileX = CHUNK_SIZE + 3;
    const roofWorldTileY = tunnelWorldTileY - 2;
    const upperTunnelWorldTileY = tunnelWorldTileY - 1;
    const lowerTunnelWorldTileY = tunnelWorldTileY + 1;
    const floorWorldTileY = tunnelWorldTileY + 2;
    const emissiveTileId = 6;
    const expectedBoundaryAirLightLevel = getTileEmissiveLightLevel(emissiveTileId) - 1;

    const nearCamera = new Camera2D();
    nearCamera.zoom = 16;
    nearCamera.x = CHUNK_SIZE * TILE_SIZE;
    nearCamera.y = tunnelWorldTileY * TILE_SIZE;

    const runDirectionalCase = async (options: {
      emissiveWorldTileX: number;
      boundaryAirWorldTileX: number;
      playerWorldX: number;
      farCameraX: number;
      expectedInvalidatedChunkX: number;
      cleanChunkX: number;
      expectedSourceLocalTileX: number;
    }): Promise<void> => {
      const renderer = await createInitializedRenderer();
      const rendererWorld = (
        renderer as unknown as {
          world: {
            getLightLevel: (worldTileX: number, worldTileY: number) => number;
          };
        }
      ).world;

      for (
        let worldTileX = tunnelStartWorldTileX;
        worldTileX <= tunnelEndWorldTileX;
        worldTileX += 1
      ) {
        renderer.setTile(worldTileX, roofWorldTileY, 1);
        renderer.setTile(worldTileX, upperTunnelWorldTileY, 0);
        renderer.setTile(worldTileX, tunnelWorldTileY, 0);
        renderer.setTile(worldTileX, lowerTunnelWorldTileY, 0);
        renderer.setTile(worldTileX, floorWorldTileY, 1);
      }
      renderer.setTile(options.emissiveWorldTileX, tunnelWorldTileY, emissiveTileId);

      renderUntilMeshBuildQueueDrains(renderer, nearCamera);
      expect(rendererWorld.getLightLevel(options.boundaryAirWorldTileX, tunnelWorldTileY)).toBe(
        expectedBoundaryAirLightLevel
      );
      expect(rendererWorld.getLightLevel(options.boundaryAirWorldTileX, tunnelWorldTileY)).not.toBe(
        MAX_LIGHT_LEVEL
      );

      const farCamera = new Camera2D();
      farCamera.zoom = nearCamera.zoom;
      farCamera.x = options.farCameraX;
      farCamera.y = nearCamera.y;
      renderer.render(farCamera, { timeMs: 0 });

      expect(renderer.telemetry.evictedMeshEntries).toBeGreaterThan(0);
      expect(renderer.telemetry.evictedWorldChunks).toBeGreaterThan(0);

      const invalidateChunkMeshSpy = vi.spyOn(
        renderer as unknown as {
          invalidateChunkMesh: (chunkX: number, chunkY: number) => void;
        },
        'invalidateChunkMesh'
      );
      invalidateChunkMeshSpy.mockClear();

      renderer.render(nearCamera, {
        entities: [
          createStandalonePlayerEntityFrameState(
            createPlayerState({
              position: { x: options.playerWorldX, y: floorWorldTileY * TILE_SIZE },
              grounded: true,
              velocity: { x: 0, y: 0 },
              facing: 'right'
            })
          )
        ],
        timeMs: 0
      });

      const invalidatedChunkKeys = invalidateChunkMeshSpy.mock.calls.map(
        ([chunkX, chunkY]) => `${chunkX},${chunkY}`
      );
      expect(invalidatedChunkKeys).toContain(`${options.expectedInvalidatedChunkX},-1`);
      expect(invalidatedChunkKeys).not.toContain(`${options.cleanChunkX},-1`);
      expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBe(expectedBoundaryAirLightLevel);
      expect(renderer.telemetry.standalonePlayerNearbyLightFactor).toBeCloseTo(
        expectedBoundaryAirLightLevel / MAX_LIGHT_LEVEL,
        5
      );
      expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBe(
        options.boundaryAirWorldTileX
      );
      expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBe(tunnelWorldTileY);
      expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkX).toBe(
        options.expectedInvalidatedChunkX
      );
      expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkY).toBe(-1);
      expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX).toBe(
        options.expectedSourceLocalTileX
      );
      expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY).toBe(
        CHUNK_SIZE + tunnelWorldTileY
      );
    };

    await runDirectionalCase({
      emissiveWorldTileX: CHUNK_SIZE - 1,
      boundaryAirWorldTileX: CHUNK_SIZE,
      playerWorldX: (CHUNK_SIZE + 1) * TILE_SIZE + TILE_SIZE * 0.5,
      farCameraX: ((-4 * CHUNK_SIZE + CHUNK_SIZE / 2) * TILE_SIZE),
      expectedInvalidatedChunkX: 1,
      cleanChunkX: 0,
      expectedSourceLocalTileX: 0
    });

    await runDirectionalCase({
      emissiveWorldTileX: CHUNK_SIZE,
      boundaryAirWorldTileX: CHUNK_SIZE - 1,
      playerWorldX: (CHUNK_SIZE - 2) * TILE_SIZE + TILE_SIZE * 0.5,
      farCameraX: ((5 * CHUNK_SIZE + CHUNK_SIZE / 2) * TILE_SIZE),
      expectedInvalidatedChunkX: 0,
      cleanChunkX: 1,
      expectedSourceLocalTileX: CHUNK_SIZE - 1
    });
  });

  it('invalidates both row-below chunk meshes when a streamed-back bottom-corner boundary blocker recloses', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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

  it('invalidates both row-below chunk meshes when a streamed-back bottom-corner boundary blocker recloses from the opposite chunk side', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      entities: [createStandalonePlayerEntityFrameState(playerState)],
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

  it('draws multiple entity-pass entries in submission order', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    const firstState = createPlayerState({
      position: { x: 16, y: 32 },
      size: { width: 12, height: 28 },
      grounded: false,
      velocity: { x: 0, y: 120 },
      facing: 'left'
    });
    const secondState = createPlayerState({
      position: { x: 80, y: 48 },
      size: { width: 12, height: 28 },
      grounded: true,
      velocity: { x: 60, y: 0 },
      facing: 'right'
    });

    renderer.render(new Camera2D(), {
      entities: [
        createStandalonePlayerEntityFrameState(firstState, { id: 11 }),
        createStandalonePlayerEntityFrameState(secondState, { id: 12 })
      ],
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 2);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(2);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      10,
      4,
      0,
      0,
      22,
      4,
      1,
      0,
      22,
      32,
      1,
      1,
      10,
      4,
      0,
      0,
      22,
      32,
      1,
      1,
      10,
      32,
      0,
      1
    ]);
    expect(Array.from((dynamicUploads[1]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      74,
      20,
      0,
      0,
      86,
      20,
      1,
      0,
      86,
      48,
      1,
      1,
      74,
      20,
      0,
      0,
      86,
      48,
      1,
      1,
      74,
      48,
      0,
      1
    ]);
    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [
        { facing: -1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL },
        { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A }
      ]
    );
  });

  it('draws hostile slime placeholders from interpolated entity snapshots', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    const currentState = createHostileSlimeState({
      position: { x: 80, y: 48 },
      facing: 'right'
    });
    const previousState = createHostileSlimeState({
      position: { x: 64, y: 32 },
      facing: 'right'
    });

    renderer.render(new Camera2D(), {
      entities: [
        createHostileSlimeEntityFrameState(currentState, {
          id: 21,
          previousState
        })
      ],
      renderAlpha: 0.25,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      58,
      24,
      0,
      0,
      78,
      24,
      1,
      0,
      78,
      36,
      1,
      1,
      58,
      24,
      0,
      0,
      78,
      36,
      1,
      1,
      58,
      36,
      0,
      1
    ]);
    expectHostileSlimeUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [1]
    );
  });

  it('draws passive bunny placeholders from interpolated entity snapshots', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    const currentState = createPassiveBunnyState({
      position: { x: 80, y: 48 },
      facing: 'left'
    });
    const previousState = createPassiveBunnyState({
      position: { x: 64, y: 32 },
      facing: 'left'
    });

    renderer.render(new Camera2D(), {
      entities: [
        createPassiveBunnyEntityFrameState(currentState, {
          id: 31,
          previousState
        })
      ],
      renderAlpha: 0.25,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      61,
      18,
      0,
      0,
      75,
      18,
      1,
      0,
      75,
      36,
      1,
      1,
      61,
      18,
      0,
      0,
      75,
      36,
      1,
      1,
      61,
      36,
      0,
      1
    ]);
    expectPassiveBunnyUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [-1]
    );
  });

  it('draws dropped-item placeholders from interpolated entity snapshots', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    drawArrays.mockClear();
    bufferData.mockClear();

    const currentState = createDroppedItemState({
      position: { x: 80, y: 48 },
      itemId: 'torch',
      amount: 6
    });
    const previousState = createDroppedItemState({
      position: { x: 64, y: 32 },
      itemId: 'torch',
      amount: 6
    });

    renderer.render(new Camera2D(), {
      entities: [
        createDroppedItemEntityFrameState(currentState, {
          id: 41,
          previousState
        })
      ],
      renderAlpha: 0.25,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      63,
      31,
      0,
      0,
      73,
      31,
      1,
      0,
      73,
      41,
      1,
      1,
      63,
      31,
      0,
      0,
      73,
      41,
      1,
      1,
      63,
      41,
      0,
      1
    ]);
  });

  it('draws firebolt placeholders from interpolated entity snapshots', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    const currentState = createStarterWandFireboltState({
      position: { x: 80, y: 48 },
      velocity: { x: 160, y: -40 },
      radius: 4,
      secondsRemaining: 0.4
    });
    const previousState = createStarterWandFireboltState({
      position: { x: 64, y: 32 },
      velocity: { x: 160, y: -40 },
      radius: 4,
      secondsRemaining: 0.5
    });

    renderer.render(new Camera2D(), {
      entities: [
        createFireboltEntityFrameState(currentState, {
          id: 51,
          previousState
        })
      ],
      renderAlpha: 0.25,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      64,
      32,
      0,
      0,
      72,
      32,
      1,
      0,
      72,
      40,
      1,
      1,
      64,
      32,
      0,
      0,
      72,
      40,
      1,
      1,
      64,
      40,
      0,
      1
    ]);
    expect(uniform1f.mock.calls).toHaveLength(2);
    expect(uniform1f.mock.calls[0]?.[1]).toBeGreaterThanOrEqual(0.65);
    expect(uniform1f.mock.calls[0]?.[1]).toBeLessThanOrEqual(1);
    expect(uniform1f.mock.calls[1]?.[1]).toBe(1);
  });

  it('draws thrown-bomb placeholders from interpolated entity snapshots', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    const uniform3f = vi.mocked(gl.uniform3f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();
    uniform3f.mockClear();

    const currentState = createThrownBombState({
      position: { x: 80, y: 60 },
      velocity: { x: 120, y: -30 },
      radius: 6,
      secondsRemaining: 1.1
    });
    const previousState = createThrownBombState({
      position: { x: 68, y: 44 },
      velocity: { x: 120, y: -30 },
      radius: 6,
      secondsRemaining: 1.2
    });

    renderer.render(new Camera2D(), {
      entities: [
        createThrownBombEntityFrameState(currentState, {
          id: 57,
          previousState
        })
      ],
      renderAlpha: 0.25,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      65,
      42,
      0,
      0,
      77,
      42,
      1,
      0,
      77,
      54,
      1,
      1,
      65,
      42,
      0,
      0,
      77,
      54,
      1,
      1,
      65,
      54,
      0,
      1
    ]);
    const palette = getDroppedItemPlaceholderPalette('bomb');
    expect(uniform1f.mock.calls).toHaveLength(2);
    expect(uniform1f.mock.calls[0]?.[1]).toBeGreaterThanOrEqual(0.45);
    expect(uniform1f.mock.calls[0]?.[1]).toBeLessThanOrEqual(1);
    expect(uniform1f.mock.calls[1]?.[1]).toBe(1);
    expect(uniform3f.mock.calls).toEqual([
      [expect.anything(), palette.baseColor[0], palette.baseColor[1], palette.baseColor[2]],
      [expect.anything(), palette.accentColor[0], palette.accentColor[1], palette.accentColor[2]]
    ]);
  });

  it('draws grappling-hook placeholders from interpolated entity snapshots', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    const uniform3f = vi.mocked(gl.uniform3f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();
    uniform3f.mockClear();

    const currentState = createDroppedItemState({
      position: { x: 28, y: 14 },
      itemId: 'grappling-hook',
      amount: 1
    });
    const previousState = createDroppedItemState({
      position: { x: 20, y: 14 },
      itemId: 'grappling-hook',
      amount: 1
    });

    renderer.render(new Camera2D(), {
      entities: [
        createGrapplingHookEntityFrameState(currentState, {
          id: 61,
          previousState
        })
      ],
      renderAlpha: 0.5,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      19,
      9,
      0,
      0,
      29,
      9,
      1,
      0,
      29,
      19,
      1,
      1,
      19,
      9,
      0,
      0,
      29,
      19,
      1,
      1,
      19,
      19,
      0,
      1
    ]);
    const palette = getDroppedItemPlaceholderPalette('grappling-hook');
    expect(uniform1f.mock.calls).toHaveLength(2);
    expect(uniform1f.mock.calls[0]?.[1]).toBeGreaterThanOrEqual(0);
    expect(uniform1f.mock.calls[0]?.[1]).toBeLessThanOrEqual(1);
    expect(uniform1f.mock.calls[1]?.[1]).toBe(1);
    expect(uniform3f.mock.calls).toEqual([
      [expect.anything(), palette.baseColor[0], palette.baseColor[1], palette.baseColor[2]],
      [expect.anything(), palette.accentColor[0], palette.accentColor[1], palette.accentColor[2]]
    ]);
  });

  it('draws a live grappling-hook tether from the interpolated facing-side player hold to the hook head', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    drawArrays.mockClear();
    bufferData.mockClear();

    const currentPlayerState = createPlayerState({
      position: { x: 16, y: 28 },
      facing: 'right'
    });
    const previousPlayerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'left'
    });
    const currentHookState = createDroppedItemState({
      position: { x: 28, y: 14 },
      itemId: 'grappling-hook',
      amount: 1
    });
    const previousHookState = createDroppedItemState({
      position: { x: 20, y: 14 },
      itemId: 'grappling-hook',
      amount: 1
    });

    renderer.render(new Camera2D(), {
      entities: [
        createStandalonePlayerEntityFrameState(currentPlayerState, {
          id: 7,
          previousState: previousPlayerState
        }),
        createGrapplingHookEntityFrameState(currentHookState, {
          id: 61,
          previousState: previousHookState
        })
      ],
      renderAlpha: 0.5,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 3);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(3);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      15,
      13,
      0,
      0,
      15,
      15,
      0,
      1,
      24,
      15,
      1,
      1,
      15,
      13,
      0,
      0,
      24,
      15,
      1,
      1,
      24,
      13,
      1,
      0
    ]);
    expect(Array.from((dynamicUploads[1]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      6,
      0,
      0,
      0,
      18,
      0,
      1,
      0,
      18,
      28,
      1,
      1,
      6,
      0,
      0,
      0,
      18,
      28,
      1,
      1,
      6,
      28,
      0,
      1
    ]);
    expect(Array.from((dynamicUploads[2]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      19,
      9,
      0,
      0,
      29,
      9,
      1,
      0,
      29,
      19,
      1,
      1,
      19,
      9,
      0,
      0,
      29,
      19,
      1,
      1,
      19,
      19,
      0,
      1
    ]);
  });

  it('switches thrown-bomb placeholders into the fuse-warning blink palette near detonation', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const uniform1f = vi.mocked(gl.uniform1f);
    const uniform3f = vi.mocked(gl.uniform3f);
    uniform1f.mockClear();
    uniform3f.mockClear();

    const currentState = createThrownBombState({
      position: { x: 80, y: 60 },
      velocity: { x: 120, y: -30 },
      radius: 6,
      secondsRemaining: 0.74
    });
    const warningVisuals = resolveThrownBombFuseWarningVisuals(
      currentState,
      getDroppedItemPlaceholderPalette('bomb')
    );

    renderer.render(new Camera2D(), {
      entities: [createThrownBombEntityFrameState(currentState, { id: 57 })],
      renderAlpha: 1,
      timeMs: 0
    });

    expect(warningVisuals.blinkActive).toBe(true);
    expect(uniform1f.mock.calls).toHaveLength(2);
    expect(uniform1f.mock.calls[0]?.[1]).toBeCloseTo(warningVisuals.minimumLightFactor, 6);
    expect(uniform1f.mock.calls[1]?.[1]).toBe(1);
    expect(uniform3f.mock.calls).toEqual([
      [
        expect.anything(),
        warningVisuals.baseColor[0],
        warningVisuals.baseColor[1],
        warningVisuals.baseColor[2]
      ],
      [
        expect.anything(),
        warningVisuals.accentColor[0],
        warningVisuals.accentColor[1],
        warningVisuals.accentColor[2]
      ]
    ]);
  });

  it('draws bomb detonation flash placeholders from interpolated entity snapshots', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    const uniform3f = vi.mocked(gl.uniform3f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();
    uniform3f.mockClear();

    const currentState = createBombDetonationFlashState({
      position: { x: 80, y: 60 },
      radius: 32,
      durationSeconds: 0.18,
      secondsRemaining: 0.045
    });
      const previousState = createBombDetonationFlashState({
        position: { x: 64, y: 44 },
        radius: 32,
        durationSeconds: 0.18,
        secondsRemaining: 0.09
      });
      const expectedVisuals = resolveBombDetonationFlashPlaceholderVisuals(currentState);
      const expectedRenderPosition = { x: 68, y: 48 };

    renderer.render(new Camera2D(), {
      entities: [
        createBombDetonationFlashEntityFrameState(currentState, {
          id: 58,
          previousState
        })
      ],
      renderAlpha: 0.25,
      timeMs: 0
    });

      expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
      expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

      const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
      expect(dynamicUploads).toHaveLength(1);
      expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual(
        Array.from(
          buildBombDetonationFlashPlaceholderVertices(currentState, expectedRenderPosition)
        )
      );
    expect(uniform1f.mock.calls).toHaveLength(2);
    expect(uniform1f.mock.calls[0]?.[1]).toBeGreaterThanOrEqual(expectedVisuals.minimumLightFactor);
    expect(uniform1f.mock.calls[0]?.[1]).toBeLessThanOrEqual(1);
    expect(uniform1f.mock.calls[1]?.[1]).toBeCloseTo(expectedVisuals.alpha, 6);
    expect(uniform3f.mock.calls).toEqual([
      [
        expect.anything(),
        expectedVisuals.baseColor[0],
        expectedVisuals.baseColor[1],
        expectedVisuals.baseColor[2]
      ],
      [
        expect.anything(),
        expectedVisuals.accentColor[0],
        expectedVisuals.accentColor[1],
        expectedVisuals.accentColor[2]
      ]
    ]);
  });

  it('draws bow-arrow projectile placeholders from interpolated entity snapshots', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    const currentState = createArrowProjectileState({
      position: { x: 80, y: 60 },
      velocity: { x: 180, y: -90 },
      radius: 3,
      secondsRemaining: 0.4
    });
    const previousState = createArrowProjectileState({
      position: { x: 68, y: 44 },
      velocity: { x: 180, y: -90 },
      radius: 3,
      secondsRemaining: 0.5
    });

    renderer.render(new Camera2D(), {
      entities: [
        createArrowProjectileEntityFrameState(currentState, {
          id: 61,
          previousState
        })
      ],
      renderAlpha: 0.25,
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      68,
      45,
      0,
      0,
      74,
      45,
      1,
      0,
      74,
      51,
      1,
      1,
      68,
      45,
      0,
      0,
      74,
      51,
      1,
      1,
      68,
      51,
      0,
      1
    ]);
    expect(uniform1f.mock.calls).toHaveLength(2);
    expect(uniform1f.mock.calls[0]?.[1]).toBeGreaterThanOrEqual(0.55);
    expect(uniform1f.mock.calls[0]?.[1]).toBeLessThanOrEqual(1);
    expect(uniform1f.mock.calls[1]?.[1]).toBe(1);
  });

  it('preserves supported-entry submission order when slime and standalone-player entries are interleaved', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    drawArrays.mockClear();
    bufferData.mockClear();

    const slimeState = createHostileSlimeState({
      position: { x: -24, y: 16 },
      facing: 'left'
    });
    const playerState = createPlayerState({
      position: { x: 24, y: 36 },
      size: { width: 12, height: 28 },
      grounded: true,
      velocity: { x: -60, y: 0 },
      facing: 'left'
    });

    renderer.render(new Camera2D(), {
      entities: [
        createHostileSlimeEntityFrameState(slimeState, { id: 31 }),
        createStandalonePlayerEntityFrameState(playerState, { id: 32 })
      ],
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 2);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(2);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      -34,
      4,
      0,
      0,
      -14,
      4,
      1,
      0,
      -14,
      16,
      1,
      1,
      -34,
      4,
      0,
      0,
      -14,
      16,
      1,
      1,
      -34,
      16,
      0,
      1
    ]);
    expect(Array.from((dynamicUploads[1]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      18,
      8,
      0,
      0,
      30,
      8,
      1,
      0,
      30,
      36,
      1,
      1,
      18,
      8,
      0,
      0,
      30,
      36,
      1,
      1,
      18,
      36,
      0,
      1
    ]);
  });

  it('ignores unknown future entity-pass kinds without preventing later supported entries from drawing', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    const supportedState = createPlayerState({
      position: { x: 24, y: 36 },
      size: { width: 12, height: 28 },
      grounded: true,
      velocity: { x: -60, y: 0 },
      facing: 'left'
    });
    const unsupportedEntity = {
      id: 99,
      kind: 'future-slime'
    } as unknown as RendererEntityFrameState;

    renderer.render(new Camera2D(), {
      entities: [unsupportedEntity, createStandalonePlayerEntityFrameState(supportedState, { id: 100 })],
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 1);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(1);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      18,
      8,
      0,
      0,
      30,
      8,
      1,
      0,
      30,
      36,
      1,
      1,
      18,
      8,
      0,
      0,
      30,
      36,
      1,
      1,
      18,
      36,
      0,
      1
    ]);
    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [{ facing: -1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A }]
    );
  });

  it('preserves supported-entry submission order when unsupported kinds are interleaved in the entity pass', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    const firstSupportedState = createPlayerState({
      position: { x: 20, y: 40 },
      size: { width: 12, height: 28 },
      grounded: false,
      velocity: { x: 0, y: 120 },
      facing: 'left'
    });
    const secondSupportedState = createPlayerState({
      position: { x: 92, y: 52 },
      size: { width: 12, height: 28 },
      grounded: true,
      velocity: { x: 60, y: 0 },
      facing: 'right'
    });
    const unsupportedBefore = {
      id: 201,
      kind: 'future-slime'
    } as unknown as RendererEntityFrameState;
    const unsupportedBetween = {
      id: 202,
      kind: 'future-pickup'
    } as unknown as RendererEntityFrameState;

    renderer.render(new Camera2D(), {
      entities: [
        unsupportedBefore,
        createStandalonePlayerEntityFrameState(firstSupportedState, { id: 203 }),
        unsupportedBetween,
        createStandalonePlayerEntityFrameState(secondSupportedState, { id: 204 })
      ],
      timeMs: 0
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks + 2);

    const dynamicUploads = bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW);
    expect(dynamicUploads).toHaveLength(2);
    expect(Array.from((dynamicUploads[0]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      14,
      12,
      0,
      0,
      26,
      12,
      1,
      0,
      26,
      40,
      1,
      1,
      14,
      12,
      0,
      0,
      26,
      40,
      1,
      1,
      14,
      40,
      0,
      1
    ]);
    expect(Array.from((dynamicUploads[1]?.[1] as Float32Array | undefined) ?? [])).toEqual([
      86,
      24,
      0,
      0,
      98,
      24,
      1,
      0,
      98,
      52,
      1,
      1,
      86,
      24,
      0,
      0,
      98,
      52,
      1,
      1,
      86,
      52,
      0,
      1
    ]);
    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [
        { facing: -1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL },
        { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A }
      ]
    );
  });

  it('leaves placeholder draw calls and nearby-light telemetry untouched when only unsupported entity-pass kinds are submitted', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const world = (renderer as unknown as { world: { getLightLevel: (tileX: number, tileY: number) => number } })
      .world;
    const getLightLevelSpy = vi.spyOn(world, 'getLightLevel').mockReturnValue(12);
    const drawArrays = vi.mocked(gl.drawArrays);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    const camera = new Camera2D();

    renderer.render(camera, {
      entities: [
        createStandalonePlayerEntityFrameState(
          createPlayerState({
            grounded: true,
            velocity: { x: 0, y: 0 },
            facing: 'right'
          })
        )
      ],
      timeMs: 0
    });
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBe(12);

    getLightLevelSpy.mockClear();
    drawArrays.mockClear();
    bufferData.mockClear();
    uniform1f.mockClear();

    renderer.render(camera, {
      entities: [
        {
          id: 301,
          kind: 'future-slime'
        } as unknown as RendererEntityFrameState,
        {
          id: 302,
          kind: 'future-pickup'
        } as unknown as RendererEntityFrameState
      ],
      timeMs: 16
    });

    expect(drawArrays).toHaveBeenCalledTimes(renderer.telemetry.drawCalls);
    expect(renderer.telemetry.drawCalls).toBe(renderer.telemetry.renderedChunks);
    expect(bufferData.mock.calls.filter((call) => call[2] === gl.DYNAMIC_DRAW)).toHaveLength(0);
    expect(uniform1f).not.toHaveBeenCalled();
    expect(getLightLevelSpy).not.toHaveBeenCalled();
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightFactor).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkY).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX).toBeNull();
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY).toBeNull();
  });

  it('keeps standalone-player nearby-light telemetry sourced from the last supported draw when unsupported kinds are interleaved', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const world = (renderer as unknown as { world: { getLightLevel: (tileX: number, tileY: number) => number } })
      .world;
    const getLightLevelSpy = vi.spyOn(world, 'getLightLevel').mockImplementation((tileX, tileY) => {
      if (tileX === -2 && tileY === -3) {
        return 7;
      }
      if (tileX === 1 && tileY === 0) {
        return 11;
      }
      return 0;
    });
    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    renderer.render(new Camera2D(), {
      entities: [
        createStandalonePlayerEntityFrameState(
          createPlayerState({
            grounded: true,
            velocity: { x: 0, y: 0 },
            facing: 'right'
          }),
          { id: 401 }
        ),
        {
          id: 402,
          kind: 'future-slime'
        } as unknown as RendererEntityFrameState,
        createStandalonePlayerEntityFrameState(
          createPlayerState({
            position: { x: 8, y: 24 },
            size: { width: 12, height: 28 },
            grounded: true,
            velocity: { x: 0, y: 0 },
            facing: 'right'
          }),
          { id: 403 }
        )
      ],
      timeMs: 0
    });

    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [
        { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE },
        { facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE }
      ]
    );
    expect(getLightLevelSpy).toHaveBeenCalled();
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBe(11);
    expect(renderer.telemetry.standalonePlayerNearbyLightFactor).toBeCloseTo(11 / 15, 5);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBe(1);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBe(0);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkX).toBe(0);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceChunkY).toBe(0);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX).toBe(1);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY).toBe(0);
  });

  it('uses the entity render snapshot for placeholder pose selection and interpolated nearby-light sampling', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const world = (renderer as unknown as { world: { getLightLevel: (tileX: number, tileY: number) => number } })
      .world;
    const getLightLevelSpy = vi.spyOn(world, 'getLightLevel').mockReturnValue(9);
    const bufferData = vi.mocked(gl.bufferData);
    const uniform1f = vi.mocked(gl.uniform1f);
    bufferData.mockClear();
    uniform1f.mockClear();

    const currentState = createPlayerState({
      position: { x: 8, y: 24 },
      size: { width: 12, height: 28 },
      grounded: true,
      velocity: { x: 0, y: 0 },
      facing: 'right'
    });

    renderer.render(new Camera2D(), {
      entities: [
        createStandalonePlayerEntityFrameState(currentState, {
          previousState: createPlayerState({
            position: { x: 72, y: 88 },
            size: currentState.size,
            grounded: false,
            velocity: { x: -140, y: 180 },
            facing: 'left',
            health: currentState.health,
            lavaDamageTickSecondsRemaining: currentState.lavaDamageTickSecondsRemaining
          })
        })
      ],
      renderAlpha: 0.5,
      timeMs: 0
    });

    const lastBufferDataCall = bufferData.mock.calls.at(-1);
    expect(Array.from((lastBufferDataCall?.[1] as Float32Array | undefined) ?? [])).toEqual([
      34,
      28,
      0,
      0,
      46,
      28,
      1,
      0,
      46,
      56,
      1,
      1,
      34,
      28,
      0,
      0,
      46,
      56,
      1,
      1,
      34,
      56,
      0,
      1
    ]);
    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [{ facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE }]
    );
    expect(getLightLevelSpy).toHaveBeenCalled();
    expect(renderer.telemetry.standalonePlayerNearbyLightLevel).toBe(9);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileX).toBe(1);
    expect(renderer.telemetry.standalonePlayerNearbyLightSourceTileY).toBe(0);
  });

  it('uses the current snapshot presentation state instead of previous snapshot bonk state for pose selection', async () => {
    const gl = createMockGl();
    const renderer = new Renderer(createMockCanvas(gl));
    const authoredBitmap = { kind: 'bitmap' } as unknown as TexImageSource;
    loadAtlasImageSource.mockResolvedValue({
      imageSource: authoredBitmap,
      sourceKind: 'authored',
      sourceUrl: '/atlas/tile-atlas.png',
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    const currentState = createPlayerState({
      grounded: false,
      velocity: { x: 0, y: 120 },
      facing: 'right'
    });

    renderer.render(new Camera2D(), {
      entities: [
        createStandalonePlayerEntityFrameState(currentState, {
          previousState: createPlayerState({
            grounded: false,
            velocity: { x: 0, y: 120 },
            facing: 'right',
            health: currentState.health,
            lavaDamageTickSecondsRemaining: currentState.lavaDamageTickSecondsRemaining
          }),
          previousCeilingBonkHoldUntilTimeMs:
            STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS
        })
      ],
      renderAlpha: 0.5,
      timeMs: STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS - 1
    });

    expectStandalonePlayerUniformValues(
      uniform1f.mock.calls as Array<[WebGLUniformLocation | null, number]>,
      [{ facing: 1, pose: STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL }]
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const world = (renderer as unknown as { world: { getLightLevel: (tileX: number, tileY: number) => number } })
      .world;
    const getLightLevelSpy = vi.spyOn(world, 'getLightLevel').mockReturnValue(9);
    const uniform1f = vi.mocked(gl.uniform1f);
    uniform1f.mockClear();

    renderer.render(new Camera2D(), {
      entities: [
        createStandalonePlayerEntityFrameState(
          createPlayerState({
            grounded: true,
            velocity: { x: 0, y: 0 },
            facing: 'right'
          })
        )
      ],
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    const world = (renderer as unknown as { world: { getLightLevel: (tileX: number, tileY: number) => number } })
      .world;
    vi.spyOn(world, 'getLightLevel').mockReturnValue(12);

    const camera = new Camera2D();
    renderer.render(camera, {
      entities: [
        createStandalonePlayerEntityFrameState(
          createPlayerState({
            grounded: true,
            velocity: { x: 0, y: 0 },
            facing: 'right'
          })
        )
      ],
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      entities: [createStandalonePlayerEntityFrameState(playerState)],
      timeMs: 0
    });
    renderer.render(camera, {
      entities: [createStandalonePlayerEntityFrameState(playerState)],
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      entities: [createStandalonePlayerEntityFrameState(jumpRiseState)],
      timeMs: 0
    });
    renderer.render(camera, {
      entities: [createStandalonePlayerEntityFrameState(fallState)],
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      entities: [
        createStandalonePlayerEntityFrameState(wallSlideState, {
          wallContact: { tileX: 1, tileY: -1, tileId: 3, side: 'right' }
        })
      ],
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      entities: [
        createStandalonePlayerEntityFrameState(ceilingBonkState, {
          wallContact: { tileX: 1, tileY: -1, tileId: 3, side: 'right' },
          ceilingContact: { tileX: 0, tileY: -2, tileId: 4 }
        })
      ],
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      entities: [
        createStandalonePlayerEntityFrameState(fallingState, {
          ceilingBonkHoldUntilTimeMs:
            STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS
        })
      ],
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
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
      entities: [
        createStandalonePlayerEntityFrameState(fallingState, {
          ceilingBonkHoldUntilTimeMs:
            STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS
        })
      ],
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    renderer.loadWorldSnapshot(BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT);
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
    const frameOneUv = sampleUvRect(atlasIndexToUvRect(15));
    expectChunkVerticesToContainSampledUvRect(frameOneVertices, frameOneUv);
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
    const frameZeroUv = sampleUvRect(atlasIndexToUvRect(14));
    expectChunkVerticesToContainSampledUvRect(frameZeroVertices, frameZeroUv);
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    renderer.loadWorldSnapshot(BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT);
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
    const frameOneUv = sampleUvRect(resolveAnimatedTileRenderFrameUvRect(6, 1)!);
    expect(frameOneUv).not.toBeNull();
    expectChunkVerticesToContainSampledUvRect(frameOneVertices, frameOneUv!);
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
    const frameZeroUv = sampleUvRect(resolveAnimatedTileRenderFrameUvRect(6, 0)!);
    expect(frameZeroUv).not.toBeNull();
    expectChunkVerticesToContainSampledUvRect(frameZeroVertices, frameZeroUv!);
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    renderer.loadWorldSnapshot(BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT);
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
    const frameOneUv = sampleUvRect(
      resolveLiquidRenderVariantUvRectAtElapsedMs(7, liquidCardinalMask, 180)!
    );
    expect(frameOneUv).not.toBeNull();
    expectChunkVerticesToContainSampledUvRect(frameOneVertices, frameOneUv!);
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
    const frameZeroUv = sampleUvRect(
      resolveLiquidRenderVariantUvRectAtElapsedMs(7, liquidCardinalMask, 360)!
    );
    expect(frameZeroUv).not.toBeNull();
    expectChunkVerticesToContainSampledUvRect(frameZeroVertices, frameZeroUv!);
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    renderer.loadWorldSnapshot(BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT);
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    renderer.loadWorldSnapshot(BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT);
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    renderer.loadWorldSnapshot(BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT);
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
    const frameZeroUv = sampleUvRect(atlasIndexToUvRect(14));
    expectChunkVerticesToContainSampledUvRect(rebuiltAnimatedVertices, frameZeroUv);
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
      width: AUTHORED_ATLAS_WIDTH,
      height: AUTHORED_ATLAS_HEIGHT
    });
    await renderer.initialize();

    renderer.loadWorldSnapshot(BLANK_ANIMATED_ISOLATION_WORLD_SNAPSHOT);
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
    const frameOneUv = sampleUvRect(atlasIndexToUvRect(15));
    expectChunkVerticesToContainSampledUvRect(rebuiltAnimatedVertices, frameOneUv);
    expect(renderer.telemetry.meshBuildQueueLength).toBe(0);
    expect(renderer.telemetry.residentAnimatedChunkMeshes).toBe(1);
    expect(renderer.telemetry.residentAnimatedChunkQuadCount).toBe(1);
    performanceNowSpy.mockRestore();
  });
});
