import { describe, expect, it } from 'vitest';

import { MAX_LIQUID_LEVEL } from '../world/constants';
import { TileWorld } from '../world/world';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  CHUNK_WALL_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND,
  createChunkTileDiffMessage,
  createChunkWallDiffMessage,
  createEntitySnapshotMessage
} from './protocol';
import { applyAuthoritativeReplicatedStateBaseline } from './replicationBaseline';
import {
  AuthoritativeReplicatedNetworkStateReplayer,
  ReplicatedEntitySnapshotStore
} from './stateReplay';

const WATER_TILE_ID = 7;

describe('applyAuthoritativeReplicatedStateBaseline', () => {
  it('replaces tile and wall world state plus one entity baseline through the replay seam and returns the entity replacement summary', () => {
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
        createChunkWallDiffMessage({
          tick: 5,
          chunk: {
            x: 0,
            y: 0
          },
          walls: [
            {
              tileIndex: 0,
              wallId: 2
            }
          ]
        })
      )
    ).toEqual({
      kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
      tick: 5,
      chunk: {
        x: 0,
        y: 0
      },
      appliedWallCount: 1,
      changedWallCount: 1
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
      applyAuthoritativeReplicatedStateBaseline({
        replayer,
        replaceWorld: (worldTarget) => {
          expect(worldTarget).toBe(world);
          expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBe(5);
          expect(replayer.getLastAppliedEntityTick()).toBe(6);
          expect(worldTarget.setTileState(0, 0, 4, 0)).toBe(true);
          expect(worldTarget.setWall(0, 0, 4)).toBe(true);

          return {
            replacedTiles: 1,
            replacedWalls: 1
          };
        },
        entitySnapshotBaseline: createEntitySnapshotMessage({
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
      })
    ).toEqual({
      worldReplacementCounts: {
        replacedTiles: 1,
        replacedWalls: 1
      },
      entityReplacementSummary: {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        tick: 2,
        entityCount: 1,
        spawnedEntityIds: [9],
        updatedEntityIds: [],
        removedEntityIds: [5]
      }
    });

    expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBeNull();
    expect(replayer.getLastAppliedEntityTick()).toBeNull();
    expect(world.getTile(0, 0)).toBe(4);
    expect(world.getLiquidLevel(0, 0)).toBe(0);
    expect(world.getWall(0, 0)).toBe(4);
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

  it('preserves prior world, entities, and replay guards when the world replacement callback throws', () => {
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
      createChunkWallDiffMessage({
        tick: 5,
        chunk: {
          x: 0,
          y: 0
        },
        walls: [
          {
            tileIndex: 0,
            wallId: 2
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
      applyAuthoritativeReplicatedStateBaseline({
        replayer,
        replaceWorld: () => {
          throw new Error('baseline world replacement failed');
        },
        entitySnapshotBaseline: createEntitySnapshotMessage({
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
      })
    ).toThrow('baseline world replacement failed');

    expect(replayer.getLastAppliedChunkTick({ x: 0, y: 0 })).toBe(5);
    expect(replayer.getLastAppliedEntityTick()).toBe(6);
    expect(world.getTile(0, 0)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(0, 0)).toBe(MAX_LIQUID_LEVEL);
    expect(world.getWall(0, 0)).toBe(2);
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
