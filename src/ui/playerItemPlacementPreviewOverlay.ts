import { Camera2D } from '../core/camera2d';
import type { CanvasSizeLike, ClientRectLike } from '../input/picking';
import { computeHoveredTileCursorClientRect, type HoveredTileCursorClientRect } from './hoveredTileCursor';
import { appendOverlayMount, type OverlayMountOptions } from './overlayMountHost';

export interface PlayerItemPlacementPreviewState {
  tileX: number;
  tileY: number;
  placementTileX: number;
  placementTileY: number;
  canPlace: boolean;
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  doorToggleStatus?: 'toggle-ready' | 'toggle-blocked';
}

export type PlayerItemPlacementPreviewTone =
  | 'toggle-ready'
  | 'toggle-blocked'
  | 'placeable'
  | 'occupied'
  | 'unsupported'
  | 'blocked-by-player'
  | 'blocked';

export interface PlayerItemPlacementPreviewPresentation {
  tone: PlayerItemPlacementPreviewTone;
  borderColor: string;
  borderStyle: 'solid' | 'dashed';
  background: string;
  boxShadow: string;
}

export const resolvePlayerItemPlacementPreviewTone = (
  preview: PlayerItemPlacementPreviewState
): PlayerItemPlacementPreviewTone => {
  if (preview.doorToggleStatus === 'toggle-ready') {
    return 'toggle-ready';
  }
  if (preview.doorToggleStatus === 'toggle-blocked') {
    return 'toggle-blocked';
  }
  if (preview.canPlace) {
    return 'placeable';
  }
  if (preview.blockedByPlayer) {
    return 'blocked-by-player';
  }
  if (preview.occupied) {
    return 'occupied';
  }
  if (!preview.hasSolidFaceSupport) {
    return 'unsupported';
  }
  return 'blocked';
};

export const resolvePlayerItemPlacementPreviewPresentation = (
  preview: PlayerItemPlacementPreviewState
): PlayerItemPlacementPreviewPresentation => {
  const tone = resolvePlayerItemPlacementPreviewTone(preview);
  switch (tone) {
    case 'toggle-ready':
      return {
        tone,
        borderColor: 'rgba(120, 210, 255, 0.95)',
        borderStyle: 'solid',
        background: 'rgba(120, 210, 255, 0.14)',
        boxShadow:
          '0 0 0 1px rgba(8, 18, 33, 0.4), 0 0 18px rgba(120, 210, 255, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
    case 'toggle-blocked':
      return {
        tone,
        borderColor: 'rgba(255, 166, 144, 0.96)',
        borderStyle: 'dashed',
        background: 'rgba(255, 166, 144, 0.16)',
        boxShadow:
          '0 0 0 1px rgba(33, 18, 12, 0.42), 0 0 18px rgba(255, 166, 144, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
      };
    case 'placeable':
      return {
        tone,
        borderColor: 'rgba(120, 255, 180, 0.96)',
        borderStyle: 'solid',
        background: 'rgba(120, 255, 180, 0.18)',
        boxShadow:
          '0 0 0 1px rgba(8, 24, 19, 0.45), 0 0 18px rgba(120, 255, 180, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
    case 'blocked-by-player':
      return {
        tone,
        borderColor: 'rgba(255, 155, 120, 0.96)',
        borderStyle: 'solid',
        background: 'rgba(255, 155, 120, 0.18)',
        boxShadow:
          '0 0 0 1px rgba(33, 16, 8, 0.45), 0 0 18px rgba(255, 155, 120, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
    case 'occupied':
      return {
        tone,
        borderColor: 'rgba(255, 130, 130, 0.96)',
        borderStyle: 'solid',
        background: 'rgba(255, 130, 130, 0.16)',
        boxShadow:
          '0 0 0 1px rgba(33, 12, 12, 0.45), 0 0 18px rgba(255, 130, 130, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
    case 'unsupported':
      return {
        tone,
        borderColor: 'rgba(255, 195, 120, 0.96)',
        borderStyle: 'dashed',
        background: 'rgba(255, 195, 120, 0.14)',
        boxShadow:
          '0 0 0 1px rgba(33, 24, 8, 0.4), 0 0 18px rgba(255, 195, 120, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
      };
    case 'blocked':
    default:
      return {
        tone,
        borderColor: 'rgba(176, 190, 208, 0.92)',
        borderStyle: 'dashed',
        background: 'rgba(176, 190, 208, 0.12)',
        boxShadow:
          '0 0 0 1px rgba(8, 14, 24, 0.45), 0 0 18px rgba(176, 190, 208, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
      };
  }
};

const mergeClientRects = (
  first: HoveredTileCursorClientRect,
  second: HoveredTileCursorClientRect
): HoveredTileCursorClientRect => {
  const left = Math.min(first.left, second.left);
  const top = Math.min(first.top, second.top);
  const right = Math.max(first.left + first.width, second.left + second.width);
  const bottom = Math.max(first.top + first.height, second.top + second.height);

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top)
  };
};

export const resolvePlayerItemPlacementPreviewClientRect = (
  preview: PlayerItemPlacementPreviewState,
  camera: Camera2D,
  canvas: CanvasSizeLike,
  rect: ClientRectLike
): HoveredTileCursorClientRect => {
  if (preview.doorToggleStatus === undefined) {
    return computeHoveredTileCursorClientRect(preview.tileX, preview.tileY, camera, canvas, rect);
  }

  const topHalfRect = computeHoveredTileCursorClientRect(
    preview.placementTileX,
    preview.placementTileY - 1,
    camera,
    canvas,
    rect
  );
  const bottomHalfRect = computeHoveredTileCursorClientRect(
    preview.placementTileX,
    preview.placementTileY,
    camera,
    canvas,
    rect
  );

  return mergeClientRects(topHalfRect, bottomHalfRect);
};

const updatePreviewRoot = (root: HTMLDivElement, rect: HoveredTileCursorClientRect): void => {
  if (rect.width <= 0 || rect.height <= 0) {
    root.style.display = 'none';
    return;
  }

  root.style.display = 'block';
  root.style.left = `${rect.left}px`;
  root.style.top = `${rect.top}px`;
  root.style.width = `${rect.width}px`;
  root.style.height = `${rect.height}px`;
};

const hidePreviewRoot = (root: HTMLDivElement): void => {
  root.style.display = 'none';
};

const createPreviewRoot = (options: OverlayMountOptions = {}): HTMLDivElement => {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '0';
  root.style.top = '0';
  root.style.width = '0';
  root.style.height = '0';
  root.style.boxSizing = 'border-box';
  root.style.borderRadius = '4px';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '9';
  root.style.display = 'none';
  return appendOverlayMount(root, options);
};

export class PlayerItemPlacementPreviewOverlay {
  private root: HTMLDivElement;
  private visible = true;

  constructor(private canvas: HTMLCanvasElement, options: OverlayMountOptions = {}) {
    this.root = createPreviewRoot(options);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      return;
    }
    hidePreviewRoot(this.root);
  }

  update(camera: Camera2D, preview: PlayerItemPlacementPreviewState | null): void {
    if (!this.visible || preview === null) {
      hidePreviewRoot(this.root);
      return;
    }

    const canvasRect = this.canvas.getBoundingClientRect();
    const clientRect = resolvePlayerItemPlacementPreviewClientRect(preview, camera, this.canvas, canvasRect);
    updatePreviewRoot(this.root, clientRect);
    if (clientRect.width <= 0 || clientRect.height <= 0) {
      return;
    }

    const presentation = resolvePlayerItemPlacementPreviewPresentation(preview);
    this.root.style.borderColor = presentation.borderColor;
    this.root.style.borderStyle = presentation.borderStyle;
    this.root.style.borderWidth = '2px';
    this.root.style.background = presentation.background;
    this.root.style.boxShadow = presentation.boxShadow;
  }
}
