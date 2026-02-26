import './style.css';

import { Camera2D } from './core/camera2d';
import { GameLoop } from './core/gameLoop';
import { Renderer } from './gl/renderer';
import {
  InputController,
  walkFilledRectangleTileArea,
  walkRectangleOutlineTileArea,
  walkLineSteppedTilePath,
  type DebugTileEditKind
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
import { ArmedDebugToolPreviewOverlay } from './ui/armedDebugToolPreviewOverlay';
import { HoveredTileCursorOverlay } from './ui/hoveredTileCursor';
import { TouchDebugEditControls, type DebugBrushOption } from './ui/touchDebugEditControls';
import { CHUNK_SIZE } from './world/constants';
import { TILE_METADATA } from './world/tileMetadata';

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
  const canvas = document.createElement('canvas');
  app.append(canvas);

  let renderer: Renderer;
  try {
    renderer = new Renderer(canvas);
  } catch {
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent =
      'WebGL2 is not available in this browser. Please use a modern Chrome, Firefox, or Safari build.';
    app.replaceChildren(message);
    return;
  }

  const camera = new Camera2D();
  const input = new InputController(canvas, camera);
  const debug = new DebugOverlay();
  const hoveredTileCursor = new HoveredTileCursorOverlay(canvas);
  const armedDebugToolPreview = new ArmedDebugToolPreviewOverlay(canvas);
  const debugTileEditHistory = new DebugTileEditHistory();
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
  let debugEditControls: TouchDebugEditControls | null = null;
  let suppressDebugEditControlPersistence = false;

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

  const syncArmedDebugToolControls = (): void => {
    syncArmedFloodFillControls();
    syncArmedLineControls();
    syncArmedRectControls();
    syncArmedRectOutlineControls();
  };

  const setArmedDebugFloodFillKind = (kind: DebugTileEditKind | null): boolean => {
    const previousKind = input.getArmedDebugFloodFillKind();
    const previousLineKind = input.getArmedDebugLineKind();
    const previousRectKind = input.getArmedDebugRectKind();
    const previousRectOutlineKind = input.getArmedDebugRectOutlineKind();
    if (
      previousKind === kind &&
      (kind === null ||
        (previousLineKind === null &&
          previousRectKind === null &&
          previousRectOutlineKind === null))
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
    if (
      previousKind === kind &&
      (kind === null ||
        (previousFloodFillKind === null &&
          previousRectKind === null &&
          previousRectOutlineKind === null))
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
    if (
      previousKind === kind &&
      (kind === null ||
        (previousFloodFillKind === null &&
          previousLineKind === null &&
          previousRectOutlineKind === null))
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
    if (
      previousKind === kind &&
      (kind === null ||
        (previousFloodFillKind === null && previousLineKind === null && previousRectKind === null))
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
    input.setArmedDebugRectOutlineKind(kind);
    syncArmedDebugToolControls();
    return true;
  };

  const toggleArmedDebugRectOutlineKind = (kind: DebugTileEditKind): boolean => {
    const currentKind = input.getArmedDebugRectOutlineKind();
    return setArmedDebugRectOutlineKind(currentKind === kind ? null : kind);
  };

  const applyDebugHistoryTile = (worldTileX: number, worldTileY: number, tileId: number): void => {
    renderer.setTile(worldTileX, worldTileY, tileId);
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
        if (!renderer.setTile(fillTileX, fillTileY, replacementTileId)) return;
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
      const previousTileId = renderer.getTile(worldTileX, worldTileY);
      if (!renderer.setTile(worldTileX, worldTileY, tileId)) return;
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
      const previousTileId = renderer.getTile(worldTileX, worldTileY);
      if (!renderer.setTile(worldTileX, worldTileY, tileId)) return;
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
      const previousTileId = renderer.getTile(worldTileX, worldTileY);
      if (!renderer.setTile(worldTileX, worldTileY, tileId)) return;
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
    onUndo: undoDebugTileStroke,
    onRedo: redoDebugTileStroke,
    onResetPrefs: resetDebugEditControlPrefs
  });
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

  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    if (isEditableKeyboardShortcutTarget(event.target)) return;

    const action = resolveDebugEditShortcutAction(event);
    if (!action) return;
    event.preventDefault();

    let handled = false;
    if (action.type === 'undo') {
      handled = undoDebugTileStroke();
    } else if (action.type === 'redo') {
      handled = redoDebugTileStroke();
    } else if (action.type === 'cancel-armed-tools') {
      handled = input.cancelArmedDebugTools();
      if (handled) {
        syncArmedDebugToolControls();
      }
    } else if (action.type === 'arm-flood-fill') {
      handled = toggleArmedDebugFloodFillKind(action.kind);
    } else if (action.type === 'toggle-panel-collapsed') {
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

  await renderer.initialize();
  renderer.resize();

  window.addEventListener('resize', () => renderer.resize());

  const loop = new GameLoop(
    1000 / 60,
    (fixedDt) => {
      input.update(fixedDt);
      for (const edit of input.consumeDebugTileEdits()) {
        const tileId = edit.kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
        const previousTileId = renderer.getTile(edit.worldTileX, edit.worldTileY);
        const changed = renderer.setTile(edit.worldTileX, edit.worldTileY, tileId);
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
      syncArmedDebugToolControls();

      for (const eyedropperRequest of input.consumeDebugBrushEyedropperRequests()) {
        applyDebugBrushEyedropperAtTile(eyedropperRequest.worldTileX, eyedropperRequest.worldTileY);
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
    },
    (_alpha, frameDtMs) => {
      const pointerInspect = input.getPointerInspect();
      const armedDebugToolPreviewState = input.getArmedDebugToolPreviewState();
      renderer.resize();
      renderer.render(camera);
      hoveredTileCursor.update(camera, pointerInspect);
      armedDebugToolPreview.update(camera, pointerInspect, armedDebugToolPreviewState);
      debug.update(frameDtMs, renderer.telemetry, pointerInspect);
    }
  );

  loop.start();
};

void bootstrap();
