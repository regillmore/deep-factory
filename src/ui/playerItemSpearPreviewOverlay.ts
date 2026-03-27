import { Camera2D } from '../core/camera2d';
import { computeWorldClientPoint } from './playerSpawnMarkerOverlay';
import { appendOverlayMount, type OverlayMountOptions } from './overlayMountHost';

const PREVIEW_LINE_HEIGHT_PX = 3;
const PREVIEW_ENDPOINT_SIZE_PX = 12;

export interface PlayerItemSpearPreviewState {
  startWorldX: number;
  startWorldY: number;
  endWorldX: number;
  endWorldY: number;
  activeThrust: boolean;
  clampedByReach: boolean;
}

export type PlayerItemSpearPreviewTone = 'aimed' | 'clamped' | 'active';

export interface PlayerItemSpearPreviewPresentation {
  tone: PlayerItemSpearPreviewTone;
  lineColor: string;
  lineBoxShadow: string;
  endpointBorderColor: string;
  endpointBackground: string;
  endpointBoxShadow: string;
}

export const resolvePlayerItemSpearPreviewTone = (
  preview: PlayerItemSpearPreviewState
): PlayerItemSpearPreviewTone => {
  if (preview.activeThrust) {
    return 'active';
  }
  if (preview.clampedByReach) {
    return 'clamped';
  }
  return 'aimed';
};

export const resolvePlayerItemSpearPreviewPresentation = (
  preview: PlayerItemSpearPreviewState
): PlayerItemSpearPreviewPresentation => {
  const tone = resolvePlayerItemSpearPreviewTone(preview);
  switch (tone) {
    case 'active':
      return {
        tone,
        lineColor: 'rgba(120, 255, 180, 0.96)',
        lineBoxShadow:
          '0 0 0 1px rgba(8, 24, 19, 0.4), 0 0 18px rgba(120, 255, 180, 0.18)',
        endpointBorderColor: 'rgba(120, 255, 180, 0.96)',
        endpointBackground: 'rgba(120, 255, 180, 0.24)',
        endpointBoxShadow:
          '0 0 0 2px rgba(8, 24, 19, 0.45), 0 0 18px rgba(120, 255, 180, 0.2)'
      };
    case 'clamped':
      return {
        tone,
        lineColor: 'rgba(255, 195, 120, 0.96)',
        lineBoxShadow:
          '0 0 0 1px rgba(33, 24, 8, 0.38), 0 0 18px rgba(255, 195, 120, 0.16)',
        endpointBorderColor: 'rgba(255, 195, 120, 0.96)',
        endpointBackground: 'rgba(255, 195, 120, 0.18)',
        endpointBoxShadow:
          '0 0 0 2px rgba(33, 24, 8, 0.42), 0 0 18px rgba(255, 195, 120, 0.18)'
      };
    case 'aimed':
    default:
      return {
        tone,
        lineColor: 'rgba(120, 210, 255, 0.94)',
        lineBoxShadow:
          '0 0 0 1px rgba(8, 18, 33, 0.38), 0 0 18px rgba(120, 210, 255, 0.16)',
        endpointBorderColor: 'rgba(120, 210, 255, 0.95)',
        endpointBackground: 'rgba(120, 210, 255, 0.16)',
        endpointBoxShadow:
          '0 0 0 2px rgba(8, 18, 33, 0.42), 0 0 18px rgba(120, 210, 255, 0.18)'
      };
  }
};

const hideElement = (element: HTMLElement): void => {
  element.style.display = 'none';
};

export class PlayerItemSpearPreviewOverlay {
  private root: HTMLDivElement;
  private line: HTMLDivElement;
  private endpoint: HTMLDivElement;
  private visible = true;

  constructor(private canvas: HTMLCanvasElement, options: OverlayMountOptions = {}) {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '0';
    this.root.style.top = '0';
    this.root.style.width = '100vw';
    this.root.style.height = '100vh';
    this.root.style.pointerEvents = 'none';
    this.root.style.zIndex = '10';
    this.root.style.display = 'none';

    this.line = document.createElement('div');
    this.line.style.position = 'fixed';
    this.line.style.display = 'none';
    this.line.style.height = `${PREVIEW_LINE_HEIGHT_PX}px`;
    this.line.style.borderRadius = '999px';
    this.line.style.transformOrigin = '0 50%';

    this.endpoint = document.createElement('div');
    this.endpoint.style.position = 'fixed';
    this.endpoint.style.display = 'none';
    this.endpoint.style.width = `${PREVIEW_ENDPOINT_SIZE_PX}px`;
    this.endpoint.style.height = `${PREVIEW_ENDPOINT_SIZE_PX}px`;
    this.endpoint.style.marginLeft = `${-PREVIEW_ENDPOINT_SIZE_PX * 0.5}px`;
    this.endpoint.style.marginTop = `${-PREVIEW_ENDPOINT_SIZE_PX * 0.5}px`;
    this.endpoint.style.boxSizing = 'border-box';
    this.endpoint.style.borderRadius = '999px';
    this.endpoint.style.borderWidth = '2px';
    this.endpoint.style.borderStyle = 'solid';

    this.root.append(this.line, this.endpoint);
    appendOverlayMount(this.root, options);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      return;
    }
    this.hidePreview();
  }

  update(camera: Camera2D, preview: PlayerItemSpearPreviewState | null): void {
    if (!this.visible || preview === null || this.canvas.width <= 0 || this.canvas.height <= 0) {
      this.hidePreview();
      return;
    }

    const canvasRect = this.canvas.getBoundingClientRect();
    const start = computeWorldClientPoint(
      preview.startWorldX,
      preview.startWorldY,
      camera,
      this.canvas,
      canvasRect
    );
    const end = computeWorldClientPoint(
      preview.endWorldX,
      preview.endWorldY,
      camera,
      this.canvas,
      canvasRect
    );
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance <= 0) {
      this.hidePreview();
      return;
    }

    const presentation = resolvePlayerItemSpearPreviewPresentation(preview);
    this.root.style.display = 'block';
    this.line.style.display = 'block';
    this.line.style.left = `${start.x}px`;
    this.line.style.top = `${start.y - PREVIEW_LINE_HEIGHT_PX * 0.5}px`;
    this.line.style.width = `${distance}px`;
    this.line.style.transform = `rotate(${Math.atan2(deltaY, deltaX)}rad)`;
    this.line.style.background = presentation.lineColor;
    this.line.style.boxShadow = presentation.lineBoxShadow;

    this.endpoint.style.display = 'block';
    this.endpoint.style.left = `${end.x}px`;
    this.endpoint.style.top = `${end.y}px`;
    this.endpoint.style.borderColor = presentation.endpointBorderColor;
    this.endpoint.style.background = presentation.endpointBackground;
    this.endpoint.style.boxShadow = presentation.endpointBoxShadow;
  }

  private hidePreview(): void {
    this.root.style.display = 'none';
    hideElement(this.line);
    hideElement(this.endpoint);
  }
}
