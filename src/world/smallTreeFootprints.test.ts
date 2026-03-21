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
  it('pins the planted sapling footprint to the planted anchor cell', () => {
    expect(PLANTED_SMALL_TREE_FOOTPRINT_CELLS).toEqual([
      { localX: 0, localY: 0, tileKind: 'sapling' }
    ]);
    expect(PLANTED_SMALL_TREE_LOCAL_OFFSETS).toEqual([{ localX: 0, localY: 0 }]);
  });

  it('pins the grown placeholder tree to a base-anchored trunk and three-leaf canopy layout', () => {
    expect(GROWN_SMALL_TREE_FOOTPRINT_CELLS).toEqual([
      { localX: 0, localY: 0, tileKind: 'trunk' },
      { localX: 0, localY: -1, tileKind: 'trunk' },
      { localX: -1, localY: -2, tileKind: 'leaf' },
      { localX: 0, localY: -2, tileKind: 'leaf' },
      { localX: 1, localY: -2, tileKind: 'leaf' }
    ]);
    expect(GROWN_SMALL_TREE_LOCAL_OFFSETS).toEqual([
      { localX: 0, localY: 0 },
      { localX: 0, localY: -1 },
      { localX: -1, localY: -2 },
      { localX: 0, localY: -2 },
      { localX: 1, localY: -2 }
    ]);
  });

  it('matches occupied-cell predicates to the exported planted and grown local offsets', () => {
    expect(isPlantedSmallTreeOccupiedLocalOffset(0, 0)).toBe(true);
    expect(isPlantedSmallTreeOccupiedLocalOffset(0, -1)).toBe(false);
    expect(isPlantedSmallTreeOccupiedLocalOffset(1, 0)).toBe(false);

    expect(isGrownSmallTreeOccupiedLocalOffset(0, 0)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(0, -1)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(-1, -2)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(0, -2)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(1, -2)).toBe(true);
    expect(isGrownSmallTreeOccupiedLocalOffset(-1, -1)).toBe(false);
    expect(isGrownSmallTreeOccupiedLocalOffset(1, -1)).toBe(false);
    expect(isGrownSmallTreeOccupiedLocalOffset(0, -3)).toBe(false);
    expect(isGrownSmallTreeOccupiedLocalOffset(2, -2)).toBe(false);
  });
});
