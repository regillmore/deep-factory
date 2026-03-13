import type { CameraFollowOffset } from './core/cameraFollow';
import {
  createWorldSaveEnvelope,
  type WorldSaveEnvelope,
  type WorldSaveEnvelopeMigrationMetadata
} from './mainWorldSave';
import type { PlayerDeathState } from './world/playerDeathState';
import type { PlayerState } from './world/playerState';
import type { TileWorldSnapshot } from './world/world';

export interface WorldSessionSaveSource {
  createWorldSnapshot(): TileWorldSnapshot;
  getStandalonePlayerState(): PlayerState | null;
  getStandalonePlayerDeathState(): PlayerDeathState | null;
  getCameraFollowOffset(): CameraFollowOffset;
}

export interface CreateWorldSessionSaveEnvelopeOptions {
  source: WorldSessionSaveSource;
  migration?: WorldSaveEnvelopeMigrationMetadata;
}

export const createWorldSessionSaveEnvelope = ({
  source,
  migration
}: CreateWorldSessionSaveEnvelopeOptions): WorldSaveEnvelope =>
  createWorldSaveEnvelope({
    worldSnapshot: source.createWorldSnapshot(),
    standalonePlayerState: source.getStandalonePlayerState(),
    standalonePlayerDeathState: source.getStandalonePlayerDeathState(),
    cameraFollowOffset: source.getCameraFollowOffset(),
    ...(migration === undefined ? {} : { migration })
  });
