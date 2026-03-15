import type { CameraFollowOffset } from './core/cameraFollow';
import { createWorldSaveEnvelope, type WorldSaveEnvelope } from './mainWorldSave';
import type { PlayerDeathState } from './world/playerDeathState';
import { consolidateDroppedItemStates, type DroppedItemState } from './world/droppedItem';
import type { PlayerInventoryState } from './world/playerInventory';
import type { PlayerState } from './world/playerState';
import type { TileWorldSnapshot } from './world/world';

export interface WorldSessionRestoreTarget {
  loadWorldSnapshot(snapshot: TileWorldSnapshot): void;
  restoreStandalonePlayerState(playerState: PlayerState | null): void;
  restoreStandalonePlayerDeathState(deathState: PlayerDeathState | null): void;
  restoreStandalonePlayerInventoryState(inventoryState: PlayerInventoryState): void;
  restoreDroppedItemStates(droppedItemStates: DroppedItemState[]): void;
  restoreCameraFollowOffset(cameraFollowOffset: CameraFollowOffset): void;
}

export interface RestoreWorldSessionFromSaveEnvelopeOptions {
  target: WorldSessionRestoreTarget;
  envelope: WorldSaveEnvelope;
}

export interface RestoreWorldSessionFromSaveEnvelopeResult {
  restoredEnvelope: WorldSaveEnvelope;
  didNormalizeDroppedItemStates: boolean;
}

const areDroppedItemStatesEqual = (
  left: readonly DroppedItemState[],
  right: readonly DroppedItemState[]
): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftState = left[index];
    const rightState = right[index];
    if (
      leftState === undefined ||
      rightState === undefined ||
      leftState.itemId !== rightState.itemId ||
      leftState.amount !== rightState.amount ||
      leftState.position.x !== rightState.position.x ||
      leftState.position.y !== rightState.position.y
    ) {
      return false;
    }
  }

  return true;
};

export const restoreWorldSessionFromSaveEnvelope = ({
  target,
  envelope
}: RestoreWorldSessionFromSaveEnvelopeOptions): RestoreWorldSessionFromSaveEnvelopeResult => {
  const normalizedEnvelope = createWorldSaveEnvelope({
    worldSnapshot: envelope.worldSnapshot,
    standalonePlayerState: envelope.session.standalonePlayerState,
    standalonePlayerDeathState: envelope.session.standalonePlayerDeathState,
    standalonePlayerInventoryState: envelope.session.standalonePlayerInventoryState,
    droppedItemStates: envelope.session.droppedItemStates,
    cameraFollowOffset: envelope.session.cameraFollowOffset,
    migration: envelope.migration
  });
  const consolidatedDroppedItemStates = consolidateDroppedItemStates(
    normalizedEnvelope.session.droppedItemStates
  );
  const didNormalizeDroppedItemStates = !areDroppedItemStatesEqual(
    normalizedEnvelope.session.droppedItemStates,
    consolidatedDroppedItemStates
  );
  const restoredEnvelope = didNormalizeDroppedItemStates
    ? createWorldSaveEnvelope({
        worldSnapshot: normalizedEnvelope.worldSnapshot,
        standalonePlayerState: normalizedEnvelope.session.standalonePlayerState,
        standalonePlayerDeathState: normalizedEnvelope.session.standalonePlayerDeathState,
        standalonePlayerInventoryState: normalizedEnvelope.session.standalonePlayerInventoryState,
        droppedItemStates: consolidatedDroppedItemStates,
        cameraFollowOffset: normalizedEnvelope.session.cameraFollowOffset,
        migration: normalizedEnvelope.migration
      })
    : normalizedEnvelope;

  target.loadWorldSnapshot(restoredEnvelope.worldSnapshot);
  target.restoreStandalonePlayerDeathState(restoredEnvelope.session.standalonePlayerDeathState);
  target.restoreStandalonePlayerState(restoredEnvelope.session.standalonePlayerState);
  target.restoreStandalonePlayerInventoryState(
    restoredEnvelope.session.standalonePlayerInventoryState
  );
  target.restoreDroppedItemStates(restoredEnvelope.session.droppedItemStates);
  target.restoreCameraFollowOffset(restoredEnvelope.session.cameraFollowOffset);

  return {
    restoredEnvelope,
    didNormalizeDroppedItemStates
  };
};
