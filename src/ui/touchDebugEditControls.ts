import type { TouchDebugEditMode } from '../input/controller';

export interface DebugBrushOption {
  tileId: number;
  label: string;
}

interface TouchDebugEditControlsOptions {
  initialMode?: TouchDebugEditMode;
  onModeChange?: (mode: TouchDebugEditMode) => void;
  brushOptions?: readonly DebugBrushOption[];
  initialBrushTileId?: number;
  onBrushTileIdChange?: (tileId: number) => void;
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
  private onModeChange: (mode: TouchDebugEditMode) => void;
  private onBrushTileIdChange: (tileId: number) => void;

  constructor(options: TouchDebugEditControlsOptions = {}) {
    this.mode = options.initialMode ?? 'pan';
    this.onModeChange = options.onModeChange ?? (() => {});
    this.brushOptions = options.brushOptions ?? [];
    const fallbackBrushTileId = this.brushOptions[0]?.tileId ?? 0;
    this.brushTileId = options.initialBrushTileId ?? fallbackBrushTileId;
    this.onBrushTileIdChange = options.onBrushTileIdChange ?? (() => {});

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

      for (const option of this.brushOptions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = option.label;
        button.title = `Tile ${option.tileId}: ${option.label}`;
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

  private syncButtonState(): void {
    for (const [mode, button] of this.buttons) {
      const active = this.mode === mode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? 'rgba(90, 170, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(130, 200, 255, 0.7)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    }
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
