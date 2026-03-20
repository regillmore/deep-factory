import { describe, expect, it } from 'vitest';

import {
  createDefaultPlayerInventoryState,
  createPlayerInventoryState,
  getPlayerInventoryItemAmount
} from './playerInventory';
import {
  evaluatePlayerCraftingRecipe,
  findNearestPlayerCraftingStationInRange,
  getPlayerCraftingRecipeDefinition,
  getPlayerCraftingRecipeDefinitions,
  getPlayerCraftingStationLabel,
  tryCraftPlayerRecipe,
  type PlayerCraftingWorldView
} from './playerCrafting';
import { createPlayerState } from './playerState';
import { STARTER_WORKBENCH_TILE_ID } from './starterWorkbenchPlacement';

const createWorld = (
  tiles: Record<string, number> = {}
): PlayerCraftingWorldView => ({
  getTile: (worldTileX, worldTileY) => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

const createPlayer = (x = 8, y = 28) =>
  createPlayerState({
    position: { x, y },
    grounded: true
  });

const createWorkbenchCraftInventoryState = () =>
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
      null,
      { itemId: 'spear', amount: 1 }
    ]
  });

describe('playerCrafting definitions', () => {
  it('exposes a minimal starter recipe registry with a station-free workbench and a workbench-gated potion', () => {
    expect(getPlayerCraftingRecipeDefinitions()).toEqual([
      {
        id: 'workbench',
        label: 'Workbench',
        ingredients: [{ itemId: 'dirt-block', amount: 20 }],
        output: { itemId: 'workbench', amount: 1 },
        requiredStationId: null
      },
      {
        id: 'healing-potion',
        label: 'Healing Potion',
        ingredients: [{ itemId: 'gel', amount: 2 }],
        output: { itemId: 'healing-potion', amount: 1 },
        requiredStationId: 'workbench'
      }
    ]);
    expect(getPlayerCraftingRecipeDefinition('workbench').requiredStationId).toBeNull();
    expect(getPlayerCraftingRecipeDefinition('healing-potion').requiredStationId).toBe('workbench');
    expect(getPlayerCraftingStationLabel('workbench')).toBe('Workbench');
  });
});

describe('findNearestPlayerCraftingStationInRange', () => {
  it('finds the nearest in-range workbench tile and ignores farther matches', () => {
    const playerState = createPlayer();
    const world = createWorld({
      '0,-1': STARTER_WORKBENCH_TILE_ID,
      '4,-1': STARTER_WORKBENCH_TILE_ID
    });

    expect(
      findNearestPlayerCraftingStationInRange({
        stationId: 'workbench',
        world,
        playerState
      })
    ).toEqual({
      stationId: 'workbench',
      tileX: 0,
      tileY: -1,
      distanceSquared: 0
    });
  });
});

describe('evaluatePlayerCraftingRecipe', () => {
  it('blocks the workbench recipe when the full default hotbar has no room for the output', () => {
    const evaluation = evaluatePlayerCraftingRecipe({
      inventoryState: createDefaultPlayerInventoryState(),
      recipeId: 'workbench'
    });

    expect(evaluation).toMatchObject({
      hasIngredients: true,
      stationInRange: true,
      outputFitsInInventory: false,
      blocker: 'inventory-full',
      craftable: false
    });
  });

  it('keeps the workbench recipe craftable without a nearby station when an output slot is available', () => {
    const evaluation = evaluatePlayerCraftingRecipe({
      inventoryState: createWorkbenchCraftInventoryState(),
      recipeId: 'workbench'
    });

    expect(evaluation).toMatchObject({
      hasIngredients: true,
      stationInRange: true,
      outputFitsInInventory: true,
      blocker: null,
      craftable: true
    });
  });

  it('blocks station recipes until a nearby workbench is placed', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'gel', amount: 2 },
        ...Array.from({ length: 9 }, () => null)
      ]
    });

    const withoutWorkbench = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'healing-potion',
      playerState: createPlayer(),
      world: createWorld()
    });
    const withWorkbench = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'healing-potion',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });

    expect(withoutWorkbench).toMatchObject({
      hasIngredients: true,
      stationInRange: false,
      blocker: 'missing-station',
      craftable: false
    });
    expect(withWorkbench).toMatchObject({
      hasIngredients: true,
      stationInRange: true,
      blocker: null,
      craftable: true
    });
  });

  it('reports missing ingredients before inventory capacity or station checks', () => {
    const evaluation = evaluatePlayerCraftingRecipe({
      inventoryState: createPlayerInventoryState({
        hotbar: [
          { itemId: 'gel', amount: 1 },
          ...Array.from({ length: 9 }, () => null)
        ]
      }),
      recipeId: 'healing-potion',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });

    expect(evaluation.ingredients).toEqual([
      {
        itemId: 'gel',
        amount: 2,
        availableAmount: 1,
        missingAmount: 1
      }
    ]);
    expect(evaluation.blocker).toBe('missing-ingredients');
    expect(evaluation.craftable).toBe(false);
  });
});

describe('tryCraftPlayerRecipe', () => {
  it('crafts a workbench by consuming dirt and adding one workbench stack', () => {
    const result = tryCraftPlayerRecipe({
      inventoryState: createWorkbenchCraftInventoryState(),
      recipeId: 'workbench'
    });

    expect(result.crafted).toBe(true);
    expect(getPlayerInventoryItemAmount(result.nextInventoryState, 'dirt-block')).toBe(44);
    expect(getPlayerInventoryItemAmount(result.nextInventoryState, 'workbench')).toBe(1);
  });

  it('crafts a healing potion only when a nearby workbench is available', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'gel', amount: 2 },
        { itemId: 'healing-potion', amount: 1 },
        ...Array.from({ length: 8 }, () => null)
      ]
    });

    const blocked = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'healing-potion',
      playerState: createPlayer(),
      world: createWorld()
    });
    const crafted = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'healing-potion',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });

    expect(blocked.crafted).toBe(false);
    expect(blocked.nextInventoryState).toEqual(inventoryState);
    expect(crafted.crafted).toBe(true);
    expect(crafted.nextInventoryState.hotbar[0]).toBeNull();
    expect(crafted.nextInventoryState.hotbar[1]).toEqual({
      itemId: 'healing-potion',
      amount: 2
    });
  });
});
