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

const regionContainsAnyNonTransparentPixel = (
  rgbaPixels: Uint8Array,
  pngWidth: number,
  region: { x: number; y: number; width: number; height: number }
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

  it('keeps committed direct render.uvRect metadata aligned to whole atlas pixels', () => {
    const { pngWidth, pngHeight } = readCommittedAtlasPng();
    const directUvRectTiles = TILE_METADATA.tiles.filter((tile) => tile.render?.uvRect !== undefined);

    expect(directUvRectTiles.length).toBeGreaterThan(0);

    for (const tile of directUvRectTiles) {
      const warnings = collectAtlasValidationWarnings([tile], pngWidth, pngHeight).filter(
        (warning) => warning.sourcePath === 'render.uvRect'
      );

      expect(warnings).toEqual([]);
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
});
