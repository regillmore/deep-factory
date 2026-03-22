import { describe, expect, it } from 'vitest';

import { atlasIndexToUvRect } from './tileMetadata';
import {
  WALL_METADATA,
  getWallMetadata,
  parseWallMetadataRegistry,
  resolveWallRenderUvRect
} from './wallMetadata';

describe('wallMetadata', () => {
  it('exposes starter wall metadata through the shared wall registry', () => {
    expect(getWallMetadata(0)).toEqual({
      id: 0,
      name: 'empty'
    });
    expect(getWallMetadata(1)).toEqual({
      id: 1,
      name: 'dirt_wall',
      render: {
        atlasIndex: 34
      }
    });
    expect(getWallMetadata(2)).toEqual({
      id: 2,
      name: 'wood_wall',
      render: {
        atlasIndex: 33
      }
    });
    expect(resolveWallRenderUvRect(1)).toEqual(atlasIndexToUvRect(34));
    expect(resolveWallRenderUvRect(2)).toEqual(atlasIndexToUvRect(33));
    expect(resolveWallRenderUvRect(999)).toBeNull();
    expect(WALL_METADATA.walls).toHaveLength(3);
  });

  it('rejects duplicate wall ids', () => {
    expect(() =>
      parseWallMetadataRegistry({
        walls: [
          { id: 0, name: 'empty' },
          { id: 1, name: 'dirt_wall', render: { atlasIndex: 34 } },
          { id: 1, name: 'wood_wall', render: { atlasIndex: 33 } }
        ]
      })
    ).toThrowError(/duplicate wall id 1/);
  });

  it('requires render metadata for non-empty walls', () => {
    expect(() =>
      parseWallMetadataRegistry({
        walls: [
          { id: 0, name: 'empty' },
          { id: 1, name: 'dirt_wall' }
        ]
      })
    ).toThrowError(/render is required for non-empty wall 1/);
  });
});
