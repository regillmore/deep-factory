import { worldToChunkCoord, worldToLocalTile } from './chunkMath';
import type { PlayerSpawnLiquidSafetyStatus, PlayerSpawnPoint } from './playerSpawn';
import type { PlayerState } from './playerState';

export type PlayerRespawnEventKind = 'embedded' | 'death';

export interface PlayerRespawnEvent {
  kind: PlayerRespawnEventKind;
  spawnTile: { x: number; y: number };
  supportChunk: { x: number; y: number };
  supportLocal: { x: number; y: number };
  supportTileId: number;
  liquidSafetyStatus: PlayerSpawnLiquidSafetyStatus;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

const createPlayerRespawnEvent = (
  kind: PlayerRespawnEventKind,
  nextState: PlayerState,
  spawn: PlayerSpawnPoint,
  liquidSafetyStatus: PlayerSpawnLiquidSafetyStatus
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
    liquidSafetyStatus,
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
  spawn: PlayerSpawnPoint,
  liquidSafetyStatus: PlayerSpawnLiquidSafetyStatus
): PlayerRespawnEvent => createPlayerRespawnEvent('embedded', nextState, spawn, liquidSafetyStatus);

export const createDeathPlayerRespawnEvent = (
  nextState: PlayerState,
  spawn: PlayerSpawnPoint,
  liquidSafetyStatus: PlayerSpawnLiquidSafetyStatus
): PlayerRespawnEvent => createPlayerRespawnEvent('death', nextState, spawn, liquidSafetyStatus);
