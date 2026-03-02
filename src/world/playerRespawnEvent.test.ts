import { describe, expect, it } from 'vitest';

import { createEmbeddedPlayerRespawnEvent } from './playerRespawnEvent';
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
      spawn
    );

    expect(event).toEqual({
      kind: 'embedded',
      spawnTile: { x: 3, y: -2 },
      position: { x: 56, y: -32 },
      velocity: { x: 0, y: 0 }
    });
  });
});
