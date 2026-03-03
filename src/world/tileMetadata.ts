import {
  buildAutotileCardinalMask,
  normalizeAutotileAdjacencyMask,
  TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK,
  TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
} from './autotile';
import {
  AUTHORED_ATLAS_REGION_COUNT,
  AUTHORED_ATLAS_UV_RECTS,
  getAuthoredAtlasRegionUvRect
} from './authoredAtlasLayout';
import rawTileMetadata from './tileMetadata.json';
import type { TileNeighborhood } from './world';

export interface TerrainAutotileTileMetadata {
  placeholderVariantAtlasByCardinalMask: readonly number[];
  connectivityGroup?: string;
}

export interface TileUvRect {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export interface TileRenderFrameMetadata {
  atlasIndex?: number;
  uvRect?: TileUvRect;
}

export interface TileRenderMetadata extends TileRenderFrameMetadata {
  frames?: readonly TileRenderFrameMetadata[];
  frameDurationMs?: number;
}

export const LIQUID_RENDER_CARDINAL_MASK_COUNT = 16;

export interface LiquidRenderTileMetadata {
  variantRenderByCardinalMask: readonly TileRenderMetadata[];
  connectivityGroup?: string;
}

export type TileLiquidKind = 'water' | 'lava';

export interface TileGameplayMetadata {
  solid: boolean;
  blocksLight: boolean;
  liquidKind?: TileLiquidKind;
}

export interface TileMetadataEntry {
  id: number;
  name: string;
  materialTags?: readonly string[];
  gameplay?: TileGameplayMetadata;
  render?: TileRenderMetadata;
  terrainAutotile?: TerrainAutotileTileMetadata;
  liquidRender?: LiquidRenderTileMetadata;
}

export interface TileMetadataRegistry {
  tiles: readonly TileMetadataEntry[];
  tilesById: ReadonlyMap<number, TileMetadataEntry>;
  gameplayPropertyLookup: TileGameplayPropertyLookup;
  terrainConnectivityLookup: TileTerrainConnectivityLookup;
  liquidConnectivityLookup: TileLiquidConnectivityLookup;
  renderLookup: TileRenderLookup;
}

export interface TileGameplayPropertyLookup {
  propertyFlagsByTileId: Uint8Array;
  liquidKindCodeByTileId: Int8Array;
}

export interface TileTerrainConnectivityLookup {
  connectivityGroupIdByTileId: Int32Array;
  materialTagMaskByTileId: readonly bigint[];
}

export interface TileLiquidConnectivityLookup {
  connectivityGroupIdByTileId: Int32Array;
}

export interface TileRenderLookup {
  staticUvRectByTileId: readonly (TileUvRect | null)[];
  animationFrameStartByTileId: Int32Array;
  animationFrameCountByTileId: Int32Array;
  animationFrameDurationMsByTileId: Uint32Array;
  animationFrameUvRects: readonly TileUvRect[];
  terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask: Int32Array;
  terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask: Int32Array;
  terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask: Int32Array;
  liquidVariantRenderByTileIdAndCardinalMask: readonly (TileRenderMetadata | null)[];
  liquidVariantStaticUvRectByTileIdAndCardinalMask: readonly (TileUvRect | null)[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const expectInteger = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  return value;
};

const expectPositiveInteger = (value: unknown, label: string): number => {
  const parsed = expectInteger(value, label);
  if (parsed <= 0) {
    throw new Error(`${label} must be > 0`);
  }

  return parsed;
};

const expectNonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
};

const expectBoolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
};

const expectFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
};

const ATLAS_TILE_CAPACITY = AUTHORED_ATLAS_REGION_COUNT;
const ATLAS_INDEX_UV_RECT_CACHE: readonly TileUvRect[] = AUTHORED_ATLAS_UV_RECTS;

const expectAtlasIndex = (value: unknown, label: string): number => {
  const atlasIndex = expectInteger(value, label);
  if (atlasIndex < 0 || atlasIndex >= ATLAS_TILE_CAPACITY) {
    throw new Error(`${label} must be between 0 and ${ATLAS_TILE_CAPACITY - 1}`);
  }
  return atlasIndex;
};

const parseTileUvRect = (value: unknown, label: string): TileUvRect => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  const u0 = expectFiniteNumber(value.u0, `${label}.u0`);
  const v0 = expectFiniteNumber(value.v0, `${label}.v0`);
  const u1 = expectFiniteNumber(value.u1, `${label}.u1`);
  const v1 = expectFiniteNumber(value.v1, `${label}.v1`);

  if (u0 < 0 || u0 > 1 || v0 < 0 || v0 > 1 || u1 < 0 || u1 > 1 || v1 < 0 || v1 > 1) {
    throw new Error(`${label} coordinates must be normalized between 0 and 1`);
  }
  if (u1 <= u0 || v1 <= v0) {
    throw new Error(`${label} must satisfy u0 < u1 and v0 < v1`);
  }

  return { u0, v0, u1, v1 };
};

const tileUvRectsMatch = (a: TileUvRect, b: TileUvRect): boolean =>
  a.u0 === b.u0 && a.v0 === b.v0 && a.u1 === b.u1 && a.v1 === b.v1;

const parseTileRenderFrameMetadata = (
  value: unknown,
  label: string
): TileRenderFrameMetadata => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  const hasAtlasIndex = value.atlasIndex !== undefined;
  const hasUvRect = value.uvRect !== undefined;
  if (hasAtlasIndex === hasUvRect) {
    throw new Error(`${label} must define exactly one of atlasIndex or uvRect`);
  }

  if (hasAtlasIndex) {
    return {
      atlasIndex: expectAtlasIndex(value.atlasIndex, `${label}.atlasIndex`)
    };
  }

  return {
    uvRect: parseTileUvRect(value.uvRect, `${label}.uvRect`)
  };
};

const resolveTileRenderFrameUvRect = (value: TileRenderFrameMetadata): TileUvRect => {
  if (value.atlasIndex !== undefined) {
    return ATLAS_INDEX_UV_RECT_CACHE[value.atlasIndex]!;
  }

  return value.uvRect!;
};

const formatTileRenderSourceCoordinate = (value: number): string => `${Math.round(value * 1000) / 1000}`;

export const describeTileRenderFrameSource = (
  value: TileRenderFrameMetadata | null | undefined
): string | null => {
  if (!value) {
    return null;
  }

  if (value.atlasIndex !== undefined) {
    return `atlasIndex ${value.atlasIndex}`;
  }

  const uvRect = value.uvRect;
  if (!uvRect) {
    return null;
  }

  return (
    `uvRect ${formatTileRenderSourceCoordinate(uvRect.u0)},` +
    `${formatTileRenderSourceCoordinate(uvRect.v0)}..` +
    `${formatTileRenderSourceCoordinate(uvRect.u1)},` +
    `${formatTileRenderSourceCoordinate(uvRect.v1)}`
  );
};

const parseMaterialTags = (value: unknown, tileId: number): readonly string[] => {
  if (!Array.isArray(value)) {
    throw new Error(`tiles[${tileId}].materialTags must be an array`);
  }

  const tags: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const tag = expectNonEmptyString(value[index], `tiles[${tileId}].materialTags[${index}]`);
    if (seen.has(tag)) {
      throw new Error(`tiles[${tileId}].materialTags contains duplicate tag "${tag}"`);
    }
    seen.add(tag);
    tags.push(tag);
  }

  return tags;
};

const parseTileGameplayMetadata = (value: unknown, tileId: number): TileGameplayMetadata => {
  if (!isRecord(value)) {
    throw new Error(`tiles[${tileId}].gameplay must be an object`);
  }

  const solid = expectBoolean(value.solid, `tiles[${tileId}].gameplay.solid`);
  const blocksLight = expectBoolean(value.blocksLight, `tiles[${tileId}].gameplay.blocksLight`);

  let liquidKind: TileLiquidKind | undefined;
  if (value.liquidKind !== undefined) {
    if (value.liquidKind !== 'water' && value.liquidKind !== 'lava') {
      throw new Error(`tiles[${tileId}].gameplay.liquidKind must be "water" or "lava"`);
    }
    if (solid) {
      throw new Error(`tiles[${tileId}].gameplay.liquidKind cannot be set when solid is true`);
    }
    liquidKind = value.liquidKind;
  }

  return liquidKind === undefined ? { solid, blocksLight } : { solid, blocksLight, liquidKind };
};

const parseTileRenderMetadata = (value: unknown, tileIdOrLabel: number | string): TileRenderMetadata => {
  const label =
    typeof tileIdOrLabel === 'number' ? `tiles[${tileIdOrLabel}].render` : tileIdOrLabel;
  const render = parseTileRenderFrameMetadata(value, label);
  const renderRecord = value as Record<string, unknown>;
  const hasFrames = renderRecord.frames !== undefined;
  const hasFrameDurationMs = renderRecord.frameDurationMs !== undefined;

  if (hasFrames !== hasFrameDurationMs) {
    throw new Error(`${label} must define both frames and frameDurationMs when animation metadata is present`);
  }

  if (!hasFrames) {
    return render;
  }

  if (!Array.isArray(renderRecord.frames)) {
    throw new Error(`${label}.frames must be an array`);
  }

  if (renderRecord.frames.length === 0) {
    throw new Error(`${label}.frames must contain at least one frame`);
  }

  const frames = renderRecord.frames.map((entry, frameIndex) =>
    parseTileRenderFrameMetadata(entry, `${label}.frames[${frameIndex}]`)
  );
  const staticUvRect = resolveTileRenderFrameUvRect(render);
  const firstFrameUvRect = resolveTileRenderFrameUvRect(frames[0]!);
  if (!tileUvRectsMatch(staticUvRect, firstFrameUvRect)) {
    throw new Error(`${label}.frames[0] must match the static render source`);
  }

  return {
    ...render,
    frames,
    frameDurationMs: expectPositiveInteger(renderRecord.frameDurationMs, `${label}.frameDurationMs`)
  };
};

const parseTerrainAutotileMetadata = (
  value: unknown,
  tileId: number
): TerrainAutotileTileMetadata => {
  if (!isRecord(value)) {
    throw new Error(`tiles[${tileId}].terrainAutotile must be an object`);
  }

  const variantMap = value.placeholderVariantAtlasByCardinalMask;
  if (!Array.isArray(variantMap)) {
    throw new Error(
      `tiles[${tileId}].terrainAutotile.placeholderVariantAtlasByCardinalMask must be an array`
    );
  }

  if (variantMap.length !== TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT) {
    throw new Error(
      `tiles[${tileId}] terrain variant map must have ${TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT} entries`
    );
  }

  const parsedVariantMap = variantMap.map((entry, cardinalMask) => {
    return expectAtlasIndex(
      entry,
      `tiles[${tileId}] terrain variant map entry ${cardinalMask} atlas index`
    );
  });

  return {
    placeholderVariantAtlasByCardinalMask: parsedVariantMap,
    connectivityGroup:
      value.connectivityGroup === undefined
        ? undefined
        : expectNonEmptyString(
            value.connectivityGroup,
            `tiles[${tileId}].terrainAutotile.connectivityGroup`
          )
  };
};

const parseLiquidRenderMetadata = (
  value: unknown,
  tileId: number
): LiquidRenderTileMetadata => {
  if (!isRecord(value)) {
    throw new Error(`tiles[${tileId}].liquidRender must be an object`);
  }

  const variantMap = value.variantRenderByCardinalMask;
  if (!Array.isArray(variantMap)) {
    throw new Error(`tiles[${tileId}].liquidRender.variantRenderByCardinalMask must be an array`);
  }

  if (variantMap.length !== LIQUID_RENDER_CARDINAL_MASK_COUNT) {
    throw new Error(
      `tiles[${tileId}].liquidRender.variantRenderByCardinalMask must have ${LIQUID_RENDER_CARDINAL_MASK_COUNT} entries`
    );
  }

  const parsedVariantMap = variantMap.map((entry, cardinalMask) =>
    parseTileRenderMetadata(
      entry,
      `tiles[${tileId}].liquidRender.variantRenderByCardinalMask[${cardinalMask}]`
    )
  );

  return {
    variantRenderByCardinalMask: parsedVariantMap,
    connectivityGroup:
      value.connectivityGroup === undefined
        ? undefined
        : expectNonEmptyString(
            value.connectivityGroup,
            `tiles[${tileId}].liquidRender.connectivityGroup`
          )
  };
};

const TILE_GAMEPLAY_PROPERTY_FLAG_SOLID = 1 << 0;
const TILE_GAMEPLAY_PROPERTY_FLAG_BLOCKS_LIGHT = 1 << 1;

const TILE_LIQUID_KIND_CODE_NONE = -1;
const TILE_LIQUID_KIND_CODE_WATER = 0;
const TILE_LIQUID_KIND_CODE_LAVA = 1;
const TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX = -1;
const TERRAIN_AUTOTILE_NORMALIZED_ADJACENCY_MASK_COUNT = 256;
const TERRAIN_AUTOTILE_RAW_ADJACENCY_MASK_COUNT = 256;

const TERRAIN_CONNECTIVITY_GROUP_ID_NON_TERRAIN = -1;
const TERRAIN_CONNECTIVITY_GROUP_ID_UNGROUPED_TERRAIN = -2;
const LIQUID_CONNECTIVITY_GROUP_ID_NON_LIQUID = -1;
const LIQUID_CONNECTIVITY_GROUP_ID_UNGROUPED_LIQUID = -2;

const encodeTileLiquidKindCode = (liquidKind: TileLiquidKind | undefined): number => {
  switch (liquidKind) {
    case 'water':
      return TILE_LIQUID_KIND_CODE_WATER;
    case 'lava':
      return TILE_LIQUID_KIND_CODE_LAVA;
    default:
      return TILE_LIQUID_KIND_CODE_NONE;
  }
};

const decodeTileLiquidKindCode = (liquidKindCode: number): TileLiquidKind | null => {
  if (liquidKindCode === TILE_LIQUID_KIND_CODE_WATER) return 'water';
  if (liquidKindCode === TILE_LIQUID_KIND_CODE_LAVA) return 'lava';
  return null;
};

const buildTileGameplayPropertyLookup = (
  tiles: readonly TileMetadataEntry[]
): TileGameplayPropertyLookup => {
  let maxTileId = 0;
  for (const tile of tiles) {
    if (tile.id > maxTileId) {
      maxTileId = tile.id;
    }
  }

  const propertyFlagsByTileId = new Uint8Array(maxTileId + 1);
  const liquidKindCodeByTileId = new Int8Array(maxTileId + 1);
  liquidKindCodeByTileId.fill(TILE_LIQUID_KIND_CODE_NONE);

  for (const tile of tiles) {
    const gameplay = tile.gameplay;
    if (!gameplay) continue;

    let flags = 0;
    if (gameplay.solid) {
      flags |= TILE_GAMEPLAY_PROPERTY_FLAG_SOLID;
    }
    if (gameplay.blocksLight) {
      flags |= TILE_GAMEPLAY_PROPERTY_FLAG_BLOCKS_LIGHT;
    }

    propertyFlagsByTileId[tile.id] = flags;
    liquidKindCodeByTileId[tile.id] = encodeTileLiquidKindCode(gameplay.liquidKind);
  }

  return {
    propertyFlagsByTileId,
    liquidKindCodeByTileId
  };
};

const buildTileTerrainConnectivityLookup = (
  tiles: readonly TileMetadataEntry[]
): TileTerrainConnectivityLookup => {
  let maxTileId = 0;
  for (const tile of tiles) {
    if (tile.id > maxTileId) {
      maxTileId = tile.id;
    }
  }

  const connectivityGroupIdByName = new Map<string, number>();
  const materialTagBitMaskByName = new Map<string, bigint>();
  let nextConnectivityGroupId = 0;
  let nextMaterialTagBitIndex = 0n;

  for (const tile of tiles) {
    const terrainAutotile = tile.terrainAutotile;
    if (!terrainAutotile) continue;

    const connectivityGroup = terrainAutotile.connectivityGroup;
    if (connectivityGroup !== undefined && !connectivityGroupIdByName.has(connectivityGroup)) {
      connectivityGroupIdByName.set(connectivityGroup, nextConnectivityGroupId);
      nextConnectivityGroupId += 1;
    }

    for (const materialTag of tile.materialTags ?? []) {
      if (!materialTagBitMaskByName.has(materialTag)) {
        materialTagBitMaskByName.set(materialTag, 1n << nextMaterialTagBitIndex);
        nextMaterialTagBitIndex += 1n;
      }
    }
  }

  const connectivityGroupIdByTileId = new Int32Array(maxTileId + 1);
  connectivityGroupIdByTileId.fill(TERRAIN_CONNECTIVITY_GROUP_ID_NON_TERRAIN);
  const materialTagMaskByTileId = Array<bigint>(maxTileId + 1).fill(0n);

  for (const tile of tiles) {
    const terrainAutotile = tile.terrainAutotile;
    if (!terrainAutotile) continue;

    const connectivityGroup = terrainAutotile.connectivityGroup;
    if (connectivityGroup === undefined) {
      connectivityGroupIdByTileId[tile.id] = TERRAIN_CONNECTIVITY_GROUP_ID_UNGROUPED_TERRAIN;
    } else {
      connectivityGroupIdByTileId[tile.id] = connectivityGroupIdByName.get(connectivityGroup)!;
    }

    let materialTagMask = 0n;
    for (const materialTag of tile.materialTags ?? []) {
      materialTagMask |= materialTagBitMaskByName.get(materialTag) ?? 0n;
    }
    materialTagMaskByTileId[tile.id] = materialTagMask;
  }

  return {
    connectivityGroupIdByTileId,
    materialTagMaskByTileId
  };
};

const buildTileLiquidConnectivityLookup = (
  tiles: readonly TileMetadataEntry[]
): TileLiquidConnectivityLookup => {
  let maxTileId = 0;
  for (const tile of tiles) {
    if (tile.id > maxTileId) {
      maxTileId = tile.id;
    }
  }

  const connectivityGroupIdByName = new Map<string, number>();
  let nextConnectivityGroupId = 0;

  for (const tile of tiles) {
    const liquidRender = tile.liquidRender;
    if (!liquidRender) continue;

    const connectivityGroup = liquidRender.connectivityGroup;
    if (connectivityGroup !== undefined && !connectivityGroupIdByName.has(connectivityGroup)) {
      connectivityGroupIdByName.set(connectivityGroup, nextConnectivityGroupId);
      nextConnectivityGroupId += 1;
    }
  }

  const connectivityGroupIdByTileId = new Int32Array(maxTileId + 1);
  connectivityGroupIdByTileId.fill(LIQUID_CONNECTIVITY_GROUP_ID_NON_LIQUID);

  for (const tile of tiles) {
    const liquidRender = tile.liquidRender;
    if (!liquidRender) continue;

    const connectivityGroup = liquidRender.connectivityGroup;
    connectivityGroupIdByTileId[tile.id] =
      connectivityGroup === undefined
        ? LIQUID_CONNECTIVITY_GROUP_ID_UNGROUPED_LIQUID
        : (connectivityGroupIdByName.get(connectivityGroup) ?? LIQUID_CONNECTIVITY_GROUP_ID_NON_LIQUID);
  }

  return {
    connectivityGroupIdByTileId
  };
};

const buildTileRenderLookup = (tiles: readonly TileMetadataEntry[]): TileRenderLookup => {
  let maxTileId = 0;
  for (const tile of tiles) {
    if (tile.id > maxTileId) {
      maxTileId = tile.id;
    }
  }

  const staticUvRectByTileId = Array<TileUvRect | null>(maxTileId + 1).fill(null);
  const animationFrameStartByTileId = new Int32Array(maxTileId + 1);
  animationFrameStartByTileId.fill(-1);
  const animationFrameCountByTileId = new Int32Array(maxTileId + 1);
  const animationFrameDurationMsByTileId = new Uint32Array(maxTileId + 1);
  const animationFrameUvRects: TileUvRect[] = [];
  const terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask = new Int32Array(
    (maxTileId + 1) * TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
  );
  const terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask = new Int32Array(
    (maxTileId + 1) * TERRAIN_AUTOTILE_NORMALIZED_ADJACENCY_MASK_COUNT
  );
  const terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask = new Int32Array(
    (maxTileId + 1) * TERRAIN_AUTOTILE_RAW_ADJACENCY_MASK_COUNT
  );
  const liquidVariantRenderByTileIdAndCardinalMask = Array<TileRenderMetadata | null>(
    (maxTileId + 1) * LIQUID_RENDER_CARDINAL_MASK_COUNT
  ).fill(null);
  const liquidVariantStaticUvRectByTileIdAndCardinalMask = Array<TileUvRect | null>(
    (maxTileId + 1) * LIQUID_RENDER_CARDINAL_MASK_COUNT
  ).fill(null);
  terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask.fill(TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX);
  terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask.fill(
    TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX
  );
  terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask.fill(TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX);

  for (const tile of tiles) {
    if (tile.render) {
      staticUvRectByTileId[tile.id] = resolveTileRenderFrameUvRect(tile.render);

      if (tile.render.frames && tile.render.frameDurationMs !== undefined) {
        animationFrameStartByTileId[tile.id] = animationFrameUvRects.length;
        animationFrameCountByTileId[tile.id] = tile.render.frames.length;
        animationFrameDurationMsByTileId[tile.id] = tile.render.frameDurationMs;
        for (const frame of tile.render.frames) {
          animationFrameUvRects.push(resolveTileRenderFrameUvRect(frame));
        }
      }
    }

    const variantMap = tile.terrainAutotile?.placeholderVariantAtlasByCardinalMask;
    if (variantMap) {
      const cardinalTableOffset = tile.id * TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT;
      for (let cardinalMask = 0; cardinalMask < variantMap.length; cardinalMask += 1) {
        terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask[cardinalTableOffset + cardinalMask] =
          variantMap[cardinalMask] ?? TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX;
      }

      const normalizedTableOffset = tile.id * TERRAIN_AUTOTILE_NORMALIZED_ADJACENCY_MASK_COUNT;
      for (
        let normalizedAdjacencyMask = 0;
        normalizedAdjacencyMask < TERRAIN_AUTOTILE_NORMALIZED_ADJACENCY_MASK_COUNT;
        normalizedAdjacencyMask += 1
      ) {
        const cardinalMask =
          TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK[normalizedAdjacencyMask] ??
          0;
        terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask[
          normalizedTableOffset + normalizedAdjacencyMask
        ] = variantMap[cardinalMask] ?? TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX;
      }

      const rawTableOffset = tile.id * TERRAIN_AUTOTILE_RAW_ADJACENCY_MASK_COUNT;
      for (
        let rawAdjacencyMask = 0;
        rawAdjacencyMask < TERRAIN_AUTOTILE_RAW_ADJACENCY_MASK_COUNT;
        rawAdjacencyMask += 1
      ) {
        const normalizedAdjacencyMask = normalizeAutotileAdjacencyMask(rawAdjacencyMask);
        terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask[
          rawTableOffset + rawAdjacencyMask
        ] =
          terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask[
            normalizedTableOffset + normalizedAdjacencyMask
          ] ?? TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX;
      }
    }

    const liquidVariantMap = tile.liquidRender?.variantRenderByCardinalMask;
    if (!liquidVariantMap) continue;

    const liquidTableOffset = tile.id * LIQUID_RENDER_CARDINAL_MASK_COUNT;
    for (let cardinalMask = 0; cardinalMask < liquidVariantMap.length; cardinalMask += 1) {
      const variantRender = liquidVariantMap[cardinalMask] ?? null;
      liquidVariantRenderByTileIdAndCardinalMask[liquidTableOffset + cardinalMask] = variantRender;
      liquidVariantStaticUvRectByTileIdAndCardinalMask[liquidTableOffset + cardinalMask] =
        variantRender === null ? null : resolveTileRenderFrameUvRect(variantRender);
    }
  }

  return {
    staticUvRectByTileId,
    animationFrameStartByTileId,
    animationFrameCountByTileId,
    animationFrameDurationMsByTileId,
    animationFrameUvRects,
    terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask,
    terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask,
    terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask,
    liquidVariantRenderByTileIdAndCardinalMask,
    liquidVariantStaticUvRectByTileIdAndCardinalMask
  };
};

const isDenseLookupTileIdInRange = (tileId: number, length: number): boolean =>
  Number.isInteger(tileId) && tileId >= 0 && tileId < length;

const getTileGameplayPropertyFlags = (
  tileId: number,
  registry: TileMetadataRegistry
): number => {
  const { propertyFlagsByTileId } = registry.gameplayPropertyLookup;
  if (!isDenseLookupTileIdInRange(tileId, propertyFlagsByTileId.length)) {
    return 0;
  }

  return propertyFlagsByTileId[tileId];
};

const getTileLiquidKindCode = (tileId: number, registry: TileMetadataRegistry): number => {
  const { liquidKindCodeByTileId } = registry.gameplayPropertyLookup;
  if (!isDenseLookupTileIdInRange(tileId, liquidKindCodeByTileId.length)) {
    return TILE_LIQUID_KIND_CODE_NONE;
  }

  return liquidKindCodeByTileId[tileId];
};

const getTerrainConnectivityGroupId = (tileId: number, registry: TileMetadataRegistry): number => {
  const { connectivityGroupIdByTileId } = registry.terrainConnectivityLookup;
  if (!isDenseLookupTileIdInRange(tileId, connectivityGroupIdByTileId.length)) {
    return TERRAIN_CONNECTIVITY_GROUP_ID_NON_TERRAIN;
  }

  return connectivityGroupIdByTileId[tileId];
};

const getLiquidConnectivityGroupId = (tileId: number, registry: TileMetadataRegistry): number => {
  const { connectivityGroupIdByTileId } = registry.liquidConnectivityLookup;
  if (!isDenseLookupTileIdInRange(tileId, connectivityGroupIdByTileId.length)) {
    return LIQUID_CONNECTIVITY_GROUP_ID_NON_LIQUID;
  }

  return connectivityGroupIdByTileId[tileId];
};

const getTerrainMaterialTagMask = (tileId: number, registry: TileMetadataRegistry): bigint => {
  const { materialTagMaskByTileId } = registry.terrainConnectivityLookup;
  if (!isDenseLookupTileIdInRange(tileId, materialTagMaskByTileId.length)) {
    return 0n;
  }

  return materialTagMaskByTileId[tileId] ?? 0n;
};

const getStaticTileRenderUvRect = (
  tileId: number,
  registry: TileMetadataRegistry
): TileUvRect | null => {
  const { staticUvRectByTileId } = registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, staticUvRectByTileId.length)) {
    return null;
  }

  return staticUvRectByTileId[tileId] ?? null;
};

const getLiquidVariantRenderMetadataFromLookup = (
  tileId: number,
  cardinalMask: number,
  registry: TileMetadataRegistry
): TileRenderMetadata | null => {
  if (!Number.isInteger(cardinalMask)) {
    return null;
  }
  if (cardinalMask < 0 || cardinalMask >= LIQUID_RENDER_CARDINAL_MASK_COUNT) {
    return null;
  }

  const { liquidVariantRenderByTileIdAndCardinalMask, staticUvRectByTileId } = registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, staticUvRectByTileId.length)) {
    return null;
  }

  return (
    liquidVariantRenderByTileIdAndCardinalMask[
      tileId * LIQUID_RENDER_CARDINAL_MASK_COUNT + cardinalMask
    ] ?? null
  );
};

const getLiquidVariantStaticUvRectFromLookup = (
  tileId: number,
  cardinalMask: number,
  registry: TileMetadataRegistry
): TileUvRect | null => {
  if (!Number.isInteger(cardinalMask)) {
    return null;
  }
  if (cardinalMask < 0 || cardinalMask >= LIQUID_RENDER_CARDINAL_MASK_COUNT) {
    return null;
  }

  const { liquidVariantStaticUvRectByTileIdAndCardinalMask, staticUvRectByTileId } = registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, staticUvRectByTileId.length)) {
    return null;
  }

  return (
    liquidVariantStaticUvRectByTileIdAndCardinalMask[
      tileId * LIQUID_RENDER_CARDINAL_MASK_COUNT + cardinalMask
    ] ?? null
  );
};

const getAnimatedTileRenderFrameCountFromLookup = (
  tileId: number,
  registry: TileMetadataRegistry
): number => {
  const { animationFrameCountByTileId } = registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, animationFrameCountByTileId.length)) {
    return 0;
  }

  return animationFrameCountByTileId[tileId] ?? 0;
};

const getAnimatedTileRenderFrameDurationMsFromLookup = (
  tileId: number,
  registry: TileMetadataRegistry
): number | null => {
  if (getAnimatedTileRenderFrameCountFromLookup(tileId, registry) === 0) {
    return null;
  }

  const { animationFrameDurationMsByTileId } = registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, animationFrameDurationMsByTileId.length)) {
    return null;
  }

  return animationFrameDurationMsByTileId[tileId] ?? null;
};

const getAnimatedTileRenderFrameUvRectFromLookup = (
  tileId: number,
  frameIndex: number,
  registry: TileMetadataRegistry
): TileUvRect | null => {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    return null;
  }

  const frameCount = getAnimatedTileRenderFrameCountFromLookup(tileId, registry);
  if (frameCount === 0 || frameIndex >= frameCount) {
    return null;
  }

  const { animationFrameStartByTileId, animationFrameUvRects } = registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, animationFrameStartByTileId.length)) {
    return null;
  }

  const frameStart = animationFrameStartByTileId[tileId] ?? -1;
  if (frameStart < 0) {
    return null;
  }

  return animationFrameUvRects[frameStart + frameIndex] ?? null;
};

const getAnimatedTileRenderFrameIndexAtElapsedMsFromLookup = (
  tileId: number,
  elapsedMs: number,
  registry: TileMetadataRegistry
): number | null => {
  if (!Number.isFinite(elapsedMs)) {
    return null;
  }

  const frameCount = getAnimatedTileRenderFrameCountFromLookup(tileId, registry);
  if (frameCount === 0) {
    return null;
  }

  const frameDurationMs = getAnimatedTileRenderFrameDurationMsFromLookup(tileId, registry);
  if (frameDurationMs === null || frameDurationMs <= 0) {
    return null;
  }

  const elapsedFrameSteps = Math.floor(elapsedMs / frameDurationMs);
  const wrappedFrameIndex = elapsedFrameSteps % frameCount;
  return wrappedFrameIndex >= 0 ? wrappedFrameIndex : wrappedFrameIndex + frameCount;
};

const getAnimatedTileRenderFrameUvRectAtElapsedMsFromLookup = (
  tileId: number,
  elapsedMs: number,
  registry: TileMetadataRegistry
): TileUvRect | null => {
  const frameIndex = getAnimatedTileRenderFrameIndexAtElapsedMsFromLookup(tileId, elapsedMs, registry);
  if (frameIndex === null) {
    return null;
  }

  return getAnimatedTileRenderFrameUvRectFromLookup(tileId, frameIndex, registry);
};

const getTerrainAutotileVariantAtlasIndexFromLookup = (
  tileId: number,
  cardinalVariantIndex: number,
  registry: TileMetadataRegistry
): number | null => {
  if (!Number.isInteger(cardinalVariantIndex)) return null;
  if (
    cardinalVariantIndex < 0 ||
    cardinalVariantIndex >= TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
  ) {
    return null;
  }

  const { staticUvRectByTileId, terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask } = registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, staticUvRectByTileId.length)) {
    return null;
  }

  const atlasIndex =
    terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask[
      tileId * TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT + cardinalVariantIndex
    ] ?? TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX;

  return atlasIndex === TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX ? null : atlasIndex;
};

const getTerrainAutotileVariantAtlasIndexFromNormalizedAdjacencyLookup = (
  tileId: number,
  normalizedAdjacencyMask: number,
  registry: TileMetadataRegistry
): number | null => {
  if (!Number.isInteger(normalizedAdjacencyMask)) return null;
  if (
    normalizedAdjacencyMask < 0 ||
    normalizedAdjacencyMask >= TERRAIN_AUTOTILE_NORMALIZED_ADJACENCY_MASK_COUNT
  ) {
    return null;
  }

  const { staticUvRectByTileId, terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask } =
    registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, staticUvRectByTileId.length)) {
    return null;
  }

  const atlasIndex =
    terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask[
      tileId * TERRAIN_AUTOTILE_NORMALIZED_ADJACENCY_MASK_COUNT + normalizedAdjacencyMask
    ] ?? TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX;

  return atlasIndex === TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX ? null : atlasIndex;
};

const getTerrainAutotileVariantAtlasIndexFromRawAdjacencyLookup = (
  tileId: number,
  rawAdjacencyMask: number,
  registry: TileMetadataRegistry
): number | null => {
  if (!Number.isInteger(rawAdjacencyMask)) return null;
  if (rawAdjacencyMask < 0 || rawAdjacencyMask >= TERRAIN_AUTOTILE_RAW_ADJACENCY_MASK_COUNT) {
    return null;
  }

  const { staticUvRectByTileId, terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask } =
    registry.renderLookup;
  if (!isDenseLookupTileIdInRange(tileId, staticUvRectByTileId.length)) {
    return null;
  }

  const atlasIndex =
    terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask[
      tileId * TERRAIN_AUTOTILE_RAW_ADJACENCY_MASK_COUNT + rawAdjacencyMask
    ] ?? TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX;

  return atlasIndex === TILE_RENDER_LOOKUP_MISSING_ATLAS_INDEX ? null : atlasIndex;
};

export const parseTileMetadataRegistry = (value: unknown): TileMetadataRegistry => {
  if (!isRecord(value)) {
    throw new Error('tile metadata root must be an object');
  }

  const rawTiles = value.tiles;
  if (!Array.isArray(rawTiles)) {
    throw new Error('tile metadata root must include a tiles array');
  }

  const tiles: TileMetadataEntry[] = [];
  const tilesById = new Map<number, TileMetadataEntry>();

  for (let index = 0; index < rawTiles.length; index += 1) {
    const rawTile = rawTiles[index];
    if (!isRecord(rawTile)) {
      throw new Error(`tiles[${index}] must be an object`);
    }

    const tileId = expectInteger(rawTile.id, `tiles[${index}].id`);
    if (tileId < 0) {
      throw new Error(`tiles[${index}].id must be >= 0`);
    }
    if (tilesById.has(tileId)) {
      throw new Error(`duplicate tile metadata id ${tileId}`);
    }

    const name = rawTile.name;
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error(`tiles[${index}].name must be a non-empty string`);
    }

    const materialTagsValue = rawTile.materialTags;
    const gameplayValue = rawTile.gameplay;
    const renderValue = rawTile.render;
    const terrainAutotileValue = rawTile.terrainAutotile;
    const liquidRenderValue = rawTile.liquidRender;
    const parsedTile: TileMetadataEntry = {
      id: tileId,
      name,
      materialTags:
        materialTagsValue === undefined ? undefined : parseMaterialTags(materialTagsValue, tileId),
      gameplay: gameplayValue === undefined ? undefined : parseTileGameplayMetadata(gameplayValue, tileId),
      render: renderValue === undefined ? undefined : parseTileRenderMetadata(renderValue, tileId),
      terrainAutotile:
        terrainAutotileValue === undefined
          ? undefined
          : parseTerrainAutotileMetadata(terrainAutotileValue, tileId),
      liquidRender:
        liquidRenderValue === undefined
          ? undefined
          : parseLiquidRenderMetadata(liquidRenderValue, tileId)
    };

    if (parsedTile.liquidRender && parsedTile.gameplay?.liquidKind === undefined) {
      throw new Error(`tiles[${index}] (id ${tileId}) liquidRender requires gameplay.liquidKind`);
    }
    if (parsedTile.liquidRender && parsedTile.terrainAutotile) {
      throw new Error(`tiles[${index}] (id ${tileId}) cannot define both terrainAutotile and liquidRender`);
    }
    if (tileId !== 0 && !parsedTile.render && !parsedTile.terrainAutotile && !parsedTile.liquidRender) {
      throw new Error(
        `tiles[${index}] (id ${tileId}) must define render, terrainAutotile, or liquidRender metadata`
      );
    }

    tiles.push(parsedTile);
    tilesById.set(tileId, parsedTile);
  }

  return {
    tiles,
    tilesById,
    gameplayPropertyLookup: buildTileGameplayPropertyLookup(tiles),
    terrainConnectivityLookup: buildTileTerrainConnectivityLookup(tiles),
    liquidConnectivityLookup: buildTileLiquidConnectivityLookup(tiles),
    renderLookup: buildTileRenderLookup(tiles)
  };
};

export const TILE_METADATA = parseTileMetadataRegistry(rawTileMetadata);

export const getTileMetadata = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileMetadataEntry | undefined => registry.tilesById.get(tileId);

const DEFAULT_TILE_GAMEPLAY_METADATA: TileGameplayMetadata = {
  solid: false,
  blocksLight: false
};

export const resolveTileGameplayMetadata = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileGameplayMetadata => {
  const flags = getTileGameplayPropertyFlags(tileId, registry);
  const liquidKind = decodeTileLiquidKindCode(getTileLiquidKindCode(tileId, registry));
  const solid = (flags & TILE_GAMEPLAY_PROPERTY_FLAG_SOLID) !== 0;
  const blocksLight = (flags & TILE_GAMEPLAY_PROPERTY_FLAG_BLOCKS_LIGHT) !== 0;

  if (!solid && !blocksLight && liquidKind === null) {
    return DEFAULT_TILE_GAMEPLAY_METADATA;
  }

  return liquidKind === null ? { solid, blocksLight } : { solid, blocksLight, liquidKind };
};

export const isTileSolid = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean =>
  (getTileGameplayPropertyFlags(tileId, registry) & TILE_GAMEPLAY_PROPERTY_FLAG_SOLID) !== 0;

export const doesTileBlockLight = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean =>
  (getTileGameplayPropertyFlags(tileId, registry) & TILE_GAMEPLAY_PROPERTY_FLAG_BLOCKS_LIGHT) !== 0;

export const getTileLiquidKind = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileLiquidKind | null => decodeTileLiquidKindCode(getTileLiquidKindCode(tileId, registry));

export const hasTerrainAutotileMetadata = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean =>
  getTerrainConnectivityGroupId(tileId, registry) !== TERRAIN_CONNECTIVITY_GROUP_ID_NON_TERRAIN;

export const hasLiquidRenderMetadata = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => getLiquidConnectivityGroupId(tileId, registry) !== LIQUID_CONNECTIVITY_GROUP_ID_NON_LIQUID;

export const areTerrainAutotileNeighborsConnected = (
  centerTileId: number,
  neighborTileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  if (centerTileId === 0 || neighborTileId === 0) return false;
  const centerConnectivityGroupId = getTerrainConnectivityGroupId(centerTileId, registry);
  const neighborConnectivityGroupId = getTerrainConnectivityGroupId(neighborTileId, registry);
  if (
    centerConnectivityGroupId === TERRAIN_CONNECTIVITY_GROUP_ID_NON_TERRAIN ||
    neighborConnectivityGroupId === TERRAIN_CONNECTIVITY_GROUP_ID_NON_TERRAIN
  ) {
    return false;
  }
  if (centerTileId === neighborTileId) return true;

  const centerHasConnectivityGroup = centerConnectivityGroupId >= 0;
  const neighborHasConnectivityGroup = neighborConnectivityGroupId >= 0;
  if (centerHasConnectivityGroup && neighborHasConnectivityGroup) {
    return centerConnectivityGroupId === neighborConnectivityGroupId;
  }

  return (
    (getTerrainMaterialTagMask(centerTileId, registry) & getTerrainMaterialTagMask(neighborTileId, registry)) !==
    0n
  );
};

export const areLiquidRenderNeighborsConnected = (
  centerTileId: number,
  neighborTileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  if (centerTileId === 0 || neighborTileId === 0) return false;
  const centerConnectivityGroupId = getLiquidConnectivityGroupId(centerTileId, registry);
  const neighborConnectivityGroupId = getLiquidConnectivityGroupId(neighborTileId, registry);
  if (
    centerConnectivityGroupId === LIQUID_CONNECTIVITY_GROUP_ID_NON_LIQUID ||
    neighborConnectivityGroupId === LIQUID_CONNECTIVITY_GROUP_ID_NON_LIQUID
  ) {
    return false;
  }
  if (centerTileId === neighborTileId) return true;

  const centerHasConnectivityGroup = centerConnectivityGroupId >= 0;
  const neighborHasConnectivityGroup = neighborConnectivityGroupId >= 0;
  if (centerHasConnectivityGroup && neighborHasConnectivityGroup) {
    return centerConnectivityGroupId === neighborConnectivityGroupId;
  }

  return false;
};

export const resolveLiquidRenderCardinalMaskFromNeighborhood = (
  neighborhood: TileNeighborhood,
  registry: TileMetadataRegistry = TILE_METADATA
): number =>
  buildAutotileCardinalMask(neighborhood, (centerTileId, neighborTileId) =>
    areLiquidRenderNeighborsConnected(centerTileId, neighborTileId, registry)
  );

export const resolveTerrainAutotileVariantAtlasIndex = (
  tileId: number,
  cardinalVariantIndex: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number | null =>
  getTerrainAutotileVariantAtlasIndexFromLookup(tileId, cardinalVariantIndex, registry);

export const resolveLiquidRenderVariantMetadata = (
  tileId: number,
  cardinalMask: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileRenderMetadata | null => getLiquidVariantRenderMetadataFromLookup(tileId, cardinalMask, registry);

export const describeLiquidRenderVariantSource = (
  tileId: number,
  cardinalMask: number,
  registry: TileMetadataRegistry = TILE_METADATA
): string | null =>
  describeTileRenderFrameSource(resolveLiquidRenderVariantMetadata(tileId, cardinalMask, registry));

export const resolveLiquidRenderVariantUvRect = (
  tileId: number,
  cardinalMask: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => getLiquidVariantStaticUvRectFromLookup(tileId, cardinalMask, registry);

export const resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask = (
  tileId: number,
  normalizedAdjacencyMask: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number | null =>
  getTerrainAutotileVariantAtlasIndexFromNormalizedAdjacencyLookup(
    tileId,
    normalizedAdjacencyMask,
    registry
  );

export const resolveTerrainAutotileAtlasIndexByRawAdjacencyMask = (
  tileId: number,
  rawAdjacencyMask: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number | null => getTerrainAutotileVariantAtlasIndexFromRawAdjacencyLookup(tileId, rawAdjacencyMask, registry);

export const atlasIndexToUvRect = (atlasIndex: number): TileUvRect => {
  const uvRect = getAuthoredAtlasRegionUvRect(atlasIndex);
  if (!uvRect) {
    throw new Error(`atlasIndexToUvRect expected atlas index between 0 and ${ATLAS_TILE_CAPACITY - 1}`);
  }

  return uvRect;
};

export const resolveTileRenderUvRect = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => getStaticTileRenderUvRect(tileId, registry);

export const hasAnimatedTileRenderMetadata = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => getAnimatedTileRenderFrameCountFromLookup(tileId, registry) > 0;

export const getAnimatedTileRenderFrameCount = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number => getAnimatedTileRenderFrameCountFromLookup(tileId, registry);

export const getAnimatedTileRenderFrameDurationMs = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number | null => getAnimatedTileRenderFrameDurationMsFromLookup(tileId, registry);

export const resolveAnimatedTileRenderFrameIndexAtElapsedMs = (
  tileId: number,
  elapsedMs: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number | null => getAnimatedTileRenderFrameIndexAtElapsedMsFromLookup(tileId, elapsedMs, registry);

export const resolveAnimatedTileRenderFrameUvRect = (
  tileId: number,
  frameIndex: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => getAnimatedTileRenderFrameUvRectFromLookup(tileId, frameIndex, registry);

export const resolveAnimatedTileRenderFrameUvRectAtElapsedMs = (
  tileId: number,
  elapsedMs: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => getAnimatedTileRenderFrameUvRectAtElapsedMsFromLookup(tileId, elapsedMs, registry);

export const resolveTerrainAutotileVariantUvRect = (
  tileId: number,
  cardinalVariantIndex: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => {
  const atlasIndex = resolveTerrainAutotileVariantAtlasIndex(tileId, cardinalVariantIndex, registry);
  return atlasIndex === null ? null : atlasIndexToUvRect(atlasIndex);
};

export const resolveTerrainAutotileUvRectByNormalizedAdjacencyMask = (
  tileId: number,
  normalizedAdjacencyMask: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => {
  const atlasIndex = resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask(
    tileId,
    normalizedAdjacencyMask,
    registry
  );
  return atlasIndex === null ? null : atlasIndexToUvRect(atlasIndex);
};

export const resolveTerrainAutotileUvRectByRawAdjacencyMask = (
  tileId: number,
  rawAdjacencyMask: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => {
  const atlasIndex = resolveTerrainAutotileAtlasIndexByRawAdjacencyMask(tileId, rawAdjacencyMask, registry);
  return atlasIndex === null ? null : atlasIndexToUvRect(atlasIndex);
};
