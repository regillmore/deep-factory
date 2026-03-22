import {
  AUTHORED_ATLAS_REGION_COUNT,
  AUTHORED_ATLAS_UV_RECTS
} from './authoredAtlasLayout';
import type { TileUvRect } from './tileMetadata';
import rawWallMetadata from './wallMetadata.json';

export interface WallRenderMetadata {
  atlasIndex?: number;
  uvRect?: TileUvRect;
}

export interface WallMetadataEntry {
  id: number;
  name: string;
  render?: WallRenderMetadata;
}

export interface WallMetadataRegistry {
  walls: readonly WallMetadataEntry[];
  wallsById: ReadonlyMap<number, WallMetadataEntry>;
  renderLookup: WallRenderLookup;
}

export interface WallRenderLookup {
  staticUvRectByWallId: readonly (TileUvRect | null)[];
}

const ATLAS_INDEX_UV_RECT_CACHE: readonly TileUvRect[] = AUTHORED_ATLAS_UV_RECTS;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const expectInteger = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }

  return value;
};

const expectNonNegativeInteger = (value: unknown, label: string): number => {
  const parsed = expectInteger(value, label);
  if (parsed < 0) {
    throw new Error(`${label} must be >= 0`);
  }

  return parsed;
};

const expectNonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
};

const expectFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectAtlasIndex = (value: unknown, label: string): number => {
  const atlasIndex = expectInteger(value, label);
  if (atlasIndex < 0 || atlasIndex >= AUTHORED_ATLAS_REGION_COUNT) {
    throw new Error(`${label} must be between 0 and ${AUTHORED_ATLAS_REGION_COUNT - 1}`);
  }

  return atlasIndex;
};

const parseWallUvRect = (value: unknown, label: string): TileUvRect => {
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

const parseWallRenderMetadata = (value: unknown, label: string): WallRenderMetadata => {
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
    uvRect: parseWallUvRect(value.uvRect, `${label}.uvRect`)
  };
};

const resolveWallRenderUvRectFromMetadata = (render: WallRenderMetadata): TileUvRect => {
  if (render.atlasIndex !== undefined) {
    return ATLAS_INDEX_UV_RECT_CACHE[render.atlasIndex]!;
  }

  return render.uvRect!;
};

const parseWallMetadataEntry = (value: unknown, index: number): WallMetadataEntry => {
  if (!isRecord(value)) {
    throw new Error(`walls[${index}] must be an object`);
  }

  const id = expectNonNegativeInteger(value.id, `walls[${index}].id`);
  const name = expectNonEmptyString(value.name, `walls[${index}].name`);
  const render =
    value.render === undefined ? undefined : parseWallRenderMetadata(value.render, `walls[${index}].render`);

  if (id !== 0 && render === undefined) {
    throw new Error(`walls[${index}].render is required for non-empty wall ${id}`);
  }

  return {
    id,
    name,
    ...(render === undefined ? {} : { render })
  };
};

const buildWallRenderLookup = (walls: readonly WallMetadataEntry[]): WallRenderLookup => {
  let maxWallId = 0;
  for (const wall of walls) {
    if (wall.id > maxWallId) {
      maxWallId = wall.id;
    }
  }

  const staticUvRectByWallId = Array<TileUvRect | null>(maxWallId + 1).fill(null);
  for (const wall of walls) {
    staticUvRectByWallId[wall.id] = wall.render ? resolveWallRenderUvRectFromMetadata(wall.render) : null;
  }

  return {
    staticUvRectByWallId
  };
};

export const parseWallMetadataRegistry = (value: unknown): WallMetadataRegistry => {
  if (!isRecord(value)) {
    throw new Error('wall metadata must be an object');
  }

  if (!Array.isArray(value.walls)) {
    throw new Error('wall metadata .walls must be an array');
  }

  const walls = value.walls.map((entry, index) => parseWallMetadataEntry(entry, index));
  const wallsById = new Map<number, WallMetadataEntry>();
  for (const wall of walls) {
    if (wallsById.has(wall.id)) {
      throw new Error(`wall metadata contains duplicate wall id ${wall.id}`);
    }

    wallsById.set(wall.id, wall);
  }

  return {
    walls,
    wallsById,
    renderLookup: buildWallRenderLookup(walls)
  };
};

const getStaticWallRenderUvRect = (
  wallId: number,
  registry: WallMetadataRegistry
): TileUvRect | null => {
  if (!Number.isInteger(wallId) || wallId < 0 || wallId >= registry.renderLookup.staticUvRectByWallId.length) {
    return null;
  }

  return registry.renderLookup.staticUvRectByWallId[wallId] ?? null;
};

export const WALL_METADATA: WallMetadataRegistry = parseWallMetadataRegistry(rawWallMetadata);

export const getWallMetadata = (
  wallId: number,
  registry: WallMetadataRegistry = WALL_METADATA
): WallMetadataEntry | null => registry.wallsById.get(wallId) ?? null;

export const resolveWallRenderUvRect = (
  wallId: number,
  registry: WallMetadataRegistry = WALL_METADATA
): TileUvRect | null => getStaticWallRenderUvRect(wallId, registry);
