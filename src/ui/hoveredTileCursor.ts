import { Camera2D } from '../core/camera2d';
import type { CanvasSizeLike, ClientRectLike } from '../input/picking';
import { TILE_SIZE } from '../world/constants';

export interface HoveredTileCursorClientRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface HoveredTileCursorTarget {
  tileX: number;
  tileY: number;
  previewTone?: 'default' | 'debug-break-tile' | 'debug-break-wall';
}

export interface HoveredTileCursorTargets {
  hovered: HoveredTileCursorTarget | null;
  pinned: HoveredTileCursorTarget | null;
}

export interface HoveredTileCursorPresentation {
  borderColor: string;
  borderStyle: 'solid' | 'dashed';
  background: string;
  boxShadow: string;
}

export const computeHoveredTileCursorClientRect = (
  tileX: number,
  tileY: number,
  camera: Camera2D,
  canvas: CanvasSizeLike,
  rect: ClientRectLike,
  tileSize: number = TILE_SIZE
): HoveredTileCursorClientRect => {
  if (canvas.width <= 0 || canvas.height <= 0) {
    return { left: rect.left, top: rect.top, width: 0, height: 0 };
  }

  const topLeft = camera.worldToScreen(tileX * tileSize, tileY * tileSize, canvas.width, canvas.height);
  const bottomRight = camera.worldToScreen(
    (tileX + 1) * tileSize,
    (tileY + 1) * tileSize,
    canvas.width,
    canvas.height
  );

  const scaleX = rect.width > 0 ? rect.width / canvas.width : 0;
  const scaleY = rect.height > 0 ? rect.height / canvas.height : 0;

  return {
    left: rect.left + topLeft.x * scaleX,
    top: rect.top + topLeft.y * scaleY,
    width: Math.max(0, (bottomRight.x - topLeft.x) * scaleX),
    height: Math.max(0, (bottomRight.y - topLeft.y) * scaleY)
  };
};

export const resolveHoveredTileCursorTargets = (
  hovered: HoveredTileCursorTarget | null,
  pinned: HoveredTileCursorTarget | null
): HoveredTileCursorTargets => {
  if (hovered && pinned && hovered.tileX === pinned.tileX && hovered.tileY === pinned.tileY) {
    return {
      hovered: null,
      pinned
    };
  }

  return {
    hovered,
    pinned
  };
};

const createCursorRoot = (borderColor: string, background: string): HTMLDivElement => {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '0';
  root.style.top = '0';
  root.style.width = '0';
  root.style.height = '0';
  root.style.boxSizing = 'border-box';
  root.style.border = `2px solid ${borderColor}`;
  root.style.background = background;
  root.style.borderRadius = '2px';
  root.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.28)';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '10';
  root.style.display = 'none';
  document.body.append(root);
  return root;
};

export const resolveHoveredTileCursorPresentation = (
  variant: 'hovered' | 'pinned',
  target: HoveredTileCursorTarget | null
): HoveredTileCursorPresentation => {
  if (variant === 'pinned') {
    return {
      borderColor: 'rgba(120, 210, 255, 0.95)',
      borderStyle: 'solid',
      background: 'rgba(120, 210, 255, 0.12)',
      boxShadow: '0 0 0 1px rgba(8, 14, 24, 0.32), 0 0 14px rgba(120, 210, 255, 0.12)'
    };
  }

  if (target?.previewTone === 'debug-break-tile') {
    return {
      borderColor: 'rgba(255, 140, 120, 0.96)',
      borderStyle: 'solid',
      background: 'rgba(255, 140, 120, 0.14)',
      boxShadow: '0 0 0 1px rgba(33, 12, 12, 0.38), 0 0 18px rgba(255, 140, 120, 0.16)'
    };
  }

  if (target?.previewTone === 'debug-break-wall') {
    return {
      borderColor: 'rgba(255, 195, 120, 0.96)',
      borderStyle: 'dashed',
      background:
        'repeating-linear-gradient(135deg, rgba(255, 195, 120, 0.12) 0 4px, rgba(255, 195, 120, 0.04) 4px 8px)',
      boxShadow: '0 0 0 1px rgba(33, 24, 8, 0.36), 0 0 18px rgba(255, 195, 120, 0.14)'
    };
  }

  return {
    borderColor: 'rgba(255, 232, 122, 0.95)',
    borderStyle: 'solid',
    background: 'rgba(255, 232, 122, 0.14)',
    boxShadow: '0 0 0 1px rgba(33, 28, 8, 0.3), 0 0 14px rgba(255, 232, 122, 0.1)'
  };
};

export class HoveredTileCursorOverlay {
  private hoveredRoot: HTMLDivElement;
  private pinnedRoot: HTMLDivElement;
  private visible = true;

  constructor(private canvas: HTMLCanvasElement) {
    this.hoveredRoot = createCursorRoot('rgba(255, 232, 122, 0.95)', 'rgba(255, 232, 122, 0.14)');
    this.pinnedRoot = createCursorRoot('rgba(120, 210, 255, 0.95)', 'rgba(120, 210, 255, 0.12)');
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) return;
    this.hideAll();
  }

  update(camera: Camera2D, targets: HoveredTileCursorTargets): void {
    if (!this.visible) {
      this.hideAll();
      return;
    }

    const resolvedTargets = resolveHoveredTileCursorTargets(targets.hovered, targets.pinned);
    const canvasRect = this.canvas.getBoundingClientRect();

    this.updateCursorRoot(this.hoveredRoot, resolvedTargets.hovered, camera, canvasRect, 'hovered');
    this.updateCursorRoot(this.pinnedRoot, resolvedTargets.pinned, camera, canvasRect, 'pinned');
  }

  private hideAll(): void {
    this.hoveredRoot.style.display = 'none';
    this.pinnedRoot.style.display = 'none';
  }

  private updateCursorRoot(
    root: HTMLDivElement,
    target: HoveredTileCursorTarget | null,
    camera: Camera2D,
    canvasRect: DOMRect,
    variant: 'hovered' | 'pinned'
  ): void {
    if (!target) {
      root.style.display = 'none';
      return;
    }

    const clientRect = computeHoveredTileCursorClientRect(target.tileX, target.tileY, camera, this.canvas, canvasRect);
    if (clientRect.width <= 0 || clientRect.height <= 0) {
      root.style.display = 'none';
      return;
    }

    const presentation = resolveHoveredTileCursorPresentation(variant, target);
    root.style.display = 'block';
    root.style.left = `${clientRect.left}px`;
    root.style.top = `${clientRect.top}px`;
    root.style.width = `${clientRect.width}px`;
    root.style.height = `${clientRect.height}px`;
    root.style.borderColor = presentation.borderColor;
    root.style.borderStyle = presentation.borderStyle;
    root.style.background = presentation.background;
    root.style.boxShadow = presentation.boxShadow;
  }
}
