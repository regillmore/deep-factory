import { Camera2D } from '../core/camera2d';
import {
  computeHoveredTileCursorClientRect,
  type HoveredTileCursorClientRect,
  type HoveredTileCursorTarget
} from './hoveredTileCursor';

export interface PlayerItemBunnyReleasePreviewState {
  tileX: number;
  tileY: number;
  canRelease: boolean;
  placementRangeWithinReach: boolean;
  landingTile: HoveredTileCursorTarget | null;
}

export type PlayerItemBunnyReleasePreviewTone = 'releasable' | 'out-of-range' | 'blocked';

export interface PlayerItemBunnyReleasePreviewPresentation {
  tone: PlayerItemBunnyReleasePreviewTone;
  borderColor: string;
  borderStyle: 'solid' | 'dashed';
  background: string;
  boxShadow: string;
}

export const resolvePlayerItemBunnyReleasePreviewTone = (
  preview: PlayerItemBunnyReleasePreviewState
): PlayerItemBunnyReleasePreviewTone => {
  if (preview.canRelease) {
    return 'releasable';
  }
  if (!preview.placementRangeWithinReach) {
    return 'out-of-range';
  }
  return 'blocked';
};

export const resolvePlayerItemBunnyReleasePreviewPresentation = (
  preview: PlayerItemBunnyReleasePreviewState
): PlayerItemBunnyReleasePreviewPresentation => {
  const tone = resolvePlayerItemBunnyReleasePreviewTone(preview);
  switch (tone) {
    case 'releasable':
      return {
        tone,
        borderColor: 'rgba(120, 255, 180, 0.96)',
        borderStyle: 'solid',
        background: 'rgba(120, 255, 180, 0.16)',
        boxShadow:
          '0 0 0 1px rgba(8, 24, 19, 0.45), 0 0 18px rgba(120, 255, 180, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
    case 'out-of-range':
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
        borderColor: 'rgba(255, 130, 130, 0.96)',
        borderStyle: 'dashed',
        background: 'rgba(255, 130, 130, 0.14)',
        boxShadow:
          '0 0 0 1px rgba(33, 12, 12, 0.45), 0 0 18px rgba(255, 130, 130, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
  }
};

export const resolvePlayerItemBunnyReleaseLandingMarkerTarget = (
  preview: PlayerItemBunnyReleasePreviewState
): HoveredTileCursorTarget | null => {
  if (!preview.canRelease || preview.landingTile === null) {
    return null;
  }

  if (preview.landingTile.tileX === preview.tileX && preview.landingTile.tileY === preview.tileY) {
    return null;
  }

  return preview.landingTile;
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

const createPreviewRoot = (): HTMLDivElement => {
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
  document.body.append(root);
  return root;
};

const createLandingMarkerRoot = (): HTMLDivElement => {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '0';
  root.style.top = '0';
  root.style.width = '0';
  root.style.height = '0';
  root.style.boxSizing = 'border-box';
  root.style.border = '2px solid rgba(120, 255, 180, 0.98)';
  root.style.background = 'rgba(120, 255, 180, 0.24)';
  root.style.boxShadow =
    '0 0 0 1px rgba(8, 24, 19, 0.38), 0 0 14px rgba(120, 255, 180, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
  root.style.borderRadius = '999px';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '10';
  root.style.display = 'none';
  document.body.append(root);
  return root;
};

const updateLandingMarkerRoot = (root: HTMLDivElement, rect: HoveredTileCursorClientRect): void => {
  if (rect.width <= 0 || rect.height <= 0) {
    root.style.display = 'none';
    return;
  }

  const markerSize = Math.min(rect.width, rect.height) * 0.48;
  if (markerSize <= 0) {
    root.style.display = 'none';
    return;
  }

  root.style.display = 'block';
  root.style.left = `${rect.left + (rect.width - markerSize) * 0.5}px`;
  root.style.top = `${rect.top + (rect.height - markerSize) * 0.5}px`;
  root.style.width = `${markerSize}px`;
  root.style.height = `${markerSize}px`;
};

export class PlayerItemBunnyReleasePreviewOverlay {
  private root: HTMLDivElement;
  private landingMarkerRoot: HTMLDivElement;
  private visible = true;

  constructor(private canvas: HTMLCanvasElement) {
    this.root = createPreviewRoot();
    this.landingMarkerRoot = createLandingMarkerRoot();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      return;
    }
    this.hideAll();
  }

  update(camera: Camera2D, preview: PlayerItemBunnyReleasePreviewState | null): void {
    if (!this.visible || preview === null) {
      this.hideAll();
      return;
    }

    const canvasRect = this.canvas.getBoundingClientRect();
    const clientRect = computeHoveredTileCursorClientRect(
      preview.tileX,
      preview.tileY,
      camera,
      this.canvas,
      canvasRect
    );
    updatePreviewRoot(this.root, clientRect);
    if (clientRect.width <= 0 || clientRect.height <= 0) {
      hidePreviewRoot(this.landingMarkerRoot);
      return;
    }

    const presentation = resolvePlayerItemBunnyReleasePreviewPresentation(preview);
    this.root.style.borderColor = presentation.borderColor;
    this.root.style.borderStyle = presentation.borderStyle;
    this.root.style.borderWidth = '2px';
    this.root.style.background = presentation.background;
    this.root.style.boxShadow = presentation.boxShadow;

    const landingMarkerTarget = resolvePlayerItemBunnyReleaseLandingMarkerTarget(preview);
    if (landingMarkerTarget === null) {
      hidePreviewRoot(this.landingMarkerRoot);
      return;
    }

    const landingClientRect = computeHoveredTileCursorClientRect(
      landingMarkerTarget.tileX,
      landingMarkerTarget.tileY,
      camera,
      this.canvas,
      canvasRect
    );
    updateLandingMarkerRoot(this.landingMarkerRoot, landingClientRect);
  }

  private hideAll(): void {
    hidePreviewRoot(this.root);
    hidePreviewRoot(this.landingMarkerRoot);
  }
}
