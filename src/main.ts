import './style.css';

import { Camera2D } from './core/camera2d';
import {
  recenterCameraOnFollowTarget,
  resolveCameraPositionFromFollowTarget,
  syncManualCameraDeltaIntoFollowState,
  type CameraFollowOffset,
  type CameraFollowPoint
} from './core/cameraFollow';
import { GameLoop } from './core/gameLoop';
import { Renderer, type RendererEntityFrameState } from './gl/renderer';
import {
  getStandalonePlayerPlaceholderPoseLabel,
  STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS
} from './gl/standalonePlayerPlaceholder';
import {
  type ArmedDebugToolPreviewState,
  type PlayerItemUseRequest,
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
import { DebugTileEditHistory, type DebugTileEditLayer } from './input/debugTileEditHistory';
import {
  createDebugEditShortcutContext,
  cycleDebugBrushTileId,
  getDebugBrushTileIdForShortcutSlot,
  isInWorldOnlyDebugEditShortcutAction,
  resolveDebugEditShortcutAction,
  type DebugEditShortcutAction
} from './input/debugEditShortcuts';
import {
  resolveHotbarSlotShortcut,
  resolveMoveSelectedHotbarSlotShortcut
} from './input/hotbarShortcuts';
import {
  resolveDropOneSelectedHotbarItemShortcut,
  resolveDropSelectedHotbarStackShortcut
} from './input/playerInventoryShortcuts';
import {
  createDefaultShellActionKeybindingState,
  IN_WORLD_SHELL_ACTION_KEYBINDING_IDS,
  loadShellActionKeybindingStateWithDefaultFallbackStatus,
  matchesDefaultShellActionKeybindingState,
  remapShellActionKeybinding,
  saveShellActionKeybindingState,
  type ShellActionKeybindingState
} from './input/shellActionKeybindings';
import {
  clearPersistedWorldSaveEnvelope,
  loadPersistedWorldSaveEnvelopeWithPersistenceAvailability,
  savePersistedWorldSaveEnvelope
} from './mainWorldSaveLocalPersistence';
import {
  clearWorldSessionShellStateWithResult,
  createDefaultWorldSessionShellState,
  createWorldSessionShellStateToggleChanges,
  loadWorldSessionShellStateWithPersistenceAvailability,
  saveWorldSessionShellState,
  resolveWorldSessionShellStateAfterPausedMainMenuTransition
} from './mainWorldSessionShellState';
import {
  cloneWorldSessionGameplayState,
  createDefaultWorldSessionGameplayState,
  loadWorldSessionGameplayStateWithPersistenceAvailability,
  saveWorldSessionGameplayState,
  type WorldSessionGameplayState
} from './mainWorldSessionGameplayState';
import {
  cloneWorldSessionTelemetryState,
  createDefaultWorldSessionTelemetryState,
  loadWorldSessionTelemetryStateWithPersistenceAvailability,
  matchesDefaultWorldSessionTelemetryState,
  saveWorldSessionTelemetryState,
  toggleWorldSessionTelemetryCollection,
  toggleWorldSessionTelemetryType,
  type WorldSessionTelemetryState
} from './mainWorldSessionTelemetryState';
import type { WorldSaveEnvelope } from './mainWorldSave';
import { pickWorldSaveEnvelopeFromJsonPicker } from './mainWorldSaveImport';
import { downloadWorldSaveEnvelope } from './mainWorldSaveDownload';
import {
  createWorldSessionShellProfileEnvelope,
  type WorldSessionShellProfileEnvelope
} from './mainWorldSessionShellProfile';
import { downloadWorldSessionShellProfileEnvelope } from './mainWorldSessionShellProfileDownload';
import { pickWorldSessionShellProfileEnvelopeFromJsonPicker } from './mainWorldSessionShellProfileImport';
import { restoreWorldSessionFromSaveEnvelope } from './mainWorldSessionRestore';
import { createWorldSessionSaveEnvelope } from './mainWorldSessionSave';
import { DebugOverlay, type DebugOverlayInspectState } from './ui/debugOverlay';
import {
  AppShell,
  createDefaultBootShellState,
  createInWorldShellState,
  createMainMenuShellState,
  createRendererInitializationFailedBootShellState,
  createWebGlUnavailableBootShellState,
  type AppShellScreen,
  type PausedMainMenuClearSavedWorldResult,
  type PausedMainMenuExportResult,
  type PausedMainMenuImportResult,
  type PausedMainMenuRecentActivityAction,
  type PausedMainMenuResetShellTelemetryResult,
  type PausedMainMenuShellActionKeybindingRemapResult,
  type PausedMainMenuResetShellActionKeybindingsResult,
  type PausedMainMenuResetShellTogglesResult,
  type PausedMainMenuShellProfilePreviewClearResult,
  type PausedMainMenuShellProfileApplyChangeCategory,
  type PausedMainMenuShellProfileExportResult,
  type PausedMainMenuShellProfileImportResult,
  type PausedMainMenuShellProfilePreview,
  type PausedMainMenuSavedWorldStatus
} from './ui/appShell';
import { DebugEditStatusStrip } from './ui/debugEditStatusStrip';
import { ArmedDebugToolPreviewOverlay } from './ui/armedDebugToolPreviewOverlay';
import {
  CraftingPanel,
  type CraftingPanelRecipeViewModel,
  type CraftingPanelStationViewModel
} from './ui/craftingPanel';
import { EquipmentPanel, type EquipmentPanelSlotViewModel } from './ui/equipmentPanel';
import { HoveredTileCursorOverlay } from './ui/hoveredTileCursor';
import {
  ItemCatalogPanel,
  type ItemCatalogPanelItemViewModel,
  type ItemCatalogPanelRecipeViewModel
} from './ui/itemCatalogPanel';
import {
  PlayerItemAxeChopPreviewOverlay,
  type PlayerItemAxeChopPreviewState
} from './ui/playerItemAxeChopPreviewOverlay';
import {
  PlayerItemBunnyReleasePreviewOverlay,
  type PlayerItemBunnyReleasePreviewState
} from './ui/playerItemBunnyReleasePreviewOverlay';
import {
  PlayerItemMiningPreviewOverlay,
  type PlayerItemMiningPreviewState
} from './ui/playerItemMiningPreviewOverlay';
import {
  PlayerItemPlacementPreviewOverlay,
  type PlayerItemPlacementPreviewState
} from './ui/playerItemPlacementPreviewOverlay';
import {
  PlayerItemSpearPreviewOverlay,
  type PlayerItemSpearPreviewState
} from './ui/playerItemSpearPreviewOverlay';
import { PlayerSpawnMarkerOverlay } from './ui/playerSpawnMarkerOverlay';
import type { DebugEditHoveredTileState, DebugEditStatusStripState } from './ui/debugEditStatusHelpers';
import {
  TouchDebugEditControls,
  type DebugBrushOption,
  type DebugEditHistoryControlState
} from './ui/touchDebugEditControls';
import { HotbarOverlay } from './ui/hotbarOverlay';
import { TouchPlayerControls } from './ui/touchPlayerControls';
import { CHUNK_SIZE, TILE_SIZE } from './world/constants';
import {
  EntityRegistry,
  type EntityId,
  type EntityRenderStateSnapshot,
  type SetEntityStateOptions
} from './world/entityRegistry';
import { resolveInterpolatedEntityWorldPosition } from './world/entityRenderInterpolation';
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
  createDeathPlayerRespawnEvent,
  type PlayerRespawnEvent
} from './world/playerRespawnEvent';
import {
  cloneDroppedItemState,
  createDroppedItemState,
  createDroppedItemStateFromWorldTile,
  createDroppedItemStateFromPlayerDrop,
  resolveDroppedItemPickup,
  resolveDroppedItemStackMergeCascade,
  type DroppedItemState
} from './world/droppedItem';
import {
  createPlayerDeathState,
  DEFAULT_PLAYER_RESPAWN_INVULNERABILITY_SECONDS,
  isPlayerDeathStateRespawnReady,
  stepPlayerDeathState,
  type PlayerDeathState
} from './world/playerDeathState';
import {
  createPlayerDeathCauseEvent,
  resolvePlayerDeathCauseFromDamageSequence,
  type PlayerDeathCauseCandidate,
  type PlayerDeathCauseEvent
} from './world/playerDeathCause';
import {
  type LiquidSurfaceLevelNeighborhood,
  resolveLiquidSurfaceBottomAtlasPixelRows,
  resolveConnectedLiquidNeighborLevel,
  resolveLiquidSurfaceBottomVCrops,
  resolveLiquidSurfaceBranchKind,
  resolveLiquidSurfaceCoverageAtlasPixelHeightTotals,
  resolveLiquidSurfaceCoveragePercentageTotals,
  resolveLiquidSurfaceCroppedFrameAtlasPixelHeights,
  resolveLiquidSurfaceCroppedFramePercentages,
  resolveLiquidSurfaceCroppedFrameRemainders,
  resolveLiquidSurfaceFrameAtlasPixelHeight,
  resolveLiquidSurfaceFrameBottomAtlasPixelRow,
  resolveLiquidSurfaceFrameBottomV,
  resolveLiquidSurfaceFrameHeightV,
  resolveLiquidSurfaceFrameTopAtlasPixelRow,
  resolveLiquidSurfaceFrameTopV,
  resolveLiquidSurfaceVisibleFrameAtlasPixelHeights,
  resolveLiquidSurfaceVisibleFrameHeights,
  resolveLiquidSurfaceVisibleFramePercentages,
  resolveLiquidSurfaceTopHeights
} from './world/liquidSurface';
import {
  DEFAULT_HOSTILE_SLIME_CONTACT_DAMAGE,
  resolveHostileSlimePlayerContactWithEvent,
  type HostileSlimePlayerContactEvent
} from './world/hostileSlimeCombat';
import {
  clonePlayerEquipmentState,
  createDefaultPlayerEquipmentState,
  getPlayerArmorItemDefinition,
  getPlayerEquipmentSlotLabel,
  getPlayerEquipmentTotalDefense,
  getStarterArmorItemIdForSlot,
  resolvePlayerArmorReducedDamage,
  toggleStarterArmorForSlot,
  type PlayerEquipmentState
} from './world/playerEquipment';
import {
  createHostileSlimeSpawnerState,
  resolveHostileSlimeSpawnWindowTarget,
  stepHostileSlimeSpawner
} from './world/hostileSlimeSpawn';
import {
  cloneHostileSlimeState,
  isHostileSlimeDefeated,
  type HostileSlimeLaunchKind,
  type HostileSlimeState
} from './world/hostileSlimeState';
import {
  createPassiveBunnySpawnerState,
  stepPassiveBunnySpawner
} from './world/passiveBunnySpawn';
import {
  clonePassiveBunnyState,
  type PassiveBunnyState
} from './world/passiveBunnyState';
import { createRandomWorldSeed } from './world/worldSeed';
import { evaluatePassiveBunnyRelease } from './world/passiveBunnyRelease';
import {
  addPlayerInventoryItemStack,
  clonePlayerInventoryState,
  consumePlayerInventoryHotbarSlotItem,
  createDefaultPlayerInventoryState,
  getPlayerInventoryItemDefinition,
  getPlayerInventoryItemAmount,
  isPlayerInventoryItemId,
  movePlayerInventorySelectedHotbarSlot,
  setPlayerInventoryHotbarSlot,
  setPlayerInventorySelectedHotbarSlot,
  type PlayerInventoryItemId,
  type PlayerInventoryState
} from './world/playerInventory';
import { searchPlayerItemCatalog } from './world/playerItemCatalog';
import { searchPlayerRecipeCatalog } from './world/playerRecipeCatalog';
import {
  evaluatePlayerCraftingRecipe,
  findNearestPlayerCraftingStationInRange,
  getPlayerCraftingRecipeDefinitions,
  getPlayerCraftingStationDefinitions,
  getPlayerCraftingStationLabel,
  isPlayerCraftingRecipeId,
  tryCraftPlayerRecipe,
  type PlayerCraftingRecipeId
} from './world/playerCrafting';
import {
  createPlayerHealingPotionCooldownState,
  DEFAULT_HEALING_POTION_USE_COOLDOWN_SECONDS,
  HEALING_POTION_ITEM_ID,
  stepPlayerHealingPotionCooldownState,
  tryUsePlayerHealingPotion
} from './world/playerHealingPotion';
import {
  DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP,
  HEART_CRYSTAL_ITEM_ID,
  tryUsePlayerHeartCrystal
} from './world/playerHeartCrystal';
import {
  ACORN_ITEM_ID,
  evaluateAcornPlantingAtAnchor,
  tryPlantAcornAtAnchor
} from './world/acornPlanting';
import {
  collectTrackedPlantedSmallTreeAnchorsFromWorldSnapshot,
  createSmallTreeGrowthState,
  isSmallTreeGrowthTrackedAnchorResident,
  type SmallTreeGrowthTrackedAnchor,
  stepSmallTreeGrowth
} from './world/smallTreeGrowth';
import { createGrassGrowthState, stepGrassGrowth } from './world/grassGrowth';
import { getSmallTreeSaplingTileId } from './world/smallTreeTiles';
import { evaluatePlayerHotbarTilePlacementRange } from './world/playerHotbarPlacementRange';
import { PROCEDURAL_GRASS_SURFACE_TILE_ID } from './world/proceduralTerrain';
import {
  evaluateStarterBlockPlacement,
  isPlaceableSolidBlockItemId,
  resolvePlaceableSolidBlockTileId
} from './world/starterBlockPlacement';
import {
  evaluateStarterWallPlacement,
  isPlaceableBackgroundWallItemId,
  resolvePlaceableBackgroundWallId,
  STARTER_DIRT_WALL_ID,
  STARTER_DIRT_WALL_ITEM_ID,
  STARTER_WOOD_WALL_ID,
  STARTER_WOOD_WALL_ITEM_ID
} from './world/starterWallPlacement';
import {
  evaluateStarterTorchPlacement,
  STARTER_TORCH_ITEM_ID,
  STARTER_TORCH_TILE_ID
} from './world/starterTorchPlacement';
import {
  evaluateStarterWorkbenchPlacement,
  STARTER_WORKBENCH_ITEM_ID,
  STARTER_WORKBENCH_TILE_ID
} from './world/starterWorkbenchPlacement';
import {
  evaluateStarterFurnacePlacement,
  STARTER_FURNACE_ITEM_ID,
  STARTER_FURNACE_TILE_ID
} from './world/starterFurnacePlacement';
import {
  evaluateStarterAnvilPlacement,
  STARTER_ANVIL_ITEM_ID,
  STARTER_ANVIL_TILE_ID
} from './world/starterAnvilPlacement';
import {
  evaluateStarterRopePlacement,
  resolveStarterRopePlacementTarget,
  STARTER_ROPE_ITEM_ID,
  STARTER_ROPE_TILE_ID
} from './world/starterRopePlacement';
import {
  evaluateStarterPlatformPlacement,
  STARTER_PLATFORM_ITEM_ID,
  STARTER_PLATFORM_TILE_ID
} from './world/starterPlatformPlacement';
import {
  chopSmallTreeAtAnchor,
  createStarterAxeChoppingState,
  evaluateStarterAxeChoppingTarget,
  STARTER_AXE_SWING_ACTIVE_SECONDS,
  STARTER_AXE_SWING_RECOVERY_SECONDS,
  STARTER_AXE_SWING_WINDUP_SECONDS,
  STARTER_AXE_ITEM_ID,
  stepStarterAxeChoppingState,
  tryStartStarterAxeSwing,
  WOOD_ITEM_ID
} from './world/starterAxeChopping';
import {
  createStarterPickaxeMiningState,
  evaluateStarterPickaxeMiningTarget,
  resolveStarterPickaxeBrokenTileDrop,
  resolveStarterPickaxeBreakProgressNormalized,
  STARTER_PICKAXE_SWING_ACTIVE_SECONDS,
  STARTER_PICKAXE_SWING_RECOVERY_SECONDS,
  STARTER_PICKAXE_SWING_WINDUP_SECONDS,
  STARTER_PICKAXE_ITEM_ID,
  stepStarterPickaxeMiningState,
  tryStartStarterPickaxeSwing
} from './world/starterPickaxeMining';
import {
  collectDebugBreakPreviewTargets,
  evaluateDebugBreakTarget,
  type DebugBreakPreviewTarget
} from './world/debugBreakTargeting';
import {
  createStarterMeleeWeaponState,
  STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS,
  STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS,
  STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS,
  STARTER_MELEE_WEAPON_ITEM_ID,
  stepStarterMeleeWeaponState,
  tryStartStarterMeleeWeaponSwing
} from './world/starterMeleeWeapon';
import {
  BUNNY_ITEM_ID,
  createStarterBugNetState,
  STARTER_BUG_NET_SWING_ACTIVE_SECONDS,
  STARTER_BUG_NET_SWING_RECOVERY_SECONDS,
  STARTER_BUG_NET_SWING_WINDUP_SECONDS,
  STARTER_BUG_NET_ITEM_ID,
  stepStarterBugNetState,
  tryStartStarterBugNetSwing
} from './world/starterBugNet';
import {
  createStarterSpearState,
  DEFAULT_STARTER_SPEAR_REACH,
  resolveStarterSpearThrustPreview,
  STARTER_SPEAR_THRUST_ACTIVE_SECONDS,
  STARTER_SPEAR_THRUST_RECOVERY_SECONDS,
  STARTER_SPEAR_THRUST_WINDUP_SECONDS,
  STARTER_SPEAR_ITEM_ID,
  stepStarterSpearState,
  tryStartStarterSpearThrust
} from './world/starterSpear';
import {
  applyStarterWandFireboltHitToHostileSlime,
  createStarterWandCooldownState,
  DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS,
  DEFAULT_STARTER_WAND_MANA_COST,
  STARTER_WAND_ITEM_ID,
  stepStarterWandCooldownState,
  stepStarterWandFireboltState,
  tryUseStarterWand,
  type StarterWandFireboltHitEvent,
  type StarterWandFireboltState
} from './world/starterWand';
import { stepPlayerManaRegeneration } from './world/playerMana';
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
  getPlayerDrowningDamageTickApplied,
  getPlayerLavaDamageTickApplied,
  isPlayerRopeDropActive,
  type PlayerCollisionContacts,
  type PlayerMovementIntent,
  type PlayerState
} from './world/playerState';
import {
  cloneStandalonePlayerRenderState,
  createStandalonePlayerRenderPresentationState,
  isStandalonePlayerRenderStateCeilingBonkActive,
  type StandalonePlayerRenderPresentationState,
  type StandalonePlayerRenderState
} from './world/standalonePlayerRenderState';
import {
  describeLiquidConnectivityGroup,
  describeLiquidRenderVariantPixelBoundsAtElapsedMs,
  describeLiquidRenderVariantSourceAtElapsedMs,
  describeLiquidRenderVariantUvRectAtElapsedMs,
  describeTileRenderPixelBoundsAtElapsedMs,
  describeTileRenderSourceAtElapsedMs,
  describeTileRenderUvRectAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs,
  getAnimatedLiquidRenderVariantFrameCount,
  getAnimatedLiquidRenderVariantFrameDurationMs,
  getAnimatedTileRenderFrameCount,
  getTileMetadata,
  resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs,
  resolveAnimatedTileRenderFrameIndexAtElapsedMs,
  resolveLiquidRenderVariantUvRectAtElapsedMs,
  resolveTileGameplayMetadata,
  TILE_METADATA
} from './world/tileMetadata';
import {
  describeWallRenderPixelBounds,
  describeWallRenderSource,
  describeWallRenderUvRect,
  getWallMetadata
} from './world/wallMetadata';

const DEBUG_TILE_BREAK_ID = 0;
const DEBUG_BREAK_FLOOD_FILL_TILE_ID_OFFSET = 0x100;
const DEBUG_BREAK_FLOOD_FILL_WALL_ID_OFFSET = 0x200;
const PREFERRED_INITIAL_DEBUG_BRUSH_TILE_NAME = 'debug_brick';
const STANDALONE_PLAYER_ENTITY_KIND = 'standalone-player';
const HOSTILE_SLIME_ENTITY_KIND = 'slime';
const PASSIVE_BUNNY_ENTITY_KIND = 'bunny';
const DROPPED_ITEM_ENTITY_KIND = 'dropped-item';
const STARTER_WAND_FIREBOLT_ENTITY_KIND = 'wand-firebolt';
const HOSTILE_SLIME_GEL_DROP_ITEM_ID: DroppedItemState['itemId'] = 'gel';
const STARTER_UMBRELLA_ITEM_ID = 'umbrella';
const HOSTILE_SLIME_GEL_DROP_AMOUNT = 1;
type MainMenuShellActionType =
  | 'enter-or-resume-world-session'
  | 'export-world-save'
  | 'import-world-save'
  | 'clear-persisted-world-session'
  | 'start-fresh-world-session'
  | 'reset-shell-toggle-preferences';
type DebugHistoryActionType = 'undo' | 'redo';
type DebugWorldHistoryChange = {
  layer: DebugTileEditLayer;
  previousId: number;
  id: number;
};
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
type TouchDebugEditControlShellActionKeybindingConstructorOptions = {
  shellActionKeybindings: ShellActionKeybindingState;
};
type TouchDebugEditControlResetConstructorOptions = {
  onResetPrefs: () => void;
};
type TouchDebugEditControlConstructorOptions = TouchDebugEditControlPreferenceConstructorOptions &
  TouchDebugEditControlShellActionKeybindingConstructorOptions &
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
type PlayerLandingDamageEvent = {
  damageApplied: number;
  impactSpeed: number;
};
type PlayerDrowningDamageEvent = {
  damageApplied: number;
};
type PlayerLavaDamageEvent = {
  damageApplied: number;
};
type StandalonePlayerFixedStepResult = {
  previousPlayerState: PlayerState;
  nextPlayerState: PlayerState;
  nextDeathState: PlayerDeathState | null;
  contactSnapshot: StandalonePlayerFixedStepContactSnapshot;
  transitionSnapshot: StandalonePlayerFixedStepTransitionSnapshot;
  landingDamageEvent: PlayerLandingDamageEvent | null;
  drowningDamageEvent: PlayerDrowningDamageEvent | null;
  lavaDamageEvent: PlayerLavaDamageEvent | null;
  deathCauseEvent: PlayerDeathCauseEvent | null;
  respawnEvent: PlayerRespawnEvent | null;
  renderPresentationState: StandalonePlayerRenderPresentationState;
};
type StandalonePlayerFixedStepContactSnapshotOptions = {
  previousPlayerState: PlayerState;
  nextPlayerState: PlayerState;
};
type StandalonePlayerFixedStepResultOptions = {
  previousPlayerState: PlayerState;
  currentPlayerDeathState: PlayerDeathState | null;
  fixedDt: number;
  playerMovementIntent: PlayerMovementIntent;
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
type StandalonePlayerDeathHoldTelemetryStatus = NonNullable<
  DebugEditStatusStripState['playerDeathHoldStatus']
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
  | 'playerHealth'
  | 'playerMaxHealth'
  | 'playerDeathCount'
  | 'playerRespawnSecondsRemaining'
  | 'playerDeathHoldStatus'
  | 'playerBreathSecondsRemaining'
  | 'playerHeadSubmergedInWater'
  | 'playerWaterSubmergedFraction'
  | 'playerLavaSubmergedFraction'
  | 'playerLavaDamageTickSecondsRemaining'
  | 'playerDrowningDamageTickSecondsRemaining'
  | 'playerFallDamageRecoverySecondsRemaining'
  | 'playerHostileContactInvulnerabilitySecondsRemaining'
  | 'playerGrounded'
  | 'playerFacing'
  | 'playerMoveX'
  | 'playerVelocityX'
  | 'playerVelocityY'
  | 'playerJumpHeld'
  | 'playerJumpPressed'
  | 'playerRopeDropActive'
  | 'playerRopeDropWindowArmed'
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
  | 'playerLandingDamageEvent'
  | 'playerDrowningDamageEvent'
  | 'playerLavaDamageEvent'
  | 'playerDeathCauseEvent'
  | 'playerHostileContactEvent'
  | 'playerWallContactTransition'
  | 'playerCeilingContactTransition'
>;
type StandalonePlayerRenderFrameStatusStripPlayerEventTelemetrySelectionOptions = {
  debugOverlayVisible: boolean;
  eventTelemetry: StandalonePlayerRenderFrameStatusStripPlayerEventTelemetry;
};
type TrackedHostileSlimeRenderFrameDebugOverlayTelemetry = Pick<
  DebugOverlayInspectState,
  'hostileSlime'
>;
type TrackedHostileSlimeRenderFrameStatusStripTelemetry = Pick<
  DebugEditStatusStripState,
  | 'hostileSlimeActiveCount'
  | 'hostileSlimeNextSpawnTicksRemaining'
  | 'hostileSlimeNextSpawnWindowIndex'
  | 'hostileSlimeNextSpawnWindowOffsetTiles'
  | 'hostileSlimeWorldTile'
  | 'hostileSlimeChaseOffset'
  | 'hostileSlimeVelocity'
  | 'hostileSlimeGrounded'
  | 'hostileSlimeFacing'
  | 'hostileSlimeHopCooldownTicksRemaining'
  | 'hostileSlimeLaunchKind'
>;
type TrackedHostileSlimeRenderFrameStatusStripTelemetrySelectionOptions = {
  debugOverlayVisible: boolean;
  telemetry: TrackedHostileSlimeRenderFrameStatusStripTelemetry;
};
type TrackedHostileSlimeRenderFrameTelemetrySnapshot = {
  debugOverlay: TrackedHostileSlimeRenderFrameDebugOverlayTelemetry;
  debugStatusStrip: TrackedHostileSlimeRenderFrameStatusStripTelemetry;
};
type StandalonePlayerRenderFrameTelemetrySnapshot = {
  standalonePlayerContacts: PlayerCollisionContacts | null;
  debugOverlay: StandalonePlayerRenderFrameDebugOverlayTelemetry;
  debugStatusStrip: StandalonePlayerRenderFrameStatusStripTelemetry;
};
type ResolvedPlayerSpawnTelemetrySnapshot = {
  debugOverlaySpawn: DebugOverlayInspectState['spawn'];
  debugStatusStripPlayerSpawn: DebugEditStatusStripState['playerSpawn'];
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
const resolveThrownErrorReason = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return 'Unknown error';
};
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

interface RestoredPausedWorldSessionFromSaveEnvelopeResult {
  status: 'restored';
}

interface FailedPausedWorldSessionFromSaveEnvelopeResult {
  status: 'restore-failed';
  reason: string;
}

interface PersistenceFailedPausedWorldSessionFromSaveEnvelopeResult {
  status: 'persistence-failed';
  reason: string;
}

type RestorePausedWorldSessionFromSaveEnvelopeResult =
  | RestoredPausedWorldSessionFromSaveEnvelopeResult
  | FailedPausedWorldSessionFromSaveEnvelopeResult
  | PersistenceFailedPausedWorldSessionFromSaveEnvelopeResult;

type PendingPausedMainMenuShellProfilePreview = {
  fileName: string | null;
  envelope: WorldSessionShellProfileEnvelope;
};

let restorePausedWorldSessionFromSaveEnvelopeAction:
  | ((envelope: WorldSaveEnvelope) => RestorePausedWorldSessionFromSaveEnvelopeResult)
  | null = null;

const restorePausedWorldSessionFromSaveEnvelopeWithResult = (
  envelope: WorldSaveEnvelope
): RestorePausedWorldSessionFromSaveEnvelopeResult =>
  restorePausedWorldSessionFromSaveEnvelopeAction?.(envelope) ?? {
    status: 'restore-failed',
    reason: 'Paused world-session restore is unavailable.'
  };

export const restorePausedWorldSessionFromSaveEnvelope = (
  envelope: WorldSaveEnvelope
): boolean => restorePausedWorldSessionFromSaveEnvelopeWithResult(envelope).status !== 'restore-failed';

const bootstrap = async (): Promise<void> => {
  restorePausedWorldSessionFromSaveEnvelopeAction = null;
  const touchControlsAvailable = supportsTouchPlayerControls();
  const worldSessionShellStateStorage = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  const initialShellActionKeybindingLoad = loadShellActionKeybindingStateWithDefaultFallbackStatus(
    worldSessionShellStateStorage
  );
  let shellActionKeybindings = initialShellActionKeybindingLoad.state;
  let shellActionKeybindingsDefaultedFromPersistedState =
    initialShellActionKeybindingLoad.defaultedFromPersistedState;
  let shellActionKeybindingsCurrentSessionOnly = false;
  const defaultWorldSessionShellState = createDefaultWorldSessionShellState();
  const defaultWorldSessionTelemetryState = createDefaultWorldSessionTelemetryState();
  let worldSessionStarted = false;
  let worldSessionLoopStarted = false;
  let pausedMainMenuWorldSaveCleared = false;
  let pausedMainMenuSavedWorldStatus: PausedMainMenuSavedWorldStatus | null = null;
  let pausedMainMenuExportResult: PausedMainMenuExportResult | null = null;
  let pausedMainMenuImportResult: PausedMainMenuImportResult | null = null;
  let pausedMainMenuClearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null = null;
  let pausedMainMenuResetShellTogglesResult: PausedMainMenuResetShellTogglesResult | null = null;
  let pausedMainMenuResetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult | null =
    null;
  let pausedMainMenuRecentActivityAction: PausedMainMenuRecentActivityAction | null = null;
  let pausedMainMenuShellProfilePreview: PendingPausedMainMenuShellProfilePreview | null = null;
  let currentScreen: AppShellScreen = 'boot';
  let loop: GameLoop | null = null;
  let worldSessionShellPersistenceAvailable = true;
  let worldSessionGameplayPersistenceAvailable = true;
  let worldSessionTelemetryPersistenceAvailable = true;
  const initialPersistedWorldSaveEnvelopeLoad =
    loadPersistedWorldSaveEnvelopeWithPersistenceAvailability(worldSessionShellStateStorage);
  let worldSavePersistenceAvailable = initialPersistedWorldSaveEnvelopeLoad.persistenceAvailable;
  const persistedWorldSaveEnvelope = initialPersistedWorldSaveEnvelopeLoad.envelope;
  const initialWorldSessionShellStateLoad =
    loadWorldSessionShellStateWithPersistenceAvailability(
      worldSessionShellStateStorage,
      defaultWorldSessionShellState
    );
  const initialWorldSessionTelemetryStateLoad =
    loadWorldSessionTelemetryStateWithPersistenceAvailability(
      worldSessionShellStateStorage,
      defaultWorldSessionTelemetryState
    );
  const initialWorldSessionGameplayStateLoad =
    loadWorldSessionGameplayStateWithPersistenceAvailability(
      worldSessionShellStateStorage,
      createDefaultWorldSessionGameplayState()
    );
  worldSessionShellPersistenceAvailable =
    initialWorldSessionShellStateLoad.persistenceAvailable;
  worldSessionGameplayPersistenceAvailable =
    initialWorldSessionGameplayStateLoad.persistenceAvailable;
  worldSessionTelemetryPersistenceAvailable =
    initialWorldSessionTelemetryStateLoad.persistenceAvailable;
  let {
    debugOverlayVisible,
    debugEditControlsVisible,
    debugEditOverlaysVisible,
    playerSpawnMarkerVisible,
    shortcutsOverlayVisible
  } = initialWorldSessionShellStateLoad.state;
  let worldSessionGameplayState = initialWorldSessionGameplayStateLoad.state;
  let worldSessionTelemetryState = initialWorldSessionTelemetryStateLoad.state;
  const readWorldSessionShellState = () => ({
    debugOverlayVisible,
    debugEditControlsVisible,
    debugEditOverlaysVisible,
    playerSpawnMarkerVisible,
    shortcutsOverlayVisible
  });
  const readWorldSessionGameplayState = (): WorldSessionGameplayState =>
    cloneWorldSessionGameplayState(worldSessionGameplayState);
  const readWorldSessionTelemetryState = (): WorldSessionTelemetryState =>
    cloneWorldSessionTelemetryState(worldSessionTelemetryState);
  const readPausedMainMenuShellProfilePreview =
    (): PausedMainMenuShellProfilePreview | null =>
      pausedMainMenuShellProfilePreview === null
        ? null
        : {
            fileName: pausedMainMenuShellProfilePreview.fileName,
            shellState: {
              ...pausedMainMenuShellProfilePreview.envelope.shellState
            },
            shellActionKeybindings: {
              ...pausedMainMenuShellProfilePreview.envelope.shellActionKeybindings
            }
          };
  const persistWorldSessionShellState = (): void => {
    worldSessionShellPersistenceAvailable = saveWorldSessionShellState(
      worldSessionShellStateStorage,
      readWorldSessionShellState()
    );
  };
  const clearPersistedWorldSessionShellState = () => {
    const result = clearWorldSessionShellStateWithResult(worldSessionShellStateStorage);
    worldSessionShellPersistenceAvailable = result.persistenceAvailable;
    return result;
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
  const applyWorldSessionTelemetryState = (state: WorldSessionTelemetryState): void => {
    worldSessionTelemetryState = cloneWorldSessionTelemetryState(state);
  };
  const applyWorldSessionGameplayState = (state: WorldSessionGameplayState): void => {
    worldSessionGameplayState = cloneWorldSessionGameplayState(state);
  };
  const persistWorldSessionGameplayState = (
    state: WorldSessionGameplayState = readWorldSessionGameplayState()
  ): boolean => {
    worldSessionGameplayPersistenceAvailable = saveWorldSessionGameplayState(
      worldSessionShellStateStorage,
      state
    );
    return worldSessionGameplayPersistenceAvailable;
  };
  const persistWorldSessionTelemetryState = (
    state: WorldSessionTelemetryState = readWorldSessionTelemetryState()
  ): boolean => {
    worldSessionTelemetryPersistenceAvailable = saveWorldSessionTelemetryState(
      worldSessionShellStateStorage,
      state
    );
    return worldSessionTelemetryPersistenceAvailable;
  };
  const applyPausedMainMenuWorldSessionShellTransition = (
    transition: Parameters<typeof resolveWorldSessionShellStateAfterPausedMainMenuTransition>[1],
    persistence: 'save' | 'clear' = 'save'
  ) => {
    applyWorldSessionShellState(
      resolveWorldSessionShellStateAfterPausedMainMenuTransition(readWorldSessionShellState(), transition)
    );
    if (persistence === 'clear') {
      return clearPersistedWorldSessionShellState();
    }
    persistWorldSessionShellState();
    return null;
  };
  const returnToMainMenuFromInWorld = (): void => {
    if (currentScreen !== 'in-world') return;
    applyPausedMainMenuWorldSessionShellTransition('pause-to-main-menu');
    persistCurrentWorldSession();
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
      handleMainMenuShellAction(screen, 'export-world-save');
    },
    onTertiaryAction: (screen) => {
      handleMainMenuShellAction(screen, 'import-world-save');
    },
    onImportWorldSave: (screen) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return false;
      }

      return importPausedMainMenuWorldSave();
    },
    onQuaternaryAction: (screen) => {
      handleMainMenuShellAction(screen, 'clear-persisted-world-session');
    },
    onQuinaryAction: (screen) => {
      handleMainMenuShellAction(screen, 'reset-shell-toggle-preferences');
    },
    onSenaryAction: (screen) => {
      handleMainMenuShellAction(screen, 'start-fresh-world-session');
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
    },
    onRemapShellActionKeybinding: (actionType, nextKey) => {
      const remapResult = remapShellActionKeybinding(shellActionKeybindings, actionType, nextKey);
      if (!remapResult.ok) {
        return {
          status: 'rejected'
        };
      }

      return applyShellActionKeybindingStateAndRefreshWithPersistenceFallback(remapResult.state);
    },
    onResetShellActionKeybindings: (): PausedMainMenuResetShellActionKeybindingsResult => {
      const defaultShellActionKeybindings = createDefaultShellActionKeybindingState();
      if (
        !shellActionKeybindingsDefaultedFromPersistedState &&
        matchesDefaultShellActionKeybindingState(
          shellActionKeybindings,
          defaultShellActionKeybindings
        )
      ) {
        return {
          status: 'noop'
        };
      }

      const resetCategory = shellActionKeybindingsDefaultedFromPersistedState
        ? 'load-fallback-recovery'
        : 'default-set-reset';
      if (!persistShellActionKeybindingStateAndRefresh(defaultShellActionKeybindings)) {
        return {
          status: 'failed'
        };
      }

      return {
        status: 'reset',
        category: resetCategory
      };
    },
    onImportShellProfile: (screen) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return {
          status: 'failed',
          reason: 'Shell-profile import is unavailable.'
        };
      }

      return importPausedMainMenuShellProfile();
    },
    onApplyShellProfilePreview: (screen) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return {
          status: 'failed',
          reason: 'Shell-profile apply is unavailable.'
        };
      }

      return applyPausedMainMenuShellProfilePreview();
    },
    onClearShellProfilePreview: (screen) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return {
          status: 'failed',
          reason: 'Shell-profile preview clear is unavailable.'
        };
      }

      return clearPausedMainMenuShellProfilePreview();
    },
    onExportShellProfile: (screen) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return {
          status: 'failed',
          reason: 'Shell-profile export is unavailable.'
        };
      }

      return exportPausedMainMenuShellProfile();
    },
    onToggleShellTelemetryCollection: (screen, collectionId) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return;
      }

      applyWorldSessionTelemetryStateAndRefreshWithPersistenceFallback(
        toggleWorldSessionTelemetryCollection(readWorldSessionTelemetryState(), collectionId)
      );
    },
    onToggleShellTelemetryType: (screen, typeId) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return;
      }

      applyWorldSessionTelemetryStateAndRefreshWithPersistenceFallback(
        toggleWorldSessionTelemetryType(readWorldSessionTelemetryState(), typeId)
      );
    },
    onResetShellTelemetry: (screen) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return;
      }

      const previousTelemetryState = readWorldSessionTelemetryState();
      if (matchesDefaultWorldSessionTelemetryState(previousTelemetryState)) {
        return;
      }

      const persisted = applyWorldSessionTelemetryStateWithPersistenceFallback(
        createDefaultWorldSessionTelemetryState()
      );
      pausedMainMenuResetShellTelemetryResult = {
        status: persisted ? 'saved' : 'session-only'
      };
      pausedMainMenuRecentActivityAction = 'reset-shell-telemetry';
      refreshShellStateAfterShellPreferenceChange();
    },
    onTogglePeacefulMode: (screen) => {
      if (screen !== 'main-menu' || !worldSessionStarted) {
        return;
      }

      const nextState: WorldSessionGameplayState = {
        peacefulModeEnabled: !readWorldSessionGameplayState().peacefulModeEnabled
      };
      applyWorldSessionGameplayStateAndRefreshWithPersistenceFallback(nextState);
      if (nextState.peacefulModeEnabled) {
        despawnHostileSlimeEntities([...hostileSlimeEntityIds]);
      }
    }
  });
  shell.setState(createDefaultBootShellState());
  const canvas = document.createElement('canvas');
  const worldHost = shell.getWorldHost();
  worldHost.append(canvas);

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
  const playerItemAxeChopPreview = new PlayerItemAxeChopPreviewOverlay(canvas);
  const playerItemBunnyReleasePreview = new PlayerItemBunnyReleasePreviewOverlay(canvas);
  const playerItemMiningPreview = new PlayerItemMiningPreviewOverlay(canvas);
  const playerItemPlacementPreview = new PlayerItemPlacementPreviewOverlay(canvas);
  const playerItemSpearPreview = new PlayerItemSpearPreviewOverlay(canvas);
  const playerSpawnMarker = new PlayerSpawnMarkerOverlay(canvas);
  const armedDebugToolPreview = new ArmedDebugToolPreviewOverlay(canvas);
  const debugEditStatusStrip = new DebugEditStatusStrip(canvas);
  const hotbarOverlay = new HotbarOverlay({
    host: worldHost,
    onSelectSlot: (slotIndex) => {
      selectStandalonePlayerHotbarSlot(slotIndex);
    },
    onMoveSelectedLeft: () => {
      moveSelectedStandalonePlayerHotbarSlot(-1);
    },
    onMoveSelectedRight: () => {
      moveSelectedStandalonePlayerHotbarSlot(1);
    },
    onDropSelectedOne: () => {
      dropSelectedStandalonePlayerHotbarItem();
    },
    onDropSelectedStack: () => {
      dropSelectedStandalonePlayerHotbarStack();
    }
  });
  let itemCatalogSearchQuery = '';
  const tryCraftSharedPlayerRecipe = (recipeId: string): void => {
    if (!isPlayerCraftingRecipeId(recipeId)) {
      return;
    }
    tryCraftSelectedPlayerRecipe(recipeId);
  };
  const craftingPanel = new CraftingPanel({
    host: worldHost,
    onCraftRecipe: tryCraftSharedPlayerRecipe
  });
  const equipmentPanel = new EquipmentPanel({
    host: worldHost,
    onToggleSlot: (slotId) => {
      toggleStandalonePlayerStarterArmorSlot(slotId);
    }
  });
  const itemCatalogPanel = new ItemCatalogPanel({
    host: worldHost,
    onSearchQueryChange: (query) => {
      itemCatalogSearchQuery = query;
      syncItemCatalogPanelState();
    },
    onSpawnItem: (itemId) => {
      if (!isPlayerInventoryItemId(itemId)) {
        return;
      }
      trySpawnStandalonePlayerCatalogItem(itemId);
    },
    onCraftRecipe: tryCraftSharedPlayerRecipe
  });
  let debugEditControls: TouchDebugEditControls | null = null;
  const syncInWorldShellState = (): void => {
    currentScreen = 'in-world';
    shell.setState(createInWorldShellState({
      debugOverlayVisible,
      debugEditControlsVisible,
      debugEditOverlaysVisible,
      playerSpawnMarkerVisible,
      shortcutsOverlayVisible,
      shellActionKeybindings
    }));
  };
  const readCurrentWorldSeed = (): number => renderer.createWorldSnapshot().worldSeed;
  const showMainMenuShellState = (): void => {
    currentScreen = 'main-menu';
    shell.setState(
      createMainMenuShellState(
        worldSessionStarted,
        readWorldSessionShellState(),
        worldSessionShellPersistenceAvailable,
        shellActionKeybindings,
        shellActionKeybindingsDefaultedFromPersistedState,
        pausedMainMenuImportResult,
        pausedMainMenuSavedWorldStatus,
        pausedMainMenuExportResult,
        pausedMainMenuClearSavedWorldResult,
        pausedMainMenuResetShellTogglesResult,
        worldSavePersistenceAvailable,
        readPausedMainMenuShellProfilePreview(),
        shellActionKeybindingsCurrentSessionOnly,
        pausedMainMenuRecentActivityAction,
        readWorldSessionTelemetryState(),
        worldSessionTelemetryPersistenceAvailable,
        pausedMainMenuResetShellTelemetryResult,
        readWorldSessionGameplayState(),
        worldSessionGameplayPersistenceAvailable,
        readCurrentWorldSeed()
      )
    );
    syncWorldScreenShellVisibility();
  };
  const applyShellActionKeybindingState = (nextKeybindings: ShellActionKeybindingState): void => {
    shellActionKeybindings = nextKeybindings;
    shellActionKeybindingsDefaultedFromPersistedState = false;
    debugEditControls?.setShellActionKeybindings(shellActionKeybindings);
  };
  const refreshShellStateAfterShellPreferenceChange = (): void => {
    if (currentScreen === 'in-world') {
      syncInWorldShellState();
      return;
    }

    showMainMenuShellState();
  };
  const applyWorldSessionTelemetryStateWithPersistenceFallback = (
    nextState: WorldSessionTelemetryState
  ): boolean => {
    applyWorldSessionTelemetryState(nextState);
    return persistWorldSessionTelemetryState(nextState);
  };
  const applyWorldSessionGameplayStateWithPersistenceFallback = (
    nextState: WorldSessionGameplayState
  ): boolean => {
    applyWorldSessionGameplayState(nextState);
    return persistWorldSessionGameplayState(nextState);
  };
  const applyWorldSessionGameplayStateAndRefreshWithPersistenceFallback = (
    nextState: WorldSessionGameplayState
  ): boolean => {
    const persisted = applyWorldSessionGameplayStateWithPersistenceFallback(nextState);
    refreshShellStateAfterShellPreferenceChange();
    return persisted;
  };
  const applyWorldSessionTelemetryStateAndRefreshWithPersistenceFallback = (
    nextState: WorldSessionTelemetryState
  ): boolean => {
    const persisted = applyWorldSessionTelemetryStateWithPersistenceFallback(nextState);
    refreshShellStateAfterShellPreferenceChange();
    return persisted;
  };
  function persistShellActionKeybindingStateAndRefresh(
    nextKeybindings: ShellActionKeybindingState
  ): boolean {
    const persisted = saveShellActionKeybindingState(worldSessionShellStateStorage, nextKeybindings);
    worldSessionShellPersistenceAvailable = persisted;
    if (!persisted) {
      return false;
    }

    applyShellActionKeybindingState(nextKeybindings);
    shellActionKeybindingsCurrentSessionOnly = false;
    refreshShellStateAfterShellPreferenceChange();
    return true;
  }
  function applyShellActionKeybindingStateAndRefreshWithPersistenceFallback(
    nextKeybindings: ShellActionKeybindingState
  ): PausedMainMenuShellActionKeybindingRemapResult {
    const persisted = saveShellActionKeybindingState(worldSessionShellStateStorage, nextKeybindings);
    worldSessionShellPersistenceAvailable = persisted;
    applyShellActionKeybindingState(nextKeybindings);
    shellActionKeybindingsCurrentSessionOnly = !persisted;
    refreshShellStateAfterShellPreferenceChange();
    return {
      status: persisted ? 'saved' : 'session-only'
    };
  }
  const syncDebugOverlayVisibility = (): void => {
    debug.setVisible(currentScreen === 'in-world' && debugOverlayVisible);
  };
  const syncDebugEditOverlayVisibility = (): void => {
    const visible = currentScreen === 'in-world' && debugEditOverlaysVisible;
    hoveredTileCursor.setVisible(visible);
    armedDebugToolPreview.setVisible(visible);
    debugEditStatusStrip.setVisible(visible);
  };
  const syncPlayModeItemPreviewVisibility = (): void => {
    const visible = currentScreen === 'in-world' && !debugEditControlsVisible;
    playerItemAxeChopPreview.setVisible(visible);
    playerItemBunnyReleasePreview.setVisible(visible);
    playerItemMiningPreview.setVisible(visible);
    playerItemPlacementPreview.setVisible(visible);
    playerItemSpearPreview.setVisible(visible);
  };
  const syncCanvasInteractionMode = (): void => {
    input.setCanvasInteractionMode(
      currentScreen === 'in-world' && !debugEditControlsVisible ? 'play' : 'debug-edit'
    );
  };
  const syncDebugEditControlsVisibility = (): void => {
    debugEditControls?.setVisible(currentScreen === 'in-world' && debugEditControlsVisible);
    syncCraftingPanelVisibility();
    syncEquipmentPanelVisibility();
    syncItemCatalogPanelVisibility();
    syncCanvasInteractionMode();
    syncPlayModeItemPreviewVisibility();
  };
  const syncPlayerSpawnMarkerVisibility = (): void => {
    playerSpawnMarker.setVisible(currentScreen === 'in-world' && playerSpawnMarkerVisible);
  };
  const syncHotbarOverlayVisibility = (): void => {
    hotbarOverlay.setVisible(currentScreen === 'in-world');
  };
  const isCraftingPanelVisible = (): boolean =>
    currentScreen === 'in-world' &&
    debugEditControlsVisible &&
    !(debugEditControls?.isCollapsed() ?? false);
  const syncCraftingPanelVisibility = (): void => {
    craftingPanel.setVisible(isCraftingPanelVisible());
  };
  const isEquipmentPanelVisible = (): boolean => isCraftingPanelVisible();
  const syncEquipmentPanelVisibility = (): void => {
    equipmentPanel.setVisible(isEquipmentPanelVisible());
  };
  const isItemCatalogPanelVisible = (): boolean => isCraftingPanelVisible();
  const syncItemCatalogPanelVisibility = (): void => {
    itemCatalogPanel.setVisible(isItemCatalogPanelVisible());
  };
  const syncWorldScreenShellVisibility = (): void => {
    syncDebugOverlayVisibility();
    syncDebugEditControlsVisibility();
    syncDebugEditOverlayVisibility();
    syncPlayerSpawnMarkerVisibility();
    syncHotbarOverlayVisibility();
    syncCanvasInteractionMode();
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
      case 'recenter-camera': {
        const standalonePlayerState = getStandalonePlayerState();
        if (!canApplyInWorldRecenterCameraAction(standalonePlayerState)) return false;
        centerCameraOnStandalonePlayer(standalonePlayerState);
        return true;
      }
    }
  };
  const applyMainMenuShellAction = (actionType: MainMenuShellActionType): boolean => {
    if (currentScreen !== 'main-menu' || loop === null) return false;

    if (
      (actionType === 'export-world-save' ||
        actionType === 'import-world-save' ||
        actionType === 'clear-persisted-world-session' ||
        actionType === 'start-fresh-world-session' ||
        actionType === 'reset-shell-toggle-preferences') &&
      !worldSessionStarted
    ) {
      return false;
    }

    switch (actionType) {
      case 'enter-or-resume-world-session':
        enterOrResumeWorldSessionFromMainMenu();
        return true;
      case 'export-world-save':
        return exportPausedMainMenuWorldSave();
      case 'import-world-save':
        void importPausedMainMenuWorldSave();
        return true;
      case 'clear-persisted-world-session':
        return clearPausedMainMenuPersistedWorldSession();
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
  let entityRegistry = new EntityRegistry();
  let standalonePlayerEntityId: EntityId | null = null;
  let standalonePlayerDeathState: PlayerDeathState | null = null;
  let standalonePlayerInventoryState = createDefaultPlayerInventoryState();
  let standalonePlayerEquipmentState = createDefaultPlayerEquipmentState();
  let hostileSlimeEntityIds: EntityId[] = [];
  let passiveBunnyEntityIds: EntityId[] = [];
  let droppedItemEntityIds: EntityId[] = [];
  let fireboltEntityIds: EntityId[] = [];
  let pendingStarterWandFireboltHitEvents: StarterWandFireboltHitEvent[] = [];
  let hostileSlimeSpawnerState = createHostileSlimeSpawnerState();
  let passiveBunnySpawnerState = createPassiveBunnySpawnerState();
  let pendingStandalonePlayerFixedStepResult: StandalonePlayerFixedStepResult | null = null;
  let playerSpawnNeedsRefresh = false;
  let cameraFollowOffset: CameraFollowOffset = { x: 0, y: 0 };
  let lastAppliedPlayerFollowCameraPosition: CameraFollowPoint | null = null;
  let lastPlayerGroundedTransitionEvent: PlayerGroundedTransitionEvent | null = null;
  let lastPlayerFacingTransitionEvent: PlayerFacingTransitionEvent | null = null;
  let lastPlayerRespawnEvent: PlayerRespawnEvent | null = null;
  let lastPlayerLandingDamageEvent: PlayerLandingDamageEvent | null = null;
  let lastPlayerDrowningDamageEvent: PlayerDrowningDamageEvent | null = null;
  let lastPlayerLavaDamageEvent: PlayerLavaDamageEvent | null = null;
  let lastPlayerDeathCauseEvent: PlayerDeathCauseEvent | null = null;
  let lastHostileSlimePlayerContactEvent: HostileSlimePlayerContactEvent | null = null;
  let lastPlayerWallContactTransitionEvent: PlayerWallContactTransitionEvent | null = null;
  let lastPlayerCeilingContactTransitionEvent: PlayerCeilingContactTransitionEvent | null = null;
  let latestStandalonePlayerDeathHoldStatus: StandalonePlayerDeathHoldTelemetryStatus = 'none';
  let standalonePlayerDeathCount = 0;
  let standalonePlayerRenderPresentationState = createStandalonePlayerRenderPresentationState();
  let starterAxeChoppingState = createStarterAxeChoppingState();
  let starterMeleeWeaponState = createStarterMeleeWeaponState();
  let starterSpearState = createStarterSpearState();
  let starterPickaxeMiningState = createStarterPickaxeMiningState();
  let starterBugNetState = createStarterBugNetState();
  let starterWandCooldownState = createStarterWandCooldownState();
  let playerHealingPotionCooldownState = createPlayerHealingPotionCooldownState();
  let grassGrowthState = createGrassGrowthState();
  let smallTreeGrowthState = createSmallTreeGrowthState();
  const smallTreeSaplingTileId = getSmallTreeSaplingTileId();
  const trackedSmallTreeGrowthAnchors = new Map<string, SmallTreeGrowthTrackedAnchor>();
  const trackedSmallTreeGrowthResidentChunkKeys = new Set<string>();

  const createSmallTreeGrowthAnchorKey = (anchorTileX: number, anchorTileY: number): string =>
    `${anchorTileX},${anchorTileY}`;
  const createSmallTreeGrowthResidentChunkKey = (chunkX: number, chunkY: number): string =>
    `${chunkX},${chunkY}`;
  const clearTrackedSmallTreeGrowthAnchors = (): void => {
    trackedSmallTreeGrowthAnchors.clear();
    trackedSmallTreeGrowthResidentChunkKeys.clear();
  };
  const rebuildTrackedSmallTreeGrowthAnchorsFromSnapshot = (
    snapshot: WorldSaveEnvelope['worldSnapshot']
  ): void => {
    clearTrackedSmallTreeGrowthAnchors();
    for (const trackedAnchor of collectTrackedPlantedSmallTreeAnchorsFromWorldSnapshot(snapshot)) {
      trackedSmallTreeGrowthAnchors.set(
        createSmallTreeGrowthAnchorKey(trackedAnchor.anchorTileX, trackedAnchor.anchorTileY),
        trackedAnchor
      );
    }
    for (const residentChunk of snapshot.residentChunks) {
      trackedSmallTreeGrowthResidentChunkKeys.add(
        createSmallTreeGrowthResidentChunkKey(residentChunk.coord.x, residentChunk.coord.y)
      );
    }
  };
  const refreshTrackedSmallTreeGrowthAnchor = (anchorTileX: number, anchorTileY: number): void => {
    const trackedAnchorKey = createSmallTreeGrowthAnchorKey(anchorTileX, anchorTileY);
    if (
      renderer.getTile(anchorTileX, anchorTileY) === PROCEDURAL_GRASS_SURFACE_TILE_ID &&
      renderer.getTile(anchorTileX, anchorTileY - 1) === smallTreeSaplingTileId
    ) {
      trackedSmallTreeGrowthAnchors.set(trackedAnchorKey, {
        anchorTileX,
        anchorTileY
      });
      return;
    }

    trackedSmallTreeGrowthAnchors.delete(trackedAnchorKey);
  };
  const refreshTrackedSmallTreeGrowthAnchorsAroundTileEdit = (
    worldTileX: number,
    worldTileY: number
  ): void => {
    refreshTrackedSmallTreeGrowthAnchor(worldTileX, worldTileY);
    refreshTrackedSmallTreeGrowthAnchor(worldTileX, worldTileY + 1);
  };
  const registerTrackedSmallTreeGrowthAnchorsFromResidentChunk = (
    chunkX: number,
    chunkY: number
  ): void => {
    const baseWorldTileX = chunkX * CHUNK_SIZE;
    const baseWorldTileY = chunkY * CHUNK_SIZE;

    for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
      for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
        const worldTileX = baseWorldTileX + localX;
        const worldTileY = baseWorldTileY + localY;
        if (renderer.getTile(worldTileX, worldTileY) !== smallTreeSaplingTileId) {
          continue;
        }

        refreshTrackedSmallTreeGrowthAnchor(worldTileX, worldTileY + 1);
      }
    }
  };
  const syncTrackedSmallTreeGrowthAnchorsWithResidentChunks = (): void => {
    const residentChunkBounds = renderer.getResidentChunkBounds();
    if (residentChunkBounds === null) {
      trackedSmallTreeGrowthResidentChunkKeys.clear();
      return;
    }

    const residentChunkKeys = new Set<string>();
    for (let chunkY = residentChunkBounds.minChunkY; chunkY <= residentChunkBounds.maxChunkY; chunkY += 1) {
      for (
        let chunkX = residentChunkBounds.minChunkX;
        chunkX <= residentChunkBounds.maxChunkX;
        chunkX += 1
      ) {
        if (!renderer.hasResidentChunk(chunkX, chunkY)) {
          continue;
        }

        const residentChunkKey = createSmallTreeGrowthResidentChunkKey(chunkX, chunkY);
        residentChunkKeys.add(residentChunkKey);
        if (trackedSmallTreeGrowthResidentChunkKeys.has(residentChunkKey)) {
          continue;
        }

        registerTrackedSmallTreeGrowthAnchorsFromResidentChunk(chunkX, chunkY);
        trackedSmallTreeGrowthResidentChunkKeys.add(residentChunkKey);
      }
    }

    for (const trackedResidentChunkKey of trackedSmallTreeGrowthResidentChunkKeys) {
      if (residentChunkKeys.has(trackedResidentChunkKey)) {
        continue;
      }

      trackedSmallTreeGrowthResidentChunkKeys.delete(trackedResidentChunkKey);
    }
  };

  const getStandalonePlayerState = (): PlayerState | null => {
    if (standalonePlayerEntityId === null) {
      return null;
    }
    return entityRegistry.getEntityState<PlayerState>(standalonePlayerEntityId);
  };
  const getStandalonePlayerDeathState = (): PlayerDeathState | null =>
    standalonePlayerDeathState === null
      ? null
      : {
          respawnSecondsRemaining: standalonePlayerDeathState.respawnSecondsRemaining
        };
  const getStandalonePlayerInventoryState = (): PlayerInventoryState =>
    clonePlayerInventoryState(standalonePlayerInventoryState);
  const getStandalonePlayerEquipmentState = (): PlayerEquipmentState =>
    clonePlayerEquipmentState(standalonePlayerEquipmentState);
  const getSelectedStandalonePlayerInventoryStack = () =>
    standalonePlayerInventoryState.hotbar[standalonePlayerInventoryState.selectedHotbarSlotIndex] ?? null;
  const buildStandalonePlayerMovementIntent = (): PlayerMovementIntent => {
    const movementIntent = input.getPlayerMovementIntent();
    if (getSelectedStandalonePlayerInventoryStack()?.itemId !== STARTER_UMBRELLA_ITEM_ID) {
      return movementIntent;
    }

    return input.getPlayerInputTelemetry().jumpHeld === true
      ? {
          ...movementIntent,
          glideHeld: true
        }
      : movementIntent;
  };
  const resolveHotbarOverlayHealingPotionCooldownFillNormalized = (): number | null => {
    if (playerHealingPotionCooldownState.secondsRemaining <= 0) {
      return null;
    }

    return Math.max(
      0,
      Math.min(
        1,
        playerHealingPotionCooldownState.secondsRemaining /
          DEFAULT_HEALING_POTION_USE_COOLDOWN_SECONDS
      )
    );
  };
  const resolveHotbarOverlayStarterWandCooldownFillNormalized = (): number | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (
      selectedStack?.itemId !== STARTER_WAND_ITEM_ID ||
      starterWandCooldownState.secondsRemaining <= 0
    ) {
      return null;
    }

    return Math.max(
      0,
      Math.min(
        1,
        starterWandCooldownState.secondsRemaining /
          DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS
      )
    );
  };
  const resolveHotbarOverlayStarterWandManaReadout = () => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    const standalonePlayerState = getStandalonePlayerState();
    if (selectedStack?.itemId !== STARTER_WAND_ITEM_ID || standalonePlayerState === null) {
      return null;
    }
    if (standalonePlayerState.maxMana <= 0) {
      return null;
    }

    return {
      currentMana: standalonePlayerState.mana,
      maxMana: standalonePlayerState.maxMana,
      manaCost: DEFAULT_STARTER_WAND_MANA_COST
    };
  };
  const resolveHotbarOverlayHeartCrystalBlockedReason = (): 'dead' | 'max-health-cap' | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== HEART_CRYSTAL_ITEM_ID) {
      return null;
    }

    const standalonePlayerState = getStandalonePlayerState();
    if (standalonePlayerState === null) {
      return null;
    }
    if (
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return 'dead';
    }
    if (standalonePlayerState.maxHealth >= DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP) {
      return 'max-health-cap';
    }
    return null;
  };
  const resolveHotbarOverlayStarterMeleeWeaponSwingFeedback = ():
    | {
        phase: 'windup' | 'active' | 'recovery';
        timingFillNormalized: number;
      }
    | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_MELEE_WEAPON_ITEM_ID) {
      return null;
    }

    const activeSwing = starterMeleeWeaponState.activeSwing;
    if (activeSwing === null) {
      return null;
    }

    const phaseDurationSeconds =
      activeSwing.phase === 'windup'
        ? STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS
        : activeSwing.phase === 'active'
          ? STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS
          : STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS;

    return {
      phase: activeSwing.phase,
      timingFillNormalized: Math.max(
        0,
        Math.min(1, activeSwing.secondsRemaining / phaseDurationSeconds)
      )
    };
  };
  const resolveHotbarOverlayStarterAxeSwingFeedback = ():
    | {
        phase: 'windup' | 'active' | 'recovery';
        timingFillNormalized: number;
      }
    | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_AXE_ITEM_ID) {
      return null;
    }

    const activeSwing = starterAxeChoppingState.activeSwing;
    if (activeSwing === null) {
      return null;
    }

    const phaseDurationSeconds =
      activeSwing.phase === 'windup'
        ? STARTER_AXE_SWING_WINDUP_SECONDS
        : activeSwing.phase === 'active'
          ? STARTER_AXE_SWING_ACTIVE_SECONDS
          : STARTER_AXE_SWING_RECOVERY_SECONDS;

    return {
      phase: activeSwing.phase,
      timingFillNormalized: Math.max(
        0,
        Math.min(1, activeSwing.phaseSecondsRemaining / phaseDurationSeconds)
      )
    };
  };
  const resolveHotbarOverlayStarterPickaxeSwingFeedback = ():
    | {
        phase: 'windup' | 'active' | 'recovery';
        timingFillNormalized: number;
      }
    | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_PICKAXE_ITEM_ID) {
      return null;
    }

    const activeSwing = starterPickaxeMiningState.activeSwing;
    if (activeSwing === null) {
      return null;
    }

    const phaseDurationSeconds =
      activeSwing.phase === 'windup'
        ? STARTER_PICKAXE_SWING_WINDUP_SECONDS
        : activeSwing.phase === 'active'
          ? STARTER_PICKAXE_SWING_ACTIVE_SECONDS
          : STARTER_PICKAXE_SWING_RECOVERY_SECONDS;

    return {
      phase: activeSwing.phase,
      timingFillNormalized: Math.max(
        0,
        Math.min(1, activeSwing.phaseSecondsRemaining / phaseDurationSeconds)
      )
    };
  };
  const resolveHotbarOverlayStarterSpearThrustFeedback = ():
    | {
        phase: 'windup' | 'active' | 'recovery';
        timingFillNormalized: number;
      }
    | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_SPEAR_ITEM_ID) {
      return null;
    }

    const activeThrust = starterSpearState.activeThrust;
    if (activeThrust === null) {
      return null;
    }

    const phaseDurationSeconds =
      activeThrust.phase === 'windup'
        ? STARTER_SPEAR_THRUST_WINDUP_SECONDS
        : activeThrust.phase === 'active'
          ? STARTER_SPEAR_THRUST_ACTIVE_SECONDS
          : STARTER_SPEAR_THRUST_RECOVERY_SECONDS;

    return {
      phase: activeThrust.phase,
      timingFillNormalized: Math.max(
        0,
        Math.min(1, activeThrust.secondsRemaining / phaseDurationSeconds)
      )
    };
  };
  const resolveHotbarOverlayStarterBugNetSwingFeedback = ():
    | {
        phase: 'windup' | 'active' | 'recovery';
        timingFillNormalized: number;
      }
    | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_BUG_NET_ITEM_ID) {
      return null;
    }

    const activeSwing = starterBugNetState.activeSwing;
    if (activeSwing === null) {
      return null;
    }

    const phaseDurationSeconds =
      activeSwing.phase === 'windup'
        ? STARTER_BUG_NET_SWING_WINDUP_SECONDS
        : activeSwing.phase === 'active'
          ? STARTER_BUG_NET_SWING_ACTIVE_SECONDS
          : STARTER_BUG_NET_SWING_RECOVERY_SECONDS;

    return {
      phase: activeSwing.phase,
      timingFillNormalized: Math.max(
        0,
        Math.min(1, activeSwing.secondsRemaining / phaseDurationSeconds)
      )
    };
  };
  const syncHotbarOverlayState = (): void => {
    hotbarOverlay.update(standalonePlayerInventoryState, {
      starterAxeSwingFeedback: resolveHotbarOverlayStarterAxeSwingFeedback(),
      healingPotionCooldownFillNormalized:
        resolveHotbarOverlayHealingPotionCooldownFillNormalized(),
      starterWandManaReadout: resolveHotbarOverlayStarterWandManaReadout(),
      starterWandCooldownFillNormalized:
        resolveHotbarOverlayStarterWandCooldownFillNormalized(),
      heartCrystalBlockedReason: resolveHotbarOverlayHeartCrystalBlockedReason(),
      starterMeleeWeaponSwingFeedback: resolveHotbarOverlayStarterMeleeWeaponSwingFeedback(),
      starterPickaxeSwingFeedback: resolveHotbarOverlayStarterPickaxeSwingFeedback(),
      starterSpearThrustFeedback: resolveHotbarOverlayStarterSpearThrustFeedback(),
      starterBugNetSwingFeedback: resolveHotbarOverlayStarterBugNetSwingFeedback()
    });
  };
  const resolveCraftingMissingIngredientsLabel = (
    recipeEvaluation: ReturnType<typeof evaluatePlayerCraftingRecipe>
  ): string => {
    const missingIngredients = recipeEvaluation.ingredients.filter(
      (ingredient) => ingredient.missingAmount > 0
    );
    if (missingIngredients.length === 0) {
      return 'Missing ingredients';
    }

    return `Missing ${missingIngredients
      .map(
        (ingredient) =>
          `${ingredient.missingAmount} ${getPlayerInventoryItemDefinition(ingredient.itemId).label}`
      )
      .join(' + ')}`;
  };
  const resolveCraftingRecipeDisabledReason = (
    recipeEvaluation: ReturnType<typeof evaluatePlayerCraftingRecipe>
  ): string | null => {
    switch (recipeEvaluation.blocker) {
      case 'missing-station': {
        const requiredStationId = recipeEvaluation.recipe.requiredStationId;
        return requiredStationId === null
          ? 'Requires nearby station'
          : `Requires nearby ${getPlayerCraftingStationLabel(requiredStationId)}`;
      }
      case 'inventory-full':
        return 'Inventory full';
      case 'missing-ingredients':
        return resolveCraftingMissingIngredientsLabel(recipeEvaluation);
      default:
        return null;
    }
  };
  const resolveItemCatalogPanelRecipeAvailabilityLabel = (
    recipeEvaluation: ReturnType<typeof evaluatePlayerCraftingRecipe>
  ): string => {
    const disabledReason = resolveCraftingRecipeDisabledReason(recipeEvaluation);
    return disabledReason === null ? 'Ready to craft' : `Blocked: ${disabledReason}`;
  };
  const resolveItemCatalogPanelResultSummaryLabel = (): string => {
    const itemCatalogEntryCount = searchPlayerItemCatalog(itemCatalogSearchQuery).length;
    const recipeCatalogEntryCount = searchPlayerRecipeCatalog(itemCatalogSearchQuery).length;
    const trimmedQuery = itemCatalogSearchQuery.trim();
    if (trimmedQuery.length === 0) {
      return `${itemCatalogEntryCount} ${itemCatalogEntryCount === 1 ? 'item' : 'items'} | ${
        recipeCatalogEntryCount
      } ${recipeCatalogEntryCount === 1 ? 'recipe' : 'recipes'}`;
    }
    return `${itemCatalogEntryCount} matching ${
      itemCatalogEntryCount === 1 ? 'item' : 'items'
    } | ${recipeCatalogEntryCount} matching ${
      recipeCatalogEntryCount === 1 ? 'recipe' : 'recipes'
    }`;
  };
  const resolveItemCatalogPanelItemEmptyLabel = (): string => {
    const trimmedQuery = itemCatalogSearchQuery.trim();
    return trimmedQuery.length > 0
      ? `No items match "${trimmedQuery}"`
      : 'No catalog items available';
  };
  const resolveItemCatalogPanelRecipeEmptyLabel = (): string => {
    const trimmedQuery = itemCatalogSearchQuery.trim();
    return trimmedQuery.length > 0
      ? `No recipes match "${trimmedQuery}"`
      : 'No catalog recipes available';
  };
  const canSpawnStandalonePlayerCatalogItem = (itemId: PlayerInventoryItemId): boolean =>
    addPlayerInventoryItemStack(standalonePlayerInventoryState, itemId, 1).remainingAmount === 0;
  const createItemCatalogPanelItemViewModels = (): ItemCatalogPanelItemViewModel[] =>
    searchPlayerItemCatalog(itemCatalogSearchQuery).map((entry): ItemCatalogPanelItemViewModel => {
      const inventoryAmount = getPlayerInventoryItemAmount(standalonePlayerInventoryState, entry.itemId);
      const enabled = canSpawnStandalonePlayerCatalogItem(entry.itemId);
      return {
        itemId: entry.itemId,
        label: entry.label,
        detailsLabel: `Id: ${entry.itemId} | Hotbar: ${entry.hotbarLabel} | Max stack: ${entry.maxStackSize}`,
        inventoryLabel: enabled
          ? `Have: ${inventoryAmount} | Spawn +1`
          : `Have: ${inventoryAmount} | Inventory full`,
        enabled,
        disabledReason: enabled ? null : 'Inventory full'
      };
    });
  const createItemCatalogPanelRecipeViewModels = (
    playerState: Pick<PlayerState, 'position' | 'size'> | null
  ): ItemCatalogPanelRecipeViewModel[] =>
    searchPlayerRecipeCatalog(itemCatalogSearchQuery).map((entry): ItemCatalogPanelRecipeViewModel => {
      const recipeEvaluation = evaluatePlayerCraftingRecipe({
        inventoryState: standalonePlayerInventoryState,
        recipeId: entry.recipeId,
        playerState,
        world: {
          getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
        }
      });
      return {
        recipeId: entry.recipeId,
        label: entry.label,
        outputLabel: entry.outputLabel,
        ingredientsLabel: entry.ingredientsLabel,
        stationRequirementLabel: entry.stationRequirementLabel,
        availabilityLabel: resolveItemCatalogPanelRecipeAvailabilityLabel(recipeEvaluation),
        enabled: recipeEvaluation.craftable,
        disabledReason: resolveCraftingRecipeDisabledReason(recipeEvaluation)
      };
    });
  const createCraftingPanelRecipeViewModels = (
    playerState: Pick<PlayerState, 'position' | 'size'> | null
  ): CraftingPanelRecipeViewModel[] =>
    getPlayerCraftingRecipeDefinitions().map((recipe): CraftingPanelRecipeViewModel => {
      const recipeEvaluation = evaluatePlayerCraftingRecipe({
        inventoryState: standalonePlayerInventoryState,
        recipeId: recipe.id,
        playerState,
        world: {
          getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
        }
      });
      return {
        recipeId: recipe.id,
        label: recipe.label,
        ingredientsLabel: recipe.ingredients
          .map((ingredient) => `${ingredient.amount} ${getPlayerInventoryItemDefinition(ingredient.itemId).label}`)
          .join(' + '),
        outputLabel: `+${recipe.output.amount} ${getPlayerInventoryItemDefinition(recipe.output.itemId).hotbarLabel}`,
        availabilityLabel: resolveItemCatalogPanelRecipeAvailabilityLabel(recipeEvaluation),
        enabled: recipeEvaluation.craftable,
        disabledReason: resolveCraftingRecipeDisabledReason(recipeEvaluation)
      };
    });
  const createCraftingPanelStationViewModels = (
    playerState: Pick<PlayerState, 'position' | 'size'> | null
  ): CraftingPanelStationViewModel[] =>
    getPlayerCraftingStationDefinitions().map((station): CraftingPanelStationViewModel => ({
      stationId: station.id,
      label: station.label,
      inRange:
        playerState !== null &&
        findNearestPlayerCraftingStationInRange({
          stationId: station.id,
          world: {
            getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
          },
          playerState
        }) !== null
    }));
  const createEquipmentPanelSlotViewModels = (): EquipmentPanelSlotViewModel[] =>
    (['head', 'body', 'legs'] as const).map((slotId) => {
      const starterItemId = getStarterArmorItemIdForSlot(slotId);
      const starterArmorDefinition = getPlayerArmorItemDefinition(starterItemId);
      return {
        slotId,
        slotLabel: getPlayerEquipmentSlotLabel(slotId),
        itemLabel: starterArmorDefinition.label,
        defenseLabel: `+${starterArmorDefinition.defense} DEF`,
        equipped: standalonePlayerEquipmentState[slotId] === starterItemId
      };
    });
  const syncCraftingPanelState = (): void => {
    const standalonePlayerState = getStandalonePlayerState();
    craftingPanel.update({
      stations: createCraftingPanelStationViewModels(standalonePlayerState),
      recipes: createCraftingPanelRecipeViewModels(standalonePlayerState)
    });
  };
  const syncEquipmentPanelState = (): void => {
    equipmentPanel.update({
      totalDefense: getPlayerEquipmentTotalDefense(standalonePlayerEquipmentState),
      slots: createEquipmentPanelSlotViewModels()
    });
  };
  const syncItemCatalogPanelState = (): void => {
    const standalonePlayerState = getStandalonePlayerState();
    itemCatalogPanel.update({
      searchQuery: itemCatalogSearchQuery,
      resultSummaryLabel: resolveItemCatalogPanelResultSummaryLabel(),
      itemEmptyLabel: resolveItemCatalogPanelItemEmptyLabel(),
      items: createItemCatalogPanelItemViewModels(),
      recipeEmptyLabel: resolveItemCatalogPanelRecipeEmptyLabel(),
      recipes: createItemCatalogPanelRecipeViewModels(standalonePlayerState)
    });
  };
  const applyStandalonePlayerInventoryState = (inventoryState: PlayerInventoryState): void => {
    standalonePlayerInventoryState = clonePlayerInventoryState(inventoryState);
    syncHotbarOverlayState();
    syncCraftingPanelState();
    syncItemCatalogPanelState();
  };
  const applyStandalonePlayerEquipmentState = (equipmentState: PlayerEquipmentState): void => {
    standalonePlayerEquipmentState = clonePlayerEquipmentState(equipmentState);
    syncEquipmentPanelState();
  };
  const toggleStandalonePlayerStarterArmorSlot = (
    slotId: 'head' | 'body' | 'legs'
  ): void => {
    applyStandalonePlayerEquipmentState(toggleStarterArmorForSlot(standalonePlayerEquipmentState, slotId));
  };
  const tryCraftSelectedPlayerRecipe = (recipeId: PlayerCraftingRecipeId): boolean => {
    const craftResult = tryCraftPlayerRecipe({
      inventoryState: standalonePlayerInventoryState,
      recipeId,
      playerState: getStandalonePlayerState(),
      world: {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
      }
    });
    if (!craftResult.crafted) {
      syncCraftingPanelState();
      syncItemCatalogPanelState();
      return false;
    }

    applyStandalonePlayerInventoryState(craftResult.nextInventoryState);
    return true;
  };
  const trySpawnStandalonePlayerCatalogItem = (itemId: PlayerInventoryItemId): boolean => {
    const addResult = addPlayerInventoryItemStack(standalonePlayerInventoryState, itemId, 1);
    if (addResult.addedAmount <= 0) {
      syncItemCatalogPanelState();
      return false;
    }

    applyStandalonePlayerInventoryState(addResult.state);
    return true;
  };
  const applySelectedStandalonePlayerHotbarSlotConsumption = (): boolean => {
    const consumeResult = consumePlayerInventoryHotbarSlotItem(
      standalonePlayerInventoryState,
      standalonePlayerInventoryState.selectedHotbarSlotIndex
    );
    if (!consumeResult.consumed) {
      return false;
    }

    applyStandalonePlayerInventoryState(consumeResult.state);
    return true;
  };
  const tryUseSelectedHealingPotion = (): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const useResult = tryUsePlayerHealingPotion(
      standalonePlayerState,
      playerHealingPotionCooldownState
    );
    if (!useResult.consumed) {
      syncHotbarOverlayState();
      return false;
    }
    if (!applySelectedStandalonePlayerHotbarSlotConsumption()) {
      return false;
    }

    playerHealingPotionCooldownState = useResult.nextCooldownState;
    syncHotbarOverlayState();
    setStandalonePlayerState(useResult.nextPlayerState);
    return true;
  };
  const tryUseSelectedHeartCrystal = (): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (standalonePlayerState === null) {
      return false;
    }
    if (
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      syncHotbarOverlayState();
      return false;
    }

    const useResult = tryUsePlayerHeartCrystal(standalonePlayerState);
    if (!useResult.consumed) {
      syncHotbarOverlayState();
      return false;
    }
    if (!applySelectedStandalonePlayerHotbarSlotConsumption()) {
      return false;
    }

    setStandalonePlayerState(useResult.nextPlayerState);
    return true;
  };
  const selectStandalonePlayerHotbarSlot = (slotIndex: number): void => {
    applyStandalonePlayerInventoryState(
      setPlayerInventorySelectedHotbarSlot(standalonePlayerInventoryState, slotIndex)
    );
  };
  const moveSelectedStandalonePlayerHotbarSlot = (direction: -1 | 1): void => {
    applyStandalonePlayerInventoryState(
      movePlayerInventorySelectedHotbarSlot(standalonePlayerInventoryState, direction)
    );
  };
  syncHotbarOverlayState();
  hotbarOverlay.setVisible(false);
  syncCraftingPanelState();
  craftingPanel.setVisible(false);
  syncEquipmentPanelState();
  equipmentPanel.setVisible(false);
  syncItemCatalogPanelState();
  itemCatalogPanel.setVisible(false);
  const getHostileSlimeEntityStates = (): Array<{ id: EntityId; state: HostileSlimeState }> => {
    const activeHostileSlimes: Array<{ id: EntityId; state: HostileSlimeState }> = [];
    const nextHostileSlimeEntityIds: EntityId[] = [];
    for (const entityId of hostileSlimeEntityIds) {
      const state = entityRegistry.getEntityState<HostileSlimeState>(entityId);
      if (state === null) {
        continue;
      }
      nextHostileSlimeEntityIds.push(entityId);
      activeHostileSlimes.push({
        id: entityId,
        state
      });
    }
    hostileSlimeEntityIds = nextHostileSlimeEntityIds;
    return activeHostileSlimes;
  };
  const getPassiveBunnyEntityStates = (): Array<{ id: EntityId; state: PassiveBunnyState }> => {
    const activePassiveBunnies: Array<{ id: EntityId; state: PassiveBunnyState }> = [];
    const nextPassiveBunnyEntityIds: EntityId[] = [];
    for (const entityId of passiveBunnyEntityIds) {
      const state = entityRegistry.getEntityState<PassiveBunnyState>(entityId);
      if (state === null) {
        continue;
      }
      nextPassiveBunnyEntityIds.push(entityId);
      activePassiveBunnies.push({
        id: entityId,
        state
      });
    }
    passiveBunnyEntityIds = nextPassiveBunnyEntityIds;
    return activePassiveBunnies;
  };
  const getDroppedItemEntityStates = (): Array<{ id: EntityId; state: DroppedItemState }> => {
    const activeDroppedItems: Array<{ id: EntityId; state: DroppedItemState }> = [];
    const nextDroppedItemEntityIds: EntityId[] = [];
    for (const entityId of droppedItemEntityIds) {
      const state = entityRegistry.getEntityState<DroppedItemState>(entityId);
      if (state === null) {
        continue;
      }
      nextDroppedItemEntityIds.push(entityId);
      activeDroppedItems.push({
        id: entityId,
        state
      });
    }
    droppedItemEntityIds = nextDroppedItemEntityIds;
    return activeDroppedItems;
  };
  const getStarterWandFireboltEntityStates = (): Array<{
    id: EntityId;
    state: StarterWandFireboltState;
  }> => {
    const activeFirebolts: Array<{ id: EntityId; state: StarterWandFireboltState }> = [];
    const nextFireboltEntityIds: EntityId[] = [];
    for (const entityId of fireboltEntityIds) {
      const state = entityRegistry.getEntityState<StarterWandFireboltState>(entityId);
      if (state === null) {
        continue;
      }
      nextFireboltEntityIds.push(entityId);
      activeFirebolts.push({
        id: entityId,
        state
      });
    }
    fireboltEntityIds = nextFireboltEntityIds;
    return activeFirebolts;
  };
  const getDroppedItemStates = (): DroppedItemState[] =>
    getDroppedItemEntityStates().map(({ state }) => cloneDroppedItemState(state));
  const createHostileSlimeDefeatDropState = (
    slimeState: Pick<HostileSlimeState, 'position' | 'size'>
  ): DroppedItemState =>
    createDroppedItemState({
      position: {
        x: slimeState.position.x,
        y: slimeState.position.y - slimeState.size.height * 0.5
      },
      itemId: HOSTILE_SLIME_GEL_DROP_ITEM_ID,
      amount: HOSTILE_SLIME_GEL_DROP_AMOUNT
    });
  const mergeDroppedItemIntoNearbyPickup = (
    droppedItemState: DroppedItemState
  ): DroppedItemState | null => {
    const activeDroppedItems = getDroppedItemEntityStates();
    const mergeCascadeResult = resolveDroppedItemStackMergeCascade(
      activeDroppedItems.map((droppedItem) => droppedItem.state),
      droppedItemState
    );
    if (mergeCascadeResult.totalMergedAmount <= 0) {
      return droppedItemState;
    }

    for (const targetResult of mergeCascadeResult.targetResults) {
      const mergeTarget = activeDroppedItems[targetResult.targetIndex];
      entityRegistry.setEntityState(mergeTarget.id, targetResult.nextTargetDroppedItemState);
    }

    return mergeCascadeResult.nextSourceDroppedItemState;
  };
  const resolveTrackedHostileSlimeState = (
    playerState: PlayerState | null,
    activeHostileSlimes = getHostileSlimeEntityStates()
  ): HostileSlimeState | null => {
    if (playerState === null) {
      return null;
    }

    let trackedHostileSlime: { id: EntityId; state: HostileSlimeState } | null = null;
    let trackedDistanceSquared = Number.POSITIVE_INFINITY;
    for (const hostileSlime of activeHostileSlimes) {
      const dx = hostileSlime.state.position.x - playerState.position.x;
      const dy = hostileSlime.state.position.y - playerState.position.y;
      const distanceSquared = dx * dx + dy * dy;
      if (
        trackedHostileSlime === null ||
        distanceSquared < trackedDistanceSquared ||
        (distanceSquared === trackedDistanceSquared && hostileSlime.id < trackedHostileSlime.id)
      ) {
        trackedHostileSlime = hostileSlime;
        trackedDistanceSquared = distanceSquared;
      }
    }

    return trackedHostileSlime?.state ?? null;
  };
  const createCurrentWorldSessionShellProfile = () =>
    createWorldSessionShellProfileEnvelope({
      shellState: readWorldSessionShellState(),
      shellActionKeybindings
    });
  const createCurrentWorldSessionSaveEnvelope = (): WorldSaveEnvelope => {
    syncManualCameraFollowStateFromLiveCamera();
    return createWorldSessionSaveEnvelope({
      source: {
        createWorldSnapshot: () => renderer.createWorldSnapshot(),
        getStandalonePlayerState,
        getStandalonePlayerDeathState,
        getStandalonePlayerInventoryState,
        getStandalonePlayerEquipmentState,
        getDroppedItemStates,
        getCameraFollowOffset: () => cameraFollowOffset
      }
    });
  };
  const persistCurrentWorldSessionWithResult = ():
    | {
        status: 'persisted';
      }
    | {
        status: 'failed';
        reason: string;
      } => {
    if (!worldSessionStarted) {
      return {
        status: 'failed',
        reason: 'World session has not started.'
      };
    }
    if (currentScreen === 'main-menu' && pausedMainMenuWorldSaveCleared) {
      return {
        status: 'failed',
        reason: 'Browser resume save is intentionally cleared for this paused session.'
      };
    }

    try {
      const persisted = savePersistedWorldSaveEnvelope(
        worldSessionShellStateStorage,
        createCurrentWorldSessionSaveEnvelope()
      );
      worldSavePersistenceAvailable = persisted;
      if (persisted) {
        pausedMainMenuWorldSaveCleared = false;
        pausedMainMenuSavedWorldStatus = null;
        return {
          status: 'persisted'
        };
      }
      return {
        status: 'failed',
        reason:
          worldSessionShellStateStorage === null
            ? 'Browser storage is unavailable.'
            : 'Browser resume data was not updated.'
      };
    } catch (error) {
      console.warn('Failed to persist world session.', error);
      return {
        status: 'failed',
        reason: resolveThrownErrorReason(error)
      };
    }
  };
  const persistCurrentWorldSession = (): boolean =>
    persistCurrentWorldSessionWithResult().status === 'persisted';
  const clearPersistedCurrentWorldSession = (): boolean => {
    worldSavePersistenceAvailable = clearPersistedWorldSaveEnvelope(worldSessionShellStateStorage);
    return worldSavePersistenceAvailable;
  };
  const resolveClearPersistedCurrentWorldSessionFailureReason = (): string =>
    worldSessionShellStateStorage === null
      ? 'Browser storage is unavailable.'
      : 'Browser resume data was not deleted.';
  const exportPausedMainMenuShellProfile = (): PausedMainMenuShellProfileExportResult => {
    try {
      return {
        status: 'downloaded',
        fileName: downloadWorldSessionShellProfileEnvelope({
          envelope: createCurrentWorldSessionShellProfile()
        })
      };
    } catch (error) {
      console.warn('Failed to export shell profile.', error);
      return {
        status: 'failed',
        reason: resolveThrownErrorReason(error)
      };
    }
  };
  const resolveShellProfileImportPersistenceFailureReason = (
    shellStatePersisted: boolean,
    shellActionKeybindingsPersisted: boolean
  ): string => {
    if (!shellStatePersisted && !shellActionKeybindingsPersisted) {
      return worldSessionShellStateStorage === null
        ? 'Browser shell storage is unavailable.'
        : 'Browser shell visibility preferences and hotkeys were not updated.';
    }
    if (!shellStatePersisted) {
      return worldSessionShellStateStorage === null
        ? 'Browser shell storage is unavailable.'
        : 'Browser shell visibility preferences were not updated.';
    }
    if (!shellActionKeybindingsPersisted) {
      return worldSessionShellStateStorage === null
        ? 'Browser shell storage is unavailable.'
        : 'Browser shell hotkeys were not updated.';
    }

    return 'Browser shell storage is unavailable.';
  };
  const resolvePausedMainMenuShellProfileApplyChangeCategory = (
    shellStateChanged: boolean,
    shellActionKeybindingsChanged: boolean
  ): PausedMainMenuShellProfileApplyChangeCategory => {
    if (shellStateChanged && shellActionKeybindingsChanged) {
      return 'mixed';
    }
    if (shellStateChanged) {
      return 'toggle-only';
    }
    if (shellActionKeybindingsChanged) {
      return 'hotkey-only';
    }

    return 'none';
  };
  const applyImportedPausedMainMenuShellProfile = (
    envelope: WorldSessionShellProfileEnvelope
  ): PausedMainMenuShellProfileImportResult => {
    const shellStateChanged =
      createWorldSessionShellStateToggleChanges(readWorldSessionShellState(), envelope.shellState)
        .length > 0;
    const shellActionKeybindingsChanged = IN_WORLD_SHELL_ACTION_KEYBINDING_IDS.some(
      (actionType) => shellActionKeybindings[actionType] !== envelope.shellActionKeybindings[actionType]
    );
    const changeCategory = resolvePausedMainMenuShellProfileApplyChangeCategory(
      shellStateChanged,
      shellActionKeybindingsChanged
    );

    if (shellStateChanged) {
      applyWorldSessionShellState(envelope.shellState);
    }
    if (shellActionKeybindingsChanged) {
      applyShellActionKeybindingState(envelope.shellActionKeybindings);
    }

    const shellStatePersisted = saveWorldSessionShellState(
      worldSessionShellStateStorage,
      readWorldSessionShellState()
    );
    const shellActionKeybindingsPersisted = saveShellActionKeybindingState(
      worldSessionShellStateStorage,
      shellActionKeybindings
    );
    if (shellActionKeybindingsChanged) {
      shellActionKeybindingsCurrentSessionOnly = !shellActionKeybindingsPersisted;
    }
    worldSessionShellPersistenceAvailable =
      shellStatePersisted && shellActionKeybindingsPersisted;

    if (shellStatePersisted && shellActionKeybindingsPersisted) {
      return {
        status: 'applied',
        fileName: null,
        changeCategory
      };
    }

    return {
      status: 'persistence-failed',
      fileName: null,
      changeCategory,
      reason: resolveShellProfileImportPersistenceFailureReason(
        shellStatePersisted,
        shellActionKeybindingsPersisted
      )
    };
  };
  const applyPausedMainMenuShellProfilePreview = (): PausedMainMenuShellProfileImportResult => {
    if (pausedMainMenuShellProfilePreview === null) {
      return {
        status: 'failed',
        reason: 'No shell-profile preview is ready to apply.'
      };
    }

    const preview = pausedMainMenuShellProfilePreview;
    pausedMainMenuShellProfilePreview = null;
    const importResult = applyImportedPausedMainMenuShellProfile(preview.envelope);
    showMainMenuShellState();
    if (importResult.status === 'persistence-failed') {
      console.warn('Failed to persist imported shell profile.', importResult.reason);
      return {
        status: 'persistence-failed',
        fileName: preview.fileName,
        changeCategory: importResult.changeCategory,
        reason: importResult.reason
      };
    }
    if (importResult.status === 'applied') {
      return {
        status: 'applied',
        fileName: preview.fileName,
        changeCategory: importResult.changeCategory
      };
    }

    throw new Error(`Unexpected shell-profile apply result status: ${importResult.status}`);
  };
  const clearPausedMainMenuShellProfilePreview = (): PausedMainMenuShellProfilePreviewClearResult => {
    if (pausedMainMenuShellProfilePreview === null) {
      return {
        status: 'failed',
        reason: 'No shell-profile preview is ready to clear.'
      };
    }

    const preview = pausedMainMenuShellProfilePreview;
    pausedMainMenuShellProfilePreview = null;
    showMainMenuShellState();
    return {
      status: 'cleared',
      fileName: preview.fileName
    };
  };
  const importPausedMainMenuShellProfile = async (): Promise<PausedMainMenuShellProfileImportResult> => {
    try {
      const result = await pickWorldSessionShellProfileEnvelopeFromJsonPicker();
      switch (result.status) {
        case 'cancelled':
          return {
            status: 'cancelled'
          };
        case 'picker-start-failed':
          console.warn('Failed to start shell-profile import picker.', result.reason);
          return {
            status: 'picker-start-failed',
            reason: result.reason
          };
        case 'rejected':
          console.warn('Rejected imported shell profile.', result.reason);
          return {
            status: 'rejected',
            fileName: result.fileName,
            reason: result.reason
          };
        case 'selected': {
          pausedMainMenuShellProfilePreview = {
            fileName: result.fileName,
            envelope: result.envelope
          };
          showMainMenuShellState();
          return {
            status: 'previewed',
            fileName: result.fileName
          };
        }
      }
    } catch (error) {
      console.warn('Failed to import shell profile.', error);
      return {
        status: 'failed',
        reason: resolveThrownErrorReason(error)
      };
    }
  };
  const exportPausedMainMenuWorldSave = (): boolean => {
    try {
      pausedMainMenuExportResult = {
        status: 'downloaded',
        fileName: downloadWorldSaveEnvelope({
          envelope: createCurrentWorldSessionSaveEnvelope()
        })
      };
      pausedMainMenuRecentActivityAction = 'export-world-save';
      showMainMenuShellState();
      return true;
    } catch (error) {
      console.warn('Failed to export world save.', error);
      pausedMainMenuExportResult = {
        status: 'failed',
        reason: resolveThrownErrorReason(error)
      };
      pausedMainMenuRecentActivityAction = 'export-world-save';
      showMainMenuShellState();
      return false;
    }
  };
  const importPausedMainMenuWorldSave = async (): Promise<boolean> => {
    try {
      const result = await pickWorldSaveEnvelopeFromJsonPicker();
      switch (result.status) {
        case 'cancelled':
          pausedMainMenuImportResult = {
            status: 'cancelled'
          };
          pausedMainMenuRecentActivityAction = 'import-world-save';
          showMainMenuShellState();
          return false;
        case 'picker-start-failed':
          pausedMainMenuImportResult = {
            status: 'picker-start-failed',
            reason: result.reason
          };
          pausedMainMenuRecentActivityAction = 'import-world-save';
          console.warn('Failed to start world-save import picker.', result.reason);
          showMainMenuShellState();
          return false;
        case 'rejected':
          pausedMainMenuImportResult = {
            status: 'rejected',
            fileName: result.fileName,
            reason: result.reason
          };
          pausedMainMenuRecentActivityAction = 'import-world-save';
          console.warn('Rejected imported world save.', result.reason);
          showMainMenuShellState();
          return false;
        case 'selected': {
          const restoreResult = restorePausedWorldSessionFromSaveEnvelopeWithResult(result.envelope);
          if (restoreResult.status === 'restore-failed') {
            pausedMainMenuImportResult = {
              status: 'restore-failed',
              fileName: result.fileName,
              reason: restoreResult.reason
            };
            pausedMainMenuRecentActivityAction = 'import-world-save';
            showMainMenuShellState();
            return false;
          }
          if (restoreResult.status === 'persistence-failed') {
            pausedMainMenuImportResult = {
              status: 'persistence-failed',
              fileName: result.fileName,
              reason: restoreResult.reason
            };
            pausedMainMenuRecentActivityAction = 'import-world-save';
            showMainMenuShellState();
            return true;
          }
          pausedMainMenuImportResult = {
            status: 'accepted',
            fileName: result.fileName
          };
          pausedMainMenuRecentActivityAction = 'import-world-save';
          showMainMenuShellState();
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to import world save.', error);
      return false;
    }
  };
  const getStandalonePlayerRenderStateSnapshot =
    (): EntityRenderStateSnapshot<StandalonePlayerRenderState> | null => {
      if (standalonePlayerEntityId === null) {
        return null;
      }
      return entityRegistry.getRenderStateSnapshot<StandalonePlayerRenderState>(
        standalonePlayerEntityId
      );
    };
  const syncManualCameraFollowStateFromLiveCamera = (): void => {
    const syncedManualCameraFollow = syncManualCameraDeltaIntoFollowState(
      cameraFollowOffset,
      lastAppliedPlayerFollowCameraPosition,
      {
        x: camera.x,
        y: camera.y
      }
    );
    cameraFollowOffset = syncedManualCameraFollow.offset;
    lastAppliedPlayerFollowCameraPosition = syncedManualCameraFollow.lastAppliedCameraPosition;
  };
  const applyStandalonePlayerCameraFollowTarget = (focusPoint: CameraFollowPoint | null): void => {
    if (focusPoint === null) {
      lastAppliedPlayerFollowCameraPosition = null;
      return;
    }

    syncManualCameraFollowStateFromLiveCamera();
    const cameraPosition = resolveCameraPositionFromFollowTarget(focusPoint, cameraFollowOffset);
    camera.x = cameraPosition.x;
    camera.y = cameraPosition.y;
    lastAppliedPlayerFollowCameraPosition = cameraPosition;
  };
  const resolveStandalonePlayerRenderFrameFocusPoint = (
    renderAlpha: number
  ): CameraFollowPoint | null => {
    const playerRenderStateSnapshot = getStandalonePlayerRenderStateSnapshot();
    if (playerRenderStateSnapshot === null) {
      const standalonePlayerState = getStandalonePlayerState();
      return standalonePlayerState === null ? null : getPlayerCameraFocusPoint(standalonePlayerState);
    }

    const renderPosition = resolveInterpolatedEntityWorldPosition(
      playerRenderStateSnapshot,
      renderAlpha
    );
    return getPlayerCameraFocusPoint({
      ...playerRenderStateSnapshot.current,
      position: renderPosition
    });
  };
  const createRendererEntityFrameStates = (): RendererEntityFrameState[] => {
    const entityFrameStates: RendererEntityFrameState[] = [];
    for (const snapshotEntry of entityRegistry.getRenderStateSnapshots()) {
      switch (snapshotEntry.kind) {
        case STANDALONE_PLAYER_ENTITY_KIND:
          entityFrameStates.push({
            id: snapshotEntry.id,
            kind: STANDALONE_PLAYER_ENTITY_KIND,
            snapshot: {
              previous: snapshotEntry.previous as StandalonePlayerRenderState,
              current: snapshotEntry.current as StandalonePlayerRenderState
            }
          });
          break;
        case HOSTILE_SLIME_ENTITY_KIND:
          entityFrameStates.push({
            id: snapshotEntry.id,
            kind: HOSTILE_SLIME_ENTITY_KIND,
            snapshot: {
              previous: snapshotEntry.previous as HostileSlimeState,
              current: snapshotEntry.current as HostileSlimeState
            }
          });
          break;
        case PASSIVE_BUNNY_ENTITY_KIND:
          entityFrameStates.push({
            id: snapshotEntry.id,
            kind: PASSIVE_BUNNY_ENTITY_KIND,
            snapshot: {
              previous: snapshotEntry.previous as PassiveBunnyState,
              current: snapshotEntry.current as PassiveBunnyState
            }
          });
          break;
        case DROPPED_ITEM_ENTITY_KIND:
          entityFrameStates.push({
            id: snapshotEntry.id,
            kind: DROPPED_ITEM_ENTITY_KIND,
            snapshot: {
              previous: snapshotEntry.previous as DroppedItemState,
              current: snapshotEntry.current as DroppedItemState
            }
          });
          break;
        case STARTER_WAND_FIREBOLT_ENTITY_KIND:
          entityFrameStates.push({
            id: snapshotEntry.id,
            kind: STARTER_WAND_FIREBOLT_ENTITY_KIND,
            snapshot: {
              previous: snapshotEntry.previous as StarterWandFireboltState,
              current: snapshotEntry.current as StarterWandFireboltState
            }
          });
          break;
      }
    }
    return entityFrameStates;
  };
  const replaceWorldSessionEntityRegistry = (): void => {
    entityRegistry = new EntityRegistry();
    standalonePlayerEntityId = null;
    standalonePlayerDeathState = null;
    standalonePlayerDeathCount = 0;
    hostileSlimeEntityIds = [];
    passiveBunnyEntityIds = [];
    droppedItemEntityIds = [];
    fireboltEntityIds = [];
    pendingStarterWandFireboltHitEvents = [];
    hostileSlimeSpawnerState = createHostileSlimeSpawnerState();
    passiveBunnySpawnerState = createPassiveBunnySpawnerState();
    pendingStandalonePlayerFixedStepResult = null;
    latestStandalonePlayerDeathHoldStatus = 'none';
    standalonePlayerRenderPresentationState = createStandalonePlayerRenderPresentationState();
    starterAxeChoppingState = createStarterAxeChoppingState();
    starterMeleeWeaponState = createStarterMeleeWeaponState();
    starterSpearState = createStarterSpearState();
    starterPickaxeMiningState = createStarterPickaxeMiningState();
    starterBugNetState = createStarterBugNetState();
    starterWandCooldownState = createStarterWandCooldownState();
    playerHealingPotionCooldownState = createPlayerHealingPotionCooldownState();
    grassGrowthState = createGrassGrowthState();
    smallTreeGrowthState = createSmallTreeGrowthState();
    syncHotbarOverlayState();
  };
  const restoreStandalonePlayerSessionState = (
    playerState: PlayerState | null,
    deathState: PlayerDeathState | null
  ): void => {
    replaceWorldSessionEntityRegistry();
    resetStandalonePlayerTransitionState();
    lastAppliedPlayerFollowCameraPosition = null;
    standalonePlayerDeathState = deathState;
    latestStandalonePlayerDeathHoldStatus = deathState === null ? 'none' : 'holding';
    if (playerState === null) {
      return;
    }

    spawnStandalonePlayerEntity(playerState);
  };
  const setStandalonePlayerDeathState = (nextDeathState: PlayerDeathState | null): void => {
    standalonePlayerDeathState = nextDeathState;
    if (nextDeathState !== null) {
      latestStandalonePlayerDeathHoldStatus = 'holding';
    }
  };
  const setStandalonePlayerState = (
    nextPlayerState: PlayerState,
    options: SetEntityStateOptions = {}
  ): void => {
    if (standalonePlayerEntityId === null) {
      throw new Error('Cannot replace standalone player state before the entity is spawned');
    }
    entityRegistry.setEntityState(standalonePlayerEntityId, nextPlayerState, options);
  };
  const replacePendingStandalonePlayerFixedStepNextState = (
    nextPlayerState: PlayerState,
    deathCauseCandidates: readonly PlayerDeathCauseCandidate[] = []
  ): void => {
    if (pendingStandalonePlayerFixedStepResult === null) {
      return;
    }

    const previousHealth = readStandalonePlayerHealthForRespawnDetection(
      pendingStandalonePlayerFixedStepResult.nextPlayerState
    );
    const nextHealth = readStandalonePlayerHealthForRespawnDetection(nextPlayerState);
    const startsDeathStateThisTick =
      standalonePlayerDeathState === null &&
      pendingStandalonePlayerFixedStepResult.nextDeathState === null &&
      previousHealth > 0 &&
      nextHealth <= 0;
    const deathCauseEvent = resolveStandalonePlayerDeathCauseEventFromDamageSequence(
      pendingStandalonePlayerFixedStepResult.nextPlayerState,
      nextPlayerState,
      deathCauseCandidates
    );

    pendingStandalonePlayerFixedStepResult = {
      ...pendingStandalonePlayerFixedStepResult,
      nextPlayerState: startsDeathStateThisTick
        ? createStandalonePlayerDeathHoldState(nextPlayerState)
        : nextPlayerState,
      nextDeathState: startsDeathStateThisTick
        ? createPlayerDeathState()
        : pendingStandalonePlayerFixedStepResult.nextDeathState,
      transitionSnapshot: startsDeathStateThisTick
        ? createEmptyStandalonePlayerFixedStepTransitionSnapshot()
        : pendingStandalonePlayerFixedStepResult.transitionSnapshot,
      deathCauseEvent:
        deathCauseEvent ?? pendingStandalonePlayerFixedStepResult.deathCauseEvent,
      renderPresentationState: startsDeathStateThisTick
        ? createStandalonePlayerRenderPresentationState()
        : pendingStandalonePlayerFixedStepResult.renderPresentationState
    };
  };
  const isStandalonePlayerDead = (playerState: PlayerState | null): boolean =>
    playerState !== null && readStandalonePlayerHealthForRespawnDetection(playerState) <= 0;
  const applyHostileSlimePlayerContactDuringFixedStep = (slimeState: HostileSlimeState): void => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return;
    }

    const { nextPlayerState, event } = resolveHostileSlimePlayerContactWithEvent(
      standalonePlayerState,
      [slimeState],
      {
        contactDamage: resolvePlayerArmorReducedDamage(
          DEFAULT_HOSTILE_SLIME_CONTACT_DAMAGE,
          standalonePlayerEquipmentState
        )
      }
    );
    if (event !== null) {
      lastHostileSlimePlayerContactEvent = event;
    }
    if (nextPlayerState === standalonePlayerState) {
      return;
    }

    const deathCauseCandidates =
      event !== null && !event.blockedByInvulnerability
        ? [
            {
              source: 'hostile-contact' as const,
              damageApplied: event.damageApplied
            }
          ]
        : [];
    const deathCauseEvent = resolveStandalonePlayerDeathCauseEventFromDamageSequence(
      standalonePlayerState,
      nextPlayerState,
      deathCauseCandidates
    );
    if (deathCauseEvent !== null) {
      lastPlayerDeathCauseEvent = deathCauseEvent;
    }

    setStandalonePlayerState(nextPlayerState, {
      resetRenderStateSnapshots: false
    });
    replacePendingStandalonePlayerFixedStepNextState(nextPlayerState, deathCauseCandidates);
  };
  const spawnStandalonePlayerEntity = (initialPlayerState: PlayerState): PlayerState => {
    standalonePlayerRenderPresentationState = createStandalonePlayerRenderPresentationState();
    standalonePlayerEntityId = entityRegistry.spawn({
      kind: STANDALONE_PLAYER_ENTITY_KIND,
      initialState: initialPlayerState,
      captureRenderState: (playerState) =>
        cloneStandalonePlayerRenderState(playerState, standalonePlayerRenderPresentationState),
      fixedUpdate: (playerState, fixedDt) => {
        const playerMovementIntent = buildStandalonePlayerMovementIntent();
        const playerFixedStepResult = createStandalonePlayerFixedStepResult({
          previousPlayerState: playerState,
          currentPlayerDeathState: standalonePlayerDeathState,
          fixedDt,
          playerMovementIntent
        });
        pendingStandalonePlayerFixedStepResult = playerFixedStepResult;
        standalonePlayerRenderPresentationState = playerFixedStepResult.renderPresentationState;
        return playerFixedStepResult.nextPlayerState;
      }
    });
    const spawnedPlayerState = getStandalonePlayerState();
    if (spawnedPlayerState === null) {
      throw new Error('Failed to read standalone player entity state after spawn');
    }
    return spawnedPlayerState;
  };
  const spawnHostileSlimeEntity = (initialSlimeState: HostileSlimeState): EntityId => {
    const entityId = entityRegistry.spawn({
      kind: HOSTILE_SLIME_ENTITY_KIND,
      initialState: initialSlimeState,
      captureRenderState: cloneHostileSlimeState,
      fixedUpdate: (slimeState, fixedDt) => {
        const standalonePlayerState = getStandalonePlayerState();
        if (standalonePlayerState === null) {
          return slimeState;
        }

        const nextSlimeState = renderer.stepHostileSlimeState(slimeState, fixedDt, standalonePlayerState);
        applyHostileSlimePlayerContactDuringFixedStep(nextSlimeState);
        return nextSlimeState;
      }
    });
    hostileSlimeEntityIds.push(entityId);
    return entityId;
  };
  const spawnPassiveBunnyEntity = (initialPassiveBunnyState: PassiveBunnyState): EntityId => {
    const entityId = entityRegistry.spawn({
      kind: PASSIVE_BUNNY_ENTITY_KIND,
      initialState: initialPassiveBunnyState,
      captureRenderState: clonePassiveBunnyState,
      fixedUpdate: (passiveBunnyState, fixedDt) =>
        renderer.stepPassiveBunnyState(passiveBunnyState, fixedDt)
    });
    passiveBunnyEntityIds.push(entityId);
    return entityId;
  };
  const spawnDroppedItemEntity = (initialDroppedItemState: DroppedItemState): EntityId => {
    let droppedItemEntityId: EntityId | null = null;
    droppedItemEntityId = entityRegistry.spawn({
      kind: DROPPED_ITEM_ENTITY_KIND,
      initialState: initialDroppedItemState,
      captureRenderState: cloneDroppedItemState,
      fixedUpdate: (droppedItemState) => {
        const standalonePlayerState = getStandalonePlayerState();
        if (standalonePlayerState === null) {
          return droppedItemState;
        }

        const pickupResult = resolveDroppedItemPickup(
          droppedItemState,
          standalonePlayerState,
          standalonePlayerInventoryState
        );
        if (pickupResult.pickedUpAmount <= 0) {
          return pickupResult.nextDroppedItemState ?? droppedItemState;
        }

        applyStandalonePlayerInventoryState(pickupResult.nextInventoryState);
        if (pickupResult.nextDroppedItemState === null) {
          if (droppedItemEntityId !== null) {
            entityRegistry.despawn(droppedItemEntityId);
          }
          return droppedItemState;
        }

        return pickupResult.nextDroppedItemState;
      }
    });
    droppedItemEntityIds.push(droppedItemEntityId);
    return droppedItemEntityId;
  };
  const spawnStarterWandFireboltEntity = (
    initialFireboltState: StarterWandFireboltState
  ): EntityId => {
    let fireboltEntityId: EntityId | null = null;
    fireboltEntityId = entityRegistry.spawn({
      kind: STARTER_WAND_FIREBOLT_ENTITY_KIND,
      initialState: initialFireboltState,
      captureRenderState: (fireboltState) => ({
        position: {
          x: fireboltState.position.x,
          y: fireboltState.position.y
        },
        velocity: {
          x: fireboltState.velocity.x,
          y: fireboltState.velocity.y
        },
        radius: fireboltState.radius,
        secondsRemaining: fireboltState.secondsRemaining
      }),
      fixedUpdate: (fireboltState, fixedDt) => {
        const stepResult = stepStarterWandFireboltState(fireboltState, {
          world: {
            getTile: (worldTileX, worldTileY) => renderer.getTile(worldTileX, worldTileY)
          },
          hostileSlimes: getHostileSlimeEntityStates().map((hostileSlime) => ({
            entityId: hostileSlime.id,
            state: hostileSlime.state
          })),
          fixedDtSeconds: fixedDt
        });
        if (stepResult.hitEvent !== null) {
          pendingStarterWandFireboltHitEvents.push(stepResult.hitEvent);
        }
        if (stepResult.nextState === null) {
          if (fireboltEntityId !== null) {
            entityRegistry.despawn(fireboltEntityId);
          }
          return fireboltState;
        }

        return stepResult.nextState;
      }
    });
    fireboltEntityIds.push(fireboltEntityId);
    return fireboltEntityId;
  };
  const flushStarterWandFireboltHitEvents = (): void => {
    if (pendingStarterWandFireboltHitEvents.length === 0) {
      return;
    }

    const hitEvents = pendingStarterWandFireboltHitEvents;
    pendingStarterWandFireboltHitEvents = [];
    const defeatedHostileSlimeEntityIds = new Set<EntityId>();
    const defeatedHostileSlimeDropStates: DroppedItemState[] = [];
    for (const hitEvent of hitEvents) {
      if (hitEvent.kind !== 'hostile-slime') {
        continue;
      }
      if (defeatedHostileSlimeEntityIds.has(hitEvent.entityId)) {
        continue;
      }

      const activeHostileSlimeState = entityRegistry.getEntityState<HostileSlimeState>(hitEvent.entityId);
      if (activeHostileSlimeState === null) {
        continue;
      }

      const nextHostileSlimeState = applyStarterWandFireboltHitToHostileSlime(
        activeHostileSlimeState,
        hitEvent
      );
      entityRegistry.setEntityState(hitEvent.entityId, nextHostileSlimeState);
      if (!isHostileSlimeDefeated(nextHostileSlimeState)) {
        continue;
      }

      defeatedHostileSlimeEntityIds.add(hitEvent.entityId);
      defeatedHostileSlimeDropStates.push(
        createHostileSlimeDefeatDropState(nextHostileSlimeState)
      );
    }

    if (defeatedHostileSlimeEntityIds.size <= 0) {
      return;
    }

    despawnHostileSlimeEntities([...defeatedHostileSlimeEntityIds]);
    for (const droppedItemState of defeatedHostileSlimeDropStates) {
      const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(droppedItemState);
      if (remainingDroppedItemState !== null) {
        spawnDroppedItemEntity(remainingDroppedItemState);
      }
    }
  };
  const refundRemovedPlacedTile = (
    worldTileX: number,
    worldTileY: number,
    itemId: DroppedItemState['itemId']
  ): void => {
    const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(
      createDroppedItemStateFromWorldTile(worldTileX, worldTileY, itemId, 1)
    );
    if (remainingDroppedItemState !== null) {
      spawnDroppedItemEntity(remainingDroppedItemState);
    }
  };
  renderer.onTileEdited((event) => {
    refreshTrackedSmallTreeGrowthAnchorsAroundTileEdit(event.worldTileX, event.worldTileY);
    if (event.editOrigin !== 'gameplay') {
      return;
    }

    if (event.previousTileId === STARTER_TORCH_TILE_ID && event.tileId !== STARTER_TORCH_TILE_ID) {
      refundRemovedPlacedTile(event.worldTileX, event.worldTileY, STARTER_TORCH_ITEM_ID);
      return;
    }

    if (event.previousTileId === STARTER_ROPE_TILE_ID && event.tileId !== STARTER_ROPE_TILE_ID) {
      refundRemovedPlacedTile(event.worldTileX, event.worldTileY, STARTER_ROPE_ITEM_ID);
      return;
    }

    if (
      event.previousTileId === STARTER_PLATFORM_TILE_ID &&
      event.tileId !== STARTER_PLATFORM_TILE_ID
    ) {
      refundRemovedPlacedTile(event.worldTileX, event.worldTileY, STARTER_PLATFORM_ITEM_ID);
      return;
    }

    if (
      event.previousTileId === STARTER_WORKBENCH_TILE_ID &&
      event.tileId !== STARTER_WORKBENCH_TILE_ID
    ) {
      refundRemovedPlacedTile(event.worldTileX, event.worldTileY, STARTER_WORKBENCH_ITEM_ID);
      return;
    }

    if (
      event.previousTileId === STARTER_FURNACE_TILE_ID &&
      event.tileId !== STARTER_FURNACE_TILE_ID
    ) {
      refundRemovedPlacedTile(event.worldTileX, event.worldTileY, STARTER_FURNACE_ITEM_ID);
      return;
    }

    if (
      event.previousTileId === STARTER_ANVIL_TILE_ID &&
      event.tileId !== STARTER_ANVIL_TILE_ID
    ) {
      refundRemovedPlacedTile(event.worldTileX, event.worldTileY, STARTER_ANVIL_ITEM_ID);
    }
  });
  renderer.onWallEdited((event) => {
    if (event.previousWallId === event.wallId) {
      return;
    }
    if (event.editOrigin !== 'gameplay') {
      return;
    }

    if (event.previousWallId === STARTER_DIRT_WALL_ID) {
      refundRemovedPlacedTile(event.worldTileX, event.worldTileY, STARTER_DIRT_WALL_ITEM_ID);
      return;
    }

    if (event.previousWallId === STARTER_WOOD_WALL_ID) {
      refundRemovedPlacedTile(event.worldTileX, event.worldTileY, STARTER_WOOD_WALL_ITEM_ID);
    }
  });
  const restoreDroppedItemEntityStates = (droppedItemStates: readonly DroppedItemState[]): void => {
    droppedItemEntityIds = [];
    for (const droppedItemState of droppedItemStates) {
      spawnDroppedItemEntity(droppedItemState);
    }
  };
  const dropSelectedStandalonePlayerHotbarItem = (): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (standalonePlayerState === null || selectedStack === null) {
      return false;
    }

    const consumeResult = consumePlayerInventoryHotbarSlotItem(
      standalonePlayerInventoryState,
      standalonePlayerInventoryState.selectedHotbarSlotIndex
    );
    if (!consumeResult.consumed) {
      return false;
    }

    applyStandalonePlayerInventoryState(consumeResult.state);
    const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(
      createDroppedItemStateFromPlayerDrop(standalonePlayerState, selectedStack.itemId, 1)
    );
    if (remainingDroppedItemState !== null) {
      spawnDroppedItemEntity(remainingDroppedItemState);
    }
    return true;
  };
  const dropSelectedStandalonePlayerHotbarStack = (): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (standalonePlayerState === null || selectedStack === null) {
      return false;
    }

    const droppedItemState = createDroppedItemStateFromPlayerDrop(
      standalonePlayerState,
      selectedStack.itemId,
      selectedStack.amount
    );
    applyStandalonePlayerInventoryState(
      setPlayerInventoryHotbarSlot(
        standalonePlayerInventoryState,
        standalonePlayerInventoryState.selectedHotbarSlotIndex,
        null
      )
    );
    const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(droppedItemState);
    if (remainingDroppedItemState !== null) {
      spawnDroppedItemEntity(remainingDroppedItemState);
    }
    return true;
  };
  const despawnHostileSlimeEntities = (entityIds: readonly EntityId[]): void => {
    if (entityIds.length === 0) {
      return;
    }

    const removedEntityIds = new Set(entityIds);
    hostileSlimeEntityIds = hostileSlimeEntityIds.filter((entityId) => {
      if (!removedEntityIds.has(entityId)) {
        return true;
      }

      entityRegistry.despawn(entityId);
      return false;
    });
  };
  const despawnPassiveBunnyEntities = (entityIds: readonly EntityId[]): void => {
    if (entityIds.length === 0) {
      return;
    }

    const removedEntityIds = new Set(entityIds);
    passiveBunnyEntityIds = passiveBunnyEntityIds.filter((entityId) => {
      if (!removedEntityIds.has(entityId)) {
        return true;
      }

      entityRegistry.despawn(entityId);
      return false;
    });
  };
  const enforcePeacefulModeHostileSlimeState = (): void => {
    if (!worldSessionGameplayState.peacefulModeEnabled || hostileSlimeEntityIds.length === 0) {
      return;
    }

    despawnHostileSlimeEntities([...hostileSlimeEntityIds]);
  };
  const stepHostileSlimeSpawnAndDespawn = (): void => {
    if (worldSessionGameplayState.peacefulModeEnabled) {
      return;
    }

    const standalonePlayerState = getStandalonePlayerState();
    if (standalonePlayerState === null) {
      return;
    }

    const spawnResult = stepHostileSlimeSpawner({
      playerState: standalonePlayerState,
      activeSlimes: getHostileSlimeEntityStates(),
      spawnerState: hostileSlimeSpawnerState,
      findSpawnPoint: (options) => renderer.findPlayerSpawnPoint(options)
    });
    hostileSlimeSpawnerState = spawnResult.nextSpawnerState;
    despawnHostileSlimeEntities(spawnResult.despawnIds);
    if (spawnResult.spawnState !== null) {
      spawnHostileSlimeEntity(spawnResult.spawnState);
    }
  };
  const stepPassiveBunnySpawnAndDespawn = (): void => {
    const standalonePlayerState = getStandalonePlayerState();
    if (standalonePlayerState === null) {
      return;
    }

    const spawnResult = stepPassiveBunnySpawner({
      playerState: standalonePlayerState,
      activeBunnies: getPassiveBunnyEntityStates(),
      spawnerState: passiveBunnySpawnerState,
      findSpawnPoint: (options) => renderer.findPlayerSpawnPoint(options),
      hasOpenSkyAbove: (worldTileX, standingTileY) =>
        renderer.hasOpenSkyAbove(worldTileX, standingTileY)
    });
    passiveBunnySpawnerState = spawnResult.nextSpawnerState;
    despawnPassiveBunnyEntities(spawnResult.despawnIds);
    if (spawnResult.spawnState !== null) {
      spawnPassiveBunnyEntity(spawnResult.spawnState);
    }
  };

  const applyStandalonePlayerCameraFollow = (): void => {
    const standalonePlayerState = getStandalonePlayerState();
    applyStandalonePlayerCameraFollowTarget(
      standalonePlayerState === null ? null : getPlayerCameraFocusPoint(standalonePlayerState)
    );
  };
  const applyStandalonePlayerRenderFrameCameraFollow = (renderAlpha: number): void => {
    applyStandalonePlayerCameraFollowTarget(resolveStandalonePlayerRenderFrameFocusPoint(renderAlpha));
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
    lastPlayerLandingDamageEvent = null;
    lastPlayerDrowningDamageEvent = null;
    lastPlayerLavaDamageEvent = null;
    lastPlayerDeathCauseEvent = null;
    lastHostileSlimePlayerContactEvent = null;
    lastPlayerWallContactTransitionEvent = null;
    lastPlayerCeilingContactTransitionEvent = null;
    standalonePlayerRenderPresentationState = createStandalonePlayerRenderPresentationState();
  };
  const clearStandalonePlayerMovementTransitionState = (): void => {
    lastPlayerGroundedTransitionEvent = null;
    lastPlayerFacingTransitionEvent = null;
    lastPlayerWallContactTransitionEvent = null;
    lastPlayerCeilingContactTransitionEvent = null;
    standalonePlayerRenderPresentationState = createStandalonePlayerRenderPresentationState();
  };
  const readOptionalFiniteNumber = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;
  const readStandalonePlayerHealthForRespawnDetection = (playerState: PlayerState): number => {
    const health = (playerState as { health?: unknown }).health;
    return typeof health === 'number' && Number.isFinite(health) ? health : 1;
  };
  const resolveStandalonePlayerDeathCauseEventFromDamageSequence = (
    previousPlayerState: PlayerState,
    nextPlayerState: PlayerState,
    candidates: readonly PlayerDeathCauseCandidate[]
  ): PlayerDeathCauseEvent | null =>
    createPlayerDeathCauseEvent(
      resolvePlayerDeathCauseFromDamageSequence(
        readStandalonePlayerHealthForRespawnDetection(previousPlayerState),
        readStandalonePlayerHealthForRespawnDetection(nextPlayerState),
        candidates
      ),
      worldToTilePoint(nextPlayerState.position.x, nextPlayerState.position.y)
    );
  const readStandalonePlayerFallDamageRecoverySecondsRemaining = (
    playerState: PlayerState
  ): number => {
    const fallDamageRecoverySecondsRemaining = (
      playerState as { fallDamageRecoverySecondsRemaining?: unknown }
    ).fallDamageRecoverySecondsRemaining;
    return typeof fallDamageRecoverySecondsRemaining === 'number' &&
      Number.isFinite(fallDamageRecoverySecondsRemaining)
      ? fallDamageRecoverySecondsRemaining
      : 0;
  };
  const resolveStandalonePlayerLandingDamageEvent = (
    previousPlayerState: PlayerState,
    nextPlayerState: PlayerState,
    fixedDt: number,
    playerMovementIntent: PlayerMovementIntent
  ): PlayerLandingDamageEvent | null => {
    if (previousPlayerState.grounded || !nextPlayerState.grounded) {
      return null;
    }

    if (readStandalonePlayerFallDamageRecoverySecondsRemaining(nextPlayerState) <= 0) {
      return null;
    }

    const damageApplied = Math.max(
      0,
      Math.round(
        readStandalonePlayerHealthForRespawnDetection(previousPlayerState) -
          readStandalonePlayerHealthForRespawnDetection(nextPlayerState)
      )
    );
    return damageApplied > 0
      ? {
          damageApplied,
          impactSpeed: Math.max(
            0,
            Math.round(
              readOptionalFiniteNumber(
                (nextPlayerState as { landingImpactSpeed?: unknown }).landingImpactSpeed
              ) ??
                renderer.getPlayerLandingImpactSpeed(
                  previousPlayerState,
                  fixedDt,
                  playerMovementIntent
                )
            )
          )
        }
      : null;
  };
  const resolveStandalonePlayerLavaDamageEvent = (
    previousPlayerState: PlayerState,
    nextPlayerState: PlayerState,
    fixedDt: number
  ): PlayerLavaDamageEvent | null => {
    const explicitDamageApplied = readOptionalFiniteNumber(
      (nextPlayerState as { lavaDamageApplied?: unknown }).lavaDamageApplied
    );
    const damageApplied = Math.max(
      0,
      Math.round(
        explicitDamageApplied ?? getPlayerLavaDamageTickApplied(renderer, previousPlayerState, fixedDt)
      )
    );
    return damageApplied > 0
      ? {
          damageApplied
        }
      : null;
  };
  const resolveStandalonePlayerDrowningDamageEvent = (
    previousPlayerState: PlayerState,
    nextPlayerState: PlayerState,
    fixedDt: number
  ): PlayerDrowningDamageEvent | null => {
    const explicitDamageApplied = readOptionalFiniteNumber(
      (nextPlayerState as { drowningDamageApplied?: unknown }).drowningDamageApplied
    );
    const damageApplied = Math.max(
      0,
      Math.round(
        explicitDamageApplied ??
          getPlayerDrowningDamageTickApplied(renderer, previousPlayerState, fixedDt)
      )
    );
    return damageApplied > 0
      ? {
          damageApplied
        }
      : null;
  };
  const resolveStandalonePlayerDeathCauseEvent = (
    previousPlayerState: PlayerState,
    nextPlayerState: PlayerState,
    landingDamageEvent: PlayerLandingDamageEvent | null,
    drowningDamageEvent: PlayerDrowningDamageEvent | null,
    lavaDamageEvent: PlayerLavaDamageEvent | null
  ): PlayerDeathCauseEvent | null => {
    const candidates: PlayerDeathCauseCandidate[] = [];
    if (lavaDamageEvent !== null) {
      candidates.push({
        source: 'lava',
        damageApplied: lavaDamageEvent.damageApplied
      });
    }
    if (drowningDamageEvent !== null) {
      candidates.push({
        source: 'drowning',
        damageApplied: drowningDamageEvent.damageApplied
      });
    }
    if (landingDamageEvent !== null) {
      candidates.push({
        source: 'fall',
        damageApplied: landingDamageEvent.damageApplied
      });
    }

    return resolveStandalonePlayerDeathCauseEventFromDamageSequence(
      previousPlayerState,
      nextPlayerState,
      candidates
    );
  };
  const createStandalonePlayerDeathHoldState = (playerState: PlayerState): PlayerState => ({
    ...playerState,
    velocity: {
      x: 0,
      y: 0
    }
  });
  const createEmptyStandalonePlayerFixedStepTransitionSnapshot =
    (): StandalonePlayerFixedStepTransitionSnapshot => ({
      groundedTransitionEvent: null,
      facingTransitionEvent: null,
      wallContactTransitionEvent: null,
      ceilingContactTransitionEvent: null
    });
  const resolveStandalonePlayerFixedStepDeathRespawn = (
    previousPlayerState: PlayerState,
    nextPlayerState: PlayerState,
    currentPlayerDeathState: PlayerDeathState | null,
    fixedDt: number
  ): Pick<StandalonePlayerFixedStepResult, 'nextPlayerState' | 'nextDeathState' | 'respawnEvent'> => {
    const previousHealth = readStandalonePlayerHealthForRespawnDetection(previousPlayerState);
    const nextHealth = readStandalonePlayerHealthForRespawnDetection(nextPlayerState);
    if (currentPlayerDeathState !== null) {
      const nextDeathState = stepPlayerDeathState(currentPlayerDeathState, fixedDt);
      const heldPlayerState = createStandalonePlayerDeathHoldState(nextPlayerState);
      if (isPlayerDeathStateRespawnReady(nextDeathState) && resolvedPlayerSpawn !== null) {
        const respawnedPlayerState = createPlayerStateFromSpawn(resolvedPlayerSpawn, {
          facing: nextPlayerState.facing,
          maxHealth: nextPlayerState.maxHealth,
          maxMana: nextPlayerState.maxMana,
          hostileContactInvulnerabilitySecondsRemaining:
            DEFAULT_PLAYER_RESPAWN_INVULNERABILITY_SECONDS
        });
        return {
          nextPlayerState: respawnedPlayerState,
          nextDeathState: null,
          respawnEvent: createDeathPlayerRespawnEvent(
            respawnedPlayerState,
            resolvedPlayerSpawn,
            renderer.resolvePlayerSpawnLiquidSafetyStatus(resolvedPlayerSpawn)
          )
        };
      }

      return {
        nextPlayerState: heldPlayerState,
        nextDeathState,
        respawnEvent: null
      };
    }

    if (previousHealth > 0 && nextHealth <= 0) {
      return {
        nextPlayerState: createStandalonePlayerDeathHoldState(nextPlayerState),
        nextDeathState: createPlayerDeathState(),
        respawnEvent: null
      };
    }

    return {
      nextPlayerState,
      nextDeathState: null,
      respawnEvent: null
    };
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
  const createStandalonePlayerRenderPresentationStateForFixedStepResult = (
    nextPlayerContacts: PlayerCollisionContacts,
    transitionSnapshot: StandalonePlayerFixedStepTransitionSnapshot,
    nextDeathState: PlayerDeathState | null,
    respawnEvent: PlayerRespawnEvent | null,
    timeMs: number
  ): StandalonePlayerRenderPresentationState => {
    const ceilingBonkHoldUntilTimeMs =
      respawnEvent !== null || nextDeathState !== null
        ? null
        : transitionSnapshot.ceilingContactTransitionEvent?.kind === 'blocked'
          ? timeMs + STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS
          : typeof standalonePlayerRenderPresentationState.ceilingBonkHoldUntilTimeMs === 'number' &&
              Number.isFinite(standalonePlayerRenderPresentationState.ceilingBonkHoldUntilTimeMs) &&
              standalonePlayerRenderPresentationState.ceilingBonkHoldUntilTimeMs > timeMs
            ? standalonePlayerRenderPresentationState.ceilingBonkHoldUntilTimeMs
            : null;
    return createStandalonePlayerRenderPresentationState(
      nextPlayerContacts,
      ceilingBonkHoldUntilTimeMs
    );
  };
  const createStandalonePlayerFixedStepResult = ({
    previousPlayerState,
    currentPlayerDeathState,
    fixedDt,
    playerMovementIntent
  }: StandalonePlayerFixedStepResultOptions): StandalonePlayerFixedStepResult => {
    const movementSteppedPlayerState =
      currentPlayerDeathState === null
        ? renderer.stepPlayerState(previousPlayerState, fixedDt, playerMovementIntent)
        : createStandalonePlayerDeathHoldState(previousPlayerState);
    const steppedPlayerState =
      currentPlayerDeathState === null
        ? stepPlayerManaRegeneration(movementSteppedPlayerState, fixedDt)
        : movementSteppedPlayerState;
    const { nextPlayerState, nextDeathState, respawnEvent } =
      resolveStandalonePlayerFixedStepDeathRespawn(
      previousPlayerState,
      steppedPlayerState,
      currentPlayerDeathState,
      fixedDt
    );
    const landingDamageEvent = resolveStandalonePlayerLandingDamageEvent(
      previousPlayerState,
      nextPlayerState,
      fixedDt,
      playerMovementIntent
    );
    const drowningDamageEvent =
      currentPlayerDeathState === null
        ? resolveStandalonePlayerDrowningDamageEvent(previousPlayerState, nextPlayerState, fixedDt)
        : null;
    const lavaDamageEvent =
      currentPlayerDeathState === null
        ? resolveStandalonePlayerLavaDamageEvent(previousPlayerState, nextPlayerState, fixedDt)
        : null;
    const deathCauseEvent =
      currentPlayerDeathState === null
        ? resolveStandalonePlayerDeathCauseEvent(
            previousPlayerState,
            nextPlayerState,
            landingDamageEvent,
            drowningDamageEvent,
            lavaDamageEvent
          )
        : null;
    const contactSnapshot = createStandalonePlayerFixedStepContactSnapshot({
      previousPlayerState,
      nextPlayerState
    });
    const transitionSnapshot =
      currentPlayerDeathState !== null || nextDeathState !== null || respawnEvent !== null
        ? createEmptyStandalonePlayerFixedStepTransitionSnapshot()
        : createStandalonePlayerFixedStepTransitionSnapshot({
            previousPlayerState,
            nextPlayerState,
            previousPlayerContacts: contactSnapshot.previousPlayerContacts,
            nextPlayerContacts: contactSnapshot.nextPlayerContacts,
            playerMovementIntent
          });
    return {
      previousPlayerState,
      nextPlayerState,
      nextDeathState,
      contactSnapshot,
      respawnEvent,
      transitionSnapshot,
      landingDamageEvent,
      drowningDamageEvent,
      lavaDamageEvent,
      deathCauseEvent,
      renderPresentationState: createStandalonePlayerRenderPresentationStateForFixedStepResult(
        contactSnapshot.nextPlayerContacts,
        transitionSnapshot,
        nextDeathState,
        respawnEvent,
        performance.now()
      )
    };
  };
  const applyStandalonePlayerFixedStepResult = (
    playerFixedStepResult: StandalonePlayerFixedStepResult
  ): void => {
    if (standalonePlayerDeathState === null && playerFixedStepResult.nextDeathState !== null) {
      standalonePlayerDeathCount += 1;
    }
    if (playerFixedStepResult.landingDamageEvent !== null) {
      lastPlayerLandingDamageEvent = playerFixedStepResult.landingDamageEvent;
    }
    if (playerFixedStepResult.drowningDamageEvent !== null) {
      lastPlayerDrowningDamageEvent = playerFixedStepResult.drowningDamageEvent;
    }
    if (playerFixedStepResult.lavaDamageEvent !== null) {
      lastPlayerLavaDamageEvent = playerFixedStepResult.lavaDamageEvent;
    }
    if (playerFixedStepResult.deathCauseEvent !== null) {
      lastPlayerDeathCauseEvent = playerFixedStepResult.deathCauseEvent;
    }
    if (playerFixedStepResult.respawnEvent !== null) {
      if (playerFixedStepResult.respawnEvent.kind === 'death') {
        latestStandalonePlayerDeathHoldStatus = 'respawned';
      }
      resetStandalonePlayerTransitionState(playerFixedStepResult.respawnEvent);
      setStandalonePlayerDeathState(null);
      setStandalonePlayerState(playerFixedStepResult.nextPlayerState);
    } else if (playerFixedStepResult.nextDeathState !== null) {
      clearStandalonePlayerMovementTransitionState();
      setStandalonePlayerDeathState(playerFixedStepResult.nextDeathState);
      setStandalonePlayerState(playerFixedStepResult.nextPlayerState);
    } else {
      setStandalonePlayerDeathState(null);
      commitStandalonePlayerFixedStepTransitions(playerFixedStepResult.transitionSnapshot);
    }
    applyStandalonePlayerCameraFollow();
  };
  const flushStandalonePlayerFixedStepResult = (): void => {
    if (pendingStandalonePlayerFixedStepResult === null) {
      return;
    }

    const playerFixedStepResult = pendingStandalonePlayerFixedStepResult;
    pendingStandalonePlayerFixedStepResult = null;
    applyStandalonePlayerFixedStepResult(playerFixedStepResult);
    syncHotbarOverlayState();
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
    }
  };

  const resolveCurrentWorldPlayerSpawn = (): void => {
    resolvedPlayerSpawn = renderer.findPlayerSpawnPoint(DEBUG_PLAYER_SPAWN_SEARCH_OPTIONS);
    playerSpawnNeedsRefresh = false;
  };
  const refreshResolvedPlayerSpawn = (): void => {
    resolveCurrentWorldPlayerSpawn();
    const standalonePlayerState = getStandalonePlayerState();
    if (standalonePlayerState === null && resolvedPlayerSpawn) {
      const spawnedPlayerState = spawnStandalonePlayerEntity(
        createPlayerStateFromSpawn(resolvedPlayerSpawn)
      );
      resetStandalonePlayerTransitionState();
      centerCameraOnStandalonePlayer(spawnedPlayerState);
      return;
    }

    if (standalonePlayerState !== null) {
      if (standalonePlayerDeathState !== null || isStandalonePlayerDead(standalonePlayerState)) {
        return;
      }
      const nextPlayerState = renderer.respawnPlayerStateAtSpawnIfEmbeddedInSolid(
        standalonePlayerState,
        resolvedPlayerSpawn
      );
      if (nextPlayerState !== standalonePlayerState) {
        resetStandalonePlayerTransitionState(
          resolvedPlayerSpawn === null
            ? null
            : createEmbeddedPlayerRespawnEvent(
                nextPlayerState,
                resolvedPlayerSpawn,
                renderer.resolvePlayerSpawnLiquidSafetyStatus(resolvedPlayerSpawn)
              )
        );
      }
      setStandalonePlayerState(nextPlayerState);
    }
  };
  const createResolvedPlayerSpawnTelemetrySnapshot = (): ResolvedPlayerSpawnTelemetrySnapshot => {
    if (resolvedPlayerSpawn === null) {
      return {
        debugOverlaySpawn: null,
        debugStatusStripPlayerSpawn: {
          liquidSafetyStatus: 'unresolved'
        }
      };
    }

    const tile = {
      x: resolvedPlayerSpawn.anchorTileX,
      y: resolvedPlayerSpawn.standingTileY
    };
    const world = {
      x: resolvedPlayerSpawn.x,
      y: resolvedPlayerSpawn.y
    };
    const supportChunk = worldToChunkCoord(
      resolvedPlayerSpawn.support.tileX,
      resolvedPlayerSpawn.support.tileY
    );
    const supportLocal = worldToLocalTile(
      resolvedPlayerSpawn.support.tileX,
      resolvedPlayerSpawn.support.tileY
    );
    const supportTile = {
      x: resolvedPlayerSpawn.support.tileX,
      y: resolvedPlayerSpawn.support.tileY,
      id: resolvedPlayerSpawn.support.tileId,
      chunk: {
        x: supportChunk.chunkX,
        y: supportChunk.chunkY
      },
      local: {
        x: supportLocal.localX,
        y: supportLocal.localY
      }
    };
    const liquidSafetyStatus = renderer.resolvePlayerSpawnLiquidSafetyStatus(resolvedPlayerSpawn);

    return {
      debugOverlaySpawn: {
        tile,
        world,
        supportTile,
        liquidSafetyStatus
      },
      debugStatusStripPlayerSpawn: {
        tile,
        world,
        supportTile,
        liquidSafetyStatus
      }
    };
  };

  const applyWorldTileEdit = (
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    editOrigin?: 'debug-break' | 'debug-history'
  ): { previousTileId: number; changed: boolean } => {
    const previousTileId = renderer.getTile(worldTileX, worldTileY);
    const changed =
      editOrigin === undefined
        ? renderer.setTile(worldTileX, worldTileY, tileId)
        : renderer.setTile(worldTileX, worldTileY, tileId, editOrigin);
    if (changed) {
      playerSpawnNeedsRefresh = true;
    }

    return {
      previousTileId,
      changed
    };
  };
  const applyWorldWallEdit = (
    worldTileX: number,
    worldTileY: number,
    wallId: number,
    editOrigin?: 'debug-break' | 'debug-history'
  ): { previousWallId: number; changed: boolean } => {
    const previousWallId = renderer.getWall(worldTileX, worldTileY);
    const changed =
      editOrigin === undefined
        ? renderer.setWall(worldTileX, worldTileY, wallId)
        : renderer.setWall(worldTileX, worldTileY, wallId, editOrigin);

    return {
      previousWallId,
      changed
    };
  };
  const debugBreakWorldView = {
    getTile: (worldTileX: number, worldTileY: number) => renderer.getTile(worldTileX, worldTileY),
    getWall: (worldTileX: number, worldTileY: number) => renderer.getWall(worldTileX, worldTileY)
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
  const isDebugBreakPreviewActive = (
    preview: ArmedDebugToolPreviewState,
    touchMode: TouchDebugEditMode
  ): boolean =>
    touchMode === 'break' ||
    preview.armedFloodFillKind === 'break' ||
    preview.armedLineKind === 'break' ||
    preview.armedRectKind === 'break' ||
    preview.armedRectOutlineKind === 'break' ||
    preview.armedEllipseKind === 'break' ||
    preview.armedEllipseOutlineKind === 'break' ||
    preview.activeMouseLineDrag?.kind === 'break' ||
    preview.activeMouseRectDrag?.kind === 'break' ||
    preview.activeMouseRectOutlineDrag?.kind === 'break' ||
    preview.activeMouseEllipseDrag?.kind === 'break' ||
    preview.activeMouseEllipseOutlineDrag?.kind === 'break' ||
    preview.pendingTouchLineStart?.kind === 'break' ||
    preview.pendingTouchRectStart?.kind === 'break' ||
    preview.pendingTouchRectOutlineStart?.kind === 'break' ||
    preview.pendingTouchEllipseStart?.kind === 'break' ||
    preview.pendingTouchEllipseOutlineStart?.kind === 'break';
  const resolveHoveredDebugBreakPreviewTone = (
    pointerInspect: PointerInspectSnapshot | null,
    preview: ArmedDebugToolPreviewState,
    touchMode: TouchDebugEditMode
  ): 'debug-break-tile' | 'debug-break-wall' | undefined => {
    if (pointerInspect === null || !isDebugBreakPreviewActive(preview, touchMode)) {
      return undefined;
    }

    const evaluation = evaluateDebugBreakTarget(
      debugBreakWorldView,
      pointerInspect.tile.x,
      pointerInspect.tile.y
    );
    if (!evaluation.breakableTarget || evaluation.targetLayer === null) {
      return undefined;
    }

    return evaluation.targetLayer === 'tile' ? 'debug-break-tile' : 'debug-break-wall';
  };
  const resolveArmedDebugBreakShapePreviewTargets = (
    preview: ArmedDebugToolPreviewState,
    pointerInspect: PointerInspectSnapshot | null
  ): DebugBreakPreviewTarget[] | null => {
    if (pointerInspect?.pointerType !== 'mouse') {
      return null;
    }

    const endTileX = pointerInspect.tile.x;
    const endTileY = pointerInspect.tile.y;
    if (preview.activeMouseLineDrag?.kind === 'break') {
      return collectDebugBreakPreviewTargets(debugBreakWorldView, (visit: (tileX: number, tileY: number) => void) => {
        walkLineSteppedTilePath(
          preview.activeMouseLineDrag!.startTileX,
          preview.activeMouseLineDrag!.startTileY,
          endTileX,
          endTileY,
          visit
        );
      });
    }

    if (preview.activeMouseRectDrag?.kind === 'break') {
      return collectDebugBreakPreviewTargets(debugBreakWorldView, (visit: (tileX: number, tileY: number) => void) => {
        walkFilledRectangleTileArea(
          preview.activeMouseRectDrag!.startTileX,
          preview.activeMouseRectDrag!.startTileY,
          endTileX,
          endTileY,
          visit
        );
      });
    }

    if (preview.activeMouseRectOutlineDrag?.kind === 'break') {
      return collectDebugBreakPreviewTargets(debugBreakWorldView, (visit: (tileX: number, tileY: number) => void) => {
        walkRectangleOutlineTileArea(
          preview.activeMouseRectOutlineDrag!.startTileX,
          preview.activeMouseRectOutlineDrag!.startTileY,
          endTileX,
          endTileY,
          visit
        );
      });
    }

    if (preview.activeMouseEllipseDrag?.kind === 'break') {
      return collectDebugBreakPreviewTargets(debugBreakWorldView, (visit: (tileX: number, tileY: number) => void) => {
        walkFilledEllipseTileArea(
          preview.activeMouseEllipseDrag!.startTileX,
          preview.activeMouseEllipseDrag!.startTileY,
          endTileX,
          endTileY,
          visit
        );
      });
    }

    if (preview.activeMouseEllipseOutlineDrag?.kind === 'break') {
      return collectDebugBreakPreviewTargets(debugBreakWorldView, (visit: (tileX: number, tileY: number) => void) => {
        walkEllipseOutlineTileArea(
          preview.activeMouseEllipseOutlineDrag!.startTileX,
          preview.activeMouseEllipseOutlineDrag!.startTileY,
          endTileX,
          endTileY,
          visit
        );
      });
    }

    return null;
  };
  const resolveArmedDebugToolPreviewState = (
    preview: ArmedDebugToolPreviewState | null | undefined,
    pointerInspect: PointerInspectSnapshot | null
  ): ArmedDebugToolPreviewState => {
    const basePreview = preview ?? createEmptyArmedDebugToolPreviewState();
    const resolvedBreakPreviewTargets = resolveArmedDebugBreakShapePreviewTargets(basePreview, pointerInspect);
    return {
      ...basePreview,
      resolvedBreakPreviewTargets,
      resolvedBreakPreviewAffectedTileCount: resolvedBreakPreviewTargets?.length ?? null
    };
  };
  const applyDebugWorldEdit = (
    worldTileX: number,
    worldTileY: number,
    kind: DebugTileEditKind
  ): {
    changed: boolean;
    historyChange: DebugWorldHistoryChange | null;
  } => {
    if (kind === 'place') {
      const { previousTileId, changed } = applyWorldTileEdit(
        worldTileX,
        worldTileY,
        activeDebugBrushTileId
      );
      return {
        changed,
        historyChange: changed
          ? {
              layer: 'tile',
              previousId: previousTileId,
              id: activeDebugBrushTileId
            }
          : null
      };
    }

    const evaluation = evaluateDebugBreakTarget(debugBreakWorldView, worldTileX, worldTileY);
    if (!evaluation.breakableTarget || evaluation.targetLayer === null) {
      return {
        changed: false,
        historyChange: null
      };
    }

    if (evaluation.targetLayer === 'tile') {
      const { changed } = applyWorldTileEdit(worldTileX, worldTileY, DEBUG_TILE_BREAK_ID, 'debug-break');
      return {
        changed,
        historyChange: changed
          ? {
              layer: 'tile',
              previousId: evaluation.tileId,
              id: DEBUG_TILE_BREAK_ID
            }
          : null
      };
    }

    const { changed } = applyWorldWallEdit(worldTileX, worldTileY, 0, 'debug-break');
    return {
      changed,
      historyChange: changed
        ? {
            layer: 'wall',
            previousId: evaluation.wallId,
            id: 0
          }
        : null
    };
  };
  const readDebugBreakFloodFillTargetId = (worldTileX: number, worldTileY: number): number => {
    const evaluation = evaluateDebugBreakTarget(debugBreakWorldView, worldTileX, worldTileY);
    if (!evaluation.breakableTarget || evaluation.targetLayer === null) {
      return DEBUG_TILE_BREAK_ID;
    }

    return evaluation.targetLayer === 'tile'
      ? DEBUG_BREAK_FLOOD_FILL_TILE_ID_OFFSET + evaluation.targetId
      : DEBUG_BREAK_FLOOD_FILL_WALL_ID_OFFSET + evaluation.targetId;
  };
  const resolvePlayerItemUseFacing = (
    playerState: PlayerState,
    request: PlayerItemUseRequest
  ): 'left' | 'right' => {
    const targetWorldX = resolvePlayerItemUseTargetWorldPoint(request).x;
    if (targetWorldX < playerState.position.x) {
      return 'left';
    }
    if (targetWorldX > playerState.position.x) {
      return 'right';
    }
    return playerState.facing;
  };
  const resolvePlayerItemUseTargetWorldPoint = (
    request: PlayerItemUseRequest
  ): { x: number; y: number } => ({
    x:
      typeof request.worldX === 'number' && Number.isFinite(request.worldX)
        ? request.worldX
        : (request.worldTileX + 0.5) * TILE_SIZE,
    y:
      typeof request.worldY === 'number' && Number.isFinite(request.worldY)
        ? request.worldY
        : (request.worldTileY + 0.5) * TILE_SIZE
  });
  const resolvePointerInspectWorldPoint = (
    pointerInspect: PointerInspectSnapshot
  ): { x: number; y: number } => ({
    x:
      typeof pointerInspect.world?.x === 'number' && Number.isFinite(pointerInspect.world.x)
        ? pointerInspect.world.x
        : (pointerInspect.tile.x + 0.5) * TILE_SIZE,
    y:
      typeof pointerInspect.world?.y === 'number' && Number.isFinite(pointerInspect.world.y)
        ? pointerInspect.world.y
        : (pointerInspect.tile.y + 0.5) * TILE_SIZE
  });
  const tryStartSelectedStarterMeleeWeaponSwing = (
    request: PlayerItemUseRequest
  ): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const startResult = tryStartStarterMeleeWeaponSwing(
      starterMeleeWeaponState,
      resolvePlayerItemUseFacing(standalonePlayerState, request)
    );
    starterMeleeWeaponState = startResult.state;
    if (startResult.started) {
      syncHotbarOverlayState();
    }
    return startResult.started;
  };
  const tryStartSelectedStarterAxeSwingAtTile = (
    worldTileX: number,
    worldTileY: number
  ): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const startResult = tryStartStarterAxeSwing(
      starterAxeChoppingState,
      evaluateStarterAxeChoppingTarget(
        {
          getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
        },
        standalonePlayerState,
        worldTileX,
        worldTileY
      )
    );
    starterAxeChoppingState = startResult.state;
    if (startResult.started) {
      syncHotbarOverlayState();
    }
    return startResult.started;
  };
  const tryStartSelectedStarterBugNetSwing = (
    request: PlayerItemUseRequest
  ): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const startResult = tryStartStarterBugNetSwing(
      starterBugNetState,
      resolvePlayerItemUseFacing(standalonePlayerState, request)
    );
    starterBugNetState = startResult.state;
    if (startResult.started) {
      syncHotbarOverlayState();
    }
    return startResult.started;
  };
  const tryReleaseSelectedPassiveBunnyAtTile = (
    worldTileX: number,
    worldTileY: number
  ): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const releaseEvaluation = evaluatePassiveBunnyRelease(
      {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
        getLiquidLevel: (tileX, tileY) => renderer.getLiquidLevel(tileX, tileY)
      },
      standalonePlayerState,
      worldTileX,
      worldTileY,
      {
        activeBunnies: getPassiveBunnyEntityStates().map((passiveBunny) => passiveBunny.state)
      }
    );
    if (!releaseEvaluation.canRelease || releaseEvaluation.spawnState === null) {
      return false;
    }
    if (!applySelectedStandalonePlayerHotbarSlotConsumption()) {
      return false;
    }

    spawnPassiveBunnyEntity(releaseEvaluation.spawnState);
    return true;
  };
  const tryPlantSelectedAcornAtTile = (worldTileX: number, worldTileY: number): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const plantingResult = tryPlantAcornAtAnchor(
      {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
        setTile: (tileX, tileY, tileId) => applyWorldTileEdit(tileX, tileY, tileId).changed
      },
      standalonePlayerState,
      worldTileX,
      worldTileY
    );
    if (!plantingResult.planted) {
      return false;
    }

    return applySelectedStandalonePlayerHotbarSlotConsumption();
  };
  const tryStartSelectedStarterSpearThrust = (
    request: PlayerItemUseRequest
  ): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const preview = resolveStarterSpearThrustPreview(
      standalonePlayerState,
      resolvePlayerItemUseTargetWorldPoint(request)
    );
    const startResult = tryStartStarterSpearThrust(
      starterSpearState,
      preview.direction
    );
    starterSpearState = startResult.state;
    if (startResult.started) {
      syncHotbarOverlayState();
    }
    return startResult.started;
  };
  const tryUseSelectedStarterWand = (
    request: PlayerItemUseRequest
  ): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const useResult = tryUseStarterWand(
      standalonePlayerState,
      starterWandCooldownState,
      resolvePlayerItemUseTargetWorldPoint(request)
    );
    starterWandCooldownState = useResult.nextCooldownState;
    if (useResult.castStarted) {
      setStandalonePlayerState(useResult.nextPlayerState);
    }
    syncHotbarOverlayState();
    if (!useResult.castStarted || useResult.fireboltState === null) {
      return false;
    }

    spawnStarterWandFireboltEntity(useResult.fireboltState);
    return true;
  };
  const tryStartSelectedStarterPickaxeSwingAtTile = (
    worldTileX: number,
    worldTileY: number
  ): boolean => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return false;
    }

    const startResult = tryStartStarterPickaxeSwing(
      starterPickaxeMiningState,
      evaluateStarterPickaxeMiningTarget(
        {
          getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
          getWall: (tileX, tileY) => renderer.getWall(tileX, tileY)
        },
        standalonePlayerState,
        worldTileX,
        worldTileY
      )
    );
    starterPickaxeMiningState = startResult.state;
    if (startResult.started) {
      syncHotbarOverlayState();
    }
    return startResult.started;
  };
  const stepStarterMeleeWeaponFixedUpdate = (fixedDt: number): void => {
    const hadActiveSwing = starterMeleeWeaponState.activeSwing !== null;
    const standalonePlayerState = getStandalonePlayerState();
    const aliveStandalonePlayerState =
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
        ? null
        : standalonePlayerState;
    const activeHostileSlimes = getHostileSlimeEntityStates();
    const stepResult = stepStarterMeleeWeaponState(starterMeleeWeaponState, {
      playerState: aliveStandalonePlayerState,
      hostileSlimes: activeHostileSlimes.map((hostileSlime) => ({
        entityId: hostileSlime.id,
        state: hostileSlime.state
      })),
      fixedDtSeconds: fixedDt
    });
    starterMeleeWeaponState = stepResult.state;
    if (hadActiveSwing || starterMeleeWeaponState.activeSwing !== null) {
      syncHotbarOverlayState();
    }

    const defeatedHostileSlimeEntityIds: EntityId[] = [];
    const defeatedHostileSlimeDropStates: DroppedItemState[] = [];
    for (const hitEvent of stepResult.hitEvents) {
      const activeHostileSlimeState = entityRegistry.getEntityState<HostileSlimeState>(hitEvent.entityId);
      if (activeHostileSlimeState === null) {
        continue;
      }
      if (isHostileSlimeDefeated(hitEvent.nextHostileSlimeState)) {
        defeatedHostileSlimeEntityIds.push(hitEvent.entityId);
        defeatedHostileSlimeDropStates.push(
          createHostileSlimeDefeatDropState(hitEvent.nextHostileSlimeState)
        );
        continue;
      }
      entityRegistry.setEntityState(hitEvent.entityId, hitEvent.nextHostileSlimeState);
    }
    if (defeatedHostileSlimeEntityIds.length > 0) {
      despawnHostileSlimeEntities(defeatedHostileSlimeEntityIds);
      for (const droppedItemState of defeatedHostileSlimeDropStates) {
        const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(droppedItemState);
        if (remainingDroppedItemState !== null) {
          spawnDroppedItemEntity(remainingDroppedItemState);
        }
      }
    }
  };
  const stepStarterAxeChoppingFixedUpdate = (fixedDt: number): void => {
    const hadActiveSwing = starterAxeChoppingState.activeSwing !== null;
    const standalonePlayerState = getStandalonePlayerState();
    const stepResult = stepStarterAxeChoppingState(starterAxeChoppingState, {
      world: {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
      },
      playerState:
        standalonePlayerState === null ||
        standalonePlayerDeathState !== null ||
        isStandalonePlayerDead(standalonePlayerState)
          ? null
          : standalonePlayerState,
      fixedDtSeconds: fixedDt
    });
    starterAxeChoppingState = stepResult.state;
    if (hadActiveSwing || starterAxeChoppingState.activeSwing !== null) {
      syncHotbarOverlayState();
    }
    if (stepResult.chopEvent === null) {
      return;
    }

    const chopResult = chopSmallTreeAtAnchor(
      {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
        setTile: (tileX, tileY, tileId) => applyWorldTileEdit(tileX, tileY, tileId).changed
      },
      stepResult.chopEvent.anchorTileX,
      stepResult.chopEvent.anchorTileY,
      stepResult.chopEvent.growthStage
    );
    if (
      !chopResult.changed ||
      (chopResult.woodDropAmount <= 0 && chopResult.acornDropAmount <= 0)
    ) {
      return;
    }

    const dropTileX = stepResult.chopEvent.anchorTileX;
    const dropTileY = stepResult.chopEvent.anchorTileY - 1;

    if (chopResult.woodDropAmount > 0) {
      const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(
        createDroppedItemStateFromWorldTile(
          dropTileX,
          dropTileY,
          WOOD_ITEM_ID,
          chopResult.woodDropAmount
        )
      );
      if (remainingDroppedItemState !== null) {
        spawnDroppedItemEntity(remainingDroppedItemState);
      }
    }

    if (chopResult.acornDropAmount > 0) {
      const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(
        createDroppedItemStateFromWorldTile(
          dropTileX,
          dropTileY,
          ACORN_ITEM_ID,
          chopResult.acornDropAmount
        )
      );
      if (remainingDroppedItemState !== null) {
        spawnDroppedItemEntity(remainingDroppedItemState);
      }
    }
  };
  const stepStarterSpearFixedUpdate = (fixedDt: number): void => {
    const hadActiveThrust = starterSpearState.activeThrust !== null;
    const standalonePlayerState = getStandalonePlayerState();
    const aliveStandalonePlayerState =
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
        ? null
        : standalonePlayerState;
    const activeHostileSlimes = getHostileSlimeEntityStates();
    const stepResult = stepStarterSpearState(starterSpearState, {
      playerState: aliveStandalonePlayerState,
      hostileSlimes: activeHostileSlimes.map((hostileSlime) => ({
        entityId: hostileSlime.id,
        state: hostileSlime.state
      })),
      fixedDtSeconds: fixedDt
    });
    starterSpearState = stepResult.state;
    if (hadActiveThrust || starterSpearState.activeThrust !== null) {
      syncHotbarOverlayState();
    }

    const defeatedHostileSlimeEntityIds: EntityId[] = [];
    const defeatedHostileSlimeDropStates: DroppedItemState[] = [];
    for (const hitEvent of stepResult.hitEvents) {
      const activeHostileSlimeState = entityRegistry.getEntityState<HostileSlimeState>(hitEvent.entityId);
      if (activeHostileSlimeState === null) {
        continue;
      }
      if (isHostileSlimeDefeated(hitEvent.nextHostileSlimeState)) {
        defeatedHostileSlimeEntityIds.push(hitEvent.entityId);
        defeatedHostileSlimeDropStates.push(
          createHostileSlimeDefeatDropState(hitEvent.nextHostileSlimeState)
        );
        continue;
      }
      entityRegistry.setEntityState(hitEvent.entityId, hitEvent.nextHostileSlimeState);
    }
    if (defeatedHostileSlimeEntityIds.length > 0) {
      despawnHostileSlimeEntities(defeatedHostileSlimeEntityIds);
      for (const droppedItemState of defeatedHostileSlimeDropStates) {
        const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(droppedItemState);
        if (remainingDroppedItemState !== null) {
          spawnDroppedItemEntity(remainingDroppedItemState);
        }
      }
    }
  };
  const stepStarterBugNetFixedUpdate = (fixedDt: number): void => {
    const hadActiveSwing = starterBugNetState.activeSwing !== null;
    const standalonePlayerState = getStandalonePlayerState();
    const aliveStandalonePlayerState =
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
        ? null
        : standalonePlayerState;
    const activePassiveBunnies = getPassiveBunnyEntityStates();
    const stepResult = stepStarterBugNetState(starterBugNetState, {
      playerState: aliveStandalonePlayerState,
      passiveBunnies: activePassiveBunnies.map((passiveBunny) => ({
        entityId: passiveBunny.id,
        state: passiveBunny.state
      })),
      fixedDtSeconds: fixedDt
    });
    starterBugNetState = stepResult.state;
    if (hadActiveSwing || starterBugNetState.activeSwing !== null) {
      syncHotbarOverlayState();
    }
    if (stepResult.captureEvents.length === 0) {
      return;
    }

    let nextInventoryState = standalonePlayerInventoryState;
    const capturedPassiveBunnyEntityIds: EntityId[] = [];
    for (const captureEvent of stepResult.captureEvents) {
      if (entityRegistry.getEntityState<PassiveBunnyState>(captureEvent.entityId) === null) {
        continue;
      }

      const addResult = addPlayerInventoryItemStack(nextInventoryState, BUNNY_ITEM_ID, 1);
      if (addResult.addedAmount <= 0) {
        continue;
      }

      nextInventoryState = addResult.state;
      capturedPassiveBunnyEntityIds.push(captureEvent.entityId);
    }

    if (capturedPassiveBunnyEntityIds.length === 0) {
      return;
    }

    applyStandalonePlayerInventoryState(nextInventoryState);
    despawnPassiveBunnyEntities(capturedPassiveBunnyEntityIds);
  };
  const stepStarterPickaxeMiningFixedUpdate = (fixedDt: number): void => {
    const hadActiveSwing = starterPickaxeMiningState.activeSwing !== null;
    const standalonePlayerState = getStandalonePlayerState();
    const stepResult = stepStarterPickaxeMiningState(starterPickaxeMiningState, {
      world: {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
        getWall: (tileX, tileY) => renderer.getWall(tileX, tileY)
      },
      playerState:
        standalonePlayerState === null ||
        standalonePlayerDeathState !== null ||
        isStandalonePlayerDead(standalonePlayerState)
          ? null
          : standalonePlayerState,
      fixedDtSeconds: fixedDt
    });
    starterPickaxeMiningState = stepResult.state;
    if (hadActiveSwing || starterPickaxeMiningState.activeSwing !== null) {
      syncHotbarOverlayState();
    }
    if (stepResult.hitEvent?.brokeTarget !== true) {
      return;
    }

    if (stepResult.hitEvent.targetLayer === 'wall') {
      applyWorldWallEdit(stepResult.hitEvent.tileX, stepResult.hitEvent.tileY, 0);
      return;
    }

    const editResult = applyWorldTileEdit(
      stepResult.hitEvent.tileX,
      stepResult.hitEvent.tileY,
      DEBUG_TILE_BREAK_ID
    );
    if (!editResult.changed) {
      return;
    }

    const brokenTileDrop = resolveStarterPickaxeBrokenTileDrop(editResult.previousTileId);
    if (brokenTileDrop === null) {
      // Placeable utility tiles such as rope, torch, or workbench refund through renderer
      // tile-edit notifications so every removal path shares the same merge-aware pickup cascade.
      return;
    }

    const remainingDroppedItemState = mergeDroppedItemIntoNearbyPickup(
      createDroppedItemStateFromWorldTile(
        stepResult.hitEvent.tileX,
        stepResult.hitEvent.tileY,
        brokenTileDrop.itemId,
        brokenTileDrop.amount
      )
    );
    if (remainingDroppedItemState !== null) {
      spawnDroppedItemEntity(remainingDroppedItemState);
    }
  };
  const stepSmallTreeGrowthFixedUpdate = (): void => {
    syncTrackedSmallTreeGrowthAnchorsWithResidentChunks();

    if (smallTreeGrowthState.ticksUntilNextGrowth > 1) {
      smallTreeGrowthState = {
        ticksUntilNextGrowth: smallTreeGrowthState.ticksUntilNextGrowth - 1,
        nextWindowIndex: smallTreeGrowthState.nextWindowIndex
      };
      return;
    }

    const trackedResidentAnchors: SmallTreeGrowthTrackedAnchor[] = [];
    for (const trackedAnchor of trackedSmallTreeGrowthAnchors.values()) {
      if (
        !isSmallTreeGrowthTrackedAnchorResident(
          trackedAnchor,
          (chunkX, chunkY) => renderer.hasResidentChunk(chunkX, chunkY)
        )
      ) {
        continue;
      }

      trackedResidentAnchors.push(trackedAnchor);
    }

    const growthStep = stepSmallTreeGrowth({
      world: {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
        setTile: (tileX, tileY, tileId) => renderer.setTile(tileX, tileY, tileId)
      },
      growthState: smallTreeGrowthState,
      trackedAnchors: trackedResidentAnchors
    });
    smallTreeGrowthState = growthStep.nextGrowthState;
  };
  const stepGrassGrowthFixedUpdate = (): void => {
    const growthStep = stepGrassGrowth({
      world: {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
        setTile: (tileX, tileY, tileId) => renderer.setTile(tileX, tileY, tileId),
        getLightLevel: (tileX, tileY) => renderer.getLightLevel(tileX, tileY),
        hasResidentChunk: (chunkX, chunkY) => renderer.hasResidentChunk(chunkX, chunkY),
        getResidentChunkBounds: () => renderer.getResidentChunkBounds()
      },
      growthState: grassGrowthState
    });
    grassGrowthState = growthStep.nextGrowthState;
  };
  const applySelectedStandalonePlayerItemUse = (request: PlayerItemUseRequest): boolean => {
    if (debugEditControlsVisible) {
      return false;
    }

    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack === null) {
      return false;
    }
    if (selectedStack.itemId === STARTER_AXE_ITEM_ID) {
      return tryStartSelectedStarterAxeSwingAtTile(
        request.worldTileX,
        request.worldTileY
      );
    }
    if (selectedStack.itemId === STARTER_MELEE_WEAPON_ITEM_ID) {
      return tryStartSelectedStarterMeleeWeaponSwing(request);
    }
    if (selectedStack.itemId === STARTER_SPEAR_ITEM_ID) {
      return tryStartSelectedStarterSpearThrust(request);
    }
    if (selectedStack.itemId === STARTER_WAND_ITEM_ID) {
      return tryUseSelectedStarterWand(request);
    }
    if (selectedStack.itemId === STARTER_PICKAXE_ITEM_ID) {
      return tryStartSelectedStarterPickaxeSwingAtTile(
        request.worldTileX,
        request.worldTileY
      );
    }
    if (selectedStack.itemId === STARTER_BUG_NET_ITEM_ID) {
      return tryStartSelectedStarterBugNetSwing(request);
    }
    if (selectedStack.itemId === BUNNY_ITEM_ID) {
      return tryReleaseSelectedPassiveBunnyAtTile(
        request.worldTileX,
        request.worldTileY
      );
    }
    if (selectedStack.itemId === ACORN_ITEM_ID) {
      return tryPlantSelectedAcornAtTile(request.worldTileX, request.worldTileY);
    }
    if (selectedStack.itemId === HEALING_POTION_ITEM_ID) {
      return tryUseSelectedHealingPotion();
    }
    if (selectedStack.itemId === HEART_CRYSTAL_ITEM_ID) {
      return tryUseSelectedHeartCrystal();
    }

    const placementPreview = getSelectedStandalonePlayerItemPlacementPreviewAtTile(
      request.worldTileX,
      request.worldTileY
    );
    if (!placementPreview?.canPlace) {
      return false;
    }

    let placementTileId: number | null = null;
    let placementWallId: number | null = null;
    if (isPlaceableSolidBlockItemId(selectedStack.itemId)) {
      placementTileId = resolvePlaceableSolidBlockTileId(selectedStack.itemId);
    } else if (isPlaceableBackgroundWallItemId(selectedStack.itemId)) {
      placementWallId = resolvePlaceableBackgroundWallId(selectedStack.itemId);
    } else {
      switch (selectedStack.itemId) {
        case STARTER_ANVIL_ITEM_ID:
          placementTileId = STARTER_ANVIL_TILE_ID;
          break;
        case STARTER_FURNACE_ITEM_ID:
          placementTileId = STARTER_FURNACE_TILE_ID;
          break;
        case STARTER_WORKBENCH_ITEM_ID:
          placementTileId = STARTER_WORKBENCH_TILE_ID;
          break;
        case STARTER_TORCH_ITEM_ID:
          placementTileId = STARTER_TORCH_TILE_ID;
          break;
        case STARTER_ROPE_ITEM_ID:
          placementTileId = STARTER_ROPE_TILE_ID;
          break;
        case STARTER_PLATFORM_ITEM_ID:
          placementTileId = STARTER_PLATFORM_TILE_ID;
          break;
        default:
          return false;
      }
    }
    if (placementTileId === null && placementWallId === null) {
      return false;
    }

    const editResult =
      placementWallId === null
        ? applyWorldTileEdit(
            placementPreview.placementTileX,
            placementPreview.placementTileY,
            placementTileId as number
          )
        : applyWorldWallEdit(
            placementPreview.placementTileX,
            placementPreview.placementTileY,
            placementWallId
          );
    if (!editResult.changed) {
      return false;
    }

    return applySelectedStandalonePlayerHotbarSlotConsumption();
  };

  const getSelectedStandalonePlayerItemPlacementPreviewAtTile = (
    worldTileX: number,
    worldTileY: number
  ): PlayerItemPlacementPreviewState | null => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return null;
    }

    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack === null) {
      return null;
    }

    let placement: Omit<
      PlayerItemPlacementPreviewState,
      'tileX' | 'tileY' | 'placementTileX' | 'placementTileY'
    > | null = null;
    let placementTileX = worldTileX;
    let placementTileY = worldTileY;
    if (isPlaceableSolidBlockItemId(selectedStack.itemId)) {
      placement = evaluateStarterBlockPlacement(
        {
          getTile: (worldTileX, worldTileY) => renderer.getTile(worldTileX, worldTileY)
        },
        standalonePlayerState,
        worldTileX,
        worldTileY
      );
    } else if (isPlaceableBackgroundWallItemId(selectedStack.itemId)) {
      const wallPlacement = evaluateStarterWallPlacement(
        {
          getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
          getWall: (tileX, tileY) => renderer.getWall(tileX, tileY)
        },
        worldTileX,
        worldTileY
      );
      placement = {
        occupied: wallPlacement.occupied,
        hasSolidFaceSupport: wallPlacement.enclosed,
        blockedByPlayer: false,
        canPlace: wallPlacement.canPlace
      };
    } else {
      switch (selectedStack.itemId) {
        case ACORN_ITEM_ID: {
          const plantingEvaluation = evaluateAcornPlantingAtAnchor(
            {
              getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
            },
            standalonePlayerState,
            worldTileX,
            worldTileY
          );

          return {
            tileX: worldTileX,
            tileY: worldTileY,
            placementTileX: worldTileX,
            placementTileY: worldTileY,
            canPlace: plantingEvaluation.canPlant,
            occupied:
              plantingEvaluation.site.anchorTileId !== 0 &&
              !plantingEvaluation.site.hasGrassAnchor,
            hasSolidFaceSupport: plantingEvaluation.site.hasGrassAnchor,
            blockedByPlayer: false
          };
        }
        case STARTER_ANVIL_ITEM_ID:
          placement = evaluateStarterAnvilPlacement(
            {
              getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
            },
            worldTileX,
            worldTileY
          );
          break;
        case STARTER_FURNACE_ITEM_ID:
          placement = evaluateStarterFurnacePlacement(
            {
              getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
            },
            worldTileX,
            worldTileY
          );
          break;
        case STARTER_WORKBENCH_ITEM_ID:
          placement = evaluateStarterWorkbenchPlacement(
            {
              getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
            },
            worldTileX,
            worldTileY
          );
          break;
        case STARTER_TORCH_ITEM_ID:
          placement = evaluateStarterTorchPlacement(
            {
              getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
            },
            worldTileX,
            worldTileY
          );
          break;
        case STARTER_ROPE_ITEM_ID:
          ({
            tileX: placementTileX,
            tileY: placementTileY
          } = resolveStarterRopePlacementTarget(
            {
              getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
            },
            worldTileX,
            worldTileY
          ));
          placement = evaluateStarterRopePlacement(
            {
              getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
            },
            placementTileX,
            placementTileY
          );
          break;
        case STARTER_PLATFORM_ITEM_ID:
          placement = evaluateStarterPlatformPlacement(
            {
              getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
            },
            worldTileX,
            worldTileY
          );
          break;
        default:
          return null;
      }
    }
    if (placement === null) {
      return null;
    }
    const placementRange = evaluatePlayerHotbarTilePlacementRange(
      standalonePlayerState,
      worldTileX,
      worldTileY
    );

    return {
      tileX: worldTileX,
      tileY: worldTileY,
      placementTileX,
      placementTileY,
      ...placement,
      canPlace: placement.canPlace && placementRange.withinRange
    };
  };
  const getSelectedStandalonePlayerItemBunnyReleasePreviewAtTile = (
    worldTileX: number,
    worldTileY: number
  ): PlayerItemBunnyReleasePreviewState | null => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return null;
    }

    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== BUNNY_ITEM_ID) {
      return null;
    }

    const releaseEvaluation = evaluatePassiveBunnyRelease(
      {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
        getLiquidLevel: (tileX, tileY) => renderer.getLiquidLevel(tileX, tileY)
      },
      standalonePlayerState,
      worldTileX,
      worldTileY,
      {
        activeBunnies: getPassiveBunnyEntityStates().map((passiveBunny) => passiveBunny.state)
      }
    );

    return {
      tileX: worldTileX,
      tileY: worldTileY,
      canRelease: releaseEvaluation.canRelease,
      placementRangeWithinReach: releaseEvaluation.placementRangeWithinReach,
      landingTile: releaseEvaluation.landingTile
    };
  };
  const getSelectedStandalonePlayerItemSpearPreview = (
    pointerInspect: PointerInspectSnapshot | null
  ): PlayerItemSpearPreviewState | null => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return null;
    }

    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_SPEAR_ITEM_ID) {
      return null;
    }

    const activeThrust = starterSpearState.activeThrust;
    const playerFocusPoint = getPlayerCameraFocusPoint(standalonePlayerState);
    if (activeThrust !== null) {
      return {
        startWorldX: playerFocusPoint.x,
        startWorldY: playerFocusPoint.y,
        endWorldX: playerFocusPoint.x + activeThrust.direction.x * DEFAULT_STARTER_SPEAR_REACH,
        endWorldY: playerFocusPoint.y + activeThrust.direction.y * DEFAULT_STARTER_SPEAR_REACH,
        activeThrust: true,
        clampedByReach: false
      };
    }

    if (pointerInspect === null) {
      return null;
    }

    const preview = resolveStarterSpearThrustPreview(
      standalonePlayerState,
      resolvePointerInspectWorldPoint(pointerInspect)
    );
    return {
      startWorldX: preview.originWorldPoint.x,
      startWorldY: preview.originWorldPoint.y,
      endWorldX: preview.endWorldPoint.x,
      endWorldY: preview.endWorldPoint.y,
      activeThrust: false,
      clampedByReach: preview.clampedByReach
    };
  };
  const getSelectedStandalonePlayerItemAxeChopPreviewAtTile = (
    worldTileX: number,
    worldTileY: number,
    activeSwing = starterAxeChoppingState.activeSwing
  ): PlayerItemAxeChopPreviewState | null => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return null;
    }

    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_AXE_ITEM_ID) {
      return null;
    }

    const choppingEvaluation = evaluateStarterAxeChoppingTarget(
      {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY)
      },
      standalonePlayerState,
      worldTileX,
      worldTileY
    );
    const activeSwingTargetGrowthStage =
      activeSwing !== null && activeSwing.phase !== 'windup' ? activeSwing.targetGrowthStage : null;

    return {
      tileX: worldTileX,
      tileY: worldTileY,
      canChop: choppingEvaluation.canChop,
      occupied: choppingEvaluation.occupied,
      chopTarget: choppingEvaluation.chopTarget,
      withinRange: choppingEvaluation.withinRange,
      growthStage: choppingEvaluation.resolvedAnchor?.growthStage ?? activeSwingTargetGrowthStage,
      activeSwing: activeSwing !== null && activeSwing.phase !== 'windup'
    };
  };
  const getSelectedStandalonePlayerItemAxeChopPreview = (
    pointerInspect: PointerInspectSnapshot | null
  ): PlayerItemAxeChopPreviewState | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_AXE_ITEM_ID) {
      return null;
    }

    const activeSwing = starterAxeChoppingState.activeSwing;
    if (activeSwing !== null) {
      return getSelectedStandalonePlayerItemAxeChopPreviewAtTile(
        activeSwing.sampledTileX,
        activeSwing.sampledTileY,
        activeSwing
      );
    }

    if (pointerInspect !== null) {
      return getSelectedStandalonePlayerItemAxeChopPreviewAtTile(
        pointerInspect.tile.x,
        pointerInspect.tile.y,
        null
      );
    }

    return null;
  };
  const getSelectedStandalonePlayerItemMiningPreviewAtTile = (
    worldTileX: number,
    worldTileY: number
  ): PlayerItemMiningPreviewState | null => {
    const standalonePlayerState = getStandalonePlayerState();
    if (
      standalonePlayerState === null ||
      standalonePlayerDeathState !== null ||
      isStandalonePlayerDead(standalonePlayerState)
    ) {
      return null;
    }

    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_PICKAXE_ITEM_ID) {
      return null;
    }

    const miningEvaluation = evaluateStarterPickaxeMiningTarget(
      {
        getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
        getWall: (tileX, tileY) => renderer.getWall(tileX, tileY)
      },
      standalonePlayerState,
      worldTileX,
      worldTileY
    );

    return {
      tileX: worldTileX,
      tileY: worldTileY,
      canMine: miningEvaluation.canMine,
      occupied: miningEvaluation.occupied,
      breakableTarget: miningEvaluation.breakableTarget,
      withinRange: miningEvaluation.withinRange,
      progressNormalized: resolveStarterPickaxeBreakProgressNormalized(
        starterPickaxeMiningState,
        {
          getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
          getWall: (tileX, tileY) => renderer.getWall(tileX, tileY)
        },
        worldTileX,
        worldTileY
      )
    };
  };
  const getSelectedStandalonePlayerItemMiningPreview = (
    pointerInspect: PointerInspectSnapshot | null
  ): PlayerItemMiningPreviewState | null => {
    const selectedStack = getSelectedStandalonePlayerInventoryStack();
    if (selectedStack?.itemId !== STARTER_PICKAXE_ITEM_ID) {
      return null;
    }

    const activeSwing = starterPickaxeMiningState.activeSwing;
    if (activeSwing !== null) {
      return getSelectedStandalonePlayerItemMiningPreviewAtTile(
        activeSwing.tileX,
        activeSwing.tileY
      );
    }

    if (pointerInspect !== null) {
      return getSelectedStandalonePlayerItemMiningPreviewAtTile(
        pointerInspect.tile.x,
        pointerInspect.tile.y
      );
    }

    const breakProgress = starterPickaxeMiningState.breakProgress;
    if (
      breakProgress === null ||
      resolveStarterPickaxeBreakProgressNormalized(
        starterPickaxeMiningState,
        {
          getTile: (tileX, tileY) => renderer.getTile(tileX, tileY),
          getWall: (tileX, tileY) => renderer.getWall(tileX, tileY)
        },
        breakProgress.tileX,
        breakProgress.tileY
      ) <= 0
    ) {
      return null;
    }

    return getSelectedStandalonePlayerItemMiningPreviewAtTile(
      breakProgress.tileX,
      breakProgress.tileY
    );
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

  const applyDebugHistoryEdit = (
    worldTileX: number,
    worldTileY: number,
    layer: DebugTileEditLayer,
    id: number
  ): void => {
    if (layer === 'wall') {
      applyWorldWallEdit(worldTileX, worldTileY, id, 'debug-history');
      return;
    }

    applyWorldTileEdit(worldTileX, worldTileY, id, 'debug-history');
  };

  const recordDebugHistoryChange = (
    strokeId: number,
    worldTileX: number,
    worldTileY: number,
    historyChange: DebugWorldHistoryChange | null
  ): void => {
    if (historyChange === null) return;

    debugTileEditHistory.recordAppliedEdit(
      strokeId,
      worldTileX,
      worldTileY,
      historyChange.previousId,
      historyChange.id,
      historyChange.layer
    );
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
      readTile:
        kind === 'place'
          ? (fillTileX, fillTileY) => renderer.getTile(fillTileX, fillTileY)
          : readDebugBreakFloodFillTargetId,
      visitFilledTile: (fillTileX, fillTileY) => {
        const result = applyDebugWorldEdit(fillTileX, fillTileY, kind);
        if (!result.changed) return;
        recordDebugHistoryChange(strokeId, fillTileX, fillTileY, result.historyChange);
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
    let changedTileCount = 0;
    walkLineSteppedTilePath(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const result = applyDebugWorldEdit(worldTileX, worldTileY, kind);
      if (!result.changed) return;
      recordDebugHistoryChange(strokeId, worldTileX, worldTileY, result.historyChange);
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
    let changedTileCount = 0;
    walkFilledRectangleTileArea(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const result = applyDebugWorldEdit(worldTileX, worldTileY, kind);
      if (!result.changed) return;
      recordDebugHistoryChange(strokeId, worldTileX, worldTileY, result.historyChange);
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
    let changedTileCount = 0;
    walkRectangleOutlineTileArea(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const result = applyDebugWorldEdit(worldTileX, worldTileY, kind);
      if (!result.changed) return;
      recordDebugHistoryChange(strokeId, worldTileX, worldTileY, result.historyChange);
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
    let changedTileCount = 0;
    walkFilledEllipseTileArea(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const result = applyDebugWorldEdit(worldTileX, worldTileY, kind);
      if (!result.changed) return;
      recordDebugHistoryChange(strokeId, worldTileX, worldTileY, result.historyChange);
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
    let changedTileCount = 0;
    walkEllipseOutlineTileArea(startTileX, startTileY, endTileX, endTileY, (worldTileX, worldTileY) => {
      const result = applyDebugWorldEdit(worldTileX, worldTileY, kind);
      if (!result.changed) return;
      recordDebugHistoryChange(strokeId, worldTileX, worldTileY, result.historyChange);
      changedTileCount += 1;
    });
    return changedTileCount;
  };

  const undoDebugTileStroke = (): boolean => {
    if (!debugTileEditHistory.undo(applyDebugHistoryEdit)) return false;
    syncDebugEditHistoryControls();
    return true;
  };

  const redoDebugTileStroke = (): boolean => {
    if (!debugTileEditHistory.redo(applyDebugHistoryEdit)) return false;
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
    shellActionKeybindings,
    onBrushTileIdChange: (tileId) => {
      commitDebugEditBrushTileId(tileId);
    },
    initialCollapsed: preferenceSnapshot.panelCollapsed,
    onCollapsedChange: (collapsed) => {
      commitDebugEditControlStateAction({
        type: 'set-panel-collapsed',
        collapsed
      });
      syncCraftingPanelVisibility();
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
      },
      onClimbDownHeldChange: (held) => {
        input.setTouchPlayerClimbDownHeld(held);
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

  const resolveDebugTileLiquidSurfaceLevelNeighborhood = (
    tileX: number,
    tileY: number,
    tileId: number,
    liquidLevel: number,
    liquidKind: DebugEditHoveredTileState['liquidKind']
  ): LiquidSurfaceLevelNeighborhood | null => {
    if (liquidKind === null) {
      return null;
    }

    return {
      center: liquidLevel,
      north: resolveConnectedLiquidNeighborLevel(
        tileId,
        renderer.getTile(tileX, tileY - 1),
        renderer.getLiquidLevel(tileX, tileY - 1)
      ),
      east: resolveConnectedLiquidNeighborLevel(
        tileId,
        renderer.getTile(tileX + 1, tileY),
        renderer.getLiquidLevel(tileX + 1, tileY)
      ),
      west: resolveConnectedLiquidNeighborLevel(
        tileId,
        renderer.getTile(tileX - 1, tileY),
        renderer.getLiquidLevel(tileX - 1, tileY)
      )
    };
  };

  const getDebugTileStatusAtTile = (
    tileX: number,
    tileY: number,
    elapsedMs: number
  ): DebugEditHoveredTileState => {
    const tileId = renderer.getTile(tileX, tileY);
    const wallId = renderer.getWall(tileX, tileY);
    const liquidLevel = renderer.getLiquidLevel(tileX, tileY);
    const tileMetadata = getTileMetadata(tileId);
    const gameplay = resolveTileGameplayMetadata(tileId);
    const { chunkX, chunkY } = worldToChunkCoord(tileX, tileY);
    const { localX, localY } = worldToLocalTile(tileX, tileY);
    const showWallInspect = tileId === 0 && wallId !== 0;
    const wallMetadata = showWallInspect ? getWallMetadata(wallId) : null;
    const liquidSurfaceLevelNeighborhood = resolveDebugTileLiquidSurfaceLevelNeighborhood(
      tileX,
      tileY,
      tileId,
      liquidLevel,
      gameplay.liquidKind ?? null
    );
    const liquidSurfaceTopHeights = liquidSurfaceLevelNeighborhood
      ? resolveLiquidSurfaceTopHeights(liquidSurfaceLevelNeighborhood)
      : null;
    const liquidSurfaceBranch = liquidSurfaceLevelNeighborhood
      ? resolveLiquidSurfaceBranchKind(liquidSurfaceLevelNeighborhood)
      : null;
    const liquidCardinalMask = renderer.getLiquidRenderCardinalMask(tileX, tileY);
    const isNonLiquidTile = gameplay.liquidKind === undefined || gameplay.liquidKind === null;
    const tileAnimationFrameCount = isNonLiquidTile ? getAnimatedTileRenderFrameCount(tileId) : 0;
    const tileAnimationFrameIndex =
      isNonLiquidTile && tileAnimationFrameCount > 0
        ? resolveAnimatedTileRenderFrameIndexAtElapsedMs(tileId, elapsedMs)
        : null;
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
    const liquidVariantUvRect =
      typeof liquidCardinalMask === 'number'
        ? resolveLiquidRenderVariantUvRectAtElapsedMs(tileId, liquidCardinalMask, elapsedMs)
        : null;
    const atlasWidth = renderer.telemetry.atlasWidth;
    const atlasHeight = renderer.telemetry.atlasHeight;
    const tileRenderSource = isNonLiquidTile ? describeTileRenderSourceAtElapsedMs(tileId, elapsedMs) : null;
    const tileRenderUvRect = isNonLiquidTile ? describeTileRenderUvRectAtElapsedMs(tileId, elapsedMs) : null;
    const tileRenderPixelBounds =
      isNonLiquidTile &&
      typeof atlasWidth === 'number' &&
      Number.isFinite(atlasWidth) &&
      atlasWidth > 0 &&
      typeof atlasHeight === 'number' &&
      Number.isFinite(atlasHeight) &&
      atlasHeight > 0
        ? describeTileRenderPixelBoundsAtElapsedMs(tileId, elapsedMs, atlasWidth, atlasHeight)
        : null;
    const wallRenderSource = showWallInspect ? describeWallRenderSource(wallId) : null;
    const wallRenderUvRect = showWallInspect ? describeWallRenderUvRect(wallId) : null;
    const wallRenderPixelBounds =
      showWallInspect &&
      typeof atlasWidth === 'number' &&
      Number.isFinite(atlasWidth) &&
      atlasWidth > 0 &&
      typeof atlasHeight === 'number' &&
      Number.isFinite(atlasHeight) &&
      atlasHeight > 0
        ? describeWallRenderPixelBounds(wallId, atlasWidth, atlasHeight)
        : null;
    const liquidFrameTopV = liquidVariantUvRect ? resolveLiquidSurfaceFrameTopV(liquidVariantUvRect) : null;
    const liquidFrameTopPixelY =
      liquidVariantUvRect &&
      typeof atlasHeight === 'number' &&
      Number.isFinite(atlasHeight) &&
      atlasHeight > 0
        ? resolveLiquidSurfaceFrameTopAtlasPixelRow(atlasHeight, liquidVariantUvRect)
        : null;
    const liquidFrameBottomV = liquidVariantUvRect
      ? resolveLiquidSurfaceFrameBottomV(liquidVariantUvRect)
      : null;
    const liquidFrameBottomPixelY =
      liquidVariantUvRect &&
      typeof atlasHeight === 'number' &&
      Number.isFinite(atlasHeight) &&
      atlasHeight > 0
        ? resolveLiquidSurfaceFrameBottomAtlasPixelRow(atlasHeight, liquidVariantUvRect)
        : null;
    const liquidFrameHeightV = liquidVariantUvRect
      ? resolveLiquidSurfaceFrameHeightV(liquidVariantUvRect)
      : null;
    const liquidFramePixelHeight =
      liquidVariantUvRect &&
      typeof atlasHeight === 'number' &&
      Number.isFinite(atlasHeight) &&
      atlasHeight > 0
        ? resolveLiquidSurfaceFrameAtlasPixelHeight(atlasHeight, liquidVariantUvRect)
        : null;
    const liquidBottomVCrops =
      liquidSurfaceTopHeights && liquidVariantUvRect
        ? resolveLiquidSurfaceBottomVCrops(liquidVariantUvRect, liquidSurfaceTopHeights)
        : null;
    const liquidBottomPixelRows =
      liquidBottomVCrops && typeof atlasHeight === 'number' && Number.isFinite(atlasHeight) && atlasHeight > 0
        ? resolveLiquidSurfaceBottomAtlasPixelRows(atlasHeight, liquidBottomVCrops)
        : null;
    const liquidVisibleFrameHeights =
      liquidBottomVCrops && liquidVariantUvRect
        ? resolveLiquidSurfaceVisibleFrameHeights(liquidVariantUvRect, liquidBottomVCrops)
        : null;
    const liquidVisiblePercentages =
      liquidBottomVCrops && liquidVariantUvRect
        ? resolveLiquidSurfaceVisibleFramePercentages(liquidVariantUvRect, liquidBottomVCrops)
        : null;
    const liquidVisiblePixelHeights =
      liquidBottomVCrops &&
      liquidVariantUvRect &&
      typeof atlasHeight === 'number' &&
      Number.isFinite(atlasHeight) &&
      atlasHeight > 0
        ? resolveLiquidSurfaceVisibleFrameAtlasPixelHeights(
            atlasHeight,
            liquidVariantUvRect,
            liquidBottomVCrops
          )
        : null;
    const liquidCoveragePercentageTotals =
      liquidBottomVCrops && liquidVariantUvRect
        ? resolveLiquidSurfaceCoveragePercentageTotals(liquidVariantUvRect, liquidBottomVCrops)
        : null;
    const liquidRemainderFrameHeights =
      liquidBottomVCrops && liquidVariantUvRect
        ? resolveLiquidSurfaceCroppedFrameRemainders(liquidVariantUvRect, liquidBottomVCrops)
        : null;
    const liquidRemainderPercentages =
      liquidBottomVCrops && liquidVariantUvRect
        ? resolveLiquidSurfaceCroppedFramePercentages(liquidVariantUvRect, liquidBottomVCrops)
        : null;
    const liquidRemainderPixelHeights =
      liquidBottomVCrops &&
      liquidVariantUvRect &&
      typeof atlasHeight === 'number' &&
      Number.isFinite(atlasHeight) &&
      atlasHeight > 0
        ? resolveLiquidSurfaceCroppedFrameAtlasPixelHeights(
            atlasHeight,
            liquidVariantUvRect,
            liquidBottomVCrops
          )
        : null;
    const liquidCoveragePixelHeightTotals =
      liquidBottomVCrops &&
      liquidVariantUvRect &&
      typeof atlasHeight === 'number' &&
      Number.isFinite(atlasHeight) &&
      atlasHeight > 0
        ? resolveLiquidSurfaceCoverageAtlasPixelHeightTotals(
            atlasHeight,
            liquidVariantUvRect,
            liquidBottomVCrops
          )
        : null;

    return {
      liquidLevel,
      liquidSurfaceNorthLevel: liquidSurfaceLevelNeighborhood?.north ?? null,
      liquidSurfaceWestLevel: liquidSurfaceLevelNeighborhood?.west ?? null,
      liquidSurfaceCenterLevel: liquidSurfaceLevelNeighborhood?.center ?? null,
      liquidSurfaceEastLevel: liquidSurfaceLevelNeighborhood?.east ?? null,
      liquidSurfaceBranch,
      liquidSurfaceTopLeft: liquidSurfaceTopHeights?.topLeft ?? null,
      liquidSurfaceTopRight: liquidSurfaceTopHeights?.topRight ?? null,
      liquidFrameTopV,
      liquidFrameTopPixelY,
      liquidFrameBottomV,
      liquidFrameBottomPixelY,
      liquidFrameHeightV,
      liquidFramePixelHeight,
      liquidBottomLeftV: liquidBottomVCrops?.bottomLeftV ?? null,
      liquidBottomRightV: liquidBottomVCrops?.bottomRightV ?? null,
      liquidBottomLeftPixelY: liquidBottomPixelRows?.bottomLeftPixelY ?? null,
      liquidBottomRightPixelY: liquidBottomPixelRows?.bottomRightPixelY ?? null,
      liquidVisibleLeftV: liquidVisibleFrameHeights?.visibleLeftV ?? null,
      liquidVisibleRightV: liquidVisibleFrameHeights?.visibleRightV ?? null,
      liquidVisibleLeftPercentage: liquidVisiblePercentages?.visibleLeftPercentage ?? null,
      liquidVisibleRightPercentage: liquidVisiblePercentages?.visibleRightPercentage ?? null,
      liquidVisibleLeftPixelHeight: liquidVisiblePixelHeights?.visibleLeftPixelHeight ?? null,
      liquidVisibleRightPixelHeight: liquidVisiblePixelHeights?.visibleRightPixelHeight ?? null,
      liquidRemainderLeftV: liquidRemainderFrameHeights?.remainderLeftV ?? null,
      liquidRemainderRightV: liquidRemainderFrameHeights?.remainderRightV ?? null,
      liquidRemainderLeftPercentage: liquidRemainderPercentages?.remainderLeftPercentage ?? null,
      liquidRemainderRightPercentage:
        liquidRemainderPercentages?.remainderRightPercentage ?? null,
      liquidRemainderLeftPixelHeight: liquidRemainderPixelHeights?.remainderLeftPixelHeight ?? null,
      liquidRemainderRightPixelHeight:
        liquidRemainderPixelHeights?.remainderRightPixelHeight ?? null,
      liquidCoverageLeftTotalPercentage:
        liquidCoveragePercentageTotals?.leftTotalPercentage ?? null,
      liquidCoverageRightTotalPercentage:
        liquidCoveragePercentageTotals?.rightTotalPercentage ?? null,
      liquidCoverageLeftTotalPixelHeight:
        liquidCoveragePixelHeightTotals?.leftTotalPixelHeight ?? null,
      liquidCoverageRightTotalPixelHeight:
        liquidCoveragePixelHeightTotals?.rightTotalPixelHeight ?? null,
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
        liquidVariantUvRect && typeof liquidCardinalMask === 'number'
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
      tileAnimationFrameIndex,
      tileAnimationFrameCount: tileAnimationFrameCount > 0 ? tileAnimationFrameCount : null,
      tileRenderSource,
      tileRenderUvRect,
      tileRenderPixelBounds,
      wallId: showWallInspect ? wallId : null,
      wallLabel: showWallInspect ? (wallMetadata ? formatDebugBrushLabel(wallMetadata.name) : `wall ${wallId}`) : null,
      wallRenderSource,
      wallRenderUvRect,
      wallRenderPixelBounds,
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
    replaceWorldSessionEntityRegistry();
    resolvedPlayerSpawn = null;
    playerSpawnNeedsRefresh = false;
    refreshResolvedPlayerSpawn();
  };
  const resetFreshWorldSessionRuntimeState = (): void => {
    renderer.resetWorld(createRandomWorldSeed());
    clearTrackedSmallTreeGrowthAnchors();
    resetFreshWorldSessionDebugEditState();
    clearPinnedDebugTileInspect();
    resetFreshWorldSessionCameraAndPlayerState();
    applyStandalonePlayerInventoryState(createDefaultPlayerInventoryState());
    applyStandalonePlayerEquipmentState(createDefaultPlayerEquipmentState());
  };
  const ensureWorldSessionLoopStarted = (): void => {
    if (loop === null || worldSessionLoopStarted) {
      return;
    }

    loop.start();
    worldSessionLoopStarted = true;
  };
  const enterOrResumeWorldSessionFromMainMenu = (): void => {
    if (loop === null) return;
    pausedMainMenuWorldSaveCleared = false;
    pausedMainMenuExportResult = null;
    pausedMainMenuImportResult = null;
    pausedMainMenuClearSavedWorldResult = null;
    pausedMainMenuResetShellTogglesResult = null;
    pausedMainMenuResetShellTelemetryResult = null;
    pausedMainMenuRecentActivityAction = null;
    applyPausedMainMenuWorldSessionShellTransition('resume-paused-world-session');
    enterInWorldShellState();
    if (!worldSessionStarted) {
      worldSessionStarted = true;
      persistCurrentWorldSession();
    }
    ensureWorldSessionLoopStarted();
  };
  const startFreshWorldSessionFromMainMenu = (): void => {
    if (loop === null || !worldSessionStarted) return;
    pausedMainMenuWorldSaveCleared = false;
    pausedMainMenuSavedWorldStatus = null;
    pausedMainMenuExportResult = null;
    pausedMainMenuImportResult = null;
    pausedMainMenuClearSavedWorldResult = null;
    pausedMainMenuResetShellTogglesResult = null;
    pausedMainMenuResetShellTelemetryResult = null;
    pausedMainMenuRecentActivityAction = null;
    clearPersistedCurrentWorldSession();
    applyPausedMainMenuWorldSessionShellTransition('start-fresh-world-session');
    resetFreshWorldSessionRuntimeState();
    persistCurrentWorldSession();
    enterInWorldShellState();
    ensureWorldSessionLoopStarted();
  };
  const clearPausedMainMenuPersistedWorldSession = (): boolean => {
    if (loop === null || !worldSessionStarted) return false;
    if (!clearPersistedCurrentWorldSession()) {
      pausedMainMenuClearSavedWorldResult = {
        status: 'failed',
        reason: resolveClearPersistedCurrentWorldSessionFailureReason()
      };
      pausedMainMenuRecentActivityAction = 'clear-saved-world';
      console.warn(
        'Failed to clear persisted world save.',
        pausedMainMenuClearSavedWorldResult.reason
      );
      showMainMenuShellState();
      return false;
    }
    pausedMainMenuClearSavedWorldResult = null;
    pausedMainMenuWorldSaveCleared = true;
    pausedMainMenuSavedWorldStatus = 'cleared';
    pausedMainMenuRecentActivityAction = 'clear-saved-world';
    showMainMenuShellState();
    return true;
  };
  const resetPausedMainMenuShellTogglePreferences = (): void => {
    if (loop === null || !worldSessionStarted) return;
    const clearResult = applyPausedMainMenuWorldSessionShellTransition(
      'reset-shell-toggle-preferences',
      'clear'
    );
    pausedMainMenuResetShellTogglesResult =
      clearResult?.cleared === false
        ? {
            status: 'persistence-failed',
            reason: clearResult.reason ?? 'Browser shell visibility preferences were not deleted.'
          }
        : {
            status: 'cleared'
          };
    pausedMainMenuRecentActivityAction = 'reset-shell-toggles';
    if (clearResult?.cleared === false) {
      console.warn(
        'Failed to clear persisted shell toggle preferences.',
        clearResult.reason ?? 'Browser shell visibility preferences were not deleted.'
      );
    }
    showMainMenuShellState();
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

    const dropOneSelectedHotbarItemShortcut = currentScreen === 'in-world'
      ? resolveDropOneSelectedHotbarItemShortcut(event)
      : false;
    if (dropOneSelectedHotbarItemShortcut) {
      event.preventDefault();
      dropSelectedStandalonePlayerHotbarItem();
      return;
    }

    const dropSelectedHotbarStackShortcut = currentScreen === 'in-world'
      ? resolveDropSelectedHotbarStackShortcut(event)
      : false;
    if (dropSelectedHotbarStackShortcut) {
      event.preventDefault();
      dropSelectedStandalonePlayerHotbarStack();
      return;
    }

    const moveSelectedHotbarSlotDirection =
      currentScreen === 'in-world' && !debugEditControlsVisible
        ? resolveMoveSelectedHotbarSlotShortcut(event)
        : null;
    if (moveSelectedHotbarSlotDirection !== null) {
      event.preventDefault();
      moveSelectedStandalonePlayerHotbarSlot(moveSelectedHotbarSlotDirection);
      return;
    }

    const hotbarSlotIndex =
      currentScreen === 'in-world' && !debugEditControlsVisible
        ? resolveHotbarSlotShortcut(event)
        : null;
    if (hotbarSlotIndex !== null) {
      event.preventDefault();
      selectStandalonePlayerHotbarSlot(hotbarSlotIndex);
      return;
    }

    const action = resolveDebugEditShortcutAction(
      event,
      createDebugEditShortcutContext(currentScreen, worldSessionStarted, shellActionKeybindings)
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
    const playerState = getStandalonePlayerState();
    const playerRenderState = getStandalonePlayerRenderStateSnapshot()?.current ?? null;
    const standalonePlayerContacts = playerState
      ? renderer.getPlayerCollisionContacts(playerState)
      : null;
    const standalonePlayerCeilingBonkActive =
      playerRenderState !== null
        ? isStandalonePlayerRenderStateCeilingBonkActive(playerRenderState, renderTimeMs)
        : false;
    const playerHealth =
      playerState === null ? null : readOptionalFiniteNumber((playerState as { health?: unknown }).health);
    const playerMaxHealth =
      playerState === null
        ? null
        : readOptionalFiniteNumber((playerState as { maxHealth?: unknown }).maxHealth);
    const playerDeathCount = playerState === null ? null : standalonePlayerDeathCount;
    const playerRespawnSecondsRemaining =
      standalonePlayerDeathState === null
        ? null
        : standalonePlayerDeathState.respawnSecondsRemaining;
    const playerDeathHoldStatus =
      playerState === null
        ? null
        : standalonePlayerDeathState !== null
          ? 'holding'
          : latestStandalonePlayerDeathHoldStatus;
    const playerBreathSecondsRemaining =
      playerState === null
        ? null
        : readOptionalFiniteNumber(
            (
              playerState as {
                breathSecondsRemaining?: unknown;
              }
            ).breathSecondsRemaining
          );
    const playerDrowningDamageTickSecondsRemaining =
      playerState === null
        ? null
        : readOptionalFiniteNumber(
            (
              playerState as {
                drowningDamageTickSecondsRemaining?: unknown;
              }
            ).drowningDamageTickSecondsRemaining
          );
    const playerWaterSubmersionTelemetry =
      playerState === null ? null : renderer.getPlayerWaterSubmersionTelemetry(playerState);
    const playerHeadSubmergedInWater =
      playerWaterSubmersionTelemetry?.headSubmergedInWater ?? null;
    const playerWaterSubmergedFraction =
      playerWaterSubmersionTelemetry?.waterSubmergedFraction ?? null;
    const playerLavaSubmergedFraction =
      playerWaterSubmersionTelemetry?.lavaSubmergedFraction ?? null;
    const playerLavaDamageTickSecondsRemaining =
      playerState === null
        ? null
        : readOptionalFiniteNumber(
            (
              playerState as {
                lavaDamageTickSecondsRemaining?: unknown;
              }
            ).lavaDamageTickSecondsRemaining
          );
    const playerFallDamageRecoverySecondsRemaining =
      playerState === null
        ? null
        : readOptionalFiniteNumber(
            (
              playerState as {
                fallDamageRecoverySecondsRemaining?: unknown;
              }
            ).fallDamageRecoverySecondsRemaining
          );
    const playerHostileContactInvulnerabilitySecondsRemaining =
      playerState === null
        ? null
        : readOptionalFiniteNumber(
            (
              playerState as {
                hostileContactInvulnerabilitySecondsRemaining?: unknown;
              }
            ).hostileContactInvulnerabilitySecondsRemaining
          );
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
    const playerRopeDropActive =
      playerState === null
        ? false
        : isPlayerRopeDropActive(renderer, playerState, playerIntent.ropeDropHeld === true);
    const playerRopeDropWindowArmed = playerIntent.ropeDropWindowArmed === true;
    const playerPlaceholderPoseLabel =
      playerRenderState === null
        ? null
        : getStandalonePlayerPlaceholderPoseLabel(playerRenderState, {
            elapsedMs: renderTimeMs,
            wallContact: playerRenderState.wallContact,
            ceilingContact: playerRenderState.ceilingContact,
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
                health: playerHealth,
                maxHealth: playerMaxHealth,
                deathCount: playerDeathCount,
                respawnSecondsRemaining: playerRespawnSecondsRemaining,
                deathHoldStatus: playerDeathHoldStatus,
                breathSecondsRemaining: playerBreathSecondsRemaining,
                headSubmergedInWater: playerHeadSubmergedInWater,
                waterSubmergedFraction: playerWaterSubmergedFraction,
                lavaSubmergedFraction: playerLavaSubmergedFraction,
                lavaDamageTickSecondsRemaining: playerLavaDamageTickSecondsRemaining,
                drowningDamageTickSecondsRemaining: playerDrowningDamageTickSecondsRemaining,
                fallDamageRecoverySecondsRemaining: playerFallDamageRecoverySecondsRemaining,
                hostileContactInvulnerabilitySecondsRemaining:
                  playerHostileContactInvulnerabilitySecondsRemaining,
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
        playerIntent: {
          moveX: playerIntent.moveX,
          jumpHeld: playerIntent.jumpHeld,
          jumpPressed: playerIntent.jumpPressed,
          ropeDropActive: playerRopeDropActive,
          ropeDropWindowArmed: playerRopeDropWindowArmed
        },
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
          playerState === null ? null : standalonePlayerCeilingBonkActive,
        playerHealth,
        playerMaxHealth,
        playerDeathCount,
        playerRespawnSecondsRemaining,
        playerDeathHoldStatus,
        playerBreathSecondsRemaining,
        playerHeadSubmergedInWater,
        playerWaterSubmergedFraction,
        playerLavaSubmergedFraction,
        playerLavaDamageTickSecondsRemaining,
        playerDrowningDamageTickSecondsRemaining,
        playerFallDamageRecoverySecondsRemaining,
        playerHostileContactInvulnerabilitySecondsRemaining,
        playerGrounded: playerState?.grounded ?? null,
        playerFacing: playerState?.facing ?? null,
        playerMoveX: playerState === null ? null : playerIntent.moveX,
        playerVelocityX: playerState === null ? null : playerState.velocity.x,
        playerVelocityY: playerState === null ? null : playerState.velocity.y,
        playerJumpHeld: playerState === null ? null : playerIntent.jumpHeld,
        playerJumpPressed: playerState === null ? null : playerIntent.jumpPressed,
        playerRopeDropActive: playerState === null ? null : playerRopeDropActive,
        playerRopeDropWindowArmed: playerState === null ? null : playerRopeDropWindowArmed,
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
  const createTrackedHostileSlimeRenderFrameTelemetrySnapshot =
    (): TrackedHostileSlimeRenderFrameTelemetrySnapshot => {
      const activeHostileSlimes = getHostileSlimeEntityStates();
      const standalonePlayerState = getStandalonePlayerState();
      const trackedHostileSlimeState = resolveTrackedHostileSlimeState(
        standalonePlayerState,
        activeHostileSlimes
      );
      const trackedHostileSlimeSpawnWindow = resolveHostileSlimeSpawnWindowTarget(
        hostileSlimeSpawnerState.nextWindowIndex
      );
      const trackedHostileSlimeWorldTile =
        trackedHostileSlimeState === null
          ? null
          : worldToTilePoint(
              trackedHostileSlimeState.position.x,
              trackedHostileSlimeState.position.y
            );
      const trackedHostileSlimeVelocity =
        trackedHostileSlimeState === null
          ? null
          : {
              x: trackedHostileSlimeState.velocity.x,
              y: trackedHostileSlimeState.velocity.y
            };
      const trackedHostileSlimeChaseOffset =
        standalonePlayerState === null || trackedHostileSlimeState === null
          ? null
          : {
              x: trackedHostileSlimeState.position.x - standalonePlayerState.position.x,
              y: trackedHostileSlimeState.position.y - standalonePlayerState.position.y
            };
      const trackedHostileSlimeLaunchKind: HostileSlimeLaunchKind | null =
        trackedHostileSlimeState?.launchKind ?? null;
      return {
        debugOverlay: {
          hostileSlime: {
            activeCount: activeHostileSlimes.length,
            nextSpawnTicksRemaining: hostileSlimeSpawnerState.ticksUntilNextSpawn,
            nextSpawnWindowIndex: trackedHostileSlimeSpawnWindow.index,
            nextSpawnWindowOffsetTiles: trackedHostileSlimeSpawnWindow.offsetTiles,
            worldTile: trackedHostileSlimeWorldTile,
            chaseOffset: trackedHostileSlimeChaseOffset,
            velocity: trackedHostileSlimeVelocity,
            grounded: trackedHostileSlimeState?.grounded ?? null,
            facing: trackedHostileSlimeState?.facing ?? null,
            hopCooldownTicksRemaining:
              trackedHostileSlimeState?.hopCooldownTicksRemaining ?? null,
            launchKind: trackedHostileSlimeLaunchKind
          }
        },
        debugStatusStrip: {
          hostileSlimeActiveCount: activeHostileSlimes.length,
          hostileSlimeNextSpawnTicksRemaining: hostileSlimeSpawnerState.ticksUntilNextSpawn,
          hostileSlimeNextSpawnWindowIndex: trackedHostileSlimeSpawnWindow.index,
          hostileSlimeNextSpawnWindowOffsetTiles: trackedHostileSlimeSpawnWindow.offsetTiles,
          hostileSlimeWorldTile: trackedHostileSlimeWorldTile,
          hostileSlimeChaseOffset: trackedHostileSlimeChaseOffset,
          hostileSlimeVelocity: trackedHostileSlimeVelocity,
          hostileSlimeGrounded: trackedHostileSlimeState?.grounded ?? null,
          hostileSlimeFacing: trackedHostileSlimeState?.facing ?? null,
          hostileSlimeHopCooldownTicksRemaining:
            trackedHostileSlimeState?.hopCooldownTicksRemaining ?? null,
          hostileSlimeLaunchKind: trackedHostileSlimeLaunchKind
        }
      };
    };
  const createStandalonePlayerRenderFrameNearbyLightTelemetrySnapshot =
    (): StandalonePlayerRenderFrameNearbyLightTelemetry => {
      if (getStandalonePlayerState() === null) {
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
      playerHealth: null,
      playerMaxHealth: null,
      playerDeathCount: null,
      playerRespawnSecondsRemaining: null,
      playerDeathHoldStatus: null,
      playerBreathSecondsRemaining: null,
      playerHeadSubmergedInWater: null,
      playerWaterSubmergedFraction: null,
      playerLavaSubmergedFraction: null,
      playerLavaDamageTickSecondsRemaining: null,
      playerDrowningDamageTickSecondsRemaining: null,
      playerFallDamageRecoverySecondsRemaining: null,
      playerHostileContactInvulnerabilitySecondsRemaining: null,
      playerGrounded: null,
      playerFacing: null,
      playerMoveX: null,
      playerVelocityX: null,
      playerVelocityY: null,
      playerJumpHeld: null,
      playerJumpPressed: null,
      playerRopeDropActive: null,
      playerRopeDropWindowArmed: null,
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
  const createClearedTrackedHostileSlimeRenderFrameStatusStripTelemetry =
    (): TrackedHostileSlimeRenderFrameStatusStripTelemetry => ({
      hostileSlimeActiveCount: null,
      hostileSlimeNextSpawnTicksRemaining: null,
      hostileSlimeNextSpawnWindowIndex: null,
      hostileSlimeNextSpawnWindowOffsetTiles: null,
      hostileSlimeWorldTile: null,
      hostileSlimeChaseOffset: null,
      hostileSlimeVelocity: null,
      hostileSlimeGrounded: null,
      hostileSlimeFacing: null,
      hostileSlimeHopCooldownTicksRemaining: null,
      hostileSlimeLaunchKind: null
    });
  const selectTrackedHostileSlimeRenderFrameStatusStripTelemetry = ({
    debugOverlayVisible,
    telemetry
  }: TrackedHostileSlimeRenderFrameStatusStripTelemetrySelectionOptions):
    TrackedHostileSlimeRenderFrameStatusStripTelemetry =>
    debugOverlayVisible ? createClearedTrackedHostileSlimeRenderFrameStatusStripTelemetry() : telemetry;
  const createClearedStandalonePlayerRenderFrameStatusStripPlayerEventTelemetry =
    (): StandalonePlayerRenderFrameStatusStripPlayerEventTelemetry => ({
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerLandingDamageEvent: null,
      playerDrowningDamageEvent: null,
      playerLavaDamageEvent: null,
      playerDeathCauseEvent: null,
      playerHostileContactEvent: null,
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

  const renderWorldFrame = (alpha: number, frameDtMs: number): void => {
    const renderTimeMs = performance.now();
    applyStandalonePlayerRenderFrameCameraFollow(alpha);
    const pointerInspect = input.getPointerInspect();
    const armedDebugToolPreviewState = resolveArmedDebugToolPreviewState(
      input.getArmedDebugToolPreviewState(),
      pointerInspect
    );
    const selectedPlayerItemBunnyReleasePreview =
      !debugEditControlsVisible && pointerInspect
        ? getSelectedStandalonePlayerItemBunnyReleasePreviewAtTile(
            pointerInspect.tile.x,
            pointerInspect.tile.y
          )
        : null;
    const selectedPlayerItemAxeChopPreview = !debugEditControlsVisible
      ? getSelectedStandalonePlayerItemAxeChopPreview(pointerInspect)
      : null;
    const selectedPlayerItemPlacementPreview =
      !debugEditControlsVisible && pointerInspect
        ? getSelectedStandalonePlayerItemPlacementPreviewAtTile(pointerInspect.tile.x, pointerInspect.tile.y)
        : null;
    const selectedPlayerItemSpearPreview = !debugEditControlsVisible
      ? getSelectedStandalonePlayerItemSpearPreview(pointerInspect)
      : null;
    const selectedPlayerItemMiningPreview = !debugEditControlsVisible
      ? getSelectedStandalonePlayerItemMiningPreview(pointerInspect)
      : null;
    syncCraftingPanelState();
    syncItemCatalogPanelState();
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
          liquidLevel: hoveredDebugTileStatus?.liquidLevel ?? null,
          liquidSurfaceNorthLevel: hoveredDebugTileStatus?.liquidSurfaceNorthLevel ?? null,
          liquidSurfaceWestLevel: hoveredDebugTileStatus?.liquidSurfaceWestLevel ?? null,
          liquidSurfaceCenterLevel: hoveredDebugTileStatus?.liquidSurfaceCenterLevel ?? null,
          liquidSurfaceEastLevel: hoveredDebugTileStatus?.liquidSurfaceEastLevel ?? null,
          liquidSurfaceBranch: hoveredDebugTileStatus?.liquidSurfaceBranch ?? null,
          liquidSurfaceTopLeft: hoveredDebugTileStatus?.liquidSurfaceTopLeft ?? null,
          liquidSurfaceTopRight: hoveredDebugTileStatus?.liquidSurfaceTopRight ?? null,
          liquidFrameTopV: hoveredDebugTileStatus?.liquidFrameTopV ?? null,
          liquidFrameTopPixelY: hoveredDebugTileStatus?.liquidFrameTopPixelY ?? null,
          liquidFrameBottomV: hoveredDebugTileStatus?.liquidFrameBottomV ?? null,
          liquidFrameBottomPixelY: hoveredDebugTileStatus?.liquidFrameBottomPixelY ?? null,
          liquidFrameHeightV: hoveredDebugTileStatus?.liquidFrameHeightV ?? null,
          liquidFramePixelHeight: hoveredDebugTileStatus?.liquidFramePixelHeight ?? null,
          liquidBottomLeftV: hoveredDebugTileStatus?.liquidBottomLeftV ?? null,
          liquidBottomRightV: hoveredDebugTileStatus?.liquidBottomRightV ?? null,
          liquidBottomLeftPixelY: hoveredDebugTileStatus?.liquidBottomLeftPixelY ?? null,
          liquidBottomRightPixelY: hoveredDebugTileStatus?.liquidBottomRightPixelY ?? null,
          liquidVisibleLeftV: hoveredDebugTileStatus?.liquidVisibleLeftV ?? null,
          liquidVisibleRightV: hoveredDebugTileStatus?.liquidVisibleRightV ?? null,
          liquidVisibleLeftPercentage:
            hoveredDebugTileStatus?.liquidVisibleLeftPercentage ?? null,
          liquidVisibleRightPercentage:
            hoveredDebugTileStatus?.liquidVisibleRightPercentage ?? null,
          liquidVisibleLeftPixelHeight: hoveredDebugTileStatus?.liquidVisibleLeftPixelHeight ?? null,
          liquidVisibleRightPixelHeight:
            hoveredDebugTileStatus?.liquidVisibleRightPixelHeight ?? null,
          liquidRemainderLeftV: hoveredDebugTileStatus?.liquidRemainderLeftV ?? null,
          liquidRemainderRightV: hoveredDebugTileStatus?.liquidRemainderRightV ?? null,
          liquidRemainderLeftPercentage:
            hoveredDebugTileStatus?.liquidRemainderLeftPercentage ?? null,
          liquidRemainderRightPercentage:
            hoveredDebugTileStatus?.liquidRemainderRightPercentage ?? null,
          liquidRemainderLeftPixelHeight:
            hoveredDebugTileStatus?.liquidRemainderLeftPixelHeight ?? null,
          liquidRemainderRightPixelHeight:
            hoveredDebugTileStatus?.liquidRemainderRightPixelHeight ?? null,
          liquidCoverageLeftTotalPercentage:
            hoveredDebugTileStatus?.liquidCoverageLeftTotalPercentage ?? null,
          liquidCoverageRightTotalPercentage:
            hoveredDebugTileStatus?.liquidCoverageRightTotalPercentage ?? null,
          liquidCoverageLeftTotalPixelHeight:
            hoveredDebugTileStatus?.liquidCoverageLeftTotalPixelHeight ?? null,
          liquidCoverageRightTotalPixelHeight:
            hoveredDebugTileStatus?.liquidCoverageRightTotalPixelHeight ?? null,
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
          liquidVariantPixelBounds: hoveredDebugTileStatus?.liquidVariantPixelBounds ?? null,
          tileAnimationFrameIndex: hoveredDebugTileStatus?.tileAnimationFrameIndex ?? null,
          tileAnimationFrameCount: hoveredDebugTileStatus?.tileAnimationFrameCount ?? null,
          tileRenderSource: hoveredDebugTileStatus?.tileRenderSource ?? null,
          tileRenderUvRect: hoveredDebugTileStatus?.tileRenderUvRect ?? null,
          tileRenderPixelBounds: hoveredDebugTileStatus?.tileRenderPixelBounds ?? null,
          wallId: hoveredDebugTileStatus?.wallId ?? null,
          wallLabel: hoveredDebugTileStatus?.wallLabel ?? null,
          wallRenderSource: hoveredDebugTileStatus?.wallRenderSource ?? null,
          wallRenderUvRect: hoveredDebugTileStatus?.wallRenderUvRect ?? null,
          wallRenderPixelBounds: hoveredDebugTileStatus?.wallRenderPixelBounds ?? null
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
          liquidLevel: pinnedDebugTileStatus.liquidLevel ?? null,
          liquidSurfaceNorthLevel: pinnedDebugTileStatus.liquidSurfaceNorthLevel ?? null,
          liquidSurfaceWestLevel: pinnedDebugTileStatus.liquidSurfaceWestLevel ?? null,
          liquidSurfaceCenterLevel: pinnedDebugTileStatus.liquidSurfaceCenterLevel ?? null,
          liquidSurfaceEastLevel: pinnedDebugTileStatus.liquidSurfaceEastLevel ?? null,
          liquidSurfaceBranch: pinnedDebugTileStatus.liquidSurfaceBranch ?? null,
          liquidSurfaceTopLeft: pinnedDebugTileStatus.liquidSurfaceTopLeft ?? null,
          liquidSurfaceTopRight: pinnedDebugTileStatus.liquidSurfaceTopRight ?? null,
          liquidFrameTopV: pinnedDebugTileStatus.liquidFrameTopV ?? null,
          liquidFrameTopPixelY: pinnedDebugTileStatus.liquidFrameTopPixelY ?? null,
          liquidFrameBottomV: pinnedDebugTileStatus.liquidFrameBottomV ?? null,
          liquidFrameBottomPixelY: pinnedDebugTileStatus.liquidFrameBottomPixelY ?? null,
          liquidFrameHeightV: pinnedDebugTileStatus.liquidFrameHeightV ?? null,
          liquidFramePixelHeight: pinnedDebugTileStatus.liquidFramePixelHeight ?? null,
          liquidBottomLeftV: pinnedDebugTileStatus.liquidBottomLeftV ?? null,
          liquidBottomRightV: pinnedDebugTileStatus.liquidBottomRightV ?? null,
          liquidBottomLeftPixelY: pinnedDebugTileStatus.liquidBottomLeftPixelY ?? null,
          liquidBottomRightPixelY: pinnedDebugTileStatus.liquidBottomRightPixelY ?? null,
          liquidVisibleLeftV: pinnedDebugTileStatus.liquidVisibleLeftV ?? null,
          liquidVisibleRightV: pinnedDebugTileStatus.liquidVisibleRightV ?? null,
          liquidVisibleLeftPercentage:
            pinnedDebugTileStatus.liquidVisibleLeftPercentage ?? null,
          liquidVisibleRightPercentage:
            pinnedDebugTileStatus.liquidVisibleRightPercentage ?? null,
          liquidVisibleLeftPixelHeight: pinnedDebugTileStatus.liquidVisibleLeftPixelHeight ?? null,
          liquidVisibleRightPixelHeight: pinnedDebugTileStatus.liquidVisibleRightPixelHeight ?? null,
          liquidRemainderLeftV: pinnedDebugTileStatus.liquidRemainderLeftV ?? null,
          liquidRemainderRightV: pinnedDebugTileStatus.liquidRemainderRightV ?? null,
          liquidRemainderLeftPercentage:
            pinnedDebugTileStatus.liquidRemainderLeftPercentage ?? null,
          liquidRemainderRightPercentage:
            pinnedDebugTileStatus.liquidRemainderRightPercentage ?? null,
          liquidRemainderLeftPixelHeight:
            pinnedDebugTileStatus.liquidRemainderLeftPixelHeight ?? null,
          liquidRemainderRightPixelHeight:
            pinnedDebugTileStatus.liquidRemainderRightPixelHeight ?? null,
          liquidCoverageLeftTotalPercentage:
            pinnedDebugTileStatus.liquidCoverageLeftTotalPercentage ?? null,
          liquidCoverageRightTotalPercentage:
            pinnedDebugTileStatus.liquidCoverageRightTotalPercentage ?? null,
          liquidCoverageLeftTotalPixelHeight:
            pinnedDebugTileStatus.liquidCoverageLeftTotalPixelHeight ?? null,
          liquidCoverageRightTotalPixelHeight:
            pinnedDebugTileStatus.liquidCoverageRightTotalPixelHeight ?? null,
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
          liquidVariantPixelBounds: pinnedDebugTileStatus.liquidVariantPixelBounds ?? null,
          tileAnimationFrameIndex: pinnedDebugTileStatus.tileAnimationFrameIndex ?? null,
          tileAnimationFrameCount: pinnedDebugTileStatus.tileAnimationFrameCount ?? null,
          tileRenderSource: pinnedDebugTileStatus.tileRenderSource ?? null,
          tileRenderUvRect: pinnedDebugTileStatus.tileRenderUvRect ?? null,
          tileRenderPixelBounds: pinnedDebugTileStatus.tileRenderPixelBounds ?? null,
          wallId: pinnedDebugTileStatus.wallId ?? null,
          wallLabel: pinnedDebugTileStatus.wallLabel ?? null,
          wallRenderSource: pinnedDebugTileStatus.wallRenderSource ?? null,
          wallRenderUvRect: pinnedDebugTileStatus.wallRenderUvRect ?? null,
          wallRenderPixelBounds: pinnedDebugTileStatus.wallRenderPixelBounds ?? null
        }
      : null;
    const resolvedPlayerSpawnTelemetry = createResolvedPlayerSpawnTelemetrySnapshot();
    const debugOverlaySpawn = resolvedPlayerSpawnTelemetry.debugOverlaySpawn;
    const standalonePlayerRenderFrameTelemetry =
      createStandalonePlayerRenderFrameTelemetrySnapshot(renderTimeMs);
    const trackedHostileSlimeRenderFrameTelemetry =
      createTrackedHostileSlimeRenderFrameTelemetrySnapshot();
    const standalonePlayerStatusStripPlayerTelemetry = standalonePlayerRenderFrameTelemetry.debugStatusStrip;
    const rendererEntityFrameStates = createRendererEntityFrameStates();
    renderer.resize();
    renderer.render(camera, {
      entities: rendererEntityFrameStates,
      renderAlpha: alpha,
      timeMs: renderTimeMs
    });
    const standalonePlayerNearbyLightTelemetry =
      createStandalonePlayerRenderFrameNearbyLightTelemetrySnapshot();
    const debugStatusStripPlayerTelemetry = selectStandalonePlayerRenderFrameStatusStripPlayerTelemetry({
      debugOverlayVisible,
      playerTelemetry: standalonePlayerStatusStripPlayerTelemetry,
      nearbyLightTelemetry: standalonePlayerNearbyLightTelemetry
    });
    const debugStatusStripHostileSlimeTelemetry =
      selectTrackedHostileSlimeRenderFrameStatusStripTelemetry({
        debugOverlayVisible,
        telemetry: trackedHostileSlimeRenderFrameTelemetry.debugStatusStrip
      });
    const debugStatusStripPlayerEventTelemetry =
      selectStandalonePlayerRenderFrameStatusStripPlayerEventTelemetry({
        debugOverlayVisible,
        eventTelemetry: {
          playerGroundedTransition: lastPlayerGroundedTransitionEvent,
          playerFacingTransition: lastPlayerFacingTransitionEvent,
          playerRespawn: lastPlayerRespawnEvent,
          playerLandingDamageEvent: lastPlayerLandingDamageEvent,
          playerDrowningDamageEvent: lastPlayerDrowningDamageEvent,
          playerLavaDamageEvent: lastPlayerLavaDamageEvent,
          playerDeathCauseEvent: lastPlayerDeathCauseEvent,
          playerHostileContactEvent: lastHostileSlimePlayerContactEvent,
          playerWallContactTransition: lastPlayerWallContactTransitionEvent,
          playerCeilingContactTransition: lastPlayerCeilingContactTransitionEvent
        }
      });
    hoveredTileCursor.update(camera, {
      hovered: pointerInspect
        ? {
            tileX: pointerInspect.tile.x,
            tileY: pointerInspect.tile.y,
            previewTone: resolveHoveredDebugBreakPreviewTone(
              pointerInspect,
              armedDebugToolPreviewState,
              input.getTouchDebugEditMode()
            )
          }
        : null,
      pinned: pinnedDebugTileInspect
        ? {
            tileX: pinnedDebugTileInspect.tileX,
          tileY: pinnedDebugTileInspect.tileY
        }
      : null
    });
    playerItemAxeChopPreview.update(camera, selectedPlayerItemAxeChopPreview);
    playerItemBunnyReleasePreview.update(camera, selectedPlayerItemBunnyReleasePreview);
    playerItemMiningPreview.update(camera, selectedPlayerItemMiningPreview);
    playerItemPlacementPreview.update(camera, selectedPlayerItemPlacementPreview);
    playerItemSpearPreview.update(camera, selectedPlayerItemSpearPreview);
    const worldSessionTelemetryStateSnapshot = readWorldSessionTelemetryState();
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
      playerSpawn: resolvedPlayerSpawnTelemetry.debugStatusStripPlayerSpawn,
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
      residentActiveLiquidChunks: debugOverlayVisible ? null : renderer.telemetry.residentActiveLiquidChunks,
      residentSleepingLiquidChunks:
        debugOverlayVisible ? null : renderer.telemetry.residentSleepingLiquidChunks,
      residentActiveLiquidMinChunkX:
        debugOverlayVisible ? null : renderer.telemetry.residentActiveLiquidMinChunkX,
      residentActiveLiquidMinChunkY:
        debugOverlayVisible ? null : renderer.telemetry.residentActiveLiquidMinChunkY,
      residentActiveLiquidMaxChunkX:
        debugOverlayVisible ? null : renderer.telemetry.residentActiveLiquidMaxChunkX,
      residentActiveLiquidMaxChunkY:
        debugOverlayVisible ? null : renderer.telemetry.residentActiveLiquidMaxChunkY,
      residentSleepingLiquidMinChunkX:
        debugOverlayVisible ? null : renderer.telemetry.residentSleepingLiquidMinChunkX,
      residentSleepingLiquidMinChunkY:
        debugOverlayVisible ? null : renderer.telemetry.residentSleepingLiquidMinChunkY,
      residentSleepingLiquidMaxChunkX:
        debugOverlayVisible ? null : renderer.telemetry.residentSleepingLiquidMaxChunkX,
      residentSleepingLiquidMaxChunkY:
        debugOverlayVisible ? null : renderer.telemetry.residentSleepingLiquidMaxChunkY,
      liquidStepSidewaysCandidateMinChunkX:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepSidewaysCandidateMinChunkX,
      liquidStepSidewaysCandidateMinChunkY:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepSidewaysCandidateMinChunkY,
      liquidStepSidewaysCandidateMaxChunkX:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepSidewaysCandidateMaxChunkX,
      liquidStepSidewaysCandidateMaxChunkY:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepSidewaysCandidateMaxChunkY,
      liquidStepPhaseSummary: debugOverlayVisible ? null : renderer.telemetry.liquidStepPhaseSummary,
      liquidStepDownwardActiveChunksScanned:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepDownwardActiveChunksScanned,
      liquidStepSidewaysCandidateChunksScanned:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepSidewaysCandidateChunksScanned,
      liquidStepSidewaysPairsTested:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepSidewaysPairsTested,
      liquidStepDownwardTransfersApplied:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepDownwardTransfersApplied,
      liquidStepSidewaysTransfersApplied:
        debugOverlayVisible ? null : renderer.telemetry.liquidStepSidewaysTransfersApplied,
      playerNearbyLightLevel: debugStatusStripPlayerTelemetry.playerNearbyLightLevel,
      playerNearbyLightFactor: debugStatusStripPlayerTelemetry.playerNearbyLightFactor,
      playerNearbyLightSourceTile: debugStatusStripPlayerTelemetry.playerNearbyLightSourceTile,
      playerNearbyLightSourceChunk: debugStatusStripPlayerTelemetry.playerNearbyLightSourceChunk,
      playerNearbyLightSourceLocalTile:
        debugStatusStripPlayerTelemetry.playerNearbyLightSourceLocalTile,
      playerCeilingBonkHoldActive: debugStatusStripPlayerTelemetry.playerCeilingBonkHoldActive,
      playerHealth: debugStatusStripPlayerTelemetry.playerHealth,
      playerMaxHealth: debugStatusStripPlayerTelemetry.playerMaxHealth,
      playerDeathCount: debugStatusStripPlayerTelemetry.playerDeathCount,
      playerRespawnSecondsRemaining: debugStatusStripPlayerTelemetry.playerRespawnSecondsRemaining,
      playerDeathHoldStatus: debugStatusStripPlayerTelemetry.playerDeathHoldStatus,
      playerBreathSecondsRemaining: debugStatusStripPlayerTelemetry.playerBreathSecondsRemaining,
      playerHeadSubmergedInWater: debugStatusStripPlayerTelemetry.playerHeadSubmergedInWater,
      playerWaterSubmergedFraction: debugStatusStripPlayerTelemetry.playerWaterSubmergedFraction,
      playerLavaSubmergedFraction: debugStatusStripPlayerTelemetry.playerLavaSubmergedFraction,
      playerLavaDamageTickSecondsRemaining:
        debugStatusStripPlayerTelemetry.playerLavaDamageTickSecondsRemaining,
      playerDrowningDamageTickSecondsRemaining:
        debugStatusStripPlayerTelemetry.playerDrowningDamageTickSecondsRemaining,
      playerFallDamageRecoverySecondsRemaining:
        debugStatusStripPlayerTelemetry.playerFallDamageRecoverySecondsRemaining,
      playerHostileContactInvulnerabilitySecondsRemaining:
        debugStatusStripPlayerTelemetry.playerHostileContactInvulnerabilitySecondsRemaining,
      hostileSlimeActiveCount: debugStatusStripHostileSlimeTelemetry.hostileSlimeActiveCount,
      hostileSlimeNextSpawnTicksRemaining:
        debugStatusStripHostileSlimeTelemetry.hostileSlimeNextSpawnTicksRemaining,
      hostileSlimeNextSpawnWindowIndex:
        debugStatusStripHostileSlimeTelemetry.hostileSlimeNextSpawnWindowIndex,
      hostileSlimeNextSpawnWindowOffsetTiles:
        debugStatusStripHostileSlimeTelemetry.hostileSlimeNextSpawnWindowOffsetTiles,
      hostileSlimeWorldTile: debugStatusStripHostileSlimeTelemetry.hostileSlimeWorldTile,
      hostileSlimeChaseOffset: debugStatusStripHostileSlimeTelemetry.hostileSlimeChaseOffset,
      hostileSlimeVelocity: debugStatusStripHostileSlimeTelemetry.hostileSlimeVelocity,
      hostileSlimeGrounded: debugStatusStripHostileSlimeTelemetry.hostileSlimeGrounded,
      hostileSlimeFacing: debugStatusStripHostileSlimeTelemetry.hostileSlimeFacing,
      hostileSlimeHopCooldownTicksRemaining:
        debugStatusStripHostileSlimeTelemetry.hostileSlimeHopCooldownTicksRemaining,
      hostileSlimeLaunchKind: debugStatusStripHostileSlimeTelemetry.hostileSlimeLaunchKind,
      playerGrounded: debugStatusStripPlayerTelemetry.playerGrounded,
      playerFacing: debugStatusStripPlayerTelemetry.playerFacing,
      playerMoveX: debugStatusStripPlayerTelemetry.playerMoveX,
      playerVelocityX: debugStatusStripPlayerTelemetry.playerVelocityX,
      playerVelocityY: debugStatusStripPlayerTelemetry.playerVelocityY,
      playerJumpHeld: debugStatusStripPlayerTelemetry.playerJumpHeld,
      playerJumpPressed: debugStatusStripPlayerTelemetry.playerJumpPressed,
      playerRopeDropActive: debugStatusStripPlayerTelemetry.playerRopeDropActive,
      playerRopeDropWindowArmed: debugStatusStripPlayerTelemetry.playerRopeDropWindowArmed,
      playerSupportContact: debugStatusStripPlayerTelemetry.playerSupportContact,
      playerWallContact: debugStatusStripPlayerTelemetry.playerWallContact,
      playerCeilingContact: debugStatusStripPlayerTelemetry.playerCeilingContact,
      playerGroundedTransition: debugStatusStripPlayerEventTelemetry.playerGroundedTransition,
      playerFacingTransition: debugStatusStripPlayerEventTelemetry.playerFacingTransition,
      playerRespawn: debugStatusStripPlayerEventTelemetry.playerRespawn,
      playerLandingDamageEvent: debugStatusStripPlayerEventTelemetry.playerLandingDamageEvent,
      playerDrowningDamageEvent: debugStatusStripPlayerEventTelemetry.playerDrowningDamageEvent,
      playerLavaDamageEvent: debugStatusStripPlayerEventTelemetry.playerLavaDamageEvent,
      playerDeathCauseEvent: debugStatusStripPlayerEventTelemetry.playerDeathCauseEvent,
      playerHostileContactEvent: debugStatusStripPlayerEventTelemetry.playerHostileContactEvent,
      playerWallContactTransition: debugStatusStripPlayerEventTelemetry.playerWallContactTransition,
      playerCeilingContactTransition:
        debugStatusStripPlayerEventTelemetry.playerCeilingContactTransition,
      telemetryState: worldSessionTelemetryStateSnapshot
    });
    debug.update(frameDtMs, renderer.telemetry, {
      pointer: debugOverlayPointerInspect,
      pinned: debugOverlayPinnedInspect,
      spawn: debugOverlaySpawn,
      player: standalonePlayerRenderFrameTelemetry.debugOverlay.player,
      hostileSlime: trackedHostileSlimeRenderFrameTelemetry.debugOverlay.hostileSlime,
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
      playerLandingDamageEvent: lastPlayerLandingDamageEvent,
      playerDrowningDamageEvent: lastPlayerDrowningDamageEvent,
      playerLavaDamageEvent: lastPlayerLavaDamageEvent,
      playerDeathCauseEvent: lastPlayerDeathCauseEvent,
      playerHostileContactEvent: lastHostileSlimePlayerContactEvent,
      playerWallContactTransition: lastPlayerWallContactTransitionEvent,
      playerCeilingContactTransition: lastPlayerCeilingContactTransitionEvent,
      telemetryState: worldSessionTelemetryStateSnapshot
    });
  };

  const renderWorldPreview = (): void => {
    applyStandalonePlayerRenderFrameCameraFollow(1);
    const rendererEntityFrameStates = createRendererEntityFrameStates();
    renderer.resize();
    renderer.render(camera, {
      entities: rendererEntityFrameStates,
      renderAlpha: 1
    });
  };

  restorePausedWorldSessionFromSaveEnvelopeAction = (
    envelope: WorldSaveEnvelope
  ): RestorePausedWorldSessionFromSaveEnvelopeResult => {
    if (currentScreen !== 'main-menu' || loop === null || !worldSessionStarted) {
      return {
        status: 'restore-failed',
        reason: 'Paused world-session restore is unavailable.'
      };
    }

    try {
      restoreWorldSessionFromSaveEnvelope({
        envelope,
        target: {
          loadWorldSnapshot: (snapshot) => {
            renderer.loadWorldSnapshot(snapshot);
            rebuildTrackedSmallTreeGrowthAnchorsFromSnapshot(snapshot);
          },
          restoreStandalonePlayerDeathState: (deathState) => {
            standalonePlayerDeathState = deathState;
          },
          restoreStandalonePlayerState: (playerState) => {
            restoreStandalonePlayerSessionState(playerState, standalonePlayerDeathState);
          },
          restoreStandalonePlayerInventoryState: (inventoryState) => {
            applyStandalonePlayerInventoryState(inventoryState);
          },
          restoreStandalonePlayerEquipmentState: (equipmentState) => {
            applyStandalonePlayerEquipmentState(equipmentState);
          },
          restoreDroppedItemStates: (droppedItemStates) => {
            restoreDroppedItemEntityStates(droppedItemStates);
          },
          restoreCameraFollowOffset: (nextCameraFollowOffset) => {
            cameraFollowOffset = {
              x: nextCameraFollowOffset.x,
              y: nextCameraFollowOffset.y
            };
          }
        }
      });
      pausedMainMenuWorldSaveCleared = false;
      pausedMainMenuSavedWorldStatus = null;
      pausedMainMenuExportResult = null;
      pausedMainMenuImportResult = null;
      pausedMainMenuClearSavedWorldResult = null;
      pausedMainMenuResetShellTogglesResult = null;
      pausedMainMenuRecentActivityAction = null;
      resetFreshWorldSessionDebugEditState();
      clearPinnedDebugTileInspect();
      resolveCurrentWorldPlayerSpawn();
      clearPersistedCurrentWorldSession();
      const persistenceResult = persistCurrentWorldSessionWithResult();
      renderWorldPreview();
      if (persistenceResult.status !== 'persisted') {
        pausedMainMenuSavedWorldStatus = 'import-persistence-failed';
        console.warn('Failed to persist restored world save.', persistenceResult.reason);
        return {
          status: 'persistence-failed',
          reason: persistenceResult.reason
        };
      }
      return {
        status: 'restored'
      };
    } catch (error) {
      rebuildTrackedSmallTreeGrowthAnchorsFromSnapshot(renderer.createWorldSnapshot());
      console.warn('Failed to restore world save.', error);
      return {
        status: 'restore-failed',
        reason: resolveThrownErrorReason(error)
      };
    }
  };

  loop = new GameLoop(
    1000 / 60,
    (fixedDt) => {
      if (currentScreen !== 'in-world') return;
      input.update(fixedDt);
      for (const playerItemUseRequest of input.consumePlayerItemUseRequests()) {
        applySelectedStandalonePlayerItemUse(playerItemUseRequest);
      }
      for (const edit of input.consumeDebugTileEdits()) {
        const result = applyDebugWorldEdit(edit.worldTileX, edit.worldTileY, edit.kind);
        if (!result.changed) continue;

        recordDebugHistoryChange(edit.strokeId, edit.worldTileX, edit.worldTileY, result.historyChange);
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

      if (playerSpawnNeedsRefresh) {
        refreshResolvedPlayerSpawn();
      }

      renderer.stepLiquidSimulation();
      stepGrassGrowthFixedUpdate();
      stepSmallTreeGrowthFixedUpdate();

      enforcePeacefulModeHostileSlimeState();
      entityRegistry.fixedUpdateAll(fixedDt);
      getStarterWandFireboltEntityStates();
      flushStarterWandFireboltHitEvents();
      flushStandalonePlayerFixedStepResult();
      stepStarterMeleeWeaponFixedUpdate(fixedDt);
      stepStarterSpearFixedUpdate(fixedDt);
      stepStarterAxeChoppingFixedUpdate(fixedDt);
      stepStarterPickaxeMiningFixedUpdate(fixedDt);
      stepStarterBugNetFixedUpdate(fixedDt);
      stepHostileSlimeSpawnAndDespawn();
      stepPassiveBunnySpawnAndDespawn();
      const nextStarterWandCooldownState = stepStarterWandCooldownState(
        starterWandCooldownState,
        fixedDt
      );
      if (
        nextStarterWandCooldownState.secondsRemaining !==
        starterWandCooldownState.secondsRemaining
      ) {
        starterWandCooldownState = nextStarterWandCooldownState;
        syncHotbarOverlayState();
      } else {
        starterWandCooldownState = nextStarterWandCooldownState;
      }
      const nextHealingPotionCooldownState = stepPlayerHealingPotionCooldownState(
        playerHealingPotionCooldownState,
        fixedDt
      );
      if (
        nextHealingPotionCooldownState.secondsRemaining !==
        playerHealingPotionCooldownState.secondsRemaining
      ) {
        playerHealingPotionCooldownState = nextHealingPotionCooldownState;
        syncHotbarOverlayState();
      } else {
        playerHealingPotionCooldownState = nextHealingPotionCooldownState;
      }
    },
    (alpha, frameDtMs) => {
      if (currentScreen !== 'in-world') {
        renderWorldPreview();
        return;
      }

      renderWorldFrame(alpha, frameDtMs);
    }
  );

  try {
    await renderer.initialize();
  } catch (error) {
    shell.setState(createRendererInitializationFailedBootShellState(error));
    return;
  }

  renderer.resize();
  if (persistedWorldSaveEnvelope === null) {
    renderer.resetWorld(createRandomWorldSeed());
    clearTrackedSmallTreeGrowthAnchors();
    refreshResolvedPlayerSpawn();
  } else {
    try {
      const restoreResult = restoreWorldSessionFromSaveEnvelope({
        envelope: persistedWorldSaveEnvelope,
        target: {
          loadWorldSnapshot: (snapshot) => {
            renderer.loadWorldSnapshot(snapshot);
            rebuildTrackedSmallTreeGrowthAnchorsFromSnapshot(snapshot);
          },
          restoreStandalonePlayerDeathState: (deathState) => {
            standalonePlayerDeathState = deathState;
          },
          restoreStandalonePlayerState: (playerState) => {
            restoreStandalonePlayerSessionState(playerState, standalonePlayerDeathState);
          },
          restoreStandalonePlayerInventoryState: (inventoryState) => {
            applyStandalonePlayerInventoryState(inventoryState);
          },
          restoreStandalonePlayerEquipmentState: (equipmentState) => {
            applyStandalonePlayerEquipmentState(equipmentState);
          },
          restoreDroppedItemStates: (droppedItemStates) => {
            restoreDroppedItemEntityStates(droppedItemStates);
          },
          restoreCameraFollowOffset: (nextCameraFollowOffset) => {
            cameraFollowOffset = {
              x: nextCameraFollowOffset.x,
              y: nextCameraFollowOffset.y
            };
          }
        }
      });
      worldSessionStarted = true;
      if (restoreResult.didNormalizeDroppedItemStates) {
        worldSavePersistenceAvailable = savePersistedWorldSaveEnvelope(
          worldSessionShellStateStorage,
          restoreResult.restoredEnvelope
        );
      }
      resolveCurrentWorldPlayerSpawn();
    } catch (error) {
      rebuildTrackedSmallTreeGrowthAnchorsFromSnapshot(renderer.createWorldSnapshot());
      console.warn('Failed to restore persisted world session.', error);
      clearPersistedCurrentWorldSession();
      refreshResolvedPlayerSpawn();
    }
  }
  renderWorldPreview();
  showMainMenuShellState();

  window.addEventListener('pagehide', () => {
    persistCurrentWorldSession();
  });

  window.addEventListener('resize', () => {
    renderer.resize();
    if (!worldSessionStarted || currentScreen !== 'in-world') {
      renderWorldPreview();
    }
  });
};

void bootstrap();
