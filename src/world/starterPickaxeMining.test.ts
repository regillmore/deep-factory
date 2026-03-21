import { describe, expect, it } from 'vitest';

import { DEFAULT_PLAYER_HEIGHT, DEFAULT_PLAYER_WIDTH } from './playerState';
import { PROCEDURAL_COPPER_ORE_TILE_ID } from './proceduralTerrain';
import { STARTER_ROPE_TILE_ID } from './starterRopePlacement';
import { STARTER_TORCH_TILE_ID } from './starterTorchPlacement';
import { STARTER_WORKBENCH_TILE_ID } from './starterWorkbenchPlacement';
import { STARTER_FURNACE_TILE_ID } from './starterFurnacePlacement';
import { STARTER_ANVIL_TILE_ID } from './starterAnvilPlacement';
import {
  COPPER_ORE_ITEM_ID,
  createStarterPickaxeMiningState,
  evaluateStarterPickaxeMiningTarget,
  resolveStarterPickaxeBrokenTileDrop,
  resolveStarterPickaxeBreakProgressNormalized,
  STARTER_PICKAXE_SWING_ACTIVE_SECONDS,
  STARTER_PICKAXE_SWING_RECOVERY_SECONDS,
  STARTER_PICKAXE_SWING_WINDUP_SECONDS,
  stepStarterPickaxeMiningState,
  tryStartStarterPickaxeSwing,
  type StarterPickaxeMiningWorldView
} from './starterPickaxeMining';

const createWorld = (
  tiles: Record<string, number> = {}
): StarterPickaxeMiningWorldView => ({
  getTile: (worldTileX, worldTileY) => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

const createPlayer = (x = 8, y = 28) => ({
  position: { x, y },
  size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT }
});

describe('evaluateStarterPickaxeMiningTarget', () => {
  it('allows nearby solid terrain, rope, torch, workbench, furnace, and anvil tiles and rejects empty or non-target tiles', () => {
    const player = createPlayer(48, 28);
    const world = createWorld({
      '0,0': 9,
      '1,0': STARTER_ROPE_TILE_ID,
      '2,0': STARTER_TORCH_TILE_ID,
      '3,0': STARTER_WORKBENCH_TILE_ID,
      '4,0': STARTER_FURNACE_TILE_ID,
      '5,0': STARTER_ANVIL_TILE_ID,
      '6,0': PROCEDURAL_COPPER_ORE_TILE_ID,
      '7,0': 99
    });

    expect(evaluateStarterPickaxeMiningTarget(world, player, 0, 0)).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: 9,
      occupied: true,
      breakableTarget: true,
      withinRange: true,
      canMine: true
    });
    expect(evaluateStarterPickaxeMiningTarget(world, player, 1, 0)).toMatchObject({
      tileId: STARTER_ROPE_TILE_ID,
      occupied: true,
      breakableTarget: true,
      canMine: true
    });
    expect(evaluateStarterPickaxeMiningTarget(world, player, 2, 0)).toMatchObject({
      tileId: STARTER_TORCH_TILE_ID,
      occupied: true,
      breakableTarget: true,
      canMine: true
    });
    expect(evaluateStarterPickaxeMiningTarget(world, player, 3, 0)).toMatchObject({
      tileId: STARTER_WORKBENCH_TILE_ID,
      occupied: true,
      breakableTarget: true,
      canMine: true
    });
    expect(evaluateStarterPickaxeMiningTarget(world, player, 4, 0)).toMatchObject({
      tileId: STARTER_FURNACE_TILE_ID,
      occupied: true,
      breakableTarget: true,
      canMine: true
    });
    expect(evaluateStarterPickaxeMiningTarget(world, player, 5, 0)).toMatchObject({
      tileId: STARTER_ANVIL_TILE_ID,
      occupied: true,
      breakableTarget: true,
      canMine: true
    });
    expect(evaluateStarterPickaxeMiningTarget(world, player, 6, 0)).toMatchObject({
      tileId: PROCEDURAL_COPPER_ORE_TILE_ID,
      occupied: true,
      breakableTarget: true,
      canMine: true
    });
    expect(evaluateStarterPickaxeMiningTarget(world, player, 7, 0)).toMatchObject({
      tileId: 99,
      occupied: true,
      breakableTarget: false,
      canMine: false
    });
    expect(evaluateStarterPickaxeMiningTarget(world, player, 7, -3)).toMatchObject({
      tileId: 0,
      occupied: false,
      breakableTarget: false,
      canMine: false
    });
  });

  it('marks breakable terrain outside the shared hotbar reach as out of range', () => {
    const world = createWorld({
      '20,0': 9
    });

    expect(evaluateStarterPickaxeMiningTarget(world, createPlayer(), 20, 0)).toMatchObject({
      tileId: 9,
      breakableTarget: true,
      withinRange: false,
      canMine: false
    });
  });
});

describe('resolveStarterPickaxeBrokenTileDrop', () => {
  it('returns one stackable block refund for broken stone, grass-surface, and placed dirt tiles', () => {
    expect(resolveStarterPickaxeBrokenTileDrop(1)).toEqual({
      itemId: 'stone-block',
      amount: 1
    });
    expect(resolveStarterPickaxeBrokenTileDrop(PROCEDURAL_COPPER_ORE_TILE_ID)).toEqual({
      itemId: COPPER_ORE_ITEM_ID,
      amount: 1
    });
    expect(resolveStarterPickaxeBrokenTileDrop(2)).toEqual({
      itemId: 'dirt-block',
      amount: 1
    });
    expect(resolveStarterPickaxeBrokenTileDrop(9)).toEqual({
      itemId: 'dirt-block',
      amount: 1
    });
    expect(resolveStarterPickaxeBrokenTileDrop(STARTER_ROPE_TILE_ID)).toBeNull();
    expect(resolveStarterPickaxeBrokenTileDrop(STARTER_TORCH_TILE_ID)).toBeNull();
    expect(resolveStarterPickaxeBrokenTileDrop(STARTER_WORKBENCH_TILE_ID)).toBeNull();
    expect(resolveStarterPickaxeBrokenTileDrop(STARTER_FURNACE_TILE_ID)).toBeNull();
    expect(resolveStarterPickaxeBrokenTileDrop(STARTER_ANVIL_TILE_ID)).toBeNull();
  });
});

describe('starterPickaxeMining state', () => {
  it('breaks a nearby placed workbench tile in one hit', () => {
    const world = createWorld({
      '0,0': STARTER_WORKBENCH_TILE_ID
    });
    const player = createPlayer();
    const evaluation = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);
    const started = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);

    expect(started.started).toBe(true);

    const afterWindup = stepStarterPickaxeMiningState(started.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: STARTER_WORKBENCH_TILE_ID,
      appliedHitCount: 1,
      requiredHitCount: 1,
      brokeTile: true
    });
    expect(afterWindup.state.breakProgress).toBeNull();
  });

  it('breaks a nearby placed furnace tile in one hit', () => {
    const world = createWorld({
      '0,0': STARTER_FURNACE_TILE_ID
    });
    const player = createPlayer();
    const evaluation = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);
    const started = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);

    expect(started.started).toBe(true);

    const afterWindup = stepStarterPickaxeMiningState(started.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: STARTER_FURNACE_TILE_ID,
      appliedHitCount: 1,
      requiredHitCount: 1,
      brokeTile: true
    });
    expect(afterWindup.state.breakProgress).toBeNull();
  });

  it('breaks a nearby placed anvil tile in one hit', () => {
    const world = createWorld({
      '0,0': STARTER_ANVIL_TILE_ID
    });
    const player = createPlayer();
    const evaluation = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);
    const started = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);

    expect(started.started).toBe(true);

    const afterWindup = stepStarterPickaxeMiningState(started.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: STARTER_ANVIL_TILE_ID,
      appliedHitCount: 1,
      requiredHitCount: 1,
      brokeTile: true
    });
    expect(afterWindup.state.breakProgress).toBeNull();
  });

  it('breaks a nearby placed torch tile in one hit', () => {
    const world = createWorld({
      '0,0': STARTER_TORCH_TILE_ID
    });
    const player = createPlayer();
    const evaluation = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);
    const started = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);

    expect(started.started).toBe(true);

    const afterWindup = stepStarterPickaxeMiningState(started.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: STARTER_TORCH_TILE_ID,
      appliedHitCount: 1,
      requiredHitCount: 1,
      brokeTile: true
    });
    expect(afterWindup.state.breakProgress).toBeNull();
  });

  it('breaks a nearby placed rope tile in one hit', () => {
    const world = createWorld({
      '0,0': STARTER_ROPE_TILE_ID
    });
    const player = createPlayer();
    const evaluation = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);
    const started = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);

    expect(started.started).toBe(true);

    const afterWindup = stepStarterPickaxeMiningState(started.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: STARTER_ROPE_TILE_ID,
      appliedHitCount: 1,
      requiredHitCount: 1,
      brokeTile: true
    });
    expect(afterWindup.state.breakProgress).toBeNull();
  });

  it('enters windup, applies one hit at the active transition, then clears after recovery', () => {
    const world = createWorld({
      '0,0': 9
    });
    const evaluation = evaluateStarterPickaxeMiningTarget(world, createPlayer(), 0, 0);
    const started = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);

    expect(started.started).toBe(true);
    expect(started.state.activeSwing).toEqual({
      tileX: 0,
      tileY: 0,
      phase: 'windup',
      phaseSecondsRemaining: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    const afterWindup = stepStarterPickaxeMiningState(started.state, {
      world,
      playerState: createPlayer(),
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: 9,
      appliedHitCount: 1,
      requiredHitCount: 1,
      brokeTile: true
    });
    expect(afterWindup.state.activeSwing).toEqual({
      tileX: 0,
      tileY: 0,
      phase: 'active',
      phaseSecondsRemaining: STARTER_PICKAXE_SWING_ACTIVE_SECONDS
    });

    const afterActive = stepStarterPickaxeMiningState(afterWindup.state, {
      world,
      playerState: createPlayer(),
      fixedDtSeconds: STARTER_PICKAXE_SWING_ACTIVE_SECONDS
    });

    expect(afterActive.hitEvent).toBeNull();
    expect(afterActive.state.activeSwing).toEqual({
      tileX: 0,
      tileY: 0,
      phase: 'recovery',
      phaseSecondsRemaining: STARTER_PICKAXE_SWING_RECOVERY_SECONDS
    });

    const afterRecovery = stepStarterPickaxeMiningState(afterActive.state, {
      world,
      playerState: createPlayer(),
      fixedDtSeconds: STARTER_PICKAXE_SWING_RECOVERY_SECONDS
    });

    expect(afterRecovery.hitEvent).toBeNull();
    expect(afterRecovery.state.activeSwing).toBeNull();
    expect(afterRecovery.state.breakProgress).toBeNull();
  });

  it('requires two separate swings to finish a stone tile and reports halfway progress after the first hit', () => {
    const world = createWorld({
      '0,0': 1
    });
    const player = createPlayer();
    const evaluation = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);

    const firstSwingStart = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);
    const firstSwingHit = stepStarterPickaxeMiningState(firstSwingStart.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(firstSwingHit.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: 1,
      appliedHitCount: 1,
      requiredHitCount: 2,
      brokeTile: false
    });
    expect(
      resolveStarterPickaxeBreakProgressNormalized(firstSwingHit.state, world, 0, 0)
    ).toBe(0.5);

    const readyForSecondSwing = stepStarterPickaxeMiningState(firstSwingHit.state, {
      world,
      playerState: player,
      fixedDtSeconds:
        STARTER_PICKAXE_SWING_ACTIVE_SECONDS + STARTER_PICKAXE_SWING_RECOVERY_SECONDS
    });
    const secondSwingStart = tryStartStarterPickaxeSwing(readyForSecondSwing.state, evaluation);
    const secondSwingHit = stepStarterPickaxeMiningState(secondSwingStart.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(secondSwingHit.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: 1,
      appliedHitCount: 2,
      requiredHitCount: 2,
      brokeTile: true
    });
    expect(secondSwingHit.state.breakProgress).toBeNull();
  });

  it('requires two separate swings to finish a copper ore tile and reports halfway progress after the first hit', () => {
    const world = createWorld({
      '0,0': PROCEDURAL_COPPER_ORE_TILE_ID
    });
    const player = createPlayer();
    const evaluation = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);

    const firstSwingStart = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);
    const firstSwingHit = stepStarterPickaxeMiningState(firstSwingStart.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(firstSwingHit.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: PROCEDURAL_COPPER_ORE_TILE_ID,
      appliedHitCount: 1,
      requiredHitCount: 2,
      brokeTile: false
    });
    expect(resolveStarterPickaxeBreakProgressNormalized(firstSwingHit.state, world, 0, 0)).toBe(0.5);

    const readyForSecondSwing = stepStarterPickaxeMiningState(firstSwingHit.state, {
      world,
      playerState: player,
      fixedDtSeconds:
        STARTER_PICKAXE_SWING_ACTIVE_SECONDS + STARTER_PICKAXE_SWING_RECOVERY_SECONDS
    });
    const secondSwingStart = tryStartStarterPickaxeSwing(readyForSecondSwing.state, evaluation);
    const secondSwingHit = stepStarterPickaxeMiningState(secondSwingStart.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(secondSwingHit.hitEvent).toEqual({
      tileX: 0,
      tileY: 0,
      tileId: PROCEDURAL_COPPER_ORE_TILE_ID,
      appliedHitCount: 2,
      requiredHitCount: 2,
      brokeTile: true
    });
    expect(secondSwingHit.state.breakProgress).toBeNull();
  });

  it('resets accumulated progress when the next hit targets a different terrain tile', () => {
    const world = createWorld({
      '0,0': 1,
      '1,0': 9
    });
    const player = createPlayer();

    const firstTarget = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);
    const firstSwingHit = stepStarterPickaxeMiningState(
      tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), firstTarget).state,
      {
        world,
        playerState: player,
        fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
      }
    );

    const differentTarget = evaluateStarterPickaxeMiningTarget(world, player, 1, 0);
    const secondSwingStart = tryStartStarterPickaxeSwing(
      stepStarterPickaxeMiningState(firstSwingHit.state, {
        world,
        playerState: player,
        fixedDtSeconds:
          STARTER_PICKAXE_SWING_ACTIVE_SECONDS + STARTER_PICKAXE_SWING_RECOVERY_SECONDS
      }).state,
      differentTarget
    );
    const secondSwingHit = stepStarterPickaxeMiningState(secondSwingStart.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(secondSwingHit.hitEvent).toMatchObject({
      tileX: 1,
      tileY: 0,
      tileId: 9,
      appliedHitCount: 1,
      requiredHitCount: 1,
      brokeTile: true
    });
    expect(resolveStarterPickaxeBreakProgressNormalized(secondSwingHit.state, world, 0, 0)).toBe(0);
  });

  it('refuses to start a new swing while one is already active', () => {
    const world = createWorld({
      '0,0': 9
    });
    const player = createPlayer();
    const evaluation = evaluateStarterPickaxeMiningTarget(world, player, 0, 0);
    const started = tryStartStarterPickaxeSwing(createStarterPickaxeMiningState(), evaluation);
    const blocked = tryStartStarterPickaxeSwing(started.state, evaluation);

    expect(blocked.started).toBe(false);
    expect(blocked.state).toEqual(started.state);
  });

  it('keeps existing break progress when the player swings out of range and clears stale progress once the tile changes', () => {
    const tiles: Record<string, number> = {
      '0,0': 1
    };
    const world = createWorld(tiles);
    const inRangePlayer = createPlayer();

    const firstHit = stepStarterPickaxeMiningState(
      tryStartStarterPickaxeSwing(
        createStarterPickaxeMiningState(),
        evaluateStarterPickaxeMiningTarget(world, inRangePlayer, 0, 0)
      ).state,
      {
        world,
        playerState: inRangePlayer,
        fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
      }
    );
    const outOfRangePlayer = createPlayer(8, 28 + 16 * 20);
    const secondSwingStart = tryStartStarterPickaxeSwing(
      stepStarterPickaxeMiningState(firstHit.state, {
        world,
        playerState: inRangePlayer,
        fixedDtSeconds:
          STARTER_PICKAXE_SWING_ACTIVE_SECONDS + STARTER_PICKAXE_SWING_RECOVERY_SECONDS
      }).state,
      evaluateStarterPickaxeMiningTarget(world, outOfRangePlayer, 0, 0)
    );
    const outOfRangeHit = stepStarterPickaxeMiningState(secondSwingStart.state, {
      world,
      playerState: outOfRangePlayer,
      fixedDtSeconds: STARTER_PICKAXE_SWING_WINDUP_SECONDS
    });

    expect(outOfRangeHit.hitEvent).toBeNull();
    expect(resolveStarterPickaxeBreakProgressNormalized(outOfRangeHit.state, world, 0, 0)).toBe(0.5);

    tiles['0,0'] = 0;
    const afterTileChange = stepStarterPickaxeMiningState(outOfRangeHit.state, {
      world,
      playerState: outOfRangePlayer,
      fixedDtSeconds: 0
    });

    expect(afterTileChange.state.breakProgress).toBeNull();
    expect(resolveStarterPickaxeBreakProgressNormalized(afterTileChange.state, world, 0, 0)).toBe(0);
  });
});
