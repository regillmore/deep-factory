import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY } from './input/debugEditControlStatePersistence';
import { WORLD_SESSION_SHELL_STATE_STORAGE_KEY } from './mainWorldSessionShellState';
import {
  createDefaultBootShellState,
  createInWorldShellState,
  createMainMenuShellState,
  createRendererInitializationFailedBootShellState,
  createWebGlUnavailableBootShellState
} from './ui/appShell';
import type { DebugEditStatusStripState } from './ui/debugEditStatusHelpers';

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
    debugTileEdits: [] as Array<{
      strokeId: number;
      worldTileX: number;
      worldTileY: number;
      kind: 'place' | 'break';
    }>,
    rendererTileId: 0,
    rendererSetTileResult: false,
    rendererStepPlayerStateImpl: null as null | ((
      state: unknown,
      fixedDt: number,
      intent: unknown
    ) => unknown),
    rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl: null as null | ((
      state: unknown,
      spawn: unknown
    ) => unknown),
    rendererPlayerCollisionContactsQueue: [] as Array<{
      support: { tileX: number; tileY: number; tileId: number } | null;
      wall: { tileX: number; tileY: number; tileId: number; side: 'left' | 'right' } | null;
      ceiling: { tileX: number; tileY: number; tileId: number } | null;
    }>,
    latestDebugEditStatusStripState: null as DebugEditStatusStripState | null,
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
    storageValues: new Map<string, string>()
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
      if (testRuntime.rendererConstructorError !== null) {
        throw testRuntime.rendererConstructorError;
      }
    }

    telemetry = {
      atlasWidth: null,
      atlasHeight: null,
      residentDirtyLightChunks: 0,
      standalonePlayerNearbyLightLevel: null,
      standalonePlayerNearbyLightFactor: null,
      standalonePlayerNearbyLightSourceTileX: null,
      standalonePlayerNearbyLightSourceTileY: null,
      standalonePlayerNearbyLightSourceChunkX: null,
      standalonePlayerNearbyLightSourceChunkY: null,
      standalonePlayerNearbyLightSourceLocalTileX: null,
      standalonePlayerNearbyLightSourceLocalTileY: null
    };

    async initialize(): Promise<void> {
      if (testRuntime.rendererInitializeError !== null) {
        throw testRuntime.rendererInitializeError;
      }
    }

    resize(): void {}

    render(): void {}

    findPlayerSpawnPoint() {
      return testRuntime.playerSpawnPoint;
    }

    respawnPlayerStateAtSpawnIfEmbeddedInSolid<T>(state: T, spawn: unknown): T {
      if (testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl) {
        return testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl(state, spawn) as T;
      }
      return state;
    }

    getPlayerCollisionContacts() {
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

    getTile(): number {
      return testRuntime.rendererTileId;
    }

    setTile(): boolean {
      const result = testRuntime.rendererSetTileResult;
      testRuntime.rendererSetTileResult = false;
      return result;
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
      return null;
    }

    resetWorld(): void {}

    stepPlayerState<T>(state: T, fixedDt: number, intent: unknown): T {
      if (testRuntime.rendererStepPlayerStateImpl) {
        return testRuntime.rendererStepPlayerStateImpl(state, fixedDt, intent) as T;
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
      return {
        moveX: 0,
        jumpHeld: false,
        jumpPressed: false
      };
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
      return [];
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
      return {
        moveX: 0,
        jumpHeld: false,
        jumpPressed: false
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

    update(): void {}
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
const runRenderFrame = (frameDtMs = 1000 / 60): void => {
  testRuntime.gameLoopRender?.(0, frameDtMs);
};

const readPersistedShellState = (): Record<string, boolean> =>
  JSON.parse(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? '{}');
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

const readArmedToolKinds = () => ({
  floodFillKind: testRuntime.inputControllerInstance?.getArmedDebugFloodFillKind() ?? null,
  lineKind: testRuntime.inputControllerInstance?.getArmedDebugLineKind() ?? null,
  rectKind: testRuntime.inputControllerInstance?.getArmedDebugRectKind() ?? null,
  rectOutlineKind: testRuntime.inputControllerInstance?.getArmedDebugRectOutlineKind() ?? null,
  ellipseKind: testRuntime.inputControllerInstance?.getArmedDebugEllipseKind() ?? null,
  ellipseOutlineKind: testRuntime.inputControllerInstance?.getArmedDebugEllipseOutlineKind() ?? null
});

const createExpectedPausedMainMenuState = () => ({
  screen: 'main-menu',
  statusText: 'World session paused.',
  detailLines: [],
  menuSections: [
    {
      title: 'Resume World (Enter)',
      lines: ['Continue with the current world, player state, and debug edits intact.'],
      metadataRows: [
        {
          label: 'Shortcut',
          value: 'Enter'
        },
        {
          label: 'Consequence',
          value: 'Keeps current world, player, camera, and edits.'
        }
      ],
      tone: 'accent'
    },
    {
      title: 'Reset Shell Toggles',
      lines: [
        'Keep the paused session intact while clearing saved shell visibility and restoring the default-off shell layout before the next Resume World (Enter).'
      ],
      metadataRows: [
        {
          label: 'Shortcut',
          value: 'Button only'
        },
        {
          label: 'Consequence',
          value: 'Keeps the session but clears saved shell visibility.'
        }
      ]
    },
    {
      title: 'New World (N)',
      lines: ['Discard the paused session, camera state, and undo history before a fresh world boots.'],
      metadataRows: [
        {
          label: 'Shortcut',
          value: 'N'
        },
        {
          label: 'Consequence',
          value: 'Replaces the current world, player, camera, and undo state.'
        }
      ],
      tone: 'warning'
    }
  ],
  primaryActionLabel: 'Resume World',
  secondaryActionLabel: 'New World',
  tertiaryActionLabel: 'Reset Shell Toggles'
});

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
  supportTileId = 1
}: Partial<{
  anchorTileX: number;
  standingTileY: number;
  x: number;
  y: number;
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
    tileX: anchorTileX,
    tileY: standingTileY,
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
    testRuntime.debugTileEdits = [];
    testRuntime.rendererTileId = 0;
    testRuntime.rendererSetTileResult = false;
    testRuntime.rendererStepPlayerStateImpl = null;
    testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl = null;
    testRuntime.rendererPlayerCollisionContactsQueue = [];
    testRuntime.latestDebugEditStatusStripState = null;
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint();
    testRuntime.gameLoopStartCount = 0;
    testRuntime.storageValues.clear();

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
    testRuntime.shellInstance?.options.onSecondaryAction('main-menu');

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
    testRuntime.shellInstance?.options.onSecondaryAction('main-menu');

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

  it('routes bootstrap spawn initialization and embedded respawn recovery through one shared standalone-player transition-reset helper', async () => {
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

    const respawnedPlayerState = {
      position: { x: 96, y: 80 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 28 },
      grounded: true,
      facing: 'right' as const
    };
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 6,
      standingTileY: 5,
      x: 96,
      y: 80
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
        y: 5
      },
      position: respawnedPlayerState.position,
      velocity: respawnedPlayerState.velocity
    });
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);
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

    testRuntime.shellInstance?.options.onTertiaryAction('main-menu');

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

    testRuntime.shellInstance?.options.onTertiaryAction('main-menu');

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
