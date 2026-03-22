import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from '../world/constants';
import {
  CHUNK_WALL_DIFF_MESSAGE_KIND,
  NETWORK_CHUNK_TILE_ORDER,
  NETWORK_PROTOCOL_VERSION
} from './protocol';
import { createAuthoritativeChunkWallDiffMessages } from './chunkWallDiffBatching';

describe('createAuthoritativeChunkWallDiffMessages', () => {
  it('groups same-tick wall edits by chunk, keeps only the last wall state, and omits net no-op edits', () => {
    const edits = [
      {
        worldTileX: 0,
        worldTileY: 0,
        previousWallId: 1,
        wallId: 7
      },
      {
        worldTileX: 33,
        worldTileY: -1,
        previousWallId: 0,
        wallId: 9
      },
      {
        worldTileX: -1,
        worldTileY: 0,
        previousWallId: 3,
        wallId: 4
      },
      {
        worldTileX: 0,
        worldTileY: 0,
        previousWallId: 7,
        wallId: 2
      },
      {
        worldTileX: 5,
        worldTileY: 5,
        previousWallId: 2,
        wallId: 8
      },
      {
        worldTileX: 5,
        worldTileY: 5,
        previousWallId: 8,
        wallId: 2
      }
    ];

    const messages = createAuthoritativeChunkWallDiffMessages({
      tick: 12,
      edits
    });

    expect(messages).toEqual([
      {
        kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 12,
        chunk: {
          x: 1,
          y: -1
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        walls: [
          {
            tileIndex: (CHUNK_SIZE - 1) * CHUNK_SIZE + 1,
            wallId: 9
          }
        ]
      },
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

    edits[0]!.wallId = 99;
    expect(messages[2]!.walls[0]!.wallId).toBe(2);
  });

  it('returns no messages when the same-tick edits settle back to their original wall state', () => {
    expect(
      createAuthoritativeChunkWallDiffMessages({
        tick: 3,
        edits: [
          {
            worldTileX: 2,
            worldTileY: -2,
            previousWallId: 1,
            wallId: 5
          },
          {
            worldTileX: 2,
            worldTileY: -2,
            previousWallId: 5,
            wallId: 1
          }
        ]
      })
    ).toEqual([]);
  });

  it('rejects incoherent previous wall state when repeated edits for one cell do not chain together', () => {
    expect(() =>
      createAuthoritativeChunkWallDiffMessages({
        tick: 5,
        edits: [
          {
            worldTileX: 0,
            worldTileY: 0,
            previousWallId: 1,
            wallId: 2
          },
          {
            worldTileX: 0,
            worldTileY: 0,
            previousWallId: 7,
            wallId: 3
          }
        ]
      })
    ).toThrow(
      'edits[1] previous state must match the prior same-tick result at world tile (0, 0)'
    );
  });
});
