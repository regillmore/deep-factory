import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  AUTHORED_ATLAS_HEIGHT,
  AUTHORED_ATLAS_REGIONS,
  AUTHORED_ATLAS_WIDTH
} from '../world/authoredAtlasLayout';

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const readPngDimension = (data: Uint8Array, byteOffset: number): number =>
  (
    (data[byteOffset]! << 24) |
    (data[byteOffset + 1]! << 16) |
    (data[byteOffset + 2]! << 8) |
    data[byteOffset + 3]!
  ) >>> 0;

describe('authored atlas asset', () => {
  it('ships a committed PNG compatible with the authored atlas region layout', () => {
    const atlasPath = resolve(process.cwd(), 'public/atlas/tile-atlas.png');

    expect(existsSync(atlasPath)).toBe(true);

    const data = readFileSync(atlasPath);
    const pngWidth = readPngDimension(data, 16);
    const pngHeight = readPngDimension(data, 20);

    expect(data.subarray(0, PNG_SIGNATURE.length)).toEqual(Buffer.from(PNG_SIGNATURE));
    expect(pngWidth).toBe(AUTHORED_ATLAS_WIDTH);
    expect(pngHeight).toBe(AUTHORED_ATLAS_HEIGHT);

    for (const region of AUTHORED_ATLAS_REGIONS) {
      expect(region.x).toBeGreaterThanOrEqual(0);
      expect(region.y).toBeGreaterThanOrEqual(0);
      expect(region.x + region.width).toBeLessThanOrEqual(pngWidth);
      expect(region.y + region.height).toBeLessThanOrEqual(pngHeight);
    }
  });
});
