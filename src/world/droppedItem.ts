import type { WorldAabb } from './collision';
import { TILE_SIZE } from './constants';
import {
  addPlayerInventoryItemStack,
  getPlayerInventoryItemDefinition,
  isPlayerInventoryItemId,
  type PlayerInventoryItemId,
  type PlayerInventoryState
} from './playerInventory';
import { getPlayerAabb, type PlayerState } from './playerState';

export interface DroppedItemVector {
  x: number;
  y: number;
}

export interface DroppedItemState {
  position: DroppedItemVector;
  itemId: PlayerInventoryItemId;
  amount: number;
}

export interface CreateDroppedItemStateOptions {
  position?: Partial<DroppedItemVector>;
  itemId: PlayerInventoryItemId;
  amount: number;
}

export interface ResolveDroppedItemPickupResult {
  nextDroppedItemState: DroppedItemState | null;
  nextInventoryState: PlayerInventoryState;
  pickedUpAmount: number;
}

export interface ResolveDroppedItemStackMergeResult {
  nextTargetDroppedItemState: DroppedItemState;
  nextSourceDroppedItemState: DroppedItemState | null;
  mergedAmount: number;
}

export interface ResolveDroppedItemStackMergeCascadeTargetResult {
  targetIndex: number;
  nextTargetDroppedItemState: DroppedItemState;
  mergedAmount: number;
}

export interface ResolveDroppedItemStackMergeCascadeResult {
  targetResults: ResolveDroppedItemStackMergeCascadeTargetResult[];
  nextSourceDroppedItemState: DroppedItemState | null;
  totalMergedAmount: number;
}

export const DROPPED_ITEM_WIDTH = 10;
export const DROPPED_ITEM_HEIGHT = 10;
export const DROPPED_ITEM_PICKUP_PADDING = 6;
export const DROPPED_ITEM_PLAYER_DROP_FORWARD_OFFSET = TILE_SIZE * 1.25;

const expectFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectPositiveInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }

  return value;
};

const buildDroppedItemVector = (
  vector: Partial<DroppedItemVector> | undefined,
  label: string
): DroppedItemVector => ({
  x: expectFiniteNumber(vector?.x ?? 0, `${label}.x`),
  y: expectFiniteNumber(vector?.y ?? 0, `${label}.y`)
});

const getExpandedPlayerPickupAabb = (playerState: PlayerState): WorldAabb => {
  const playerAabb = getPlayerAabb(playerState);
  return {
    minX: playerAabb.minX - DROPPED_ITEM_PICKUP_PADDING,
    minY: playerAabb.minY - DROPPED_ITEM_PICKUP_PADDING,
    maxX: playerAabb.maxX + DROPPED_ITEM_PICKUP_PADDING,
    maxY: playerAabb.maxY + DROPPED_ITEM_PICKUP_PADDING
  };
};

const doAabbsOverlap = (left: WorldAabb, right: WorldAabb): boolean =>
  left.minX < right.maxX &&
  left.maxX > right.minX &&
  left.minY < right.maxY &&
  left.maxY > right.minY;

export const cloneDroppedItemState = (state: DroppedItemState): DroppedItemState => ({
  position: {
    x: state.position.x,
    y: state.position.y
  },
  itemId: state.itemId,
  amount: state.amount
});

export const createDroppedItemState = (
  options: CreateDroppedItemStateOptions
): DroppedItemState => {
  if (!isPlayerInventoryItemId(options.itemId)) {
    throw new Error('itemId must be a known player inventory item id');
  }

  const amount = expectPositiveInteger(options.amount, 'amount');
  const maxStackSize = getPlayerInventoryItemDefinition(options.itemId).maxStackSize;
  if (amount > maxStackSize) {
    throw new Error(`amount must be an integer between 1 and ${maxStackSize}`);
  }

  return {
    position: buildDroppedItemVector(options.position, 'position'),
    itemId: options.itemId,
    amount
  };
};

export const getDroppedItemAabb = (
  state: DroppedItemState,
  renderPosition: DroppedItemState['position'] = state.position
): WorldAabb => {
  const halfWidth = DROPPED_ITEM_WIDTH * 0.5;
  const halfHeight = DROPPED_ITEM_HEIGHT * 0.5;
  return {
    minX: renderPosition.x - halfWidth,
    minY: renderPosition.y - halfHeight,
    maxX: renderPosition.x + halfWidth,
    maxY: renderPosition.y + halfHeight
  };
};

export const createDroppedItemStateFromPlayerDrop = (
  playerState: PlayerState,
  itemId: PlayerInventoryItemId,
  amount: number
): DroppedItemState => {
  const facingSign = playerState.facing === 'left' ? -1 : 1;
  return createDroppedItemState({
    position: {
      x: playerState.position.x + facingSign * DROPPED_ITEM_PLAYER_DROP_FORWARD_OFFSET,
      y: playerState.position.y - playerState.size.height * 0.5
    },
    itemId,
    amount
  });
};

export const createDroppedItemStateFromWorldTile = (
  worldTileX: number,
  worldTileY: number,
  itemId: PlayerInventoryItemId,
  amount: number
): DroppedItemState =>
  createDroppedItemState({
    position: {
      x: (worldTileX + 0.5) * TILE_SIZE,
      y: (worldTileY + 0.5) * TILE_SIZE
    },
    itemId,
    amount
  });

export const isDroppedItemInPickupRange = (
  droppedItemState: DroppedItemState,
  playerState: PlayerState
): boolean =>
  doAabbsOverlap(getDroppedItemAabb(droppedItemState), getExpandedPlayerPickupAabb(playerState));

export const canDroppedItemStacksMerge = (
  targetDroppedItemState: DroppedItemState,
  sourceDroppedItemState: DroppedItemState
): boolean =>
  targetDroppedItemState.itemId === sourceDroppedItemState.itemId &&
  doAabbsOverlap(getDroppedItemAabb(targetDroppedItemState), getDroppedItemAabb(sourceDroppedItemState));

const getDroppedItemDistanceSquared = (
  targetDroppedItemState: DroppedItemState,
  sourceDroppedItemState: DroppedItemState
): number => {
  const dx = targetDroppedItemState.position.x - sourceDroppedItemState.position.x;
  const dy = targetDroppedItemState.position.y - sourceDroppedItemState.position.y;
  return dx * dx + dy * dy;
};

export const resolveDroppedItemStackMerge = (
  targetDroppedItemState: DroppedItemState,
  sourceDroppedItemState: DroppedItemState
): ResolveDroppedItemStackMergeResult => {
  if (targetDroppedItemState.itemId !== sourceDroppedItemState.itemId) {
    return {
      nextTargetDroppedItemState: cloneDroppedItemState(targetDroppedItemState),
      nextSourceDroppedItemState: cloneDroppedItemState(sourceDroppedItemState),
      mergedAmount: 0
    };
  }

  const maxStackSize = getPlayerInventoryItemDefinition(targetDroppedItemState.itemId).maxStackSize;
  const targetCapacity = maxStackSize - targetDroppedItemState.amount;
  if (targetCapacity <= 0) {
    return {
      nextTargetDroppedItemState: cloneDroppedItemState(targetDroppedItemState),
      nextSourceDroppedItemState: cloneDroppedItemState(sourceDroppedItemState),
      mergedAmount: 0
    };
  }

  const mergedAmount = Math.min(targetCapacity, sourceDroppedItemState.amount);
  const remainingSourceAmount = sourceDroppedItemState.amount - mergedAmount;
  return {
    nextTargetDroppedItemState: createDroppedItemState({
      position: targetDroppedItemState.position,
      itemId: targetDroppedItemState.itemId,
      amount: targetDroppedItemState.amount + mergedAmount
    }),
    nextSourceDroppedItemState:
      remainingSourceAmount > 0
        ? createDroppedItemState({
            position: sourceDroppedItemState.position,
            itemId: sourceDroppedItemState.itemId,
            amount: remainingSourceAmount
          })
        : null,
    mergedAmount
  };
};

export const resolveDroppedItemStackMergeCascade = (
  targetDroppedItemStates: readonly DroppedItemState[],
  sourceDroppedItemState: DroppedItemState
): ResolveDroppedItemStackMergeCascadeResult => {
  const targetOrder = targetDroppedItemStates
    .map((state, targetIndex) => ({
      targetIndex,
      distanceSquared: getDroppedItemDistanceSquared(state, sourceDroppedItemState)
    }))
    .sort((left, right) => {
      if (left.distanceSquared !== right.distanceSquared) {
        return left.distanceSquared - right.distanceSquared;
      }

      return left.targetIndex - right.targetIndex;
    });

  const targetResults: ResolveDroppedItemStackMergeCascadeTargetResult[] = [];
  let remainingSourceDroppedItemState: DroppedItemState | null =
    cloneDroppedItemState(sourceDroppedItemState);
  let totalMergedAmount = 0;

  for (const target of targetOrder) {
    if (remainingSourceDroppedItemState === null) {
      break;
    }

    const targetDroppedItemState = targetDroppedItemStates[target.targetIndex];
    if (!canDroppedItemStacksMerge(targetDroppedItemState, remainingSourceDroppedItemState)) {
      continue;
    }

    const mergeResult = resolveDroppedItemStackMerge(
      targetDroppedItemState,
      remainingSourceDroppedItemState
    );
    if (mergeResult.mergedAmount <= 0) {
      continue;
    }

    targetResults.push({
      targetIndex: target.targetIndex,
      nextTargetDroppedItemState: mergeResult.nextTargetDroppedItemState,
      mergedAmount: mergeResult.mergedAmount
    });
    remainingSourceDroppedItemState = mergeResult.nextSourceDroppedItemState;
    totalMergedAmount += mergeResult.mergedAmount;
  }

  return {
    targetResults,
    nextSourceDroppedItemState: remainingSourceDroppedItemState,
    totalMergedAmount
  };
};

export const resolveDroppedItemPickup = (
  droppedItemState: DroppedItemState,
  playerState: PlayerState,
  inventoryState: PlayerInventoryState
): ResolveDroppedItemPickupResult => {
  if (!isDroppedItemInPickupRange(droppedItemState, playerState)) {
    return {
      nextDroppedItemState: cloneDroppedItemState(droppedItemState),
      nextInventoryState: inventoryState,
      pickedUpAmount: 0
    };
  }

  const addResult = addPlayerInventoryItemStack(
    inventoryState,
    droppedItemState.itemId,
    droppedItemState.amount
  );
  if (addResult.addedAmount <= 0) {
    return {
      nextDroppedItemState: cloneDroppedItemState(droppedItemState),
      nextInventoryState: addResult.state,
      pickedUpAmount: 0
    };
  }

  return {
    nextDroppedItemState:
      addResult.remainingAmount > 0
        ? createDroppedItemState({
            position: droppedItemState.position,
            itemId: droppedItemState.itemId,
            amount: addResult.remainingAmount
          })
        : null,
    nextInventoryState: addResult.state,
    pickedUpAmount: addResult.addedAmount
  };
};
