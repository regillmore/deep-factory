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
import type { PlayerCeilingContactTransitionKind } from '../world/playerCeilingContactTransition';
import type { PlayerRespawnEventKind } from '../world/playerRespawnEvent';
import type { PlayerWallContactTransitionKind } from '../world/playerWallContactTransition';
import type { TileLiquidKind } from '../world/tileMetadata';

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
  playerRespawn?: DebugEditStatusStripPlayerRespawnTelemetry | null;
  playerWallContactTransition?: DebugEditStatusStripPlayerWallContactTransitionTelemetry | null;
  playerCeilingContactTransition?: DebugEditStatusStripPlayerCeilingContactTransitionTelemetry | null;
}

export interface DebugEditStatusStripModel {
  modeText: string;
  brushText: string;
  toolText: string;
  previewText: string | null;
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
}

export interface DebugEditStatusStripPlayerRespawnTelemetry {
  kind: PlayerRespawnEventKind;
  spawnTile: { x: number; y: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugEditStatusStripPlayerWallContactTransitionTelemetry {
  kind: PlayerWallContactTransitionKind;
  tile: { x: number; y: number; id: number };
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

const hasSameInspectTarget = (
  hoveredTile: DebugEditHoveredTileState | null,
  pinnedTile: DebugEditHoveredTileState | null
): boolean =>
  hoveredTile !== null &&
  pinnedTile !== null &&
  hoveredTile.tileX === pinnedTile.tileX &&
  hoveredTile.tileY === pinnedTile.tileY;

const formatInspectTileLine = (label: string, tile: DebugEditHoveredTileState): string =>
  `${label}: ${tile.tileLabel} (#${tile.tileId}) @ ${tile.tileX},${tile.tileY}` +
  ` chunk:${tile.chunkX},${tile.chunkY}` +
  ` local:${tile.localX},${tile.localY}` +
  ` | solid:${formatHoveredTileFlag(tile.solid)}` +
  ` | light:${formatHoveredTileFlag(tile.blocksLight)}` +
  ` | liquid:${tile.liquidKind ?? 'none'}`;

const formatSignedOffset = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

const formatTileCoordinatePair = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

const formatEstimatedAffectedTileCount = (tileCount: number | null): string =>
  tileCount === null ? 'pending' : `${tileCount} ${tileCount === 1 ? 'tile' : 'tiles'}`;

const formatRespawnEventText = (
  playerRespawn: DebugEditStatusStripPlayerRespawnTelemetry | null
): string | null => {
  if (!playerRespawn) {
    return null;
  }

  return (
    `Respawn: ${playerRespawn.kind} | ` +
    `spawn ${formatTileCoordinatePair(playerRespawn.spawnTile.x, playerRespawn.spawnTile.y)} | ` +
    `pos ${playerRespawn.position.x.toFixed(2)},${playerRespawn.position.y.toFixed(2)} | ` +
    `vel ${playerRespawn.velocity.x.toFixed(2)},${playerRespawn.velocity.y.toFixed(2)}`
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
    )} (#${playerWallContactTransition.tile.id}) | ` +
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
  playerRespawn: DebugEditStatusStripPlayerRespawnTelemetry | null,
  playerWallContactTransition: DebugEditStatusStripPlayerWallContactTransitionTelemetry | null,
  playerCeilingContactTransition: DebugEditStatusStripPlayerCeilingContactTransitionTelemetry | null
): string | null => {
  const eventLines = [
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
  const playerRespawn = state.playerRespawn ?? null;
  const playerWallContactTransition = state.playerWallContactTransition ?? null;
  const playerCeilingContactTransition = state.playerCeilingContactTransition ?? null;

  return {
    modeText: `Mode: ${formatTouchDebugEditModeLabel(state.mode)}`,
    brushText: `Brush: ${state.brushLabel} (#${state.brushTileId})`,
    toolText: activeToolStatus ? `Tool: ${activeToolStatus.title}` : 'Tool: No one-shot armed',
    previewText: buildPreviewText(state.preview, state.hoveredTile),
    eventText: buildEventText(
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
