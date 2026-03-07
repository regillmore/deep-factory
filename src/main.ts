import './style.css';

import { Camera2D } from './core/camera2d';
import {
  absorbManualCameraDeltaIntoFollowOffset,
  recenterCameraOnFollowTarget,
  resolveCameraPositionFromFollowTarget,
  type CameraFollowOffset,
  type CameraFollowPoint
} from './core/cameraFollow';
import { GameLoop } from './core/gameLoop';
import { Renderer } from './gl/renderer';
import {
  getStandalonePlayerPlaceholderPoseLabel,
  STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS
} from './gl/standalonePlayerPlaceholder';
import {
  InputController,
  walkEllipseOutlineTileArea,
  walkFilledEllipseTileArea,
  walkFilledRectangleTileArea,
  walkRectangleOutlineTileArea,
  walkLineSteppedTilePath,
  type DebugTileEditKind,
  type PointerInspectSnapshot,
  type TouchDebugEditMode
} from './input/controller';
import { worldToTilePoint } from './input/picking';
import {
  clearDebugEditControlState,
  loadDebugEditControlState,
  saveDebugEditControlState,
  type DebugEditControlState
} from './input/debugEditControlStatePersistence';
import { runDebugFloodFill } from './input/debugFloodFill';
import { DebugTileEditHistory } from './input/debugTileEditHistory';
import {
  createDebugEditShortcutContext,
  cycleDebugBrushTileId,
  getDebugBrushTileIdForShortcutSlot,
  isInWorldOnlyDebugEditShortcutAction,
  resolveDebugEditShortcutAction,
  type DebugEditShortcutAction
} from './input/debugEditShortcuts';
import {
  clearWorldSessionShellState,
  createDefaultWorldSessionShellState,
  loadWorldSessionShellState,
  saveWorldSessionShellState,
  resolveWorldSessionShellStateAfterPausedMainMenuTransition
} from './mainWorldSessionShellState';
import { DebugOverlay } from './ui/debugOverlay';
import {
  AppShell,
  createDefaultBootShellState,
  createInWorldShellState,
  createMainMenuShellState,
  createRendererInitializationFailedBootShellState,
  createWebGlUnavailableBootShellState,
  type AppShellScreen
} from './ui/appShell';
import { DebugEditStatusStrip } from './ui/debugEditStatusStrip';
import { ArmedDebugToolPreviewOverlay } from './ui/armedDebugToolPreviewOverlay';
import { HoveredTileCursorOverlay } from './ui/hoveredTileCursor';
import { PlayerSpawnMarkerOverlay } from './ui/playerSpawnMarkerOverlay';
import type { DebugEditHoveredTileState } from './ui/debugEditStatusHelpers';
import { TouchDebugEditControls, type DebugBrushOption } from './ui/touchDebugEditControls';
import { TouchPlayerControls } from './ui/touchPlayerControls';
import { CHUNK_SIZE } from './world/constants';
import { EntityRegistry } from './world/entityRegistry';
import { worldToChunkCoord, worldToLocalTile } from './world/chunkMath';
import {
  resolvePlayerCeilingContactTransitionEvent,
  type PlayerCeilingContactTransitionEvent
} from './world/playerCeilingContactTransition';
import {
  resolvePlayerFacingTransitionEvent,
  type PlayerFacingTransitionEvent
} from './world/playerFacingTransition';
import {
  resolvePlayerGroundedTransitionEvent,
  type PlayerGroundedTransitionEvent
} from './world/playerGroundedTransition';
import {
  createEmbeddedPlayerRespawnEvent,
  type PlayerRespawnEvent
} from './world/playerRespawnEvent';
import {
  resolvePlayerWallContactTransitionEvent,
  type PlayerWallContactTransitionEvent
} from './world/playerWallContactTransition';
import {
  createPlayerStateFromSpawn,
  DEFAULT_PLAYER_HEIGHT,
  DEFAULT_PLAYER_WIDTH,
  getPlayerAabb,
  getPlayerCameraFocusPoint,
  type PlayerState
} from './world/playerState';
import {
  describeLiquidConnectivityGroup,
  describeLiquidRenderVariantPixelBoundsAtElapsedMs,
  describeLiquidRenderVariantSourceAtElapsedMs,
  describeLiquidRenderVariantUvRectAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs,
  getAnimatedLiquidRenderVariantFrameCount,
  getAnimatedLiquidRenderVariantFrameDurationMs,
  getTileMetadata,
  resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs,
  resolveTileGameplayMetadata,
  TILE_METADATA
} from './world/tileMetadata';

const DEBUG_TILE_BREAK_ID = 0;
const PREFERRED_INITIAL_DEBUG_BRUSH_TILE_NAME = 'debug_brick';
type MainMenuShellActionType =
  | 'enter-or-resume-world-session'
  | 'start-fresh-world-session'
  | 'reset-shell-toggle-preferences';
type DebugHistoryActionType = 'undo' | 'redo';
type KeyboardArmedToolShortcutAction = Extract<
  DebugEditShortcutAction,
  | { type: 'cancel-armed-tools' }
  | { type: 'arm-flood-fill' }
  | { type: 'arm-line' }
  | { type: 'arm-rect' }
  | { type: 'arm-rect-outline' }
  | { type: 'arm-ellipse' }
  | { type: 'arm-ellipse-outline' }
>;
type KeyboardBrushShortcutAction = Extract<
  DebugEditShortcutAction,
  { type: 'select-brush-slot' } | { type: 'eyedropper' } | { type: 'cycle-brush' }
>;
type KeyboardDebugEditControlShortcutAction = Extract<
  DebugEditShortcutAction,
  { type: 'toggle-panel-collapsed' } | { type: 'set-touch-mode' }
>;
type DebugEditControlStateCommitAction =
  | { type: 'set-touch-mode'; mode: TouchDebugEditMode }
  | { type: 'set-panel-collapsed'; collapsed: boolean };
type TouchDebugArmedToolSnapshot = {
  floodFillKind: DebugTileEditKind | null;
  lineKind: DebugTileEditKind | null;
  rectKind: DebugTileEditKind | null;
  rectOutlineKind: DebugTileEditKind | null;
  ellipseKind: DebugTileEditKind | null;
  ellipseOutlineKind: DebugTileEditKind | null;
};
const formatDebugBrushLabel = (tileName: string): string => tileName.replace(/_/g, ' ');
const isEditableKeyboardShortcutTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
  );
};

const DEBUG_BRUSH_TILE_OPTIONS: readonly DebugBrushOption[] = TILE_METADATA.tiles
  .filter((tile) => tile.id !== DEBUG_TILE_BREAK_ID)
  .map((tile) => ({
    tileId: tile.id,
    label: formatDebugBrushLabel(tile.name)
  }));
const DEBUG_BRUSH_TILE_IDS = DEBUG_BRUSH_TILE_OPTIONS.map((option) => option.tileId);
const DEBUG_BRUSH_TILE_ID_SET = new Set(DEBUG_BRUSH_TILE_IDS);
const DEBUG_BRUSH_TILE_LABELS = new Map(DEBUG_BRUSH_TILE_OPTIONS.map((option) => [option.tileId, option.label]));
const DEBUG_PLAYER_SPAWN_SEARCH_OPTIONS = {
  width: DEFAULT_PLAYER_WIDTH,
  height: DEFAULT_PLAYER_HEIGHT
} as const;
const supportsTouchPlayerControls = (): boolean => {
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  if (maxTouchPoints > 0) return true;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
};

interface PinnedDebugTileInspectState {
  tileX: number;
  tileY: number;
}

if (DEBUG_BRUSH_TILE_OPTIONS.length === 0) {
  throw new Error('Tile metadata must provide at least one non-empty tile for debug editing');
}

const INITIAL_DEBUG_BRUSH_TILE_ID =
  TILE_METADATA.tiles.find(
    (tile) => tile.id !== DEBUG_TILE_BREAK_ID && tile.name === PREFERRED_INITIAL_DEBUG_BRUSH_TILE_NAME
  )?.id ?? DEBUG_BRUSH_TILE_OPTIONS[0]!.tileId;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app root element');

type InWorldShellToggleActionType =
  | 'toggle-debug-overlay'
  | 'toggle-debug-edit-controls'
  | 'toggle-debug-edit-overlays'
  | 'toggle-player-spawn-marker'
  | 'toggle-shortcuts-overlay';
type InWorldShellOverlaySyncActionType = Exclude<
  InWorldShellToggleActionType,
  'toggle-shortcuts-overlay'
>;
type InWorldShellActionType =
  | InWorldShellToggleActionType
  | 'return-to-main-menu'
  | 'recenter-camera';
type InWorldShellNonToggleActionType = Exclude<InWorldShellActionType, InWorldShellToggleActionType>;

const bootstrap = async (): Promise<void> => {
  const touchControlsAvailable = supportsTouchPlayerControls();
  const worldSessionShellStateStorage = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  const defaultWorldSessionShellState = createDefaultWorldSessionShellState();
  let worldSessionStarted = false;
  let currentScreen: AppShellScreen = 'boot';
  let loop: GameLoop | null = null;
  let {
    debugOverlayVisible,
    debugEditControlsVisible,
    debugEditOverlaysVisible,
    playerSpawnMarkerVisible,
    shortcutsOverlayVisible
  } = loadWorldSessionShellState(worldSessionShellStateStorage, defaultWorldSessionShellState);
  const readWorldSessionShellState = () => ({
    debugOverlayVisible,
    debugEditControlsVisible,
    debugEditOverlaysVisible,
    playerSpawnMarkerVisible,
    shortcutsOverlayVisible
  });
  const persistWorldSessionShellState = (): void => {
    saveWorldSessionShellState(worldSessionShellStateStorage, readWorldSessionShellState());
  };
  const applyWorldSessionShellState = (
    state: ReturnType<typeof createDefaultWorldSessionShellState>
  ): void => {
    ({
      debugOverlayVisible,
      debugEditControlsVisible,
      debugEditOverlaysVisible,
      playerSpawnMarkerVisible,
      shortcutsOverlayVisible
    } = state);
  };
  const applyPausedMainMenuWorldSessionShellTransition = (
    transition: Parameters<typeof resolveWorldSessionShellStateAfterPausedMainMenuTransition>[1],
    persistence: 'save' | 'clear' = 'save'
  ): void => {
    applyWorldSessionShellState(
      resolveWorldSessionShellStateAfterPausedMainMenuTransition(readWorldSessionShellState(), transition)
    );
    if (persistence === 'clear') {
      clearWorldSessionShellState(worldSessionShellStateStorage);
      return;
    }
    persistWorldSessionShellState();
  };
  const returnToMainMenuFromInWorld = (): void => {
    if (currentScreen !== 'in-world') return;
    applyPausedMainMenuWorldSessionShellTransition('pause-to-main-menu');
    showMainMenuShellState();
  };
  const handleMainMenuShellAction = (
    screen: AppShellScreen,
    actionType: MainMenuShellActionType
  ): void => {
    if (screen !== 'main-menu') return;
    applyMainMenuShellAction(actionType);
  };
  const handleInWorldShellAction = (screen: AppShellScreen, actionType: InWorldShellActionType): void => {
    if (screen !== 'in-world') return;
    applyInWorldShellAction(actionType);
  };
  const shell = new AppShell(app, {
    onPrimaryAction: (screen) => {
      handleMainMenuShellAction(screen, 'enter-or-resume-world-session');
    },
    onSecondaryAction: (screen) => {
      handleMainMenuShellAction(screen, 'start-fresh-world-session');
    },
    onTertiaryAction: (screen) => {
      handleMainMenuShellAction(screen, 'reset-shell-toggle-preferences');
    },
    onReturnToMainMenu: (screen) => {
      handleInWorldShellAction(screen, 'return-to-main-menu');
    },
    onRecenterCamera: (screen) => {
      handleInWorldShellAction(screen, 'recenter-camera');
    },
    onToggleDebugOverlay: (screen) => {
      handleInWorldShellAction(screen, 'toggle-debug-overlay');
    },
    onToggleDebugEditControls: (screen) => {
      handleInWorldShellAction(screen, 'toggle-debug-edit-controls');
    },
    onToggleDebugEditOverlays: (screen) => {
      handleInWorldShellAction(screen, 'toggle-debug-edit-overlays');
    },
    onTogglePlayerSpawnMarker: (screen) => {
      handleInWorldShellAction(screen, 'toggle-player-spawn-marker');
    },
    onToggleShortcutsOverlay: (screen) => {
      handleInWorldShellAction(screen, 'toggle-shortcuts-overlay');
    }
  });
  shell.setState(createDefaultBootShellState());
  const canvas = document.createElement('canvas');
  shell.getWorldHost().append(canvas);

  let renderer: Renderer;
  try {
    renderer = new Renderer(canvas);
  } catch {
    shell.setState(createWebGlUnavailableBootShellState());
    return;
  }

  const camera = new Camera2D();
  const defaultCameraZoom = camera.zoom;
  const input = new InputController(canvas, camera);
  const debug = new DebugOverlay();
  debug.setVisible(false);
  const hoveredTileCursor = new HoveredTileCursorOverlay(canvas);
  const playerSpawnMarker = new PlayerSpawnMarkerOverlay(canvas);
  const armedDebugToolPreview = new ArmedDebugToolPreviewOverlay(canvas);
  const debugEditStatusStrip = new DebugEditStatusStrip(canvas);
  let debugEditControls: TouchDebugEditControls | null = null;
  const syncInWorldShellState = (): void => {
    currentScreen = 'in-world';
    shell.setState(createInWorldShellState({
      debugOverlayVisible,
      debugEditControlsVisible,
      debugEditOverlaysVisible,
      playerSpawnMarkerVisible,
      shortcutsOverlayVisible
    }));
  };
  const showMainMenuShellState = (): void => {
    currentScreen = 'main-menu';
    shell.setState(createMainMenuShellState(worldSessionStarted));
    syncWorldScreenShellVisibility();
  };
  const syncDebugOverlayVisibility = (): void => {
    debug.setVisible(currentScreen === 'in-world' && debugOverlayVisible);
  };
  const syncDebugEditOverlayVisibility = (): void => {
    const visible = currentScreen === 'in-world' && debugEditOverlaysVisible;
    hoveredTileCursor.setVisible(visible);
    armedDebugToolPreview.setVisible(visible);
    debugEditStatusStrip.setVisible(visible);
  };
  const syncDebugEditControlsVisibility = (): void => {
    debugEditControls?.setVisible(currentScreen === 'in-world' && debugEditControlsVisible);
  };
  const syncPlayerSpawnMarkerVisibility = (): void => {
    playerSpawnMarker.setVisible(currentScreen === 'in-world' && playerSpawnMarkerVisible);
  };
  const syncWorldScreenShellVisibility = (): void => {
    syncDebugOverlayVisibility();
    syncDebugEditControlsVisibility();
    syncDebugEditOverlayVisibility();
    syncPlayerSpawnMarkerVisibility();
  };
  const syncInWorldShellOverlayVisibility = (actionType: InWorldShellOverlaySyncActionType): void => {
    switch (actionType) {
      case 'toggle-debug-overlay':
        syncDebugOverlayVisibility();
        return;
      case 'toggle-debug-edit-controls':
        syncDebugEditControlsVisibility();
        return;
      case 'toggle-debug-edit-overlays':
        syncDebugEditOverlayVisibility();
        return;
      case 'toggle-player-spawn-marker':
        syncPlayerSpawnMarkerVisibility();
        return;
    }
  };
  const applyInWorldShellToggleStateAction = (actionType: InWorldShellToggleActionType): void => {
    switch (actionType) {
      case 'toggle-debug-overlay':
        debugOverlayVisible = !debugOverlayVisible;
        return;
      case 'toggle-debug-edit-controls':
        debugEditControlsVisible = !debugEditControlsVisible;
        return;
      case 'toggle-debug-edit-overlays':
        debugEditOverlaysVisible = !debugEditOverlaysVisible;
        return;
      case 'toggle-player-spawn-marker':
        playerSpawnMarkerVisible = !playerSpawnMarkerVisible;
        return;
      case 'toggle-shortcuts-overlay':
        shortcutsOverlayVisible = !shortcutsOverlayVisible;
        return;
    }
  };
  const commitInWorldShellToggleStateAction = (): void => {
    persistWorldSessionShellState();
    syncInWorldShellState();
  };
  const finalizeInWorldShellToggleAction = (actionType: InWorldShellToggleActionType): void => {
    commitInWorldShellToggleStateAction();

    switch (actionType) {
      case 'toggle-debug-overlay':
      case 'toggle-debug-edit-controls':
      case 'toggle-debug-edit-overlays':
      case 'toggle-player-spawn-marker':
        syncInWorldShellOverlayVisibility(actionType);
        return;
      case 'toggle-shortcuts-overlay':
        return;
    }
  };
  const applyInWorldShellToggleAction = (actionType: InWorldShellToggleActionType): void => {
    applyInWorldShellToggleStateAction(actionType);
    finalizeInWorldShellToggleAction(actionType);
  };
  const canApplyInWorldRecenterCameraAction = (
    playerState: PlayerState | null
  ): playerState is PlayerState => playerState !== null;
  const applyInWorldShellNonToggleAction = (actionType: InWorldShellNonToggleActionType): boolean => {
    switch (actionType) {
      case 'return-to-main-menu':
        returnToMainMenuFromInWorld();
        return true;
      case 'recenter-camera':
        if (!canApplyInWorldRecenterCameraAction(standalonePlayerState)) return false;
        centerCameraOnStandalonePlayer(standalonePlayerState);
        return true;
    }
  };
  const applyMainMenuShellAction = (actionType: MainMenuShellActionType): boolean => {
    if (currentScreen !== 'main-menu' || loop === null) return false;

    if (
      (actionType === 'start-fresh-world-session' ||
        actionType === 'reset-shell-toggle-preferences') &&
      !worldSessionStarted
    ) {
      return false;
    }

    switch (actionType) {
      case 'enter-or-resume-world-session':
        enterOrResumeWorldSessionFromMainMenu();
        return true;
      case 'start-fresh-world-session':
        startFreshWorldSessionFromMainMenu();
        return true;
      case 'reset-shell-toggle-preferences':
        resetPausedMainMenuShellTogglePreferences();
        return true;
    }
  };
  const applyKeyboardMainMenuShellAction = (
    event: Pick<KeyboardEvent, 'preventDefault'>,
    actionType: MainMenuShellActionType
  ): boolean => {
    event.preventDefault();
    return applyMainMenuShellAction(actionType);
  };
  const applyInWorldShellAction = (actionType: InWorldShellActionType): boolean => {
    if (actionType === 'return-to-main-menu' || actionType === 'recenter-camera') {
      return applyInWorldShellNonToggleAction(actionType);
    }

    applyInWorldShellToggleAction(actionType);

    return true;
  };
  const applyKeyboardInWorldShellAction = (
    event: Pick<KeyboardEvent, 'preventDefault'>,
    actionType: InWorldShellActionType
  ): boolean => {
    event.preventDefault();
    return applyInWorldShellAction(actionType);
  };
  const applyDebugHistoryAction = (actionType: DebugHistoryActionType): boolean => {
    switch (actionType) {
      case 'undo':
        return undoDebugTileStroke();
      case 'redo':
        return redoDebugTileStroke();
    }
  };
  const applyKeyboardDebugHistoryAction = (
    event: Pick<KeyboardEvent, 'preventDefault'>,
    actionType: DebugHistoryActionType
  ): boolean => {
    event.preventDefault();
    return applyDebugHistoryAction(actionType);
  };
  const applyFixedStepDebugHistoryShortcutAction = (actionType: DebugHistoryActionType): boolean =>
    applyDebugHistoryAction(actionType);
  const isKeyboardArmedToolShortcutAction = (
    action: DebugEditShortcutAction
  ): action is KeyboardArmedToolShortcutAction => {
    switch (action.type) {
      case 'cancel-armed-tools':
      case 'arm-flood-fill':
      case 'arm-line':
      case 'arm-rect':
      case 'arm-rect-outline':
      case 'arm-ellipse':
      case 'arm-ellipse-outline':
        return true;
      default:
        return false;
    }
  };
  const applyKeyboardArmedToolAction = (
    event: Pick<KeyboardEvent, 'preventDefault'>,
    action: KeyboardArmedToolShortcutAction
  ): boolean => {
    event.preventDefault();

    switch (action.type) {
      case 'cancel-armed-tools': {
        const handled = input.cancelArmedDebugTools();
        if (handled) {
          syncArmedDebugToolControls();
        }
        return handled;
      }
      case 'arm-flood-fill':
        return toggleArmedDebugFloodFillKind(action.kind);
      case 'arm-line':
        return toggleArmedDebugLineKind(action.kind);
      case 'arm-rect':
        return toggleArmedDebugRectKind(action.kind);
      case 'arm-rect-outline':
        return toggleArmedDebugRectOutlineKind(action.kind);
      case 'arm-ellipse':
        return toggleArmedDebugEllipseKind(action.kind);
      case 'arm-ellipse-outline':
        return toggleArmedDebugEllipseOutlineKind(action.kind);
    }
  };
  const isKeyboardBrushShortcutAction = (
    action: DebugEditShortcutAction
  ): action is KeyboardBrushShortcutAction => {
    switch (action.type) {
      case 'select-brush-slot':
      case 'eyedropper':
      case 'cycle-brush':
        return true;
      default:
        return false;
    }
  };
  const applyKeyboardBrushAction = (
    event: Pick<KeyboardEvent, 'preventDefault'>,
    action: KeyboardBrushShortcutAction
  ): boolean => {
    event.preventDefault();

    switch (action.type) {
      case 'select-brush-slot': {
        const tileId = getDebugBrushTileIdForShortcutSlot(DEBUG_BRUSH_TILE_OPTIONS, action.slotIndex);
        return tileId !== null ? applyDebugBrushShortcutTileId(tileId) : false;
      }
      case 'eyedropper': {
        const pointerInspect = input.getPointerInspect();
        return pointerInspect?.pointerType === 'mouse'
          ? applyDebugBrushEyedropperAtTile(pointerInspect.tile.x, pointerInspect.tile.y)
          : false;
      }
      case 'cycle-brush': {
        const tileId = cycleDebugBrushTileId(DEBUG_BRUSH_TILE_OPTIONS, activeDebugBrushTileId, action.delta);
        return tileId !== null ? applyDebugBrushShortcutTileId(tileId) : false;
      }
    }
  };
  const isKeyboardDebugEditControlShortcutAction = (
    action: DebugEditShortcutAction
  ): action is KeyboardDebugEditControlShortcutAction => {
    switch (action.type) {
      case 'toggle-panel-collapsed':
      case 'set-touch-mode':
        return true;
      default:
        return false;
    }
  };
  const applyKeyboardDebugEditControlAction = (
    event: Pick<KeyboardEvent, 'preventDefault'>,
    action: KeyboardDebugEditControlShortcutAction
  ): boolean => {
    event.preventDefault();

    switch (action.type) {
      case 'toggle-panel-collapsed': {
        if (!debugEditControlsVisible) return false;
        const nextCollapsed = !(debugEditControls ? debugEditControls.isCollapsed() : debugEditPanelCollapsed);
        if (debugEditControls) {
          const previousCollapsed = debugEditPanelCollapsed;
          debugEditControls.setCollapsed(nextCollapsed);
          return debugEditPanelCollapsed !== previousCollapsed;
        }

        return commitDebugEditControlStateAction({
          type: 'set-panel-collapsed',
          collapsed: nextCollapsed
        });
      }
      case 'set-touch-mode': {
        if (debugEditControls) {
          const previousMode = input.getTouchDebugEditMode();
          debugEditControls.setMode(action.mode);
          return input.getTouchDebugEditMode() !== previousMode;
        }
        return commitDebugEditControlStateAction(action);
      }
    }
  };
  const enterInWorldShellState = (): void => {
    syncInWorldShellState();
    syncWorldScreenShellVisibility();
  };
  syncWorldScreenShellVisibility();
  input.retainPointerInspectWhenLeavingToElement(debugEditStatusStrip.getPointerInspectRetainerElement());
  let debugTileEditHistory = new DebugTileEditHistory();
  const debugEditControlStorage = worldSessionShellStateStorage;
  const defaultDebugEditControlState: DebugEditControlState = {
    touchMode: input.getTouchDebugEditMode(),
    brushTileId: INITIAL_DEBUG_BRUSH_TILE_ID,
    panelCollapsed: false
  };
  const initialDebugEditControlState = loadDebugEditControlState(
    debugEditControlStorage,
    DEBUG_BRUSH_TILE_IDS,
    defaultDebugEditControlState
  );
  let activeDebugBrushTileId = defaultDebugEditControlState.brushTileId;
  let debugEditPanelCollapsed = defaultDebugEditControlState.panelCollapsed;
  let suppressDebugEditControlPersistence = false;
  let pinnedDebugTileInspect: PinnedDebugTileInspectState | null = null;
  let resolvedPlayerSpawn = renderer.findPlayerSpawnPoint(DEBUG_PLAYER_SPAWN_SEARCH_OPTIONS);
  const entityRegistry = new EntityRegistry();
  let standalonePlayerState: PlayerState | null = null;
  let playerSpawnNeedsRefresh = false;
  let cameraFollowOffset: CameraFollowOffset = { x: 0, y: 0 };
  let lastAppliedPlayerFollowCameraPosition: CameraFollowPoint | null = null;
  let lastPlayerGroundedTransitionEvent: PlayerGroundedTransitionEvent | null = null;
  let lastPlayerFacingTransitionEvent: PlayerFacingTransitionEvent | null = null;
  let lastPlayerRespawnEvent: PlayerRespawnEvent | null = null;
  let lastPlayerWallContactTransitionEvent: PlayerWallContactTransitionEvent | null = null;
  let lastPlayerCeilingContactTransitionEvent: PlayerCeilingContactTransitionEvent | null = null;
  let standalonePlayerCeilingBonkHoldUntilTimeMs: number | null = null;

  const applyStandalonePlayerCameraFollow = (): void => {
    if (!standalonePlayerState) {
      lastAppliedPlayerFollowCameraPosition = null;
      return;
    }

    const focusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    const cameraPosition = resolveCameraPositionFromFollowTarget(focusPoint, cameraFollowOffset);
    camera.x = cameraPosition.x;
    camera.y = cameraPosition.y;
    lastAppliedPlayerFollowCameraPosition = cameraPosition;
  };

  const centerCameraOnStandalonePlayer = (playerState: PlayerState): void => {
    const focusPoint = getPlayerCameraFocusPoint(playerState);
    const recenteredCameraFollow = recenterCameraOnFollowTarget(focusPoint);
    cameraFollowOffset = recenteredCameraFollow.offset;
    camera.x = recenteredCameraFollow.cameraPosition.x;
    camera.y = recenteredCameraFollow.cameraPosition.y;
    lastAppliedPlayerFollowCameraPosition = recenteredCameraFollow.cameraPosition;
  };

  const refreshResolvedPlayerSpawn = (): void => {
    resolvedPlayerSpawn = renderer.findPlayerSpawnPoint(DEBUG_PLAYER_SPAWN_SEARCH_OPTIONS);
    playerSpawnNeedsRefresh = false;
    if (standalonePlayerState === null && resolvedPlayerSpawn) {
      standalonePlayerState = createPlayerStateFromSpawn(resolvedPlayerSpawn);
      lastPlayerGroundedTransitionEvent = null;
      lastPlayerFacingTransitionEvent = null;
      lastPlayerRespawnEvent = null;
      lastPlayerWallContactTransitionEvent = null;
      lastPlayerCeilingContactTransitionEvent = null;
      standalonePlayerCeilingBonkHoldUntilTimeMs = null;
      centerCameraOnStandalonePlayer(standalonePlayerState);
      return;
    }

    if (standalonePlayerState !== null) {
      const nextPlayerState = renderer.respawnPlayerStateAtSpawnIfEmbeddedInSolid(
        standalonePlayerState,
        resolvedPlayerSpawn
      );
      if (nextPlayerState !== standalonePlayerState) {
        lastPlayerGroundedTransitionEvent = null;
        lastPlayerFacingTransitionEvent = null;
        lastPlayerRespawnEvent =
          resolvedPlayerSpawn === null
            ? null
            : createEmbeddedPlayerRespawnEvent(nextPlayerState, resolvedPlayerSpawn);
        lastPlayerWallContactTransitionEvent = null;
        lastPlayerCeilingContactTransitionEvent = null;
        standalonePlayerCeilingBonkHoldUntilTimeMs = null;
      }
      standalonePlayerState = nextPlayerState;
    }
  };

  const applyWorldTileEdit = (
    worldTileX: number,
    worldTileY: number,
    tileId: number
  ): { previousTileId: number; changed: boolean } => {
    const previousTileId = renderer.getTile(worldTileX, worldTileY);
    const changed = renderer.setTile(worldTileX, worldTileY, tileId);
    if (changed) {
      playerSpawnNeedsRefresh = true;
    }

    return {
      previousTileId,
      changed
    };
  };

  const readDebugEditControlPreferenceSnapshot = (): DebugEditControlState => ({
    touchMode: input.getTouchDebugEditMode(),
    brushTileId: activeDebugBrushTileId,
    panelCollapsed: debugEditPanelCollapsed
  });
  const persistDebugEditControlsState = (): void => {
    if (suppressDebugEditControlPersistence) return;
    saveDebugEditControlState(debugEditControlStorage, readDebugEditControlPreferenceSnapshot());
  };
  const commitDebugEditBrushTileId = (tileId: number): boolean => {
    const previousBrushTileId = activeDebugBrushTileId;
    if (previousBrushTileId === tileId) return false;
    activeDebugBrushTileId = tileId;
    persistDebugEditControlsState();
    return activeDebugBrushTileId !== previousBrushTileId;
  };
  const commitDebugEditControlStateAction = (action: DebugEditControlStateCommitAction): boolean => {
    switch (action.type) {
      case 'set-touch-mode': {
        const previousMode = input.getTouchDebugEditMode();
        if (previousMode === action.mode) return false;
        input.setTouchDebugEditMode(action.mode);
        persistDebugEditControlsState();
        return input.getTouchDebugEditMode() !== previousMode;
      }
      case 'set-panel-collapsed': {
        const previousCollapsed = debugEditPanelCollapsed;
        if (previousCollapsed === action.collapsed) return false;
        debugEditPanelCollapsed = action.collapsed;
        persistDebugEditControlsState();
        return debugEditPanelCollapsed !== previousCollapsed;
      }
    }
  };
  const restoreDebugEditControlPreferences = (state: DebugEditControlState): void => {
    if (debugEditControls) {
      debugEditControls.setMode(state.touchMode);
      debugEditControls.setBrushTileId(state.brushTileId);
      debugEditControls.setCollapsed(state.panelCollapsed);
      return;
    }

    input.setTouchDebugEditMode(state.touchMode);
    activeDebugBrushTileId = state.brushTileId;
    debugEditPanelCollapsed = state.panelCollapsed;
  };
  const readTouchDebugArmedToolSnapshot = (): TouchDebugArmedToolSnapshot => ({
    floodFillKind: input.getArmedDebugFloodFillKind(),
    lineKind: input.getArmedDebugLineKind(),
    rectKind: input.getArmedDebugRectKind(),
    rectOutlineKind: input.getArmedDebugRectOutlineKind(),
    ellipseKind: input.getArmedDebugEllipseKind(),
    ellipseOutlineKind: input.getArmedDebugEllipseOutlineKind()
  });

  restoreDebugEditControlPreferences(initialDebugEditControlState);

  const resetDebugEditControlPrefs = (): void => {
    suppressDebugEditControlPersistence = true;
    try {
      restoreDebugEditControlPreferences(defaultDebugEditControlState);
    } finally {
      suppressDebugEditControlPersistence = false;
    }

    clearDebugEditControlState(debugEditControlStorage);
  };

  const syncDebugEditHistoryControls = (): void => {
    if (!debugEditControls) return;
    const historyStatus = debugTileEditHistory.getStatus();
    debugEditControls.setHistoryState({
      undoStrokeCount: historyStatus.undoStrokeCount,
      redoStrokeCount: historyStatus.redoStrokeCount
    });
  };
  const applyTouchDebugArmedToolSnapshot = (snapshot: TouchDebugArmedToolSnapshot): void => {
    if (!debugEditControls) return;
    debugEditControls.setArmedFloodFillKind(snapshot.floodFillKind);
    debugEditControls.setArmedLineKind(snapshot.lineKind);
    debugEditControls.setArmedRectKind(snapshot.rectKind);
    debugEditControls.setArmedRectOutlineKind(snapshot.rectOutlineKind);
    debugEditControls.setArmedEllipseKind(snapshot.ellipseKind);
    debugEditControls.setArmedEllipseOutlineKind(snapshot.ellipseOutlineKind);
  };

  const syncArmedDebugToolControls = (): void => {
    applyTouchDebugArmedToolSnapshot(readTouchDebugArmedToolSnapshot());
  };

  const setArmedDebugFloodFillKind = (kind: DebugTileEditKind | null): boolean => {
    const previousKind = input.getArmedDebugFloodFillKind();
    const previousLineKind = input.getArmedDebugLineKind();
    const previousRectKind = input.getArmedDebugRectKind();
    const previousRectOutlineKind = input.getArmedDebugRectOutlineKind();
    const previousEllipseKind = input.getArmedDebugEllipseKind();
    const previousEllipseOutlineKind = input.getArmedDebugEllipseOutlineKind();
    if (
      previousKind === kind &&
      (kind === null ||
        (previousLineKind === null &&
          previousRectKind === null &&
          previousRectOutlineKind === null &&
          previousEllipseKind === null &&
          previousEllipseOutlineKind === null))
    ) {
      return false;
    }
    if (kind !== null && previousLineKind !== null) {
      input.setArmedDebugLineKind(null);
    }
    if (kind !== null && previousRectKind !== null) {
      input.setArmedDebugRectKind(null);
    }
    if (kind !== null && previousRectOutlineKind !== null) {
      input.setArmedDebugRectOutlineKind(null);
    }
    if (kind !== null && previousEllipseKind !== null) {
      input.setArmedDebugEllipseKind(null);
    }
    if (kind !== null && previousEllipseOutlineKind !== null) {
      input.setArmedDebugEllipseOutlineKind(null);
    }
    input.setArmedDebugFloodFillKind(kind);
    syncArmedDebugToolControls();
    return true;
  };

  const toggleArmedDebugFloodFillKind = (kind: DebugTileEditKind): boolean => {
    const currentKind = input.getArmedDebugFloodFillKind();
    return setArmedDebugFloodFillKind(currentKind === kind ? null : kind);
  };

  const setArmedDebugLineKind = (kind: DebugTileEditKind | null): boolean => {
    const previousKind = input.getArmedDebugLineKind();
    const previousFloodFillKind = input.getArmedDebugFloodFillKind();
    const previousRectKind = input.getArmedDebugRectKind();
    const previousRectOutlineKind = input.getArmedDebugRectOutlineKind();
    const previousEllipseKind = input.getArmedDebugEllipseKind();
    const previousEllipseOutlineKind = input.getArmedDebugEllipseOutlineKind();
    if (
      previousKind === kind &&
      (kind === null ||
        (previousFloodFillKind === null &&
          previousRectKind === null &&
          previousRectOutlineKind === null &&
          previousEllipseKind === null &&
          previousEllipseOutlineKind === null))
    ) {
      return false;
    }
    if (kind !== null && previousFloodFillKind !== null) {
      input.setArmedDebugFloodFillKind(null);
    }
    if (kind !== null && previousRectKind !== null) {
      input.setArmedDebugRectKind(null);
    }
    if (kind !== null && previousRectOutlineKind !== null) {
      input.setArmedDebugRectOutlineKind(null);
    }
    if (kind !== null && previousEllipseKind !== null) {
      input.setArmedDebugEllipseKind(null);
    }
    if (kind !== null && previousEllipseOutlineKind !== null) {
      input.setArmedDebugEllipseOutlineKind(null);
    }
    input.setArmedDebugLineKind(kind);
    syncArmedDebugToolControls();
    return true;
  };

  const toggleArmedDebugLineKind = (kind: DebugTileEditKind): boolean => {
    const currentKind = input.getArmedDebugLineKind();
    return setArmedDebugLineKind(currentKind === kind ? null : kind);
  };

  const setArmedDebugRectKind = (kind: DebugTileEditKind | null): boolean => {
    const previousKind = input.getArmedDebugRectKind();
    const previousFloodFillKind = input.getArmedDebugFloodFillKind();
    const previousLineKind = input.getArmedDebugLineKind();
    const previousRectOutlineKind = input.getArmedDebugRectOutlineKind();
    const previousEllipseKind = input.getArmedDebugEllipseKind();
    const previousEllipseOutlineKind = input.getArmedDebugEllipseOutlineKind();
    if (
      previousKind === kind &&
      (kind === null ||
        (previousFloodFillKind === null &&
          previousLineKind === null &&
          previousRectOutlineKind === null &&
          previousEllipseKind === null &&
          previousEllipseOutlineKind === null))
    ) {
      return false;
    }
    if (kind !== null && previousFloodFillKind !== null) {
      input.setArmedDebugFloodFillKind(null);
    }
    if (kind !== null && previousLineKind !== null) {
      input.setArmedDebugLineKind(null);
    }
    if (kind !== null && previousRectOutlineKind !== null) {
      input.setArmedDebugRectOutlineKind(null);
    }
    if (kind !== null && previousEllipseKind !== null) {
      input.setArmedDebugEllipseKind(null);
    }
    if (kind !== null && previousEllipseOutlineKind !== null) {
      input.setArmedDebugEllipseOutlineKind(null);
    }
    input.setArmedDebugRectKind(kind);
    syncArmedDebugToolControls();
    return true;
  };

  const toggleArmedDebugRectKind = (kind: DebugTileEditKind): boolean => {
    const currentKind = input.getArmedDebugRectKind();
    return setArmedDebugRectKind(currentKind === kind ? null : kind);
  };

  const setArmedDebugRectOutlineKind = (kind: DebugTileEditKind | null): boolean => {
    const previousKind = input.getArmedDebugRectOutlineKind();
    const previousFloodFillKind = input.getArmedDebugFloodFillKind();
    const previousLineKind = input.getArmedDebugLineKind();
    const previousRectKind = input.getArmedDebugRectKind();
    const previousEllipseKind = input.getArmedDebugEllipseKind();
    const previousEllipseOutlineKind = input.getArmedDebugEllipseOutlineKind();
    if (
      previousKind === kind &&
      (kind === null ||
        (previousFloodFillKind === null &&
          previousLineKind === null &&
          previousRectKind === null &&
          previousEllipseKind === null &&
          previousEllipseOutlineKind === null))
    ) {
      return false;
    }
    if (kind !== null && previousFloodFillKind !== null) {
      input.setArmedDebugFloodFillKind(null);
    }
    if (kind !== null && previousLineKind !== null) {
      input.setArmedDebugLineKind(null);
    }
    if (kind !== null && previousRectKind !== null) {
      input.setArmedDebugRectKind(null);
    }
    if (kind !== null && previousEllipseKind !== null) {
      input.setArmedDebugEllipseKind(null);
    }
    if (kind !== null && previousEllipseOutlineKind !== null) {
      input.setArmedDebugEllipseOutlineKind(null);
    }
    input.setArmedDebugRectOutlineKind(kind);
    syncArmedDebugToolControls();
    return true;
  };

  const toggleArmedDebugRectOutlineKind = (kind: DebugTileEditKind): boolean => {
    const currentKind = input.getArmedDebugRectOutlineKind();
    return setArmedDebugRectOutlineKind(currentKind === kind ? null : kind);
  };

  const setArmedDebugEllipseKind = (kind: DebugTileEditKind | null): boolean => {
    const previousKind = input.getArmedDebugEllipseKind();
    const previousFloodFillKind = input.getArmedDebugFloodFillKind();
    const previousLineKind = input.getArmedDebugLineKind();
    const previousRectKind = input.getArmedDebugRectKind();
    const previousRectOutlineKind = input.getArmedDebugRectOutlineKind();
    const previousEllipseOutlineKind = input.getArmedDebugEllipseOutlineKind();
    if (
      previousKind === kind &&
      (kind === null ||
        (previousFloodFillKind === null &&
          previousLineKind === null &&
          previousRectKind === null &&
          previousRectOutlineKind === null &&
          previousEllipseOutlineKind === null))
    ) {
      return false;
    }
    if (kind !== null && previousFloodFillKind !== null) {
      input.setArmedDebugFloodFillKind(null);
    }
    if (kind !== null && previousLineKind !== null) {
      input.setArmedDebugLineKind(null);
    }
    if (kind !== null && previousRectKind !== null) {
      input.setArmedDebugRectKind(null);
    }
    if (kind !== null && previousRectOutlineKind !== null) {
      input.setArmedDebugRectOutlineKind(null);
    }
    if (kind !== null && previousEllipseOutlineKind !== null) {
      input.setArmedDebugEllipseOutlineKind(null);
    }
    input.setArmedDebugEllipseKind(kind);
    syncArmedDebugToolControls();
    return true;
  };

  const toggleArmedDebugEllipseKind = (kind: DebugTileEditKind): boolean => {
    const currentKind = input.getArmedDebugEllipseKind();
    return setArmedDebugEllipseKind(currentKind === kind ? null : kind);
  };

  const setArmedDebugEllipseOutlineKind = (kind: DebugTileEditKind | null): boolean => {
    const previousKind = input.getArmedDebugEllipseOutlineKind();
    const previousFloodFillKind = input.getArmedDebugFloodFillKind();
    const previousLineKind = input.getArmedDebugLineKind();
    const previousRectKind = input.getArmedDebugRectKind();
    const previousRectOutlineKind = input.getArmedDebugRectOutlineKind();
    const previousEllipseKind = input.getArmedDebugEllipseKind();
    if (
      previousKind === kind &&
      (kind === null ||
        (previousFloodFillKind === null &&
          previousLineKind === null &&
          previousRectKind === null &&
          previousRectOutlineKind === null &&
          previousEllipseKind === null))
    ) {
      return false;
    }
    if (kind !== null && previousFloodFillKind !== null) {
      input.setArmedDebugFloodFillKind(null);
    }
    if (kind !== null && previousLineKind !== null) {
      input.setArmedDebugLineKind(null);
    }
    if (kind !== null && previousRectKind !== null) {
      input.setArmedDebugRectKind(null);
    }
    if (kind !== null && previousRectOutlineKind !== null) {
      input.setArmedDebugRectOutlineKind(null);
    }
    if (kind !== null && previousEllipseKind !== null) {
      input.setArmedDebugEllipseKind(null);
    }
    input.setArmedDebugEllipseOutlineKind(kind);
    syncArmedDebugToolControls();
    return true;
  };

  const toggleArmedDebugEllipseOutlineKind = (kind: DebugTileEditKind): boolean => {
    const currentKind = input.getArmedDebugEllipseOutlineKind();
    return setArmedDebugEllipseOutlineKind(currentKind === kind ? null : kind);
  };

  const applyDebugHistoryTile = (worldTileX: number, worldTileY: number, tileId: number): void => {
    applyWorldTileEdit(worldTileX, worldTileY, tileId);
  };

  const applyDebugFloodFill = (
    worldTileX: number,
    worldTileY: number,
    kind: DebugTileEditKind,
    strokeId: number
  ): number => {
    const replacementTileId = kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
    const residentChunkBounds = renderer.getResidentChunkBounds();
    if (!residentChunkBounds) return 0;

    const result = runDebugFloodFill({
      startTileX: worldTileX,
      startTileY: worldTileY,
      replacementTileId,
      bounds: {
        minTileX: residentChunkBounds.minChunkX * CHUNK_SIZE,
        minTileY: residentChunkBounds.minChunkY * CHUNK_SIZE,
        maxTileX: (residentChunkBounds.maxChunkX + 1) * CHUNK_SIZE - 1,
        maxTileY: (residentChunkBounds.maxChunkY + 1) * CHUNK_SIZE - 1
      },
      readTile: (fillTileX, fillTileY) => renderer.getTile(fillTileX, fillTileY),
      visitFilledTile: (fillTileX, fillTileY, previousTileId) => {
        const { changed } = applyWorldTileEdit(fillTileX, fillTileY, replacementTileId);
        if (!changed) return;
        debugTileEditHistory.recordAppliedEdit(
          strokeId,
          fillTileX,
          fillTileY,
          previousTileId,
          replacementTileId
        );
      }
    });

    return result.filledTileCount;
  };

  const applyDebugLine = (
    startTileX: number,
    startTileY: number,
    endTileX: number,
    endTileY: number,
    kind: DebugTileEditKind,
    strokeId: number
  ): number => {
    const tileId = kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
    let changedTileCount = 0;
    walkLineSteppedTilePath(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const { previousTileId, changed } = applyWorldTileEdit(worldTileX, worldTileY, tileId);
      if (!changed) return;
      debugTileEditHistory.recordAppliedEdit(strokeId, worldTileX, worldTileY, previousTileId, tileId);
      changedTileCount += 1;
    });
    return changedTileCount;
  };

  const applyDebugRectFill = (
    startTileX: number,
    startTileY: number,
    endTileX: number,
    endTileY: number,
    kind: DebugTileEditKind,
    strokeId: number
  ): number => {
    const tileId = kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
    let changedTileCount = 0;
    walkFilledRectangleTileArea(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const { previousTileId, changed } = applyWorldTileEdit(worldTileX, worldTileY, tileId);
      if (!changed) return;
      debugTileEditHistory.recordAppliedEdit(strokeId, worldTileX, worldTileY, previousTileId, tileId);
      changedTileCount += 1;
    });
    return changedTileCount;
  };

  const applyDebugRectOutline = (
    startTileX: number,
    startTileY: number,
    endTileX: number,
    endTileY: number,
    kind: DebugTileEditKind,
    strokeId: number
  ): number => {
    const tileId = kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
    let changedTileCount = 0;
    walkRectangleOutlineTileArea(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const { previousTileId, changed } = applyWorldTileEdit(worldTileX, worldTileY, tileId);
      if (!changed) return;
      debugTileEditHistory.recordAppliedEdit(strokeId, worldTileX, worldTileY, previousTileId, tileId);
      changedTileCount += 1;
    });
    return changedTileCount;
  };

  const applyDebugEllipseFill = (
    startTileX: number,
    startTileY: number,
    endTileX: number,
    endTileY: number,
    kind: DebugTileEditKind,
    strokeId: number
  ): number => {
    const tileId = kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
    let changedTileCount = 0;
    walkFilledEllipseTileArea(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const { previousTileId, changed } = applyWorldTileEdit(worldTileX, worldTileY, tileId);
      if (!changed) return;
      debugTileEditHistory.recordAppliedEdit(strokeId, worldTileX, worldTileY, previousTileId, tileId);
      changedTileCount += 1;
    });
    return changedTileCount;
  };

  const applyDebugEllipseOutline = (
    startTileX: number,
    startTileY: number,
    endTileX: number,
    endTileY: number,
    kind: DebugTileEditKind,
    strokeId: number
  ): number => {
    const tileId = kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
    let changedTileCount = 0;
    walkEllipseOutlineTileArea(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const { previousTileId, changed } = applyWorldTileEdit(worldTileX, worldTileY, tileId);
      if (!changed) return;
      debugTileEditHistory.recordAppliedEdit(strokeId, worldTileX, worldTileY, previousTileId, tileId);
      changedTileCount += 1;
    });
    return changedTileCount;
  };

  const undoDebugTileStroke = (): boolean => {
    if (!debugTileEditHistory.undo(applyDebugHistoryTile)) return false;
    syncDebugEditHistoryControls();
    return true;
  };

  const redoDebugTileStroke = (): boolean => {
    if (!debugTileEditHistory.redo(applyDebugHistoryTile)) return false;
    syncDebugEditHistoryControls();
    return true;
  };

  const initialDebugEditControlPreferenceSnapshot = readDebugEditControlPreferenceSnapshot();
  const initialTouchDebugArmedToolSnapshot = readTouchDebugArmedToolSnapshot();
  debugEditControls = new TouchDebugEditControls({
    initialVisible: false,
    initialMode: initialDebugEditControlPreferenceSnapshot.touchMode,
    onModeChange: (mode) => {
      commitDebugEditControlStateAction({
        type: 'set-touch-mode',
        mode
      });
    },
    brushOptions: DEBUG_BRUSH_TILE_OPTIONS,
    initialBrushTileId: initialDebugEditControlPreferenceSnapshot.brushTileId,
    onBrushTileIdChange: (tileId) => {
      commitDebugEditBrushTileId(tileId);
    },
    initialCollapsed: initialDebugEditControlPreferenceSnapshot.panelCollapsed,
    onCollapsedChange: (collapsed) => {
      commitDebugEditControlStateAction({
        type: 'set-panel-collapsed',
        collapsed
      });
    },
    initialArmedFloodFillKind: initialTouchDebugArmedToolSnapshot.floodFillKind,
    initialArmedLineKind: initialTouchDebugArmedToolSnapshot.lineKind,
    initialArmedRectKind: initialTouchDebugArmedToolSnapshot.rectKind,
    initialArmedRectOutlineKind: initialTouchDebugArmedToolSnapshot.rectOutlineKind,
    initialArmedEllipseKind: initialTouchDebugArmedToolSnapshot.ellipseKind,
    initialArmedEllipseOutlineKind: initialTouchDebugArmedToolSnapshot.ellipseOutlineKind,
    onArmFloodFill: (kind) => {
      toggleArmedDebugFloodFillKind(kind);
    },
    onArmLine: (kind) => {
      toggleArmedDebugLineKind(kind);
    },
    onArmRect: (kind) => {
      toggleArmedDebugRectKind(kind);
    },
    onArmRectOutline: (kind) => {
      toggleArmedDebugRectOutlineKind(kind);
    },
    onArmEllipse: (kind) => {
      toggleArmedDebugEllipseKind(kind);
    },
    onArmEllipseOutline: (kind) => {
      toggleArmedDebugEllipseOutlineKind(kind);
    },
    onUndo: undoDebugTileStroke,
    onRedo: redoDebugTileStroke,
    onResetPrefs: resetDebugEditControlPrefs
  });
  syncDebugEditControlsVisibility();
  if (touchControlsAvailable) {
    new TouchPlayerControls({
      onMoveLeftHeldChange: (held) => {
        input.setTouchPlayerMoveLeftHeld(held);
      },
      onMoveRightHeldChange: (held) => {
        input.setTouchPlayerMoveRightHeld(held);
      },
      onJumpHeldChange: (held) => {
        input.setTouchPlayerJumpHeld(held);
      }
    });
  }
  syncDebugEditHistoryControls();
  syncArmedDebugToolControls();
  persistDebugEditControlsState();

  const applyDebugBrushShortcutTileId = (tileId: number): boolean => {
    const previousBrushTileId = activeDebugBrushTileId;
    if (debugEditControls) {
      debugEditControls.setBrushTileId(tileId);
      return activeDebugBrushTileId !== previousBrushTileId;
    }
    return commitDebugEditBrushTileId(tileId);
  };

  const applyDebugBrushEyedropperAtTile = (worldTileX: number, worldTileY: number): boolean => {
    const tileId = renderer.getTile(worldTileX, worldTileY);
    if (!DEBUG_BRUSH_TILE_ID_SET.has(tileId)) return false;
    return applyDebugBrushShortcutTileId(tileId);
  };

  const getActiveDebugBrushLabel = (): string => DEBUG_BRUSH_TILE_LABELS.get(activeDebugBrushTileId) ?? `tile ${activeDebugBrushTileId}`;

  const getDebugTileStatusAtTile = (
    tileX: number,
    tileY: number,
    elapsedMs: number
  ): DebugEditHoveredTileState => {
    const tileId = renderer.getTile(tileX, tileY);
    const tileMetadata = getTileMetadata(tileId);
    const gameplay = resolveTileGameplayMetadata(tileId);
    const { chunkX, chunkY } = worldToChunkCoord(tileX, tileY);
    const { localX, localY } = worldToLocalTile(tileX, tileY);
    const liquidCardinalMask = renderer.getLiquidRenderCardinalMask(tileX, tileY);
    const liquidAnimationFrameCount =
      typeof liquidCardinalMask === 'number'
        ? getAnimatedLiquidRenderVariantFrameCount(tileId, liquidCardinalMask)
        : 0;
    const liquidAnimationFrameDurationMs =
      typeof liquidCardinalMask === 'number' && liquidAnimationFrameCount > 0
        ? getAnimatedLiquidRenderVariantFrameDurationMs(tileId, liquidCardinalMask)
        : null;
    const liquidAnimationFrameElapsedMs =
      typeof liquidCardinalMask === 'number' && liquidAnimationFrameCount > 0
        ? resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs(tileId, liquidCardinalMask, elapsedMs)
        : null;
    const liquidAnimationFrameProgressNormalized =
      typeof liquidCardinalMask === 'number' && liquidAnimationFrameCount > 0
        ? resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs(
            tileId,
            liquidCardinalMask,
            elapsedMs
          )
        : null;
    const liquidAnimationFrameRemainingMs =
      typeof liquidCardinalMask === 'number' && liquidAnimationFrameCount > 0
        ? resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs(tileId, liquidCardinalMask, elapsedMs)
        : null;
    const liquidAnimationLoopDurationMs =
      liquidAnimationFrameCount > 0 && typeof liquidAnimationFrameDurationMs === 'number'
        ? liquidAnimationFrameCount * liquidAnimationFrameDurationMs
        : null;
    const liquidAnimationLoopElapsedMs =
      typeof liquidCardinalMask === 'number' && liquidAnimationFrameCount > 0
        ? resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs(tileId, liquidCardinalMask, elapsedMs)
        : null;
    const liquidAnimationLoopProgressNormalized =
      typeof liquidCardinalMask === 'number' && liquidAnimationFrameCount > 0
        ? resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs(
            tileId,
            liquidCardinalMask,
            elapsedMs
          )
        : null;
    const liquidAnimationLoopRemainingMs =
      typeof liquidCardinalMask === 'number' && liquidAnimationFrameCount > 0
        ? resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs(tileId, liquidCardinalMask, elapsedMs)
        : null;
    const liquidAnimationFrameIndex =
      typeof liquidCardinalMask === 'number' && liquidAnimationFrameCount > 0
        ? resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs(tileId, liquidCardinalMask, elapsedMs)
        : null;
    const atlasWidth = renderer.telemetry.atlasWidth;
    const atlasHeight = renderer.telemetry.atlasHeight;

    return {
      liquidConnectivityGroupLabel: describeLiquidConnectivityGroup(tileId),
      liquidCardinalMask,
      liquidAnimationFrameIndex,
      liquidAnimationFrameCount: liquidAnimationFrameCount > 0 ? liquidAnimationFrameCount : null,
      liquidAnimationFrameDurationMs,
      liquidAnimationFrameElapsedMs,
      liquidAnimationFrameProgressNormalized,
      liquidAnimationFrameRemainingMs,
      liquidAnimationLoopDurationMs,
      liquidAnimationLoopElapsedMs,
      liquidAnimationLoopProgressNormalized,
      liquidAnimationLoopRemainingMs,
      liquidVariantSource:
        typeof liquidCardinalMask === 'number'
          ? describeLiquidRenderVariantSourceAtElapsedMs(tileId, liquidCardinalMask, elapsedMs)
          : null,
      liquidVariantUvRect:
        typeof liquidCardinalMask === 'number'
          ? describeLiquidRenderVariantUvRectAtElapsedMs(tileId, liquidCardinalMask, elapsedMs)
          : null,
      liquidVariantPixelBounds:
        typeof liquidCardinalMask === 'number' &&
        typeof atlasWidth === 'number' &&
        typeof atlasHeight === 'number'
          ? describeLiquidRenderVariantPixelBoundsAtElapsedMs(
              tileId,
              liquidCardinalMask,
              elapsedMs,
              atlasWidth,
              atlasHeight
            )
          : null,
      tileX,
      tileY,
      chunkX,
      chunkY,
      localX,
      localY,
      tileId,
      tileLabel: tileMetadata ? formatDebugBrushLabel(tileMetadata.name) : `tile ${tileId}`,
      solid: gameplay.solid,
      blocksLight: gameplay.blocksLight,
      liquidKind: gameplay.liquidKind ?? null
    };
  };

  const getHoveredDebugTileStatus = (
    pointerInspect: PointerInspectSnapshot | null,
    elapsedMs: number
  ): DebugEditHoveredTileState | null => {
    if (!pointerInspect) return null;
    return getDebugTileStatusAtTile(pointerInspect.tile.x, pointerInspect.tile.y, elapsedMs);
  };

  const togglePinnedDebugTileInspect = (tileX: number, tileY: number): void => {
    if (pinnedDebugTileInspect?.tileX === tileX && pinnedDebugTileInspect.tileY === tileY) {
      pinnedDebugTileInspect = null;
      return;
    }

    pinnedDebugTileInspect = {
      tileX,
      tileY
    };
  };

  const clearPinnedDebugTileInspect = (): void => {
    pinnedDebugTileInspect = null;
  };
  const resetFreshWorldSessionRuntimeState = (): void => {
    renderer.resetWorld();
    debugTileEditHistory = new DebugTileEditHistory();
    syncDebugEditHistoryControls();
    input.cancelArmedDebugTools();
    syncArmedDebugToolControls();
    clearPinnedDebugTileInspect();
    camera.x = 0;
    camera.y = 0;
    camera.zoom = defaultCameraZoom;
    cameraFollowOffset = { x: 0, y: 0 };
    lastAppliedPlayerFollowCameraPosition = null;
    lastPlayerGroundedTransitionEvent = null;
    lastPlayerFacingTransitionEvent = null;
    lastPlayerRespawnEvent = null;
    lastPlayerWallContactTransitionEvent = null;
    lastPlayerCeilingContactTransitionEvent = null;
    standalonePlayerCeilingBonkHoldUntilTimeMs = null;
    standalonePlayerState = null;
    resolvedPlayerSpawn = renderer.findPlayerSpawnPoint(DEBUG_PLAYER_SPAWN_SEARCH_OPTIONS);
    playerSpawnNeedsRefresh = false;
    refreshResolvedPlayerSpawn();
  };
  const enterOrResumeWorldSessionFromMainMenu = (): void => {
    if (loop === null) return;
    applyPausedMainMenuWorldSessionShellTransition('resume-paused-world-session');
    enterInWorldShellState();
    if (worldSessionStarted) return;
    worldSessionStarted = true;
    loop.start();
  };
  const startFreshWorldSessionFromMainMenu = (): void => {
    if (loop === null || !worldSessionStarted) return;
    applyPausedMainMenuWorldSessionShellTransition('start-fresh-world-session');
    resetFreshWorldSessionRuntimeState();
    enterInWorldShellState();
  };
  const resetPausedMainMenuShellTogglePreferences = (): void => {
    if (loop === null || !worldSessionStarted) return;
    applyPausedMainMenuWorldSessionShellTransition('reset-shell-toggle-preferences', 'clear');
  };

  debugEditStatusStrip.setActionHandlers({
    onInspectAction: () => {
      input.setArmedDesktopDebugInspectPin(!input.getArmedDesktopDebugInspectPin());
    },
    onClearPinnedTile: () => {
      clearPinnedDebugTileInspect();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    if (isEditableKeyboardShortcutTarget(event.target)) return;

    const action = resolveDebugEditShortcutAction(
      event,
      createDebugEditShortcutContext(currentScreen, worldSessionStarted)
    );
    if (!action) return;
    if (
      action.type === 'resume-paused-world-session' ||
      action.type === 'start-fresh-world-session'
    ) {
      applyKeyboardMainMenuShellAction(
        event,
        action.type === 'resume-paused-world-session'
          ? 'enter-or-resume-world-session'
          : 'start-fresh-world-session'
      );
      return;
    }
    if (currentScreen !== 'in-world' && isInWorldOnlyDebugEditShortcutAction(action)) {
      return;
    }

    let handled = false;
    if (action.type === 'undo' || action.type === 'redo') {
      handled = applyKeyboardDebugHistoryAction(event, action.type);
    } else if (
      action.type === 'return-to-main-menu' ||
      action.type === 'recenter-camera' ||
      action.type === 'toggle-debug-overlay' ||
      action.type === 'toggle-debug-edit-controls' ||
      action.type === 'toggle-debug-edit-overlays' ||
      action.type === 'toggle-player-spawn-marker' ||
      action.type === 'toggle-shortcuts-overlay'
    ) {
      handled = applyKeyboardInWorldShellAction(event, action.type);
    } else if (isKeyboardArmedToolShortcutAction(action)) {
      handled = applyKeyboardArmedToolAction(event, action);
    } else if (isKeyboardDebugEditControlShortcutAction(action)) {
      handled = applyKeyboardDebugEditControlAction(event, action);
    } else if (isKeyboardBrushShortcutAction(action)) {
      handled = applyKeyboardBrushAction(event, action);
    } else {
      const exhaustiveAction: never = action;
      return exhaustiveAction;
    }

    if (!handled) return;
  });

  const renderWorldFrame = (frameDtMs: number): void => {
    const renderTimeMs = performance.now();
    const pointerInspect = input.getPointerInspect();
    const armedDebugToolPreviewState = input.getArmedDebugToolPreviewState();
    const hoveredDebugTileStatus = getHoveredDebugTileStatus(pointerInspect, renderTimeMs);
    const pinnedDebugTileStatus = pinnedDebugTileInspect
      ? getDebugTileStatusAtTile(
          pinnedDebugTileInspect.tileX,
          pinnedDebugTileInspect.tileY,
          renderTimeMs
        )
      : null;
    const debugOverlayPointerInspect = pointerInspect
      ? {
          ...pointerInspect,
          tileId: hoveredDebugTileStatus?.tileId,
          tileLabel: hoveredDebugTileStatus?.tileLabel,
          solid: hoveredDebugTileStatus?.solid,
          blocksLight: hoveredDebugTileStatus?.blocksLight,
          liquidKind: hoveredDebugTileStatus?.liquidKind ?? null,
          liquidConnectivityGroupLabel: hoveredDebugTileStatus?.liquidConnectivityGroupLabel ?? null,
          liquidCardinalMask: hoveredDebugTileStatus?.liquidCardinalMask ?? null,
          liquidAnimationFrameIndex: hoveredDebugTileStatus?.liquidAnimationFrameIndex ?? null,
          liquidAnimationFrameCount: hoveredDebugTileStatus?.liquidAnimationFrameCount ?? null,
          liquidAnimationFrameDurationMs: hoveredDebugTileStatus?.liquidAnimationFrameDurationMs ?? null,
          liquidAnimationFrameElapsedMs: hoveredDebugTileStatus?.liquidAnimationFrameElapsedMs ?? null,
          liquidAnimationFrameProgressNormalized:
            hoveredDebugTileStatus?.liquidAnimationFrameProgressNormalized ?? null,
          liquidAnimationFrameRemainingMs: hoveredDebugTileStatus?.liquidAnimationFrameRemainingMs ?? null,
          liquidAnimationLoopDurationMs: hoveredDebugTileStatus?.liquidAnimationLoopDurationMs ?? null,
          liquidAnimationLoopElapsedMs: hoveredDebugTileStatus?.liquidAnimationLoopElapsedMs ?? null,
          liquidAnimationLoopProgressNormalized:
            hoveredDebugTileStatus?.liquidAnimationLoopProgressNormalized ?? null,
          liquidAnimationLoopRemainingMs: hoveredDebugTileStatus?.liquidAnimationLoopRemainingMs ?? null,
          liquidVariantSource: hoveredDebugTileStatus?.liquidVariantSource ?? null,
          liquidVariantUvRect: hoveredDebugTileStatus?.liquidVariantUvRect ?? null,
          liquidVariantPixelBounds: hoveredDebugTileStatus?.liquidVariantPixelBounds ?? null
        }
      : null;
    const debugOverlayPinnedInspect = pinnedDebugTileStatus
      ? {
          tile: {
            x: pinnedDebugTileStatus.tileX,
            y: pinnedDebugTileStatus.tileY
          },
          tileId: pinnedDebugTileStatus.tileId,
          tileLabel: pinnedDebugTileStatus.tileLabel,
          solid: pinnedDebugTileStatus.solid,
          blocksLight: pinnedDebugTileStatus.blocksLight,
          liquidKind: pinnedDebugTileStatus.liquidKind,
          liquidConnectivityGroupLabel: pinnedDebugTileStatus.liquidConnectivityGroupLabel ?? null,
          liquidCardinalMask: pinnedDebugTileStatus.liquidCardinalMask ?? null,
          liquidAnimationFrameIndex: pinnedDebugTileStatus.liquidAnimationFrameIndex ?? null,
          liquidAnimationFrameCount: pinnedDebugTileStatus.liquidAnimationFrameCount ?? null,
          liquidAnimationFrameDurationMs: pinnedDebugTileStatus.liquidAnimationFrameDurationMs ?? null,
          liquidAnimationFrameElapsedMs: pinnedDebugTileStatus.liquidAnimationFrameElapsedMs ?? null,
          liquidAnimationFrameProgressNormalized:
            pinnedDebugTileStatus.liquidAnimationFrameProgressNormalized ?? null,
          liquidAnimationFrameRemainingMs: pinnedDebugTileStatus.liquidAnimationFrameRemainingMs ?? null,
          liquidAnimationLoopDurationMs: pinnedDebugTileStatus.liquidAnimationLoopDurationMs ?? null,
          liquidAnimationLoopElapsedMs: pinnedDebugTileStatus.liquidAnimationLoopElapsedMs ?? null,
          liquidAnimationLoopProgressNormalized:
            pinnedDebugTileStatus.liquidAnimationLoopProgressNormalized ?? null,
          liquidAnimationLoopRemainingMs: pinnedDebugTileStatus.liquidAnimationLoopRemainingMs ?? null,
          liquidVariantSource: pinnedDebugTileStatus.liquidVariantSource ?? null,
          liquidVariantUvRect: pinnedDebugTileStatus.liquidVariantUvRect ?? null,
          liquidVariantPixelBounds: pinnedDebugTileStatus.liquidVariantPixelBounds ?? null
        }
      : null;
    const debugOverlaySpawn = resolvedPlayerSpawn
      ? {
          tile: {
            x: resolvedPlayerSpawn.anchorTileX,
            y: resolvedPlayerSpawn.standingTileY
          },
          world: {
            x: resolvedPlayerSpawn.x,
            y: resolvedPlayerSpawn.y
          }
        }
      : null;
    const standalonePlayerContacts = standalonePlayerState
      ? renderer.getPlayerCollisionContacts(standalonePlayerState)
      : null;
    const standalonePlayerCeilingBonkActive =
      standalonePlayerContacts?.ceiling !== null ||
      (standalonePlayerCeilingBonkHoldUntilTimeMs !== null &&
      Number.isFinite(standalonePlayerCeilingBonkHoldUntilTimeMs)
        ? renderTimeMs < standalonePlayerCeilingBonkHoldUntilTimeMs
        : false);
    const standalonePlayerCeilingBonkHoldActive =
      standalonePlayerContacts?.ceiling === null &&
      standalonePlayerCeilingBonkHoldUntilTimeMs !== null &&
      Number.isFinite(standalonePlayerCeilingBonkHoldUntilTimeMs)
        ? renderTimeMs < standalonePlayerCeilingBonkHoldUntilTimeMs
        : false;
    const debugStatusStripPlayerWallContact = standalonePlayerContacts?.wall
      ? {
          tile: {
            x: standalonePlayerContacts.wall.tileX,
            y: standalonePlayerContacts.wall.tileY,
            id: standalonePlayerContacts.wall.tileId,
            side: standalonePlayerContacts.wall.side
          }
        }
      : null;
    const debugStatusStripPlayerSupportContact = standalonePlayerContacts?.support
      ? {
          tile: {
            x: standalonePlayerContacts.support.tileX,
            y: standalonePlayerContacts.support.tileY,
            id: standalonePlayerContacts.support.tileId
          }
        }
      : null;
    const debugStatusStripPlayerCeilingContact = standalonePlayerContacts?.ceiling
      ? {
          tile: {
            x: standalonePlayerContacts.ceiling.tileX,
            y: standalonePlayerContacts.ceiling.tileY,
            id: standalonePlayerContacts.ceiling.tileId
          }
        }
      : null;
    const standalonePlayerAabb = standalonePlayerState ? getPlayerAabb(standalonePlayerState) : null;
    const debugOverlayPlayerPlaceholderPoseLabel = standalonePlayerState
      ? getStandalonePlayerPlaceholderPoseLabel(standalonePlayerState, {
          elapsedMs: renderTimeMs,
          wallContact: standalonePlayerContacts?.wall ?? null,
          ceilingContact: standalonePlayerContacts?.ceiling ?? null,
          ceilingBonkActive: standalonePlayerCeilingBonkActive
        })
      : null;
    const debugOverlayPlayer = standalonePlayerState && standalonePlayerAabb
      ? (() => {
          return {
            position: {
              x: standalonePlayerState.position.x,
              y: standalonePlayerState.position.y
            },
            velocity: {
              x: standalonePlayerState.velocity.x,
              y: standalonePlayerState.velocity.y
            },
            aabb: {
              min: {
                x: standalonePlayerAabb.minX,
                y: standalonePlayerAabb.minY
              },
              max: {
                x: standalonePlayerAabb.maxX,
                y: standalonePlayerAabb.maxY
              },
              size: {
                x: standalonePlayerAabb.maxX - standalonePlayerAabb.minX,
                y: standalonePlayerAabb.maxY - standalonePlayerAabb.minY
              }
            },
            grounded: standalonePlayerState.grounded,
            facing: standalonePlayerState.facing,
            contacts: {
              support: standalonePlayerContacts?.support ?? null,
              wall: standalonePlayerContacts?.wall ?? null,
              ceiling: standalonePlayerContacts?.ceiling ?? null
            }
          };
        })()
      : null;
    const debugStatusStripPlayerCameraFocusPoint =
      standalonePlayerState === null ? null : getPlayerCameraFocusPoint(standalonePlayerState);
    const debugStatusStripPlayerCameraFocusTile =
      debugStatusStripPlayerCameraFocusPoint === null
        ? null
        : worldToTilePoint(
            debugStatusStripPlayerCameraFocusPoint.x,
            debugStatusStripPlayerCameraFocusPoint.y
          );
    const debugStatusStripPlayerCameraFocusChunk =
      debugStatusStripPlayerCameraFocusTile === null
        ? null
        : (() => {
            const { chunkX, chunkY } = worldToChunkCoord(
              debugStatusStripPlayerCameraFocusTile.x,
              debugStatusStripPlayerCameraFocusTile.y
            );
            return { x: chunkX, y: chunkY };
          })();
    const debugStatusStripPlayerCameraFocusLocalTile =
      debugStatusStripPlayerCameraFocusTile === null
        ? null
        : (() => {
            const { localX, localY } = worldToLocalTile(
              debugStatusStripPlayerCameraFocusTile.x,
              debugStatusStripPlayerCameraFocusTile.y
            );
            return { x: localX, y: localY };
          })();
    const debugStatusStripPlayerWorldTile =
      standalonePlayerState === null
        ? null
        : worldToTilePoint(standalonePlayerState.position.x, standalonePlayerState.position.y);
    const debugStatusStripPlayerCameraWorldTile =
      standalonePlayerState === null ? null : worldToTilePoint(camera.x, camera.y);
    const debugStatusStripPlayerCameraWorldChunk =
      debugStatusStripPlayerCameraWorldTile === null
        ? null
        : (() => {
            const { chunkX, chunkY } = worldToChunkCoord(
              debugStatusStripPlayerCameraWorldTile.x,
              debugStatusStripPlayerCameraWorldTile.y
            );
            return { x: chunkX, y: chunkY };
          })();
    const debugStatusStripPlayerCameraWorldLocalTile =
      debugStatusStripPlayerCameraWorldTile === null
        ? null
        : (() => {
            const { localX, localY } = worldToLocalTile(
              debugStatusStripPlayerCameraWorldTile.x,
              debugStatusStripPlayerCameraWorldTile.y
            );
            return { x: localX, y: localY };
          })();
    const debugOverlayPlayerCameraFollow =
      debugStatusStripPlayerCameraWorldTile &&
      debugStatusStripPlayerCameraWorldLocalTile &&
      debugStatusStripPlayerCameraFocusPoint &&
      debugStatusStripPlayerCameraFocusTile &&
      debugStatusStripPlayerCameraFocusChunk &&
      debugStatusStripPlayerCameraFocusLocalTile
        ? {
            cameraPosition: {
              x: camera.x,
              y: camera.y
            },
            cameraTile: debugStatusStripPlayerCameraWorldTile,
            cameraLocal: debugStatusStripPlayerCameraWorldLocalTile,
            cameraZoom: camera.zoom,
            focus: debugStatusStripPlayerCameraFocusPoint,
            focusTile: debugStatusStripPlayerCameraFocusTile,
            focusChunk: debugStatusStripPlayerCameraFocusChunk,
            focusLocal: debugStatusStripPlayerCameraFocusLocalTile,
            offset: {
              x: cameraFollowOffset.x,
              y: cameraFollowOffset.y
            }
          }
      : null;
    const debugOverlayPlayerIntent = input.getPlayerInputTelemetry();
    renderer.resize();
    renderer.render(camera, {
      standalonePlayer: standalonePlayerState,
      standalonePlayerWallContact: standalonePlayerContacts?.wall ?? null,
      standalonePlayerCeilingContact: standalonePlayerContacts?.ceiling ?? null,
      standalonePlayerCeilingBonkHoldUntilTimeMs: standalonePlayerCeilingBonkHoldUntilTimeMs,
      timeMs: renderTimeMs
    });
    const standalonePlayerNearbyLightLevel = standalonePlayerState
      ? renderer.telemetry.standalonePlayerNearbyLightLevel
      : null;
    const standalonePlayerNearbyLightFactor = standalonePlayerState
      ? renderer.telemetry.standalonePlayerNearbyLightFactor
      : null;
    const standalonePlayerNearbyLightSourceTile =
      standalonePlayerState &&
      renderer.telemetry.standalonePlayerNearbyLightSourceTileX !== null &&
      renderer.telemetry.standalonePlayerNearbyLightSourceTileY !== null
        ? {
            x: renderer.telemetry.standalonePlayerNearbyLightSourceTileX,
            y: renderer.telemetry.standalonePlayerNearbyLightSourceTileY
          }
        : null;
    const standalonePlayerNearbyLightSourceChunk =
      standalonePlayerState &&
      renderer.telemetry.standalonePlayerNearbyLightSourceChunkX !== null &&
      renderer.telemetry.standalonePlayerNearbyLightSourceChunkY !== null
        ? {
            x: renderer.telemetry.standalonePlayerNearbyLightSourceChunkX,
            y: renderer.telemetry.standalonePlayerNearbyLightSourceChunkY
          }
        : null;
    const standalonePlayerNearbyLightSourceLocalTile =
      standalonePlayerState &&
      renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX !== null &&
      renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY !== null
        ? {
            x: renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileX,
            y: renderer.telemetry.standalonePlayerNearbyLightSourceLocalTileY
          }
        : null;
    hoveredTileCursor.update(camera, {
      hovered: pointerInspect
        ? {
            tileX: pointerInspect.tile.x,
            tileY: pointerInspect.tile.y
          }
        : null,
      pinned: pinnedDebugTileInspect
        ? {
            tileX: pinnedDebugTileInspect.tileX,
            tileY: pinnedDebugTileInspect.tileY
          }
        : null
    });
    playerSpawnMarker.update(camera, resolvedPlayerSpawn);
    armedDebugToolPreview.update(camera, pointerInspect, armedDebugToolPreviewState);
    debugEditStatusStrip.update({
      mode: input.getTouchDebugEditMode(),
      brushLabel: getActiveDebugBrushLabel(),
      brushTileId: activeDebugBrushTileId,
      preview: armedDebugToolPreviewState,
      hoveredTile: hoveredDebugTileStatus,
      pinnedTile: pinnedDebugTileStatus,
      desktopInspectPinArmed: input.getArmedDesktopDebugInspectPin(),
      playerPlaceholderPoseLabel: debugOverlayVisible ? null : debugOverlayPlayerPlaceholderPoseLabel,
      playerWorldPosition:
        debugOverlayVisible || !standalonePlayerState
          ? null
          : {
              x: standalonePlayerState.position.x,
              y: standalonePlayerState.position.y
            },
      playerWorldTile: debugOverlayVisible ? null : debugStatusStripPlayerWorldTile,
      playerAabb:
        debugOverlayVisible || !standalonePlayerAabb
          ? null
          : {
              min: {
                x: standalonePlayerAabb.minX,
                y: standalonePlayerAabb.minY
              },
              max: {
                x: standalonePlayerAabb.maxX,
                y: standalonePlayerAabb.maxY
              }
            },
      playerCameraWorldPosition:
        debugOverlayVisible || !standalonePlayerState
          ? null
          : {
              x: camera.x,
              y: camera.y
            },
      playerCameraWorldTile: debugOverlayVisible ? null : debugStatusStripPlayerCameraWorldTile,
      playerCameraWorldChunk: debugOverlayVisible ? null : debugStatusStripPlayerCameraWorldChunk,
      playerCameraWorldLocalTile:
        debugOverlayVisible ? null : debugStatusStripPlayerCameraWorldLocalTile,
      playerCameraFocusPoint: debugOverlayVisible ? null : debugStatusStripPlayerCameraFocusPoint,
      playerCameraFocusTile: debugOverlayVisible ? null : debugStatusStripPlayerCameraFocusTile,
      playerCameraFocusChunk: debugOverlayVisible ? null : debugStatusStripPlayerCameraFocusChunk,
      playerCameraFocusLocalTile:
        debugOverlayVisible ? null : debugStatusStripPlayerCameraFocusLocalTile,
      playerCameraFollowOffset:
        debugOverlayVisible || !standalonePlayerState
          ? null
          : {
              x: cameraFollowOffset.x,
              y: cameraFollowOffset.y
            },
      playerCameraZoom: debugOverlayVisible || !standalonePlayerState ? null : camera.zoom,
      residentDirtyLightChunks: debugOverlayVisible ? null : renderer.telemetry.residentDirtyLightChunks,
      playerNearbyLightLevel: debugOverlayVisible ? null : standalonePlayerNearbyLightLevel,
      playerNearbyLightFactor: debugOverlayVisible ? null : standalonePlayerNearbyLightFactor,
      playerNearbyLightSourceTile: debugOverlayVisible ? null : standalonePlayerNearbyLightSourceTile,
      playerNearbyLightSourceChunk:
        debugOverlayVisible ? null : standalonePlayerNearbyLightSourceChunk,
      playerNearbyLightSourceLocalTile:
        debugOverlayVisible ? null : standalonePlayerNearbyLightSourceLocalTile,
      playerCeilingBonkHoldActive:
        debugOverlayVisible || !standalonePlayerState ? null : standalonePlayerCeilingBonkHoldActive,
      playerGrounded: debugOverlayVisible ? null : standalonePlayerState?.grounded ?? null,
      playerFacing: debugOverlayVisible ? null : standalonePlayerState?.facing ?? null,
      playerMoveX: debugOverlayVisible || !standalonePlayerState ? null : debugOverlayPlayerIntent.moveX,
      playerVelocityX: debugOverlayVisible || !standalonePlayerState ? null : standalonePlayerState.velocity.x,
      playerVelocityY: debugOverlayVisible || !standalonePlayerState ? null : standalonePlayerState.velocity.y,
      playerJumpHeld: debugOverlayVisible || !standalonePlayerState ? null : debugOverlayPlayerIntent.jumpHeld,
      playerJumpPressed:
        debugOverlayVisible || !standalonePlayerState ? null : debugOverlayPlayerIntent.jumpPressed,
      playerSupportContact: debugOverlayVisible ? null : debugStatusStripPlayerSupportContact,
      playerWallContact: debugOverlayVisible ? null : debugStatusStripPlayerWallContact,
      playerCeilingContact: debugOverlayVisible ? null : debugStatusStripPlayerCeilingContact,
      playerGroundedTransition: debugOverlayVisible ? null : lastPlayerGroundedTransitionEvent,
      playerFacingTransition: debugOverlayVisible ? null : lastPlayerFacingTransitionEvent,
      playerRespawn: debugOverlayVisible ? null : lastPlayerRespawnEvent,
      playerWallContactTransition: debugOverlayVisible ? null : lastPlayerWallContactTransitionEvent,
      playerCeilingContactTransition: debugOverlayVisible ? null : lastPlayerCeilingContactTransitionEvent
    });
    debug.update(frameDtMs, renderer.telemetry, {
      pointer: debugOverlayPointerInspect,
      pinned: debugOverlayPinnedInspect,
      spawn: debugOverlaySpawn,
      player: debugOverlayPlayer,
      playerPlaceholderPoseLabel: debugOverlayPlayerPlaceholderPoseLabel,
      playerCeilingBonkHoldActive: standalonePlayerState ? standalonePlayerCeilingBonkHoldActive : null,
      playerNearbyLightLevel: standalonePlayerState ? standalonePlayerNearbyLightLevel : null,
      playerNearbyLightFactor: standalonePlayerState ? standalonePlayerNearbyLightFactor : null,
      playerNearbyLightSourceTile: standalonePlayerState ? standalonePlayerNearbyLightSourceTile : null,
      playerNearbyLightSourceChunk: standalonePlayerState
        ? standalonePlayerNearbyLightSourceChunk
        : null,
      playerNearbyLightSourceLocalTile: standalonePlayerState
        ? standalonePlayerNearbyLightSourceLocalTile
        : null,
      playerIntent: debugOverlayPlayerIntent,
      playerCameraFollow: debugOverlayPlayerCameraFollow,
      playerGroundedTransition: lastPlayerGroundedTransitionEvent,
      playerFacingTransition: lastPlayerFacingTransitionEvent,
      playerRespawn: lastPlayerRespawnEvent,
      playerWallContactTransition: lastPlayerWallContactTransitionEvent,
      playerCeilingContactTransition: lastPlayerCeilingContactTransitionEvent
    });
  };

  const renderWorldPreview = (): void => {
    const standalonePlayerContacts = standalonePlayerState
      ? renderer.getPlayerCollisionContacts(standalonePlayerState)
      : null;
    renderer.resize();
    renderer.render(camera, {
      standalonePlayer: standalonePlayerState,
      standalonePlayerWallContact: standalonePlayerContacts?.wall ?? null,
      standalonePlayerCeilingContact: standalonePlayerContacts?.ceiling ?? null,
      standalonePlayerCeilingBonkHoldUntilTimeMs: standalonePlayerCeilingBonkHoldUntilTimeMs
    });
  };

  loop = new GameLoop(
    1000 / 60,
    (fixedDt) => {
      if (currentScreen !== 'in-world') return;
      input.update(fixedDt);
      for (const edit of input.consumeDebugTileEdits()) {
        const tileId = edit.kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
        const { previousTileId, changed } = applyWorldTileEdit(edit.worldTileX, edit.worldTileY, tileId);
        if (!changed) continue;

        debugTileEditHistory.recordAppliedEdit(
          edit.strokeId,
          edit.worldTileX,
          edit.worldTileY,
          previousTileId,
          tileId
        );
      }

      for (const floodFillRequest of input.consumeDebugFloodFillRequests()) {
        applyDebugFloodFill(
          floodFillRequest.worldTileX,
          floodFillRequest.worldTileY,
          floodFillRequest.kind,
          floodFillRequest.strokeId
        );
      }

      for (const lineRequest of input.consumeDebugLineRequests()) {
        applyDebugLine(
          lineRequest.startTileX,
          lineRequest.startTileY,
          lineRequest.endTileX,
          lineRequest.endTileY,
          lineRequest.kind,
          lineRequest.strokeId
        );
      }

      for (const rectFillRequest of input.consumeDebugRectFillRequests()) {
        applyDebugRectFill(
          rectFillRequest.startTileX,
          rectFillRequest.startTileY,
          rectFillRequest.endTileX,
          rectFillRequest.endTileY,
          rectFillRequest.kind,
          rectFillRequest.strokeId
        );
      }

      for (const rectOutlineRequest of input.consumeDebugRectOutlineRequests()) {
        applyDebugRectOutline(
          rectOutlineRequest.startTileX,
          rectOutlineRequest.startTileY,
          rectOutlineRequest.endTileX,
          rectOutlineRequest.endTileY,
          rectOutlineRequest.kind,
          rectOutlineRequest.strokeId
        );
      }

      for (const ellipseFillRequest of input.consumeDebugEllipseFillRequests()) {
        applyDebugEllipseFill(
          ellipseFillRequest.startTileX,
          ellipseFillRequest.startTileY,
          ellipseFillRequest.endTileX,
          ellipseFillRequest.endTileY,
          ellipseFillRequest.kind,
          ellipseFillRequest.strokeId
        );
      }

      for (const ellipseOutlineRequest of input.consumeDebugEllipseOutlineRequests()) {
        applyDebugEllipseOutline(
          ellipseOutlineRequest.startTileX,
          ellipseOutlineRequest.startTileY,
          ellipseOutlineRequest.endTileX,
          ellipseOutlineRequest.endTileY,
          ellipseOutlineRequest.kind,
          ellipseOutlineRequest.strokeId
        );
      }
      syncArmedDebugToolControls();

      for (const eyedropperRequest of input.consumeDebugBrushEyedropperRequests()) {
        applyDebugBrushEyedropperAtTile(eyedropperRequest.worldTileX, eyedropperRequest.worldTileY);
      }

      for (const inspectPinRequest of input.consumeDebugTileInspectPinRequests()) {
        togglePinnedDebugTileInspect(inspectPinRequest.worldTileX, inspectPinRequest.worldTileY);
      }

      let historyChanged = false;
      for (const completedStroke of input.consumeCompletedDebugTileStrokes()) {
        historyChanged = debugTileEditHistory.completeStroke(completedStroke.strokeId) || historyChanged;
      }

      for (const action of input.consumeDebugEditHistoryShortcutActions()) {
        historyChanged = applyFixedStepDebugHistoryShortcutAction(action) || historyChanged;
      }

      if (historyChanged) {
        syncDebugEditHistoryControls();
      }

      if (standalonePlayerState) {
        cameraFollowOffset = absorbManualCameraDeltaIntoFollowOffset(
          cameraFollowOffset,
          lastAppliedPlayerFollowCameraPosition,
          {
            x: camera.x,
            y: camera.y
          }
        );
      }

      if (playerSpawnNeedsRefresh) {
        refreshResolvedPlayerSpawn();
      }

      if (standalonePlayerState) {
        const playerMovementIntent = input.getPlayerMovementIntent();
        const previousPlayerContacts = renderer.getPlayerCollisionContacts(standalonePlayerState);
        const nextPlayerState = renderer.stepPlayerState(
          standalonePlayerState,
          fixedDt,
          playerMovementIntent
        );
        const nextPlayerContacts = renderer.getPlayerCollisionContacts(nextPlayerState);
        const groundedTransitionEvent = resolvePlayerGroundedTransitionEvent(
          standalonePlayerState,
          nextPlayerState,
          playerMovementIntent
        );
        const facingTransitionEvent = resolvePlayerFacingTransitionEvent(
          standalonePlayerState,
          nextPlayerState
        );
        const wallContactTransitionEvent = resolvePlayerWallContactTransitionEvent(
          previousPlayerContacts,
          nextPlayerState,
          nextPlayerContacts
        );
        const ceilingContactTransitionEvent = resolvePlayerCeilingContactTransitionEvent(
          previousPlayerContacts,
          nextPlayerState,
          nextPlayerContacts
        );
        standalonePlayerState = nextPlayerState;
        if (groundedTransitionEvent !== null) {
          lastPlayerGroundedTransitionEvent = groundedTransitionEvent;
        }
        if (facingTransitionEvent !== null) {
          lastPlayerFacingTransitionEvent = facingTransitionEvent;
        }
        if (wallContactTransitionEvent !== null) {
          lastPlayerWallContactTransitionEvent = wallContactTransitionEvent;
        }
        if (ceilingContactTransitionEvent !== null) {
          lastPlayerCeilingContactTransitionEvent = ceilingContactTransitionEvent;
          if (ceilingContactTransitionEvent.kind === 'blocked') {
            standalonePlayerCeilingBonkHoldUntilTimeMs =
              performance.now() + STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS;
          }
        }
        applyStandalonePlayerCameraFollow();
      }

      // Non-player entities step here until the standalone player moves onto the entity layer.
      entityRegistry.fixedUpdateAll(fixedDt);
    },
    (_alpha, frameDtMs) => {
      if (currentScreen !== 'in-world') {
        renderWorldPreview();
        return;
      }

      renderWorldFrame(frameDtMs);
    }
  );

  try {
    await renderer.initialize();
  } catch (error) {
    shell.setState(createRendererInitializationFailedBootShellState(error));
    return;
  }

  renderer.resize();
  refreshResolvedPlayerSpawn();
  renderWorldPreview();
  showMainMenuShellState();

  window.addEventListener('resize', () => {
    renderer.resize();
    if (!worldSessionStarted || currentScreen !== 'in-world') {
      renderWorldPreview();
    }
  });
};

void bootstrap();
