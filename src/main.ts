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
import { DebugOverlay, type DebugOverlayInspectState } from './ui/debugOverlay';
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
import type { DebugEditHoveredTileState, DebugEditStatusStripState } from './ui/debugEditStatusHelpers';
import {
  TouchDebugEditControls,
  type DebugBrushOption,
  type DebugEditHistoryControlState
} from './ui/touchDebugEditControls';
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
  type PlayerCollisionContacts,
  type PlayerMovementIntent,
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
type TouchDebugArmedToolKey = keyof TouchDebugArmedToolSnapshot;
type SetTouchDebugArmedToolKind = (kind: DebugTileEditKind | null) => boolean;
type TouchDebugArmedToolToggleCallback = (kind: DebugTileEditKind) => void;
type TouchDebugArmedToolInitialOptions = {
  initialArmedFloodFillKind: DebugTileEditKind | null;
  initialArmedLineKind: DebugTileEditKind | null;
  initialArmedRectKind: DebugTileEditKind | null;
  initialArmedRectOutlineKind: DebugTileEditKind | null;
  initialArmedEllipseKind: DebugTileEditKind | null;
  initialArmedEllipseOutlineKind: DebugTileEditKind | null;
};
type TouchDebugArmedToolCallbackOptions = {
  onArmFloodFill: TouchDebugArmedToolToggleCallback;
  onArmLine: TouchDebugArmedToolToggleCallback;
  onArmRect: TouchDebugArmedToolToggleCallback;
  onArmRectOutline: TouchDebugArmedToolToggleCallback;
  onArmEllipse: TouchDebugArmedToolToggleCallback;
  onArmEllipseOutline: TouchDebugArmedToolToggleCallback;
};
type TouchDebugArmedToolConstructorOptions = TouchDebugArmedToolInitialOptions &
  TouchDebugArmedToolCallbackOptions;
type TouchDebugEditControlPreferenceConstructorOptions = {
  initialMode: TouchDebugEditMode;
  onModeChange: (mode: TouchDebugEditMode) => void;
  brushOptions: readonly DebugBrushOption[];
  initialBrushTileId: number;
  onBrushTileIdChange: (tileId: number) => void;
  initialCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};
type TouchDebugEditControlHistoryConstructorOptions = {
  initialHistoryState: DebugEditHistoryControlState;
  onUndo: () => void;
  onRedo: () => void;
};
type TouchDebugEditControlResetConstructorOptions = {
  onResetPrefs: () => void;
};
type TouchDebugEditControlConstructorOptions = TouchDebugEditControlPreferenceConstructorOptions &
  TouchDebugArmedToolConstructorOptions &
  TouchDebugEditControlHistoryConstructorOptions &
  TouchDebugEditControlResetConstructorOptions;
type StandalonePlayerFixedStepTransitionSnapshot = {
  groundedTransitionEvent: PlayerGroundedTransitionEvent | null;
  facingTransitionEvent: PlayerFacingTransitionEvent | null;
  wallContactTransitionEvent: PlayerWallContactTransitionEvent | null;
  ceilingContactTransitionEvent: PlayerCeilingContactTransitionEvent | null;
};
type StandalonePlayerFixedStepContactSnapshot = {
  previousPlayerContacts: PlayerCollisionContacts;
  nextPlayerContacts: PlayerCollisionContacts;
};
type StandalonePlayerFixedStepResult = {
  nextPlayerState: PlayerState;
  contactSnapshot: StandalonePlayerFixedStepContactSnapshot;
  transitionSnapshot: StandalonePlayerFixedStepTransitionSnapshot;
};
type StandalonePlayerFixedStepContactSnapshotOptions = {
  previousPlayerState: PlayerState;
  nextPlayerState: PlayerState;
};
type StandalonePlayerFixedStepResultOptions = {
  previousPlayerState: PlayerState;
  fixedDt: number;
  playerMovementIntent: PlayerMovementIntent;
};
type StandalonePlayerFixedStepUpdateOptions = {
  previousPlayerState: PlayerState;
  fixedDt: number;
};
type StandalonePlayerFixedStepTransitionSnapshotOptions = {
  previousPlayerState: PlayerState;
  nextPlayerState: PlayerState;
  previousPlayerContacts: PlayerCollisionContacts;
  nextPlayerContacts: PlayerCollisionContacts;
  playerMovementIntent: PlayerMovementIntent;
};
type StandalonePlayerRenderFrameDebugOverlayTelemetry = Pick<
  DebugOverlayInspectState,
  | 'player'
  | 'playerPlaceholderPoseLabel'
  | 'playerCeilingBonkHoldActive'
  | 'playerIntent'
  | 'playerCameraFollow'
>;
type StandalonePlayerRenderFrameStatusStripTelemetry = Pick<
  DebugEditStatusStripState,
  | 'playerPlaceholderPoseLabel'
  | 'playerWorldPosition'
  | 'playerWorldTile'
  | 'playerAabb'
  | 'playerCameraWorldPosition'
  | 'playerCameraWorldTile'
  | 'playerCameraWorldChunk'
  | 'playerCameraWorldLocalTile'
  | 'playerCameraFocusPoint'
  | 'playerCameraFocusTile'
  | 'playerCameraFocusChunk'
  | 'playerCameraFocusLocalTile'
  | 'playerCameraFollowOffset'
  | 'playerCameraZoom'
  | 'playerCeilingBonkHoldActive'
  | 'playerGrounded'
  | 'playerFacing'
  | 'playerMoveX'
  | 'playerVelocityX'
  | 'playerVelocityY'
  | 'playerJumpHeld'
  | 'playerJumpPressed'
  | 'playerSupportContact'
  | 'playerWallContact'
  | 'playerCeilingContact'
>;
type StandalonePlayerRenderFrameNearbyLightTelemetry = Pick<
  DebugOverlayInspectState,
  | 'playerNearbyLightLevel'
  | 'playerNearbyLightFactor'
  | 'playerNearbyLightSourceTile'
  | 'playerNearbyLightSourceChunk'
  | 'playerNearbyLightSourceLocalTile'
>;
type StandalonePlayerRenderFrameSelectedStatusStripPlayerTelemetry =
  StandalonePlayerRenderFrameStatusStripTelemetry &
    Pick<
      DebugEditStatusStripState,
      | 'playerNearbyLightLevel'
      | 'playerNearbyLightFactor'
      | 'playerNearbyLightSourceTile'
      | 'playerNearbyLightSourceChunk'
      | 'playerNearbyLightSourceLocalTile'
    >;
type StandalonePlayerRenderFrameStatusStripPlayerTelemetrySelectionOptions = {
  debugOverlayVisible: boolean;
  playerTelemetry: StandalonePlayerRenderFrameStatusStripTelemetry;
  nearbyLightTelemetry: StandalonePlayerRenderFrameNearbyLightTelemetry;
};
type StandalonePlayerRenderFrameStatusStripPlayerEventTelemetry = Pick<
  DebugEditStatusStripState,
  | 'playerGroundedTransition'
  | 'playerFacingTransition'
  | 'playerRespawn'
  | 'playerWallContactTransition'
  | 'playerCeilingContactTransition'
>;
type StandalonePlayerRenderFrameStatusStripPlayerEventTelemetrySelectionOptions = {
  debugOverlayVisible: boolean;
  eventTelemetry: StandalonePlayerRenderFrameStatusStripPlayerEventTelemetry;
};
type StandalonePlayerRenderFrameTelemetrySnapshot = {
  standalonePlayerContacts: PlayerCollisionContacts | null;
  debugOverlay: StandalonePlayerRenderFrameDebugOverlayTelemetry;
  debugStatusStrip: StandalonePlayerRenderFrameStatusStripTelemetry;
};
const TOUCH_DEBUG_ARMED_TOOL_KEYS: readonly TouchDebugArmedToolKey[] = [
  'floodFillKind',
  'lineKind',
  'rectKind',
  'rectOutlineKind',
  'ellipseKind',
  'ellipseOutlineKind'
];
const createClearedTouchDebugArmedToolSnapshot = (): TouchDebugArmedToolSnapshot => ({
  floodFillKind: null,
  lineKind: null,
  rectKind: null,
  rectOutlineKind: null,
  ellipseKind: null,
  ellipseOutlineKind: null
});
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

  const resetStandalonePlayerTransitionState = (
    respawnEvent: PlayerRespawnEvent | null = null
  ): void => {
    lastPlayerGroundedTransitionEvent = null;
    lastPlayerFacingTransitionEvent = null;
    lastPlayerRespawnEvent = respawnEvent;
    lastPlayerWallContactTransitionEvent = null;
    lastPlayerCeilingContactTransitionEvent = null;
    standalonePlayerCeilingBonkHoldUntilTimeMs = null;
  };
  const createStandalonePlayerFixedStepContactSnapshot = ({
    previousPlayerState,
    nextPlayerState
  }: StandalonePlayerFixedStepContactSnapshotOptions): StandalonePlayerFixedStepContactSnapshot => ({
    previousPlayerContacts: renderer.getPlayerCollisionContacts(previousPlayerState),
    nextPlayerContacts: renderer.getPlayerCollisionContacts(nextPlayerState)
  });
  const createStandalonePlayerFixedStepTransitionSnapshot = ({
    previousPlayerState,
    nextPlayerState,
    previousPlayerContacts,
    nextPlayerContacts,
    playerMovementIntent
  }: StandalonePlayerFixedStepTransitionSnapshotOptions): StandalonePlayerFixedStepTransitionSnapshot => ({
    groundedTransitionEvent: resolvePlayerGroundedTransitionEvent(
      previousPlayerState,
      nextPlayerState,
      playerMovementIntent
    ),
    facingTransitionEvent: resolvePlayerFacingTransitionEvent(previousPlayerState, nextPlayerState),
    wallContactTransitionEvent: resolvePlayerWallContactTransitionEvent(
      previousPlayerContacts,
      nextPlayerState,
      nextPlayerContacts
    ),
    ceilingContactTransitionEvent: resolvePlayerCeilingContactTransitionEvent(
      previousPlayerContacts,
      nextPlayerState,
      nextPlayerContacts
    )
  });
  const createStandalonePlayerFixedStepResult = ({
    previousPlayerState,
    fixedDt,
    playerMovementIntent
  }: StandalonePlayerFixedStepResultOptions): StandalonePlayerFixedStepResult => {
    const nextPlayerState = renderer.stepPlayerState(
      previousPlayerState,
      fixedDt,
      playerMovementIntent
    );
    const contactSnapshot = createStandalonePlayerFixedStepContactSnapshot({
      previousPlayerState,
      nextPlayerState
    });
    return {
      nextPlayerState,
      contactSnapshot,
      transitionSnapshot: createStandalonePlayerFixedStepTransitionSnapshot({
        previousPlayerState,
        nextPlayerState,
        previousPlayerContacts: contactSnapshot.previousPlayerContacts,
        nextPlayerContacts: contactSnapshot.nextPlayerContacts,
        playerMovementIntent
      })
    };
  };
  const applyStandalonePlayerFixedStepResult = (
    playerFixedStepResult: StandalonePlayerFixedStepResult
  ): void => {
    standalonePlayerState = playerFixedStepResult.nextPlayerState;
    commitStandalonePlayerFixedStepTransitions(playerFixedStepResult.transitionSnapshot);
    applyStandalonePlayerCameraFollow();
  };
  const updateStandalonePlayerFixedStep = ({
    previousPlayerState,
    fixedDt
  }: StandalonePlayerFixedStepUpdateOptions): void => {
    const playerMovementIntent = input.getPlayerMovementIntent();
    const playerFixedStepResult = createStandalonePlayerFixedStepResult({
      previousPlayerState,
      fixedDt,
      playerMovementIntent
    });
    applyStandalonePlayerFixedStepResult(playerFixedStepResult);
  };
  const commitStandalonePlayerFixedStepTransitions = ({
    groundedTransitionEvent,
    facingTransitionEvent,
    wallContactTransitionEvent,
    ceilingContactTransitionEvent
  }: StandalonePlayerFixedStepTransitionSnapshot): void => {
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
  };

  const refreshResolvedPlayerSpawn = (): void => {
    resolvedPlayerSpawn = renderer.findPlayerSpawnPoint(DEBUG_PLAYER_SPAWN_SEARCH_OPTIONS);
    playerSpawnNeedsRefresh = false;
    if (standalonePlayerState === null && resolvedPlayerSpawn) {
      standalonePlayerState = createPlayerStateFromSpawn(resolvedPlayerSpawn);
      resetStandalonePlayerTransitionState();
      centerCameraOnStandalonePlayer(standalonePlayerState);
      return;
    }

    if (standalonePlayerState !== null) {
      const nextPlayerState = renderer.respawnPlayerStateAtSpawnIfEmbeddedInSolid(
        standalonePlayerState,
        resolvedPlayerSpawn
      );
      if (nextPlayerState !== standalonePlayerState) {
        resetStandalonePlayerTransitionState(
          resolvedPlayerSpawn === null
            ? null
            : createEmbeddedPlayerRespawnEvent(nextPlayerState, resolvedPlayerSpawn)
        );
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

  const applyInputDebugArmedToolSnapshot = (snapshot: TouchDebugArmedToolSnapshot): void => {
    input.setArmedDebugFloodFillKind(snapshot.floodFillKind);
    input.setArmedDebugLineKind(snapshot.lineKind);
    input.setArmedDebugRectKind(snapshot.rectKind);
    input.setArmedDebugRectOutlineKind(snapshot.rectOutlineKind);
    input.setArmedDebugEllipseKind(snapshot.ellipseKind);
    input.setArmedDebugEllipseOutlineKind(snapshot.ellipseOutlineKind);
  };
  const setMutuallyExclusiveArmedDebugToolKind = (
    key: TouchDebugArmedToolKey,
    kind: DebugTileEditKind | null
  ): boolean => {
    const previousSnapshot = readTouchDebugArmedToolSnapshot();
    const nextSnapshot = createClearedTouchDebugArmedToolSnapshot();
    nextSnapshot[key] = kind;
    if (TOUCH_DEBUG_ARMED_TOOL_KEYS.every((snapshotKey) => previousSnapshot[snapshotKey] === nextSnapshot[snapshotKey])) {
      return false;
    }
    applyInputDebugArmedToolSnapshot(nextSnapshot);
    syncArmedDebugToolControls();
    return true;
  };
  const toggleMutuallyExclusiveArmedDebugToolKind = (
    key: TouchDebugArmedToolKey,
    kind: DebugTileEditKind,
    setKind: SetTouchDebugArmedToolKind
  ): boolean => {
    const currentKind = readTouchDebugArmedToolSnapshot()[key];
    return setKind(currentKind === kind ? null : kind);
  };
  const createTouchDebugArmedToolToggleCallback = (
    key: TouchDebugArmedToolKey,
    setKind: SetTouchDebugArmedToolKind
  ): TouchDebugArmedToolToggleCallback => {
    return (kind) => {
      toggleMutuallyExclusiveArmedDebugToolKind(key, kind, setKind);
    };
  };
  const setArmedDebugFloodFillKind = (kind: DebugTileEditKind | null): boolean => {
    return setMutuallyExclusiveArmedDebugToolKind('floodFillKind', kind);
  };

  const toggleArmedDebugFloodFillKind = (kind: DebugTileEditKind): boolean => {
    return toggleMutuallyExclusiveArmedDebugToolKind('floodFillKind', kind, setArmedDebugFloodFillKind);
  };

  const setArmedDebugLineKind = (kind: DebugTileEditKind | null): boolean => {
    return setMutuallyExclusiveArmedDebugToolKind('lineKind', kind);
  };

  const toggleArmedDebugLineKind = (kind: DebugTileEditKind): boolean => {
    return toggleMutuallyExclusiveArmedDebugToolKind('lineKind', kind, setArmedDebugLineKind);
  };

  const setArmedDebugRectKind = (kind: DebugTileEditKind | null): boolean => {
    return setMutuallyExclusiveArmedDebugToolKind('rectKind', kind);
  };

  const toggleArmedDebugRectKind = (kind: DebugTileEditKind): boolean => {
    return toggleMutuallyExclusiveArmedDebugToolKind('rectKind', kind, setArmedDebugRectKind);
  };

  const setArmedDebugRectOutlineKind = (kind: DebugTileEditKind | null): boolean => {
    return setMutuallyExclusiveArmedDebugToolKind('rectOutlineKind', kind);
  };

  const toggleArmedDebugRectOutlineKind = (kind: DebugTileEditKind): boolean => {
    return toggleMutuallyExclusiveArmedDebugToolKind(
      'rectOutlineKind',
      kind,
      setArmedDebugRectOutlineKind
    );
  };

  const setArmedDebugEllipseKind = (kind: DebugTileEditKind | null): boolean => {
    return setMutuallyExclusiveArmedDebugToolKind('ellipseKind', kind);
  };

  const toggleArmedDebugEllipseKind = (kind: DebugTileEditKind): boolean => {
    return toggleMutuallyExclusiveArmedDebugToolKind('ellipseKind', kind, setArmedDebugEllipseKind);
  };

  const setArmedDebugEllipseOutlineKind = (kind: DebugTileEditKind | null): boolean => {
    return setMutuallyExclusiveArmedDebugToolKind('ellipseOutlineKind', kind);
  };

  const toggleArmedDebugEllipseOutlineKind = (kind: DebugTileEditKind): boolean => {
    return toggleMutuallyExclusiveArmedDebugToolKind(
      'ellipseOutlineKind',
      kind,
      setArmedDebugEllipseOutlineKind
    );
  };
  const createTouchDebugArmedToolConstructorOptions = (
    snapshot: TouchDebugArmedToolSnapshot
  ): TouchDebugArmedToolConstructorOptions => ({
    initialArmedFloodFillKind: snapshot.floodFillKind,
    initialArmedLineKind: snapshot.lineKind,
    initialArmedRectKind: snapshot.rectKind,
    initialArmedRectOutlineKind: snapshot.rectOutlineKind,
    initialArmedEllipseKind: snapshot.ellipseKind,
    initialArmedEllipseOutlineKind: snapshot.ellipseOutlineKind,
    onArmFloodFill: createTouchDebugArmedToolToggleCallback(
      'floodFillKind',
      setArmedDebugFloodFillKind
    ),
    onArmLine: createTouchDebugArmedToolToggleCallback('lineKind', setArmedDebugLineKind),
    onArmRect: createTouchDebugArmedToolToggleCallback('rectKind', setArmedDebugRectKind),
    onArmRectOutline: createTouchDebugArmedToolToggleCallback(
      'rectOutlineKind',
      setArmedDebugRectOutlineKind
    ),
    onArmEllipse: createTouchDebugArmedToolToggleCallback('ellipseKind', setArmedDebugEllipseKind),
    onArmEllipseOutline: createTouchDebugArmedToolToggleCallback(
      'ellipseOutlineKind',
      setArmedDebugEllipseOutlineKind
    )
  });

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
  const createTouchDebugEditControlConstructorOptions = (
    preferenceSnapshot: DebugEditControlState,
    armedToolSnapshot: TouchDebugArmedToolSnapshot
  ): TouchDebugEditControlConstructorOptions => ({
    initialMode: preferenceSnapshot.touchMode,
    onModeChange: (mode) => {
      commitDebugEditControlStateAction({
        type: 'set-touch-mode',
        mode
      });
    },
    brushOptions: DEBUG_BRUSH_TILE_OPTIONS,
    initialBrushTileId: preferenceSnapshot.brushTileId,
    onBrushTileIdChange: (tileId) => {
      commitDebugEditBrushTileId(tileId);
    },
    initialCollapsed: preferenceSnapshot.panelCollapsed,
    onCollapsedChange: (collapsed) => {
      commitDebugEditControlStateAction({
        type: 'set-panel-collapsed',
        collapsed
      });
    },
    ...createTouchDebugArmedToolConstructorOptions(armedToolSnapshot),
    initialHistoryState: debugTileEditHistory.getStatus(),
    onUndo: undoDebugTileStroke,
    onRedo: redoDebugTileStroke,
    onResetPrefs: resetDebugEditControlPrefs
  });
  const bootstrapTouchDebugEditControls = (): TouchDebugEditControls => {
    const initialDebugEditControlPreferenceSnapshot = readDebugEditControlPreferenceSnapshot();
    const initialTouchDebugArmedToolSnapshot = readTouchDebugArmedToolSnapshot();
    const controls = new TouchDebugEditControls({
      initialVisible: false,
      ...createTouchDebugEditControlConstructorOptions(
        initialDebugEditControlPreferenceSnapshot,
        initialTouchDebugArmedToolSnapshot
      )
    });
    debugEditControls = controls;
    syncDebugEditControlsVisibility();
    syncDebugEditHistoryControls();
    syncArmedDebugToolControls();
    persistDebugEditControlsState();
    return controls;
  };

  debugEditControls = bootstrapTouchDebugEditControls();
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
  const resetFreshWorldSessionDebugEditState = (): void => {
    debugTileEditHistory = new DebugTileEditHistory();
    syncDebugEditHistoryControls();
    input.cancelArmedDebugTools();
    syncArmedDebugToolControls();
  };
  const resetFreshWorldSessionCameraAndPlayerState = (): void => {
    camera.x = 0;
    camera.y = 0;
    camera.zoom = defaultCameraZoom;
    cameraFollowOffset = { x: 0, y: 0 };
    lastAppliedPlayerFollowCameraPosition = null;
    resetStandalonePlayerTransitionState();
    standalonePlayerState = null;
    resolvedPlayerSpawn = null;
    playerSpawnNeedsRefresh = false;
    refreshResolvedPlayerSpawn();
  };
  const resetFreshWorldSessionRuntimeState = (): void => {
    renderer.resetWorld();
    resetFreshWorldSessionDebugEditState();
    clearPinnedDebugTileInspect();
    resetFreshWorldSessionCameraAndPlayerState();
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

  const createStandalonePlayerRenderFrameTelemetrySnapshot = (
    renderTimeMs: number
  ): StandalonePlayerRenderFrameTelemetrySnapshot => {
    const playerState = standalonePlayerState;
    const standalonePlayerContacts = playerState
      ? renderer.getPlayerCollisionContacts(playerState)
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
    const playerWorldPosition =
      playerState === null
        ? null
        : {
            x: playerState.position.x,
            y: playerState.position.y
          };
    const playerAabb = playerState === null ? null : getPlayerAabb(playerState);
    const playerWorldTile =
      playerWorldPosition === null
        ? null
        : worldToTilePoint(playerWorldPosition.x, playerWorldPosition.y);
    const playerCameraWorldPosition =
      playerState === null
        ? null
        : {
            x: camera.x,
            y: camera.y
          };
    const playerCameraWorldTile =
      playerCameraWorldPosition === null
        ? null
        : worldToTilePoint(playerCameraWorldPosition.x, playerCameraWorldPosition.y);
    const playerCameraWorldChunk =
      playerCameraWorldTile === null
        ? null
        : (() => {
            const { chunkX, chunkY } = worldToChunkCoord(
              playerCameraWorldTile.x,
              playerCameraWorldTile.y
            );
            return { x: chunkX, y: chunkY };
          })();
    const playerCameraWorldLocalTile =
      playerCameraWorldTile === null
        ? null
        : (() => {
            const { localX, localY } = worldToLocalTile(
              playerCameraWorldTile.x,
              playerCameraWorldTile.y
            );
            return { x: localX, y: localY };
          })();
    const playerCameraFocusPoint =
      playerState === null ? null : getPlayerCameraFocusPoint(playerState);
    const playerCameraFocusTile =
      playerCameraFocusPoint === null
        ? null
        : worldToTilePoint(playerCameraFocusPoint.x, playerCameraFocusPoint.y);
    const playerCameraFocusChunk =
      playerCameraFocusTile === null
        ? null
        : (() => {
            const { chunkX, chunkY } = worldToChunkCoord(
              playerCameraFocusTile.x,
              playerCameraFocusTile.y
            );
            return { x: chunkX, y: chunkY };
          })();
    const playerCameraFocusLocalTile =
      playerCameraFocusTile === null
        ? null
        : (() => {
            const { localX, localY } = worldToLocalTile(
              playerCameraFocusTile.x,
              playerCameraFocusTile.y
            );
            return { x: localX, y: localY };
          })();
    const playerIntent = input.getPlayerInputTelemetry();
    const playerPlaceholderPoseLabel =
      playerState === null
        ? null
        : getStandalonePlayerPlaceholderPoseLabel(playerState, {
            elapsedMs: renderTimeMs,
            wallContact: standalonePlayerContacts?.wall ?? null,
            ceilingContact: standalonePlayerContacts?.ceiling ?? null,
            ceilingBonkActive: standalonePlayerCeilingBonkActive
          });
    return {
      standalonePlayerContacts,
      debugOverlay: {
        player:
          playerState && playerWorldPosition && playerAabb
            ? {
                position: playerWorldPosition,
                velocity: {
                  x: playerState.velocity.x,
                  y: playerState.velocity.y
                },
                aabb: {
                  min: {
                    x: playerAabb.minX,
                    y: playerAabb.minY
                  },
                  max: {
                    x: playerAabb.maxX,
                    y: playerAabb.maxY
                  },
                  size: {
                    x: playerAabb.maxX - playerAabb.minX,
                    y: playerAabb.maxY - playerAabb.minY
                  }
                },
                grounded: playerState.grounded,
                facing: playerState.facing,
                contacts: {
                  support: standalonePlayerContacts?.support ?? null,
                  wall: standalonePlayerContacts?.wall ?? null,
                  ceiling: standalonePlayerContacts?.ceiling ?? null
                }
              }
            : null,
        playerPlaceholderPoseLabel,
        playerCeilingBonkHoldActive:
          playerState === null ? null : standalonePlayerCeilingBonkActive,
        playerIntent,
        playerCameraFollow:
          playerCameraWorldPosition &&
          playerCameraWorldTile &&
          playerCameraWorldLocalTile &&
          playerCameraFocusPoint &&
          playerCameraFocusTile &&
          playerCameraFocusChunk &&
          playerCameraFocusLocalTile
            ? {
                cameraPosition: playerCameraWorldPosition,
                cameraTile: playerCameraWorldTile,
                cameraLocal: playerCameraWorldLocalTile,
                cameraZoom: camera.zoom,
                focus: playerCameraFocusPoint,
                focusTile: playerCameraFocusTile,
                focusChunk: playerCameraFocusChunk,
                focusLocal: playerCameraFocusLocalTile,
                offset: {
                  x: cameraFollowOffset.x,
                  y: cameraFollowOffset.y
                }
              }
            : null
      },
      debugStatusStrip: {
        playerPlaceholderPoseLabel,
        playerWorldPosition,
        playerWorldTile,
        playerAabb:
          playerAabb === null
            ? null
            : {
                min: {
                  x: playerAabb.minX,
                  y: playerAabb.minY
                },
                max: {
                  x: playerAabb.maxX,
                  y: playerAabb.maxY
                }
              },
        playerCameraWorldPosition,
        playerCameraWorldTile,
        playerCameraWorldChunk,
        playerCameraWorldLocalTile,
        playerCameraFocusPoint,
        playerCameraFocusTile,
        playerCameraFocusChunk,
        playerCameraFocusLocalTile,
        playerCameraFollowOffset:
          playerState === null
            ? null
            : {
                x: cameraFollowOffset.x,
                y: cameraFollowOffset.y
              },
        playerCameraZoom: playerState === null ? null : camera.zoom,
        playerCeilingBonkHoldActive:
          playerState === null ? null : standalonePlayerCeilingBonkHoldActive,
        playerGrounded: playerState?.grounded ?? null,
        playerFacing: playerState?.facing ?? null,
        playerMoveX: playerState === null ? null : playerIntent.moveX,
        playerVelocityX: playerState === null ? null : playerState.velocity.x,
        playerVelocityY: playerState === null ? null : playerState.velocity.y,
        playerJumpHeld: playerState === null ? null : playerIntent.jumpHeld,
        playerJumpPressed: playerState === null ? null : playerIntent.jumpPressed,
        playerSupportContact: standalonePlayerContacts?.support
          ? {
              tile: {
                x: standalonePlayerContacts.support.tileX,
                y: standalonePlayerContacts.support.tileY,
                id: standalonePlayerContacts.support.tileId
              }
            }
          : null,
        playerWallContact: standalonePlayerContacts?.wall
          ? {
              tile: {
                x: standalonePlayerContacts.wall.tileX,
                y: standalonePlayerContacts.wall.tileY,
                id: standalonePlayerContacts.wall.tileId,
                side: standalonePlayerContacts.wall.side
              }
            }
          : null,
        playerCeilingContact: standalonePlayerContacts?.ceiling
          ? {
              tile: {
                x: standalonePlayerContacts.ceiling.tileX,
                y: standalonePlayerContacts.ceiling.tileY,
                id: standalonePlayerContacts.ceiling.tileId
              }
            }
          : null
      }
    };
  };
  const createStandalonePlayerRenderFrameNearbyLightTelemetrySnapshot =
    (): StandalonePlayerRenderFrameNearbyLightTelemetry => {
      if (standalonePlayerState === null) {
        return {
          playerNearbyLightLevel: null,
          playerNearbyLightFactor: null,
          playerNearbyLightSourceTile: null,
          playerNearbyLightSourceChunk: null,
          playerNearbyLightSourceLocalTile: null
        };
      }
      const telemetry = renderer.telemetry;
      return {
        playerNearbyLightLevel: telemetry.standalonePlayerNearbyLightLevel,
        playerNearbyLightFactor: telemetry.standalonePlayerNearbyLightFactor,
        playerNearbyLightSourceTile:
          telemetry.standalonePlayerNearbyLightSourceTileX !== null &&
          telemetry.standalonePlayerNearbyLightSourceTileY !== null
            ? {
                x: telemetry.standalonePlayerNearbyLightSourceTileX,
                y: telemetry.standalonePlayerNearbyLightSourceTileY
              }
            : null,
        playerNearbyLightSourceChunk:
          telemetry.standalonePlayerNearbyLightSourceChunkX !== null &&
          telemetry.standalonePlayerNearbyLightSourceChunkY !== null
            ? {
                x: telemetry.standalonePlayerNearbyLightSourceChunkX,
                y: telemetry.standalonePlayerNearbyLightSourceChunkY
              }
            : null,
        playerNearbyLightSourceLocalTile:
          telemetry.standalonePlayerNearbyLightSourceLocalTileX !== null &&
          telemetry.standalonePlayerNearbyLightSourceLocalTileY !== null
            ? {
                x: telemetry.standalonePlayerNearbyLightSourceLocalTileX,
                y: telemetry.standalonePlayerNearbyLightSourceLocalTileY
              }
            : null
      };
    };
  const createClearedStandalonePlayerRenderFrameStatusStripPlayerTelemetry =
    (): StandalonePlayerRenderFrameSelectedStatusStripPlayerTelemetry => ({
      playerPlaceholderPoseLabel: null,
      playerWorldPosition: null,
      playerWorldTile: null,
      playerAabb: null,
      playerCameraWorldPosition: null,
      playerCameraWorldTile: null,
      playerCameraWorldChunk: null,
      playerCameraWorldLocalTile: null,
      playerCameraFocusPoint: null,
      playerCameraFocusTile: null,
      playerCameraFocusChunk: null,
      playerCameraFocusLocalTile: null,
      playerCameraFollowOffset: null,
      playerCameraZoom: null,
      playerNearbyLightLevel: null,
      playerNearbyLightFactor: null,
      playerNearbyLightSourceTile: null,
      playerNearbyLightSourceChunk: null,
      playerNearbyLightSourceLocalTile: null,
      playerCeilingBonkHoldActive: null,
      playerGrounded: null,
      playerFacing: null,
      playerMoveX: null,
      playerVelocityX: null,
      playerVelocityY: null,
      playerJumpHeld: null,
      playerJumpPressed: null,
      playerSupportContact: null,
      playerWallContact: null,
      playerCeilingContact: null
    });
  const selectStandalonePlayerRenderFrameStatusStripPlayerTelemetry = ({
    debugOverlayVisible,
    playerTelemetry,
    nearbyLightTelemetry
  }: StandalonePlayerRenderFrameStatusStripPlayerTelemetrySelectionOptions):
    StandalonePlayerRenderFrameSelectedStatusStripPlayerTelemetry =>
    debugOverlayVisible
      ? createClearedStandalonePlayerRenderFrameStatusStripPlayerTelemetry()
      : {
          ...playerTelemetry,
          ...nearbyLightTelemetry
        };
  const createClearedStandalonePlayerRenderFrameStatusStripPlayerEventTelemetry =
    (): StandalonePlayerRenderFrameStatusStripPlayerEventTelemetry => ({
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null
    });
  const selectStandalonePlayerRenderFrameStatusStripPlayerEventTelemetry = ({
    debugOverlayVisible,
    eventTelemetry
  }: StandalonePlayerRenderFrameStatusStripPlayerEventTelemetrySelectionOptions):
    StandalonePlayerRenderFrameStatusStripPlayerEventTelemetry =>
    debugOverlayVisible
      ? createClearedStandalonePlayerRenderFrameStatusStripPlayerEventTelemetry()
      : eventTelemetry;

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
    const standalonePlayerRenderFrameTelemetry =
      createStandalonePlayerRenderFrameTelemetrySnapshot(renderTimeMs);
    const standalonePlayerStatusStripPlayerTelemetry = standalonePlayerRenderFrameTelemetry.debugStatusStrip;
    renderer.resize();
    renderer.render(camera, {
      standalonePlayer: standalonePlayerState,
      standalonePlayerWallContact:
        standalonePlayerRenderFrameTelemetry.standalonePlayerContacts?.wall ?? null,
      standalonePlayerCeilingContact:
        standalonePlayerRenderFrameTelemetry.standalonePlayerContacts?.ceiling ?? null,
      standalonePlayerCeilingBonkHoldUntilTimeMs: standalonePlayerCeilingBonkHoldUntilTimeMs,
      timeMs: renderTimeMs
    });
    const standalonePlayerNearbyLightTelemetry =
      createStandalonePlayerRenderFrameNearbyLightTelemetrySnapshot();
    const debugStatusStripPlayerTelemetry = selectStandalonePlayerRenderFrameStatusStripPlayerTelemetry({
      debugOverlayVisible,
      playerTelemetry: standalonePlayerStatusStripPlayerTelemetry,
      nearbyLightTelemetry: standalonePlayerNearbyLightTelemetry
    });
    const debugStatusStripPlayerEventTelemetry =
      selectStandalonePlayerRenderFrameStatusStripPlayerEventTelemetry({
        debugOverlayVisible,
        eventTelemetry: {
          playerGroundedTransition: lastPlayerGroundedTransitionEvent,
          playerFacingTransition: lastPlayerFacingTransitionEvent,
          playerRespawn: lastPlayerRespawnEvent,
          playerWallContactTransition: lastPlayerWallContactTransitionEvent,
          playerCeilingContactTransition: lastPlayerCeilingContactTransitionEvent
        }
      });
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
      playerPlaceholderPoseLabel: debugStatusStripPlayerTelemetry.playerPlaceholderPoseLabel,
      playerWorldPosition: debugStatusStripPlayerTelemetry.playerWorldPosition,
      playerWorldTile: debugStatusStripPlayerTelemetry.playerWorldTile,
      playerAabb: debugStatusStripPlayerTelemetry.playerAabb,
      playerCameraWorldPosition: debugStatusStripPlayerTelemetry.playerCameraWorldPosition,
      playerCameraWorldTile: debugStatusStripPlayerTelemetry.playerCameraWorldTile,
      playerCameraWorldChunk: debugStatusStripPlayerTelemetry.playerCameraWorldChunk,
      playerCameraWorldLocalTile: debugStatusStripPlayerTelemetry.playerCameraWorldLocalTile,
      playerCameraFocusPoint: debugStatusStripPlayerTelemetry.playerCameraFocusPoint,
      playerCameraFocusTile: debugStatusStripPlayerTelemetry.playerCameraFocusTile,
      playerCameraFocusChunk: debugStatusStripPlayerTelemetry.playerCameraFocusChunk,
      playerCameraFocusLocalTile: debugStatusStripPlayerTelemetry.playerCameraFocusLocalTile,
      playerCameraFollowOffset: debugStatusStripPlayerTelemetry.playerCameraFollowOffset,
      playerCameraZoom: debugStatusStripPlayerTelemetry.playerCameraZoom,
      residentDirtyLightChunks: debugOverlayVisible ? null : renderer.telemetry.residentDirtyLightChunks,
      playerNearbyLightLevel: debugStatusStripPlayerTelemetry.playerNearbyLightLevel,
      playerNearbyLightFactor: debugStatusStripPlayerTelemetry.playerNearbyLightFactor,
      playerNearbyLightSourceTile: debugStatusStripPlayerTelemetry.playerNearbyLightSourceTile,
      playerNearbyLightSourceChunk: debugStatusStripPlayerTelemetry.playerNearbyLightSourceChunk,
      playerNearbyLightSourceLocalTile:
        debugStatusStripPlayerTelemetry.playerNearbyLightSourceLocalTile,
      playerCeilingBonkHoldActive: debugStatusStripPlayerTelemetry.playerCeilingBonkHoldActive,
      playerGrounded: debugStatusStripPlayerTelemetry.playerGrounded,
      playerFacing: debugStatusStripPlayerTelemetry.playerFacing,
      playerMoveX: debugStatusStripPlayerTelemetry.playerMoveX,
      playerVelocityX: debugStatusStripPlayerTelemetry.playerVelocityX,
      playerVelocityY: debugStatusStripPlayerTelemetry.playerVelocityY,
      playerJumpHeld: debugStatusStripPlayerTelemetry.playerJumpHeld,
      playerJumpPressed: debugStatusStripPlayerTelemetry.playerJumpPressed,
      playerSupportContact: debugStatusStripPlayerTelemetry.playerSupportContact,
      playerWallContact: debugStatusStripPlayerTelemetry.playerWallContact,
      playerCeilingContact: debugStatusStripPlayerTelemetry.playerCeilingContact,
      playerGroundedTransition: debugStatusStripPlayerEventTelemetry.playerGroundedTransition,
      playerFacingTransition: debugStatusStripPlayerEventTelemetry.playerFacingTransition,
      playerRespawn: debugStatusStripPlayerEventTelemetry.playerRespawn,
      playerWallContactTransition: debugStatusStripPlayerEventTelemetry.playerWallContactTransition,
      playerCeilingContactTransition: debugStatusStripPlayerEventTelemetry.playerCeilingContactTransition
    });
    debug.update(frameDtMs, renderer.telemetry, {
      pointer: debugOverlayPointerInspect,
      pinned: debugOverlayPinnedInspect,
      spawn: debugOverlaySpawn,
      player: standalonePlayerRenderFrameTelemetry.debugOverlay.player,
      playerPlaceholderPoseLabel:
        standalonePlayerRenderFrameTelemetry.debugOverlay.playerPlaceholderPoseLabel,
      playerCeilingBonkHoldActive:
        standalonePlayerRenderFrameTelemetry.debugOverlay.playerCeilingBonkHoldActive,
      playerNearbyLightLevel: standalonePlayerNearbyLightTelemetry.playerNearbyLightLevel ?? null,
      playerNearbyLightFactor: standalonePlayerNearbyLightTelemetry.playerNearbyLightFactor ?? null,
      playerNearbyLightSourceTile:
        standalonePlayerNearbyLightTelemetry.playerNearbyLightSourceTile ?? null,
      playerNearbyLightSourceChunk:
        standalonePlayerNearbyLightTelemetry.playerNearbyLightSourceChunk ?? null,
      playerNearbyLightSourceLocalTile:
        standalonePlayerNearbyLightTelemetry.playerNearbyLightSourceLocalTile ?? null,
      playerIntent: standalonePlayerRenderFrameTelemetry.debugOverlay.playerIntent,
      playerCameraFollow: standalonePlayerRenderFrameTelemetry.debugOverlay.playerCameraFollow,
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
        updateStandalonePlayerFixedStep({
          previousPlayerState: standalonePlayerState,
          fixedDt
        });
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
