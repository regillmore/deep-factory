import { describe, expect, it } from 'vitest';

import { DEFAULT_PLAYER_HEIGHT, DEFAULT_PLAYER_WIDTH } from './playerState';
import { getSmallTreeTileIds } from './smallTreeTiles';
import {
  chopSmallTreeAtAnchor,
  createStarterAxeChoppingState,
  evaluateStarterAxeChoppingTarget,
  resolveStarterAxeWoodDropAmount,
  STARTER_AXE_SWING_ACTIVE_SECONDS,
  STARTER_AXE_SWING_RECOVERY_SECONDS,
  STARTER_AXE_SWING_WINDUP_SECONDS,
  stepStarterAxeChoppingState,
  tryStartStarterAxeSwing,
  type StarterAxeChoppingWorldView
} from './starterAxeChopping';

const SMALL_TREE_TILE_IDS = getSmallTreeTileIds();
const GRASS_SURFACE_TILE_ID = 2;

const createPlayer = (x = 8, y = 28) => ({
  position: { x, y },
  size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT }
});

const createWorld = (
  tiles: Record<string, number> = {}
): StarterAxeChoppingWorldView => ({
  getTile: (worldTileX, worldTileY) => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

const createMutableWorld = (tiles: Record<string, number> = {}) => {
  const state = new Map(Object.entries(tiles));
  return {
    world: {
      getTile: (worldTileX: number, worldTileY: number) =>
        state.get(`${worldTileX},${worldTileY}`) ?? 0,
      setTile: (worldTileX: number, worldTileY: number, tileId: number) => {
        state.set(`${worldTileX},${worldTileY}`, tileId);
        return true;
      }
    },
    readTile: (worldTileX: number, worldTileY: number) => state.get(`${worldTileX},${worldTileY}`) ?? 0
  };
};

const createPlantedTreeTiles = (anchorTileX = 0, anchorTileY = 0): Record<string, number> => ({
  [`${anchorTileX},${anchorTileY}`]: GRASS_SURFACE_TILE_ID,
  [`${anchorTileX},${anchorTileY - 1}`]: SMALL_TREE_TILE_IDS.sapling
});

const createGrownTreeTiles = (anchorTileX = 0, anchorTileY = 0): Record<string, number> => ({
  [`${anchorTileX},${anchorTileY}`]: GRASS_SURFACE_TILE_ID,
  [`${anchorTileX},${anchorTileY - 1}`]: SMALL_TREE_TILE_IDS.trunk,
  [`${anchorTileX},${anchorTileY - 2}`]: SMALL_TREE_TILE_IDS.trunk,
  [`${anchorTileX - 1},${anchorTileY - 3}`]: SMALL_TREE_TILE_IDS.leaf,
  [`${anchorTileX},${anchorTileY - 3}`]: SMALL_TREE_TILE_IDS.leaf,
  [`${anchorTileX + 1},${anchorTileY - 3}`]: SMALL_TREE_TILE_IDS.leaf
});

describe('evaluateStarterAxeChoppingTarget', () => {
  it('accepts nearby planted saplings and grown-tree trunk or leaf tiles while rejecting non-tree targets', () => {
    const world = createWorld({
      ...createPlantedTreeTiles(0, 0),
      ...createGrownTreeTiles(4, 0),
      '8,0': 9
    });
    const player = createPlayer(48, 28);

    expect(evaluateStarterAxeChoppingTarget(world, player, 0, -1)).toEqual({
      tileX: 0,
      tileY: -1,
      tileId: SMALL_TREE_TILE_IDS.sapling,
      occupied: true,
      chopTarget: true,
      withinRange: true,
      canChop: true,
      resolvedAnchor: {
        anchorTileX: 0,
        anchorTileY: 0,
        growthStage: 'planted'
      }
    });
    expect(evaluateStarterAxeChoppingTarget(world, player, 4, -2)).toMatchObject({
      tileId: SMALL_TREE_TILE_IDS.trunk,
      chopTarget: true,
      canChop: true,
      resolvedAnchor: {
        anchorTileX: 4,
        anchorTileY: 0,
        growthStage: 'grown'
      }
    });
    expect(evaluateStarterAxeChoppingTarget(world, player, 5, -3)).toMatchObject({
      tileId: SMALL_TREE_TILE_IDS.leaf,
      chopTarget: true,
      canChop: true,
      resolvedAnchor: {
        anchorTileX: 4,
        anchorTileY: 0,
        growthStage: 'grown'
      }
    });
    expect(evaluateStarterAxeChoppingTarget(world, player, 4, 0)).toMatchObject({
      tileId: GRASS_SURFACE_TILE_ID,
      chopTarget: false,
      canChop: false
    });
    expect(evaluateStarterAxeChoppingTarget(world, player, 8, 0)).toMatchObject({
      tileId: 9,
      chopTarget: false,
      canChop: false
    });
    expect(evaluateStarterAxeChoppingTarget(world, player, 10, -1)).toMatchObject({
      tileId: 0,
      occupied: false,
      chopTarget: false,
      canChop: false
    });
  });

  it('marks small-tree targets outside the shared hotbar reach as out of range', () => {
    const world = createWorld(createGrownTreeTiles(20, 0));

    expect(evaluateStarterAxeChoppingTarget(world, createPlayer(), 20, -1)).toMatchObject({
      tileId: SMALL_TREE_TILE_IDS.trunk,
      chopTarget: true,
      withinRange: false,
      canChop: false
    });
  });
});

describe('starterAxeChopping helpers', () => {
  it('returns one wood for planted saplings and five wood for grown placeholder trees', () => {
    expect(resolveStarterAxeWoodDropAmount('planted')).toBe(1);
    expect(resolveStarterAxeWoodDropAmount('grown')).toBe(5);
  });

  it('clears the full grown-tree footprint and reports five wood from the shared anchor', () => {
    const { world, readTile } = createMutableWorld(createGrownTreeTiles(2, 3));

    const chopResult = chopSmallTreeAtAnchor(world, 2, 3, 'grown');

    expect(chopResult.woodDropAmount).toBe(5);
    expect(chopResult.writes).toEqual([
      {
        worldTileX: 2,
        worldTileY: 2,
        previousTileId: SMALL_TREE_TILE_IDS.trunk,
        tileId: 0
      },
      {
        worldTileX: 2,
        worldTileY: 1,
        previousTileId: SMALL_TREE_TILE_IDS.trunk,
        tileId: 0
      },
      {
        worldTileX: 1,
        worldTileY: 0,
        previousTileId: SMALL_TREE_TILE_IDS.leaf,
        tileId: 0
      },
      {
        worldTileX: 2,
        worldTileY: 0,
        previousTileId: SMALL_TREE_TILE_IDS.leaf,
        tileId: 0
      },
      {
        worldTileX: 3,
        worldTileY: 0,
        previousTileId: SMALL_TREE_TILE_IDS.leaf,
        tileId: 0
      }
    ]);
    expect(readTile(2, 3)).toBe(GRASS_SURFACE_TILE_ID);
    expect(readTile(2, 2)).toBe(0);
    expect(readTile(2, 1)).toBe(0);
    expect(readTile(1, 0)).toBe(0);
    expect(readTile(2, 0)).toBe(0);
    expect(readTile(3, 0)).toBe(0);
  });
});

describe('starterAxeChopping state', () => {
  it('emits one chop event for a grown-tree leaf target when windup completes', () => {
    const world = createWorld(createGrownTreeTiles(1, 0));
    const player = createPlayer();
    const evaluation = evaluateStarterAxeChoppingTarget(world, player, 2, -3);
    const started = tryStartStarterAxeSwing(createStarterAxeChoppingState(), evaluation);

    expect(started.started).toBe(true);

    const afterWindup = stepStarterAxeChoppingState(started.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_AXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.chopEvent).toEqual({
      anchorTileX: 1,
      anchorTileY: 0,
      growthStage: 'grown'
    });
    expect(afterWindup.state.activeSwing).toMatchObject({
      sampledTileX: 2,
      sampledTileY: -3,
      anchorTileX: 1,
      anchorTileY: 0,
      phase: 'active',
      phaseSecondsRemaining: STARTER_AXE_SWING_ACTIVE_SECONDS
    });
  });

  it('advances through active, recovery, and clear after the chop event lands', () => {
    const world = createWorld(createPlantedTreeTiles(0, 0));
    const player = createPlayer();
    const started = tryStartStarterAxeSwing(
      createStarterAxeChoppingState(),
      evaluateStarterAxeChoppingTarget(world, player, 0, -1)
    );
    const afterWindup = stepStarterAxeChoppingState(started.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_AXE_SWING_WINDUP_SECONDS
    });

    const afterActive = stepStarterAxeChoppingState(afterWindup.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_AXE_SWING_ACTIVE_SECONDS
    });

    expect(afterActive.chopEvent).toBeNull();
    expect(afterActive.state.activeSwing).toMatchObject({
      phase: 'recovery',
      phaseSecondsRemaining: STARTER_AXE_SWING_RECOVERY_SECONDS
    });

    const afterRecovery = stepStarterAxeChoppingState(afterActive.state, {
      world,
      playerState: player,
      fixedDtSeconds: STARTER_AXE_SWING_RECOVERY_SECONDS
    });

    expect(afterRecovery.chopEvent).toBeNull();
    expect(afterRecovery.state.activeSwing).toBeNull();
  });

  it('misses when the player moves out of range before windup completes', () => {
    const world = createWorld(createGrownTreeTiles(0, 0));
    const started = tryStartStarterAxeSwing(
      createStarterAxeChoppingState(),
      evaluateStarterAxeChoppingTarget(world, createPlayer(8, 28), 1, -3)
    );

    const afterWindup = stepStarterAxeChoppingState(started.state, {
      world,
      playerState: createPlayer(320, 28),
      fixedDtSeconds: STARTER_AXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.chopEvent).toBeNull();
    expect(afterWindup.state.activeSwing).toMatchObject({
      phase: 'active'
    });
  });

  it('does not start another axe swing while one is already active', () => {
    const world = createWorld(createPlantedTreeTiles(0, 0));
    const player = createPlayer();
    const evaluation = evaluateStarterAxeChoppingTarget(world, player, 0, -1);
    const started = tryStartStarterAxeSwing(createStarterAxeChoppingState(), evaluation);
    const blocked = tryStartStarterAxeSwing(started.state, evaluation);

    expect(blocked.started).toBe(false);
    expect(blocked.state.activeSwing).toEqual(started.state.activeSwing);
  });

  it('can resolve a stage change at the same anchor between swing start and hit time', () => {
    const plantedWorld = createWorld(createPlantedTreeTiles(0, 0));
    const grownWorld = createWorld(createGrownTreeTiles(0, 0));
    const player = createPlayer();
    const started = tryStartStarterAxeSwing(
      createStarterAxeChoppingState(),
      evaluateStarterAxeChoppingTarget(plantedWorld, player, 0, -1)
    );

    const afterWindup = stepStarterAxeChoppingState(started.state, {
      world: grownWorld,
      playerState: player,
      fixedDtSeconds: STARTER_AXE_SWING_WINDUP_SECONDS
    });

    expect(afterWindup.chopEvent).toEqual({
      anchorTileX: 0,
      anchorTileY: 0,
      growthStage: 'grown'
    });
  });
});
