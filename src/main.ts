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
  type PointerInspectSnapshot
} from './input/controller';
import {
  clearDebugEditControlState,
  loadDebugEditControlState,
  saveDebugEditControlState
} from './input/debugEditControlStatePersistence';
import { runDebugFloodFill } from './input/debugFloodFill';
import { DebugTileEditHistory } from './input/debugTileEditHistory';
import {
  cycleDebugBrushTileId,
  getDebugBrushTileIdForShortcutSlot,
  resolveDebugEditShortcutAction
} from './input/debugEditShortcuts';
import { DebugOverlay } from './ui/debugOverlay';
import { AppShell, createPausedMainMenuShellState, type AppShellScreen } from './ui/appShell';
import { DebugEditStatusStrip } from './ui/debugEditStatusStrip';
import { ArmedDebugToolPreviewOverlay } from './ui/armedDebugToolPreviewOverlay';
import { HoveredTileCursorOverlay } from './ui/hoveredTileCursor';
import { PlayerSpawnMarkerOverlay } from './ui/playerSpawnMarkerOverlay';
import type { DebugEditHoveredTileState } from './ui/debugEditStatusHelpers';
import { TouchDebugEditControls, type DebugBrushOption } from './ui/touchDebugEditControls';
import { TouchPlayerControls } from './ui/touchPlayerControls';
import { CHUNK_SIZE } from './world/constants';
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
  getAnimatedLiquidRenderVariantFrameCount,
  getAnimatedLiquidRenderVariantFrameDurationMs,
  getTileMetadata,
  resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs,
  resolveTileGameplayMetadata,
  TILE_METADATA
} from './world/tileMetadata';

const DEBUG_TILE_BREAK_ID = 0;
const PREFERRED_INITIAL_DEBUG_BRUSH_TILE_NAME = 'debug_brick';
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
const createDefaultWorldSessionShellState = (touchControlsAvailable: boolean) => ({
  debugOverlayVisible: false,
  debugEditControlsVisible: touchControlsAvailable,
  debugEditOverlaysVisible: true,
  playerSpawnMarkerVisible: true
});

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

const bootstrap = async (): Promise<void> => {
  const touchControlsAvailable = supportsTouchPlayerControls();
  let worldSessionStarted = false;
  let currentScreen: AppShellScreen = 'boot';
  let loop: GameLoop | null = null;
  let {
    debugOverlayVisible,
    debugEditControlsVisible,
    debugEditOverlaysVisible,
    playerSpawnMarkerVisible
  } = createDefaultWorldSessionShellState(touchControlsAvailable);
  const returnToMainMenuFromInWorld = (): void => {
    if (currentScreen !== 'in-world') return;
    currentScreen = 'main-menu';
    showMainMenuShellState();
    syncDebugOverlayVisibility();
    syncDebugEditControlsVisibility();
    syncDebugEditOverlayVisibility();
    syncPlayerSpawnMarkerVisibility();
  };
  const shell = new AppShell(app, {
    onPrimaryAction: (screen) => {
      if (screen !== 'main-menu' || loop === null) return;
      enterOrResumeWorldSessionFromMainMenu();
    },
    onSecondaryAction: (screen) => {
      if (screen !== 'main-menu' || loop === null || !worldSessionStarted) return;
      startFreshWorldSessionFromMainMenu();
    },
    onReturnToMainMenu: (screen) => {
      if (screen !== 'in-world') return;
      returnToMainMenuFromInWorld();
    },
    onRecenterCamera: (screen) => {
      if (screen !== 'in-world') return;
      centerCameraOnStandalonePlayer();
    },
    onToggleDebugOverlay: (screen) => {
      if (screen !== 'in-world') return;
      debugOverlayVisible = !debugOverlayVisible;
      syncInWorldShellState();
      syncDebugOverlayVisibility();
    },
    onToggleDebugEditControls: (screen) => {
      if (screen !== 'in-world') return;
      debugEditControlsVisible = !debugEditControlsVisible;
      syncInWorldShellState();
      syncDebugEditControlsVisibility();
    },
    onToggleDebugEditOverlays: (screen) => {
      if (screen !== 'in-world') return;
      debugEditOverlaysVisible = !debugEditOverlaysVisible;
      syncInWorldShellState();
      syncDebugEditOverlayVisibility();
    },
    onTogglePlayerSpawnMarker: (screen) => {
      if (screen !== 'in-world') return;
      playerSpawnMarkerVisible = !playerSpawnMarkerVisible;
      syncInWorldShellState();
      syncPlayerSpawnMarkerVisibility();
    }
  });
  shell.setState({
    screen: 'boot',
    statusText: 'Preparing renderer, controls, and spawn state.'
  });
  const canvas = document.createElement('canvas');
  shell.getWorldHost().append(canvas);

  let renderer: Renderer;
  try {
    renderer = new Renderer(canvas);
  } catch {
    shell.setState({
      screen: 'boot',
      statusText: 'WebGL2 is not available in this browser.',
      detailLines: ['Use a current Chrome, Firefox, or Safari build to continue.']
    });
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
    shell.setState({
      screen: 'in-world',
      debugOverlayVisible,
      debugEditControlsVisible,
      debugEditOverlaysVisible,
      playerSpawnMarkerVisible
    });
  };
  const showMainMenuShellState = (): void => {
    currentScreen = 'main-menu';
    shell.setState(worldSessionStarted ? createPausedMainMenuShellState() : { screen: 'main-menu' });
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
  const applyDefaultWorldSessionShellState = (): void => {
    ({
      debugOverlayVisible,
      debugEditControlsVisible,
      debugEditOverlaysVisible,
      playerSpawnMarkerVisible
    } = createDefaultWorldSessionShellState(touchControlsAvailable));
  };
  const enterInWorldShellState = (): void => {
    currentScreen = 'in-world';
    syncInWorldShellState();
    syncDebugOverlayVisibility();
    syncDebugEditControlsVisibility();
    syncDebugEditOverlayVisibility();
    syncPlayerSpawnMarkerVisibility();
  };
  syncDebugOverlayVisibility();
  syncDebugEditControlsVisibility();
  syncDebugEditOverlayVisibility();
  syncPlayerSpawnMarkerVisibility();
  input.retainPointerInspectWhenLeavingToElement(debugEditStatusStrip.getPointerInspectRetainerElement());
  let debugTileEditHistory = new DebugTileEditHistory();
  const debugEditControlStorage = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  const defaultDebugEditControlState = {
    touchMode: input.getTouchDebugEditMode(),
    brushTileId: INITIAL_DEBUG_BRUSH_TILE_ID,
    panelCollapsed: false
  } as const;
  const initialDebugEditControlState = loadDebugEditControlState(
    debugEditControlStorage,
    DEBUG_BRUSH_TILE_IDS,
    defaultDebugEditControlState
  );
  input.setTouchDebugEditMode(initialDebugEditControlState.touchMode);
  let activeDebugBrushTileId = initialDebugEditControlState.brushTileId;
  let debugEditPanelCollapsed = initialDebugEditControlState.panelCollapsed;
  let suppressDebugEditControlPersistence = false;
  let pinnedDebugTileInspect: PinnedDebugTileInspectState | null = null;
  let resolvedPlayerSpawn = renderer.findPlayerSpawnPoint(DEBUG_PLAYER_SPAWN_SEARCH_OPTIONS);
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

  const centerCameraOnStandalonePlayer = (): void => {
    if (!standalonePlayerState) {
      lastAppliedPlayerFollowCameraPosition = null;
      return;
    }

    const focusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
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
      centerCameraOnStandalonePlayer();
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

  const persistDebugEditControlsState = (): void => {
    if (suppressDebugEditControlPersistence) return;
    saveDebugEditControlState(debugEditControlStorage, {
      touchMode: input.getTouchDebugEditMode(),
      brushTileId: activeDebugBrushTileId,
      panelCollapsed: debugEditPanelCollapsed
    });
  };

  const resetDebugEditControlPrefs = (): void => {
    suppressDebugEditControlPersistence = true;
    try {
      if (debugEditControls) {
        debugEditControls.setMode(defaultDebugEditControlState.touchMode);
        debugEditControls.setBrushTileId(defaultDebugEditControlState.brushTileId);
        debugEditControls.setCollapsed(defaultDebugEditControlState.panelCollapsed);
      } else {
        input.setTouchDebugEditMode(defaultDebugEditControlState.touchMode);
        activeDebugBrushTileId = defaultDebugEditControlState.brushTileId;
        debugEditPanelCollapsed = defaultDebugEditControlState.panelCollapsed;
      }
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

  const syncArmedFloodFillControls = (): void => {
    if (!debugEditControls) return;
    debugEditControls.setArmedFloodFillKind(input.getArmedDebugFloodFillKind());
  };

  const syncArmedLineControls = (): void => {
    if (!debugEditControls) return;
    debugEditControls.setArmedLineKind(input.getArmedDebugLineKind());
  };

  const syncArmedRectControls = (): void => {
    if (!debugEditControls) return;
    debugEditControls.setArmedRectKind(input.getArmedDebugRectKind());
  };

  const syncArmedRectOutlineControls = (): void => {
    if (!debugEditControls) return;
    debugEditControls.setArmedRectOutlineKind(input.getArmedDebugRectOutlineKind());
  };

  const syncArmedEllipseControls = (): void => {
    if (!debugEditControls) return;
    debugEditControls.setArmedEllipseKind(input.getArmedDebugEllipseKind());
  };

  const syncArmedEllipseOutlineControls = (): void => {
    if (!debugEditControls) return;
    debugEditControls.setArmedEllipseOutlineKind(input.getArmedDebugEllipseOutlineKind());
  };

  const syncArmedDebugToolControls = (): void => {
    syncArmedFloodFillControls();
    syncArmedLineControls();
    syncArmedRectControls();
    syncArmedRectOutlineControls();
    syncArmedEllipseControls();
    syncArmedEllipseOutlineControls();
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

  debugEditControls = new TouchDebugEditControls({
    initialVisible: false,
    initialMode: input.getTouchDebugEditMode(),
    onModeChange: (mode) => {
      input.setTouchDebugEditMode(mode);
      persistDebugEditControlsState();
    },
    brushOptions: DEBUG_BRUSH_TILE_OPTIONS,
    initialBrushTileId: activeDebugBrushTileId,
    onBrushTileIdChange: (tileId) => {
      activeDebugBrushTileId = tileId;
      persistDebugEditControlsState();
    },
    initialCollapsed: debugEditPanelCollapsed,
    onCollapsedChange: (collapsed) => {
      debugEditPanelCollapsed = collapsed;
      persistDebugEditControlsState();
    },
    initialArmedFloodFillKind: input.getArmedDebugFloodFillKind(),
    initialArmedLineKind: input.getArmedDebugLineKind(),
    initialArmedRectKind: input.getArmedDebugRectKind(),
    initialArmedRectOutlineKind: input.getArmedDebugRectOutlineKind(),
    initialArmedEllipseKind: input.getArmedDebugEllipseKind(),
    initialArmedEllipseOutlineKind: input.getArmedDebugEllipseOutlineKind(),
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
    } else {
      activeDebugBrushTileId = tileId;
      persistDebugEditControlsState();
    }
    return activeDebugBrushTileId !== previousBrushTileId;
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
    enterInWorldShellState();
    if (worldSessionStarted) return;
    worldSessionStarted = true;
    loop.start();
  };
  const startFreshWorldSessionFromMainMenu = (): void => {
    if (loop === null || !worldSessionStarted) return;
    applyDefaultWorldSessionShellState();
    resetFreshWorldSessionRuntimeState();
    enterInWorldShellState();
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

    const action = resolveDebugEditShortcutAction(event, {
      pausedMainMenuResumeWorldAvailable: currentScreen === 'main-menu' && worldSessionStarted,
      pausedMainMenuFreshWorldAvailable: currentScreen === 'main-menu' && worldSessionStarted
    });
    if (!action) return;
    if (action.type === 'resume-paused-world-session') {
      event.preventDefault();
      enterOrResumeWorldSessionFromMainMenu();
      return;
    }
    if (action.type === 'start-fresh-world-session') {
      event.preventDefault();
      startFreshWorldSessionFromMainMenu();
      return;
    }
    if (currentScreen !== 'in-world') return;
    event.preventDefault();

    let handled = false;
    if (action.type === 'undo') {
      handled = undoDebugTileStroke();
    } else if (action.type === 'redo') {
      handled = redoDebugTileStroke();
    } else if (action.type === 'return-to-main-menu') {
      handled = true;
      returnToMainMenuFromInWorld();
    } else if (action.type === 'recenter-camera') {
      handled = standalonePlayerState !== null;
      if (handled) {
        centerCameraOnStandalonePlayer();
      }
    } else if (action.type === 'toggle-debug-overlay') {
      handled = true;
      debugOverlayVisible = !debugOverlayVisible;
      syncInWorldShellState();
      syncDebugOverlayVisibility();
    } else if (action.type === 'toggle-debug-edit-controls') {
      handled = true;
      debugEditControlsVisible = !debugEditControlsVisible;
      syncInWorldShellState();
      syncDebugEditControlsVisibility();
    } else if (action.type === 'toggle-debug-edit-overlays') {
      handled = true;
      debugEditOverlaysVisible = !debugEditOverlaysVisible;
      syncInWorldShellState();
      syncDebugEditOverlayVisibility();
    } else if (action.type === 'toggle-player-spawn-marker') {
      handled = true;
      playerSpawnMarkerVisible = !playerSpawnMarkerVisible;
      syncInWorldShellState();
      syncPlayerSpawnMarkerVisibility();
    } else if (action.type === 'cancel-armed-tools') {
      handled = input.cancelArmedDebugTools();
      if (handled) {
        syncArmedDebugToolControls();
      }
    } else if (action.type === 'arm-flood-fill') {
      handled = toggleArmedDebugFloodFillKind(action.kind);
    } else if (action.type === 'arm-line') {
      handled = toggleArmedDebugLineKind(action.kind);
    } else if (action.type === 'arm-rect') {
      handled = toggleArmedDebugRectKind(action.kind);
    } else if (action.type === 'arm-rect-outline') {
      handled = toggleArmedDebugRectOutlineKind(action.kind);
    } else if (action.type === 'arm-ellipse') {
      handled = toggleArmedDebugEllipseKind(action.kind);
    } else if (action.type === 'arm-ellipse-outline') {
      handled = toggleArmedDebugEllipseOutlineKind(action.kind);
    } else if (action.type === 'toggle-panel-collapsed') {
      if (!debugEditControlsVisible) return;
      const previousCollapsed = debugEditControls ? debugEditControls.isCollapsed() : debugEditPanelCollapsed;
      if (debugEditControls) {
        debugEditControls.setCollapsed(!previousCollapsed);
        handled = debugEditControls.isCollapsed() !== previousCollapsed;
      } else {
        debugEditPanelCollapsed = !previousCollapsed;
        handled = debugEditPanelCollapsed !== previousCollapsed;
        if (handled) {
          persistDebugEditControlsState();
        }
      }
    } else if (action.type === 'set-touch-mode') {
      const previousMode = input.getTouchDebugEditMode();
      if (debugEditControls) {
        debugEditControls.setMode(action.mode);
      } else {
        input.setTouchDebugEditMode(action.mode);
      }
      handled = input.getTouchDebugEditMode() !== previousMode;
      if (handled && !debugEditControls) {
        persistDebugEditControlsState();
      }
    } else if (action.type === 'select-brush-slot') {
      const tileId = getDebugBrushTileIdForShortcutSlot(DEBUG_BRUSH_TILE_OPTIONS, action.slotIndex);
      handled = tileId !== null ? applyDebugBrushShortcutTileId(tileId) : false;
    } else if (action.type === 'eyedropper') {
      const pointerInspect = input.getPointerInspect();
      handled =
        pointerInspect?.pointerType === 'mouse'
          ? applyDebugBrushEyedropperAtTile(pointerInspect.tile.x, pointerInspect.tile.y)
          : false;
    } else {
      const tileId = cycleDebugBrushTileId(DEBUG_BRUSH_TILE_OPTIONS, activeDebugBrushTileId, action.delta);
      handled = tileId !== null ? applyDebugBrushShortcutTileId(tileId) : false;
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
    const debugOverlayPlayerCameraFollow = standalonePlayerState
      ? {
          focus: getPlayerCameraFocusPoint(standalonePlayerState),
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
        historyChanged =
          (action === 'undo' ? undoDebugTileStroke() : redoDebugTileStroke()) || historyChanged;
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
    const detailMessage =
      error instanceof Error && error.message.length > 0
        ? error.message
        : 'Reload the page after confirming WebGL2 is available.';
    shell.setState({
      screen: 'boot',
      statusText: 'Renderer initialization failed.',
      detailLines: [detailMessage]
    });
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
