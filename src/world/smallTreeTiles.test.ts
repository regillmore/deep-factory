import { describe, expect, it } from 'vitest';

import { parseTileMetadataRegistry } from './tileMetadata';
import {
  getSmallTreeLeafTileId,
  getSmallTreeSaplingTileId,
  getSmallTreeTileIds,
  getSmallTreeTrunkTileId,
  isSmallTreeLeafTileId,
  isSmallTreeSaplingTileId,
  isSmallTreeTileId,
  isSmallTreeTrunkTileId
} from './smallTreeTiles';

describe('smallTreeTiles', () => {
  it('pins the shipped sapling, trunk, and leaf tile ids', () => {
    expect(getSmallTreeTileIds()).toEqual({
      sapling: 16,
      trunk: 17,
      leaf: 18
    });
    expect(getSmallTreeSaplingTileId()).toBe(16);
    expect(getSmallTreeTrunkTileId()).toBe(17);
    expect(getSmallTreeLeafTileId()).toBe(18);
  });

  it('classifies shipped small-tree tiles without matching ordinary terrain', () => {
    expect(isSmallTreeSaplingTileId(16)).toBe(true);
    expect(isSmallTreeSaplingTileId(17)).toBe(false);
    expect(isSmallTreeTrunkTileId(17)).toBe(true);
    expect(isSmallTreeTrunkTileId(18)).toBe(false);
    expect(isSmallTreeLeafTileId(18)).toBe(true);
    expect(isSmallTreeLeafTileId(16)).toBe(false);
    expect(isSmallTreeTileId(16)).toBe(true);
    expect(isSmallTreeTileId(17)).toBe(true);
    expect(isSmallTreeTileId(18)).toBe(true);
    expect(isSmallTreeTileId(1)).toBe(false);
    expect(isSmallTreeTileId(10)).toBe(false);
    expect(isSmallTreeTileId(0)).toBe(false);
  });

  it('resolves small-tree ids by tile name from a provided registry', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 4,
          name: 'small_tree_leaf',
          render: { atlasIndex: 25 }
        },
        {
          id: 7,
          name: 'placeholder_stone',
          render: { atlasIndex: 14 }
        },
        {
          id: 11,
          name: 'small_tree_sapling',
          render: { atlasIndex: 23 }
        },
        {
          id: 23,
          name: 'small_tree_trunk',
          render: { atlasIndex: 24 }
        }
      ]
    });

    expect(getSmallTreeTileIds(registry)).toEqual({
      sapling: 11,
      trunk: 23,
      leaf: 4
    });
    expect(getSmallTreeSaplingTileId(registry)).toBe(11);
    expect(getSmallTreeTrunkTileId(registry)).toBe(23);
    expect(getSmallTreeLeafTileId(registry)).toBe(4);
    expect(isSmallTreeSaplingTileId(11, registry)).toBe(true);
    expect(isSmallTreeTrunkTileId(23, registry)).toBe(true);
    expect(isSmallTreeLeafTileId(4, registry)).toBe(true);
    expect(isSmallTreeTileId(7, registry)).toBe(false);
  });
});
