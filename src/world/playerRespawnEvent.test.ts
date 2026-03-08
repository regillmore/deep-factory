import { describe, expect, it } from 'vitest';

import { createEmbeddedPlayerRespawnEvent, createLavaPlayerRespawnEvent } from './playerRespawnEvent';
import type { PlayerSpawnPoint } from './playerSpawn';
import { createPlayerState } from './playerState';

describe('createEmbeddedPlayerRespawnEvent', () => {
  it('captures the resolved spawn tile plus respawned player state', () => {
    const spawn: PlayerSpawnPoint = {
      anchorTileX: 3,
      standingTileY: -2,
      x: 56,
      y: -32,
      aabb: {
        minX: 50,
        minY: -60,
        maxX: 62,
        maxY: -32
      },
      support: {
        tileX: 3,
        tileY: -1,
        tileId: 4
      }
    };

    const event = createEmbeddedPlayerRespawnEvent(
      createPlayerState({
        position: { x: 56, y: -32 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        facing: 'left'
      }),
      spawn,
      'safe'
    );

    expect(event).toEqual({
      kind: 'embedded',
      spawnTile: { x: 3, y: -2 },
      supportChunk: { x: 0, y: -1 },
      supportLocal: { x: 3, y: 31 },
      supportTileId: 4,
      liquidSafetyStatus: 'safe',
      position: { x: 56, y: -32 },
      velocity: { x: 0, y: 0 }
    });
  });
});

describe('createLavaPlayerRespawnEvent', () => {
  it('captures the resolved spawn tile plus lava-respawned player state', () => {
    const spawn: PlayerSpawnPoint = {
      anchorTileX: -1,
      standingTileY: 0,
      x: -8,
      y: 0,
      aabb: {
        minX: -14,
        minY: -28,
        maxX: -2,
        maxY: 0
      },
      support: {
        tileX: -1,
        tileY: 1,
        tileId: 4
      }
    };

    const event = createLavaPlayerRespawnEvent(
      createPlayerState({
        position: { x: -8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        facing: 'right'
      }),
      spawn,
      'overlap'
    );

    expect(event).toEqual({
      kind: 'lava',
      spawnTile: { x: -1, y: 0 },
      supportChunk: { x: -1, y: 0 },
      supportLocal: { x: 31, y: 1 },
      supportTileId: 4,
      liquidSafetyStatus: 'overlap',
      position: { x: -8, y: 0 },
      velocity: { x: 0, y: 0 }
    });
  });
});
