import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS } from './gl/standalonePlayerPlaceholder';
import { DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY } from './input/debugEditControlStatePersistence';
import {
  loadShellActionKeybindingStateWithDefaultFallbackStatus,
  SHELL_ACTION_KEYBINDING_STORAGE_KEY,
  type ShellActionKeybindingState
} from './input/shellActionKeybindings';
import {
  createDefaultWorldSessionShellState,
  WORLD_SESSION_SHELL_STATE_STORAGE_KEY
} from './mainWorldSessionShellState';
import { createWorldSaveEnvelope } from './mainWorldSave';
import { PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY } from './mainWorldSaveLocalPersistence';
import {
  createDefaultBootShellState,
  createInWorldShellState,
  createMainMenuShellState,
  createRendererInitializationFailedBootShellState,
  createWebGlUnavailableBootShellState,
  type PausedMainMenuExportResult,
  type PausedMainMenuImportResult
} from './ui/appShell';
import type { DebugOverlayInspectState } from './ui/debugOverlay';
import type { DebugEditStatusStripState } from './ui/debugEditStatusHelpers';
import { createPlayerState, getPlayerCameraFocusPoint } from './world/playerState';
import { TileWorld } from './world/world';

const CUSTOM_SHELL_ACTION_KEYBINDINGS: ShellActionKeybindingState = {
  'return-to-main-menu': 'X',
  'recenter-camera': 'Z',
  'toggle-debug-overlay': 'U',
  'toggle-debug-edit-controls': 'J',
  'toggle-debug-edit-overlays': 'K',
  'toggle-player-spawn-marker': 'Y'
};

const worldTileKey = (worldTileX: number, worldTileY: number): string => `${worldTileX},${worldTileY}`;

const testRuntime = vi.hoisted(() => {
  class FakeHTMLElement {
    tagName: string;
    style: Record<string, string> = {};
    children: unknown[] = [];
    hidden = false;
    className = '';
    textContent = '';
    title = '';
    isContentEditable = false;
    width = 800;
    height = 600;

    constructor(tagName: string) {
      this.tagName = tagName.toUpperCase();
    }

    append(...children: unknown[]): void {
      this.children.push(...children);
    }

    replaceChildren(...children: unknown[]): void {
      this.children = [...children];
    }

    setAttribute(_name: string, _value: string): void {}

    addEventListener(_type: string, _listener: (...args: unknown[]) => void): void {}

    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: this.width,
        height: this.height
      };
    }
  }

  return {
    FakeHTMLElement,
    appRoot: null as FakeHTMLElement | null,
    cameraInstance: null as null | { x: number; y: number; zoom: number },
    windowListeners: new Map<string, Array<(event: unknown) => void>>(),
    shellInstance: null as null | {
      currentState: unknown;
      stateHistory: unknown[];
      options: Record<string, (screen: string) => void>;
    },
    initialArmedToolKinds: {
      floodFillKind: null as 'place' | 'break' | null,
      lineKind: null as 'place' | 'break' | null,
      rectKind: null as 'place' | 'break' | null,
      rectOutlineKind: null as 'place' | 'break' | null,
      ellipseKind: null as 'place' | 'break' | null,
      ellipseOutlineKind: null as 'place' | 'break' | null
    },
    inputControllerInstance: null as null | {
      getArmedDebugFloodFillKind(): 'place' | 'break' | null;
      getArmedDebugLineKind(): 'place' | 'break' | null;
      getArmedDebugRectKind(): 'place' | 'break' | null;
      getArmedDebugRectOutlineKind(): 'place' | 'break' | null;
      getArmedDebugEllipseKind(): 'place' | 'break' | null;
      getArmedDebugEllipseOutlineKind(): 'place' | 'break' | null;
    },
    pointerInspect: null as null | {
      pointerType: 'mouse' | 'touch';
      tile: { x: number; y: number };
    },
    debugTileInspectPinRequests: [] as Array<{
      worldTileX: number;
      worldTileY: number;
    }>,
    debugOverlayInstance: null as null | { visible: boolean },
    debugEditControlsInitialPreferenceSnapshot: null as null | {
      touchMode: 'pan' | 'place' | 'break';
      brushTileId: number;
      panelCollapsed: boolean;
    },
    debugEditControlsInitialHistoryState: null as null | {
      undoStrokeCount: number;
      redoStrokeCount: number;
    },
    debugEditControlsLatestHistoryState: null as null | {
      undoStrokeCount: number;
      redoStrokeCount: number;
    },
    debugEditControlsSetVisibleCallCount: 0,
    debugEditControlsSetHistoryStateCallCount: 0,
    debugEditControlsArmedToolSetterCallCount: 0,
    debugEditControlsInitialArmedToolSnapshot: null as null | {
      floodFillKind: 'place' | 'break' | null;
      lineKind: 'place' | 'break' | null;
      rectKind: 'place' | 'break' | null;
      rectOutlineKind: 'place' | 'break' | null;
      ellipseKind: 'place' | 'break' | null;
      ellipseOutlineKind: 'place' | 'break' | null;
    },
    debugEditControlsArmedToolKinds: null as null | {
      floodFillKind: 'place' | 'break' | null;
      lineKind: 'place' | 'break' | null;
      rectKind: 'place' | 'break' | null;
      rectOutlineKind: 'place' | 'break' | null;
      ellipseKind: 'place' | 'break' | null;
      ellipseOutlineKind: 'place' | 'break' | null;
    },
    debugEditControlsInstance: null as null | {
      visible: boolean;
      getBrushTileId(): number;
      getMode(): 'pan' | 'place' | 'break';
      isCollapsed(): boolean;
      setBrushTileId(tileId: number): void;
      setMode(mode: 'pan' | 'place' | 'break'): void;
      setCollapsed(collapsed: boolean): void;
      triggerArmFloodFill(kind: 'place' | 'break'): void;
      triggerArmLine(kind: 'place' | 'break'): void;
      triggerArmRect(kind: 'place' | 'break'): void;
      triggerArmRectOutline(kind: 'place' | 'break'): void;
      triggerArmEllipse(kind: 'place' | 'break'): void;
      triggerArmEllipseOutline(kind: 'place' | 'break'): void;
      triggerUndo(): void;
      triggerRedo(): void;
      triggerResetPrefs(): void;
    },
    hoveredTileCursorInstance: null as null | { visible: boolean },
    armedDebugToolPreviewInstance: null as null | { visible: boolean },
    debugEditStatusStripInstance: null as null | { visible: boolean },
    playerSpawnMarkerInstance: null as null | { visible: boolean },
    rendererConstructorError: null as unknown,
    rendererInitializeError: null as unknown,
    rendererConstructCount: 0,
    rendererInstance: null as object | null,
    rendererLoadWorldSnapshotCallCount: 0,
    gameLoopFixedUpdate: null as null | ((fixedDt: number) => void),
    gameLoopRender: null as null | ((alpha: number, frameDtMs: number) => void),
    performanceNow: 1000,
    debugTileEditHistoryConstructCount: 0,
    debugTileEditHistoryConstructorStatuses: [] as Array<{
      undoStrokeCount: number;
      redoStrokeCount: number;
    }>,
    debugTileEditHistoryStatus: {
      undoStrokeCount: 0,
      redoStrokeCount: 0
    },
    debugHistoryUndoCallCount: 0,
    debugHistoryRedoCallCount: 0,
    debugHistoryShortcutActions: [] as Array<'undo' | 'redo'>,
    cancelArmedDebugToolsCallCount: 0,
    playerMovementIntentReadCount: 0,
    playerMovementIntent: {
      moveX: 0,
      jumpHeld: false,
      jumpPressed: false
    },
    fixedStepWorldUpdateOrder: [] as string[],
    debugTileEdits: [] as Array<{
      strokeId: number;
      worldTileX: number;
      worldTileY: number;
      kind: 'place' | 'break';
    }>,
    rendererTileId: 0,
    rendererTileIdsByWorldKey: new Map<string, number>(),
    rendererLiquidLevel: 0,
    rendererLiquidLevelsByWorldKey: new Map<string, number>(),
    rendererLiquidRenderCardinalMask: null as number | null,
    rendererSetTileResult: false,
    rendererStepLiquidSimulationCallCount: 0,
    rendererStepPlayerStateImpl: null as null | ((
      state: unknown,
      fixedDt: number,
      intent: unknown
    ) => unknown),
    rendererStepPlayerStateRequests: [] as Array<{
      state: {
        position: { x: number; y: number } | null;
        velocity: { x: number; y: number } | null;
        grounded: boolean | null;
        facing: 'left' | 'right' | null;
      };
      fixedDt: number;
      intent: {
        moveX: number | null;
        jumpPressed: boolean | null;
      };
    }>,
    rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl: null as null | ((
      state: unknown,
      spawn: unknown
    ) => unknown),
    rendererPlayerCollisionContactsQueue: [] as Array<{
      support: { tileX: number; tileY: number; tileId: number } | null;
      wall: { tileX: number; tileY: number; tileId: number; side: 'left' | 'right' } | null;
      ceiling: { tileX: number; tileY: number; tileId: number } | null;
    }>,
    rendererPlayerCollisionContactRequestStates: [] as Array<{
      position: { x: number; y: number } | null;
      velocity: { x: number; y: number } | null;
      grounded: boolean | null;
      facing: 'left' | 'right' | null;
    }>,
    rendererTelemetry: {
      atlasWidth: null as number | null,
      atlasHeight: null as number | null,
      residentDirtyLightChunks: 0,
      residentActiveLiquidChunks: 0,
      residentActiveLiquidMinChunkX: null as number | null,
      residentActiveLiquidMinChunkY: null as number | null,
      residentActiveLiquidMaxChunkX: null as number | null,
      residentActiveLiquidMaxChunkY: null as number | null,
      standalonePlayerNearbyLightLevel: null as number | null,
      standalonePlayerNearbyLightFactor: null as number | null,
      standalonePlayerNearbyLightSourceTileX: null as number | null,
      standalonePlayerNearbyLightSourceTileY: null as number | null,
      standalonePlayerNearbyLightSourceChunkX: null as number | null,
      standalonePlayerNearbyLightSourceChunkY: null as number | null,
      standalonePlayerNearbyLightSourceLocalTileX: null as number | null,
      standalonePlayerNearbyLightSourceLocalTileY: null as number | null
    },
    latestRendererRenderFrameState: null as null | {
      standalonePlayerPosition: { x: number; y: number } | null;
      standalonePlayerPreviousPosition: { x: number; y: number } | null;
      standalonePlayerCurrentPosition: { x: number; y: number } | null;
      standalonePlayerInterpolatedPosition: { x: number; y: number } | null;
      standalonePlayerWallContact:
        | { tileX: number; tileY: number; tileId: number; side: 'left' | 'right' }
        | null;
      standalonePlayerCeilingContact: { tileX: number; tileY: number; tileId: number } | null;
      standalonePlayerCeilingBonkHoldUntilTimeMs: number | null;
      renderAlpha: number | null;
      timeMs: number | null;
    },
    latestDebugOverlayInspectState: null as DebugOverlayInspectState | null,
    latestDebugEditStatusStripState: null as DebugEditStatusStripState | null,
    rendererWorldSnapshot: null as ReturnType<TileWorld['createSnapshot']> | null,
    rendererPlayerSpawnLiquidSafetyStatus: 'safe' as 'safe' | 'overlap',
    playerSpawnPoint: null as null | {
      anchorTileX: number;
      standingTileY: number;
      x: number;
      y: number;
      aabb: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
      };
      support: {
        tileX: number;
        tileY: number;
        tileId: number;
      };
    },
    gameLoopStartCount: 0,
    storageValues: new Map<string, string>(),
    storageSetItemErrorsByKey: new Map<string, Error>(),
    downloadedWorldSaveEnvelopes: [] as unknown[],
    downloadWorldSaveFilename: 'deep-factory-world-save-2026-03-08T05-06-07Z.json',
    downloadWorldSaveError: null as Error | null,
    queuedWorldSaveImportResults: [] as unknown[],
    worldSaveImportCallCount: 0,
    inputControllerConstructCount: 0
  };
});

vi.mock('./style.css', () => ({}));

vi.mock('./core/camera2d', () => ({
  Camera2D: class {
    x = 0;
    y = 0;
    zoom = 1;

    constructor() {
      testRuntime.cameraInstance = this;
    }
  }
}));

vi.mock('./core/gameLoop', () => ({
  GameLoop: class {
    constructor(
      _fixedStepMs: number,
      onFixedUpdate: (fixedDt: number) => void,
      onRender: (alpha: number, frameDtMs: number) => void
    ) {
      testRuntime.gameLoopFixedUpdate = onFixedUpdate;
      testRuntime.gameLoopRender = onRender;
    }

    start(): void {
      testRuntime.gameLoopStartCount += 1;
    }
  }
}));

vi.mock('./gl/renderer', () => ({
  Renderer: class {
    constructor() {
      testRuntime.rendererConstructCount += 1;
      testRuntime.rendererInstance = this;
      if (testRuntime.rendererConstructorError !== null) {
        throw testRuntime.rendererConstructorError;
      }
    }

    telemetry = testRuntime.rendererTelemetry;

    async initialize(): Promise<void> {
      if (testRuntime.rendererInitializeError !== null) {
        throw testRuntime.rendererInitializeError;
      }
    }

    resize(): void {}

    render(_camera?: unknown, frameState?: unknown): void {
      if (!frameState || typeof frameState !== 'object') {
        testRuntime.latestRendererRenderFrameState = null;
        return;
      }

      const renderState = frameState as {
        entities?:
          | Array<{
              kind?: string;
              snapshot?: {
                previous?: {
                  position?: { x?: number; y?: number };
                  wallContact?:
                    | { tileX: number; tileY: number; tileId: number; side: 'left' | 'right' }
                    | null;
                  ceilingContact?: { tileX: number; tileY: number; tileId: number } | null;
                  ceilingBonkHoldUntilTimeMs?: number | null;
                } | null;
                current?: {
                  position?: { x?: number; y?: number };
                  wallContact?:
                    | { tileX: number; tileY: number; tileId: number; side: 'left' | 'right' }
                    | null;
                  ceilingContact?: { tileX: number; tileY: number; tileId: number } | null;
                  ceilingBonkHoldUntilTimeMs?: number | null;
                } | null;
              } | null;
            }>
          | null;
        renderAlpha?: number;
        timeMs?: number;
      };
      const standalonePlayerEntity = Array.isArray(renderState.entities)
        ? renderState.entities.find((entity) => entity?.kind === 'standalone-player') ?? null
        : null;
      const standalonePlayerPreviousPosition =
        standalonePlayerEntity?.snapshot?.previous?.position &&
        typeof standalonePlayerEntity.snapshot.previous.position.x === 'number' &&
        typeof standalonePlayerEntity.snapshot.previous.position.y === 'number'
          ? {
              x: standalonePlayerEntity.snapshot.previous.position.x,
              y: standalonePlayerEntity.snapshot.previous.position.y
            }
          : null;
      const standalonePlayerCurrentPosition =
        standalonePlayerEntity?.snapshot?.current?.position &&
        typeof standalonePlayerEntity.snapshot.current.position.x === 'number' &&
        typeof standalonePlayerEntity.snapshot.current.position.y === 'number'
          ? {
              x: standalonePlayerEntity.snapshot.current.position.x,
              y: standalonePlayerEntity.snapshot.current.position.y
            }
          : null;
      const clampedRenderAlpha =
        typeof renderState.renderAlpha === 'number'
          ? Math.max(0, Math.min(1, renderState.renderAlpha))
          : null;
      const standalonePlayerInterpolatedPosition =
        standalonePlayerPreviousPosition !== null &&
        standalonePlayerCurrentPosition !== null &&
        clampedRenderAlpha !== null
          ? {
              x:
                standalonePlayerPreviousPosition.x +
                (standalonePlayerCurrentPosition.x - standalonePlayerPreviousPosition.x) *
                  clampedRenderAlpha,
              y:
                standalonePlayerPreviousPosition.y +
                (standalonePlayerCurrentPosition.y - standalonePlayerPreviousPosition.y) *
                  clampedRenderAlpha
            }
          : standalonePlayerCurrentPosition;

      testRuntime.latestRendererRenderFrameState = {
        standalonePlayerPosition: standalonePlayerCurrentPosition,
        standalonePlayerPreviousPosition,
        standalonePlayerCurrentPosition,
        standalonePlayerInterpolatedPosition,
        standalonePlayerWallContact: standalonePlayerEntity?.snapshot?.current?.wallContact ?? null,
        standalonePlayerCeilingContact:
          standalonePlayerEntity?.snapshot?.current?.ceilingContact ?? null,
        standalonePlayerCeilingBonkHoldUntilTimeMs:
          standalonePlayerEntity?.snapshot?.current?.ceilingBonkHoldUntilTimeMs ?? null,
        renderAlpha: typeof renderState.renderAlpha === 'number' ? renderState.renderAlpha : null,
        timeMs: renderState.timeMs ?? null
      };
    }

    findPlayerSpawnPoint() {
      return testRuntime.playerSpawnPoint;
    }

    resolvePlayerSpawnLiquidSafetyStatus() {
      return testRuntime.rendererPlayerSpawnLiquidSafetyStatus;
    }

    respawnPlayerStateAtSpawnIfEmbeddedInSolid<T>(state: T, spawn: unknown): T {
      if (testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl) {
        return testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl(state, spawn) as T;
      }
      return state;
    }

    getPlayerCollisionContacts(state?: unknown) {
      if (state && typeof state === 'object') {
        const playerState = state as {
          position?: { x?: number; y?: number };
          velocity?: { x?: number; y?: number };
          grounded?: boolean;
          facing?: 'left' | 'right';
        };
        testRuntime.rendererPlayerCollisionContactRequestStates.push({
          position:
            playerState.position &&
            typeof playerState.position.x === 'number' &&
            typeof playerState.position.y === 'number'
              ? { x: playerState.position.x, y: playerState.position.y }
              : null,
          velocity:
            playerState.velocity &&
            typeof playerState.velocity.x === 'number' &&
            typeof playerState.velocity.y === 'number'
              ? { x: playerState.velocity.x, y: playerState.velocity.y }
              : null,
          grounded: typeof playerState.grounded === 'boolean' ? playerState.grounded : null,
          facing: playerState.facing ?? null
        });
      }
      const queuedContacts = testRuntime.rendererPlayerCollisionContactsQueue.shift();
      if (queuedContacts) {
        return queuedContacts;
      }
      return {
        support: null,
        wall: null,
        ceiling: null
      };
    }

    getTile(worldTileX?: number, worldTileY?: number): number {
      if (typeof worldTileX === 'number' && typeof worldTileY === 'number') {
        const mappedTileId = testRuntime.rendererTileIdsByWorldKey.get(worldTileKey(worldTileX, worldTileY));
        if (mappedTileId !== undefined) {
          return mappedTileId;
        }
      }
      return testRuntime.rendererTileId;
    }

    getLiquidLevel(worldTileX?: number, worldTileY?: number): number {
      if (typeof worldTileX === 'number' && typeof worldTileY === 'number') {
        const mappedLiquidLevel = testRuntime.rendererLiquidLevelsByWorldKey.get(
          worldTileKey(worldTileX, worldTileY)
        );
        if (mappedLiquidLevel !== undefined) {
          return mappedLiquidLevel;
        }
      }
      return testRuntime.rendererLiquidLevel;
    }

    setTile(): boolean {
      const result = testRuntime.rendererSetTileResult;
      testRuntime.rendererSetTileResult = false;
      return result;
    }

    stepLiquidSimulation(): boolean {
      testRuntime.rendererStepLiquidSimulationCallCount += 1;
      testRuntime.fixedStepWorldUpdateOrder.push('liquids');
      return false;
    }

    getResidentChunkBounds() {
      return {
        minChunkX: 0,
        maxChunkX: 0,
        minChunkY: 0,
        maxChunkY: 0
      };
    }

    getLiquidRenderCardinalMask(): number | null {
      return testRuntime.rendererLiquidRenderCardinalMask;
    }

    createWorldSnapshot() {
      if (testRuntime.rendererWorldSnapshot === null) {
        throw new Error('expected renderer world snapshot');
      }
      return testRuntime.rendererWorldSnapshot;
    }

    loadWorldSnapshot(snapshot: ReturnType<TileWorld['createSnapshot']>): void {
      testRuntime.rendererLoadWorldSnapshotCallCount += 1;
      testRuntime.rendererWorldSnapshot = snapshot;
    }

    resetWorld(): void {}

    stepPlayerState<T>(state: T, fixedDt: number, intent: unknown): T {
      testRuntime.fixedStepWorldUpdateOrder.push('player');
      const playerState = state as {
        position?: { x?: number; y?: number };
        velocity?: { x?: number; y?: number };
        grounded?: boolean;
        facing?: 'left' | 'right';
      };
      const playerIntent = intent as { moveX?: number; jumpPressed?: boolean };
      testRuntime.rendererStepPlayerStateRequests.push({
        state: {
          position:
            playerState.position &&
            typeof playerState.position.x === 'number' &&
            typeof playerState.position.y === 'number'
              ? { x: playerState.position.x, y: playerState.position.y }
              : null,
          velocity:
            playerState.velocity &&
            typeof playerState.velocity.x === 'number' &&
            typeof playerState.velocity.y === 'number'
              ? { x: playerState.velocity.x, y: playerState.velocity.y }
              : null,
          grounded: typeof playerState.grounded === 'boolean' ? playerState.grounded : null,
          facing: playerState.facing ?? null
        },
        fixedDt,
        intent: {
          moveX: typeof playerIntent.moveX === 'number' ? playerIntent.moveX : null,
          jumpPressed:
            typeof playerIntent.jumpPressed === 'boolean' ? playerIntent.jumpPressed : null
        }
      });
      if (testRuntime.rendererStepPlayerStateImpl) {
        const steppedState = testRuntime.rendererStepPlayerStateImpl(state, fixedDt, intent);
        if (
          steppedState &&
          typeof steppedState === 'object' &&
          state &&
          typeof state === 'object' &&
          !Array.isArray(steppedState) &&
          !Array.isArray(state)
        ) {
          return {
            ...(state as Record<string, unknown>),
            ...(steppedState as Record<string, unknown>)
          } as T;
        }

        return steppedState as T;
      }
      return state;
    }
  }
}));

vi.mock('./input/controller', () => ({
  InputController: class {
    private touchMode: 'pan' | 'place' | 'break' = 'pan';
    private armedDesktopInspectPin = false;
    private armedFloodFillKind: 'place' | 'break' | null =
      testRuntime.initialArmedToolKinds.floodFillKind;
    private armedLineKind: 'place' | 'break' | null = testRuntime.initialArmedToolKinds.lineKind;
    private armedRectKind: 'place' | 'break' | null = testRuntime.initialArmedToolKinds.rectKind;
    private armedRectOutlineKind: 'place' | 'break' | null =
      testRuntime.initialArmedToolKinds.rectOutlineKind;
    private armedEllipseKind: 'place' | 'break' | null =
      testRuntime.initialArmedToolKinds.ellipseKind;
    private armedEllipseOutlineKind: 'place' | 'break' | null =
      testRuntime.initialArmedToolKinds.ellipseOutlineKind;

    constructor() {
      testRuntime.inputControllerConstructCount += 1;
      testRuntime.inputControllerInstance = this;
    }

    retainPointerInspectWhenLeavingToElement(): void {}

    getTouchDebugEditMode(): 'pan' | 'place' | 'break' {
      return this.touchMode;
    }

    setTouchDebugEditMode(mode: 'pan' | 'place' | 'break'): void {
      this.touchMode = mode;
    }

    getArmedDebugFloodFillKind(): 'place' | 'break' | null {
      return this.armedFloodFillKind;
    }

    setArmedDebugFloodFillKind(kind: 'place' | 'break' | null): void {
      this.armedFloodFillKind = kind;
    }

    getArmedDebugLineKind(): 'place' | 'break' | null {
      return this.armedLineKind;
    }

    setArmedDebugLineKind(kind: 'place' | 'break' | null): void {
      this.armedLineKind = kind;
    }

    getArmedDebugRectKind(): 'place' | 'break' | null {
      return this.armedRectKind;
    }

    setArmedDebugRectKind(kind: 'place' | 'break' | null): void {
      this.armedRectKind = kind;
    }

    getArmedDebugRectOutlineKind(): 'place' | 'break' | null {
      return this.armedRectOutlineKind;
    }

    setArmedDebugRectOutlineKind(kind: 'place' | 'break' | null): void {
      this.armedRectOutlineKind = kind;
    }

    getArmedDebugEllipseKind(): 'place' | 'break' | null {
      return this.armedEllipseKind;
    }

    setArmedDebugEllipseKind(kind: 'place' | 'break' | null): void {
      this.armedEllipseKind = kind;
    }

    getArmedDebugEllipseOutlineKind(): 'place' | 'break' | null {
      return this.armedEllipseOutlineKind;
    }

    setArmedDebugEllipseOutlineKind(kind: 'place' | 'break' | null): void {
      this.armedEllipseOutlineKind = kind;
    }

    cancelArmedDebugTools(): boolean {
      testRuntime.cancelArmedDebugToolsCallCount += 1;
      const hadArmedTools =
        this.armedDesktopInspectPin ||
        this.armedFloodFillKind !== null ||
        this.armedLineKind !== null ||
        this.armedRectKind !== null ||
        this.armedRectOutlineKind !== null ||
        this.armedEllipseKind !== null ||
        this.armedEllipseOutlineKind !== null;
      if (!hadArmedTools) return false;

      this.armedDesktopInspectPin = false;
      this.armedFloodFillKind = null;
      this.armedLineKind = null;
      this.armedRectKind = null;
      this.armedRectOutlineKind = null;
      this.armedEllipseKind = null;
      this.armedEllipseOutlineKind = null;
      return true;
    }

    getArmedDesktopDebugInspectPin(): boolean {
      return this.armedDesktopInspectPin;
    }

    setArmedDesktopDebugInspectPin(value: boolean): void {
      this.armedDesktopInspectPin = value;
    }

    setTouchPlayerMoveLeftHeld(): void {}

    setTouchPlayerMoveRightHeld(): void {}

    setTouchPlayerJumpHeld(): void {}

    update(): void {}

    getPointerInspect() {
      return testRuntime.pointerInspect;
    }

    getArmedDebugToolPreviewState() {
      return null;
    }

    getPlayerInputTelemetry() {
      return { ...testRuntime.playerMovementIntent };
    }

    consumeDebugTileEdits() {
      const edits = [...testRuntime.debugTileEdits];
      testRuntime.debugTileEdits = [];
      return edits;
    }

    consumeDebugFloodFillRequests() {
      return [];
    }

    consumeDebugLineRequests() {
      return [];
    }

    consumeDebugRectFillRequests() {
      return [];
    }

    consumeDebugRectOutlineRequests() {
      return [];
    }

    consumeDebugEllipseFillRequests() {
      return [];
    }

    consumeDebugEllipseOutlineRequests() {
      return [];
    }

    consumeDebugBrushEyedropperRequests() {
      return [];
    }

    consumeDebugTileInspectPinRequests() {
      const requests = [...testRuntime.debugTileInspectPinRequests];
      testRuntime.debugTileInspectPinRequests = [];
      return requests;
    }

    consumeCompletedDebugTileStrokes() {
      return [];
    }

    consumeDebugEditHistoryShortcutActions() {
      const actions = [...testRuntime.debugHistoryShortcutActions];
      testRuntime.debugHistoryShortcutActions = [];
      return actions;
    }

    getPlayerMovementIntent() {
      testRuntime.playerMovementIntentReadCount += 1;
      return {
        moveX: testRuntime.playerMovementIntent.moveX,
        jumpPressed: testRuntime.playerMovementIntent.jumpPressed
      };
    }
  },
  walkEllipseOutlineTileArea: () => {},
  walkFilledEllipseTileArea: () => {},
  walkFilledRectangleTileArea: () => {},
  walkRectangleOutlineTileArea: () => {},
  walkLineSteppedTilePath: () => {}
}));

vi.mock('./input/debugTileEditHistory', () => ({
  DebugTileEditHistory: class {
    constructor() {
      testRuntime.debugTileEditHistoryConstructCount += 1;
      const nextStatus = testRuntime.debugTileEditHistoryConstructorStatuses.shift();
      testRuntime.debugTileEditHistoryStatus = nextStatus
        ? { ...nextStatus }
        : {
            undoStrokeCount: 0,
            redoStrokeCount: 0
          };
    }

    getStatus() {
      return { ...testRuntime.debugTileEditHistoryStatus };
    }

    recordAppliedEdit(): void {}

    completeStroke(): boolean {
      return false;
    }

    undo(): boolean {
      testRuntime.debugHistoryUndoCallCount += 1;
      return false;
    }

    redo(): boolean {
      testRuntime.debugHistoryRedoCallCount += 1;
      return false;
    }
  }
}));

vi.mock('./ui/appShell', async () => {
  const actual = await vi.importActual<typeof import('./ui/appShell')>('./ui/appShell');

  return {
    ...actual,
    AppShell: class {
      stateHistory: unknown[] = [];
      currentState: unknown = null;
      options: Record<string, (screen: string) => void>;
      private worldHost = new testRuntime.FakeHTMLElement('div');

      constructor(_root: unknown, options: Record<string, (screen: string) => void>) {
        this.options = options;
        testRuntime.shellInstance = this;
      }

      setState(state: unknown): void {
        this.currentState = state;
        this.stateHistory.push(state);
      }

      getWorldHost(): InstanceType<typeof testRuntime.FakeHTMLElement> {
        return this.worldHost;
      }
    }
  };
});

vi.mock('./mainWorldSaveDownload', () => ({
  downloadWorldSaveEnvelope: vi.fn(({ envelope }: { envelope: unknown }) => {
    if (testRuntime.downloadWorldSaveError !== null) {
      throw testRuntime.downloadWorldSaveError;
    }
    testRuntime.downloadedWorldSaveEnvelopes.push(envelope);
    return testRuntime.downloadWorldSaveFilename;
  })
}));

vi.mock('./mainWorldSaveImport', async () => {
  const actual = await vi.importActual<typeof import('./mainWorldSaveImport')>('./mainWorldSaveImport');

  return {
    ...actual,
    pickWorldSaveEnvelopeFromJsonPicker: vi.fn(async () => {
      testRuntime.worldSaveImportCallCount += 1;
      return (testRuntime.queuedWorldSaveImportResults.shift() ?? {
        status: 'cancelled'
      }) as Awaited<ReturnType<typeof actual.pickWorldSaveEnvelopeFromJsonPicker>>;
    })
  };
});

vi.mock('./mainWorldSessionRestore', async () => {
  const actual =
    await vi.importActual<typeof import('./mainWorldSessionRestore')>('./mainWorldSessionRestore');

  return {
    ...actual,
    restoreWorldSessionFromSaveEnvelope: vi.fn(actual.restoreWorldSessionFromSaveEnvelope)
  };
});

vi.mock('./ui/debugOverlay', () => ({
  DebugOverlay: class {
    visible = false;

    constructor() {
      testRuntime.debugOverlayInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
      testRuntime.debugEditControlsSetVisibleCallCount += 1;
    }

    update(_frameDtMs: number, _stats: unknown, state: DebugOverlayInspectState): void {
      testRuntime.latestDebugOverlayInspectState = state;
    }
  }
}));

vi.mock('./ui/hoveredTileCursor', () => ({
  HoveredTileCursorOverlay: class {
    visible = false;

    constructor() {
      testRuntime.hoveredTileCursorInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(): void {}
  }
}));

vi.mock('./ui/armedDebugToolPreviewOverlay', () => ({
  ArmedDebugToolPreviewOverlay: class {
    visible = false;

    constructor() {
      testRuntime.armedDebugToolPreviewInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(): void {}
  }
}));

vi.mock('./ui/playerSpawnMarkerOverlay', () => ({
  PlayerSpawnMarkerOverlay: class {
    visible = false;

    constructor() {
      testRuntime.playerSpawnMarkerInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(): void {}
  }
}));

vi.mock('./ui/debugEditStatusStrip', () => ({
  DebugEditStatusStrip: class {
    visible = false;
    private retainer = new testRuntime.FakeHTMLElement('div');

    constructor() {
      testRuntime.debugEditStatusStripInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    getPointerInspectRetainerElement(): InstanceType<typeof testRuntime.FakeHTMLElement> {
      return this.retainer;
    }

    setActionHandlers(): void {}

    update(state: DebugEditStatusStripState): void {
      testRuntime.latestDebugEditStatusStripState = state;
    }
  }
}));

vi.mock('./ui/touchDebugEditControls', () => ({
  TouchDebugEditControls: class {
    visible = false;
    private collapsed = false;
    private brushTileId = 0;
    private mode: 'pan' | 'place' | 'break' = 'pan';
    private armedFloodFillKind: 'place' | 'break' | null = null;
    private armedLineKind: 'place' | 'break' | null = null;
    private armedRectKind: 'place' | 'break' | null = null;
    private armedRectOutlineKind: 'place' | 'break' | null = null;
    private armedEllipseKind: 'place' | 'break' | null = null;
    private armedEllipseOutlineKind: 'place' | 'break' | null = null;
    private onBrushTileIdChange: (tileId: number) => void;
    private onModeChange: (mode: 'pan' | 'place' | 'break') => void;
    private onCollapsedChange: (collapsed: boolean) => void;
    private onArmFloodFill: (kind: 'place' | 'break') => void;
    private onArmLine: (kind: 'place' | 'break') => void;
    private onArmRect: (kind: 'place' | 'break') => void;
    private onArmRectOutline: (kind: 'place' | 'break') => void;
    private onArmEllipse: (kind: 'place' | 'break') => void;
    private onArmEllipseOutline: (kind: 'place' | 'break') => void;
    private onUndo: () => void;
    private onRedo: () => void;
    private onResetPrefs: () => void;

    private syncArmedToolKinds(): void {
      testRuntime.debugEditControlsArmedToolKinds = {
        floodFillKind: this.armedFloodFillKind,
        lineKind: this.armedLineKind,
        rectKind: this.armedRectKind,
        rectOutlineKind: this.armedRectOutlineKind,
        ellipseKind: this.armedEllipseKind,
        ellipseOutlineKind: this.armedEllipseOutlineKind
      };
    }

    constructor(options: {
      initialBrushTileId?: number;
      onBrushTileIdChange?: (tileId: number) => void;
      initialMode?: 'pan' | 'place' | 'break';
      onModeChange?: (mode: 'pan' | 'place' | 'break') => void;
      initialArmedFloodFillKind?: 'place' | 'break' | null;
      initialArmedLineKind?: 'place' | 'break' | null;
      initialArmedRectKind?: 'place' | 'break' | null;
      initialArmedRectOutlineKind?: 'place' | 'break' | null;
      initialArmedEllipseKind?: 'place' | 'break' | null;
      initialArmedEllipseOutlineKind?: 'place' | 'break' | null;
      onArmFloodFill?: (kind: 'place' | 'break') => void;
      onArmLine?: (kind: 'place' | 'break') => void;
      onArmRect?: (kind: 'place' | 'break') => void;
      onArmRectOutline?: (kind: 'place' | 'break') => void;
      onArmEllipse?: (kind: 'place' | 'break') => void;
      onArmEllipseOutline?: (kind: 'place' | 'break') => void;
      initialCollapsed?: boolean;
      onCollapsedChange?: (collapsed: boolean) => void;
      initialHistoryState?: {
        undoStrokeCount: number;
        redoStrokeCount: number;
      };
      onUndo?: () => void;
      onRedo?: () => void;
      onResetPrefs?: () => void;
    }) {
      this.brushTileId = options.initialBrushTileId ?? 0;
      this.mode = options.initialMode ?? 'pan';
      this.collapsed = options.initialCollapsed ?? false;
      this.armedFloodFillKind = options.initialArmedFloodFillKind ?? null;
      this.armedLineKind = options.initialArmedLineKind ?? null;
      this.armedRectKind = options.initialArmedRectKind ?? null;
      this.armedRectOutlineKind = options.initialArmedRectOutlineKind ?? null;
      this.armedEllipseKind = options.initialArmedEllipseKind ?? null;
      this.armedEllipseOutlineKind = options.initialArmedEllipseOutlineKind ?? null;
      this.onBrushTileIdChange = options.onBrushTileIdChange ?? (() => {});
      this.onModeChange = options.onModeChange ?? (() => {});
      this.onCollapsedChange = options.onCollapsedChange ?? (() => {});
      this.onArmFloodFill = options.onArmFloodFill ?? (() => {});
      this.onArmLine = options.onArmLine ?? (() => {});
      this.onArmRect = options.onArmRect ?? (() => {});
      this.onArmRectOutline = options.onArmRectOutline ?? (() => {});
      this.onArmEllipse = options.onArmEllipse ?? (() => {});
      this.onArmEllipseOutline = options.onArmEllipseOutline ?? (() => {});
      this.onUndo = options.onUndo ?? (() => {});
      this.onRedo = options.onRedo ?? (() => {});
      this.onResetPrefs = options.onResetPrefs ?? (() => {});
      testRuntime.debugEditControlsInitialPreferenceSnapshot = {
        touchMode: this.mode,
        brushTileId: this.brushTileId,
        panelCollapsed: this.collapsed
      };
      testRuntime.debugEditControlsInitialHistoryState = {
        undoStrokeCount: options.initialHistoryState?.undoStrokeCount ?? 0,
        redoStrokeCount: options.initialHistoryState?.redoStrokeCount ?? 0
      };
      testRuntime.debugEditControlsInitialArmedToolSnapshot = {
        floodFillKind: this.armedFloodFillKind,
        lineKind: this.armedLineKind,
        rectKind: this.armedRectKind,
        rectOutlineKind: this.armedRectOutlineKind,
        ellipseKind: this.armedEllipseKind,
        ellipseOutlineKind: this.armedEllipseOutlineKind
      };
      this.syncArmedToolKinds();
      testRuntime.debugEditControlsInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    getMode(): 'pan' | 'place' | 'break' {
      return this.mode;
    }

    setMode(mode: 'pan' | 'place' | 'break'): void {
      if (this.mode === mode) return;
      this.mode = mode;
      this.onModeChange(mode);
    }

    getBrushTileId(): number {
      return this.brushTileId;
    }

    setBrushTileId(tileId: number): void {
      if (this.brushTileId === tileId) return;
      this.brushTileId = tileId;
      this.onBrushTileIdChange(tileId);
    }

    setCollapsed(collapsed: boolean): void {
      if (this.collapsed === collapsed) return;
      this.collapsed = collapsed;
      this.onCollapsedChange(collapsed);
    }

    isCollapsed(): boolean {
      return this.collapsed;
    }

    triggerArmFloodFill(kind: 'place' | 'break'): void {
      this.onArmFloodFill(kind);
    }

    triggerArmLine(kind: 'place' | 'break'): void {
      this.onArmLine(kind);
    }

    triggerArmRect(kind: 'place' | 'break'): void {
      this.onArmRect(kind);
    }

    triggerArmRectOutline(kind: 'place' | 'break'): void {
      this.onArmRectOutline(kind);
    }

    triggerArmEllipse(kind: 'place' | 'break'): void {
      this.onArmEllipse(kind);
    }

    triggerArmEllipseOutline(kind: 'place' | 'break'): void {
      this.onArmEllipseOutline(kind);
    }

    triggerUndo(): void {
      this.onUndo();
    }

    triggerRedo(): void {
      this.onRedo();
    }

    triggerResetPrefs(): void {
      this.onResetPrefs();
    }

    setHistoryState(historyState: { undoStrokeCount: number; redoStrokeCount: number }): void {
      testRuntime.debugEditControlsSetHistoryStateCallCount += 1;
      testRuntime.debugEditControlsLatestHistoryState = {
        undoStrokeCount: historyState.undoStrokeCount,
        redoStrokeCount: historyState.redoStrokeCount
      };
    }

    setArmedFloodFillKind(kind: 'place' | 'break' | null): void {
      this.armedFloodFillKind = kind;
      testRuntime.debugEditControlsArmedToolSetterCallCount += 1;
      this.syncArmedToolKinds();
    }

    setArmedLineKind(kind: 'place' | 'break' | null): void {
      this.armedLineKind = kind;
      testRuntime.debugEditControlsArmedToolSetterCallCount += 1;
      this.syncArmedToolKinds();
    }

    setArmedRectKind(kind: 'place' | 'break' | null): void {
      this.armedRectKind = kind;
      testRuntime.debugEditControlsArmedToolSetterCallCount += 1;
      this.syncArmedToolKinds();
    }

    setArmedRectOutlineKind(kind: 'place' | 'break' | null): void {
      this.armedRectOutlineKind = kind;
      testRuntime.debugEditControlsArmedToolSetterCallCount += 1;
      this.syncArmedToolKinds();
    }

    setArmedEllipseKind(kind: 'place' | 'break' | null): void {
      this.armedEllipseKind = kind;
      testRuntime.debugEditControlsArmedToolSetterCallCount += 1;
      this.syncArmedToolKinds();
    }

    setArmedEllipseOutlineKind(kind: 'place' | 'break' | null): void {
      this.armedEllipseOutlineKind = kind;
      testRuntime.debugEditControlsArmedToolSetterCallCount += 1;
      this.syncArmedToolKinds();
    }
  }
}));

const flushBootstrap = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const runFixedUpdate = (fixedDt = 1000 / 60): void => {
  testRuntime.gameLoopFixedUpdate?.(fixedDt);
};
const runRenderFrame = (frameDtMs = 1000 / 60, alpha = 0): void => {
  testRuntime.gameLoopRender?.(alpha, frameDtMs);
};

const readPersistedShellState = (): ReturnType<typeof createDefaultWorldSessionShellState> =>
  JSON.parse(
    testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ??
      JSON.stringify(createDefaultWorldSessionShellState())
  );
const readPersistedWorldSaveEnvelope = (): ReturnType<typeof createWorldSaveEnvelope> | null => {
  const rawEnvelope = testRuntime.storageValues.get(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY) ?? null;
  return rawEnvelope === null ? null : JSON.parse(rawEnvelope);
};
const readPersistedDebugEditControlState = (): Record<string, unknown> =>
  JSON.parse(testRuntime.storageValues.get(DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY) ?? '{}');

const dispatchKeydown = (
  key: string,
  code = '',
  overrides: Partial<{
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    defaultPrevented: boolean;
    target: unknown;
  }> = {}
) => {
  let prevented = false;
  const event = {
    key,
    code,
    ctrlKey: false,
    metaKey: false,
    shiftKey: key === '?' || code === 'Slash',
    altKey: false,
    defaultPrevented: false,
    target: null,
    preventDefault: () => {
      prevented = true;
    },
    ...overrides
  };

  const keydownListeners = testRuntime.windowListeners.get('keydown') ?? [];
  for (const listener of keydownListeners) {
    listener(event);
  }

  return {
    prevented
  };
};

const dispatchWindowEvent = (type: string, event: unknown = {}): void => {
  const listeners = testRuntime.windowListeners.get(type) ?? [];
  for (const listener of listeners) {
    listener(event);
  }
};

const readArmedToolKinds = () => ({
  floodFillKind: testRuntime.inputControllerInstance?.getArmedDebugFloodFillKind() ?? null,
  lineKind: testRuntime.inputControllerInstance?.getArmedDebugLineKind() ?? null,
  rectKind: testRuntime.inputControllerInstance?.getArmedDebugRectKind() ?? null,
  rectOutlineKind: testRuntime.inputControllerInstance?.getArmedDebugRectOutlineKind() ?? null,
  ellipseKind: testRuntime.inputControllerInstance?.getArmedDebugEllipseKind() ?? null,
  ellipseOutlineKind: testRuntime.inputControllerInstance?.getArmedDebugEllipseOutlineKind() ?? null
});

const createExpectedPausedMainMenuState = (
  options: Partial<{
    worldSessionShellState: ReturnType<typeof createDefaultWorldSessionShellState>;
    persistenceAvailable: boolean;
    exportResult: PausedMainMenuExportResult;
    importResult: PausedMainMenuImportResult;
    worldSaveCleared: boolean;
  }> = {}
) => {
  const shellActionKeybindingLoad = loadShellActionKeybindingStateWithDefaultFallbackStatus({
    getItem: (key) => testRuntime.storageValues.get(key) ?? null,
    setItem: () => {}
  });

  return createMainMenuShellState(
    true,
    options.worldSessionShellState ??
      (testRuntime.storageValues.has(WORLD_SESSION_SHELL_STATE_STORAGE_KEY)
        ? readPersistedShellState()
        : createDefaultWorldSessionShellState()),
    options.persistenceAvailable ?? true,
    shellActionKeybindingLoad.state,
    shellActionKeybindingLoad.defaultedFromPersistedState,
    options.importResult ?? null,
    options.worldSaveCleared ?? false,
    options.exportResult ?? null
  );
};

const createExpectedFirstLaunchMainMenuState = () => ({
  screen: 'main-menu',
  statusText: 'Renderer ready.',
  detailLines: [],
  menuSections: [
    {
      title: 'Enter World',
      lines: ['Start the fixed-step simulation, standalone player, and live in-world controls.'],
      tone: 'accent'
    },
    {
      title: 'Mixed-Device Runtime',
      lines: [
        'Desktop keeps movement, zoom, pan, and debug editing on the same world session.',
        'Touch keeps the on-screen edit controls and player pad aligned with that same runtime state.'
      ]
    }
  ],
  primaryActionLabel: 'Enter World',
  secondaryActionLabel: null,
  tertiaryActionLabel: null
});
const createTestPlayerSpawnPoint = ({
  anchorTileX = 0,
  standingTileY = 0,
  x = 8,
  y = 0,
  supportTileX = anchorTileX,
  supportTileY = standingTileY,
  supportTileId = 1
}: Partial<{
  anchorTileX: number;
  standingTileY: number;
  x: number;
  y: number;
  supportTileX: number;
  supportTileY: number;
  supportTileId: number;
}> = {}) => ({
  anchorTileX,
  standingTileY,
  x,
  y,
  aabb: {
    minX: x - 6,
    minY: y - 28,
    maxX: x + 6,
    maxY: y
  },
  support: {
    tileX: supportTileX,
    tileY: supportTileY,
    tileId: supportTileId
  }
});

describe('main.ts shell state orchestration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();

    testRuntime.appRoot = new testRuntime.FakeHTMLElement('div');
    testRuntime.cameraInstance = null;
    testRuntime.windowListeners.clear();
    testRuntime.shellInstance = null;
    testRuntime.initialArmedToolKinds = {
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    };
    testRuntime.inputControllerInstance = null;
    testRuntime.inputControllerConstructCount = 0;
    testRuntime.pointerInspect = null;
    testRuntime.debugOverlayInstance = null;
    testRuntime.debugEditControlsInitialPreferenceSnapshot = null;
    testRuntime.debugEditControlsInitialHistoryState = null;
    testRuntime.debugEditControlsLatestHistoryState = null;
    testRuntime.debugEditControlsSetVisibleCallCount = 0;
    testRuntime.debugEditControlsSetHistoryStateCallCount = 0;
    testRuntime.debugEditControlsArmedToolSetterCallCount = 0;
    testRuntime.debugEditControlsInitialArmedToolSnapshot = null;
    testRuntime.debugEditControlsArmedToolKinds = null;
    testRuntime.debugEditControlsInstance = null;
    testRuntime.hoveredTileCursorInstance = null;
    testRuntime.armedDebugToolPreviewInstance = null;
    testRuntime.debugEditStatusStripInstance = null;
    testRuntime.playerSpawnMarkerInstance = null;
    testRuntime.rendererConstructorError = null;
    testRuntime.rendererInitializeError = null;
    testRuntime.rendererConstructCount = 0;
    testRuntime.rendererInstance = null;
    testRuntime.rendererLoadWorldSnapshotCallCount = 0;
    testRuntime.gameLoopFixedUpdate = null;
    testRuntime.gameLoopRender = null;
    testRuntime.performanceNow = 1000;
    testRuntime.debugTileEditHistoryConstructCount = 0;
    testRuntime.debugTileEditHistoryConstructorStatuses = [];
    testRuntime.debugTileEditHistoryStatus = {
      undoStrokeCount: 0,
      redoStrokeCount: 0
    };
    testRuntime.debugHistoryUndoCallCount = 0;
    testRuntime.debugHistoryRedoCallCount = 0;
    testRuntime.debugHistoryShortcutActions = [];
    testRuntime.cancelArmedDebugToolsCallCount = 0;
    testRuntime.playerMovementIntentReadCount = 0;
    testRuntime.playerMovementIntent = {
      moveX: 0,
      jumpHeld: false,
      jumpPressed: false
    };
    testRuntime.fixedStepWorldUpdateOrder = [];
    testRuntime.debugTileEdits = [];
    testRuntime.rendererTileId = 0;
    testRuntime.rendererTileIdsByWorldKey.clear();
    testRuntime.rendererLiquidLevel = 0;
    testRuntime.rendererLiquidLevelsByWorldKey.clear();
    testRuntime.rendererLiquidRenderCardinalMask = null;
    testRuntime.rendererSetTileResult = false;
    testRuntime.rendererStepLiquidSimulationCallCount = 0;
    testRuntime.rendererStepPlayerStateImpl = null;
    testRuntime.rendererStepPlayerStateRequests = [];
    testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl = null;
    testRuntime.rendererPlayerCollisionContactsQueue = [];
    testRuntime.rendererPlayerCollisionContactRequestStates = [];
    testRuntime.rendererTelemetry.atlasWidth = null;
    testRuntime.rendererTelemetry.atlasHeight = null;
    testRuntime.rendererTelemetry.residentDirtyLightChunks = 0;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightLevel = null;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightFactor = null;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceTileX = null;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceTileY = null;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceChunkX = null;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceChunkY = null;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceLocalTileX = null;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceLocalTileY = null;
    testRuntime.latestRendererRenderFrameState = null;
    testRuntime.latestDebugOverlayInspectState = null;
    testRuntime.latestDebugEditStatusStripState = null;
    testRuntime.rendererWorldSnapshot = new TileWorld(0).createSnapshot();
    testRuntime.rendererPlayerSpawnLiquidSafetyStatus = 'safe';
    testRuntime.debugTileInspectPinRequests = [];
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint();
    testRuntime.gameLoopStartCount = 0;
    testRuntime.storageValues.clear();
    testRuntime.storageSetItemErrorsByKey.clear();
    testRuntime.downloadedWorldSaveEnvelopes = [];
    testRuntime.downloadWorldSaveFilename = 'deep-factory-world-save-2026-03-08T05-06-07Z.json';
    testRuntime.downloadWorldSaveError = null;
    testRuntime.queuedWorldSaveImportResults = [];
    testRuntime.worldSaveImportCallCount = 0;

    vi.stubGlobal('HTMLElement', testRuntime.FakeHTMLElement);
    vi.stubGlobal('navigator', { maxTouchPoints: 0 });
    vi.stubGlobal('document', {
      querySelector: (selector: string) => (selector === '#app' ? testRuntime.appRoot : null),
      createElement: (tagName: string) => new testRuntime.FakeHTMLElement(tagName)
    });
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => testRuntime.storageValues.get(key) ?? null,
        setItem: (key: string, value: string) => {
          const writeError = testRuntime.storageSetItemErrorsByKey.get(key);
          if (writeError) {
            throw writeError;
          }
          testRuntime.storageValues.set(key, value);
        },
        removeItem: (key: string) => {
          testRuntime.storageValues.delete(key);
        }
      },
      matchMedia: () => ({
        matches: false
      }),
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        const listeners = testRuntime.windowListeners.get(type) ?? [];
        listeners.push(listener);
        testRuntime.windowListeners.set(type, listeners);
      },
      removeEventListener: () => {}
    });
    vi.stubGlobal('performance', {
      now: () => testRuntime.performanceNow
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes WebGL-unavailable bootstrap failures through the explicit boot shell helper', async () => {
    testRuntime.rendererConstructorError = new Error('webgl unavailable');

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createWebGlUnavailableBootShellState());
    expect(testRuntime.debugOverlayInstance).toBeNull();
    expect(testRuntime.debugEditControlsInstance).toBeNull();
    expect(testRuntime.gameLoopStartCount).toBe(0);
  });

  it('routes the initial bootstrap loading copy through the explicit default boot shell helper', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.stateHistory[0]).toEqual(createDefaultBootShellState());
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());
    expect(testRuntime.gameLoopStartCount).toBe(0);
  });

  it('routes renderer initialization failures through the explicit boot shell helper', async () => {
    testRuntime.rendererInitializeError = new Error('GPU device lost');

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createRendererInitializationFailedBootShellState(new Error('GPU device lost'))
    );
    expect(testRuntime.gameLoopStartCount).toBe(0);
  });

  it('boots into the paused main menu when a persisted world-session save exists', async () => {
    const persistedWorld = new TileWorld(0);
    expect(persistedWorld.setTile(5, -20, 6)).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: persistedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 72, y: 96 },
            velocity: { x: -14, y: 28 },
            grounded: false,
            facing: 'left',
            health: 62,
            lavaDamageTickSecondsRemaining: 0.5
          }),
          cameraFollowOffset: { x: 18, y: -12 }
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
    expect(testRuntime.rendererLoadWorldSnapshotCallCount).toBe(1);
    expect(testRuntime.gameLoopStartCount).toBe(0);

    const loadedWorld = new TileWorld(0);
    loadedWorld.loadSnapshot(testRuntime.rendererWorldSnapshot!);
    expect(loadedWorld.getTile(5, -20)).toBe(6);
    expect(testRuntime.latestRendererRenderFrameState?.standalonePlayerCurrentPosition).toEqual({
      x: 72,
      y: 96
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });

  it('hydrates persisted shell toggles on the first Enter World transition before in-world input changes them', async () => {
    const persistedShellState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    };
    testRuntime.storageValues.set(
      WORLD_SESSION_SHELL_STATE_STORAGE_KEY,
      JSON.stringify(persistedShellState)
    );

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState(persistedShellState));
    expect(readPersistedShellState()).toEqual(persistedShellState);
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(true);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(true);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(true);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });

  it('falls back to default-off shell toggles on the first Enter World transition when persisted preferences are invalid', async () => {
    testRuntime.storageValues.set(
      WORLD_SESSION_SHELL_STATE_STORAGE_KEY,
      JSON.stringify({
        debugOverlayVisible: 'yes',
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: true
      })
    );

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });

  it('boots the first Enter World transition with all shell overlays hidden when shell-toggle local storage is inaccessible', async () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage access denied');
      }
    });

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());
    expect(testRuntime.storageValues.size).toBe(0);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });

  it('shows session-only paused-menu shell persistence status when shell-toggle local storage is inaccessible', async () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage access denied');
      }
    });

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('h').prevented).toBe(true);
    expect(dispatchKeydown('?', 'Slash').prevented).toBe(true);
    expect(testRuntime.storageValues.size).toBe(0);

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: {
          debugOverlayVisible: true,
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: false,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: true
        },
        persistenceAvailable: false
      })
    );
  });

  it('uses the shared main-menu shell-state selector for first-launch bootstrap and paused-session returns', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createMainMenuShellState(false));

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createMainMenuShellState(true));
  });

  it('switches the shared shortcut context between first-launch main menu, in-world, and paused main menu states', async () => {
    await import('./main');
    await flushBootstrap();

    expect(dispatchKeydown('Enter').prevented).toBe(false);
    expect(dispatchKeydown('q').prevented).toBe(false);
    expect(dispatchKeydown('h').prevented).toBe(false);
    expect(dispatchKeydown('?', 'Slash').prevented).toBe(false);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('h').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({ debugOverlayVisible: true })
    );
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
    expect(dispatchKeydown('h').prevented).toBe(false);
    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({ debugOverlayVisible: true })
    );
  });

  it('routes keyboard and fixed-step undo and redo through one shared debug-history dispatcher', async () => {
    await import('./main');
    await flushBootstrap();

    expect(dispatchKeydown('z', 'KeyZ', { ctrlKey: true }).prevented).toBe(false);
    expect(dispatchKeydown('y', 'KeyY', { ctrlKey: true }).prevented).toBe(false);
    expect(testRuntime.debugHistoryUndoCallCount).toBe(0);
    expect(testRuntime.debugHistoryRedoCallCount).toBe(0);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('z', 'KeyZ', { ctrlKey: true }).prevented).toBe(true);
    expect(dispatchKeydown('y', 'KeyY', { ctrlKey: true }).prevented).toBe(true);
    testRuntime.debugHistoryShortcutActions = ['undo', 'redo'];

    runFixedUpdate();

    expect(testRuntime.debugHistoryUndoCallCount).toBe(2);
    expect(testRuntime.debugHistoryRedoCallCount).toBe(2);
    expect(testRuntime.debugHistoryShortcutActions).toEqual([]);
  });

  it('routes keyboard armed-tool shortcuts through one shared dispatcher for arming and cancel', async () => {
    await import('./main');
    await flushBootstrap();

    expect(dispatchKeydown('f', 'KeyF').prevented).toBe(false);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('f', 'KeyF').prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: 'place',
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    expect(dispatchKeydown('n', 'KeyN', { shiftKey: true }).prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: 'break',
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    expect(dispatchKeydown('r', 'KeyR').prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: 'place',
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    expect(dispatchKeydown('t', 'KeyT', { shiftKey: true }).prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: 'break',
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    expect(dispatchKeydown('e', 'KeyE').prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: 'place',
      ellipseOutlineKind: null
    });

    expect(dispatchKeydown('o', 'KeyO', { shiftKey: true }).prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: 'break'
    });

    expect(dispatchKeydown('Escape').prevented).toBe(true);
    expect(testRuntime.cancelArmedDebugToolsCallCount).toBe(1);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
  });

  it('routes repeated same-tool armed-tool shortcuts through one shared toggle helper for arm and disarm state', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('f', 'KeyF').prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: 'place',
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());

    expect(dispatchKeydown('f', 'KeyF').prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());

    expect(dispatchKeydown('o', 'KeyO', { shiftKey: true }).prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: 'break'
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());

    expect(dispatchKeydown('o', 'KeyO', { shiftKey: true }).prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());
  });

  it('routes touch-control armed-tool callbacks through one shared toggle callback factory', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugEditControlsInstance).not.toBeNull();
    if (!testRuntime.debugEditControlsInstance) {
      throw new Error('expected debug edit controls instance');
    }

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.debugEditControlsInstance.triggerArmFloodFill('place');
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: 'place',
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());

    testRuntime.debugEditControlsInstance.triggerArmFloodFill('place');
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());

    testRuntime.debugEditControlsInstance.triggerArmRectOutline('break');
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: 'break',
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());

    testRuntime.debugEditControlsInstance.triggerArmEllipse('place');
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: 'place',
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());
  });

  it('routes touch-control bootstrap through one shared helper for construction plus visibility, history, armed-tool, and persistence sync', async () => {
    testRuntime.initialArmedToolKinds = {
      floodFillKind: 'place',
      lineKind: 'break',
      rectKind: 'place',
      rectOutlineKind: 'break',
      ellipseKind: 'place',
      ellipseOutlineKind: 'break'
    };
    testRuntime.debugTileEditHistoryConstructorStatuses = [
      {
        undoStrokeCount: 2,
        redoStrokeCount: 1
      }
    ];

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugEditControlsInitialPreferenceSnapshot).toEqual({
      touchMode: 'pan',
      brushTileId: 3,
      panelCollapsed: false
    });
    expect(testRuntime.debugEditControlsInitialHistoryState).toEqual({
      undoStrokeCount: 2,
      redoStrokeCount: 1
    });
    expect(testRuntime.debugEditControlsLatestHistoryState).toEqual({
      undoStrokeCount: 2,
      redoStrokeCount: 1
    });
    expect(testRuntime.debugEditControlsSetVisibleCallCount).toBeGreaterThan(0);
    expect(testRuntime.debugEditControlsSetHistoryStateCallCount).toBeGreaterThan(0);
    expect(testRuntime.debugEditControlsArmedToolSetterCallCount).toBe(6);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: 'place',
      lineKind: 'break',
      rectKind: 'place',
      rectOutlineKind: 'break',
      ellipseKind: 'place',
      ellipseOutlineKind: 'break'
    });
    expect(testRuntime.debugEditControlsInitialArmedToolSnapshot).toEqual({
      floodFillKind: 'place',
      lineKind: 'break',
      rectKind: 'place',
      rectOutlineKind: 'break',
      ellipseKind: 'place',
      ellipseOutlineKind: 'break'
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual({
      floodFillKind: 'place',
      lineKind: 'break',
      rectKind: 'place',
      rectOutlineKind: 'break',
      ellipseKind: 'place',
      ellipseOutlineKind: 'break'
    });
    expect(testRuntime.storageValues.has(DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY)).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'pan',
      brushTileId: 3,
      panelCollapsed: false
    });

    expect(testRuntime.debugEditControlsInstance).not.toBeNull();
    if (!testRuntime.debugEditControlsInstance) {
      throw new Error('expected debug edit controls instance');
    }

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.debugEditControlsInstance.triggerArmLine('place');
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: 'place',
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());

    testRuntime.debugEditControlsInstance.triggerUndo();
    testRuntime.debugEditControlsInstance.triggerRedo();
    expect(testRuntime.debugHistoryUndoCallCount).toBe(1);
    expect(testRuntime.debugHistoryRedoCallCount).toBe(1);

    testRuntime.debugEditControlsInstance.triggerResetPrefs();
    expect(testRuntime.storageValues.has(DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY)).toBe(false);
    expect(testRuntime.debugEditControlsInstance.getMode()).toBe('pan');
    expect(testRuntime.debugEditControlsInstance.getBrushTileId()).toBe(3);
    expect(testRuntime.debugEditControlsInstance.isCollapsed()).toBe(false);
  });

  it('routes paused-menu New World debug-edit reset through one shared fresh-world helper for history replacement and armed-tool sync', async () => {
    testRuntime.initialArmedToolKinds = {
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: 'break',
      ellipseKind: null,
      ellipseOutlineKind: null
    };
    testRuntime.debugTileEditHistoryConstructorStatuses = [
      {
        undoStrokeCount: 3,
        redoStrokeCount: 1
      }
    ];

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugEditControlsLatestHistoryState).toEqual({
      undoStrokeCount: 3,
      redoStrokeCount: 1
    });
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: 'break',
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    const historyConstructCountBeforeReset = testRuntime.debugTileEditHistoryConstructCount;
    const historySyncCountBeforeReset = testRuntime.debugEditControlsSetHistoryStateCallCount;
    const armedToolSetterCountBeforeReset = testRuntime.debugEditControlsArmedToolSetterCallCount;

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.shellInstance?.options.onSenaryAction('main-menu');

    expect(testRuntime.debugTileEditHistoryConstructCount).toBe(historyConstructCountBeforeReset + 1);
    expect(testRuntime.debugEditControlsSetHistoryStateCallCount).toBe(historySyncCountBeforeReset + 1);
    expect(testRuntime.debugEditControlsLatestHistoryState).toEqual({
      undoStrokeCount: 0,
      redoStrokeCount: 0
    });
    expect(testRuntime.cancelArmedDebugToolsCallCount).toBe(1);
    expect(testRuntime.debugEditControlsArmedToolSetterCallCount).toBe(
      armedToolSetterCountBeforeReset + 6
    );
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
  });

  it('routes paused-menu New World camera and player reset through one shared fresh-world helper for follow offset, zoom, and spawn refresh', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.cameraInstance).not.toBeNull();
    if (!testRuntime.cameraInstance) {
      throw new Error('expected camera instance');
    }

    testRuntime.cameraInstance.x = 120;
    testRuntime.cameraInstance.y = 45;
    testRuntime.cameraInstance.zoom = 3.5;
    runFixedUpdate();

    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 5,
      standingTileY: 4,
      x: 88,
      y: 64
    });

    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.shellInstance?.options.onSenaryAction('main-menu');

    expect(testRuntime.cameraInstance.x).toBe(88);
    expect(testRuntime.cameraInstance.y).toBe(50);
    expect(testRuntime.cameraInstance.zoom).toBe(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());

    testRuntime.cameraInstance.x = -20;
    testRuntime.cameraInstance.y = 10;
    testRuntime.shellInstance?.options.onRecenterCamera('in-world');
    expect(testRuntime.cameraInstance.x).toBe(88);
    expect(testRuntime.cameraInstance.y).toBe(50);
  });

  it('keeps standalone-player render snapshots snapped to the fresh spawn on the first render after paused-menu New World reset', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const movedPlayerState = {
      position: { x: 152, y: 92 },
      velocity: { x: 84, y: -24 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'right' as const,
      health: 100,
      lavaDamageTickSecondsRemaining: 0.5
    };

    testRuntime.rendererStepPlayerStateImpl = () => movedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, noContacts];

    runFixedUpdate();

    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 5,
      standingTileY: 4,
      x: 88,
      y: 64,
      supportTileX: 5,
      supportTileY: 5,
      supportTileId: 9
    });

    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.latestRendererRenderFrameState = null;
    testRuntime.shellInstance?.options.onSenaryAction('main-menu');
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    if (!testRuntime.latestRendererRenderFrameState) {
      throw new Error('expected renderer frame state after paused-menu New World reset');
    }
    const renderFrameState = testRuntime.latestRendererRenderFrameState as {
      standalonePlayerPreviousPosition: { x: number; y: number } | null;
      standalonePlayerCurrentPosition: { x: number; y: number } | null;
      standalonePlayerInterpolatedPosition: { x: number; y: number } | null;
    };

    expect(renderFrameState.standalonePlayerPreviousPosition).toEqual({
      x: 88,
      y: 64
    });
    expect(renderFrameState.standalonePlayerCurrentPosition).toEqual({
      x: 88,
      y: 64
    });
    expect(renderFrameState.standalonePlayerInterpolatedPosition).toEqual({
      x: 88,
      y: 64
    });
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
  });

  it('clears standalone-player snapshot-owned wall, ceiling, and bonk presentation on the first render after paused-menu New World reset', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: -2,
        tileY: -1,
        tileId: 3,
        side: 'left' as const
      },
      ceiling: {
        tileX: -1,
        tileY: -3,
        tileId: 4
      }
    };
    const airbornePlayerState = {
      position: { x: -12, y: -10 },
      velocity: { x: -48, y: 96 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.performanceNow = 1500;
    testRuntime.rendererStepPlayerStateImpl = () => airbornePlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, blockedContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (
      !testRuntime.latestRendererRenderFrameState ||
      !testRuntime.latestDebugOverlayInspectState ||
      !testRuntime.latestDebugEditStatusStripState
    ) {
      throw new Error('expected stale blocked presentation before paused-menu New World reset');
    }
    const preResetRenderFrameState = testRuntime.latestRendererRenderFrameState as {
      standalonePlayerWallContact:
        | { tileX: number; tileY: number; tileId: number; side: 'left' | 'right' }
        | null;
      standalonePlayerCeilingContact: { tileX: number; tileY: number; tileId: number } | null;
      standalonePlayerCeilingBonkHoldUntilTimeMs: number | null;
    };

    expect(preResetRenderFrameState.standalonePlayerWallContact).toEqual(blockedContacts.wall);
    expect(preResetRenderFrameState.standalonePlayerCeilingContact).toEqual(
      blockedContacts.ceiling
    );
    expect(preResetRenderFrameState.standalonePlayerCeilingBonkHoldUntilTimeMs).toBe(
      1500 + STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS
    );
    expect(testRuntime.latestDebugOverlayInspectState.playerPlaceholderPoseLabel).toBe(
      'ceiling-bonk'
    );
    expect(testRuntime.latestDebugEditStatusStripState.playerPlaceholderPoseLabel).toBe(
      'ceiling-bonk'
    );
    expect(testRuntime.latestDebugOverlayInspectState.playerCeilingBonkHoldActive).toBe(true);
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(true);

    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 5,
      standingTileY: 4,
      x: 88,
      y: 64,
      supportTileX: 5,
      supportTileY: 5,
      supportTileId: 9
    });
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts];
    testRuntime.latestRendererRenderFrameState = null;
    testRuntime.shellInstance?.options.onSenaryAction('main-menu');
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (
      !testRuntime.latestRendererRenderFrameState ||
      !testRuntime.latestDebugOverlayInspectState ||
      !testRuntime.latestDebugEditStatusStripState
    ) {
      throw new Error('expected cleared presentation after paused-menu New World reset');
    }
    const postResetRenderFrameState = testRuntime.latestRendererRenderFrameState as {
      standalonePlayerWallContact:
        | { tileX: number; tileY: number; tileId: number; side: 'left' | 'right' }
        | null;
      standalonePlayerCeilingContact: { tileX: number; tileY: number; tileId: number } | null;
      standalonePlayerCeilingBonkHoldUntilTimeMs: number | null;
    };

    expect(postResetRenderFrameState.standalonePlayerWallContact).toBeNull();
    expect(postResetRenderFrameState.standalonePlayerCeilingContact).toBeNull();
    expect(postResetRenderFrameState.standalonePlayerCeilingBonkHoldUntilTimeMs).toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState.playerPlaceholderPoseLabel).toBe(
      'grounded-idle'
    );
    expect(testRuntime.latestDebugEditStatusStripState.playerPlaceholderPoseLabel).toBe(
      'grounded-idle'
    );
    expect(testRuntime.latestDebugOverlayInspectState.playerCeilingBonkHoldActive).toBe(false);
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
  });

  it('routes bootstrap spawn initialization, lava respawn, and embedded respawn recovery through one shared standalone-player transition-reset helper', async () => {
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 0,
      standingTileY: -1,
      x: 8,
      y: -16,
      supportTileX: 0,
      supportTileY: 0
    });

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const transitionedPlayerState = {
      position: { x: -12, y: -10 },
      velocity: { x: -48, y: -90 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.rendererStepPlayerStateImpl = () => transitionedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [
      noContacts,
      {
        support: null,
        wall: {
          tileX: -2,
          tileY: -1,
          tileId: 3,
          side: 'left'
        },
        ceiling: {
          tileX: -1,
          tileY: -3,
          tileId: 4
        }
      },
      noContacts
    ];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after transition step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'fall',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -2,
        y: -1,
        id: 3,
        side: 'left'
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -1,
        y: -3,
        id: 4
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(true);

    testRuntime.rendererStepPlayerStateImpl = () => ({
      position: { x: 24, y: 12 },
      velocity: { x: 18, y: 96 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const,
      health: 0,
      lavaDamageTickSecondsRemaining: 0.5
    });
    testRuntime.rendererPlayerSpawnLiquidSafetyStatus = 'overlap';
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after lava respawn');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn).toMatchObject({
      kind: 'lava',
      spawnTile: {
        x: 0,
        y: -1
      },
      supportChunk: {
        x: 0,
        y: 0
      },
      supportLocal: {
        x: 0,
        y: 0
      },
      supportTileId: 1,
      liquidSafetyStatus: 'overlap',
      position: {
        x: 8,
        y: -16
      },
      velocity: {
        x: 0,
        y: 0
      }
    });
    expect(testRuntime.latestDebugOverlayInspectState?.playerRespawn).toMatchObject({
      kind: 'lava',
      spawnTile: {
        x: 0,
        y: -1
      },
      supportChunk: {
        x: 0,
        y: 0
      },
      supportLocal: {
        x: 0,
        y: 0
      },
      supportTileId: 1,
      liquidSafetyStatus: 'overlap'
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);

    const respawnedPlayerState = {
      position: { x: 104, y: 496 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 28 },
      grounded: true,
      facing: 'right' as const
    };
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 6,
      standingTileY: 31,
      x: 104,
      y: 496,
      supportTileX: 6,
      supportTileY: 32,
      supportTileId: 9
    });
    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: 6,
        worldTileY: 5,
        kind: 'place'
      }
    ];
    testRuntime.rendererSetTileResult = true;
    testRuntime.rendererPlayerSpawnLiquidSafetyStatus = 'safe';
    testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl = () => respawnedPlayerState;
    testRuntime.rendererStepPlayerStateImpl = (state) => state;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after embedded respawn');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn).toMatchObject({
      kind: 'embedded',
      spawnTile: {
        x: 6,
        y: 31
      },
      supportChunk: {
        x: 0,
        y: 1
      },
      supportLocal: {
        x: 6,
        y: 0
      },
      supportTileId: 9,
      liquidSafetyStatus: 'safe',
      position: respawnedPlayerState.position,
      velocity: respawnedPlayerState.velocity
    });
    expect(testRuntime.latestDebugOverlayInspectState?.playerRespawn).toMatchObject({
      kind: 'embedded',
      spawnTile: {
        x: 6,
        y: 31
      },
      supportChunk: {
        x: 0,
        y: 1
      },
      supportLocal: {
        x: 6,
        y: 0
      },
      supportTileId: 9,
      liquidSafetyStatus: 'safe'
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);
  });

  it('keeps standalone-player render snapshots snapped to the new spawn across lava respawn and embedded recovery interpolation resets', async () => {
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 0,
      standingTileY: -1,
      x: 8,
      y: -16,
      supportTileX: 0,
      supportTileY: 0
    });

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const movedPlayerState = {
      position: { x: 40, y: 32 },
      velocity: { x: 96, y: -48 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'right' as const,
      health: 100,
      lavaDamageTickSecondsRemaining: 0.5
    };

    testRuntime.rendererStepPlayerStateImpl = () => movedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, noContacts];

    runFixedUpdate();

    testRuntime.rendererStepPlayerStateImpl = () => ({
      position: { x: 56, y: 28 },
      velocity: { x: 18, y: 96 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'right' as const,
      health: 0,
      lavaDamageTickSecondsRemaining: 0.5
    });
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, noContacts];

    runFixedUpdate();
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    if (!testRuntime.latestRendererRenderFrameState) {
      throw new Error('expected renderer frame state after lava respawn');
    }

    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerPreviousPosition).toEqual({
      x: 8,
      y: -16
    });
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerCurrentPosition).toEqual({
      x: 8,
      y: -16
    });
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerInterpolatedPosition).toEqual({
      x: 8,
      y: -16
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerRespawn?.kind).toBe('lava');

    const movedRecoveredPlayerState = {
      position: { x: 144, y: 80 },
      velocity: { x: 72, y: 0 },
      size: { width: 12, height: 28 },
      grounded: true,
      facing: 'right' as const,
      health: 100,
      lavaDamageTickSecondsRemaining: 0.5
    };
    testRuntime.rendererStepPlayerStateImpl = () => movedRecoveredPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, noContacts];

    runFixedUpdate();

    const embeddedRespawnedPlayerState = {
      position: { x: 104, y: 496 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 28 },
      grounded: true,
      facing: 'right' as const
    };
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 6,
      standingTileY: 31,
      x: 104,
      y: 496,
      supportTileX: 6,
      supportTileY: 32,
      supportTileId: 9
    });
    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: 6,
        worldTileY: 5,
        kind: 'place'
      }
    ];
    testRuntime.rendererSetTileResult = true;
    testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl = () =>
      embeddedRespawnedPlayerState;
    testRuntime.rendererStepPlayerStateImpl = (state) => state;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, noContacts];

    runFixedUpdate();
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    if (!testRuntime.latestRendererRenderFrameState) {
      throw new Error('expected renderer frame state after embedded recovery');
    }

    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerPreviousPosition).toEqual(
      embeddedRespawnedPlayerState.position
    );
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerCurrentPosition).toEqual(
      embeddedRespawnedPlayerState.position
    );
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerInterpolatedPosition).toEqual(
      embeddedRespawnedPlayerState.position
    );
    expect(testRuntime.latestDebugEditStatusStripState?.playerRespawn?.kind).toBe('embedded');
  });

  it('routes standalone-player fixed-step transition updates and ceiling-bonk latching through one shared post-step commit helper', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: -2,
        tileY: -1,
        tileId: 3,
        side: 'left' as const
      },
      ceiling: {
        tileX: -1,
        tileY: -3,
        tileId: 4
      }
    };
    const transitionedPlayerState = {
      position: { x: -12, y: -10 },
      velocity: { x: -48, y: -90 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.performanceNow = 1500;
    testRuntime.rendererStepPlayerStateImpl = () => transitionedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, blockedContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after blocked transition step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'fall',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -2,
        y: -1,
        id: 3,
        side: 'left'
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -1,
        y: -3,
        id: 4
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(true);

    testRuntime.performanceNow =
      1500 + STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS - 1;
    testRuntime.rendererStepPlayerStateImpl = (state) => state;
    testRuntime.rendererPlayerCollisionContactsQueue = [blockedContacts, noContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after cleared transition step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'fall',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'cleared',
      tile: {
        x: -2,
        y: -1,
        id: 3,
        side: 'left'
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'cleared',
      tile: {
        x: -1,
        y: -3,
        id: 4
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(true);

    testRuntime.performanceNow += 2;
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after bonk-hold expiry');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);
  });

  it('routes standalone-player fixed-step transition resolution through one shared pre-commit snapshot helper', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: 2,
        tileY: -1,
        tileId: 7,
        side: 'right' as const
      },
      ceiling: {
        tileX: 1,
        tileY: -3,
        tileId: 8
      }
    };
    const jumpedPlayerState = {
      position: { x: 20, y: -6 },
      velocity: { x: 96, y: -240 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.playerMovementIntent = {
      moveX: -1,
      jumpHeld: true,
      jumpPressed: true
    };
    testRuntime.rendererStepPlayerStateImpl = () => jumpedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, blockedContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after jump transition step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'jump',
      position: jumpedPlayerState.position,
      velocity: jumpedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: jumpedPlayerState.position,
      velocity: jumpedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: 2,
        y: -1,
        id: 7,
        side: 'right'
      },
      position: jumpedPlayerState.position,
      velocity: jumpedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: 1,
        y: -3,
        id: 8
      },
      position: jumpedPlayerState.position,
      velocity: jumpedPlayerState.velocity
    });

    testRuntime.playerMovementIntent = {
      moveX: 0,
      jumpHeld: false,
      jumpPressed: false
    };
    testRuntime.rendererStepPlayerStateImpl = (state) => state;
    testRuntime.rendererPlayerCollisionContactsQueue = [blockedContacts, noContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after cleared-contact step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'jump',
      position: jumpedPlayerState.position,
      velocity: jumpedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: jumpedPlayerState.position,
      velocity: jumpedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'cleared',
      tile: {
        x: 2,
        y: -1,
        id: 7,
        side: 'right'
      },
      position: jumpedPlayerState.position,
      velocity: jumpedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'cleared',
      tile: {
        x: 1,
        y: -3,
        id: 8
      },
      position: jumpedPlayerState.position,
      velocity: jumpedPlayerState.velocity
    });
  });

  it('routes standalone-player fixed-step contact sampling through one shared pre/post-step helper', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const previousContacts = {
      support: {
        tileX: 0,
        tileY: 0,
        tileId: 1
      },
      wall: null,
      ceiling: null
    };
    const nextContacts = {
      support: null,
      wall: {
        tileX: 2,
        tileY: -1,
        tileId: 9,
        side: 'right' as const
      },
      ceiling: {
        tileX: 1,
        tileY: -3,
        tileId: 10
      }
    };
    const steppedPlayerState = {
      position: { x: 24, y: -12 },
      velocity: { x: 120, y: -180 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'right' as const
    };

    testRuntime.rendererPlayerCollisionContactRequestStates = [];
    testRuntime.rendererStepPlayerStateImpl = () => steppedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [previousContacts, nextContacts, nextContacts];

    runFixedUpdate();

    expect(testRuntime.rendererPlayerCollisionContactRequestStates).toEqual([
      {
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        facing: 'right'
      },
      {
        position: steppedPlayerState.position,
        velocity: steppedPlayerState.velocity,
        grounded: steppedPlayerState.grounded,
        facing: steppedPlayerState.facing
      }
    ]);

    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after sampled-contact step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: 2,
        y: -1,
        id: 9,
        side: 'right'
      },
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: 1,
        y: -3,
        id: 10
      },
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
  });

  it('routes standalone-player fixed-step next-state, contact, and transition assembly through one shared result helper', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: -3,
        tileY: -1,
        tileId: 11,
        side: 'left' as const
      },
      ceiling: {
        tileX: -2,
        tileY: -3,
        tileId: 12
      }
    };
    const steppedPlayerState = {
      position: { x: -24, y: -16 },
      velocity: { x: -120, y: -260 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.playerMovementIntent = {
      moveX: -1,
      jumpHeld: true,
      jumpPressed: true
    };
    testRuntime.rendererStepPlayerStateRequests = [];
    testRuntime.rendererPlayerCollisionContactRequestStates = [];
    testRuntime.rendererStepPlayerStateImpl = () => steppedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, blockedContacts, noContacts];

    runFixedUpdate(20);

    expect(testRuntime.rendererStepPlayerStateRequests).toEqual([
      {
        state: {
          position: { x: 8, y: 0 },
          velocity: { x: 0, y: 0 },
          grounded: true,
          facing: 'right'
        },
        fixedDt: 20,
        intent: {
          moveX: -1,
          jumpPressed: true
        }
      }
    ]);
    expect(testRuntime.rendererPlayerCollisionContactRequestStates).toEqual([
      {
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        facing: 'right'
      },
      {
        position: steppedPlayerState.position,
        velocity: steppedPlayerState.velocity,
        grounded: steppedPlayerState.grounded,
        facing: steppedPlayerState.facing
      }
    ]);

    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after shared-result step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'jump',
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -3,
        y: -1,
        id: 11,
        side: 'left'
      },
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -2,
        y: -3,
        id: 12
      },
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
  });

  it('routes standalone-player fixed-step state apply, transition commit, and camera follow through one shared post-result helper', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.cameraInstance).not.toBeNull();
    if (!testRuntime.cameraInstance) {
      throw new Error('expected camera instance');
    }

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: 4,
        tileY: -1,
        tileId: 13,
        side: 'right' as const
      },
      ceiling: {
        tileX: 3,
        tileY: -3,
        tileId: 14
      }
    };
    const steppedPlayerState = {
      position: { x: 40, y: 20 },
      velocity: { x: 132, y: -200 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.playerMovementIntent = {
      moveX: -1,
      jumpHeld: true,
      jumpPressed: true
    };
    testRuntime.rendererStepPlayerStateImpl = () => steppedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, blockedContacts, noContacts];

    runFixedUpdate();

    expect(testRuntime.cameraInstance.x).toBe(40);
    expect(testRuntime.cameraInstance.y).toBe(6);

    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after shared apply step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerWorldPosition).toEqual(
      steppedPlayerState.position
    );
    expect(testRuntime.latestDebugEditStatusStripState.playerCameraWorldPosition).toEqual({
      x: 8,
      y: -14
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'jump',
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: 4,
        y: -1,
        id: 13,
        side: 'right'
      },
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: 3,
        y: -3,
        id: 14
      },
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
  });

  it('routes standalone-player fixed-step intent read, result creation, and result apply through one shared update helper', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.cameraInstance).not.toBeNull();
    if (!testRuntime.cameraInstance) {
      throw new Error('expected camera instance');
    }

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: -5,
        tileY: -2,
        tileId: 21,
        side: 'left' as const
      },
      ceiling: {
        tileX: -4,
        tileY: -4,
        tileId: 22
      }
    };
    const steppedPlayerState = {
      position: { x: 40, y: 20 },
      velocity: { x: -144, y: -220 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.playerMovementIntent = {
      moveX: -1,
      jumpHeld: true,
      jumpPressed: true
    };
    testRuntime.playerMovementIntentReadCount = 0;
    testRuntime.rendererStepPlayerStateRequests = [];
    testRuntime.rendererPlayerCollisionContactRequestStates = [];
    testRuntime.rendererStepPlayerStateImpl = () => steppedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, blockedContacts, noContacts];

    runFixedUpdate(20);

    expect(testRuntime.playerMovementIntentReadCount).toBe(1);
    expect(testRuntime.rendererStepPlayerStateRequests).toEqual([
      {
        state: {
          position: { x: 8, y: 0 },
          velocity: { x: 0, y: 0 },
          grounded: true,
          facing: 'right'
        },
        fixedDt: 20,
        intent: {
          moveX: -1,
          jumpPressed: true
        }
      }
    ]);
    expect(testRuntime.rendererPlayerCollisionContactRequestStates).toEqual([
      {
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        facing: 'right'
      },
      {
        position: steppedPlayerState.position,
        velocity: steppedPlayerState.velocity,
        grounded: steppedPlayerState.grounded,
        facing: steppedPlayerState.facing
      }
    ]);
    expect(testRuntime.cameraInstance.x).toBe(40);
    expect(testRuntime.cameraInstance.y).toBe(6);

    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after shared update step');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerWorldPosition).toEqual(
      steppedPlayerState.position
    );
    expect(testRuntime.latestDebugEditStatusStripState.playerCameraWorldPosition).toEqual({
      x: 8,
      y: -14
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'jump',
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -5,
        y: -2,
        id: 21,
        side: 'left'
      },
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -4,
        y: -4,
        id: 22
      },
      position: steppedPlayerState.position,
      velocity: steppedPlayerState.velocity
    });
  });

  it('steps resident liquid simulation before standalone-player fixed-step movement while in-world', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.fixedStepWorldUpdateOrder = [];
    testRuntime.rendererStepLiquidSimulationCallCount = 0;

    runFixedUpdate(20);

    expect(testRuntime.rendererStepLiquidSimulationCallCount).toBe(1);
    expect(testRuntime.fixedStepWorldUpdateOrder).toEqual(['liquids', 'player']);
  });

  it('routes standalone-player entity snapshots, render alpha, and render-frame camera follow through the renderer entity pass while overlay telemetry stays on current player state', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(testRuntime.cameraInstance).not.toBeNull();
    if (!testRuntime.cameraInstance) {
      throw new Error('expected camera instance');
    }

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const steppedPlayerState = {
      position: { x: 40, y: 32 },
      velocity: { x: 96, y: -48 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'right' as const,
      health: 100,
      lavaDamageTickSecondsRemaining: 0.5
    };

    testRuntime.rendererStepPlayerStateImpl = () => steppedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, noContacts];
    testRuntime.latestRendererRenderFrameState = null;

    runFixedUpdate();
    runRenderFrame(1000 / 60, 0.25);

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (
      !testRuntime.latestRendererRenderFrameState ||
      !testRuntime.latestDebugOverlayInspectState ||
      !testRuntime.latestDebugEditStatusStripState
    ) {
      throw new Error('expected latest renderer, overlay, and status-strip state');
    }

    const renderFrameState = testRuntime.latestRendererRenderFrameState as {
      standalonePlayerPosition: { x: number; y: number } | null;
      standalonePlayerPreviousPosition: { x: number; y: number } | null;
      standalonePlayerCurrentPosition: { x: number; y: number } | null;
      standalonePlayerWallContact:
        | { tileX: number; tileY: number; tileId: number; side: 'left' | 'right' }
        | null;
      standalonePlayerCeilingContact: { tileX: number; tileY: number; tileId: number } | null;
      standalonePlayerCeilingBonkHoldUntilTimeMs: number | null;
      renderAlpha: number | null;
      timeMs: number | null;
    };
    const overlay = testRuntime.latestDebugOverlayInspectState;
    const statusStrip = testRuntime.latestDebugEditStatusStripState;

    expect(renderFrameState.standalonePlayerPosition).toEqual(steppedPlayerState.position);
    expect(renderFrameState.standalonePlayerPreviousPosition).toEqual({ x: 8, y: 0 });
    expect(renderFrameState.standalonePlayerCurrentPosition).toEqual(steppedPlayerState.position);
    expect(renderFrameState.renderAlpha).toBe(0.25);
    expect(overlay.player?.position).toEqual(steppedPlayerState.position);
    expect(statusStrip.playerWorldPosition).toEqual(steppedPlayerState.position);
    expect(testRuntime.cameraInstance.x).toBe(16);
    expect(testRuntime.cameraInstance.y).toBe(-6);
    expect(statusStrip.playerCameraWorldPosition).toEqual({
      x: 16,
      y: -6
    });
  });

  it('submits standalone-player wall, ceiling, and bonk presentation through the current entity snapshot', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: -2,
        tileY: -1,
        tileId: 3,
        side: 'left' as const
      },
      ceiling: {
        tileX: -1,
        tileY: -3,
        tileId: 4
      }
    };
    const steppedPlayerState = {
      position: { x: -12, y: -10 },
      velocity: { x: -48, y: -90 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.performanceNow = 1500;
    testRuntime.rendererStepPlayerStateImpl = () => steppedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, blockedContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    if (!testRuntime.latestRendererRenderFrameState) {
      throw new Error('expected latest renderer frame state after blocked-contact step');
    }

    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerWallContact).toEqual(
      blockedContacts.wall
    );
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerCeilingContact).toEqual(
      blockedContacts.ceiling
    );
    expect(
      testRuntime.latestRendererRenderFrameState.standalonePlayerCeilingBonkHoldUntilTimeMs
    ).toBe(1500 + STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS);
  });

  it('routes standalone-player render-frame player, nearby-light, contact, and camera telemetry through shared snapshot helpers for the overlay and status strip', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.cameraInstance).not.toBeNull();
    if (!testRuntime.cameraInstance) {
      throw new Error('expected camera instance');
    }

    testRuntime.cameraInstance.zoom = 1.75;

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const renderContacts = {
      support: {
        tileX: -2,
        tileY: 3,
        tileId: 31
      },
      wall: {
        tileX: -1,
        tileY: 2,
        tileId: 32,
        side: 'left' as const
      },
      ceiling: {
        tileX: -2,
        tileY: 1,
        tileId: 33
      }
    };
    const steppedPlayerState = {
      position: { x: -24, y: 48 },
      velocity: { x: -120, y: 64 },
      size: { width: 12, height: 28 },
      grounded: true,
      facing: 'left' as const
    };

    testRuntime.playerMovementIntent = {
      moveX: -1,
      jumpHeld: true,
      jumpPressed: false
    };
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightLevel = 12;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightFactor = 0.8;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceTileX = -33;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceTileY = -1;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceChunkX = -5;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceChunkY = 4;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceLocalTileX = 9;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceLocalTileY = 10;
    testRuntime.rendererStepPlayerStateImpl = () => steppedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, renderContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest overlay and status-strip telemetry');
    }

    const overlay = testRuntime.latestDebugOverlayInspectState;
    const strip = testRuntime.latestDebugEditStatusStripState;

    expect(overlay.player?.position).toEqual(strip.playerWorldPosition);
    expect(overlay.player?.velocity).toEqual({
      x: strip.playerVelocityX,
      y: strip.playerVelocityY
    });
    expect(overlay.player?.aabb.min).toEqual(strip.playerAabb?.min ?? null);
    expect(overlay.player?.aabb.max).toEqual(strip.playerAabb?.max ?? null);
    expect(overlay.player?.grounded).toBe(strip.playerGrounded);
    expect(overlay.player?.facing).toBe(strip.playerFacing);
    expect(overlay.playerPlaceholderPoseLabel).toBe(strip.playerPlaceholderPoseLabel);
    expect(overlay.playerIntent).toEqual({
      moveX: strip.playerMoveX,
      jumpHeld: strip.playerJumpHeld,
      jumpPressed: strip.playerJumpPressed
    });
    expect(overlay.playerCameraFollow?.cameraPosition).toEqual(strip.playerCameraWorldPosition);
    expect(overlay.playerCameraFollow?.cameraTile).toEqual(strip.playerCameraWorldTile);
    expect(overlay.playerCameraFollow?.cameraLocal).toEqual(strip.playerCameraWorldLocalTile);
    expect(overlay.playerCameraFollow?.cameraZoom).toBe(strip.playerCameraZoom);
    expect(overlay.playerCameraFollow?.focus).toEqual(strip.playerCameraFocusPoint);
    expect(overlay.playerCameraFollow?.focusTile).toEqual(strip.playerCameraFocusTile);
    expect(overlay.playerCameraFollow?.focusChunk).toEqual(strip.playerCameraFocusChunk);
    expect(overlay.playerCameraFollow?.focusLocal).toEqual(strip.playerCameraFocusLocalTile);
    expect(overlay.playerCameraFollow?.offset).toEqual(strip.playerCameraFollowOffset);
    expect(overlay.playerNearbyLightLevel).toBe(strip.playerNearbyLightLevel);
    expect(overlay.playerNearbyLightFactor).toBe(strip.playerNearbyLightFactor);
    expect(overlay.playerNearbyLightSourceTile).toEqual(strip.playerNearbyLightSourceTile);
    expect(overlay.playerNearbyLightSourceChunk).toEqual(strip.playerNearbyLightSourceChunk);
    expect(overlay.playerNearbyLightSourceLocalTile).toEqual(strip.playerNearbyLightSourceLocalTile);
    expect(overlay.playerNearbyLightLevel).toBe(12);
    expect(overlay.playerNearbyLightFactor).toBe(0.8);
    expect(overlay.playerNearbyLightSourceTile).toEqual({
      x: -33,
      y: -1
    });
    expect(overlay.playerNearbyLightSourceChunk).toEqual({
      x: -5,
      y: 4
    });
    expect(overlay.playerNearbyLightSourceLocalTile).toEqual({
      x: 9,
      y: 10
    });
    expect(overlay.player?.contacts.support).toEqual(renderContacts.support);
    expect(overlay.player?.contacts.wall).toEqual(renderContacts.wall);
    expect(overlay.player?.contacts.ceiling).toEqual(renderContacts.ceiling);
    expect(strip.playerSupportContact).toEqual({
      tile: {
        x: renderContacts.support.tileX,
        y: renderContacts.support.tileY,
        id: renderContacts.support.tileId
      }
    });
    expect(strip.playerWallContact).toEqual({
      tile: {
        x: renderContacts.wall.tileX,
        y: renderContacts.wall.tileY,
        id: renderContacts.wall.tileId,
        side: renderContacts.wall.side
      }
    });
    expect(strip.playerCeilingContact).toEqual({
      tile: {
        x: renderContacts.ceiling.tileX,
        y: renderContacts.ceiling.tileY,
        id: renderContacts.ceiling.tileId
      }
    });
  });

  it('keeps standalone-player pose labels aligned with snapshot-owned wall, ceiling, and bonk presentation when live contact telemetry diverges between fixed ticks', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: -2,
        tileY: -1,
        tileId: 3,
        side: 'left' as const
      },
      ceiling: {
        tileX: -1,
        tileY: -3,
        tileId: 4
      }
    };
    const wallOnlyContacts = {
      support: null,
      wall: {
        tileX: -2,
        tileY: -1,
        tileId: 3,
        side: 'left' as const
      },
      ceiling: null
    };
    const divergentLiveContacts = {
      support: {
        tileX: 5,
        tileY: 4,
        tileId: 41
      },
      wall: null,
      ceiling: null
    };
    const airbornePlayerState = {
      position: { x: -12, y: -10 },
      velocity: { x: -48, y: 96 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.rendererStepPlayerStateImpl = () => airbornePlayerState;

    testRuntime.performanceNow = 1500;
    testRuntime.rendererPlayerCollisionContactsQueue = [
      noContacts,
      blockedContacts,
      divergentLiveContacts
    ];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (
      !testRuntime.latestRendererRenderFrameState ||
      !testRuntime.latestDebugOverlayInspectState ||
      !testRuntime.latestDebugEditStatusStripState
    ) {
      throw new Error('expected latest renderer, overlay, and status-strip state after blocked step');
    }

    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerWallContact).toEqual(
      blockedContacts.wall
    );
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerCeilingContact).toEqual(
      blockedContacts.ceiling
    );
    expect(testRuntime.latestDebugOverlayInspectState.playerPlaceholderPoseLabel).toBe(
      'ceiling-bonk'
    );
    expect(testRuntime.latestDebugEditStatusStripState.playerPlaceholderPoseLabel).toBe(
      'ceiling-bonk'
    );
    expect(testRuntime.latestDebugOverlayInspectState.playerCeilingBonkHoldActive).toBe(true);
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(true);
    expect(testRuntime.latestDebugOverlayInspectState.player?.contacts).toEqual(divergentLiveContacts);
    expect(testRuntime.latestDebugEditStatusStripState.playerSupportContact).toEqual({
      tile: {
        x: divergentLiveContacts.support.tileX,
        y: divergentLiveContacts.support.tileY,
        id: divergentLiveContacts.support.tileId
      }
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContact).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContact).toBeNull();

    testRuntime.performanceNow =
      1500 + STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS - 1;
    testRuntime.rendererPlayerCollisionContactsQueue = [
      blockedContacts,
      wallOnlyContacts,
      divergentLiveContacts
    ];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (
      !testRuntime.latestRendererRenderFrameState ||
      !testRuntime.latestDebugOverlayInspectState ||
      !testRuntime.latestDebugEditStatusStripState
    ) {
      throw new Error('expected latest renderer, overlay, and status-strip state before bonk expiry');
    }

    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerWallContact).toEqual(
      wallOnlyContacts.wall
    );
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerCeilingContact).toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState.playerPlaceholderPoseLabel).toBe(
      'ceiling-bonk'
    );
    expect(testRuntime.latestDebugEditStatusStripState.playerPlaceholderPoseLabel).toBe(
      'ceiling-bonk'
    );
    expect(testRuntime.latestDebugOverlayInspectState.playerCeilingBonkHoldActive).toBe(true);
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(true);
    expect(testRuntime.latestDebugOverlayInspectState.player?.contacts).toEqual(divergentLiveContacts);
    expect(testRuntime.latestDebugEditStatusStripState.playerSupportContact).toEqual({
      tile: {
        x: divergentLiveContacts.support.tileX,
        y: divergentLiveContacts.support.tileY,
        id: divergentLiveContacts.support.tileId
      }
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContact).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContact).toBeNull();

    testRuntime.performanceNow += 2;
    testRuntime.rendererPlayerCollisionContactsQueue = [divergentLiveContacts];

    runRenderFrame();

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (
      !testRuntime.latestRendererRenderFrameState ||
      !testRuntime.latestDebugOverlayInspectState ||
      !testRuntime.latestDebugEditStatusStripState
    ) {
      throw new Error('expected latest renderer, overlay, and status-strip state after bonk expiry');
    }

    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerWallContact).toEqual(
      wallOnlyContacts.wall
    );
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerCeilingContact).toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState.playerPlaceholderPoseLabel).toBe('wall-slide');
    expect(testRuntime.latestDebugEditStatusStripState.playerPlaceholderPoseLabel).toBe(
      'wall-slide'
    );
    expect(testRuntime.latestDebugOverlayInspectState.playerCeilingBonkHoldActive).toBe(false);
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);
    expect(testRuntime.latestDebugOverlayInspectState.player?.contacts).toEqual(divergentLiveContacts);
    expect(testRuntime.latestDebugEditStatusStripState.playerSupportContact).toEqual({
      tile: {
        x: divergentLiveContacts.support.tileX,
        y: divergentLiveContacts.support.tileY,
        id: divergentLiveContacts.support.tileId
      }
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContact).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContact).toBeNull();
  });

  it("routes the latest resolved spawn's support chunk, local, and liquid-safety telemetry into the overlay and compact status strip", async () => {
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: -4,
      standingTileY: -2,
      x: -56,
      y: -32,
      supportTileX: -5,
      supportTileY: -1,
      supportTileId: 7
    });
    testRuntime.rendererPlayerSpawnLiquidSafetyStatus = 'overlap';

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest overlay and status-strip spawn telemetry');
    }

    expect(testRuntime.latestDebugOverlayInspectState.spawn).toEqual({
      tile: { x: -4, y: -2 },
      world: { x: -56, y: -32 },
      supportTile: {
        x: -5,
        y: -1,
        id: 7,
        chunk: { x: -1, y: -1 },
        local: { x: 27, y: 31 }
      },
      liquidSafetyStatus: 'overlap'
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerSpawn).toEqual({
      tile: { x: -4, y: -2 },
      world: { x: -56, y: -32 },
      supportTile: {
        x: -5,
        y: -1,
        id: 7,
        chunk: { x: -1, y: -1 },
        local: { x: 27, y: 31 }
      },
      liquidSafetyStatus: 'overlap'
    });
  });

  it('surfaces resolved liquid surface and visible frame heights through hovered and pinned inspect telemetry', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 4, y: 6 }
    };
    testRuntime.debugTileInspectPinRequests = [
      {
        worldTileX: 4,
        worldTileY: 6
      }
    ];
    testRuntime.performanceNow = 240;
    testRuntime.rendererTileId = 0;
    testRuntime.rendererLiquidLevel = 0;
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(4, 6), 8);
    testRuntime.rendererLiquidLevelsByWorldKey.set(worldTileKey(4, 6), 3);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(3, 6), 8);
    testRuntime.rendererLiquidLevelsByWorldKey.set(worldTileKey(3, 6), 5);
    testRuntime.rendererLiquidRenderCardinalMask = 11;
    testRuntime.rendererTelemetry.atlasWidth = 96;
    testRuntime.rendererTelemetry.atlasHeight = 64;

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest overlay and status-strip inspect telemetry');
    }

    expect(testRuntime.latestDebugOverlayInspectState.pointer).toMatchObject({
      tile: { x: 4, y: 6 },
      tileId: 8,
      liquidKind: 'lava',
      liquidLevel: 3,
      liquidSurfaceNorthLevel: 0,
      liquidSurfaceWestLevel: 5,
      liquidSurfaceCenterLevel: 3,
      liquidSurfaceEastLevel: 0,
      liquidSurfaceBranch: 'exposed',
      liquidSurfaceTopLeft: 0.5,
      liquidSurfaceTopRight: 0.375,
      liquidFrameTopV: 0.75,
      liquidFrameTopPixelY: 48,
      liquidFrameBottomV: 0.875,
      liquidFrameBottomPixelY: 56,
      liquidFrameHeightV: 0.125,
      liquidFramePixelHeight: 8,
      liquidBottomLeftV: 0.8125,
      liquidBottomRightV: 0.796875,
      liquidBottomLeftPixelY: 52,
      liquidBottomRightPixelY: 51,
      liquidVisibleLeftV: 0.0625,
      liquidVisibleRightV: 0.046875,
      liquidVisibleLeftPercentage: 50,
      liquidVisibleRightPercentage: 37.5,
      liquidVisibleLeftPixelHeight: 4,
      liquidVisibleRightPixelHeight: 3,
      liquidRemainderLeftV: 0.0625,
      liquidRemainderRightV: 0.078125,
      liquidRemainderLeftPercentage: 50,
      liquidRemainderRightPercentage: 62.5,
      liquidRemainderLeftPixelHeight: 4,
      liquidRemainderRightPixelHeight: 5,
      liquidCoverageLeftTotalPercentage: 100,
      liquidCoverageRightTotalPercentage: 100,
      liquidCoverageLeftTotalPixelHeight: 8,
      liquidCoverageRightTotalPixelHeight: 8
    });
    expect(testRuntime.latestDebugOverlayInspectState.pinned).toMatchObject({
      tile: { x: 4, y: 6 },
      tileId: 8,
      liquidKind: 'lava',
      liquidLevel: 3,
      liquidSurfaceNorthLevel: 0,
      liquidSurfaceWestLevel: 5,
      liquidSurfaceCenterLevel: 3,
      liquidSurfaceEastLevel: 0,
      liquidSurfaceBranch: 'exposed',
      liquidSurfaceTopLeft: 0.5,
      liquidSurfaceTopRight: 0.375,
      liquidFrameTopV: 0.75,
      liquidFrameTopPixelY: 48,
      liquidFrameBottomV: 0.875,
      liquidFrameBottomPixelY: 56,
      liquidFrameHeightV: 0.125,
      liquidFramePixelHeight: 8,
      liquidBottomLeftV: 0.8125,
      liquidBottomRightV: 0.796875,
      liquidBottomLeftPixelY: 52,
      liquidBottomRightPixelY: 51,
      liquidVisibleLeftV: 0.0625,
      liquidVisibleRightV: 0.046875,
      liquidVisibleLeftPercentage: 50,
      liquidVisibleRightPercentage: 37.5,
      liquidVisibleLeftPixelHeight: 4,
      liquidVisibleRightPixelHeight: 3,
      liquidRemainderLeftV: 0.0625,
      liquidRemainderRightV: 0.078125,
      liquidRemainderLeftPercentage: 50,
      liquidRemainderRightPercentage: 62.5,
      liquidRemainderLeftPixelHeight: 4,
      liquidRemainderRightPixelHeight: 5,
      liquidCoverageLeftTotalPercentage: 100,
      liquidCoverageRightTotalPercentage: 100,
      liquidCoverageLeftTotalPixelHeight: 8,
      liquidCoverageRightTotalPixelHeight: 8
    });
    expect(testRuntime.latestDebugEditStatusStripState.hoveredTile).toMatchObject({
      tileX: 4,
      tileY: 6,
      tileId: 8,
      liquidKind: 'lava',
      liquidLevel: 3,
      liquidSurfaceNorthLevel: 0,
      liquidSurfaceWestLevel: 5,
      liquidSurfaceCenterLevel: 3,
      liquidSurfaceEastLevel: 0,
      liquidSurfaceBranch: 'exposed',
      liquidSurfaceTopLeft: 0.5,
      liquidSurfaceTopRight: 0.375,
      liquidFrameTopV: 0.75,
      liquidFrameTopPixelY: 48,
      liquidFrameBottomV: 0.875,
      liquidFrameBottomPixelY: 56,
      liquidFrameHeightV: 0.125,
      liquidFramePixelHeight: 8,
      liquidBottomLeftV: 0.8125,
      liquidBottomRightV: 0.796875,
      liquidBottomLeftPixelY: 52,
      liquidBottomRightPixelY: 51,
      liquidVisibleLeftV: 0.0625,
      liquidVisibleRightV: 0.046875,
      liquidVisibleLeftPercentage: 50,
      liquidVisibleRightPercentage: 37.5,
      liquidVisibleLeftPixelHeight: 4,
      liquidVisibleRightPixelHeight: 3,
      liquidRemainderLeftV: 0.0625,
      liquidRemainderRightV: 0.078125,
      liquidRemainderLeftPercentage: 50,
      liquidRemainderRightPercentage: 62.5,
      liquidRemainderLeftPixelHeight: 4,
      liquidRemainderRightPixelHeight: 5,
      liquidCoverageLeftTotalPercentage: 100,
      liquidCoverageRightTotalPercentage: 100,
      liquidCoverageLeftTotalPixelHeight: 8,
      liquidCoverageRightTotalPixelHeight: 8
    });
    expect(testRuntime.latestDebugEditStatusStripState.pinnedTile).toMatchObject({
      tileX: 4,
      tileY: 6,
      tileId: 8,
      liquidKind: 'lava',
      liquidLevel: 3,
      liquidSurfaceNorthLevel: 0,
      liquidSurfaceWestLevel: 5,
      liquidSurfaceCenterLevel: 3,
      liquidSurfaceEastLevel: 0,
      liquidSurfaceBranch: 'exposed',
      liquidSurfaceTopLeft: 0.5,
      liquidSurfaceTopRight: 0.375,
      liquidFrameTopV: 0.75,
      liquidFrameTopPixelY: 48,
      liquidFrameBottomV: 0.875,
      liquidFrameBottomPixelY: 56,
      liquidFrameHeightV: 0.125,
      liquidFramePixelHeight: 8,
      liquidBottomLeftV: 0.8125,
      liquidBottomRightV: 0.796875,
      liquidBottomLeftPixelY: 52,
      liquidBottomRightPixelY: 51,
      liquidVisibleLeftV: 0.0625,
      liquidVisibleRightV: 0.046875,
      liquidVisibleLeftPercentage: 50,
      liquidVisibleRightPercentage: 37.5,
      liquidVisibleLeftPixelHeight: 4,
      liquidVisibleRightPixelHeight: 3,
      liquidRemainderLeftV: 0.0625,
      liquidRemainderRightV: 0.078125,
      liquidRemainderLeftPercentage: 50,
      liquidRemainderRightPercentage: 62.5,
      liquidRemainderLeftPixelHeight: 4,
      liquidRemainderRightPixelHeight: 5,
      liquidCoverageLeftTotalPercentage: 100,
      liquidCoverageRightTotalPercentage: 100,
      liquidCoverageLeftTotalPixelHeight: 8,
      liquidCoverageRightTotalPixelHeight: 8
    });
  });

  it('keeps hovered and pinned partial-liquid crop telemetry aligned when animated liquid variants advance frames', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 4, y: 6 }
    };
    testRuntime.debugTileInspectPinRequests = [
      {
        worldTileX: 4,
        worldTileY: 6
      }
    ];
    testRuntime.rendererTileId = 0;
    testRuntime.rendererLiquidLevel = 0;
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(4, 6), 8);
    testRuntime.rendererLiquidLevelsByWorldKey.set(worldTileKey(4, 6), 3);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(3, 6), 8);
    testRuntime.rendererLiquidLevelsByWorldKey.set(worldTileKey(3, 6), 5);
    testRuntime.rendererLiquidRenderCardinalMask = 10;
    testRuntime.rendererTelemetry.atlasWidth = 96;
    testRuntime.rendererTelemetry.atlasHeight = 64;

    const expectAnimatedLiquidInspectTelemetry = (
      expectedFrameIndex: number,
      expectedVariantUvRect: string,
      expectedVariantPixelBounds: string
    ): void => {
      expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
      expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
      if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
        throw new Error('expected latest overlay and status-strip inspect telemetry');
      }

      expect(testRuntime.latestDebugOverlayInspectState.pointer).toMatchObject({
        tile: { x: 4, y: 6 },
        tileId: 8,
        liquidKind: 'lava',
        liquidFrameTopV: 0.8125,
        liquidFrameTopPixelY: 52,
        liquidFrameBottomV: 0.9375,
        liquidFrameBottomPixelY: 60,
        liquidFrameHeightV: 0.125,
        liquidFramePixelHeight: 8,
        liquidBottomLeftV: 0.875,
        liquidBottomRightV: 0.859375,
        liquidBottomLeftPixelY: 56,
        liquidBottomRightPixelY: 55,
        liquidVisibleLeftV: 0.0625,
        liquidVisibleRightV: 0.046875,
        liquidVisibleLeftPercentage: 50,
        liquidVisibleRightPercentage: 37.5,
        liquidVisibleLeftPixelHeight: 4,
        liquidVisibleRightPixelHeight: 3,
        liquidRemainderLeftV: 0.0625,
        liquidRemainderRightV: 0.078125,
        liquidRemainderLeftPercentage: 50,
        liquidRemainderRightPercentage: 62.5,
        liquidRemainderLeftPixelHeight: 4,
        liquidRemainderRightPixelHeight: 5,
        liquidCoverageLeftTotalPercentage: 100,
        liquidCoverageRightTotalPercentage: 100,
        liquidCoverageLeftTotalPixelHeight: 8,
        liquidCoverageRightTotalPixelHeight: 8,
        liquidAnimationFrameIndex: expectedFrameIndex,
        liquidAnimationFrameCount: 2,
        liquidVariantUvRect: expectedVariantUvRect,
        liquidVariantPixelBounds: expectedVariantPixelBounds
      });
      expect(testRuntime.latestDebugOverlayInspectState.pinned).toMatchObject({
        tile: { x: 4, y: 6 },
        tileId: 8,
        liquidKind: 'lava',
        liquidFrameTopV: 0.8125,
        liquidFrameTopPixelY: 52,
        liquidFrameBottomV: 0.9375,
        liquidFrameBottomPixelY: 60,
        liquidFrameHeightV: 0.125,
        liquidFramePixelHeight: 8,
        liquidBottomLeftV: 0.875,
        liquidBottomRightV: 0.859375,
        liquidBottomLeftPixelY: 56,
        liquidBottomRightPixelY: 55,
        liquidVisibleLeftV: 0.0625,
        liquidVisibleRightV: 0.046875,
        liquidVisibleLeftPercentage: 50,
        liquidVisibleRightPercentage: 37.5,
        liquidVisibleLeftPixelHeight: 4,
        liquidVisibleRightPixelHeight: 3,
        liquidRemainderLeftV: 0.0625,
        liquidRemainderRightV: 0.078125,
        liquidRemainderLeftPercentage: 50,
        liquidRemainderRightPercentage: 62.5,
        liquidRemainderLeftPixelHeight: 4,
        liquidRemainderRightPixelHeight: 5,
        liquidCoverageLeftTotalPercentage: 100,
        liquidCoverageRightTotalPercentage: 100,
        liquidCoverageLeftTotalPixelHeight: 8,
        liquidCoverageRightTotalPixelHeight: 8,
        liquidAnimationFrameIndex: expectedFrameIndex,
        liquidAnimationFrameCount: 2,
        liquidVariantUvRect: expectedVariantUvRect,
        liquidVariantPixelBounds: expectedVariantPixelBounds
      });
      expect(testRuntime.latestDebugEditStatusStripState.hoveredTile).toMatchObject({
        tileX: 4,
        tileY: 6,
        tileId: 8,
        liquidKind: 'lava',
        liquidFrameTopV: 0.8125,
        liquidFrameTopPixelY: 52,
        liquidFrameBottomV: 0.9375,
        liquidFrameBottomPixelY: 60,
        liquidFrameHeightV: 0.125,
        liquidFramePixelHeight: 8,
        liquidBottomLeftV: 0.875,
        liquidBottomRightV: 0.859375,
        liquidBottomLeftPixelY: 56,
        liquidBottomRightPixelY: 55,
        liquidVisibleLeftV: 0.0625,
        liquidVisibleRightV: 0.046875,
        liquidVisibleLeftPercentage: 50,
        liquidVisibleRightPercentage: 37.5,
        liquidVisibleLeftPixelHeight: 4,
        liquidVisibleRightPixelHeight: 3,
        liquidRemainderLeftV: 0.0625,
        liquidRemainderRightV: 0.078125,
        liquidRemainderLeftPercentage: 50,
        liquidRemainderRightPercentage: 62.5,
        liquidRemainderLeftPixelHeight: 4,
        liquidRemainderRightPixelHeight: 5,
        liquidCoverageLeftTotalPercentage: 100,
        liquidCoverageRightTotalPercentage: 100,
        liquidCoverageLeftTotalPixelHeight: 8,
        liquidCoverageRightTotalPixelHeight: 8,
        liquidAnimationFrameIndex: expectedFrameIndex,
        liquidAnimationFrameCount: 2,
        liquidVariantUvRect: expectedVariantUvRect,
        liquidVariantPixelBounds: expectedVariantPixelBounds
      });
      expect(testRuntime.latestDebugEditStatusStripState.pinnedTile).toMatchObject({
        tileX: 4,
        tileY: 6,
        tileId: 8,
        liquidKind: 'lava',
        liquidFrameTopV: 0.8125,
        liquidFrameTopPixelY: 52,
        liquidFrameBottomV: 0.9375,
        liquidFrameBottomPixelY: 60,
        liquidFrameHeightV: 0.125,
        liquidFramePixelHeight: 8,
        liquidBottomLeftV: 0.875,
        liquidBottomRightV: 0.859375,
        liquidBottomLeftPixelY: 56,
        liquidBottomRightPixelY: 55,
        liquidVisibleLeftV: 0.0625,
        liquidVisibleRightV: 0.046875,
        liquidVisibleLeftPercentage: 50,
        liquidVisibleRightPercentage: 37.5,
        liquidVisibleLeftPixelHeight: 4,
        liquidVisibleRightPixelHeight: 3,
        liquidRemainderLeftV: 0.0625,
        liquidRemainderRightV: 0.078125,
        liquidRemainderLeftPercentage: 50,
        liquidRemainderRightPercentage: 62.5,
        liquidRemainderLeftPixelHeight: 4,
        liquidRemainderRightPixelHeight: 5,
        liquidCoverageLeftTotalPercentage: 100,
        liquidCoverageRightTotalPercentage: 100,
        liquidCoverageLeftTotalPixelHeight: 8,
        liquidCoverageRightTotalPixelHeight: 8,
        liquidAnimationFrameIndex: expectedFrameIndex,
        liquidAnimationFrameCount: 2,
        liquidVariantUvRect: expectedVariantUvRect,
        liquidVariantPixelBounds: expectedVariantPixelBounds
      });
    };

    testRuntime.performanceNow = 120;
    runFixedUpdate();
    runRenderFrame();

    expectAnimatedLiquidInspectTelemetry(0, '0.5,0.813..0.667,0.938', '48,52..64,60');

    testRuntime.performanceNow = 240;
    runRenderFrame();

    expectAnimatedLiquidInspectTelemetry(1, '0.333,0.813..0.5,0.938', '32,52..48,60');
  });

  it('routes compact status-strip player and nearby-light telemetry through one shared overlay-visibility selector', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const renderContacts = {
      support: {
        tileX: 1,
        tileY: 2,
        tileId: 41
      },
      wall: null,
      ceiling: null
    };
    const steppedPlayerState = {
      position: { x: 40, y: -16 },
      velocity: { x: 24, y: -48 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'right' as const
    };

    testRuntime.playerMovementIntent = {
      moveX: 1,
      jumpHeld: false,
      jumpPressed: true
    };
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightLevel = 7;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightFactor = 7 / 15;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceTileX = 6;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceTileY = -3;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceChunkX = 0;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceChunkY = -1;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceLocalTileX = 6;
    testRuntime.rendererTelemetry.standalonePlayerNearbyLightSourceLocalTileY = 29;
    testRuntime.rendererTelemetry.residentActiveLiquidChunks = 3;
    testRuntime.rendererTelemetry.residentActiveLiquidMinChunkX = -1;
    testRuntime.rendererTelemetry.residentActiveLiquidMinChunkY = -2;
    testRuntime.rendererTelemetry.residentActiveLiquidMaxChunkX = 2;
    testRuntime.rendererTelemetry.residentActiveLiquidMaxChunkY = 1;
    testRuntime.rendererStepPlayerStateImpl = () => steppedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, noContacts, renderContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest status-strip telemetry');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerWorldPosition).toEqual(
      steppedPlayerState.position
    );
    expect(testRuntime.latestDebugEditStatusStripState.playerCameraWorldPosition).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerSupportContact).toEqual({
      tile: {
        x: renderContacts.support.tileX,
        y: renderContacts.support.tileY,
        id: renderContacts.support.tileId
      }
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightLevel).toBe(7);
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightFactor).toBe(7 / 15);
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightSourceTile).toEqual({
      x: 6,
      y: -3
    });
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidChunks).toBe(3);
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMinChunkX).toBe(-1);
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMinChunkY).toBe(-2);
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMaxChunkX).toBe(2);
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMaxChunkY).toBe(1);

    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);

    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest overlay and status-strip telemetry');
    }

    expect(testRuntime.latestDebugOverlayInspectState.player?.position).toEqual(
      steppedPlayerState.position
    );
    expect(testRuntime.latestDebugOverlayInspectState.playerNearbyLightLevel).toBe(7);
    expect(testRuntime.latestDebugOverlayInspectState.playerNearbyLightSourceLocalTile).toEqual({
      x: 6,
      y: 29
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerPlaceholderPoseLabel).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerWorldPosition).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCameraWorldPosition).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerSupportContact).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightLevel).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightFactor).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightSourceTile).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightSourceChunk).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightSourceLocalTile).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidChunks).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMinChunkX).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMinChunkY).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMaxChunkX).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMaxChunkY).toBeNull();
  });

  it('routes compact status-strip player-event telemetry through one shared overlay-visibility selector', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const noContacts = {
      support: null,
      wall: null,
      ceiling: null
    };
    const blockedContacts = {
      support: null,
      wall: {
        tileX: -2,
        tileY: -1,
        tileId: 3,
        side: 'left' as const
      },
      ceiling: {
        tileX: -1,
        tileY: -3,
        tileId: 4
      }
    };
    const transitionedPlayerState = {
      position: { x: -12, y: -10 },
      velocity: { x: -48, y: -90 },
      size: { width: 12, height: 28 },
      grounded: false,
      facing: 'left' as const
    };

    testRuntime.performanceNow = 1500;
    testRuntime.rendererStepPlayerStateImpl = () => transitionedPlayerState;
    testRuntime.rendererPlayerCollisionContactsQueue = [noContacts, blockedContacts, noContacts];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest status-strip telemetry');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toMatchObject({
      kind: 'fall',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -2,
        y: -1,
        id: 3,
        side: 'left'
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -1,
        y: -3,
        id: 4
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });

    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);

    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest overlay and status-strip telemetry');
    }

    expect(testRuntime.latestDebugOverlayInspectState.playerGroundedTransition).toMatchObject({
      kind: 'fall',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugOverlayInspectState.playerFacingTransition).toMatchObject({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugOverlayInspectState.playerRespawn ?? null).toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState.playerWallContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -2,
        y: -1,
        id: 3,
        side: 'left'
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugOverlayInspectState.playerCeilingContactTransition).toMatchObject({
      kind: 'blocked',
      tile: {
        x: -1,
        y: -3,
        id: 4
      },
      position: transitionedPlayerState.position,
      velocity: transitionedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition).toBeNull();
  });

  it('routes touch-control armed-tool sync through one shared apply helper', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('f', 'KeyF').prevented).toBe(true);
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual({
      floodFillKind: 'place',
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    expect(dispatchKeydown('n', 'KeyN', { shiftKey: true }).prevented).toBe(true);
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual({
      floodFillKind: null,
      lineKind: 'break',
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    expect(dispatchKeydown('Escape').prevented).toBe(true);
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
  });

  it('routes mutually-exclusive armed-tool replacement through one shared state mutator when sibling tools start armed', async () => {
    testRuntime.initialArmedToolKinds = {
      floodFillKind: 'break',
      lineKind: 'break',
      rectKind: 'place',
      rectOutlineKind: 'break',
      ellipseKind: 'place',
      ellipseOutlineKind: 'break'
    };

    await import('./main');
    await flushBootstrap();

    expect(readArmedToolKinds()).toEqual({
      floodFillKind: 'break',
      lineKind: 'break',
      rectKind: 'place',
      rectOutlineKind: 'break',
      ellipseKind: 'place',
      ellipseOutlineKind: 'break'
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('f', 'KeyF').prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: 'place',
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());

    expect(dispatchKeydown('f', 'KeyF').prevented).toBe(true);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });
    expect(testRuntime.debugEditControlsArmedToolKinds).toEqual(readArmedToolKinds());
  });

  it('routes keyboard brush shortcuts through one shared dispatcher for slot selection, eyedropper, and cycling', async () => {
    await import('./main');
    await flushBootstrap();

    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);
    expect(dispatchKeydown('1', 'Digit1').prevented).toBe(false);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('1', 'Digit1').prevented).toBe(true);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(1);

    expect(dispatchKeydown(']', 'BracketRight').prevented).toBe(true);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(2);

    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 4, y: 6 }
    };
    testRuntime.rendererTileId = 4;
    expect(dispatchKeydown('i', 'KeyI').prevented).toBe(true);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(2);

    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 4, y: 6 }
    };
    expect(dispatchKeydown('i', 'KeyI').prevented).toBe(true);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(4);

    expect(dispatchKeydown('[', 'BracketLeft').prevented).toBe(true);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);
  });

  it('routes touch-panel callbacks and keyboard brush mutations through one shared persisted brush-state commit helper', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugEditControlsInstance).not.toBeNull();
    if (!testRuntime.debugEditControlsInstance) {
      throw new Error('expected debug edit controls instance');
    }

    testRuntime.debugEditControlsInstance.setBrushTileId(4);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(4);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('[', 'BracketLeft').prevented).toBe(true);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);
  });

  it('routes keyboard debug-edit control shortcuts through one shared dispatcher for touch mode and panel collapse', async () => {
    await import('./main');
    await flushBootstrap();

    expect(dispatchKeydown('l', 'KeyL').prevented).toBe(false);
    expect(dispatchKeydown('\\', 'Backslash').prevented).toBe(false);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'pan',
      panelCollapsed: false
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('l', 'KeyL').prevented).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'place',
      panelCollapsed: false
    });

    expect(dispatchKeydown('\\', 'Backslash').prevented).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'place',
      panelCollapsed: false
    });

    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    expect(dispatchKeydown('\\', 'Backslash').prevented).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'place',
      panelCollapsed: true
    });

    expect(dispatchKeydown('b', 'KeyB').prevented).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'break',
      panelCollapsed: true
    });
  });

  it('routes touch-panel callbacks and keyboard control mutations through one shared persisted control-state commit helper', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugEditControlsInstance).not.toBeNull();
    if (!testRuntime.debugEditControlsInstance) {
      throw new Error('expected debug edit controls instance');
    }

    testRuntime.debugEditControlsInstance.setMode('place');
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'place',
      panelCollapsed: false
    });

    testRuntime.debugEditControlsInstance.setCollapsed(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'place',
      panelCollapsed: true
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('b', 'KeyB').prevented).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'break',
      panelCollapsed: true
    });

    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    expect(dispatchKeydown('\\', 'Backslash').prevented).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'break',
      panelCollapsed: false
    });
  });

  it('routes touch-control initialization and persisted writes through one shared debug-edit preference snapshot helper', async () => {
    testRuntime.storageValues.set(
      DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY,
      JSON.stringify({
        touchMode: 'break',
        brushTileId: 4,
        panelCollapsed: true
      })
    );

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugEditControlsInitialPreferenceSnapshot).toEqual({
      touchMode: 'break',
      brushTileId: 4,
      panelCollapsed: true
    });

    expect(testRuntime.debugEditControlsInstance).not.toBeNull();
    if (!testRuntime.debugEditControlsInstance) {
      throw new Error('expected debug edit controls instance');
    }

    testRuntime.debugEditControlsInstance.setMode('place');
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'place',
      brushTileId: 4,
      panelCollapsed: true
    });

    testRuntime.debugEditControlsInstance.setBrushTileId(2);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'place',
      brushTileId: 2,
      panelCollapsed: true
    });

    testRuntime.debugEditControlsInstance.setCollapsed(false);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'place',
      brushTileId: 2,
      panelCollapsed: false
    });
  });

  it('routes bootstrap hydration and Reset Prefs through one shared debug-edit preference-restore helper', async () => {
    testRuntime.storageValues.set(
      DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY,
      JSON.stringify({
        touchMode: 'break',
        brushTileId: 4,
        panelCollapsed: true
      })
    );

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugEditControlsInstance).not.toBeNull();
    if (!testRuntime.debugEditControlsInstance) {
      throw new Error('expected debug edit controls instance');
    }

    expect(testRuntime.debugEditControlsInstance.getMode()).toBe('break');
    expect(testRuntime.debugEditControlsInstance.getBrushTileId()).toBe(4);
    expect(testRuntime.debugEditControlsInstance.isCollapsed()).toBe(true);

    testRuntime.debugEditControlsInstance.triggerResetPrefs();

    expect(testRuntime.storageValues.has(DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY)).toBe(false);
    expect(testRuntime.debugEditControlsInstance.getMode()).toBe('pan');
    expect(testRuntime.debugEditControlsInstance.getBrushTileId()).toBe(3);
    expect(testRuntime.debugEditControlsInstance.isCollapsed()).toBe(false);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('p', 'KeyP').prevented).toBe(true);
    expect(testRuntime.storageValues.has(DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY)).toBe(false);

    expect(dispatchKeydown('[', 'BracketLeft').prevented).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'pan',
      brushTileId: 2,
      panelCollapsed: false
    });

    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    expect(dispatchKeydown('\\', 'Backslash').prevented).toBe(true);
    expect(readPersistedDebugEditControlState()).toMatchObject({
      touchMode: 'pan',
      brushTileId: 2,
      panelCollapsed: true
    });
  });

  it('enables the paused-menu N shortcut only after a resumable world session exists', async () => {
    await import('./main');
    await flushBootstrap();

    expect(dispatchKeydown('n').prevented).toBe(false);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());
    expect(testRuntime.gameLoopStartCount).toBe(0);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    expect(dispatchKeydown('n').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });

  it('applies main-menu shell actions through one shared keyboard shell-action handler across shell clicks and paused-menu shortcuts', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());

    testRuntime.shellInstance?.options.onSecondaryAction('main-menu');
    testRuntime.shellInstance?.options.onTertiaryAction('main-menu');
    testRuntime.shellInstance?.options.onQuaternaryAction('main-menu');
    testRuntime.shellInstance?.options.onQuinaryAction('main-menu');
    testRuntime.shellInstance?.options.onSenaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());
    expect(testRuntime.gameLoopStartCount).toBe(0);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(testRuntime.gameLoopStartCount).toBe(1);

    dispatchKeydown('h');
    dispatchKeydown('g');
    dispatchKeydown('v');
    dispatchKeydown('m');
    dispatchKeydown('?', 'Slash');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: true
      })
    );

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    testRuntime.shellInstance?.options.onQuinaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
    expect(testRuntime.storageValues.has(WORLD_SESSION_SHELL_STATE_STORAGE_KEY)).toBe(false);

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    });

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(dispatchKeydown('n').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });

  it('downloads the current paused-session world save without mutating the active session', async () => {
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(5, -20, 6)).toBe(true);
    testRuntime.rendererWorldSnapshot = savedWorld.createSnapshot();
    testRuntime.downloadWorldSaveFilename = 'deep-factory-world-save-2026-03-09T05-46-40Z.json';

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    const pausedState = createExpectedPausedMainMenuState();
    const persistedShellStateBeforeExport =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;

    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);

    testRuntime.shellInstance?.options.onSecondaryAction('main-menu');

    expect(testRuntime.downloadedWorldSaveEnvelopes).toHaveLength(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        exportResult: {
          status: 'downloaded',
          fileName: 'deep-factory-world-save-2026-03-09T05-46-40Z.json'
        }
      })
    );
    expect(testRuntime.gameLoopStartCount).toBe(1);
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforeExport
    );

    const downloadedEnvelope = testRuntime.downloadedWorldSaveEnvelopes[0] as {
      kind: string;
      version: number;
      session: {
        standalonePlayerState: {
          position: { x: number; y: number };
        } | null;
        cameraFollowOffset: {
          x: number;
          y: number;
        };
      };
      worldSnapshot: unknown;
    };

    expect(downloadedEnvelope.kind).toBe('deep-factory.world-save');
    expect(downloadedEnvelope.version).toBe(1);
    expect(downloadedEnvelope.worldSnapshot).toEqual(testRuntime.rendererWorldSnapshot);
    expect(downloadedEnvelope.session.cameraFollowOffset).toEqual({ x: 0, y: 0 });
    expect(downloadedEnvelope.session.standalonePlayerState).not.toBeNull();
    expect(downloadedEnvelope.session.standalonePlayerState?.position).toEqual({ x: 8, y: 0 });

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);
  });

  it('shows paused-menu export failure copy when the json download throws without mutating the paused session', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(5, -20, 6)).toBe(true);
    testRuntime.rendererWorldSnapshot = savedWorld.createSnapshot();
    testRuntime.downloadWorldSaveError = new Error('blocked download');

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    const pausedState = createExpectedPausedMainMenuState();
    const persistedShellStateBeforeExport =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;

    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);

    testRuntime.shellInstance?.options.onSecondaryAction('main-menu');

    expect(testRuntime.downloadedWorldSaveEnvelopes).toHaveLength(0);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        exportResult: {
          status: 'failed',
          reason: 'blocked download'
        }
      })
    );
    expect(testRuntime.gameLoopStartCount).toBe(1);
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforeExport
    );
    expect(warnSpy).toHaveBeenCalledWith('Failed to export world save.', testRuntime.downloadWorldSaveError);

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);

    warnSpy.mockRestore();
  });

  it('clears the persisted paused-session world save without discarding the live paused session', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.storageValues.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(true);
    expect(dispatchKeydown('q').prevented).toBe(true);

    const pausedState = createExpectedPausedMainMenuState();
    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);

    testRuntime.shellInstance?.options.onQuaternaryAction('main-menu');

    expect(testRuntime.storageValues.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(false);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSaveCleared: true
      })
    );

    dispatchWindowEvent('pagehide');

    expect(testRuntime.storageValues.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(false);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSaveCleared: true
      })
    );

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
    expect(testRuntime.storageValues.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(true);
  });

  it('routes a paused-menu imported world save through the shared picker and restore action', async () => {
    const restoredWorld = new TileWorld(0);
    expect(restoredWorld.setTile(5, -20, 6)).toBe(true);
    const restoreEnvelope = createWorldSaveEnvelope({
      worldSnapshot: restoredWorld.createSnapshot(),
      standalonePlayerState: createPlayerState({
        position: { x: 72, y: 96 },
        velocity: { x: -14, y: 28 },
        grounded: false,
        facing: 'left',
        health: 62,
        lavaDamageTickSecondsRemaining: 0.5
      }),
      cameraFollowOffset: { x: 18, y: -12 }
    });

    const restoreModule = await import('./mainWorldSessionRestore');
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    const pausedState = createExpectedPausedMainMenuState();
    testRuntime.queuedWorldSaveImportResults = [
      {
        status: 'selected',
        fileName: 'restore.json',
        envelope: restoreEnvelope
      }
    ];

    testRuntime.shellInstance?.options.onTertiaryAction('main-menu');
    await flushBootstrap();

    expect(testRuntime.worldSaveImportCallCount).toBe(1);
    expect(restoreModule.restoreWorldSessionFromSaveEnvelope).toHaveBeenCalledTimes(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        importResult: {
          status: 'accepted',
          fileName: 'restore.json'
        }
      })
    );
    expect(testRuntime.rendererLoadWorldSnapshotCallCount).toBe(1);

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);
  });

  it('keeps the paused session unchanged when the world-save import picker is canceled', async () => {
    const restoreModule = await import('./mainWorldSessionRestore');
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    testRuntime.queuedWorldSaveImportResults = [
      {
        status: 'cancelled'
      }
    ];

    testRuntime.shellInstance?.options.onTertiaryAction('main-menu');
    await flushBootstrap();

    expect(testRuntime.worldSaveImportCallCount).toBe(1);
    expect(restoreModule.restoreWorldSessionFromSaveEnvelope).not.toHaveBeenCalled();
    expect(testRuntime.rendererLoadWorldSnapshotCallCount).toBe(0);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        importResult: {
          status: 'cancelled'
        }
      })
    );
  });

  it('rejects invalid paused-menu imported world saves without mutating the current session', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const restoreModule = await import('./mainWorldSessionRestore');
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    testRuntime.queuedWorldSaveImportResults = [
      {
        status: 'rejected',
        fileName: 'broken.json',
        reason: 'world save envelope kind must be "deep-factory.world-save"'
      }
    ];

    testRuntime.shellInstance?.options.onTertiaryAction('main-menu');
    await flushBootstrap();

    expect(testRuntime.worldSaveImportCallCount).toBe(1);
    expect(restoreModule.restoreWorldSessionFromSaveEnvelope).not.toHaveBeenCalled();
    expect(testRuntime.rendererLoadWorldSnapshotCallCount).toBe(0);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        importResult: {
          status: 'rejected',
          fileName: 'broken.json',
          reason: 'world save envelope kind must be "deep-factory.world-save"'
        }
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Rejected imported world save.',
      'world save envelope kind must be "deep-factory.world-save"'
    );
    warnSpy.mockRestore();
  });

  it('shows paused-menu import restore failure copy when runtime restore throws after selection', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const restoredWorld = new TileWorld(0);
    expect(restoredWorld.setTile(5, -20, 6)).toBe(true);
    const restoreEnvelope = createWorldSaveEnvelope({
      worldSnapshot: restoredWorld.createSnapshot(),
      standalonePlayerState: createPlayerState({
        position: { x: 72, y: 96 },
        velocity: { x: -14, y: 28 },
        grounded: false,
        facing: 'left',
        health: 62,
        lavaDamageTickSecondsRemaining: 0.5
      }),
      cameraFollowOffset: { x: 18, y: -12 }
    });

    const restoreModule = await import('./mainWorldSessionRestore');
    vi.mocked(restoreModule.restoreWorldSessionFromSaveEnvelope).mockImplementationOnce(() => {
      throw new Error('renderer load failed');
    });
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    const persistedEnvelopeBeforeImport = readPersistedWorldSaveEnvelope();
    testRuntime.queuedWorldSaveImportResults = [
      {
        status: 'selected',
        fileName: 'restore.json',
        envelope: restoreEnvelope
      }
    ];

    testRuntime.shellInstance?.options.onTertiaryAction('main-menu');
    await flushBootstrap();

    expect(testRuntime.worldSaveImportCallCount).toBe(1);
    expect(restoreModule.restoreWorldSessionFromSaveEnvelope).toHaveBeenCalledTimes(1);
    expect(testRuntime.rendererLoadWorldSnapshotCallCount).toBe(0);
    expect(readPersistedWorldSaveEnvelope()).toEqual(persistedEnvelopeBeforeImport);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        importResult: {
          status: 'restore-failed',
          fileName: 'restore.json',
          reason: 'renderer load failed'
        }
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to restore world save.',
      expect.objectContaining({
        message: 'renderer load failed'
      })
    );
    warnSpy.mockRestore();
  });

  it('shows paused-menu import persistence failure copy when runtime restore succeeds but browser resume rewrite fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const restoredWorld = new TileWorld(0);
    expect(restoredWorld.setTile(5, -20, 6)).toBe(true);
    const restoreEnvelope = createWorldSaveEnvelope({
      worldSnapshot: restoredWorld.createSnapshot(),
      standalonePlayerState: createPlayerState({
        position: { x: 72, y: 96 },
        velocity: { x: -14, y: 28 },
        grounded: false,
        facing: 'left',
        health: 62,
        lavaDamageTickSecondsRemaining: 0.5
      }),
      cameraFollowOffset: { x: 18, y: -12 }
    });

    const restoreModule = await import('./mainWorldSessionRestore');
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(readPersistedWorldSaveEnvelope()).not.toBeNull();
    testRuntime.storageSetItemErrorsByKey.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      new Error('write blocked')
    );
    testRuntime.queuedWorldSaveImportResults = [
      {
        status: 'selected',
        fileName: 'restore.json',
        envelope: restoreEnvelope
      }
    ];

    testRuntime.shellInstance?.options.onTertiaryAction('main-menu');
    await flushBootstrap();

    expect(testRuntime.worldSaveImportCallCount).toBe(1);
    expect(restoreModule.restoreWorldSessionFromSaveEnvelope).toHaveBeenCalledTimes(1);
    expect(testRuntime.rendererLoadWorldSnapshotCallCount).toBe(1);
    expect(testRuntime.rendererWorldSnapshot).toEqual(restoreEnvelope.worldSnapshot);
    expect(readPersistedWorldSaveEnvelope()).toBeNull();
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        importResult: {
          status: 'persistence-failed',
          fileName: 'restore.json',
          reason: 'Browser resume data was not updated.'
        }
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to persist restored world save.',
      'Browser resume data was not updated.'
    );
    warnSpy.mockRestore();
  });

  it('persists the latest paused-session world save envelope when returning to the main menu', async () => {
    const initialWorld = new TileWorld(0);
    expect(initialWorld.setTile(1, -20, 4)).toBe(true);
    testRuntime.rendererWorldSnapshot = initialWorld.createSnapshot();

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const pausedWorld = new TileWorld(0);
    expect(pausedWorld.setTile(5, -20, 6)).toBe(true);
    testRuntime.rendererWorldSnapshot = pausedWorld.createSnapshot();

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope).not.toBeNull();
    expect(persistedEnvelope?.session.cameraFollowOffset).toEqual({ x: 0, y: 0 });
    expect(persistedEnvelope?.session.standalonePlayerState?.position).toEqual({ x: 8, y: 0 });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(5, -20)).toBe(6);
  });

  it('restores a paused session through the shared restore helper without rebuilding renderer or input state', async () => {
    testRuntime.debugTileEditHistoryConstructorStatuses = [
      {
        undoStrokeCount: 4,
        redoStrokeCount: 1
      },
      {
        undoStrokeCount: 0,
        redoStrokeCount: 0
      }
    ];
    const restoredWorld = new TileWorld(0);
    expect(restoredWorld.setTile(5, -20, 6)).toBe(true);
    const restoredPlayerState = createPlayerState({
      position: { x: 72, y: 96 },
      velocity: { x: -14, y: 28 },
      grounded: false,
      facing: 'left',
      health: 62,
      lavaDamageTickSecondsRemaining: 0.5
    });
    const restoredCameraFollowOffset = { x: 18, y: -12 };
    const restoreEnvelope = createWorldSaveEnvelope({
      worldSnapshot: restoredWorld.createSnapshot(),
      standalonePlayerState: restoredPlayerState,
      cameraFollowOffset: restoredCameraFollowOffset
    });

    const mainModule = await import('./main');
    const restoreModule = await import('./mainWorldSessionRestore');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('f', 'KeyF').prevented).toBe(true);
    expect(readArmedToolKinds().floodFillKind).toBe('place');

    expect(dispatchKeydown('q').prevented).toBe(true);
    const pausedState = createExpectedPausedMainMenuState();
    const rendererInstanceBeforeRestore = testRuntime.rendererInstance;
    const inputControllerBeforeRestore = testRuntime.inputControllerInstance;

    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);
    expect(rendererInstanceBeforeRestore).not.toBeNull();
    expect(inputControllerBeforeRestore).not.toBeNull();

    expect(mainModule.restorePausedWorldSessionFromSaveEnvelope(restoreEnvelope)).toBe(true);

    expect(restoreModule.restoreWorldSessionFromSaveEnvelope).toHaveBeenCalledTimes(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);
    expect(testRuntime.gameLoopStartCount).toBe(1);
    expect(testRuntime.rendererConstructCount).toBe(1);
    expect(testRuntime.inputControllerConstructCount).toBe(1);
    expect(testRuntime.rendererInstance).toBe(rendererInstanceBeforeRestore);
    expect(testRuntime.inputControllerInstance).toBe(inputControllerBeforeRestore);
    expect(testRuntime.rendererLoadWorldSnapshotCallCount).toBe(1);
    expect(testRuntime.debugTileEditHistoryConstructCount).toBe(2);
    expect(testRuntime.debugEditControlsLatestHistoryState).toEqual({
      undoStrokeCount: 0,
      redoStrokeCount: 0
    });
    expect(testRuntime.cancelArmedDebugToolsCallCount).toBe(1);
    expect(readArmedToolKinds()).toEqual({
      floodFillKind: null,
      lineKind: null,
      rectKind: null,
      rectOutlineKind: null,
      ellipseKind: null,
      ellipseOutlineKind: null
    });

    const loadedWorld = new TileWorld(0);
    loadedWorld.loadSnapshot(testRuntime.rendererWorldSnapshot!);
    expect(loadedWorld.getTile(5, -20)).toBe(6);
    expect(testRuntime.latestRendererRenderFrameState?.standalonePlayerCurrentPosition).toEqual({
      x: 72,
      y: 96
    });
    expect(testRuntime.latestRendererRenderFrameState?.standalonePlayerPreviousPosition).toEqual({
      x: 72,
      y: 96
    });
    expect(testRuntime.latestRendererRenderFrameState?.standalonePlayerInterpolatedPosition).toEqual({
      x: 72,
      y: 96
    });

    const expectedCameraFocus = getPlayerCameraFocusPoint(restoredPlayerState);
    expect(testRuntime.cameraInstance).toMatchObject({
      x: expectedCameraFocus.x + restoredCameraFollowOffset.x,
      y: expectedCameraFocus.y + restoredCameraFollowOffset.y
    });
  });

  it('keeps non-shortcuts shell overlay visibility synchronized through shell-driven enter, pause, and resume transitions', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    testRuntime.shellInstance?.options.onToggleDebugEditControls('in-world');
    testRuntime.shellInstance?.options.onToggleDebugEditOverlays('in-world');
    testRuntime.shellInstance?.options.onTogglePlayerSpawnMarker('in-world');

    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(true);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(true);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(true);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(true);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(true);

    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true
      })
    );
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(true);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(true);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(true);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(true);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(true);
  });

  it('routes overlay-backed in-world shell toggles through one shared visibility sync path while shortcuts stay shell-state only', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.shellInstance?.options.onToggleShortcutsOverlay('in-world');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        shortcutsOverlayVisible: true
      })
    );
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);

    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    testRuntime.shellInstance?.options.onToggleDebugEditControls('in-world');
    testRuntime.shellInstance?.options.onToggleDebugEditOverlays('in-world');
    testRuntime.shellInstance?.options.onTogglePlayerSpawnMarker('in-world');

    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(true);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(true);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(true);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(true);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(true);

    expect(dispatchKeydown('h').prevented).toBe(true);
    expect(dispatchKeydown('g').prevented).toBe(true);
    expect(dispatchKeydown('v').prevented).toBe(true);
    expect(dispatchKeydown('m').prevented).toBe(true);

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        shortcutsOverlayVisible: true
      })
    );
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);
  });

  it('routes shortcuts-overlay state through the shared in-world shell toggle mutator across shell clicks and keyboard shortcuts', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onToggleShortcutsOverlay('in-world');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        shortcutsOverlayVisible: true
      })
    );
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);

    expect(dispatchKeydown('?', 'Slash').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);
  });

  it('routes in-world shell toggle actions through one shared state-plus-finalize pipeline across overlay and shortcuts actions', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true
      })
    );
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: true,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);

    testRuntime.shellInstance?.options.onToggleShortcutsOverlay('in-world');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        shortcutsOverlayVisible: true
      })
    );
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: true,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);

    expect(dispatchKeydown('h').prevented).toBe(true);

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        shortcutsOverlayVisible: true
      })
    );
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);

    expect(dispatchKeydown('?', 'Slash').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
  });

  it('keeps in-world-only debug-edit shortcut keys inert outside in-world runtime and enables them once the session is live', async () => {
    await import('./main');
    await flushBootstrap();

    expect(dispatchKeydown('l').prevented).toBe(false);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('l').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
    expect(dispatchKeydown('b').prevented).toBe(false);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
  });

  it('loads persisted in-world shell-action keybindings and routes keyboard shell actions through them', async () => {
    testRuntime.storageValues.set(
      SHELL_ACTION_KEYBINDING_STORAGE_KEY,
      JSON.stringify(CUSTOM_SHELL_ACTION_KEYBINDINGS)
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );

    expect(dispatchKeydown('h').prevented).toBe(false);
    expect(dispatchKeydown('u').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);

    expect(dispatchKeydown('q').prevented).toBe(false);
    expect(dispatchKeydown('x').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
  });

  it('explains paused-menu default bindings as a load fallback when saved shell-action keybindings were rejected', async () => {
    testRuntime.storageValues.set(
      SHELL_ACTION_KEYBINDING_STORAGE_KEY,
      JSON.stringify({
        'return-to-main-menu': 'F',
        'recenter-camera': 'Q',
        'toggle-debug-overlay': 'Q',
        'toggle-debug-edit-controls': '11',
        'toggle-debug-edit-overlays': '?',
        'toggle-player-spawn-marker': '1'
      })
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
  });

  it('applies in-world shell toggles through one shared keyboard shell-action handler across shell clicks and keyboard shortcuts', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    testRuntime.shellInstance?.options.onToggleDebugEditControls('in-world');
    testRuntime.shellInstance?.options.onToggleDebugEditOverlays('in-world');
    testRuntime.shellInstance?.options.onTogglePlayerSpawnMarker('in-world');
    testRuntime.shellInstance?.options.onToggleShortcutsOverlay('in-world');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: true
      })
    );
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: true
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(true);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(true);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(true);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(true);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(true);

    for (const [key, code] of [
      ['h', ''],
      ['g', ''],
      ['v', ''],
      ['m', ''],
      ['?', 'Slash']
    ] as const) {
      expect(dispatchKeydown(key, code).prevented).toBe(true);
    }

    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);
  });

  it('routes recenter-camera and return-to-main-menu through one shared keyboard shell-action handler across shell clicks and keyboard shortcuts', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.cameraInstance).not.toBeNull();
    if (!testRuntime.cameraInstance) {
      throw new Error('expected camera instance');
    }

    testRuntime.cameraInstance.x = 120;
    testRuntime.cameraInstance.y = 45;
    testRuntime.shellInstance?.options.onRecenterCamera('in-world');
    expect(testRuntime.cameraInstance.x).toBe(8);
    expect(testRuntime.cameraInstance.y).toBe(-14);

    testRuntime.cameraInstance.x = -30;
    testRuntime.cameraInstance.y = 64;
    expect(dispatchKeydown('c').prevented).toBe(true);
    expect(testRuntime.cameraInstance.x).toBe(8);
    expect(testRuntime.cameraInstance.y).toBe(-14);

    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
  });

  it('keeps recenter-camera inert when the shared in-world recenter availability helper has no standalone player target', async () => {
    testRuntime.playerSpawnPoint = null;

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());

    expect(testRuntime.cameraInstance).not.toBeNull();
    if (!testRuntime.cameraInstance) {
      throw new Error('expected camera instance');
    }

    testRuntime.cameraInstance.x = 120;
    testRuntime.cameraInstance.y = 45;
    testRuntime.shellInstance?.options.onRecenterCamera('in-world');
    expect(testRuntime.cameraInstance.x).toBe(120);
    expect(testRuntime.cameraInstance.y).toBe(45);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());

    testRuntime.cameraInstance.x = -30;
    testRuntime.cameraInstance.y = 64;
    expect(dispatchKeydown('c').prevented).toBe(true);
    expect(testRuntime.cameraInstance.x).toBe(-30);
    expect(testRuntime.cameraInstance.y).toBe(64);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
  });

  it('keeps all in-world shell toggles enabled after pausing with Q and resuming with Enter', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    dispatchKeydown('h');
    dispatchKeydown('g');
    dispatchKeydown('v');
    dispatchKeydown('m');
    dispatchKeydown('?', 'Slash');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: true
      })
    );
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: true
    });

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: true
      })
    );
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: true
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(true);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(true);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(true);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(true);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(true);
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });

  it('clears persisted shell toggle preferences from the paused menu and reapplies default-off shell visibility on the next resume', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedFirstLaunchMainMenuState());

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    dispatchKeydown('h');
    dispatchKeydown('g');
    dispatchKeydown('v');
    dispatchKeydown('m');
    dispatchKeydown('?', 'Slash');

    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: true
    });

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    testRuntime.shellInstance?.options.onQuinaryAction('main-menu');

    expect(testRuntime.storageValues.has(WORLD_SESSION_SHELL_STATE_STORAGE_KEY)).toBe(false);

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    });
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });
});
