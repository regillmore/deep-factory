import type { PlayerInventoryItemId } from './playerInventory';
import { evaluatePlayerHotbarTilePlacementRange } from './playerHotbarPlacementRange';
import { PROCEDURAL_COPPER_ORE_TILE_ID } from './proceduralTerrain';
import type { PlayerState } from './playerState';
import {
  STARTER_DIRT_WALL_ID,
  STARTER_WOOD_WALL_ID
} from './starterWallPlacement';
import {
  PLACEABLE_WOOD_BLOCK_ITEM_ID,
  PLACEABLE_WOOD_BLOCK_TILE_ID,
  STARTER_BUILDING_BLOCK_ITEM_ID,
  STARTER_BUILDING_BLOCK_TILE_ID
} from './starterBlockPlacement';
import { STARTER_ROPE_TILE_ID } from './starterRopePlacement';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';
import { STARTER_TORCH_TILE_ID } from './starterTorchPlacement';
import { STARTER_WORKBENCH_TILE_ID } from './starterWorkbenchPlacement';
import { STARTER_FURNACE_TILE_ID } from './starterFurnacePlacement';
import { STARTER_ANVIL_TILE_ID } from './starterAnvilPlacement';
import { isStarterDoorTileId } from './starterDoorPlacement';
import {
  hasTerrainAutotileMetadata,
  isTileSolid,
  TILE_METADATA,
  type TileMetadataRegistry
} from './tileMetadata';

export const STARTER_PICKAXE_ITEM_ID: PlayerInventoryItemId = 'pickaxe';
export const STONE_BLOCK_ITEM_ID: PlayerInventoryItemId = 'stone-block';
export const COPPER_ORE_ITEM_ID: PlayerInventoryItemId = 'copper-ore';

export const STARTER_PICKAXE_SWING_WINDUP_SECONDS = 0.1;
export const STARTER_PICKAXE_SWING_ACTIVE_SECONDS = 0.05;
export const STARTER_PICKAXE_SWING_RECOVERY_SECONDS = 0.15;

const STONE_TILE_ID = 1;
const GRASS_SURFACE_TILE_ID = 2;

export type StarterPickaxeSwingPhase = 'windup' | 'active' | 'recovery';
export type StarterPickaxeMiningTargetLayer = 'tile' | 'wall';

export interface StarterPickaxeMiningWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
  getWall(worldTileX: number, worldTileY: number): number;
}

export interface StarterPickaxeMiningTargetEvaluation {
  tileX: number;
  tileY: number;
  tileId: number;
  wallId: number;
  targetLayer: StarterPickaxeMiningTargetLayer | null;
  targetId: number;
  occupied: boolean;
  breakableTarget: boolean;
  withinRange: boolean;
  canMine: boolean;
}

export interface StarterPickaxeSwingState {
  tileX: number;
  tileY: number;
  phase: StarterPickaxeSwingPhase;
  phaseSecondsRemaining: number;
}

export interface StarterPickaxeBreakProgressState {
  tileX: number;
  tileY: number;
  targetLayer: StarterPickaxeMiningTargetLayer;
  targetId: number;
  appliedHitCount: number;
  requiredHitCount: number;
}

export interface StarterPickaxeMiningState {
  activeSwing: StarterPickaxeSwingState | null;
  breakProgress: StarterPickaxeBreakProgressState | null;
}

export interface StarterPickaxeBrokenTileDrop {
  itemId: PlayerInventoryItemId;
  amount: number;
}

export interface TryStartStarterPickaxeSwingResult {
  state: StarterPickaxeMiningState;
  started: boolean;
}

export interface StarterPickaxeHitEvent {
  tileX: number;
  tileY: number;
  targetLayer: StarterPickaxeMiningTargetLayer;
  targetId: number;
  appliedHitCount: number;
  requiredHitCount: number;
  brokeTarget: boolean;
}

export interface StepStarterPickaxeMiningStateOptions {
  world: StarterPickaxeMiningWorldView;
  playerState: Pick<PlayerState, 'position' | 'size'> | null;
  fixedDtSeconds: number;
  registry?: TileMetadataRegistry;
}

export interface StepStarterPickaxeMiningStateResult {
  state: StarterPickaxeMiningState;
  hitEvent: StarterPickaxeHitEvent | null;
}

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const cloneStarterPickaxeSwingState = (
  swing: StarterPickaxeSwingState | null
): StarterPickaxeSwingState | null =>
  swing === null
    ? null
    : {
        tileX: swing.tileX,
        tileY: swing.tileY,
        phase: swing.phase,
        phaseSecondsRemaining: swing.phaseSecondsRemaining
      };

const cloneStarterPickaxeBreakProgressState = (
  progress: StarterPickaxeBreakProgressState | null
): StarterPickaxeBreakProgressState | null =>
  progress === null
    ? null
    : {
        tileX: progress.tileX,
        tileY: progress.tileY,
        targetLayer: progress.targetLayer,
        targetId: progress.targetId,
        appliedHitCount: progress.appliedHitCount,
        requiredHitCount: progress.requiredHitCount
      };

export const cloneStarterPickaxeMiningState = (
  state: StarterPickaxeMiningState
): StarterPickaxeMiningState => ({
  activeSwing: cloneStarterPickaxeSwingState(state.activeSwing),
  breakProgress: cloneStarterPickaxeBreakProgressState(state.breakProgress)
});

export const createStarterPickaxeMiningState = (): StarterPickaxeMiningState => ({
  activeSwing: null,
  breakProgress: null
});

const isBreakableTerrainTile = (
  tileId: number,
  registry: TileMetadataRegistry
): boolean => tileId !== 0 && isTileSolid(tileId, registry) && hasTerrainAutotileMetadata(tileId, registry);

const isBreakableStarterPickaxeTargetTile = (
  tileId: number,
  registry: TileMetadataRegistry
): boolean =>
  isStarterDoorTileId(tileId) ||
  tileId === STARTER_ROPE_TILE_ID ||
  tileId === STARTER_PLATFORM_TILE_ID ||
  tileId === STARTER_TORCH_TILE_ID ||
  tileId === STARTER_WORKBENCH_TILE_ID ||
  tileId === STARTER_FURNACE_TILE_ID ||
  tileId === STARTER_ANVIL_TILE_ID ||
  isBreakableTerrainTile(tileId, registry);

const isBreakableStarterPickaxeTargetWall = (tileId: number, wallId: number): boolean =>
  tileId === 0 && (wallId === STARTER_DIRT_WALL_ID || wallId === STARTER_WOOD_WALL_ID);

const resolveStarterPickaxeTarget = (
  tileId: number,
  wallId: number,
  registry: TileMetadataRegistry
): Pick<StarterPickaxeMiningTargetEvaluation, 'targetLayer' | 'targetId' | 'breakableTarget'> => {
  if (isBreakableStarterPickaxeTargetTile(tileId, registry)) {
    return {
      targetLayer: 'tile',
      targetId: tileId,
      breakableTarget: true
    };
  }

  if (isBreakableStarterPickaxeTargetWall(tileId, wallId)) {
    return {
      targetLayer: 'wall',
      targetId: wallId,
      breakableTarget: true
    };
  }

  return {
    targetLayer: null,
    targetId: 0,
    breakableTarget: false
  };
};

const resolveStarterPickaxeRequiredHitCount = (
  targetLayer: StarterPickaxeMiningTargetLayer,
  targetId: number
): number =>
  targetLayer === 'tile' &&
  (targetId === STONE_TILE_ID || targetId === PROCEDURAL_COPPER_ORE_TILE_ID)
    ? 2
    : 1;

export const resolveStarterPickaxeBrokenTileDrop = (
  tileId: number
): StarterPickaxeBrokenTileDrop | null => {
  switch (tileId) {
    case STONE_TILE_ID:
      return {
        itemId: STONE_BLOCK_ITEM_ID,
        amount: 1
      };
    case PROCEDURAL_COPPER_ORE_TILE_ID:
      return {
        itemId: COPPER_ORE_ITEM_ID,
        amount: 1
      };
    case GRASS_SURFACE_TILE_ID:
    case STARTER_BUILDING_BLOCK_TILE_ID:
      return {
        itemId: STARTER_BUILDING_BLOCK_ITEM_ID,
        amount: 1
      };
    case PLACEABLE_WOOD_BLOCK_TILE_ID:
      return {
        itemId: PLACEABLE_WOOD_BLOCK_ITEM_ID,
        amount: 1
      };
    default:
      return null;
  }
};

export const evaluateStarterPickaxeMiningTarget = (
  world: StarterPickaxeMiningWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'> | null,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterPickaxeMiningTargetEvaluation => {
  const tileId = world.getTile(worldTileX, worldTileY);
  const wallId = world.getWall(worldTileX, worldTileY);
  const occupied = tileId !== 0 || wallId !== 0;
  const { targetLayer, targetId, breakableTarget } = resolveStarterPickaxeTarget(
    tileId,
    wallId,
    registry
  );
  const withinRange =
    playerState === null
      ? false
      : evaluatePlayerHotbarTilePlacementRange(playerState, worldTileX, worldTileY).withinRange;

  return {
    tileX: worldTileX,
    tileY: worldTileY,
    tileId,
    wallId,
    targetLayer,
    targetId,
    occupied,
    breakableTarget,
    withinRange,
    canMine: breakableTarget && withinRange
  };
};

export const tryStartStarterPickaxeSwing = (
  state: StarterPickaxeMiningState,
  evaluation: StarterPickaxeMiningTargetEvaluation
): TryStartStarterPickaxeSwingResult => {
  if (state.activeSwing !== null || !evaluation.canMine) {
    return {
      state: cloneStarterPickaxeMiningState(state),
      started: false
    };
  }

  return {
    state: {
      activeSwing: {
        tileX: evaluation.tileX,
        tileY: evaluation.tileY,
        phase: 'windup',
        phaseSecondsRemaining: STARTER_PICKAXE_SWING_WINDUP_SECONDS
      },
      breakProgress: cloneStarterPickaxeBreakProgressState(state.breakProgress)
    },
    started: true
  };
};

const normalizeStarterPickaxeBreakProgressState = (
  progress: StarterPickaxeBreakProgressState | null,
  world: StarterPickaxeMiningWorldView,
  registry: TileMetadataRegistry
): StarterPickaxeBreakProgressState | null => {
  if (progress === null) {
    return null;
  }

  const evaluation = evaluateStarterPickaxeMiningTarget(
    world,
    null,
    progress.tileX,
    progress.tileY,
    registry
  );
  if (
    !evaluation.breakableTarget ||
    evaluation.targetLayer !== progress.targetLayer ||
    evaluation.targetId !== progress.targetId
  ) {
    return null;
  }

  return {
    tileX: progress.tileX,
    tileY: progress.tileY,
    targetLayer: progress.targetLayer,
    targetId: progress.targetId,
    appliedHitCount: progress.appliedHitCount,
    requiredHitCount: progress.requiredHitCount
  };
};

const createStarterPickaxeHitEvent = (
  tileX: number,
  tileY: number,
  targetLayer: StarterPickaxeMiningTargetLayer,
  targetId: number,
  appliedHitCount: number,
  requiredHitCount: number,
  brokeTarget: boolean
): StarterPickaxeHitEvent => ({
  tileX,
  tileY,
  targetLayer,
  targetId,
  appliedHitCount,
  requiredHitCount,
  brokeTarget
});

const applyStarterPickaxeHit = (
  progress: StarterPickaxeBreakProgressState | null,
  world: StarterPickaxeMiningWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'> | null,
  tileX: number,
  tileY: number,
  registry: TileMetadataRegistry
): Pick<StepStarterPickaxeMiningStateResult, 'hitEvent'> & {
  breakProgress: StarterPickaxeBreakProgressState | null;
} => {
  const evaluation = evaluateStarterPickaxeMiningTarget(world, playerState, tileX, tileY, registry);
  if (!evaluation.breakableTarget || evaluation.targetLayer === null) {
    return {
      breakProgress: null,
      hitEvent: null
    };
  }

  const requiredHitCount = resolveStarterPickaxeRequiredHitCount(
    evaluation.targetLayer,
    evaluation.targetId
  );
  const continuedProgress =
    progress !== null &&
    progress.tileX === tileX &&
    progress.tileY === tileY &&
    progress.targetLayer === evaluation.targetLayer &&
    progress.targetId === evaluation.targetId
      ? progress
      : null;

  if (!evaluation.withinRange) {
    return {
      breakProgress: cloneStarterPickaxeBreakProgressState(continuedProgress),
      hitEvent: null
    };
  }

  const appliedHitCount = (continuedProgress?.appliedHitCount ?? 0) + 1;
  if (appliedHitCount >= requiredHitCount) {
    return {
      breakProgress: null,
      hitEvent: createStarterPickaxeHitEvent(
        tileX,
        tileY,
        evaluation.targetLayer,
        evaluation.targetId,
        appliedHitCount,
        requiredHitCount,
        true
      )
    };
  }

  return {
    breakProgress: {
      tileX,
      tileY,
      targetLayer: evaluation.targetLayer,
      targetId: evaluation.targetId,
      appliedHitCount,
      requiredHitCount
    },
    hitEvent: createStarterPickaxeHitEvent(
      tileX,
      tileY,
      evaluation.targetLayer,
      evaluation.targetId,
      appliedHitCount,
      requiredHitCount,
      false
    )
  };
};

export const resolveStarterPickaxeBreakProgressNormalized = (
  state: StarterPickaxeMiningState,
  world: StarterPickaxeMiningWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number => {
  const progress = normalizeStarterPickaxeBreakProgressState(state.breakProgress, world, registry);
  if (progress === null || progress.tileX !== worldTileX || progress.tileY !== worldTileY) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, progress.appliedHitCount / Math.max(1, progress.requiredHitCount))
  );
};

const advanceStarterPickaxeSwingPhase = (
  state: StarterPickaxeMiningState,
  phase: StarterPickaxeSwingPhase
): StarterPickaxeMiningState => ({
  activeSwing:
    phase === 'active'
      ? {
          tileX: state.activeSwing!.tileX,
          tileY: state.activeSwing!.tileY,
          phase,
          phaseSecondsRemaining: STARTER_PICKAXE_SWING_ACTIVE_SECONDS
        }
      : phase === 'recovery'
        ? {
            tileX: state.activeSwing!.tileX,
            tileY: state.activeSwing!.tileY,
            phase,
            phaseSecondsRemaining: STARTER_PICKAXE_SWING_RECOVERY_SECONDS
          }
        : null,
  breakProgress: cloneStarterPickaxeBreakProgressState(state.breakProgress)
});

export const stepStarterPickaxeMiningState = (
  state: StarterPickaxeMiningState,
  options: StepStarterPickaxeMiningStateOptions
): StepStarterPickaxeMiningStateResult => {
  const registry = options.registry ?? TILE_METADATA;
  let nextState = cloneStarterPickaxeMiningState(state);
  nextState.breakProgress = normalizeStarterPickaxeBreakProgressState(
    nextState.breakProgress,
    options.world,
    registry
  );

  let hitEvent: StarterPickaxeHitEvent | null = null;
  let remainingDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );

  while (nextState.activeSwing !== null && remainingDtSeconds > 0) {
    const phaseSecondsRemaining = expectNonNegativeFiniteNumber(
      nextState.activeSwing.phaseSecondsRemaining,
      'state.activeSwing.phaseSecondsRemaining'
    );
    if (remainingDtSeconds < phaseSecondsRemaining) {
      nextState.activeSwing = {
        ...nextState.activeSwing,
        phaseSecondsRemaining: phaseSecondsRemaining - remainingDtSeconds
      };
      remainingDtSeconds = 0;
      break;
    }

    remainingDtSeconds -= phaseSecondsRemaining;
    if (nextState.activeSwing.phase === 'windup') {
      const hitResult = applyStarterPickaxeHit(
        nextState.breakProgress,
        options.world,
        options.playerState,
        nextState.activeSwing.tileX,
        nextState.activeSwing.tileY,
        registry
      );
      nextState = {
        activeSwing: nextState.activeSwing,
        breakProgress: hitResult.breakProgress
      };
      hitEvent = hitResult.hitEvent;
      nextState = advanceStarterPickaxeSwingPhase(nextState, 'active');
      continue;
    }

    if (nextState.activeSwing.phase === 'active') {
      nextState = advanceStarterPickaxeSwingPhase(nextState, 'recovery');
      continue;
    }

    nextState = advanceStarterPickaxeSwingPhase(nextState, 'windup');
    nextState.activeSwing = null;
  }

  return {
    state: nextState,
    hitEvent
  };
};
