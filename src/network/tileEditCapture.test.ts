import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIQUID_LEVEL } from '../world/constants';
import { TileWorld } from '../world/world';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  NETWORK_CHUNK_TILE_ORDER,
  NETWORK_PROTOCOL_VERSION
} from './protocol';
import { AuthoritativeTileEditCapture } from './tileEditCapture';

const WATER_TILE_ID = 7;

describe('AuthoritativeTileEditCapture', () => {
  it('records detached tile edit notifications and drains them through same-tick chunk diff batching', () => {
    const capture = new AuthoritativeTileEditCapture();
    const firstNotification = {
      worldTileX: 0,
      worldTileY: 0,
      previousTileId: 1,
      previousLiquidLevel: 0,
      tileId: WATER_TILE_ID,
      liquidLevel: MAX_LIQUID_LEVEL
    };

    capture.recordTileEditNotification(firstNotification);
    capture.recordTileEditNotification({
      worldTileX: -1,
      worldTileY: 0,
      previousTileId: 3,
      previousLiquidLevel: 0,
      tileId: 4,
      liquidLevel: 0
    });
    capture.recordTileEditNotification({
      worldTileX: 0,
      worldTileY: 0,
      previousTileId: WATER_TILE_ID,
      previousLiquidLevel: MAX_LIQUID_LEVEL,
      tileId: WATER_TILE_ID,
      liquidLevel: MAX_LIQUID_LEVEL / 2
    });

    firstNotification.tileId = 99;
    firstNotification.liquidLevel = 0;

    expect(capture.drainChunkDiffMessages(12)).toEqual([
      {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 12,
        chunk: {
          x: -1,
          y: 0
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        tiles: [
          {
            tileIndex: CHUNK_SIZE - 1,
            tileId: 4,
            liquidLevel: 0
          }
        ]
      },
      {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 12,
        chunk: {
          x: 0,
          y: 0
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        tiles: [
          {
            tileIndex: 0,
            tileId: WATER_TILE_ID,
            liquidLevel: MAX_LIQUID_LEVEL / 2
          }
        ]
      }
    ]);

    expect(capture.drainChunkDiffMessages(13)).toEqual([]);
  });

  it('accepts TileWorld edit notifications with full liquid state', () => {
    const world = new TileWorld(0);
    const capture = new AuthoritativeTileEditCapture();

    world.onTileEdited((event) => {
      capture.recordTileEditNotification(event);
    });

    expect(world.setTileState(0, 0, WATER_TILE_ID, MAX_LIQUID_LEVEL)).toBe(true);
    expect(world.setTileState(0, 0, WATER_TILE_ID, MAX_LIQUID_LEVEL / 2)).toBe(true);

    expect(capture.drainChunkDiffMessages(4)).toEqual([
      {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 4,
        chunk: {
          x: 0,
          y: 0
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        tiles: [
          {
            tileIndex: 0,
            tileId: WATER_TILE_ID,
            liquidLevel: MAX_LIQUID_LEVEL / 2
          }
        ]
      }
    ]);
  });

  it('can reset pending notifications before drain', () => {
    const capture = new AuthoritativeTileEditCapture();

    capture.recordTileEditNotification({
      worldTileX: 2,
      worldTileY: 3,
      previousTileId: 0,
      previousLiquidLevel: 0,
      tileId: 5,
      liquidLevel: 0
    });
    capture.reset();

    expect(capture.drainChunkDiffMessages(7)).toEqual([]);
  });
});
