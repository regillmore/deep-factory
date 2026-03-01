import type { DebugEditStatusStripState } from './debugEditStatusHelpers';
import { buildDebugEditStatusStripModel } from './debugEditStatusHelpers';

const withAlpha = (color: string, alpha: string): string => color.replace(/[\d.]+\)\s*$/, `${alpha})`);

export interface DebugEditStatusStripActionHandlers {
  onInspectAction?: () => void;
  onClearPinnedTile?: () => void;
}

interface SummaryChipStyleTarget {
  style: {
    display?: string;
    flex?: string;
    flexWrap?: string;
    alignItems?: string;
    columnGap?: string;
    rowGap?: string;
    padding?: string;
    borderRadius?: string;
    border?: string;
    background?: string;
    color?: string;
    minWidth?: string;
    maxWidth?: string;
    overflow?: string;
    overflowWrap?: string;
    textOverflow?: string;
  };
}

interface SummaryChipView {
  root: HTMLDivElement;
  label: HTMLSpanElement;
  detail: HTMLSpanElement;
}

const DETAIL_SEGMENT_SEPARATOR = ' | ';
const ACTION_ROW_GAP_PX = 6;
const ACTION_BUTTON_MIN_WIDTH_PX = 116;

export const buildWrappedDetailLines = (text: string): string[][] =>
  text.split('\n').map((line) =>
    line.split(DETAIL_SEGMENT_SEPARATOR).map((segment, index) => (index === 0 ? segment : `| ${segment}`))
  );

export const resolveActionRowShouldStack = (availableWidth: number, visibleActionCount: number): boolean => {
  const clampedActionCount = Math.max(1, visibleActionCount);
  const inlineWidth =
    clampedActionCount * ACTION_BUTTON_MIN_WIDTH_PX + (clampedActionCount - 1) * ACTION_ROW_GAP_PX;
  return availableWidth < inlineWidth;
};

export const splitSummaryChipText = (text: string): { label: string; detail: string | null } => {
  const separatorIndex = text.indexOf(': ');
  if (separatorIndex < 0) {
    return {
      label: text,
      detail: null
    };
  }

  return {
    label: text.slice(0, separatorIndex + 1),
    detail: text.slice(separatorIndex + 2)
  };
};

export const applySummaryChipStyles = (chip: SummaryChipStyleTarget): void => {
  chip.style.display = 'inline-flex';
  chip.style.flex = '0 1 auto';
  chip.style.flexWrap = 'wrap';
  chip.style.alignItems = 'center';
  chip.style.columnGap = '4px';
  chip.style.rowGap = '2px';
  chip.style.padding = '4px 8px';
  chip.style.borderRadius = '999px';
  chip.style.border = '1px solid rgba(255, 255, 255, 0.16)';
  chip.style.background = 'rgba(255, 255, 255, 0.06)';
  chip.style.color = 'rgba(244, 248, 252, 0.98)';
  chip.style.minWidth = '0';
  chip.style.overflowWrap = 'anywhere';
  chip.style.overflow = 'hidden';
  chip.style.textOverflow = 'clip';
  chip.style.maxWidth = '100%';
};

const createSummaryChip = (): SummaryChipView => {
  const root = document.createElement('div');
  applySummaryChipStyles(root);

  const label = document.createElement('span');
  label.style.whiteSpace = 'nowrap';

  const detail = document.createElement('span');
  detail.style.minWidth = '0';
  detail.style.maxWidth = '100%';
  detail.style.overflowWrap = 'anywhere';
  detail.style.wordBreak = 'break-word';

  root.append(label, detail);
  return { root, label, detail };
};

const setSummaryChipText = (chip: SummaryChipView, text: string): void => {
  const summaryText = splitSummaryChipText(text);
  chip.label.textContent = summaryText.label;
  chip.detail.textContent = summaryText.detail ?? '';
  chip.detail.style.display = summaryText.detail ? 'inline' : 'none';
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
  button.style.minWidth = '0';
  button.style.maxWidth = '100%';
  button.style.whiteSpace = 'normal';
  button.style.textAlign = 'center';
  return button;
};

const createWrappedDetailContainer = (): HTMLDivElement => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '2px';
  container.style.width = '100%';
  container.style.maxWidth = '100%';
  container.style.minWidth = '0';
  container.style.boxSizing = 'border-box';
  return container;
};

const createWrappedDetailRow = (): HTMLDivElement => {
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.flexWrap = 'wrap';
  row.style.alignItems = 'baseline';
  row.style.columnGap = '6px';
  row.style.rowGap = '2px';
  row.style.minWidth = '0';
  return row;
};

const createWrappedDetailSegment = (text: string): HTMLSpanElement => {
  const segment = document.createElement('span');
  segment.textContent = text;
  segment.style.minWidth = '0';
  segment.style.overflowWrap = 'anywhere';
  return segment;
};

const renderWrappedDetailText = (container: HTMLDivElement, text: string): void => {
  container.replaceChildren(
    ...buildWrappedDetailLines(text).map((segments) => {
      const row = createWrappedDetailRow();
      row.append(...segments.map(createWrappedDetailSegment));
      return row;
    })
  );
};

export class DebugEditStatusStrip {
  private root: HTMLDivElement;
  private summaryRow: HTMLDivElement;
  private modeChip: SummaryChipView;
  private brushChip: SummaryChipView;
  private toolChip: SummaryChipView;
  private inspectChip: SummaryChipView;
  private actionRow: HTMLDivElement;
  private inspectActionButton: HTMLButtonElement;
  private clearActionButton: HTMLButtonElement;
  private previewLine: HTMLDivElement;
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
    this.modeChip.root.style.borderColor = 'rgba(120, 210, 255, 0.32)';
    this.modeChip.root.style.background = 'rgba(120, 210, 255, 0.14)';

    this.brushChip = createSummaryChip();
    this.brushChip.root.style.borderColor = 'rgba(120, 255, 180, 0.3)';
    this.brushChip.root.style.background = 'rgba(120, 255, 180, 0.12)';

    this.toolChip = createSummaryChip();
    this.inspectChip = createSummaryChip();

    this.summaryRow.append(this.modeChip.root, this.brushChip.root, this.toolChip.root, this.inspectChip.root);

    this.actionRow = document.createElement('div');
    this.actionRow.style.display = 'flex';
    this.actionRow.style.flexWrap = 'wrap';
    this.actionRow.style.gap = `${ACTION_ROW_GAP_PX}px`;
    this.actionRow.style.alignItems = 'center';
    this.actionRow.style.maxWidth = '100%';
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

    this.previewLine = createWrappedDetailContainer();
    this.previewLine.style.display = 'none';
    this.root.append(this.previewLine);

    this.hoverLine = createWrappedDetailContainer();
    this.hoverLine.style.color = 'rgba(236, 242, 248, 0.96)';
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

    const availableWidth = Math.max(0, canvasRect.width - 20);
    const model = buildDebugEditStatusStripModel(state);
    const visibleActionCount = model.clearActionText ? 2 : 1;
    const stackActionButtons = resolveActionRowShouldStack(availableWidth, visibleActionCount);
    this.root.style.display = 'flex';
    this.root.style.left = `${canvasRect.left + 10}px`;
    this.root.style.bottom = `${Math.max(4, window.innerHeight - canvasRect.bottom + 10)}px`;
    this.root.style.width = stackActionButtons ? `${availableWidth}px` : 'auto';
    this.root.style.maxWidth = `${availableWidth}px`;
    this.root.style.borderColor = withAlpha(model.toolAccent, '0.22');
    this.root.style.boxShadow = `0 8px 18px rgba(0, 0, 0, 0.24), inset 0 0 0 1px ${withAlpha(model.toolAccent, '0.12')}`;

    setSummaryChipText(this.modeChip, model.modeText);
    setSummaryChipText(this.brushChip, model.brushText);
    setSummaryChipText(this.toolChip, model.toolText);
    this.toolChip.root.style.borderColor = withAlpha(model.toolAccent, '0.34');
    this.toolChip.root.style.background = withAlpha(model.toolAccent, '0.16');
    setSummaryChipText(this.inspectChip, model.inspectText);
    this.inspectChip.root.style.borderColor = withAlpha(model.inspectAccent, '0.34');
    this.inspectChip.root.style.background = withAlpha(model.inspectAccent, '0.16');

    this.inspectActionButton.textContent = model.inspectActionText;
    this.inspectActionButton.style.borderColor = withAlpha(model.inspectAccent, '0.34');
    this.inspectActionButton.style.background = withAlpha(model.inspectAccent, '0.16');
    this.clearActionButton.textContent = model.clearActionText ?? '';
    this.clearActionButton.style.display = model.clearActionText ? 'inline-flex' : 'none';
    this.actionRow.style.flexDirection = stackActionButtons ? 'column' : 'row';
    this.actionRow.style.alignItems = stackActionButtons ? 'stretch' : 'center';
    this.inspectActionButton.style.width = stackActionButtons ? '100%' : 'auto';
    this.clearActionButton.style.width = stackActionButtons ? '100%' : 'auto';

    if (model.previewText) {
      renderWrappedDetailText(this.previewLine, model.previewText);
      this.previewLine.style.display = 'flex';
    } else {
      this.previewLine.replaceChildren();
      this.previewLine.style.display = 'none';
    }
    this.previewLine.style.color = withAlpha(model.toolAccent, '0.92');
    renderWrappedDetailText(this.hoverLine, model.hoverText);
    this.hintLine.textContent = model.hintText;
    this.hintLine.style.borderTopColor = withAlpha(model.toolAccent, '0.16');
  }
}
