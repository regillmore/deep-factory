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
  pinned: boolean;
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

export class HoveredTileCursorOverlay {
  private root: HTMLDivElement;

  constructor(private canvas: HTMLCanvasElement) {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '0';
    this.root.style.top = '0';
    this.root.style.width = '0';
    this.root.style.height = '0';
    this.root.style.boxSizing = 'border-box';
    this.root.style.border = '2px solid rgba(255, 232, 122, 0.95)';
    this.root.style.background = 'rgba(255, 232, 122, 0.14)';
    this.root.style.borderRadius = '2px';
    this.root.style.pointerEvents = 'none';
    this.root.style.zIndex = '10';
    this.root.style.display = 'none';
    document.body.append(this.root);
  }

  update(camera: Camera2D, target: HoveredTileCursorTarget | null): void {
    if (!target) {
      this.root.style.display = 'none';
      return;
    }

    const clientRect = computeHoveredTileCursorClientRect(
      target.tileX,
      target.tileY,
      camera,
      this.canvas,
      this.canvas.getBoundingClientRect()
    );

    if (clientRect.width <= 0 || clientRect.height <= 0) {
      this.root.style.display = 'none';
      return;
    }

    this.root.style.display = 'block';
    this.root.style.borderColor = target.pinned ? 'rgba(120, 210, 255, 0.95)' : 'rgba(255, 232, 122, 0.95)';
    this.root.style.background = target.pinned ? 'rgba(120, 210, 255, 0.12)' : 'rgba(255, 232, 122, 0.14)';
    this.root.style.left = `${clientRect.left}px`;
    this.root.style.top = `${clientRect.top}px`;
    this.root.style.width = `${clientRect.width}px`;
    this.root.style.height = `${clientRect.height}px`;
  }
}
