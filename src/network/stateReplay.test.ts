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
  AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK,
  AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
  AuthoritativeReplicatedNetworkStateReplayer,
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

  it('skips duplicate and stale authoritative entity snapshots without mutating local state', () => {
    const store = new ReplicatedEntitySnapshotStore();

    expect(
      store.replayEntitySnapshotMessage(
        createEntitySnapshotMessage({
          tick: 8,
          entities: [
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
      entityCount: 1,
      spawnedEntityIds: [2],
      updatedEntityIds: [],
      removedEntityIds: []
    });
    expect(store.getLastAppliedTick()).toBe(8);
    expect(store.getEntities()).toEqual([
      {
        id: 2,
        kind: 'bunny',
        position: { x: -3, y: 6 },
        velocity: { x: 0, y: 0 },
        state: {
          facing: 'left'
        }
      }
    ]);

    expect(
      store.replayEntitySnapshotMessage(
        createEntitySnapshotMessage({
          tick: 8,
          entities: [
            {
              id: 2,
              kind: 'bunny',
              position: { x: 50, y: 50 },
              velocity: { x: 3, y: 4 },
              state: {
                facing: 'right'
              }
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 8,
      skipped: true,
      reason: AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK,
      lastAppliedTick: 8,
      receivedEntityCount: 1
    });

    expect(
      store.replayEntitySnapshotMessage(
        createEntitySnapshotMessage({
          tick: 7,
          entities: [
            {
              id: 9,
              kind: 'slime',
              position: { x: 4, y: 4 },
              velocity: { x: 0, y: 0 },
              state: {}
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 7,
      skipped: true,
      reason: AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
      lastAppliedTick: 8,
      receivedEntityCount: 1
    });

    expect(store.getLastAppliedTick()).toBe(8);
    expect(store.getEntities()).toEqual([
      {
        id: 2,
        kind: 'bunny',
        position: { x: -3, y: 6 },
        velocity: { x: 0, y: 0 },
        state: {
          facing: 'left'
        }
      }
    ]);
  });

  it('can reset only the entity replay guard so an older replacement baseline applies again', () => {
    const store = new ReplicatedEntitySnapshotStore();

    expect(
      store.replayEntitySnapshotMessage(
        createEntitySnapshotMessage({
          tick: 8,
          entities: [
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
      entityCount: 1,
      spawnedEntityIds: [2],
      updatedEntityIds: [],
      removedEntityIds: []
    });

    store.resetReplayGuard();

    expect(store.getLastAppliedTick()).toBeNull();
    expect(store.getEntities()).toEqual([
      {
        id: 2,
        kind: 'bunny',
        position: { x: -3, y: 6 },
        velocity: { x: 0, y: 0 },
        state: {
          facing: 'left'
        }
      }
    ]);

    expect(
      store.replayEntitySnapshotMessage(
        createEntitySnapshotMessage({
          tick: 7,
          entities: [
            {
              id: 9,
              kind: 'slime',
              position: { x: 4, y: 4 },
              velocity: { x: 0, y: 0 },
              state: {}
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 7,
      entityCount: 1,
      spawnedEntityIds: [9],
      updatedEntityIds: [],
      removedEntityIds: [2]
    });
    expect(store.getLastAppliedTick()).toBe(7);
    expect(store.getEntities()).toEqual([
      {
        id: 9,
        kind: 'slime',
        position: { x: 4, y: 4 },
        velocity: { x: 0, y: 0 },
        state: {}
      }
    ]);
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

describe('AuthoritativeReplicatedNetworkStateReplayer', () => {
  it('skips duplicate and stale chunk diffs per chunk while allowing older ticks on other chunks', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const replayer = new AuthoritativeReplicatedNetworkStateReplayer({
      world,
      entities: store
    });

    expect(
      replayer.applyMessage(
        createChunkTileDiffMessage({
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
        })
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
    expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBe(3);
    expect(world.getTile(0, 0)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(0, 0)).toBe(MAX_LIQUID_LEVEL);

    expect(
      replayer.applyMessage(
        createChunkTileDiffMessage({
          tick: 3,
          chunk: {
            x: 0,
            y: 0
          },
          tiles: [
            {
              tileIndex: 0,
              tileId: 2,
              liquidLevel: 0
            }
          ]
        })
      )
    ).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 3,
      chunk: {
        x: 0,
        y: 0
      },
      skipped: true,
      reason: AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK,
      lastAppliedTick: 3,
      receivedTileCount: 1
    });
    expect(world.getTile(0, 0)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(0, 0)).toBe(MAX_LIQUID_LEVEL);

    expect(
      replayer.applyMessage(
        createChunkTileDiffMessage({
          tick: 2,
          chunk: {
            x: 0,
            y: 0
          },
          tiles: [
            {
              tileIndex: 0,
              tileId: 4,
              liquidLevel: 0
            }
          ]
        })
      )
    ).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 2,
      chunk: {
        x: 0,
        y: 0
      },
      skipped: true,
      reason: AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
      lastAppliedTick: 3,
      receivedTileCount: 1
    });

    expect(
      replayer.applyMessage(
        createChunkTileDiffMessage({
          tick: 2,
          chunk: {
            x: 1,
            y: 0
          },
          tiles: [
            {
              tileIndex: 1,
              tileId: 9,
              liquidLevel: 0
            }
          ]
        })
      )
    ).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 2,
      chunk: {
        x: 1,
        y: 0
      },
      appliedTileCount: 1,
      changedTileCount: 1
    });
    expect(replayer.getLastAppliedChunkTick({ x: 1, y: 0 })).toBe(2);
    expect(world.getTile(CHUNK_SIZE + 1, 0)).toBe(9);
  });

  it('skips duplicate and stale entity snapshots and still rejects player input messages', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const replayer = new AuthoritativeReplicatedNetworkStateReplayer({
      world,
      entities: store
    });

    expect(
      replayer.applyMessage(
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
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 4,
      entityCount: 1,
      spawnedEntityIds: [5],
      updatedEntityIds: [],
      removedEntityIds: []
    });
    expect(replayer.getLastAppliedEntityTick()).toBe(4);

    expect(
      replayer.applyMessage(
        createEntitySnapshotMessage({
          tick: 4,
          entities: [
            {
              id: 5,
              kind: 'slime',
              position: { x: 12, y: 13 },
              velocity: { x: 1, y: 2 },
              state: {
                grounded: true
              }
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 4,
      skipped: true,
      reason: AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK,
      lastAppliedTick: 4,
      receivedEntityCount: 1
    });
    expect(store.getEntity(5)).toEqual({
      id: 5,
      kind: 'slime',
      position: { x: 2, y: 3 },
      velocity: { x: 0, y: 0 },
      state: {}
    });

    expect(
      replayer.applyMessage(
        createEntitySnapshotMessage({
          tick: 3,
          entities: [
            {
              id: 9,
              kind: 'bunny',
              position: { x: -1, y: 6 },
              velocity: { x: 0, y: 0 },
              state: {}
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 3,
      skipped: true,
      reason: AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
      lastAppliedTick: 4,
      receivedEntityCount: 1
    });
    expect(store.getEntityCount()).toBe(1);
    expect(replayer.getLastAppliedEntityTick()).toBe(4);

    expect(() =>
      replayer.applyMessage(
        createPlayerInputMessage({
          tick: 5,
          intent: {
            moveX: 1,
            jumpPressed: true
          }
        })
      )
    ).toThrow('player-input messages do not replay authoritative world or entity state');
  });

  it('can reset chunk and entity replay guards without clearing the current replicated baseline', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const replayer = new AuthoritativeReplicatedNetworkStateReplayer({
      world,
      entities: store
    });

    expect(
      replayer.applyMessage(
        createChunkTileDiffMessage({
          tick: 5,
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
        })
      )
    ).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 5,
      chunk: {
        x: 0,
        y: 0
      },
      appliedTileCount: 1,
      changedTileCount: 1
    });
    expect(
      replayer.applyMessage(
        createEntitySnapshotMessage({
          tick: 6,
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
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 6,
      entityCount: 1,
      spawnedEntityIds: [5],
      updatedEntityIds: [],
      removedEntityIds: []
    });

    replayer.resetReplayGuards();

    expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBeNull();
    expect(replayer.getLastAppliedEntityTick()).toBeNull();
    expect(world.getTile(0, 0)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(0, 0)).toBe(MAX_LIQUID_LEVEL);
    expect(store.getEntities()).toEqual([
      {
        id: 5,
        kind: 'slime',
        position: { x: 2, y: 3 },
        velocity: { x: 0, y: 0 },
        state: {}
      }
    ]);

    expect(
      replayer.applyMessage(
        createChunkTileDiffMessage({
          tick: 2,
          chunk: {
            x: 0,
            y: 0
          },
          tiles: [
            {
              tileIndex: 0,
              tileId: 4,
              liquidLevel: 0
            }
          ]
        })
      )
    ).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 2,
      chunk: {
        x: 0,
        y: 0
      },
      appliedTileCount: 1,
      changedTileCount: 1
    });
    expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBe(2);
    expect(world.getTile(0, 0)).toBe(4);
    expect(world.getLiquidLevel(0, 0)).toBe(0);

    expect(
      replayer.applyMessage(
        createEntitySnapshotMessage({
          tick: 3,
          entities: [
            {
              id: 9,
              kind: 'bunny',
              position: { x: -1, y: 6 },
              velocity: { x: 0, y: 0 },
              state: {}
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 3,
      entityCount: 1,
      spawnedEntityIds: [9],
      updatedEntityIds: [],
      removedEntityIds: [5]
    });
    expect(replayer.getLastAppliedEntityTick()).toBe(3);
    expect(store.getEntities()).toEqual([
      {
        id: 9,
        kind: 'bunny',
        position: { x: -1, y: 6 },
        velocity: { x: 0, y: 0 },
        state: {}
      }
    ]);
  });

  it('can replace a replicated baseline and then clear chunk and entity replay guards together', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const replayer = new AuthoritativeReplicatedNetworkStateReplayer({
      world,
      entities: store
    });

    expect(
      replayer.applyMessage(
        createChunkTileDiffMessage({
          tick: 5,
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
        })
      )
    ).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 5,
      chunk: {
        x: 0,
        y: 0
      },
      appliedTileCount: 1,
      changedTileCount: 1
    });
    expect(
      replayer.applyMessage(
        createEntitySnapshotMessage({
          tick: 6,
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
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 6,
      entityCount: 1,
      spawnedEntityIds: [5],
      updatedEntityIds: [],
      removedEntityIds: []
    });

    expect(
      replayer.replaceAuthoritativeBaseline((target) => {
        expect(target.world).toBe(world);
        expect(target.entities).toBe(store);
        expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBe(5);
        expect(replayer.getLastAppliedEntityTick()).toBe(6);

        expect(
          applyChunkTileDiffMessage(
            world,
            createChunkTileDiffMessage({
              tick: 2,
              chunk: {
                x: 0,
                y: 0
              },
              tiles: [
                {
                  tileIndex: 0,
                  tileId: 4,
                  liquidLevel: 0
                }
              ]
            })
          )
        ).toEqual({
          kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
          tick: 2,
          chunk: {
            x: 0,
            y: 0
          },
          appliedTileCount: 1,
          changedTileCount: 1
        });
        expect(
          target.entities.applyEntitySnapshotMessage(
            createEntitySnapshotMessage({
              tick: 2,
              entities: [
                {
                  id: 9,
                  kind: 'bunny',
                  position: { x: -1, y: 6 },
                  velocity: { x: 0, y: 0 },
                  state: {}
                }
              ]
            })
          )
        ).toEqual({
          kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
          tick: 2,
          entityCount: 1,
          spawnedEntityIds: [9],
          updatedEntityIds: [],
          removedEntityIds: [5]
        });

        return {
          baselineTileId: world.getTile(0, 0),
          entityTickBeforeReset: target.entities.getLastAppliedTick()
        };
      })
    ).toEqual({
      baselineTileId: 4,
      entityTickBeforeReset: 2
    });

    expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBeNull();
    expect(replayer.getLastAppliedEntityTick()).toBeNull();
    expect(world.getTile(0, 0)).toBe(4);
    expect(world.getLiquidLevel(0, 0)).toBe(0);
    expect(store.getEntities()).toEqual([
      {
        id: 9,
        kind: 'bunny',
        position: { x: -1, y: 6 },
        velocity: { x: 0, y: 0 },
        state: {}
      }
    ]);

    expect(
      replayer.applyMessage(
        createChunkTileDiffMessage({
          tick: 1,
          chunk: {
            x: 0,
            y: 0
          },
          tiles: [
            {
              tileIndex: 0,
              tileId: 3,
              liquidLevel: 0
            }
          ]
        })
      )
    ).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: 1,
      chunk: {
        x: 0,
        y: 0
      },
      appliedTileCount: 1,
      changedTileCount: 1
    });
    expect(
      replayer.applyMessage(
        createEntitySnapshotMessage({
          tick: 1,
          entities: [
            {
              id: 10,
              kind: 'slime',
              position: { x: 1, y: 2 },
              velocity: { x: 0, y: 0 },
              state: {}
            }
          ]
        })
      )
    ).toEqual({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: 1,
      entityCount: 1,
      spawnedEntityIds: [10],
      updatedEntityIds: [],
      removedEntityIds: [9]
    });
  });

  it('leaves replay guards unchanged when baseline replacement throws before success', () => {
    const world = new TileWorld(0);
    const store = new ReplicatedEntitySnapshotStore();
    const replayer = new AuthoritativeReplicatedNetworkStateReplayer({
      world,
      entities: store
    });

    replayer.applyMessage(
      createChunkTileDiffMessage({
        tick: 5,
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
      })
    );
    replayer.applyMessage(
      createEntitySnapshotMessage({
        tick: 6,
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
    );

    expect(() =>
      replayer.replaceAuthoritativeBaseline(() => {
        throw new Error('baseline replacement failed');
      })
    ).toThrow('baseline replacement failed');

    expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBe(5);
    expect(replayer.getLastAppliedEntityTick()).toBe(6);
    expect(world.getTile(0, 0)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(0, 0)).toBe(MAX_LIQUID_LEVEL);
    expect(store.getEntities()).toEqual([
      {
        id: 5,
        kind: 'slime',
        position: { x: 2, y: 3 },
        velocity: { x: 0, y: 0 },
        state: {}
      }
    ]);
  });
});
