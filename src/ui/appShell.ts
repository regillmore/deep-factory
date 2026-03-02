import { installPointerClickFocusRelease } from './buttonFocus';
import {
  getDesktopDebugOverlayHotkeyLabel,
  getDesktopDebugEditOverlaysHotkeyLabel,
  getDesktopPlayerSpawnMarkerHotkeyLabel,
  getDesktopRecenterCameraHotkeyLabel,
  getDesktopResumeWorldHotkeyLabel,
  getDesktopReturnToMainMenuHotkeyLabel
} from '../input/debugEditShortcuts';

export type AppShellScreen = 'boot' | 'main-menu' | 'in-world';

export interface AppShellState {
  screen: AppShellScreen;
  statusText?: string;
  detailLines?: readonly string[];
  primaryActionLabel?: string | null;
  secondaryActionLabel?: string | null;
  debugOverlayVisible?: boolean;
  debugEditControlsVisible?: boolean;
  debugEditOverlaysVisible?: boolean;
  playerSpawnMarkerVisible?: boolean;
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
  secondaryActionLabel: string | null;
  returnToMainMenuActionLabel: string | null;
  recenterCameraActionLabel: string | null;
  debugOverlayToggleLabel: string | null;
  debugOverlayTogglePressed: boolean;
  debugEditControlsToggleLabel: string | null;
  debugEditControlsTogglePressed: boolean;
  debugEditOverlaysToggleLabel: string | null;
  debugEditOverlaysTogglePressed: boolean;
  playerSpawnMarkerToggleLabel: string | null;
  playerSpawnMarkerTogglePressed: boolean;
}

interface AppShellOptions {
  onPrimaryAction?: (screen: AppShellScreen) => void;
  onSecondaryAction?: (screen: AppShellScreen) => void;
  onReturnToMainMenu?: (screen: AppShellScreen) => void;
  onRecenterCamera?: (screen: AppShellScreen) => void;
  onToggleDebugOverlay?: (screen: AppShellScreen) => void;
  onToggleDebugEditControls?: (screen: AppShellScreen) => void;
  onToggleDebugEditOverlays?: (screen: AppShellScreen) => void;
  onTogglePlayerSpawnMarker?: (screen: AppShellScreen) => void;
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

export const resolveAppShellRegionDisplay = (
  visible: boolean,
  visibleDisplay: 'flex' | 'grid'
): 'flex' | 'grid' | 'none' => (visible ? visibleDisplay : 'none');

const resolveMainMenuPrimaryActionLabel = (label: string): string =>
  label === 'Resume World' ? `${label} (${getDesktopResumeWorldHotkeyLabel()})` : label;

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
        secondaryActionLabel: state.secondaryActionLabel ?? null,
        returnToMainMenuActionLabel: null,
        recenterCameraActionLabel: null,
        debugOverlayToggleLabel: null,
        debugOverlayTogglePressed: false,
        debugEditControlsToggleLabel: null,
        debugEditControlsTogglePressed: false,
        debugEditOverlaysToggleLabel: null,
        debugEditOverlaysTogglePressed: false,
        playerSpawnMarkerToggleLabel: null,
        playerSpawnMarkerTogglePressed: false
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
        primaryActionLabel: resolveMainMenuPrimaryActionLabel(
          state.primaryActionLabel ?? 'Enter World'
        ),
        secondaryActionLabel: state.secondaryActionLabel ?? null,
        returnToMainMenuActionLabel: null,
        recenterCameraActionLabel: null,
        debugOverlayToggleLabel: null,
        debugOverlayTogglePressed: false,
        debugEditControlsToggleLabel: null,
        debugEditControlsTogglePressed: false,
        debugEditOverlaysToggleLabel: null,
        debugEditOverlaysTogglePressed: false,
        playerSpawnMarkerToggleLabel: null,
        playerSpawnMarkerTogglePressed: false
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
        secondaryActionLabel: null,
        returnToMainMenuActionLabel: 'Main Menu',
        recenterCameraActionLabel: 'Recenter Camera',
        debugOverlayToggleLabel:
          state.debugOverlayVisible === true ? 'Hide Debug HUD' : 'Show Debug HUD',
        debugOverlayTogglePressed: state.debugOverlayVisible === true,
        debugEditControlsToggleLabel:
          state.debugEditControlsVisible === true ? 'Hide Edit Panel' : 'Show Edit Panel',
        debugEditControlsTogglePressed: state.debugEditControlsVisible === true,
        debugEditOverlaysToggleLabel:
          state.debugEditOverlaysVisible === false ? 'Show Edit Overlays' : 'Hide Edit Overlays',
        debugEditOverlaysTogglePressed: state.debugEditOverlaysVisible !== false,
        playerSpawnMarkerToggleLabel:
          state.playerSpawnMarkerVisible === false ? 'Show Spawn Marker' : 'Hide Spawn Marker',
        playerSpawnMarkerTogglePressed: state.playerSpawnMarkerVisible !== false
      };
  }
};

export class AppShell {
  private root: HTMLDivElement;
  private worldHost: HTMLDivElement;
  private overlay: HTMLDivElement;
  private overlayActions: HTMLDivElement;
  private chrome: HTMLDivElement;
  private returnToMainMenuActionButton: HTMLButtonElement;
  private recenterCameraActionButton: HTMLButtonElement;
  private debugOverlayToggleButton: HTMLButtonElement;
  private debugEditControlsToggleButton: HTMLButtonElement;
  private debugEditOverlaysToggleButton: HTMLButtonElement;
  private playerSpawnMarkerToggleButton: HTMLButtonElement;
  private stageLabel: HTMLSpanElement;
  private title: HTMLHeadingElement;
  private status: HTMLParagraphElement;
  private detailList: HTMLUListElement;
  private primaryButton: HTMLButtonElement;
  private secondaryButton: HTMLButtonElement;
  private onPrimaryAction: (screen: AppShellScreen) => void;
  private onSecondaryAction: (screen: AppShellScreen) => void;
  private onReturnToMainMenu: (screen: AppShellScreen) => void;
  private onRecenterCamera: (screen: AppShellScreen) => void;
  private onToggleDebugOverlay: (screen: AppShellScreen) => void;
  private onToggleDebugEditControls: (screen: AppShellScreen) => void;
  private onToggleDebugEditOverlays: (screen: AppShellScreen) => void;
  private onTogglePlayerSpawnMarker: (screen: AppShellScreen) => void;
  private currentState: AppShellState = { screen: 'boot' };

  constructor(container: HTMLElement, options: AppShellOptions = {}) {
    this.onPrimaryAction = options.onPrimaryAction ?? (() => {});
    this.onSecondaryAction = options.onSecondaryAction ?? (() => {});
    this.onReturnToMainMenu = options.onReturnToMainMenu ?? (() => {});
    this.onRecenterCamera = options.onRecenterCamera ?? (() => {});
    this.onToggleDebugOverlay = options.onToggleDebugOverlay ?? (() => {});
    this.onToggleDebugEditControls = options.onToggleDebugEditControls ?? (() => {});
    this.onToggleDebugEditOverlays = options.onToggleDebugEditOverlays ?? (() => {});
    this.onTogglePlayerSpawnMarker = options.onTogglePlayerSpawnMarker ?? (() => {});

    this.root = document.createElement('div');
    this.root.className = 'app-shell';

    this.worldHost = document.createElement('div');
    this.worldHost.className = 'app-shell__world';
    this.root.append(this.worldHost);

    this.chrome = document.createElement('div');
    this.chrome.className = 'app-shell__chrome';
    this.root.append(this.chrome);

    this.returnToMainMenuActionButton = document.createElement('button');
    this.returnToMainMenuActionButton.type = 'button';
    this.returnToMainMenuActionButton.className = 'app-shell__chrome-button';
    this.returnToMainMenuActionButton.addEventListener('click', () =>
      this.onReturnToMainMenu(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.returnToMainMenuActionButton);
    this.chrome.append(this.returnToMainMenuActionButton);

    this.recenterCameraActionButton = document.createElement('button');
    this.recenterCameraActionButton.type = 'button';
    this.recenterCameraActionButton.className = 'app-shell__chrome-button';
    this.recenterCameraActionButton.addEventListener('click', () =>
      this.onRecenterCamera(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.recenterCameraActionButton);
    this.chrome.append(this.recenterCameraActionButton);

    this.debugOverlayToggleButton = document.createElement('button');
    this.debugOverlayToggleButton.type = 'button';
    this.debugOverlayToggleButton.className = 'app-shell__chrome-button';
    this.debugOverlayToggleButton.addEventListener('click', () =>
      this.onToggleDebugOverlay(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.debugOverlayToggleButton);
    this.chrome.append(this.debugOverlayToggleButton);

    this.debugEditControlsToggleButton = document.createElement('button');
    this.debugEditControlsToggleButton.type = 'button';
    this.debugEditControlsToggleButton.className = 'app-shell__chrome-button';
    this.debugEditControlsToggleButton.addEventListener('click', () =>
      this.onToggleDebugEditControls(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.debugEditControlsToggleButton);
    this.chrome.append(this.debugEditControlsToggleButton);

    this.debugEditOverlaysToggleButton = document.createElement('button');
    this.debugEditOverlaysToggleButton.type = 'button';
    this.debugEditOverlaysToggleButton.className = 'app-shell__chrome-button';
    this.debugEditOverlaysToggleButton.addEventListener('click', () =>
      this.onToggleDebugEditOverlays(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.debugEditOverlaysToggleButton);
    this.chrome.append(this.debugEditOverlaysToggleButton);

    this.playerSpawnMarkerToggleButton = document.createElement('button');
    this.playerSpawnMarkerToggleButton.type = 'button';
    this.playerSpawnMarkerToggleButton.className = 'app-shell__chrome-button';
    this.playerSpawnMarkerToggleButton.addEventListener('click', () =>
      this.onTogglePlayerSpawnMarker(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.playerSpawnMarkerToggleButton);
    this.chrome.append(this.playerSpawnMarkerToggleButton);

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

    this.overlayActions = document.createElement('div');
    this.overlayActions.className = 'app-shell__actions';
    panel.append(this.overlayActions);

    this.primaryButton = document.createElement('button');
    this.primaryButton.type = 'button';
    this.primaryButton.className = 'app-shell__primary';
    this.primaryButton.addEventListener('click', () => this.onPrimaryAction(this.currentState.screen));
    installPointerClickFocusRelease(this.primaryButton);
    this.overlayActions.append(this.primaryButton);

    this.secondaryButton = document.createElement('button');
    this.secondaryButton.type = 'button';
    this.secondaryButton.className = 'app-shell__secondary';
    this.secondaryButton.addEventListener('click', () => this.onSecondaryAction(this.currentState.screen));
    installPointerClickFocusRelease(this.secondaryButton);
    this.overlayActions.append(this.secondaryButton);

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
    this.overlay.style.display = resolveAppShellRegionDisplay(viewModel.overlayVisible, 'grid');
    this.chrome.hidden = !viewModel.chromeVisible;
    this.chrome.style.display = resolveAppShellRegionDisplay(viewModel.chromeVisible, 'flex');
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
    this.detailList.style.display = resolveAppShellRegionDisplay(viewModel.detailLines.length > 0, 'grid');
    this.primaryButton.textContent = viewModel.primaryActionLabel ?? '';
    this.primaryButton.hidden = viewModel.primaryActionLabel === null;
    this.secondaryButton.textContent = viewModel.secondaryActionLabel ?? '';
    this.secondaryButton.hidden = viewModel.secondaryActionLabel === null;
    this.secondaryButton.title =
      viewModel.secondaryActionLabel === 'New World'
        ? 'Abandon the paused world session and boot a fresh world'
        : '';
    const overlayActionsVisible =
      viewModel.primaryActionLabel !== null || viewModel.secondaryActionLabel !== null;
    this.overlayActions.hidden = !overlayActionsVisible;
    this.overlayActions.style.display = resolveAppShellRegionDisplay(overlayActionsVisible, 'flex');
    this.returnToMainMenuActionButton.textContent = viewModel.returnToMainMenuActionLabel ?? '';
    this.returnToMainMenuActionButton.hidden = viewModel.returnToMainMenuActionLabel === null;
    this.returnToMainMenuActionButton.title = `Return to the main menu without discarding the current world session (${getDesktopReturnToMainMenuHotkeyLabel()})`;
    this.recenterCameraActionButton.textContent = viewModel.recenterCameraActionLabel ?? '';
    this.recenterCameraActionButton.hidden = viewModel.recenterCameraActionLabel === null;
    this.recenterCameraActionButton.title = `Center the camera on the standalone player and clear manual follow offset (${getDesktopRecenterCameraHotkeyLabel()})`;
    this.debugOverlayToggleButton.textContent = viewModel.debugOverlayToggleLabel ?? '';
    this.debugOverlayToggleButton.hidden = viewModel.debugOverlayToggleLabel === null;
    this.debugOverlayToggleButton.setAttribute(
      'aria-pressed',
      viewModel.debugOverlayTogglePressed ? 'true' : 'false'
    );
    this.debugOverlayToggleButton.title = viewModel.debugOverlayTogglePressed
      ? `Hide debug HUD telemetry (${getDesktopDebugOverlayHotkeyLabel()})`
      : `Show debug HUD telemetry (${getDesktopDebugOverlayHotkeyLabel()})`;
    this.debugEditControlsToggleButton.textContent = viewModel.debugEditControlsToggleLabel ?? '';
    this.debugEditControlsToggleButton.hidden = viewModel.debugEditControlsToggleLabel === null;
    this.debugEditControlsToggleButton.setAttribute(
      'aria-pressed',
      viewModel.debugEditControlsTogglePressed ? 'true' : 'false'
    );
    this.debugEditControlsToggleButton.title = viewModel.debugEditControlsTogglePressed
      ? 'Hide the full debug-edit control panel'
      : 'Show the full debug-edit control panel';
    this.debugEditOverlaysToggleButton.textContent = viewModel.debugEditOverlaysToggleLabel ?? '';
    this.debugEditOverlaysToggleButton.hidden = viewModel.debugEditOverlaysToggleLabel === null;
    this.debugEditOverlaysToggleButton.setAttribute(
      'aria-pressed',
      viewModel.debugEditOverlaysTogglePressed ? 'true' : 'false'
    );
    this.debugEditOverlaysToggleButton.title = viewModel.debugEditOverlaysTogglePressed
      ? `Hide compact debug-edit overlays (${getDesktopDebugEditOverlaysHotkeyLabel()})`
      : `Show compact debug-edit overlays (${getDesktopDebugEditOverlaysHotkeyLabel()})`;
    this.playerSpawnMarkerToggleButton.textContent = viewModel.playerSpawnMarkerToggleLabel ?? '';
    this.playerSpawnMarkerToggleButton.hidden = viewModel.playerSpawnMarkerToggleLabel === null;
    this.playerSpawnMarkerToggleButton.setAttribute(
      'aria-pressed',
      viewModel.playerSpawnMarkerTogglePressed ? 'true' : 'false'
    );
    this.playerSpawnMarkerToggleButton.title = viewModel.playerSpawnMarkerTogglePressed
      ? `Hide standalone player spawn marker overlay (${getDesktopPlayerSpawnMarkerHotkeyLabel()})`
      : `Show standalone player spawn marker overlay (${getDesktopPlayerSpawnMarkerHotkeyLabel()})`;
  }
}
