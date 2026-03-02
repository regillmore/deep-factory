export type AppShellScreen = 'boot' | 'main-menu' | 'in-world';

export interface AppShellState {
  screen: AppShellScreen;
  statusText?: string;
  detailLines?: readonly string[];
  primaryActionLabel?: string | null;
  debugOverlayVisible?: boolean;
}

export interface AppShellViewModel {
  screen: AppShellScreen;
  overlayVisible: boolean;
  chromeVisible: boolean;
  stageLabel: string;
  title: string;
  statusText: string;
  detailLines: readonly string[];
  primaryActionLabel: string | null;
  debugOverlayToggleLabel: string | null;
  debugOverlayTogglePressed: boolean;
}

interface AppShellOptions {
  onPrimaryAction?: (screen: AppShellScreen) => void;
  onToggleDebugOverlay?: (screen: AppShellScreen) => void;
}

const DEFAULT_BOOT_STATUS = 'Preparing renderer, controls, and spawn state.';
const DEFAULT_BOOT_DETAIL_LINES = [
  'Boot runs before the fixed-step simulation starts so later shell work has a stable entry point.'
] as const;
const DEFAULT_MAIN_MENU_STATUS =
  'Renderer ready. Enter the world when you want the fixed-step simulation and live controls to take over.';
const DEFAULT_MAIN_MENU_DETAIL_LINES = [
  'Desktop keeps movement, zoom, pan, and debug editing on the same world session.',
  'Touch keeps the on-screen edit controls and player pad aligned with that same runtime state.'
] as const;

export const resolveAppShellViewModel = (state: AppShellState): AppShellViewModel => {
  switch (state.screen) {
    case 'boot':
      return {
        screen: 'boot',
        overlayVisible: true,
        chromeVisible: false,
        stageLabel: 'Boot',
        title: 'Deep Factory',
        statusText: state.statusText ?? DEFAULT_BOOT_STATUS,
        detailLines: state.detailLines ?? DEFAULT_BOOT_DETAIL_LINES,
        primaryActionLabel: state.primaryActionLabel ?? null,
        debugOverlayToggleLabel: null,
        debugOverlayTogglePressed: false
      };
    case 'main-menu':
      return {
        screen: 'main-menu',
        overlayVisible: true,
        chromeVisible: false,
        stageLabel: 'Main Menu',
        title: 'Deep Factory',
        statusText: state.statusText ?? DEFAULT_MAIN_MENU_STATUS,
        detailLines: state.detailLines ?? DEFAULT_MAIN_MENU_DETAIL_LINES,
        primaryActionLabel: state.primaryActionLabel ?? 'Enter World',
        debugOverlayToggleLabel: null,
        debugOverlayTogglePressed: false
      };
    case 'in-world':
      return {
        screen: 'in-world',
        overlayVisible: false,
        chromeVisible: true,
        stageLabel: 'In World',
        title: 'Deep Factory',
        statusText: state.statusText ?? '',
        detailLines: state.detailLines ?? [],
        primaryActionLabel: null,
        debugOverlayToggleLabel:
          state.debugOverlayVisible === true ? 'Hide Debug HUD' : 'Show Debug HUD',
        debugOverlayTogglePressed: state.debugOverlayVisible === true
      };
  }
};

export class AppShell {
  private root: HTMLDivElement;
  private worldHost: HTMLDivElement;
  private overlay: HTMLDivElement;
  private chrome: HTMLDivElement;
  private debugOverlayToggleButton: HTMLButtonElement;
  private stageLabel: HTMLSpanElement;
  private title: HTMLHeadingElement;
  private status: HTMLParagraphElement;
  private detailList: HTMLUListElement;
  private primaryButton: HTMLButtonElement;
  private onPrimaryAction: (screen: AppShellScreen) => void;
  private onToggleDebugOverlay: (screen: AppShellScreen) => void;
  private currentState: AppShellState = { screen: 'boot' };

  constructor(container: HTMLElement, options: AppShellOptions = {}) {
    this.onPrimaryAction = options.onPrimaryAction ?? (() => {});
    this.onToggleDebugOverlay = options.onToggleDebugOverlay ?? (() => {});

    this.root = document.createElement('div');
    this.root.className = 'app-shell';

    this.worldHost = document.createElement('div');
    this.worldHost.className = 'app-shell__world';
    this.root.append(this.worldHost);

    this.chrome = document.createElement('div');
    this.chrome.className = 'app-shell__chrome';
    this.root.append(this.chrome);

    this.debugOverlayToggleButton = document.createElement('button');
    this.debugOverlayToggleButton.type = 'button';
    this.debugOverlayToggleButton.className = 'app-shell__chrome-button';
    this.debugOverlayToggleButton.addEventListener('click', () =>
      this.onToggleDebugOverlay(this.currentState.screen)
    );
    this.chrome.append(this.debugOverlayToggleButton);

    this.overlay = document.createElement('div');
    this.overlay.className = 'app-shell__overlay';
    this.root.append(this.overlay);

    const panel = document.createElement('section');
    panel.className = 'app-shell__panel';
    this.overlay.append(panel);

    this.stageLabel = document.createElement('span');
    this.stageLabel.className = 'app-shell__stage';
    panel.append(this.stageLabel);

    this.title = document.createElement('h1');
    this.title.className = 'app-shell__title';
    panel.append(this.title);

    this.status = document.createElement('p');
    this.status.className = 'app-shell__status';
    panel.append(this.status);

    this.detailList = document.createElement('ul');
    this.detailList.className = 'app-shell__detail-list';
    panel.append(this.detailList);

    this.primaryButton = document.createElement('button');
    this.primaryButton.type = 'button';
    this.primaryButton.className = 'app-shell__primary';
    this.primaryButton.addEventListener('click', () => this.onPrimaryAction(this.currentState.screen));
    panel.append(this.primaryButton);

    container.replaceChildren(this.root);
    this.setState(this.currentState);
  }

  getWorldHost(): HTMLDivElement {
    return this.worldHost;
  }

  setState(state: AppShellState): void {
    this.currentState = state;
    const viewModel = resolveAppShellViewModel(state);

    this.root.dataset.screen = viewModel.screen;
    this.overlay.hidden = !viewModel.overlayVisible;
    this.chrome.hidden = !viewModel.chromeVisible;
    this.stageLabel.textContent = viewModel.stageLabel;
    this.title.textContent = viewModel.title;
    this.status.textContent = viewModel.statusText;
    this.detailList.replaceChildren(
      ...viewModel.detailLines.map((line) => {
        const item = document.createElement('li');
        item.textContent = line;
        return item;
      })
    );
    this.detailList.hidden = viewModel.detailLines.length === 0;
    this.primaryButton.textContent = viewModel.primaryActionLabel ?? '';
    this.primaryButton.hidden = viewModel.primaryActionLabel === null;
    this.debugOverlayToggleButton.textContent = viewModel.debugOverlayToggleLabel ?? '';
    this.debugOverlayToggleButton.hidden = viewModel.debugOverlayToggleLabel === null;
    this.debugOverlayToggleButton.setAttribute(
      'aria-pressed',
      viewModel.debugOverlayTogglePressed ? 'true' : 'false'
    );
    this.debugOverlayToggleButton.title = viewModel.debugOverlayTogglePressed
      ? 'Hide debug HUD telemetry'
      : 'Show debug HUD telemetry';
  }
}
