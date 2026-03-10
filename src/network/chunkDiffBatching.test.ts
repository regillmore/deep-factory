import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIQUID_LEVEL } from '../world/constants';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  NETWORK_CHUNK_TILE_ORDER,
  NETWORK_PROTOCOL_VERSION
} from './protocol';
import { createAuthoritativeChunkDiffMessages } from './chunkDiffBatching';

const WATER_TILE_ID = 7;

describe('createAuthoritativeChunkDiffMessages', () => {
  it('groups same-tick tile edits by chunk, keeps only the last tile state, and omits net no-op edits', () => {
    const edits = [
      {
        worldTileX: 0,
        worldTileY: 0,
        previousTileId: 1,
        previousLiquidLevel: 0,
        tileId: WATER_TILE_ID,
        liquidLevel: MAX_LIQUID_LEVEL
      },
      {
        worldTileX: 33,
        worldTileY: -1,
        previousTileId: 0,
        previousLiquidLevel: 0,
        tileId: 9,
        liquidLevel: 0
      },
      {
        worldTileX: -1,
        worldTileY: 0,
        previousTileId: 3,
        previousLiquidLevel: 0,
        tileId: 4,
        liquidLevel: 0
      },
      {
        worldTileX: 0,
        worldTileY: 0,
        previousTileId: WATER_TILE_ID,
        previousLiquidLevel: MAX_LIQUID_LEVEL,
        tileId: WATER_TILE_ID,
        liquidLevel: MAX_LIQUID_LEVEL / 2
      },
      {
        worldTileX: 5,
        worldTileY: 5,
        previousTileId: 2,
        previousLiquidLevel: 0,
        tileId: 8,
        liquidLevel: 0
      },
      {
        worldTileX: 5,
        worldTileY: 5,
        previousTileId: 8,
        previousLiquidLevel: 0,
        tileId: 2,
        liquidLevel: 0
      }
    ];

    const messages = createAuthoritativeChunkDiffMessages({
      tick: 12,
      edits
    });

    expect(messages).toEqual([
      {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 12,
        chunk: {
          x: 1,
          y: -1
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        tiles: [
          {
            tileIndex: (CHUNK_SIZE - 1) * CHUNK_SIZE + 1,
            tileId: 9,
            liquidLevel: 0
          }
        ]
      },
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

    edits[0]!.tileId = 99;
    expect(messages[2]!.tiles[0]!.tileId).toBe(WATER_TILE_ID);
  });

  it('returns no messages when the same-tick edits settle back to their original state', () => {
    expect(
      createAuthoritativeChunkDiffMessages({
        tick: 3,
        edits: [
          {
            worldTileX: 2,
            worldTileY: -2,
            previousTileId: 1,
            previousLiquidLevel: 0,
            tileId: 5,
            liquidLevel: 0
          },
          {
            worldTileX: 2,
            worldTileY: -2,
            previousTileId: 5,
            previousLiquidLevel: 0,
            tileId: 1,
            liquidLevel: 0
          }
        ]
      })
    ).toEqual([]);
  });

  it('rejects incoherent previous state when repeated edits for one tile do not chain together', () => {
    expect(() =>
      createAuthoritativeChunkDiffMessages({
        tick: 5,
        edits: [
          {
            worldTileX: 0,
            worldTileY: 0,
            previousTileId: 1,
            previousLiquidLevel: 0,
            tileId: 2,
            liquidLevel: 0
          },
          {
            worldTileX: 0,
            worldTileY: 0,
            previousTileId: 7,
            previousLiquidLevel: 0,
            tileId: 3,
            liquidLevel: 0
          }
        ]
      })
    ).toThrow(
      'edits[1] previous state must match the prior same-tick result at world tile (0, 0)'
    );
  });
});
