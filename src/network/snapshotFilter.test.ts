import { describe, expect, it } from 'vitest';

import { TileWorld } from '../world/world';
import {
  createChunkTileDiffMessage,
  createChunkWallDiffMessage,
  createEntitySnapshotMessage
} from './protocol';
import { ReplicatedEntitySnapshotStore } from './stateReplay';
import {
  filterChunkTileDiffMessageByInterestSet,
  filterChunkWallDiffMessageByInterestSet,
  filterEntitySnapshotMessageByInterestSet,
  filterReplicatedNetworkStateMessageByInterestSet
} from './snapshotFilter';

const WATER_TILE_ID = 7;

describe('filterChunkTileDiffMessageByInterestSet', () => {
  it('keeps interested chunk diffs as detached copies and drops chunks outside interest', () => {
    const interestedMessage = createChunkTileDiffMessage({
      tick: 12,
      chunk: {
        x: 2,
        y: -1
      },
      tiles: [
        {
          tileIndex: 0,
          tileId: WATER_TILE_ID,
          liquidLevel: 8
        }
      ]
    });
    const filteredInterestedMessage = filterChunkTileDiffMessageByInterestSet(interestedMessage, {
      chunks: [{ x: 2, y: -1 }],
      entityIds: []
    });

    expect(filteredInterestedMessage).toEqual(interestedMessage);
    expect(filteredInterestedMessage).not.toBe(interestedMessage);
    expect(filteredInterestedMessage!.tiles).not.toBe(interestedMessage.tiles);

    filteredInterestedMessage!.tiles[0]!.tileId = 2;
    expect(interestedMessage.tiles[0]!.tileId).toBe(WATER_TILE_ID);

    expect(
      filterChunkTileDiffMessageByInterestSet(interestedMessage, {
        chunks: [{ x: 1, y: -1 }],
        entityIds: []
      })
    ).toBeNull();
  });
});

describe('filterChunkWallDiffMessageByInterestSet', () => {
  it('keeps interested wall diffs as detached copies and drops chunks outside interest', () => {
    const interestedMessage = createChunkWallDiffMessage({
      tick: 13,
      chunk: {
        x: 2,
        y: -1
      },
      walls: [
        {
          tileIndex: 0,
          wallId: 3
        }
      ]
    });
    const filteredInterestedMessage = filterChunkWallDiffMessageByInterestSet(interestedMessage, {
      chunks: [{ x: 2, y: -1 }],
      entityIds: []
    });

    expect(filteredInterestedMessage).toEqual(interestedMessage);
    expect(filteredInterestedMessage).not.toBe(interestedMessage);
    expect(filteredInterestedMessage!.walls).not.toBe(interestedMessage.walls);

    filteredInterestedMessage!.walls[0]!.wallId = 9;
    expect(interestedMessage.walls[0]!.wallId).toBe(3);

    expect(
      filterChunkWallDiffMessageByInterestSet(interestedMessage, {
        chunks: [{ x: 1, y: -1 }],
        entityIds: []
      })
    ).toBeNull();
  });
});

describe('filterEntitySnapshotMessageByInterestSet', () => {
  it('trims entity snapshots to the currently relevant ids and returns detached entries', () => {
    const message = createEntitySnapshotMessage({
      tick: 18,
      entities: [
        {
          id: 2,
          kind: 'bunny',
          position: { x: -4, y: 3 },
          velocity: { x: 0, y: 0 },
          state: {
            grounded: true
          }
        },
        {
          id: 5,
          kind: 'slime',
          position: { x: 9, y: 6 },
          velocity: { x: 1, y: 0 },
          state: {
            facing: 'left'
          }
        },
        {
          id: 9,
          kind: 'torch',
          position: { x: 12, y: 2 },
          velocity: { x: 0, y: 0 },
          state: {
            lit: true
          }
        }
      ]
    });

    const filteredMessage = filterEntitySnapshotMessageByInterestSet(message, {
      chunks: [],
      entityIds: [9, 2]
    });

    expect(filteredMessage).toEqual(
      createEntitySnapshotMessage({
        tick: 18,
        entities: [message.entities[0]!, message.entities[2]!]
      })
    );
    expect(filteredMessage).not.toBe(message);
    expect(filteredMessage.entities).not.toBe(message.entities);
    expect(filteredMessage.entities[0]).not.toBe(message.entities[0]);

    filteredMessage.entities[0]!.state.grounded = false;
    expect(message.entities[0]!.state.grounded).toBe(true);
  });

  it('preserves an empty replacement snapshot so replay can clear stale local entities', () => {
    const store = new ReplicatedEntitySnapshotStore();
    store.applyEntitySnapshotMessage(
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
    );

    const filteredMessage = filterEntitySnapshotMessageByInterestSet(
      createEntitySnapshotMessage({
        tick: 5,
        entities: [
          {
            id: 5,
            kind: 'slime',
            position: { x: 4, y: 6 },
            velocity: { x: 1, y: 0 },
            state: {
              grounded: true
            }
          }
        ]
      }),
      {
        chunks: [],
        entityIds: []
      }
    );

    expect(filteredMessage.entities).toEqual([]);
    expect(store.applyEntitySnapshotMessage(filteredMessage).removedEntityIds).toEqual([5]);
    expect(store.getEntities()).toEqual([]);
  });
});

describe('filterReplicatedNetworkStateMessageByInterestSet', () => {
  it('dispatches tile diffs, wall diffs, and entity snapshots through the same interest filter', () => {
    const chunkMessage = createChunkTileDiffMessage({
      tick: 6,
      chunk: {
        x: 0,
        y: 0
      },
      tiles: [
        {
          tileIndex: 0,
          tileId: WATER_TILE_ID,
          liquidLevel: 8
        }
      ]
    });
    const wallMessage = createChunkWallDiffMessage({
      tick: 7,
      chunk: {
        x: 0,
        y: 0
      },
      walls: [
        {
          tileIndex: 0,
          wallId: 4
        }
      ]
    });
    const entityMessage = createEntitySnapshotMessage({
      tick: 8,
      entities: [
        {
          id: 2,
          kind: 'bunny',
          position: { x: -1, y: 0 },
          velocity: { x: 0, y: 0 },
          state: {}
        },
        {
          id: 8,
          kind: 'slime',
          position: { x: 5, y: 1 },
          velocity: { x: 0, y: 0 },
          state: {}
        }
      ]
    });
    const world = new TileWorld(0);
    const initialTileId = world.getTile(0, 0);

    const filteredChunkMessage = filterReplicatedNetworkStateMessageByInterestSet(chunkMessage, {
      chunks: [{ x: 1, y: 0 }],
      entityIds: [2]
    });
    const filteredWallMessage = filterReplicatedNetworkStateMessageByInterestSet(wallMessage, {
      chunks: [{ x: 0, y: 0 }],
      entityIds: [2]
    });
    const filteredEntityMessage = filterReplicatedNetworkStateMessageByInterestSet(entityMessage, {
      chunks: [{ x: 1, y: 0 }],
      entityIds: [2]
    });

    expect(filteredChunkMessage).toBeNull();
    expect(world.getTile(0, 0)).toBe(initialTileId);
    expect(filteredWallMessage).toEqual(wallMessage);
    expect(filteredEntityMessage).toEqual(
      createEntitySnapshotMessage({
        tick: 8,
        entities: [entityMessage.entities[0]!]
      })
    );
  });
});
