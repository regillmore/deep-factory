import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, TILE_SIZE } from './constants';
import { doesAabbOverlapSolid, isSolidAt, sweepAabbAlongAxis } from './collision';
import { TileWorld } from './world';

const SKY_TILE_Y = -20;

describe('world collision queries', () => {
  it('resolves solidity from tile gameplay metadata instead of raw non-zero tile ids', () => {
    const world = new TileWorld(0);

    world.setTile(5, SKY_TILE_Y, 4);
    world.setTile(6, SKY_TILE_Y, 3);

    expect(isSolidAt(world, 5, SKY_TILE_Y)).toBe(false);
    expect(isSolidAt(world, 6, SKY_TILE_Y)).toBe(true);
  });

  it('treats edge contact as non-overlap and still finds solid tiles across chunk boundaries', () => {
    const world = new TileWorld(0);
    const tileX = CHUNK_SIZE;
    const tileY = SKY_TILE_Y;
    const minX = tileX * TILE_SIZE;
    const minY = tileY * TILE_SIZE;

    world.setTile(tileX, tileY, 3);

    expect(
      doesAabbOverlapSolid(world, {
        minX,
        minY,
        maxX: minX + TILE_SIZE,
        maxY: minY + TILE_SIZE
      })
    ).toBe(true);

    expect(
      doesAabbOverlapSolid(world, {
        minX: minX - TILE_SIZE,
        minY,
        maxX: minX,
        maxY: minY + TILE_SIZE
      })
    ).toBe(false);
  });

  it('clamps positive x-axis sweeps to the first solid tile entered', () => {
    const world = new TileWorld(0);
    const tileX = 2;
    const tileY = SKY_TILE_Y;

    world.setTile(tileX, tileY, 3);

    const result = sweepAabbAlongAxis(
      world,
      {
        minX: tileX * TILE_SIZE - 14,
        minY: tileY * TILE_SIZE + 2,
        maxX: tileX * TILE_SIZE - 2,
        maxY: tileY * TILE_SIZE + 14
      },
      'x',
      10
    );

    expect(result).toEqual({
      attemptedDelta: 10,
      allowedDelta: 2,
      hit: {
        tileX,
        tileY,
        tileId: 3
      }
    });
  });

  it('clamps negative y-axis sweeps to the first solid ceiling tile entered', () => {
    const world = new TileWorld(0);
    const tileX = 0;
    const tileY = SKY_TILE_Y - 1;

    world.setTile(tileX, tileY, 3);

    const result = sweepAabbAlongAxis(
      world,
      {
        minX: tileX * TILE_SIZE + 2,
        minY: (tileY + 1) * TILE_SIZE + 2,
        maxX: tileX * TILE_SIZE + 14,
        maxY: (tileY + 1) * TILE_SIZE + 14
      },
      'y',
      -20
    );

    expect(result).toEqual({
      attemptedDelta: -20,
      allowedDelta: -2,
      hit: {
        tileX,
        tileY,
        tileId: 3
      }
    });
  });

  it('returns the full delta when an axis sweep does not encounter solid tiles', () => {
    const world = new TileWorld(0);

    const result = sweepAabbAlongAxis(
      world,
      {
        minX: 2,
        minY: SKY_TILE_Y * TILE_SIZE + 2,
        maxX: 14,
        maxY: SKY_TILE_Y * TILE_SIZE + 14
      },
      'y',
      12
    );

    expect(result).toEqual({
      attemptedDelta: 12,
      allowedDelta: 12,
      hit: null
    });
  });
});
