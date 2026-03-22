import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from '../world/constants';
import { TileWorld } from '../world/world';
import {
  CHUNK_WALL_DIFF_MESSAGE_KIND,
  NETWORK_CHUNK_TILE_ORDER,
  NETWORK_PROTOCOL_VERSION
} from './protocol';
import { AuthoritativeWallEditCapture } from './wallEditCapture';

describe('AuthoritativeWallEditCapture', () => {
  it('records detached wall edit notifications and drains them through same-tick chunk wall diff batching', () => {
    const capture = new AuthoritativeWallEditCapture();
    const firstNotification = {
      worldTileX: 0,
      worldTileY: 0,
      previousWallId: 1,
      wallId: 7
    };

    capture.recordWallEditNotification(firstNotification);
    capture.recordWallEditNotification({
      worldTileX: -1,
      worldTileY: 0,
      previousWallId: 3,
      wallId: 4
    });
    capture.recordWallEditNotification({
      worldTileX: 0,
      worldTileY: 0,
      previousWallId: 7,
      wallId: 2
    });

    firstNotification.wallId = 99;

    expect(capture.drainChunkWallDiffMessages(12)).toEqual([
      {
        kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 12,
        chunk: {
          x: -1,
          y: 0
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        walls: [
          {
            tileIndex: CHUNK_SIZE - 1,
            wallId: 4
          }
        ]
      },
      {
        kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 12,
        chunk: {
          x: 0,
          y: 0
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        walls: [
          {
            tileIndex: 0,
            wallId: 2
          }
        ]
      }
    ]);

    expect(capture.drainChunkWallDiffMessages(13)).toEqual([]);
  });

  it('accepts TileWorld wall edit notifications', () => {
    const world = new TileWorld(0);
    const capture = new AuthoritativeWallEditCapture();

    world.onWallEdited((event) => {
      capture.recordWallEditNotification(event);
    });

    expect(world.setWall(0, 0, 7)).toBe(true);
    expect(world.setWall(0, 0, 2)).toBe(true);

    expect(capture.drainChunkWallDiffMessages(4)).toEqual([
      {
        kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 4,
        chunk: {
          x: 0,
          y: 0
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        walls: [
          {
            tileIndex: 0,
            wallId: 2
          }
        ]
      }
    ]);
  });

  it('can reset pending wall notifications before drain', () => {
    const capture = new AuthoritativeWallEditCapture();

    capture.recordWallEditNotification({
      worldTileX: 2,
      worldTileY: 3,
      previousWallId: 0,
      wallId: 5
    });
    capture.reset();

    expect(capture.drainChunkWallDiffMessages(7)).toEqual([]);
  });
});
