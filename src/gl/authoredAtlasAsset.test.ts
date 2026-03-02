import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import {
  AUTHORED_ATLAS_HEIGHT,
  AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS,
  AUTHORED_ATLAS_REGIONS,
  AUTHORED_ATLAS_WIDTH
} from '../world/authoredAtlasLayout';
import type { TileUvRect } from '../world/tileMetadata';
import { TILE_METADATA } from '../world/tileMetadata';
import { collectAtlasValidationWarnings } from './atlasValidation';

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_CHUNK_TYPE_IHDR = 'IHDR';
const PNG_CHUNK_TYPE_IDAT = 'IDAT';
const PNG_CHUNK_TYPE_IEND = 'IEND';
const PNG_COLOR_TYPE_RGBA = 6;
const PNG_FILTER_TYPE_NONE = 0;
const PNG_FILTER_TYPE_SUB = 1;
const PNG_FILTER_TYPE_UP = 2;
const PNG_FILTER_TYPE_AVERAGE = 3;
const PNG_FILTER_TYPE_PAETH = 4;
const PNG_BYTES_PER_PIXEL_RGBA = 4;

const readPngDimension = (data: Uint8Array, byteOffset: number): number =>
  (
    (data[byteOffset]! << 24) |
    (data[byteOffset + 1]! << 16) |
    (data[byteOffset + 2]! << 8) |
    data[byteOffset + 3]!
  ) >>> 0;

interface DecodedAtlasPng {
  pngWidth: number;
  pngHeight: number;
  rgbaPixels: Uint8Array;
}

interface AtlasPixelRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AtlasPixelCoordinate {
  x: number;
  y: number;
}

interface DirectRenderUvRectSource {
  tileId: number;
  tileName: string;
  uvRect: TileUvRect;
}

interface AnimatedDirectRenderUvRectFrameSource {
  tileId: number;
  tileName: string;
  frameIndex: number;
  uvRect: TileUvRect;
}

interface AnimatedDirectRenderUvRectFrameTransition {
  tileId: number;
  tileName: string;
  previousFrameIndex: number;
  previousUvRect: TileUvRect;
  frameIndex: number;
  uvRect: TileUvRect;
}

interface DirectRenderUvRectAuthoredRegionReference {
  tileId: number;
  tileName: string;
  sourcePath: string;
  atlasIndex: number;
}

interface AnimatedAtlasIndexFrameTransition {
  tileId: number;
  tileName: string;
  previousFrameIndex: number;
  previousAtlasIndex: number;
  frameIndex: number;
  atlasIndex: number;
}

interface NamedDirectRenderUvRectSource extends DirectRenderUvRectSource {
  sourcePath: string;
}

const readPngChunkType = (data: Uint8Array, byteOffset: number): string =>
  Buffer.from(data.subarray(byteOffset, byteOffset + 4)).toString('ascii');

const paethPredictor = (left: number, up: number, upLeft: number): number => {
  const initial = left + up - upLeft;
  const leftDistance = Math.abs(initial - left);
  const upDistance = Math.abs(initial - up);
  const upLeftDistance = Math.abs(initial - upLeft);

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
    return left;
  }
  if (upDistance <= upLeftDistance) {
    return up;
  }
  return upLeft;
};

const decodeRgbaPngScanlines = (
  width: number,
  height: number,
  inflatedData: Uint8Array
): Uint8Array => {
  const bytesPerPixel = PNG_BYTES_PER_PIXEL_RGBA;
  const stride = width * bytesPerPixel;
  const expectedLength = height * (stride + 1);

  expect(inflatedData.length).toBe(expectedLength);

  const rgbaPixels = new Uint8Array(width * height * bytesPerPixel);

  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filterType = inflatedData[sourceOffset]!;
    sourceOffset += 1;

    const rowOffset = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const rawValue = inflatedData[sourceOffset]!;
      sourceOffset += 1;

      const left = x >= bytesPerPixel ? rgbaPixels[rowOffset + x - bytesPerPixel]! : 0;
      const up = y > 0 ? rgbaPixels[rowOffset + x - stride]! : 0;
      const upLeft =
        y > 0 && x >= bytesPerPixel ? rgbaPixels[rowOffset + x - stride - bytesPerPixel]! : 0;

      let decodedValue = rawValue;
      switch (filterType) {
        case PNG_FILTER_TYPE_NONE:
          break;
        case PNG_FILTER_TYPE_SUB:
          decodedValue = (rawValue + left) & 0xff;
          break;
        case PNG_FILTER_TYPE_UP:
          decodedValue = (rawValue + up) & 0xff;
          break;
        case PNG_FILTER_TYPE_AVERAGE:
          decodedValue = (rawValue + Math.floor((left + up) / 2)) & 0xff;
          break;
        case PNG_FILTER_TYPE_PAETH:
          decodedValue = (rawValue + paethPredictor(left, up, upLeft)) & 0xff;
          break;
        default:
          throw new Error(`Unsupported PNG filter type ${filterType}`);
      }

      rgbaPixels[rowOffset + x] = decodedValue;
    }
  }

  return rgbaPixels;
};

const readCommittedAtlasPng = (): DecodedAtlasPng => {
  const atlasPath = resolve(process.cwd(), 'public/atlas/tile-atlas.png');

  expect(existsSync(atlasPath)).toBe(true);

  const data = readFileSync(atlasPath);
  expect(data.subarray(0, PNG_SIGNATURE.length)).toEqual(Buffer.from(PNG_SIGNATURE));

  const pngWidth = readPngDimension(data, 16);
  const pngHeight = readPngDimension(data, 20);
  const bitDepth = data[24];
  const colorType = data[25];
  const compressionMethod = data[26];
  const filterMethod = data[27];
  const interlaceMethod = data[28];

  expect(bitDepth).toBe(8);
  expect(colorType).toBe(PNG_COLOR_TYPE_RGBA);
  expect(compressionMethod).toBe(0);
  expect(filterMethod).toBe(0);
  expect(interlaceMethod).toBe(0);

  const idatChunks: Uint8Array[] = [];
  for (let offset = PNG_SIGNATURE.length; offset < data.length; ) {
    const chunkLength = readPngDimension(data, offset);
    const chunkType = readPngChunkType(data, offset + 4);
    const chunkDataOffset = offset + 8;
    const chunkDataEnd = chunkDataOffset + chunkLength;

    expect(chunkDataEnd + 4).toBeLessThanOrEqual(data.length);

    if (chunkType === PNG_CHUNK_TYPE_IHDR) {
      expect(chunkLength).toBe(13);
    } else if (chunkType === PNG_CHUNK_TYPE_IDAT) {
      idatChunks.push(data.subarray(chunkDataOffset, chunkDataEnd));
    } else if (chunkType === PNG_CHUNK_TYPE_IEND) {
      break;
    }

    offset = chunkDataEnd + 4;
  }

  expect(idatChunks.length).toBeGreaterThan(0);

  const inflatedImageData = inflateSync(Buffer.concat(idatChunks));

  return {
    pngWidth,
    pngHeight,
    rgbaPixels: decodeRgbaPngScanlines(pngWidth, pngHeight, inflatedImageData)
  };
};

const collectReferencedAtlasIndices = (): number[] => {
  const referencedAtlasIndices = new Set<number>();

  for (const tile of TILE_METADATA.tiles) {
    if (tile.render?.atlasIndex !== undefined) {
      referencedAtlasIndices.add(tile.render.atlasIndex);
    }

    if (tile.render?.frames) {
      for (const frame of tile.render.frames) {
        if (frame.atlasIndex !== undefined) {
          referencedAtlasIndices.add(frame.atlasIndex);
        }
      }
    }

    const terrainVariantMap = tile.terrainAutotile?.placeholderVariantAtlasByCardinalMask;
    if (!terrainVariantMap) {
      continue;
    }

    for (const atlasIndex of terrainVariantMap) {
      referencedAtlasIndices.add(atlasIndex);
    }
  }

  return [...referencedAtlasIndices].sort((a, b) => a - b);
};

const collectDirectRenderUvRectSources = (): DirectRenderUvRectSource[] =>
  TILE_METADATA.tiles.flatMap((tile) =>
    tile.render?.uvRect
      ? [
          {
            tileId: tile.id,
            tileName: tile.name,
            uvRect: tile.render.uvRect
          }
        ]
      : []
  );

const collectAnimatedDirectRenderUvRectFrameSources = (): AnimatedDirectRenderUvRectFrameSource[] =>
  TILE_METADATA.tiles.flatMap((tile) => {
    if (!tile.render?.uvRect || !tile.render.frames) {
      return [];
    }

    return tile.render.frames.flatMap((frame, frameIndex) =>
      frame.uvRect
        ? [
            {
              tileId: tile.id,
              tileName: tile.name,
              frameIndex,
              uvRect: frame.uvRect
            }
          ]
      : []
    );
  });

const collectAnimatedDirectRenderUvRectFrameTransitions =
  (): AnimatedDirectRenderUvRectFrameTransition[] =>
    TILE_METADATA.tiles.flatMap((tile) => {
      if (!tile.render?.uvRect || !tile.render.frames) {
        return [];
      }

      const transitions: AnimatedDirectRenderUvRectFrameTransition[] = [];
      for (let frameIndex = 1; frameIndex < tile.render.frames.length; frameIndex += 1) {
        const previousFrame = tile.render.frames[frameIndex - 1];
        const frame = tile.render.frames[frameIndex];

        if (!previousFrame?.uvRect || !frame?.uvRect) {
          continue;
        }

        transitions.push({
          tileId: tile.id,
          tileName: tile.name,
          previousFrameIndex: frameIndex - 1,
          previousUvRect: previousFrame.uvRect,
          frameIndex,
          uvRect: frame.uvRect
        });
      }

      return transitions;
    });

const collectDirectRenderUvRectAuthoredRegionReferences = (
  pngWidth: number,
  pngHeight: number
): DirectRenderUvRectAuthoredRegionReference[] => {
  const references: DirectRenderUvRectAuthoredRegionReference[] = [];

  for (const source of collectDirectRenderUvRectSources()) {
    const pixelRegion = uvRectToPixelRegion(source.uvRect, pngWidth, pngHeight);

    for (const [atlasIndex, authoredRegion] of AUTHORED_ATLAS_REGIONS.entries()) {
      if (!regionsOverlap(pixelRegion, authoredRegion)) {
        continue;
      }

      references.push({
        tileId: source.tileId,
        tileName: source.tileName,
        sourcePath: 'render.uvRect',
        atlasIndex
      });
    }
  }

  for (const source of collectAnimatedDirectRenderUvRectFrameSources()) {
    const pixelRegion = uvRectToPixelRegion(source.uvRect, pngWidth, pngHeight);

    for (const [atlasIndex, authoredRegion] of AUTHORED_ATLAS_REGIONS.entries()) {
      if (!regionsOverlap(pixelRegion, authoredRegion)) {
        continue;
      }

      references.push({
        tileId: source.tileId,
        tileName: source.tileName,
        sourcePath: `render.frames[${source.frameIndex}].uvRect`,
        atlasIndex
      });
    }
  }

  return references;
};

const collectAnimatedAtlasIndexFrameTransitions = (): AnimatedAtlasIndexFrameTransition[] =>
  TILE_METADATA.tiles.flatMap((tile) => {
    const frames = tile.render?.frames ?? [];
    const transitions: AnimatedAtlasIndexFrameTransition[] = [];

    for (let frameIndex = 1; frameIndex < frames.length; frameIndex += 1) {
      const previousFrame = frames[frameIndex - 1];
      const frame = frames[frameIndex];

      if (previousFrame?.atlasIndex === undefined || frame?.atlasIndex === undefined) {
        continue;
      }

      transitions.push({
        tileId: tile.id,
        tileName: tile.name,
        previousFrameIndex: frameIndex - 1,
        previousAtlasIndex: previousFrame.atlasIndex,
        frameIndex,
        atlasIndex: frame.atlasIndex
      });
    }

    return transitions;
  });

const collectNamedDirectRenderUvRectSources = (): NamedDirectRenderUvRectSource[] => [
  ...collectDirectRenderUvRectSources().map((source) => ({
    ...source,
    sourcePath: 'render.uvRect'
  })),
  ...collectAnimatedDirectRenderUvRectFrameSources().map((source) => ({
    tileId: source.tileId,
    tileName: source.tileName,
    sourcePath: `render.frames[${source.frameIndex}].uvRect`,
    uvRect: source.uvRect
  }))
];

const uvRectToPixelRegion = (
  uvRect: TileUvRect,
  pngWidth: number,
  pngHeight: number
): AtlasPixelRegion => {
  const x0 = uvRect.u0 * pngWidth;
  const y0 = uvRect.v0 * pngHeight;
  const x1 = uvRect.u1 * pngWidth;
  const y1 = uvRect.v1 * pngHeight;

  expect(Number.isInteger(x0)).toBe(true);
  expect(Number.isInteger(y0)).toBe(true);
  expect(Number.isInteger(x1)).toBe(true);
  expect(Number.isInteger(y1)).toBe(true);
  expect(x0).toBeGreaterThanOrEqual(0);
  expect(y0).toBeGreaterThanOrEqual(0);
  expect(x1).toBeLessThanOrEqual(pngWidth);
  expect(y1).toBeLessThanOrEqual(pngHeight);
  expect(x1).toBeGreaterThan(x0);
  expect(y1).toBeGreaterThan(y0);

  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0
  };
};

const regionContainsAnyNonTransparentPixel = (
  rgbaPixels: Uint8Array,
  pngWidth: number,
  region: AtlasPixelRegion
): boolean => {
  for (let y = region.y; y < region.y + region.height; y += 1) {
    for (let x = region.x; x < region.x + region.width; x += 1) {
      const alphaIndex = (y * pngWidth + x) * PNG_BYTES_PER_PIXEL_RGBA + 3;
      if (rgbaPixels[alphaIndex] !== 0) {
        return true;
      }
    }
  }

  return false;
};

const regionsOverlap = (left: AtlasPixelRegion, right: AtlasPixelRegion): boolean =>
  left.x < right.x + right.width &&
  left.x + left.width > right.x &&
  left.y < right.y + right.height &&
  left.y + left.height > right.y;

const regionContainsPixel = (
  region: AtlasPixelRegion,
  coordinate: AtlasPixelCoordinate
): boolean =>
  coordinate.x >= region.x &&
  coordinate.x < region.x + region.width &&
  coordinate.y >= region.y &&
  coordinate.y < region.y + region.height;

const getExteriorPaddingStripRegion = (
  pngWidth: number,
  pngHeight: number
): AtlasPixelRegion => {
  const maxAuthoredRegionRight = AUTHORED_ATLAS_REGIONS.reduce(
    (maxRight, region) => Math.max(maxRight, region.x + region.width),
    0
  );

  expect(maxAuthoredRegionRight).toBeLessThan(pngWidth);

  return {
    x: maxAuthoredRegionRight,
    y: 0,
    width: pngWidth - maxAuthoredRegionRight,
    height: pngHeight
  };
};

const collectReferencedAuthoredAtlasIndices = (
  pngWidth: number,
  pngHeight: number
): number[] => {
  const referencedAtlasIndices = new Set(collectReferencedAtlasIndices());
  const directUvRectAtlasReferences = collectDirectRenderUvRectAuthoredRegionReferences(
    pngWidth,
    pngHeight
  );

  for (const reference of directUvRectAtlasReferences) {
    referencedAtlasIndices.add(reference.atlasIndex);
  }

  return [...referencedAtlasIndices].sort((a, b) => a - b);
};

const findFirstNonTransparentPixelOutsideRegions = (
  rgbaPixels: Uint8Array,
  pngWidth: number,
  pngHeight: number,
  allowedRegions: readonly AtlasPixelRegion[]
): AtlasPixelCoordinate | null => {
  for (let y = 0; y < pngHeight; y += 1) {
    for (let x = 0; x < pngWidth; x += 1) {
      const alphaIndex = (y * pngWidth + x) * PNG_BYTES_PER_PIXEL_RGBA + 3;
      if (rgbaPixels[alphaIndex] === 0) {
        continue;
      }

      const coordinate = { x, y };
      if (!allowedRegions.some((region) => regionContainsPixel(region, coordinate))) {
        return coordinate;
      }
    }
  }

  return null;
};

const findFirstPixelInRegionOutsideRegions = (
  candidateRegion: AtlasPixelRegion,
  allowedRegions: readonly AtlasPixelRegion[]
): AtlasPixelCoordinate | null => {
  for (let y = candidateRegion.y; y < candidateRegion.y + candidateRegion.height; y += 1) {
    for (let x = candidateRegion.x; x < candidateRegion.x + candidateRegion.width; x += 1) {
      const coordinate = { x, y };
      if (!allowedRegions.some((region) => regionContainsPixel(region, coordinate))) {
        return coordinate;
      }
    }
  }

  return null;
};

const regionsMatchForVisibleContent = (
  rgbaPixels: Uint8Array,
  pngWidth: number,
  leftRegion: AtlasPixelRegion,
  rightRegion: AtlasPixelRegion
): boolean => {
  if (leftRegion.width !== rightRegion.width || leftRegion.height !== rightRegion.height) {
    return false;
  }

  for (let y = 0; y < leftRegion.height; y += 1) {
    for (let x = 0; x < leftRegion.width; x += 1) {
      const leftPixelStart =
        ((leftRegion.y + y) * pngWidth + leftRegion.x + x) * PNG_BYTES_PER_PIXEL_RGBA;
      const rightPixelStart =
        ((rightRegion.y + y) * pngWidth + rightRegion.x + x) * PNG_BYTES_PER_PIXEL_RGBA;
      const leftAlpha = rgbaPixels[leftPixelStart + 3];
      const rightAlpha = rgbaPixels[rightPixelStart + 3];

      if (leftAlpha !== rightAlpha) {
        return false;
      }

      if (leftAlpha === 0 && rightAlpha === 0) {
        continue;
      }

      for (let channel = 0; channel < PNG_BYTES_PER_PIXEL_RGBA - 1; channel += 1) {
        if (rgbaPixels[leftPixelStart + channel] !== rgbaPixels[rightPixelStart + channel]) {
          return false;
        }
      }
    }
  }

  return true;
};

describe('authored atlas asset comparison helper', () => {
  it('ignores RGB drift when both compared pixels are fully transparent', () => {
    const rgbaPixels = Uint8Array.from([
      255, 0, 0, 0,
      0, 255, 255, 0
    ]);

    expect(
      regionsMatchForVisibleContent(
        rgbaPixels,
        2,
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 1, y: 0, width: 1, height: 1 }
      )
    ).toBe(true);
  });

  it('still fails when compared pixels differ visibly', () => {
    const rgbaPixels = Uint8Array.from([
      255, 0, 0, 255,
      0, 255, 255, 255
    ]);

    expect(
      regionsMatchForVisibleContent(
        rgbaPixels,
        2,
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 1, y: 0, width: 1, height: 1 }
      )
    ).toBe(false);
  });
});

describe('authored atlas asset', () => {
  it('ships a committed PNG compatible with the authored atlas region layout', () => {
    const { pngWidth, pngHeight } = readCommittedAtlasPng();
    expect(pngWidth).toBe(AUTHORED_ATLAS_WIDTH);
    expect(pngHeight).toBe(AUTHORED_ATLAS_HEIGHT);

    for (const region of AUTHORED_ATLAS_REGIONS) {
      expect(region.x).toBeGreaterThanOrEqual(0);
      expect(region.y).toBeGreaterThanOrEqual(0);
      expect(region.x + region.width).toBeLessThanOrEqual(pngWidth);
      expect(region.y + region.height).toBeLessThanOrEqual(pngHeight);
    }
  });

  it('keeps every pixel in the exterior padding strip beyond authored regions fully transparent', () => {
    const { pngWidth, pngHeight, rgbaPixels } = readCommittedAtlasPng();
    expect(
      regionContainsAnyNonTransparentPixel(
        rgbaPixels,
        pngWidth,
        getExteriorPaddingStripRegion(pngWidth, pngHeight)
      )
    ).toBe(false);
  });

  it('keeps committed non-transparent pixels inside authored regions covered by default metadata or explicit unused documentation', () => {
    const { pngWidth, pngHeight, rgbaPixels } = readCommittedAtlasPng();
    const allowedAtlasIndices = new Set([
      ...collectReferencedAuthoredAtlasIndices(pngWidth, pngHeight),
      ...Object.keys(AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS).map((rawAtlasIndex) =>
        Number(rawAtlasIndex)
      )
    ]);
    const allowedRegions = [...allowedAtlasIndices]
      .sort((a, b) => a - b)
      .map((atlasIndex) => AUTHORED_ATLAS_REGIONS[atlasIndex])
      .filter((region): region is AtlasPixelRegion => region !== undefined);

    expect(allowedRegions.length).toBeGreaterThan(0);

    const spillPixel = findFirstNonTransparentPixelOutsideRegions(
      rgbaPixels,
      pngWidth,
      pngHeight,
      allowedRegions
    );

    expect(
      spillPixel,
      spillPixel
        ? `found non-transparent committed atlas spill at (${spillPixel.x}, ${spillPixel.y}) outside authored regions tracked by shipped metadata or explicit unused-region documentation`
        : undefined
    ).toBeNull();
  });

  it('accounts for every committed authored atlas region through metadata or explicit unused documentation', () => {
    const referencedAtlasIndices = new Set(collectReferencedAtlasIndices());
    const intentionallyUnusedEntries = Object.entries(AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS);
    const intentionallyUnusedAtlasIndices = new Set<number>();

    for (const [rawAtlasIndex, reason] of intentionallyUnusedEntries) {
      const atlasIndex = Number(rawAtlasIndex);

      expect(Number.isInteger(atlasIndex)).toBe(true);
      expect(atlasIndex).toBeGreaterThanOrEqual(0);
      expect(atlasIndex).toBeLessThan(AUTHORED_ATLAS_REGIONS.length);
      expect(reason.trim().length).toBeGreaterThan(0);
      expect(referencedAtlasIndices.has(atlasIndex)).toBe(false);

      intentionallyUnusedAtlasIndices.add(atlasIndex);
    }

    for (let atlasIndex = 0; atlasIndex < AUTHORED_ATLAS_REGIONS.length; atlasIndex += 1) {
      expect(
        referencedAtlasIndices.has(atlasIndex) || intentionallyUnusedAtlasIndices.has(atlasIndex)
      ).toBe(true);
    }
  });

  it('keeps every explicitly unused authored atlas region fully transparent in the committed PNG', () => {
    const { pngWidth, rgbaPixels } = readCommittedAtlasPng();
    const intentionallyUnusedEntries = Object.entries(AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS);

    expect(intentionallyUnusedEntries.length).toBeGreaterThan(0);

    for (const [rawAtlasIndex, reason] of intentionallyUnusedEntries) {
      const atlasIndex = Number(rawAtlasIndex);
      const region = AUTHORED_ATLAS_REGIONS[atlasIndex];

      expect(region, `missing authored region ${atlasIndex} for unused reason "${reason}"`).toBeDefined();
      expect(regionContainsAnyNonTransparentPixel(rgbaPixels, pngWidth, region!)).toBe(false);
    }
  });

  it('keeps every explicitly unused authored atlas region unreferenced by default atlas-index and direct render metadata', () => {
    const { pngWidth, pngHeight } = readCommittedAtlasPng();
    const referencedAtlasIndices = new Set(collectReferencedAtlasIndices());
    const directUvRectAtlasReferences = collectDirectRenderUvRectAuthoredRegionReferences(
      pngWidth,
      pngHeight
    );
    const intentionallyUnusedEntries = Object.entries(AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS);

    expect(intentionallyUnusedEntries.length).toBeGreaterThan(0);

    for (const [rawAtlasIndex, reason] of intentionallyUnusedEntries) {
      const atlasIndex = Number(rawAtlasIndex);
      const directReference = directUvRectAtlasReferences.find(
        (reference) => reference.atlasIndex === atlasIndex
      );

      expect(
        referencedAtlasIndices.has(atlasIndex),
        `unused authored atlas region ${atlasIndex} (${reason}) is still referenced by shipped atlas-index metadata`
      ).toBe(false);
      expect(
        directReference,
        directReference
          ? `unused authored atlas region ${atlasIndex} (${reason}) is overlapped by tile ${directReference.tileId} "${directReference.tileName}" ${directReference.sourcePath}`
          : undefined
      ).toBeUndefined();
    }
  });

  it('keeps committed direct render.uvRect metadata aligned to whole atlas pixels', () => {
    const { pngWidth, pngHeight } = readCommittedAtlasPng();
    const directUvRectTiles = collectDirectRenderUvRectSources();

    expect(directUvRectTiles.length).toBeGreaterThan(0);

    for (const source of directUvRectTiles) {
      const tile = TILE_METADATA.tiles.find((candidate) => candidate.id === source.tileId);
      expect(tile).toBeDefined();

      const warnings = collectAtlasValidationWarnings([tile!], pngWidth, pngHeight).filter(
        (warning) => warning.sourcePath === 'render.uvRect'
      );

      expect(warnings).toEqual([]);
    }
  });

  it('keeps every default direct render.uvRect source non-transparent in the committed PNG', () => {
    const { pngWidth, pngHeight, rgbaPixels } = readCommittedAtlasPng();
    const directUvRectSources = collectDirectRenderUvRectSources();

    expect(directUvRectSources.length).toBeGreaterThan(0);

    for (const source of directUvRectSources) {
      const pixelRegion = uvRectToPixelRegion(source.uvRect, pngWidth, pngHeight);

      expect(regionContainsAnyNonTransparentPixel(rgbaPixels, pngWidth, pixelRegion)).toBe(true);
    }
  });

  it('keeps every static default direct render.uvRect source inside authored atlas regions', () => {
    const { pngWidth, pngHeight } = readCommittedAtlasPng();
    const directUvRectSources = collectDirectRenderUvRectSources();

    expect(directUvRectSources.length).toBeGreaterThan(0);

    for (const source of directUvRectSources) {
      const pixelRegion = uvRectToPixelRegion(source.uvRect, pngWidth, pngHeight);
      const spillPixel = findFirstPixelInRegionOutsideRegions(pixelRegion, AUTHORED_ATLAS_REGIONS);

      expect(
        spillPixel,
        spillPixel
          ? `tile ${source.tileId} "${source.tileName}" static render.uvRect overlaps uncovered atlas pixel (${spillPixel.x}, ${spillPixel.y}) outside authored regions`
          : undefined
      ).toBeNull();
    }
  });

  it('keeps default animated direct render.uvRect frames aligned to whole atlas pixels', () => {
    const { pngWidth, pngHeight } = readCommittedAtlasPng();
    const animatedDirectUvRectFrameSources = collectAnimatedDirectRenderUvRectFrameSources();

    expect(animatedDirectUvRectFrameSources.length).toBeGreaterThan(1);
    expect(animatedDirectUvRectFrameSources.some((source) => source.frameIndex > 0)).toBe(true);

    for (const source of animatedDirectUvRectFrameSources) {
      const tile = TILE_METADATA.tiles.find((candidate) => candidate.id === source.tileId);
      expect(tile).toBeDefined();

      const warnings = collectAtlasValidationWarnings([tile!], pngWidth, pngHeight).filter(
        (warning) => warning.sourcePath === `render.frames[${source.frameIndex}].uvRect`
      );

      expect(warnings).toEqual([]);
    }
  });

  it('ships a default animated direct render.uvRect tile backed by committed atlas pixels', () => {
    const { pngWidth, pngHeight, rgbaPixels } = readCommittedAtlasPng();
    const animatedDirectUvRectFrameSources = collectAnimatedDirectRenderUvRectFrameSources();

    expect(animatedDirectUvRectFrameSources.length).toBeGreaterThan(1);
    expect(animatedDirectUvRectFrameSources.some((source) => source.frameIndex > 0)).toBe(true);

    for (const source of animatedDirectUvRectFrameSources) {
      const pixelRegion = uvRectToPixelRegion(source.uvRect, pngWidth, pngHeight);

      expect(regionContainsAnyNonTransparentPixel(rgbaPixels, pngWidth, pixelRegion)).toBe(true);
    }
  });

  it('keeps every default animated direct render.uvRect frame distinct from its prior committed PNG frame', () => {
    const { pngWidth, pngHeight, rgbaPixels } = readCommittedAtlasPng();
    const animatedFrameTransitions = collectAnimatedDirectRenderUvRectFrameTransitions();

    expect(animatedFrameTransitions.length).toBeGreaterThan(0);

    for (const transition of animatedFrameTransitions) {
      const previousRegion = uvRectToPixelRegion(
        transition.previousUvRect,
        pngWidth,
        pngHeight
      );
      const region = uvRectToPixelRegion(transition.uvRect, pngWidth, pngHeight);

      if (regionsMatchForVisibleContent(rgbaPixels, pngWidth, previousRegion, region)) {
        throw new Error(
          `tile ${transition.tileId} "${transition.tileName}" frame ${transition.frameIndex} matches frame ${transition.previousFrameIndex} in the committed atlas PNG`
        );
      }
    }
  });

  it('keeps every default animated direct render.uvRect frame inside authored atlas regions', () => {
    const { pngWidth, pngHeight } = readCommittedAtlasPng();
    const animatedDirectUvRectFrameSources = collectAnimatedDirectRenderUvRectFrameSources();

    expect(animatedDirectUvRectFrameSources.length).toBeGreaterThan(1);
    expect(animatedDirectUvRectFrameSources.some((source) => source.frameIndex > 0)).toBe(true);

    for (const source of animatedDirectUvRectFrameSources) {
      const pixelRegion = uvRectToPixelRegion(source.uvRect, pngWidth, pngHeight);
      const spillPixel = findFirstPixelInRegionOutsideRegions(pixelRegion, AUTHORED_ATLAS_REGIONS);

      expect(
        spillPixel,
        spillPixel
          ? `tile ${source.tileId} "${source.tileName}" frame ${source.frameIndex} overlaps uncovered atlas pixel (${spillPixel.x}, ${spillPixel.y}) outside authored regions`
          : undefined
      ).toBeNull();
    }
  });

  it('keeps every default direct render.uvRect source out of the exterior padding strip', () => {
    const { pngWidth, pngHeight } = readCommittedAtlasPng();
    const directUvRectSources = collectNamedDirectRenderUvRectSources();
    const exteriorPaddingStrip = getExteriorPaddingStripRegion(pngWidth, pngHeight);

    expect(directUvRectSources.length).toBeGreaterThan(0);
    expect(
      directUvRectSources.some((source) => source.sourcePath !== 'render.uvRect')
    ).toBe(true);

    for (const source of directUvRectSources) {
      const pixelRegion = uvRectToPixelRegion(source.uvRect, pngWidth, pngHeight);

      expect(
        regionsOverlap(pixelRegion, exteriorPaddingStrip),
        `tile ${source.tileId} "${source.tileName}" ${source.sourcePath} overlaps the fully transparent exterior padding strip beyond authored regions`
      ).toBe(false);
    }
  });

  it('keeps every referenced authored atlas region non-transparent in the committed PNG', () => {
    const { pngWidth, rgbaPixels } = readCommittedAtlasPng();
    const referencedAtlasIndices = collectReferencedAtlasIndices();

    expect(referencedAtlasIndices.length).toBeGreaterThan(0);

    for (const atlasIndex of referencedAtlasIndices) {
      const region = AUTHORED_ATLAS_REGIONS[atlasIndex];

      expect(region).toBeDefined();
      expect(regionContainsAnyNonTransparentPixel(rgbaPixels, pngWidth, region!)).toBe(true);
    }
  });

  it('keeps every default animated atlas-index frame distinct from its prior committed PNG frame', () => {
    const { pngWidth, rgbaPixels } = readCommittedAtlasPng();
    const animatedFrameTransitions = collectAnimatedAtlasIndexFrameTransitions();

    expect(animatedFrameTransitions.length).toBeGreaterThan(0);

    for (const transition of animatedFrameTransitions) {
      const previousRegion = AUTHORED_ATLAS_REGIONS[transition.previousAtlasIndex];
      const region = AUTHORED_ATLAS_REGIONS[transition.atlasIndex];

      expect(previousRegion).toBeDefined();
      expect(region).toBeDefined();

      if (regionsMatchForVisibleContent(rgbaPixels, pngWidth, previousRegion!, region!)) {
        throw new Error(
          `tile ${transition.tileId} "${transition.tileName}" frame ${transition.frameIndex} matches frame ${transition.previousFrameIndex} in the committed atlas PNG`
        );
      }
    }
  });
});
