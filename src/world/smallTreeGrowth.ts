import { chunkCoordBounds } from './chunkMath';
import { decodeChunkDenseTilePayload, decodeChunkSparseTilePayload } from './chunkSnapshot';
import { CHUNK_SIZE } from './constants';
import {
  replaceSmallTreeGrowthStageAtAnchor,
  type SmallTreeFootprintWrite,
  type SmallTreeMutableWorldView
} from './smallTreeFootprintWrites';
import {
  GROWN_SMALL_TREE_LOCAL_OFFSETS,
  PLANTED_SMALL_TREE_LOCAL_OFFSETS
} from './smallTreeFootprints';
import {
  evaluateSmallTreeGrowthSiteAtAnchor,
  type SmallTreeGrowthSiteWorldView
} from './smallTreeGrowthSite';
import { getSmallTreeSaplingTileId } from './smallTreeTiles';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';
import type { TileWorldSnapshot } from './world';

export interface SmallTreeGrowthState {
  ticksUntilNextGrowth: number;
  nextWindowIndex: number;
}

export interface SmallTreeGrowthTrackedAnchor {
  anchorTileX: number;
  anchorTileY: number;
}

export interface GrownSmallTreeAnchor {
  anchorTileX: number;
  anchorTileY: number;
  writes: SmallTreeFootprintWrite[];
}

export interface SmallTreeGrowthStepResult {
  nextGrowthState: SmallTreeGrowthState;
  grownAnchors: GrownSmallTreeAnchor[];
}

export interface StepSmallTreeGrowthOptions {
  world: SmallTreeGrowthWorldView;
  growthState?: SmallTreeGrowthState;
  trackedAnchors?: readonly SmallTreeGrowthTrackedAnchor[] | null;
  growthIntervalTicks?: number;
  windowCount?: number;
  registry?: TileMetadataRegistry;
}

export interface SmallTreeGrowthWorldView
  extends SmallTreeGrowthSiteWorldView,
    SmallTreeMutableWorldView {}

export const DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS = 60;
export const DEFAULT_SMALL_TREE_GROWTH_WINDOW_COUNT = 4;

const expectInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }

  return value;
};

const expectPositiveInteger = (value: number, label: string): number => {
  const normalizedValue = expectInteger(value, label);
  if (normalizedValue <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }

  return normalizedValue;
};

const expectNonNegativeInteger = (value: number, label: string): number => {
  const normalizedValue = expectInteger(value, label);
  if (normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return normalizedValue;
};

const normalizeTrackedAnchor = (
  trackedAnchor: SmallTreeGrowthTrackedAnchor
): SmallTreeGrowthTrackedAnchor => ({
  anchorTileX: expectInteger(trackedAnchor.anchorTileX, 'trackedAnchor.anchorTileX'),
  anchorTileY: expectInteger(trackedAnchor.anchorTileY, 'trackedAnchor.anchorTileY')
});

const compareTrackedAnchors = (
  left: SmallTreeGrowthTrackedAnchor,
  right: SmallTreeGrowthTrackedAnchor
): number => left.anchorTileY - right.anchorTileY || left.anchorTileX - right.anchorTileX;

const createTrackedAnchorKey = (anchorTileX: number, anchorTileY: number): string =>
  `${anchorTileX},${anchorTileY}`;

const SMALL_TREE_GROWTH_REQUIRED_LOCAL_BOUNDS = (() => {
  let minLocalX = 0;
  let minLocalY = 0;
  let maxLocalX = 0;
  let maxLocalY = 0;

  for (const offset of [...PLANTED_SMALL_TREE_LOCAL_OFFSETS, ...GROWN_SMALL_TREE_LOCAL_OFFSETS]) {
    if (offset.localX < minLocalX) {
      minLocalX = offset.localX;
    }
    if (offset.localY < minLocalY) {
      minLocalY = offset.localY;
    }
    if (offset.localX > maxLocalX) {
      maxLocalX = offset.localX;
    }
    if (offset.localY > maxLocalY) {
      maxLocalY = offset.localY;
    }
  }

  return {
    minLocalX,
    minLocalY,
    maxLocalX,
    maxLocalY
  };
})();

export const createSmallTreeGrowthState = (
  growthIntervalTicks = DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS
): SmallTreeGrowthState => ({
  ticksUntilNextGrowth: expectPositiveInteger(growthIntervalTicks, 'growthIntervalTicks'),
  nextWindowIndex: 0
});

export const resolveSmallTreeGrowthWindowIndex = (
  anchorTileX: number,
  anchorTileY: number,
  windowCount = DEFAULT_SMALL_TREE_GROWTH_WINDOW_COUNT
): number => {
  const normalizedAnchorTileX = expectInteger(anchorTileX, 'anchorTileX');
  const normalizedAnchorTileY = expectInteger(anchorTileY, 'anchorTileY');
  const normalizedWindowCount = expectPositiveInteger(windowCount, 'windowCount');
  const hashedAnchor =
    Math.imul(normalizedAnchorTileX, 73856093) ^ Math.imul(normalizedAnchorTileY, 19349663);
  const normalizedIndex = hashedAnchor % normalizedWindowCount;
  return normalizedIndex >= 0 ? normalizedIndex : normalizedIndex + normalizedWindowCount;
};

export const resolveSmallTreeGrowthRequiredChunkBounds = (
  anchorTileX: number,
  anchorTileY: number
): ReturnType<typeof chunkCoordBounds> =>
  chunkCoordBounds(
    anchorTileX + SMALL_TREE_GROWTH_REQUIRED_LOCAL_BOUNDS.minLocalX,
    anchorTileY + SMALL_TREE_GROWTH_REQUIRED_LOCAL_BOUNDS.minLocalY,
    anchorTileX + SMALL_TREE_GROWTH_REQUIRED_LOCAL_BOUNDS.maxLocalX,
    anchorTileY + SMALL_TREE_GROWTH_REQUIRED_LOCAL_BOUNDS.maxLocalY
  );

export const isSmallTreeGrowthTrackedAnchorResident = (
  trackedAnchor: SmallTreeGrowthTrackedAnchor,
  hasResidentChunk: (chunkX: number, chunkY: number) => boolean
): boolean => {
  const bounds = resolveSmallTreeGrowthRequiredChunkBounds(
    trackedAnchor.anchorTileX,
    trackedAnchor.anchorTileY
  );

  for (let chunkY = bounds.minChunkY; chunkY <= bounds.maxChunkY; chunkY += 1) {
    for (let chunkX = bounds.minChunkX; chunkX <= bounds.maxChunkX; chunkX += 1) {
      if (!hasResidentChunk(chunkX, chunkY)) {
        return false;
      }
    }
  }

  return true;
};

const collectDueTrackedAnchors = (
  trackedAnchors: readonly SmallTreeGrowthTrackedAnchor[],
  windowIndex: number,
  windowCount: number
): SmallTreeGrowthTrackedAnchor[] =>
  trackedAnchors
    .map((trackedAnchor) => normalizeTrackedAnchor(trackedAnchor))
    .filter(
      (trackedAnchor) =>
        resolveSmallTreeGrowthWindowIndex(
          trackedAnchor.anchorTileX,
          trackedAnchor.anchorTileY,
          windowCount
        ) === windowIndex
    )
    .sort(compareTrackedAnchors);

const growTrackedAnchors = (
  world: SmallTreeGrowthWorldView,
  trackedAnchors: readonly SmallTreeGrowthTrackedAnchor[],
  windowIndex: number,
  windowCount: number,
  registry: TileMetadataRegistry
): GrownSmallTreeAnchor[] => {
  const grownAnchors: GrownSmallTreeAnchor[] = [];

  for (const trackedAnchor of collectDueTrackedAnchors(trackedAnchors, windowIndex, windowCount)) {
    const growthSite = evaluateSmallTreeGrowthSiteAtAnchor(
      world,
      trackedAnchor.anchorTileX,
      trackedAnchor.anchorTileY,
      registry
    );
    if (!growthSite.canGrow) {
      continue;
    }

    const writeResult = replaceSmallTreeGrowthStageAtAnchor(
      world,
      trackedAnchor.anchorTileX,
      trackedAnchor.anchorTileY,
      'planted',
      'grown',
      registry
    );
    if (!writeResult.changed) {
      continue;
    }

    grownAnchors.push({
      anchorTileX: trackedAnchor.anchorTileX,
      anchorTileY: trackedAnchor.anchorTileY,
      writes: writeResult.writes
    });
  }

  return grownAnchors;
};

const collectTrackedAnchorsFromResidentChunkSnapshot = (
  snapshot: TileWorldSnapshot,
  saplingTileId: number,
  trackedAnchors: SmallTreeGrowthTrackedAnchor[],
  trackedAnchorKeys: Set<string>
): void => {
  for (const residentChunk of snapshot.residentChunks) {
    const tiles = decodeChunkDenseTilePayload(residentChunk.payload.tiles, 'residentChunk.payload.tiles');
    for (let tileIndex = 0; tileIndex < tiles.length; tileIndex += 1) {
      if ((tiles[tileIndex] ?? 0) !== saplingTileId) {
        continue;
      }

      const localX = tileIndex % CHUNK_SIZE;
      const localY = Math.floor(tileIndex / CHUNK_SIZE);
      const anchorTileX = residentChunk.coord.x * CHUNK_SIZE + localX;
      const anchorTileY = residentChunk.coord.y * CHUNK_SIZE + localY + 1;
      const key = createTrackedAnchorKey(anchorTileX, anchorTileY);
      if (trackedAnchorKeys.has(key)) {
        continue;
      }

      trackedAnchorKeys.add(key);
      trackedAnchors.push({ anchorTileX, anchorTileY });
    }
  }
};

const collectTrackedAnchorsFromEditedChunkSnapshot = (
  snapshot: TileWorldSnapshot,
  saplingTileId: number,
  trackedAnchors: SmallTreeGrowthTrackedAnchor[],
  trackedAnchorKeys: Set<string>
): void => {
  for (const editedChunk of snapshot.editedChunks) {
    const tileOverrides = decodeChunkSparseTilePayload(
      editedChunk.payload.tileOverrides,
      'editedChunk.payload.tileOverrides'
    );
    for (const [tileIndex, tileId] of tileOverrides) {
      if (tileId !== saplingTileId) {
        continue;
      }

      const localX = tileIndex % CHUNK_SIZE;
      const localY = Math.floor(tileIndex / CHUNK_SIZE);
      const anchorTileX = editedChunk.coord.x * CHUNK_SIZE + localX;
      const anchorTileY = editedChunk.coord.y * CHUNK_SIZE + localY + 1;
      const key = createTrackedAnchorKey(anchorTileX, anchorTileY);
      if (trackedAnchorKeys.has(key)) {
        continue;
      }

      trackedAnchorKeys.add(key);
      trackedAnchors.push({ anchorTileX, anchorTileY });
    }
  }
};

export const collectTrackedPlantedSmallTreeAnchorsFromWorldSnapshot = (
  snapshot: TileWorldSnapshot,
  registry: TileMetadataRegistry = TILE_METADATA
): SmallTreeGrowthTrackedAnchor[] => {
  const saplingTileId = getSmallTreeSaplingTileId(registry);
  const trackedAnchors: SmallTreeGrowthTrackedAnchor[] = [];
  const trackedAnchorKeys = new Set<string>();

  collectTrackedAnchorsFromResidentChunkSnapshot(
    snapshot,
    saplingTileId,
    trackedAnchors,
    trackedAnchorKeys
  );
  collectTrackedAnchorsFromEditedChunkSnapshot(
    snapshot,
    saplingTileId,
    trackedAnchors,
    trackedAnchorKeys
  );

  return trackedAnchors.sort(compareTrackedAnchors);
};

export const stepSmallTreeGrowth = ({
  world,
  growthState = createSmallTreeGrowthState(),
  trackedAnchors = [],
  growthIntervalTicks = DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS,
  windowCount = DEFAULT_SMALL_TREE_GROWTH_WINDOW_COUNT,
  registry = TILE_METADATA
}: StepSmallTreeGrowthOptions): SmallTreeGrowthStepResult => {
  const normalizedGrowthIntervalTicks = expectPositiveInteger(
    growthIntervalTicks,
    'growthIntervalTicks'
  );
  const normalizedWindowCount = expectPositiveInteger(windowCount, 'windowCount');
  const normalizedTicksUntilNextGrowth = expectPositiveInteger(
    growthState.ticksUntilNextGrowth,
    'growthState.ticksUntilNextGrowth'
  );
  const normalizedNextWindowIndex = expectNonNegativeInteger(
    growthState.nextWindowIndex,
    'growthState.nextWindowIndex'
  );
  const activeWindowIndex = normalizedNextWindowIndex % normalizedWindowCount;
  const decrementedTicksUntilNextGrowth = normalizedTicksUntilNextGrowth - 1;

  if (decrementedTicksUntilNextGrowth > 0) {
    return {
      nextGrowthState: {
        ticksUntilNextGrowth: decrementedTicksUntilNextGrowth,
        nextWindowIndex: activeWindowIndex
      },
      grownAnchors: []
    };
  }

  return {
    nextGrowthState: {
      ticksUntilNextGrowth: normalizedGrowthIntervalTicks,
      nextWindowIndex: (activeWindowIndex + 1) % normalizedWindowCount
    },
    grownAnchors: growTrackedAnchors(
      world,
      trackedAnchors ?? [],
      activeWindowIndex,
      normalizedWindowCount,
      registry
    )
  };
};
