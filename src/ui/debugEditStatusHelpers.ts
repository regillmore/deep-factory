import type { ArmedDebugToolPreviewState, DebugTileEditKind, TouchDebugEditMode } from '../input/controller';

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
}

export interface DebugEditStatusStripModel {
  modeText: string;
  brushText: string;
  toolText: string;
  hintText: string;
  toolAccent: string;
}

const NEUTRAL_TOOL_ACCENT = 'rgba(176, 190, 208, 0.9)';

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
      detail: 'drag endpoint, release to apply - Esc cancel',
      accent: lineAccentForKind(preview.activeMouseLineDrag.kind)
    };
  }

  if (preview.activeMouseRectDrag) {
    return {
      title: `${toolActionLabel('Rect Fill', preview.activeMouseRectDrag.kind)} armed`,
      detail: 'drag box, release to apply - Esc cancel',
      accent: rectAccentForKind(preview.activeMouseRectDrag.kind)
    };
  }

  if (preview.activeMouseRectOutlineDrag) {
    return {
      title: `${toolActionLabel('Rect Outline', preview.activeMouseRectOutlineDrag.kind)} armed`,
      detail: 'drag box, release to apply - Esc cancel',
      accent: rectOutlineAccentForKind(preview.activeMouseRectOutlineDrag.kind)
    };
  }

  if (preview.activeMouseEllipseDrag) {
    return {
      title: `${toolActionLabel('Ellipse Fill', preview.activeMouseEllipseDrag.kind)} armed`,
      detail: 'drag bounds, release to apply - Esc cancel',
      accent: ellipseAccentForKind(preview.activeMouseEllipseDrag.kind)
    };
  }

  if (preview.activeMouseEllipseOutlineDrag) {
    return {
      title: `${toolActionLabel('Ellipse Outline', preview.activeMouseEllipseOutlineDrag.kind)} armed`,
      detail: 'drag bounds, release to apply - Esc cancel',
      accent: ellipseOutlineAccentForKind(preview.activeMouseEllipseOutlineDrag.kind)
    };
  }

  if (preview.pendingTouchLineStart) {
    return {
      title: `${toolActionLabel('Line', preview.pendingTouchLineStart.kind)} armed`,
      detail: 'start set, tap end tile - Esc cancel',
      accent: lineAccentForKind(preview.pendingTouchLineStart.kind)
    };
  }

  if (preview.pendingTouchRectStart) {
    return {
      title: `${toolActionLabel('Rect Fill', preview.pendingTouchRectStart.kind)} armed`,
      detail: 'corner set, tap opposite corner - Esc cancel',
      accent: rectAccentForKind(preview.pendingTouchRectStart.kind)
    };
  }

  if (preview.pendingTouchRectOutlineStart) {
    return {
      title: `${toolActionLabel('Rect Outline', preview.pendingTouchRectOutlineStart.kind)} armed`,
      detail: 'corner set, tap opposite corner - Esc cancel',
      accent: rectOutlineAccentForKind(preview.pendingTouchRectOutlineStart.kind)
    };
  }

  if (preview.pendingTouchEllipseStart) {
    return {
      title: `${toolActionLabel('Ellipse Fill', preview.pendingTouchEllipseStart.kind)} armed`,
      detail: 'corner set, tap opposite corner - Esc cancel',
      accent: ellipseAccentForKind(preview.pendingTouchEllipseStart.kind)
    };
  }

  if (preview.pendingTouchEllipseOutlineStart) {
    return {
      title: `${toolActionLabel('Ellipse Outline', preview.pendingTouchEllipseOutlineStart.kind)} armed`,
      detail: 'corner set, tap opposite corner - Esc cancel',
      accent: ellipseOutlineAccentForKind(preview.pendingTouchEllipseOutlineStart.kind)
    };
  }

  if (preview.armedLineKind) {
    return {
      title: `${toolActionLabel('Line', preview.armedLineKind)} armed`,
      detail: 'drag (desktop) or tap start/end (touch) - Esc cancel',
      accent: lineAccentForKind(preview.armedLineKind)
    };
  }

  if (preview.armedRectKind) {
    return {
      title: `${toolActionLabel('Rect Fill', preview.armedRectKind)} armed`,
      detail: 'drag box (desktop) or tap two corners (touch) - Esc cancel',
      accent: rectAccentForKind(preview.armedRectKind)
    };
  }

  if (preview.armedRectOutlineKind) {
    return {
      title: `${toolActionLabel('Rect Outline', preview.armedRectOutlineKind)} armed`,
      detail: 'drag box (desktop) or tap two corners (touch) - Esc cancel',
      accent: rectOutlineAccentForKind(preview.armedRectOutlineKind)
    };
  }

  if (preview.armedEllipseKind) {
    return {
      title: `${toolActionLabel('Ellipse Fill', preview.armedEllipseKind)} armed`,
      detail: 'drag bounds (desktop) or tap two corners (touch) - Esc cancel',
      accent: ellipseAccentForKind(preview.armedEllipseKind)
    };
  }

  if (preview.armedEllipseOutlineKind) {
    return {
      title: `${toolActionLabel('Ellipse Outline', preview.armedEllipseOutlineKind)} armed`,
      detail: 'drag bounds (desktop) or tap two corners (touch) - Esc cancel',
      accent: ellipseOutlineAccentForKind(preview.armedEllipseOutlineKind)
    };
  }

  if (preview.armedFloodFillKind) {
    return {
      title: `${toolActionLabel('Fill', preview.armedFloodFillKind)} armed`,
      detail: 'click/tap target tile - Esc cancel',
      accent: fillAccentForKind(preview.armedFloodFillKind)
    };
  }

  return null;
};

const buildIdleHintText = (mode: TouchDebugEditMode): string => {
  if (mode === 'pan') {
    return 'Touch: pan/pinch, long-press eyedropper, two-finger tap undo, three-finger tap redo. Desktop: P/L/B modes, 1-0 or [ ] brush, I pick, F fill.';
  }
  if (mode === 'place') {
    return 'Touch: drag to paint, pinch zoom. Desktop: left paint, right break, Shift-drag pan, wheel zoom, Esc cancels one-shot tools.';
  }
  return 'Touch: drag to break, pinch zoom. Desktop: left paint, right break, Shift-drag pan, wheel zoom, Esc cancels one-shot tools.';
};

export const buildDebugEditStatusStripModel = (
  state: DebugEditStatusStripState
): DebugEditStatusStripModel => {
  const activeToolStatus = resolveActiveDebugToolStatus(state.preview);

  return {
    modeText: `Mode: ${formatTouchDebugEditModeLabel(state.mode)}`,
    brushText: `Brush: ${state.brushLabel} (#${state.brushTileId})`,
    toolText: activeToolStatus ? `Tool: ${activeToolStatus.title}` : 'Tool: No one-shot armed',
    hintText: activeToolStatus ? activeToolStatus.detail : buildIdleHintText(state.mode),
    toolAccent: activeToolStatus?.accent ?? NEUTRAL_TOOL_ACCENT
  };
};
