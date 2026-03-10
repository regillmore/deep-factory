import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIQUID_LEVEL } from '../world/constants';
import { TileWorld } from '../world/world';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND,
  createChunkTileDiffMessage,
  createEntitySnapshotMessage,
  createPlayerInputMessage
} from './protocol';
import {
  ReplicatedEntitySnapshotStore,
  applyChunkTileDiffMessage,
  applyReplicatedNetworkStateMessage,
  isReplicatedNetworkStateMessage
} from './stateReplay';

const WATER_TILE_ID = 7;

describe('applyChunkTileDiffMessage', () => {
  it('maps row-major chunk tile indices into local world tile state', () => {
    const world = new TileWorld(0);
    const message = createChunkTileDiffMessage({
      tick: 15,
      chunk: {
        x: 1,
        y: -1
      },
      tiles: [
        {
          tileIndex: 1,
          tileId: 5,
          liquidLevel: 0
        },
        {
          tileIndex: CHUNK_SIZE + 2,
          tileId: WATER_TILE_ID,
          liquidLevel: MAX_LIQUID_LEVEL / 2
        }
      ]
    });

    expect(applyChunkTileDiffMessage(world, message)).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 15,
      chunk: {
        x: 1,
        y: -1
      },
      appliedTileCount: 2,
      changedTileCount: 2
    });
    expect(world.getTile(CHUNK_SIZE + 1, -CHUNK_SIZE)).toBe(5);
    expect(world.getTile(CHUNK_SIZE + 2, -CHUNK_SIZE + 1)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(CHUNK_SIZE + 2, -CHUNK_SIZE + 1)).toBe(MAX_LIQUID_LEVEL / 2);

    expect(applyChunkTileDiffMessage(world, message).changedTileCount).toBe(0);
  });
});

describe('ReplicatedEntitySnapshotStore', () => {
  it('replaces the current replicated entity snapshot set and returns detached copies', () => {
    const store = new ReplicatedEntitySnapshotStore();

    expect(
      store.applyEntitySnapshotMessage(
        createEntitySnapshotMessage({
          tick: 8,
          entities: [
            {
              id: 7,
              kind: 'slime',
              position: { x: 12, y: -4 },
              velocity: { x: 0.5, y: 1 },
              state: {
                grounded: false
              }
            },
            {
              id: 2,
              kind: 'bunny',
              position: { x: -3, y: 6 },
              velocity: { x: 0, y: 0 },
              state: {
                facing: 'left'
              }
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 8,
      entityCount: 2,
      spawnedEntityIds: [2, 7],
      updatedEntityIds: [],
      removedEntityIds: []
    });
    expect(store.getLastAppliedTick()).toBe(8);
    expect(store.getEntities().map((entity) => entity.id)).toEqual([2, 7]);

    const detachedEntity = store.getEntity(2);
    expect(detachedEntity).not.toBeNull();
    detachedEntity!.position.x = 99;
    detachedEntity!.state.facing = 'right';
    expect(store.getEntity(2)).toEqual({
      id: 2,
      kind: 'bunny',
      position: { x: -3, y: 6 },
      velocity: { x: 0, y: 0 },
      state: {
        facing: 'left'
      }
    });

    expect(
      store.applyEntitySnapshotMessage(
        createEntitySnapshotMessage({
          tick: 9,
          entities: [
            {
              id: 7,
              kind: 'slime',
              position: { x: 13, y: -2 },
              velocity: { x: 1, y: 0 },
              state: {
                grounded: true
              }
            },
            {
              id: 8,
              kind: 'torch',
              position: { x: 5, y: 1 },
              velocity: { x: 0, y: 0 },
              state: {
                lit: true
              }
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 9,
      entityCount: 2,
      spawnedEntityIds: [8],
      updatedEntityIds: [7],
      removedEntityIds: [2]
    });
    expect(store.getLastAppliedTick()).toBe(9);
    expect(store.getEntityCount()).toBe(2);
    expect(store.getEntities()).toEqual([
      {
        id: 7,
        kind: 'slime',
        position: { x: 13, y: -2 },
        velocity: { x: 1, y: 0 },
        state: {
          grounded: true
        }
      },
      {
        id: 8,
        kind: 'torch',
        position: { x: 5, y: 1 },
        velocity: { x: 0, y: 0 },
        state: {
          lit: true
        }
      }
    ]);
    expect(store.getEntity(2)).toBeNull();
  });
});

describe('applyReplicatedNetworkStateMessage', () => {
  it('dispatches authoritative chunk/entity replay messages and rejects player input', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const chunkMessage = createChunkTileDiffMessage({
      tick: 3,
      chunk: {
        x: 0,
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
    const entityMessage = createEntitySnapshotMessage({
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
    });
    const playerInputMessage = createPlayerInputMessage({
      tick: 5,
      intent: {
        moveX: 1,
        jumpPressed: true
      }
    });

    expect(isReplicatedNetworkStateMessage(chunkMessage)).toBe(true);
    expect(isReplicatedNetworkStateMessage(entityMessage)).toBe(true);
    expect(isReplicatedNetworkStateMessage(playerInputMessage)).toBe(false);

    expect(
      applyReplicatedNetworkStateMessage(
        {
          world,
          entities: store
        },
        chunkMessage
      )
    ).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 3,
      chunk: {
        x: 0,
        y: 0
      },
      appliedTileCount: 1,
      changedTileCount: 1
    });
    expect(world.getTile(0, 0)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(0, 0)).toBe(MAX_LIQUID_LEVEL);

    expect(
      applyReplicatedNetworkStateMessage(
        {
          world,
          entities: store
        },
        entityMessage
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 4,
      entityCount: 1,
      spawnedEntityIds: [5],
      updatedEntityIds: [],
      removedEntityIds: []
    });

    expect(() =>
      applyReplicatedNetworkStateMessage(
        {
          world,
          entities: store
        },
        playerInputMessage
      )
    ).toThrow('player-input messages do not replay authoritative world or entity state');
  });
});
