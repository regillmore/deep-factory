import { buildAutotileAdjacencyMask } from './autotile';
import { AUTHORED_ATLAS_HEIGHT, AUTHORED_ATLAS_WIDTH } from './authoredAtlasLayout';
import { CHUNK_SIZE, TILE_SIZE } from './constants';
import { toTileIndex } from './chunkMath';
import {
  areLiquidRenderNeighborsConnected,
  TILE_METADATA,
  areTerrainAutotileNeighborsConnected,
  hasAnimatedLiquidRenderVariantMetadata,
  hasAnimatedTileRenderMetadata,
  hasLiquidRenderMetadata,
  hasTerrainAutotileMetadata,
  resolveLiquidRenderCardinalMaskFromNeighborhood,
  resolveLiquidRenderVariantUvRect,
  resolveTerrainAutotileUvRectByRawAdjacencyMask,
  resolveTileRenderUvRect
} from './tileMetadata';
import type { TileMetadataRegistry, TileUvRect } from './tileMetadata';
import type { Chunk } from './types';
import {
  resolveLiquidSurfaceBottomVCrops,
  resolveLiquidSurfaceTopHeights,
  type LiquidSurfaceTopHeights
} from './liquidSurface';
import type { TileNeighborhood } from './world';

export interface ChunkMeshData {
  vertices: Float32Array;
  vertexCount: number;
  animatedTileQuads: readonly AnimatedTileQuad[];
}

export interface AnimatedTileQuad {
  tileId: number;
  vertexFloatOffset: number;
  liquidCardinalMask?: number;
  liquidTopHeights?: LiquidSurfaceTopHeights;
}

export interface ChunkMeshBuildOptions {
  sampleNeighborhood?: (
    chunkX: number,
    chunkY: number,
    localX: number,
    localY: number
  ) => TileNeighborhood;
  sampleNeighborhoodInto?: (
    chunkX: number,
    chunkY: number,
    localX: number,
    localY: number,
    target: TileNeighborhood
  ) => void;
  sampleLiquidLevel?: (worldTileX: number, worldTileY: number) => number;
  tileMetadataRegistry?: TileMetadataRegistry;
}

export const CHUNK_MESH_FLOATS_PER_VERTEX = 5;
export const CHUNK_MESH_UV_FLOAT_OFFSET = 2;
export const CHUNK_MESH_LIGHT_FLOAT_OFFSET = 4;
const VERTICES_PER_TILE_QUAD = 6;
const FLOATS_PER_TILE_QUAD = CHUNK_MESH_FLOATS_PER_VERTEX * VERTICES_PER_TILE_QUAD;
const ATLAS_HALF_TEXEL_U = 0.5 / AUTHORED_ATLAS_WIDTH;
const ATLAS_HALF_TEXEL_V = 0.5 / AUTHORED_ATLAS_HEIGHT;

const insetUvAxisForAtlasSampling = (
  start: number,
  end: number,
  halfTexelSize: number
): [start: number, end: number] => {
  const span = Math.max(0, end - start);
  const inset = Math.min(halfTexelSize, span * 0.5);
  return [start + inset, end - inset];
};

export const insetTileUvRectForAtlasSampling = (uvRect: TileUvRect): TileUvRect => {
  const [u0, u1] = insetUvAxisForAtlasSampling(uvRect.u0, uvRect.u1, ATLAS_HALF_TEXEL_U);
  const [v0, v1] = insetUvAxisForAtlasSampling(uvRect.v0, uvRect.v1, ATLAS_HALF_TEXEL_V);

  return { u0, v0, u1, v1 };
};

const usesTerrainAutotile = (tileId: number, tileMetadataRegistry: TileMetadataRegistry): boolean =>
  hasTerrainAutotileMetadata(tileId, tileMetadataRegistry);
const usesLiquidRender = (tileId: number, tileMetadataRegistry: TileMetadataRegistry): boolean =>
  hasLiquidRenderMetadata(tileId, tileMetadataRegistry);
const usesAnimatedTileRender = (tileId: number, tileMetadataRegistry: TileMetadataRegistry): boolean =>
  !usesTerrainAutotile(tileId, tileMetadataRegistry) &&
  !usesLiquidRender(tileId, tileMetadataRegistry) &&
  hasAnimatedTileRenderMetadata(tileId, tileMetadataRegistry);
const usesAnimatedLiquidRenderVariant = (
  tileId: number,
  cardinalMask: number,
  tileMetadataRegistry: TileMetadataRegistry
): boolean => hasAnimatedLiquidRenderVariantMetadata(tileId, cardinalMask, tileMetadataRegistry);

interface ResolvedChunkTileRender {
  uvRect: TileUvRect;
  liquidCardinalMask: number | null;
}

const countNonEmptyTiles = (chunk: Chunk): number => {
  let count = 0;
  for (let index = 0; index < chunk.tiles.length; index += 1) {
    if (chunk.tiles[index] !== 0) {
      count += 1;
    }
  }

  return count;
};

const createTileNeighborhoodScratch = (): TileNeighborhood => ({
  center: 0,
  north: 0,
  northEast: 0,
  east: 0,
  southEast: 0,
  south: 0,
  southWest: 0,
  west: 0,
  northWest: 0
});

const resolveChunkTileNeighborhood = (
  chunk: Chunk,
  localX: number,
  localY: number,
  sampleNeighborhood?: ChunkMeshBuildOptions['sampleNeighborhood'],
  sampleNeighborhoodInto?: ChunkMeshBuildOptions['sampleNeighborhoodInto'],
  neighborhoodScratch?: TileNeighborhood
): TileNeighborhood | null => {
  if (sampleNeighborhoodInto && neighborhoodScratch) {
    sampleNeighborhoodInto(chunk.coord.x, chunk.coord.y, localX, localY, neighborhoodScratch);
    return neighborhoodScratch;
  }

  if (sampleNeighborhood) {
    return sampleNeighborhood(chunk.coord.x, chunk.coord.y, localX, localY);
  }

  return null;
};

const tryResolveChunkLocalLiquidLevel = (
  chunk: Chunk,
  localX: number,
  localY: number
): number | null => {
  if (localX < 0 || localX >= CHUNK_SIZE || localY < 0 || localY >= CHUNK_SIZE) {
    return null;
  }

  return chunk.liquidLevels[toTileIndex(localX, localY)] ?? 0;
};

const resolveChunkTileLiquidLevel = (
  chunk: Chunk,
  localX: number,
  localY: number,
  sampleLiquidLevel?: ChunkMeshBuildOptions['sampleLiquidLevel']
): number => {
  const localLiquidLevel = tryResolveChunkLocalLiquidLevel(chunk, localX, localY);
  if (localLiquidLevel !== null) {
    return localLiquidLevel;
  }

  if (!sampleLiquidLevel) {
    return 0;
  }

  return sampleLiquidLevel(chunk.coord.x * CHUNK_SIZE + localX, chunk.coord.y * CHUNK_SIZE + localY);
};

const resolveChunkTileRender = (
  tileId: number,
  tileMetadataRegistry: TileMetadataRegistry,
  neighborhood: TileNeighborhood | null
): ResolvedChunkTileRender => {
  if (usesTerrainAutotile(tileId, tileMetadataRegistry)) {
    const terrainRenderOverride = resolveTileRenderUvRect(tileId, tileMetadataRegistry);
    if (terrainRenderOverride) {
      return { uvRect: terrainRenderOverride, liquidCardinalMask: null };
    }

    if (!neighborhood) {
      const isolatedTerrainUvRect = resolveTerrainAutotileUvRectByRawAdjacencyMask(
        tileId,
        0,
        tileMetadataRegistry
      );
      if (isolatedTerrainUvRect) return { uvRect: isolatedTerrainUvRect, liquidCardinalMask: null };
      throw new Error(`Missing terrain autotile metadata for tile ${tileId}`);
    }

    const rawMask = buildAutotileAdjacencyMask(neighborhood, (centerTileId, neighborTileId) =>
      areTerrainAutotileNeighborsConnected(centerTileId, neighborTileId, tileMetadataRegistry)
    );
    const terrainUvRect = resolveTerrainAutotileUvRectByRawAdjacencyMask(
      tileId,
      rawMask,
      tileMetadataRegistry
    );
    if (terrainUvRect) return { uvRect: terrainUvRect, liquidCardinalMask: null };
    throw new Error(`Missing terrain autotile variant metadata for tile ${tileId}`);
  }

  if (usesLiquidRender(tileId, tileMetadataRegistry)) {
    const liquidCardinalMask =
      neighborhood === null
        ? 0
        : resolveLiquidRenderCardinalMaskFromNeighborhood(neighborhood, tileMetadataRegistry);
    const liquidUvRect = resolveLiquidRenderVariantUvRect(
      tileId,
      liquidCardinalMask,
      tileMetadataRegistry
    );
    if (liquidUvRect) return { uvRect: liquidUvRect, liquidCardinalMask };
    throw new Error(`Missing liquid render variant metadata for tile ${tileId}`);
  }

  const staticUvRect = resolveTileRenderUvRect(tileId, tileMetadataRegistry);
  if (staticUvRect) return { uvRect: staticUvRect, liquidCardinalMask: null };
  throw new Error(`Missing tile render metadata for tile ${tileId}`);
};

const resolveConnectedLiquidNeighborLevel = (
  chunk: Chunk,
  tileId: number,
  neighborTileId: number,
  neighborLocalX: number,
  neighborLocalY: number,
  tileMetadataRegistry: TileMetadataRegistry,
  sampleLiquidLevel?: ChunkMeshBuildOptions['sampleLiquidLevel']
): number => {
  if (!areLiquidRenderNeighborsConnected(tileId, neighborTileId, tileMetadataRegistry)) {
    return 0;
  }

  return resolveChunkTileLiquidLevel(chunk, neighborLocalX, neighborLocalY, sampleLiquidLevel);
};

const resolveChunkTileLiquidTopHeights = (
  chunk: Chunk,
  localX: number,
  localY: number,
  tileId: number,
  tileMetadataRegistry: TileMetadataRegistry,
  neighborhood: TileNeighborhood | null,
  sampleLiquidLevel?: ChunkMeshBuildOptions['sampleLiquidLevel']
) => {
  const centerLevel = resolveChunkTileLiquidLevel(chunk, localX, localY, sampleLiquidLevel);
  if (!neighborhood) {
    return resolveLiquidSurfaceTopHeights({
      center: centerLevel,
      north: 0,
      east: 0,
      west: 0
    });
  }

  return resolveLiquidSurfaceTopHeights({
    center: centerLevel,
    north: resolveConnectedLiquidNeighborLevel(
      chunk,
      tileId,
      neighborhood.north,
      localX,
      localY - 1,
      tileMetadataRegistry,
      sampleLiquidLevel
    ),
    east: resolveConnectedLiquidNeighborLevel(
      chunk,
      tileId,
      neighborhood.east,
      localX + 1,
      localY,
      tileMetadataRegistry,
      sampleLiquidLevel
    ),
    west: resolveConnectedLiquidNeighborLevel(
      chunk,
      tileId,
      neighborhood.west,
      localX - 1,
      localY,
      tileMetadataRegistry,
      sampleLiquidLevel
    )
  });
};

export const setChunkMeshTileQuadUvRect = (
  vertices: Float32Array,
  vertexFloatOffset: number,
  uvRect: TileUvRect,
  liquidTopHeights: LiquidSurfaceTopHeights | null = null
): void => {
  // Sample from texel centers instead of exact atlas edges so fractional screen scaling
  // cannot pull color from tightly packed neighboring atlas regions.
  const sampledUvRect = insetTileUvRectForAtlasSampling(uvRect);
  const { u0, v0, u1, v1 } = sampledUvRect;
  const vertex0UvOffset = vertexFloatOffset + CHUNK_MESH_UV_FLOAT_OFFSET;
  const vertex1UvOffset = vertex0UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const vertex2UvOffset = vertex1UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const vertex3UvOffset = vertex2UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const vertex4UvOffset = vertex3UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const vertex5UvOffset = vertex4UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const topLeftV = v0;
  const topRightV = v0;
  const bottomVCrops =
    liquidTopHeights === null
      ? null
      : resolveLiquidSurfaceBottomVCrops(sampledUvRect, liquidTopHeights);
  const bottomLeftV =
    bottomVCrops === null ? v1 : bottomVCrops.bottomLeftV;
  const bottomRightV =
    bottomVCrops === null ? v1 : bottomVCrops.bottomRightV;

  vertices[vertex0UvOffset] = u0;
  vertices[vertex0UvOffset + 1] = topLeftV;
  vertices[vertex1UvOffset] = u1;
  vertices[vertex1UvOffset + 1] = topRightV;
  vertices[vertex2UvOffset] = u1;
  vertices[vertex2UvOffset + 1] = bottomRightV;
  vertices[vertex3UvOffset] = u0;
  vertices[vertex3UvOffset + 1] = topLeftV;
  vertices[vertex4UvOffset] = u1;
  vertices[vertex4UvOffset + 1] = bottomRightV;
  vertices[vertex5UvOffset] = u0;
  vertices[vertex5UvOffset + 1] = bottomLeftV;
};

export const buildChunkMesh = (chunk: Chunk, options: ChunkMeshBuildOptions = {}): ChunkMeshData => {
  const chunkOriginX = chunk.coord.x * CHUNK_SIZE * TILE_SIZE;
  const chunkOriginY = chunk.coord.y * CHUNK_SIZE * TILE_SIZE;
  const {
    sampleNeighborhood,
    sampleNeighborhoodInto,
    sampleLiquidLevel,
    tileMetadataRegistry = TILE_METADATA
  } = options;
  const nonEmptyTileCount = countNonEmptyTiles(chunk);
  if (nonEmptyTileCount === 0) {
    return { vertices: new Float32Array(0), vertexCount: 0, animatedTileQuads: [] };
  }

  const vertices = new Float32Array(nonEmptyTileCount * FLOATS_PER_TILE_QUAD);
  const animatedTileQuads: AnimatedTileQuad[] = [];
  let writeIndex = 0;
  const neighborhoodScratch = sampleNeighborhoodInto ? createTileNeighborhoodScratch() : undefined;

  for (let y = 0; y < CHUNK_SIZE; y += 1) {
    for (let x = 0; x < CHUNK_SIZE; x += 1) {
      const tileId = chunk.tiles[toTileIndex(x, y)];
      if (tileId === 0) continue;

      const neighborhood =
        usesTerrainAutotile(tileId, tileMetadataRegistry) || usesLiquidRender(tileId, tileMetadataRegistry)
          ? resolveChunkTileNeighborhood(
              chunk,
              x,
              y,
              sampleNeighborhood,
              sampleNeighborhoodInto,
              neighborhoodScratch
            )
          : null;
      const px = chunkOriginX + x * TILE_SIZE;
      const py = chunkOriginY + y * TILE_SIZE;
      const px1 = px + TILE_SIZE;
      const py1 = py + TILE_SIZE;
      const tileVertexFloatOffset = writeIndex;
      const resolvedRender = resolveChunkTileRender(tileId, tileMetadataRegistry, neighborhood);
      const lightLevel = chunk.lightLevels[toTileIndex(x, y)] ?? 0;
      const liquidTopHeights =
        resolvedRender.liquidCardinalMask === null
          ? null
          : resolveChunkTileLiquidTopHeights(
              chunk,
              x,
              y,
              tileId,
              tileMetadataRegistry,
              neighborhood,
              sampleLiquidLevel
            );
      const topLeftY = liquidTopHeights === null ? py : py1 - liquidTopHeights.topLeft * TILE_SIZE;
      const topRightY = liquidTopHeights === null ? py : py1 - liquidTopHeights.topRight * TILE_SIZE;
      if (resolvedRender.liquidCardinalMask !== null) {
        if (
          usesAnimatedLiquidRenderVariant(
            tileId,
            resolvedRender.liquidCardinalMask,
            tileMetadataRegistry
          )
        ) {
          animatedTileQuads.push({
            tileId,
            vertexFloatOffset: tileVertexFloatOffset,
            liquidCardinalMask: resolvedRender.liquidCardinalMask,
            liquidTopHeights: liquidTopHeights ?? undefined
          });
        }
      } else if (usesAnimatedTileRender(tileId, tileMetadataRegistry)) {
        animatedTileQuads.push({
          tileId,
          vertexFloatOffset: tileVertexFloatOffset
        });
      }

      vertices[writeIndex] = px;
      vertices[writeIndex + 1] = topLeftY;
      vertices[writeIndex + 4] = lightLevel;
      vertices[writeIndex + 5] = px1;
      vertices[writeIndex + 6] = topRightY;
      vertices[writeIndex + 9] = lightLevel;
      vertices[writeIndex + 10] = px1;
      vertices[writeIndex + 11] = py1;
      vertices[writeIndex + 14] = lightLevel;
      vertices[writeIndex + 15] = px;
      vertices[writeIndex + 16] = topLeftY;
      vertices[writeIndex + 19] = lightLevel;
      vertices[writeIndex + 20] = px1;
      vertices[writeIndex + 21] = py1;
      vertices[writeIndex + 24] = lightLevel;
      vertices[writeIndex + 25] = px;
      vertices[writeIndex + 26] = py1;
      vertices[writeIndex + 29] = lightLevel;
      setChunkMeshTileQuadUvRect(vertices, writeIndex, resolvedRender.uvRect, liquidTopHeights);
      writeIndex += FLOATS_PER_TILE_QUAD;
    }
  }

  return {
    vertices,
    vertexCount: writeIndex / CHUNK_MESH_FLOATS_PER_VERTEX,
    animatedTileQuads
  };
};
