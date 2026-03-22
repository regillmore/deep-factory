import { getAuthoredAtlasRegion } from '../world/authoredAtlasLayout';
import type { TileMetadataEntry, TileUvRect } from '../world/tileMetadata';
import type { WallMetadataEntry } from '../world/wallMetadata';

export interface AtlasValidationWarning {
  entryKind: 'tile' | 'wall';
  entryId: number;
  entryName: string;
  sourcePath: string;
  summary: string;
  message: string;
  kind: 'bounds' | 'pixelAlignment';
}

interface AtlasValidationEntry {
  entryKind: AtlasValidationWarning['entryKind'];
  entryId: number;
  entryName: string;
}

interface AtlasValidationRenderMetadata {
  atlasIndex?: number;
  uvRect?: TileUvRect;
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
  entry: AtlasValidationEntry,
  sourcePath: string,
  pixelRect: PixelRect,
  atlasWidth: number,
  atlasHeight: number,
  kind: AtlasValidationWarning['kind']
): AtlasValidationWarning => {
  const summary = `${entry.entryKind} ${entry.entryId} "${entry.entryName}" ${sourcePath}`;
  const issueDescription =
    kind === 'bounds'
      ? `resolves to ${formatPixelRect(pixelRect)} outside atlas ${atlasWidth}x${atlasHeight}`
      : `resolves to ${formatPixelRect(pixelRect)} on non-integer atlas pixels for ${atlasWidth}x${atlasHeight}`;
  return {
    entryKind: entry.entryKind,
    entryId: entry.entryId,
    entryName: entry.entryName,
    sourcePath,
    summary,
    kind,
    message: `${summary} ${issueDescription}`
  };
};

const buildBoundsWarning = (
  entry: AtlasValidationEntry,
  sourcePath: string,
  pixelRect: PixelRect,
  atlasWidth: number,
  atlasHeight: number
): AtlasValidationWarning =>
  buildWarning(entry, sourcePath, pixelRect, atlasWidth, atlasHeight, 'bounds');

const buildPixelAlignmentWarning = (
  entry: AtlasValidationEntry,
  sourcePath: string,
  pixelRect: PixelRect,
  atlasWidth: number,
  atlasHeight: number
): AtlasValidationWarning =>
  buildWarning(entry, sourcePath, pixelRect, atlasWidth, atlasHeight, 'pixelAlignment');

const collectRenderMetadataWarnings = (
  warnings: AtlasValidationWarning[],
  entry: AtlasValidationEntry,
  renderMetadata: AtlasValidationRenderMetadata,
  sourcePath: string,
  atlasWidth: number,
  atlasHeight: number
): void => {
  if (renderMetadata.atlasIndex !== undefined) {
    const pixelRect = authoredRegionToPixelRect(renderMetadata.atlasIndex);
    if (!pixelRect) {
      return;
    }

    if (isPixelRectWithinAtlasBounds(pixelRect, atlasWidth, atlasHeight)) {
      return;
    }

    warnings.push(buildBoundsWarning(entry, sourcePath, pixelRect, atlasWidth, atlasHeight));
    return;
  }

  const uvRect = renderMetadata.uvRect;
  if (!uvRect) {
    return;
  }

  const pixelRect = toPixelRect(uvRect, atlasWidth, atlasHeight);
  if (!isPixelRectWithinAtlasBounds(pixelRect, atlasWidth, atlasHeight)) {
    warnings.push(buildBoundsWarning(entry, sourcePath, pixelRect, atlasWidth, atlasHeight));
    return;
  }

  if (isPixelRectWholePixelAligned(pixelRect)) {
    return;
  }

  warnings.push(buildPixelAlignmentWarning(entry, sourcePath, pixelRect, atlasWidth, atlasHeight));
};

export const collectAtlasValidationWarnings = (
  tiles: readonly TileMetadataEntry[],
  atlasWidth: number,
  atlasHeight: number,
  walls: readonly WallMetadataEntry[] = []
): AtlasValidationWarning[] => {
  const warnings: AtlasValidationWarning[] = [];

  for (const tile of tiles) {
    const entry: AtlasValidationEntry = {
      entryKind: 'tile',
      entryId: tile.id,
      entryName: tile.name
    };
    const render = tile.render;
    if (render) {
      collectRenderMetadataWarnings(
        warnings,
        entry,
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

          collectRenderMetadataWarnings(
            warnings,
            entry,
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
    if (terrainVariantMap) {
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
            entry,
            `terrainAutotile.placeholderVariantAtlasByCardinalMask[${cardinalMask}]`,
            pixelRect,
            atlasWidth,
            atlasHeight
          )
        );
      }
    }

    const liquidVariantMap = tile.liquidRender?.variantRenderByCardinalMask;
    if (!liquidVariantMap) {
      continue;
    }

    for (let cardinalMask = 0; cardinalMask < liquidVariantMap.length; cardinalMask += 1) {
      const variant = liquidVariantMap[cardinalMask];
      if (!variant) {
        continue;
      }

      collectRenderMetadataWarnings(
        warnings,
        entry,
        variant,
        variant.atlasIndex !== undefined
          ? `liquidRender.variantRenderByCardinalMask[${cardinalMask}].atlasIndex`
          : `liquidRender.variantRenderByCardinalMask[${cardinalMask}].uvRect`,
        atlasWidth,
        atlasHeight
      );

      if (!variant.frames) {
        continue;
      }

      for (let frameIndex = 0; frameIndex < variant.frames.length; frameIndex += 1) {
        const frame = variant.frames[frameIndex];
        if (!frame) {
          continue;
        }

        collectRenderMetadataWarnings(
          warnings,
          entry,
          frame,
          frame.atlasIndex !== undefined
            ? `liquidRender.variantRenderByCardinalMask[${cardinalMask}].frames[${frameIndex}].atlasIndex`
            : `liquidRender.variantRenderByCardinalMask[${cardinalMask}].frames[${frameIndex}].uvRect`,
          atlasWidth,
          atlasHeight
        );
      }
    }
  }

  for (const wall of walls) {
    if (!wall.render) {
      continue;
    }

    collectRenderMetadataWarnings(
      warnings,
      {
        entryKind: 'wall',
        entryId: wall.id,
        entryName: wall.name
      },
      wall.render,
      wall.render.atlasIndex !== undefined ? 'render.atlasIndex' : 'render.uvRect',
      atlasWidth,
      atlasHeight
    );
  }

  return warnings;
};
