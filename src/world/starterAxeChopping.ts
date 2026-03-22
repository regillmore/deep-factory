import type { PlayerInventoryItemId } from './playerInventory';
import { evaluatePlayerHotbarTilePlacementRange } from './playerHotbarPlacementRange';
import type { PlayerState } from './playerState';
import {
  clearSmallTreeGrowthStageAtAnchor,
  type SmallTreeFootprintWriteResult,
  type SmallTreeMutableWorldView
} from './smallTreeFootprintWrites';
import {
  resolveSmallTreeAnchorFromSampledTile,
  type ResolvedSmallTreeAnchor,
  type SmallTreeGrowthStage
} from './smallTreeAnchors';
import {
  GROWN_SMALL_TREE_FOOTPRINT_CELLS,
  PLANTED_SMALL_TREE_FOOTPRINT_CELLS
} from './smallTreeFootprints';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const STARTER_AXE_ITEM_ID: PlayerInventoryItemId = 'axe';
export const ACORN_ITEM_ID: PlayerInventoryItemId = 'acorn';
export const WOOD_ITEM_ID: PlayerInventoryItemId = 'wood';

export const STARTER_AXE_SWING_WINDUP_SECONDS = 0.1;
export const STARTER_AXE_SWING_ACTIVE_SECONDS = 0.05;
export const STARTER_AXE_SWING_RECOVERY_SECONDS = 0.15;

const WOOD_DROP_AMOUNTS_BY_GROWTH_STAGE: Readonly<Record<SmallTreeGrowthStage, number>> = {
  planted: PLANTED_SMALL_TREE_FOOTPRINT_CELLS.length,
  grown: GROWN_SMALL_TREE_FOOTPRINT_CELLS.length
};

const ACORN_DROP_AMOUNTS_BY_GROWTH_STAGE: Readonly<Record<SmallTreeGrowthStage, number>> = {
  planted: 0,
  grown: 1
};

export type StarterAxeSwingPhase = 'windup' | 'active' | 'recovery';

export interface StarterAxeChoppingWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterAxeChoppingTargetEvaluation {
  tileX: number;
  tileY: number;
  tileId: number;
  occupied: boolean;
  chopTarget: boolean;
  withinRange: boolean;
  canChop: boolean;
  resolvedAnchor: ResolvedSmallTreeAnchor | null;
}

export interface StarterAxeSwingState {
  sampledTileX: number;
  sampledTileY: number;
  anchorTileX: number;
  anchorTileY: number;
  phase: StarterAxeSwingPhase;
  phaseSecondsRemaining: number;
  targetGrowthStage: SmallTreeGrowthStage | null;
}

export interface StarterAxeChoppingState {
  activeSwing: StarterAxeSwingState | null;
}

export interface StarterAxeChopResult extends SmallTreeFootprintWriteResult {
  woodDropAmount: number;
  acornDropAmount: number;
}

export interface TryStartStarterAxeSwingResult {
  state: StarterAxeChoppingState;
  started: boolean;
}

export interface StarterAxeChopEvent {
  anchorTileX: number;
  anchorTileY: number;
  growthStage: SmallTreeGrowthStage;
}

export interface StepStarterAxeChoppingStateOptions {
  world: StarterAxeChoppingWorldView;
  playerState: Pick<PlayerState, 'position' | 'size'> | null;
  fixedDtSeconds: number;
  registry?: TileMetadataRegistry;
}

export interface StepStarterAxeChoppingStateResult {
  state: StarterAxeChoppingState;
  chopEvent: StarterAxeChopEvent | null;
}

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const cloneStarterAxeSwingState = (
  swing: StarterAxeSwingState | null
): StarterAxeSwingState | null =>
  swing === null
    ? null
    : {
        sampledTileX: swing.sampledTileX,
        sampledTileY: swing.sampledTileY,
        anchorTileX: swing.anchorTileX,
        anchorTileY: swing.anchorTileY,
        phase: swing.phase,
        phaseSecondsRemaining: swing.phaseSecondsRemaining,
        targetGrowthStage: swing.targetGrowthStage
      };

export const cloneStarterAxeChoppingState = (
  state: StarterAxeChoppingState
): StarterAxeChoppingState => ({
  activeSwing: cloneStarterAxeSwingState(state.activeSwing)
});

export const createStarterAxeChoppingState = (): StarterAxeChoppingState => ({
  activeSwing: null
});

export const resolveStarterAxeWoodDropAmount = (
  growthStage: SmallTreeGrowthStage
): number => WOOD_DROP_AMOUNTS_BY_GROWTH_STAGE[growthStage];

export const resolveStarterAxeAcornDropAmount = (
  growthStage: SmallTreeGrowthStage
): number => ACORN_DROP_AMOUNTS_BY_GROWTH_STAGE[growthStage];

export const evaluateStarterAxeChoppingTarget = (
  world: StarterAxeChoppingWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'> | null,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterAxeChoppingTargetEvaluation => {
  const tileId = world.getTile(worldTileX, worldTileY);
  const resolvedAnchor = resolveSmallTreeAnchorFromSampledTile(world, worldTileX, worldTileY, registry);
  const withinRange =
    playerState === null
      ? false
      : evaluatePlayerHotbarTilePlacementRange(playerState, worldTileX, worldTileY).withinRange;

  return {
    tileX: worldTileX,
    tileY: worldTileY,
    tileId,
    occupied: tileId !== 0,
    chopTarget: resolvedAnchor !== null,
    withinRange,
    canChop: resolvedAnchor !== null && withinRange,
    resolvedAnchor
  };
};

export const chopSmallTreeAtAnchor = (
  world: SmallTreeMutableWorldView,
  anchorTileX: number,
  anchorTileY: number,
  growthStage: SmallTreeGrowthStage,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterAxeChopResult => {
  const writeResult = clearSmallTreeGrowthStageAtAnchor(
    world,
    anchorTileX,
    anchorTileY,
    growthStage,
    registry
  );

  return {
    ...writeResult,
    woodDropAmount: writeResult.changed ? resolveStarterAxeWoodDropAmount(growthStage) : 0,
    acornDropAmount: writeResult.changed ? resolveStarterAxeAcornDropAmount(growthStage) : 0
  };
};

export const tryStartStarterAxeSwing = (
  state: StarterAxeChoppingState,
  evaluation: StarterAxeChoppingTargetEvaluation
): TryStartStarterAxeSwingResult => {
  if (state.activeSwing !== null || !evaluation.canChop || evaluation.resolvedAnchor === null) {
    return {
      state: cloneStarterAxeChoppingState(state),
      started: false
    };
  }

  return {
    state: {
      activeSwing: {
        sampledTileX: evaluation.tileX,
        sampledTileY: evaluation.tileY,
        anchorTileX: evaluation.resolvedAnchor.anchorTileX,
        anchorTileY: evaluation.resolvedAnchor.anchorTileY,
        phase: 'windup',
        phaseSecondsRemaining: STARTER_AXE_SWING_WINDUP_SECONDS,
        targetGrowthStage: evaluation.resolvedAnchor.growthStage
      }
    },
    started: true
  };
};

const advanceStarterAxeSwingPhase = (
  state: StarterAxeChoppingState,
  phase: StarterAxeSwingPhase,
  targetGrowthStage: SmallTreeGrowthStage | null = state.activeSwing?.targetGrowthStage ?? null
): StarterAxeChoppingState => ({
  activeSwing:
    phase === 'active'
      ? {
          sampledTileX: state.activeSwing!.sampledTileX,
          sampledTileY: state.activeSwing!.sampledTileY,
          anchorTileX: state.activeSwing!.anchorTileX,
          anchorTileY: state.activeSwing!.anchorTileY,
          phase,
          phaseSecondsRemaining: STARTER_AXE_SWING_ACTIVE_SECONDS,
          targetGrowthStage
        }
      : phase === 'recovery'
        ? {
            sampledTileX: state.activeSwing!.sampledTileX,
            sampledTileY: state.activeSwing!.sampledTileY,
            anchorTileX: state.activeSwing!.anchorTileX,
            anchorTileY: state.activeSwing!.anchorTileY,
            phase,
            phaseSecondsRemaining: STARTER_AXE_SWING_RECOVERY_SECONDS,
            targetGrowthStage
          }
        : null
});

const resolveStarterAxeChopEvent = (
  world: StarterAxeChoppingWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'> | null,
  swing: StarterAxeSwingState,
  registry: TileMetadataRegistry
): StarterAxeChopEvent | null => {
  const evaluation = evaluateStarterAxeChoppingTarget(
    world,
    playerState,
    swing.sampledTileX,
    swing.sampledTileY,
    registry
  );
  if (!evaluation.canChop || evaluation.resolvedAnchor === null) {
    return null;
  }

  if (
    evaluation.resolvedAnchor.anchorTileX !== swing.anchorTileX ||
    evaluation.resolvedAnchor.anchorTileY !== swing.anchorTileY
  ) {
    return null;
  }

  return {
    anchorTileX: evaluation.resolvedAnchor.anchorTileX,
    anchorTileY: evaluation.resolvedAnchor.anchorTileY,
    growthStage: evaluation.resolvedAnchor.growthStage
  };
};

export const stepStarterAxeChoppingState = (
  state: StarterAxeChoppingState,
  options: StepStarterAxeChoppingStateOptions
): StepStarterAxeChoppingStateResult => {
  const registry = options.registry ?? TILE_METADATA;
  let nextState = cloneStarterAxeChoppingState(state);
  let chopEvent: StarterAxeChopEvent | null = null;
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
      chopEvent = resolveStarterAxeChopEvent(
        options.world,
        options.playerState,
        nextState.activeSwing,
        registry
      );
      nextState = advanceStarterAxeSwingPhase(nextState, 'active', chopEvent?.growthStage ?? null);
      continue;
    }

    if (nextState.activeSwing.phase === 'active') {
      nextState = advanceStarterAxeSwingPhase(nextState, 'recovery');
      continue;
    }

    nextState = advanceStarterAxeSwingPhase(nextState, 'windup');
    nextState.activeSwing = null;
  }

  return {
    state: nextState,
    chopEvent
  };
};
