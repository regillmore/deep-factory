import { Camera2D } from '../core/camera2d';
import { TILE_SIZE } from '../world/constants';

export interface ClientRectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CanvasSizeLike {
  width: number;
  height: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface WorldPoint {
  x: number;
  y: number;
}

export interface TilePoint {
  x: number;
  y: number;
}

export interface ScreenWorldTilePick {
  canvas: CanvasPoint;
  world: WorldPoint;
  tile: TilePoint;
}

export const clientToCanvasPoint = (
  clientX: number,
  clientY: number,
  canvas: CanvasSizeLike,
  rect: ClientRectLike
): CanvasPoint => {
  const dprScaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const dprScaleY = rect.height > 0 ? canvas.height / rect.height : 1;

  return {
    x: (clientX - rect.left) * dprScaleX,
    y: (clientY - rect.top) * dprScaleY
  };
};

export const canvasToWorldPoint = (
  screenX: number,
  screenY: number,
  canvas: CanvasSizeLike,
  camera: Camera2D
): WorldPoint => camera.screenToWorld(screenX, screenY, canvas.width, canvas.height);

export const worldToTilePoint = (
  worldX: number,
  worldY: number,
  tileSize: number = TILE_SIZE
): TilePoint => ({
  x: Math.floor(worldX / tileSize),
  y: Math.floor(worldY / tileSize)
});

export const clientToWorldPoint = (
  clientX: number,
  clientY: number,
  canvas: CanvasSizeLike,
  rect: ClientRectLike,
  camera: Camera2D
): WorldPoint => {
  const canvasPoint = clientToCanvasPoint(clientX, clientY, canvas, rect);
  return canvasToWorldPoint(canvasPoint.x, canvasPoint.y, canvas, camera);
};

export const pickScreenWorldTile = (
  clientX: number,
  clientY: number,
  canvas: CanvasSizeLike,
  rect: ClientRectLike,
  camera: Camera2D,
  tileSize: number = TILE_SIZE
): ScreenWorldTilePick => {
  const canvasPoint = clientToCanvasPoint(clientX, clientY, canvas, rect);
  const worldPoint = canvasToWorldPoint(canvasPoint.x, canvasPoint.y, canvas, camera);
  return {
    canvas: canvasPoint,
    world: worldPoint,
    tile: worldToTilePoint(worldPoint.x, worldPoint.y, tileSize)
  };
};

export const pickScreenWorldTileFromCanvas = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: Camera2D,
  tileSize: number = TILE_SIZE
): ScreenWorldTilePick =>
  pickScreenWorldTile(clientX, clientY, canvas, canvas.getBoundingClientRect(), camera, tileSize);
