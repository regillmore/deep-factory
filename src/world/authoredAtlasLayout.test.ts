import { describe, expect, it } from 'vitest';

import {
  AUTHORED_ATLAS_HEIGHT,
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
});
