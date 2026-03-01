import { Camera2D } from '../core/camera2d';
import type { ClientRectLike } from '../input/picking';
import type {
  ArmedDebugToolPreviewState,
  PointerInspectSnapshot
} from '../input/controller';
import {
  buildActiveDebugToolPreviewBadgeText,
  buildPendingTouchAnchorLabelText,
  resolveActiveDebugToolStatus
} from './debugEditStatusHelpers';
import { computeHoveredTileCursorClientRect, type HoveredTileCursorClientRect } from './hoveredTileCursor';

const TOUCH_ANCHOR_LABEL_PADDING_PX = 4;
const TOUCH_ANCHOR_LABEL_GAP_PX = 4;

const lineAccentForKind = (kind: 'place' | 'break'): string =>
  kind === 'place' ? 'rgba(120, 210, 255, 0.95)' : 'rgba(255, 180, 120, 0.95)';

const rectAccentForKind = (kind: 'place' | 'break'): string =>
  kind === 'place' ? 'rgba(120, 255, 180, 0.95)' : 'rgba(255, 130, 130, 0.95)';

const rectOutlineAccentForKind = (kind: 'place' | 'break'): string =>
  kind === 'place' ? 'rgba(120, 210, 255, 0.95)' : 'rgba(255, 180, 120, 0.95)';

const ellipseAccentForKind = (kind: 'place' | 'break'): string =>
  kind === 'place' ? 'rgba(185, 255, 120, 0.95)' : 'rgba(255, 155, 120, 0.95)';

const ellipseOutlineAccentForKind = (kind: 'place' | 'break'): string =>
  kind === 'place' ? 'rgba(150, 225, 255, 0.95)' : 'rgba(255, 195, 120, 0.95)';

const hideElement = (element: HTMLElement): void => {
  element.style.display = 'none';
};

const showTileMarker = (
  element: HTMLDivElement,
  left: number,
  top: number,
  width: number,
  height: number
): void => {
  element.style.display = 'block';
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
};

const computeTileClientRectOrNull = (
  tileX: number,
  tileY: number,
  camera: Camera2D,
  canvas: HTMLCanvasElement,
  canvasRect: DOMRect
) => {
  const clientRect = computeHoveredTileCursorClientRect(tileX, tileY, camera, canvas, canvasRect);
  if (clientRect.width <= 0 || clientRect.height <= 0) return null;
  return clientRect;
};

export interface OverlayLabelSize {
  width: number;
  height: number;
}

export interface TouchAnchorLabelPlacement {
  left: number;
  top: number;
  maxWidth: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const resolveTouchAnchorLabelPlacement = (
  anchorRect: HoveredTileCursorClientRect,
  canvasRect: ClientRectLike,
  labelSize: OverlayLabelSize
): TouchAnchorLabelPlacement => {
  const maxWidth = Math.max(0, canvasRect.width - TOUCH_ANCHOR_LABEL_PADDING_PX * 2);
  const labelWidth = Math.min(Math.max(0, labelSize.width), maxWidth);
  const labelHeight = Math.max(0, labelSize.height);
  const minLeft = canvasRect.left + TOUCH_ANCHOR_LABEL_PADDING_PX;
  const maxLeft = canvasRect.left + canvasRect.width - TOUCH_ANCHOR_LABEL_PADDING_PX - labelWidth;
  const minTop = canvasRect.top + TOUCH_ANCHOR_LABEL_PADDING_PX;
  const maxTop = canvasRect.top + canvasRect.height - TOUCH_ANCHOR_LABEL_PADDING_PX - labelHeight;
  const preferredTop = anchorRect.top - labelHeight - TOUCH_ANCHOR_LABEL_GAP_PX;

  return {
    left: clamp(anchorRect.left, minLeft, Math.max(minLeft, maxLeft)),
    top: clamp(preferredTop, minTop, Math.max(minTop, maxTop)),
    maxWidth
  };
};

export class ArmedDebugToolPreviewOverlay {
  private root: HTMLDivElement;
  private statusBadge: HTMLDivElement;
  private lineSegment: HTMLDivElement;
  private lineStartMarker: HTMLDivElement;
  private lineEndMarker: HTMLDivElement;
  private rectPreviewBox: HTMLDivElement;
  private ellipsePreviewBox: HTMLDivElement;
  private touchAnchorMarker: HTMLDivElement;
  private touchAnchorLabel: HTMLDivElement;

  constructor(private canvas: HTMLCanvasElement) {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '0';
    this.root.style.top = '0';
    this.root.style.width = '100vw';
    this.root.style.height = '100vh';
    this.root.style.pointerEvents = 'none';
    this.root.style.zIndex = '11';

    this.statusBadge = document.createElement('div');
    this.statusBadge.style.position = 'fixed';
    this.statusBadge.style.display = 'none';
    this.statusBadge.style.padding = '8px 10px';
    this.statusBadge.style.borderRadius = '8px';
    this.statusBadge.style.border = '1px solid rgba(255, 255, 255, 0.22)';
    this.statusBadge.style.background = 'rgba(8, 14, 24, 0.86)';
    this.statusBadge.style.color = 'rgba(255, 255, 255, 0.96)';
    this.statusBadge.style.font = '600 12px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    this.statusBadge.style.letterSpacing = '0.01em';
    this.statusBadge.style.boxShadow = '0 8px 18px rgba(0, 0, 0, 0.22)';
    this.statusBadge.style.backdropFilter = 'blur(2px)';
    this.statusBadge.style.whiteSpace = 'pre-line';

    this.lineSegment = document.createElement('div');
    this.lineSegment.style.position = 'fixed';
    this.lineSegment.style.display = 'none';
    this.lineSegment.style.height = '3px';
    this.lineSegment.style.borderRadius = '999px';
    this.lineSegment.style.transformOrigin = '0 50%';
    this.lineSegment.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 255, 255, 0.14)';

    this.lineStartMarker = document.createElement('div');
    this.lineStartMarker.style.position = 'fixed';
    this.lineStartMarker.style.display = 'none';
    this.lineStartMarker.style.boxSizing = 'border-box';
    this.lineStartMarker.style.borderRadius = '4px';
    this.lineStartMarker.style.background = 'rgba(255, 255, 255, 0.04)';
    this.lineStartMarker.style.border = '2px dashed rgba(255, 255, 255, 0.95)';
    this.lineStartMarker.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.35)';

    this.lineEndMarker = document.createElement('div');
    this.lineEndMarker.style.position = 'fixed';
    this.lineEndMarker.style.display = 'none';
    this.lineEndMarker.style.boxSizing = 'border-box';
    this.lineEndMarker.style.borderRadius = '4px';
    this.lineEndMarker.style.background = 'rgba(255, 255, 255, 0.06)';
    this.lineEndMarker.style.border = '2px solid rgba(255, 255, 255, 0.95)';
    this.lineEndMarker.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.35)';

    this.rectPreviewBox = document.createElement('div');
    this.rectPreviewBox.style.position = 'fixed';
    this.rectPreviewBox.style.display = 'none';
    this.rectPreviewBox.style.boxSizing = 'border-box';
    this.rectPreviewBox.style.borderRadius = '5px';
    this.rectPreviewBox.style.border = '2px dashed rgba(255, 255, 255, 0.95)';
    this.rectPreviewBox.style.background = 'rgba(255, 255, 255, 0.05)';
    this.rectPreviewBox.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.08)';

    this.ellipsePreviewBox = document.createElement('div');
    this.ellipsePreviewBox.style.position = 'fixed';
    this.ellipsePreviewBox.style.display = 'none';
    this.ellipsePreviewBox.style.boxSizing = 'border-box';
    this.ellipsePreviewBox.style.borderRadius = '999px';
    this.ellipsePreviewBox.style.border = '2px dashed rgba(255, 255, 255, 0.95)';
    this.ellipsePreviewBox.style.background = 'rgba(255, 255, 255, 0.05)';
    this.ellipsePreviewBox.style.boxShadow =
      '0 0 0 1px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.08)';

    this.touchAnchorMarker = document.createElement('div');
    this.touchAnchorMarker.style.position = 'fixed';
    this.touchAnchorMarker.style.display = 'none';
    this.touchAnchorMarker.style.boxSizing = 'border-box';
    this.touchAnchorMarker.style.borderRadius = '5px';
    this.touchAnchorMarker.style.border = '2px dashed rgba(255, 255, 255, 0.95)';
    this.touchAnchorMarker.style.background =
      'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 60%, rgba(255,255,255,0) 70%)';
    this.touchAnchorMarker.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 18px rgba(255, 255, 255, 0.12)';

    this.touchAnchorLabel = document.createElement('div');
    this.touchAnchorLabel.style.position = 'fixed';
    this.touchAnchorLabel.style.display = 'none';
    this.touchAnchorLabel.style.padding = '3px 6px';
    this.touchAnchorLabel.style.borderRadius = '999px';
    this.touchAnchorLabel.style.background = 'rgba(8, 14, 24, 0.86)';
    this.touchAnchorLabel.style.border = '1px solid rgba(255, 255, 255, 0.22)';
    this.touchAnchorLabel.style.color = 'rgba(255, 255, 255, 0.95)';
    this.touchAnchorLabel.style.font = '600 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    this.touchAnchorLabel.style.letterSpacing = '0.01em';
    this.touchAnchorLabel.textContent = 'Line start';

    this.root.append(
      this.lineSegment,
      this.lineStartMarker,
      this.lineEndMarker,
      this.rectPreviewBox,
      this.ellipsePreviewBox,
      this.touchAnchorMarker,
      this.touchAnchorLabel,
      this.statusBadge
    );
    document.body.append(this.root);
  }

  update(
    camera: Camera2D,
    pointerInspect: PointerInspectSnapshot | null,
    preview: ArmedDebugToolPreviewState
  ): void {
    const canvasRect = this.canvas.getBoundingClientRect();
    this.updateStatusBadge(canvasRect, pointerInspect, preview);
    this.updateMouseLinePreview(camera, canvasRect, pointerInspect, preview);
    this.updateMouseRectPreview(camera, canvasRect, pointerInspect, preview);
    this.updateMouseEllipsePreview(camera, canvasRect, pointerInspect, preview);
    this.updateTouchAnchorPreview(camera, canvasRect, preview);
  }

  private updateStatusBadge(
    canvasRect: DOMRect,
    pointerInspect: PointerInspectSnapshot | null,
    preview: ArmedDebugToolPreviewState
  ): void {
    const status = resolveActiveDebugToolStatus(preview);
    if (!status) {
      hideElement(this.statusBadge);
      return;
    }

    const previewBadgeText = buildActiveDebugToolPreviewBadgeText(
      preview,
      pointerInspect?.pointerType === 'mouse'
        ? {
            tileX: pointerInspect.tile.x,
            tileY: pointerInspect.tile.y
          }
        : null
    );
    this.statusBadge.style.display = 'block';
    this.statusBadge.textContent = previewBadgeText
      ? `${status.title} - ${status.detail}\n${previewBadgeText}`
      : `${status.title} - ${status.detail}`;
    this.statusBadge.style.left = `${canvasRect.left + 10}px`;
    this.statusBadge.style.top = `${canvasRect.top + 10}px`;
    this.statusBadge.style.maxWidth = `${Math.max(160, canvasRect.width - 20)}px`;
    this.statusBadge.style.borderColor = status.accent.replace('0.95', '0.34');
    this.statusBadge.style.boxShadow =
      `0 8px 18px rgba(0, 0, 0, 0.22), inset 0 0 0 1px ${status.accent.replace('0.95', '0.22')}`;
    this.statusBadge.style.color = 'rgba(255, 255, 255, 0.96)';
  }

  private updateMouseLinePreview(
    camera: Camera2D,
    canvasRect: DOMRect,
    pointerInspect: PointerInspectSnapshot | null,
    preview: ArmedDebugToolPreviewState
  ): void {
    const drag = preview.activeMouseLineDrag;
    if (!drag || pointerInspect?.pointerType !== 'mouse') {
      hideElement(this.lineSegment);
      hideElement(this.lineStartMarker);
      hideElement(this.lineEndMarker);
      return;
    }

    const startRect = computeTileClientRectOrNull(
      drag.startTileX,
      drag.startTileY,
      camera,
      this.canvas,
      canvasRect
    );
    const endRect = computeTileClientRectOrNull(
      pointerInspect.tile.x,
      pointerInspect.tile.y,
      camera,
      this.canvas,
      canvasRect
    );
    if (!startRect || !endRect) {
      hideElement(this.lineSegment);
      hideElement(this.lineStartMarker);
      hideElement(this.lineEndMarker);
      return;
    }

    const accent = lineAccentForKind(drag.kind);
    const startCenterX = startRect.left + startRect.width * 0.5;
    const startCenterY = startRect.top + startRect.height * 0.5;
    const endCenterX = endRect.left + endRect.width * 0.5;
    const endCenterY = endRect.top + endRect.height * 0.5;
    const dx = endCenterX - startCenterX;
    const dy = endCenterY - startCenterY;
    const length = Math.hypot(dx, dy);

    showTileMarker(this.lineStartMarker, startRect.left, startRect.top, startRect.width, startRect.height);
    showTileMarker(this.lineEndMarker, endRect.left, endRect.top, endRect.width, endRect.height);
    this.lineStartMarker.style.borderColor = accent;
    this.lineStartMarker.style.background = accent.replace('0.95', '0.12');
    this.lineEndMarker.style.borderColor = accent;
    this.lineEndMarker.style.background = accent.replace('0.95', '0.18');

    if (length < 0.5) {
      hideElement(this.lineSegment);
      return;
    }

    this.lineSegment.style.display = 'block';
    this.lineSegment.style.left = `${startCenterX}px`;
    this.lineSegment.style.top = `${startCenterY}px`;
    this.lineSegment.style.width = `${length}px`;
    this.lineSegment.style.background = accent;
    this.lineSegment.style.transform = `translateY(-50%) rotate(${Math.atan2(dy, dx)}rad)`;
  }

  private updateMouseRectPreview(
    camera: Camera2D,
    canvasRect: DOMRect,
    pointerInspect: PointerInspectSnapshot | null,
    preview: ArmedDebugToolPreviewState
  ): void {
    const fillDrag = preview.activeMouseRectDrag;
    const outlineDrag = preview.activeMouseRectOutlineDrag;
    const drag = fillDrag ?? outlineDrag;
    if (!drag || pointerInspect?.pointerType !== 'mouse') {
      hideElement(this.rectPreviewBox);
      return;
    }

    const startRect = computeTileClientRectOrNull(
      drag.startTileX,
      drag.startTileY,
      camera,
      this.canvas,
      canvasRect
    );
    const endRect = computeTileClientRectOrNull(
      pointerInspect.tile.x,
      pointerInspect.tile.y,
      camera,
      this.canvas,
      canvasRect
    );
    if (!startRect || !endRect) {
      hideElement(this.rectPreviewBox);
      return;
    }

    const left = Math.min(startRect.left, endRect.left);
    const top = Math.min(startRect.top, endRect.top);
    const right = Math.max(startRect.left + startRect.width, endRect.left + endRect.width);
    const bottom = Math.max(startRect.top + startRect.height, endRect.top + endRect.height);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    if (width <= 0 || height <= 0) {
      hideElement(this.rectPreviewBox);
      return;
    }

    const isOutlineDrag = outlineDrag !== null && drag === outlineDrag;
    const accent = isOutlineDrag ? rectOutlineAccentForKind(drag.kind) : rectAccentForKind(drag.kind);
    this.rectPreviewBox.style.display = 'block';
    this.rectPreviewBox.style.left = `${left}px`;
    this.rectPreviewBox.style.top = `${top}px`;
    this.rectPreviewBox.style.width = `${width}px`;
    this.rectPreviewBox.style.height = `${height}px`;
    this.rectPreviewBox.style.borderColor = accent;
    this.rectPreviewBox.style.borderStyle = isOutlineDrag ? 'solid' : 'dashed';
    this.rectPreviewBox.style.background = accent.replace('0.95', isOutlineDrag ? '0.06' : '0.14');
    this.rectPreviewBox.style.boxShadow =
      `0 0 0 1px rgba(0, 0, 0, 0.35), inset 0 0 0 1px ${accent.replace('0.95', '0.16')}`;
  }

  private updateMouseEllipsePreview(
    camera: Camera2D,
    canvasRect: DOMRect,
    pointerInspect: PointerInspectSnapshot | null,
    preview: ArmedDebugToolPreviewState
  ): void {
    const fillDrag = preview.activeMouseEllipseDrag;
    const outlineDrag = preview.activeMouseEllipseOutlineDrag;
    const drag = fillDrag ?? outlineDrag;
    if (!drag || pointerInspect?.pointerType !== 'mouse') {
      hideElement(this.ellipsePreviewBox);
      return;
    }

    const startRect = computeTileClientRectOrNull(
      drag.startTileX,
      drag.startTileY,
      camera,
      this.canvas,
      canvasRect
    );
    const endRect = computeTileClientRectOrNull(
      pointerInspect.tile.x,
      pointerInspect.tile.y,
      camera,
      this.canvas,
      canvasRect
    );
    if (!startRect || !endRect) {
      hideElement(this.ellipsePreviewBox);
      return;
    }

    const left = Math.min(startRect.left, endRect.left);
    const top = Math.min(startRect.top, endRect.top);
    const right = Math.max(startRect.left + startRect.width, endRect.left + endRect.width);
    const bottom = Math.max(startRect.top + startRect.height, endRect.top + endRect.height);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    if (width <= 0 || height <= 0) {
      hideElement(this.ellipsePreviewBox);
      return;
    }

    const isOutlineDrag = outlineDrag !== null && drag === outlineDrag;
    const accent = isOutlineDrag ? ellipseOutlineAccentForKind(drag.kind) : ellipseAccentForKind(drag.kind);
    this.ellipsePreviewBox.style.display = 'block';
    this.ellipsePreviewBox.style.left = `${left}px`;
    this.ellipsePreviewBox.style.top = `${top}px`;
    this.ellipsePreviewBox.style.width = `${width}px`;
    this.ellipsePreviewBox.style.height = `${height}px`;
    this.ellipsePreviewBox.style.borderColor = accent;
    this.ellipsePreviewBox.style.borderStyle = isOutlineDrag ? 'solid' : 'dashed';
    this.ellipsePreviewBox.style.background = accent.replace('0.95', isOutlineDrag ? '0.06' : '0.12');
    this.ellipsePreviewBox.style.boxShadow =
      `0 0 0 1px rgba(0, 0, 0, 0.35), inset 0 0 0 1px ${accent.replace('0.95', isOutlineDrag ? '0.16' : '0.18')}`;
  }

  private updateTouchAnchorPreview(
    camera: Camera2D,
    canvasRect: DOMRect,
    preview: ArmedDebugToolPreviewState
  ): void {
    const lineAnchor = preview.pendingTouchLineStart;
    const rectFillAnchor = preview.pendingTouchRectStart;
    const rectOutlineAnchor = preview.pendingTouchRectOutlineStart;
    const ellipseAnchor = preview.pendingTouchEllipseStart;
    const ellipseOutlineAnchor = preview.pendingTouchEllipseOutlineStart;
    const anchor = lineAnchor ?? rectFillAnchor ?? rectOutlineAnchor ?? ellipseAnchor ?? ellipseOutlineAnchor;
    if (!anchor) {
      hideElement(this.touchAnchorMarker);
      hideElement(this.touchAnchorLabel);
      return;
    }

    const anchorRect = computeTileClientRectOrNull(anchor.tileX, anchor.tileY, camera, this.canvas, canvasRect);
    if (!anchorRect) {
      hideElement(this.touchAnchorMarker);
      hideElement(this.touchAnchorLabel);
      return;
    }

    const isRectFillAnchor = rectFillAnchor !== null && anchor === rectFillAnchor;
    const isRectOutlineAnchor = rectOutlineAnchor !== null && anchor === rectOutlineAnchor;
    const isEllipseAnchor = ellipseAnchor !== null && anchor === ellipseAnchor;
    const isEllipseOutlineAnchor = ellipseOutlineAnchor !== null && anchor === ellipseOutlineAnchor;
    const accent = isRectFillAnchor
      ? rectAccentForKind(anchor.kind)
      : isRectOutlineAnchor
        ? rectOutlineAccentForKind(anchor.kind)
      : isEllipseAnchor
          ? ellipseAccentForKind(anchor.kind)
        : isEllipseOutlineAnchor
          ? ellipseOutlineAccentForKind(anchor.kind)
        : lineAccentForKind(anchor.kind);
    showTileMarker(
      this.touchAnchorMarker,
      anchorRect.left,
      anchorRect.top,
      anchorRect.width,
      anchorRect.height
    );
    this.touchAnchorMarker.style.borderColor = accent;
    this.touchAnchorMarker.style.boxShadow = `0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 18px ${accent.replace('0.95', '0.2')}`;
    this.touchAnchorMarker.style.background =
      `radial-gradient(circle at 50% 50%, ${accent.replace('0.95', '0.22')}, rgba(255,255,255,0.04) 62%, rgba(255,255,255,0) 72%)`;

    this.touchAnchorLabel.style.display = 'block';
    this.touchAnchorLabel.textContent =
      buildPendingTouchAnchorLabelText(preview) ??
      (isRectFillAnchor
        ? 'Rect fill corner'
        : isRectOutlineAnchor
          ? 'Rect outline corner'
          : isEllipseAnchor
            ? 'Ellipse corner'
          : isEllipseOutlineAnchor
              ? 'Ellipse outline corner'
            : 'Line start');
    this.touchAnchorLabel.style.maxWidth = `${Math.max(0, canvasRect.width - TOUCH_ANCHOR_LABEL_PADDING_PX * 2)}px`;
    const touchAnchorLabelBounds = this.touchAnchorLabel.getBoundingClientRect();
    const touchAnchorLabelPlacement = resolveTouchAnchorLabelPlacement(anchorRect, canvasRect, {
      width: touchAnchorLabelBounds.width,
      height: touchAnchorLabelBounds.height
    });
    this.touchAnchorLabel.style.left = `${touchAnchorLabelPlacement.left}px`;
    this.touchAnchorLabel.style.top = `${touchAnchorLabelPlacement.top}px`;
    this.touchAnchorLabel.style.maxWidth = `${touchAnchorLabelPlacement.maxWidth}px`;
    this.touchAnchorLabel.style.borderColor = accent.replace('0.95', '0.34');
    this.touchAnchorLabel.style.boxShadow = `inset 0 0 0 1px ${accent.replace('0.95', '0.22')}`;
  }
}
