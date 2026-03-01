import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { TILE_ATLAS_COLUMNS, TILE_ATLAS_ROWS, TILE_SIZE } from '../world/constants';

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const readPngDimension = (data: Uint8Array, byteOffset: number): number =>
  (
    (data[byteOffset]! << 24) |
    (data[byteOffset + 1]! << 16) |
    (data[byteOffset + 2]! << 8) |
    data[byteOffset + 3]!
  ) >>> 0;

describe('authored atlas asset', () => {
  it('ships a committed PNG compatible with the current 4x4 tile slot layout', () => {
    const atlasPath = resolve(process.cwd(), 'public/atlas/tile-atlas.png');

    expect(existsSync(atlasPath)).toBe(true);

    const data = readFileSync(atlasPath);
    expect(data.subarray(0, PNG_SIGNATURE.length)).toEqual(Buffer.from(PNG_SIGNATURE));
    expect(readPngDimension(data, 16)).toBe(TILE_ATLAS_COLUMNS * TILE_SIZE);
    expect(readPngDimension(data, 20)).toBe(TILE_ATLAS_ROWS * TILE_SIZE);
  });
});
