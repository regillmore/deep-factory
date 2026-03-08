import { worldToChunkCoord, worldToLocalTile } from './chunkMath';
import type { PlayerSpawnPoint } from './playerSpawn';
import type { PlayerState } from './playerState';

export type PlayerRespawnEventKind = 'embedded' | 'lava';

export interface PlayerRespawnEvent {
  kind: PlayerRespawnEventKind;
  spawnTile: { x: number; y: number };
  supportChunk: { x: number; y: number };
  supportLocal: { x: number; y: number };
  supportTileId: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

const createPlayerRespawnEvent = (
  kind: PlayerRespawnEventKind,
  nextState: PlayerState,
  spawn: PlayerSpawnPoint
): PlayerRespawnEvent => {
  const supportChunk = worldToChunkCoord(spawn.support.tileX, spawn.support.tileY);
  const supportLocal = worldToLocalTile(spawn.support.tileX, spawn.support.tileY);

  return {
    kind,
    spawnTile: {
      x: spawn.anchorTileX,
      y: spawn.standingTileY
    },
    supportChunk: {
      x: supportChunk.chunkX,
      y: supportChunk.chunkY
    },
    supportLocal: {
      x: supportLocal.localX,
      y: supportLocal.localY
    },
    supportTileId: spawn.support.tileId,
    position: {
      x: nextState.position.x,
      y: nextState.position.y
    },
    velocity: {
      x: nextState.velocity.x,
      y: nextState.velocity.y
    }
  };
};

export const createEmbeddedPlayerRespawnEvent = (
  nextState: PlayerState,
  spawn: PlayerSpawnPoint
): PlayerRespawnEvent => createPlayerRespawnEvent('embedded', nextState, spawn);

export const createLavaPlayerRespawnEvent = (
  nextState: PlayerState,
  spawn: PlayerSpawnPoint
): PlayerRespawnEvent => createPlayerRespawnEvent('lava', nextState, spawn);
