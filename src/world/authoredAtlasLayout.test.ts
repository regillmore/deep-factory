import { describe, expect, it } from 'vitest';

import {
  AUTHORED_ATLAS_HEIGHT,
  AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS,
  AUTHORED_ATLAS_REGIONS,
  AUTHORED_ATLAS_WIDTH
} from './authoredAtlasLayout';

const regionsOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

describe('authored atlas layout', () => {
  it('defines non-overlapping positive-area regions inside the authored atlas bounds', () => {
    for (const [index, region] of AUTHORED_ATLAS_REGIONS.entries()) {
      expect(region.width).toBeGreaterThan(0);
      expect(region.height).toBeGreaterThan(0);
      expect(region.x).toBeGreaterThanOrEqual(0);
      expect(region.y).toBeGreaterThanOrEqual(0);
      expect(region.x + region.width).toBeLessThanOrEqual(AUTHORED_ATLAS_WIDTH);
      expect(region.y + region.height).toBeLessThanOrEqual(AUTHORED_ATLAS_HEIGHT);

      for (let otherIndex = index + 1; otherIndex < AUTHORED_ATLAS_REGIONS.length; otherIndex += 1) {
        expect(regionsOverlap(region, AUTHORED_ATLAS_REGIONS[otherIndex]!)).toBe(false);
      }
    }
  });

  it('documents utility, terrain, spare-slot, and torch authored regions while leaving canvas space outside authored bounds', () => {
    expect(AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS[21]?.trim().length).toBeGreaterThan(0);

    expect(AUTHORED_ATLAS_REGIONS[20]).toEqual({ x: 80, y: 32, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[21]).toEqual({ x: 80, y: 48, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[22]).toEqual({ x: 96, y: 32, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[23]).toEqual({ x: 80, y: 0, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[24]).toEqual({ x: 96, y: 0, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[25]).toEqual({ x: 80, y: 16, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[26]).toEqual({ x: 96, y: 16, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[27]).toEqual({ x: 112, y: 0, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[28]).toEqual({ x: 112, y: 16, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[29]).toEqual({ x: 128, y: 0, width: 16, height: 16 });
    expect(AUTHORED_ATLAS_REGIONS[30]).toEqual({ x: 128, y: 16, width: 16, height: 16 });

    const maxRegionRight = AUTHORED_ATLAS_REGIONS.reduce(
      (maxRight, region) => Math.max(maxRight, region.x + region.width),
      0
    );

    expect(maxRegionRight).toBe(144);
    expect(maxRegionRight).toBeLessThan(AUTHORED_ATLAS_WIDTH);
  });
});
