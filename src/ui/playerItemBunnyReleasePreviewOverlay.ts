import { Camera2D } from '../core/camera2d';
import { computeHoveredTileCursorClientRect, type HoveredTileCursorClientRect } from './hoveredTileCursor';

export interface PlayerItemBunnyReleasePreviewState {
  tileX: number;
  tileY: number;
  canRelease: boolean;
  placementRangeWithinReach: boolean;
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

export class PlayerItemBunnyReleasePreviewOverlay {
  private root: HTMLDivElement;
  private visible = true;

  constructor(private canvas: HTMLCanvasElement) {
    this.root = createPreviewRoot();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      return;
    }
    hidePreviewRoot(this.root);
  }

  update(camera: Camera2D, preview: PlayerItemBunnyReleasePreviewState | null): void {
    if (!this.visible || preview === null) {
      hidePreviewRoot(this.root);
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
      return;
    }

    const presentation = resolvePlayerItemBunnyReleasePreviewPresentation(preview);
    this.root.style.borderColor = presentation.borderColor;
    this.root.style.borderStyle = presentation.borderStyle;
    this.root.style.borderWidth = '2px';
    this.root.style.background = presentation.background;
    this.root.style.boxShadow = presentation.boxShadow;
  }
}
