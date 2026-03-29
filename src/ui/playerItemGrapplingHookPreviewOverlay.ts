import { Camera2D } from '../core/camera2d';
import { computeHoveredTileCursorClientRect, type HoveredTileCursorClientRect } from './hoveredTileCursor';
import { appendOverlayMount, type OverlayMountOptions } from './overlayMountHost';

export interface PlayerItemGrapplingHookPreviewState {
  tileX: number;
  tileY: number;
  withinRange: boolean;
  latchReady: boolean;
}

export type PlayerItemGrapplingHookPreviewTone = 'neutral' | 'latch-ready' | 'out-of-range';

export interface PlayerItemGrapplingHookPreviewPresentation {
  tone: PlayerItemGrapplingHookPreviewTone;
  borderColor: string;
  borderStyle: 'solid' | 'dashed';
  background: string;
  boxShadow: string;
}

export const resolvePlayerItemGrapplingHookPreviewTone = (
  preview: PlayerItemGrapplingHookPreviewState
): PlayerItemGrapplingHookPreviewTone => {
  if (!preview.withinRange) {
    return 'out-of-range';
  }

  return preview.latchReady ? 'latch-ready' : 'neutral';
};

export const resolvePlayerItemGrapplingHookPreviewPresentation = (
  preview: PlayerItemGrapplingHookPreviewState
): PlayerItemGrapplingHookPreviewPresentation => {
  const tone = resolvePlayerItemGrapplingHookPreviewTone(preview);
  switch (tone) {
    case 'latch-ready':
      return {
        tone,
        borderColor: 'rgba(120, 210, 255, 0.95)',
        borderStyle: 'solid',
        background: 'rgba(120, 210, 255, 0.14)',
        boxShadow:
          '0 0 0 1px rgba(8, 18, 33, 0.4), 0 0 18px rgba(120, 210, 255, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
    case 'neutral':
      return {
        tone,
        borderColor: 'rgba(176, 190, 208, 0.92)',
        borderStyle: 'dashed',
        background: 'rgba(176, 190, 208, 0.12)',
        boxShadow:
          '0 0 0 1px rgba(8, 14, 24, 0.45), 0 0 18px rgba(176, 190, 208, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
      };
    case 'out-of-range':
    default:
      return {
        tone,
        borderColor: 'rgba(255, 195, 120, 0.96)',
        borderStyle: 'dashed',
        background: 'rgba(255, 195, 120, 0.14)',
        boxShadow:
          '0 0 0 1px rgba(33, 24, 8, 0.4), 0 0 18px rgba(255, 195, 120, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'
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

const createPreviewRoot = (options: OverlayMountOptions = {}): HTMLDivElement => {
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
  return appendOverlayMount(root, options);
};

export class PlayerItemGrapplingHookPreviewOverlay {
  private root: HTMLDivElement;
  private visible = true;

  constructor(private canvas: HTMLCanvasElement, options: OverlayMountOptions = {}) {
    this.root = createPreviewRoot(options);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      return;
    }
    hidePreviewRoot(this.root);
  }

  update(camera: Camera2D, preview: PlayerItemGrapplingHookPreviewState | null): void {
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

    const presentation = resolvePlayerItemGrapplingHookPreviewPresentation(preview);
    this.root.style.borderColor = presentation.borderColor;
    this.root.style.borderStyle = presentation.borderStyle;
    this.root.style.borderWidth = '2px';
    this.root.style.background = presentation.background;
    this.root.style.boxShadow = presentation.boxShadow;
  }
}
