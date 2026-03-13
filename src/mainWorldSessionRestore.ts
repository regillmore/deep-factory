import type { CameraFollowOffset } from './core/cameraFollow';
import { createWorldSaveEnvelope, type WorldSaveEnvelope } from './mainWorldSave';
import type { PlayerDeathState } from './world/playerDeathState';
import type { PlayerState } from './world/playerState';
import type { TileWorldSnapshot } from './world/world';

export interface WorldSessionRestoreTarget {
  loadWorldSnapshot(snapshot: TileWorldSnapshot): void;
  restoreStandalonePlayerState(playerState: PlayerState | null): void;
  restoreStandalonePlayerDeathState(deathState: PlayerDeathState | null): void;
  restoreCameraFollowOffset(cameraFollowOffset: CameraFollowOffset): void;
}

export interface RestoreWorldSessionFromSaveEnvelopeOptions {
  target: WorldSessionRestoreTarget;
  envelope: WorldSaveEnvelope;
}

export const restoreWorldSessionFromSaveEnvelope = ({
  target,
  envelope
}: RestoreWorldSessionFromSaveEnvelopeOptions): void => {
  const normalizedEnvelope = createWorldSaveEnvelope({
    worldSnapshot: envelope.worldSnapshot,
    standalonePlayerState: envelope.session.standalonePlayerState,
    standalonePlayerDeathState: envelope.session.standalonePlayerDeathState,
    cameraFollowOffset: envelope.session.cameraFollowOffset,
    migration: envelope.migration
  });

  target.loadWorldSnapshot(normalizedEnvelope.worldSnapshot);
  target.restoreStandalonePlayerDeathState(normalizedEnvelope.session.standalonePlayerDeathState);
  target.restoreStandalonePlayerState(normalizedEnvelope.session.standalonePlayerState);
  target.restoreCameraFollowOffset(normalizedEnvelope.session.cameraFollowOffset);
};
