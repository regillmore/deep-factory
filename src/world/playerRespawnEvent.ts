import type { PlayerSpawnPoint } from './playerSpawn';
import type { PlayerState } from './playerState';

export type PlayerRespawnEventKind = 'embedded';

export interface PlayerRespawnEvent {
  kind: PlayerRespawnEventKind;
  spawnTile: { x: number; y: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export const createEmbeddedPlayerRespawnEvent = (
  nextState: PlayerState,
  spawn: PlayerSpawnPoint
): PlayerRespawnEvent => ({
  kind: 'embedded',
  spawnTile: {
    x: spawn.anchorTileX,
    y: spawn.standingTileY
  },
  position: {
    x: nextState.position.x,
    y: nextState.position.y
  },
  velocity: {
    x: nextState.velocity.x,
    y: nextState.velocity.y
  }
});
