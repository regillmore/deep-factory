import { describe, expect, it } from 'vitest';

import { AUTHORED_ATLAS_HEIGHT, AUTHORED_ATLAS_WIDTH } from './authoredAtlasLayout';
import { atlasIndexToUvRect, describeTileUvRect, describeTileUvRectPixelBounds } from './tileMetadata';
import {
  WALL_METADATA,
  describeWallRenderPixelBounds,
  describeWallRenderSource,
  describeWallRenderUvRect,
  getWallMetadata,
  parseWallMetadataRegistry,
  resolveWallRenderMetadata,
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
        atlasIndex: 35
      }
    });
    expect(resolveWallRenderUvRect(1)).toEqual(atlasIndexToUvRect(34));
    expect(resolveWallRenderUvRect(2)).toEqual(atlasIndexToUvRect(35));
    expect(resolveWallRenderUvRect(999)).toBeNull();
    expect(WALL_METADATA.walls).toHaveLength(3);
  });

  it('describes starter wall render sources and authored bounds through shared helpers', () => {
    expect(resolveWallRenderMetadata(0)).toBeNull();
    expect(resolveWallRenderMetadata(1)).toEqual({ atlasIndex: 34 });
    expect(resolveWallRenderMetadata(2)).toEqual({ atlasIndex: 35 });
    expect(describeWallRenderSource(0)).toBeNull();
    expect(describeWallRenderSource(1)).toBe('atlasIndex 34');
    expect(describeWallRenderSource(2)).toBe('atlasIndex 35');
    expect(describeWallRenderUvRect(1)).toBe(describeTileUvRect(atlasIndexToUvRect(34)));
    expect(describeWallRenderUvRect(2)).toBe(describeTileUvRect(atlasIndexToUvRect(35)));
    expect(describeWallRenderPixelBounds(1, AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)).toBe(
      describeTileUvRectPixelBounds(atlasIndexToUvRect(34), AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)
    );
    expect(describeWallRenderPixelBounds(2, AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)).toBe(
      describeTileUvRectPixelBounds(atlasIndexToUvRect(35), AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)
    );
    expect(describeWallRenderPixelBounds(999, AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)).toBeNull();
  });

  it('rejects duplicate wall ids', () => {
    expect(() =>
      parseWallMetadataRegistry({
        walls: [
          { id: 0, name: 'empty' },
          { id: 1, name: 'dirt_wall', render: { atlasIndex: 34 } },
          { id: 1, name: 'wood_wall', render: { atlasIndex: 35 } }
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
