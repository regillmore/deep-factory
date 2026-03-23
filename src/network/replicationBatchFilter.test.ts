import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIQUID_LEVEL } from '../world/constants';
import {
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
  filterAuthoritativeReplicatedStateBatchByInterestSet
} from './replicationBatchFilter';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  CHUNK_WALL_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND,
  NETWORK_CHUNK_TILE_ORDER,
  NETWORK_PROTOCOL_VERSION,
  createEntitySnapshotMessage
} from './protocol';
import { stageAuthoritativeReplicatedStateBatch } from './replicationStaging';
import { AuthoritativeTileEditCapture } from './tileEditCapture';
import { AuthoritativeWallEditCapture } from './wallEditCapture';

const WATER_TILE_ID = 7;

describe('filterAuthoritativeReplicatedStateBatchByInterestSet', () => {
  it('returns only forwarded staged messages plus deterministic per-message drop or trim diagnostics', () => {
    const tileCapture = new AuthoritativeTileEditCapture();
    const wallCapture = new AuthoritativeWallEditCapture();

    tileCapture.recordTileEditNotification({
      worldTileX: -1,
      worldTileY: 0,
      previousTileId: 3,
      previousLiquidLevel: 0,
      tileId: 4,
      liquidLevel: 0
    });
    tileCapture.recordTileEditNotification({
      worldTileX: 0,
      worldTileY: 0,
      previousTileId: 1,
      previousLiquidLevel: 0,
      tileId: WATER_TILE_ID,
      liquidLevel: MAX_LIQUID_LEVEL / 2
    });
    wallCapture.recordWallEditNotification({
      worldTileX: 0,
      worldTileY: 0,
      previousWallId: 0,
      wallId: 5
    });
    wallCapture.recordWallEditNotification({
      worldTileX: CHUNK_SIZE,
      worldTileY: 0,
      previousWallId: 0,
      wallId: 7
    });

    const stagedMessages = stageAuthoritativeReplicatedStateBatch({
      tick: 12,
      tileEditCapture: tileCapture,
      wallEditCapture: wallCapture,
      entitySnapshotMessage: createEntitySnapshotMessage({
        tick: 12,
        entities: [
          {
            id: 2,
            kind: 'bunny',
            position: { x: -1, y: 0 },
            velocity: { x: 0, y: 0 },
            state: {
              grounded: true
            }
          },
          {
            id: 5,
            kind: 'slime',
            position: { x: 3, y: 0 },
            velocity: { x: 0, y: 0 },
            state: {
              hostile: true
            }
          },
          {
            id: 9,
            kind: 'torch',
            position: { x: 5, y: 3 },
            velocity: { x: 0, y: 0 },
            state: {
              lit: true
            }
          }
        ]
      })
    });

    const result = filterAuthoritativeReplicatedStateBatchByInterestSet({
      interestSet: {
        chunks: [{ x: 0, y: 0 }],
        entityIds: [2, 9]
      },
      messages: stagedMessages
    });

    expect(result.forwardedMessages).toEqual([
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
            wallId: 5
          }
        ]
      },
      {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 12,
        entities: [
          {
            id: 2,
            kind: 'bunny',
            position: { x: -1, y: 0 },
            velocity: { x: 0, y: 0 },
            state: {
              grounded: true
            }
          },
          {
            id: 9,
            kind: 'torch',
            position: { x: 5, y: 3 },
            velocity: { x: 0, y: 0 },
            state: {
              lit: true
            }
          }
        ]
      }
    ]);
    expect(result.diagnostics).toEqual([
      {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        tick: 12,
        chunk: {
          x: -1,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
        receivedTileCount: 1,
        forwardedTileCount: 0
      },
      {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        tick: 12,
        chunk: {
          x: 0,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
        receivedTileCount: 1,
        forwardedTileCount: 1
      },
      {
        kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
        tick: 12,
        chunk: {
          x: 0,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
        receivedWallCount: 1,
        forwardedWallCount: 1
      },
      {
        kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
        tick: 12,
        chunk: {
          x: 1,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
        receivedWallCount: 1,
        forwardedWallCount: 0
      },
      {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        tick: 12,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
        receivedEntityCount: 3,
        forwardedEntityCount: 2
      }
    ]);

    const forwardedChunkMessage = result.forwardedMessages[0];
    const forwardedWallMessage = result.forwardedMessages[1];
    const forwardedEntityMessage = result.forwardedMessages[2];

    expect(forwardedChunkMessage!.kind).toBe(CHUNK_TILE_DIFF_MESSAGE_KIND);
    expect(forwardedWallMessage!.kind).toBe(CHUNK_WALL_DIFF_MESSAGE_KIND);
    expect(forwardedEntityMessage!.kind).toBe(ENTITY_SNAPSHOT_MESSAGE_KIND);

    if (
      forwardedChunkMessage?.kind === CHUNK_TILE_DIFF_MESSAGE_KIND &&
      forwardedWallMessage?.kind === CHUNK_WALL_DIFF_MESSAGE_KIND &&
      forwardedEntityMessage?.kind === ENTITY_SNAPSHOT_MESSAGE_KIND
    ) {
      forwardedChunkMessage.tiles[0]!.tileId = 2;
      forwardedWallMessage.walls[0]!.wallId = 9;
      forwardedEntityMessage.entities[0]!.state.grounded = false;
    }

    expect(stagedMessages[1]).toEqual({
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
    });
    expect(stagedMessages[2]).toEqual({
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
          wallId: 5
        }
      ]
    });
    expect(stagedMessages[4]).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      version: NETWORK_PROTOCOL_VERSION,
      tick: 12,
      entities: [
        {
          id: 2,
          kind: 'bunny',
          position: { x: -1, y: 0 },
          velocity: { x: 0, y: 0 },
          state: {
            grounded: true
          }
        },
        {
          id: 5,
          kind: 'slime',
          position: { x: 3, y: 0 },
          velocity: { x: 0, y: 0 },
          state: {
            hostile: true
          }
        },
        {
          id: 9,
          kind: 'torch',
          position: { x: 5, y: 3 },
          velocity: { x: 0, y: 0 },
          state: {
            lit: true
          }
        }
      ]
    });
  });

  it('still forwards a fully trimmed empty entity snapshot so client interest changes can clear stale entities', () => {
    const result = filterAuthoritativeReplicatedStateBatchByInterestSet({
      interestSet: {
        chunks: [],
        entityIds: []
      },
      messages: [
        createEntitySnapshotMessage({
          tick: 4,
          entities: [
            {
              id: 5,
              kind: 'slime',
              position: { x: 2, y: 3 },
              velocity: { x: 0, y: 0 },
              state: {}
            }
          ]
        })
      ]
    });

    expect(result.forwardedMessages).toEqual([
      {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 4,
        entities: []
      }
    ]);
    expect(result.diagnostics).toEqual([
      {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        tick: 4,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
        receivedEntityCount: 1,
        forwardedEntityCount: 0
      }
    ]);
  });

  it('returns empty forwarded batches and diagnostics when no messages were staged', () => {
    expect(
      filterAuthoritativeReplicatedStateBatchByInterestSet({
        interestSet: {
          chunks: [],
          entityIds: []
        }
      })
    ).toEqual({
      forwardedMessages: [],
      diagnostics: []
    });
  });
});
