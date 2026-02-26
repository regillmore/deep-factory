import { Camera2D } from '../core/camera2d';
import type {
  ArmedDebugToolPreviewState,
  DebugTileEditKind,
  PointerInspectSnapshot
} from '../input/controller';
import { computeHoveredTileCursorClientRect } from './hoveredTileCursor';

const lineAccentForKind = (kind: DebugTileEditKind): string =>
  kind === 'place' ? 'rgba(120, 210, 255, 0.95)' : 'rgba(255, 180, 120, 0.95)';

const fillAccentForKind = (kind: DebugTileEditKind): string =>
  kind === 'place' ? 'rgba(120, 255, 180, 0.95)' : 'rgba(255, 130, 130, 0.95)';

const toolActionLabel = (tool: 'Fill' | 'Line', kind: DebugTileEditKind): string =>
  `${tool} ${kind === 'place' ? 'Brush' : 'Break'}`;

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

export class ArmedDebugToolPreviewOverlay {
  private root: HTMLDivElement;
  private statusBadge: HTMLDivElement;
  private lineSegment: HTMLDivElement;
  private lineStartMarker: HTMLDivElement;
  private lineEndMarker: HTMLDivElement;
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
    this.statusBadge.style.whiteSpace = 'normal';

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
    this.updateStatusBadge(canvasRect, preview);
    this.updateMouseLinePreview(camera, canvasRect, pointerInspect, preview);
    this.updateTouchAnchorPreview(camera, canvasRect, preview);
  }

  private updateStatusBadge(canvasRect: DOMRect, preview: ArmedDebugToolPreviewState): void {
    const activeMouseLineDrag = preview.activeMouseLineDrag;
    const pendingTouchLineStart = preview.pendingTouchLineStart;

    if (
      preview.armedFloodFillKind === null &&
      preview.armedLineKind === null &&
      activeMouseLineDrag === null &&
      pendingTouchLineStart === null
    ) {
      hideElement(this.statusBadge);
      return;
    }

    let text = '';
    let accent = 'rgba(255, 255, 255, 0.9)';

    if (activeMouseLineDrag) {
      accent = lineAccentForKind(activeMouseLineDrag.kind);
      text = `${toolActionLabel('Line', activeMouseLineDrag.kind)} armed - drag endpoint, release to apply - Esc cancel`;
    } else if (pendingTouchLineStart) {
      accent = lineAccentForKind(pendingTouchLineStart.kind);
      text = `${toolActionLabel('Line', pendingTouchLineStart.kind)} armed - start set, tap end tile - Esc cancel`;
    } else if (preview.armedLineKind) {
      accent = lineAccentForKind(preview.armedLineKind);
      text = `${toolActionLabel('Line', preview.armedLineKind)} armed - drag (desktop) or tap start/end (touch) - Esc cancel`;
    } else if (preview.armedFloodFillKind) {
      accent = fillAccentForKind(preview.armedFloodFillKind);
      text = `${toolActionLabel('Fill', preview.armedFloodFillKind)} armed - click/tap target tile - Esc cancel`;
    }

    this.statusBadge.style.display = 'block';
    this.statusBadge.textContent = text;
    this.statusBadge.style.left = `${canvasRect.left + 10}px`;
    this.statusBadge.style.top = `${canvasRect.top + 10}px`;
    this.statusBadge.style.maxWidth = `${Math.max(160, canvasRect.width - 20)}px`;
    this.statusBadge.style.borderColor = accent.replace('0.95', '0.34');
    this.statusBadge.style.boxShadow = `0 8px 18px rgba(0, 0, 0, 0.22), inset 0 0 0 1px ${accent.replace('0.95', '0.22')}`;
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

  private updateTouchAnchorPreview(
    camera: Camera2D,
    canvasRect: DOMRect,
    preview: ArmedDebugToolPreviewState
  ): void {
    const anchor = preview.pendingTouchLineStart;
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

    const accent = lineAccentForKind(anchor.kind);
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
    this.touchAnchorLabel.style.left = `${anchorRect.left}px`;
    this.touchAnchorLabel.style.top = `${Math.max(4, anchorRect.top - 24)}px`;
    this.touchAnchorLabel.style.borderColor = accent.replace('0.95', '0.34');
    this.touchAnchorLabel.style.boxShadow = `inset 0 0 0 1px ${accent.replace('0.95', '0.22')}`;
  }
}
