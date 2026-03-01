import { Camera2D } from '../core/camera2d';
import type { CanvasSizeLike, ClientRectLike } from '../input/picking';
import { TILE_SIZE } from '../world/constants';
import type { WorldAabb } from '../world/collision';
import type { PlayerSpawnPoint } from '../world/playerSpawn';
import { computeHoveredTileCursorClientRect, type HoveredTileCursorClientRect } from './hoveredTileCursor';

export interface ClientPoint {
  x: number;
  y: number;
}

export interface PlayerSpawnMarkerClientGeometry {
  aabbRect: HoveredTileCursorClientRect;
  supportRect: HoveredTileCursorClientRect;
  anchorPoint: ClientPoint;
}

const createHiddenClientRect = (rect: ClientRectLike): HoveredTileCursorClientRect => ({
  left: rect.left,
  top: rect.top,
  width: 0,
  height: 0
});

export const computeWorldAabbClientRect = (
  aabb: WorldAabb,
  camera: Camera2D,
  canvas: CanvasSizeLike,
  rect: ClientRectLike
): HoveredTileCursorClientRect => {
  if (canvas.width <= 0 || canvas.height <= 0) {
    return createHiddenClientRect(rect);
  }

  const topLeft = camera.worldToScreen(aabb.minX, aabb.minY, canvas.width, canvas.height);
  const bottomRight = camera.worldToScreen(aabb.maxX, aabb.maxY, canvas.width, canvas.height);
  const scaleX = rect.width > 0 ? rect.width / canvas.width : 0;
  const scaleY = rect.height > 0 ? rect.height / canvas.height : 0;
  const minScreenX = Math.min(topLeft.x, bottomRight.x);
  const maxScreenX = Math.max(topLeft.x, bottomRight.x);
  const minScreenY = Math.min(topLeft.y, bottomRight.y);
  const maxScreenY = Math.max(topLeft.y, bottomRight.y);

  return {
    left: rect.left + minScreenX * scaleX,
    top: rect.top + minScreenY * scaleY,
    width: Math.max(0, (maxScreenX - minScreenX) * scaleX),
    height: Math.max(0, (maxScreenY - minScreenY) * scaleY)
  };
};

export const computeWorldClientPoint = (
  worldX: number,
  worldY: number,
  camera: Camera2D,
  canvas: CanvasSizeLike,
  rect: ClientRectLike
): ClientPoint => {
  if (canvas.width <= 0 || canvas.height <= 0) {
    return {
      x: rect.left,
      y: rect.top
    };
  }

  const screenPoint = camera.worldToScreen(worldX, worldY, canvas.width, canvas.height);
  const scaleX = rect.width > 0 ? rect.width / canvas.width : 0;
  const scaleY = rect.height > 0 ? rect.height / canvas.height : 0;

  return {
    x: rect.left + screenPoint.x * scaleX,
    y: rect.top + screenPoint.y * scaleY
  };
};

export const computePlayerSpawnMarkerClientGeometry = (
  spawn: PlayerSpawnPoint,
  camera: Camera2D,
  canvas: CanvasSizeLike,
  rect: ClientRectLike,
  tileSize: number = TILE_SIZE
): PlayerSpawnMarkerClientGeometry => ({
  aabbRect: computeWorldAabbClientRect(spawn.aabb, camera, canvas, rect),
  supportRect: computeHoveredTileCursorClientRect(
    spawn.support.tileX,
    spawn.support.tileY,
    camera,
    canvas,
    rect,
    tileSize
  ),
  anchorPoint: computeWorldClientPoint(spawn.x, spawn.y, camera, canvas, rect)
});

const createRectRoot = (border: string, background: string): HTMLDivElement => {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '0';
  root.style.top = '0';
  root.style.width = '0';
  root.style.height = '0';
  root.style.boxSizing = 'border-box';
  root.style.border = border;
  root.style.background = background;
  root.style.borderRadius = '3px';
  root.style.pointerEvents = 'none';
  root.style.display = 'none';
  document.body.append(root);
  return root;
};

const createAnchorRoot = (): HTMLDivElement => {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '0';
  root.style.top = '0';
  root.style.width = '10px';
  root.style.height = '10px';
  root.style.marginLeft = '-5px';
  root.style.marginTop = '-5px';
  root.style.boxSizing = 'border-box';
  root.style.border = '2px solid rgba(108, 255, 171, 0.98)';
  root.style.background = 'rgba(108, 255, 171, 0.22)';
  root.style.borderRadius = '999px';
  root.style.boxShadow = '0 0 0 2px rgba(8, 24, 19, 0.55)';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '11';
  root.style.display = 'none';
  document.body.append(root);
  return root;
};

export class PlayerSpawnMarkerOverlay {
  private aabbRoot: HTMLDivElement;
  private supportRoot: HTMLDivElement;
  private anchorRoot: HTMLDivElement;

  constructor(private canvas: HTMLCanvasElement) {
    this.aabbRoot = createRectRoot('2px solid rgba(108, 255, 171, 0.96)', 'rgba(108, 255, 171, 0.08)');
    this.aabbRoot.style.zIndex = '9';
    this.supportRoot = createRectRoot(
      '2px dashed rgba(108, 255, 171, 0.92)',
      'rgba(108, 255, 171, 0.14)'
    );
    this.supportRoot.style.zIndex = '10';
    this.anchorRoot = createAnchorRoot();
  }

  update(camera: Camera2D, spawn: PlayerSpawnPoint | null): void {
    if (!spawn) {
      this.hideRoots();
      return;
    }

    const canvasRect = this.canvas.getBoundingClientRect();
    const geometry = computePlayerSpawnMarkerClientGeometry(spawn, camera, this.canvas, canvasRect);
    this.updateRectRoot(this.aabbRoot, geometry.aabbRect);
    this.updateRectRoot(this.supportRoot, geometry.supportRect);
    this.anchorRoot.style.display = 'block';
    this.anchorRoot.style.left = `${geometry.anchorPoint.x}px`;
    this.anchorRoot.style.top = `${geometry.anchorPoint.y}px`;
  }

  private updateRectRoot(root: HTMLDivElement, rect: HoveredTileCursorClientRect): void {
    if (rect.width <= 0 || rect.height <= 0) {
      root.style.display = 'none';
      return;
    }

    root.style.display = 'block';
    root.style.left = `${rect.left}px`;
    root.style.top = `${rect.top}px`;
    root.style.width = `${rect.width}px`;
    root.style.height = `${rect.height}px`;
  }

  private hideRoots(): void {
    this.aabbRoot.style.display = 'none';
    this.supportRoot.style.display = 'none';
    this.anchorRoot.style.display = 'none';
  }
}
