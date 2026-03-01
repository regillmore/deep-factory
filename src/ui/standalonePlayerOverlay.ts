import { Camera2D } from '../core/camera2d';
import type { CanvasSizeLike, ClientRectLike } from '../input/picking';
import { getPlayerAabb, type PlayerState } from '../world/playerState';
import type { HoveredTileCursorClientRect } from './hoveredTileCursor';
import {
  computeWorldAabbClientRect,
  computeWorldClientPoint,
  type ClientPoint
} from './playerSpawnMarkerOverlay';

export interface StandalonePlayerOverlayClientGeometry {
  aabbRect: HoveredTileCursorClientRect;
  anchorPoint: ClientPoint;
}

export const computeStandalonePlayerOverlayClientGeometry = (
  state: PlayerState,
  camera: Camera2D,
  canvas: CanvasSizeLike,
  rect: ClientRectLike
): StandalonePlayerOverlayClientGeometry => ({
  aabbRect: computeWorldAabbClientRect(getPlayerAabb(state), camera, canvas, rect),
  anchorPoint: computeWorldClientPoint(state.position.x, state.position.y, camera, canvas, rect)
});

const createRectRoot = (): HTMLDivElement => {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '0';
  root.style.top = '0';
  root.style.width = '0';
  root.style.height = '0';
  root.style.boxSizing = 'border-box';
  root.style.border = '2px solid rgba(255, 176, 87, 0.96)';
  root.style.background = 'rgba(255, 176, 87, 0.12)';
  root.style.borderRadius = '4px';
  root.style.boxShadow = '0 0 0 2px rgba(44, 25, 6, 0.45)';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '12';
  root.style.display = 'none';
  document.body.append(root);
  return root;
};

const createAnchorRoot = (): HTMLDivElement => {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '0';
  root.style.top = '0';
  root.style.width = '8px';
  root.style.height = '8px';
  root.style.marginLeft = '-4px';
  root.style.marginTop = '-4px';
  root.style.boxSizing = 'border-box';
  root.style.border = '2px solid rgba(255, 215, 168, 0.98)';
  root.style.background = 'rgba(255, 176, 87, 0.92)';
  root.style.borderRadius = '999px';
  root.style.boxShadow = '0 0 0 2px rgba(44, 25, 6, 0.45)';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '13';
  root.style.display = 'none';
  document.body.append(root);
  return root;
};

export class StandalonePlayerOverlay {
  private aabbRoot: HTMLDivElement;
  private anchorRoot: HTMLDivElement;

  constructor(private canvas: HTMLCanvasElement) {
    this.aabbRoot = createRectRoot();
    this.anchorRoot = createAnchorRoot();
  }

  update(camera: Camera2D, state: PlayerState | null): void {
    if (!state) {
      this.hideRoots();
      return;
    }

    const canvasRect = this.canvas.getBoundingClientRect();
    const geometry = computeStandalonePlayerOverlayClientGeometry(state, camera, this.canvas, canvasRect);

    if (geometry.aabbRect.width <= 0 || geometry.aabbRect.height <= 0) {
      this.hideRoots();
      return;
    }

    this.aabbRoot.style.display = 'block';
    this.aabbRoot.style.left = `${geometry.aabbRect.left}px`;
    this.aabbRoot.style.top = `${geometry.aabbRect.top}px`;
    this.aabbRoot.style.width = `${geometry.aabbRect.width}px`;
    this.aabbRoot.style.height = `${geometry.aabbRect.height}px`;

    this.anchorRoot.style.display = 'block';
    this.anchorRoot.style.left = `${geometry.anchorPoint.x}px`;
    this.anchorRoot.style.top = `${geometry.anchorPoint.y}px`;
  }

  private hideRoots(): void {
    this.aabbRoot.style.display = 'none';
    this.anchorRoot.style.display = 'none';
  }
}
