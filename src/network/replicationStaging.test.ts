import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIQUID_LEVEL } from '../world/constants';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND,
  NETWORK_CHUNK_TILE_ORDER,
  NETWORK_PROTOCOL_VERSION,
  createEntitySnapshotMessage
} from './protocol';
import { stageAuthoritativeReplicatedStateBatch } from './replicationStaging';
import { AuthoritativeTileEditCapture } from './tileEditCapture';

const WATER_TILE_ID = 7;

describe('stageAuthoritativeReplicatedStateBatch', () => {
  it('drains captured tile edits into deterministic chunk diffs and appends a detached entity snapshot', () => {
    const capture = new AuthoritativeTileEditCapture();
    const entitySnapshotMessage = createEntitySnapshotMessage({
      tick: 12,
      entities: [
        {
          id: 9,
          kind: 'torch',
          position: { x: 5, y: 3 },
          velocity: { x: 0, y: 0 },
          state: {
            lit: true
          }
        },
        {
          id: 2,
          kind: 'bunny',
          position: { x: -1, y: 0 },
          velocity: { x: 0, y: 0 },
          state: {
            grounded: true
          }
        }
      ]
    });

    capture.recordTileEditNotification({
      worldTileX: 0,
      worldTileY: 0,
      previousTileId: 1,
      previousLiquidLevel: 0,
      tileId: WATER_TILE_ID,
      liquidLevel: MAX_LIQUID_LEVEL / 2
    });
    capture.recordTileEditNotification({
      worldTileX: -1,
      worldTileY: 0,
      previousTileId: 3,
      previousLiquidLevel: 0,
      tileId: 4,
      liquidLevel: 0
    });

    const stagedMessages = stageAuthoritativeReplicatedStateBatch({
      tick: 12,
      tileEditCapture: capture,
      entitySnapshotMessage
    });

    expect(stagedMessages).toEqual([
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

    entitySnapshotMessage.entities[0]!.position.x = 99;
    entitySnapshotMessage.entities[0]!.state.grounded = false;
    expect(stagedMessages[2]).toEqual({
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
    });
    expect(stageAuthoritativeReplicatedStateBatch({
      tick: 13,
      tileEditCapture: capture,
      entitySnapshotMessage: createEntitySnapshotMessage({
        tick: 13,
        entities: []
      })
    })).toEqual([
      {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 13,
        entities: []
      }
    ]);
  });

  it('still stages the entity snapshot when no chunk diffs were captured for that tick', () => {
    const capture = new AuthoritativeTileEditCapture();

    expect(
      stageAuthoritativeReplicatedStateBatch({
        tick: 4,
        tileEditCapture: capture,
        entitySnapshotMessage: createEntitySnapshotMessage({
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
      })
    ).toEqual([
      {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
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
      }
    ]);
  });

  it('rejects mismatched entity snapshot ticks before draining captured tile edits', () => {
    const capture = new AuthoritativeTileEditCapture();

    capture.recordTileEditNotification({
      worldTileX: 0,
      worldTileY: 0,
      previousTileId: 0,
      previousLiquidLevel: 0,
      tileId: WATER_TILE_ID,
      liquidLevel: MAX_LIQUID_LEVEL
    });

    expect(() =>
      stageAuthoritativeReplicatedStateBatch({
        tick: 7,
        tileEditCapture: capture,
        entitySnapshotMessage: createEntitySnapshotMessage({
          tick: 6,
          entities: []
        })
      })
    ).toThrow('entitySnapshotMessage.tick 6 must match staged tick 7');

    expect(capture.drainChunkDiffMessages(7)).toEqual([
      {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 7,
        chunk: {
          x: 0,
          y: 0
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        tiles: [
          {
            tileIndex: 0,
            tileId: WATER_TILE_ID,
            liquidLevel: MAX_LIQUID_LEVEL
          }
        ]
      }
    ]);
  });
});
