import { Camera2D } from '../core/camera2d';
import { createStaticVertexBuffer, createVertexArray } from './buffer';
import { createProgram } from './shader';
import {
  buildStandalonePlayerPlaceholderVertices,
  getStandalonePlayerPlaceholderFacingSign,
  STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT,
  STANDALONE_PLAYER_PLACEHOLDER_VERTEX_FLOAT_COUNT
} from './standalonePlayerPlaceholder';
import type { AtlasImageLoadResult } from './texture';
import { createTextureFromImageSource, loadAtlasImageSource } from './texture';
import { collectAtlasUvRectBoundsWarnings } from './atlasValidation';
import { TILE_SIZE } from '../world/constants';
import {
  affectedChunkCoordsForLocalTileEdit,
  chunkBoundsContains,
  chunkCoordBounds,
  chunkKey,
  expandChunkBounds
} from '../world/chunkMath';
import type { ChunkBounds } from '../world/chunkMath';
import { buildChunkMesh } from '../world/mesher';
import { TILE_METADATA } from '../world/tileMetadata';
import {
  findPlayerSpawnPoint as findWorldPlayerSpawnPoint,
  type PlayerSpawnPoint,
  type PlayerSpawnSearchOptions
} from '../world/playerSpawn';
import {
  respawnPlayerStateAtSpawnIfEmbeddedInSolid as respawnWorldPlayerStateAtSpawnIfEmbeddedInSolid,
  stepPlayerState as stepWorldPlayerState,
  stepPlayerStateWithGravity as stepWorldPlayerStateWithGravity,
  type PlayerMovementIntent,
  type PlayerState
} from '../world/playerState';
import { TileWorld } from '../world/world';

interface ChunkGpuMesh {
  buffer: WebGLBuffer;
  vao: WebGLVertexArrayObject;
  vertexCount: number;
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
  standalonePlayer?: PlayerState | null;
}

export interface RenderTelemetry {
  atlasSourceKind: AtlasImageLoadResult['sourceKind'] | 'pending';
  atlasWidth: number | null;
  atlasHeight: number | null;
  atlasValidationWarningCount: number | null;
  atlasValidationFirstWarning: string | null;
  renderedChunks: number;
  drawCalls: number;
  drawCallBudget: number;
  meshBuilds: number;
  meshBuildBudget: number;
  meshBuildTimeMs: number;
  meshBuildQueueLength: number;
  residentWorldChunks: number;
  cachedChunkMeshes: number;
  evictedWorldChunks: number;
  evictedMeshEntries: number;
}

const DRAW_CALL_BUDGET = 256;
const MESH_BUILD_QUEUE_CHUNK_BUDGET = 4;
const MESH_BUILD_QUEUE_TIME_BUDGET_MS = 3;
const FRUSTUM_PADDING_CHUNKS = 1;
const STREAM_RETAIN_PADDING_CHUNKS = 3;
const AUTHORED_TILE_ATLAS_URL = '/atlas/tile-atlas.png';

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
  private world = new TileWorld();
  private meshes = new Map<string, CachedChunkMesh>();
  private meshBuildQueue: MeshBuildRequest[] = [];
  private uMatrix: WebGLUniformLocation;
  private uPlayerMatrix: WebGLUniformLocation;
  private uPlayerFacingSign: WebGLUniformLocation;
  private texture: WebGLTexture | null = null;
  private standalonePlayerBuffer: WebGLBuffer;
  private standalonePlayerVao: WebGLVertexArrayObject;

  readonly telemetry: RenderTelemetry = {
    atlasSourceKind: 'pending',
    atlasWidth: null,
    atlasHeight: null,
    atlasValidationWarningCount: null,
    atlasValidationFirstWarning: null,
    renderedChunks: 0,
    drawCalls: 0,
    drawCallBudget: DRAW_CALL_BUDGET,
    meshBuilds: 0,
    meshBuildBudget: MESH_BUILD_QUEUE_CHUNK_BUDGET,
    meshBuildTimeMs: 0,
    meshBuildQueueLength: 0,
    residentWorldChunks: 0,
    cachedChunkMeshes: 0,
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
      uniform mat4 u_matrix;
      out vec2 v_uv;
      void main() {
        v_uv = a_uv;
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
      }`,
      `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      uniform sampler2D u_atlas;
      out vec4 outColor;
      void main() {
        outColor = texture(u_atlas, v_uv);
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
      out vec4 outColor;
      void main() {
        vec2 uv = v_uv;
        if (u_facingSign < 0.0) {
          uv.x = 1.0 - uv.x;
        }

        vec3 color = vec3(0.98, 0.72, 0.34);
        if (uv.x < 0.08 || uv.x > 0.92 || uv.y < 0.04 || uv.y > 0.96) {
          color = vec3(0.24, 0.14, 0.06);
        } else if (uv.y > 0.68 && abs(uv.x - 0.5) < 0.05) {
          color = vec3(0.24, 0.14, 0.06);
        } else if (uv.x > 0.58 && uv.x < 0.84 && uv.y > 0.18 && uv.y < 0.34) {
          color = vec3(0.99, 0.95, 0.82);
        } else if (uv.x > 0.64 && uv.x < 0.74 && uv.y > 0.22 && uv.y < 0.30) {
          color = vec3(0.12, 0.09, 0.06);
        } else if (uv.y > 0.34 && uv.y < 0.54 && uv.x > 0.2 && uv.x < 0.34) {
          color = vec3(0.84, 0.43, 0.16);
        }

        outColor = vec4(color, 1.0);
      }`
    );

    const playerMatrix = gl.getUniformLocation(this.playerProgram, 'u_matrix');
    if (!playerMatrix) throw new Error('Missing uniform u_matrix');
    this.uPlayerMatrix = playerMatrix;

    const playerFacingSign = gl.getUniformLocation(this.playerProgram, 'u_facingSign');
    if (!playerFacingSign) throw new Error('Missing uniform u_facingSign');
    this.uPlayerFacingSign = playerFacingSign;

    this.standalonePlayerBuffer = createDynamicVertexBuffer(
      gl,
      new Float32Array(STANDALONE_PLAYER_PLACEHOLDER_VERTEX_FLOAT_COUNT)
    );
    this.standalonePlayerVao = createVertexArray(gl, this.standalonePlayerBuffer, 4);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.world.onTileEdited(({ chunkX, chunkY, localX, localY }) => {
      for (const coord of affectedChunkCoordsForLocalTileEdit(chunkX, chunkY, localX, localY)) {
        this.invalidateChunkMesh(coord.x, coord.y);
      }
    });
  }

  async initialize(): Promise<void> {
    const atlas = await loadAtlasImageSource(AUTHORED_TILE_ATLAS_URL);
    this.texture = createTextureFromImageSource(this.gl, atlas.imageSource);
    this.telemetry.atlasSourceKind = atlas.sourceKind;
    this.telemetry.atlasWidth = atlas.width;
    this.telemetry.atlasHeight = atlas.height;
    const atlasWarnings = collectAtlasUvRectBoundsWarnings(TILE_METADATA.tiles, atlas.width, atlas.height);
    this.telemetry.atlasValidationWarningCount = atlasWarnings.length;
    this.telemetry.atlasValidationFirstWarning = atlasWarnings[0]?.summary ?? null;
    if (atlasWarnings.length > 0) {
      console.warn(
        `[Renderer] Atlas uvRect validation found ${atlasWarnings.length} warning(s) for ${atlas.sourceKind} atlas ${atlas.width}x${atlas.height}.\n` +
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
    this.telemetry.renderedChunks = 0;
    this.telemetry.drawCalls = 0;
    this.telemetry.meshBuilds = 0;
    this.telemetry.meshBuildTimeMs = 0;
    this.telemetry.meshBuildQueueLength = this.meshBuildQueue.length;
    this.telemetry.evictedWorldChunks = 0;
    this.telemetry.evictedMeshEntries = 0;
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

    this.scheduleMeshBuilds(drawBounds, retainBounds);
    this.processMeshBuildQueue();

    for (let y = drawBounds.minChunkY; y <= drawBounds.maxChunkY; y += 1) {
      for (let x = drawBounds.minChunkX; x <= drawBounds.maxChunkX; x += 1) {
        const mesh = this.getReadyChunkMesh(x, y);
        if (!mesh) continue;
        gl.bindVertexArray(mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
        this.telemetry.renderedChunks += 1;
        this.telemetry.drawCalls += 1;
      }
    }

    if (frameState.standalonePlayer) {
      this.drawStandalonePlayer(frameState.standalonePlayer, worldToClipMatrix);
    }

    gl.bindVertexArray(null);
    this.pruneStreamingCaches(retainBounds);
    this.telemetry.residentWorldChunks = this.world.getChunkCount();
    this.telemetry.cachedChunkMeshes = this.meshes.size;
    this.telemetry.meshBuildQueueLength = this.meshBuildQueue.length;
  }

  setTile(worldTileX: number, worldTileY: number, tileId: number): boolean {
    return this.world.setTile(worldTileX, worldTileY, tileId);
  }

  getTile(worldTileX: number, worldTileY: number): number {
    return this.world.getTile(worldTileX, worldTileY);
  }

  findPlayerSpawnPoint(options: PlayerSpawnSearchOptions): PlayerSpawnPoint | null {
    return findWorldPlayerSpawnPoint(this.world, options);
  }

  stepPlayerStateWithGravity(state: PlayerState, fixedDtSeconds: number): PlayerState {
    return stepWorldPlayerStateWithGravity(this.world, state, fixedDtSeconds);
  }

  stepPlayerState(state: PlayerState, fixedDtSeconds: number, intent: PlayerMovementIntent): PlayerState {
    return stepWorldPlayerState(this.world, state, fixedDtSeconds, intent);
  }

  respawnPlayerStateAtSpawnIfEmbeddedInSolid(
    state: PlayerState,
    spawn: PlayerSpawnPoint | null
  ): PlayerState {
    return respawnWorldPlayerStateAtSpawnIfEmbeddedInSolid(this.world, state, spawn);
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

  private getReadyChunkMesh(chunkX: number, chunkY: number): ChunkGpuMesh | null {
    const key = chunkKey(chunkX, chunkY);
    const cached = this.meshes.get(key);
    if (!cached) return null;
    return cached.state === 'ready' ? cached.mesh : null;
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
        void this.world.sampleLocalTileNeighborhoodInto(chunkX, chunkY, localX, localY, target)
    });
    this.telemetry.meshBuildTimeMs += performance.now() - meshBuildStart;
    this.telemetry.meshBuilds += 1;

    if (meshData.vertexCount === 0) {
      cached.state = 'empty';
      cached.mesh = null;
      return;
    }

    const buffer = createStaticVertexBuffer(this.gl, meshData.vertices);
    const vao = createVertexArray(this.gl, buffer, 4);
    cached.state = 'ready';
    cached.mesh = { buffer, vao, vertexCount: meshData.vertexCount };
  }

  private drawStandalonePlayer(state: PlayerState, worldToClipMatrix: Float32Array): void {
    const gl = this.gl;
    gl.useProgram(this.playerProgram);
    gl.uniformMatrix4fv(this.uPlayerMatrix, false, worldToClipMatrix);
    gl.uniform1f(this.uPlayerFacingSign, getStandalonePlayerPlaceholderFacingSign(state));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.standalonePlayerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buildStandalonePlayerPlaceholderVertices(state), gl.DYNAMIC_DRAW);
    gl.bindVertexArray(this.standalonePlayerVao);
    gl.drawArrays(gl.TRIANGLES, 0, STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT);
    this.telemetry.drawCalls += 1;
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
