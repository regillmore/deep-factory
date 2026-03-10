import { describe, expect, it } from 'vitest';

import { MAX_LIQUID_LEVEL } from '../world/constants';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND,
  NETWORK_CHUNK_TILE_ORDER,
  NETWORK_PROTOCOL_VERSION,
  PLAYER_INPUT_MESSAGE_KIND,
  createChunkTileDiffMessage,
  createEntitySnapshotMessage,
  createPlayerInputMessage,
  decodeChunkTileDiffMessage,
  decodeEntitySnapshotMessage,
  decodeNetworkMessage,
  decodePlayerInputMessage
} from './protocol';
import type { EntitySnapshotEntry } from './protocol';

describe('createPlayerInputMessage', () => {
  it('normalizes player intent into a serializable fixed-step payload', () => {
    expect(
      createPlayerInputMessage({
        tick: 12,
        intent: {
          moveX: -3,
          jumpPressed: true
        }
      })
    ).toEqual({
      kind: PLAYER_INPUT_MESSAGE_KIND,
      version: NETWORK_PROTOCOL_VERSION,
      tick: 12,
      input: {
        moveX: -1,
        jumpPressed: true
      }
    });
  });
});

describe('decodePlayerInputMessage', () => {
  it('rejects move axes outside the normalized protocol range', () => {
    expect(() =>
      decodePlayerInputMessage({
        kind: PLAYER_INPUT_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 4,
        input: {
          moveX: 2,
          jumpPressed: false
        }
      })
    ).toThrow('input.moveX must be -1, 0, or 1');
  });
});

describe('createChunkTileDiffMessage', () => {
  it('sorts and clones tile diffs into row-major tile-index order', () => {
    const tiles = [
      {
        tileIndex: 31,
        tileId: 5,
        liquidLevel: 0
      },
      {
        tileIndex: 2,
        tileId: 9,
        liquidLevel: MAX_LIQUID_LEVEL
      }
    ];

    const message = createChunkTileDiffMessage({
      tick: 8,
      chunk: {
        x: -2,
        y: 3
      },
      tiles
    });

    expect(message).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      version: NETWORK_PROTOCOL_VERSION,
      tick: 8,
      chunk: {
        x: -2,
        y: 3
      },
      tileOrder: NETWORK_CHUNK_TILE_ORDER,
      tiles: [
        {
          tileIndex: 2,
          tileId: 9,
          liquidLevel: MAX_LIQUID_LEVEL
        },
        {
          tileIndex: 31,
          tileId: 5,
          liquidLevel: 0
        }
      ]
    });

    tiles[0]!.tileId = 99;
    expect(message.tiles[1]!.tileId).toBe(5);
  });
});

describe('decodeChunkTileDiffMessage', () => {
  it('rejects out-of-order tile indices so wire payloads stay deterministic', () => {
    expect(() =>
      decodeChunkTileDiffMessage({
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 8,
        chunk: {
          x: 0,
          y: 0
        },
        tileOrder: NETWORK_CHUNK_TILE_ORDER,
        tiles: [
          {
            tileIndex: 12,
            tileId: 1,
            liquidLevel: 0
          },
          {
            tileIndex: 5,
            tileId: 0,
            liquidLevel: 0
          }
        ]
      })
    ).toThrow('tiles tile indices must be strictly increasing');
  });
});

describe('createEntitySnapshotMessage', () => {
  it('sorts entity ids and normalizes scalar state fields into detached snapshots', () => {
    const entities: EntitySnapshotEntry[] = [
      {
        id: 7,
        kind: 'slime',
        position: {
          x: 24,
          y: 96
        },
        velocity: {
          x: -18,
          y: 42
        },
        state: {
          grounded: false,
          hp: 12
        }
      },
      {
        id: 2,
        kind: 'standalone-player',
        position: {
          x: 10,
          y: 20
        },
        velocity: {
          x: 1,
          y: -2
        },
        state: {
          facing: 'right',
          grounded: true
        }
      }
    ];

    const message = createEntitySnapshotMessage({
      tick: 33,
      entities
    });

    expect(message.kind).toBe(ENTITY_SNAPSHOT_MESSAGE_KIND);
    expect(message.entities.map((entry) => entry.id)).toEqual([2, 7]);

    entities[0]!.state.hp = 0;
    expect(message.entities[1]!.state.hp).toBe(12);
  });
});

describe('decodeEntitySnapshotMessage', () => {
  it('sorts scalar state keys during normalization and rejects nested state payloads', () => {
    const decoded = decodeEntitySnapshotMessage({
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      version: NETWORK_PROTOCOL_VERSION,
      tick: 19,
      entities: [
        {
          id: 4,
          kind: 'standalone-player',
          position: {
            x: 64,
            y: 128
          },
          velocity: {
            x: 0,
            y: 4
          },
          state: {
            zState: true,
            aState: 'ready'
          }
        }
      ]
    });

    expect(Object.keys(decoded.entities[0]!.state)).toEqual(['aState', 'zState']);

    expect(() =>
      decodeEntitySnapshotMessage({
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 19,
        entities: [
          {
            id: 4,
            kind: 'standalone-player',
            position: {
              x: 64,
              y: 128
            },
            velocity: {
              x: 0,
              y: 4
            },
            state: {
              pose: {
                name: 'jump'
              }
            }
          }
        ]
      })
    ).toThrow('entities[0].state.pose must be a string, finite number, boolean, or null');
  });

  it('rejects out-of-order entity ids so snapshot arrays stay deterministic', () => {
    expect(() =>
      decodeEntitySnapshotMessage({
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        version: NETWORK_PROTOCOL_VERSION,
        tick: 2,
        entities: [
          {
            id: 9,
            kind: 'slime',
            position: {
              x: 0,
              y: 0
            },
            velocity: {
              x: 0,
              y: 0
            },
            state: {}
          },
          {
            id: 3,
            kind: 'slime',
            position: {
              x: 0,
              y: 0
            },
            velocity: {
              x: 0,
              y: 0
            },
            state: {}
          }
        ]
      })
    ).toThrow('entities entity ids must be strictly increasing');
  });
});

describe('decodeNetworkMessage', () => {
  it('dispatches the shared protocol union by message kind', () => {
    const decoded = decodeNetworkMessage(
      createChunkTileDiffMessage({
        tick: 5,
        chunk: {
          x: 1,
          y: -1
        },
        tiles: [
          {
            tileIndex: 0,
            tileId: 2,
            liquidLevel: 0
          }
        ]
      })
    );

    expect(decoded).toEqual({
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      version: NETWORK_PROTOCOL_VERSION,
      tick: 5,
      chunk: {
        x: 1,
        y: -1
      },
      tileOrder: NETWORK_CHUNK_TILE_ORDER,
      tiles: [
        {
          tileIndex: 0,
          tileId: 2,
          liquidLevel: 0
        }
      ]
    });
  });
});
