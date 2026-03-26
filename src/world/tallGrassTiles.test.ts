import { describe, expect, it } from 'vitest';

import { parseTileMetadataRegistry } from './tileMetadata';
import { getTallGrassTileId, isTallGrassTileId } from './tallGrassTiles';

describe('tallGrassTiles', () => {
  it('pins the shipped tall-grass tile id', () => {
    expect(getTallGrassTileId()).toBe(21);
    expect(isTallGrassTileId(21)).toBe(true);
    expect(isTallGrassTileId(16)).toBe(false);
    expect(isTallGrassTileId(0)).toBe(false);
  });

  it('resolves tall-grass ids by tile name from a provided registry', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 4,
          name: 'placeholder_stone',
          render: { atlasIndex: 14 }
        },
        {
          id: 11,
          name: 'tall_grass',
          render: { atlasIndex: 23 }
        }
      ]
    });

    expect(getTallGrassTileId(registry)).toBe(11);
    expect(isTallGrassTileId(11, registry)).toBe(true);
    expect(isTallGrassTileId(4, registry)).toBe(false);
  });
});
