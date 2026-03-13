import { worldToChunkCoord, worldToLocalTile } from '../world/chunkMath';
import { MAX_LIGHT_LEVEL, MAX_LIQUID_LEVEL, TILE_SIZE } from '../world/constants';
import type { LiquidSurfaceBranchKind } from '../world/liquidSurface';
import type { PlayerCeilingContactTransitionKind } from '../world/playerCeilingContactTransition';
import type { PlayerFacingTransitionKind } from '../world/playerFacingTransition';
import type { PlayerGroundedTransitionKind } from '../world/playerGroundedTransition';
import type { PlayerRespawnEventKind } from '../world/playerRespawnEvent';
import type { PlayerSpawnLiquidSafetyStatus } from '../world/playerSpawn';
import type { PlayerWallContactTransitionKind } from '../world/playerWallContactTransition';
import type { TileLiquidKind } from '../world/tileMetadata';
import type { LiquidStepPhaseSummary } from '../world/world';

export interface DebugOverlayStats {
  atlasSourceKind: 'pending' | 'authored' | 'placeholder';
  atlasWidth: number | null;
  atlasHeight: number | null;
  atlasValidationWarningCount: number | null;
  atlasValidationFirstWarning: string | null;
  residentAnimatedChunkMeshes: number;
  residentAnimatedChunkQuadCount: number;
  residentAnimatedLiquidChunkQuadCount: number;
  animatedChunkUvUploadCount: number;
  animatedChunkUvUploadQuadCount: number;
  animatedChunkUvUploadLiquidQuadCount: number;
  animatedChunkUvUploadBytes: number;
  renderedChunks: number;
  drawCalls: number;
  drawCallBudget: number;
  meshBuilds: number;
  meshBuildBudget: number;
  meshBuildTimeMs: number;
  meshBuildQueueLength: number;
  residentWorldChunks: number;
  cachedChunkMeshes: number;
  residentDirtyLightChunks: number;
  residentActiveLiquidChunks: number;
  residentSleepingLiquidChunks: number;
  residentActiveLiquidMinChunkX: number | null;
  residentActiveLiquidMinChunkY: number | null;
  residentActiveLiquidMaxChunkX: number | null;
  residentActiveLiquidMaxChunkY: number | null;
  residentSleepingLiquidMinChunkX: number | null;
  residentSleepingLiquidMinChunkY: number | null;
  residentSleepingLiquidMaxChunkX: number | null;
  residentSleepingLiquidMaxChunkY: number | null;
  liquidStepSidewaysCandidateMinChunkX: number | null;
  liquidStepSidewaysCandidateMinChunkY: number | null;
  liquidStepSidewaysCandidateMaxChunkX: number | null;
  liquidStepSidewaysCandidateMaxChunkY: number | null;
  liquidStepDownwardActiveChunksScanned: number;
  liquidStepSidewaysCandidateChunksScanned: number;
  liquidStepSidewaysPairsTested: number;
  liquidStepDownwardTransfersApplied: number;
  liquidStepSidewaysTransfersApplied: number;
  liquidStepPhaseSummary: LiquidStepPhaseSummary;
  evictedWorldChunks: number;
  evictedMeshEntries: number;
}

export interface DebugOverlayPointerInspect {
  tile: { x: number; y: number };
  tileId?: number;
  tileLabel?: string;
  solid?: boolean;
  blocksLight?: boolean;
  liquidKind?: TileLiquidKind | null;
  liquidLevel?: number | null;
  liquidSurfaceNorthLevel?: number | null;
  liquidSurfaceWestLevel?: number | null;
  liquidSurfaceCenterLevel?: number | null;
  liquidSurfaceEastLevel?: number | null;
  liquidSurfaceBranch?: LiquidSurfaceBranchKind | null;
  liquidSurfaceTopLeft?: number | null;
  liquidSurfaceTopRight?: number | null;
  liquidFrameTopV?: number | null;
  liquidFrameTopPixelY?: number | null;
  liquidFrameBottomV?: number | null;
  liquidFrameBottomPixelY?: number | null;
  liquidFrameHeightV?: number | null;
  liquidFramePixelHeight?: number | null;
  liquidBottomLeftV?: number | null;
  liquidBottomRightV?: number | null;
  liquidBottomLeftPixelY?: number | null;
  liquidBottomRightPixelY?: number | null;
  liquidVisibleLeftV?: number | null;
  liquidVisibleRightV?: number | null;
  liquidVisibleLeftPercentage?: number | null;
  liquidVisibleRightPercentage?: number | null;
  liquidVisibleLeftPixelHeight?: number | null;
  liquidVisibleRightPixelHeight?: number | null;
  liquidRemainderLeftV?: number | null;
  liquidRemainderRightV?: number | null;
  liquidRemainderLeftPercentage?: number | null;
  liquidRemainderRightPercentage?: number | null;
  liquidRemainderLeftPixelHeight?: number | null;
  liquidRemainderRightPixelHeight?: number | null;
  liquidCoverageLeftTotalPercentage?: number | null;
  liquidCoverageRightTotalPercentage?: number | null;
  liquidCoverageLeftTotalPixelHeight?: number | null;
  liquidCoverageRightTotalPixelHeight?: number | null;
  liquidConnectivityGroupLabel?: string | null;
  liquidCardinalMask?: number | null;
  liquidAnimationFrameIndex?: number | null;
  liquidAnimationFrameCount?: number | null;
  liquidAnimationFrameDurationMs?: number | null;
  liquidAnimationFrameElapsedMs?: number | null;
  liquidAnimationFrameProgressNormalized?: number | null;
  liquidAnimationFrameRemainingMs?: number | null;
  liquidAnimationLoopDurationMs?: number | null;
  liquidAnimationLoopElapsedMs?: number | null;
  liquidAnimationLoopProgressNormalized?: number | null;
  liquidAnimationLoopRemainingMs?: number | null;
  liquidVariantSource?: string | null;
  liquidVariantUvRect?: string | null;
  liquidVariantPixelBounds?: string | null;
  client: { x: number; y: number };
  canvas: { x: number; y: number };
  world: { x: number; y: number };
  pointerType: string;
}

export interface DebugOverlayTileInspect {
  tile: { x: number; y: number };
  tileId?: number;
  tileLabel?: string;
  solid?: boolean;
  blocksLight?: boolean;
  liquidKind?: TileLiquidKind | null;
  liquidLevel?: number | null;
  liquidSurfaceNorthLevel?: number | null;
  liquidSurfaceWestLevel?: number | null;
  liquidSurfaceCenterLevel?: number | null;
  liquidSurfaceEastLevel?: number | null;
  liquidSurfaceBranch?: LiquidSurfaceBranchKind | null;
  liquidSurfaceTopLeft?: number | null;
  liquidSurfaceTopRight?: number | null;
  liquidFrameTopV?: number | null;
  liquidFrameTopPixelY?: number | null;
  liquidFrameBottomV?: number | null;
  liquidFrameBottomPixelY?: number | null;
  liquidFrameHeightV?: number | null;
  liquidFramePixelHeight?: number | null;
  liquidBottomLeftV?: number | null;
  liquidBottomRightV?: number | null;
  liquidBottomLeftPixelY?: number | null;
  liquidBottomRightPixelY?: number | null;
  liquidVisibleLeftV?: number | null;
  liquidVisibleRightV?: number | null;
  liquidVisibleLeftPercentage?: number | null;
  liquidVisibleRightPercentage?: number | null;
  liquidVisibleLeftPixelHeight?: number | null;
  liquidVisibleRightPixelHeight?: number | null;
  liquidRemainderLeftV?: number | null;
  liquidRemainderRightV?: number | null;
  liquidRemainderLeftPercentage?: number | null;
  liquidRemainderRightPercentage?: number | null;
  liquidRemainderLeftPixelHeight?: number | null;
  liquidRemainderRightPixelHeight?: number | null;
  liquidCoverageLeftTotalPercentage?: number | null;
  liquidCoverageRightTotalPercentage?: number | null;
  liquidCoverageLeftTotalPixelHeight?: number | null;
  liquidCoverageRightTotalPixelHeight?: number | null;
  liquidConnectivityGroupLabel?: string | null;
  liquidCardinalMask?: number | null;
  liquidAnimationFrameIndex?: number | null;
  liquidAnimationFrameCount?: number | null;
  liquidAnimationFrameDurationMs?: number | null;
  liquidAnimationFrameElapsedMs?: number | null;
  liquidAnimationFrameProgressNormalized?: number | null;
  liquidAnimationFrameRemainingMs?: number | null;
  liquidAnimationLoopDurationMs?: number | null;
  liquidAnimationLoopElapsedMs?: number | null;
  liquidAnimationLoopProgressNormalized?: number | null;
  liquidAnimationLoopRemainingMs?: number | null;
  liquidVariantSource?: string | null;
  liquidVariantUvRect?: string | null;
  liquidVariantPixelBounds?: string | null;
}

export interface DebugOverlayPlayerSpawn {
  tile: { x: number; y: number };
  world: { x: number; y: number };
  supportTile?: {
    x: number;
    y: number;
    id: number;
    chunk: { x: number; y: number };
    local: { x: number; y: number };
  } | null;
  liquidSafetyStatus: PlayerSpawnLiquidSafetyStatus;
}

interface DebugOverlayTileContact {
  tileX: number;
  tileY: number;
  tileId: number;
}

interface DebugOverlayWallContact extends DebugOverlayTileContact {
  side: 'left' | 'right';
}

export interface DebugOverlayPlayerTelemetry {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  health?: number | null;
  hostileContactInvulnerabilitySecondsRemaining?: number | null;
  aabb: {
    min: { x: number; y: number };
    max: { x: number; y: number };
    size: { x: number; y: number };
  };
  grounded: boolean;
  facing: 'left' | 'right';
  contacts: {
    support: DebugOverlayTileContact | null;
    wall: DebugOverlayWallContact | null;
    ceiling: DebugOverlayTileContact | null;
  };
}

export interface DebugOverlayHostileSlimeTelemetry {
  grounded: boolean;
  facing: 'left' | 'right';
  hopCooldownTicksRemaining: number;
}

export interface DebugOverlayPlayerIntentTelemetry {
  moveX: number;
  jumpHeld: boolean;
  jumpPressed: boolean;
}

export interface DebugOverlayPlayerCameraFollowTelemetry {
  cameraPosition: { x: number; y: number };
  cameraTile: { x: number; y: number };
  cameraLocal: { x: number; y: number };
  cameraZoom: number;
  focus: { x: number; y: number };
  focusTile: { x: number; y: number };
  focusChunk: { x: number; y: number };
  focusLocal: { x: number; y: number };
  offset: { x: number; y: number };
}

export interface DebugOverlayPlayerGroundedTransitionTelemetry {
  kind: PlayerGroundedTransitionKind;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayPlayerFacingTransitionTelemetry {
  kind: PlayerFacingTransitionKind;
  previousFacing: 'left' | 'right';
  nextFacing: 'left' | 'right';
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayPlayerRespawnTelemetry {
  kind: PlayerRespawnEventKind;
  spawnTile: { x: number; y: number };
  supportChunk: { x: number; y: number };
  supportLocal: { x: number; y: number };
  supportTileId: number;
  liquidSafetyStatus: PlayerSpawnLiquidSafetyStatus;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayPlayerWallContactTransitionTelemetry {
  kind: PlayerWallContactTransitionKind;
  tile: { x: number; y: number; id: number; side: 'left' | 'right' };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayPlayerCeilingContactTransitionTelemetry {
  kind: PlayerCeilingContactTransitionKind;
  tile: { x: number; y: number; id: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayInspectState {
  pointer: DebugOverlayPointerInspect | null;
  pinned: DebugOverlayTileInspect | null;
  spawn: DebugOverlayPlayerSpawn | null;
  player: DebugOverlayPlayerTelemetry | null;
  hostileSlime?: DebugOverlayHostileSlimeTelemetry | null;
  playerPlaceholderPoseLabel: string | null;
  playerCeilingBonkHoldActive: boolean | null;
  playerNearbyLightLevel?: number | null;
  playerNearbyLightFactor?: number | null;
  playerNearbyLightSourceTile?: { x: number; y: number } | null;
  playerNearbyLightSourceChunk?: { x: number; y: number } | null;
  playerNearbyLightSourceLocalTile?: { x: number; y: number } | null;
  playerIntent: DebugOverlayPlayerIntentTelemetry | null;
  playerCameraFollow: DebugOverlayPlayerCameraFollowTelemetry | null;
  playerGroundedTransition: DebugOverlayPlayerGroundedTransitionTelemetry | null;
  playerFacingTransition: DebugOverlayPlayerFacingTransitionTelemetry | null;
  playerRespawn: DebugOverlayPlayerRespawnTelemetry | null;
  playerWallContactTransition: DebugOverlayPlayerWallContactTransitionTelemetry | null;
  playerCeilingContactTransition: DebugOverlayPlayerCeilingContactTransitionTelemetry | null;
}

const formatFloat = (value: number, digits: number): string => value.toFixed(digits);
const formatInt = (value: number): string => Math.round(value).toString();
const formatGameplayFlag = (value: boolean): string => (value ? 'on' : 'off');
const worldToTileCoordinate = (world: number): number => Math.floor(world / TILE_SIZE);
const formatLiquidAnimationFrame = (
  frameIndex: number | null | undefined,
  frameCount: number | null | undefined
): string | null => {
  if (typeof frameIndex !== 'number') {
    return null;
  }
  if (typeof frameCount === 'number' && frameCount > 0) {
    return `${frameIndex}/${frameCount}`;
  }
  return `${frameIndex}`;
};
const formatDurationMs = (durationMs: number | null | undefined): string | null => {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs <= 0) {
    return null;
  }
  return `${Math.round(durationMs)}ms`;
};
const formatLiquidLevel = (liquidLevel: number | null | undefined): string | null => {
  if (typeof liquidLevel !== 'number' || !Number.isFinite(liquidLevel)) {
    return null;
  }

  const clampedLevel = Math.min(Math.max(Math.round(liquidLevel), 0), MAX_LIQUID_LEVEL);
  return `${clampedLevel}/${MAX_LIQUID_LEVEL}`;
};
const formatLiquidSurfaceHeight = (value: number | null | undefined): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const clampedValue = Math.min(Math.max(value, 0), 1);
  const roundedValue = Math.round(clampedValue * 1000) / 1000;
  return roundedValue.toString();
};
const formatAtlasPixelCoordinate = (value: number | null | undefined): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const roundedValue = Math.round(value * 1000) / 1000;
  return roundedValue.toString();
};
const formatLiquidSurfaceInputs = (
  north: number | null | undefined,
  west: number | null | undefined,
  center: number | null | undefined,
  east: number | null | undefined
): string | null => {
  const formattedNorth = formatLiquidLevel(north);
  const formattedWest = formatLiquidLevel(west);
  const formattedCenter = formatLiquidLevel(center);
  const formattedEast = formatLiquidLevel(east);
  if (!formattedNorth && !formattedWest && !formattedCenter && !formattedEast) {
    return null;
  }

  return (
    `north=${formattedNorth ?? 'n/a'}` +
    ` west=${formattedWest ?? 'n/a'}` +
    ` center=${formattedCenter ?? 'n/a'}` +
    ` east=${formattedEast ?? 'n/a'}`
  );
};
const formatLiquidSurfaceBranch = (
  value: LiquidSurfaceBranchKind | null | undefined
): LiquidSurfaceBranchKind | null =>
  value === 'empty' || value === 'north-covered' || value === 'exposed' ? value : null;
const formatProgressPercentage = (value: number | null | undefined): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const clampedPercent = Math.min(Math.max(value, 0), 1) * 100;
  const roundedPercent = Math.round(clampedPercent * 10) / 10;
  return Number.isInteger(roundedPercent) ? `${roundedPercent.toFixed(0)}%` : `${roundedPercent.toFixed(1)}%`;
};
const formatPercentageValue = (value: number | null | undefined): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const clampedPercent = Math.min(Math.max(value, 0), 100);
  const roundedPercent = Math.round(clampedPercent * 10) / 10;
  return Number.isInteger(roundedPercent) ? `${roundedPercent.toFixed(0)}%` : `${roundedPercent.toFixed(1)}%`;
};
const formatPairedPercentageAccounting = (
  visible: number | null | undefined,
  cropped: number | null | undefined,
  total: number | null | undefined
): string | null => {
  const formattedVisible = formatPercentageValue(visible);
  const formattedCropped = formatPercentageValue(cropped);
  const formattedTotal = formatPercentageValue(total);
  if (formattedVisible === null || formattedCropped === null || formattedTotal === null) {
    return null;
  }

  return `${formattedVisible}+${formattedCropped}=${formattedTotal}`;
};
const formatPairedAtlasPixelAccounting = (
  visible: number | null | undefined,
  cropped: number | null | undefined,
  total: number | null | undefined
): string | null => {
  const formattedVisible = formatAtlasPixelCoordinate(visible);
  const formattedCropped = formatAtlasPixelCoordinate(cropped);
  const formattedTotal = formatAtlasPixelCoordinate(total);
  if (formattedVisible === null || formattedCropped === null || formattedTotal === null) {
    return null;
  }

  return `${formattedVisible}+${formattedCropped}=${formattedTotal}`;
};
const formatLiquidCardinalMask = (value: number): string => {
  const mask = value & 0xf;
  return (
    `${(mask & (1 << 0)) !== 0 ? 'N' : '-'}${(mask & (1 << 1)) !== 0 ? 'E' : '-'}` +
    `${(mask & (1 << 2)) !== 0 ? 'S' : '-'}${(mask & (1 << 3)) !== 0 ? 'W' : '-'}` +
    ` (${mask})`
  );
};
const formatAtlasLine = (stats: DebugOverlayStats): string => {
  if (stats.atlasWidth === null || stats.atlasHeight === null) {
    return `Atlas: ${stats.atlasSourceKind}`;
  }

  return `Atlas: ${stats.atlasSourceKind} | ${stats.atlasWidth}x${stats.atlasHeight}`;
};

const formatAtlasValidationLine = (stats: DebugOverlayStats): string => {
  if (stats.atlasValidationWarningCount === null) {
    return 'AtlasWarn: pending';
  }
  if (stats.atlasValidationWarningCount === 0) {
    return 'AtlasWarn: none';
  }

  const firstWarning = stats.atlasValidationFirstWarning
    ? ` | ${stats.atlasValidationFirstWarning}`
    : '';
  return `AtlasWarn: ${stats.atlasValidationWarningCount}${firstWarning}`;
};

const formatTileIdentity = (tileInspect: DebugOverlayTileInspect): string | null => {
  if (tileInspect.tileLabel && typeof tileInspect.tileId === 'number') {
    return `Tile:${tileInspect.tileLabel} (#${tileInspect.tileId})`;
  }
  if (tileInspect.tileLabel) {
    return `Tile:${tileInspect.tileLabel}`;
  }
  if (typeof tileInspect.tileId === 'number') {
    return `Tile:#${tileInspect.tileId}`;
  }
  return null;
};

const formatTileGameplay = (tileInspect: DebugOverlayTileInspect): string => {
  if (typeof tileInspect.solid !== 'boolean' || typeof tileInspect.blocksLight !== 'boolean') {
    return '';
  }

  const liquidLevel = formatLiquidLevel(tileInspect.liquidLevel);
  const liquidSurfaceInputs = formatLiquidSurfaceInputs(
    tileInspect.liquidSurfaceNorthLevel,
    tileInspect.liquidSurfaceWestLevel,
    tileInspect.liquidSurfaceCenterLevel,
    tileInspect.liquidSurfaceEastLevel
  );
  const liquidSurfaceBranch = formatLiquidSurfaceBranch(tileInspect.liquidSurfaceBranch);
  const liquidSurfaceTopLeft = formatLiquidSurfaceHeight(tileInspect.liquidSurfaceTopLeft);
  const liquidSurfaceTopRight = formatLiquidSurfaceHeight(tileInspect.liquidSurfaceTopRight);
  const liquidFrameTopV = formatLiquidSurfaceHeight(tileInspect.liquidFrameTopV);
  const liquidFrameTopPixelY = formatAtlasPixelCoordinate(tileInspect.liquidFrameTopPixelY);
  const liquidFrameBottomV = formatLiquidSurfaceHeight(tileInspect.liquidFrameBottomV);
  const liquidFrameBottomPixelY = formatAtlasPixelCoordinate(tileInspect.liquidFrameBottomPixelY);
  const liquidFrameHeightV = formatLiquidSurfaceHeight(tileInspect.liquidFrameHeightV);
  const liquidFramePixelHeight = formatAtlasPixelCoordinate(tileInspect.liquidFramePixelHeight);
  const liquidBottomLeftV = formatLiquidSurfaceHeight(tileInspect.liquidBottomLeftV);
  const liquidBottomRightV = formatLiquidSurfaceHeight(tileInspect.liquidBottomRightV);
  const liquidBottomLeftPixelY = formatAtlasPixelCoordinate(tileInspect.liquidBottomLeftPixelY);
  const liquidBottomRightPixelY = formatAtlasPixelCoordinate(tileInspect.liquidBottomRightPixelY);
  const liquidVisibleLeftV = formatLiquidSurfaceHeight(tileInspect.liquidVisibleLeftV);
  const liquidVisibleRightV = formatLiquidSurfaceHeight(tileInspect.liquidVisibleRightV);
  const liquidVisibleLeftPercentage = formatPercentageValue(tileInspect.liquidVisibleLeftPercentage);
  const liquidVisibleRightPercentage = formatPercentageValue(
    tileInspect.liquidVisibleRightPercentage
  );
  const liquidVisibleLeftPixelHeight = formatAtlasPixelCoordinate(
    tileInspect.liquidVisibleLeftPixelHeight
  );
  const liquidVisibleRightPixelHeight = formatAtlasPixelCoordinate(
    tileInspect.liquidVisibleRightPixelHeight
  );
  const liquidRemainderLeftV = formatLiquidSurfaceHeight(tileInspect.liquidRemainderLeftV);
  const liquidRemainderRightV = formatLiquidSurfaceHeight(tileInspect.liquidRemainderRightV);
  const liquidRemainderLeftPercentage = formatPercentageValue(
    tileInspect.liquidRemainderLeftPercentage
  );
  const liquidRemainderRightPercentage = formatPercentageValue(
    tileInspect.liquidRemainderRightPercentage
  );
  const liquidRemainderLeftPixelHeight = formatAtlasPixelCoordinate(
    tileInspect.liquidRemainderLeftPixelHeight
  );
  const liquidRemainderRightPixelHeight = formatAtlasPixelCoordinate(
    tileInspect.liquidRemainderRightPixelHeight
  );
  const liquidCoverageLeftPercentage = formatPairedPercentageAccounting(
    tileInspect.liquidVisibleLeftPercentage,
    tileInspect.liquidRemainderLeftPercentage,
    tileInspect.liquidCoverageLeftTotalPercentage
  );
  const liquidCoverageRightPercentage = formatPairedPercentageAccounting(
    tileInspect.liquidVisibleRightPercentage,
    tileInspect.liquidRemainderRightPercentage,
    tileInspect.liquidCoverageRightTotalPercentage
  );
  const liquidCoverageLeftPixelHeight = formatPairedAtlasPixelAccounting(
    tileInspect.liquidVisibleLeftPixelHeight,
    tileInspect.liquidRemainderLeftPixelHeight,
    tileInspect.liquidCoverageLeftTotalPixelHeight
  );
  const liquidCoverageRightPixelHeight = formatPairedAtlasPixelAccounting(
    tileInspect.liquidVisibleRightPixelHeight,
    tileInspect.liquidRemainderRightPixelHeight,
    tileInspect.liquidCoverageRightTotalPixelHeight
  );
  const liquidAnimationFrame = formatLiquidAnimationFrame(
    tileInspect.liquidAnimationFrameIndex,
    tileInspect.liquidAnimationFrameCount
  );
  const liquidAnimationFrameDuration = formatDurationMs(tileInspect.liquidAnimationFrameDurationMs);
  const liquidAnimationFrameElapsed = formatDurationMs(tileInspect.liquidAnimationFrameElapsedMs);
  const liquidAnimationFrameProgress = formatProgressPercentage(
    tileInspect.liquidAnimationFrameProgressNormalized
  );
  const liquidAnimationFrameRemaining = formatDurationMs(tileInspect.liquidAnimationFrameRemainingMs);
  const liquidAnimationLoopDuration = formatDurationMs(tileInspect.liquidAnimationLoopDurationMs);
  const liquidAnimationLoopElapsed = formatDurationMs(tileInspect.liquidAnimationLoopElapsedMs);
  const liquidAnimationLoopProgress = formatProgressPercentage(
    tileInspect.liquidAnimationLoopProgressNormalized
  );
  const liquidAnimationLoopRemaining = formatDurationMs(tileInspect.liquidAnimationLoopRemainingMs);

  return (
    ` | solid:${formatGameplayFlag(tileInspect.solid)}` +
    ` | light:${formatGameplayFlag(tileInspect.blocksLight)}` +
    ` | liquid:${tileInspect.liquidKind ?? 'none'}` +
    (liquidLevel ? ` | liquidLevel:${liquidLevel}` : '') +
    (liquidSurfaceInputs ? ` | liquidSurfaceIn:${liquidSurfaceInputs}` : '') +
    (liquidSurfaceBranch ? ` | liquidSurfaceBranch:${liquidSurfaceBranch}` : '') +
    (liquidSurfaceTopLeft !== null ? ` | liquidTopLeft:${liquidSurfaceTopLeft}` : '') +
    (liquidSurfaceTopRight !== null ? ` | liquidTopRight:${liquidSurfaceTopRight}` : '') +
    (liquidFrameTopV !== null ? ` | liquidFrameTopV:${liquidFrameTopV}` : '') +
    (liquidFrameTopPixelY !== null ? ` | liquidFrameTopPxY:${liquidFrameTopPixelY}` : '') +
    (liquidFrameBottomV !== null ? ` | liquidFrameBottomV:${liquidFrameBottomV}` : '') +
    (liquidFrameBottomPixelY !== null ? ` | liquidFrameBottomPxY:${liquidFrameBottomPixelY}` : '') +
    (liquidFrameHeightV !== null ? ` | liquidFrameHeightV:${liquidFrameHeightV}` : '') +
    (liquidFramePixelHeight !== null ? ` | liquidFramePxH:${liquidFramePixelHeight}` : '') +
    (liquidBottomLeftV !== null ? ` | liquidBottomLeftV:${liquidBottomLeftV}` : '') +
    (liquidBottomRightV !== null ? ` | liquidBottomRightV:${liquidBottomRightV}` : '') +
    (liquidBottomLeftPixelY !== null ? ` | liquidBottomLeftPxY:${liquidBottomLeftPixelY}` : '') +
    (liquidBottomRightPixelY !== null ? ` | liquidBottomRightPxY:${liquidBottomRightPixelY}` : '') +
    (liquidVisibleLeftV !== null ? ` | liquidVisibleLeftV:${liquidVisibleLeftV}` : '') +
    (liquidVisibleRightV !== null ? ` | liquidVisibleRightV:${liquidVisibleRightV}` : '') +
    (liquidVisibleLeftPercentage !== null
      ? ` | liquidVisibleLeftPct:${liquidVisibleLeftPercentage}`
      : '') +
    (liquidVisibleRightPercentage !== null
      ? ` | liquidVisibleRightPct:${liquidVisibleRightPercentage}`
      : '') +
    (liquidVisibleLeftPixelHeight !== null
      ? ` | liquidVisibleLeftPxH:${liquidVisibleLeftPixelHeight}`
      : '') +
    (liquidVisibleRightPixelHeight !== null
      ? ` | liquidVisibleRightPxH:${liquidVisibleRightPixelHeight}`
      : '') +
    (liquidRemainderLeftV !== null ? ` | liquidRemainderLeftV:${liquidRemainderLeftV}` : '') +
    (liquidRemainderRightV !== null ? ` | liquidRemainderRightV:${liquidRemainderRightV}` : '') +
    (liquidRemainderLeftPercentage !== null
      ? ` | liquidRemainderLeftPct:${liquidRemainderLeftPercentage}`
      : '') +
    (liquidRemainderRightPercentage !== null
      ? ` | liquidRemainderRightPct:${liquidRemainderRightPercentage}`
      : '') +
    (liquidRemainderLeftPixelHeight !== null
      ? ` | liquidRemainderLeftPxH:${liquidRemainderLeftPixelHeight}`
      : '') +
    (liquidRemainderRightPixelHeight !== null
      ? ` | liquidRemainderRightPxH:${liquidRemainderRightPixelHeight}`
      : '') +
    (liquidCoverageLeftPercentage !== null
      ? ` | liquidCoverageLeftPct:${liquidCoverageLeftPercentage}`
      : '') +
    (liquidCoverageRightPercentage !== null
      ? ` | liquidCoverageRightPct:${liquidCoverageRightPercentage}`
      : '') +
    (liquidCoverageLeftPixelHeight !== null
      ? ` | liquidCoverageLeftPxH:${liquidCoverageLeftPixelHeight}`
      : '') +
    (liquidCoverageRightPixelHeight !== null
      ? ` | liquidCoverageRightPxH:${liquidCoverageRightPixelHeight}`
      : '') +
    (typeof tileInspect.liquidConnectivityGroupLabel === 'string' &&
    tileInspect.liquidConnectivityGroupLabel.length > 0
      ? ` | liquidGroup:${tileInspect.liquidConnectivityGroupLabel}`
      : '') +
    (typeof tileInspect.liquidCardinalMask === 'number'
      ? ` | liquidMask:${formatLiquidCardinalMask(tileInspect.liquidCardinalMask)}`
      : '') +
    (liquidAnimationFrame ? ` | liquidFrame:${liquidAnimationFrame}` : '') +
    (liquidAnimationFrameDuration ? ` | liquidFrameDur:${liquidAnimationFrameDuration}` : '') +
    (liquidAnimationFrameElapsed ? ` | liquidFrameElapsed:${liquidAnimationFrameElapsed}` : '') +
    (liquidAnimationFrameRemaining ? ` | liquidFrameRemain:${liquidAnimationFrameRemaining}` : '') +
    (liquidAnimationFrameProgress ? ` | liquidFramePct:${liquidAnimationFrameProgress}` : '') +
    (liquidAnimationLoopDuration ? ` | liquidLoopDur:${liquidAnimationLoopDuration}` : '') +
    (liquidAnimationLoopElapsed ? ` | liquidLoopElapsed:${liquidAnimationLoopElapsed}` : '') +
    (liquidAnimationLoopProgress ? ` | liquidLoopPct:${liquidAnimationLoopProgress}` : '') +
    (liquidAnimationLoopRemaining ? ` | liquidLoopRemain:${liquidAnimationLoopRemaining}` : '') +
    (typeof tileInspect.liquidVariantSource === 'string' && tileInspect.liquidVariantSource.length > 0
      ? ` | liquidSrc:${tileInspect.liquidVariantSource}`
      : '') +
    (typeof tileInspect.liquidVariantUvRect === 'string' && tileInspect.liquidVariantUvRect.length > 0
      ? ` | liquidUv:${tileInspect.liquidVariantUvRect}`
      : '') +
    (typeof tileInspect.liquidVariantPixelBounds === 'string' &&
    tileInspect.liquidVariantPixelBounds.length > 0
      ? ` | liquidPx:${tileInspect.liquidVariantPixelBounds}`
      : '')
  );
};

const formatTileLocation = (tileInspect: DebugOverlayTileInspect): string => {
  const { chunkX, chunkY } = worldToChunkCoord(tileInspect.tile.x, tileInspect.tile.y);
  const { localX, localY } = worldToLocalTile(tileInspect.tile.x, tileInspect.tile.y);
  const tileIdentity = formatTileIdentity(tileInspect);

  return (
    (tileIdentity ? `${tileIdentity} | ` : '') +
    `T:${tileInspect.tile.x},${tileInspect.tile.y} | ` +
    `Ch:${chunkX},${chunkY} | ` +
    `L:${localX},${localY}` +
    formatTileGameplay(tileInspect)
  );
};

const formatSpawnLine = (spawn: DebugOverlayPlayerSpawn | null): string => {
  if (!spawn) {
    return 'Spawn: unresolved';
  }

  return (
    `Spawn: T:${spawn.tile.x},${spawn.tile.y} | ` +
    `W:${formatFloat(spawn.world.x, 2)},${formatFloat(spawn.world.y, 2)}`
  );
};

const formatSpawnSupportLine = (spawn: DebugOverlayPlayerSpawn | null): string => {
  if (!spawn?.supportTile) {
    return 'SpawnSupport: unresolved';
  }

  return (
    `SpawnSupport: T:${spawn.supportTile.x},${spawn.supportTile.y} (#${spawn.supportTile.id}) | ` +
    `Ch:${spawn.supportTile.chunk.x},${spawn.supportTile.chunk.y} | ` +
    `L:${spawn.supportTile.local.x},${spawn.supportTile.local.y}`
  );
};

const formatSpawnLiquidSafetyStatus = (
  status: PlayerSpawnLiquidSafetyStatus | 'unresolved'
): string => (status === 'overlap' ? 'overlap' : status);

const formatSpawnLiquidSafetyLine = (spawn: DebugOverlayPlayerSpawn | null): string =>
  `SpawnLiquid: ${formatSpawnLiquidSafetyStatus(spawn?.liquidSafetyStatus ?? 'unresolved')}`;

const formatPlayerLine = (player: DebugOverlayPlayerTelemetry | null): string => {
  if (!player) {
    return 'Player: n/a';
  }

  const playerTileX = worldToTileCoordinate(player.position.x);
  const playerTileY = worldToTileCoordinate(player.position.y);
  const { chunkX, chunkY } = worldToChunkCoord(playerTileX, playerTileY);
  const { localX, localY } = worldToLocalTile(playerTileX, playerTileY);
  return (
    `Player: Pos:${formatFloat(player.position.x, 2)},${formatFloat(player.position.y, 2)} | ` +
    `Tile:${formatInt(playerTileX)},${formatInt(playerTileY)} | ` +
    `Chunk:${formatInt(chunkX)},${formatInt(chunkY)} | ` +
    `Local:${formatInt(localX)},${formatInt(localY)} | ` +
    `Vel:${formatFloat(player.velocity.x, 2)},${formatFloat(player.velocity.y, 2)} | ` +
    `grounded:${formatGameplayFlag(player.grounded)} | ` +
    `facing:${player.facing}`
  );
};

const formatPlayerCombatLine = (player: DebugOverlayPlayerTelemetry | null): string => {
  if (!player) {
    return 'Combat: n/a';
  }

  const healthText =
    typeof player.health === 'number' && Number.isFinite(player.health)
      ? `${Math.round(player.health)}`
      : 'n/a';
  const hostileContactInvulnerabilityText =
    typeof player.hostileContactInvulnerabilitySecondsRemaining === 'number' &&
    Number.isFinite(player.hostileContactInvulnerabilitySecondsRemaining)
      ? `${player.hostileContactInvulnerabilitySecondsRemaining.toFixed(2)}s`
      : 'n/a';
  if (healthText === 'n/a' && hostileContactInvulnerabilityText === 'n/a') {
    return 'Combat: n/a';
  }
  return `Combat: health:${healthText} | contactInvuln:${hostileContactInvulnerabilityText}`;
};

const formatHostileSlimeLine = (
  hostileSlime: DebugOverlayHostileSlimeTelemetry | null
): string | null => {
  if (!hostileSlime) {
    return null;
  }

  return (
    `Slime: grounded:${formatGameplayFlag(hostileSlime.grounded)} | ` +
    `facing:${hostileSlime.facing} | ` +
    `hopCooldown:${formatInt(hostileSlime.hopCooldownTicksRemaining)}t`
  );
};

const formatPlayerPlaceholderPoseLine = (playerPlaceholderPoseLabel: string | null): string =>
  playerPlaceholderPoseLabel ? `Pose: ${playerPlaceholderPoseLabel}` : 'Pose: n/a';

const formatPlayerCeilingBonkHoldLine = (playerCeilingBonkHoldActive: boolean | null): string => {
  if (playerCeilingBonkHoldActive === null) {
    return 'BonkHold: n/a';
  }

  return `BonkHold: ${formatGameplayFlag(playerCeilingBonkHoldActive)}`;
};

const formatPlayerNearbyLightLine = (
  playerNearbyLightLevel: number | null,
  playerNearbyLightFactor: number | null,
  playerNearbyLightSourceTile: { x: number; y: number } | null,
  playerNearbyLightSourceChunk: { x: number; y: number } | null,
  playerNearbyLightSourceLocalTile: { x: number; y: number } | null
): string => {
  if (playerNearbyLightLevel === null && playerNearbyLightFactor === null) {
    return 'LightSample: n/a';
  }

  const lightLevel =
    playerNearbyLightLevel === null
      ? 'n/a'
      : `${formatInt(playerNearbyLightLevel)}/${MAX_LIGHT_LEVEL}`;
  const lightFactor = playerNearbyLightFactor === null ? 'n/a' : formatFloat(playerNearbyLightFactor, 2);
  const lightSourceTile =
    playerNearbyLightSourceTile === null
      ? 'n/a'
      : `${formatInt(playerNearbyLightSourceTile.x)},${formatInt(playerNearbyLightSourceTile.y)}`;
  const lightSourceChunk =
    playerNearbyLightSourceChunk === null
      ? 'n/a'
      : `${formatInt(playerNearbyLightSourceChunk.x)},${formatInt(playerNearbyLightSourceChunk.y)}`;
  const lightSourceLocal =
    playerNearbyLightSourceLocalTile === null
      ? 'n/a'
      : `${formatInt(playerNearbyLightSourceLocalTile.x)},${formatInt(
          playerNearbyLightSourceLocalTile.y
        )}`;
  return (
    `LightSample: ${lightLevel} | factor:${lightFactor} | source:${lightSourceTile} | ` +
    `sourceChunk:${lightSourceChunk} | sourceLocal:${lightSourceLocal}`
  );
};

const formatPlayerAabbLine = (player: DebugOverlayPlayerTelemetry | null): string => {
  if (!player) {
    return 'AABB: n/a';
  }

  return (
    `AABB: min:${formatFloat(player.aabb.min.x, 2)},${formatFloat(player.aabb.min.y, 2)} | ` +
    `max:${formatFloat(player.aabb.max.x, 2)},${formatFloat(player.aabb.max.y, 2)} | ` +
    `size:${formatFloat(player.aabb.size.x, 2)},${formatFloat(player.aabb.size.y, 2)}`
  );
};

const formatPlayerCameraFollowLine = (
  playerCameraFollow: DebugOverlayPlayerCameraFollowTelemetry | null
): string => {
  if (!playerCameraFollow) {
    return 'Follow: n/a';
  }

  const { chunkX, chunkY } = worldToChunkCoord(playerCameraFollow.cameraTile.x, playerCameraFollow.cameraTile.y);

  return (
    `Follow: cam:${formatFloat(playerCameraFollow.cameraPosition.x, 2)},` +
    `${formatFloat(playerCameraFollow.cameraPosition.y, 2)} | ` +
    `camTile:${formatInt(playerCameraFollow.cameraTile.x)},` +
    `${formatInt(playerCameraFollow.cameraTile.y)} | ` +
    `camChunk:${formatInt(chunkX)},${formatInt(chunkY)} | ` +
    `camLocal:${formatInt(playerCameraFollow.cameraLocal.x)},${formatInt(playerCameraFollow.cameraLocal.y)} | ` +
    `zoom:${formatFloat(playerCameraFollow.cameraZoom, 2)} | ` +
    `focus:${formatFloat(playerCameraFollow.focus.x, 2)},` +
    `${formatFloat(playerCameraFollow.focus.y, 2)} | ` +
    `focusTile:${formatInt(playerCameraFollow.focusTile.x)},${formatInt(playerCameraFollow.focusTile.y)} | ` +
    `focusChunk:${formatInt(playerCameraFollow.focusChunk.x)},${formatInt(playerCameraFollow.focusChunk.y)} | ` +
    `focusLocal:${formatInt(playerCameraFollow.focusLocal.x)},${formatInt(playerCameraFollow.focusLocal.y)} | ` +
    `offset:${formatFloat(playerCameraFollow.offset.x, 2)},` +
    `${formatFloat(playerCameraFollow.offset.y, 2)}`
  );
};

const formatPlayerContact = (contact: DebugOverlayTileContact | null): string => {
  if (!contact) {
    return 'none';
  }

  return `${contact.tileX},${contact.tileY} (#${contact.tileId})`;
};

const formatPlayerWallContact = (contact: DebugOverlayWallContact | null): string => {
  if (!contact) {
    return 'none';
  }

  return `${contact.tileX},${contact.tileY} (#${contact.tileId}, ${contact.side})`;
};

const formatPlayerContactsLine = (player: DebugOverlayPlayerTelemetry | null): string => {
  if (!player) {
    return 'Contact: n/a';
  }

  return (
    `Contact: support:${formatPlayerContact(player.contacts.support)} | ` +
    `wall:${formatPlayerWallContact(player.contacts.wall)} | ` +
    `ceiling:${formatPlayerContact(player.contacts.ceiling)}`
  );
};

const formatPlayerIntentLine = (playerIntent: DebugOverlayPlayerIntentTelemetry | null): string => {
  if (!playerIntent) {
    return 'Intent: n/a';
  }

  return (
    `Intent: move:${playerIntent.moveX} | ` +
    `jumpHeld:${formatGameplayFlag(playerIntent.jumpHeld)} | ` +
    `jumpPressed:${formatGameplayFlag(playerIntent.jumpPressed)}`
  );
};

const formatPlayerGroundedTransitionLine = (
  playerGroundedTransition: DebugOverlayPlayerGroundedTransitionTelemetry | null
): string => {
  if (!playerGroundedTransition) {
    return 'GroundEvt: none';
  }

  return (
    `GroundEvt: ${playerGroundedTransition.kind} | ` +
    `Pos:${formatFloat(playerGroundedTransition.position.x, 2)},` +
    `${formatFloat(playerGroundedTransition.position.y, 2)} | ` +
    `Vel:${formatFloat(playerGroundedTransition.velocity.x, 2)},` +
    `${formatFloat(playerGroundedTransition.velocity.y, 2)}`
  );
};

const formatPlayerFacingTransitionLine = (
  playerFacingTransition: DebugOverlayPlayerFacingTransitionTelemetry | null
): string => {
  if (!playerFacingTransition) {
    return 'FaceEvt: none';
  }

  return (
    `FaceEvt: ${playerFacingTransition.previousFacing}->${playerFacingTransition.nextFacing} | ` +
    `Pos:${formatFloat(playerFacingTransition.position.x, 2)},` +
    `${formatFloat(playerFacingTransition.position.y, 2)} | ` +
    `Vel:${formatFloat(playerFacingTransition.velocity.x, 2)},` +
    `${formatFloat(playerFacingTransition.velocity.y, 2)}`
  );
};

const formatPlayerRespawnLine = (
  playerRespawn: DebugOverlayPlayerRespawnTelemetry | null
): string => {
  if (!playerRespawn) {
    return 'RespawnEvt: none';
  }

  return (
    `RespawnEvt: ${playerRespawn.kind} | ` +
    `SpawnT:${playerRespawn.spawnTile.x},${playerRespawn.spawnTile.y} | ` +
    `SupportCh:${playerRespawn.supportChunk.x},${playerRespawn.supportChunk.y} | ` +
    `SupportL:${playerRespawn.supportLocal.x},${playerRespawn.supportLocal.y} | ` +
    `SupportId:#${playerRespawn.supportTileId} | ` +
    `SpawnLiquid:${formatSpawnLiquidSafetyStatus(playerRespawn.liquidSafetyStatus)} | ` +
    `Pos:${formatFloat(playerRespawn.position.x, 2)},` +
    `${formatFloat(playerRespawn.position.y, 2)} | ` +
    `Vel:${formatFloat(playerRespawn.velocity.x, 2)},` +
    `${formatFloat(playerRespawn.velocity.y, 2)}`
  );
};

const formatPlayerWallContactTransitionLine = (
  playerWallContactTransition: DebugOverlayPlayerWallContactTransitionTelemetry | null
): string => {
  if (!playerWallContactTransition) {
    return 'WallEvt: none';
  }

  return (
    `WallEvt: ${playerWallContactTransition.kind} | ` +
    `Tile:${playerWallContactTransition.tile.x},${playerWallContactTransition.tile.y} ` +
    `(#${playerWallContactTransition.tile.id}, ${playerWallContactTransition.tile.side}) | ` +
    `Pos:${formatFloat(playerWallContactTransition.position.x, 2)},` +
    `${formatFloat(playerWallContactTransition.position.y, 2)} | ` +
    `Vel:${formatFloat(playerWallContactTransition.velocity.x, 2)},` +
    `${formatFloat(playerWallContactTransition.velocity.y, 2)}`
  );
};

const formatPlayerCeilingContactTransitionLine = (
  playerCeilingContactTransition: DebugOverlayPlayerCeilingContactTransitionTelemetry | null
): string => {
  if (!playerCeilingContactTransition) {
    return 'CeilEvt: none';
  }

  return (
    `CeilEvt: ${playerCeilingContactTransition.kind} | ` +
    `Tile:${playerCeilingContactTransition.tile.x},${playerCeilingContactTransition.tile.y} ` +
    `(#${playerCeilingContactTransition.tile.id}) | ` +
    `Pos:${formatFloat(playerCeilingContactTransition.position.x, 2)},` +
    `${formatFloat(playerCeilingContactTransition.position.y, 2)} | ` +
    `Vel:${formatFloat(playerCeilingContactTransition.velocity.x, 2)},` +
    `${formatFloat(playerCeilingContactTransition.velocity.y, 2)}`
  );
};

const formatAnimatedChunkUvUploadLine = (stats: DebugOverlayStats): string =>
  `AnimUV: uploads:${stats.animatedChunkUvUploadCount} | ` +
  `quads:${stats.animatedChunkUvUploadQuadCount} | ` +
  `nonLiquid:${Math.max(0, stats.animatedChunkUvUploadQuadCount - stats.animatedChunkUvUploadLiquidQuadCount)} | ` +
  `liquid:${stats.animatedChunkUvUploadLiquidQuadCount} | ` +
  `bytes:${stats.animatedChunkUvUploadBytes}`;

const formatAnimatedChunkResidencyLine = (stats: DebugOverlayStats): string =>
  `AnimMesh: chunks:${stats.residentAnimatedChunkMeshes} | ` +
  `quads:${stats.residentAnimatedChunkQuadCount} | ` +
  `nonLiquid:${Math.max(0, stats.residentAnimatedChunkQuadCount - stats.residentAnimatedLiquidChunkQuadCount)} | ` +
  `liquid:${stats.residentAnimatedLiquidChunkQuadCount}`;

const formatActiveLiquidBounds = (stats: DebugOverlayStats): string => {
  if (
    stats.residentActiveLiquidMinChunkX === null ||
    stats.residentActiveLiquidMinChunkY === null ||
    stats.residentActiveLiquidMaxChunkX === null ||
    stats.residentActiveLiquidMaxChunkY === null
  ) {
    return 'none';
  }

  return (
    `${stats.residentActiveLiquidMinChunkX},${stats.residentActiveLiquidMinChunkY}` +
    `..${stats.residentActiveLiquidMaxChunkX},${stats.residentActiveLiquidMaxChunkY}`
  );
};

const formatSidewaysCandidateBounds = (stats: DebugOverlayStats): string => {
  if (
    stats.liquidStepSidewaysCandidateMinChunkX === null ||
    stats.liquidStepSidewaysCandidateMinChunkY === null ||
    stats.liquidStepSidewaysCandidateMaxChunkX === null ||
    stats.liquidStepSidewaysCandidateMaxChunkY === null
  ) {
    return 'none';
  }

  return (
    `${stats.liquidStepSidewaysCandidateMinChunkX},${stats.liquidStepSidewaysCandidateMinChunkY}` +
    `..${stats.liquidStepSidewaysCandidateMaxChunkX},${stats.liquidStepSidewaysCandidateMaxChunkY}`
  );
};

const formatSleepingLiquidBounds = (stats: DebugOverlayStats): string => {
  if (
    stats.residentSleepingLiquidMinChunkX === null ||
    stats.residentSleepingLiquidMinChunkY === null ||
    stats.residentSleepingLiquidMaxChunkX === null ||
    stats.residentSleepingLiquidMaxChunkY === null
  ) {
    return 'none';
  }

  return (
    `${stats.residentSleepingLiquidMinChunkX},${stats.residentSleepingLiquidMinChunkY}` +
    `..${stats.residentSleepingLiquidMaxChunkX},${stats.residentSleepingLiquidMaxChunkY}`
  );
};

const formatLiquidStepLine = (stats: DebugOverlayStats): string =>
  `LiquidStep: awake:${stats.residentActiveLiquidChunks} | ` +
  `sleeping:${stats.residentSleepingLiquidChunks} | ` +
  `bounds:${formatActiveLiquidBounds(stats)} | ` +
  `sleepBounds:${formatSleepingLiquidBounds(stats)} | ` +
  `sideBounds:${formatSidewaysCandidateBounds(stats)} | ` +
  `phase:${stats.liquidStepPhaseSummary} | ` +
  `downChunks:${stats.liquidStepDownwardActiveChunksScanned} | ` +
  `sideChunks:${stats.liquidStepSidewaysCandidateChunksScanned} | ` +
  `sidePairs:${stats.liquidStepSidewaysPairsTested} | ` +
  `downTransfers:${stats.liquidStepDownwardTransfersApplied} | ` +
  `sideTransfers:${stats.liquidStepSidewaysTransfersApplied}`;

export const formatDebugOverlayText = (
  fps: number,
  stats: DebugOverlayStats,
  inspect: DebugOverlayInspectState | null
): string => {
  const budgetState = stats.drawCalls > stats.drawCallBudget ? 'OVER' : 'OK';
  const summaryLine =
    `FPS: ${fps.toFixed(1)} | ` +
    `Chunks: ${stats.renderedChunks} | ` +
    `Draws: ${stats.drawCalls}/${stats.drawCallBudget} (${budgetState}) | ` +
    `Mesh builds: ${stats.meshBuilds}/${stats.meshBuildBudget} (${stats.meshBuildTimeMs.toFixed(2)} ms) | ` +
    `MeshQ: ${stats.meshBuildQueueLength} | ` +
    `Cache W/M: ${stats.residentWorldChunks}/${stats.cachedChunkMeshes} | ` +
    `LightDirty: ${stats.residentDirtyLightChunks} | ` +
    `Evict W/M: ${stats.evictedWorldChunks}/${stats.evictedMeshEntries}`;

  const pointerInspect = inspect?.pointer ?? null;
  const pinnedInspect = inspect?.pinned ?? null;
  const spawn = inspect?.spawn ?? null;
  const player = inspect?.player ?? null;
  const hostileSlime = inspect?.hostileSlime ?? null;
  const playerPlaceholderPoseLabel = inspect?.playerPlaceholderPoseLabel ?? null;
  const playerCeilingBonkHoldActive = inspect?.playerCeilingBonkHoldActive ?? null;
  const playerNearbyLightLevel = inspect?.playerNearbyLightLevel ?? null;
  const playerNearbyLightFactor = inspect?.playerNearbyLightFactor ?? null;
  const playerNearbyLightSourceTile = inspect?.playerNearbyLightSourceTile ?? null;
  const playerNearbyLightSourceChunk = inspect?.playerNearbyLightSourceChunk ?? null;
  const playerNearbyLightSourceLocalTile = inspect?.playerNearbyLightSourceLocalTile ?? null;
  const playerIntent = inspect?.playerIntent ?? null;
  const playerCameraFollow = inspect?.playerCameraFollow ?? null;
  const playerGroundedTransition = inspect?.playerGroundedTransition ?? null;
  const playerFacingTransition = inspect?.playerFacingTransition ?? null;
  const playerRespawn = inspect?.playerRespawn ?? null;
  const playerWallContactTransition = inspect?.playerWallContactTransition ?? null;
  const playerCeilingContactTransition = inspect?.playerCeilingContactTransition ?? null;
  const lines = [
    summaryLine,
    formatAtlasLine(stats),
    formatAtlasValidationLine(stats),
    formatSpawnLine(spawn),
    formatSpawnSupportLine(spawn),
    formatSpawnLiquidSafetyLine(spawn),
    formatPlayerLine(player),
    formatPlayerPlaceholderPoseLine(playerPlaceholderPoseLabel),
    formatPlayerCeilingBonkHoldLine(playerCeilingBonkHoldActive),
    formatPlayerCombatLine(player),
    formatHostileSlimeLine(hostileSlime),
    formatPlayerNearbyLightLine(
      playerNearbyLightLevel,
      playerNearbyLightFactor,
      playerNearbyLightSourceTile,
      playerNearbyLightSourceChunk,
      playerNearbyLightSourceLocalTile
    ),
    formatPlayerGroundedTransitionLine(playerGroundedTransition),
    formatPlayerFacingTransitionLine(playerFacingTransition),
    formatPlayerRespawnLine(playerRespawn),
    formatPlayerWallContactTransitionLine(playerWallContactTransition),
    formatPlayerCeilingContactTransitionLine(playerCeilingContactTransition),
    formatPlayerAabbLine(player),
    formatPlayerCameraFollowLine(playerCameraFollow),
    formatPlayerContactsLine(player),
    formatPlayerIntentLine(playerIntent),
    formatAnimatedChunkResidencyLine(stats),
    formatAnimatedChunkUvUploadLine(stats),
    formatLiquidStepLine(stats)
  ].filter((line): line is string => line !== null);

  if (!pointerInspect) {
    lines.push('Ptr: n/a');
  } else {
    lines.push(
      `Ptr(${pointerInspect.pointerType}) ` +
        `C:${formatInt(pointerInspect.client.x)},${formatInt(pointerInspect.client.y)} | ` +
        `Cv:${formatInt(pointerInspect.canvas.x)},${formatInt(pointerInspect.canvas.y)} | ` +
        `W:${formatFloat(pointerInspect.world.x, 2)},${formatFloat(pointerInspect.world.y, 2)} | ` +
        formatTileLocation(pointerInspect)
    );
  }

  if (pinnedInspect) {
    lines.push(`Pin: ${formatTileLocation(pinnedInspect)}`);
  }

  return lines.join('\n');
};

export class DebugOverlay {
  private root: HTMLDivElement;
  private fps = 0;
  private smoothDelta = 16;
  private visible = false;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.top = '12px';
    this.root.style.left = '12px';
    this.root.style.display = 'none';
    this.root.style.padding = '8px 10px';
    this.root.style.background = 'rgba(0, 0, 0, 0.6)';
    this.root.style.color = '#fff';
    this.root.style.fontFamily = 'monospace';
    this.root.style.fontSize = '12px';
    this.root.style.whiteSpace = 'pre';
    this.root.style.lineHeight = '1.35';
    this.root.style.pointerEvents = 'none';
    this.root.style.borderRadius = '8px';
    document.body.append(this.root);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.style.display = this.visible ? 'block' : 'none';
  }

  update(
    deltaMs: number,
    stats: DebugOverlayStats,
    inspect: DebugOverlayInspectState | null = null
  ): void {
    this.smoothDelta = this.smoothDelta * 0.9 + deltaMs * 0.1;
    this.fps = 1000 / this.smoothDelta;
    this.root.style.display = this.visible ? 'block' : 'none';
    this.root.textContent = formatDebugOverlayText(this.fps, stats, inspect);
  }
}
