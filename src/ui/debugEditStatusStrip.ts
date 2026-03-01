import type { DebugEditStatusStripState } from './debugEditStatusHelpers';
import { buildDebugEditStatusStripModel } from './debugEditStatusHelpers';

const withAlpha = (color: string, alpha: string): string => color.replace(/[\d.]+\)\s*$/, `${alpha})`);

export interface DebugEditStatusStripActionHandlers {
  onInspectAction?: () => void;
  onClearPinnedTile?: () => void;
}

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

const createActionButton = (): HTMLButtonElement => {
  const button = document.createElement('button');
  button.type = 'button';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.padding = '4px 10px';
  button.style.borderRadius = '999px';
  button.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  button.style.background = 'rgba(255, 255, 255, 0.08)';
  button.style.color = 'rgba(244, 248, 252, 0.98)';
  button.style.font = 'inherit';
  button.style.letterSpacing = 'inherit';
  button.style.cursor = 'pointer';
  button.style.pointerEvents = 'auto';
  button.style.userSelect = 'none';
  return button;
};

export class DebugEditStatusStrip {
  private root: HTMLDivElement;
  private summaryRow: HTMLDivElement;
  private modeChip: HTMLDivElement;
  private brushChip: HTMLDivElement;
  private toolChip: HTMLDivElement;
  private inspectChip: HTMLDivElement;
  private actionRow: HTMLDivElement;
  private inspectActionButton: HTMLButtonElement;
  private clearActionButton: HTMLButtonElement;
  private hoverLine: HTMLDivElement;
  private hintLine: HTMLDivElement;
  private onInspectAction: () => void = () => {};
  private onClearPinnedTile: () => void = () => {};

  constructor(private canvas: HTMLCanvasElement, handlers: DebugEditStatusStripActionHandlers = {}) {
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
    this.inspectChip = createSummaryChip();

    this.summaryRow.append(this.modeChip, this.brushChip, this.toolChip, this.inspectChip);

    this.actionRow = document.createElement('div');
    this.actionRow.style.display = 'flex';
    this.actionRow.style.flexWrap = 'wrap';
    this.actionRow.style.gap = '6px';
    this.actionRow.style.pointerEvents = 'auto';
    this.root.append(this.actionRow);

    this.inspectActionButton = createActionButton();
    this.clearActionButton = createActionButton();
    this.clearActionButton.style.borderColor = 'rgba(255, 185, 150, 0.3)';
    this.clearActionButton.style.background = 'rgba(255, 185, 150, 0.14)';
    this.actionRow.append(this.inspectActionButton, this.clearActionButton);

    const stopActionEvent = (event: Event): void => {
      event.preventDefault();
      event.stopPropagation();
    };
    this.inspectActionButton.addEventListener('pointerdown', stopActionEvent);
    this.inspectActionButton.addEventListener('click', (event) => {
      stopActionEvent(event);
      this.onInspectAction();
    });
    this.clearActionButton.addEventListener('pointerdown', stopActionEvent);
    this.clearActionButton.addEventListener('click', (event) => {
      stopActionEvent(event);
      this.onClearPinnedTile();
    });

    this.hoverLine = document.createElement('div');
    this.hoverLine.style.color = 'rgba(236, 242, 248, 0.96)';
    this.hoverLine.style.whiteSpace = 'pre-line';
    this.hoverLine.style.maxWidth = '100%';
    this.root.append(this.hoverLine);

    this.hintLine = document.createElement('div');
    this.hintLine.style.color = 'rgba(222, 231, 240, 0.96)';
    this.hintLine.style.paddingTop = '2px';
    this.hintLine.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
    this.hintLine.style.whiteSpace = 'normal';
    this.root.append(this.hintLine);

    document.body.append(this.root);
    this.setActionHandlers(handlers);
  }

  setActionHandlers(handlers: DebugEditStatusStripActionHandlers): void {
    this.onInspectAction = handlers.onInspectAction ?? (() => {});
    this.onClearPinnedTile = handlers.onClearPinnedTile ?? (() => {});
  }

  getPointerInspectRetainerElement(): HTMLElement {
    return this.actionRow;
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
    this.inspectChip.textContent = model.inspectText;
    this.inspectChip.style.borderColor = withAlpha(model.inspectAccent, '0.34');
    this.inspectChip.style.background = withAlpha(model.inspectAccent, '0.16');

    this.inspectActionButton.textContent = model.inspectActionText;
    this.inspectActionButton.style.borderColor = withAlpha(model.inspectAccent, '0.34');
    this.inspectActionButton.style.background = withAlpha(model.inspectAccent, '0.16');
    this.clearActionButton.textContent = model.clearActionText ?? '';
    this.clearActionButton.style.display = model.clearActionText ? 'inline-flex' : 'none';

    this.hoverLine.textContent = model.hoverText;
    this.hintLine.textContent = model.hintText;
    this.hintLine.style.borderTopColor = withAlpha(model.toolAccent, '0.16');
  }
}
