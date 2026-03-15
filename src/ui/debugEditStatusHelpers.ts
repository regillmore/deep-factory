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
import {
  isWorldSessionTelemetryTypeVisible,
  type WorldSessionTelemetryState,
  type WorldSessionTelemetryTypeId
} from '../mainWorldSessionTelemetryState';
import { worldToChunkCoord, worldToLocalTile } from '../world/chunkMath';
import { MAX_LIGHT_LEVEL, MAX_LIQUID_LEVEL } from '../world/constants';
import type { LiquidSurfaceBranchKind } from '../world/liquidSurface';
import type { PlayerCeilingContactTransitionKind } from '../world/playerCeilingContactTransition';
import type { PlayerFacingTransitionKind } from '../world/playerFacingTransition';
import type { PlayerGroundedTransitionKind } from '../world/playerGroundedTransition';
import type { PlayerRespawnEventKind } from '../world/playerRespawnEvent';
import type { PlayerSpawnLiquidSafetyStatus } from '../world/playerSpawn';
import type { HostileSlimeFacing, HostileSlimeLaunchKind } from '../world/hostileSlimeState';
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
  playerHealth?: number | null;
  playerRespawnSecondsRemaining?: number | null;
  playerDeathHoldStatus?: 'none' | 'holding' | 'respawned' | null;
  playerBreathSecondsRemaining?: number | null;
  playerDrowningDamageTickSecondsRemaining?: number | null;
  playerFallDamageRecoverySecondsRemaining?: number | null;
  playerHostileContactInvulnerabilitySecondsRemaining?: number | null;
  hostileSlimeActiveCount?: number | null;
  hostileSlimeNextSpawnTicksRemaining?: number | null;
  hostileSlimeNextSpawnWindowIndex?: number | null;
  hostileSlimeNextSpawnWindowOffsetTiles?: number | null;
  hostileSlimeWorldTile?: { x: number; y: number } | null;
  hostileSlimeVelocity?: { x: number; y: number } | null;
  hostileSlimeGrounded?: boolean | null;
  hostileSlimeFacing?: HostileSlimeFacing | null;
  hostileSlimeHopCooldownTicksRemaining?: number | null;
  hostileSlimeLaunchKind?: HostileSlimeLaunchKind | null;
  playerGrounded?: boolean | null;
  playerFacing?: PlayerFacing | null;
  playerMoveX?: -1 | 0 | 1 | null;
  playerVelocityX?: number | null;
  playerVelocityY?: number | null;
  playerJumpHeld?: boolean | null;
  playerJumpPressed?: boolean | null;
  playerRopeDropActive?: boolean | null;
  playerRopeDropWindowArmed?: boolean | null;
  playerSupportContact?: DebugEditStatusStripPlayerSupportContactTelemetry | null;
  playerWallContact?: DebugEditStatusStripPlayerWallContactTelemetry | null;
  playerCeilingContact?: DebugEditStatusStripPlayerCeilingContactTelemetry | null;
  playerGroundedTransition?: DebugEditStatusStripPlayerGroundedTransitionTelemetry | null;
  playerFacingTransition?: DebugEditStatusStripPlayerFacingTransitionTelemetry | null;
  playerRespawn?: DebugEditStatusStripPlayerRespawnTelemetry | null;
  playerLandingDamageEvent?: DebugEditStatusStripPlayerLandingDamageEventTelemetry | null;
  playerHostileContactEvent?: DebugEditStatusStripPlayerHostileContactEventTelemetry | null;
  playerWallContactTransition?: DebugEditStatusStripPlayerWallContactTransitionTelemetry | null;
  playerCeilingContactTransition?: DebugEditStatusStripPlayerCeilingContactTransitionTelemetry | null;
  telemetryState?: WorldSessionTelemetryState | null;
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

export interface DebugEditStatusStripPlayerHostileContactEventTelemetry {
  damageApplied: number;
  blockedByInvulnerability: boolean;
}

export interface DebugEditStatusStripPlayerLandingDamageEventTelemetry {
  damageApplied: number;
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

const formatLiveRopeDropActiveText = (playerRopeDropActive: boolean | null): string | null => {
  if (playerRopeDropActive === null) {
    return null;
  }

  return `RopeDropActiveNow: ${formatGameplayFlag(playerRopeDropActive)}`;
};

const formatLiveRopeDropWindowArmedText = (
  playerRopeDropWindowArmed: boolean | null
): string | null => {
  if (playerRopeDropWindowArmed === null) {
    return null;
  }

  return `RopeDropWindowNow: ${formatGameplayFlag(playerRopeDropWindowArmed)}`;
};

const formatLiveCeilingBonkHoldText = (playerCeilingBonkHoldActive: boolean | null): string | null => {
  if (playerCeilingBonkHoldActive === null) {
    return null;
  }

  return `BonkHold: ${formatGameplayFlag(playerCeilingBonkHoldActive)}`;
};

const formatLiveHealthText = (playerHealth: number | null): string | null => {
  if (playerHealth === null) {
    return null;
  }

  return `HealthNow: ${Math.round(playerHealth)}`;
};

const formatLiveRespawnCountdownText = (playerRespawnSecondsRemaining: number | null): string | null => {
  if (playerRespawnSecondsRemaining === null) {
    return null;
  }

  return `RespawnIn: ${playerRespawnSecondsRemaining.toFixed(2)}s`;
};

const formatLiveDeathHoldStatusText = (
  playerDeathHoldStatus: DebugEditStatusStripState['playerDeathHoldStatus']
): string | null => {
  if (
    playerDeathHoldStatus !== 'none' &&
    playerDeathHoldStatus !== 'holding' &&
    playerDeathHoldStatus !== 'respawned'
  ) {
    return null;
  }

  return `DeathHold: ${playerDeathHoldStatus}`;
};

const formatLiveBreathText = (playerBreathSecondsRemaining: number | null): string | null => {
  if (playerBreathSecondsRemaining === null) {
    return null;
  }

  return `BreathNow: ${playerBreathSecondsRemaining.toFixed(2)}s`;
};

const formatLiveDrowningCooldownText = (
  playerDrowningDamageTickSecondsRemaining: number | null
): string | null => {
  if (playerDrowningDamageTickSecondsRemaining === null) {
    return null;
  }

  return `DrownCooldownNow: ${playerDrowningDamageTickSecondsRemaining.toFixed(2)}s`;
};

const formatLiveFallRecoveryText = (
  playerFallDamageRecoverySecondsRemaining: number | null
): string | null => {
  if (playerFallDamageRecoverySecondsRemaining === null) {
    return null;
  }

  return `FallRecoveryNow: ${playerFallDamageRecoverySecondsRemaining.toFixed(2)}s`;
};

const formatLiveHostileContactInvulnerabilityText = (
  playerHostileContactInvulnerabilitySecondsRemaining: number | null
): string | null => {
  if (playerHostileContactInvulnerabilitySecondsRemaining === null) {
    return null;
  }

  return `ContactInvulnNow: ${playerHostileContactInvulnerabilitySecondsRemaining.toFixed(2)}s`;
};

const formatLiveHostileSlimeGroundedText = (hostileSlimeGrounded: boolean | null): string | null => {
  if (hostileSlimeGrounded === null) {
    return null;
  }

  return `SlimeGroundedNow: ${formatGameplayFlag(hostileSlimeGrounded)}`;
};

const formatLiveHostileSlimeActiveCountText = (hostileSlimeActiveCount: number | null): string | null => {
  if (hostileSlimeActiveCount === null) {
    return null;
  }

  return `SlimeActiveNow: ${Math.max(0, Math.round(hostileSlimeActiveCount))}`;
};

const formatLiveHostileSlimeNextSpawnText = (
  hostileSlimeNextSpawnTicksRemaining: number | null
): string | null => {
  if (hostileSlimeNextSpawnTicksRemaining === null) {
    return null;
  }

  return `SlimeSpawnCooldownNow: ${Math.max(0, Math.round(hostileSlimeNextSpawnTicksRemaining))}t`;
};

const formatLiveHostileSlimeNextSpawnWindowIndexText = (
  hostileSlimeNextSpawnWindowIndex: number | null
): string | null => {
  if (hostileSlimeNextSpawnWindowIndex === null) {
    return null;
  }

  return `SlimeSpawnWindowNow: ${Math.max(0, Math.round(hostileSlimeNextSpawnWindowIndex))}`;
};

const formatLiveHostileSlimeNextSpawnWindowOffsetText = (
  hostileSlimeNextSpawnWindowOffsetTiles: number | null
): string | null => {
  if (hostileSlimeNextSpawnWindowOffsetTiles === null) {
    return null;
  }

  return `SlimeSpawnOffsetNow: ${formatSignedOffset(Math.round(hostileSlimeNextSpawnWindowOffsetTiles))} tiles`;
};

const formatLiveHostileSlimeWorldTileText = (
  hostileSlimeWorldTile: { x: number; y: number } | null
): string | null => {
  if (hostileSlimeWorldTile === null) {
    return null;
  }

  return `SlimeTileNow: ${formatTileCoordinatePair(hostileSlimeWorldTile.x, hostileSlimeWorldTile.y)}`;
};

const formatLiveHostileSlimeVelocityText = (
  hostileSlimeVelocity: { x: number; y: number } | null
): string | null => {
  if (hostileSlimeVelocity === null) {
    return null;
  }

  return `SlimeVelNow: ${hostileSlimeVelocity.x.toFixed(2)},${hostileSlimeVelocity.y.toFixed(2)}`;
};

const formatLiveHostileSlimeFacingText = (
  hostileSlimeFacing: HostileSlimeFacing | null
): string | null => {
  if (hostileSlimeFacing === null) {
    return null;
  }

  return `SlimeFacingNow: ${hostileSlimeFacing}`;
};

const formatLiveHostileSlimeHopCooldownText = (
  hostileSlimeHopCooldownTicksRemaining: number | null
): string | null => {
  if (hostileSlimeHopCooldownTicksRemaining === null) {
    return null;
  }

  return `SlimeHopCooldownNow: ${Math.max(0, Math.round(hostileSlimeHopCooldownTicksRemaining))}t`;
};

const formatLiveHostileSlimeLaunchKindText = (
  hostileSlimeLaunchKind: HostileSlimeLaunchKind | null
): string | null => {
  if (hostileSlimeLaunchKind === null) {
    return null;
  }

  return `SlimeLaunchNow: ${hostileSlimeLaunchKind}`;
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

type TelemetryVisibilityResolver = (typeId: WorldSessionTelemetryTypeId) => boolean;

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
  playerHealth: number | null,
  playerRespawnSecondsRemaining: number | null,
  playerDeathHoldStatus: DebugEditStatusStripState['playerDeathHoldStatus'],
  playerBreathSecondsRemaining: number | null,
  playerDrowningDamageTickSecondsRemaining: number | null,
  playerFallDamageRecoverySecondsRemaining: number | null,
  playerHostileContactInvulnerabilitySecondsRemaining: number | null,
  hostileSlimeActiveCount: number | null,
  hostileSlimeNextSpawnTicksRemaining: number | null,
  hostileSlimeNextSpawnWindowIndex: number | null,
  hostileSlimeNextSpawnWindowOffsetTiles: number | null,
  hostileSlimeWorldTile: { x: number; y: number } | null,
  hostileSlimeVelocity: { x: number; y: number } | null,
  hostileSlimeGrounded: boolean | null,
  hostileSlimeFacing: HostileSlimeFacing | null,
  hostileSlimeHopCooldownTicksRemaining: number | null,
  hostileSlimeLaunchKind: HostileSlimeLaunchKind | null,
  playerGrounded: boolean | null,
  playerFacing: PlayerFacing | null,
  playerMoveX: -1 | 0 | 1 | null,
  playerVelocityX: number | null,
  playerVelocityY: number | null,
  playerJumpHeld: boolean | null,
  playerJumpPressed: boolean | null,
  playerRopeDropActive: boolean | null,
  playerRopeDropWindowArmed: boolean | null,
  playerSupportContact: DebugEditStatusStripPlayerSupportContactTelemetry | null,
  playerWallContact: DebugEditStatusStripPlayerWallContactTelemetry | null,
  playerCeilingContact: DebugEditStatusStripPlayerCeilingContactTelemetry | null,
  telemetryVisible: TelemetryVisibilityResolver
): string | null => {
  const playerLines = [
    telemetryVisible('player-presentation')
      ? playerPlaceholderPoseLabel
        ? `Pose: ${playerPlaceholderPoseLabel}`
        : null
      : null,
    telemetryVisible('player-motion') ? formatLiveWorldPositionText(playerWorldPosition) : null,
    telemetryVisible('player-motion') ? formatLiveWorldTileText(playerWorldTile) : null,
    telemetryVisible('player-motion') ? formatLiveWorldChunkText(playerWorldTile) : null,
    telemetryVisible('player-motion')
      ? formatLiveWorldChunkLocalTileText(playerWorldTile)
      : null,
    telemetryVisible('player-spawn') ? formatLivePlayerSpawnText(playerSpawn) : null,
    telemetryVisible('player-spawn') ? formatLivePlayerSpawnSupportText(playerSpawn) : null,
    telemetryVisible('player-collision') ? formatLiveAabbText(playerAabb) : null,
    telemetryVisible('player-camera')
      ? formatLiveCameraWorldPositionText(playerCameraWorldPosition)
      : null,
    telemetryVisible('player-camera') ? formatLiveCameraWorldTileText(playerCameraWorldTile) : null,
    telemetryVisible('player-camera')
      ? formatLiveCameraWorldChunkText(playerCameraWorldChunk)
      : null,
    telemetryVisible('player-camera')
      ? formatLiveCameraWorldChunkLocalTileText(playerCameraWorldLocalTile)
      : null,
    telemetryVisible('player-camera')
      ? formatLiveCameraFocusPointText(playerCameraFocusPoint)
      : null,
    telemetryVisible('player-camera') ? formatLiveCameraFocusTileText(playerCameraFocusTile) : null,
    telemetryVisible('player-camera')
      ? formatLiveCameraFocusChunkText(playerCameraFocusChunk)
      : null,
    telemetryVisible('player-camera')
      ? formatLiveCameraFocusChunkLocalTileText(playerCameraFocusLocalTile)
      : null,
    telemetryVisible('player-camera')
      ? formatLiveCameraFollowOffsetText(playerCameraFollowOffset)
      : null,
    telemetryVisible('player-camera') ? formatLiveCameraZoomText(playerCameraZoom) : null,
    telemetryVisible('world-lighting')
      ? formatLiveResidentDirtyLightChunksText(residentDirtyLightChunks)
      : null,
    telemetryVisible('world-liquid')
      ? formatLiveResidentActiveLiquidChunksText(
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
        )
      : null,
    telemetryVisible('world-liquid')
      ? formatLiveLiquidStepSummaryText(
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
        )
      : null,
    telemetryVisible('world-lighting')
      ? formatLiveNearbyLightText(
          playerNearbyLightLevel,
          playerNearbyLightFactor,
          playerNearbyLightSourceTile,
          playerNearbyLightSourceChunk,
          playerNearbyLightSourceLocalTile
        )
      : null,
    telemetryVisible('player-presentation')
      ? formatLiveCeilingBonkHoldText(playerCeilingBonkHoldActive)
      : null,
    telemetryVisible('player-combat') ? formatLiveHealthText(playerHealth) : null,
    telemetryVisible('player-combat')
      ? formatLiveRespawnCountdownText(playerRespawnSecondsRemaining)
      : null,
    telemetryVisible('player-combat')
      ? formatLiveDeathHoldStatusText(playerDeathHoldStatus)
      : null,
    telemetryVisible('player-combat') ? formatLiveBreathText(playerBreathSecondsRemaining) : null,
    telemetryVisible('player-combat')
      ? formatLiveDrowningCooldownText(playerDrowningDamageTickSecondsRemaining)
      : null,
    telemetryVisible('player-combat')
      ? formatLiveFallRecoveryText(playerFallDamageRecoverySecondsRemaining)
      : null,
    telemetryVisible('player-combat')
      ? formatLiveHostileContactInvulnerabilityText(
          playerHostileContactInvulnerabilitySecondsRemaining
        )
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeActiveCountText(hostileSlimeActiveCount)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeNextSpawnText(hostileSlimeNextSpawnTicksRemaining)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeNextSpawnWindowIndexText(hostileSlimeNextSpawnWindowIndex)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeNextSpawnWindowOffsetText(hostileSlimeNextSpawnWindowOffsetTiles)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeWorldTileText(hostileSlimeWorldTile)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeVelocityText(hostileSlimeVelocity)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeGroundedText(hostileSlimeGrounded)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeFacingText(hostileSlimeFacing)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeHopCooldownText(hostileSlimeHopCooldownTicksRemaining)
      : null,
    telemetryVisible('hostile-slime-tracker')
      ? formatLiveHostileSlimeLaunchKindText(hostileSlimeLaunchKind)
      : null,
    telemetryVisible('player-motion') ? formatLiveGroundedText(playerGrounded) : null,
    telemetryVisible('player-motion') ? formatLiveFacingText(playerFacing) : null,
    telemetryVisible('player-motion') ? formatLiveMoveXText(playerMoveX) : null,
    telemetryVisible('player-motion') ? formatLiveVelocityXText(playerVelocityX) : null,
    telemetryVisible('player-motion') ? formatLiveVelocityYText(playerVelocityY) : null,
    telemetryVisible('player-motion')
      ? formatLiveSpeedMagnitudeText(playerVelocityX, playerVelocityY)
      : null,
    telemetryVisible('player-motion') ? formatLiveJumpHeldText(playerJumpHeld) : null,
    telemetryVisible('player-motion') ? formatLiveJumpPressedText(playerJumpPressed) : null,
    telemetryVisible('player-motion')
      ? formatLiveRopeDropActiveText(playerRopeDropActive)
      : null,
    telemetryVisible('player-motion')
      ? formatLiveRopeDropWindowArmedText(playerRopeDropWindowArmed)
      : null,
    telemetryVisible('player-collision')
      ? formatLiveSupportContactText(playerSupportContact)
      : null,
    telemetryVisible('player-collision') ? formatLiveWallContactText(playerWallContact) : null,
    telemetryVisible('player-collision')
      ? formatLiveCeilingContactText(playerCeilingContact)
      : null
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

const formatHostileContactEventText = (
  playerHostileContactEvent: DebugEditStatusStripPlayerHostileContactEventTelemetry | null
): string | null => {
  if (!playerHostileContactEvent) {
    return null;
  }

  return (
    `SlimeHit: damage ${Math.max(0, Math.round(playerHostileContactEvent.damageApplied))} | ` +
    `blocked ${formatGameplayFlag(playerHostileContactEvent.blockedByInvulnerability)}`
  );
};

const formatLandingDamageEventText = (
  playerLandingDamageEvent: DebugEditStatusStripPlayerLandingDamageEventTelemetry | null
): string | null => {
  if (!playerLandingDamageEvent) {
    return null;
  }

  return `LandingHit: damage ${Math.max(0, Math.round(playerLandingDamageEvent.damageApplied))}`;
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
  playerLandingDamageEvent: DebugEditStatusStripPlayerLandingDamageEventTelemetry | null,
  playerHostileContactEvent: DebugEditStatusStripPlayerHostileContactEventTelemetry | null,
  playerWallContactTransition: DebugEditStatusStripPlayerWallContactTransitionTelemetry | null,
  playerCeilingContactTransition: DebugEditStatusStripPlayerCeilingContactTransitionTelemetry | null,
  telemetryVisible: TelemetryVisibilityResolver
): string | null => {
  const eventLines = [
    telemetryVisible('player-events') ? formatGroundedTransitionEventText(playerGroundedTransition) : null,
    telemetryVisible('player-events') ? formatFacingTransitionEventText(playerFacingTransition) : null,
    telemetryVisible('player-events') ? formatRespawnEventText(playerRespawn) : null,
    telemetryVisible('player-combat')
      ? formatLandingDamageEventText(playerLandingDamageEvent)
      : null,
    telemetryVisible('player-combat') ? formatHostileContactEventText(playerHostileContactEvent) : null,
    telemetryVisible('player-events')
      ? formatWallContactTransitionEventText(playerWallContactTransition)
      : null,
    telemetryVisible('player-events')
      ? formatCeilingContactTransitionEventText(playerCeilingContactTransition)
      : null
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

const buildInspectTelemetryHiddenText = (
  pointerInspectVisible: boolean,
  pinnedInspectVisible: boolean,
  hasHoveredTile: boolean,
  hasPinnedTile: boolean
): string | null => {
  const hasHiddenHoveredTile = hasHoveredTile && !pointerInspectVisible;
  const hasHiddenPinnedTile = hasPinnedTile && !pinnedInspectVisible;

  if (hasHiddenHoveredTile && hasHiddenPinnedTile) {
    return 'Inspect details hidden by telemetry controls';
  }

  if (hasHiddenPinnedTile) {
    return 'Pinned inspect hidden by telemetry controls';
  }

  if (hasHiddenHoveredTile) {
    return 'Hover inspect hidden by telemetry controls';
  }

  return null;
};

const buildEmptyInspectHintText = (
  pointerInspectVisible: boolean,
  pinnedInspectVisible: boolean
): string => {
  if (pointerInspectVisible && pinnedInspectVisible) {
    return joinHintSegments(
      'Hover: move cursor',
      'touch a world tile',
      'inspect gameplay flags',
      'Pin Click keeps metadata visible'
    );
  }

  if (pointerInspectVisible) {
    return joinHintSegments(
      'Hover: move cursor',
      'touch a world tile',
      'inspect gameplay flags',
      'Pinned inspect hidden'
    );
  }

  if (pinnedInspectVisible) {
    return joinHintSegments('Inspect: hover hidden', 'Pin Click shows pinned metadata');
  }

  return 'Inspect details hidden by telemetry controls';
};

const buildHoveredTileText = (
  hoveredTile: DebugEditHoveredTileState | null,
  pinnedTile: DebugEditHoveredTileState | null,
  pointerInspectVisible: boolean,
  pinnedInspectVisible: boolean
): string => {
  const visibleHoveredTile = pointerInspectVisible ? hoveredTile : null;
  const visiblePinnedTile = pinnedInspectVisible ? pinnedTile : null;

  if (
    visiblePinnedTile &&
    visibleHoveredTile &&
    !hasSameInspectTarget(visibleHoveredTile, visiblePinnedTile)
  ) {
    return [
      formatInspectTileLine('Pinned', visiblePinnedTile),
      formatInspectTileLine('Hover', visibleHoveredTile),
      formatInspectOffsetLine(visibleHoveredTile, visiblePinnedTile)
    ].join('\n');
  }

  if (visiblePinnedTile && visibleHoveredTile) {
    return formatInspectTileLine('Shared', visiblePinnedTile);
  }

  if (visiblePinnedTile) {
    return formatInspectTileLine('Pinned', visiblePinnedTile);
  }

  if (visibleHoveredTile) {
    return formatInspectTileLine('Hover', visibleHoveredTile);
  }

  const hiddenInspectText = buildInspectTelemetryHiddenText(
    pointerInspectVisible,
    pinnedInspectVisible,
    hoveredTile !== null,
    pinnedTile !== null
  );
  if (hiddenInspectText !== null) {
    return hiddenInspectText;
  }

  return buildEmptyInspectHintText(pointerInspectVisible, pinnedInspectVisible);
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
  const playerHealth = state.playerHealth ?? null;
  const playerRespawnSecondsRemaining = state.playerRespawnSecondsRemaining ?? null;
  const playerDeathHoldStatus = state.playerDeathHoldStatus ?? null;
  const playerBreathSecondsRemaining = state.playerBreathSecondsRemaining ?? null;
  const playerDrowningDamageTickSecondsRemaining =
    state.playerDrowningDamageTickSecondsRemaining ?? null;
  const playerFallDamageRecoverySecondsRemaining =
    state.playerFallDamageRecoverySecondsRemaining ?? null;
  const playerHostileContactInvulnerabilitySecondsRemaining =
    state.playerHostileContactInvulnerabilitySecondsRemaining ?? null;
  const hostileSlimeActiveCount = state.hostileSlimeActiveCount ?? null;
  const hostileSlimeNextSpawnTicksRemaining = state.hostileSlimeNextSpawnTicksRemaining ?? null;
  const hostileSlimeNextSpawnWindowIndex = state.hostileSlimeNextSpawnWindowIndex ?? null;
  const hostileSlimeNextSpawnWindowOffsetTiles =
    state.hostileSlimeNextSpawnWindowOffsetTiles ?? null;
  const hostileSlimeWorldTile = state.hostileSlimeWorldTile ?? null;
  const hostileSlimeVelocity = state.hostileSlimeVelocity ?? null;
  const hostileSlimeGrounded = state.hostileSlimeGrounded ?? null;
  const hostileSlimeFacing = state.hostileSlimeFacing ?? null;
  const hostileSlimeHopCooldownTicksRemaining =
    state.hostileSlimeHopCooldownTicksRemaining ?? null;
  const hostileSlimeLaunchKind = state.hostileSlimeLaunchKind ?? null;
  const playerGrounded = state.playerGrounded ?? null;
  const playerFacing = state.playerFacing ?? null;
  const playerMoveX = state.playerMoveX ?? null;
  const playerVelocityX = state.playerVelocityX ?? null;
  const playerVelocityY = state.playerVelocityY ?? null;
  const playerJumpHeld = state.playerJumpHeld ?? null;
  const playerJumpPressed = state.playerJumpPressed ?? null;
  const playerRopeDropActive = state.playerRopeDropActive ?? null;
  const playerRopeDropWindowArmed = state.playerRopeDropWindowArmed ?? null;
  const playerSupportContact = state.playerSupportContact ?? null;
  const playerWallContact = state.playerWallContact ?? null;
  const playerCeilingContact = state.playerCeilingContact ?? null;
  const playerGroundedTransition = state.playerGroundedTransition ?? null;
  const playerFacingTransition = state.playerFacingTransition ?? null;
  const playerRespawn = state.playerRespawn ?? null;
  const playerLandingDamageEvent = state.playerLandingDamageEvent ?? null;
  const playerHostileContactEvent = state.playerHostileContactEvent ?? null;
  const playerWallContactTransition = state.playerWallContactTransition ?? null;
  const playerCeilingContactTransition = state.playerCeilingContactTransition ?? null;
  const telemetryState = state.telemetryState ?? null;
  const telemetryVisible: TelemetryVisibilityResolver = (typeId) =>
    telemetryState === null || isWorldSessionTelemetryTypeVisible(telemetryState, typeId);
  const pointerInspectVisible = telemetryVisible('inspect-pointer');
  const pinnedInspectVisible = telemetryVisible('inspect-pinned');

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
      playerHealth,
      playerRespawnSecondsRemaining,
      playerDeathHoldStatus,
      playerBreathSecondsRemaining,
      playerDrowningDamageTickSecondsRemaining,
      playerFallDamageRecoverySecondsRemaining,
      playerHostileContactInvulnerabilitySecondsRemaining,
      hostileSlimeActiveCount,
      hostileSlimeNextSpawnTicksRemaining,
      hostileSlimeNextSpawnWindowIndex,
      hostileSlimeNextSpawnWindowOffsetTiles,
      hostileSlimeWorldTile,
      hostileSlimeVelocity,
      hostileSlimeGrounded,
      hostileSlimeFacing,
      hostileSlimeHopCooldownTicksRemaining,
      hostileSlimeLaunchKind,
      playerGrounded,
      playerFacing,
      playerMoveX,
      playerVelocityX,
      playerVelocityY,
      playerJumpHeld,
      playerJumpPressed,
      playerRopeDropActive,
      playerRopeDropWindowArmed,
      playerSupportContact,
      playerWallContact,
      playerCeilingContact,
      telemetryVisible
    ),
    eventText: buildEventText(
      playerGroundedTransition,
      playerFacingTransition,
      playerRespawn,
      playerLandingDamageEvent,
      playerHostileContactEvent,
      playerWallContactTransition,
      playerCeilingContactTransition,
      telemetryVisible
    ),
    inspectText: buildInspectText(state),
    hoverText: buildHoveredTileText(
      state.hoveredTile,
      state.pinnedTile,
      pointerInspectVisible,
      pinnedInspectVisible
    ),
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
