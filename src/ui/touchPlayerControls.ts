interface TouchPlayerControlsOptions {
  onMoveLeftHeldChange?: (held: boolean) => void;
  onMoveRightHeldChange?: (held: boolean) => void;
  onJumpHeldChange?: (held: boolean) => void;
}

interface HoldButtonBinding {
  button: HTMLButtonElement;
  setHeld: (held: boolean) => void;
}

const createControlButton = (label: string, title: string): HTMLButtonElement => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.title = title;
  button.style.width = '64px';
  button.style.height = '64px';
  button.style.borderRadius = '16px';
  button.style.border = '1px solid rgba(255, 255, 255, 0.18)';
  button.style.background = 'rgba(8, 14, 24, 0.76)';
  button.style.color = '#f3f7fb';
  button.style.font = '600 22px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  button.style.cursor = 'pointer';
  button.style.touchAction = 'none';
  button.style.userSelect = 'none';
  button.style.setProperty('-webkit-user-select', 'none');
  button.style.boxShadow = '0 8px 18px rgba(0, 0, 0, 0.28)';
  button.style.backdropFilter = 'blur(8px)';
  button.style.pointerEvents = 'auto';
  button.setAttribute('aria-pressed', 'false');
  return button;
};

const bindHoldButton = (
  button: HTMLButtonElement,
  onHeldChange: (held: boolean) => void,
  activeBackground: string
): HoldButtonBinding => {
  let activePointerId: number | null = null;
  let held = false;

  const setHeld = (nextHeld: boolean): void => {
    if (held === nextHeld) return;
    held = nextHeld;
    button.setAttribute('aria-pressed', held ? 'true' : 'false');
    button.style.background = held ? activeBackground : 'rgba(8, 14, 24, 0.76)';
    button.style.borderColor = held ? 'rgba(255, 255, 255, 0.42)' : 'rgba(255, 255, 255, 0.18)';
    onHeldChange(held);
  };

  const release = (pointerId: number | null): void => {
    if (pointerId !== null && activePointerId !== pointerId) return;
    if (pointerId !== null && typeof button.hasPointerCapture === 'function' && button.hasPointerCapture(pointerId)) {
      button.releasePointerCapture(pointerId);
    }
    activePointerId = null;
    setHeld(false);
  };

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (activePointerId !== null) return;
    activePointerId = event.pointerId;
    if (typeof button.setPointerCapture === 'function') {
      button.setPointerCapture(event.pointerId);
    }
    setHeld(true);
  });
  button.addEventListener('pointerup', (event) => release(event.pointerId));
  button.addEventListener('pointercancel', (event) => release(event.pointerId));
  button.addEventListener('lostpointercapture', () => release(null));
  button.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    button,
    setHeld
  };
};

export class TouchPlayerControls {
  private root: HTMLDivElement;
  private bindings: HoldButtonBinding[];

  constructor(options: TouchPlayerControlsOptions = {}) {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '12px';
    this.root.style.bottom = '12px';
    this.root.style.zIndex = '20';
    this.root.style.display = 'grid';
    this.root.style.gridTemplateColumns = 'repeat(2, 64px)';
    this.root.style.gridTemplateRows = 'repeat(2, 64px)';
    this.root.style.gap = '8px';
    this.root.style.pointerEvents = 'none';

    const leftButton = createControlButton('<', 'Hold to move left');
    leftButton.style.gridColumn = '1';
    leftButton.style.gridRow = '2';
    this.root.append(leftButton);

    const rightButton = createControlButton('>', 'Hold to move right');
    rightButton.style.gridColumn = '2';
    rightButton.style.gridRow = '2';
    this.root.append(rightButton);

    const jumpButton = createControlButton('^', 'Hold to queue a jump');
    jumpButton.style.gridColumn = '2';
    jumpButton.style.gridRow = '1';
    this.root.append(jumpButton);

    this.bindings = [
      bindHoldButton(leftButton, options.onMoveLeftHeldChange ?? (() => {}), 'rgba(80, 170, 255, 0.42)'),
      bindHoldButton(rightButton, options.onMoveRightHeldChange ?? (() => {}), 'rgba(80, 170, 255, 0.42)'),
      bindHoldButton(jumpButton, options.onJumpHeldChange ?? (() => {}), 'rgba(255, 190, 80, 0.42)')
    ];

    document.body.append(this.root);
  }

  getRootElement(): HTMLDivElement {
    return this.root;
  }

  dispose(): void {
    for (const binding of this.bindings) {
      binding.setHeld(false);
    }
    this.root.remove();
  }
}
