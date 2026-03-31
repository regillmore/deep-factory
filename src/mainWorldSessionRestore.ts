import type { CameraFollowOffset } from './core/cameraFollow';
import { createWorldSaveEnvelope, type WorldSaveEnvelope } from './mainWorldSave';
import type { PlayerDeathState } from './world/playerDeathState';
import { consolidateDroppedItemStates, type DroppedItemState } from './world/droppedItem';
import type { PlayerInventoryState } from './world/playerInventory';
import type { PlayerEquipmentState } from './world/playerEquipment';
import type { SmallTreeGrowthState } from './world/smallTreeGrowth';
import {
  isCompleteStarterBedAtAnchor,
  type StarterBedAnchor
} from './world/starterBedPlacement';
import type { PlayerState } from './world/playerState';
import { TileWorld, type TileWorldSnapshot } from './world/world';

export interface WorldSessionRestoreTarget {
  loadWorldSnapshot(snapshot: TileWorldSnapshot): void;
  restoreStandalonePlayerState(playerState: PlayerState | null): void;
  restoreStandalonePlayerDeathState(deathState: PlayerDeathState | null): void;
  restoreStandalonePlayerInventoryState(inventoryState: PlayerInventoryState): void;
  restoreStandalonePlayerEquipmentState(equipmentState: PlayerEquipmentState): void;
  restoreDroppedItemStates(droppedItemStates: DroppedItemState[]): void;
  restoreClaimedBedCheckpoint(claimedBedCheckpoint: StarterBedAnchor | null): void;
  restoreCameraFollowOffset(cameraFollowOffset: CameraFollowOffset): void;
  restoreSmallTreeGrowthState(smallTreeGrowthState: SmallTreeGrowthState): void;
}

export interface RestoreWorldSessionFromSaveEnvelopeOptions {
  target: WorldSessionRestoreTarget;
  envelope: WorldSaveEnvelope;
}

export interface RestoreWorldSessionFromSaveEnvelopeResult {
  restoredEnvelope: WorldSaveEnvelope;
  didNormalizeDroppedItemStates: boolean;
  didNormalizeClaimedBedCheckpoint: boolean;
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

const areClaimedBedCheckpointsEqual = (
  left: StarterBedAnchor | null,
  right: StarterBedAnchor | null
): boolean =>
  left === right ||
  (left !== null &&
    right !== null &&
    left.leftTileX === right.leftTileX &&
    left.tileY === right.tileY);

const normalizeRestoredClaimedBedCheckpoint = (
  worldSnapshot: TileWorldSnapshot,
  claimedBedCheckpoint: StarterBedAnchor | null
): StarterBedAnchor | null => {
  if (claimedBedCheckpoint === null) {
    return null;
  }

  const restoredWorld = new TileWorld(0);
  restoredWorld.loadSnapshot(worldSnapshot);
  return isCompleteStarterBedAtAnchor(
    restoredWorld,
    claimedBedCheckpoint.leftTileX,
    claimedBedCheckpoint.tileY
  )
    ? {
        leftTileX: claimedBedCheckpoint.leftTileX,
        tileY: claimedBedCheckpoint.tileY
      }
    : null;
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
    standalonePlayerEquipmentState: envelope.session.standalonePlayerEquipmentState,
    droppedItemStates: envelope.session.droppedItemStates,
    claimedBedCheckpoint: envelope.session.claimedBedCheckpoint,
    cameraFollowOffset: envelope.session.cameraFollowOffset,
    smallTreeGrowthState: envelope.session.smallTreeGrowthState,
    migration: envelope.migration
  });
  const consolidatedDroppedItemStates = consolidateDroppedItemStates(
    normalizedEnvelope.session.droppedItemStates
  );
  const didNormalizeDroppedItemStates = !areDroppedItemStatesEqual(
    normalizedEnvelope.session.droppedItemStates,
    consolidatedDroppedItemStates
  );
  const normalizedClaimedBedCheckpoint = normalizeRestoredClaimedBedCheckpoint(
    normalizedEnvelope.worldSnapshot,
    normalizedEnvelope.session.claimedBedCheckpoint
  );
  const didNormalizeClaimedBedCheckpoint = !areClaimedBedCheckpointsEqual(
    normalizedEnvelope.session.claimedBedCheckpoint,
    normalizedClaimedBedCheckpoint
  );
  const restoredEnvelope = didNormalizeDroppedItemStates || didNormalizeClaimedBedCheckpoint
    ? createWorldSaveEnvelope({
        worldSnapshot: normalizedEnvelope.worldSnapshot,
        standalonePlayerState: normalizedEnvelope.session.standalonePlayerState,
        standalonePlayerDeathState: normalizedEnvelope.session.standalonePlayerDeathState,
        standalonePlayerInventoryState: normalizedEnvelope.session.standalonePlayerInventoryState,
        standalonePlayerEquipmentState: normalizedEnvelope.session.standalonePlayerEquipmentState,
        droppedItemStates: consolidatedDroppedItemStates,
        claimedBedCheckpoint: normalizedClaimedBedCheckpoint,
        cameraFollowOffset: normalizedEnvelope.session.cameraFollowOffset,
        smallTreeGrowthState: normalizedEnvelope.session.smallTreeGrowthState,
        migration: normalizedEnvelope.migration
      })
    : normalizedEnvelope;

  target.loadWorldSnapshot(restoredEnvelope.worldSnapshot);
  target.restoreStandalonePlayerDeathState(restoredEnvelope.session.standalonePlayerDeathState);
  target.restoreStandalonePlayerState(restoredEnvelope.session.standalonePlayerState);
  target.restoreStandalonePlayerInventoryState(
    restoredEnvelope.session.standalonePlayerInventoryState
  );
  target.restoreStandalonePlayerEquipmentState(
    restoredEnvelope.session.standalonePlayerEquipmentState
  );
  target.restoreDroppedItemStates(restoredEnvelope.session.droppedItemStates);
  target.restoreClaimedBedCheckpoint(restoredEnvelope.session.claimedBedCheckpoint);
  target.restoreCameraFollowOffset(restoredEnvelope.session.cameraFollowOffset);
  target.restoreSmallTreeGrowthState(restoredEnvelope.session.smallTreeGrowthState);

  return {
    restoredEnvelope,
    didNormalizeDroppedItemStates,
    didNormalizeClaimedBedCheckpoint
  };
};
