export interface DebugFloodFillTileBounds {
  minTileX: number;
  minTileY: number;
  maxTileX: number;
  maxTileY: number;
}

export interface RunDebugFloodFillOptions {
  startTileX: number;
  startTileY: number;
  replacementTileId: number;
  bounds: DebugFloodFillTileBounds;
  readTile: (worldTileX: number, worldTileY: number) => number;
  visitFilledTile: (worldTileX: number, worldTileY: number, previousTileId: number) => void;
}

export interface DebugFloodFillResult {
  targetTileId: number | null;
  filledTileCount: number;
}

const tileKey = (worldTileX: number, worldTileY: number): string => `${worldTileX},${worldTileY}`;

const isTileWithinBounds = (
  worldTileX: number,
  worldTileY: number,
  bounds: DebugFloodFillTileBounds
): boolean =>
  worldTileX >= bounds.minTileX &&
  worldTileX <= bounds.maxTileX &&
  worldTileY >= bounds.minTileY &&
  worldTileY <= bounds.maxTileY;

export const runDebugFloodFill = (options: RunDebugFloodFillOptions): DebugFloodFillResult => {
  const { startTileX, startTileY, replacementTileId, bounds, readTile, visitFilledTile } = options;
  if (!isTileWithinBounds(startTileX, startTileY, bounds)) {
    return { targetTileId: null, filledTileCount: 0 };
  }

  const targetTileId = readTile(startTileX, startTileY);
  if (targetTileId === replacementTileId) {
    return { targetTileId, filledTileCount: 0 };
  }

  const queuedX: number[] = [startTileX];
  const queuedY: number[] = [startTileY];
  const visitedTileKeys = new Set<string>();
  let queueHead = 0;
  let filledTileCount = 0;

  while (queueHead < queuedX.length) {
    const worldTileX = queuedX[queueHead]!;
    const worldTileY = queuedY[queueHead]!;
    queueHead += 1;

    if (!isTileWithinBounds(worldTileX, worldTileY, bounds)) continue;

    const key = tileKey(worldTileX, worldTileY);
    if (visitedTileKeys.has(key)) continue;
    visitedTileKeys.add(key);

    const currentTileId = readTile(worldTileX, worldTileY);
    if (currentTileId !== targetTileId) continue;

    visitFilledTile(worldTileX, worldTileY, currentTileId);
    filledTileCount += 1;

    queuedX.push(worldTileX + 1, worldTileX - 1, worldTileX, worldTileX);
    queuedY.push(worldTileY, worldTileY, worldTileY + 1, worldTileY - 1);
  }

  return { targetTileId, filledTileCount };
};
