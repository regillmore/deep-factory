export const SURFACE_FLOWER_SELECTION_WINDOW_COUNT = 5;

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

export const resolveWorldTileHashWindowIndex = (
  worldTileX: number,
  worldTileY: number,
  windowCount: number
): number => {
  const normalizedWorldTileX = expectInteger(worldTileX, 'worldTileX');
  const normalizedWorldTileY = expectInteger(worldTileY, 'worldTileY');
  const normalizedWindowCount = expectPositiveInteger(windowCount, 'windowCount');
  const hashedTile =
    Math.imul(normalizedWorldTileX, 73856093) ^ Math.imul(normalizedWorldTileY, 19349663);
  const normalizedIndex = hashedTile % normalizedWindowCount;
  return normalizedIndex >= 0 ? normalizedIndex : normalizedIndex + normalizedWindowCount;
};

export const shouldSelectSurfaceFlowerAtAnchor = (
  worldTileX: number,
  worldTileY: number
): boolean =>
  resolveWorldTileHashWindowIndex(
    worldTileX,
    worldTileY,
    SURFACE_FLOWER_SELECTION_WINDOW_COUNT
  ) === 0;
