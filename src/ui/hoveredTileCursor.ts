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
}

export interface HoveredTileCursorTargets {
  hovered: HoveredTileCursorTarget | null;
  pinned: HoveredTileCursorTarget | null;
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
  root.style.pointerEvents = 'none';
  root.style.zIndex = '10';
  root.style.display = 'none';
  document.body.append(root);
  return root;
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

    this.updateCursorRoot(this.hoveredRoot, resolvedTargets.hovered, camera, canvasRect);
    this.updateCursorRoot(this.pinnedRoot, resolvedTargets.pinned, camera, canvasRect);
  }

  private hideAll(): void {
    this.hoveredRoot.style.display = 'none';
    this.pinnedRoot.style.display = 'none';
  }

  private updateCursorRoot(
    root: HTMLDivElement,
    target: HoveredTileCursorTarget | null,
    camera: Camera2D,
    canvasRect: DOMRect
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

    root.style.display = 'block';
    root.style.left = `${clientRect.left}px`;
    root.style.top = `${clientRect.top}px`;
    root.style.width = `${clientRect.width}px`;
    root.style.height = `${clientRect.height}px`;
  }
}
