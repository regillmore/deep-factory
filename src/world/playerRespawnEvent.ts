import type { PlayerSpawnPoint } from './playerSpawn';
import type { PlayerState } from './playerState';

export type PlayerRespawnEventKind = 'embedded' | 'lava';

export interface PlayerRespawnEvent {
  kind: PlayerRespawnEventKind;
  spawnTile: { x: number; y: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

const createPlayerRespawnEvent = (
  kind: PlayerRespawnEventKind,
  nextState: PlayerState,
  spawn: PlayerSpawnPoint
): PlayerRespawnEvent => ({
  kind,
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

export const createEmbeddedPlayerRespawnEvent = (
  nextState: PlayerState,
  spawn: PlayerSpawnPoint
): PlayerRespawnEvent => createPlayerRespawnEvent('embedded', nextState, spawn);

export const createLavaPlayerRespawnEvent = (
  nextState: PlayerState,
  spawn: PlayerSpawnPoint
): PlayerRespawnEvent => createPlayerRespawnEvent('lava', nextState, spawn);
