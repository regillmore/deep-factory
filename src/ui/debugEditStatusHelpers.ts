import {
  walkFilledEllipseTileArea,
  walkEllipseOutlineTileArea,
  walkFilledRectangleTileArea,
  walkRectangleOutlineTileArea,
  walkLineSteppedTilePath,
  type ArmedDebugToolPreviewState,
  type DebugTileEditKind,
  type TouchDebugEditMode
} from '../input/controller';
import { worldToChunkCoord, worldToLocalTile } from '../world/chunkMath';
import { MAX_LIGHT_LEVEL, MAX_LIQUID_LEVEL } from '../world/constants';
import type { LiquidSurfaceBranchKind } from '../world/liquidSurface';
import type { PlayerCeilingContactTransitionKind } from '../world/playerCeilingContactTransition';
import type { PlayerFacingTransitionKind } from '../world/playerFacingTransition';
import type { PlayerGroundedTransitionKind } from '../world/playerGroundedTransition';
import type { PlayerRespawnEventKind } from '../world/playerRespawnEvent';
import type { PlayerSpawnLiquidSafetyStatus } from '../world/playerSpawn';
import type { PlayerFacing } from '../world/playerState';
import type { PlayerWallContactTransitionKind } from '../world/playerWallContactTransition';
import type { TileLiquidKind } from '../world/tileMetadata';
import type { LiquidStepPhaseSummary } from '../world/world';

export interface ActiveDebugToolStatus {
  title: string;
  detail: string;
  accent: string;
}

export interface DebugEditStatusStripState {
  mode: TouchDebugEditMode;
  brushLabel: string;
  brushTileId: number;
  preview: ArmedDebugToolPreviewState;
  hoveredTile: DebugEditHoveredTileState | null;
  pinnedTile: DebugEditHoveredTileState | null;
  desktopInspectPinArmed: boolean;
  playerPlaceholderPoseLabel?: string | null;
  playerWorldPosition?: { x: number; y: number } | null;
  playerWorldTile?: { x: number; y: number } | null;
  playerSpawn?: DebugEditStatusStripPlayerSpawnTelemetry | null;
  playerAabb?: DebugEditStatusStripPlayerAabbTelemetry | null;
  playerCameraWorldPosition?: { x: number; y: number } | null;
  playerCameraWorldTile?: { x: number; y: number } | null;
  playerCameraWorldChunk?: { x: number; y: number } | null;
  playerCameraWorldLocalTile?: { x: number; y: number } | null;
  playerCameraFocusPoint?: { x: number; y: number } | null;
  playerCameraFocusTile?: { x: number; y: number } | null;
  playerCameraFocusChunk?: { x: number; y: number } | null;
  playerCameraFocusLocalTile?: { x: number; y: number } | null;
  playerCameraFollowOffset?: DebugEditStatusStripPlayerCameraFollowOffsetTelemetry | null;
  playerCameraZoom?: number | null;
  residentDirtyLightChunks?: number | null;
  residentActiveLiquidChunks?: number | null;
  residentSleepingLiquidChunks?: number | null;
  residentActiveLiquidMinChunkX?: number | null;
  residentActiveLiquidMinChunkY?: number | null;
  residentActiveLiquidMaxChunkX?: number | null;
  residentActiveLiquidMaxChunkY?: number | null;
  residentSleepingLiquidMinChunkX?: number | null;
  residentSleepingLiquidMinChunkY?: number | null;
  residentSleepingLiquidMaxChunkX?: number | null;
  residentSleepingLiquidMaxChunkY?: number | null;
  liquidStepSidewaysCandidateMinChunkX?: number | null;
  liquidStepSidewaysCandidateMinChunkY?: number | null;
  liquidStepSidewaysCandidateMaxChunkX?: number | null;
  liquidStepSidewaysCandidateMaxChunkY?: number | null;
  liquidStepPhaseSummary?: LiquidStepPhaseSummary | null;
  liquidStepDownwardActiveChunksScanned?: number | null;
  liquidStepSidewaysCandidateChunksScanned?: number | null;
  liquidStepSidewaysPairsTested?: number | null;
  liquidStepDownwardTransfersApplied?: number | null;
  liquidStepSidewaysTransfersApplied?: number | null;
  playerNearbyLightLevel?: number | null;
  playerNearbyLightFactor?: number | null;
  playerNearbyLightSourceTile?: { x: number; y: number } | null;
  playerNearbyLightSourceChunk?: { x: number; y: number } | null;
  playerNearbyLightSourceLocalTile?: { x: number; y: number } | null;
  playerCeilingBonkHoldActive?: boolean | null;
  playerGrounded?: boolean | null;
  playerFacing?: PlayerFacing | null;
  playerMoveX?: -1 | 0 | 1 | null;
  playerVelocityX?: number | null;
  playerVelocityY?: number | null;
  playerJumpHeld?: boolean | null;
  playerJumpPressed?: boolean | null;
  playerSupportContact?: DebugEditStatusStripPlayerSupportContactTelemetry | null;
  playerWallContact?: DebugEditStatusStripPlayerWallContactTelemetry | null;
  playerCeilingContact?: DebugEditStatusStripPlayerCeilingContactTelemetry | null;
  playerGroundedTransition?: DebugEditStatusStripPlayerGroundedTransitionTelemetry | null;
  playerFacingTransition?: DebugEditStatusStripPlayerFacingTransitionTelemetry | null;
  playerRespawn?: DebugEditStatusStripPlayerRespawnTelemetry | null;
  playerWallContactTransition?: DebugEditStatusStripPlayerWallContactTransitionTelemetry | null;
  playerCeilingContactTransition?: DebugEditStatusStripPlayerCeilingContactTransitionTelemetry | null;
}

export interface DebugEditStatusStripModel {
  modeText: string;
  brushText: string;
  toolText: string;
  previewText: string | null;
  playerText: string | null;
  eventText: string | null;
  inspectText: string;
  hoverText: string;
  hintText: string;
  inspectActionText: string;
  clearActionText: string | null;
  toolAccent: string;
  inspectAccent: string;
}

export interface DebugEditHoveredTileState {
  tileX: number;
  tileY: number;
  chunkX: number;
  chunkY: number;
  localX: number;
  localY: number;
  tileId: number;
  tileLabel: string;
  solid: boolean;
  blocksLight: boolean;
  liquidKind: TileLiquidKind | null;
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

export interface DebugEditStatusStripPlayerRespawnTelemetry {
  kind: PlayerRespawnEventKind;
  spawnTile: { x: number; y: number };
  supportChunk: { x: number; y: number };
  supportLocal: { x: number; y: number };
  supportTileId: number;
  liquidSafetyStatus: PlayerSpawnLiquidSafetyStatus;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugEditStatusStripPlayerSpawnTelemetry {
  liquidSafetyStatus: PlayerSpawnLiquidSafetyStatus | 'unresolved';
  tile?: { x: number; y: number } | null;
  world?: { x: number; y: number } | null;
  supportTile?: {
    x: number;
    y: number;
    id: number;
    chunk: { x: number; y: number };
    local: { x: number; y: number };
  } | null;
}

export interface DebugEditStatusStripPlayerAabbTelemetry {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

export interface DebugEditStatusStripPlayerCameraFollowOffsetTelemetry {
  x: number;
  y: number;
}

export interface DebugEditStatusStripPlayerGroundedTransitionTelemetry {
  kind: PlayerGroundedTransitionKind;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugEditStatusStripPlayerFacingTransitionTelemetry {
  kind: PlayerFacingTransitionKind;
  previousFacing: 'left' | 'right';
  nextFacing: 'left' | 'right';
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugEditStatusStripPlayerSupportContactTelemetry {
  tile: { x: number; y: number; id: number };
}

export interface DebugEditStatusStripPlayerWallContactTelemetry {
  tile: { x: number; y: number; id: number; side: 'left' | 'right' };
}

export interface DebugEditStatusStripPlayerCeilingContactTelemetry {
  tile: { x: number; y: number; id: number };
}

export interface DebugEditStatusStripPlayerWallContactTransitionTelemetry {
  kind: PlayerWallContactTransitionKind;
  tile: { x: number; y: number; id: number; side: 'left' | 'right' };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugEditStatusStripPlayerCeilingContactTransitionTelemetry {
  kind: PlayerCeilingContactTransitionKind;
  tile: { x: number; y: number; id: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

interface ActiveDebugToolPreviewSummary {
  anchorTileX: number;
  anchorTileY: number;
  endpointTileX: number | null;
  endpointTileY: number | null;
  affectedTileCount: number | null;
}

const NEUTRAL_TOOL_ACCENT = 'rgba(176, 190, 208, 0.9)';
const INSPECT_IDLE_ACCENT = 'rgba(176, 190, 208, 0.9)';
const INSPECT_ACTIVE_ACCENT = 'rgba(120, 210, 255, 0.95)';
const HINT_SEGMENT_SEPARATOR = ' | ';

const joinHintSegments = (...segments: string[]): string => segments.join(HINT_SEGMENT_SEPARATOR);

const joinHintLines = (...lines: string[]): string => lines.join('\n');

const DESKTOP_ONE_SHOT_HINT = joinHintSegments(
  'Desktop one-shot: F fill',
  'N line',
  'R rect fill',
  'T rect outline',
  'E ellipse fill',
  'O ellipse outline',
  'Shift = break'
);

const lineAccentForKind = (kind: DebugTileEditKind): string =>
  kind === 'place' ? 'rgba(120, 210, 255, 0.95)' : 'rgba(255, 180, 120, 0.95)';

const fillAccentForKind = (kind: DebugTileEditKind): string =>
  kind === 'place' ? 'rgba(120, 255, 180, 0.95)' : 'rgba(255, 130, 130, 0.95)';

const rectAccentForKind = (kind: DebugTileEditKind): string =>
  kind === 'place' ? 'rgba(120, 255, 180, 0.95)' : 'rgba(255, 130, 130, 0.95)';

const rectOutlineAccentForKind = (kind: DebugTileEditKind): string =>
  kind === 'place' ? 'rgba(120, 210, 255, 0.95)' : 'rgba(255, 180, 120, 0.95)';

const ellipseAccentForKind = (kind: DebugTileEditKind): string =>
  kind === 'place' ? 'rgba(185, 255, 120, 0.95)' : 'rgba(255, 155, 120, 0.95)';

const ellipseOutlineAccentForKind = (kind: DebugTileEditKind): string =>
  kind === 'place' ? 'rgba(150, 225, 255, 0.95)' : 'rgba(255, 195, 120, 0.95)';

const toolActionLabel = (tool: string, kind: DebugTileEditKind): string =>
  `${tool} ${kind === 'place' ? 'Brush' : 'Break'}`;

const formatPendingTouchAnchorLabel = (
  tool: string,
  kind: DebugTileEditKind,
  anchorLabel: string,
  tileX: number,
  tileY: number
): string => `${toolActionLabel(tool, kind)} ${anchorLabel} @ ${formatTileCoordinatePair(tileX, tileY)}`;

export const formatTouchDebugEditModeLabel = (mode: TouchDebugEditMode): string => {
  if (mode === 'pan') return 'Pan';
  if (mode === 'place') return 'Place';
  return 'Break';
};

export const resolveActiveDebugToolStatus = (
  preview: ArmedDebugToolPreviewState
): ActiveDebugToolStatus | null => {
  if (preview.activeMouseLineDrag) {
    return {
      title: `${toolActionLabel('Line', preview.activeMouseLineDrag.kind)} armed`,
      detail: joinHintSegments('drag endpoint', 'release to apply', 'Esc cancel'),
      accent: lineAccentForKind(preview.activeMouseLineDrag.kind)
    };
  }

  if (preview.activeMouseRectDrag) {
    return {
      title: `${toolActionLabel('Rect Fill', preview.activeMouseRectDrag.kind)} armed`,
      detail: joinHintSegments('drag box', 'release to apply', 'Esc cancel'),
      accent: rectAccentForKind(preview.activeMouseRectDrag.kind)
    };
  }

  if (preview.activeMouseRectOutlineDrag) {
    return {
      title: `${toolActionLabel('Rect Outline', preview.activeMouseRectOutlineDrag.kind)} armed`,
      detail: joinHintSegments('drag box', 'release to apply', 'Esc cancel'),
      accent: rectOutlineAccentForKind(preview.activeMouseRectOutlineDrag.kind)
    };
  }

  if (preview.activeMouseEllipseDrag) {
    return {
      title: `${toolActionLabel('Ellipse Fill', preview.activeMouseEllipseDrag.kind)} armed`,
      detail: joinHintSegments('drag bounds', 'release to apply', 'Esc cancel'),
      accent: ellipseAccentForKind(preview.activeMouseEllipseDrag.kind)
    };
  }

  if (preview.activeMouseEllipseOutlineDrag) {
    return {
      title: `${toolActionLabel('Ellipse Outline', preview.activeMouseEllipseOutlineDrag.kind)} armed`,
      detail: joinHintSegments('drag bounds', 'release to apply', 'Esc cancel'),
      accent: ellipseOutlineAccentForKind(preview.activeMouseEllipseOutlineDrag.kind)
    };
  }

  if (preview.pendingTouchLineStart) {
    return {
      title: `${toolActionLabel('Line', preview.pendingTouchLineStart.kind)} armed`,
      detail: joinHintSegments('start set', 'tap end tile', 'Esc cancel'),
      accent: lineAccentForKind(preview.pendingTouchLineStart.kind)
    };
  }

  if (preview.pendingTouchRectStart) {
    return {
      title: `${toolActionLabel('Rect Fill', preview.pendingTouchRectStart.kind)} armed`,
      detail: joinHintSegments('corner set', 'tap opposite corner', 'Esc cancel'),
      accent: rectAccentForKind(preview.pendingTouchRectStart.kind)
    };
  }

  if (preview.pendingTouchRectOutlineStart) {
    return {
      title: `${toolActionLabel('Rect Outline', preview.pendingTouchRectOutlineStart.kind)} armed`,
      detail: joinHintSegments('corner set', 'tap opposite corner', 'Esc cancel'),
      accent: rectOutlineAccentForKind(preview.pendingTouchRectOutlineStart.kind)
    };
  }

  if (preview.pendingTouchEllipseStart) {
    return {
      title: `${toolActionLabel('Ellipse Fill', preview.pendingTouchEllipseStart.kind)} armed`,
      detail: joinHintSegments('corner set', 'tap opposite corner', 'Esc cancel'),
      accent: ellipseAccentForKind(preview.pendingTouchEllipseStart.kind)
    };
  }

  if (preview.pendingTouchEllipseOutlineStart) {
    return {
      title: `${toolActionLabel('Ellipse Outline', preview.pendingTouchEllipseOutlineStart.kind)} armed`,
      detail: joinHintSegments('corner set', 'tap opposite corner', 'Esc cancel'),
      accent: ellipseOutlineAccentForKind(preview.pendingTouchEllipseOutlineStart.kind)
    };
  }

  if (preview.armedLineKind) {
    return {
      title: `${toolActionLabel('Line', preview.armedLineKind)} armed`,
      detail: joinHintSegments('drag on desktop', 'tap start/end on touch', 'Esc cancel'),
      accent: lineAccentForKind(preview.armedLineKind)
    };
  }

  if (preview.armedRectKind) {
    return {
      title: `${toolActionLabel('Rect Fill', preview.armedRectKind)} armed`,
      detail: joinHintSegments('drag box on desktop', 'tap two corners on touch', 'Esc cancel'),
      accent: rectAccentForKind(preview.armedRectKind)
    };
  }

  if (preview.armedRectOutlineKind) {
    return {
      title: `${toolActionLabel('Rect Outline', preview.armedRectOutlineKind)} armed`,
      detail: joinHintSegments('drag box on desktop', 'tap two corners on touch', 'Esc cancel'),
      accent: rectOutlineAccentForKind(preview.armedRectOutlineKind)
    };
  }

  if (preview.armedEllipseKind) {
    return {
      title: `${toolActionLabel('Ellipse Fill', preview.armedEllipseKind)} armed`,
      detail: joinHintSegments('drag bounds on desktop', 'tap two corners on touch', 'Esc cancel'),
      accent: ellipseAccentForKind(preview.armedEllipseKind)
    };
  }

  if (preview.armedEllipseOutlineKind) {
    return {
      title: `${toolActionLabel('Ellipse Outline', preview.armedEllipseOutlineKind)} armed`,
      detail: joinHintSegments('drag bounds on desktop', 'tap two corners on touch', 'Esc cancel'),
      accent: ellipseOutlineAccentForKind(preview.armedEllipseOutlineKind)
    };
  }

  if (preview.armedFloodFillKind) {
    return {
      title: `${toolActionLabel('Fill', preview.armedFloodFillKind)} armed`,
      detail: joinHintSegments('click/tap target tile', 'Esc cancel'),
      accent: fillAccentForKind(preview.armedFloodFillKind)
    };
  }

  return null;
};

const buildIdleHintText = (mode: TouchDebugEditMode): string => {
  if (mode === 'pan') {
    return joinHintLines(
      joinHintSegments(
        'Touch: tap tile to pin inspect',
        'pan/pinch',
        'long-press eyedropper',
        'two-finger tap undo',
        'three-finger tap redo'
      ),
      joinHintSegments('Desktop: Pin Click arms inspect pinning', 'P/L/B modes', '1-0 or [ ] brush', 'I pick'),
      DESKTOP_ONE_SHOT_HINT
    );
  }
  if (mode === 'place') {
    return joinHintLines(
      joinHintSegments('Touch: drag to paint', 'pinch zoom'),
      joinHintSegments(
        'Desktop: left paint',
        'right break',
        'Shift-drag pan',
        'wheel zoom',
        'Pin Click arms inspect pinning'
      ),
      joinHintSegments(DESKTOP_ONE_SHOT_HINT, 'Esc cancels one-shot tools')
    );
  }
  return joinHintLines(
    joinHintSegments('Touch: drag to break', 'pinch zoom'),
    joinHintSegments(
      'Desktop: left paint',
      'right break',
      'Shift-drag pan',
      'wheel zoom',
      'Pin Click arms inspect pinning'
    ),
    joinHintSegments(DESKTOP_ONE_SHOT_HINT, 'Esc cancels one-shot tools')
  );
};

const buildPinnedInspectHintText = (mode: TouchDebugEditMode): string => {
  if (mode === 'pan') {
    return joinHintLines(
      joinHintSegments('Pinned inspect active', 'strip: Repin Click or Clear Pin'),
      'Touch: tap another tile to repin or the same tile to clear'
    );
  }
  return joinHintLines(
    joinHintSegments('Pinned inspect stays visible in edit modes', 'strip: Repin Click or Clear Pin'),
    'Touch: switch to Pan to repin'
  );
};

const buildArmedDesktopInspectHintText = (hasPinnedTile: boolean): string =>
  hasPinnedTile
    ? joinHintSegments(
        'Repin Click armed',
        'click a world tile to move the pinned inspect target',
        'dragging still pans',
        'Esc cancels'
      )
    : joinHintSegments(
        'Pin Click armed',
        'click a world tile to lock its metadata in the strip',
        'dragging still pans',
        'Esc cancels'
      );

const formatHoveredTileFlag = (value: boolean): string => (value ? 'on' : 'off');
const formatLiquidCardinalMask = (value: number): string => {
  const mask = value & 0xf;
  return (
    `${(mask & (1 << 0)) !== 0 ? 'N' : '-'}${(mask & (1 << 1)) !== 0 ? 'E' : '-'}` +
    `${(mask & (1 << 2)) !== 0 ? 'S' : '-'}${(mask & (1 << 3)) !== 0 ? 'W' : '-'}` +
    ` (${mask})`
  );
};
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

const hasSameInspectTarget = (
  hoveredTile: DebugEditHoveredTileState | null,
  pinnedTile: DebugEditHoveredTileState | null
): boolean =>
  hoveredTile !== null &&
  pinnedTile !== null &&
  hoveredTile.tileX === pinnedTile.tileX &&
  hoveredTile.tileY === pinnedTile.tileY;

const formatInspectTileLine = (label: string, tile: DebugEditHoveredTileState): string => {
  const liquidLevel = formatLiquidLevel(tile.liquidLevel);
  const liquidSurfaceInputs = formatLiquidSurfaceInputs(
    tile.liquidSurfaceNorthLevel,
    tile.liquidSurfaceWestLevel,
    tile.liquidSurfaceCenterLevel,
    tile.liquidSurfaceEastLevel
  );
  const liquidSurfaceBranch = formatLiquidSurfaceBranch(tile.liquidSurfaceBranch);
  const liquidSurfaceTopLeft = formatLiquidSurfaceHeight(tile.liquidSurfaceTopLeft);
  const liquidSurfaceTopRight = formatLiquidSurfaceHeight(tile.liquidSurfaceTopRight);
  const liquidFrameTopV = formatLiquidSurfaceHeight(tile.liquidFrameTopV);
  const liquidFrameTopPixelY = formatAtlasPixelCoordinate(tile.liquidFrameTopPixelY);
  const liquidFrameBottomV = formatLiquidSurfaceHeight(tile.liquidFrameBottomV);
  const liquidFrameBottomPixelY = formatAtlasPixelCoordinate(tile.liquidFrameBottomPixelY);
  const liquidFrameHeightV = formatLiquidSurfaceHeight(tile.liquidFrameHeightV);
  const liquidFramePixelHeight = formatAtlasPixelCoordinate(tile.liquidFramePixelHeight);
  const liquidBottomLeftV = formatLiquidSurfaceHeight(tile.liquidBottomLeftV);
  const liquidBottomRightV = formatLiquidSurfaceHeight(tile.liquidBottomRightV);
  const liquidBottomLeftPixelY = formatAtlasPixelCoordinate(tile.liquidBottomLeftPixelY);
  const liquidBottomRightPixelY = formatAtlasPixelCoordinate(tile.liquidBottomRightPixelY);
  const liquidVisibleLeftV = formatLiquidSurfaceHeight(tile.liquidVisibleLeftV);
  const liquidVisibleRightV = formatLiquidSurfaceHeight(tile.liquidVisibleRightV);
  const liquidVisibleLeftPercentage = formatPercentageValue(tile.liquidVisibleLeftPercentage);
  const liquidVisibleRightPercentage = formatPercentageValue(tile.liquidVisibleRightPercentage);
  const liquidVisibleLeftPixelHeight = formatAtlasPixelCoordinate(tile.liquidVisibleLeftPixelHeight);
  const liquidVisibleRightPixelHeight = formatAtlasPixelCoordinate(
    tile.liquidVisibleRightPixelHeight
  );
  const liquidRemainderLeftV = formatLiquidSurfaceHeight(tile.liquidRemainderLeftV);
  const liquidRemainderRightV = formatLiquidSurfaceHeight(tile.liquidRemainderRightV);
  const liquidRemainderLeftPercentage = formatPercentageValue(tile.liquidRemainderLeftPercentage);
  const liquidRemainderRightPercentage = formatPercentageValue(
    tile.liquidRemainderRightPercentage
  );
  const liquidRemainderLeftPixelHeight = formatAtlasPixelCoordinate(
    tile.liquidRemainderLeftPixelHeight
  );
  const liquidRemainderRightPixelHeight = formatAtlasPixelCoordinate(
    tile.liquidRemainderRightPixelHeight
  );
  const liquidCoverageLeftPercentage = formatPairedPercentageAccounting(
    tile.liquidVisibleLeftPercentage,
    tile.liquidRemainderLeftPercentage,
    tile.liquidCoverageLeftTotalPercentage
  );
  const liquidCoverageRightPercentage = formatPairedPercentageAccounting(
    tile.liquidVisibleRightPercentage,
    tile.liquidRemainderRightPercentage,
    tile.liquidCoverageRightTotalPercentage
  );
  const liquidCoverageLeftPixelHeight = formatPairedAtlasPixelAccounting(
    tile.liquidVisibleLeftPixelHeight,
    tile.liquidRemainderLeftPixelHeight,
    tile.liquidCoverageLeftTotalPixelHeight
  );
  const liquidCoverageRightPixelHeight = formatPairedAtlasPixelAccounting(
    tile.liquidVisibleRightPixelHeight,
    tile.liquidRemainderRightPixelHeight,
    tile.liquidCoverageRightTotalPixelHeight
  );
  const liquidAnimationFrame = formatLiquidAnimationFrame(
    tile.liquidAnimationFrameIndex,
    tile.liquidAnimationFrameCount
  );
  const liquidAnimationFrameDuration = formatDurationMs(tile.liquidAnimationFrameDurationMs);
  const liquidAnimationFrameElapsed = formatDurationMs(tile.liquidAnimationFrameElapsedMs);
  const liquidAnimationFrameProgress = formatProgressPercentage(
    tile.liquidAnimationFrameProgressNormalized
  );
  const liquidAnimationFrameRemaining = formatDurationMs(tile.liquidAnimationFrameRemainingMs);
  const liquidAnimationLoopDuration = formatDurationMs(tile.liquidAnimationLoopDurationMs);
  const liquidAnimationLoopElapsed = formatDurationMs(tile.liquidAnimationLoopElapsedMs);
  const liquidAnimationLoopProgress = formatProgressPercentage(
    tile.liquidAnimationLoopProgressNormalized
  );
  const liquidAnimationLoopRemaining = formatDurationMs(tile.liquidAnimationLoopRemainingMs);

  return (
    `${label}: ${tile.tileLabel} (#${tile.tileId}) @ ${tile.tileX},${tile.tileY}` +
    ` chunk:${tile.chunkX},${tile.chunkY}` +
    ` local:${tile.localX},${tile.localY}` +
    ` | solid:${formatHoveredTileFlag(tile.solid)}` +
    ` | light:${formatHoveredTileFlag(tile.blocksLight)}` +
    ` | liquid:${tile.liquidKind ?? 'none'}` +
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
    (typeof tile.liquidConnectivityGroupLabel === 'string' && tile.liquidConnectivityGroupLabel.length > 0
      ? ` | liquidGroup:${tile.liquidConnectivityGroupLabel}`
      : '') +
    (typeof tile.liquidCardinalMask === 'number'
      ? ` | liquidMask:${formatLiquidCardinalMask(tile.liquidCardinalMask)}`
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
    (typeof tile.liquidVariantSource === 'string' && tile.liquidVariantSource.length > 0
      ? ` | liquidSrc:${tile.liquidVariantSource}`
      : '') +
    (typeof tile.liquidVariantUvRect === 'string' && tile.liquidVariantUvRect.length > 0
      ? ` | liquidUv:${tile.liquidVariantUvRect}`
      : '') +
    (typeof tile.liquidVariantPixelBounds === 'string' && tile.liquidVariantPixelBounds.length > 0
      ? ` | liquidPx:${tile.liquidVariantPixelBounds}`
      : '')
  );
};

const formatSignedOffset = (value: number | string): string => {
  if (typeof value === 'number') {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  return value.startsWith('-') ? value : `+${value}`;
};

const formatTileCoordinatePair = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

const formatEstimatedAffectedTileCount = (tileCount: number | null): string =>
  tileCount === null ? 'pending' : `${tileCount} ${tileCount === 1 ? 'tile' : 'tiles'}`;

const formatGameplayFlag = (value: boolean): string => (value ? 'on' : 'off');

const formatRespawnEventText = (
  playerRespawn: DebugEditStatusStripPlayerRespawnTelemetry | null
): string | null => {
  if (!playerRespawn) {
    return null;
  }

  return (
    `Respawn: ${playerRespawn.kind} | ` +
    `spawn ${formatTileCoordinatePair(playerRespawn.spawnTile.x, playerRespawn.spawnTile.y)} | ` +
    `supportCh ${formatTileCoordinatePair(
      playerRespawn.supportChunk.x,
      playerRespawn.supportChunk.y
    )} | ` +
    `supportL ${formatTileCoordinatePair(
      playerRespawn.supportLocal.x,
      playerRespawn.supportLocal.y
    )} | ` +
    `supportId #${playerRespawn.supportTileId} | ` +
    `spawnLiquid ${formatPlayerSpawnLiquidSafetyStatus(playerRespawn.liquidSafetyStatus)} | ` +
    `pos ${playerRespawn.position.x.toFixed(2)},${playerRespawn.position.y.toFixed(2)} | ` +
    `vel ${playerRespawn.velocity.x.toFixed(2)},${playerRespawn.velocity.y.toFixed(2)}`
  );
};

const formatLiveWallContactText = (
  playerWallContact: DebugEditStatusStripPlayerWallContactTelemetry | null
): string | null => {
  if (!playerWallContact) {
    return null;
  }

  return (
    `WallNow: tile ${formatTileCoordinatePair(playerWallContact.tile.x, playerWallContact.tile.y)} ` +
    `(#${playerWallContact.tile.id}, ${playerWallContact.tile.side})`
  );
};

const formatLiveSupportContactText = (
  playerSupportContact: DebugEditStatusStripPlayerSupportContactTelemetry | null
): string | null => {
  if (!playerSupportContact) {
    return null;
  }

  return (
    `SupportNow: tile ${formatTileCoordinatePair(playerSupportContact.tile.x, playerSupportContact.tile.y)} ` +
    `(#${playerSupportContact.tile.id})`
  );
};

const formatLiveGroundedText = (playerGrounded: boolean | null): string | null => {
  if (playerGrounded === null) {
    return null;
  }

  return `GroundedNow: ${formatGameplayFlag(playerGrounded)}`;
};

const formatLiveWorldPositionText = (
  playerWorldPosition: { x: number; y: number } | null
): string | null => {
  if (playerWorldPosition === null) {
    return null;
  }

  return `PosNow: ${playerWorldPosition.x.toFixed(2)},${playerWorldPosition.y.toFixed(2)}`;
};

const formatLiveWorldTileText = (playerWorldTile: { x: number; y: number } | null): string | null => {
  if (playerWorldTile === null) {
    return null;
  }

  return `TileNow: ${formatTileCoordinatePair(playerWorldTile.x, playerWorldTile.y)}`;
};

const formatPlayerSpawnLiquidSafetyStatus = (
  liquidSafetyStatus: DebugEditStatusStripPlayerSpawnTelemetry['liquidSafetyStatus']
): string => (liquidSafetyStatus === 'overlap' ? 'overlap' : liquidSafetyStatus);

const formatLivePlayerSpawnText = (
  playerSpawn: DebugEditStatusStripPlayerSpawnTelemetry | null
): string | null => {
  if (playerSpawn === null) {
    return null;
  }

  if (playerSpawn.liquidSafetyStatus === 'unresolved' || playerSpawn.tile == null || playerSpawn.world == null) {
    return 'SpawnNow: unresolved';
  }

  return (
    `SpawnNow: ${formatPlayerSpawnLiquidSafetyStatus(playerSpawn.liquidSafetyStatus)} | ` +
    `tile ${formatTileCoordinatePair(playerSpawn.tile.x, playerSpawn.tile.y)} | ` +
    `pos ${playerSpawn.world.x.toFixed(2)},${playerSpawn.world.y.toFixed(2)}`
  );
};

const formatLivePlayerSpawnSupportText = (
  playerSpawn: DebugEditStatusStripPlayerSpawnTelemetry | null
): string | null => {
  if (
    playerSpawn === null ||
    playerSpawn.liquidSafetyStatus === 'unresolved' ||
    playerSpawn.supportTile == null
  ) {
    return null;
  }

  return (
    `SpawnSupportNow: tile ` +
    `${formatTileCoordinatePair(playerSpawn.supportTile.x, playerSpawn.supportTile.y)} ` +
    `(#${playerSpawn.supportTile.id}) | ` +
    `chunk ${formatTileCoordinatePair(
      playerSpawn.supportTile.chunk.x,
      playerSpawn.supportTile.chunk.y
    )} | ` +
    `local ${formatTileCoordinatePair(playerSpawn.supportTile.local.x, playerSpawn.supportTile.local.y)}`
  );
};

const formatLiveWorldChunkText = (playerWorldTile: { x: number; y: number } | null): string | null => {
  if (playerWorldTile === null) {
    return null;
  }

  const { chunkX, chunkY } = worldToChunkCoord(playerWorldTile.x, playerWorldTile.y);
  return `ChunkNow: ${formatTileCoordinatePair(chunkX, chunkY)}`;
};

const formatLiveWorldChunkLocalTileText = (
  playerWorldTile: { x: number; y: number } | null
): string | null => {
  if (playerWorldTile === null) {
    return null;
  }

  const { localX, localY } = worldToLocalTile(playerWorldTile.x, playerWorldTile.y);
  return `LocalNow: ${formatTileCoordinatePair(localX, localY)}`;
};

const formatLiveAabbText = (
  playerAabb: DebugEditStatusStripPlayerAabbTelemetry | null
): string | null => {
  if (playerAabb === null) {
    return null;
  }

  const width = playerAabb.max.x - playerAabb.min.x;
  const height = playerAabb.max.y - playerAabb.min.y;

  return (
    `AABBNow: min ${playerAabb.min.x.toFixed(2)},${playerAabb.min.y.toFixed(2)} | ` +
    `max ${playerAabb.max.x.toFixed(2)},${playerAabb.max.y.toFixed(2)} | ` +
    `size ${width.toFixed(2)},${height.toFixed(2)}`
  );
};

const formatLiveCameraWorldPositionText = (
  playerCameraWorldPosition: { x: number; y: number } | null
): string | null => {
  if (playerCameraWorldPosition === null) {
    return null;
  }

  return `CamPosNow: ${playerCameraWorldPosition.x.toFixed(2)},${playerCameraWorldPosition.y.toFixed(2)}`;
};

const formatLiveCameraWorldTileText = (
  playerCameraWorldTile: { x: number; y: number } | null
): string | null => {
  if (playerCameraWorldTile === null) {
    return null;
  }

  return `CamTileNow: ${formatTileCoordinatePair(playerCameraWorldTile.x, playerCameraWorldTile.y)}`;
};

const formatLiveCameraWorldChunkText = (
  playerCameraWorldChunk: { x: number; y: number } | null
): string | null => {
  if (playerCameraWorldChunk === null) {
    return null;
  }

  return `CamChunkNow: ${formatTileCoordinatePair(playerCameraWorldChunk.x, playerCameraWorldChunk.y)}`;
};

const formatLiveCameraWorldChunkLocalTileText = (
  playerCameraWorldLocalTile: { x: number; y: number } | null
): string | null => {
  if (playerCameraWorldLocalTile === null) {
    return null;
  }

  return `CamLocalNow: ${formatTileCoordinatePair(playerCameraWorldLocalTile.x, playerCameraWorldLocalTile.y)}`;
};

const formatLiveCameraFocusPointText = (
  playerCameraFocusPoint: { x: number; y: number } | null
): string | null => {
  if (playerCameraFocusPoint === null) {
    return null;
  }

  return `FocusPosNow: ${playerCameraFocusPoint.x.toFixed(2)},${playerCameraFocusPoint.y.toFixed(2)}`;
};

const formatLiveCameraFocusTileText = (
  playerCameraFocusTile: { x: number; y: number } | null
): string | null => {
  if (playerCameraFocusTile === null) {
    return null;
  }

  return `FocusTileNow: ${formatTileCoordinatePair(playerCameraFocusTile.x, playerCameraFocusTile.y)}`;
};

const formatLiveCameraFocusChunkText = (
  playerCameraFocusChunk: { x: number; y: number } | null
): string | null => {
  if (playerCameraFocusChunk === null) {
    return null;
  }

  return `FocusChunkNow: ${formatTileCoordinatePair(playerCameraFocusChunk.x, playerCameraFocusChunk.y)}`;
};

const formatLiveCameraFocusChunkLocalTileText = (
  playerCameraFocusLocalTile: { x: number; y: number } | null
): string | null => {
  if (playerCameraFocusLocalTile === null) {
    return null;
  }

  return `FocusLocalNow: ${formatTileCoordinatePair(playerCameraFocusLocalTile.x, playerCameraFocusLocalTile.y)}`;
};

const formatLiveCameraFollowOffsetText = (
  playerCameraFollowOffset: DebugEditStatusStripPlayerCameraFollowOffsetTelemetry | null
): string | null => {
  if (playerCameraFollowOffset === null) {
    return null;
  }

  return (
    `OffsetNow: x:${formatSignedOffset(playerCameraFollowOffset.x.toFixed(2))} | ` +
    `y:${formatSignedOffset(playerCameraFollowOffset.y.toFixed(2))}`
  );
};

const formatLiveCameraZoomText = (playerCameraZoom: number | null): string | null => {
  if (playerCameraZoom === null) {
    return null;
  }

  return `ZoomNow: ${playerCameraZoom.toFixed(2)}x`;
};

const formatLiveResidentDirtyLightChunksText = (
  residentDirtyLightChunks: number | null
): string | null => {
  if (residentDirtyLightChunks === null) {
    return null;
  }

  return `LightDirtyNow: ${Math.round(residentDirtyLightChunks)}`;
};

const formatLiquidChunkBoundsText = (
  minChunkX: number | null,
  minChunkY: number | null,
  maxChunkX: number | null,
  maxChunkY: number | null
): string => {
  if (
    minChunkX === null ||
    minChunkY === null ||
    maxChunkX === null ||
    maxChunkY === null
  ) {
    return 'none';
  }

  return (
    `${Math.round(minChunkX)},${Math.round(minChunkY)}` +
    `..${Math.round(maxChunkX)},${Math.round(maxChunkY)}`
  );
};

const formatSidewaysPairDensityText = (
  liquidStepSidewaysCandidateChunksScanned: number | null,
  liquidStepSidewaysPairsTested: number | null
): string => {
  if (
    liquidStepSidewaysCandidateChunksScanned === null ||
    liquidStepSidewaysPairsTested === null
  ) {
    return 'n/a';
  }

  const roundedChunkCount = Math.round(liquidStepSidewaysCandidateChunksScanned);
  const roundedPairCount = Math.round(liquidStepSidewaysPairsTested);
  if (roundedChunkCount <= 0) {
    return roundedPairCount <= 0 ? '0/chunk' : 'n/a';
  }

  const density = Math.round((roundedPairCount / roundedChunkCount) * 10) / 10;
  return Number.isInteger(density) ? `${density.toFixed(0)}/chunk` : `${density.toFixed(1)}/chunk`;
};

const formatLiveResidentActiveLiquidChunksText = (
  residentActiveLiquidChunks: number | null,
  residentSleepingLiquidChunks: number | null,
  residentActiveLiquidMinChunkX: number | null,
  residentActiveLiquidMinChunkY: number | null,
  residentActiveLiquidMaxChunkX: number | null,
  residentActiveLiquidMaxChunkY: number | null,
  residentSleepingLiquidMinChunkX: number | null,
  residentSleepingLiquidMinChunkY: number | null,
  residentSleepingLiquidMaxChunkX: number | null,
  residentSleepingLiquidMaxChunkY: number | null
): string | null => {
  if (residentActiveLiquidChunks === null) {
    return null;
  }

  return (
    `LiquidChunksNow: awake:${Math.round(residentActiveLiquidChunks)} | ` +
    `sleeping:${Math.round(residentSleepingLiquidChunks ?? 0)} | ` +
    `bounds:${formatLiquidChunkBoundsText(
      residentActiveLiquidMinChunkX,
      residentActiveLiquidMinChunkY,
      residentActiveLiquidMaxChunkX,
      residentActiveLiquidMaxChunkY
    )} | ` +
    `sleepBounds:${formatLiquidChunkBoundsText(
      residentSleepingLiquidMinChunkX,
      residentSleepingLiquidMinChunkY,
      residentSleepingLiquidMaxChunkX,
      residentSleepingLiquidMaxChunkY
    )}`
  );
};

const formatLiveLiquidStepSummaryText = (
  liquidStepSidewaysCandidateMinChunkX: number | null,
  liquidStepSidewaysCandidateMinChunkY: number | null,
  liquidStepSidewaysCandidateMaxChunkX: number | null,
  liquidStepSidewaysCandidateMaxChunkY: number | null,
  liquidStepPhaseSummary: LiquidStepPhaseSummary | null,
  liquidStepDownwardActiveChunksScanned: number | null,
  liquidStepSidewaysCandidateChunksScanned: number | null,
  liquidStepSidewaysPairsTested: number | null,
  liquidStepDownwardTransfersApplied: number | null,
  liquidStepSidewaysTransfersApplied: number | null
): string | null => {
  if (
    liquidStepSidewaysCandidateMinChunkX === null &&
    liquidStepSidewaysCandidateMinChunkY === null &&
    liquidStepSidewaysCandidateMaxChunkX === null &&
    liquidStepSidewaysCandidateMaxChunkY === null &&
    liquidStepPhaseSummary === null &&
    liquidStepDownwardActiveChunksScanned === null &&
    liquidStepSidewaysCandidateChunksScanned === null &&
    liquidStepSidewaysPairsTested === null &&
    liquidStepDownwardTransfersApplied === null &&
    liquidStepSidewaysTransfersApplied === null
  ) {
    return null;
  }

  const sidewaysBoundsText = formatLiquidChunkBoundsText(
    liquidStepSidewaysCandidateMinChunkX,
    liquidStepSidewaysCandidateMinChunkY,
    liquidStepSidewaysCandidateMaxChunkX,
    liquidStepSidewaysCandidateMaxChunkY
  );
  const phaseText = liquidStepPhaseSummary ?? 'n/a';
  if (
    liquidStepDownwardActiveChunksScanned === null &&
    liquidStepSidewaysCandidateChunksScanned === null &&
    liquidStepSidewaysPairsTested === null &&
    liquidStepDownwardTransfersApplied === null &&
    liquidStepSidewaysTransfersApplied === null
  ) {
    return `LiquidStepNow: sideBounds:${sidewaysBoundsText} | phase:${phaseText}`;
  }

  const downwardChunksText =
    liquidStepDownwardActiveChunksScanned === null
      ? 'n/a'
      : `${Math.round(liquidStepDownwardActiveChunksScanned)}`;
  const sidewaysCandidateChunksText =
    liquidStepSidewaysCandidateChunksScanned === null
      ? 'n/a'
      : `${Math.round(liquidStepSidewaysCandidateChunksScanned)}`;
  const sidewaysPairsText =
    liquidStepSidewaysPairsTested === null ? 'n/a' : `${Math.round(liquidStepSidewaysPairsTested)}`;
  const sidewaysPairDensityText = formatSidewaysPairDensityText(
    liquidStepSidewaysCandidateChunksScanned,
    liquidStepSidewaysPairsTested
  );
  const downwardTransfersText =
    liquidStepDownwardTransfersApplied === null
      ? 'n/a'
      : `${Math.round(liquidStepDownwardTransfersApplied)}`;
  const sidewaysTransfersText =
    liquidStepSidewaysTransfersApplied === null
      ? 'n/a'
      : `${Math.round(liquidStepSidewaysTransfersApplied)}`;
  return (
    `LiquidStepNow: sideBounds:${sidewaysBoundsText} | ` +
    `phase:${phaseText} | ` +
    `downChunks:${downwardChunksText} | ` +
    `sideChunks:${sidewaysCandidateChunksText} | ` +
    `sidePairs:${sidewaysPairsText} | ` +
    `sideDensity:${sidewaysPairDensityText} | ` +
    `downTransfers:${downwardTransfersText} | ` +
    `sideTransfers:${sidewaysTransfersText}`
  );
};

const formatLiveNearbyLightText = (
  playerNearbyLightLevel: number | null,
  playerNearbyLightFactor: number | null,
  playerNearbyLightSourceTile: { x: number; y: number } | null,
  playerNearbyLightSourceChunk: { x: number; y: number } | null,
  playerNearbyLightSourceLocalTile: { x: number; y: number } | null
): string | null => {
  if (playerNearbyLightLevel === null && playerNearbyLightFactor === null) {
    return null;
  }

  const nearbyLightLevelText =
    playerNearbyLightLevel === null
      ? 'n/a'
      : `${Math.round(playerNearbyLightLevel)}/${MAX_LIGHT_LEVEL}`;
  const nearbyLightFactorText = playerNearbyLightFactor === null ? 'n/a' : playerNearbyLightFactor.toFixed(2);
  const nearbyLightSourceTileText =
    playerNearbyLightSourceTile === null
      ? 'n/a'
      : `${Math.round(playerNearbyLightSourceTile.x)},${Math.round(playerNearbyLightSourceTile.y)}`;
  const nearbyLightSourceChunkText =
    playerNearbyLightSourceChunk === null
      ? 'n/a'
      : `${Math.round(playerNearbyLightSourceChunk.x)},${Math.round(playerNearbyLightSourceChunk.y)}`;
  const nearbyLightSourceLocalText =
    playerNearbyLightSourceLocalTile === null
      ? 'n/a'
      : `${Math.round(playerNearbyLightSourceLocalTile.x)},${Math.round(
          playerNearbyLightSourceLocalTile.y
        )}`;
  return (
    `LightSampleNow: ${nearbyLightLevelText} | ` +
    `factor:${nearbyLightFactorText} | ` +
    `source:${nearbyLightSourceTileText} | ` +
    `sourceChunk:${nearbyLightSourceChunkText} | ` +
    `sourceLocal:${nearbyLightSourceLocalText}`
  );
};

const formatLiveFacingText = (playerFacing: PlayerFacing | null): string | null => {
  if (playerFacing === null) {
    return null;
  }

  return `FacingNow: ${playerFacing}`;
};

const formatLiveMoveXText = (playerMoveX: -1 | 0 | 1 | null): string | null => {
  if (playerMoveX === null) {
    return null;
  }

  return `MoveXNow: ${playerMoveX}`;
};

const formatLiveVelocityXText = (playerVelocityX: number | null): string | null => {
  if (playerVelocityX === null) {
    return null;
  }

  return `VelXNow: ${playerVelocityX.toFixed(2)}`;
};

const formatLiveVelocityYText = (playerVelocityY: number | null): string | null => {
  if (playerVelocityY === null) {
    return null;
  }

  return `VelYNow: ${playerVelocityY.toFixed(2)}`;
};

const formatLiveSpeedMagnitudeText = (
  playerVelocityX: number | null,
  playerVelocityY: number | null
): string | null => {
  if (playerVelocityX === null || playerVelocityY === null) {
    return null;
  }

  return `SpeedNow: ${Math.hypot(playerVelocityX, playerVelocityY).toFixed(2)}`;
};

const formatLiveJumpHeldText = (playerJumpHeld: boolean | null): string | null => {
  if (playerJumpHeld === null) {
    return null;
  }

  return `JumpHeldNow: ${formatGameplayFlag(playerJumpHeld)}`;
};

const formatLiveJumpPressedText = (playerJumpPressed: boolean | null): string | null => {
  if (playerJumpPressed === null) {
    return null;
  }

  return `JumpPressedNow: ${formatGameplayFlag(playerJumpPressed)}`;
};

const formatLiveCeilingBonkHoldText = (playerCeilingBonkHoldActive: boolean | null): string | null => {
  if (playerCeilingBonkHoldActive === null) {
    return null;
  }

  return `BonkHold: ${formatGameplayFlag(playerCeilingBonkHoldActive)}`;
};

const formatLiveCeilingContactText = (
  playerCeilingContact: DebugEditStatusStripPlayerCeilingContactTelemetry | null
): string | null => {
  if (!playerCeilingContact) {
    return null;
  }

  return (
    `CeilingNow: tile ${formatTileCoordinatePair(playerCeilingContact.tile.x, playerCeilingContact.tile.y)} ` +
    `(#${playerCeilingContact.tile.id})`
  );
};

const buildPlayerText = (
  playerPlaceholderPoseLabel: string | null,
  playerWorldPosition: { x: number; y: number } | null,
  playerWorldTile: { x: number; y: number } | null,
  playerSpawn: DebugEditStatusStripPlayerSpawnTelemetry | null,
  playerAabb: DebugEditStatusStripPlayerAabbTelemetry | null,
  playerCameraWorldPosition: { x: number; y: number } | null,
  playerCameraWorldTile: { x: number; y: number } | null,
  playerCameraWorldChunk: { x: number; y: number } | null,
  playerCameraWorldLocalTile: { x: number; y: number } | null,
  playerCameraFocusPoint: { x: number; y: number } | null,
  playerCameraFocusTile: { x: number; y: number } | null,
  playerCameraFocusChunk: { x: number; y: number } | null,
  playerCameraFocusLocalTile: { x: number; y: number } | null,
  playerCameraFollowOffset: DebugEditStatusStripPlayerCameraFollowOffsetTelemetry | null,
  playerCameraZoom: number | null,
  residentDirtyLightChunks: number | null,
  residentActiveLiquidChunks: number | null,
  residentSleepingLiquidChunks: number | null,
  residentActiveLiquidMinChunkX: number | null,
  residentActiveLiquidMinChunkY: number | null,
  residentActiveLiquidMaxChunkX: number | null,
  residentActiveLiquidMaxChunkY: number | null,
  residentSleepingLiquidMinChunkX: number | null,
  residentSleepingLiquidMinChunkY: number | null,
  residentSleepingLiquidMaxChunkX: number | null,
  residentSleepingLiquidMaxChunkY: number | null,
  liquidStepSidewaysCandidateMinChunkX: number | null,
  liquidStepSidewaysCandidateMinChunkY: number | null,
  liquidStepSidewaysCandidateMaxChunkX: number | null,
  liquidStepSidewaysCandidateMaxChunkY: number | null,
  liquidStepPhaseSummary: LiquidStepPhaseSummary | null,
  liquidStepDownwardActiveChunksScanned: number | null,
  liquidStepSidewaysCandidateChunksScanned: number | null,
  liquidStepSidewaysPairsTested: number | null,
  liquidStepDownwardTransfersApplied: number | null,
  liquidStepSidewaysTransfersApplied: number | null,
  playerNearbyLightLevel: number | null,
  playerNearbyLightFactor: number | null,
  playerNearbyLightSourceTile: { x: number; y: number } | null,
  playerNearbyLightSourceChunk: { x: number; y: number } | null,
  playerNearbyLightSourceLocalTile: { x: number; y: number } | null,
  playerCeilingBonkHoldActive: boolean | null,
  playerGrounded: boolean | null,
  playerFacing: PlayerFacing | null,
  playerMoveX: -1 | 0 | 1 | null,
  playerVelocityX: number | null,
  playerVelocityY: number | null,
  playerJumpHeld: boolean | null,
  playerJumpPressed: boolean | null,
  playerSupportContact: DebugEditStatusStripPlayerSupportContactTelemetry | null,
  playerWallContact: DebugEditStatusStripPlayerWallContactTelemetry | null,
  playerCeilingContact: DebugEditStatusStripPlayerCeilingContactTelemetry | null
): string | null => {
  const playerLines = [
    playerPlaceholderPoseLabel ? `Pose: ${playerPlaceholderPoseLabel}` : null,
    formatLiveWorldPositionText(playerWorldPosition),
    formatLiveWorldTileText(playerWorldTile),
    formatLiveWorldChunkText(playerWorldTile),
    formatLiveWorldChunkLocalTileText(playerWorldTile),
    formatLivePlayerSpawnText(playerSpawn),
    formatLivePlayerSpawnSupportText(playerSpawn),
    formatLiveAabbText(playerAabb),
    formatLiveCameraWorldPositionText(playerCameraWorldPosition),
    formatLiveCameraWorldTileText(playerCameraWorldTile),
    formatLiveCameraWorldChunkText(playerCameraWorldChunk),
    formatLiveCameraWorldChunkLocalTileText(playerCameraWorldLocalTile),
    formatLiveCameraFocusPointText(playerCameraFocusPoint),
    formatLiveCameraFocusTileText(playerCameraFocusTile),
    formatLiveCameraFocusChunkText(playerCameraFocusChunk),
    formatLiveCameraFocusChunkLocalTileText(playerCameraFocusLocalTile),
    formatLiveCameraFollowOffsetText(playerCameraFollowOffset),
    formatLiveCameraZoomText(playerCameraZoom),
    formatLiveResidentDirtyLightChunksText(residentDirtyLightChunks),
    formatLiveResidentActiveLiquidChunksText(
      residentActiveLiquidChunks,
      residentSleepingLiquidChunks,
      residentActiveLiquidMinChunkX,
      residentActiveLiquidMinChunkY,
      residentActiveLiquidMaxChunkX,
      residentActiveLiquidMaxChunkY,
      residentSleepingLiquidMinChunkX,
      residentSleepingLiquidMinChunkY,
      residentSleepingLiquidMaxChunkX,
      residentSleepingLiquidMaxChunkY
    ),
    formatLiveLiquidStepSummaryText(
      liquidStepSidewaysCandidateMinChunkX,
      liquidStepSidewaysCandidateMinChunkY,
      liquidStepSidewaysCandidateMaxChunkX,
      liquidStepSidewaysCandidateMaxChunkY,
      liquidStepPhaseSummary,
      liquidStepDownwardActiveChunksScanned,
      liquidStepSidewaysCandidateChunksScanned,
      liquidStepSidewaysPairsTested,
      liquidStepDownwardTransfersApplied,
      liquidStepSidewaysTransfersApplied
    ),
    formatLiveNearbyLightText(
      playerNearbyLightLevel,
      playerNearbyLightFactor,
      playerNearbyLightSourceTile,
      playerNearbyLightSourceChunk,
      playerNearbyLightSourceLocalTile
    ),
    formatLiveCeilingBonkHoldText(playerCeilingBonkHoldActive),
    formatLiveGroundedText(playerGrounded),
    formatLiveFacingText(playerFacing),
    formatLiveMoveXText(playerMoveX),
    formatLiveVelocityXText(playerVelocityX),
    formatLiveVelocityYText(playerVelocityY),
    formatLiveSpeedMagnitudeText(playerVelocityX, playerVelocityY),
    formatLiveJumpHeldText(playerJumpHeld),
    formatLiveJumpPressedText(playerJumpPressed),
    formatLiveSupportContactText(playerSupportContact),
    formatLiveWallContactText(playerWallContact),
    formatLiveCeilingContactText(playerCeilingContact)
  ].filter((line): line is string => line !== null);

  return playerLines.length > 0 ? playerLines.join('\n') : null;
};

const formatGroundedTransitionEventText = (
  playerGroundedTransition: DebugEditStatusStripPlayerGroundedTransitionTelemetry | null
): string | null => {
  if (!playerGroundedTransition) {
    return null;
  }

  return (
    `Ground: ${playerGroundedTransition.kind} | ` +
    `pos ${playerGroundedTransition.position.x.toFixed(2)},${playerGroundedTransition.position.y.toFixed(2)} | ` +
    `vel ${playerGroundedTransition.velocity.x.toFixed(2)},${playerGroundedTransition.velocity.y.toFixed(2)}`
  );
};

const formatFacingTransitionEventText = (
  playerFacingTransition: DebugEditStatusStripPlayerFacingTransitionTelemetry | null
): string | null => {
  if (!playerFacingTransition) {
    return null;
  }

  return (
    `Facing: ${playerFacingTransition.previousFacing}->${playerFacingTransition.nextFacing} | ` +
    `pos ${playerFacingTransition.position.x.toFixed(2)},${playerFacingTransition.position.y.toFixed(2)} | ` +
    `vel ${playerFacingTransition.velocity.x.toFixed(2)},${playerFacingTransition.velocity.y.toFixed(2)}`
  );
};

const formatWallContactTransitionEventText = (
  playerWallContactTransition: DebugEditStatusStripPlayerWallContactTransitionTelemetry | null
): string | null => {
  if (!playerWallContactTransition) {
    return null;
  }

  return (
    `Wall: ${playerWallContactTransition.kind} | ` +
    `tile ${formatTileCoordinatePair(
      playerWallContactTransition.tile.x,
      playerWallContactTransition.tile.y
    )} (#${playerWallContactTransition.tile.id}, ${playerWallContactTransition.tile.side}) | ` +
    `pos ${playerWallContactTransition.position.x.toFixed(2)},${playerWallContactTransition.position.y.toFixed(2)} | ` +
    `vel ${playerWallContactTransition.velocity.x.toFixed(2)},${playerWallContactTransition.velocity.y.toFixed(2)}`
  );
};

const formatCeilingContactTransitionEventText = (
  playerCeilingContactTransition: DebugEditStatusStripPlayerCeilingContactTransitionTelemetry | null
): string | null => {
  if (!playerCeilingContactTransition) {
    return null;
  }

  return (
    `Ceiling: ${playerCeilingContactTransition.kind} | ` +
    `tile ${formatTileCoordinatePair(
      playerCeilingContactTransition.tile.x,
      playerCeilingContactTransition.tile.y
    )} (#${playerCeilingContactTransition.tile.id}) | ` +
    `pos ${playerCeilingContactTransition.position.x.toFixed(2)},${playerCeilingContactTransition.position.y.toFixed(2)} | ` +
    `vel ${playerCeilingContactTransition.velocity.x.toFixed(2)},${playerCeilingContactTransition.velocity.y.toFixed(2)}`
  );
};

const buildEventText = (
  playerGroundedTransition: DebugEditStatusStripPlayerGroundedTransitionTelemetry | null,
  playerFacingTransition: DebugEditStatusStripPlayerFacingTransitionTelemetry | null,
  playerRespawn: DebugEditStatusStripPlayerRespawnTelemetry | null,
  playerWallContactTransition: DebugEditStatusStripPlayerWallContactTransitionTelemetry | null,
  playerCeilingContactTransition: DebugEditStatusStripPlayerCeilingContactTransitionTelemetry | null
): string | null => {
  const eventLines = [
    formatGroundedTransitionEventText(playerGroundedTransition),
    formatFacingTransitionEventText(playerFacingTransition),
    formatRespawnEventText(playerRespawn),
    formatWallContactTransitionEventText(playerWallContactTransition),
    formatCeilingContactTransitionEventText(playerCeilingContactTransition)
  ].filter((line): line is string => line !== null);

  return eventLines.length > 0 ? eventLines.join('\n') : null;
};

const formatPreviewSpanText = (
  anchorTileX: number,
  anchorTileY: number,
  endpointTileX: number | null,
  endpointTileY: number | null
): string =>
  endpointTileX === null || endpointTileY === null
    ? 'pending'
    : `${Math.abs(endpointTileX - anchorTileX) + 1}x${Math.abs(endpointTileY - anchorTileY) + 1} tiles`;

const countVisitedTiles = (walk: (visit: (tileX: number, tileY: number) => void) => void): number => {
  let tileCount = 0;
  walk(() => {
    tileCount += 1;
  });
  return tileCount;
};

const countLinePreviewTiles = (startTileX: number, startTileY: number, endTileX: number, endTileY: number): number =>
  countVisitedTiles((visit) => {
    walkLineSteppedTilePath(startTileX, startTileY, endTileX, endTileY, visit);
  });

const countFilledRectPreviewTiles = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): number =>
  countVisitedTiles((visit) => {
    walkFilledRectangleTileArea(startTileX, startTileY, endTileX, endTileY, visit);
  });

const countRectOutlinePreviewTiles = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): number =>
  countVisitedTiles((visit) => {
    walkRectangleOutlineTileArea(startTileX, startTileY, endTileX, endTileY, visit);
  });

const countFilledEllipsePreviewTiles = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): number =>
  countVisitedTiles((visit) => {
    walkFilledEllipseTileArea(startTileX, startTileY, endTileX, endTileY, visit);
  });

const countEllipseOutlinePreviewTiles = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): number =>
  countVisitedTiles((visit) => {
    walkEllipseOutlineTileArea(startTileX, startTileY, endTileX, endTileY, visit);
  });

const buildActivePreviewSummary = (
  anchorTileX: number,
  anchorTileY: number,
  endpointTileX: number | null,
  endpointTileY: number | null,
  affectedTileCount: number | null
): ActiveDebugToolPreviewSummary => ({
  anchorTileX,
  anchorTileY,
  endpointTileX,
  endpointTileY,
  affectedTileCount
});

const resolveActiveDebugToolPreviewSummary = (
  preview: ArmedDebugToolPreviewState,
  endpointTileX: number | null,
  endpointTileY: number | null
): ActiveDebugToolPreviewSummary | null => {
  if (preview.activeMouseLineDrag) {
    return buildActivePreviewSummary(
      preview.activeMouseLineDrag.startTileX,
      preview.activeMouseLineDrag.startTileY,
      endpointTileX,
      endpointTileY,
      endpointTileX === null || endpointTileY === null
        ? null
        : countLinePreviewTiles(
            preview.activeMouseLineDrag.startTileX,
            preview.activeMouseLineDrag.startTileY,
            endpointTileX,
            endpointTileY
          )
    );
  }

  if (preview.activeMouseRectDrag) {
    return buildActivePreviewSummary(
      preview.activeMouseRectDrag.startTileX,
      preview.activeMouseRectDrag.startTileY,
      endpointTileX,
      endpointTileY,
      endpointTileX === null || endpointTileY === null
        ? null
        : countFilledRectPreviewTiles(
            preview.activeMouseRectDrag.startTileX,
            preview.activeMouseRectDrag.startTileY,
            endpointTileX,
            endpointTileY
          )
    );
  }

  if (preview.activeMouseRectOutlineDrag) {
    return buildActivePreviewSummary(
      preview.activeMouseRectOutlineDrag.startTileX,
      preview.activeMouseRectOutlineDrag.startTileY,
      endpointTileX,
      endpointTileY,
      endpointTileX === null || endpointTileY === null
        ? null
        : countRectOutlinePreviewTiles(
            preview.activeMouseRectOutlineDrag.startTileX,
            preview.activeMouseRectOutlineDrag.startTileY,
            endpointTileX,
            endpointTileY
          )
    );
  }

  if (preview.activeMouseEllipseDrag) {
    return buildActivePreviewSummary(
      preview.activeMouseEllipseDrag.startTileX,
      preview.activeMouseEllipseDrag.startTileY,
      endpointTileX,
      endpointTileY,
      endpointTileX === null || endpointTileY === null
        ? null
        : countFilledEllipsePreviewTiles(
            preview.activeMouseEllipseDrag.startTileX,
            preview.activeMouseEllipseDrag.startTileY,
            endpointTileX,
            endpointTileY
          )
    );
  }

  if (preview.activeMouseEllipseOutlineDrag) {
    return buildActivePreviewSummary(
      preview.activeMouseEllipseOutlineDrag.startTileX,
      preview.activeMouseEllipseOutlineDrag.startTileY,
      endpointTileX,
      endpointTileY,
      endpointTileX === null || endpointTileY === null
        ? null
        : countEllipseOutlinePreviewTiles(
            preview.activeMouseEllipseOutlineDrag.startTileX,
            preview.activeMouseEllipseOutlineDrag.startTileY,
            endpointTileX,
            endpointTileY
          )
    );
  }

  if (preview.pendingTouchLineStart) {
    return buildActivePreviewSummary(
      preview.pendingTouchLineStart.tileX,
      preview.pendingTouchLineStart.tileY,
      null,
      null,
      null
    );
  }

  if (preview.pendingTouchRectStart) {
    return buildActivePreviewSummary(
      preview.pendingTouchRectStart.tileX,
      preview.pendingTouchRectStart.tileY,
      null,
      null,
      null
    );
  }

  if (preview.pendingTouchRectOutlineStart) {
    return buildActivePreviewSummary(
      preview.pendingTouchRectOutlineStart.tileX,
      preview.pendingTouchRectOutlineStart.tileY,
      null,
      null,
      null
    );
  }

  if (preview.pendingTouchEllipseStart) {
    return buildActivePreviewSummary(
      preview.pendingTouchEllipseStart.tileX,
      preview.pendingTouchEllipseStart.tileY,
      null,
      null,
      null
    );
  }

  if (preview.pendingTouchEllipseOutlineStart) {
    return buildActivePreviewSummary(
      preview.pendingTouchEllipseOutlineStart.tileX,
      preview.pendingTouchEllipseOutlineStart.tileY,
      null,
      null,
      null
    );
  }

  return null;
};

const formatPreviewCoordinatesText = (
  anchorTileX: number,
  anchorTileY: number,
  endpointTileX: number | null,
  endpointTileY: number | null,
  affectedTileCount: number | null
): string => {
  const endpointText =
    endpointTileX === null || endpointTileY === null
      ? 'pending'
      : formatTileCoordinatePair(endpointTileX, endpointTileY);
  return (
    `Preview: anchor ${formatTileCoordinatePair(anchorTileX, anchorTileY)}` +
    ` | endpoint ${endpointText}` +
    ` | span ${formatPreviewSpanText(anchorTileX, anchorTileY, endpointTileX, endpointTileY)}` +
    ` | affects ${formatEstimatedAffectedTileCount(affectedTileCount)}`
  );
};

export const buildActiveDebugToolPreviewBadgeText = (
  preview: ArmedDebugToolPreviewState,
  endpointTile:
    | {
        tileX: number;
        tileY: number;
      }
    | null
): string | null => {
  const summary = resolveActiveDebugToolPreviewSummary(
    preview,
    endpointTile?.tileX ?? null,
    endpointTile?.tileY ?? null
  );
  if (!summary) return null;
  return formatPreviewCoordinatesText(
    summary.anchorTileX,
    summary.anchorTileY,
    summary.endpointTileX,
    summary.endpointTileY,
    summary.affectedTileCount
  );
};

export const buildPendingTouchAnchorLabelText = (preview: ArmedDebugToolPreviewState): string | null => {
  if (preview.pendingTouchLineStart) {
    return formatPendingTouchAnchorLabel(
      'Line',
      preview.pendingTouchLineStart.kind,
      'start',
      preview.pendingTouchLineStart.tileX,
      preview.pendingTouchLineStart.tileY
    );
  }

  if (preview.pendingTouchRectStart) {
    return formatPendingTouchAnchorLabel(
      'Rect Fill',
      preview.pendingTouchRectStart.kind,
      'corner',
      preview.pendingTouchRectStart.tileX,
      preview.pendingTouchRectStart.tileY
    );
  }

  if (preview.pendingTouchRectOutlineStart) {
    return formatPendingTouchAnchorLabel(
      'Rect Outline',
      preview.pendingTouchRectOutlineStart.kind,
      'corner',
      preview.pendingTouchRectOutlineStart.tileX,
      preview.pendingTouchRectOutlineStart.tileY
    );
  }

  if (preview.pendingTouchEllipseStart) {
    return formatPendingTouchAnchorLabel(
      'Ellipse Fill',
      preview.pendingTouchEllipseStart.kind,
      'corner',
      preview.pendingTouchEllipseStart.tileX,
      preview.pendingTouchEllipseStart.tileY
    );
  }

  if (preview.pendingTouchEllipseOutlineStart) {
    return formatPendingTouchAnchorLabel(
      'Ellipse Outline',
      preview.pendingTouchEllipseOutlineStart.kind,
      'corner',
      preview.pendingTouchEllipseOutlineStart.tileX,
      preview.pendingTouchEllipseOutlineStart.tileY
    );
  }

  return null;
};

const formatInspectOffsetLine = (
  hoveredTile: DebugEditHoveredTileState,
  pinnedTile: DebugEditHoveredTileState
): string =>
  `Offset: Hover->Pinned x:${formatSignedOffset(pinnedTile.tileX - hoveredTile.tileX)}` +
  ` y:${formatSignedOffset(pinnedTile.tileY - hoveredTile.tileY)}`;

const buildHoveredTileText = (
  hoveredTile: DebugEditHoveredTileState | null,
  pinnedTile: DebugEditHoveredTileState | null
): string => {
  if (pinnedTile && hoveredTile && !hasSameInspectTarget(hoveredTile, pinnedTile)) {
    return [
      formatInspectTileLine('Pinned', pinnedTile),
      formatInspectTileLine('Hover', hoveredTile),
      formatInspectOffsetLine(hoveredTile, pinnedTile)
    ].join('\n');
  }

  if (pinnedTile && hoveredTile) {
    return formatInspectTileLine('Shared', pinnedTile);
  }

  if (pinnedTile) {
    return formatInspectTileLine('Pinned', pinnedTile);
  }

  if (!hoveredTile) {
    return joinHintSegments(
      'Hover: move cursor',
      'touch a world tile',
      'inspect gameplay flags',
      'Pin Click keeps metadata visible'
    );
  }

  return formatInspectTileLine('Hover', hoveredTile);
};

const buildInspectText = (state: DebugEditStatusStripState): string => {
  if (state.desktopInspectPinArmed) return 'Inspect: Click-to-pin armed';
  if (state.pinnedTile && hasSameInspectTarget(state.hoveredTile, state.pinnedTile)) {
    return `Inspect: Shared @ ${state.pinnedTile.tileX},${state.pinnedTile.tileY}`;
  }
  if (state.pinnedTile) {
    return `Inspect: Pinned @ ${state.pinnedTile.tileX},${state.pinnedTile.tileY}`;
  }
  return 'Inspect: Hover only';
};

const buildInspectActionText = (state: DebugEditStatusStripState): string => {
  if (state.desktopInspectPinArmed) return 'Cancel Pin Click';
  if (state.pinnedTile) return 'Repin Click';
  return 'Pin Click';
};

const buildPreviewText = (
  preview: ArmedDebugToolPreviewState,
  hoveredTile: DebugEditHoveredTileState | null
): string | null => {
  const summary = resolveActiveDebugToolPreviewSummary(
    preview,
    hoveredTile?.tileX ?? null,
    hoveredTile?.tileY ?? null
  );
  if (!summary) return null;
  return formatPreviewCoordinatesText(
    summary.anchorTileX,
    summary.anchorTileY,
    summary.endpointTileX,
    summary.endpointTileY,
    summary.affectedTileCount
  );
};

export const buildDebugEditStatusStripModel = (
  state: DebugEditStatusStripState
): DebugEditStatusStripModel => {
  const activeToolStatus = resolveActiveDebugToolStatus(state.preview);
  const playerPlaceholderPoseLabel = state.playerPlaceholderPoseLabel ?? null;
  const playerWorldPosition = state.playerWorldPosition ?? null;
  const playerWorldTile = state.playerWorldTile ?? null;
  const playerSpawn = state.playerSpawn ?? null;
  const playerAabb = state.playerAabb ?? null;
  const playerCameraWorldPosition = state.playerCameraWorldPosition ?? null;
  const playerCameraWorldTile = state.playerCameraWorldTile ?? null;
  const playerCameraWorldChunk = state.playerCameraWorldChunk ?? null;
  const playerCameraWorldLocalTile = state.playerCameraWorldLocalTile ?? null;
  const playerCameraFocusPoint = state.playerCameraFocusPoint ?? null;
  const playerCameraFocusTile = state.playerCameraFocusTile ?? null;
  const playerCameraFocusChunk = state.playerCameraFocusChunk ?? null;
  const playerCameraFocusLocalTile = state.playerCameraFocusLocalTile ?? null;
  const playerCameraFollowOffset = state.playerCameraFollowOffset ?? null;
  const playerCameraZoom = state.playerCameraZoom ?? null;
  const residentDirtyLightChunks = state.residentDirtyLightChunks ?? null;
  const residentActiveLiquidChunks = state.residentActiveLiquidChunks ?? null;
  const residentSleepingLiquidChunks = state.residentSleepingLiquidChunks ?? null;
  const residentActiveLiquidMinChunkX = state.residentActiveLiquidMinChunkX ?? null;
  const residentActiveLiquidMinChunkY = state.residentActiveLiquidMinChunkY ?? null;
  const residentActiveLiquidMaxChunkX = state.residentActiveLiquidMaxChunkX ?? null;
  const residentActiveLiquidMaxChunkY = state.residentActiveLiquidMaxChunkY ?? null;
  const residentSleepingLiquidMinChunkX = state.residentSleepingLiquidMinChunkX ?? null;
  const residentSleepingLiquidMinChunkY = state.residentSleepingLiquidMinChunkY ?? null;
  const residentSleepingLiquidMaxChunkX = state.residentSleepingLiquidMaxChunkX ?? null;
  const residentSleepingLiquidMaxChunkY = state.residentSleepingLiquidMaxChunkY ?? null;
  const liquidStepSidewaysCandidateMinChunkX = state.liquidStepSidewaysCandidateMinChunkX ?? null;
  const liquidStepSidewaysCandidateMinChunkY = state.liquidStepSidewaysCandidateMinChunkY ?? null;
  const liquidStepSidewaysCandidateMaxChunkX = state.liquidStepSidewaysCandidateMaxChunkX ?? null;
  const liquidStepSidewaysCandidateMaxChunkY = state.liquidStepSidewaysCandidateMaxChunkY ?? null;
  const liquidStepPhaseSummary = state.liquidStepPhaseSummary ?? null;
  const liquidStepDownwardActiveChunksScanned =
    state.liquidStepDownwardActiveChunksScanned ?? null;
  const liquidStepSidewaysCandidateChunksScanned =
    state.liquidStepSidewaysCandidateChunksScanned ?? null;
  const liquidStepSidewaysPairsTested = state.liquidStepSidewaysPairsTested ?? null;
  const liquidStepDownwardTransfersApplied = state.liquidStepDownwardTransfersApplied ?? null;
  const liquidStepSidewaysTransfersApplied = state.liquidStepSidewaysTransfersApplied ?? null;
  const playerNearbyLightLevel = state.playerNearbyLightLevel ?? null;
  const playerNearbyLightFactor = state.playerNearbyLightFactor ?? null;
  const playerNearbyLightSourceTile = state.playerNearbyLightSourceTile ?? null;
  const playerNearbyLightSourceChunk = state.playerNearbyLightSourceChunk ?? null;
  const playerNearbyLightSourceLocalTile = state.playerNearbyLightSourceLocalTile ?? null;
  const playerCeilingBonkHoldActive = state.playerCeilingBonkHoldActive ?? null;
  const playerGrounded = state.playerGrounded ?? null;
  const playerFacing = state.playerFacing ?? null;
  const playerMoveX = state.playerMoveX ?? null;
  const playerVelocityX = state.playerVelocityX ?? null;
  const playerVelocityY = state.playerVelocityY ?? null;
  const playerJumpHeld = state.playerJumpHeld ?? null;
  const playerJumpPressed = state.playerJumpPressed ?? null;
  const playerSupportContact = state.playerSupportContact ?? null;
  const playerWallContact = state.playerWallContact ?? null;
  const playerCeilingContact = state.playerCeilingContact ?? null;
  const playerGroundedTransition = state.playerGroundedTransition ?? null;
  const playerFacingTransition = state.playerFacingTransition ?? null;
  const playerRespawn = state.playerRespawn ?? null;
  const playerWallContactTransition = state.playerWallContactTransition ?? null;
  const playerCeilingContactTransition = state.playerCeilingContactTransition ?? null;

  return {
    modeText: `Mode: ${formatTouchDebugEditModeLabel(state.mode)}`,
    brushText: `Brush: ${state.brushLabel} (#${state.brushTileId})`,
    toolText: activeToolStatus ? `Tool: ${activeToolStatus.title}` : 'Tool: No one-shot armed',
    previewText: buildPreviewText(state.preview, state.hoveredTile),
    playerText: buildPlayerText(
      playerPlaceholderPoseLabel,
      playerWorldPosition,
      playerWorldTile,
      playerSpawn,
      playerAabb,
      playerCameraWorldPosition,
      playerCameraWorldTile,
      playerCameraWorldChunk,
      playerCameraWorldLocalTile,
      playerCameraFocusPoint,
      playerCameraFocusTile,
      playerCameraFocusChunk,
      playerCameraFocusLocalTile,
      playerCameraFollowOffset,
      playerCameraZoom,
      residentDirtyLightChunks,
      residentActiveLiquidChunks,
      residentSleepingLiquidChunks,
      residentActiveLiquidMinChunkX,
      residentActiveLiquidMinChunkY,
      residentActiveLiquidMaxChunkX,
      residentActiveLiquidMaxChunkY,
      residentSleepingLiquidMinChunkX,
      residentSleepingLiquidMinChunkY,
      residentSleepingLiquidMaxChunkX,
      residentSleepingLiquidMaxChunkY,
      liquidStepSidewaysCandidateMinChunkX,
      liquidStepSidewaysCandidateMinChunkY,
      liquidStepSidewaysCandidateMaxChunkX,
      liquidStepSidewaysCandidateMaxChunkY,
      liquidStepPhaseSummary,
      liquidStepDownwardActiveChunksScanned,
      liquidStepSidewaysCandidateChunksScanned,
      liquidStepSidewaysPairsTested,
      liquidStepDownwardTransfersApplied,
      liquidStepSidewaysTransfersApplied,
      playerNearbyLightLevel,
      playerNearbyLightFactor,
      playerNearbyLightSourceTile,
      playerNearbyLightSourceChunk,
      playerNearbyLightSourceLocalTile,
      playerCeilingBonkHoldActive,
      playerGrounded,
      playerFacing,
      playerMoveX,
      playerVelocityX,
      playerVelocityY,
      playerJumpHeld,
      playerJumpPressed,
      playerSupportContact,
      playerWallContact,
      playerCeilingContact
    ),
    eventText: buildEventText(
      playerGroundedTransition,
      playerFacingTransition,
      playerRespawn,
      playerWallContactTransition,
      playerCeilingContactTransition
    ),
    inspectText: buildInspectText(state),
    hoverText: buildHoveredTileText(state.hoveredTile, state.pinnedTile),
    hintText: activeToolStatus
      ? activeToolStatus.detail
      : state.desktopInspectPinArmed
        ? buildArmedDesktopInspectHintText(state.pinnedTile !== null)
        : state.pinnedTile
          ? buildPinnedInspectHintText(state.mode)
          : buildIdleHintText(state.mode),
    inspectActionText: buildInspectActionText(state),
    clearActionText: state.pinnedTile ? 'Clear Pin' : null,
    toolAccent: activeToolStatus?.accent ?? NEUTRAL_TOOL_ACCENT,
    inspectAccent: state.desktopInspectPinArmed || state.pinnedTile ? INSPECT_ACTIVE_ACCENT : INSPECT_IDLE_ACCENT
  };
};
