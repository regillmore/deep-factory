import type { TouchDebugEditMode } from '../input/controller';
import {
  getDebugBrushSlotHotkeyLabel,
  getDebugEditPanelToggleHotkeyLabel,
  getTouchDebugEditModeHotkeyLabel
} from '../input/debugEditShortcuts';

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
  initialCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetPrefs?: () => void;
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
  private collapsedSummary: HTMLDivElement;
  private content: HTMLDivElement;
  private collapseToggleButton: HTMLButtonElement;
  private buttons = new Map<TouchDebugEditMode, HTMLButtonElement>();
  private brushButtons = new Map<number, HTMLButtonElement>();
  private mode: TouchDebugEditMode;
  private brushTileId: number;
  private collapsed: boolean;
  private brushOptions: readonly DebugBrushOption[];
  private activeBrushIndicator: HTMLDivElement;
  private undoButton: HTMLButtonElement;
  private redoButton: HTMLButtonElement;
  private undoStrokeCount = 0;
  private redoStrokeCount = 0;
  private onModeChange: (mode: TouchDebugEditMode) => void;
  private onBrushTileIdChange: (tileId: number) => void;
  private onCollapsedChange: (collapsed: boolean) => void;
  private onUndo: () => void;
  private onRedo: () => void;
  private onResetPrefs: () => void;

  constructor(options: TouchDebugEditControlsOptions = {}) {
    this.mode = options.initialMode ?? 'pan';
    this.onModeChange = options.onModeChange ?? (() => {});
    this.brushOptions = options.brushOptions ?? [];
    const fallbackBrushTileId = this.brushOptions[0]?.tileId ?? 0;
    this.brushTileId = options.initialBrushTileId ?? fallbackBrushTileId;
    this.onBrushTileIdChange = options.onBrushTileIdChange ?? (() => {});
    this.collapsed = options.initialCollapsed ?? false;
    this.onCollapsedChange = options.onCollapsedChange ?? (() => {});
    this.onUndo = options.onUndo ?? (() => {});
    this.onRedo = options.onRedo ?? (() => {});
    this.onResetPrefs = options.onResetPrefs ?? (() => {});
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

    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.alignItems = 'center';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.gap = '8px';
    this.root.append(headerRow);

    const title = document.createElement('div');
    title.textContent = 'Debug Edit';
    title.style.color = '#d6dde8';
    title.style.fontSize = '11px';
    title.style.letterSpacing = '0.04em';
    title.style.textTransform = 'uppercase';
    headerRow.append(title);

    const panelToggleHotkeyLabel = getDebugEditPanelToggleHotkeyLabel();
    this.collapseToggleButton = document.createElement('button');
    this.collapseToggleButton.type = 'button';
    this.collapseToggleButton.style.padding = '4px 8px';
    this.collapseToggleButton.style.borderRadius = '8px';
    this.collapseToggleButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.collapseToggleButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.collapseToggleButton.style.color = '#f3f7fb';
    this.collapseToggleButton.style.fontFamily = 'inherit';
    this.collapseToggleButton.style.fontSize = '11px';
    this.collapseToggleButton.style.cursor = 'pointer';
    this.collapseToggleButton.style.touchAction = 'manipulation';
    this.collapseToggleButton.addEventListener('click', () => this.setCollapsed(!this.collapsed));
    headerRow.append(this.collapseToggleButton);

    this.collapsedSummary = document.createElement('div');
    this.collapsedSummary.style.display = 'none';
    this.collapsedSummary.style.color = '#d6dde8';
    this.collapsedSummary.style.fontSize = '11px';
    this.collapsedSummary.style.lineHeight = '1.35';
    this.collapsedSummary.style.whiteSpace = 'nowrap';
    this.collapsedSummary.style.overflow = 'hidden';
    this.collapsedSummary.style.textOverflow = 'ellipsis';
    this.root.append(this.collapsedSummary);

    this.content = document.createElement('div');
    this.content.style.display = 'flex';
    this.content.style.flexDirection = 'column';
    this.content.style.gap = '6px';
    this.root.append(this.content);

    const modeLabel = document.createElement('div');
    modeLabel.textContent = 'Touch Mode';
    modeLabel.style.color = '#aab7c7';
    modeLabel.style.fontSize = '11px';
    this.content.append(modeLabel);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.gap = '6px';
    this.content.append(row);

    for (const mode of TOUCH_DEBUG_BUTTON_ORDER) {
      const modeLabel = buttonLabelForMode(mode);
      const modeHotkeyLabel = getTouchDebugEditModeHotkeyLabel(mode);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = modeLabel;
      button.title = `Touch mode: ${modeLabel} (${modeHotkeyLabel})`;
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
    this.content.append(historySection);

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
    this.undoButton.title = 'Undo last debug paint stroke (Ctrl/Cmd+Z or two-finger tap in Pan mode)';
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
    this.redoButton.title =
      'Redo debug paint stroke (Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y or three-finger tap in Pan mode)';
    historyRow.append(this.redoButton);

    const touchHistoryShortcutLine = document.createElement('div');
    touchHistoryShortcutLine.textContent = 'Touch: two-finger tap undo, three-finger tap redo (Pan mode)';
    touchHistoryShortcutLine.style.color = '#d6dde8';
    touchHistoryShortcutLine.style.fontSize = '11px';
    touchHistoryShortcutLine.style.lineHeight = '1.35';
    historySection.append(touchHistoryShortcutLine);

    const prefsSection = document.createElement('div');
    prefsSection.style.display = 'flex';
    prefsSection.style.flexDirection = 'column';
    prefsSection.style.gap = '6px';
    this.content.append(prefsSection);

    const prefsTitle = document.createElement('div');
    prefsTitle.textContent = 'Prefs';
    prefsTitle.style.color = '#aab7c7';
    prefsTitle.style.fontSize = '11px';
    prefsSection.append(prefsTitle);

    const resetPrefsButton = document.createElement('button');
    resetPrefsButton.type = 'button';
    resetPrefsButton.textContent = 'Reset Prefs';
    resetPrefsButton.title =
      'Restore default touch mode, brush, and panel visibility; clear saved debug edit control prefs';
    resetPrefsButton.addEventListener('click', () => this.onResetPrefs());
    resetPrefsButton.style.padding = '6px 8px';
    resetPrefsButton.style.borderRadius = '8px';
    resetPrefsButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    resetPrefsButton.style.background = 'rgba(255, 255, 255, 0.06)';
    resetPrefsButton.style.color = '#f3f7fb';
    resetPrefsButton.style.fontFamily = 'inherit';
    resetPrefsButton.style.fontSize = '12px';
    resetPrefsButton.style.cursor = 'pointer';
    resetPrefsButton.style.touchAction = 'manipulation';
    prefsSection.append(resetPrefsButton);

    const shortcutSection = document.createElement('div');
    shortcutSection.style.display = 'flex';
    shortcutSection.style.flexDirection = 'column';
    shortcutSection.style.gap = '4px';
    this.content.append(shortcutSection);

    const shortcutTitle = document.createElement('div');
    shortcutTitle.textContent = 'Keyboard';
    shortcutTitle.style.color = '#aab7c7';
    shortcutTitle.style.fontSize = '11px';
    shortcutSection.append(shortcutTitle);

    const modeShortcutLine = document.createElement('div');
    modeShortcutLine.textContent = `Modes: ${getTouchDebugEditModeHotkeyLabel('pan')} pan, ${getTouchDebugEditModeHotkeyLabel('place')} place, ${getTouchDebugEditModeHotkeyLabel('break')} break`;
    modeShortcutLine.style.color = '#d6dde8';
    modeShortcutLine.style.fontSize = '11px';
    modeShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(modeShortcutLine);

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

    const panelShortcutLine = document.createElement('div');
    panelShortcutLine.textContent = `Panel: ${panelToggleHotkeyLabel} collapse/expand`;
    panelShortcutLine.style.color = '#d6dde8';
    panelShortcutLine.style.fontSize = '11px';
    panelShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(panelShortcutLine);

    const eyedropperShortcutLine = document.createElement('div');
    eyedropperShortcutLine.textContent = 'Eyedropper: press I to pick hovered tile; touch long-press in Pan mode';
    eyedropperShortcutLine.style.color = '#d6dde8';
    eyedropperShortcutLine.style.fontSize = '11px';
    eyedropperShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(eyedropperShortcutLine);

    const brushSection = document.createElement('div');
    brushSection.style.display = 'flex';
    brushSection.style.flexDirection = 'column';
    brushSection.style.gap = '6px';
    this.content.append(brushSection);

    const brushTitle = document.createElement('div');
    brushTitle.textContent = 'Brush Palette';
    brushTitle.style.color = '#aab7c7';
    brushTitle.style.fontSize = '11px';
    brushSection.append(brushTitle);

    const brushTouchHint = document.createElement('div');
    brushTouchHint.textContent = 'Touch shortcut: long-press a tile in Pan mode to pick that brush';
    brushTouchHint.style.color = '#d6dde8';
    brushTouchHint.style.fontSize = '11px';
    brushTouchHint.style.lineHeight = '1.35';
    brushSection.append(brushTouchHint);

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
    this.syncCollapsedState();
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

  isCollapsed(): boolean {
    return this.collapsed;
  }

  setCollapsed(collapsed: boolean): void {
    if (this.collapsed === collapsed) return;
    this.collapsed = collapsed;
    this.syncCollapsedState();
    this.onCollapsedChange(collapsed);
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
    this.syncCollapsedSummary();
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
    this.syncCollapsedSummary();
  }

  private syncCollapsedState(): void {
    this.content.style.display = this.collapsed ? 'none' : 'flex';
    this.collapsedSummary.style.display = this.collapsed ? 'block' : 'none';
    this.collapseToggleButton.textContent = this.collapsed ? 'Expand' : 'Collapse';
    const panelToggleHotkeyLabel = getDebugEditPanelToggleHotkeyLabel();
    this.collapseToggleButton.title = this.collapsed
      ? `Expand debug edit controls (${panelToggleHotkeyLabel})`
      : `Collapse debug edit controls (${panelToggleHotkeyLabel})`;
    this.collapseToggleButton.setAttribute('aria-expanded', this.collapsed ? 'false' : 'true');
    this.syncCollapsedSummary();
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
    this.syncCollapsedSummary();
  }

  private syncCollapsedSummary(): void {
    const modeLabel = buttonLabelForMode(this.mode);
    const activeBrushOption = this.brushOptions.find((option) => option.tileId === this.brushTileId) ?? null;
    const brushSummary = activeBrushOption
      ? `${activeBrushOption.label} (#${activeBrushOption.tileId})`
      : `#${this.brushTileId}`;
    this.collapsedSummary.textContent = `${modeLabel} | Brush: ${brushSummary} | U:${this.undoStrokeCount} R:${this.redoStrokeCount}`;
  }
}
