import type { TouchDebugEditMode } from '../input/controller';

interface TouchDebugEditControlsOptions {
  initialMode?: TouchDebugEditMode;
  onModeChange?: (mode: TouchDebugEditMode) => void;
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
  private mode: TouchDebugEditMode;
  private onModeChange: (mode: TouchDebugEditMode) => void;

  constructor(options: TouchDebugEditControlsOptions = {}) {
    this.mode = options.initialMode ?? 'pan';
    this.onModeChange = options.onModeChange ?? (() => {});

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

    const title = document.createElement('div');
    title.textContent = 'Touch Debug';
    title.style.color = '#d6dde8';
    title.style.fontSize = '11px';
    title.style.letterSpacing = '0.04em';
    title.style.textTransform = 'uppercase';
    this.root.append(title);

    const row = document.createElement('div');
    row.style.display = 'flex';
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

    this.syncButtonState();
    document.body.append(this.root);
  }

  setMode(mode: TouchDebugEditMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.syncButtonState();
    this.onModeChange(mode);
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
}
