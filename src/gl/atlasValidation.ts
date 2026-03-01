import { getAuthoredAtlasRegion } from '../world/authoredAtlasLayout';
import type { TileMetadataEntry, TileRenderFrameMetadata, TileUvRect } from '../world/tileMetadata';

export interface AtlasValidationWarning {
  tileId: number;
  tileName: string;
  sourcePath: string;
  summary: string;
  message: string;
  kind: 'bounds' | 'pixelAlignment';
}

interface PixelRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const WHOLE_PIXEL_EPSILON = 0.000001;

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

const authoredRegionToPixelRect = (atlasIndex: number): PixelRect | null => {
  const region = getAuthoredAtlasRegion(atlasIndex);
  if (!region) {
    return null;
  }

  return {
    x0: region.x,
    y0: region.y,
    x1: region.x + region.width,
    y1: region.y + region.height
  };
};

const isPixelRectWithinAtlasBounds = (
  pixelRect: PixelRect,
  atlasWidth: number,
  atlasHeight: number
): boolean =>
  pixelRect.x0 >= 0 &&
  pixelRect.y0 >= 0 &&
  pixelRect.x1 <= atlasWidth &&
  pixelRect.y1 <= atlasHeight;

const isWholePixelValue = (value: number): boolean =>
  Math.abs(value - Math.round(value)) <= WHOLE_PIXEL_EPSILON;

const isPixelRectWholePixelAligned = (pixelRect: PixelRect): boolean =>
  isWholePixelValue(pixelRect.x0) &&
  isWholePixelValue(pixelRect.y0) &&
  isWholePixelValue(pixelRect.x1) &&
  isWholePixelValue(pixelRect.y1);

const formatPixelValue = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;
  return `${rounded}`;
};

const formatPixelRect = ({ x0, y0, x1, y1 }: PixelRect): string =>
  `[${formatPixelValue(x0)}, ${formatPixelValue(y0)}]..[${formatPixelValue(x1)}, ${formatPixelValue(y1)}]`;

const buildWarning = (
  tile: TileMetadataEntry,
  sourcePath: string,
  pixelRect: PixelRect,
  atlasWidth: number,
  atlasHeight: number,
  kind: AtlasValidationWarning['kind']
): AtlasValidationWarning => {
  const summary = `tile ${tile.id} "${tile.name}" ${sourcePath}`;
  const issueDescription =
    kind === 'bounds'
      ? `resolves to ${formatPixelRect(pixelRect)} outside atlas ${atlasWidth}x${atlasHeight}`
      : `resolves to ${formatPixelRect(pixelRect)} on non-integer atlas pixels for ${atlasWidth}x${atlasHeight}`;
  return {
    tileId: tile.id,
    tileName: tile.name,
    sourcePath,
    summary,
    kind,
    message: `${summary} ${issueDescription}`
  };
};

const buildBoundsWarning = (
  tile: TileMetadataEntry,
  sourcePath: string,
  pixelRect: PixelRect,
  atlasWidth: number,
  atlasHeight: number
): AtlasValidationWarning =>
  buildWarning(tile, sourcePath, pixelRect, atlasWidth, atlasHeight, 'bounds');

const buildPixelAlignmentWarning = (
  tile: TileMetadataEntry,
  sourcePath: string,
  pixelRect: PixelRect,
  atlasWidth: number,
  atlasHeight: number
): AtlasValidationWarning =>
  buildWarning(tile, sourcePath, pixelRect, atlasWidth, atlasHeight, 'pixelAlignment');

const collectFrameUvRectWarnings = (
  warnings: AtlasValidationWarning[],
  tile: TileMetadataEntry,
  frame: TileRenderFrameMetadata,
  sourcePath: string,
  atlasWidth: number,
  atlasHeight: number
): void => {
  if (frame.atlasIndex !== undefined) {
    const pixelRect = authoredRegionToPixelRect(frame.atlasIndex);
    if (!pixelRect) {
      return;
    }

    if (isPixelRectWithinAtlasBounds(pixelRect, atlasWidth, atlasHeight)) {
      return;
    }

    warnings.push(buildBoundsWarning(tile, sourcePath, pixelRect, atlasWidth, atlasHeight));
    return;
  }

  const uvRect = frame.uvRect;
  if (!uvRect) {
    return;
  }

  const pixelRect = toPixelRect(uvRect, atlasWidth, atlasHeight);
  if (!isPixelRectWithinAtlasBounds(pixelRect, atlasWidth, atlasHeight)) {
    warnings.push(buildBoundsWarning(tile, sourcePath, pixelRect, atlasWidth, atlasHeight));
    return;
  }

  if (isPixelRectWholePixelAligned(pixelRect)) {
    return;
  }

  warnings.push(buildPixelAlignmentWarning(tile, sourcePath, pixelRect, atlasWidth, atlasHeight));
};

export const collectAtlasValidationWarnings = (
  tiles: readonly TileMetadataEntry[],
  atlasWidth: number,
  atlasHeight: number
): AtlasValidationWarning[] => {
  const warnings: AtlasValidationWarning[] = [];

  for (const tile of tiles) {
    const render = tile.render;
    if (render) {
      collectFrameUvRectWarnings(
        warnings,
        tile,
        render,
        render.atlasIndex !== undefined ? 'render.atlasIndex' : 'render.uvRect',
        atlasWidth,
        atlasHeight
      );

      if (render.frames) {
        for (let frameIndex = 0; frameIndex < render.frames.length; frameIndex += 1) {
          const frame = render.frames[frameIndex];
          if (!frame) {
            continue;
          }

          collectFrameUvRectWarnings(
            warnings,
            tile,
            frame,
            frame.atlasIndex !== undefined
              ? `render.frames[${frameIndex}].atlasIndex`
              : `render.frames[${frameIndex}].uvRect`,
            atlasWidth,
            atlasHeight
          );
        }
      }
    }

    const terrainVariantMap = tile.terrainAutotile?.placeholderVariantAtlasByCardinalMask;
    if (!terrainVariantMap) {
      continue;
    }

    for (let cardinalMask = 0; cardinalMask < terrainVariantMap.length; cardinalMask += 1) {
      const atlasIndex = terrainVariantMap[cardinalMask];
      if (atlasIndex === undefined) {
        continue;
      }

      const pixelRect = authoredRegionToPixelRect(atlasIndex);
      if (!pixelRect) {
        continue;
      }

      if (isPixelRectWithinAtlasBounds(pixelRect, atlasWidth, atlasHeight)) {
        continue;
      }

      warnings.push(
        buildBoundsWarning(
          tile,
          `terrainAutotile.placeholderVariantAtlasByCardinalMask[${cardinalMask}]`,
          pixelRect,
          atlasWidth,
          atlasHeight
        )
      );
    }
  }

  return warnings;
};
