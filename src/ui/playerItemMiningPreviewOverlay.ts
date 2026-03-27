import { Camera2D } from '../core/camera2d';
import { computeHoveredTileCursorClientRect, type HoveredTileCursorClientRect } from './hoveredTileCursor';
import { appendOverlayMount, type OverlayMountOptions } from './overlayMountHost';

export interface PlayerItemMiningPreviewState {
  tileX: number;
  tileY: number;
  canMine: boolean;
  occupied: boolean;
  breakableTarget: boolean;
  withinRange: boolean;
  progressNormalized: number;
}

export type PlayerItemMiningPreviewTone =
  | 'mineable'
  | 'out-of-range'
  | 'unbreakable'
  | 'empty';

export interface PlayerItemMiningPreviewPresentation {
  tone: PlayerItemMiningPreviewTone;
  borderColor: string;
  borderStyle: 'solid' | 'dashed';
  background: string;
  boxShadow: string;
  progressFill: string;
}

export const resolvePlayerItemMiningPreviewTone = (
  preview: PlayerItemMiningPreviewState
): PlayerItemMiningPreviewTone => {
  if (preview.canMine) {
    return 'mineable';
  }
  if (!preview.occupied) {
    return 'empty';
  }
  if (!preview.breakableTarget) {
    return 'unbreakable';
  }
  return 'out-of-range';
};

export const resolvePlayerItemMiningPreviewPresentation = (
  preview: PlayerItemMiningPreviewState
): PlayerItemMiningPreviewPresentation => {
  const tone = resolvePlayerItemMiningPreviewTone(preview);
  switch (tone) {
    case 'mineable':
      return {
        tone,
        borderColor: 'rgba(120, 255, 180, 0.96)',
        borderStyle: 'solid',
        background: 'rgba(120, 255, 180, 0.1)',
        boxShadow:
          '0 0 0 1px rgba(8, 24, 19, 0.45), 0 0 18px rgba(120, 255, 180, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
        progressFill: 'rgba(120, 255, 180, 0.32)'
      };
    case 'out-of-range':
      return {
        tone,
        borderColor: 'rgba(255, 195, 120, 0.96)',
        borderStyle: 'dashed',
        background: 'rgba(255, 195, 120, 0.12)',
        boxShadow:
          '0 0 0 1px rgba(33, 24, 8, 0.4), 0 0 18px rgba(255, 195, 120, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
        progressFill: 'rgba(255, 195, 120, 0.26)'
      };
    case 'unbreakable':
      return {
        tone,
        borderColor: 'rgba(176, 190, 208, 0.92)',
        borderStyle: 'dashed',
        background: 'rgba(176, 190, 208, 0.1)',
        boxShadow:
          '0 0 0 1px rgba(8, 14, 24, 0.45), 0 0 18px rgba(176, 190, 208, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
        progressFill: 'rgba(176, 190, 208, 0.2)'
      };
    case 'empty':
    default:
      return {
        tone,
        borderColor: 'rgba(255, 130, 130, 0.96)',
        borderStyle: 'dashed',
        background: 'rgba(255, 130, 130, 0.1)',
        boxShadow:
          '0 0 0 1px rgba(33, 12, 12, 0.45), 0 0 18px rgba(255, 130, 130, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
        progressFill: 'rgba(255, 130, 130, 0.18)'
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

const createPreviewRoot = (
  options: OverlayMountOptions = {}
): { root: HTMLDivElement; progressFill: HTMLDivElement } => {
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
  root.style.overflow = 'hidden';

  const progressFill = document.createElement('div');
  progressFill.style.position = 'absolute';
  progressFill.style.left = '0';
  progressFill.style.right = '0';
  progressFill.style.bottom = '0';
  progressFill.style.height = '0';
  progressFill.style.pointerEvents = 'none';
  progressFill.style.transition = 'height 90ms linear';

  root.append(progressFill);
  appendOverlayMount(root, options);

  return { root, progressFill };
};

export class PlayerItemMiningPreviewOverlay {
  private root: HTMLDivElement;
  private progressFill: HTMLDivElement;
  private visible = true;

  constructor(private canvas: HTMLCanvasElement, options: OverlayMountOptions = {}) {
    const elements = createPreviewRoot(options);
    this.root = elements.root;
    this.progressFill = elements.progressFill;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      return;
    }
    hidePreviewRoot(this.root);
  }

  update(camera: Camera2D, preview: PlayerItemMiningPreviewState | null): void {
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

    const presentation = resolvePlayerItemMiningPreviewPresentation(preview);
    this.root.style.borderColor = presentation.borderColor;
    this.root.style.borderStyle = presentation.borderStyle;
    this.root.style.borderWidth = '2px';
    this.root.style.background = presentation.background;
    this.root.style.boxShadow = presentation.boxShadow;
    this.progressFill.style.background = presentation.progressFill;
    this.progressFill.style.height = `${Math.round(
      Math.max(0, Math.min(1, preview.progressNormalized)) * 100
    )}%`;
  }
}
