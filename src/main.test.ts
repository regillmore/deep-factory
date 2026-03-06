import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WORLD_SESSION_SHELL_STATE_STORAGE_KEY } from './mainWorldSessionShellState';
import {
  createDefaultBootShellState,
  createInWorldShellState,
  createMainMenuShellState,
  createRendererInitializationFailedBootShellState,
  createWebGlUnavailableBootShellState
} from './ui/appShell';

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
    windowListeners: new Map<string, Array<(event: unknown) => void>>(),
    shellInstance: null as null | {
      currentState: unknown;
      stateHistory: unknown[];
      options: Record<string, (screen: string) => void>;
    },
    debugOverlayInstance: null as null | { visible: boolean },
    debugEditControlsInstance: null as null | { visible: boolean },
    hoveredTileCursorInstance: null as null | { visible: boolean },
    armedDebugToolPreviewInstance: null as null | { visible: boolean },
    debugEditStatusStripInstance: null as null | { visible: boolean },
    playerSpawnMarkerInstance: null as null | { visible: boolean },
    rendererConstructorError: null as unknown,
    rendererInitializeError: null as unknown,
    gameLoopStartCount: 0,
    storageValues: new Map<string, string>()
  };
});

vi.mock('./style.css', () => ({}));

vi.mock('./core/gameLoop', () => ({
  GameLoop: class {
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
      return {
        anchorTileX: 0,
        standingTileY: 0,
        x: 8,
        y: 0,
        aabb: {
          minX: 2,
          minY: -28,
          maxX: 14,
          maxY: 0
        },
        support: {
          tileX: 0,
          tileY: 0,
          tileId: 1
        }
      };
    }

    respawnPlayerStateAtSpawnIfEmbeddedInSolid<T>(state: T): T {
      return state;
    }

    getPlayerCollisionContacts() {
      return {
        support: null,
        wall: null,
        ceiling: null
      };
    }

    getTile(): number {
      return 0;
    }

    setTile(): boolean {
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
      return null;
    }

    resetWorld(): void {}

    stepPlayerState<T>(state: T): T {
      return state;
    }
  }
}));

vi.mock('./input/controller', () => ({
  InputController: class {
    private touchMode: 'pan' | 'place' | 'break' = 'pan';
    private armedDesktopInspectPin = false;
    private armedFloodFillKind: 'place' | 'break' | null = null;
    private armedLineKind: 'place' | 'break' | null = null;
    private armedRectKind: 'place' | 'break' | null = null;
    private armedRectOutlineKind: 'place' | 'break' | null = null;
    private armedEllipseKind: 'place' | 'break' | null = null;
    private armedEllipseOutlineKind: 'place' | 'break' | null = null;

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
      return false;
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
      return null;
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
      return [];
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
      return [];
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

    update(): void {}
  }
}));

vi.mock('./ui/touchDebugEditControls', () => ({
  TouchDebugEditControls: class {
    visible = false;
    private collapsed = false;

    constructor() {
      testRuntime.debugEditControlsInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    setMode(): void {}

    setBrushTileId(): void {}

    setCollapsed(collapsed: boolean): void {
      this.collapsed = collapsed;
    }

    isCollapsed(): boolean {
      return this.collapsed;
    }

    setHistoryState(): void {}

    setArmedFloodFillKind(): void {}

    setArmedLineKind(): void {}

    setArmedRectKind(): void {}

    setArmedRectOutlineKind(): void {}

    setArmedEllipseKind(): void {}

    setArmedEllipseOutlineKind(): void {}
  }
}));

const flushBootstrap = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const readPersistedShellState = (): Record<string, boolean> =>
  JSON.parse(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? '{}');

const dispatchKeydown = (key: string, code = '') => {
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
    }
  };

  const keydownListeners = testRuntime.windowListeners.get('keydown') ?? [];
  for (const listener of keydownListeners) {
    listener(event);
  }

  return {
    prevented
  };
};

const createExpectedPausedMainMenuState = () => ({
  screen: 'main-menu',
  statusText: 'World session paused.',
  detailLines: [],
  menuSections: [
    {
      title: 'Resume World (Enter)',
      lines: ['Continue with the current world, player state, and debug edits intact.'],
      tone: 'accent'
    },
    {
      title: 'Reset Shell Toggles',
      lines: [
        'Keep the paused session intact while clearing saved shell visibility and restoring the default-off shell layout before the next Resume World (Enter).'
      ]
    },
    {
      title: 'New World (N)',
      lines: ['Discard the paused session, camera state, and undo history before a fresh world boots.'],
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

describe('main.ts shell state orchestration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();

    testRuntime.appRoot = new testRuntime.FakeHTMLElement('div');
    testRuntime.windowListeners.clear();
    testRuntime.shellInstance = null;
    testRuntime.debugOverlayInstance = null;
    testRuntime.debugEditControlsInstance = null;
    testRuntime.hoveredTileCursorInstance = null;
    testRuntime.armedDebugToolPreviewInstance = null;
    testRuntime.debugEditStatusStripInstance = null;
    testRuntime.playerSpawnMarkerInstance = null;
    testRuntime.rendererConstructorError = null;
    testRuntime.rendererInitializeError = null;
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

  it('applies keyboard shell-toggle shortcuts through one shared persisted mutator for on and off transitions', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (const [key, code] of [
      ['h', ''],
      ['g', ''],
      ['v', ''],
      ['m', ''],
      ['?', 'Slash']
    ] as const) {
      expect(dispatchKeydown(key, code).prevented).toBe(true);
    }

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
