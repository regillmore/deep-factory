import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIQUID_LEVEL } from '../world/constants';
import { TileWorld } from '../world/world';
import {
  createChunkTileDiffMessage,
  createEntitySnapshotMessage
} from './protocol';
import {
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
  AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED,
  AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED,
  dispatchAuthoritativeReplicatedNetworkStateMessages
} from './replicationDispatch';
import {
  AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
  AuthoritativeReplicatedNetworkStateReplayer,
  ReplicatedEntitySnapshotStore
} from './stateReplay';

const WATER_TILE_ID = 7;

describe('dispatchAuthoritativeReplicatedNetworkStateMessages', () => {
  it('drops out-of-interest chunk diffs before replay and reports the dropped payload', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const replayer = new AuthoritativeReplicatedNetworkStateReplayer({
      world,
      entities: store
    });
    const message = createChunkTileDiffMessage({
      tick: 4,
      chunk: {
        x: 1,
        y: 0
      },
      tiles: [
        {
          tileIndex: 0,
          tileId: WATER_TILE_ID,
          liquidLevel: MAX_LIQUID_LEVEL
        }
      ]
    });

    expect(
      dispatchAuthoritativeReplicatedNetworkStateMessages({
        replayer,
        interestSet: {
          chunks: [{ x: 0, y: 0 }],
          entityIds: []
        },
        messages: [message]
      })
    ).toEqual([
      {
        kind: 'chunk-tile-diff',
        tick: 4,
        chunk: {
          x: 1,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
        replayStatus: null,
        receivedTileCount: 1,
        forwardedTileCount: 0
      }
    ]);
    expect(replayer.getLastAppliedChunkTick({ x: 1, y: 0 })).toBeNull();
    expect(world.getTile(CHUNK_SIZE, 0)).not.toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(CHUNK_SIZE, 0)).toBe(0);
  });

  it('replays trimmed entity snapshots and reports both received and forwarded counts', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const replayer = new AuthoritativeReplicatedNetworkStateReplayer({
      world,
      entities: store
    });

    replayer.applyMessage(
      createEntitySnapshotMessage({
        tick: 1,
        entities: [
          {
            id: 2,
            kind: 'bunny',
            position: { x: -3, y: 1 },
            velocity: { x: 0, y: 0 },
            state: {}
          },
          {
            id: 8,
            kind: 'slime',
            position: { x: 4, y: 2 },
            velocity: { x: 0, y: 0 },
            state: {}
          }
        ]
      })
    );

    expect(
      dispatchAuthoritativeReplicatedNetworkStateMessages({
        replayer,
        interestSet: {
          chunks: [],
          entityIds: [5]
        },
        messages: [
          createEntitySnapshotMessage({
            tick: 2,
            entities: [
              {
                id: 2,
                kind: 'bunny',
                position: { x: -2, y: 1 },
                velocity: { x: 0, y: 0 },
                state: {}
              },
              {
                id: 5,
                kind: 'torch',
                position: { x: 9, y: 3 },
                velocity: { x: 0, y: 0 },
                state: {
                  lit: true
                }
              }
            ]
          })
        ]
      })
    ).toEqual([
      {
        kind: 'entity-snapshot',
        tick: 2,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
        replayStatus: AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED,
        receivedEntityCount: 2,
        forwardedEntityCount: 1,
        replayResult: {
          kind: 'entity-snapshot',
          tick: 2,
          entityCount: 1,
          spawnedEntityIds: [5],
          updatedEntityIds: [],
          removedEntityIds: [2, 8]
        }
      }
    ]);
    expect(store.getEntities()).toEqual([
      {
        id: 5,
        kind: 'torch',
        position: { x: 9, y: 3 },
        velocity: { x: 0, y: 0 },
        state: {
          lit: true
        }
      }
    ]);
  });

  it('reports trimmed payloads that later skip replay because their tick is stale', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const replayer = new AuthoritativeReplicatedNetworkStateReplayer({
      world,
      entities: store
    });

    replayer.applyMessage(
      createEntitySnapshotMessage({
        tick: 5,
        entities: [
          {
            id: 7,
            kind: 'slime',
            position: { x: 2, y: 3 },
            velocity: { x: 0, y: 0 },
            state: {}
          }
        ]
      })
    );

    expect(
      dispatchAuthoritativeReplicatedNetworkStateMessages({
        replayer,
        interestSet: {
          chunks: [],
          entityIds: [9]
        },
        messages: [
          createEntitySnapshotMessage({
            tick: 4,
            entities: [
              {
                id: 7,
                kind: 'slime',
                position: { x: 8, y: 9 },
                velocity: { x: 1, y: 0 },
                state: {
                  grounded: true
                }
              },
              {
                id: 9,
                kind: 'bunny',
                position: { x: -1, y: 2 },
                velocity: { x: 0, y: 0 },
                state: {}
              }
            ]
          })
        ]
      })
    ).toEqual([
      {
        kind: 'entity-snapshot',
        tick: 4,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
        replayStatus: AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED,
        receivedEntityCount: 2,
        forwardedEntityCount: 1,
        replayResult: {
          kind: 'entity-snapshot',
          tick: 4,
          skipped: true,
          reason: AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
          lastAppliedTick: 5,
          receivedEntityCount: 1
        }
      }
    ]);
    expect(store.getEntities()).toEqual([
      {
        id: 7,
        kind: 'slime',
        position: { x: 2, y: 3 },
        velocity: { x: 0, y: 0 },
        state: {}
      }
    ]);
  });
});
