import type { TouchDebugEditMode } from '../input/controller';
import { getDebugBrushSlotHotkeyLabel } from '../input/debugEditShortcuts';

export interface DebugBrushOption {
  tileId: number;
  label: string;
}

export interface DebugEditHistoryControlState {
  undoStrokeCount: number;
  redoStrokeCount: number;
}

interface TouchDebugEditControlsOptions {
  initialMode?: TouchDebugEditMode;
  onModeChange?: (mode: TouchDebugEditMode) => void;
  brushOptions?: readonly DebugBrushOption[];
  initialBrushTileId?: number;
  onBrushTileIdChange?: (tileId: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  initialHistoryState?: DebugEditHistoryControlState;
}

const TOUCH_DEBUG_BUTTON_ORDER: readonly TouchDebugEditMode[] = ['pan', 'place', 'break'];

const buttonLabelForMode = (mode: TouchDebugEditMode): string => {
  if (mode === 'pan') return 'Pan';
  if (mode === 'place') return 'Place';
  return 'Break';
};

export class TouchDebugEditControls {
  private root: HTMLDivElement;
  private buttons = new Map<TouchDebugEditMode, HTMLButtonElement>();
  private brushButtons = new Map<number, HTMLButtonElement>();
  private mode: TouchDebugEditMode;
  private brushTileId: number;
  private brushOptions: readonly DebugBrushOption[];
  private activeBrushIndicator: HTMLDivElement;
  private undoButton: HTMLButtonElement;
  private redoButton: HTMLButtonElement;
  private undoStrokeCount = 0;
  private redoStrokeCount = 0;
  private onModeChange: (mode: TouchDebugEditMode) => void;
  private onBrushTileIdChange: (tileId: number) => void;
  private onUndo: () => void;
  private onRedo: () => void;

  constructor(options: TouchDebugEditControlsOptions = {}) {
    this.mode = options.initialMode ?? 'pan';
    this.onModeChange = options.onModeChange ?? (() => {});
    this.brushOptions = options.brushOptions ?? [];
    const fallbackBrushTileId = this.brushOptions[0]?.tileId ?? 0;
    this.brushTileId = options.initialBrushTileId ?? fallbackBrushTileId;
    this.onBrushTileIdChange = options.onBrushTileIdChange ?? (() => {});
    this.onUndo = options.onUndo ?? (() => {});
    this.onRedo = options.onRedo ?? (() => {});
    this.undoStrokeCount = Math.max(0, options.initialHistoryState?.undoStrokeCount ?? 0);
    this.redoStrokeCount = Math.max(0, options.initialHistoryState?.redoStrokeCount ?? 0);

    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.right = '12px';
    this.root.style.bottom = '12px';
    this.root.style.zIndex = '20';
    this.root.style.display = 'flex';
    this.root.style.flexDirection = 'column';
    this.root.style.gap = '6px';
    this.root.style.padding = '8px';
    this.root.style.borderRadius = '10px';
    this.root.style.background = 'rgba(0, 0, 0, 0.6)';
    this.root.style.border = '1px solid rgba(255, 255, 255, 0.12)';
    this.root.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
    this.root.style.fontFamily = 'monospace';
    this.root.style.pointerEvents = 'auto';
    this.root.style.userSelect = 'none';
    this.root.style.maxWidth = 'min(360px, calc(100vw - 24px))';

    const title = document.createElement('div');
    title.textContent = 'Debug Edit';
    title.style.color = '#d6dde8';
    title.style.fontSize = '11px';
    title.style.letterSpacing = '0.04em';
    title.style.textTransform = 'uppercase';
    this.root.append(title);

    const modeLabel = document.createElement('div');
    modeLabel.textContent = 'Touch Mode';
    modeLabel.style.color = '#aab7c7';
    modeLabel.style.fontSize = '11px';
    this.root.append(modeLabel);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.gap = '6px';
    this.root.append(row);

    for (const mode of TOUCH_DEBUG_BUTTON_ORDER) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = buttonLabelForMode(mode);
      button.addEventListener('click', () => this.setMode(mode));
      button.style.minWidth = '56px';
      button.style.padding = '6px 8px';
      button.style.borderRadius = '8px';
      button.style.border = '1px solid rgba(255, 255, 255, 0.16)';
      button.style.background = 'rgba(255, 255, 255, 0.06)';
      button.style.color = '#f3f7fb';
      button.style.fontFamily = 'inherit';
      button.style.fontSize = '12px';
      button.style.cursor = 'pointer';
      button.style.touchAction = 'manipulation';
      row.append(button);
      this.buttons.set(mode, button);
    }

    const historySection = document.createElement('div');
    historySection.style.display = 'flex';
    historySection.style.flexDirection = 'column';
    historySection.style.gap = '6px';
    this.root.append(historySection);

    const historyTitle = document.createElement('div');
    historyTitle.textContent = 'History';
    historyTitle.style.color = '#aab7c7';
    historyTitle.style.fontSize = '11px';
    historySection.append(historyTitle);

    const historyRow = document.createElement('div');
    historyRow.style.display = 'flex';
    historyRow.style.gap = '6px';
    historySection.append(historyRow);

    this.undoButton = document.createElement('button');
    this.undoButton.type = 'button';
    this.undoButton.addEventListener('click', () => this.onUndo());
    this.undoButton.style.padding = '6px 8px';
    this.undoButton.style.borderRadius = '8px';
    this.undoButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.undoButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.undoButton.style.color = '#f3f7fb';
    this.undoButton.style.fontFamily = 'inherit';
    this.undoButton.style.fontSize = '12px';
    this.undoButton.style.cursor = 'pointer';
    this.undoButton.style.touchAction = 'manipulation';
    this.undoButton.title = 'Undo last debug paint stroke (Ctrl/Cmd+Z)';
    historyRow.append(this.undoButton);

    this.redoButton = document.createElement('button');
    this.redoButton.type = 'button';
    this.redoButton.addEventListener('click', () => this.onRedo());
    this.redoButton.style.padding = '6px 8px';
    this.redoButton.style.borderRadius = '8px';
    this.redoButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.redoButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.redoButton.style.color = '#f3f7fb';
    this.redoButton.style.fontFamily = 'inherit';
    this.redoButton.style.fontSize = '12px';
    this.redoButton.style.cursor = 'pointer';
    this.redoButton.style.touchAction = 'manipulation';
    this.redoButton.title = 'Redo debug paint stroke (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)';
    historyRow.append(this.redoButton);

    const shortcutSection = document.createElement('div');
    shortcutSection.style.display = 'flex';
    shortcutSection.style.flexDirection = 'column';
    shortcutSection.style.gap = '4px';
    this.root.append(shortcutSection);

    const shortcutTitle = document.createElement('div');
    shortcutTitle.textContent = 'Keyboard';
    shortcutTitle.style.color = '#aab7c7';
    shortcutTitle.style.fontSize = '11px';
    shortcutSection.append(shortcutTitle);

    const brushShortcutLine = document.createElement('div');
    brushShortcutLine.textContent = 'Brush: [ / ] cycle, 1-0 slots';
    brushShortcutLine.style.color = '#d6dde8';
    brushShortcutLine.style.fontSize = '11px';
    brushShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(brushShortcutLine);

    const historyShortcutLine = document.createElement('div');
    historyShortcutLine.textContent = 'History: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo';
    historyShortcutLine.style.color = '#d6dde8';
    historyShortcutLine.style.fontSize = '11px';
    historyShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(historyShortcutLine);

    const brushSection = document.createElement('div');
    brushSection.style.display = 'flex';
    brushSection.style.flexDirection = 'column';
    brushSection.style.gap = '6px';
    this.root.append(brushSection);

    const brushTitle = document.createElement('div');
    brushTitle.textContent = 'Brush Palette';
    brushTitle.style.color = '#aab7c7';
    brushTitle.style.fontSize = '11px';
    brushSection.append(brushTitle);

    this.activeBrushIndicator = document.createElement('div');
    this.activeBrushIndicator.style.color = '#f3f7fb';
    this.activeBrushIndicator.style.fontSize = '12px';
    brushSection.append(this.activeBrushIndicator);

    const brushGrid = document.createElement('div');
    brushGrid.style.display = 'flex';
    brushGrid.style.flexWrap = 'wrap';
    brushGrid.style.gap = '6px';
    brushSection.append(brushGrid);

    if (this.brushOptions.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.textContent = 'No brush tiles';
      emptyState.style.color = '#9fb0c2';
      emptyState.style.fontSize = '12px';
      brushGrid.append(emptyState);
    } else {
      if (!this.brushOptions.some((option) => option.tileId === this.brushTileId)) {
        this.brushTileId = this.brushOptions[0]!.tileId;
      }

      for (const [index, option] of this.brushOptions.entries()) {
        const slotHotkeyLabel = getDebugBrushSlotHotkeyLabel(index);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = slotHotkeyLabel ? `[${slotHotkeyLabel}] ${option.label}` : option.label;
        button.title = slotHotkeyLabel
          ? `Brush slot ${slotHotkeyLabel}: Tile ${option.tileId} (${option.label})`
          : `Tile ${option.tileId}: ${option.label}`;
        button.addEventListener('click', () => this.setBrushTileId(option.tileId));
        button.style.padding = '6px 8px';
        button.style.borderRadius = '8px';
        button.style.border = '1px solid rgba(255, 255, 255, 0.16)';
        button.style.background = 'rgba(255, 255, 255, 0.06)';
        button.style.color = '#f3f7fb';
        button.style.fontFamily = 'inherit';
        button.style.fontSize = '12px';
        button.style.cursor = 'pointer';
        button.style.touchAction = 'manipulation';
        button.style.whiteSpace = 'nowrap';
        brushGrid.append(button);
        this.brushButtons.set(option.tileId, button);
      }
    }

    this.syncButtonState();
    this.syncHistoryState();
    this.syncBrushState();
    document.body.append(this.root);
  }

  setMode(mode: TouchDebugEditMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.syncButtonState();
    this.onModeChange(mode);
  }

  setBrushTileId(tileId: number): void {
    if (!this.brushButtons.has(tileId)) return;
    if (this.brushTileId === tileId) return;
    this.brushTileId = tileId;
    this.syncBrushState();
    this.onBrushTileIdChange(tileId);
  }

  getBrushTileId(): number {
    return this.brushTileId;
  }

  setHistoryState(historyState: DebugEditHistoryControlState): void {
    this.undoStrokeCount = Math.max(0, historyState.undoStrokeCount);
    this.redoStrokeCount = Math.max(0, historyState.redoStrokeCount);
    this.syncHistoryState();
  }

  private syncButtonState(): void {
    for (const [mode, button] of this.buttons) {
      const active = this.mode === mode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? 'rgba(90, 170, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(130, 200, 255, 0.7)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    }
  }

  private syncHistoryState(): void {
    const canUndo = this.undoStrokeCount > 0;
    const canRedo = this.redoStrokeCount > 0;

    this.undoButton.textContent = `Undo (${this.undoStrokeCount})`;
    this.undoButton.disabled = !canUndo;
    this.undoButton.style.opacity = canUndo ? '1' : '0.5';
    this.undoButton.style.cursor = canUndo ? 'pointer' : 'default';

    this.redoButton.textContent = `Redo (${this.redoStrokeCount})`;
    this.redoButton.disabled = !canRedo;
    this.redoButton.style.opacity = canRedo ? '1' : '0.5';
    this.redoButton.style.cursor = canRedo ? 'pointer' : 'default';
  }

  private syncBrushState(): void {
    const activeBrushOption = this.brushOptions.find((option) => option.tileId === this.brushTileId) ?? null;
    this.activeBrushIndicator.textContent = activeBrushOption
      ? `Active brush: ${activeBrushOption.label} (#${activeBrushOption.tileId})`
      : 'Active brush: n/a';

    for (const [tileId, button] of this.brushButtons) {
      const active = tileId === this.brushTileId;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? 'rgba(120, 255, 180, 0.22)' : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(150, 255, 205, 0.7)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    }
  }
}
