import { describe, expect, it } from 'vitest';

import {
  GROWN_SMALL_TREE_FOOTPRINT_CELLS,
  GROWN_SMALL_TREE_LOCAL_OFFSETS,
  PLANTED_SMALL_TREE_FOOTPRINT_CELLS,
  PLANTED_SMALL_TREE_LOCAL_OFFSETS,
  isGrownSmallTreeOccupiedLocalOffset,
  isPlantedSmallTreeOccupiedLocalOffset
} from './smallTreeFootprints';

describe('smallTreeFootprints', () => {
  it('pins the planted sapling footprint above the planted support anchor cell', () => {
    expect(PLANTED_SMALL_TREE_FOOTPRINT_CELLS).toEqual([
      { localX: 0, localY: -1, tileKind: 'sapling' }
    ]);
    expect(PLANTED_SMALL_TREE_LOCAL_OFFSETS).toEqual([{ localX: 0, localY: -1 }]);
  });

  it('pins the grown placeholder tree to a support-anchored trunk and three-leaf canopy layout', () => {
    expect(GROWN_SMALL_TREE_FOOTPRINT_CELLS).toEqual([
      { localX: 0, localY: -1, tileKind: 'trunk' },
      { localX: 0, localY: -2, tileKind: 'trunk' },
      { localX: -1, localY: -3, tileKind: 'leaf' },
      { localX: 0, localY: -3, tileKind: 'leaf' },
      { localX: 1, localY: -3, tileKind: 'leaf' }
    ]);
    expect(GROWN_SMALL_TREE_LOCAL_OFFSETS).toEqual([
      { localX: 0, localY: -1 },
      { localX: 0, localY: -2 },
      { localX: -1, localY: -3 },
      { localX: 0, localY: -3 },
      { localX: 1, localY: -3 }
    ]);
  });

  it('matches occupied-cell predicates to the exported planted and grown local offsets', () => {
    expect(isPlantedSmallTreeOccupiedLocalOffset(0, 0)).toBe(false);
    expect(isPlantedSmallTreeOccupiedLocalOffset(0, -1)).toBe(true);
    expect(isPlantedSmallTreeOccupiedLocalOffset(1, 0)).toBe(false);

    expect(isGrownSmallTreeOccupiedLocalOffset(0, -1)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(0, -2)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(-1, -3)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(0, -3)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(1, -3)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(0, 0)).toBe(false);
    expect(isGrownSmallTreeOccupiedLocalOffset(-1, -2)).toBe(false);
    expect(isGrownSmallTreeOccupiedLocalOffset(1, -2)).toBe(false);
    expect(isGrownSmallTreeOccupiedLocalOffset(0, -4)).toBe(false);
    expect(isGrownSmallTreeOccupiedLocalOffset(2, -3)).toBe(false);
  });
});
