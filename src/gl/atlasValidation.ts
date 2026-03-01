import type { TileMetadataEntry, TileRenderFrameMetadata, TileUvRect } from '../world/tileMetadata';

export interface AtlasUvRectBoundsWarning {
  tileId: number;
  tileName: string;
  sourcePath: string;
  summary: string;
  message: string;
}

interface PixelRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const toPixelRect = (
  uvRect: TileUvRect,
  atlasWidth: number,
  atlasHeight: number
): PixelRect => ({
  x0: uvRect.u0 * atlasWidth,
  y0: uvRect.v0 * atlasHeight,
  x1: uvRect.u1 * atlasWidth,
  y1: uvRect.v1 * atlasHeight
});

const isPixelRectWithinAtlasBounds = (
  pixelRect: PixelRect,
  atlasWidth: number,
  atlasHeight: number
): boolean =>
  pixelRect.x0 >= 0 &&
  pixelRect.y0 >= 0 &&
  pixelRect.x1 <= atlasWidth &&
  pixelRect.y1 <= atlasHeight;

const formatPixelValue = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;
  return `${rounded}`;
};

const formatPixelRect = ({ x0, y0, x1, y1 }: PixelRect): string =>
  `[${formatPixelValue(x0)}, ${formatPixelValue(y0)}]..[${formatPixelValue(x1)}, ${formatPixelValue(y1)}]`;

const buildWarning = (
  tile: TileMetadataEntry,
  sourcePath: string,
  uvRect: TileUvRect,
  atlasWidth: number,
  atlasHeight: number
): AtlasUvRectBoundsWarning => {
  const pixelRect = toPixelRect(uvRect, atlasWidth, atlasHeight);
  const summary = `tile ${tile.id} "${tile.name}" ${sourcePath}`;
  return {
    tileId: tile.id,
    tileName: tile.name,
    sourcePath,
    summary,
    message:
      `${summary} resolves to ${formatPixelRect(pixelRect)} outside atlas ${atlasWidth}x${atlasHeight}`
  };
};

const collectFrameUvRectWarnings = (
  warnings: AtlasUvRectBoundsWarning[],
  tile: TileMetadataEntry,
  frame: TileRenderFrameMetadata,
  sourcePath: string,
  atlasWidth: number,
  atlasHeight: number
): void => {
  if (!frame.uvRect) {
    return;
  }

  const pixelRect = toPixelRect(frame.uvRect, atlasWidth, atlasHeight);
  if (isPixelRectWithinAtlasBounds(pixelRect, atlasWidth, atlasHeight)) {
    return;
  }

  warnings.push(buildWarning(tile, sourcePath, frame.uvRect, atlasWidth, atlasHeight));
};

export const collectAtlasUvRectBoundsWarnings = (
  tiles: readonly TileMetadataEntry[],
  atlasWidth: number,
  atlasHeight: number
): AtlasUvRectBoundsWarning[] => {
  const warnings: AtlasUvRectBoundsWarning[] = [];

  for (const tile of tiles) {
    const render = tile.render;
    if (!render) {
      continue;
    }

    collectFrameUvRectWarnings(
      warnings,
      tile,
      render,
      'render.uvRect',
      atlasWidth,
      atlasHeight
    );

    if (!render.frames) {
      continue;
    }

    for (let frameIndex = 0; frameIndex < render.frames.length; frameIndex += 1) {
      const frame = render.frames[frameIndex];
      if (!frame) {
        continue;
      }

      collectFrameUvRectWarnings(
        warnings,
        tile,
        frame,
        `render.frames[${frameIndex}].uvRect`,
        atlasWidth,
        atlasHeight
      );
    }
  }

  return warnings;
};
