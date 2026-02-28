import type { DebugEditStatusStripState } from './debugEditStatusHelpers';
import { buildDebugEditStatusStripModel } from './debugEditStatusHelpers';

const withAlpha = (color: string, alpha: string): string => color.replace(/[\d.]+\)\s*$/, `${alpha})`);

const createSummaryChip = (): HTMLDivElement => {
  const chip = document.createElement('div');
  chip.style.display = 'inline-flex';
  chip.style.alignItems = 'center';
  chip.style.padding = '4px 8px';
  chip.style.borderRadius = '999px';
  chip.style.border = '1px solid rgba(255, 255, 255, 0.16)';
  chip.style.background = 'rgba(255, 255, 255, 0.06)';
  chip.style.color = 'rgba(244, 248, 252, 0.98)';
  chip.style.whiteSpace = 'nowrap';
  chip.style.overflow = 'hidden';
  chip.style.textOverflow = 'ellipsis';
  chip.style.maxWidth = '100%';
  return chip;
};

export class DebugEditStatusStrip {
  private root: HTMLDivElement;
  private summaryRow: HTMLDivElement;
  private modeChip: HTMLDivElement;
  private brushChip: HTMLDivElement;
  private toolChip: HTMLDivElement;
  private hintLine: HTMLDivElement;

  constructor(private canvas: HTMLCanvasElement) {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.display = 'none';
    this.root.style.left = '0';
    this.root.style.bottom = '0';
    this.root.style.zIndex = '12';
    this.root.style.pointerEvents = 'none';
    this.root.style.boxSizing = 'border-box';
    this.root.style.padding = '8px 10px';
    this.root.style.borderRadius = '12px';
    this.root.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.root.style.background = 'rgba(8, 14, 24, 0.84)';
    this.root.style.boxShadow = '0 8px 18px rgba(0, 0, 0, 0.24)';
    this.root.style.backdropFilter = 'blur(3px)';
    this.root.style.font = '600 11px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    this.root.style.letterSpacing = '0.01em';
    this.root.style.gap = '6px';
    this.root.style.flexDirection = 'column';

    this.summaryRow = document.createElement('div');
    this.summaryRow.style.display = 'flex';
    this.summaryRow.style.flexWrap = 'wrap';
    this.summaryRow.style.gap = '6px';
    this.root.append(this.summaryRow);

    this.modeChip = createSummaryChip();
    this.modeChip.style.borderColor = 'rgba(120, 210, 255, 0.32)';
    this.modeChip.style.background = 'rgba(120, 210, 255, 0.14)';

    this.brushChip = createSummaryChip();
    this.brushChip.style.borderColor = 'rgba(120, 255, 180, 0.3)';
    this.brushChip.style.background = 'rgba(120, 255, 180, 0.12)';

    this.toolChip = createSummaryChip();

    this.summaryRow.append(this.modeChip, this.brushChip, this.toolChip);

    this.hintLine = document.createElement('div');
    this.hintLine.style.color = 'rgba(222, 231, 240, 0.96)';
    this.hintLine.style.paddingTop = '2px';
    this.hintLine.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
    this.hintLine.style.whiteSpace = 'normal';
    this.root.append(this.hintLine);

    document.body.append(this.root);
  }

  update(state: DebugEditStatusStripState): void {
    const canvasRect = this.canvas.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvasRect.height <= 0) {
      this.root.style.display = 'none';
      return;
    }

    const model = buildDebugEditStatusStripModel(state);
    this.root.style.display = 'flex';
    this.root.style.left = `${canvasRect.left + 10}px`;
    this.root.style.bottom = `${Math.max(4, window.innerHeight - canvasRect.bottom + 10)}px`;
    this.root.style.maxWidth = `${Math.max(0, canvasRect.width - 20)}px`;
    this.root.style.borderColor = withAlpha(model.toolAccent, '0.22');
    this.root.style.boxShadow = `0 8px 18px rgba(0, 0, 0, 0.24), inset 0 0 0 1px ${withAlpha(model.toolAccent, '0.12')}`;

    this.modeChip.textContent = model.modeText;
    this.brushChip.textContent = model.brushText;
    this.toolChip.textContent = model.toolText;
    this.toolChip.style.borderColor = withAlpha(model.toolAccent, '0.34');
    this.toolChip.style.background = withAlpha(model.toolAccent, '0.16');

    this.hintLine.textContent = model.hintText;
    this.hintLine.style.borderTopColor = withAlpha(model.toolAccent, '0.16');
  }
}
