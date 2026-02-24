import { TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT } from './autotile';
import { TILE_ATLAS_COLUMNS, TILE_ATLAS_ROWS } from './constants';
import rawTileMetadata from './tileMetadata.json';

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

export interface TileRenderMetadata {
  atlasIndex?: number;
  uvRect?: TileUvRect;
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
}

export interface TileMetadataRegistry {
  tiles: readonly TileMetadataEntry[];
  tilesById: ReadonlyMap<number, TileMetadataEntry>;
  gameplayPropertyLookup: TileGameplayPropertyLookup;
  terrainConnectivityLookup: TileTerrainConnectivityLookup;
}

export interface TileGameplayPropertyLookup {
  propertyFlagsByTileId: Uint8Array;
  liquidKindCodeByTileId: Int8Array;
}

export interface TileTerrainConnectivityLookup {
  connectivityGroupIdByTileId: Int32Array;
  materialTagMaskByTileId: readonly bigint[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const expectInteger = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  return value;
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

const ATLAS_TILE_CAPACITY = TILE_ATLAS_COLUMNS * TILE_ATLAS_ROWS;

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

const parseTileRenderMetadata = (value: unknown, tileId: number): TileRenderMetadata => {
  if (!isRecord(value)) {
    throw new Error(`tiles[${tileId}].render must be an object`);
  }

  const hasAtlasIndex = value.atlasIndex !== undefined;
  const hasUvRect = value.uvRect !== undefined;
  if (hasAtlasIndex === hasUvRect) {
    throw new Error(`tiles[${tileId}].render must define exactly one of atlasIndex or uvRect`);
  }

  if (hasAtlasIndex) {
    return {
      atlasIndex: expectAtlasIndex(value.atlasIndex, `tiles[${tileId}].render.atlasIndex`)
    };
  }

  return {
    uvRect: parseTileUvRect(value.uvRect, `tiles[${tileId}].render.uvRect`)
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

const TILE_GAMEPLAY_PROPERTY_FLAG_SOLID = 1 << 0;
const TILE_GAMEPLAY_PROPERTY_FLAG_BLOCKS_LIGHT = 1 << 1;

const TILE_LIQUID_KIND_CODE_NONE = -1;
const TILE_LIQUID_KIND_CODE_WATER = 0;
const TILE_LIQUID_KIND_CODE_LAVA = 1;

const TERRAIN_CONNECTIVITY_GROUP_ID_NON_TERRAIN = -1;
const TERRAIN_CONNECTIVITY_GROUP_ID_UNGROUPED_TERRAIN = -2;

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

const getTerrainMaterialTagMask = (tileId: number, registry: TileMetadataRegistry): bigint => {
  const { materialTagMaskByTileId } = registry.terrainConnectivityLookup;
  if (!isDenseLookupTileIdInRange(tileId, materialTagMaskByTileId.length)) {
    return 0n;
  }

  return materialTagMaskByTileId[tileId] ?? 0n;
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
          : parseTerrainAutotileMetadata(terrainAutotileValue, tileId)
    };

    if (tileId !== 0 && !parsedTile.render && !parsedTile.terrainAutotile) {
      throw new Error(`tiles[${index}] (id ${tileId}) must define render or terrainAutotile metadata`);
    }

    tiles.push(parsedTile);
    tilesById.set(tileId, parsedTile);
  }

  return {
    tiles,
    tilesById,
    gameplayPropertyLookup: buildTileGameplayPropertyLookup(tiles),
    terrainConnectivityLookup: buildTileTerrainConnectivityLookup(tiles)
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

export const resolveTerrainAutotileVariantAtlasIndex = (
  tileId: number,
  cardinalVariantIndex: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number | null => {
  const terrainAutotile = getTileMetadata(tileId, registry)?.terrainAutotile;
  if (!terrainAutotile) return null;
  if (!Number.isInteger(cardinalVariantIndex)) return null;
  if (
    cardinalVariantIndex < 0 ||
    cardinalVariantIndex >= terrainAutotile.placeholderVariantAtlasByCardinalMask.length
  ) {
    return null;
  }

  return terrainAutotile.placeholderVariantAtlasByCardinalMask[cardinalVariantIndex] ?? null;
};

export const atlasIndexToUvRect = (atlasIndex: number): TileUvRect => {
  const col = atlasIndex % TILE_ATLAS_COLUMNS;
  const row = Math.floor(atlasIndex / TILE_ATLAS_COLUMNS);
  return {
    u0: col / TILE_ATLAS_COLUMNS,
    v0: row / TILE_ATLAS_ROWS,
    u1: (col + 1) / TILE_ATLAS_COLUMNS,
    v1: (row + 1) / TILE_ATLAS_ROWS
  };
};

export const resolveTileRenderUvRect = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => {
  const render = getTileMetadata(tileId, registry)?.render;
  if (!render) return null;
  if (render.atlasIndex !== undefined) return atlasIndexToUvRect(render.atlasIndex);
  return render.uvRect ?? null;
};

export const resolveTerrainAutotileVariantUvRect = (
  tileId: number,
  cardinalVariantIndex: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileUvRect | null => {
  const atlasIndex = resolveTerrainAutotileVariantAtlasIndex(tileId, cardinalVariantIndex, registry);
  return atlasIndex === null ? null : atlasIndexToUvRect(atlasIndex);
};
