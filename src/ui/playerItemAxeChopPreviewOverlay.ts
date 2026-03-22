import { Camera2D } from '../core/camera2d';
import type { SmallTreeGrowthStage } from '../world/smallTreeAnchors';
import { computeHoveredTileCursorClientRect, type HoveredTileCursorClientRect } from './hoveredTileCursor';

export interface PlayerItemAxeChopPreviewState {
  tileX: number;
  tileY: number;
  canChop: boolean;
  occupied: boolean;
  chopTarget: boolean;
  withinRange: boolean;
  growthStage: SmallTreeGrowthStage | null;
  activeSwing: boolean;
}

export type PlayerItemAxeChopPreviewTone =
  | 'sapling-target'
  | 'grown-target'
  | 'out-of-range'
  | 'blocked'
  | 'empty';

export interface PlayerItemAxeChopPreviewPresentation {
  tone: PlayerItemAxeChopPreviewTone;
  borderColor: string;
  borderStyle: 'solid' | 'dashed';
  background: string;
  boxShadow: string;
}

export const resolvePlayerItemAxeChopPreviewTone = (
  preview: PlayerItemAxeChopPreviewState
): PlayerItemAxeChopPreviewTone => {
  if (preview.growthStage === 'planted' && (preview.canChop || preview.activeSwing)) {
    return 'sapling-target';
  }
  if (preview.growthStage === 'grown' && (preview.canChop || preview.activeSwing)) {
    return 'grown-target';
  }
  if (!preview.occupied) {
    return 'empty';
  }
  if (!preview.chopTarget) {
    return 'blocked';
  }
  return 'out-of-range';
};

export const resolvePlayerItemAxeChopPreviewPresentation = (
  preview: PlayerItemAxeChopPreviewState
): PlayerItemAxeChopPreviewPresentation => {
  const tone = resolvePlayerItemAxeChopPreviewTone(preview);
  switch (tone) {
    case 'sapling-target':
      return {
        tone,
        borderColor: 'rgba(132, 255, 176, 0.96)',
        borderStyle: 'solid',
        background: 'rgba(132, 255, 176, 0.18)',
        boxShadow:
          '0 0 0 1px rgba(8, 24, 17, 0.45), 0 0 18px rgba(132, 255, 176, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
    case 'grown-target':
      return {
        tone,
        borderColor: 'rgba(255, 183, 112, 0.96)',
        borderStyle: 'solid',
        background: 'rgba(255, 183, 112, 0.18)',
        boxShadow:
          '0 0 0 1px rgba(33, 20, 8, 0.45), 0 0 18px rgba(255, 183, 112, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
    case 'out-of-range':
      return {
        tone,
        borderColor: 'rgba(190, 207, 224, 0.94)',
        borderStyle: 'dashed',
        background: 'rgba(190, 207, 224, 0.12)',
        boxShadow:
          '0 0 0 1px rgba(10, 16, 26, 0.45), 0 0 18px rgba(190, 207, 224, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
      };
    case 'blocked':
      return {
        tone,
        borderColor: 'rgba(176, 190, 208, 0.92)',
        borderStyle: 'dashed',
        background: 'rgba(176, 190, 208, 0.12)',
        boxShadow:
          '0 0 0 1px rgba(8, 14, 24, 0.45), 0 0 18px rgba(176, 190, 208, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
      };
    case 'empty':
    default:
      return {
        tone,
        borderColor: 'rgba(255, 130, 130, 0.96)',
        borderStyle: 'dashed',
        background: 'rgba(255, 130, 130, 0.12)',
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

export class PlayerItemAxeChopPreviewOverlay {
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

  update(camera: Camera2D, preview: PlayerItemAxeChopPreviewState | null): void {
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

    const presentation = resolvePlayerItemAxeChopPreviewPresentation(preview);
    this.root.style.borderColor = presentation.borderColor;
    this.root.style.borderStyle = presentation.borderStyle;
    this.root.style.borderWidth = '2px';
    this.root.style.background = presentation.background;
    this.root.style.boxShadow = presentation.boxShadow;
  }
}
