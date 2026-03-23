import { Camera2D } from '../core/camera2d';
import { createStaticVertexBuffer, createVertexArray } from './buffer';
import { createProgram } from './shader';
import { applyAnimatedChunkMeshFrameAtElapsedMs, createAnimatedChunkMeshState } from './animatedChunkMesh';
import {
  buildFireboltPlaceholderVertices,
  getFireboltPlaceholderNearbyLightSample,
  FIREBOLT_PLACEHOLDER_VERTEX_COUNT,
  FIREBOLT_PLACEHOLDER_VERTEX_FLOAT_COUNT
} from './fireboltPlaceholder';
import {
  buildDroppedItemPlaceholderVertices,
  getDroppedItemPlaceholderNearbyLightSample,
  getDroppedItemPlaceholderPalette,
  DROPPED_ITEM_PLACEHOLDER_VERTEX_COUNT,
  DROPPED_ITEM_PLACEHOLDER_VERTEX_FLOAT_COUNT
} from './droppedItemPlaceholder';
import {
  buildHostileSlimePlaceholderVertices,
  getHostileSlimePlaceholderFacingSign,
  getHostileSlimePlaceholderNearbyLightSample,
  HOSTILE_SLIME_PLACEHOLDER_VERTEX_FLOAT_COUNT,
  HOSTILE_SLIME_PLACEHOLDER_VERTEX_COUNT
} from './hostileSlimePlaceholder';
import {
  buildPassiveBunnyPlaceholderVertices,
  getPassiveBunnyPlaceholderFacingSign,
  getPassiveBunnyPlaceholderNearbyLightSample,
  PASSIVE_BUNNY_PLACEHOLDER_VERTEX_COUNT,
  PASSIVE_BUNNY_PLACEHOLDER_VERTEX_FLOAT_COUNT
} from './passiveBunnyPlaceholder';
import {
  buildStandalonePlayerPlaceholderVertices,
  getStandalonePlayerPlaceholderNearbyLightSample,
  getStandalonePlayerPlaceholderRenderFacingSign,
  getStandalonePlayerPlaceholderPoseIndex,
  STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT,
  STANDALONE_PLAYER_PLACEHOLDER_VERTEX_FLOAT_COUNT
} from './standalonePlayerPlaceholder';
import type { AtlasImageLoadResult } from './texture';
import {
  createTextureFromImageSource,
  loadAtlasImageSource,
  resolveAuthoredTileAtlasUrl
} from './texture';
import { collectAtlasValidationWarnings } from './atlasValidation';
import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import {
  affectedChunkCoordsForLocalTileEdit,
  chunkBoundsContains,
  chunkCoordBounds,
  chunkKey,
  expandChunkBounds,
  worldToChunkCoord,
  worldToLocalTile
} from '../world/chunkMath';
import type { ChunkBounds } from '../world/chunkMath';
import { CHUNK_MESH_FLOATS_PER_VERTEX, buildChunkMesh } from '../world/mesher';
import {
  hasLiquidRenderMetadata,
  resolveLiquidRenderCardinalMaskFromNeighborhood,
  TILE_METADATA
} from '../world/tileMetadata';
import { WALL_METADATA } from '../world/wallMetadata';
import {
  findPlayerSpawnPoint as findWorldPlayerSpawnPoint,
  resolvePlayerSpawnLiquidSafetyStatus as resolveWorldPlayerSpawnLiquidSafetyStatus,
  type PlayerSpawnLiquidSafetyStatus,
  type PlayerSpawnPoint,
  type PlayerSpawnSearchOptions
} from '../world/playerSpawn';
import {
  getPlayerCollisionContacts as getWorldPlayerCollisionContacts,
  getPlayerLandingImpactSpeed as getWorldPlayerLandingImpactSpeed,
  getPlayerWaterSubmersionTelemetry as getWorldPlayerWaterSubmersionTelemetry,
  respawnPlayerStateAtSpawnIfEmbeddedInSolid as respawnWorldPlayerStateAtSpawnIfEmbeddedInSolid,
  stepPlayerState as stepWorldPlayerState,
  stepPlayerStateWithGravity as stepWorldPlayerStateWithGravity,
  type PlayerCollisionContacts,
  type PlayerMovementIntent,
  type PlayerState,
  type PlayerWaterSubmersionTelemetry
} from '../world/playerState';
import type { EntityId, EntityRenderStateSnapshot } from '../world/entityRegistry';
import { resolveInterpolatedEntityWorldPosition } from '../world/entityRenderInterpolation';
import { stepHostileSlimeState as stepWorldHostileSlimeState } from '../world/hostileSlimeLocomotion';
import { type HostileSlimeState } from '../world/hostileSlimeState';
import { stepPassiveBunnyState as stepWorldPassiveBunnyState } from '../world/passiveBunnyLocomotion';
import { type PassiveBunnyState } from '../world/passiveBunnyState';
import { type DroppedItemState } from '../world/droppedItem';
import { type StarterWandFireboltState } from '../world/starterWand';
import {
  isStandalonePlayerRenderStateCeilingBonkActive,
  type StandalonePlayerRenderState
} from '../world/standalonePlayerRenderState';
import { recomputeSunlightFromExposedChunkTops } from '../world/sunlight';
import { DEFAULT_WORLD_SEED } from '../world/worldSeed';
import {
  resolveLiquidStepPhaseSummary,
  TileWorld,
  type LiquidStepPhaseSummary,
  type TileEditEvent,
  type WallEditEvent,
  type TileWorldSnapshot,
  type WorldEditOrigin
} from '../world/world';

interface ChunkGpuMesh {
  buffer: WebGLBuffer;
  vao: WebGLVertexArrayObject;
  vertexCount: number;
  animatedMesh: ReturnType<typeof createAnimatedChunkMeshState>;
}

interface CachedChunkMesh {
  chunkX: number;
  chunkY: number;
  state: 'queued' | 'ready' | 'empty';
  mesh: ChunkGpuMesh | null;
}

interface MeshBuildRequest {
  key: string;
  chunkX: number;
  chunkY: number;
}

export interface RendererFrameState {
  entities?: RendererEntityFrameState[];
  renderAlpha?: number;
  timeMs?: number;
}

export interface StandalonePlayerEntityFrameState {
  id: EntityId;
  kind: 'standalone-player';
  snapshot: EntityRenderStateSnapshot<StandalonePlayerRenderState>;
}

export interface HostileSlimeEntityFrameState {
  id: EntityId;
  kind: 'slime';
  snapshot: EntityRenderStateSnapshot<HostileSlimeState>;
}

export interface PassiveBunnyEntityFrameState {
  id: EntityId;
  kind: 'bunny';
  snapshot: EntityRenderStateSnapshot<PassiveBunnyState>;
}

export interface DroppedItemEntityFrameState {
  id: EntityId;
  kind: 'dropped-item';
  snapshot: EntityRenderStateSnapshot<DroppedItemState>;
}

export interface FireboltEntityFrameState {
  id: EntityId;
  kind: 'wand-firebolt';
  snapshot: EntityRenderStateSnapshot<StarterWandFireboltState>;
}

export type RendererEntityFrameState =
  | StandalonePlayerEntityFrameState
  | HostileSlimeEntityFrameState
  | PassiveBunnyEntityFrameState
  | DroppedItemEntityFrameState
  | FireboltEntityFrameState;

export interface RenderTelemetry {
  atlasSourceKind: AtlasImageLoadResult['sourceKind'] | 'pending';
  atlasWidth: number | null;
  atlasHeight: number | null;
  atlasValidationWarningCount: number | null;
  atlasValidationFirstWarning: string | null;
  residentAnimatedChunkMeshes: number;
  residentAnimatedChunkQuadCount: number;
  residentAnimatedLiquidChunkQuadCount: number;
  animatedChunkUvUploadCount: number;
  animatedChunkUvUploadQuadCount: number;
  animatedChunkUvUploadLiquidQuadCount: number;
  animatedChunkUvUploadBytes: number;
  renderedChunks: number;
  drawCalls: number;
  drawCallBudget: number;
  meshBuilds: number;
  meshBuildBudget: number;
  meshBuildTimeMs: number;
  meshBuildQueueLength: number;
  residentWorldChunks: number;
  cachedChunkMeshes: number;
  residentDirtyLightChunks: number;
  residentActiveLiquidChunks: number;
  residentSleepingLiquidChunks: number;
  residentActiveLiquidMinChunkX: number | null;
  residentActiveLiquidMinChunkY: number | null;
  residentActiveLiquidMaxChunkX: number | null;
  residentActiveLiquidMaxChunkY: number | null;
  residentSleepingLiquidMinChunkX: number | null;
  residentSleepingLiquidMinChunkY: number | null;
  residentSleepingLiquidMaxChunkX: number | null;
  residentSleepingLiquidMaxChunkY: number | null;
  liquidStepSidewaysCandidateMinChunkX: number | null;
  liquidStepSidewaysCandidateMinChunkY: number | null;
  liquidStepSidewaysCandidateMaxChunkX: number | null;
  liquidStepSidewaysCandidateMaxChunkY: number | null;
  liquidStepDownwardActiveChunksScanned: number;
  liquidStepSidewaysCandidateChunksScanned: number;
  liquidStepSidewaysPairsTested: number;
  liquidStepDownwardTransfersApplied: number;
  liquidStepSidewaysTransfersApplied: number;
  liquidStepPhaseSummary: LiquidStepPhaseSummary;
  standalonePlayerNearbyLightLevel: number | null;
  standalonePlayerNearbyLightFactor: number | null;
  standalonePlayerNearbyLightSourceTileX: number | null;
  standalonePlayerNearbyLightSourceTileY: number | null;
  standalonePlayerNearbyLightSourceChunkX: number | null;
  standalonePlayerNearbyLightSourceChunkY: number | null;
  standalonePlayerNearbyLightSourceLocalTileX: number | null;
  standalonePlayerNearbyLightSourceLocalTileY: number | null;
  evictedWorldChunks: number;
  evictedMeshEntries: number;
}

const DRAW_CALL_BUDGET = 256;
const MESH_BUILD_QUEUE_CHUNK_BUDGET = 4;
const MESH_BUILD_QUEUE_TIME_BUDGET_MS = 3;
const FRUSTUM_PADDING_CHUNKS = 1;
const STREAM_RETAIN_PADDING_CHUNKS = 3;

const createDynamicVertexBuffer = (
  gl: WebGL2RenderingContext,
  data: Float32Array
): WebGLBuffer => {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('Unable to create vertex buffer');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  return buffer;
};

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private playerProgram: WebGLProgram;
  private slimeProgram: WebGLProgram;
  private bunnyProgram: WebGLProgram;
  private droppedItemProgram: WebGLProgram;
  private world!: TileWorld;
  private detachWorldTileEditListener: (() => void) | null = null;
  private detachWorldWallEditListener: (() => void) | null = null;
  private tileEditListeners = new Set<(event: TileEditEvent) => void>();
  private wallEditListeners = new Set<(event: WallEditEvent) => void>();
  private meshes = new Map<string, CachedChunkMesh>();
  private meshBuildQueue: MeshBuildRequest[] = [];
  private uMatrix: WebGLUniformLocation;
  private uPlayerMatrix: WebGLUniformLocation;
  private uPlayerFacingSign: WebGLUniformLocation;
  private uPlayerPoseIndex: WebGLUniformLocation;
  private uPlayerLight: WebGLUniformLocation;
  private uSlimeMatrix: WebGLUniformLocation;
  private uSlimeFacingSign: WebGLUniformLocation;
  private uSlimeLight: WebGLUniformLocation;
  private uBunnyMatrix: WebGLUniformLocation;
  private uBunnyFacingSign: WebGLUniformLocation;
  private uBunnyLight: WebGLUniformLocation;
  private uDroppedItemMatrix: WebGLUniformLocation;
  private uDroppedItemLight: WebGLUniformLocation;
  private uDroppedItemBaseColor: WebGLUniformLocation;
  private uDroppedItemAccentColor: WebGLUniformLocation;
  private texture: WebGLTexture | null = null;
  private standalonePlayerBuffer: WebGLBuffer;
  private standalonePlayerVao: WebGLVertexArrayObject;
  private hostileSlimeBuffer: WebGLBuffer;
  private hostileSlimeVao: WebGLVertexArrayObject;
  private passiveBunnyBuffer: WebGLBuffer;
  private passiveBunnyVao: WebGLVertexArrayObject;
  private droppedItemBuffer: WebGLBuffer;
  private droppedItemVao: WebGLVertexArrayObject;
  private fireboltBuffer: WebGLBuffer;
  private fireboltVao: WebGLVertexArrayObject;

  readonly telemetry: RenderTelemetry = {
    atlasSourceKind: 'pending',
    atlasWidth: null,
    atlasHeight: null,
    atlasValidationWarningCount: null,
    atlasValidationFirstWarning: null,
    residentAnimatedChunkMeshes: 0,
    residentAnimatedChunkQuadCount: 0,
    residentAnimatedLiquidChunkQuadCount: 0,
    animatedChunkUvUploadCount: 0,
    animatedChunkUvUploadQuadCount: 0,
    animatedChunkUvUploadLiquidQuadCount: 0,
    animatedChunkUvUploadBytes: 0,
    renderedChunks: 0,
    drawCalls: 0,
    drawCallBudget: DRAW_CALL_BUDGET,
    meshBuilds: 0,
    meshBuildBudget: MESH_BUILD_QUEUE_CHUNK_BUDGET,
    meshBuildTimeMs: 0,
    meshBuildQueueLength: 0,
    residentWorldChunks: 0,
    cachedChunkMeshes: 0,
    residentDirtyLightChunks: 0,
    residentActiveLiquidChunks: 0,
    residentSleepingLiquidChunks: 0,
    residentActiveLiquidMinChunkX: null,
    residentActiveLiquidMinChunkY: null,
    residentActiveLiquidMaxChunkX: null,
    residentActiveLiquidMaxChunkY: null,
    residentSleepingLiquidMinChunkX: null,
    residentSleepingLiquidMinChunkY: null,
    residentSleepingLiquidMaxChunkX: null,
    residentSleepingLiquidMaxChunkY: null,
    liquidStepSidewaysCandidateMinChunkX: null,
    liquidStepSidewaysCandidateMinChunkY: null,
    liquidStepSidewaysCandidateMaxChunkX: null,
    liquidStepSidewaysCandidateMaxChunkY: null,
    liquidStepDownwardActiveChunksScanned: 0,
    liquidStepSidewaysCandidateChunksScanned: 0,
    liquidStepSidewaysPairsTested: 0,
    liquidStepDownwardTransfersApplied: 0,
    liquidStepSidewaysTransfersApplied: 0,
    liquidStepPhaseSummary: 'none',
    standalonePlayerNearbyLightLevel: null,
    standalonePlayerNearbyLightFactor: null,
    standalonePlayerNearbyLightSourceTileX: null,
    standalonePlayerNearbyLightSourceTileY: null,
    standalonePlayerNearbyLightSourceChunkX: null,
    standalonePlayerNearbyLightSourceChunkY: null,
    standalonePlayerNearbyLightSourceLocalTileX: null,
    standalonePlayerNearbyLightSourceLocalTileY: null,
    evictedWorldChunks: 0,
    evictedMeshEntries: 0
  };

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;

    this.program = createProgram(
      gl,
      `#version 300 es
      precision mediump float;
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec2 a_uv;
      layout(location = 2) in float a_light;
      uniform mat4 u_matrix;
      out vec2 v_uv;
      out float v_light;
      void main() {
        v_uv = a_uv;
        v_light = clamp(a_light / ${MAX_LIGHT_LEVEL.toFixed(1)}, 0.0, 1.0);
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
      }`,
      `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      in float v_light;
      uniform sampler2D u_atlas;
      out vec4 outColor;
      void main() {
        vec4 atlasColor = texture(u_atlas, v_uv);
        outColor = vec4(atlasColor.rgb * v_light, atlasColor.a);
      }`
    );

    const matrix = gl.getUniformLocation(this.program, 'u_matrix');
    if (!matrix) throw new Error('Missing uniform u_matrix');
    this.uMatrix = matrix;

    this.playerProgram = createProgram(
      gl,
      `#version 300 es
      precision mediump float;
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec2 a_uv;
      uniform mat4 u_matrix;
      out vec2 v_uv;
      void main() {
        v_uv = a_uv;
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
      }`,
      `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      uniform float u_facingSign;
      uniform float u_poseIndex;
      uniform float u_light;
      out vec4 outColor;

      bool inRect(vec2 uv, vec4 rect) {
        return uv.x >= rect.x && uv.x <= rect.z && uv.y >= rect.y && uv.y <= rect.w;
      }

      bool inBorder(vec2 uv, vec4 rect, float inset) {
        return inRect(uv, rect) &&
          !inRect(uv, vec4(rect.x + inset, rect.y + inset, rect.z - inset, rect.w - inset));
      }

      void main() {
        vec2 uv = v_uv;
        if (u_facingSign < 0.0) {
          uv.x = 1.0 - uv.x;
        }
        uv.y = 1.0 - uv.y;

        bool walkPoseA = u_poseIndex > 0.5 && u_poseIndex < 1.5;
        bool walkPoseB = u_poseIndex > 1.5 && u_poseIndex < 2.5;
        bool jumpRisePose = u_poseIndex > 2.5 && u_poseIndex < 3.5;
        bool fallPose = u_poseIndex > 3.5 && u_poseIndex < 4.5;
        bool wallSlidePose = u_poseIndex > 4.5 && u_poseIndex < 5.5;
        bool ceilingBonkPose = u_poseIndex > 5.5;

        vec4 head = vec4(0.24, 0.62, 0.76, 0.94);
        vec4 hair = vec4(0.18, 0.80, 0.82, 0.98);
        vec4 torso = vec4(0.30, 0.34, 0.70, 0.62);
        vec4 eye = vec4(0.58, 0.74, 0.68, 0.80);
        vec4 leftArm = vec4(0.16, 0.38, 0.28, 0.60);
        vec4 rightArm = vec4(0.72, 0.38, 0.84, 0.58);
        vec4 leftLeg = vec4(0.32, 0.10, 0.46, 0.36);
        vec4 rightLeg = vec4(0.54, 0.10, 0.68, 0.36);
        vec4 leftBoot = vec4(0.30, 0.02, 0.48, 0.10);
        vec4 rightBoot = vec4(0.52, 0.02, 0.70, 0.10);

        if (walkPoseA) {
          leftArm = vec4(0.14, 0.44, 0.26, 0.70);
          rightArm = vec4(0.74, 0.30, 0.88, 0.62);
          leftLeg = vec4(0.24, 0.14, 0.40, 0.38);
          rightLeg = vec4(0.58, 0.08, 0.74, 0.34);
          leftBoot = vec4(0.22, 0.02, 0.42, 0.10);
          rightBoot = vec4(0.56, 0.00, 0.80, 0.08);
        } else if (walkPoseB) {
          leftArm = vec4(0.12, 0.30, 0.26, 0.62);
          rightArm = vec4(0.72, 0.44, 0.86, 0.70);
          leftLeg = vec4(0.26, 0.08, 0.42, 0.34);
          rightLeg = vec4(0.60, 0.14, 0.76, 0.38);
          leftBoot = vec4(0.22, 0.00, 0.46, 0.08);
          rightBoot = vec4(0.58, 0.02, 0.78, 0.10);
        } else if (jumpRisePose) {
          leftArm = vec4(0.10, 0.52, 0.24, 0.82);
          rightArm = vec4(0.76, 0.56, 0.90, 0.84);
          leftLeg = vec4(0.22, 0.18, 0.40, 0.34);
          rightLeg = vec4(0.58, 0.22, 0.76, 0.38);
          leftBoot = vec4(0.16, 0.10, 0.36, 0.18);
          rightBoot = vec4(0.64, 0.14, 0.84, 0.22);
        } else if (fallPose) {
          leftArm = vec4(0.14, 0.26, 0.28, 0.54);
          rightArm = vec4(0.72, 0.34, 0.86, 0.62);
          leftLeg = vec4(0.30, 0.08, 0.44, 0.40);
          rightLeg = vec4(0.56, 0.06, 0.70, 0.38);
          leftBoot = vec4(0.28, 0.00, 0.46, 0.08);
          rightBoot = vec4(0.54, 0.00, 0.72, 0.08);
        } else if (wallSlidePose) {
          torso = vec4(0.28, 0.32, 0.68, 0.64);
          leftArm = vec4(0.10, 0.42, 0.24, 0.84);
          rightArm = vec4(0.70, 0.26, 0.84, 0.56);
          leftLeg = vec4(0.34, 0.12, 0.50, 0.40);
          rightLeg = vec4(0.48, 0.20, 0.68, 0.42);
          leftBoot = vec4(0.32, 0.04, 0.50, 0.12);
          rightBoot = vec4(0.48, 0.12, 0.70, 0.20);
        } else if (ceilingBonkPose) {
          head = vec4(0.22, 0.64, 0.78, 0.92);
          hair = vec4(0.18, 0.82, 0.82, 0.96);
          torso = vec4(0.30, 0.34, 0.70, 0.60);
          leftArm = vec4(0.08, 0.54, 0.28, 0.86);
          rightArm = vec4(0.72, 0.54, 0.92, 0.86);
          leftLeg = vec4(0.28, 0.16, 0.44, 0.32);
          rightLeg = vec4(0.56, 0.16, 0.72, 0.32);
          leftBoot = vec4(0.22, 0.08, 0.44, 0.16);
          rightBoot = vec4(0.56, 0.08, 0.78, 0.16);
        }

        bool insideHead = inRect(uv, head);
        bool insideHair = inRect(uv, hair) && uv.y > 0.82;
        bool insideShirt = inRect(uv, torso);
        bool insideLeftArm = inRect(uv, leftArm);
        bool insideRightArm = inRect(uv, rightArm);
        bool insideLeftLeg = inRect(uv, leftLeg);
        bool insideRightLeg = inRect(uv, rightLeg);
        bool insideLeftBoot = inRect(uv, leftBoot);
        bool insideRightBoot = inRect(uv, rightBoot);
        bool insideEye = insideHead && inRect(uv, eye);
        bool insideAny = insideHead ||
          insideHair ||
          insideShirt ||
          insideLeftArm ||
          insideRightArm ||
          insideLeftLeg ||
          insideRightLeg ||
          insideLeftBoot ||
          insideRightBoot;

        if (!insideAny) {
          discard;
        }

        bool outline = inBorder(uv, head, 0.03) ||
          inBorder(uv, hair, 0.03) ||
          inBorder(uv, torso, 0.03) ||
          inBorder(uv, leftArm, 0.025) ||
          inBorder(uv, rightArm, 0.025) ||
          inBorder(uv, leftLeg, 0.025) ||
          inBorder(uv, rightLeg, 0.025) ||
          inBorder(uv, leftBoot, 0.02) ||
          inBorder(uv, rightBoot, 0.02);

        vec3 color = vec3(0.98, 0.72, 0.34);
        if (insideShirt) {
          color = vec3(0.84, 0.43, 0.16);
        }
        if (insideLeftLeg || insideRightLeg) {
          color = vec3(0.20, 0.33, 0.72);
        }
        if (insideLeftBoot || insideRightBoot) {
          color = vec3(0.16, 0.10, 0.06);
        }
        if (insideHair) {
          color = vec3(0.24, 0.14, 0.06);
        }
        if (insideEye) {
          color = vec3(0.12, 0.09, 0.06);
        }
        if (outline) {
          color = vec3(0.18, 0.10, 0.04);
        }

        outColor = vec4(color * clamp(u_light, 0.0, 1.0), 1.0);
      }`
    );

    const playerMatrix = gl.getUniformLocation(this.playerProgram, 'u_matrix');
    if (!playerMatrix) throw new Error('Missing uniform u_matrix');
    this.uPlayerMatrix = playerMatrix;

    const playerFacingSign = gl.getUniformLocation(this.playerProgram, 'u_facingSign');
    if (!playerFacingSign) throw new Error('Missing uniform u_facingSign');
    this.uPlayerFacingSign = playerFacingSign;

    const playerPoseIndex = gl.getUniformLocation(this.playerProgram, 'u_poseIndex');
    if (!playerPoseIndex) throw new Error('Missing uniform u_poseIndex');
    this.uPlayerPoseIndex = playerPoseIndex;

    const playerLight = gl.getUniformLocation(this.playerProgram, 'u_light');
    if (!playerLight) throw new Error('Missing uniform u_light');
    this.uPlayerLight = playerLight;

    this.slimeProgram = createProgram(
      gl,
      `#version 300 es
      precision mediump float;
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec2 a_uv;
      uniform mat4 u_matrix;
      out vec2 v_uv;
      void main() {
        v_uv = a_uv;
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
      }`,
      `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      uniform float u_facingSign;
      uniform float u_light;
      out vec4 outColor;

      bool inRect(vec2 uv, vec4 rect) {
        return uv.x >= rect.x && uv.x <= rect.z && uv.y >= rect.y && uv.y <= rect.w;
      }

      bool inEllipse(vec2 uv, vec2 center, vec2 radius) {
        vec2 normalized = (uv - center) / radius;
        return dot(normalized, normalized) <= 1.0;
      }

      bool inSlimeBody(vec2 uv, float inset) {
        vec2 domeCenter = vec2(0.50, 0.46 + inset * 0.25);
        vec2 domeRadius = vec2(max(0.01, 0.44 - inset), max(0.01, 0.34 - inset));
        vec4 base = vec4(0.08 + inset, 0.08 + inset, 0.92 - inset, 0.44);
        return inEllipse(uv, domeCenter, domeRadius) || inRect(uv, base);
      }

      void main() {
        vec2 uv = v_uv;
        if (u_facingSign < 0.0) {
          uv.x = 1.0 - uv.x;
        }
        uv.y = 1.0 - uv.y;

        bool insideBody = inSlimeBody(uv, 0.0);
        if (!insideBody) {
          discard;
        }

        bool insideOutline = insideBody && !inSlimeBody(uv, 0.035);
        bool insideHighlight = inEllipse(uv, vec2(0.34, 0.62), vec2(0.16, 0.10));
        bool insideLeftEye = inEllipse(uv, vec2(0.38, 0.42), vec2(0.05, 0.08));
        bool insideRightEye = inEllipse(uv, vec2(0.62, 0.42), vec2(0.05, 0.08));
        bool insideMouth =
          inEllipse(uv, vec2(0.50, 0.24), vec2(0.12, 0.05)) &&
          uv.y <= 0.24;
        bool insideShadow = inRect(uv, vec4(0.18, 0.06, 0.82, 0.16));

        vec3 color = vec3(0.18, 0.66, 0.26);
        if (insideHighlight) {
          color = vec3(0.46, 0.90, 0.50);
        }
        if (insideShadow) {
          color = vec3(0.12, 0.44, 0.18);
        }
        if (insideLeftEye || insideRightEye || insideMouth) {
          color = vec3(0.06, 0.10, 0.08);
        }
        if (insideOutline) {
          color = vec3(0.08, 0.28, 0.12);
        }

        outColor = vec4(color * clamp(u_light, 0.0, 1.0), 1.0);
      }`
    );

    const slimeMatrix = gl.getUniformLocation(this.slimeProgram, 'u_matrix');
    if (!slimeMatrix) throw new Error('Missing uniform u_matrix');
    this.uSlimeMatrix = slimeMatrix;

    const slimeFacingSign = gl.getUniformLocation(this.slimeProgram, 'u_facingSign');
    if (!slimeFacingSign) throw new Error('Missing uniform u_facingSign');
    this.uSlimeFacingSign = slimeFacingSign;

    const slimeLight = gl.getUniformLocation(this.slimeProgram, 'u_light');
    if (!slimeLight) throw new Error('Missing uniform u_light');
    this.uSlimeLight = slimeLight;

    this.bunnyProgram = createProgram(
      gl,
      `#version 300 es
      precision mediump float;
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec2 a_uv;
      uniform mat4 u_matrix;
      out vec2 v_uv;
      void main() {
        v_uv = a_uv;
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
      }`,
      `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      uniform float u_facingSign;
      uniform float u_light;
      out vec4 outColor;

      bool inRect(vec2 uv, vec4 rect) {
        return uv.x >= rect.x && uv.x <= rect.z && uv.y >= rect.y && uv.y <= rect.w;
      }

      bool inEllipse(vec2 uv, vec2 center, vec2 radius) {
        vec2 normalized = (uv - center) / radius;
        return dot(normalized, normalized) <= 1.0;
      }

      void main() {
        vec2 uv = v_uv;
        if (u_facingSign < 0.0) {
          uv.x = 1.0 - uv.x;
        }
        uv.y = 1.0 - uv.y;

        bool insideBody = inEllipse(uv, vec2(0.44, 0.34), vec2(0.28, 0.22));
        bool insideHead = inEllipse(uv, vec2(0.68, 0.52), vec2(0.18, 0.16));
        bool insideBackEar = inRect(uv, vec4(0.56, 0.64, 0.66, 0.92));
        bool insideFrontEar = inRect(uv, vec4(0.68, 0.66, 0.80, 0.98));
        bool insideTail = inEllipse(uv, vec2(0.16, 0.42), vec2(0.10, 0.10));
        bool insideFoot = inRect(uv, vec4(0.38, 0.04, 0.72, 0.14));
        bool insideAny = insideBody || insideHead || insideBackEar || insideFrontEar || insideTail || insideFoot;
        if (!insideAny) {
          discard;
        }

        bool insideBodyInner = inEllipse(uv, vec2(0.44, 0.34), vec2(0.25, 0.19));
        bool insideHeadInner = inEllipse(uv, vec2(0.68, 0.52), vec2(0.15, 0.13));
        bool insideBackEarInner = inRect(uv, vec4(0.58, 0.66, 0.64, 0.88));
        bool insideFrontEarInner = inRect(uv, vec4(0.70, 0.68, 0.78, 0.94));
        bool insideTailInner = inEllipse(uv, vec2(0.16, 0.42), vec2(0.07, 0.07));
        bool insideFootInner = inRect(uv, vec4(0.40, 0.06, 0.70, 0.12));
        bool insideOutline =
          (insideBody && !insideBodyInner) ||
          (insideHead && !insideHeadInner) ||
          (insideBackEar && !insideBackEarInner) ||
          (insideFrontEar && !insideFrontEarInner) ||
          (insideTail && !insideTailInner) ||
          (insideFoot && !insideFootInner);

        bool insideBelly = inEllipse(uv, vec2(0.50, 0.28), vec2(0.14, 0.10));
        bool insideEarPink =
          (inRect(uv, vec4(0.59, 0.70, 0.63, 0.86)) || inRect(uv, vec4(0.71, 0.72, 0.77, 0.92))) &&
          (insideBackEarInner || insideFrontEarInner);
        bool insideEye = inEllipse(uv, vec2(0.76, 0.56), vec2(0.03, 0.04));

        vec3 color = vec3(0.58, 0.46, 0.32);
        if (insideBelly || insideTailInner) {
          color = vec3(0.88, 0.82, 0.74);
        }
        if (insideEarPink) {
          color = vec3(0.92, 0.68, 0.70);
        }
        if (insideEye) {
          color = vec3(0.12, 0.10, 0.08);
        }
        if (insideOutline) {
          color = vec3(0.28, 0.20, 0.14);
        }

        outColor = vec4(color * clamp(u_light, 0.0, 1.0), 1.0);
      }`
    );

    const bunnyMatrix = gl.getUniformLocation(this.bunnyProgram, 'u_matrix');
    if (!bunnyMatrix) throw new Error('Missing uniform u_matrix');
    this.uBunnyMatrix = bunnyMatrix;

    const bunnyFacingSign = gl.getUniformLocation(this.bunnyProgram, 'u_facingSign');
    if (!bunnyFacingSign) throw new Error('Missing uniform u_facingSign');
    this.uBunnyFacingSign = bunnyFacingSign;

    const bunnyLight = gl.getUniformLocation(this.bunnyProgram, 'u_light');
    if (!bunnyLight) throw new Error('Missing uniform u_light');
    this.uBunnyLight = bunnyLight;

    this.droppedItemProgram = createProgram(
      gl,
      `#version 300 es
      precision mediump float;
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec2 a_uv;
      uniform mat4 u_matrix;
      out vec2 v_uv;
      void main() {
        v_uv = a_uv;
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
      }`,
      `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      uniform float u_light;
      uniform vec3 u_baseColor;
      uniform vec3 u_accentColor;
      out vec4 outColor;

      bool inRect(vec2 uv, vec4 rect) {
        return uv.x >= rect.x && uv.x <= rect.z && uv.y >= rect.y && uv.y <= rect.w;
      }

      bool inDiamond(vec2 uv, vec2 center, vec2 radius) {
        vec2 normalized = abs((uv - center) / radius);
        return normalized.x + normalized.y <= 1.0;
      }

      void main() {
        vec2 uv = v_uv;
        uv.y = 1.0 - uv.y;

        bool insideBody = inDiamond(uv, vec2(0.50, 0.54), vec2(0.28, 0.34));
        if (!insideBody) {
          discard;
        }

        bool insideInner = inDiamond(uv, vec2(0.50, 0.54), vec2(0.22, 0.28));
        bool insideBand = inRect(uv, vec4(0.34, 0.28, 0.66, 0.40)) && insideInner;
        bool insideHighlight = inDiamond(uv, vec2(0.42, 0.66), vec2(0.10, 0.12)) && insideInner;

        vec3 color = insideInner ? u_baseColor : u_baseColor * 0.42;
        if (insideBand) {
          color = mix(color, u_accentColor, 0.65);
        }
        if (insideHighlight) {
          color = u_accentColor;
        }

        outColor = vec4(color * clamp(u_light, 0.0, 1.0), 1.0);
      }`
    );

    const droppedItemMatrix = gl.getUniformLocation(this.droppedItemProgram, 'u_matrix');
    if (!droppedItemMatrix) throw new Error('Missing uniform u_matrix');
    this.uDroppedItemMatrix = droppedItemMatrix;

    const droppedItemLight = gl.getUniformLocation(this.droppedItemProgram, 'u_light');
    if (!droppedItemLight) throw new Error('Missing uniform u_light');
    this.uDroppedItemLight = droppedItemLight;

    const droppedItemBaseColor = gl.getUniformLocation(this.droppedItemProgram, 'u_baseColor');
    if (!droppedItemBaseColor) throw new Error('Missing uniform u_baseColor');
    this.uDroppedItemBaseColor = droppedItemBaseColor;

    const droppedItemAccentColor = gl.getUniformLocation(this.droppedItemProgram, 'u_accentColor');
    if (!droppedItemAccentColor) throw new Error('Missing uniform u_accentColor');
    this.uDroppedItemAccentColor = droppedItemAccentColor;

    this.standalonePlayerBuffer = createDynamicVertexBuffer(
      gl,
      new Float32Array(STANDALONE_PLAYER_PLACEHOLDER_VERTEX_FLOAT_COUNT)
    );
    this.standalonePlayerVao = createVertexArray(gl, this.standalonePlayerBuffer, 4);
    this.hostileSlimeBuffer = createDynamicVertexBuffer(
      gl,
      new Float32Array(HOSTILE_SLIME_PLACEHOLDER_VERTEX_FLOAT_COUNT)
    );
    this.hostileSlimeVao = createVertexArray(gl, this.hostileSlimeBuffer, 4);
    this.passiveBunnyBuffer = createDynamicVertexBuffer(
      gl,
      new Float32Array(PASSIVE_BUNNY_PLACEHOLDER_VERTEX_FLOAT_COUNT)
    );
    this.passiveBunnyVao = createVertexArray(gl, this.passiveBunnyBuffer, 4);
    this.droppedItemBuffer = createDynamicVertexBuffer(
      gl,
      new Float32Array(DROPPED_ITEM_PLACEHOLDER_VERTEX_FLOAT_COUNT)
    );
    this.droppedItemVao = createVertexArray(gl, this.droppedItemBuffer, 4);
    this.fireboltBuffer = createDynamicVertexBuffer(
      gl,
      new Float32Array(FIREBOLT_PLACEHOLDER_VERTEX_FLOAT_COUNT)
    );
    this.fireboltVao = createVertexArray(gl, this.fireboltBuffer, 4);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.attachWorld(new TileWorld());
  }

  async initialize(): Promise<void> {
    const atlas = await loadAtlasImageSource(resolveAuthoredTileAtlasUrl());
    this.texture = createTextureFromImageSource(this.gl, atlas.imageSource);
    this.telemetry.atlasSourceKind = atlas.sourceKind;
    this.telemetry.atlasWidth = atlas.width;
    this.telemetry.atlasHeight = atlas.height;
    const atlasWarnings = collectAtlasValidationWarnings(
      TILE_METADATA.tiles,
      atlas.width,
      atlas.height,
      WALL_METADATA.walls
    );
    this.telemetry.atlasValidationWarningCount = atlasWarnings.length;
    this.telemetry.atlasValidationFirstWarning = atlasWarnings[0]?.summary ?? null;
    if (atlasWarnings.length > 0) {
      console.warn(
        `[Renderer] Atlas validation found ${atlasWarnings.length} warning(s) for ${atlas.sourceKind} atlas ${atlas.width}x${atlas.height}.\n` +
          atlasWarnings.map((warning) => `- ${warning.message}`).join('\n')
      );
    }
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(this.canvas.clientWidth * dpr);
    const height = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  render(camera: Camera2D, frameState: RendererFrameState = {}): void {
    if (!this.texture) return;

    const gl = this.gl;
    const timeMs = frameState.timeMs ?? performance.now();
    this.telemetry.animatedChunkUvUploadCount = 0;
    this.telemetry.animatedChunkUvUploadQuadCount = 0;
    this.telemetry.animatedChunkUvUploadLiquidQuadCount = 0;
    this.telemetry.animatedChunkUvUploadBytes = 0;
    this.telemetry.renderedChunks = 0;
    this.telemetry.drawCalls = 0;
    this.telemetry.meshBuilds = 0;
    this.telemetry.meshBuildTimeMs = 0;
    this.telemetry.meshBuildQueueLength = this.meshBuildQueue.length;
    this.telemetry.evictedWorldChunks = 0;
    this.telemetry.evictedMeshEntries = 0;
    this.telemetry.standalonePlayerNearbyLightLevel = null;
    this.telemetry.standalonePlayerNearbyLightFactor = null;
    this.telemetry.standalonePlayerNearbyLightSourceTileX = null;
    this.telemetry.standalonePlayerNearbyLightSourceTileY = null;
    this.telemetry.standalonePlayerNearbyLightSourceChunkX = null;
    this.telemetry.standalonePlayerNearbyLightSourceChunkY = null;
    this.telemetry.standalonePlayerNearbyLightSourceLocalTileX = null;
    this.telemetry.standalonePlayerNearbyLightSourceLocalTileY = null;
    gl.clearColor(0.12, 0.15, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const worldToClipMatrix = camera.worldToClipMatrix(this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uMatrix, false, worldToClipMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    const worldHalfWidth = this.canvas.width / (2 * camera.zoom);
    const worldHalfHeight = this.canvas.height / (2 * camera.zoom);
    const minTileX = Math.floor((camera.x - worldHalfWidth) / TILE_SIZE);
    const minTileY = Math.floor((camera.y - worldHalfHeight) / TILE_SIZE);
    const maxTileX = Math.ceil((camera.x + worldHalfWidth) / TILE_SIZE);
    const maxTileY = Math.ceil((camera.y + worldHalfHeight) / TILE_SIZE);

    const visibleBounds = chunkCoordBounds(minTileX, minTileY, maxTileX, maxTileY);
    const drawBounds = expandChunkBounds(visibleBounds, FRUSTUM_PADDING_CHUNKS);
    const retainBounds = expandChunkBounds(drawBounds, STREAM_RETAIN_PADDING_CHUNKS);

    this.ensureWorldChunksResident(drawBounds);
    const changedLightChunks: Array<{ x: number; y: number }> = [];
    recomputeSunlightFromExposedChunkTops(this.world, TILE_METADATA, changedLightChunks);
    for (const chunk of changedLightChunks) {
      this.invalidateChunkMesh(chunk.x, chunk.y);
    }
    this.scheduleMeshBuilds(drawBounds, retainBounds);
    this.processMeshBuildQueue();

    for (let y = drawBounds.minChunkY; y <= drawBounds.maxChunkY; y += 1) {
      for (let x = drawBounds.minChunkX; x <= drawBounds.maxChunkX; x += 1) {
        const mesh = this.getReadyChunkMesh(x, y);
        if (!mesh) continue;
        this.updateAnimatedChunkMesh(mesh, timeMs);
        gl.bindVertexArray(mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
        this.telemetry.renderedChunks += 1;
        this.telemetry.drawCalls += 1;
      }
    }

    this.drawEntityPass(frameState.entities ?? [], frameState.renderAlpha ?? 1, worldToClipMatrix, timeMs);

    gl.bindVertexArray(null);
    this.pruneStreamingCaches(retainBounds);
    this.telemetry.residentWorldChunks = this.world.getChunkCount();
    this.telemetry.cachedChunkMeshes = this.meshes.size;
    this.telemetry.residentDirtyLightChunks = this.world.getDirtyLightChunkCount();
    this.updateActiveLiquidTelemetry();
    this.updateAnimatedChunkResidencyTelemetry();
    this.telemetry.meshBuildQueueLength = this.meshBuildQueue.length;
  }

  setTile(
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): boolean {
    return this.world.setTile(worldTileX, worldTileY, tileId, editOrigin);
  }

  setTileState(
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    liquidLevel: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): boolean {
    return this.world.setTileState(worldTileX, worldTileY, tileId, liquidLevel, editOrigin);
  }

  setWall(
    worldTileX: number,
    worldTileY: number,
    wallId: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): boolean {
    return this.world.setWall(worldTileX, worldTileY, wallId, editOrigin);
  }

  getTile(worldTileX: number, worldTileY: number): number {
    return this.world.getTile(worldTileX, worldTileY);
  }

  getWall(worldTileX: number, worldTileY: number): number {
    return this.world.getWall(worldTileX, worldTileY);
  }

  getLiquidLevel(worldTileX: number, worldTileY: number): number {
    return this.world.getLiquidLevel(worldTileX, worldTileY);
  }

  stepLiquidSimulation(): boolean {
    const changed = this.world.stepLiquidSimulation();
    this.updateLiquidStepTelemetry();
    return changed;
  }

  onTileEdited(listener: (event: TileEditEvent) => void): () => void {
    this.tileEditListeners.add(listener);
    return () => {
      this.tileEditListeners.delete(listener);
    };
  }

  onWallEdited(listener: (event: WallEditEvent) => void): () => void {
    this.wallEditListeners.add(listener);
    return () => {
      this.wallEditListeners.delete(listener);
    };
  }

  getLiquidRenderCardinalMask(worldTileX: number, worldTileY: number): number | null {
    const tileId = this.world.getTile(worldTileX, worldTileY);
    if (!hasLiquidRenderMetadata(tileId, TILE_METADATA)) {
      return null;
    }

    return resolveLiquidRenderCardinalMaskFromNeighborhood(
      this.world.sampleTileNeighborhood(worldTileX, worldTileY),
      TILE_METADATA
    );
  }

  createWorldSnapshot(): TileWorldSnapshot {
    return this.world.createSnapshot();
  }

  loadWorldSnapshot(snapshot: TileWorldSnapshot): void {
    const world = new TileWorld(0);
    world.loadSnapshot(snapshot);
    this.recomputeLoadedWorldLighting(world);
    this.replaceWorld(world);
  }

  resetWorld(worldSeed = DEFAULT_WORLD_SEED): void {
    this.replaceWorld(new TileWorld(3, worldSeed));
  }

  findPlayerSpawnPoint(options: PlayerSpawnSearchOptions): PlayerSpawnPoint | null {
    return findWorldPlayerSpawnPoint(this.world, options);
  }

  resolvePlayerSpawnLiquidSafetyStatus(spawn: PlayerSpawnPoint): PlayerSpawnLiquidSafetyStatus {
    return resolveWorldPlayerSpawnLiquidSafetyStatus(this.world, spawn);
  }

  getPlayerCollisionContacts(state: PlayerState): PlayerCollisionContacts {
    return getWorldPlayerCollisionContacts(this.world, state);
  }

  getPlayerWaterSubmersionTelemetry(state: PlayerState): PlayerWaterSubmersionTelemetry {
    return getWorldPlayerWaterSubmersionTelemetry(this.world, state);
  }

  stepPlayerStateWithGravity(state: PlayerState, fixedDtSeconds: number): PlayerState {
    return stepWorldPlayerStateWithGravity(this.world, state, fixedDtSeconds);
  }

  stepPlayerState(state: PlayerState, fixedDtSeconds: number, intent: PlayerMovementIntent): PlayerState {
    return stepWorldPlayerState(this.world, state, fixedDtSeconds, intent);
  }

  getPlayerLandingImpactSpeed(
    state: PlayerState,
    fixedDtSeconds: number,
    intent: PlayerMovementIntent
  ): number {
    return getWorldPlayerLandingImpactSpeed(this.world, state, fixedDtSeconds, intent);
  }

  stepHostileSlimeState(
    state: HostileSlimeState,
    fixedDtSeconds: number,
    playerState: Pick<PlayerState, 'position'>
  ): HostileSlimeState {
    return stepWorldHostileSlimeState(this.world, state, fixedDtSeconds, playerState);
  }

  stepPassiveBunnyState(state: PassiveBunnyState, fixedDtSeconds: number): PassiveBunnyState {
    return stepWorldPassiveBunnyState(this.world, state, fixedDtSeconds);
  }

  respawnPlayerStateAtSpawnIfEmbeddedInSolid(
    state: PlayerState,
    spawn: PlayerSpawnPoint | null
  ): PlayerState {
    return respawnWorldPlayerStateAtSpawnIfEmbeddedInSolid(this.world, state, spawn);
  }

  hasResidentChunk(chunkX: number, chunkY: number): boolean {
    return this.world.hasChunk(chunkX, chunkY);
  }

  getResidentChunkBounds(): ChunkBounds | null {
    let bounds: ChunkBounds | null = null;
    for (const chunk of this.world.getChunks()) {
      if (!bounds) {
        bounds = {
          minChunkX: chunk.coord.x,
          minChunkY: chunk.coord.y,
          maxChunkX: chunk.coord.x,
          maxChunkY: chunk.coord.y
        };
        continue;
      }

      if (chunk.coord.x < bounds.minChunkX) bounds.minChunkX = chunk.coord.x;
      if (chunk.coord.y < bounds.minChunkY) bounds.minChunkY = chunk.coord.y;
      if (chunk.coord.x > bounds.maxChunkX) bounds.maxChunkX = chunk.coord.x;
      if (chunk.coord.y > bounds.maxChunkY) bounds.maxChunkY = chunk.coord.y;
    }
    return bounds;
  }

  private attachWorld(world: TileWorld): void {
    this.detachWorldTileEditListener?.();
    this.detachWorldWallEditListener?.();
    this.world = world;
    this.updateLiquidStepTelemetry();
    this.detachWorldTileEditListener = this.world.onTileEdited((event) => {
      const { chunkX, chunkY, localX, localY } = event;
      for (const coord of affectedChunkCoordsForLocalTileEdit(chunkX, chunkY, localX, localY)) {
        this.invalidateChunkMesh(coord.x, coord.y);
      }
      for (const listener of this.tileEditListeners) {
        listener(event);
      }
    });
    this.detachWorldWallEditListener = this.world.onWallEdited((event) => {
      this.invalidateChunkMesh(event.chunkX, event.chunkY);
      for (const listener of this.wallEditListeners) {
        listener(event);
      }
    });
  }

  private recomputeLoadedWorldLighting(world: TileWorld): void {
    for (const chunk of world.getChunks()) {
      world.invalidateChunkLight(chunk.coord.x, chunk.coord.y);
    }
    recomputeSunlightFromExposedChunkTops(world, TILE_METADATA);
  }

  private replaceWorld(world: TileWorld): void {
    this.clearMeshCaches();
    this.attachWorld(world);
    this.telemetry.meshBuildQueueLength = 0;
    this.telemetry.residentWorldChunks = this.world.getChunkCount();
    this.telemetry.cachedChunkMeshes = 0;
    this.telemetry.residentDirtyLightChunks = this.world.getDirtyLightChunkCount();
    this.updateLiquidStepTelemetry();
    this.telemetry.standalonePlayerNearbyLightLevel = null;
    this.telemetry.standalonePlayerNearbyLightFactor = null;
    this.telemetry.standalonePlayerNearbyLightSourceTileX = null;
    this.telemetry.standalonePlayerNearbyLightSourceTileY = null;
    this.telemetry.standalonePlayerNearbyLightSourceChunkX = null;
    this.telemetry.standalonePlayerNearbyLightSourceChunkY = null;
    this.telemetry.standalonePlayerNearbyLightSourceLocalTileX = null;
    this.telemetry.standalonePlayerNearbyLightSourceLocalTileY = null;
    this.telemetry.evictedWorldChunks = 0;
    this.telemetry.evictedMeshEntries = 0;
    this.telemetry.residentAnimatedChunkMeshes = 0;
    this.telemetry.residentAnimatedChunkQuadCount = 0;
    this.telemetry.residentAnimatedLiquidChunkQuadCount = 0;
    this.telemetry.animatedChunkUvUploadCount = 0;
    this.telemetry.animatedChunkUvUploadQuadCount = 0;
    this.telemetry.animatedChunkUvUploadLiquidQuadCount = 0;
    this.telemetry.animatedChunkUvUploadBytes = 0;
  }

  private updateActiveLiquidTelemetry(): void {
    const activeLiquidBounds = this.world.getActiveLiquidChunkBounds();
    const sleepingLiquidBounds = this.world.getSleepingLiquidChunkBounds();
    this.telemetry.residentActiveLiquidChunks = this.world.getActiveLiquidChunkCount();
    this.telemetry.residentSleepingLiquidChunks = this.world.getSleepingLiquidChunkCount();
    this.telemetry.residentActiveLiquidMinChunkX = activeLiquidBounds?.minChunkX ?? null;
    this.telemetry.residentActiveLiquidMinChunkY = activeLiquidBounds?.minChunkY ?? null;
    this.telemetry.residentActiveLiquidMaxChunkX = activeLiquidBounds?.maxChunkX ?? null;
    this.telemetry.residentActiveLiquidMaxChunkY = activeLiquidBounds?.maxChunkY ?? null;
    this.telemetry.residentSleepingLiquidMinChunkX = sleepingLiquidBounds?.minChunkX ?? null;
    this.telemetry.residentSleepingLiquidMinChunkY = sleepingLiquidBounds?.minChunkY ?? null;
    this.telemetry.residentSleepingLiquidMaxChunkX = sleepingLiquidBounds?.maxChunkX ?? null;
    this.telemetry.residentSleepingLiquidMaxChunkY = sleepingLiquidBounds?.maxChunkY ?? null;
  }

  private updateLiquidStepTelemetry(): void {
    this.updateActiveLiquidTelemetry();
    const stats = this.world.getLastLiquidSimulationStats();
    const sidewaysCandidateBounds = this.world.getLastSidewaysLiquidCandidateChunkBounds();
    this.telemetry.liquidStepSidewaysCandidateMinChunkX = sidewaysCandidateBounds?.minChunkX ?? null;
    this.telemetry.liquidStepSidewaysCandidateMinChunkY = sidewaysCandidateBounds?.minChunkY ?? null;
    this.telemetry.liquidStepSidewaysCandidateMaxChunkX = sidewaysCandidateBounds?.maxChunkX ?? null;
    this.telemetry.liquidStepSidewaysCandidateMaxChunkY = sidewaysCandidateBounds?.maxChunkY ?? null;
    this.telemetry.liquidStepDownwardActiveChunksScanned = stats.downwardActiveChunksScanned;
    this.telemetry.liquidStepSidewaysCandidateChunksScanned = stats.sidewaysCandidateChunksScanned;
    this.telemetry.liquidStepSidewaysPairsTested = stats.sidewaysPairsTested;
    this.telemetry.liquidStepDownwardTransfersApplied = stats.downwardTransfersApplied;
    this.telemetry.liquidStepSidewaysTransfersApplied = stats.sidewaysTransfersApplied;
    this.telemetry.liquidStepPhaseSummary = resolveLiquidStepPhaseSummary(stats);
  }

  private getReadyChunkMesh(chunkX: number, chunkY: number): ChunkGpuMesh | null {
    const key = chunkKey(chunkX, chunkY);
    const cached = this.meshes.get(key);
    if (!cached) return null;
    return cached.state === 'ready' ? cached.mesh : null;
  }

  private clearMeshCaches(): void {
    for (const cached of this.meshes.values()) {
      if (cached.state === 'ready' && cached.mesh) {
        this.gl.deleteVertexArray(cached.mesh.vao);
        this.gl.deleteBuffer(cached.mesh.buffer);
      }
    }
    this.meshes.clear();
    this.meshBuildQueue = [];
  }

  private ensureWorldChunksResident(bounds: ChunkBounds): void {
    for (let y = bounds.minChunkY; y <= bounds.maxChunkY; y += 1) {
      for (let x = bounds.minChunkX; x <= bounds.maxChunkX; x += 1) {
        this.world.ensureChunk(x, y);
      }
    }
  }

  private invalidateChunkMesh(chunkX: number, chunkY: number): void {
    const key = chunkKey(chunkX, chunkY);
    const cached = this.meshes.get(key);
    if (!cached) return;

    if (cached.state === 'queued') {
      this.promoteQueuedMeshBuild(key);
      if (!this.meshBuildQueue.some((request) => request.key === key)) {
        this.meshBuildQueue.unshift({ key, chunkX, chunkY });
      }
      return;
    }

    if (cached.state === 'ready' && cached.mesh) {
      this.gl.deleteVertexArray(cached.mesh.vao);
      this.gl.deleteBuffer(cached.mesh.buffer);
    }

    cached.state = 'queued';
    cached.mesh = null;
    this.meshBuildQueue.unshift({ key, chunkX, chunkY });
  }

  private scheduleMeshBuilds(drawBounds: ChunkBounds, retainBounds: ChunkBounds): void {
    for (let y = drawBounds.minChunkY; y <= drawBounds.maxChunkY; y += 1) {
      for (let x = drawBounds.minChunkX; x <= drawBounds.maxChunkX; x += 1) {
        this.enqueueMeshBuild(x, y, 'visible');
      }
    }

    for (let y = retainBounds.minChunkY; y <= retainBounds.maxChunkY; y += 1) {
      for (let x = retainBounds.minChunkX; x <= retainBounds.maxChunkX; x += 1) {
        if (chunkBoundsContains(drawBounds, x, y)) continue;
        this.enqueueMeshBuild(x, y, 'prefetch');
      }
    }
  }

  private enqueueMeshBuild(chunkX: number, chunkY: number, priority: 'visible' | 'prefetch'): void {
    const key = chunkKey(chunkX, chunkY);
    const cached = this.meshes.get(key);
    if (cached) {
      if (cached.state === 'queued' && priority === 'visible') {
        this.promoteQueuedMeshBuild(key);
      }
      return;
    }

    this.meshes.set(key, { chunkX, chunkY, state: 'queued', mesh: null });
    const request = { key, chunkX, chunkY };
    if (priority === 'visible') {
      this.meshBuildQueue.unshift(request);
      return;
    }
    this.meshBuildQueue.push(request);
  }

  private promoteQueuedMeshBuild(key: string): void {
    const requestIndex = this.meshBuildQueue.findIndex((request) => request.key === key);
    if (requestIndex <= 0) return;
    const [request] = this.meshBuildQueue.splice(requestIndex, 1);
    if (!request) return;
    this.meshBuildQueue.unshift(request);
  }

  private processMeshBuildQueue(): void {
    if (this.meshBuildQueue.length === 0) return;

    const frameStart = performance.now();
    let builtThisFrame = 0;

    while (builtThisFrame < MESH_BUILD_QUEUE_CHUNK_BUDGET && this.meshBuildQueue.length > 0) {
      if (builtThisFrame > 0 && performance.now() - frameStart >= MESH_BUILD_QUEUE_TIME_BUDGET_MS) {
        break;
      }

      const nextRequest = this.meshBuildQueue.shift();
      if (!nextRequest) break;

      const cached = this.meshes.get(nextRequest.key);
      if (!cached || cached.state !== 'queued') continue;

      this.buildQueuedChunkMesh(nextRequest, cached);
      builtThisFrame += 1;
    }
  }

  private buildQueuedChunkMesh(request: MeshBuildRequest, cached: CachedChunkMesh): void {
    const chunk = this.world.ensureChunk(request.chunkX, request.chunkY);
    const meshBuildStart = performance.now();
    const meshData = buildChunkMesh(chunk, {
      sampleNeighborhoodInto: (chunkX, chunkY, localX, localY, target) =>
        void this.world.sampleLocalTileNeighborhoodInto(chunkX, chunkY, localX, localY, target),
      sampleLiquidLevel: (worldTileX, worldTileY) => this.world.getLiquidLevel(worldTileX, worldTileY)
    });
    this.telemetry.meshBuildTimeMs += performance.now() - meshBuildStart;
    this.telemetry.meshBuilds += 1;

    if (meshData.vertexCount === 0) {
      cached.state = 'empty';
      cached.mesh = null;
      return;
    }

    const animatedMesh = createAnimatedChunkMeshState(meshData.vertices, meshData.animatedTileQuads);
    const buffer = animatedMesh
      ? createDynamicVertexBuffer(this.gl, meshData.vertices)
      : createStaticVertexBuffer(this.gl, meshData.vertices);
    const vao = createVertexArray(this.gl, buffer, CHUNK_MESH_FLOATS_PER_VERTEX, {
      includeLightAttribute: true
    });
    cached.state = 'ready';
    cached.mesh = { buffer, vao, vertexCount: meshData.vertexCount, animatedMesh };
  }

  private updateAnimatedChunkMesh(mesh: ChunkGpuMesh, timeMs: number): void {
    if (!mesh.animatedMesh) {
      return;
    }

    const changedFrame = applyAnimatedChunkMeshFrameAtElapsedMs(mesh.animatedMesh, timeMs, TILE_METADATA);
    if (changedFrame.changedQuadCount === 0) {
      return;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh.animatedMesh.vertices, this.gl.DYNAMIC_DRAW);
    this.telemetry.animatedChunkUvUploadCount += 1;
    this.telemetry.animatedChunkUvUploadQuadCount += changedFrame.changedQuadCount;
    this.telemetry.animatedChunkUvUploadLiquidQuadCount += changedFrame.changedLiquidQuadCount;
    this.telemetry.animatedChunkUvUploadBytes += mesh.animatedMesh.vertices.byteLength;
  }

  private drawEntityPass(
    entities: RendererEntityFrameState[],
    renderAlpha: number,
    worldToClipMatrix: Float32Array,
    timeMs: number
  ): void {
    for (const entity of entities) {
      switch (entity.kind) {
        case 'standalone-player':
          this.drawStandalonePlayer(entity, renderAlpha, worldToClipMatrix, timeMs);
          break;
        case 'slime':
          this.drawHostileSlime(entity, renderAlpha, worldToClipMatrix);
          break;
        case 'bunny':
          this.drawPassiveBunny(entity, renderAlpha, worldToClipMatrix);
          break;
        case 'dropped-item':
          this.drawDroppedItem(entity, renderAlpha, worldToClipMatrix);
          break;
        case 'wand-firebolt':
          this.drawFirebolt(entity, renderAlpha, worldToClipMatrix);
          break;
      }
    }
  }

  private drawStandalonePlayer(
    entity: StandalonePlayerEntityFrameState,
    renderAlpha: number,
    worldToClipMatrix: Float32Array,
    timeMs: number
  ): void {
    const state = entity.snapshot.current;
    const renderPosition = resolveInterpolatedEntityWorldPosition(entity.snapshot, renderAlpha);
    const wallContact = state.wallContact;
    const ceilingContact = state.ceilingContact;
    const gl = this.gl;
    const poseIndex = getStandalonePlayerPlaceholderPoseIndex(state, {
      elapsedMs: timeMs,
      wallContact,
      ceilingContact,
      ceilingBonkActive: isStandalonePlayerRenderStateCeilingBonkActive(state, timeMs)
    });
    gl.useProgram(this.playerProgram);
    gl.uniformMatrix4fv(this.uPlayerMatrix, false, worldToClipMatrix);
    gl.uniform1f(this.uPlayerFacingSign, getStandalonePlayerPlaceholderRenderFacingSign(state, poseIndex, wallContact));
    gl.uniform1f(this.uPlayerPoseIndex, poseIndex);
    const nearbyLightSample = getStandalonePlayerPlaceholderNearbyLightSample(
      this.world,
      state,
      renderPosition
    );
    const nearbyLightLevel = nearbyLightSample.level;
    const nearbyLightFactor = nearbyLightLevel / MAX_LIGHT_LEVEL;
    const nearbyLightSourceTile = nearbyLightSample.sourceTile;
    const nearbyLightSourceChunk =
      nearbyLightSourceTile === null
        ? null
        : worldToChunkCoord(nearbyLightSourceTile.x, nearbyLightSourceTile.y);
    const nearbyLightSourceLocalTile =
      nearbyLightSourceTile === null
        ? null
        : worldToLocalTile(nearbyLightSourceTile.x, nearbyLightSourceTile.y);
    this.telemetry.standalonePlayerNearbyLightLevel = nearbyLightLevel;
    this.telemetry.standalonePlayerNearbyLightFactor = nearbyLightFactor;
    this.telemetry.standalonePlayerNearbyLightSourceTileX = nearbyLightSourceTile?.x ?? null;
    this.telemetry.standalonePlayerNearbyLightSourceTileY = nearbyLightSourceTile?.y ?? null;
    this.telemetry.standalonePlayerNearbyLightSourceChunkX = nearbyLightSourceChunk?.chunkX ?? null;
    this.telemetry.standalonePlayerNearbyLightSourceChunkY = nearbyLightSourceChunk?.chunkY ?? null;
    this.telemetry.standalonePlayerNearbyLightSourceLocalTileX = nearbyLightSourceLocalTile?.localX ?? null;
    this.telemetry.standalonePlayerNearbyLightSourceLocalTileY = nearbyLightSourceLocalTile?.localY ?? null;
    gl.uniform1f(this.uPlayerLight, nearbyLightFactor);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.standalonePlayerBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      buildStandalonePlayerPlaceholderVertices(state, renderPosition),
      gl.DYNAMIC_DRAW
    );
    gl.bindVertexArray(this.standalonePlayerVao);
    gl.drawArrays(gl.TRIANGLES, 0, STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT);
    this.telemetry.drawCalls += 1;
  }

  private drawHostileSlime(
    entity: HostileSlimeEntityFrameState,
    renderAlpha: number,
    worldToClipMatrix: Float32Array
  ): void {
    const state = entity.snapshot.current;
    const renderPosition = resolveInterpolatedEntityWorldPosition(entity.snapshot, renderAlpha);
    const gl = this.gl;
    gl.useProgram(this.slimeProgram);
    gl.uniformMatrix4fv(this.uSlimeMatrix, false, worldToClipMatrix);
    gl.uniform1f(this.uSlimeFacingSign, getHostileSlimePlaceholderFacingSign(state));
    const nearbyLightSample = getHostileSlimePlaceholderNearbyLightSample(
      this.world,
      state,
      renderPosition
    );
    gl.uniform1f(this.uSlimeLight, nearbyLightSample.level / MAX_LIGHT_LEVEL);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.hostileSlimeBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      buildHostileSlimePlaceholderVertices(state, renderPosition),
      gl.DYNAMIC_DRAW
    );
    gl.bindVertexArray(this.hostileSlimeVao);
    gl.drawArrays(gl.TRIANGLES, 0, HOSTILE_SLIME_PLACEHOLDER_VERTEX_COUNT);
    this.telemetry.drawCalls += 1;
  }

  private drawPassiveBunny(
    entity: PassiveBunnyEntityFrameState,
    renderAlpha: number,
    worldToClipMatrix: Float32Array
  ): void {
    const state = entity.snapshot.current;
    const renderPosition = resolveInterpolatedEntityWorldPosition(entity.snapshot, renderAlpha);
    const gl = this.gl;
    gl.useProgram(this.bunnyProgram);
    gl.uniformMatrix4fv(this.uBunnyMatrix, false, worldToClipMatrix);
    gl.uniform1f(this.uBunnyFacingSign, getPassiveBunnyPlaceholderFacingSign(state));
    const nearbyLightSample = getPassiveBunnyPlaceholderNearbyLightSample(
      this.world,
      state,
      renderPosition
    );
    gl.uniform1f(this.uBunnyLight, nearbyLightSample.level / MAX_LIGHT_LEVEL);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.passiveBunnyBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      buildPassiveBunnyPlaceholderVertices(state, renderPosition),
      gl.DYNAMIC_DRAW
    );
    gl.bindVertexArray(this.passiveBunnyVao);
    gl.drawArrays(gl.TRIANGLES, 0, PASSIVE_BUNNY_PLACEHOLDER_VERTEX_COUNT);
    this.telemetry.drawCalls += 1;
  }

  private drawDroppedItem(
    entity: DroppedItemEntityFrameState,
    renderAlpha: number,
    worldToClipMatrix: Float32Array
  ): void {
    const state = entity.snapshot.current;
    const renderPosition = resolveInterpolatedEntityWorldPosition(entity.snapshot, renderAlpha);
    const gl = this.gl;
    const nearbyLightSample = getDroppedItemPlaceholderNearbyLightSample(
      this.world,
      state,
      renderPosition
    );
    const palette = getDroppedItemPlaceholderPalette(state.itemId);
    gl.useProgram(this.droppedItemProgram);
    gl.uniformMatrix4fv(this.uDroppedItemMatrix, false, worldToClipMatrix);
    gl.uniform1f(this.uDroppedItemLight, nearbyLightSample.level / MAX_LIGHT_LEVEL);
    gl.uniform3f(
      this.uDroppedItemBaseColor,
      palette.baseColor[0],
      palette.baseColor[1],
      palette.baseColor[2]
    );
    gl.uniform3f(
      this.uDroppedItemAccentColor,
      palette.accentColor[0],
      palette.accentColor[1],
      palette.accentColor[2]
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this.droppedItemBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      buildDroppedItemPlaceholderVertices(state, renderPosition),
      gl.DYNAMIC_DRAW
    );
    gl.bindVertexArray(this.droppedItemVao);
    gl.drawArrays(gl.TRIANGLES, 0, DROPPED_ITEM_PLACEHOLDER_VERTEX_COUNT);
    this.telemetry.drawCalls += 1;
  }

  private drawFirebolt(
    entity: FireboltEntityFrameState,
    renderAlpha: number,
    worldToClipMatrix: Float32Array
  ): void {
    const state = entity.snapshot.current;
    const renderPosition = resolveInterpolatedEntityWorldPosition(entity.snapshot, renderAlpha);
    const gl = this.gl;
    const nearbyLightSample = getFireboltPlaceholderNearbyLightSample(
      this.world,
      state,
      renderPosition
    );
    gl.useProgram(this.droppedItemProgram);
    gl.uniformMatrix4fv(this.uDroppedItemMatrix, false, worldToClipMatrix);
    gl.uniform1f(
      this.uDroppedItemLight,
      Math.max(0.65, nearbyLightSample.level / MAX_LIGHT_LEVEL)
    );
    gl.uniform3f(this.uDroppedItemBaseColor, 0.34, 0.48, 0.95);
    gl.uniform3f(this.uDroppedItemAccentColor, 1, 0.84, 0.42);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fireboltBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      buildFireboltPlaceholderVertices(state, renderPosition),
      gl.DYNAMIC_DRAW
    );
    gl.bindVertexArray(this.fireboltVao);
    gl.drawArrays(gl.TRIANGLES, 0, FIREBOLT_PLACEHOLDER_VERTEX_COUNT);
    this.telemetry.drawCalls += 1;
  }

  private updateAnimatedChunkResidencyTelemetry(): void {
    let residentAnimatedChunkMeshes = 0;
    let residentAnimatedChunkQuadCount = 0;
    let residentAnimatedLiquidChunkQuadCount = 0;

    for (const cached of this.meshes.values()) {
      if (cached.state !== 'ready' || !cached.mesh?.animatedMesh) {
        continue;
      }

      residentAnimatedChunkMeshes += 1;
      for (const animatedTile of cached.mesh.animatedMesh.animatedTiles) {
        residentAnimatedChunkQuadCount += 1;
        if (animatedTile.liquidCardinalMask !== undefined) {
          residentAnimatedLiquidChunkQuadCount += 1;
        }
      }
    }

    this.telemetry.residentAnimatedChunkMeshes = residentAnimatedChunkMeshes;
    this.telemetry.residentAnimatedChunkQuadCount = residentAnimatedChunkQuadCount;
    this.telemetry.residentAnimatedLiquidChunkQuadCount = residentAnimatedLiquidChunkQuadCount;
  }

  private pruneStreamingCaches(retainBounds: ChunkBounds): void {
    let evictedMeshEntries = 0;
    for (const [key, cached] of this.meshes) {
      if (chunkBoundsContains(retainBounds, cached.chunkX, cached.chunkY)) continue;
      if (cached.state === 'ready' && cached.mesh) {
        this.gl.deleteVertexArray(cached.mesh.vao);
        this.gl.deleteBuffer(cached.mesh.buffer);
      }
      this.meshes.delete(key);
      evictedMeshEntries += 1;
    }

    if (this.meshBuildQueue.length > 0) {
      this.meshBuildQueue = this.meshBuildQueue.filter((request) => {
        if (!chunkBoundsContains(retainBounds, request.chunkX, request.chunkY)) return false;
        const cached = this.meshes.get(request.key);
        return cached?.state === 'queued';
      });
    }

    this.telemetry.evictedMeshEntries = evictedMeshEntries;
    this.telemetry.evictedWorldChunks = this.world.pruneChunksOutside(retainBounds);
  }
}
