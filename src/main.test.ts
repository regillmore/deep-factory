import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS } from './gl/standalonePlayerPlaceholder';
import type { ArmedDebugToolPreviewState } from './input/controller';
import { DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY } from './input/debugEditControlStatePersistence';
import {
  createDefaultShellActionKeybindingState,
  loadShellActionKeybindingStateWithDefaultFallbackStatus,
  SHELL_ACTION_KEYBINDING_STORAGE_KEY,
  type ShellActionKeybindingState
} from './input/shellActionKeybindings';
import {
  createDefaultWorldSessionShellState,
  WORLD_SESSION_SHELL_STATE_STORAGE_KEY
} from './mainWorldSessionShellState';
import {
  createDefaultWorldSessionGameplayState,
  WORLD_SESSION_GAMEPLAY_STATE_STORAGE_KEY
} from './mainWorldSessionGameplayState';
import {
  createDefaultWorldSessionTelemetryState,
  WORLD_SESSION_TELEMETRY_STATE_STORAGE_KEY
} from './mainWorldSessionTelemetryState';
import { createWorldSessionShellProfileEnvelope } from './mainWorldSessionShellProfile';
import { createWorldSaveEnvelope } from './mainWorldSave';
import { PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY } from './mainWorldSaveLocalPersistence';
import {
  createDefaultBootShellState,
  createFirstLaunchMainMenuShellState,
  createInWorldShellState,
  createMainMenuShellState,
  createRendererInitializationFailedBootShellState,
  createWebGlUnavailableBootShellState,
  resolvePausedMainMenuWorldSaveSectionState,
  type AppShellState,
  type PausedMainMenuClearSavedWorldResult,
  type PausedMainMenuExportResult,
  type PausedMainMenuImportResult,
  type PausedMainMenuRecentActivityAction,
  type PausedMainMenuResetShellTelemetryResult,
  type PausedMainMenuResetShellTogglesResult,
  type PausedMainMenuSavedWorldStatus
} from './ui/appShell';
import type { DebugOverlayInspectState } from './ui/debugOverlay';
import type { DebugEditStatusStripState } from './ui/debugEditStatusHelpers';
import type { PlayerItemAxeChopPreviewState } from './ui/playerItemAxeChopPreviewOverlay';
import type { PlayerItemBunnyReleasePreviewState } from './ui/playerItemBunnyReleasePreviewOverlay';
import type { PlayerItemMiningPreviewState } from './ui/playerItemMiningPreviewOverlay';
import type { PlayerItemPlacementPreviewState } from './ui/playerItemPlacementPreviewOverlay';
import type { PlayerItemSpearPreviewState } from './ui/playerItemSpearPreviewOverlay';
import { createDroppedItemState } from './world/droppedItem';
import { createPlayerInventoryState } from './world/playerInventory';
import { AUTHORED_ATLAS_HEIGHT, AUTHORED_ATLAS_WIDTH } from './world/authoredAtlasLayout';
import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './world/constants';
import {
  DEFAULT_THROWN_BOMB_GRAVITY,
  DEFAULT_THROWN_BOMB_SPEED
} from './world/bombThrowing';
import { DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP } from './world/playerManaCrystal';
import {
  PROCEDURAL_DIRT_TILE_ID,
  PROCEDURAL_COPPER_ORE_TILE_ID,
  PROCEDURAL_GRASS_SURFACE_TILE_ID,
  resolveProceduralTerrainColumn
} from './world/proceduralTerrain';
import {
  createPlayerState,
  DEFAULT_PLAYER_HEIGHT,
  DEFAULT_PLAYER_MANA_REGEN_DELAY_SECONDS,
  DEFAULT_PLAYER_MANA_REGEN_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_MAX_MANA,
  DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS,
  DEFAULT_PLAYER_WIDTH,
  getPlayerCameraFocusPoint
} from './world/playerState';
import {
  STARTER_AXE_SWING_ACTIVE_SECONDS,
  STARTER_AXE_SWING_RECOVERY_SECONDS,
  STARTER_AXE_SWING_WINDUP_SECONDS
} from './world/starterAxeChopping';
import {
  STARTER_PICKAXE_SWING_ACTIVE_SECONDS,
  STARTER_PICKAXE_SWING_RECOVERY_SECONDS,
  STARTER_PICKAXE_SWING_WINDUP_SECONDS
} from './world/starterPickaxeMining';
import { PLACEABLE_WOOD_BLOCK_TILE_ID } from './world/starterBlockPlacement';
import { STARTER_DIRT_WALL_ID, STARTER_WOOD_WALL_ID } from './world/starterWallPlacement';
import { STARTER_PLATFORM_TILE_ID } from './world/starterPlatformPlacement';
import {
  DEFAULT_STARTER_MELEE_WEAPON_DAMAGE,
  DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_X,
  DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_Y,
  STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS,
  STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS,
  STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS
} from './world/starterMeleeWeapon';
import {
  DEFAULT_STARTER_SPEAR_DAMAGE,
  DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED,
  DEFAULT_STARTER_SPEAR_REACH,
  STARTER_SPEAR_THRUST_ACTIVE_SECONDS,
  STARTER_SPEAR_THRUST_RECOVERY_SECONDS,
  STARTER_SPEAR_THRUST_WINDUP_SECONDS
} from './world/starterSpear';
import {
  DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS,
  DEFAULT_STARTER_WAND_FIREBOLT_DAMAGE,
  DEFAULT_STARTER_WAND_MANA_COST,
  DEFAULT_STARTER_WAND_FIREBOLT_KNOCKBACK_SPEED,
  DEFAULT_STARTER_WAND_FIREBOLT_SPEED
} from './world/starterWand';
import { STARTER_BUG_NET_SWING_WINDUP_SECONDS } from './world/starterBugNet';
import { STARTER_ROPE_TILE_ID } from './world/starterRopePlacement';
import {
  DEFAULT_GRASS_GROWTH_INTERVAL_TICKS,
  resolveGrassGrowthWindowIndex
} from './world/grassGrowth';
import {
  DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS,
  resolveSmallTreeGrowthRequiredChunkBounds,
  resolveSmallTreeGrowthWindowIndex
} from './world/smallTreeGrowth';
import { resolveSmallTreeGrowthStageAtAnchor } from './world/smallTreeAnchors';
import { getSmallTreeSaplingTileId, getSmallTreeTileIds } from './world/smallTreeTiles';
import { getSurfaceFlowerTileId } from './world/surfaceFlowerTiles';
import { getTallGrassTileId } from './world/tallGrassTiles';
import { STARTER_TORCH_TILE_ID } from './world/starterTorchPlacement';
import { STARTER_WORKBENCH_TILE_ID } from './world/starterWorkbenchPlacement';
import { STARTER_FURNACE_TILE_ID } from './world/starterFurnacePlacement';
import { STARTER_ANVIL_TILE_ID } from './world/starterAnvilPlacement';
import {
  describeLiquidRenderVariantPixelBoundsAtElapsedMs,
  describeLiquidRenderVariantUvRectAtElapsedMs,
  describeTileRenderPixelBoundsAtElapsedMs,
  describeTileRenderSourceAtElapsedMs,
  describeTileRenderUvRectAtElapsedMs
} from './world/tileMetadata';
import {
  describeWallRenderPixelBounds,
  describeWallRenderSource,
  describeWallRenderUvRect
} from './world/wallMetadata';
import { worldToChunkCoord, worldToLocalTile } from './world/chunkMath';
import { DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS } from './world/hostileSlimeCombat';
import { DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS } from './world/hostileSlimeSpawn';
import {
  DEFAULT_HOSTILE_SLIME_HEALTH,
  DEFAULT_HOSTILE_SLIME_HEIGHT,
  DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
  DEFAULT_HOSTILE_SLIME_WIDTH
} from './world/hostileSlimeState';
import { DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS } from './world/passiveBunnySpawn';
import {
  DEFAULT_PASSIVE_BUNNY_HEIGHT,
  DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS,
  DEFAULT_PASSIVE_BUNNY_WIDTH
} from './world/passiveBunnyState';
import { TileWorld, type TileEditEvent, type WallEditEvent, type WorldEditOrigin } from './world/world';

const CUSTOM_SHELL_ACTION_KEYBINDINGS: ShellActionKeybindingState = {
  'return-to-main-menu': 'X',
  'recenter-camera': 'Z',
  'toggle-debug-overlay': 'U',
  'toggle-debug-edit-controls': 'J',
  'toggle-debug-edit-overlays': 'K',
  'toggle-player-spawn-marker': 'Y'
};

const worldTileKey = (worldTileX: number, worldTileY: number): string => `${worldTileX},${worldTileY}`;
const chunkCoordKey = (chunkX: number, chunkY: number): string => `${chunkX},${chunkY}`;
const findFirstProceduralPlantedSmallTreeAnchor = (
  worldSeed = 0,
  minWorldX = CHUNK_SIZE,
  maxWorldX = CHUNK_SIZE * 8
): { anchorTileX: number; anchorTileY: number } | null => {
  const world = new TileWorld(0, worldSeed);

  for (let worldTileX = minWorldX; worldTileX <= maxWorldX; worldTileX += 1) {
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX, worldSeed);
    if (resolveSmallTreeGrowthStageAtAnchor(world, worldTileX, surfaceTileY) !== 'planted') {
      continue;
    }

    return {
      anchorTileX: worldTileX,
      anchorTileY: surfaceTileY
    };
  }

  return null;
};

const syncRendererMapsFromWorldSnapshot = (snapshot: ReturnType<TileWorld['createSnapshot']>): void => {
  testRuntime.rendererTileIdsByWorldKey.clear();
  testRuntime.rendererWallIdsByWorldKey.clear();
  testRuntime.rendererLiquidLevelsByWorldKey.clear();
  testRuntime.rendererLightLevelsByWorldKey.clear();

  const world = new TileWorld(0);
  world.loadSnapshot(snapshot);

  const chunkKeys = new Set<string>();
  for (const residentChunk of snapshot.residentChunks) {
    chunkKeys.add(chunkCoordKey(residentChunk.coord.x, residentChunk.coord.y));
  }
  for (const editedChunk of snapshot.editedChunks) {
    chunkKeys.add(chunkCoordKey(editedChunk.coord.x, editedChunk.coord.y));
  }

  for (const key of chunkKeys) {
    const [rawChunkX, rawChunkY] = key.split(',');
    const chunkX = Number(rawChunkX);
    const chunkY = Number(rawChunkY);
    for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
      for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
        const worldTileX = chunkX * CHUNK_SIZE + localX;
        const worldTileY = chunkY * CHUNK_SIZE + localY;
        const tileId = world.getTile(worldTileX, worldTileY);
        if (tileId !== 0) {
          testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(worldTileX, worldTileY), tileId);
        }

        const wallId = world.getWall(worldTileX, worldTileY);
        if (wallId !== 0) {
          testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(worldTileX, worldTileY), wallId);
        }

        const liquidLevel = world.getLiquidLevel(worldTileX, worldTileY);
        if (liquidLevel > 0) {
          testRuntime.rendererLiquidLevelsByWorldKey.set(
            worldTileKey(worldTileX, worldTileY),
            liquidLevel
          );
        }

        const lightLevel = world.getLightLevel(worldTileX, worldTileY);
        if (lightLevel > 0) {
          testRuntime.rendererLightLevelsByWorldKey.set(worldTileKey(worldTileX, worldTileY), lightLevel);
        }
      }
    }
  }
};

const applyRendererTileEditsToWorldSnapshot = (editEvents: readonly TileEditEvent[]): void => {
  const world = new TileWorld(0);
  world.loadSnapshot(testRuntime.rendererWorldSnapshot ?? new TileWorld(0).createSnapshot());
  for (const event of editEvents) {
    world.setTileState(event.worldTileX, event.worldTileY, event.tileId, event.liquidLevel);
  }
  testRuntime.rendererWorldSnapshot = world.createSnapshot();
};

const applyRendererWallEditsToWorldSnapshot = (
  wallEdits: ReadonlyArray<{
    worldTileX: number;
    worldTileY: number;
    wallId: number;
  }>
): void => {
  const world = new TileWorld(0);
  world.loadSnapshot(testRuntime.rendererWorldSnapshot ?? new TileWorld(0).createSnapshot());
  for (const edit of wallEdits) {
    world.setWall(edit.worldTileX, edit.worldTileY, edit.wallId);
  }
  testRuntime.rendererWorldSnapshot = world.createSnapshot();
};

const createTileEditEvent = (
  worldTileX: number,
  worldTileY: number,
  previousTileId: number,
  tileId: number,
  previousLiquidLevel = 0,
  liquidLevel = 0,
  editOrigin: WorldEditOrigin = 'gameplay'
): TileEditEvent => {
  const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
  const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
  return {
    worldTileX,
    worldTileY,
    chunkX,
    chunkY,
    localX,
    localY,
    previousTileId,
    previousLiquidLevel,
    tileId,
    liquidLevel,
    editOrigin
  };
};

const createWallEditEvent = (
  worldTileX: number,
  worldTileY: number,
  previousWallId: number,
  wallId: number,
  editOrigin: WorldEditOrigin = 'gameplay'
): WallEditEvent => {
  const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
  const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
  return {
    worldTileX,
    worldTileY,
    chunkX,
    chunkY,
    localX,
    localY,
    previousWallId,
    wallId,
    editOrigin
  };
};

const createEmptyArmedDebugToolPreviewState = (): ArmedDebugToolPreviewState => ({
  armedFloodFillKind: null,
  armedLineKind: null,
  armedRectKind: null,
  armedRectOutlineKind: null,
  armedEllipseKind: null,
  armedEllipseOutlineKind: null,
  activeMouseLineDrag: null,
  pendingTouchLineStart: null,
  activeMouseRectDrag: null,
  activeMouseRectOutlineDrag: null,
  activeMouseEllipseDrag: null,
  activeMouseEllipseOutlineDrag: null,
  pendingTouchRectStart: null,
  pendingTouchRectOutlineStart: null,
  pendingTouchEllipseStart: null,
  pendingTouchEllipseOutlineStart: null,
  resolvedBreakPreviewAffectedTileCount: null,
  resolvedBreakPreviewTargets: null
});

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
      options: Record<string, (...args: unknown[]) => unknown>;
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
      world?: { x: number; y: number };
    },
    armedDebugToolPreviewState: null as ArmedDebugToolPreviewState | null,
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
    debugEditControlsSetShellActionKeybindingsCallCount: 0,
    debugEditControlsArmedToolSetterCallCount: 0,
    debugEditControlsShellActionKeybindings: null as ShellActionKeybindingState | null,
    craftingPanelInstance: null as null | {
      visible: boolean;
      triggerCraftRecipe(recipeId: string): void;
    },
    equipmentPanelInstance: null as null | {
      visible: boolean;
      triggerToggleSlot(slotId: 'head' | 'body' | 'legs'): void;
    },
    itemCatalogPanelInstance: null as null | {
      visible: boolean;
      triggerSearchQueryChange(query: string): void;
      triggerSpawnItem(itemId: string): void;
      triggerCraftRecipe(recipeId: string): void;
    },
    latestCraftingPanelState: null as null | {
      stations: Array<{
        stationId: string;
        label: string;
        inRange: boolean;
      }>;
      recipes: Array<{
        recipeId: string;
        label: string;
        ingredientsLabel: string;
        outputLabel: string;
        availabilityLabel: string;
        enabled: boolean;
        disabledReason?: string | null;
      }>;
    },
    latestEquipmentPanelState: null as null | {
      totalDefense: number;
      slots: Array<{
        slotId: 'head' | 'body' | 'legs';
        slotLabel: string;
        itemLabel: string;
        defenseLabel: string;
        equipped: boolean;
      }>;
    },
    latestItemCatalogPanelState: null as null | {
      searchQuery: string;
      resultSummaryLabel: string;
      itemEmptyLabel: string;
      items: Array<{
        itemId: string;
        label: string;
        detailsLabel: string;
        inventoryLabel: string;
        enabled: boolean;
        disabledReason?: string | null;
      }>;
      recipeEmptyLabel: string;
      recipes: Array<{
        recipeId: string;
        label: string;
        outputLabel: string;
        ingredientsLabel: string;
        stationRequirementLabel: string;
        availabilityLabel: string;
        enabled: boolean;
        disabledReason?: string | null;
      }>;
    },
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
      setShellActionKeybindings(keybindings: ShellActionKeybindingState): void;
    },
    hoveredTileCursorInstance: null as null | { visible: boolean },
    playerItemAxeChopPreviewInstance: null as null | { visible: boolean },
    playerItemBunnyReleasePreviewInstance: null as null | { visible: boolean },
    playerItemMiningPreviewInstance: null as null | { visible: boolean },
    playerItemPlacementPreviewInstance: null as null | { visible: boolean },
    playerItemSpearPreviewInstance: null as null | { visible: boolean },
    armedDebugToolPreviewInstance: null as null | { visible: boolean },
    debugEditStatusStripInstance: null as null | { visible: boolean },
    playerSpawnMarkerInstance: null as null | { visible: boolean },
    rendererConstructorError: null as unknown,
    rendererInitializeError: null as unknown,
    rendererConstructCount: 0,
    rendererInstance: null as object | null,
    rendererLoadWorldSnapshotCallCount: 0,
    rendererGetResidentChunkBoundsCallCount: 0,
    rendererHasResidentChunkCallCount: 0,
    rendererResetWorldSeeds: [] as number[],
    rendererFindPlayerSpawnPointImpl: null as null | ((options: unknown) => unknown),
    rendererHasOpenSkyAboveImpl: null as null | ((
      worldTileX: number,
      standingTileY: number
    ) => boolean),
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
      jumpPressed: false,
      ropeDropHeld: false,
      ropeDropWindowArmed: false
    } as {
      moveX: number;
      jumpHeld: boolean;
      jumpPressed: boolean;
      ropeDropHeld?: boolean;
      ropeDropWindowArmed?: boolean;
    },
    canvasInteractionMode: 'debug-edit' as 'debug-edit' | 'play',
    fixedStepWorldUpdateOrder: [] as string[],
    playerItemUseRequests: [] as Array<{
      worldTileX: number;
      worldTileY: number;
      worldX?: number;
      worldY?: number;
      pointerType: 'mouse' | 'touch';
    }>,
    debugTileEdits: [] as Array<{
      strokeId: number;
      worldTileX: number;
      worldTileY: number;
      kind: 'place' | 'break';
    }>,
    completedDebugTileStrokes: [] as Array<{
      strokeId: number;
    }>,
    rendererTileId: 0,
    rendererTileIdsByWorldKey: new Map<string, number>(),
    rendererWallIdsByWorldKey: new Map<string, number>(),
    rendererLiquidLevel: 0,
    rendererLiquidLevelsByWorldKey: new Map<string, number>(),
    rendererLightLevelsByWorldKey: new Map<string, number>(),
    rendererLiquidRenderCardinalMask: null as number | null,
    rendererSetTileResult: false,
    rendererPersistentSetTileResult: false,
    rendererSetTileCalls: [] as Array<{
      worldTileX: number;
      worldTileY: number;
      tileId: number;
      editOrigin?: WorldEditOrigin;
    }>,
    rendererSetWallResult: false,
    rendererPersistentSetWallResult: false,
    rendererSetWallCalls: [] as Array<{
      worldTileX: number;
      worldTileY: number;
      wallId: number;
      editOrigin?: WorldEditOrigin;
    }>,
    rendererTileEditListeners: [] as Array<(event: TileEditEvent) => void>,
    rendererWallEditListeners: [] as Array<(event: WallEditEvent) => void>,
    rendererNextSetTileEditEvents: null as TileEditEvent[] | null,
    rendererNextSetWallEditEvents: null as WallEditEvent[] | null,
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
        glideHeld?: boolean;
      };
    }>,
    rendererStepHostileSlimeStateImpl: null as null | ((
      state: unknown,
      fixedDt: number,
      playerState: unknown
    ) => unknown),
    rendererStepHostileSlimeStateRequests: [] as Array<{
      state: {
        position: { x: number; y: number } | null;
        velocity: { x: number; y: number } | null;
        health: number | null;
        grounded: boolean | null;
        facing: 'left' | 'right' | null;
        hopCooldownTicksRemaining: number | null;
      };
      fixedDt: number;
      playerPosition: { x: number; y: number } | null;
    }>,
    rendererStepPassiveBunnyStateImpl: null as null | ((state: unknown, fixedDt: number) => unknown),
    rendererStepPassiveBunnyStateRequests: [] as Array<{
      state: {
        position: { x: number; y: number } | null;
        velocity: { x: number; y: number } | null;
        grounded: boolean | null;
        facing: 'left' | 'right' | null;
        hopCooldownTicksRemaining: number | null;
      };
      fixedDt: number;
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
      residentSleepingLiquidChunks: 0,
      residentActiveLiquidMinChunkX: null as number | null,
      residentActiveLiquidMinChunkY: null as number | null,
      residentActiveLiquidMaxChunkX: null as number | null,
      residentActiveLiquidMaxChunkY: null as number | null,
      residentSleepingLiquidMinChunkX: null as number | null,
      residentSleepingLiquidMinChunkY: null as number | null,
      residentSleepingLiquidMaxChunkX: null as number | null,
      residentSleepingLiquidMaxChunkY: null as number | null,
      liquidStepSidewaysCandidateMinChunkX: null as number | null,
      liquidStepSidewaysCandidateMinChunkY: null as number | null,
      liquidStepSidewaysCandidateMaxChunkX: null as number | null,
      liquidStepSidewaysCandidateMaxChunkY: null as number | null,
      liquidStepPhaseSummary: 'none' as 'none' | 'downward' | 'sideways' | 'both',
      liquidStepDownwardActiveChunksScanned: 0,
      liquidStepSidewaysCandidateChunksScanned: 0,
      liquidStepSidewaysPairsTested: 0,
      liquidStepDownwardTransfersApplied: 0,
      liquidStepSidewaysTransfersApplied: 0,
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
      slimeCurrentPositions: Array<{ id: number; position: { x: number; y: number } }>;
      bunnyCurrentPositions: Array<{ id: number; position: { x: number; y: number } }>;
      fireboltCurrentPositions: Array<{ id: number; position: { x: number; y: number } }>;
      bombCurrentPositions: Array<{ id: number; position: { x: number; y: number } }>;
      renderAlpha: number | null;
      timeMs: number | null;
    },
    latestDebugOverlayInspectState: null as DebugOverlayInspectState | null,
    latestDebugEditStatusStripState: null as DebugEditStatusStripState | null,
    latestHoveredTileCursorTargets: null as
      | {
          hovered:
            | {
                tileX: number;
                tileY: number;
                previewTone?: 'default' | 'debug-break-tile' | 'debug-break-wall';
              }
            | null;
          pinned:
            | {
                tileX: number;
                tileY: number;
              }
            | null;
        }
      | null,
    latestArmedDebugToolPreviewState: null as ArmedDebugToolPreviewState | null,
    latestPlayerItemAxeChopPreviewState: null as PlayerItemAxeChopPreviewState | null,
    latestPlayerItemBunnyReleasePreviewState: null as PlayerItemBunnyReleasePreviewState | null,
    latestPlayerItemMiningPreviewState: null as PlayerItemMiningPreviewState | null,
    latestPlayerItemPlacementPreviewState: null as PlayerItemPlacementPreviewState | null,
    latestPlayerItemSpearPreviewState: null as PlayerItemSpearPreviewState | null,
    rendererWorldSnapshot: null as ReturnType<TileWorld['createSnapshot']> | null,
    rendererResidentChunkBounds: {
      minChunkX: 0,
      maxChunkX: 0,
      minChunkY: 0,
      maxChunkY: 0
    } as
      | {
          minChunkX: number;
          maxChunkX: number;
          minChunkY: number;
          maxChunkY: number;
        }
      | null,
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
    storageRemoveItemErrorsByKey: new Map<string, Error>(),
    downloadedWorldSaveEnvelopes: [] as unknown[],
    downloadWorldSaveFilename: 'deep-factory-world-save-2026-03-08T05-06-07Z.json',
    downloadWorldSaveError: null as Error | null,
    downloadedShellProfileEnvelopes: [] as unknown[],
    downloadShellProfileFilename: 'deep-factory-shell-profile-2026-03-11T05-06-07Z.json',
    downloadShellProfileError: null as Error | null,
    queuedShellProfileImportResults: [] as unknown[],
    shellProfileImportCallCount: 0,
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
              id?: number;
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
      const slimeCurrentPositions = Array.isArray(renderState.entities)
        ? renderState.entities
            .filter((entity) => entity?.kind === 'slime')
            .flatMap((entity) => {
              const snapshot = entity?.snapshot?.current;
              if (
                !snapshot?.position ||
                typeof entity?.id !== 'number' ||
                typeof snapshot.position.x !== 'number' ||
                typeof snapshot.position.y !== 'number'
              ) {
                return [];
              }

              return [
                {
                  id: entity.id,
                  position: {
                    x: snapshot.position.x,
                    y: snapshot.position.y
                  }
                }
              ];
            })
        : [];
      const bunnyCurrentPositions = Array.isArray(renderState.entities)
        ? renderState.entities
            .filter((entity) => entity?.kind === 'bunny')
            .flatMap((entity) => {
              const snapshot = entity?.snapshot?.current;
              if (
                !snapshot?.position ||
                typeof entity?.id !== 'number' ||
                typeof snapshot.position.x !== 'number' ||
                typeof snapshot.position.y !== 'number'
              ) {
                return [];
              }

              return [
                {
                  id: entity.id,
                  position: {
                    x: snapshot.position.x,
                    y: snapshot.position.y
                  }
                }
              ];
            })
        : [];
      const fireboltCurrentPositions = Array.isArray(renderState.entities)
        ? renderState.entities
            .filter((entity) => entity?.kind === 'wand-firebolt')
            .flatMap((entity) => {
              const snapshot = entity?.snapshot?.current;
              if (
                !snapshot?.position ||
                typeof entity?.id !== 'number' ||
                typeof snapshot.position.x !== 'number' ||
                typeof snapshot.position.y !== 'number'
              ) {
                return [];
              }

              return [
                {
                  id: entity.id,
                  position: {
                    x: snapshot.position.x,
                    y: snapshot.position.y
                  }
                }
              ];
            })
        : [];
      const bombCurrentPositions = Array.isArray(renderState.entities)
        ? renderState.entities
            .filter((entity) => entity?.kind === 'thrown-bomb')
            .flatMap((entity) => {
              const snapshot = entity?.snapshot?.current;
              if (
                !snapshot?.position ||
                typeof entity?.id !== 'number' ||
                typeof snapshot.position.x !== 'number' ||
                typeof snapshot.position.y !== 'number'
              ) {
                return [];
              }

              return [
                {
                  id: entity.id,
                  position: {
                    x: snapshot.position.x,
                    y: snapshot.position.y
                  }
                }
              ];
            })
        : [];
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
        slimeCurrentPositions,
        bunnyCurrentPositions,
        fireboltCurrentPositions,
        bombCurrentPositions,
        renderAlpha: typeof renderState.renderAlpha === 'number' ? renderState.renderAlpha : null,
        timeMs: renderState.timeMs ?? null
      };
    }

    findPlayerSpawnPoint(options?: unknown) {
      const search = options as
        | {
            width?: number;
            height?: number;
            isCandidateSpawnAllowed?: ((spawnPoint: unknown) => boolean) | undefined;
          }
        | undefined;
      const applyCandidateFilter = <T>(spawnPoint: T): T | null => {
        if (
          spawnPoint !== null &&
          spawnPoint !== undefined &&
          typeof search?.isCandidateSpawnAllowed === 'function' &&
          !search.isCandidateSpawnAllowed(spawnPoint)
        ) {
          return null;
        }

        return spawnPoint;
      };

      if (testRuntime.rendererFindPlayerSpawnPointImpl !== null) {
        return applyCandidateFilter(testRuntime.rendererFindPlayerSpawnPointImpl(options));
      }

      if (
        search?.width === DEFAULT_PLAYER_WIDTH &&
        search?.height === DEFAULT_PLAYER_HEIGHT
      ) {
        return applyCandidateFilter(testRuntime.playerSpawnPoint);
      }

      return null;
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

    getPlayerWaterSubmersionTelemetry(state?: unknown) {
      if (!state || typeof state !== 'object') {
        return {
          headSubmergedInWater: false,
          waterSubmergedFraction: 0,
          lavaSubmergedFraction: 0
        };
      }

      const playerState = state as {
        headSubmergedInWater?: unknown;
        waterSubmergedFraction?: unknown;
        lavaSubmergedFraction?: unknown;
      };
      return {
        headSubmergedInWater: playerState.headSubmergedInWater === true,
        waterSubmergedFraction:
          typeof playerState.waterSubmergedFraction === 'number' &&
          Number.isFinite(playerState.waterSubmergedFraction)
            ? playerState.waterSubmergedFraction
            : 0,
        lavaSubmergedFraction:
          typeof playerState.lavaSubmergedFraction === 'number' &&
          Number.isFinite(playerState.lavaSubmergedFraction)
            ? playerState.lavaSubmergedFraction
            : 0
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

    getWall(worldTileX?: number, worldTileY?: number): number {
      if (typeof worldTileX === 'number' && typeof worldTileY === 'number') {
        const mappedWallId = testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(worldTileX, worldTileY));
        if (mappedWallId !== undefined) {
          return mappedWallId;
        }
      }
      return 0;
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

    getLightLevel(worldTileX?: number, worldTileY?: number): number {
      if (typeof worldTileX === 'number' && typeof worldTileY === 'number') {
        const mappedLightLevel = testRuntime.rendererLightLevelsByWorldKey.get(
          worldTileKey(worldTileX, worldTileY)
        );
        if (mappedLightLevel !== undefined) {
          return mappedLightLevel;
        }
      }

      return 0;
    }

    hasOpenSkyAbove(worldTileX: number, standingTileY: number): boolean {
      if (testRuntime.rendererHasOpenSkyAboveImpl !== null) {
        return testRuntime.rendererHasOpenSkyAboveImpl(worldTileX, standingTileY);
      }

      return true;
    }

    onTileEdited(listener: (event: TileEditEvent) => void): () => void {
      testRuntime.rendererTileEditListeners.push(listener);
      return () => {
        testRuntime.rendererTileEditListeners = testRuntime.rendererTileEditListeners.filter(
          (registeredListener) => registeredListener !== listener
        );
      };
    }

    onWallEdited(listener: (event: WallEditEvent) => void): () => void {
      testRuntime.rendererWallEditListeners.push(listener);
      return () => {
        testRuntime.rendererWallEditListeners = testRuntime.rendererWallEditListeners.filter(
          (registeredListener) => registeredListener !== listener
        );
      };
    }

    setTile(
      worldTileX: number,
      worldTileY: number,
      tileId: number,
      editOrigin: WorldEditOrigin = 'gameplay'
    ): boolean {
      const previousTileId = this.getTile(worldTileX, worldTileY);
      const previousLiquidLevel = this.getLiquidLevel(worldTileX, worldTileY);
      testRuntime.rendererSetTileCalls.push(
        editOrigin === 'gameplay'
          ? {
              worldTileX,
              worldTileY,
              tileId
            }
          : {
              worldTileX,
              worldTileY,
              tileId,
              editOrigin
            }
      );
      const result = testRuntime.rendererSetTileResult;
      if (!testRuntime.rendererPersistentSetTileResult) {
        testRuntime.rendererSetTileResult = false;
      }
      if (result) {
        const editEvents =
          testRuntime.rendererNextSetTileEditEvents ?? [
            createTileEditEvent(
              worldTileX,
              worldTileY,
              previousTileId,
              tileId,
              previousLiquidLevel,
              0,
              editOrigin
            )
          ];
        testRuntime.rendererNextSetTileEditEvents = null;
        for (const event of editEvents) {
          testRuntime.rendererTileIdsByWorldKey.set(
            worldTileKey(event.worldTileX, event.worldTileY),
            event.tileId
          );
          if (event.liquidLevel > 0) {
            testRuntime.rendererLiquidLevelsByWorldKey.set(
              worldTileKey(event.worldTileX, event.worldTileY),
              event.liquidLevel
            );
          } else {
            testRuntime.rendererLiquidLevelsByWorldKey.delete(
              worldTileKey(event.worldTileX, event.worldTileY)
            );
          }
          for (const listener of testRuntime.rendererTileEditListeners) {
            listener({ ...event });
          }
        }
        applyRendererTileEditsToWorldSnapshot(editEvents);
      } else {
        testRuntime.rendererNextSetTileEditEvents = null;
      }
      return result;
    }

    setWall(
      worldTileX: number,
      worldTileY: number,
      wallId: number,
      editOrigin: WorldEditOrigin = 'gameplay'
    ): boolean {
      const previousWallId = this.getWall(worldTileX, worldTileY);
      testRuntime.rendererSetWallCalls.push(
        editOrigin === 'gameplay'
          ? {
              worldTileX,
              worldTileY,
              wallId
            }
          : {
              worldTileX,
              worldTileY,
              wallId,
              editOrigin
            }
      );
      const result = testRuntime.rendererSetWallResult;
      if (!testRuntime.rendererPersistentSetWallResult) {
        testRuntime.rendererSetWallResult = false;
      }
      if (result) {
        const editEvents =
          testRuntime.rendererNextSetWallEditEvents ?? [
            createWallEditEvent(worldTileX, worldTileY, previousWallId, wallId, editOrigin)
          ];
        testRuntime.rendererNextSetWallEditEvents = null;
        for (const event of editEvents) {
          if (event.wallId === 0) {
            testRuntime.rendererWallIdsByWorldKey.delete(worldTileKey(event.worldTileX, event.worldTileY));
          } else {
            testRuntime.rendererWallIdsByWorldKey.set(
              worldTileKey(event.worldTileX, event.worldTileY),
              event.wallId
            );
          }
          for (const listener of testRuntime.rendererWallEditListeners) {
            listener({ ...event });
          }
        }
        applyRendererWallEditsToWorldSnapshot(
          editEvents.map((event) => ({
            worldTileX: event.worldTileX,
            worldTileY: event.worldTileY,
            wallId: event.wallId
          }))
        );
      } else {
        testRuntime.rendererNextSetWallEditEvents = null;
      }
      return result;
    }

    stepLiquidSimulation(): boolean {
      testRuntime.rendererStepLiquidSimulationCallCount += 1;
      testRuntime.fixedStepWorldUpdateOrder.push('liquids');
      return false;
    }

    hasResidentChunk(chunkX: number, chunkY: number): boolean {
      testRuntime.rendererHasResidentChunkCallCount += 1;
      return (
        testRuntime.rendererWorldSnapshot?.residentChunks.some(
          (chunk) => chunk.coord.x === chunkX && chunk.coord.y === chunkY
        ) ?? false
      );
    }

    getResidentChunkBounds() {
      testRuntime.rendererGetResidentChunkBoundsCallCount += 1;
      return testRuntime.rendererResidentChunkBounds;
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
      syncRendererMapsFromWorldSnapshot(snapshot);
    }

    resetWorld(worldSeed = 0): void {
      testRuntime.rendererResetWorldSeeds.push(worldSeed);
      testRuntime.rendererWorldSnapshot = new TileWorld(0, worldSeed).createSnapshot();
      testRuntime.rendererTileIdsByWorldKey.clear();
      testRuntime.rendererWallIdsByWorldKey.clear();
      testRuntime.rendererLiquidLevelsByWorldKey.clear();
    }

    stepPlayerState<T>(state: T, fixedDt: number, intent: unknown): T {
      testRuntime.fixedStepWorldUpdateOrder.push('player');
      const playerState = state as {
        position?: { x?: number; y?: number };
        velocity?: { x?: number; y?: number };
        grounded?: boolean;
        facing?: 'left' | 'right';
      };
      const playerIntent = intent as { moveX?: number; jumpPressed?: boolean; glideHeld?: boolean };
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
            typeof playerIntent.jumpPressed === 'boolean' ? playerIntent.jumpPressed : null,
          ...(playerIntent.glideHeld === true ? { glideHeld: true } : {})
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

    getPlayerLandingImpactSpeed(state?: unknown): number {
      if (!state || typeof state !== 'object' || Array.isArray(state)) {
        return 0;
      }

      const playerState = state as {
        velocity?: { y?: unknown };
      };
      return typeof playerState.velocity?.y === 'number' && Number.isFinite(playerState.velocity.y)
        ? Math.max(0, Math.round(playerState.velocity.y))
        : 0;
    }

    stepHostileSlimeState<T>(state: T, fixedDt: number, playerState: unknown): T {
      testRuntime.fixedStepWorldUpdateOrder.push('slime');
      const slimeState = state as {
        position?: { x?: number; y?: number };
        velocity?: { x?: number; y?: number };
        health?: number;
        grounded?: boolean;
        facing?: 'left' | 'right';
        hopCooldownTicksRemaining?: number;
      };
      const targetPlayerState = playerState as {
        position?: { x?: number; y?: number };
      };
      testRuntime.rendererStepHostileSlimeStateRequests.push({
        state: {
          position:
            slimeState.position &&
            typeof slimeState.position.x === 'number' &&
            typeof slimeState.position.y === 'number'
              ? { x: slimeState.position.x, y: slimeState.position.y }
              : null,
          velocity:
            slimeState.velocity &&
            typeof slimeState.velocity.x === 'number' &&
            typeof slimeState.velocity.y === 'number'
              ? { x: slimeState.velocity.x, y: slimeState.velocity.y }
              : null,
          health: typeof slimeState.health === 'number' ? slimeState.health : null,
          grounded: typeof slimeState.grounded === 'boolean' ? slimeState.grounded : null,
          facing: slimeState.facing ?? null,
          hopCooldownTicksRemaining:
            typeof slimeState.hopCooldownTicksRemaining === 'number'
              ? slimeState.hopCooldownTicksRemaining
              : null
        },
        fixedDt,
        playerPosition:
          targetPlayerState.position &&
          typeof targetPlayerState.position.x === 'number' &&
          typeof targetPlayerState.position.y === 'number'
            ? {
                x: targetPlayerState.position.x,
                y: targetPlayerState.position.y
              }
            : null
      });
      if (testRuntime.rendererStepHostileSlimeStateImpl) {
        const steppedState = testRuntime.rendererStepHostileSlimeStateImpl(state, fixedDt, playerState);
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

    stepPassiveBunnyState<T>(state: T, fixedDt: number): T {
      testRuntime.fixedStepWorldUpdateOrder.push('bunny');
      const bunnyState = state as {
        position?: { x?: number; y?: number };
        velocity?: { x?: number; y?: number };
        grounded?: boolean;
        facing?: 'left' | 'right';
        hopCooldownTicksRemaining?: number;
      };
      testRuntime.rendererStepPassiveBunnyStateRequests.push({
        state: {
          position:
            bunnyState.position &&
            typeof bunnyState.position.x === 'number' &&
            typeof bunnyState.position.y === 'number'
              ? { x: bunnyState.position.x, y: bunnyState.position.y }
              : null,
          velocity:
            bunnyState.velocity &&
            typeof bunnyState.velocity.x === 'number' &&
            typeof bunnyState.velocity.y === 'number'
              ? { x: bunnyState.velocity.x, y: bunnyState.velocity.y }
              : null,
          grounded: typeof bunnyState.grounded === 'boolean' ? bunnyState.grounded : null,
          facing: bunnyState.facing ?? null,
          hopCooldownTicksRemaining:
            typeof bunnyState.hopCooldownTicksRemaining === 'number'
              ? bunnyState.hopCooldownTicksRemaining
              : null
        },
        fixedDt
      });
      if (testRuntime.rendererStepPassiveBunnyStateImpl) {
        const steppedState = testRuntime.rendererStepPassiveBunnyStateImpl(state, fixedDt);
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

vi.mock('./input/controller', async () => {
  const actual = await vi.importActual<typeof import('./input/controller')>('./input/controller');

  return {
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

    getCanvasInteractionMode(): 'debug-edit' | 'play' {
      return testRuntime.canvasInteractionMode;
    }

    setCanvasInteractionMode(mode: 'debug-edit' | 'play'): void {
      testRuntime.canvasInteractionMode = mode;
    }

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

    setTouchPlayerClimbDownHeld(): void {}

    update(): void {}

    getPointerInspect() {
      return testRuntime.pointerInspect;
    }

    getArmedDebugToolPreviewState() {
      return testRuntime.armedDebugToolPreviewState ?? createEmptyArmedDebugToolPreviewState();
    }

    getPlayerInputTelemetry() {
      return { ...testRuntime.playerMovementIntent };
    }

    consumePlayerItemUseRequests() {
      const requests = [...testRuntime.playerItemUseRequests];
      testRuntime.playerItemUseRequests = [];
      return requests;
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
      const strokes = [...testRuntime.completedDebugTileStrokes];
      testRuntime.completedDebugTileStrokes = [];
      return strokes;
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
    walkEllipseOutlineTileArea: actual.walkEllipseOutlineTileArea,
    walkFilledEllipseTileArea: actual.walkFilledEllipseTileArea,
    walkFilledRectangleTileArea: actual.walkFilledRectangleTileArea,
    walkRectangleOutlineTileArea: actual.walkRectangleOutlineTileArea,
    walkLineSteppedTilePath: actual.walkLineSteppedTilePath
  };
});

vi.mock('./input/debugTileEditHistory', () => ({
  DebugTileEditHistory: class {
    private pendingStrokes = new Map<
      number,
      {
        changes: Array<{
          worldTileX: number;
          worldTileY: number;
          layer: 'tile' | 'wall';
          previousId: number;
          id: number;
        }>;
        changeIndexesByKey: Map<string, number>;
      }
    >();
    private undoStack: Array<
      Array<{
        worldTileX: number;
        worldTileY: number;
        layer: 'tile' | 'wall';
        previousId: number;
        id: number;
      }>
    > = [];
    private redoStack: Array<
      Array<{
        worldTileX: number;
        worldTileY: number;
        layer: 'tile' | 'wall';
        previousId: number;
        id: number;
      }>
    > = [];

    constructor() {
      testRuntime.debugTileEditHistoryConstructCount += 1;
      const nextStatus = testRuntime.debugTileEditHistoryConstructorStatuses.shift();
      this.undoStack = Array.from(
        { length: Math.max(0, nextStatus?.undoStrokeCount ?? 0) },
        () => []
      );
      this.redoStack = Array.from(
        { length: Math.max(0, nextStatus?.redoStrokeCount ?? 0) },
        () => []
      );
      this.syncStatus();
    }

    private syncStatus(): void {
      testRuntime.debugTileEditHistoryStatus = {
        undoStrokeCount: this.undoStack.length,
        redoStrokeCount: this.redoStack.length
      };
    }

    getStatus() {
      this.syncStatus();
      return { ...testRuntime.debugTileEditHistoryStatus };
    }

    recordAppliedEdit(
      strokeId: number,
      worldTileX: number,
      worldTileY: number,
      previousId: number,
      id: number,
      layer: 'tile' | 'wall' = 'tile'
    ): void {
      if (previousId === id) return;

      let pending = this.pendingStrokes.get(strokeId);
      if (!pending) {
        pending = {
          changes: [],
          changeIndexesByKey: new Map<string, number>()
        };
        this.pendingStrokes.set(strokeId, pending);
      }

      const key = `${layer}:${worldTileX},${worldTileY}`;
      const existingChangeIndex = pending.changeIndexesByKey.get(key);
      if (existingChangeIndex !== undefined) {
        pending.changes[existingChangeIndex]!.id = id;
        return;
      }

      pending.changeIndexesByKey.set(key, pending.changes.length);
      pending.changes.push({
        worldTileX,
        worldTileY,
        layer,
        previousId,
        id
      });
    }

    completeStroke(strokeId: number): boolean {
      const pending = this.pendingStrokes.get(strokeId);
      if (!pending) return false;

      this.pendingStrokes.delete(strokeId);
      if (pending.changes.length === 0) return false;

      this.undoStack.push(pending.changes);
      this.redoStack = [];
      this.syncStatus();
      return true;
    }

    undo(
      applyEdit: (
        worldTileX: number,
        worldTileY: number,
        layer: 'tile' | 'wall',
        id: number
      ) => void
    ): boolean {
      testRuntime.debugHistoryUndoCallCount += 1;
      const stroke = this.undoStack.pop();
      if (!stroke) {
        this.syncStatus();
        return false;
      }

      for (let index = stroke.length - 1; index >= 0; index -= 1) {
        const change = stroke[index]!;
        applyEdit(change.worldTileX, change.worldTileY, change.layer, change.previousId);
      }

      this.redoStack.push(stroke);
      this.syncStatus();
      return true;
    }

    redo(
      applyEdit: (
        worldTileX: number,
        worldTileY: number,
        layer: 'tile' | 'wall',
        id: number
      ) => void
    ): boolean {
      testRuntime.debugHistoryRedoCallCount += 1;
      const stroke = this.redoStack.pop();
      if (!stroke) {
        this.syncStatus();
        return false;
      }

      for (const change of stroke) {
        applyEdit(change.worldTileX, change.worldTileY, change.layer, change.id);
      }

      this.undoStack.push(stroke);
      this.syncStatus();
      return true;
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
      options: Record<string, (...args: unknown[]) => unknown>;
      private worldHost = new testRuntime.FakeHTMLElement('div');

      constructor(_root: unknown, options: Record<string, (...args: unknown[]) => unknown>) {
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

vi.mock('./mainWorldSessionShellProfileDownload', () => ({
  downloadWorldSessionShellProfileEnvelope: vi.fn(({ envelope }: { envelope: unknown }) => {
    if (testRuntime.downloadShellProfileError !== null) {
      throw testRuntime.downloadShellProfileError;
    }
    testRuntime.downloadedShellProfileEnvelopes.push(envelope);
    return testRuntime.downloadShellProfileFilename;
  })
}));

vi.mock('./mainWorldSessionShellProfileImport', async () => {
  const actual =
    await vi.importActual<typeof import('./mainWorldSessionShellProfileImport')>(
      './mainWorldSessionShellProfileImport'
    );

  return {
    ...actual,
    pickWorldSessionShellProfileEnvelopeFromJsonPicker: vi.fn(async () => {
      testRuntime.shellProfileImportCallCount += 1;
      return (testRuntime.queuedShellProfileImportResults.shift() ?? {
        status: 'cancelled'
      }) as Awaited<ReturnType<typeof actual.pickWorldSessionShellProfileEnvelopeFromJsonPicker>>;
    })
  };
});

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

    update(
      _camera: unknown,
      targets: {
        hovered:
          | {
              tileX: number;
              tileY: number;
              previewTone?: 'default' | 'debug-break-tile' | 'debug-break-wall';
            }
          | null;
        pinned:
          | {
              tileX: number;
              tileY: number;
            }
          | null;
      }
    ): void {
      testRuntime.latestHoveredTileCursorTargets = structuredClone(targets);
    }
  }
}));

vi.mock('./ui/playerItemBunnyReleasePreviewOverlay', () => ({
  PlayerItemBunnyReleasePreviewOverlay: class {
    visible = false;

    constructor() {
      testRuntime.playerItemBunnyReleasePreviewInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(_camera: unknown, state: PlayerItemBunnyReleasePreviewState | null): void {
      testRuntime.latestPlayerItemBunnyReleasePreviewState = state;
    }
  }
}));

vi.mock('./ui/playerItemAxeChopPreviewOverlay', () => ({
  PlayerItemAxeChopPreviewOverlay: class {
    visible = false;

    constructor() {
      testRuntime.playerItemAxeChopPreviewInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(_camera: unknown, state: PlayerItemAxeChopPreviewState | null): void {
      testRuntime.latestPlayerItemAxeChopPreviewState = state;
    }
  }
}));

vi.mock('./ui/playerItemPlacementPreviewOverlay', () => ({
  PlayerItemPlacementPreviewOverlay: class {
    visible = false;

    constructor() {
      testRuntime.playerItemPlacementPreviewInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(_camera: unknown, state: PlayerItemPlacementPreviewState | null): void {
      testRuntime.latestPlayerItemPlacementPreviewState = state;
    }
  }
}));

vi.mock('./ui/playerItemMiningPreviewOverlay', () => ({
  PlayerItemMiningPreviewOverlay: class {
    visible = false;

    constructor() {
      testRuntime.playerItemMiningPreviewInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(_camera: unknown, state: PlayerItemMiningPreviewState | null): void {
      testRuntime.latestPlayerItemMiningPreviewState = state;
    }
  }
}));

vi.mock('./ui/playerItemSpearPreviewOverlay', () => ({
  PlayerItemSpearPreviewOverlay: class {
    visible = false;

    constructor() {
      testRuntime.playerItemSpearPreviewInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(_camera: unknown, state: PlayerItemSpearPreviewState | null): void {
      testRuntime.latestPlayerItemSpearPreviewState = state;
    }
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

    update(_camera: unknown, _pointerInspect: unknown, state: ArmedDebugToolPreviewState): void {
      testRuntime.latestArmedDebugToolPreviewState = structuredClone(state);
    }
  }
}));

vi.mock('./ui/craftingPanel', () => ({
  CraftingPanel: class {
    visible = false;
    private onCraftRecipe: (recipeId: string) => void;

    constructor(options: { onCraftRecipe?: (recipeId: string) => void }) {
      this.onCraftRecipe = options.onCraftRecipe ?? (() => {});
      testRuntime.craftingPanelInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(state: {
      stations: Array<{
        stationId: string;
        label: string;
        inRange: boolean;
      }>;
      recipes: Array<{
        recipeId: string;
        label: string;
        ingredientsLabel: string;
        outputLabel: string;
        availabilityLabel: string;
        enabled: boolean;
        disabledReason?: string | null;
      }>;
    }): void {
      testRuntime.latestCraftingPanelState = {
        stations: state.stations.map((station) => ({ ...station })),
        recipes: state.recipes.map((recipe) => ({ ...recipe }))
      };
    }

    triggerCraftRecipe(recipeId: string): void {
      this.onCraftRecipe(recipeId);
    }
  }
}));

vi.mock('./ui/equipmentPanel', () => ({
  EquipmentPanel: class {
    visible = false;
    private onToggleSlot: (slotId: 'head' | 'body' | 'legs') => void;

    constructor(options: { onToggleSlot?: (slotId: 'head' | 'body' | 'legs') => void }) {
      this.onToggleSlot = options.onToggleSlot ?? (() => {});
      testRuntime.equipmentPanelInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(state: {
      totalDefense: number;
      slots: Array<{
        slotId: 'head' | 'body' | 'legs';
        slotLabel: string;
        itemLabel: string;
        defenseLabel: string;
        equipped: boolean;
      }>;
    }): void {
      testRuntime.latestEquipmentPanelState = {
        totalDefense: state.totalDefense,
        slots: state.slots.map((slot) => ({ ...slot }))
      };
    }

    triggerToggleSlot(slotId: 'head' | 'body' | 'legs'): void {
      this.onToggleSlot(slotId);
    }
  }
}));

vi.mock('./ui/itemCatalogPanel', () => ({
  ItemCatalogPanel: class {
    visible = false;
    private onSearchQueryChange: (query: string) => void;
    private onSpawnItem: (itemId: string) => void;
    private onCraftRecipe: (recipeId: string) => void;

    constructor(options: {
      onSearchQueryChange?: (query: string) => void;
      onSpawnItem?: (itemId: string) => void;
      onCraftRecipe?: (recipeId: string) => void;
    }) {
      this.onSearchQueryChange = options.onSearchQueryChange ?? (() => {});
      this.onSpawnItem = options.onSpawnItem ?? (() => {});
      this.onCraftRecipe = options.onCraftRecipe ?? (() => {});
      testRuntime.itemCatalogPanelInstance = this;
    }

    setVisible(visible: boolean): void {
      this.visible = visible;
    }

    update(state: {
      searchQuery: string;
      resultSummaryLabel: string;
      itemEmptyLabel: string;
      items: Array<{
        itemId: string;
        label: string;
        detailsLabel: string;
        inventoryLabel: string;
        enabled: boolean;
        disabledReason?: string | null;
      }>;
      recipeEmptyLabel: string;
      recipes: Array<{
        recipeId: string;
        label: string;
        outputLabel: string;
        ingredientsLabel: string;
        stationRequirementLabel: string;
        availabilityLabel: string;
        enabled: boolean;
        disabledReason?: string | null;
      }>;
    }): void {
      testRuntime.latestItemCatalogPanelState = {
        searchQuery: state.searchQuery,
        resultSummaryLabel: state.resultSummaryLabel,
        itemEmptyLabel: state.itemEmptyLabel,
        items: state.items.map((item) => ({ ...item })),
        recipeEmptyLabel: state.recipeEmptyLabel,
        recipes: state.recipes.map((recipe) => ({ ...recipe }))
      };
    }

    triggerSearchQueryChange(query: string): void {
      this.onSearchQueryChange(query);
    }

    triggerSpawnItem(itemId: string): void {
      this.onSpawnItem(itemId);
    }

    triggerCraftRecipe(recipeId: string): void {
      this.onCraftRecipe(recipeId);
    }
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
      shellActionKeybindings?: ShellActionKeybindingState;
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
      testRuntime.debugEditControlsShellActionKeybindings = options.shellActionKeybindings ?? null;
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

    setShellActionKeybindings(keybindings: ShellActionKeybindingState): void {
      testRuntime.debugEditControlsShellActionKeybindings = keybindings;
      testRuntime.debugEditControlsSetShellActionKeybindingsCallCount += 1;
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
const getWorldHost = (): InstanceType<typeof testRuntime.FakeHTMLElement> => {
  const shellInstance = testRuntime.shellInstance as
    | ({
        getWorldHost(): InstanceType<typeof testRuntime.FakeHTMLElement>;
      } & NonNullable<typeof testRuntime.shellInstance>)
    | null;
  if (shellInstance === null) {
    throw new Error('expected app shell instance');
  }

  return shellInstance.getWorldHost();
};
const getHotbarOverlayRoot = (): InstanceType<typeof testRuntime.FakeHTMLElement> => {
  const hotbarOverlayRoot = getWorldHost().children.find(
    (child): child is InstanceType<typeof testRuntime.FakeHTMLElement> =>
      child instanceof testRuntime.FakeHTMLElement &&
      child.style.position === 'fixed' &&
      child.style.bottom === '18px' &&
      child.style.zIndex === '22'
  );
  if (!hotbarOverlayRoot) {
    throw new Error('expected hotbar overlay root');
  }

  return hotbarOverlayRoot;
};
const getHotbarOverlaySlotRow = (): InstanceType<typeof testRuntime.FakeHTMLElement> =>
  getHotbarOverlayRoot().children[1] as InstanceType<typeof testRuntime.FakeHTMLElement>;
const getHotbarOverlaySlotButton = (
  slotIndex: number
): InstanceType<typeof testRuntime.FakeHTMLElement> =>
  getHotbarOverlaySlotRow().children[slotIndex] as InstanceType<typeof testRuntime.FakeHTMLElement>;
const getHotbarOverlaySlotAmountLabel = (
  slotIndex: number
): InstanceType<typeof testRuntime.FakeHTMLElement> =>
  getHotbarOverlaySlotButton(slotIndex).children[2] as InstanceType<typeof testRuntime.FakeHTMLElement>;
const getHotbarOverlaySlotCooldownFill = (
  slotIndex: number
): InstanceType<typeof testRuntime.FakeHTMLElement> => {
  const slotButton = getHotbarOverlaySlotButton(slotIndex);
  return slotButton.children[3] as InstanceType<typeof testRuntime.FakeHTMLElement>;
};

const readPersistedShellState = (): ReturnType<typeof createDefaultWorldSessionShellState> =>
  JSON.parse(
    testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ??
      JSON.stringify(createDefaultWorldSessionShellState())
  );
const readPersistedGameplayState = (): ReturnType<typeof createDefaultWorldSessionGameplayState> =>
  JSON.parse(
    testRuntime.storageValues.get(WORLD_SESSION_GAMEPLAY_STATE_STORAGE_KEY) ??
      JSON.stringify(createDefaultWorldSessionGameplayState())
  );
const readPersistedTelemetryState = (): ReturnType<typeof createDefaultWorldSessionTelemetryState> =>
  JSON.parse(
    testRuntime.storageValues.get(WORLD_SESSION_TELEMETRY_STATE_STORAGE_KEY) ??
      JSON.stringify(createDefaultWorldSessionTelemetryState())
  );
const readPersistedWorldSaveEnvelope = (): ReturnType<typeof createWorldSaveEnvelope> | null => {
  const rawEnvelope = testRuntime.storageValues.get(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY) ?? null;
  return rawEnvelope === null ? null : JSON.parse(rawEnvelope);
};
const createLegacyStarterInventoryState = (selectedHotbarSlotIndex = 0) =>
  createPlayerInventoryState({
    hotbar: [
      { itemId: 'pickaxe', amount: 1 },
      { itemId: 'dirt-block', amount: 64 },
      { itemId: 'torch', amount: 20 },
      { itemId: 'rope', amount: 24 },
      { itemId: 'healing-potion', amount: 3 },
      { itemId: 'heart-crystal', amount: 1 },
      { itemId: 'sword', amount: 1 },
      { itemId: 'umbrella', amount: 1 },
      { itemId: 'bug-net', amount: 1 },
      { itemId: 'spear', amount: 1 }
    ],
    selectedHotbarSlotIndex
  });
const setPersistedWorldSaveWithInventory = (
  inventoryState = createLegacyStarterInventoryState(),
  standalonePlayerState = createPlayerState({
    position: { x: 8, y: 0 },
    facing: 'right',
    grounded: true
  })
): void => {
  testRuntime.storageValues.set(
    PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
    JSON.stringify(
      createWorldSaveEnvelope({
        worldSnapshot: new TileWorld(0).createSnapshot(),
        standalonePlayerState,
        standalonePlayerInventoryState: inventoryState
      })
    )
  );
};
const setPersistedStandalonePlayerState = (playerState: ReturnType<typeof createPlayerState>): void => {
  testRuntime.storageValues.set(
    PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
    JSON.stringify(
      createWorldSaveEnvelope({
        worldSnapshot: new TileWorld(0).createSnapshot(),
        standalonePlayerState: playerState
      })
    )
  );
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
    shellActionKeybindings: ShellActionKeybindingState;
    shellActionKeybindingsDefaultedFromPersistedState: boolean;
    shellActionKeybindingsCurrentSessionOnly: boolean;
    worldSessionGameplayState: ReturnType<typeof createDefaultWorldSessionGameplayState>;
    worldSessionGameplayPersistenceAvailable: boolean;
    worldSessionTelemetryState: ReturnType<typeof createDefaultWorldSessionTelemetryState>;
    worldSessionTelemetryPersistenceAvailable: boolean;
    exportResult: PausedMainMenuExportResult;
    importResult: PausedMainMenuImportResult;
    clearSavedWorldResult: PausedMainMenuClearSavedWorldResult;
    resetShellTogglesResult: PausedMainMenuResetShellTogglesResult;
    resetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult;
    worldSaveCleared: boolean;
    savedWorldStatus: PausedMainMenuSavedWorldStatus;
    worldSeed: number;
    recentActivityAction: PausedMainMenuRecentActivityAction;
    shellProfilePreview: {
      fileName: string | null;
      worldSessionShellState: ReturnType<typeof createDefaultWorldSessionShellState>;
      shellActionKeybindings: ShellActionKeybindingState;
    };
  }> = {}
) => {
  const shellActionKeybindingLoad = loadShellActionKeybindingStateWithDefaultFallbackStatus({
    getItem: (key) => testRuntime.storageValues.get(key) ?? null,
    setItem: () => {}
  });
  const resolvedSavedWorldStatus =
    options.savedWorldStatus ?? (options.worldSaveCleared ? 'cleared' : null);
  const resolvedRecentActivityAction =
    options.recentActivityAction ??
    (options.resetShellTelemetryResult
      ? 'reset-shell-telemetry'
      : options.resetShellTogglesResult
        ? 'reset-shell-toggles'
        : options.clearSavedWorldResult || resolvedSavedWorldStatus === 'cleared'
          ? 'clear-saved-world'
          : options.importResult
            ? 'import-world-save'
            : options.exportResult
              ? 'export-world-save'
              : null);

  return createMainMenuShellState(
    true,
    options.worldSessionShellState ??
      (testRuntime.storageValues.has(WORLD_SESSION_SHELL_STATE_STORAGE_KEY)
        ? readPersistedShellState()
        : createDefaultWorldSessionShellState()),
    options.persistenceAvailable ?? true,
    options.shellActionKeybindings ?? shellActionKeybindingLoad.state,
    options.shellActionKeybindingsDefaultedFromPersistedState ??
      shellActionKeybindingLoad.defaultedFromPersistedState,
    options.importResult ?? null,
    resolvedSavedWorldStatus,
    options.exportResult ?? null,
    options.clearSavedWorldResult ?? null,
    options.resetShellTogglesResult ?? null,
    true,
    options.shellProfilePreview
      ? {
          fileName: options.shellProfilePreview.fileName,
          shellState: options.shellProfilePreview.worldSessionShellState,
          shellActionKeybindings: options.shellProfilePreview.shellActionKeybindings
        }
      : null,
    options.shellActionKeybindingsCurrentSessionOnly ?? false,
    resolvedRecentActivityAction,
    options.worldSessionTelemetryState ??
      (testRuntime.storageValues.has(WORLD_SESSION_TELEMETRY_STATE_STORAGE_KEY)
        ? readPersistedTelemetryState()
        : createDefaultWorldSessionTelemetryState()),
    options.worldSessionTelemetryPersistenceAvailable ?? true,
    options.resetShellTelemetryResult ?? null,
    options.worldSessionGameplayState ??
      (testRuntime.storageValues.has(WORLD_SESSION_GAMEPLAY_STATE_STORAGE_KEY)
        ? readPersistedGameplayState()
        : createDefaultWorldSessionGameplayState()),
    options.worldSessionGameplayPersistenceAvailable ?? true,
    options.worldSeed ?? (testRuntime.rendererWorldSnapshot?.worldSeed ?? 0)
  );
};

const createExpectedFirstLaunchMainMenuState = (persistenceAvailable = true) =>
  createFirstLaunchMainMenuShellState(persistenceAvailable);
const readPausedWorldSaveMetadataValue = (
  rowLabel: string,
  state: AppShellState | null = (testRuntime.shellInstance?.currentState ?? null) as
    | AppShellState
    | null
): string | undefined =>
  state === null
    ? undefined
    : resolvePausedMainMenuWorldSaveSectionState(state).metadataRows.find((row) => row.label === rowLabel)
        ?.value;
const createTestPlayerSpawnPoint = ({
  anchorTileX = 0,
  standingTileY = 0,
  x = 8,
  y = 0,
  width = 12,
  height = 28,
  supportTileX = anchorTileX,
  supportTileY = standingTileY,
  supportTileId = 1
}: Partial<{
  anchorTileX: number;
  standingTileY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  supportTileX: number;
  supportTileY: number;
  supportTileId: number;
}> = {}) => ({
  anchorTileX,
  standingTileY,
  x,
  y,
  aabb: {
    minX: x - width * 0.5,
    minY: y - height,
    maxX: x + width * 0.5,
    maxY: y
  },
  support: {
    tileX: supportTileX,
    tileY: supportTileY,
    tileId: supportTileId
  }
});

const clearTileRect = (
  world: TileWorld,
  minTileX: number,
  maxTileX: number,
  minTileY: number,
  maxTileY: number
): void => {
  for (let worldTileY = minTileY; worldTileY <= maxTileY; worldTileY += 1) {
    for (let worldTileX = minTileX; worldTileX <= maxTileX; worldTileX += 1) {
      world.setTile(worldTileX, worldTileY, 0);
    }
  }
};

const createStarterWandTestWorldSnapshot = (): ReturnType<TileWorld['createSnapshot']> => {
  const world = new TileWorld(0);
  clearTileRect(world, -8, 8, -4, 4);
  return world.createSnapshot();
};

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
    testRuntime.armedDebugToolPreviewState = createEmptyArmedDebugToolPreviewState();
    testRuntime.debugOverlayInstance = null;
    testRuntime.debugEditControlsInitialPreferenceSnapshot = null;
    testRuntime.debugEditControlsInitialHistoryState = null;
    testRuntime.debugEditControlsLatestHistoryState = null;
    testRuntime.debugEditControlsSetVisibleCallCount = 0;
    testRuntime.debugEditControlsSetHistoryStateCallCount = 0;
    testRuntime.debugEditControlsSetShellActionKeybindingsCallCount = 0;
    testRuntime.debugEditControlsArmedToolSetterCallCount = 0;
    testRuntime.debugEditControlsShellActionKeybindings = null;
    testRuntime.craftingPanelInstance = null;
    testRuntime.equipmentPanelInstance = null;
    testRuntime.itemCatalogPanelInstance = null;
    testRuntime.latestCraftingPanelState = null;
    testRuntime.latestEquipmentPanelState = null;
    testRuntime.latestItemCatalogPanelState = null;
    testRuntime.debugEditControlsInitialArmedToolSnapshot = null;
    testRuntime.debugEditControlsArmedToolKinds = null;
    testRuntime.debugEditControlsInstance = null;
    testRuntime.hoveredTileCursorInstance = null;
    testRuntime.playerItemAxeChopPreviewInstance = null;
    testRuntime.playerItemBunnyReleasePreviewInstance = null;
    testRuntime.playerItemMiningPreviewInstance = null;
    testRuntime.playerItemPlacementPreviewInstance = null;
    testRuntime.playerItemSpearPreviewInstance = null;
    testRuntime.armedDebugToolPreviewInstance = null;
    testRuntime.debugEditStatusStripInstance = null;
    testRuntime.playerSpawnMarkerInstance = null;
    testRuntime.rendererConstructorError = null;
    testRuntime.rendererInitializeError = null;
    testRuntime.rendererConstructCount = 0;
    testRuntime.rendererInstance = null;
    testRuntime.rendererLoadWorldSnapshotCallCount = 0;
    testRuntime.rendererGetResidentChunkBoundsCallCount = 0;
    testRuntime.rendererHasResidentChunkCallCount = 0;
    testRuntime.rendererResetWorldSeeds = [];
    testRuntime.rendererFindPlayerSpawnPointImpl = null;
    testRuntime.rendererHasOpenSkyAboveImpl = null;
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
      jumpPressed: false,
      ropeDropHeld: false,
      ropeDropWindowArmed: false
    };
    testRuntime.canvasInteractionMode = 'debug-edit';
    testRuntime.fixedStepWorldUpdateOrder = [];
    testRuntime.playerItemUseRequests = [];
    testRuntime.debugTileEdits = [];
    testRuntime.completedDebugTileStrokes = [];
    testRuntime.rendererTileId = 0;
    testRuntime.rendererTileIdsByWorldKey.clear();
    testRuntime.rendererWallIdsByWorldKey.clear();
    testRuntime.rendererLiquidLevel = 0;
    testRuntime.rendererLiquidLevelsByWorldKey.clear();
    testRuntime.rendererLightLevelsByWorldKey.clear();
    testRuntime.rendererLiquidRenderCardinalMask = null;
    testRuntime.rendererSetTileResult = false;
    testRuntime.rendererPersistentSetTileResult = false;
    testRuntime.rendererSetTileCalls = [];
    testRuntime.rendererSetWallResult = false;
    testRuntime.rendererPersistentSetWallResult = false;
    testRuntime.rendererSetWallCalls = [];
    testRuntime.rendererTileEditListeners = [];
    testRuntime.rendererWallEditListeners = [];
    testRuntime.rendererNextSetTileEditEvents = null;
    testRuntime.rendererNextSetWallEditEvents = null;
    testRuntime.rendererStepLiquidSimulationCallCount = 0;
    testRuntime.rendererStepPlayerStateImpl = null;
    testRuntime.rendererStepPlayerStateRequests = [];
    testRuntime.rendererStepHostileSlimeStateImpl = null;
    testRuntime.rendererStepHostileSlimeStateRequests = [];
    testRuntime.rendererStepPassiveBunnyStateImpl = null;
    testRuntime.rendererStepPassiveBunnyStateRequests = [];
    testRuntime.rendererRespawnPlayerStateAtSpawnIfEmbeddedInSolidImpl = null;
    testRuntime.rendererPlayerCollisionContactsQueue = [];
    testRuntime.rendererPlayerCollisionContactRequestStates = [];
    testRuntime.rendererTelemetry.atlasWidth = null;
    testRuntime.rendererTelemetry.atlasHeight = null;
    testRuntime.rendererTelemetry.residentDirtyLightChunks = 0;
    testRuntime.rendererTelemetry.residentActiveLiquidChunks = 0;
    testRuntime.rendererTelemetry.residentActiveLiquidMinChunkX = null;
    testRuntime.rendererTelemetry.residentActiveLiquidMinChunkY = null;
    testRuntime.rendererTelemetry.residentActiveLiquidMaxChunkX = null;
    testRuntime.rendererTelemetry.residentActiveLiquidMaxChunkY = null;
    testRuntime.rendererTelemetry.residentSleepingLiquidChunks = 0;
    testRuntime.rendererTelemetry.residentSleepingLiquidMinChunkX = null;
    testRuntime.rendererTelemetry.residentSleepingLiquidMinChunkY = null;
    testRuntime.rendererTelemetry.residentSleepingLiquidMaxChunkX = null;
    testRuntime.rendererTelemetry.residentSleepingLiquidMaxChunkY = null;
    testRuntime.rendererTelemetry.liquidStepPhaseSummary = 'none';
    testRuntime.rendererTelemetry.liquidStepDownwardActiveChunksScanned = 0;
    testRuntime.rendererTelemetry.liquidStepSidewaysCandidateChunksScanned = 0;
    testRuntime.rendererTelemetry.liquidStepSidewaysPairsTested = 0;
    testRuntime.rendererTelemetry.liquidStepDownwardTransfersApplied = 0;
    testRuntime.rendererTelemetry.liquidStepSidewaysTransfersApplied = 0;
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
    testRuntime.latestHoveredTileCursorTargets = null;
    testRuntime.latestArmedDebugToolPreviewState = null;
    testRuntime.latestPlayerItemAxeChopPreviewState = null;
    testRuntime.latestPlayerItemBunnyReleasePreviewState = null;
    testRuntime.latestPlayerItemMiningPreviewState = null;
    testRuntime.latestPlayerItemPlacementPreviewState = null;
    testRuntime.latestPlayerItemSpearPreviewState = null;
    testRuntime.rendererWorldSnapshot = new TileWorld(0).createSnapshot();
    testRuntime.rendererResidentChunkBounds = {
      minChunkX: 0,
      maxChunkX: 0,
      minChunkY: 0,
      maxChunkY: 0
    };
    testRuntime.rendererPlayerSpawnLiquidSafetyStatus = 'safe';
    testRuntime.debugTileInspectPinRequests = [];
    testRuntime.playerSpawnPoint = createTestPlayerSpawnPoint();
    testRuntime.gameLoopStartCount = 0;
    testRuntime.storageValues.clear();
    testRuntime.storageSetItemErrorsByKey.clear();
    testRuntime.storageRemoveItemErrorsByKey.clear();
    testRuntime.downloadedWorldSaveEnvelopes = [];
    testRuntime.downloadWorldSaveFilename = 'deep-factory-world-save-2026-03-08T05-06-07Z.json';
    testRuntime.downloadWorldSaveError = null;
    testRuntime.downloadedShellProfileEnvelopes = [];
    testRuntime.downloadShellProfileFilename = 'deep-factory-shell-profile-2026-03-11T05-06-07Z.json';
    testRuntime.downloadShellProfileError = null;
    testRuntime.queuedShellProfileImportResults = [];
    testRuntime.shellProfileImportCallCount = 0;
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
          const removeError = testRuntime.storageRemoveItemErrorsByKey.get(key);
          if (removeError) {
            throw removeError;
          }
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
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('seeds the first-launch world from a fresh random world seed before the first Enter World transition', async () => {
    vi.mocked(Math.random).mockReturnValueOnce(0.125);

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.rendererResetWorldSeeds).toEqual([536870912]);
    expect(testRuntime.rendererWorldSnapshot?.worldSeed).toBe(536870912);
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
    expect(testRuntime.playerItemAxeChopPreviewInstance?.visible).toBe(false);
    expect(testRuntime.playerItemBunnyReleasePreviewInstance?.visible).toBe(false);
    expect(testRuntime.playerItemPlacementPreviewInstance?.visible).toBe(false);
    expect(testRuntime.playerItemSpearPreviewInstance?.visible).toBe(false);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState(persistedShellState));
    expect(readPersistedShellState()).toEqual(persistedShellState);
    expect(testRuntime.debugOverlayInstance?.visible).toBe(true);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(true);
    expect(testRuntime.playerItemAxeChopPreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemBunnyReleasePreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemPlacementPreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemSpearPreviewInstance?.visible).toBe(true);
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
    expect(testRuntime.playerItemAxeChopPreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemBunnyReleasePreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemPlacementPreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemSpearPreviewInstance?.visible).toBe(true);
    expect(testRuntime.armedDebugToolPreviewInstance?.visible).toBe(false);
    expect(testRuntime.debugEditStatusStripInstance?.visible).toBe(false);
    expect(testRuntime.playerSpawnMarkerInstance?.visible).toBe(false);
    expect(testRuntime.gameLoopStartCount).toBe(1);
  });

  it('shows storage-unavailable first-launch persistence guidance when local storage is inaccessible before the first session starts', async () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage access denied');
      }
    });

    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedFirstLaunchMainMenuState(false)
    );
    expect(testRuntime.storageValues.size).toBe(0);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(testRuntime.debugOverlayInstance?.visible).toBe(false);
    expect(testRuntime.debugEditControlsInstance?.visible).toBe(false);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.playerItemAxeChopPreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemBunnyReleasePreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemPlacementPreviewInstance?.visible).toBe(true);
    expect(testRuntime.playerItemSpearPreviewInstance?.visible).toBe(true);
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
        persistenceAvailable: false,
        worldSessionGameplayPersistenceAvailable: false,
        worldSessionTelemetryPersistenceAvailable: false
      })
    );
  });

  it('uses the shared main-menu shell-state selector for first-launch bootstrap and paused-session returns', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.shellInstance?.currentState).toEqual(createMainMenuShellState(false));

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
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

  it('reseeds and persists the replacement world when paused-menu New World starts a fresh session', async () => {
    vi.mocked(Math.random).mockReturnValueOnce(0.125);

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    vi.mocked(Math.random).mockReturnValueOnce(0.75);
    testRuntime.shellInstance?.options.onSenaryAction('main-menu');

    expect(testRuntime.rendererResetWorldSeeds).toEqual([536870912, 3221225472]);
    expect(testRuntime.rendererWorldSnapshot?.worldSeed).toBe(3221225472);
    expect(readPersistedWorldSaveEnvelope()?.worldSnapshot.worldSeed).toBe(3221225472);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
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

  it('routes bootstrap spawn initialization, death countdown respawn, and embedded respawn recovery through one shared standalone-player transition-reset helper', async () => {
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

    runFixedUpdate(0.1);
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after death start');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerHealth).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState.playerDeathCount).toBe(1);
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawnSecondsRemaining).toBe(1);
    expect(testRuntime.latestDebugEditStatusStripState.playerDeathHoldStatus).toBe('holding');
    expect(testRuntime.latestDebugEditStatusStripState.playerVelocityX).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState.playerVelocityY).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn ?? null).toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState?.playerRespawn ?? null).toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState?.player?.deathCount).toBe(1);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.respawnSecondsRemaining).toBe(1);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.deathHoldStatus).toBe('holding');
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);

    runFixedUpdate(0.5);
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerDeathCount).toBe(1);
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawnSecondsRemaining).toBe(0.5);
    expect(testRuntime.latestDebugEditStatusStripState.playerDeathHoldStatus).toBe('holding');
    expect(testRuntime.latestDebugOverlayInspectState?.player?.deathCount).toBe(1);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.respawnSecondsRemaining).toBe(0.5);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.deathHoldStatus).toBe('holding');

    runFixedUpdate(0.5);
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest debug status strip state after death respawn');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerGroundedTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerFacingTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerWallContactTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingContactTransition ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawn).toMatchObject({
      kind: 'death',
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
    expect(
      testRuntime.latestDebugEditStatusStripState.playerHostileContactInvulnerabilitySecondsRemaining
    ).toBeCloseTo(1, 6);
    expect(testRuntime.latestDebugEditStatusStripState.playerDeathCount).toBe(1);
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawnSecondsRemaining ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerDeathHoldStatus).toBe('respawned');
    expect(testRuntime.latestDebugOverlayInspectState?.playerRespawn).toMatchObject({
      kind: 'death',
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
    expect(testRuntime.latestDebugOverlayInspectState?.player?.deathCount).toBe(1);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.respawnSecondsRemaining ?? null).toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState?.player?.deathHoldStatus).toBe('respawned');
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
    expect(testRuntime.latestDebugEditStatusStripState.playerRespawnSecondsRemaining ?? null).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerDeathCount).toBe(1);
    expect(testRuntime.latestDebugEditStatusStripState.playerDeathHoldStatus).toBe('respawned');
    expect(testRuntime.latestDebugOverlayInspectState?.player?.deathCount).toBe(1);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.respawnSecondsRemaining ?? null).toBeNull();
    expect(testRuntime.latestDebugOverlayInspectState?.player?.deathHoldStatus).toBe('respawned');
    expect(testRuntime.latestDebugEditStatusStripState.playerCeilingBonkHoldActive).toBe(false);
  });

  it('keeps standalone-player render snapshots snapped to the death hold and the later respawn spawn across interpolation resets', async () => {
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

    runFixedUpdate(0.1);
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    if (!testRuntime.latestRendererRenderFrameState) {
      throw new Error('expected renderer frame state after death hold');
    }

    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerPreviousPosition).toEqual({
      x: 56,
      y: 28
    });
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerCurrentPosition).toEqual({
      x: 56,
      y: 28
    });
    expect(testRuntime.latestRendererRenderFrameState.standalonePlayerInterpolatedPosition).toEqual({
      x: 56,
      y: 28
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerRespawn ?? null).toBeNull();

    runFixedUpdate(0.5);
    runFixedUpdate(0.5);
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState).not.toBeNull();
    if (!testRuntime.latestRendererRenderFrameState) {
      throw new Error('expected renderer frame state after death respawn');
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
    expect(testRuntime.latestDebugEditStatusStripState?.playerRespawn?.kind).toBe('death');

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

  it('spawns hostile slimes on the fixed-step cadence and despawns them once the player leaves the keep band', async () => {
    await import('./main');
    await flushBootstrap();

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 12,
      x: 200,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toEqual([
      {
        id: 2,
        position: { x: 200, y: 0 }
      }
    ]);

    testRuntime.rendererStepPlayerStateImpl = () =>
      createPlayerState({
        position: { x: 720, y: 0 },
        grounded: true,
        facing: 'right'
      });

    runFixedUpdate();
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toEqual([]);
  });

  it('steps hostile slime locomotion through the renderer world query after spawning', async () => {
    await import('./main');
    await flushBootstrap();

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 12,
      x: 200,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    testRuntime.rendererStepHostileSlimeStateImpl = () => ({
      position: { x: 204, y: -4 },
      velocity: { x: 120, y: -90 },
      grounded: false,
      facing: 'right' as const,
      hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS
    });
    testRuntime.rendererStepHostileSlimeStateRequests = [];
    testRuntime.fixedStepWorldUpdateOrder = [];

    runFixedUpdate();
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.fixedStepWorldUpdateOrder).toEqual(['liquids', 'player', 'slime']);
    expect(testRuntime.rendererStepHostileSlimeStateRequests).toEqual([
      {
        state: {
          position: { x: 200, y: 0 },
          velocity: { x: 0, y: 0 },
          health: DEFAULT_HOSTILE_SLIME_HEALTH,
          grounded: true,
          facing: 'left',
          hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS
        },
        fixedDt: 1000 / 60,
        playerPosition: { x: 8, y: 0 }
      }
    ]);
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toEqual([
      {
        id: 2,
        position: { x: 204, y: -4 }
      }
    ]);
  });

  it('spawns passive bunnies on the fixed-step cadence and despawns them once the player leaves the keep band', async () => {
    await import('./main');
    await flushBootstrap();

    const bunnySpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 8,
      x: 136,
      y: 0,
      width: DEFAULT_PASSIVE_BUNNY_WIDTH,
      height: DEFAULT_PASSIVE_BUNNY_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_PASSIVE_BUNNY_WIDTH &&
        search?.height === DEFAULT_PASSIVE_BUNNY_HEIGHT
      ) {
        return bunnySpawnPoint;
      }

      if (
        search?.width === DEFAULT_PLAYER_WIDTH &&
        search?.height === DEFAULT_PLAYER_HEIGHT
      ) {
        return testRuntime.playerSpawnPoint;
      }

      return null;
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toEqual([
      {
        id: 2,
        position: { x: 136, y: 0 }
      }
    ]);

    testRuntime.rendererStepPlayerStateImpl = () =>
      createPlayerState({
        position: { x: 720, y: 0 },
        grounded: true,
        facing: 'right'
      });

    runFixedUpdate(1 / 60);
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toEqual([]);
  });

  it('requires open sky above passive-bunny natural spawns in runtime wiring', async () => {
    await import('./main');
    await flushBootstrap();

    const bunnySpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 8,
      x: 136,
      y: 0,
      width: DEFAULT_PASSIVE_BUNNY_WIDTH,
      height: DEFAULT_PASSIVE_BUNNY_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_PASSIVE_BUNNY_WIDTH &&
        search?.height === DEFAULT_PASSIVE_BUNNY_HEIGHT
      ) {
        return bunnySpawnPoint;
      }

      if (
        search?.width === DEFAULT_PLAYER_WIDTH &&
        search?.height === DEFAULT_PLAYER_HEIGHT
      ) {
        return testRuntime.playerSpawnPoint;
      }

      return null;
    };
    testRuntime.rendererHasOpenSkyAboveImpl = () => false;

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toEqual([]);
  });

  it('steps passive bunny locomotion through the renderer world query after spawning', async () => {
    await import('./main');
    await flushBootstrap();

    const bunnySpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 8,
      x: 136,
      y: 0,
      width: DEFAULT_PASSIVE_BUNNY_WIDTH,
      height: DEFAULT_PASSIVE_BUNNY_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_PASSIVE_BUNNY_WIDTH &&
        search?.height === DEFAULT_PASSIVE_BUNNY_HEIGHT
      ) {
        return bunnySpawnPoint;
      }

      if (
        search?.width === DEFAULT_PLAYER_WIDTH &&
        search?.height === DEFAULT_PLAYER_HEIGHT
      ) {
        return testRuntime.playerSpawnPoint;
      }

      return null;
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    testRuntime.rendererStepPassiveBunnyStateImpl = () => ({
      position: { x: 132, y: -4 },
      velocity: { x: -72, y: -60 },
      grounded: false,
      facing: 'left' as const,
      hopCooldownTicksRemaining: DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS
    });
    testRuntime.rendererStepPassiveBunnyStateRequests = [];
    testRuntime.fixedStepWorldUpdateOrder = [];

    runFixedUpdate();
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.fixedStepWorldUpdateOrder).toEqual(['liquids', 'player', 'bunny']);
    expect(testRuntime.rendererStepPassiveBunnyStateRequests).toEqual([
      {
        state: {
          position: { x: 136, y: 0 },
          velocity: { x: 0, y: 0 },
          grounded: true,
          facing: 'right',
          hopCooldownTicksRemaining: DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS
        },
        fixedDt: 1000 / 60
      }
    ]);
    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toEqual([
      {
        id: 2,
        position: { x: 132, y: -4 }
      }
    ]);
  });

  it('routes hostile-slime spawn telemetry plus nearest locomotion telemetry through the overlay and hidden status strip', async () => {
    await import('./main');
    await flushBootstrap();

    const farSlimeSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 14,
      x: 232,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    const nearSlimeSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 4,
      x: 56,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    let hostileSlimeSpawnQueryCount = 0;
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        hostileSlimeSpawnQueryCount += 1;
        return hostileSlimeSpawnQueryCount === 1 ? farSlimeSpawnPoint : nearSlimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }
    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    testRuntime.rendererStepHostileSlimeStateImpl = (state) => {
      const slimeState = state as {
        position?: { x?: number; y?: number };
      };
      if (slimeState.position?.x === farSlimeSpawnPoint.x) {
        return {
          position: { x: farSlimeSpawnPoint.x + 4, y: -2 },
          velocity: { x: -20, y: 30 },
          grounded: true,
          facing: 'right' as const,
          hopCooldownTicksRemaining: 19,
          launchKind: null
        };
      }

      if (slimeState.position?.x === nearSlimeSpawnPoint.x) {
        return {
          position: { x: nearSlimeSpawnPoint.x - 2, y: -3 },
          velocity: { x: 35, y: -60 },
          grounded: false,
          facing: 'left' as const,
          hopCooldownTicksRemaining: 7,
          launchKind: 'step-hop' as const
        };
      }

      return state;
    };

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.hostileSlime).toEqual({
      activeCount: 2,
      nextSpawnTicksRemaining: DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS - 1,
      nextSpawnWindowIndex: 2,
      nextSpawnWindowOffsetTiles: 18,
      worldTile: { x: 3, y: -1 },
      chaseOffset: { x: 46, y: -3 },
      velocity: { x: 35, y: -60 },
      grounded: false,
      facing: 'left',
      hopCooldownTicksRemaining: 7,
      launchKind: 'step-hop'
    });
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeActiveCount).toBe(2);
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeNextSpawnTicksRemaining).toBe(
      DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS - 1
    );
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeNextSpawnWindowIndex).toBe(2);
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeNextSpawnWindowOffsetTiles).toBe(
      18
    );
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeWorldTile).toEqual({
      x: 3,
      y: -1
    });
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeChaseOffset).toEqual({
      x: 46,
      y: -3
    });
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeVelocity).toEqual({
      x: 35,
      y: -60
    });
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeGrounded).toBe(false);
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeFacing).toBe('left');
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeHopCooldownTicksRemaining).toBe(7);
    expect(testRuntime.latestDebugEditStatusStripState?.hostileSlimeLaunchKind).toBe('step-hop');
  });

  it('tracks hostile-contact hit events through damage and invulnerability-blocked overlap', async () => {
    await import('./main');
    await flushBootstrap();

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      x: 8,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerHostileContactEvent).toEqual({
      damageApplied: 15,
      blockedByInvulnerability: false,
      sourceWorldTile: { x: 0, y: 0 },
      sourceFacing: 'right'
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerHostileContactEvent).toEqual({
      damageApplied: 15,
      blockedByInvulnerability: false,
      sourceWorldTile: { x: 0, y: 0 },
      sourceFacing: 'right'
    });
    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(85);
    expect(
      testRuntime.latestDebugOverlayInspectState?.player?.hostileContactInvulnerabilitySecondsRemaining
    ).toBe(DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS);
    expect(testRuntime.latestDebugEditStatusStripState?.playerHealth).toBe(85);
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerHostileContactInvulnerabilitySecondsRemaining
    ).toBe(DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS);

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerHostileContactEvent).toEqual({
      damageApplied: 0,
      blockedByInvulnerability: true,
      sourceWorldTile: { x: 0, y: 0 },
      sourceFacing: 'right'
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerHostileContactEvent).toEqual({
      damageApplied: 0,
      blockedByInvulnerability: true,
      sourceWorldTile: { x: 0, y: 0 },
      sourceFacing: 'right'
    });
    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(85);
    expect(
      testRuntime.latestDebugOverlayInspectState?.player?.hostileContactInvulnerabilitySecondsRemaining
    ).toBe(DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS);
    expect(testRuntime.latestDebugEditStatusStripState?.playerHealth).toBe(85);
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerHostileContactInvulnerabilitySecondsRemaining
    ).toBe(DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS);

    expect(dispatchKeydown('q').prevented).toBe(true);

    const persistedEnvelope = readPersistedWorldSaveEnvelope();

    expect(persistedEnvelope?.session.standalonePlayerState?.health).toBe(85);
    expect(
      persistedEnvelope?.session.standalonePlayerState?.hostileContactInvulnerabilitySecondsRemaining
    ).toBe(DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS);
  });

  it('equips starter armor through the debug equipment panel, reduces hostile-contact damage, and persists the equipped slots', async () => {
    await import('./main');
    await flushBootstrap();

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      x: 8,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(testRuntime.equipmentPanelInstance?.visible).toBe(false);

    testRuntime.shellInstance?.options.onToggleDebugEditControls('in-world');

    expect(testRuntime.equipmentPanelInstance?.visible).toBe(true);
    expect(testRuntime.latestEquipmentPanelState).toMatchObject({
      totalDefense: 0,
      slots: [
        { slotId: 'head', equipped: false },
        { slotId: 'body', equipped: false },
        { slotId: 'legs', equipped: false }
      ]
    });

    testRuntime.equipmentPanelInstance?.triggerToggleSlot('head');
    testRuntime.equipmentPanelInstance?.triggerToggleSlot('body');
    testRuntime.equipmentPanelInstance?.triggerToggleSlot('legs');

    expect(testRuntime.latestEquipmentPanelState).toMatchObject({
      totalDefense: 4,
      slots: [
        { slotId: 'head', equipped: true },
        { slotId: 'body', equipped: true },
        { slotId: 'legs', equipped: true }
      ]
    });

    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerHostileContactEvent).toEqual({
      damageApplied: 11,
      blockedByInvulnerability: false,
      sourceWorldTile: { x: 0, y: 0 },
      sourceFacing: 'right'
    });
    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(89);

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerEquipmentState).toEqual({
      head: 'starter-helmet',
      body: 'starter-breastplate',
      legs: 'starter-greaves'
    });
  });

  it('tracks hard-landing damage events while keeping fall-recovery cooldown live', async () => {
    await import('./main');
    await flushBootstrap();

    let stepCount = 0;
    testRuntime.rendererStepPlayerStateImpl = (_state) => {
      stepCount += 1;
      if (stepCount === 1) {
        return {
          position: { x: 8, y: -24 },
          velocity: { x: 0, y: 612 },
          grounded: false,
          health: 100,
          fallDamageRecoverySecondsRemaining: 0
        };
      }
      if (stepCount === 2) {
        return {
          position: { x: 8, y: 0 },
          velocity: { x: 0, y: 0 },
          grounded: true,
          health: 97,
          fallDamageRecoverySecondsRemaining: DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS,
          landingImpactSpeed: 612
        };
      }

      return {
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        health: 97,
        fallDamageRecoverySecondsRemaining: 0.1
      };
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    runFixedUpdate();
    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerLandingDamageEvent).toEqual({
      damageApplied: 3,
      impactSpeed: 612
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerLandingDamageEvent).toEqual({
      damageApplied: 3,
      impactSpeed: 612
    });
    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(97);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.fallDamageRecoverySecondsRemaining).toBe(
      DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS
    );
    expect(testRuntime.latestDebugEditStatusStripState?.playerHealth).toBe(97);
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerFallDamageRecoverySecondsRemaining
    ).toBe(DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS);

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerLandingDamageEvent).toEqual({
      damageApplied: 3,
      impactSpeed: 612
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerLandingDamageEvent).toEqual({
      damageApplied: 3,
      impactSpeed: 612
    });
    expect(testRuntime.latestDebugOverlayInspectState?.player?.fallDamageRecoverySecondsRemaining).toBe(
      0.1
    );
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerFallDamageRecoverySecondsRemaining
    ).toBe(0.1);
  });

  it('tracks fall damage as the latest lethal death cause when a hard landing reaches zero health', async () => {
    await import('./main');
    await flushBootstrap();

    let stepCount = 0;
    testRuntime.rendererStepPlayerStateImpl = (_state) => {
      stepCount += 1;
      if (stepCount === 1) {
        return {
          position: { x: 8, y: -24 },
          velocity: { x: 0, y: 612 },
          grounded: false,
          health: 10,
          fallDamageRecoverySecondsRemaining: 0
        };
      }

      return {
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        health: 0,
        fallDamageRecoverySecondsRemaining: DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS,
        landingImpactSpeed: 612
      };
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    runFixedUpdate();
    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerLandingDamageEvent).toEqual({
      damageApplied: 10,
      impactSpeed: 612
    });
    expect(testRuntime.latestDebugOverlayInspectState?.playerDeathCauseEvent).toEqual({
      source: 'fall',
      damageApplied: 10,
      playerWorldTile: { x: 0, y: 0 }
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerLandingDamageEvent).toEqual({
      damageApplied: 10,
      impactSpeed: 612
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerDeathCauseEvent).toEqual({
      source: 'fall',
      damageApplied: 10,
      playerWorldTile: { x: 0, y: 0 }
    });
    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState?.playerHealth).toBe(0);
  });

  it('tracks breath and drowning-cooldown telemetry through fixed-step player updates', async () => {
    await import('./main');
    await flushBootstrap();

    let stepCount = 0;
    testRuntime.rendererStepPlayerStateImpl = (_state) => {
      stepCount += 1;
      if (stepCount === 1) {
        return {
          position: { x: 8, y: 0 },
          velocity: { x: 0, y: 0 },
          grounded: true,
          health: 100,
          breathSecondsRemaining: 0.25,
          headSubmergedInWater: false,
          waterSubmergedFraction: 2 / 3,
          lavaSubmergedFraction: 0,
          lavaDamageTickSecondsRemaining: 0.5,
          drowningDamageTickSecondsRemaining: 0.5
        };
      }

      return {
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        health: 95,
        breathSecondsRemaining: 0,
        headSubmergedInWater: true,
        waterSubmergedFraction: 1,
        lavaSubmergedFraction: 0.5,
        lavaDamageTickSecondsRemaining: 0.25,
        drowningDamageTickSecondsRemaining: 0.25
      };
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(100);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.breathSecondsRemaining).toBe(0.25);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.headSubmergedInWater).toBe(false);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.waterSubmergedFraction).toBeCloseTo(
      2 / 3,
      5
    );
    expect(testRuntime.latestDebugOverlayInspectState?.player?.lavaSubmergedFraction).toBe(0);
    expect(
      testRuntime.latestDebugOverlayInspectState?.player?.drowningDamageTickSecondsRemaining
    ).toBe(0.5);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.lavaDamageTickSecondsRemaining).toBe(
      0.5
    );
    expect(testRuntime.latestDebugEditStatusStripState?.playerHealth).toBe(100);
    expect(testRuntime.latestDebugEditStatusStripState?.playerBreathSecondsRemaining).toBe(0.25);
    expect(testRuntime.latestDebugEditStatusStripState?.playerHeadSubmergedInWater).toBe(false);
    expect(testRuntime.latestDebugEditStatusStripState?.playerWaterSubmergedFraction).toBeCloseTo(
      2 / 3,
      5
    );
    expect(testRuntime.latestDebugEditStatusStripState?.playerLavaSubmergedFraction).toBe(0);
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerDrowningDamageTickSecondsRemaining
    ).toBe(0.5);
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerLavaDamageTickSecondsRemaining
    ).toBe(0.5);

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(95);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.breathSecondsRemaining).toBe(0);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.headSubmergedInWater).toBe(true);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.waterSubmergedFraction).toBe(1);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.lavaSubmergedFraction).toBe(0.5);
    expect(
      testRuntime.latestDebugOverlayInspectState?.player?.drowningDamageTickSecondsRemaining
    ).toBe(0.25);
    expect(testRuntime.latestDebugOverlayInspectState?.player?.lavaDamageTickSecondsRemaining).toBe(
      0.25
    );
    expect(testRuntime.latestDebugEditStatusStripState?.playerHealth).toBe(95);
    expect(testRuntime.latestDebugEditStatusStripState?.playerBreathSecondsRemaining).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState?.playerHeadSubmergedInWater).toBe(true);
    expect(testRuntime.latestDebugEditStatusStripState?.playerWaterSubmergedFraction).toBe(1);
    expect(testRuntime.latestDebugEditStatusStripState?.playerLavaSubmergedFraction).toBe(0.5);
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerDrowningDamageTickSecondsRemaining
    ).toBe(0.25);
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerLavaDamageTickSecondsRemaining
    ).toBe(0.25);
  });

  it('tracks latest lava-tick damage events plus live lava cooldown telemetry through fixed-step player updates', async () => {
    await import('./main');
    await flushBootstrap();

    let stepCount = 0;
    testRuntime.rendererStepPlayerStateImpl = (_state) => {
      stepCount += 1;
      if (stepCount === 1) {
        return {
          position: { x: 8, y: 0 },
          velocity: { x: 0, y: 0 },
          grounded: true,
          health: 75,
          lavaDamageTickSecondsRemaining: 0.25,
          lavaDamageApplied: 25
        };
      }

      return {
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        health: 75,
        lavaDamageTickSecondsRemaining: 0.1
      };
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.player?.lavaDamageTickSecondsRemaining).toBe(
      0.25
    );
    expect(testRuntime.latestDebugOverlayInspectState?.playerLavaDamageEvent).toEqual({
      damageApplied: 25
    });
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerLavaDamageTickSecondsRemaining
    ).toBe(0.25);
    expect(testRuntime.latestDebugEditStatusStripState?.playerLavaDamageEvent).toEqual({
      damageApplied: 25
    });

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.player?.lavaDamageTickSecondsRemaining).toBe(
      0.1
    );
    expect(testRuntime.latestDebugOverlayInspectState?.playerLavaDamageEvent).toEqual({
      damageApplied: 25
    });
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerLavaDamageTickSecondsRemaining
    ).toBe(0.1);
    expect(testRuntime.latestDebugEditStatusStripState?.playerLavaDamageEvent).toEqual({
      damageApplied: 25
    });
  });

  it('tracks lava as the latest lethal death cause when a lava tick reaches zero health', async () => {
    setPersistedStandalonePlayerState(
      createPlayerState({
        position: { x: 8, y: -16 },
        grounded: true,
        health: 25,
        lavaDamageTickSecondsRemaining: 0.25
      })
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.rendererStepPlayerStateImpl = (_state) => ({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      grounded: true,
      health: 0,
      lavaDamageTickSecondsRemaining: 0.25,
      lavaDamageApplied: 25
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerLavaDamageEvent).toEqual({
      damageApplied: 25
    });
    expect(testRuntime.latestDebugOverlayInspectState?.playerDeathCauseEvent).toEqual({
      source: 'lava',
      damageApplied: 25,
      playerWorldTile: { x: 0, y: 0 }
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerLavaDamageEvent).toEqual({
      damageApplied: 25
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerDeathCauseEvent).toEqual({
      source: 'lava',
      damageApplied: 25,
      playerWorldTile: { x: 0, y: 0 }
    });
    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState?.playerHealth).toBe(0);
  });

  it('tracks latest drowning-tick damage events plus live drowning cooldown telemetry through fixed-step player updates', async () => {
    await import('./main');
    await flushBootstrap();

    let stepCount = 0;
    testRuntime.rendererStepPlayerStateImpl = (_state) => {
      stepCount += 1;
      if (stepCount === 1) {
        return {
          position: { x: 8, y: 0 },
          velocity: { x: 0, y: 0 },
          grounded: true,
          health: 95,
          breathSecondsRemaining: 0,
          drowningDamageTickSecondsRemaining: 0.25,
          drowningDamageApplied: 5
        };
      }

      return {
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        health: 95,
        breathSecondsRemaining: 0,
        drowningDamageTickSecondsRemaining: 0.1
      };
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    runFixedUpdate();
    runRenderFrame();

    expect(
      testRuntime.latestDebugOverlayInspectState?.player?.drowningDamageTickSecondsRemaining
    ).toBe(0.25);
    expect(testRuntime.latestDebugOverlayInspectState?.playerDrowningDamageEvent).toEqual({
      damageApplied: 5
    });
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerDrowningDamageTickSecondsRemaining
    ).toBe(0.25);
    expect(testRuntime.latestDebugEditStatusStripState?.playerDrowningDamageEvent).toEqual({
      damageApplied: 5
    });

    runFixedUpdate();
    runRenderFrame();

    expect(
      testRuntime.latestDebugOverlayInspectState?.player?.drowningDamageTickSecondsRemaining
    ).toBe(0.1);
    expect(testRuntime.latestDebugOverlayInspectState?.playerDrowningDamageEvent).toEqual({
      damageApplied: 5
    });
    expect(
      testRuntime.latestDebugEditStatusStripState?.playerDrowningDamageTickSecondsRemaining
    ).toBe(0.1);
    expect(testRuntime.latestDebugEditStatusStripState?.playerDrowningDamageEvent).toEqual({
      damageApplied: 5
    });
  });

  it('tracks drowning as the latest lethal death cause when a drowning tick reaches zero health', async () => {
    setPersistedStandalonePlayerState(
      createPlayerState({
        position: { x: 8, y: -16 },
        grounded: true,
        health: 5,
        breathSecondsRemaining: 0,
        drowningDamageTickSecondsRemaining: 0.25
      })
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.rendererStepPlayerStateImpl = (_state) => ({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      grounded: true,
      health: 0,
      breathSecondsRemaining: 0,
      drowningDamageTickSecondsRemaining: 0.25,
      drowningDamageApplied: 5
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerDrowningDamageEvent).toEqual({
      damageApplied: 5
    });
    expect(testRuntime.latestDebugOverlayInspectState?.playerDeathCauseEvent).toEqual({
      source: 'drowning',
      damageApplied: 5,
      playerWorldTile: { x: 0, y: 0 }
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerDrowningDamageEvent).toEqual({
      damageApplied: 5
    });
    expect(testRuntime.latestDebugEditStatusStripState?.playerDeathCauseEvent).toEqual({
      source: 'drowning',
      damageApplied: 5,
      playerWorldTile: { x: 0, y: 0 }
    });
    expect(testRuntime.latestDebugOverlayInspectState?.player?.health).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState?.playerHealth).toBe(0);
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
      jumpPressed: strip.playerJumpPressed,
      ropeDropActive: strip.playerRopeDropActive,
      ropeDropWindowArmed: strip.playerRopeDropWindowArmed
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
    testRuntime.rendererTelemetry.atlasWidth = AUTHORED_ATLAS_WIDTH;
    testRuntime.rendererTelemetry.atlasHeight = AUTHORED_ATLAS_HEIGHT;

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
    testRuntime.rendererTelemetry.atlasWidth = AUTHORED_ATLAS_WIDTH;
    testRuntime.rendererTelemetry.atlasHeight = AUTHORED_ATLAS_HEIGHT;

    const expectAnimatedLiquidInspectTelemetry = (
      expectedFrameIndex: number,
      expectedElapsedMs: number
    ): void => {
      const expectedVariantUvRect = describeLiquidRenderVariantUvRectAtElapsedMs(
        8,
        10,
        expectedElapsedMs
      );
      const expectedVariantPixelBounds = describeLiquidRenderVariantPixelBoundsAtElapsedMs(
        8,
        10,
        expectedElapsedMs,
        AUTHORED_ATLAS_WIDTH,
        AUTHORED_ATLAS_HEIGHT
      );

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

    expectAnimatedLiquidInspectTelemetry(0, 120);

    testRuntime.performanceNow = 240;
    runRenderFrame();

    expectAnimatedLiquidInspectTelemetry(1, 240);
  });

  it('keeps hovered and pinned non-liquid animated inspect telemetry aligned when torch frames advance', async () => {
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
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(4, 6), 10);
    testRuntime.rendererTelemetry.atlasWidth = AUTHORED_ATLAS_WIDTH;
    testRuntime.rendererTelemetry.atlasHeight = AUTHORED_ATLAS_HEIGHT;

    const expectAnimatedTorchInspectTelemetry = (
      expectedFrameIndex: number,
      expectedElapsedMs: number
    ): void => {
      const expectedRenderSource = describeTileRenderSourceAtElapsedMs(10, expectedElapsedMs);
      const expectedRenderUvRect = describeTileRenderUvRectAtElapsedMs(10, expectedElapsedMs);
      const expectedRenderPixelBounds = describeTileRenderPixelBoundsAtElapsedMs(
        10,
        expectedElapsedMs,
        AUTHORED_ATLAS_WIDTH,
        AUTHORED_ATLAS_HEIGHT
      );

      expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
      expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
      if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
        throw new Error('expected latest overlay and status-strip inspect telemetry');
      }

      expect(testRuntime.latestDebugOverlayInspectState.pointer).toMatchObject({
        tile: { x: 4, y: 6 },
        tileId: 10,
        liquidKind: null,
        tileAnimationFrameIndex: expectedFrameIndex,
        tileAnimationFrameCount: 2,
        tileRenderSource: expectedRenderSource,
        tileRenderUvRect: expectedRenderUvRect,
        tileRenderPixelBounds: expectedRenderPixelBounds
      });
      expect(testRuntime.latestDebugOverlayInspectState.pinned).toMatchObject({
        tile: { x: 4, y: 6 },
        tileId: 10,
        liquidKind: null,
        tileAnimationFrameIndex: expectedFrameIndex,
        tileAnimationFrameCount: 2,
        tileRenderSource: expectedRenderSource,
        tileRenderUvRect: expectedRenderUvRect,
        tileRenderPixelBounds: expectedRenderPixelBounds
      });
      expect(testRuntime.latestDebugEditStatusStripState.hoveredTile).toMatchObject({
        tileX: 4,
        tileY: 6,
        tileId: 10,
        liquidKind: null,
        tileAnimationFrameIndex: expectedFrameIndex,
        tileAnimationFrameCount: 2,
        tileRenderSource: expectedRenderSource,
        tileRenderUvRect: expectedRenderUvRect,
        tileRenderPixelBounds: expectedRenderPixelBounds
      });
      expect(testRuntime.latestDebugEditStatusStripState.pinnedTile).toMatchObject({
        tileX: 4,
        tileY: 6,
        tileId: 10,
        liquidKind: null,
        tileAnimationFrameIndex: expectedFrameIndex,
        tileAnimationFrameCount: 2,
        tileRenderSource: expectedRenderSource,
        tileRenderUvRect: expectedRenderUvRect,
        tileRenderPixelBounds: expectedRenderPixelBounds
      });
    };

    testRuntime.performanceNow = 120;
    runFixedUpdate();
    runRenderFrame();

    expectAnimatedTorchInspectTelemetry(0, 120);

    testRuntime.performanceNow = 240;
    runRenderFrame();

    expectAnimatedTorchInspectTelemetry(1, 240);
  });

  it('surfaces wall-layer inspect telemetry for wall-only hovered and pinned cells', async () => {
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
    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(4, 6), STARTER_DIRT_WALL_ID);
    testRuntime.rendererTelemetry.atlasWidth = AUTHORED_ATLAS_WIDTH;
    testRuntime.rendererTelemetry.atlasHeight = AUTHORED_ATLAS_HEIGHT;

    const expectedWallRenderSource = describeWallRenderSource(STARTER_DIRT_WALL_ID);
    const expectedWallRenderUvRect = describeWallRenderUvRect(STARTER_DIRT_WALL_ID);
    const expectedWallRenderPixelBounds = describeWallRenderPixelBounds(
      STARTER_DIRT_WALL_ID,
      AUTHORED_ATLAS_WIDTH,
      AUTHORED_ATLAS_HEIGHT
    );

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest overlay and status-strip inspect telemetry');
    }

    expect(testRuntime.latestDebugOverlayInspectState.pointer).toMatchObject({
      tile: { x: 4, y: 6 },
      tileId: 0,
      tileLabel: 'empty',
      wallId: STARTER_DIRT_WALL_ID,
      wallLabel: 'dirt wall',
      wallRenderSource: expectedWallRenderSource,
      wallRenderUvRect: expectedWallRenderUvRect,
      wallRenderPixelBounds: expectedWallRenderPixelBounds
    });
    expect(testRuntime.latestDebugOverlayInspectState.pinned).toMatchObject({
      tile: { x: 4, y: 6 },
      tileId: 0,
      tileLabel: 'empty',
      wallId: STARTER_DIRT_WALL_ID,
      wallLabel: 'dirt wall',
      wallRenderSource: expectedWallRenderSource,
      wallRenderUvRect: expectedWallRenderUvRect,
      wallRenderPixelBounds: expectedWallRenderPixelBounds
    });
    expect(testRuntime.latestDebugEditStatusStripState.hoveredTile).toMatchObject({
      tileX: 4,
      tileY: 6,
      tileId: 0,
      tileLabel: 'empty',
      wallId: STARTER_DIRT_WALL_ID,
      wallLabel: 'dirt wall',
      wallRenderSource: expectedWallRenderSource,
      wallRenderUvRect: expectedWallRenderUvRect,
      wallRenderPixelBounds: expectedWallRenderPixelBounds
    });
    expect(testRuntime.latestDebugEditStatusStripState.pinnedTile).toMatchObject({
      tileX: 4,
      tileY: 6,
      tileId: 0,
      tileLabel: 'empty',
      wallId: STARTER_DIRT_WALL_ID,
      wallLabel: 'dirt wall',
      wallRenderSource: expectedWallRenderSource,
      wallRenderUvRect: expectedWallRenderUvRect,
      wallRenderPixelBounds: expectedWallRenderPixelBounds
    });
  });

  it('surfaces wall-only hovered debug-break targets through the hovered cursor while preserving foreground precedence', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.debugEditControlsInstance?.setMode('break');
    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 4, y: 6 }
    };
    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(4, 6), STARTER_DIRT_WALL_ID);

    runRenderFrame();

    expect(testRuntime.latestHoveredTileCursorTargets).toEqual({
      hovered: {
        tileX: 4,
        tileY: 6,
        previewTone: 'debug-break-wall'
      },
      pinned: null
    });

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(4, 6), 1);

    runRenderFrame();

    expect(testRuntime.latestHoveredTileCursorTargets).toEqual({
      hovered: {
        tileX: 4,
        tileY: 6,
        previewTone: 'debug-break-tile'
      },
      pinned: null
    });
  });

  it('surfaces wall-only debug-break shape targets through preview state while preserving foreground precedence', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 3, y: 1 }
    };
    testRuntime.armedDebugToolPreviewState = {
      ...createEmptyArmedDebugToolPreviewState(),
      activeMouseRectOutlineDrag: {
        kind: 'break',
        startTileX: 0,
        startTileY: 0
      }
    };
    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(0, 0), STARTER_DIRT_WALL_ID);
    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(1, 0), STARTER_DIRT_WALL_ID);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, 0), 1);
    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(2, 0), STARTER_DIRT_WALL_ID);

    runRenderFrame();

    expect(
      testRuntime.latestArmedDebugToolPreviewState?.resolvedBreakPreviewAffectedTileCount
    ).toBe(3);
    expect(testRuntime.latestArmedDebugToolPreviewState?.resolvedBreakPreviewTargets).toEqual(
      expect.arrayContaining([
        { tileX: 0, tileY: 0, targetLayer: 'wall' },
        { tileX: 1, tileY: 0, targetLayer: 'wall' },
        { tileX: 2, tileY: 0, targetLayer: 'tile' }
      ])
    );
    expect(testRuntime.latestArmedDebugToolPreviewState?.resolvedBreakPreviewTargets).toHaveLength(3);
    expect(
      testRuntime.latestDebugEditStatusStripState?.preview.resolvedBreakPreviewAffectedTileCount
    ).toBe(3);
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
    testRuntime.rendererTelemetry.residentSleepingLiquidChunks = 2;
    testRuntime.rendererTelemetry.residentActiveLiquidMinChunkX = -1;
    testRuntime.rendererTelemetry.residentActiveLiquidMinChunkY = -2;
    testRuntime.rendererTelemetry.residentActiveLiquidMaxChunkX = 2;
    testRuntime.rendererTelemetry.residentActiveLiquidMaxChunkY = 1;
    testRuntime.rendererTelemetry.residentSleepingLiquidMinChunkX = -4;
    testRuntime.rendererTelemetry.residentSleepingLiquidMinChunkY = -3;
    testRuntime.rendererTelemetry.residentSleepingLiquidMaxChunkX = 0;
    testRuntime.rendererTelemetry.residentSleepingLiquidMaxChunkY = 2;
    testRuntime.rendererTelemetry.liquidStepSidewaysCandidateMinChunkX = -2;
    testRuntime.rendererTelemetry.liquidStepSidewaysCandidateMinChunkY = -2;
    testRuntime.rendererTelemetry.liquidStepSidewaysCandidateMaxChunkX = 3;
    testRuntime.rendererTelemetry.liquidStepSidewaysCandidateMaxChunkY = 1;
    testRuntime.rendererTelemetry.liquidStepPhaseSummary = 'sideways';
    testRuntime.rendererTelemetry.liquidStepDownwardActiveChunksScanned = 80;
    testRuntime.rendererTelemetry.liquidStepSidewaysCandidateChunksScanned = 7;
    testRuntime.rendererTelemetry.liquidStepSidewaysPairsTested = 1504;
    testRuntime.rendererTelemetry.liquidStepDownwardTransfersApplied = 0;
    testRuntime.rendererTelemetry.liquidStepSidewaysTransfersApplied = 1;
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
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidChunks).toBe(2);
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMinChunkX).toBe(-1);
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMinChunkY).toBe(-2);
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMaxChunkX).toBe(2);
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMaxChunkY).toBe(1);
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidMinChunkX).toBe(-4);
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidMinChunkY).toBe(-3);
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidMaxChunkX).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidMaxChunkY).toBe(2);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateMinChunkX).toBe(-2);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateMinChunkY).toBe(-2);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateMaxChunkX).toBe(3);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateMaxChunkY).toBe(1);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepPhaseSummary).toBe('sideways');
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepDownwardActiveChunksScanned).toBe(80);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateChunksScanned).toBe(7);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysPairsTested).toBe(1504);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepDownwardTransfersApplied).toBe(0);
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysTransfersApplied).toBe(1);

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
    expect(testRuntime.latestDebugEditStatusStripState.playerHealth).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.hostileSlimeActiveCount).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.hostileSlimeNextSpawnTicksRemaining).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.hostileSlimeNextSpawnWindowIndex).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.hostileSlimeNextSpawnWindowOffsetTiles).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.hostileSlimeWorldTile).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.hostileSlimeChaseOffset).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.hostileSlimeVelocity).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.hostileSlimeLaunchKind).toBeNull();
    expect(
      testRuntime.latestDebugEditStatusStripState.playerHostileContactInvulnerabilitySecondsRemaining
    ).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerSupportContact).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightLevel).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightFactor).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightSourceTile).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightSourceChunk).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerNearbyLightSourceLocalTile).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidChunks).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidChunks).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMinChunkX).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMinChunkY).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMaxChunkX).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentActiveLiquidMaxChunkY).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidMinChunkX).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidMinChunkY).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidMaxChunkX).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.residentSleepingLiquidMaxChunkY).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateMinChunkX).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateMinChunkY).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateMaxChunkX).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateMaxChunkY).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepPhaseSummary).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepDownwardActiveChunksScanned).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysCandidateChunksScanned).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysPairsTested).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepDownwardTransfersApplied).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.liquidStepSidewaysTransfersApplied).toBeNull();
  });

  it('routes rope-drop active and double-tap window telemetry through the overlay and compact status strip', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -4), STARTER_ROPE_TILE_ID);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -3), STARTER_ROPE_TILE_ID);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -2), STARTER_ROPE_TILE_ID);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_ROPE_TILE_ID);

    const ropeDropPlayerState = {
      position: { x: 8, y: -48 },
      velocity: { x: 0, y: 80 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right' as const
    };

    testRuntime.playerMovementIntent = {
      moveX: 0,
      jumpHeld: false,
      jumpPressed: false,
      ropeDropHeld: true,
      ropeDropWindowArmed: false
    };
    testRuntime.rendererStepPlayerStateImpl = () => ropeDropPlayerState;

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest status-strip telemetry');
    }

    expect(testRuntime.latestDebugEditStatusStripState.playerRopeDropActive).toBe(true);
    expect(testRuntime.latestDebugEditStatusStripState.playerRopeDropWindowArmed).toBe(false);

    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState).not.toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState).not.toBeNull();
    if (!testRuntime.latestDebugOverlayInspectState || !testRuntime.latestDebugEditStatusStripState) {
      throw new Error('expected latest overlay and status-strip telemetry');
    }

    expect(testRuntime.latestDebugOverlayInspectState.playerIntent).toEqual(
      expect.objectContaining({
        ropeDropActive: true,
        ropeDropWindowArmed: false
      })
    );
    expect(testRuntime.latestDebugEditStatusStripState.playerRopeDropActive).toBeNull();
    expect(testRuntime.latestDebugEditStatusStripState.playerRopeDropWindowArmed).toBeNull();

    testRuntime.playerMovementIntent = {
      moveX: 0,
      jumpHeld: false,
      jumpPressed: false,
      ropeDropHeld: false,
      ropeDropWindowArmed: true
    };

    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.playerIntent).toEqual(
      expect.objectContaining({
        ropeDropActive: false,
        ropeDropWindowArmed: true
      })
    );
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
    expect(testRuntime.latestDebugEditStatusStripState.playerHostileContactEvent).toBeNull();
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

  it('routes digit shortcuts to the hotbar while the full debug-edit panel is hidden, then keeps brush slots on the open panel path', async () => {
    await import('./main');
    await flushBootstrap();

    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);
    expect(dispatchKeydown('1', 'Digit1').prevented).toBe(false);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);
    dispatchWindowEvent('pagehide');
    expect(
      readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.selectedHotbarSlotIndex
    ).toBe(1);

    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);

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

  it('reorders the selected hotbar slot with Shift+[ and Shift+] while the full debug-edit panel is hidden, then persists that order through pause and export', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('}', 'BracketRight', { shiftKey: true }).prevented).toBe(true);
    expect(dispatchKeydown('}', 'BracketRight', { shiftKey: true }).prevented).toBe(true);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);

    expect(dispatchKeydown('q').prevented).toBe(true);

    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'dirt-block', amount: 64 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'rope', amount: 24 },
          { itemId: 'healing-potion', amount: 3 },
          { itemId: 'heart-crystal', amount: 1 },
          { itemId: 'sword', amount: 1 },
          { itemId: 'umbrella', amount: 1 },
          { itemId: 'bug-net', amount: 1 },
          { itemId: 'spear', amount: 1 }
        ],
        selectedHotbarSlotIndex: 2
      })
    );

    testRuntime.shellInstance?.options.onSecondaryAction('main-menu');

    const downloadedEnvelope = testRuntime.downloadedWorldSaveEnvelopes[0] as {
      session: {
        standalonePlayerInventoryState: ReturnType<typeof createPlayerInventoryState>;
      };
    };
    expect(downloadedEnvelope.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'dirt-block', amount: 64 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'rope', amount: 24 },
          { itemId: 'healing-potion', amount: 3 },
          { itemId: 'heart-crystal', amount: 1 },
          { itemId: 'sword', amount: 1 },
          { itemId: 'umbrella', amount: 1 },
          { itemId: 'bug-net', amount: 1 },
          { itemId: 'spear', amount: 1 }
        ],
        selectedHotbarSlotIndex: 2
      })
    );

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    expect(dispatchKeydown('}', 'BracketRight', { shiftKey: true }).prevented).toBe(false);
    expect(readPersistedDebugEditControlState().brushTileId).toBe(3);
  });

  it('arms fixed-step glide only while the starter umbrella is selected and jump is held', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('8', 'Digit8').prevented).toBe(true);

    testRuntime.playerMovementIntent = {
      moveX: 0,
      jumpHeld: true,
      jumpPressed: false,
      ropeDropHeld: false,
      ropeDropWindowArmed: false
    };
    testRuntime.rendererStepPlayerStateRequests = [];

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
          moveX: 0,
          jumpPressed: false,
          glideHeld: true
        }
      }
    ]);

    testRuntime.playerMovementIntent = {
      moveX: 0,
      jumpHeld: false,
      jumpPressed: false,
      ropeDropHeld: false,
      ropeDropWindowArmed: false
    };
    testRuntime.rendererStepPlayerStateRequests = [];

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
          moveX: 0,
          jumpPressed: false
        }
      }
    ]);
  });

  it('shows a valid starter dirt placement preview on the hovered tile while the full debug-edit panel is hidden', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(testRuntime.hoveredTileCursorInstance?.visible).toBe(false);
    expect(testRuntime.playerItemPlacementPreviewInstance?.visible).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 1,
      tileY: -1,
      placementTileX: 1,
      placementTileY: -1,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a valid acorn planting preview on a hovered grass anchor while the full debug-edit panel is hidden', async () => {
    setPersistedWorldSaveWithInventory(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'acorn', amount: 3 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'rope', amount: 24 },
          ...Array.from({ length: 6 }, () => null)
        ],
        selectedHotbarSlotIndex: 1
      })
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: 0 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 1,
      tileY: 0,
      placementTileX: 1,
      placementTileY: 0,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a valid stone-block placement preview when a restored hotbar slot holds stone blocks', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'stone-block', amount: 12 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              ...Array.from({ length: 6 }, () => null)
            ],
            selectedHotbarSlotIndex: 1
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 1,
      tileY: -1,
      placementTileX: 1,
      placementTileY: -1,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a blocked starter dirt placement preview when the hovered tile would overlap the player', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 0, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 0,
      tileY: -1,
      placementTileX: 0,
      placementTileY: -1,
      canPlace: false,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: true
    });
  });

  it('shows a valid starter torch placement preview even when the hovered tile overlaps the player', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 0, y: -1 }
    };

    expect(dispatchKeydown('3', 'Digit3').prevented).toBe(true);
    runRenderFrame();
    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 0,
      tileY: -1,
      placementTileX: 0,
      placementTileY: -1,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a blocked hotbar placement preview when the hovered tile is beyond the default placement range', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(20, 0), 1);
    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 20, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 20,
      tileY: -1,
      placementTileX: 20,
      placementTileY: -1,
      canPlace: false,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a valid rope placement preview when the selected stack hangs below a solid anchor', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.delete(worldTileKey(0, 1));
    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 0, y: 1 }
    };

    expect(dispatchKeydown('4', 'Digit4').prevented).toBe(true);
    runRenderFrame();
    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 0,
      tileY: 1,
      placementTileX: 0,
      placementTileY: 1,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a valid rope placement preview when the selected stack attaches to the side of a solid tile', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.delete(worldTileKey(1, 0));
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: 0 }
    };

    expect(dispatchKeydown('4', 'Digit4').prevented).toBe(true);
    runRenderFrame();
    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 1,
      tileY: 0,
      placementTileX: 1,
      placementTileY: 0,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a valid wood-block placement preview when a restored hotbar slot holds wood blocks', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'wood-block', amount: 12 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              ...Array.from({ length: 6 }, () => null)
            ],
            selectedHotbarSlotIndex: 1
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 1,
      tileY: -1,
      placementTileX: 1,
      placementTileY: -1,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a valid dirt-wall placement preview inside an enclosed empty room', async () => {
    setPersistedWorldSaveWithInventory(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'dirt-wall', amount: 12 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'rope', amount: 24 },
          ...Array.from({ length: 6 }, () => null)
        ],
        selectedHotbarSlotIndex: 1
      })
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let tileX = 0; tileX <= 4; tileX += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(tileX, 0), 1);
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(tileX, -4), 1);
    }
    for (let tileY = -4; tileY <= 0; tileY += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, tileY), 1);
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(4, tileY), 1);
    }

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 2, y: -2 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 2,
      tileY: -2,
      placementTileX: 2,
      placementTileY: -2,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('shows a blocked dirt-wall placement preview on an exposed tile and ignores use without consuming the stack', async () => {
    setPersistedWorldSaveWithInventory(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'dirt-wall', amount: 12 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'rope', amount: 24 },
          ...Array.from({ length: 6 }, () => null)
        ],
        selectedHotbarSlotIndex: 1
      })
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let tileX = 0; tileX <= 4; tileX += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(tileX, 0), 1);
    }
    for (let tileY = -3; tileY <= 0; tileY += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, tileY), 1);
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(4, tileY), 1);
    }

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 2, y: -2 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 2,
      tileY: -2,
      placementTileX: 2,
      placementTileY: -2,
      canPlace: false,
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false
    });

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -2,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetWallCalls).toEqual([]);
    expect(testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(2, -2))).toBeUndefined();
    expect(getHotbarOverlaySlotAmountLabel(1).textContent).toBe('12');
  });

  it('shows distinct sapling-versus-grown chop preview states for the selected axe slot', async () => {
    const treeTileIds = getSmallTreeTileIds();
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(1, -1, treeTileIds.sapling)).toBe(true);
    expect(savedWorld.setTile(4, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(4, -1, treeTileIds.trunk)).toBe(true);
    expect(savedWorld.setTile(4, -2, treeTileIds.trunk)).toBe(true);
    expect(savedWorld.setTile(3, -3, treeTileIds.leaf)).toBe(true);
    expect(savedWorld.setTile(4, -3, treeTileIds.leaf)).toBe(true);
    expect(savedWorld.setTile(5, -3, treeTileIds.leaf)).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 56, y: 0 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [{ itemId: 'axe', amount: 1 }, ...Array.from({ length: 9 }, () => null)],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemAxeChopPreviewState).toEqual({
      tileX: 1,
      tileY: -1,
      canChop: true,
      occupied: true,
      chopTarget: true,
      withinRange: true,
      growthStage: 'planted',
      activeSwing: false
    });
    expect(testRuntime.latestPlayerItemMiningPreviewState).toBeNull();

    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 5, y: -3 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemAxeChopPreviewState).toEqual({
      tileX: 5,
      tileY: -3,
      canChop: true,
      occupied: true,
      chopTarget: true,
      withinRange: true,
      growthStage: 'grown',
      activeSwing: false
    });
    expect(testRuntime.latestPlayerItemMiningPreviewState).toBeNull();
  });

  it('keeps the resolved axe chop preview stage through an active swing after the tree clears', async () => {
    const treeTileIds = getSmallTreeTileIds();
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(1, -1, treeTileIds.trunk)).toBe(true);
    expect(savedWorld.setTile(1, -2, treeTileIds.trunk)).toBe(true);
    expect(savedWorld.setTile(0, -3, treeTileIds.leaf)).toBe(true);
    expect(savedWorld.setTile(1, -3, treeTileIds.leaf)).toBe(true);
    expect(savedWorld.setTile(2, -3, treeTileIds.leaf)).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 24, y: 0 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [{ itemId: 'axe', amount: 1 }, ...Array.from({ length: 9 }, () => null)],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererPersistentSetTileResult = true;
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -3,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_AXE_SWING_WINDUP_SECONDS);

    testRuntime.pointerInspect = null;
    runRenderFrame();

    expect(testRuntime.latestPlayerItemAxeChopPreviewState).toEqual({
      tileX: 2,
      tileY: -3,
      canChop: false,
      occupied: false,
      chopTarget: false,
      withinRange: true,
      growthStage: 'grown',
      activeSwing: true
    });
    expect(testRuntime.latestPlayerItemMiningPreviewState).toBeNull();
  });

  it('shows a can-release bunny preview when nearby fallback ground makes the hovered target valid', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 40, y: 0 }
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bunny', amount: 2 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 8
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(3, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, -1), 1);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 2, y: 0 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemBunnyReleasePreviewState).toEqual({
      tileX: 2,
      tileY: 0,
      canRelease: true,
      placementRangeWithinReach: true,
      landingTile: {
        tileX: 2,
        tileY: -2
      }
    });
  });

  it('keeps the resolved bunny landing tile on the hovered cell when the requested ground already works directly', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 40, y: 0 }
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bunny', amount: 2 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 8
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(3, 0), 1);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 2, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemBunnyReleasePreviewState).toEqual({
      tileX: 2,
      tileY: -1,
      canRelease: true,
      placementRangeWithinReach: true,
      landingTile: {
        tileX: 2,
        tileY: -1
      }
    });
  });

  it('shows an out-of-range bunny preview when the hovered tile is beyond the shared release reach', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 }
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bunny', amount: 1 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 8
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(8, 0), 1);
    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 8, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemBunnyReleasePreviewState).toEqual({
      tileX: 8,
      tileY: -1,
      canRelease: false,
      placementRangeWithinReach: false,
      landingTile: null
    });
  });

  it('keeps the hovered rope tile highlighted while resolving the bottom extension target', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 1), 11);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 2), 11);
    testRuntime.rendererTileIdsByWorldKey.delete(worldTileKey(0, 3));
    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 0, y: 1 }
    };

    expect(dispatchKeydown('4', 'Digit4').prevented).toBe(true);
    runRenderFrame();
    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 0,
      tileY: 1,
      placementTileX: 0,
      placementTileY: 3,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('keeps rope-column extension placeable when the touched rope segment is in range even if the bottom target is farther away', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    for (let ropeTileY = 1; ropeTileY <= 7; ropeTileY += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, ropeTileY), 11);
    }
    testRuntime.rendererTileIdsByWorldKey.delete(worldTileKey(0, 8));
    testRuntime.pointerInspect = {
      pointerType: 'touch',
      tile: { x: 0, y: 1 }
    };

    expect(dispatchKeydown('4', 'Digit4').prevented).toBe(true);
    runRenderFrame();
    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 0,
      tileY: 1,
      placementTileX: 0,
      placementTileY: 8,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });
  });

  it('gates workbench-only recipes on nearby placed workbench tiles in the crafting panel', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'gel', amount: 2 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'workbench', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);

    runRenderFrame();

    expect(testRuntime.craftingPanelInstance?.visible).toBe(true);
    expect(testRuntime.latestCraftingPanelState).toMatchObject({
      stations: [
        {
          stationId: 'workbench',
          label: 'Workbench',
          inRange: false
        },
        {
          stationId: 'furnace',
          label: 'Furnace',
          inRange: false
        },
        {
          stationId: 'anvil',
          label: 'Anvil',
          inRange: false
        }
      ]
    });
    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'workbench')
    ).toMatchObject({
      availabilityLabel: 'Ready to craft',
      enabled: true
    });
    expect(
      testRuntime.latestCraftingPanelState?.recipes.find(
        (recipe) => recipe.recipeId === 'healing-potion'
      )
    ).toMatchObject({
      availabilityLabel: 'Blocked: Requires nearby Workbench',
      enabled: false,
      disabledReason: 'Requires nearby Workbench'
    });

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_WORKBENCH_TILE_ID);
    runRenderFrame();

    expect(testRuntime.latestCraftingPanelState).toMatchObject({
      stations: [
        {
          stationId: 'workbench',
          label: 'Workbench',
          inRange: true
        },
        {
          stationId: 'furnace',
          label: 'Furnace',
          inRange: false
        },
        {
          stationId: 'anvil',
          label: 'Anvil',
          inRange: false
        }
      ]
    });
    expect(
      testRuntime.latestCraftingPanelState?.recipes.find(
        (recipe) => recipe.recipeId === 'healing-potion'
      )
    ).toMatchObject({
      availabilityLabel: 'Ready to craft',
      enabled: true,
      disabledReason: null
    });

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, -1), STARTER_ANVIL_TILE_ID);
    runRenderFrame();

    expect(testRuntime.latestCraftingPanelState).toMatchObject({
      stations: [
        {
          stationId: 'workbench',
          label: 'Workbench',
          inRange: true
        },
        {
          stationId: 'furnace',
          label: 'Furnace',
          inRange: false
        },
        {
          stationId: 'anvil',
          label: 'Anvil',
          inRange: true
        }
      ]
    });
  });

  it('crafts a workbench from the panel, then places it through the shared hidden-panel item-use path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bug-net', amount: 1 },
              { itemId: 'workbench', amount: 1 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'workbench')
    ).toMatchObject({
      enabled: true
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('workbench');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'dirt-block', amount: 44 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'rope', amount: 24 },
          { itemId: 'healing-potion', amount: 3 },
          { itemId: 'sword', amount: 1 },
          { itemId: 'umbrella', amount: 1 },
          { itemId: 'bug-net', amount: 1 },
          { itemId: 'workbench', amount: 2 },
          { itemId: 'spear', amount: 1 }
        ],
        selectedHotbarSlotIndex: 0
      })
    );

    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    expect(dispatchKeydown('9', 'Digit9').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 1,
      tileY: -1,
      placementTileX: 1,
      placementTileY: -1,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });

    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: STARTER_WORKBENCH_TILE_ID
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.standalonePlayerInventoryState.hotbar[8]).toEqual({
      itemId: 'workbench',
      amount: 1
    });
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, -1)).toBe(STARTER_WORKBENCH_TILE_ID);
  });

  it('crafts a furnace from the panel, then places it through the shared hidden-panel item-use path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'stone-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bug-net', amount: 1 },
              null,
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_WORKBENCH_TILE_ID);
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'furnace')
    ).toMatchObject({
      enabled: true
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('furnace');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'stone-block', amount: 44 },
          { itemId: 'torch', amount: 16 },
          { itemId: 'rope', amount: 24 },
          { itemId: 'healing-potion', amount: 3 },
          { itemId: 'sword', amount: 1 },
          { itemId: 'umbrella', amount: 1 },
          { itemId: 'bug-net', amount: 1 },
          { itemId: 'furnace', amount: 1 },
          { itemId: 'spear', amount: 1 }
        ],
        selectedHotbarSlotIndex: 0
      })
    );

    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    expect(dispatchKeydown('9', 'Digit9').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 1,
      tileY: -1,
      placementTileX: 1,
      placementTileY: -1,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });

    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: STARTER_FURNACE_TILE_ID
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.standalonePlayerInventoryState.hotbar[8]).toBeNull();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, -1)).toBe(STARTER_FURNACE_TILE_ID);
  });

  it('crafts an anvil from the panel, then places it through the shared hidden-panel item-use path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'copper-bar', amount: 5 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bug-net', amount: 1 },
              null,
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_WORKBENCH_TILE_ID);
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'anvil')
    ).toMatchObject({
      enabled: true
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('anvil');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'anvil', amount: 1 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'rope', amount: 24 },
          { itemId: 'healing-potion', amount: 3 },
          { itemId: 'sword', amount: 1 },
          { itemId: 'umbrella', amount: 1 },
          { itemId: 'bug-net', amount: 1 },
          null,
          { itemId: 'spear', amount: 1 }
        ],
        selectedHotbarSlotIndex: 0
      })
    );

    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: -1 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemPlacementPreviewState).toEqual({
      tileX: 1,
      tileY: -1,
      placementTileX: 1,
      placementTileY: -1,
      canPlace: true,
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false
    });

    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: STARTER_ANVIL_TILE_ID
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.standalonePlayerInventoryState.hotbar[1]).toBeNull();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, -1)).toBe(STARTER_ANVIL_TILE_ID);
  });

  it('smelts copper bars from the panel only when a nearby furnace is placed', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'copper-ore', amount: 6 },
              null,
              ...Array.from({ length: 8 }, () => null)
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'copper-bar')
    ).toMatchObject({
      enabled: false,
      disabledReason: 'Requires nearby Furnace'
    });

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_FURNACE_TILE_ID);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'copper-bar')
    ).toMatchObject({
      enabled: true,
      disabledReason: null
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('copper-bar');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'copper-ore', amount: 3 },
          { itemId: 'copper-bar', amount: 1 },
          ...Array.from({ length: 8 }, () => null)
        ],
        selectedHotbarSlotIndex: 0
      })
    );
  });

  it('crafts a starter spear from the panel only when a nearby anvil is placed', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'copper-bar', amount: 8 },
              null,
              ...Array.from({ length: 8 }, () => null)
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'spear')
    ).toMatchObject({
      enabled: false,
      disabledReason: 'Requires nearby Anvil'
    });

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_ANVIL_TILE_ID);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'spear')
    ).toMatchObject({
      enabled: true,
      disabledReason: null
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('spear');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'spear', amount: 1 },
          null,
          ...Array.from({ length: 8 }, () => null)
        ],
        selectedHotbarSlotIndex: 0
      })
    );
  });

  it('crafts a starter pickaxe from the panel only when a nearby anvil is placed', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'copper-bar', amount: 12 },
              null,
              ...Array.from({ length: 8 }, () => null)
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'pickaxe')
    ).toMatchObject({
      enabled: false,
      disabledReason: 'Requires nearby Anvil'
    });

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_ANVIL_TILE_ID);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'pickaxe')
    ).toMatchObject({
      enabled: true,
      disabledReason: null
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('pickaxe');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          null,
          ...Array.from({ length: 8 }, () => null)
        ],
        selectedHotbarSlotIndex: 0
      })
    );
  });

  it('crafts a starter sword from the panel only when a nearby anvil is placed', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'copper-bar', amount: 10 },
              null,
              ...Array.from({ length: 8 }, () => null)
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'sword')
    ).toMatchObject({
      enabled: false,
      disabledReason: 'Requires nearby Anvil'
    });

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_ANVIL_TILE_ID);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'sword')
    ).toMatchObject({
      enabled: true,
      disabledReason: null
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('sword');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'sword', amount: 1 },
          null,
          ...Array.from({ length: 8 }, () => null)
        ],
        selectedHotbarSlotIndex: 0
      })
    );
  });

  it('crafts a starter axe from the panel only when a nearby anvil is placed', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'copper-bar', amount: 9 },
              null,
              ...Array.from({ length: 8 }, () => null)
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'axe')
    ).toMatchObject({
      enabled: false,
      disabledReason: 'Requires nearby Anvil'
    });

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_ANVIL_TILE_ID);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'axe')
    ).toMatchObject({
      enabled: true,
      disabledReason: null
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('axe');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'axe', amount: 1 },
          null,
          ...Array.from({ length: 8 }, () => null)
        ],
        selectedHotbarSlotIndex: 0
      })
    );
  });

  it('shows the searchable item and recipe catalog only while the full debug-edit panel is visible and updates filtered results', async () => {
    await import('./main');
    await flushBootstrap();

    expect(testRuntime.itemCatalogPanelInstance?.visible).toBe(false);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(testRuntime.itemCatalogPanelInstance?.visible).toBe(true);
    expect(testRuntime.latestItemCatalogPanelState?.searchQuery).toBe('');
    expect(
      testRuntime.latestItemCatalogPanelState?.items.some((item) => item.itemId === 'workbench')
    ).toBe(true);
    expect(
      testRuntime.latestItemCatalogPanelState?.recipes.some((recipe) => recipe.recipeId === 'workbench')
    ).toBe(true);

    testRuntime.itemCatalogPanelInstance?.triggerSearchQueryChange('gel');

    expect(testRuntime.latestItemCatalogPanelState).toMatchObject({
      searchQuery: 'gel',
      resultSummaryLabel: '1 matching item | 2 matching recipes'
    });
    expect(testRuntime.latestItemCatalogPanelState?.items.map((item) => item.itemId)).toEqual([
      'gel'
    ]);
    expect(
      testRuntime.latestItemCatalogPanelState?.recipes.map((recipe) => recipe.recipeId)
    ).toEqual(['healing-potion', 'torch']);

    testRuntime.itemCatalogPanelInstance?.triggerSearchQueryChange('nearby workbench');

    const nearbyWorkbenchState = testRuntime.latestItemCatalogPanelState;
    expect(nearbyWorkbenchState).toBeDefined();
    if (!nearbyWorkbenchState) {
      throw new Error('Expected item catalog state after nearby workbench search');
    }
    expect(nearbyWorkbenchState).toMatchObject({
      searchQuery: 'nearby workbench',
      itemEmptyLabel: 'No items match "nearby workbench"'
    });
    expect(nearbyWorkbenchState.items).toEqual([]);
    expect(
      nearbyWorkbenchState.recipes.some((recipe) => recipe.recipeId === 'healing-potion')
    ).toBe(true);
    expect(
      nearbyWorkbenchState.recipes.every(
        (recipe) => recipe.stationRequirementLabel === 'Requirement: Nearby Workbench'
      )
    ).toBe(true);
    expect(nearbyWorkbenchState.resultSummaryLabel).toBe(
      `0 matching items | ${nearbyWorkbenchState.recipes.length} matching ${
        nearbyWorkbenchState.recipes.length === 1 ? 'recipe' : 'recipes'
      }`
    );

    testRuntime.itemCatalogPanelInstance?.triggerSearchQueryChange('zzz');

    expect(testRuntime.latestItemCatalogPanelState).toMatchObject({
      searchQuery: 'zzz',
      resultSummaryLabel: '0 matching items | 0 matching recipes',
      itemEmptyLabel: 'No items match "zzz"',
      recipeEmptyLabel: 'No recipes match "zzz"',
      items: [],
      recipes: []
    });

    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    expect(testRuntime.itemCatalogPanelInstance?.visible).toBe(false);
  });

  it('spawns one catalog item into the hotbar through the shared inventory add path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'gel', amount: 1 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bug-net', amount: 1 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    testRuntime.itemCatalogPanelInstance?.triggerSearchQueryChange('gel');
    expect(testRuntime.latestItemCatalogPanelState?.items).toEqual([
      {
        itemId: 'gel',
        label: 'Gel',
        detailsLabel: 'Id: gel | Hotbar: GEL | Max stack: 999',
        inventoryLabel: 'Have: 1 | Spawn +1',
        enabled: true,
        disabledReason: null
      }
    ]);

    testRuntime.itemCatalogPanelInstance?.triggerSpawnItem('gel');

    expect(testRuntime.latestItemCatalogPanelState?.items).toEqual([
      {
        itemId: 'gel',
        label: 'Gel',
        detailsLabel: 'Id: gel | Hotbar: GEL | Max stack: 999',
        inventoryLabel: 'Have: 2 | Spawn +1',
        enabled: true,
        disabledReason: null
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[2]).toEqual({
      itemId: 'gel',
      amount: 2
    });
  });

  it('quick-crafts catalog recipes through the shared crafting path and refreshes live blocker states', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'gel', amount: 2 },
              { itemId: 'healing-potion', amount: 1 },
              ...Array.from({ length: 8 }, () => null)
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    testRuntime.itemCatalogPanelInstance?.triggerSearchQueryChange('potion');
    expect(testRuntime.latestItemCatalogPanelState?.recipes).toEqual([
      {
        recipeId: 'healing-potion',
        label: 'Healing Potion',
        outputLabel: 'Output: +1 POTION',
        ingredientsLabel: 'Ingredients: 2 Gel',
        stationRequirementLabel: 'Requirement: Nearby Workbench',
        availabilityLabel: 'Blocked: Requires nearby Workbench',
        enabled: false,
        disabledReason: 'Requires nearby Workbench'
      }
    ]);

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -1), STARTER_WORKBENCH_TILE_ID);
    runRenderFrame();

    expect(testRuntime.latestItemCatalogPanelState?.recipes).toEqual([
      {
        recipeId: 'healing-potion',
        label: 'Healing Potion',
        outputLabel: 'Output: +1 POTION',
        ingredientsLabel: 'Ingredients: 2 Gel',
        stationRequirementLabel: 'Requirement: Nearby Workbench',
        availabilityLabel: 'Ready to craft',
        enabled: true,
        disabledReason: null
      }
    ]);

    testRuntime.itemCatalogPanelInstance?.triggerCraftRecipe('healing-potion');

    expect(testRuntime.latestItemCatalogPanelState?.recipes).toEqual([
      {
        recipeId: 'healing-potion',
        label: 'Healing Potion',
        outputLabel: 'Output: +1 POTION',
        ingredientsLabel: 'Ingredients: 2 Gel',
        stationRequirementLabel: 'Requirement: Nearby Workbench',
        availabilityLabel: 'Blocked: Missing 2 Gel',
        enabled: false,
        disabledReason: 'Missing 2 Gel'
      }
    ]);

    dispatchWindowEvent('pagehide');
    const savedInventory = readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState;
    expect(savedInventory?.hotbar[1]).toEqual({
      itemId: 'healing-potion',
      amount: 2
    });
    expect(savedInventory?.hotbar.some((stack) => stack?.itemId === 'gel')).toBe(false);
  });

  it('quick-crafts torch stacks without a nearby station and refreshes missing-ingredient blocker text', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'gel', amount: 1 },
              { itemId: 'wood', amount: 1 },
              { itemId: 'torch', amount: 2 },
              ...Array.from({ length: 7 }, () => null)
            ],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    testRuntime.itemCatalogPanelInstance?.triggerSearchQueryChange('wood torch');
    expect(testRuntime.latestItemCatalogPanelState?.recipes).toEqual([
      {
        recipeId: 'torch',
        label: 'Torch',
        outputLabel: 'Output: +3 TORCH',
        ingredientsLabel: 'Ingredients: 1 Gel + 1 Wood',
        stationRequirementLabel: 'Requirement: None',
        availabilityLabel: 'Ready to craft',
        enabled: true,
        disabledReason: null
      }
    ]);

    testRuntime.itemCatalogPanelInstance?.triggerCraftRecipe('torch');

    expect(testRuntime.latestItemCatalogPanelState?.recipes).toEqual([
      {
        recipeId: 'torch',
        label: 'Torch',
        outputLabel: 'Output: +3 TORCH',
        ingredientsLabel: 'Ingredients: 1 Gel + 1 Wood',
        stationRequirementLabel: 'Requirement: None',
        availabilityLabel: 'Blocked: Missing 1 Gel + 1 Wood',
        enabled: false,
        disabledReason: 'Missing 1 Gel + 1 Wood'
      }
    ]);

    dispatchWindowEvent('pagehide');
    const savedInventory = readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState;
    expect(savedInventory?.hotbar[0]).toBeNull();
    expect(savedInventory?.hotbar[1]).toBeNull();
    expect(savedInventory?.hotbar[2]).toEqual({
      itemId: 'torch',
      amount: 5
    });
  });

  it('crafts wood blocks from wood without a nearby station and persists the produced stack', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [{ itemId: 'wood', amount: 1 }, ...Array.from({ length: 9 }, () => null)],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'wood-block')
    ).toMatchObject({
      label: 'Wood Block',
      ingredientsLabel: '1 Wood',
      outputLabel: '+1 WBLK',
      availabilityLabel: 'Ready to craft',
      enabled: true,
      disabledReason: null
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('wood-block');

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'wood-block')
    ).toMatchObject({
      availabilityLabel: 'Blocked: Missing 1 Wood',
      enabled: false,
      disabledReason: 'Missing 1 Wood'
    });

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [{ itemId: 'wood-block', amount: 1 }, ...Array.from({ length: 9 }, () => null)],
        selectedHotbarSlotIndex: 0
      })
    );
  });

  it('crafts wood walls from wood without a nearby station and persists the produced stack', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [{ itemId: 'wood', amount: 1 }, ...Array.from({ length: 9 }, () => null)],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'wood-wall')
    ).toMatchObject({
      label: 'Wood Wall',
      ingredientsLabel: '1 Wood',
      outputLabel: '+4 WWALL',
      availabilityLabel: 'Ready to craft',
      enabled: true,
      disabledReason: null
    });

    testRuntime.craftingPanelInstance?.triggerCraftRecipe('wood-wall');

    expect(
      testRuntime.latestCraftingPanelState?.recipes.find((recipe) => recipe.recipeId === 'wood-wall')
    ).toMatchObject({
      availabilityLabel: 'Blocked: Missing 1 Wood',
      enabled: false,
      disabledReason: 'Missing 1 Wood'
    });

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [{ itemId: 'wood-wall', amount: 4 }, ...Array.from({ length: 9 }, () => null)],
        selectedHotbarSlotIndex: 0
      })
    );
  });

  it('hides the hotbar placement preview for unsupported item slots and while the full debug-edit panel is open', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 1, y: -1 }
    };

    expect(dispatchKeydown('5', 'Digit5').prevented).toBe(true);
    runRenderFrame();
    expect(testRuntime.latestPlayerItemPlacementPreviewState).toBeNull();

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    runRenderFrame();
    expect(testRuntime.latestPlayerItemPlacementPreviewState).toBeNull();
  });

  it('places a starter dirt block from the selected hotbar slot while the full debug-edit panel is hidden', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: 9
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-block',
      amount: 63
    });
  });

  it('plants an acorn from the selected hotbar slot through the shared hidden-panel item-use path', async () => {
    const supportTileIdBeforePlanting = PROCEDURAL_GRASS_SURFACE_TILE_ID;
    const plantingInventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'acorn', amount: 2 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        ...Array.from({ length: 6 }, () => null)
      ],
      selectedHotbarSlotIndex: 1
    });
    const savedWorld = new TileWorld(0);
    savedWorld.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID);
    savedWorld.setTile(1, -1, 0);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right',
            grounded: true
          }),
          standalonePlayerInventoryState: plantingInventoryState
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: getSmallTreeSaplingTileId()
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'acorn',
      amount: 1
    });
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, 0)).toBe(supportTileIdBeforePlanting);
    expect(restoredWorld.getTile(1, -1)).toBe(getSmallTreeSaplingTileId());
  });

  it('spreads grass onto sunlit dirt on deterministic fixed-step windows and persists the updated tile', async () => {
    const savedWorld = new TileWorld(0);
    const grassTileY = -20;
    expect(savedWorld.setTile(1, grassTileY, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(2, grassTileY, PROCEDURAL_DIRT_TILE_ID)).toBe(true);
    savedWorld.fillChunkLight(0, -1, MAX_LIGHT_LEVEL);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 16 },
            facing: 'right'
          })
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererResidentChunkBounds = {
      minChunkX: 0,
      maxChunkX: 0,
      minChunkY: -1,
      maxChunkY: -1
    };
    testRuntime.rendererSetTileCalls = [];
    testRuntime.rendererSetTileResult = true;
    testRuntime.rendererPersistentSetTileResult = true;

    const growthWindowIndex = resolveGrassGrowthWindowIndex(2, grassTileY);
    const fixedUpdatesUntilGrowth =
      DEFAULT_GRASS_GROWTH_INTERVAL_TICKS * (growthWindowIndex + 1);
    for (let updateIndex = 0; updateIndex < fixedUpdatesUntilGrowth; updateIndex += 1) {
      runFixedUpdate(1 / 60);
    }

    expect(
      testRuntime.rendererSetTileCalls.filter((call) => call.tileId === PROCEDURAL_GRASS_SURFACE_TILE_ID)
    ).toEqual([
      {
        worldTileX: 2,
        worldTileY: grassTileY,
        tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, grassTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(restoredWorld.getTile(2, grassTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
  });

  it('grows tall grass on deterministic fixed-step windows and persists the updated tile', async () => {
    const savedWorld = new TileWorld(0);
    const grassTileY = -4;

    expect(savedWorld.setTile(1, grassTileY, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    savedWorld.fillChunkLight(0, -1, MAX_LIGHT_LEVEL);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 16 },
            facing: 'right'
          })
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererResidentChunkBounds = {
      minChunkX: 0,
      maxChunkX: 0,
      minChunkY: -1,
      maxChunkY: -1
    };
    testRuntime.rendererSetTileCalls = [];
    testRuntime.rendererSetTileResult = true;
    testRuntime.rendererPersistentSetTileResult = true;

    const growthWindowIndex = resolveGrassGrowthWindowIndex(1, grassTileY);
    const fixedUpdatesUntilGrowth =
      DEFAULT_GRASS_GROWTH_INTERVAL_TICKS * (growthWindowIndex + 1);
    for (let updateIndex = 0; updateIndex < fixedUpdatesUntilGrowth; updateIndex += 1) {
      runFixedUpdate(1 / 60);
    }

    expect(
      testRuntime.rendererSetTileCalls.filter((call) => call.tileId === getTallGrassTileId())
    ).toContainEqual({
      worldTileX: 1,
      worldTileY: grassTileY - 1,
      tileId: getTallGrassTileId()
    });

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, grassTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(restoredWorld.getTile(1, grassTileY - 1)).toBe(getTallGrassTileId());
  });

  it('grows surface flowers on deterministic fixed-step windows and persists the updated tile', async () => {
    const savedWorld = new TileWorld(0);
    const grassTileX = 0;
    const grassTileY = -5;

    expect(savedWorld.setTile(grassTileX, grassTileY, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    savedWorld.fillChunkLight(0, -1, MAX_LIGHT_LEVEL);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 16 },
            facing: 'right'
          })
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererResidentChunkBounds = {
      minChunkX: 0,
      maxChunkX: 0,
      minChunkY: -1,
      maxChunkY: -1
    };
    testRuntime.rendererSetTileCalls = [];
    testRuntime.rendererSetTileResult = true;
    testRuntime.rendererPersistentSetTileResult = true;

    const growthWindowIndex = resolveGrassGrowthWindowIndex(grassTileX, grassTileY);
    const fixedUpdatesUntilGrowth =
      DEFAULT_GRASS_GROWTH_INTERVAL_TICKS * (growthWindowIndex + 1);
    for (let updateIndex = 0; updateIndex < fixedUpdatesUntilGrowth; updateIndex += 1) {
      runFixedUpdate(1 / 60);
    }

    expect(
      testRuntime.rendererSetTileCalls.filter((call) => call.tileId === getSurfaceFlowerTileId())
    ).toContainEqual({
      worldTileX: grassTileX,
      worldTileY: grassTileY - 1,
      tileId: getSurfaceFlowerTileId()
    });

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(grassTileX, grassTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(restoredWorld.getTile(grassTileX, grassTileY - 1)).toBe(getSurfaceFlowerTileId());
  });

  it('does not emit sapling-growth writes while no planted saplings are tracked', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererSetTileCalls = [];

    for (
      let updateIndex = 0;
      updateIndex < DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS;
      updateIndex += 1
    ) {
      runFixedUpdate(1 / 60);
    }

    expect(testRuntime.rendererSetTileCalls).toEqual([]);
  });

  it('registers procedurally streamed planted saplings for runtime growth and persists the grown tree', async () => {
    const worldSeed = 0;
    const savedWorld = new TileWorld(0, worldSeed);
    const plantedAnchor = findFirstProceduralPlantedSmallTreeAnchor(worldSeed);

    expect(plantedAnchor).not.toBeNull();
    if (plantedAnchor === null) {
      throw new Error('expected a procedural planted small-tree anchor');
    }

    const requiredChunkBounds = resolveSmallTreeGrowthRequiredChunkBounds(
      plantedAnchor.anchorTileX,
      plantedAnchor.anchorTileY
    );
    const streamedWorld = new TileWorld(0, worldSeed);
    streamedWorld.loadSnapshot(savedWorld.createSnapshot());
    for (let chunkY = requiredChunkBounds.minChunkY; chunkY <= requiredChunkBounds.maxChunkY; chunkY += 1) {
      for (let chunkX = requiredChunkBounds.minChunkX; chunkX <= requiredChunkBounds.maxChunkX; chunkX += 1) {
        streamedWorld.ensureChunk(chunkX, chunkY);
      }
    }
    const streamedSnapshot = streamedWorld.createSnapshot();

    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          })
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererWorldSnapshot = streamedSnapshot;
    syncRendererMapsFromWorldSnapshot(streamedSnapshot);
    testRuntime.rendererResidentChunkBounds = {
      minChunkX: Math.min(0, requiredChunkBounds.minChunkX),
      maxChunkX: Math.max(0, requiredChunkBounds.maxChunkX),
      minChunkY: Math.min(0, requiredChunkBounds.minChunkY),
      maxChunkY: Math.max(0, requiredChunkBounds.maxChunkY)
    };
    testRuntime.rendererSetTileCalls = [];
    testRuntime.rendererSetTileResult = true;
    testRuntime.rendererPersistentSetTileResult = true;

    const growthWindowIndex = resolveSmallTreeGrowthWindowIndex(
      plantedAnchor.anchorTileX,
      plantedAnchor.anchorTileY
    );
    const fixedUpdatesUntilGrowth =
      DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS * (growthWindowIndex + 1);
    for (let updateIndex = 0; updateIndex < fixedUpdatesUntilGrowth; updateIndex += 1) {
      runFixedUpdate(1 / 60);
    }

    const treeTileIds = getSmallTreeTileIds();
    const targetAnchorWrites = testRuntime.rendererSetTileCalls.filter(
      (call) =>
        call.worldTileX >= plantedAnchor.anchorTileX - 1 &&
        call.worldTileX <= plantedAnchor.anchorTileX + 1 &&
        call.worldTileY >= plantedAnchor.anchorTileY - 3 &&
        call.worldTileY <= plantedAnchor.anchorTileY - 1
    );
    expect(targetAnchorWrites).toEqual([
      {
        worldTileX: plantedAnchor.anchorTileX,
        worldTileY: plantedAnchor.anchorTileY - 1,
        tileId: treeTileIds.trunk
      },
      {
        worldTileX: plantedAnchor.anchorTileX,
        worldTileY: plantedAnchor.anchorTileY - 2,
        tileId: treeTileIds.trunk
      },
      {
        worldTileX: plantedAnchor.anchorTileX - 1,
        worldTileY: plantedAnchor.anchorTileY - 3,
        tileId: treeTileIds.leaf
      },
      {
        worldTileX: plantedAnchor.anchorTileX,
        worldTileY: plantedAnchor.anchorTileY - 3,
        tileId: treeTileIds.leaf
      },
      {
        worldTileX: plantedAnchor.anchorTileX + 1,
        worldTileY: plantedAnchor.anchorTileY - 3,
        tileId: treeTileIds.leaf
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(
      resolveSmallTreeGrowthStageAtAnchor(
        restoredWorld,
        plantedAnchor.anchorTileX,
        plantedAnchor.anchorTileY
      )
    ).toBe('grown');
  });

  it('grows planted acorn saplings into small trees on deterministic fixed-step windows and persists the grown tree', async () => {
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(1, -1, getSmallTreeSaplingTileId())).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'acorn', amount: 1 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              ...Array.from({ length: 6 }, () => null)
            ],
            selectedHotbarSlotIndex: 1
          })
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererSetTileCalls = [];
    testRuntime.rendererSetTileResult = true;
    testRuntime.rendererPersistentSetTileResult = true;

    const growthWindowIndex = resolveSmallTreeGrowthWindowIndex(1, 0);
    const fixedUpdatesUntilGrowth =
      DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS * (growthWindowIndex + 1);
    for (let updateIndex = 0; updateIndex < fixedUpdatesUntilGrowth; updateIndex += 1) {
      runFixedUpdate(1 / 60);
    }

    const treeTileIds = getSmallTreeTileIds();
    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: treeTileIds.trunk
      },
      {
        worldTileX: 1,
        worldTileY: -2,
        tileId: treeTileIds.trunk
      },
      {
        worldTileX: 0,
        worldTileY: -3,
        tileId: treeTileIds.leaf
      },
      {
        worldTileX: 1,
        worldTileY: -3,
        tileId: treeTileIds.leaf
      },
      {
        worldTileX: 2,
        worldTileY: -3,
        tileId: treeTileIds.leaf
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'acorn',
      amount: 1
    });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, 0)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(restoredWorld.getTile(1, -1)).toBe(treeTileIds.trunk);
    expect(restoredWorld.getTile(1, -2)).toBe(treeTileIds.trunk);
    expect(restoredWorld.getTile(0, -3)).toBe(treeTileIds.leaf);
    expect(restoredWorld.getTile(1, -3)).toBe(treeTileIds.leaf);
    expect(restoredWorld.getTile(2, -3)).toBe(treeTileIds.leaf);
  });

  it('persists partially advanced small-tree growth cadence on pagehide', async () => {
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(1, -1, getSmallTreeSaplingTileId())).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          })
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const partialTicks = 7;
    for (let updateIndex = 0; updateIndex < partialTicks; updateIndex += 1) {
      runFixedUpdate(1 / 60);
    }

    dispatchWindowEvent('pagehide');

    expect(readPersistedWorldSaveEnvelope()?.session.smallTreeGrowthState).toEqual({
      ticksUntilNextGrowth: DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS - partialTicks,
      nextWindowIndex: 0
    });
  });

  it('restores persisted small-tree growth cadence so planted saplings resume without restarting the interval', async () => {
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(1, -1, getSmallTreeSaplingTileId())).toBe(true);
    const growthWindowIndex = resolveSmallTreeGrowthWindowIndex(1, 0);

    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          smallTreeGrowthState: {
            ticksUntilNextGrowth: 2,
            nextWindowIndex: growthWindowIndex
          }
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererSetTileCalls = [];
    testRuntime.rendererSetTileResult = true;
    testRuntime.rendererPersistentSetTileResult = true;

    runFixedUpdate(1 / 60);
    expect(testRuntime.rendererSetTileCalls).toEqual([]);

    runFixedUpdate(1 / 60);

    const treeTileIds = getSmallTreeTileIds();
    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: treeTileIds.trunk
      },
      {
        worldTileX: 1,
        worldTileY: -2,
        tileId: treeTileIds.trunk
      },
      {
        worldTileX: 0,
        worldTileY: -3,
        tileId: treeTileIds.leaf
      },
      {
        worldTileX: 1,
        worldTileY: -3,
        tileId: treeTileIds.leaf
      },
      {
        worldTileX: 2,
        worldTileY: -3,
        tileId: treeTileIds.leaf
      }
    ]);
  });

  it('drops cleaned planted saplings from runtime growth tracking after their grass support anchor is removed', async () => {
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(1, -1, getSmallTreeSaplingTileId())).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          })
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: 1,
        worldTileY: 0,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), PROCEDURAL_GRASS_SURFACE_TILE_ID);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, -1), getSmallTreeSaplingTileId());
    testRuntime.rendererNextSetTileEditEvents = [
      createTileEditEvent(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID, 0),
      createTileEditEvent(1, -1, getSmallTreeSaplingTileId(), 0)
    ];
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    testRuntime.rendererHasResidentChunkCallCount = 0;
    testRuntime.rendererSetTileCalls = [];
    for (
      let updateIndex = 0;
      updateIndex < DEFAULT_SMALL_TREE_GROWTH_INTERVAL_TICKS;
      updateIndex += 1
    ) {
      runFixedUpdate(1 / 60);
    }

    expect(testRuntime.rendererSetTileCalls).toEqual([]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, 0)).toBe(0);
    expect(restoredWorld.getTile(1, -1)).toBe(0);
  });

  it('places a stone block from the selected hotbar slot while the full debug-edit panel is hidden and persists the consumed stack', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'stone-block', amount: 12 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              ...Array.from({ length: 6 }, () => null)
            ],
            selectedHotbarSlotIndex: 1
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: 1
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'stone-block',
      amount: 11
    });
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, -1)).toBe(1);
  });

  it('places a wood block from the selected hotbar slot while the full debug-edit panel is hidden and persists the consumed stack', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'wood-block', amount: 12 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              ...Array.from({ length: 6 }, () => null)
            ],
            selectedHotbarSlotIndex: 1
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: 19
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'wood-block',
      amount: 11
    });
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, -1)).toBe(19);
  });

  it('places a dirt wall from the selected hotbar slot through the shared hidden-panel item-use path', async () => {
    setPersistedWorldSaveWithInventory(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'dirt-wall', amount: 12 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'rope', amount: 24 },
          ...Array.from({ length: 6 }, () => null)
        ],
        selectedHotbarSlotIndex: 1
      })
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    for (let tileX = 0; tileX <= 4; tileX += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(tileX, 0), 1);
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(tileX, -4), 1);
    }
    for (let tileY = -4; tileY <= 0; tileY += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, tileY), 1);
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(4, tileY), 1);
    }
    testRuntime.rendererSetWallResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -2,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetWallCalls).toEqual([
      {
        worldTileX: 2,
        worldTileY: -2,
        wallId: 1
      }
    ]);
    expect(testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(2, -2))).toBe(1);
    expect(getHotbarOverlaySlotAmountLabel(1).textContent).toBe('11');
  });

  it('places a wood wall from the selected hotbar slot through the shared hidden-panel item-use path', async () => {
    setPersistedWorldSaveWithInventory(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'wood-wall', amount: 6 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'rope', amount: 24 },
          ...Array.from({ length: 6 }, () => null)
        ],
        selectedHotbarSlotIndex: 1
      })
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    for (let tileX = 0; tileX <= 4; tileX += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(tileX, 0), 1);
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(tileX, -4), 1);
    }
    for (let tileY = -4; tileY <= 0; tileY += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, tileY), 1);
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(4, tileY), 1);
    }
    testRuntime.rendererSetWallResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -2,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetWallCalls).toEqual([
      {
        worldTileX: 2,
        worldTileY: -2,
        wallId: STARTER_WOOD_WALL_ID
      }
    ]);
    expect(testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(2, -2))).toBe(STARTER_WOOD_WALL_ID);
    expect(getHotbarOverlaySlotAmountLabel(1).textContent).toBe('5');
  });

  it('chops a grown small tree from the selected axe slot through the shared hidden-panel item-use path and drops wood plus an acorn', async () => {
    const treeTileIds = getSmallTreeTileIds();
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(savedWorld.setTile(1, -1, treeTileIds.trunk)).toBe(true);
    expect(savedWorld.setTile(1, -2, treeTileIds.trunk)).toBe(true);
    expect(savedWorld.setTile(0, -3, treeTileIds.leaf)).toBe(true);
    expect(savedWorld.setTile(1, -3, treeTileIds.leaf)).toBe(true);
    expect(savedWorld.setTile(2, -3, treeTileIds.leaf)).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 24, y: 0 },
            facing: 'right',
            grounded: true
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [{ itemId: 'axe', amount: 1 }, ...Array.from({ length: 9 }, () => null)],
            selectedHotbarSlotIndex: 0
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererPersistentSetTileResult = true;
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -3,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(STARTER_AXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        tileId: 0
      },
      {
        worldTileX: 1,
        worldTileY: -2,
        tileId: 0
      },
      {
        worldTileX: 0,
        worldTileY: -3,
        tileId: 0
      },
      {
        worldTileX: 1,
        worldTileY: -3,
        tileId: 0
      },
      {
        worldTileX: 2,
        worldTileY: -3,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.standalonePlayerInventoryState.hotbar[0]).toEqual({
      itemId: 'axe',
      amount: 1
    });
    expect(persistedEnvelope?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: -8 },
        itemId: 'wood',
        amount: 5
      },
      {
        position: { x: 24, y: -8 },
        itemId: 'acorn',
        amount: 1
      }
    ]);

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(1, 0)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(restoredWorld.getTile(1, -1)).toBe(0);
    expect(restoredWorld.getTile(1, -2)).toBe(0);
    expect(restoredWorld.getTile(0, -3)).toBe(0);
    expect(restoredWorld.getTile(1, -3)).toBe(0);
    expect(restoredWorld.getTile(2, -3)).toBe(0);
  });

  it('shows selected starter-axe hotbar timing feedback through windup, active, recovery, and clear', async () => {
    const treeTileIds = getSmallTreeTileIds();
    setPersistedWorldSaveWithInventory(
      createPlayerInventoryState({
        hotbar: [{ itemId: 'axe', amount: 1 }, ...Array.from({ length: 9 }, () => null)],
        selectedHotbarSlotIndex: 0
      })
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), PROCEDURAL_GRASS_SURFACE_TILE_ID);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, -1), treeTileIds.trunk);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, -2), treeTileIds.trunk);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, -3), treeTileIds.leaf);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, -3), treeTileIds.leaf);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, -3), treeTileIds.leaf);
    testRuntime.rendererPersistentSetTileResult = true;
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -3,
        worldX: 40,
        worldY: -40,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(0).title).toContain('windup active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('WIND');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(0).style.height)).toBeCloseTo(
      ((STARTER_AXE_SWING_WINDUP_SECONDS - 1 / 60) / STARTER_AXE_SWING_WINDUP_SECONDS) * 100,
      1
    );
    expect(getHotbarOverlaySlotCooldownFill(0).style.opacity).toBe('1');

    testRuntime.playerItemUseRequests = [];
    runFixedUpdate(STARTER_AXE_SWING_WINDUP_SECONDS - 1 / 60);

    expect(getHotbarOverlaySlotButton(0).title).toContain('swing active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('ACT');
    expect(getHotbarOverlaySlotCooldownFill(0).style.height).toBe('100.0%');

    runFixedUpdate(STARTER_AXE_SWING_ACTIVE_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(0).title).toContain('swing active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('ACT');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(0).style.height)).toBeCloseTo(
      50,
      1
    );

    runFixedUpdate(STARTER_AXE_SWING_ACTIVE_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(0).title).toContain('recovery active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('REC');
    expect(getHotbarOverlaySlotCooldownFill(0).style.height).toBe('100.0%');

    runFixedUpdate(STARTER_AXE_SWING_RECOVERY_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(0).title).toContain('recovery active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('REC');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(0).style.height)).toBeCloseTo(
      50,
      1
    );

    runFixedUpdate(STARTER_AXE_SWING_RECOVERY_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(0).title).not.toContain('active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('');
    expect(getHotbarOverlaySlotCooldownFill(0).style.height).toBe('0.0%');
    expect(getHotbarOverlaySlotCooldownFill(0).style.opacity).toBe('0');
  });

  it('places a starter torch from the selected hotbar slot while the full debug-edit panel is hidden', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('3', 'Digit3').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: -1,
        worldX: 8,
        worldY: -8,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 0,
        worldTileY: -1,
        tileId: 10
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[2]).toEqual({
      itemId: 'torch',
      amount: 19
    });
  });

  it('places a rope segment from the selected hotbar slot while the full debug-edit panel is hidden', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('4', 'Digit4').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.delete(worldTileKey(0, 1));
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 1,
        worldX: 8,
        worldY: 24,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 0,
        worldTileY: 1,
        tileId: 11
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[3]).toEqual({
      itemId: 'rope',
      amount: 23
    });
  });

  it('places a platform tile from the selected hotbar slot while the full debug-edit panel is hidden', async () => {
    setPersistedWorldSaveWithInventory(
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'pickaxe', amount: 1 },
          { itemId: 'dirt-block', amount: 64 },
          { itemId: 'torch', amount: 20 },
          { itemId: 'rope', amount: 24 },
          { itemId: 'platform', amount: 12 },
          ...Array.from({ length: 5 }, () => null)
        ],
        selectedHotbarSlotIndex: 4
      })
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('5', 'Digit5').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.delete(worldTileKey(0, 1));
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 1,
        worldX: 8,
        worldY: 24,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 0,
        worldTileY: 1,
        tileId: STARTER_PLATFORM_TILE_ID
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[4]).toEqual({
      itemId: 'platform',
      amount: 11
    });
  });

  it('extends the bottom of an existing rope column when the selected hotbar rope is used on a rope tile', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('4', 'Digit4').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 1), 11);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 2), 11);
    testRuntime.rendererTileIdsByWorldKey.delete(worldTileKey(0, 3));
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 1,
        worldX: 8,
        worldY: 24,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 0,
        worldTileY: 3,
        tileId: 11
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[3]).toEqual({
      itemId: 'rope',
      amount: 23
    });
  });

  it('extends the bottom of an existing rope column from an in-range touched segment even when the resolved target is farther away', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('4', 'Digit4').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('play');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    for (let ropeTileY = 1; ropeTileY <= 7; ropeTileY += 1) {
      testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, ropeTileY), 11);
    }
    testRuntime.rendererTileIdsByWorldKey.delete(worldTileKey(0, 8));
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 1,
        worldX: 8,
        worldY: 24,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 0,
        worldTileY: 8,
        tileId: 11
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[3]).toEqual({
      itemId: 'rope',
      amount: 23
    });
  });

  it('rejects starter hotbar placement requests that target tiles beyond the default placement range', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(20, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 20,
        worldTileY: -1,
        worldX: 328,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-block',
      amount: 64
    });
  });

  it('shows selected starter-sword hotbar timing feedback through windup, active, recovery, and clear', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 0,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(6).title).toContain('windup active');
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('WIND');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(6).style.height)).toBeCloseTo(
      ((STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS - 1 / 60) /
        STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS) *
        100,
      1
    );
    expect(getHotbarOverlaySlotCooldownFill(6).style.opacity).toBe('1');

    testRuntime.playerItemUseRequests = [];
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS - 1 / 60);

    expect(getHotbarOverlaySlotButton(6).title).toContain('swing active');
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('ACT');
    expect(getHotbarOverlaySlotCooldownFill(6).style.height).toBe('100.0%');

    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(6).title).toContain('swing active');
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('ACT');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(6).style.height)).toBeCloseTo(
      50,
      1
    );

    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(6).title).toContain('recovery active');
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('REC');
    expect(getHotbarOverlaySlotCooldownFill(6).style.height).toBe('100.0%');

    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(6).title).toContain('recovery active');
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('REC');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(6).style.height)).toBeCloseTo(
      50,
      1
    );

    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(6).title).not.toContain('active');
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('');
    expect(getHotbarOverlaySlotCooldownFill(6).style.height).toBe('0.0%');
    expect(getHotbarOverlaySlotCooldownFill(6).style.opacity).toBe('0');
  });

  it('uses the starter sword through the shared hidden-panel item-use path and carries knockback into the next slime fixed step', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      x: 24,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 0,
        pointerType: 'mouse'
      }
    ];
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS);

    testRuntime.rendererStepHostileSlimeStateImpl = (state, fixedDt) => {
      const slimeState = state as {
        position?: { x?: number; y?: number };
        velocity?: { x?: number; y?: number };
        grounded?: boolean;
        facing?: 'left' | 'right';
        hopCooldownTicksRemaining?: number;
        launchKind?: 'standard-hop' | 'step-hop' | null;
      };
      const velocityX =
        typeof slimeState.velocity?.x === 'number' ? slimeState.velocity.x : 0;
      const velocityY =
        typeof slimeState.velocity?.y === 'number' ? slimeState.velocity.y : 0;
      return {
        position: {
          x: (slimeState.position?.x ?? 0) + velocityX * fixedDt,
          y: (slimeState.position?.y ?? 0) + velocityY * fixedDt
        },
        velocity: {
          x: velocityX,
          y: velocityY
        },
        grounded: slimeState.grounded ?? false,
        facing: slimeState.facing ?? 'right',
        hopCooldownTicksRemaining:
          slimeState.hopCooldownTicksRemaining ?? DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
        launchKind: slimeState.launchKind ?? null
      };
    };
    testRuntime.rendererStepHostileSlimeStateRequests = [];

    runFixedUpdate(1 / 60);
    runRenderFrame();

    expect(testRuntime.rendererStepHostileSlimeStateRequests).toContainEqual({
      state: {
        position: { x: 24, y: 0 },
        velocity: {
          x: DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_X,
          y: -DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_Y
        },
        health: DEFAULT_HOSTILE_SLIME_HEALTH - DEFAULT_STARTER_MELEE_WEAPON_DAMAGE,
        grounded: false,
        facing: 'right',
        hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS
      },
      fixedDt: 1 / 60,
      playerPosition: { x: 8, y: 0 }
    });
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toHaveLength(1);
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions[0]?.position.x).toBeCloseTo(
      24 + DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_X * (1 / 60),
      6
    );
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions[0]?.position.y).toBeCloseTo(
      -DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_Y * (1 / 60),
      6
    );

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[6]).toEqual({
      itemId: 'sword',
      amount: 1
    });
  });

  it('shows selected starter-wand cooldown feedback, then selected mana refill feedback until mana is full again', async () => {
    const standalonePlayerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: createStarterWandTestWorldSnapshot(),
          standalonePlayerState,
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'wand', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 4,
        worldTileY: 0,
        worldX: playerFocusPoint.x + 48,
        worldY: playerFocusPoint.y,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(6).title).toContain('cast cooldown active');
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('COOL');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(6).style.height)).toBeCloseTo(
      ((DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS - 1 / 60) /
        DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS) *
        100,
      1
    );
    expect(getHotbarOverlaySlotCooldownFill(6).style.opacity).toBe('1');

    testRuntime.playerItemUseRequests = [];
    runFixedUpdate(DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS - 1 / 60);

    expect(getHotbarOverlaySlotButton(6).title).not.toContain('cast cooldown active');
    expect(getHotbarOverlaySlotButton(6).title).toContain(
      `mana: ${DEFAULT_PLAYER_MAX_MANA - DEFAULT_STARTER_WAND_MANA_COST}/${DEFAULT_PLAYER_MAX_MANA}`
    );
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('MANA');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(6).style.height)).toBeCloseTo(75, 1);
    expect(getHotbarOverlaySlotCooldownFill(6).style.opacity).toBe('1');

    runFixedUpdate(
      DEFAULT_PLAYER_MANA_REGEN_DELAY_SECONDS - DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS
    );
    runFixedUpdate(DEFAULT_PLAYER_MANA_REGEN_TICK_INTERVAL_SECONDS * 5);

    expect(getHotbarOverlaySlotButton(6).title).not.toContain('mana:');
    expect(getHotbarOverlaySlotAmountLabel(6).textContent).toBe('');
    expect(getHotbarOverlaySlotCooldownFill(6).style.height).toBe('0.0%');
    expect(getHotbarOverlaySlotCooldownFill(6).style.opacity).toBe('0');
  });

  it('casts the starter wand from mouse aim, despawns the firebolt on slime hit, and carries knockback into the next slime fixed step', async () => {
    const standalonePlayerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: createStarterWandTestWorldSnapshot(),
          standalonePlayerState,
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'wand', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      x: 56,
      y: 18,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate(1 / 60);
    }

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 4,
        worldTileY: 0,
        worldX: slimeSpawnPoint.x,
        worldY: playerFocusPoint.y,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);
    runRenderFrame(1000 / 60, 1);

    const initialFireboltPositions =
      testRuntime.latestRendererRenderFrameState?.fireboltCurrentPositions ?? [];
    expect(initialFireboltPositions).toHaveLength(1);
    expect(initialFireboltPositions[0]?.position.x).toBeCloseTo(
      playerFocusPoint.x + DEFAULT_STARTER_WAND_FIREBOLT_SPEED * (1 / 60),
      6
    );
    expect(initialFireboltPositions[0]?.position.y).toBeCloseTo(playerFocusPoint.y, 6);

    testRuntime.rendererStepHostileSlimeStateImpl = (state, fixedDt) => {
      const slimeState = state as {
        position?: { x?: number; y?: number };
        velocity?: { x?: number; y?: number };
        grounded?: boolean;
        facing?: 'left' | 'right';
        hopCooldownTicksRemaining?: number;
        launchKind?: 'standard-hop' | 'step-hop' | null;
      };
      const velocityX =
        typeof slimeState.velocity?.x === 'number' ? slimeState.velocity.x : 0;
      const velocityY =
        typeof slimeState.velocity?.y === 'number' ? slimeState.velocity.y : 0;
      return {
        position: {
          x: (slimeState.position?.x ?? 0) + velocityX * fixedDt,
          y: (slimeState.position?.y ?? 0) + velocityY * fixedDt
        },
        velocity: {
          x: velocityX,
          y: velocityY
        },
        grounded: slimeState.grounded ?? false,
        facing: slimeState.facing ?? 'right',
        hopCooldownTicksRemaining:
          slimeState.hopCooldownTicksRemaining ?? DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
        launchKind: slimeState.launchKind ?? null
      };
    };
    testRuntime.rendererStepHostileSlimeStateRequests = [];
    testRuntime.playerItemUseRequests = [];

    for (let step = 0; step < 10; step += 1) {
      runFixedUpdate(1 / 60);
    }
    runRenderFrame(1000 / 60, 1);

    expect(testRuntime.rendererStepHostileSlimeStateRequests).toContainEqual({
      state: {
        position: { x: 56, y: 18 },
        velocity: {
          x: DEFAULT_STARTER_WAND_FIREBOLT_KNOCKBACK_SPEED,
          y: 0
        },
        health: DEFAULT_HOSTILE_SLIME_HEALTH - DEFAULT_STARTER_WAND_FIREBOLT_DAMAGE,
        grounded: false,
        facing: 'right',
        hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS
      },
      fixedDt: 1 / 60,
      playerPosition: { x: 8, y: 28 }
    });
    expect(testRuntime.latestRendererRenderFrameState?.fireboltCurrentPositions).toEqual([]);
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toHaveLength(1);
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions?.[0]?.position.x).toBeGreaterThan(
      56
    );
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions?.[0]?.position.y).toBeCloseTo(
      18,
      6
    );

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[6]).toEqual({
      itemId: 'wand',
      amount: 1
    });
  });

  it('casts the starter wand from touch aim through the shared hidden-panel item-use path', async () => {
    const standalonePlayerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: createStarterWandTestWorldSnapshot(),
          standalonePlayerState,
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'wand', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: -2,
        worldTileY: -2,
        worldX: playerFocusPoint.x - 30,
        worldY: playerFocusPoint.y - 40,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(1 / 60);
    runRenderFrame(1000 / 60, 1);

    const touchFireboltPositions =
      testRuntime.latestRendererRenderFrameState?.fireboltCurrentPositions ?? [];
    expect(touchFireboltPositions).toHaveLength(1);
    expect(touchFireboltPositions[0]?.position.x).toBeCloseTo(
      playerFocusPoint.x - DEFAULT_STARTER_WAND_FIREBOLT_SPEED * 0.6 * (1 / 60),
      6
    );
    expect(touchFireboltPositions[0]?.position.y).toBeCloseTo(
      playerFocusPoint.y - DEFAULT_STARTER_WAND_FIREBOLT_SPEED * 0.8 * (1 / 60),
      6
    );
  });

  it('throws a bomb through the shared hidden-panel mouse item-use path, consumes one bomb, and blocks same-tick empty follow-up throws', async () => {
    const standalonePlayerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState,
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'bomb', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 6,
        worldTileY: 1,
        worldX: playerFocusPoint.x + 60,
        worldY: playerFocusPoint.y,
        pointerType: 'mouse'
      },
      {
        worldTileX: 6,
        worldTileY: 1,
        worldX: playerFocusPoint.x + 60,
        worldY: playerFocusPoint.y,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);
    runRenderFrame(1000 / 60, 1);

    const bombPositions = testRuntime.latestRendererRenderFrameState?.bombCurrentPositions ?? [];
    expect(bombPositions).toHaveLength(1);
    expect(bombPositions[0]?.position.x).toBeCloseTo(
      playerFocusPoint.x + DEFAULT_THROWN_BOMB_SPEED * (1 / 60),
      6
    );
    expect(bombPositions[0]?.position.y).toBeCloseTo(
      playerFocusPoint.y + DEFAULT_THROWN_BOMB_GRAVITY * (1 / 60) * (1 / 60),
      6
    );

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[6]).toBeNull();
  });

  it('throws a bomb from touch aim through the shared hidden-panel item-use path', async () => {
    const standalonePlayerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState,
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'bomb', amount: 2 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: -2,
        worldTileY: -2,
        worldX: playerFocusPoint.x - 30,
        worldY: playerFocusPoint.y - 40,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(1 / 60);
    runRenderFrame(1000 / 60, 1);

    const touchBombPositions = testRuntime.latestRendererRenderFrameState?.bombCurrentPositions ?? [];
    expect(touchBombPositions).toHaveLength(1);
    expect(touchBombPositions[0]?.position.x).toBeCloseTo(
      playerFocusPoint.x - DEFAULT_THROWN_BOMB_SPEED * 0.6 * (1 / 60),
      6
    );
    expect(touchBombPositions[0]?.position.y).toBeCloseTo(
      playerFocusPoint.y +
        (-DEFAULT_THROWN_BOMB_SPEED * 0.8 + DEFAULT_THROWN_BOMB_GRAVITY * (1 / 60)) *
          (1 / 60),
      6
    );

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[6]).toEqual({
      itemId: 'bomb',
      amount: 1
    });
  });

  it('blocks dead bomb throws through the shared hidden-panel item-use path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            health: 0
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'bomb', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 6,
        worldTileY: 1,
        worldX: 68,
        worldY: 12,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);
    runRenderFrame(1000 / 60, 1);

    expect(testRuntime.latestRendererRenderFrameState?.bombCurrentPositions).toEqual([]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[6]).toEqual({
      itemId: 'bomb',
      amount: 1
    });
  });

  it('shows a starter-spear preview line at fixed reach and flags clamped aim when the hovered world point is farther away', async () => {
    const standalonePlayerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState,
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              null,
              null,
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 9
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: 4, y: -3 },
      world: { x: 80, y: -40 }
    };

    runRenderFrame();

    expect(testRuntime.latestPlayerItemSpearPreviewState).toEqual({
      startWorldX: playerFocusPoint.x,
      startWorldY: playerFocusPoint.y,
      endWorldX: playerFocusPoint.x + DEFAULT_STARTER_SPEAR_REACH * 0.8,
      endWorldY: playerFocusPoint.y - DEFAULT_STARTER_SPEAR_REACH * 0.6,
      activeThrust: false,
      clampedByReach: true
    });
  });

  it('keeps the starter-spear preview aligned to the active thrust after the use request starts', async () => {
    const standalonePlayerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState,
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              null,
              null,
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 9
          })
        })
      )
    );

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      x: 32,
      y: 2,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 4,
        worldTileY: -3,
        worldX: 80,
        worldY: -40,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_SPEAR_THRUST_WINDUP_SECONDS);

    testRuntime.pointerInspect = {
      pointerType: 'mouse',
      tile: { x: -2, y: 1 },
      world: { x: -40, y: 14 }
    };
    runRenderFrame();

    expect(testRuntime.latestPlayerItemSpearPreviewState).toEqual({
      startWorldX: playerFocusPoint.x,
      startWorldY: playerFocusPoint.y,
      endWorldX: playerFocusPoint.x + DEFAULT_STARTER_SPEAR_REACH * 0.8,
      endWorldY: playerFocusPoint.y - DEFAULT_STARTER_SPEAR_REACH * 0.6,
      activeThrust: true,
      clampedByReach: false
    });
  });

  it('shows selected starter-spear hotbar timing feedback through windup, active, recovery, and clear', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              null,
              null,
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 9
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -1,
        worldX: 32,
        worldY: -4,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(9).title).toContain('windup active');
    expect(getHotbarOverlaySlotAmountLabel(9).textContent).toBe('WIND');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(9).style.height)).toBeCloseTo(
      ((STARTER_SPEAR_THRUST_WINDUP_SECONDS - 1 / 60) / STARTER_SPEAR_THRUST_WINDUP_SECONDS) * 100,
      1
    );
    expect(getHotbarOverlaySlotCooldownFill(9).style.opacity).toBe('1');

    testRuntime.playerItemUseRequests = [];
    runFixedUpdate(STARTER_SPEAR_THRUST_WINDUP_SECONDS - 1 / 60);

    expect(getHotbarOverlaySlotButton(9).title).toContain('thrust active');
    expect(getHotbarOverlaySlotAmountLabel(9).textContent).toBe('ACT');
    expect(getHotbarOverlaySlotCooldownFill(9).style.height).toBe('100.0%');

    runFixedUpdate(STARTER_SPEAR_THRUST_ACTIVE_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(9).title).toContain('thrust active');
    expect(getHotbarOverlaySlotAmountLabel(9).textContent).toBe('ACT');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(9).style.height)).toBeCloseTo(50, 1);

    runFixedUpdate(STARTER_SPEAR_THRUST_ACTIVE_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(9).title).toContain('recovery active');
    expect(getHotbarOverlaySlotAmountLabel(9).textContent).toBe('REC');
    expect(getHotbarOverlaySlotCooldownFill(9).style.height).toBe('100.0%');

    runFixedUpdate(STARTER_SPEAR_THRUST_RECOVERY_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(9).title).toContain('recovery active');
    expect(getHotbarOverlaySlotAmountLabel(9).textContent).toBe('REC');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(9).style.height)).toBeCloseTo(50, 1);

    runFixedUpdate(STARTER_SPEAR_THRUST_RECOVERY_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(9).title).not.toContain('active');
    expect(getHotbarOverlaySlotAmountLabel(9).textContent).toBe('');
    expect(getHotbarOverlaySlotCooldownFill(9).style.height).toBe('0.0%');
    expect(getHotbarOverlaySlotCooldownFill(9).style.opacity).toBe('0');
  });

  it('uses the starter spear through the shared hidden-panel item-use path and carries aimed knockback into the next slime fixed step', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 28 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              null,
              null,
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 9
          })
        })
      )
    );

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      x: 32,
      y: 2,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -1,
        worldX: 32,
        worldY: -4,
        pointerType: 'mouse'
      }
    ];
    runFixedUpdate(STARTER_SPEAR_THRUST_WINDUP_SECONDS);

    testRuntime.rendererStepHostileSlimeStateImpl = (state, fixedDt) => {
      const slimeState = state as {
        position?: { x?: number; y?: number };
        velocity?: { x?: number; y?: number };
        grounded?: boolean;
        facing?: 'left' | 'right';
        hopCooldownTicksRemaining?: number;
        launchKind?: 'standard-hop' | 'step-hop' | null;
      };
      const velocityX =
        typeof slimeState.velocity?.x === 'number' ? slimeState.velocity.x : 0;
      const velocityY =
        typeof slimeState.velocity?.y === 'number' ? slimeState.velocity.y : 0;
      return {
        position: {
          x: (slimeState.position?.x ?? 0) + velocityX * fixedDt,
          y: (slimeState.position?.y ?? 0) + velocityY * fixedDt
        },
        velocity: {
          x: velocityX,
          y: velocityY
        },
        grounded: slimeState.grounded ?? false,
        facing: slimeState.facing ?? 'right',
        hopCooldownTicksRemaining:
          slimeState.hopCooldownTicksRemaining ?? DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
        launchKind: slimeState.launchKind ?? null
      };
    };
    testRuntime.rendererStepHostileSlimeStateRequests = [];

    runFixedUpdate(1 / 60);
    runRenderFrame();

    expect(testRuntime.rendererStepHostileSlimeStateRequests).toContainEqual({
      state: {
        position: { x: 32, y: 2 },
        velocity: {
          x: DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED * 0.8,
          y: -DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED * 0.6
        },
        health: DEFAULT_HOSTILE_SLIME_HEALTH - DEFAULT_STARTER_SPEAR_DAMAGE,
        grounded: false,
        facing: 'right',
        hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS
      },
      fixedDt: 1 / 60,
      playerPosition: { x: 8, y: 28 }
    });
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toHaveLength(1);
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions[0]?.position.x).toBeCloseTo(
      32 + DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED * 0.8 * (1 / 60),
      6
    );
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions[0]?.position.y).toBeCloseTo(
      2 - DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED * 0.6 * (1 / 60),
      6
    );

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[9]).toEqual({
      itemId: 'spear',
      amount: 1
    });
  });

  it('uses the bug net through the shared hidden-panel item-use path, despawns the hit bunny, and persists the captured bunny stack', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'bunny', amount: 2 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bug-net', amount: 1 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 8
          })
        })
      )
    );

    const bunnySpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 1,
      x: 24,
      y: 0,
      width: DEFAULT_PASSIVE_BUNNY_WIDTH,
      height: DEFAULT_PASSIVE_BUNNY_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_PASSIVE_BUNNY_WIDTH &&
        search?.height === DEFAULT_PASSIVE_BUNNY_HEIGHT
      ) {
        return bunnySpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let step = 0; step < DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    runRenderFrame(1000 / 60, 0.5);
    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toHaveLength(1);
    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions?.[0]).toMatchObject({
      position: { x: 24, y: 0 }
    });

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -1,
        worldX: 32,
        worldY: -4,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_BUG_NET_SWING_WINDUP_SECONDS);
    runRenderFrame();

    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toEqual([]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[3]).toEqual({
      itemId: 'bunny',
      amount: 3
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[8]).toEqual({
      itemId: 'bug-net',
      amount: 1
    });
  });

  it('uses captured bunny stacks through the shared hidden-panel item-use path, spawns a released bunny, and consumes one stack on success', async () => {
    const world = new TileWorld(0);
    for (let tileX = 1; tileX <= 3; tileX += 1) {
      world.setTile(tileX, 0, 1);
      world.setTile(tileX, -1, 0);
      world.setTile(tileX, -2, 0);
    }

    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: world.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'bunny', amount: 2 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bug-net', amount: 1 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 3
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -1,
        worldX: 40,
        worldY: -4,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toHaveLength(1);
    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions?.[0]?.position).toEqual({
      x: 40,
      y: 0
    });

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[3]).toEqual({
      itemId: 'bunny',
      amount: 1
    });
  });

  it('falls back away from a crowded bunny landing tile through the shared hidden-panel item-use path', async () => {
    const world = new TileWorld(0);
    for (let tileX = 1; tileX <= 3; tileX += 1) {
      world.setTile(tileX, 0, 1);
      world.setTile(tileX, -1, 0);
      world.setTile(tileX, -2, 0);
    }

    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: world.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'bunny', amount: 2 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              { itemId: 'umbrella', amount: 1 },
              { itemId: 'bug-net', amount: 1 },
              { itemId: 'spear', amount: 1 }
            ],
            selectedHotbarSlotIndex: 3
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -1,
        worldX: 40,
        worldY: -4,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();
    runRenderFrame();

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -1,
        worldX: 40,
        worldY: -4,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();
    runRenderFrame();

    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toHaveLength(2);
    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions?.map((bunny) => bunny.position))
      .toEqual([
        { x: 40, y: 0 },
        { x: 24, y: 0 }
      ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[3]).toBeNull();
  });

  it('despawns a hostile slime immediately after the starter sword lands the defeating hit and leaves one gel pickup', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          })
        })
      )
    );

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      x: 24,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    const swordUseRequest = {
      worldTileX: 1,
      worldTileY: 0,
      worldX: 24,
      worldY: 0,
      pointerType: 'mouse' as const
    };

    testRuntime.playerItemUseRequests = [swordUseRequest];
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS);
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS);
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS);

    testRuntime.playerItemUseRequests = [swordUseRequest];
    testRuntime.rendererStepHostileSlimeStateRequests = [];
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS);
    runRenderFrame();

    expect(testRuntime.rendererStepHostileSlimeStateRequests).toEqual([
      {
        state: {
          position: { x: 24, y: 0 },
          velocity: {
            x: DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_X,
            y: -DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_Y
          },
          health: DEFAULT_HOSTILE_SLIME_HEALTH - DEFAULT_STARTER_MELEE_WEAPON_DAMAGE,
          grounded: false,
          facing: 'right',
          hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS
        },
        fixedDt: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS,
        playerPosition: { x: 8, y: 0 }
      }
    ]);
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toEqual([]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: -6 },
        itemId: 'gel',
        amount: 1
      }
    ]);
  });

  it('merges a hostile-slime gel drop into a nearby matching pickup instead of spawning a second entity', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              { itemId: 'sword', amount: 1 },
              null,
              null,
              null
            ],
            selectedHotbarSlotIndex: 6
          }),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 25, y: -6 },
              itemId: 'gel',
              amount: 998
            })
          ]
        })
      )
    );

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      x: 25,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      return testRuntime.playerSpawnPoint;
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    const swordUseRequest = {
      worldTileX: 1,
      worldTileY: 0,
      worldX: 25,
      worldY: 0,
      pointerType: 'mouse' as const
    };

    testRuntime.playerItemUseRequests = [swordUseRequest];
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS);
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS);
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS);

    testRuntime.playerItemUseRequests = [swordUseRequest];
    runFixedUpdate(STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 25, y: -6 },
        itemId: 'gel',
        amount: 999
      }
    ]);
  });

  it('spawns a dirt-block pickup entity when the starter pickaxe breaks nearby grass terrain', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 2);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[0]).toEqual({
      itemId: 'pickaxe',
      amount: 1
    });
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: 8 },
        itemId: 'dirt-block',
        amount: 1
      }
    ]);
  });

  it('spawns a wood-block pickup entity when the starter pickaxe breaks nearby placed wood terrain', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), PLACEABLE_WOOD_BLOCK_TILE_ID);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: 8 },
        itemId: 'wood-block',
        amount: 1
      }
    ]);
  });

  it('shows selected starter-pickaxe hotbar timing feedback through windup, active, recovery, and clear', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(0).title).toContain('windup active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('WIND');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(0).style.height)).toBeCloseTo(
      ((STARTER_PICKAXE_SWING_WINDUP_SECONDS - 1 / 60) /
        STARTER_PICKAXE_SWING_WINDUP_SECONDS) *
        100,
      1
    );
    expect(getHotbarOverlaySlotCooldownFill(0).style.opacity).toBe('1');

    testRuntime.playerItemUseRequests = [];
    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS - 1 / 60);

    expect(getHotbarOverlaySlotButton(0).title).toContain('swing active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('ACT');
    expect(getHotbarOverlaySlotCooldownFill(0).style.height).toBe('100.0%');
    expect(testRuntime.rendererSetTileCalls).toEqual([]);

    runFixedUpdate(STARTER_PICKAXE_SWING_ACTIVE_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(0).title).toContain('swing active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('ACT');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(0).style.height)).toBeCloseTo(
      50,
      1
    );

    runFixedUpdate(STARTER_PICKAXE_SWING_ACTIVE_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(0).title).toContain('recovery active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('REC');
    expect(getHotbarOverlaySlotCooldownFill(0).style.height).toBe('100.0%');

    runFixedUpdate(STARTER_PICKAXE_SWING_RECOVERY_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(0).title).toContain('recovery active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('REC');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(0).style.height)).toBeCloseTo(
      50,
      1
    );

    runFixedUpdate(STARTER_PICKAXE_SWING_RECOVERY_SECONDS * 0.5);

    expect(getHotbarOverlaySlotButton(0).title).not.toContain('active');
    expect(getHotbarOverlaySlotAmountLabel(0).textContent).toBe('');
    expect(getHotbarOverlaySlotCooldownFill(0).style.height).toBe('0.0%');
    expect(getHotbarOverlaySlotCooldownFill(0).style.opacity).toBe('0');
    expect(testRuntime.rendererSetTileCalls).toEqual([]);
  });

  it('spawns a stone-block pickup entity when the starter pickaxe finishes breaking nearby stone terrain on the second swing', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const miningRequest = {
      worldTileX: 1,
      worldTileY: 0,
      worldX: 24,
      worldY: 8,
      pointerType: 'mouse' as const
    };
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [miningRequest];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([]);

    runFixedUpdate(STARTER_PICKAXE_SWING_ACTIVE_SECONDS + STARTER_PICKAXE_SWING_RECOVERY_SECONDS);

    testRuntime.playerItemUseRequests = [miningRequest];
    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[0]).toEqual({
      itemId: 'pickaxe',
      amount: 1
    });
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: 8 },
        itemId: 'stone-block',
        amount: 1
      }
    ]);
  });

  it('spawns a copper-ore pickup entity when the starter pickaxe finishes breaking nearby copper ore on the second swing', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const miningRequest = {
      worldTileX: 1,
      worldTileY: 0,
      worldX: 24,
      worldY: 8,
      pointerType: 'mouse' as const
    };
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), PROCEDURAL_COPPER_ORE_TILE_ID);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [miningRequest];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([]);

    runFixedUpdate(STARTER_PICKAXE_SWING_ACTIVE_SECONDS + STARTER_PICKAXE_SWING_RECOVERY_SECONDS);

    testRuntime.playerItemUseRequests = [miningRequest];
    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: 8 },
        itemId: 'copper-ore',
        amount: 1
      }
    ]);
  });

  it('clears a nearby dirt wall on an empty foreground cell and refunds one dirt-wall pickup', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(1, -1), STARTER_DIRT_WALL_ID);
    testRuntime.rendererSetWallResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([]);
    expect(testRuntime.rendererSetWallCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        wallId: 0
      }
    ]);
    expect(testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(1, -1))).toBeUndefined();

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: -8 },
        itemId: 'dirt-wall',
        amount: 1
      }
    ]);
  });

  it('clears a nearby wood wall on an empty foreground cell and refunds one wood-wall pickup', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(1, -1), STARTER_WOOD_WALL_ID);
    testRuntime.rendererSetWallResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([]);
    expect(testRuntime.rendererSetWallCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: -1,
        wallId: 0
      }
    ]);
    expect(testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(1, -1))).toBeUndefined();

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: -8 },
        itemId: 'wood-wall',
        amount: 1
      }
    ]);
  });

  it('spawns one rope pickup entity when the starter pickaxe cuts a nearby placed rope tile', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), STARTER_ROPE_TILE_ID);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: 8 },
        itemId: 'rope',
        amount: 1
      }
    ]);
  });

  it('spawns one platform pickup entity when the starter pickaxe cuts a nearby placed platform tile', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), STARTER_PLATFORM_TILE_ID);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: 8 },
        itemId: 'platform',
        amount: 1
      }
    ]);
  });

  it('spawns one torch pickup entity when the starter pickaxe cuts a nearby placed torch tile', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), STARTER_TORCH_TILE_ID);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: 8 },
        itemId: 'torch',
        amount: 1
      }
    ]);
  });

  it('spawns one workbench pickup entity when the starter pickaxe cuts a nearby placed workbench tile', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), STARTER_WORKBENCH_TILE_ID);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: 0,
        worldX: 24,
        worldY: 8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      }
    ]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: 8 },
        itemId: 'workbench',
        amount: 1
      }
    ]);
  });

  it('cascades a mined dirt-block refund across overlapping matching world pickups before spawning a new entity', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createLegacyStarterInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 40, y: 8 },
              itemId: 'dirt-block',
              amount: 999
            }),
            createDroppedItemState({
              position: { x: 44, y: 8 },
              itemId: 'dirt-block',
              amount: 998
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, 0), 9);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: 0,
        worldX: 40,
        worldY: 8,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 40, y: 8 },
        itemId: 'dirt-block',
        amount: 999
      },
      {
        position: { x: 44, y: 8 },
        itemId: 'dirt-block',
        amount: 999
      }
    ]);
  });

  it('cascades a mined wood-block refund across overlapping matching world pickups before spawning a new entity', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createLegacyStarterInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 40, y: 8 },
              itemId: 'wood-block',
              amount: 999
            }),
            createDroppedItemState({
              position: { x: 44, y: 8 },
              itemId: 'wood-block',
              amount: 998
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, 0), PLACEABLE_WOOD_BLOCK_TILE_ID);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: 0,
        worldX: 40,
        worldY: 8,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 40, y: 8 },
        itemId: 'wood-block',
        amount: 999
      },
      {
        position: { x: 44, y: 8 },
        itemId: 'wood-block',
        amount: 999
      }
    ]);
  });

  it('cascades a removed dirt-wall refund across overlapping matching world pickups before spawning a new entity', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createLegacyStarterInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 40, y: -24 },
              itemId: 'dirt-wall',
              amount: 999
            }),
            createDroppedItemState({
              position: { x: 44, y: -24 },
              itemId: 'dirt-wall',
              amount: 998
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(2, -2), STARTER_DIRT_WALL_ID);
    testRuntime.rendererSetWallResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -2,
        worldX: 40,
        worldY: -24,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 40, y: -24 },
        itemId: 'dirt-wall',
        amount: 999
      },
      {
        position: { x: 44, y: -24 },
        itemId: 'dirt-wall',
        amount: 999
      }
    ]);
  });

  it('cascades a removed wood-wall refund across overlapping matching world pickups before spawning a new entity', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createLegacyStarterInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 40, y: -24 },
              itemId: 'wood-wall',
              amount: 999
            }),
            createDroppedItemState({
              position: { x: 44, y: -24 },
              itemId: 'wood-wall',
              amount: 998
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.rendererWallIdsByWorldKey.set(worldTileKey(2, -2), STARTER_WOOD_WALL_ID);
    testRuntime.rendererSetWallResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 2,
        worldTileY: -2,
        worldX: 40,
        worldY: -24,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 40, y: -24 },
        itemId: 'wood-wall',
        amount: 999
      },
      {
        position: { x: 44, y: -24 },
        itemId: 'wood-wall',
        amount: 999
      }
    ]);
  });

  it('cascades a mined stone-block refund across overlapping matching world pickups before spawning a new entity', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createLegacyStarterInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 40, y: 8 },
              itemId: 'stone-block',
              amount: 999
            }),
            createDroppedItemState({
              position: { x: 44, y: 8 },
              itemId: 'stone-block',
              amount: 998
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const miningRequest = {
      worldTileX: 2,
      worldTileY: 0,
      worldX: 40,
      worldY: 8,
      pointerType: 'touch' as const
    };
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(2, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [miningRequest];

    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);
    runFixedUpdate(STARTER_PICKAXE_SWING_ACTIVE_SECONDS + STARTER_PICKAXE_SWING_RECOVERY_SECONDS);

    testRuntime.playerItemUseRequests = [miningRequest];
    runFixedUpdate(STARTER_PICKAXE_SWING_WINDUP_SECONDS);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 40, y: 8 },
        itemId: 'stone-block',
        amount: 999
      },
      {
        position: { x: 44, y: 8 },
        itemId: 'stone-block',
        amount: 999
      }
    ]);
  });

  it('does not spawn a torch pickup entity when a debug-break stroke removes a placed starter torch tile', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const torchWorldTileX = 20;
    const torchWorldTileY = -20;
    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: torchWorldTileX,
        worldTileY: torchWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(torchWorldTileX, torchWorldTileY),
      10
    );
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[2]).toEqual({
      itemId: 'torch',
      amount: 20
    });
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([]);
  });

  it('does not spawn a rope pickup entity when a debug-break stroke removes a placed rope tile', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const ropeWorldTileX = 20;
    const ropeWorldTileY = -20;
    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: ropeWorldTileX,
        worldTileY: ropeWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(ropeWorldTileX, ropeWorldTileY),
      STARTER_ROPE_TILE_ID
    );
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[3]).toEqual({
      itemId: 'rope',
      amount: 24
    });
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([]);
  });

  it('routes debug break wall-only dirt walls through wall edits without spawning a dirt-wall pickup', async () => {
    const wallWorldTileX = 20;
    const wallWorldTileY = -20;
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setWall(wallWorldTileX, wallWorldTileY, STARTER_DIRT_WALL_ID)).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right',
            grounded: true
          }),
          standalonePlayerInventoryState: createLegacyStarterInventoryState()
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererSetWallResult = true;

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([]);
    expect(testRuntime.rendererSetWallCalls).toEqual([
      {
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        wallId: 0,
        editOrigin: 'debug-break'
      }
    ]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getWall(wallWorldTileX, wallWorldTileY)).toBe(0);
    expect(persistedEnvelope?.session.droppedItemStates).toEqual([]);
  });

  it('records wall-only debug break edits in shared history so undo and redo restore the wall layer', async () => {
    const wallWorldTileX = 20;
    const wallWorldTileY = -20;
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setWall(wallWorldTileX, wallWorldTileY, STARTER_DIRT_WALL_ID)).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right',
            grounded: true
          }),
          standalonePlayerInventoryState: createLegacyStarterInventoryState()
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.completedDebugTileStrokes = [{ strokeId: 1 }];
    testRuntime.rendererSetWallResult = true;
    testRuntime.rendererPersistentSetWallResult = true;

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([]);
    expect(testRuntime.rendererSetWallCalls).toEqual([
      {
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        wallId: 0,
        editOrigin: 'debug-break'
      }
    ]);
    expect(testRuntime.debugEditControlsLatestHistoryState).toEqual({
      undoStrokeCount: 1,
      redoStrokeCount: 0
    });
    expect(testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(wallWorldTileX, wallWorldTileY))).toBeUndefined();

    testRuntime.debugEditControlsInstance?.triggerUndo();

    expect(testRuntime.rendererSetWallCalls).toEqual([
      {
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        wallId: 0,
        editOrigin: 'debug-break'
      },
      {
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        wallId: STARTER_DIRT_WALL_ID,
        editOrigin: 'debug-history'
      }
    ]);
    expect(testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(wallWorldTileX, wallWorldTileY))).toBe(
      STARTER_DIRT_WALL_ID
    );
    expect(testRuntime.debugEditControlsLatestHistoryState).toEqual({
      undoStrokeCount: 0,
      redoStrokeCount: 1
    });

    testRuntime.debugEditControlsInstance?.triggerRedo();

    expect(testRuntime.rendererSetWallCalls).toEqual([
      {
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        wallId: 0,
        editOrigin: 'debug-break'
      },
      {
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        wallId: STARTER_DIRT_WALL_ID,
        editOrigin: 'debug-history'
      },
      {
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        wallId: 0,
        editOrigin: 'debug-history'
      }
    ]);
    expect(testRuntime.rendererWallIdsByWorldKey.get(worldTileKey(wallWorldTileX, wallWorldTileY))).toBeUndefined();
    expect(testRuntime.debugEditControlsLatestHistoryState).toEqual({
      undoStrokeCount: 1,
      redoStrokeCount: 0
    });

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([]);
  });

  it('keeps foreground-tile precedence before the debug break wall-only fallback', async () => {
    const wallWorldTileX = 20;
    const wallWorldTileY = -20;
    const savedWorld = new TileWorld(0);
    expect(savedWorld.setTile(wallWorldTileX, wallWorldTileY, 1)).toBe(true);
    expect(savedWorld.setWall(wallWorldTileX, wallWorldTileY, STARTER_DIRT_WALL_ID)).toBe(true);
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: savedWorld.createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right',
            grounded: true
          }),
          standalonePlayerInventoryState: createLegacyStarterInventoryState()
        })
      )
    );
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([
      {
        worldTileX: wallWorldTileX,
        worldTileY: wallWorldTileY,
        tileId: 0,
        editOrigin: 'debug-break'
      }
    ]);
    expect(testRuntime.rendererSetWallCalls).toEqual([]);

    dispatchWindowEvent('pagehide');
    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(persistedEnvelope!.worldSnapshot);
    expect(restoredWorld.getTile(wallWorldTileX, wallWorldTileY)).toBe(0);
    expect(restoredWorld.getWall(wallWorldTileX, wallWorldTileY)).toBe(STARTER_DIRT_WALL_ID);
  });

  it('does not spawn a torch pickup entity when a debug-break support removal clears a neighboring starter torch', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const supportWorldTileX = 20;
    const supportWorldTileY = -20;
    const torchWorldTileX = 21;
    const torchWorldTileY = -20;
    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: supportWorldTileX,
        worldTileY: supportWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(supportWorldTileX, supportWorldTileY),
      1
    );
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(torchWorldTileX, torchWorldTileY),
      10
    );
    testRuntime.rendererNextSetTileEditEvents = [
      createTileEditEvent(supportWorldTileX, supportWorldTileY, 1, 0, 0, 0, 'debug-break'),
      createTileEditEvent(torchWorldTileX, torchWorldTileY, 10, 0, 0, 0, 'debug-break')
    ];
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([]);
  });

  it('does not spawn a workbench pickup entity when a debug-break support removal clears a placed workbench tile', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const supportWorldTileX = 20;
    const supportWorldTileY = -20;
    const workbenchWorldTileX = 20;
    const workbenchWorldTileY = -21;
    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: supportWorldTileX,
        worldTileY: supportWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(supportWorldTileX, supportWorldTileY),
      1
    );
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(workbenchWorldTileX, workbenchWorldTileY),
      STARTER_WORKBENCH_TILE_ID
    );
    testRuntime.rendererNextSetTileEditEvents = [
      createTileEditEvent(supportWorldTileX, supportWorldTileY, 1, 0, 0, 0, 'debug-break'),
      createTileEditEvent(
        workbenchWorldTileX,
        workbenchWorldTileY,
        STARTER_WORKBENCH_TILE_ID,
        0,
        0,
        0,
        'debug-break'
      )
    ];
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([]);
  });

  it('does not spawn an anvil pickup entity when a debug-break support removal clears a placed anvil tile', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    const supportWorldTileX = 20;
    const supportWorldTileY = -20;
    const anvilWorldTileX = 20;
    const anvilWorldTileY = -21;
    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: supportWorldTileX,
        worldTileY: supportWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(supportWorldTileX, supportWorldTileY),
      1
    );
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(anvilWorldTileX, anvilWorldTileY),
      STARTER_ANVIL_TILE_ID
    );
    testRuntime.rendererNextSetTileEditEvents = [
      createTileEditEvent(supportWorldTileX, supportWorldTileY, 1, 0, 0, 0, 'debug-break'),
      createTileEditEvent(anvilWorldTileX, anvilWorldTileY, STARTER_ANVIL_TILE_ID, 0, 0, 0, 'debug-break')
    ];
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([]);
  });

  it('leaves overlapping torch world pickups unchanged when a debug-break stroke removes a placed torch', async () => {
    const torchWorldTileX = 20;
    const torchWorldTileY = -20;
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 328, y: -312 },
              itemId: 'torch',
              amount: 999
            }),
            createDroppedItemState({
              position: { x: 332, y: -312 },
              itemId: 'torch',
              amount: 998
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: torchWorldTileX,
        worldTileY: torchWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(torchWorldTileX, torchWorldTileY), 10);
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 328, y: -312 },
        itemId: 'torch',
        amount: 999
      },
      {
        position: { x: 332, y: -312 },
        itemId: 'torch',
        amount: 998
      }
    ]);
  });

  it('leaves overlapping rope world pickups unchanged when a debug-break stroke removes a placed rope', async () => {
    const ropeWorldTileX = 20;
    const ropeWorldTileY = -20;
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 328, y: -312 },
              itemId: 'rope',
              amount: 999
            }),
            createDroppedItemState({
              position: { x: 332, y: -312 },
              itemId: 'rope',
              amount: 998
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: ropeWorldTileX,
        worldTileY: ropeWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(ropeWorldTileX, ropeWorldTileY),
      STARTER_ROPE_TILE_ID
    );
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 328, y: -312 },
        itemId: 'rope',
        amount: 999
      },
      {
        position: { x: 332, y: -312 },
        itemId: 'rope',
        amount: 998
      }
    ]);
  });

  it('leaves overlapping workbench world pickups unchanged when a debug-break stroke removes a placed workbench', async () => {
    const workbenchWorldTileX = 20;
    const workbenchWorldTileY = -20;
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 328, y: -312 },
              itemId: 'workbench',
              amount: 99
            }),
            createDroppedItemState({
              position: { x: 332, y: -312 },
              itemId: 'workbench',
              amount: 98
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: workbenchWorldTileX,
        worldTileY: workbenchWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(
      worldTileKey(workbenchWorldTileX, workbenchWorldTileY),
      STARTER_WORKBENCH_TILE_ID
    );
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 328, y: -312 },
        itemId: 'workbench',
        amount: 99
      },
      {
        position: { x: 332, y: -312 },
        itemId: 'workbench',
        amount: 98
      }
    ]);
  });

  it('does not spawn a new torch pickup entity when a debug-break stroke removes a placed torch and overlapping pickups are already full', async () => {
    const torchWorldTileX = 20;
    const torchWorldTileY = -20;
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState(),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 328, y: -312 },
              itemId: 'torch',
              amount: 999
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.debugTileEdits = [
      {
        strokeId: 1,
        worldTileX: torchWorldTileX,
        worldTileY: torchWorldTileY,
        kind: 'break'
      }
    ];
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(torchWorldTileX, torchWorldTileY), 10);
    testRuntime.rendererSetTileResult = true;

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 328, y: -312 },
        itemId: 'torch',
        amount: 999
      }
    ]);
  });

  it('drops the selected hotbar stack into a world pickup and persists the collected stack after proximity pickup', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(dispatchKeydown('Backspace', 'Backspace').prevented).toBe(true);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[1]).toBeNull();
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 64
      }
    ]);

    testRuntime.rendererStepPlayerStateImpl = () => ({
      position: { x: 28, y: 0 }
    });

    runFixedUpdate();

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-block',
      amount: 64
    });
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([]);
  });

  it('drops one item from the selected hotbar stack while keeping the remaining stack in inventory', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    expect(dispatchKeydown('Backspace', 'Backspace', { shiftKey: true }).prevented).toBe(true);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-block',
      amount: 63
    });
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 1
      }
    ]);
  });

  it('merges a dropped single hotbar item into a nearby matching world pickup instead of spawning a second entity', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'dirt-block', amount: 2 },
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null
            ]
          }),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 28, y: -14 },
              itemId: 'dirt-block',
              amount: 998
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('Backspace', 'Backspace', { shiftKey: true }).prevented).toBe(true);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[0]).toEqual({
      itemId: 'dirt-block',
      amount: 1
    });
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 999
      }
    ]);
  });

  it('spawns a new world pickup for a dropped single hotbar item when overlapping matching pickups are already full', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'dirt-block', amount: 2 },
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null
            ]
          }),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 28, y: -14 },
              itemId: 'dirt-block',
              amount: 999
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('Backspace', 'Backspace', { shiftKey: true }).prevented).toBe(true);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[0]).toEqual({
      itemId: 'dirt-block',
      amount: 1
    });
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 999
      },
      {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 1
      }
    ]);
  });

  it('merges a dropped hotbar stack into a nearby matching world pickup instead of spawning a second entity', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'dirt-block', amount: 8 },
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null
            ]
          }),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 28, y: -14 },
              itemId: 'dirt-block',
              amount: 7
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('Backspace', 'Backspace').prevented).toBe(true);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[0]).toBeNull();
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 15
      }
    ]);
  });

  it('cascades a dropped hotbar stack across multiple nearby matching world pickups in nearest-first order', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            facing: 'right'
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'dirt-block', amount: 4 },
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null
            ]
          }),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 28, y: -14 },
              itemId: 'dirt-block',
              amount: 998
            }),
            createDroppedItemState({
              position: { x: 32, y: -14 },
              itemId: 'dirt-block',
              amount: 995
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('Backspace', 'Backspace').prevented).toBe(true);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[0]).toBeNull();
    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 28, y: -14 },
        itemId: 'dirt-block',
        amount: 999
      },
      {
        position: { x: 32, y: -14 },
        itemId: 'dirt-block',
        amount: 998
      }
    ]);
  });

  it('rejects starter dirt block placement when the new block would overlap the player', async () => {
    setPersistedWorldSaveWithInventory();
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('2', 'Digit2').prevented).toBe(true);
    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(0, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: -1,
        worldX: 8,
        worldY: -8,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([]);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-block',
      amount: 64
    });
  });

  it('uses healing potions through the shared hidden-panel item-use path, clamps repeat use behind cooldown, and persists the healed health', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            health: 25
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              ...Array.from({ length: 5 }, () => null)
            ],
            selectedHotbarSlotIndex: 4
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'mouse'
      },
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'touch'
      }
    ];
    runFixedUpdate(1 / 60);
    expect(getHotbarOverlaySlotCooldownFill(4).style.opacity).toBe('1');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(4).style.height)).toBeCloseTo(99.2, 1);

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'touch'
      }
    ];
    runFixedUpdate(1);
    expect(getHotbarOverlaySlotCooldownFill(4).style.opacity).toBe('1');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(4).style.height)).toBeCloseTo(49.2, 1);

    testRuntime.playerItemUseRequests = [];
    runFixedUpdate(1.1);
    expect(getHotbarOverlaySlotCooldownFill(4).style.opacity).toBe('0');
    expect(getHotbarOverlaySlotCooldownFill(4).style.height).toBe('0.0%');

    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'touch'
      }
    ];
    runFixedUpdate(1 / 60);
    expect(getHotbarOverlaySlotCooldownFill(4).style.opacity).toBe('1');
    expect(Number.parseFloat(getHotbarOverlaySlotCooldownFill(4).style.height)).toBeCloseTo(99.2, 1);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState?.health).toBe(85);
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[4]).toEqual({
      itemId: 'healing-potion',
      amount: 1
    });
  });

  it('uses a heart crystal through the shared hidden-panel mouse item-use path and persists the max-health upgrade', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            health: 45
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              ...Array.from({ length: 4 }, () => null)
            ],
            selectedHotbarSlotIndex: 5
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.player).toMatchObject({
      health: 65,
      maxHealth: 120
    });
    expect(testRuntime.latestDebugEditStatusStripState).toMatchObject({
      playerHealth: 65,
      playerMaxHealth: 120
    });

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState).toMatchObject({
      health: 65,
      maxHealth: 120
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[5]).toBeNull();
  });

  it('uses a heart crystal through the shared hidden-panel touch item-use path and clamps the final upgrade at the health cap', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            maxHealth: 390,
            health: 372
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              ...Array.from({ length: 4 }, () => null)
            ],
            selectedHotbarSlotIndex: 5
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(1 / 60);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState).toMatchObject({
      health: 382,
      maxHealth: 400
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[5]).toBeNull();
  });

  it('shows dead heart-crystal blocked feedback through the shared hidden-panel mouse item-use path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            health: 0
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              ...Array.from({ length: 4 }, () => null)
            ],
            selectedHotbarSlotIndex: 5
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(5).title).toContain('player is dead');
    expect(getHotbarOverlaySlotAmountLabel(5).textContent).toBe('DEAD');
    expect(getHotbarOverlaySlotCooldownFill(5).style.opacity).toBe('1');
    expect(getHotbarOverlaySlotCooldownFill(5).style.height).toBe('100.0%');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState).toMatchObject({
      health: 0,
      maxHealth: 100
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[5]).toEqual({
      itemId: 'heart-crystal',
      amount: 1
    });
  });

  it('shows max-cap heart-crystal blocked feedback through the shared hidden-panel touch item-use path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            maxHealth: 400,
            health: 360
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'heart-crystal', amount: 1 },
              ...Array.from({ length: 4 }, () => null)
            ],
            selectedHotbarSlotIndex: 5
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(5).title).toContain('already at 400 max health');
    expect(getHotbarOverlaySlotAmountLabel(5).textContent).toBe('MAX');
    expect(getHotbarOverlaySlotCooldownFill(5).style.opacity).toBe('1');
    expect(getHotbarOverlaySlotCooldownFill(5).style.height).toBe('100.0%');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState).toMatchObject({
      health: 360,
      maxHealth: 400
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[5]).toEqual({
      itemId: 'heart-crystal',
      amount: 1
    });
  });

  it('uses a mana crystal through the shared hidden-panel mouse item-use path and persists the max-mana upgrade', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            maxMana: 20,
            mana: 6
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'mana-crystal', amount: 2 },
              ...Array.from({ length: 4 }, () => null)
            ],
            selectedHotbarSlotIndex: 5
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);
    runRenderFrame();

    expect(testRuntime.latestDebugOverlayInspectState?.player).toMatchObject({
      maxMana: 40,
      mana: 26
    });
    expect(testRuntime.latestDebugEditStatusStripState).toMatchObject({
      playerMaxMana: 40,
      playerMana: 26
    });

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState).toMatchObject({
      maxMana: 40,
      mana: 26
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[5]).toEqual({
      itemId: 'mana-crystal',
      amount: 1
    });
  });

  it('uses a mana crystal through the shared hidden-panel touch item-use path and clamps the final upgrade at the mana cap', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            maxMana: DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP - 10,
            mana: 173
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'mana-crystal', amount: 1 },
              ...Array.from({ length: 4 }, () => null)
            ],
            selectedHotbarSlotIndex: 5
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(1 / 60);

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState).toMatchObject({
      maxMana: DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP,
      mana: 183
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[5]).toBeNull();
  });

  it('shows dead mana-crystal blocked feedback through the shared hidden-panel mouse item-use path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            health: 0,
            mana: 10
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'mana-crystal', amount: 2 },
              ...Array.from({ length: 4 }, () => null)
            ],
            selectedHotbarSlotIndex: 5
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(5).title).toContain('player is dead');
    expect(getHotbarOverlaySlotAmountLabel(5).textContent).toBe('DEAD');
    expect(getHotbarOverlaySlotCooldownFill(5).style.opacity).toBe('1');
    expect(getHotbarOverlaySlotCooldownFill(5).style.height).toBe('100.0%');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState).toMatchObject({
      health: 0,
      maxMana: 20,
      mana: 10
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[5]).toEqual({
      itemId: 'mana-crystal',
      amount: 2
    });
  });

  it('shows max-cap mana-crystal blocked feedback through the shared hidden-panel touch item-use path', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 },
            maxMana: DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP,
            mana: 160
          }),
          standalonePlayerInventoryState: createPlayerInventoryState({
            hotbar: [
              { itemId: 'pickaxe', amount: 1 },
              { itemId: 'dirt-block', amount: 64 },
              { itemId: 'torch', amount: 20 },
              { itemId: 'rope', amount: 24 },
              { itemId: 'healing-potion', amount: 3 },
              { itemId: 'mana-crystal', amount: 2 },
              ...Array.from({ length: 4 }, () => null)
            ],
            selectedHotbarSlotIndex: 5
          })
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 0,
        worldTileY: 0,
        worldX: 8,
        worldY: 0,
        pointerType: 'touch'
      }
    ];

    runFixedUpdate(1 / 60);

    expect(getHotbarOverlaySlotButton(5).title).toContain('already at 200 max mana');
    expect(getHotbarOverlaySlotAmountLabel(5).textContent).toBe('MAX');
    expect(getHotbarOverlaySlotCooldownFill(5).style.opacity).toBe('1');
    expect(getHotbarOverlaySlotCooldownFill(5).style.height).toBe('100.0%');

    dispatchWindowEvent('pagehide');
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerState).toMatchObject({
      maxMana: DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP,
      mana: 160
    });
    expect(readPersistedWorldSaveEnvelope()?.session.standalonePlayerInventoryState.hotbar[5]).toEqual({
      itemId: 'mana-crystal',
      amount: 2
    });
  });

  it('keeps canvas click and tap input on the debug-edit path while the full panel is open', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('g', 'KeyG').prevented).toBe(true);
    expect(testRuntime.canvasInteractionMode).toBe('debug-edit');

    testRuntime.rendererTileIdsByWorldKey.set(worldTileKey(1, 0), 1);
    testRuntime.rendererSetTileResult = true;
    testRuntime.playerItemUseRequests = [
      {
        worldTileX: 1,
        worldTileY: -1,
        worldX: 24,
        worldY: -8,
        pointerType: 'mouse'
      }
    ];

    runFixedUpdate();

    expect(testRuntime.rendererSetTileCalls).toEqual([]);
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

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: createDefaultWorldSessionShellState(),
        resetShellTogglesResult: {
          status: 'cleared'
        }
      })
    );
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

  it('shows the active fresh-world seed in paused World Save and preserves it through export', async () => {
    vi.mocked(Math.random).mockReturnValueOnce(0.125);

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    expect(readPausedWorldSaveMetadataValue('World Seed')).toBe('536870912');

    testRuntime.shellInstance?.options.onSecondaryAction('main-menu');

    expect(testRuntime.downloadedWorldSaveEnvelopes).toHaveLength(1);
    expect(
      (testRuntime.downloadedWorldSaveEnvelopes[0] as { worldSnapshot: { worldSeed: number } })
        .worldSnapshot.worldSeed
    ).toBe(536870912);
    expect(readPausedWorldSaveMetadataValue('World Seed')).toBe('536870912');
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

  it('downloads the live paused-menu shell profile without mutating the active session', async () => {
    const remappedShellActionKeybindings: ShellActionKeybindingState = {
      'return-to-main-menu': 'Q',
      'recenter-camera': 'C',
      'toggle-debug-overlay': 'U',
      'toggle-debug-edit-controls': 'G',
      'toggle-debug-edit-overlays': 'V',
      'toggle-player-spawn-marker': 'M'
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    testRuntime.shellInstance?.options.onToggleShortcutsOverlay('in-world');

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(
      testRuntime.shellInstance?.options.onRemapShellActionKeybinding?.(
        'toggle-debug-overlay',
        'u'
      )
    ).toEqual({
      status: 'saved'
    });

    const pausedState = createExpectedPausedMainMenuState({
      worldSessionShellState: {
        debugOverlayVisible: true,
        debugEditControlsVisible: false,
        debugEditOverlaysVisible: false,
        playerSpawnMarkerVisible: false,
        shortcutsOverlayVisible: true
      }
    });
    const persistedShellStateBeforeExport =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;

    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);

    expect(testRuntime.shellInstance?.options.onExportShellProfile?.('main-menu')).toEqual({
      status: 'downloaded',
      fileName: 'deep-factory-shell-profile-2026-03-11T05-06-07Z.json'
    });

    expect(testRuntime.downloadedShellProfileEnvelopes).toHaveLength(1);
    expect(testRuntime.downloadedShellProfileEnvelopes[0]).toEqual(
      createWorldSessionShellProfileEnvelope({
        shellState: {
          debugOverlayVisible: true,
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: false,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: true
        },
        shellActionKeybindings: remappedShellActionKeybindings
      })
    );
    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);
    expect(testRuntime.gameLoopStartCount).toBe(1);
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforeExport
    );
  });

  it('surfaces paused-menu shell-profile export failures without mutating the paused session', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    testRuntime.downloadShellProfileError = new Error('blocked download');

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    testRuntime.shellInstance?.options.onToggleShortcutsOverlay('in-world');

    expect(dispatchKeydown('q').prevented).toBe(true);
    const pausedState = createExpectedPausedMainMenuState({
      worldSessionShellState: {
        debugOverlayVisible: true,
        debugEditControlsVisible: false,
        debugEditOverlaysVisible: false,
        playerSpawnMarkerVisible: false,
        shortcutsOverlayVisible: true
      }
    });
    const persistedShellStateBeforeExport =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;

    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);

    expect(testRuntime.shellInstance?.options.onExportShellProfile?.('main-menu')).toEqual({
      status: 'failed',
      reason: 'blocked download'
    });

    expect(testRuntime.downloadedShellProfileEnvelopes).toHaveLength(0);
    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforeExport
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to export shell profile.',
      testRuntime.downloadShellProfileError
    );

    warnSpy.mockRestore();
  });

  it('previews a paused-menu shell profile before applying its toggles and hotkeys to the current session', async () => {
    const importedShellState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: false
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('q').prevented).toBe(true);

    const importShellProfile = testRuntime.shellInstance?.options.onImportShellProfile;
    if (!importShellProfile) {
      throw new Error('expected shell-profile import callback');
    }
    const applyShellProfilePreview = testRuntime.shellInstance?.options.onApplyShellProfilePreview;
    if (!applyShellProfilePreview) {
      throw new Error('expected shell-profile apply callback');
    }
    const persistedShellStateBeforePreview =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;
    const persistedShellHotkeysBeforePreview =
      testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null;
    const debugEditControlsHotkeysBeforePreview = testRuntime.debugEditControlsShellActionKeybindings;

    testRuntime.queuedShellProfileImportResults = [
      {
        status: 'selected',
        fileName: 'import-shell-profile.json',
        envelope: createWorldSessionShellProfileEnvelope({
          shellState: importedShellState,
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        })
      }
    ];

    await expect(importShellProfile('main-menu')).resolves.toEqual({
      status: 'previewed',
      fileName: 'import-shell-profile.json'
    });

    expect(testRuntime.shellProfileImportCallCount).toBe(1);
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforePreview
    );
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null).toBe(
      persistedShellHotkeysBeforePreview
    );
    expect(testRuntime.debugEditControlsShellActionKeybindings).toEqual(
      debugEditControlsHotkeysBeforePreview
    );
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(0);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        shellProfilePreview: {
          fileName: 'import-shell-profile.json',
          worldSessionShellState: importedShellState,
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        }
      })
    );

    expect(applyShellProfilePreview('main-menu')).toEqual({
      status: 'applied',
      fileName: 'import-shell-profile.json',
      changeCategory: 'mixed'
    });

    expect(readPersistedShellState()).toEqual(importedShellState);
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(
      JSON.stringify(CUSTOM_SHELL_ACTION_KEYBINDINGS)
    );
    expect(testRuntime.debugEditControlsShellActionKeybindings).toEqual(
      CUSTOM_SHELL_ACTION_KEYBINDINGS
    );
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: importedShellState,
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );
    expect(testRuntime.gameLoopStartCount).toBe(1);

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        ...importedShellState,
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );
    expect(dispatchKeydown('u').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: false,
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: false,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: false,
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );
  });

  it('reports paused-menu shell-profile applies as toggle-only when only shell visibility changes', async () => {
    const importedShellState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    };
    const matchingShellActionKeybindings = createDefaultShellActionKeybindingState();

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('q').prevented).toBe(true);

    const importShellProfile = testRuntime.shellInstance?.options.onImportShellProfile;
    if (!importShellProfile) {
      throw new Error('expected shell-profile import callback');
    }
    const applyShellProfilePreview = testRuntime.shellInstance?.options.onApplyShellProfilePreview;
    if (!applyShellProfilePreview) {
      throw new Error('expected shell-profile apply callback');
    }

    testRuntime.queuedShellProfileImportResults = [
      {
        status: 'selected',
        fileName: 'toggle-only-shell-profile.json',
        envelope: createWorldSessionShellProfileEnvelope({
          shellState: importedShellState,
          shellActionKeybindings: matchingShellActionKeybindings
        })
      }
    ];

    await expect(importShellProfile('main-menu')).resolves.toEqual({
      status: 'previewed',
      fileName: 'toggle-only-shell-profile.json'
    });

    expect(applyShellProfilePreview('main-menu')).toEqual({
      status: 'applied',
      fileName: 'toggle-only-shell-profile.json',
      changeCategory: 'toggle-only'
    });

    expect(readPersistedShellState()).toEqual(importedShellState);
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(
      JSON.stringify(matchingShellActionKeybindings)
    );
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(0);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: importedShellState,
        shellActionKeybindings: matchingShellActionKeybindings
      })
    );
  });

  it('reports paused-menu shell-profile applies as hotkey-only when only shell hotkeys change', async () => {
    const matchingShellState = createDefaultWorldSessionShellState();

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('q').prevented).toBe(true);

    const importShellProfile = testRuntime.shellInstance?.options.onImportShellProfile;
    if (!importShellProfile) {
      throw new Error('expected shell-profile import callback');
    }
    const applyShellProfilePreview = testRuntime.shellInstance?.options.onApplyShellProfilePreview;
    if (!applyShellProfilePreview) {
      throw new Error('expected shell-profile apply callback');
    }

    testRuntime.queuedShellProfileImportResults = [
      {
        status: 'selected',
        fileName: 'hotkey-only-shell-profile.json',
        envelope: createWorldSessionShellProfileEnvelope({
          shellState: matchingShellState,
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        })
      }
    ];

    await expect(importShellProfile('main-menu')).resolves.toEqual({
      status: 'previewed',
      fileName: 'hotkey-only-shell-profile.json'
    });

    expect(applyShellProfilePreview('main-menu')).toEqual({
      status: 'applied',
      fileName: 'hotkey-only-shell-profile.json',
      changeCategory: 'hotkey-only'
    });

    expect(readPersistedShellState()).toEqual(matchingShellState);
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(
      JSON.stringify(CUSTOM_SHELL_ACTION_KEYBINDINGS)
    );
    expect(testRuntime.debugEditControlsShellActionKeybindings).toEqual(
      CUSTOM_SHELL_ACTION_KEYBINDINGS
    );
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: matchingShellState,
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );
  });

  it('reports paused-menu shell-profile applies as no-ops when the preview already matches the current session', async () => {
    const matchingShellState = createDefaultWorldSessionShellState();
    const matchingShellActionKeybindings = createDefaultShellActionKeybindingState();

    testRuntime.storageValues.set(
      WORLD_SESSION_SHELL_STATE_STORAGE_KEY,
      JSON.stringify(matchingShellState)
    );
    testRuntime.storageValues.set(
      SHELL_ACTION_KEYBINDING_STORAGE_KEY,
      JSON.stringify(matchingShellActionKeybindings)
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('q').prevented).toBe(true);

    const importShellProfile = testRuntime.shellInstance?.options.onImportShellProfile;
    if (!importShellProfile) {
      throw new Error('expected shell-profile import callback');
    }
    const applyShellProfilePreview = testRuntime.shellInstance?.options.onApplyShellProfilePreview;
    if (!applyShellProfilePreview) {
      throw new Error('expected shell-profile apply callback');
    }
    const persistedShellStateBeforeApply =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;
    const persistedShellHotkeysBeforeApply =
      testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null;

    testRuntime.queuedShellProfileImportResults = [
      {
        status: 'selected',
        fileName: 'matching-shell-profile.json',
        envelope: createWorldSessionShellProfileEnvelope({
          shellState: matchingShellState,
          shellActionKeybindings: matchingShellActionKeybindings
        })
      }
    ];

    await expect(importShellProfile('main-menu')).resolves.toEqual({
      status: 'previewed',
      fileName: 'matching-shell-profile.json'
    });

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        shellProfilePreview: {
          fileName: 'matching-shell-profile.json',
          worldSessionShellState: matchingShellState,
          shellActionKeybindings: matchingShellActionKeybindings
        }
      })
    );

    expect(applyShellProfilePreview('main-menu')).toEqual({
      status: 'applied',
      fileName: 'matching-shell-profile.json',
      changeCategory: 'none'
    });

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforeApply
    );
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null).toBe(
      persistedShellHotkeysBeforeApply
    );
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(0);

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
  });

  it('clears a paused-menu shell-profile preview without applying its toggles or hotkeys', async () => {
    const importedShellState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: false
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('q').prevented).toBe(true);

    const importShellProfile = testRuntime.shellInstance?.options.onImportShellProfile;
    if (!importShellProfile) {
      throw new Error('expected shell-profile import callback');
    }
    const clearShellProfilePreview = testRuntime.shellInstance?.options.onClearShellProfilePreview;
    if (!clearShellProfilePreview) {
      throw new Error('expected shell-profile preview clear callback');
    }
    const persistedShellStateBeforePreview =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;
    const persistedShellHotkeysBeforePreview =
      testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null;
    const debugEditControlsHotkeysBeforePreview = testRuntime.debugEditControlsShellActionKeybindings;

    testRuntime.queuedShellProfileImportResults = [
      {
        status: 'selected',
        fileName: 'preview-only-shell-profile.json',
        envelope: createWorldSessionShellProfileEnvelope({
          shellState: importedShellState,
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        })
      }
    ];

    await expect(importShellProfile('main-menu')).resolves.toEqual({
      status: 'previewed',
      fileName: 'preview-only-shell-profile.json'
    });

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        shellProfilePreview: {
          fileName: 'preview-only-shell-profile.json',
          worldSessionShellState: importedShellState,
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        }
      })
    );

    expect(clearShellProfilePreview('main-menu')).toEqual({
      status: 'cleared',
      fileName: 'preview-only-shell-profile.json'
    });

    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforePreview
    );
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null).toBe(
      persistedShellHotkeysBeforePreview
    );
    expect(testRuntime.debugEditControlsShellActionKeybindings).toEqual(
      debugEditControlsHotkeysBeforePreview
    );
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(0);
  });

  it('rejects invalid paused-menu imported shell profiles without mutating the current session', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('q').prevented).toBe(true);

    const importShellProfile = testRuntime.shellInstance?.options.onImportShellProfile;
    if (!importShellProfile) {
      throw new Error('expected shell-profile import callback');
    }

    const pausedState = createExpectedPausedMainMenuState();
    const persistedShellStateBeforeImport =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;
    const persistedShellHotkeysBeforeImport =
      testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null;
    testRuntime.queuedShellProfileImportResults = [
      {
        status: 'rejected',
        fileName: 'broken-shell-profile.json',
        reason: 'shell profile envelope kind must be "deep-factory.shell-profile"'
      }
    ];

    await expect(importShellProfile('main-menu')).resolves.toEqual({
      status: 'rejected',
      fileName: 'broken-shell-profile.json',
      reason: 'shell profile envelope kind must be "deep-factory.shell-profile"'
    });

    expect(testRuntime.shellProfileImportCallCount).toBe(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(pausedState);
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforeImport
    );
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null).toBe(
      persistedShellHotkeysBeforeImport
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Rejected imported shell profile.',
      'shell profile envelope kind must be "deep-factory.shell-profile"'
    );

    warnSpy.mockRestore();
  });

  it('applies previewed shell profiles to the live paused session even when browser shell storage cannot be rewritten', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const importedShellState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: true
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    expect(dispatchKeydown('q').prevented).toBe(true);

    const importShellProfile = testRuntime.shellInstance?.options.onImportShellProfile;
    if (!importShellProfile) {
      throw new Error('expected shell-profile import callback');
    }
    const applyShellProfilePreview = testRuntime.shellInstance?.options.onApplyShellProfilePreview;
    if (!applyShellProfilePreview) {
      throw new Error('expected shell-profile apply callback');
    }

    const persistedShellStateBeforeImport =
      testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null;
    const persistedShellHotkeysBeforeImport =
      testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null;
    testRuntime.storageSetItemErrorsByKey.set(
      WORLD_SESSION_SHELL_STATE_STORAGE_KEY,
      new Error('shell state write blocked')
    );
    testRuntime.storageSetItemErrorsByKey.set(
      SHELL_ACTION_KEYBINDING_STORAGE_KEY,
      new Error('shell hotkey write blocked')
    );
    testRuntime.queuedShellProfileImportResults = [
      {
        status: 'selected',
        fileName: 'session-only-shell-profile.json',
        envelope: createWorldSessionShellProfileEnvelope({
          shellState: importedShellState,
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        })
      }
    ];

    await expect(importShellProfile('main-menu')).resolves.toEqual({
      status: 'previewed',
      fileName: 'session-only-shell-profile.json'
    });

    expect(testRuntime.shellProfileImportCallCount).toBe(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        shellProfilePreview: {
          fileName: 'session-only-shell-profile.json',
          worldSessionShellState: importedShellState,
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        }
      })
    );

    expect(applyShellProfilePreview('main-menu')).toEqual({
      status: 'persistence-failed',
      fileName: 'session-only-shell-profile.json',
      changeCategory: 'mixed',
      reason: 'Browser shell visibility preferences and hotkeys were not updated.'
    });

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: importedShellState,
        persistenceAvailable: false,
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS,
        shellActionKeybindingsCurrentSessionOnly: true
      })
    );
    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY) ?? null).toBe(
      persistedShellStateBeforeImport
    );
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY) ?? null).toBe(
      persistedShellHotkeysBeforeImport
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to persist imported shell profile.',
      'Browser shell visibility preferences and hotkeys were not updated.'
    );

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        ...importedShellState,
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );
    expect(dispatchKeydown('u').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: false,
        debugEditControlsVisible: false,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: true,
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );

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

  it('shows paused-menu clear-saved-world failure copy when deleting browser resume data fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.storageValues.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(true);
    expect(dispatchKeydown('q').prevented).toBe(true);
    testRuntime.storageRemoveItemErrorsByKey.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      new Error('remove blocked')
    );

    testRuntime.shellInstance?.options.onQuaternaryAction('main-menu');

    expect(testRuntime.storageValues.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        clearSavedWorldResult: {
          status: 'failed',
          reason: 'Browser resume data was not deleted.'
        }
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to clear persisted world save.',
      'Browser resume data was not deleted.'
    );

    dispatchWindowEvent('pagehide');

    expect(testRuntime.storageValues.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(true);
    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    warnSpy.mockRestore();
  });

  it('routes a paused-menu imported world save through the shared picker and restore action', async () => {
    const restoredWorldSeed = 0x12345678;
    const restoredWorld = new TileWorld(0, restoredWorldSeed);
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
        },
        worldSeed: restoredWorldSeed
      })
    );
    expect(testRuntime.rendererLoadWorldSnapshotCallCount).toBe(1);
    expect(readPausedWorldSaveMetadataValue('World Seed')).toBe('305419896');
    expect(readPersistedWorldSaveEnvelope()?.worldSnapshot.worldSeed).toBe(restoredWorldSeed);

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSeed: restoredWorldSeed
      })
    );
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

  it('shows paused-menu import picker-start failure copy when the browser picker throws before any selection result', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const restoreModule = await import('./mainWorldSessionRestore');
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    testRuntime.queuedWorldSaveImportResults = [
      {
        status: 'picker-start-failed',
        reason: 'picker blocked'
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
          status: 'picker-start-failed',
          reason: 'picker blocked'
        }
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to start world-save import picker.',
      'picker blocked'
    );
    warnSpy.mockRestore();
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
        },
        savedWorldStatus: 'import-persistence-failed'
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to persist restored world save.',
      'Browser resume data was not updated.'
    );

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(readPersistedWorldSaveEnvelope()).toBeNull();
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        savedWorldStatus: 'import-persistence-failed'
      })
    );

    testRuntime.storageSetItemErrorsByKey.delete(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY);

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(readPersistedWorldSaveEnvelope()).not.toBeNull();
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
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

  it('preserves a live manual camera drag across render follow and persists the synced follow offset on pause', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.cameraInstance).not.toBeNull();
    expect(testRuntime.gameLoopRender).not.toBeNull();

    const initialCameraX = testRuntime.cameraInstance!.x;
    const initialCameraY = testRuntime.cameraInstance!.y;
    testRuntime.cameraInstance!.x = initialCameraX + 18;
    testRuntime.cameraInstance!.y = initialCameraY - 12;

    testRuntime.gameLoopRender?.(1, 16);

    expect(testRuntime.cameraInstance).toMatchObject({
      x: initialCameraX + 18,
      y: initialCameraY - 12
    });

    expect(dispatchKeydown('q').prevented).toBe(true);

    const persistedEnvelope = readPersistedWorldSaveEnvelope();
    expect(persistedEnvelope?.session.cameraFollowOffset).toEqual({ x: 18, y: -12 });
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

  it('rewrites browser-resume save data immediately when boot restore consolidates overlapping matching dropped-item pickups', async () => {
    testRuntime.storageValues.set(
      PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
      JSON.stringify(
        createWorldSaveEnvelope({
          worldSnapshot: new TileWorld(0).createSnapshot(),
          standalonePlayerState: createPlayerState({
            position: { x: 8, y: 0 }
          }),
          droppedItemStates: [
            createDroppedItemState({
              position: { x: 24, y: -14 },
              itemId: 'torch',
              amount: 600
            }),
            createDroppedItemState({
              position: { x: 28, y: -14 },
              itemId: 'torch',
              amount: 500
            }),
            createDroppedItemState({
              position: { x: 28, y: -14 },
              itemId: 'rope',
              amount: 3
            })
          ]
        })
      )
    );

    await import('./main');
    await flushBootstrap();

    expect(readPersistedWorldSaveEnvelope()?.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: -14 },
        itemId: 'torch',
        amount: 999
      },
      {
        position: { x: 28, y: -14 },
        itemId: 'torch',
        amount: 101
      },
      {
        position: { x: 28, y: -14 },
        itemId: 'rope',
        amount: 3
      }
    ]);
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

  it('persists paused-menu telemetry collection and type toggles without disturbing shell visibility state', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    testRuntime.shellInstance?.options.onToggleShellTelemetryCollection?.(
      'main-menu',
      'hostile-slime'
    );
    testRuntime.shellInstance?.options.onToggleShellTelemetryType?.(
      'main-menu',
      'player-combat'
    );
    testRuntime.shellInstance?.options.onToggleShellTelemetryType?.(
      'main-menu',
      'inspect-pointer'
    );

    expect(readPersistedShellState()).toEqual(createDefaultWorldSessionShellState());
    expect(readPersistedTelemetryState()).toEqual({
      collections: {
        player: true,
        'hostile-slime': false,
        world: true,
        inspect: true
      },
      types: {
        'player-motion': true,
        'player-presentation': true,
        'player-combat': false,
        'player-camera': true,
        'player-collision': true,
        'player-events': true,
        'player-spawn': true,
        'hostile-slime-tracker': true,
        'world-atlas': true,
        'world-animated-mesh': true,
        'world-lighting': true,
        'world-liquid': true,
        'inspect-pointer': false,
        'inspect-pinned': true
      }
    });
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionTelemetryState: {
          collections: {
            player: true,
            'hostile-slime': false,
            world: true,
            inspect: true
          },
          types: {
            'player-motion': true,
            'player-presentation': true,
            'player-combat': false,
            'player-camera': true,
            'player-collision': true,
            'player-events': true,
            'player-spawn': true,
            'hostile-slime-tracker': true,
            'world-atlas': true,
            'world-animated-mesh': true,
            'world-lighting': true,
            'world-liquid': true,
            'inspect-pointer': false,
            'inspect-pinned': true
          }
        }
      })
    );
  });

  it('restores paused-menu telemetry to the default enabled catalog when reset from the shell editor', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    testRuntime.shellInstance?.options.onToggleShellTelemetryCollection?.(
      'main-menu',
      'hostile-slime'
    );
    testRuntime.shellInstance?.options.onToggleShellTelemetryType?.(
      'main-menu',
      'player-combat'
    );
    testRuntime.shellInstance?.options.onToggleShellTelemetryType?.(
      'main-menu',
      'inspect-pointer'
    );

    testRuntime.shellInstance?.options.onResetShellTelemetry?.('main-menu');

    expect(readPersistedShellState()).toEqual(createDefaultWorldSessionShellState());
    expect(readPersistedTelemetryState()).toEqual(createDefaultWorldSessionTelemetryState());
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        recentActivityAction: 'reset-shell-telemetry',
        resetShellTelemetryResult: {
          status: 'saved'
        }
      })
    );
  });

  it('keeps Reset Telemetry out of recent activity when the catalog is already at the default state', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.shellInstance?.options.onResetShellTelemetry?.('main-menu');

    expect(readPersistedTelemetryState()).toEqual(createDefaultWorldSessionTelemetryState());
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
  });

  it('persists paused-menu peaceful mode without disturbing shell visibility or telemetry state', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    testRuntime.shellInstance?.options.onTogglePeacefulMode?.('main-menu');

    expect(readPersistedShellState()).toEqual(createDefaultWorldSessionShellState());
    expect(readPersistedTelemetryState()).toEqual(createDefaultWorldSessionTelemetryState());
    expect(readPersistedGameplayState()).toEqual({
      peacefulModeEnabled: true
    });
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionGameplayState: {
          peacefulModeEnabled: true
        }
      })
    );

    testRuntime.shellInstance?.options.onTogglePeacefulMode?.('main-menu');

    expect(readPersistedGameplayState()).toEqual(createDefaultWorldSessionGameplayState());
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
  });

  it('despawns active hostile slimes and blocks new spawns while peaceful mode stays enabled', async () => {
    await import('./main');
    await flushBootstrap();

    const slimeSpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 12,
      x: 200,
      y: 0,
      width: DEFAULT_HOSTILE_SLIME_WIDTH,
      height: DEFAULT_HOSTILE_SLIME_HEIGHT,
      supportTileId: 3
    });
    const bunnySpawnPoint = createTestPlayerSpawnPoint({
      anchorTileX: 8,
      x: 136,
      y: 0,
      width: DEFAULT_PASSIVE_BUNNY_WIDTH,
      height: DEFAULT_PASSIVE_BUNNY_HEIGHT,
      supportTileId: 3
    });
    testRuntime.rendererFindPlayerSpawnPointImpl = (options) => {
      const search = options as { width?: number; height?: number } | undefined;
      if (
        search?.width === DEFAULT_HOSTILE_SLIME_WIDTH &&
        search?.height === DEFAULT_HOSTILE_SLIME_HEIGHT
      ) {
        return slimeSpawnPoint;
      }

      if (
        search?.width === DEFAULT_PASSIVE_BUNNY_WIDTH &&
        search?.height === DEFAULT_PASSIVE_BUNNY_HEIGHT
      ) {
        return bunnySpawnPoint;
      }

      if (search?.width === DEFAULT_PLAYER_WIDTH && search?.height === DEFAULT_PLAYER_HEIGHT) {
        return testRuntime.playerSpawnPoint;
      }

      return null;
    };

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toEqual([
      {
        id: 2,
        position: { x: 200, y: 0 }
      }
    ]);

    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.shellInstance?.options.onTogglePeacefulMode?.('main-menu');
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toEqual([]);

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.rendererStepHostileSlimeStateRequests = [];

    for (let step = 0; step < DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }

    expect(testRuntime.rendererStepHostileSlimeStateRequests).toEqual([]);

    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toEqual([]);
    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions).toHaveLength(1);
    expect(testRuntime.latestRendererRenderFrameState?.bunnyCurrentPositions?.[0]?.position).toEqual({
      x: 136,
      y: 0
    });

    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.shellInstance?.options.onTogglePeacefulMode?.('main-menu');
    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    for (let step = 0; step < DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS; step += 1) {
      runFixedUpdate();
    }
    runRenderFrame(1000 / 60, 0.5);

    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions).toHaveLength(1);
    expect(testRuntime.latestRendererRenderFrameState?.slimeCurrentPositions?.[0]?.position).toEqual({
      x: 200,
      y: 0
    });
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

  it('persists paused-menu shell-action remaps and refreshes shell-dependent hotkey references', async () => {
    const remappedShellActionKeybindings: ShellActionKeybindingState = {
      'return-to-main-menu': 'Q',
      'recenter-camera': 'C',
      'toggle-debug-overlay': 'U',
      'toggle-debug-edit-controls': 'G',
      'toggle-debug-edit-overlays': 'V',
      'toggle-player-spawn-marker': 'M'
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    expect(
      testRuntime.shellInstance?.options.onRemapShellActionKeybinding?.(
        'toggle-debug-overlay',
        'u'
      )
    ).toEqual({
      status: 'saved'
    });
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(
      JSON.stringify(remappedShellActionKeybindings)
    );
    expect(testRuntime.debugEditControlsShellActionKeybindings).toEqual(remappedShellActionKeybindings);
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        shellActionKeybindings: remappedShellActionKeybindings
      })
    );
    expect(dispatchKeydown('h').prevented).toBe(false);
    expect(dispatchKeydown('u').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        shellActionKeybindings: remappedShellActionKeybindings
      })
    );
  });

  it('rejects invalid runtime shell-action remaps before persisting them', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    expect(
      testRuntime.shellInstance?.options.onRemapShellActionKeybinding?.(
        'toggle-debug-overlay',
        'c'
      )
    ).toEqual({
      status: 'rejected'
    });
    expect(testRuntime.storageValues.has(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(false);
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(0);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
  });

  it('keeps valid paused-menu shell-action remaps as session-only fallback when storage writes fail', async () => {
    const remappedShellActionKeybindings: ShellActionKeybindingState = {
      'return-to-main-menu': 'Q',
      'recenter-camera': 'C',
      'toggle-debug-overlay': 'U',
      'toggle-debug-edit-controls': 'G',
      'toggle-debug-edit-overlays': 'V',
      'toggle-player-spawn-marker': 'M'
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.storageSetItemErrorsByKey.set(
      SHELL_ACTION_KEYBINDING_STORAGE_KEY,
      new Error('write blocked')
    );

    expect(
      testRuntime.shellInstance?.options.onRemapShellActionKeybinding?.(
        'toggle-debug-overlay',
        'u'
      )
    ).toEqual({
      status: 'session-only'
    });
    expect(testRuntime.storageValues.has(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(false);
    expect(testRuntime.debugEditControlsShellActionKeybindings).toEqual(remappedShellActionKeybindings);
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        persistenceAvailable: false,
        shellActionKeybindings: remappedShellActionKeybindings,
        shellActionKeybindingsCurrentSessionOnly: true
      })
    );

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        shellActionKeybindings: remappedShellActionKeybindings
      })
    );
    expect(dispatchKeydown('h').prevented).toBe(false);
    expect(dispatchKeydown('u').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createInWorldShellState({
        debugOverlayVisible: true,
        shellActionKeybindings: remappedShellActionKeybindings
      })
    );
  });

  it('keeps paused-menu hotkeys marked as current-session-only after later shell-toggle saves succeed', async () => {
    const remappedShellActionKeybindings: ShellActionKeybindingState = {
      'return-to-main-menu': 'Q',
      'recenter-camera': 'C',
      'toggle-debug-overlay': 'U',
      'toggle-debug-edit-controls': 'G',
      'toggle-debug-edit-overlays': 'V',
      'toggle-player-spawn-marker': 'M'
    };

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');
    testRuntime.storageSetItemErrorsByKey.set(
      SHELL_ACTION_KEYBINDING_STORAGE_KEY,
      new Error('write blocked')
    );

    expect(
      testRuntime.shellInstance?.options.onRemapShellActionKeybinding?.(
        'toggle-debug-overlay',
        'u'
      )
    ).toEqual({
      status: 'session-only'
    });

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onToggleDebugOverlay('in-world');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    expect(testRuntime.storageValues.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY)).toBe(
      JSON.stringify({
        debugOverlayVisible: true,
        debugEditControlsVisible: false,
        debugEditOverlaysVisible: false,
        playerSpawnMarkerVisible: false,
        shortcutsOverlayVisible: false
      })
    );
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: {
          debugOverlayVisible: true,
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: false,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: false
        },
        persistenceAvailable: true,
        shellActionKeybindings: remappedShellActionKeybindings,
        shellActionKeybindingsCurrentSessionOnly: true
      })
    );
  });

  it('resets paused-menu shell hotkeys back to the default set through the shared persistence path', async () => {
    const defaultShellActionKeybindings = createDefaultShellActionKeybindingState();

    testRuntime.storageValues.set(
      SHELL_ACTION_KEYBINDING_STORAGE_KEY,
      JSON.stringify(CUSTOM_SHELL_ACTION_KEYBINDINGS)
    );

    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    expect(testRuntime.shellInstance?.options.onResetShellActionKeybindings?.()).toEqual({
      status: 'reset',
      category: 'default-set-reset'
    });
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(
      JSON.stringify(defaultShellActionKeybindings)
    );
    expect(testRuntime.debugEditControlsShellActionKeybindings).toEqual(defaultShellActionKeybindings);
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(1);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');

    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());
  });

  it('treats paused-menu shell hotkey reset as a no-op when the default set is already active', async () => {
    await import('./main');
    await flushBootstrap();

    testRuntime.shellInstance?.options.onPrimaryAction('main-menu');
    testRuntime.shellInstance?.options.onReturnToMainMenu('in-world');

    expect(testRuntime.shellInstance?.options.onResetShellActionKeybindings?.()).toEqual({
      status: 'noop'
    });
    expect(testRuntime.storageValues.has(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(false);
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(0);
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

  it('clears paused-menu shell hotkey fallback warnings after resetting the default set', async () => {
    const defaultShellActionKeybindings = createDefaultShellActionKeybindingState();

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
    expect(dispatchKeydown('q').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createExpectedPausedMainMenuState());

    expect(testRuntime.shellInstance?.options.onResetShellActionKeybindings?.()).toEqual({
      status: 'reset',
      category: 'load-fallback-recovery'
    });
    expect(testRuntime.storageValues.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(
      JSON.stringify(defaultShellActionKeybindings)
    );
    expect(testRuntime.debugEditControlsShellActionKeybindings).toEqual(defaultShellActionKeybindings);
    expect(testRuntime.debugEditControlsSetShellActionKeybindingsCallCount).toBe(1);
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

    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: createDefaultWorldSessionShellState(),
        resetShellTogglesResult: {
          status: 'cleared'
        }
      })
    );
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

  it('shows paused-menu reset-shell-toggles warning copy when browser shell storage could not be cleared', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await import('./main');
    await flushBootstrap();

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
    testRuntime.storageRemoveItemErrorsByKey.set(
      WORLD_SESSION_SHELL_STATE_STORAGE_KEY,
      new Error('remove blocked')
    );

    testRuntime.shellInstance?.options.onQuinaryAction('main-menu');

    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: true
    });
    expect(testRuntime.shellInstance?.currentState).toEqual(
      createExpectedPausedMainMenuState({
        worldSessionShellState: createDefaultWorldSessionShellState(),
        persistenceAvailable: false,
        resetShellTogglesResult: {
          status: 'persistence-failed',
          reason: 'remove blocked'
        }
      })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to clear persisted shell toggle preferences.',
      'remove blocked'
    );

    expect(dispatchKeydown('Enter').prevented).toBe(true);
    expect(testRuntime.shellInstance?.currentState).toEqual(createInWorldShellState());
    expect(readPersistedShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    });

    warnSpy.mockRestore();
  });
});
