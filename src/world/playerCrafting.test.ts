import { describe, expect, it } from 'vitest';

import {
  createPlayerInventoryState,
  getPlayerInventoryItemAmount
} from './playerInventory';
import {
  evaluatePlayerCraftingRecipe,
  findNearestPlayerCraftingStationInRange,
  getPlayerCraftingRecipeDefinition,
  getPlayerCraftingRecipeDefinitions,
  getPlayerCraftingStationDefinitions,
  getPlayerCraftingStationLabel,
  isPlayerCraftingRecipeId,
  tryCraftPlayerRecipe,
  type PlayerCraftingWorldView
} from './playerCrafting';
import { createPlayerState } from './playerState';
import { STARTER_ANVIL_TILE_ID } from './starterAnvilPlacement';
import { STARTER_FURNACE_TILE_ID } from './starterFurnacePlacement';
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
  it('exposes the starter recipe registry with nearby-station requirements', () => {
    expect(getPlayerCraftingRecipeDefinitions()).toEqual([
      {
        id: 'workbench',
        label: 'Workbench',
        ingredients: [{ itemId: 'dirt-block', amount: 20 }],
        output: { itemId: 'workbench', amount: 1 },
        requiredStationId: null
      },
      {
        id: 'furnace',
        label: 'Furnace',
        ingredients: [
          { itemId: 'stone-block', amount: 20 },
          { itemId: 'torch', amount: 4 }
        ],
        output: { itemId: 'furnace', amount: 1 },
        requiredStationId: 'workbench'
      },
      {
        id: 'healing-potion',
        label: 'Healing Potion',
        ingredients: [{ itemId: 'gel', amount: 2 }],
        output: { itemId: 'healing-potion', amount: 1 },
        requiredStationId: 'workbench'
      },
      {
        id: 'copper-bar',
        label: 'Copper Bar',
        ingredients: [{ itemId: 'copper-ore', amount: 3 }],
        output: { itemId: 'copper-bar', amount: 1 },
        requiredStationId: 'furnace'
      },
      {
        id: 'anvil',
        label: 'Anvil',
        ingredients: [{ itemId: 'copper-bar', amount: 5 }],
        output: { itemId: 'anvil', amount: 1 },
        requiredStationId: 'workbench'
      },
      {
        id: 'pickaxe',
        label: 'Starter Pickaxe',
        ingredients: [{ itemId: 'copper-bar', amount: 12 }],
        output: { itemId: 'pickaxe', amount: 1 },
        requiredStationId: 'anvil'
      },
      {
        id: 'spear',
        label: 'Starter Spear',
        ingredients: [{ itemId: 'copper-bar', amount: 8 }],
        output: { itemId: 'spear', amount: 1 },
        requiredStationId: 'anvil'
      },
      {
        id: 'sword',
        label: 'Starter Sword',
        ingredients: [{ itemId: 'copper-bar', amount: 10 }],
        output: { itemId: 'sword', amount: 1 },
        requiredStationId: 'anvil'
      }
    ]);
    expect(getPlayerCraftingRecipeDefinition('workbench').requiredStationId).toBeNull();
    expect(getPlayerCraftingRecipeDefinition('furnace').requiredStationId).toBe('workbench');
    expect(getPlayerCraftingRecipeDefinition('healing-potion').requiredStationId).toBe('workbench');
    expect(getPlayerCraftingRecipeDefinition('copper-bar').requiredStationId).toBe('furnace');
    expect(getPlayerCraftingRecipeDefinition('anvil').requiredStationId).toBe('workbench');
    expect(getPlayerCraftingRecipeDefinition('pickaxe').requiredStationId).toBe('anvil');
    expect(getPlayerCraftingRecipeDefinition('spear').requiredStationId).toBe('anvil');
    expect(getPlayerCraftingRecipeDefinition('sword').requiredStationId).toBe('anvil');
    expect(getPlayerCraftingStationDefinitions()).toEqual([
      { id: 'workbench', label: 'Workbench' },
      { id: 'furnace', label: 'Furnace' },
      { id: 'anvil', label: 'Anvil' }
    ]);
    expect(getPlayerCraftingStationLabel('workbench')).toBe('Workbench');
    expect(getPlayerCraftingStationLabel('furnace')).toBe('Furnace');
    expect(getPlayerCraftingStationLabel('anvil')).toBe('Anvil');
    expect(isPlayerCraftingRecipeId('workbench')).toBe(true);
    expect(isPlayerCraftingRecipeId('furnace')).toBe(true);
    expect(isPlayerCraftingRecipeId('healing-potion')).toBe(true);
    expect(isPlayerCraftingRecipeId('copper-bar')).toBe(true);
    expect(isPlayerCraftingRecipeId('anvil')).toBe(true);
    expect(isPlayerCraftingRecipeId('pickaxe')).toBe(true);
    expect(isPlayerCraftingRecipeId('spear')).toBe(true);
    expect(isPlayerCraftingRecipeId('sword')).toBe(true);
    expect(isPlayerCraftingRecipeId('torch')).toBe(false);
  });
});

describe('findNearestPlayerCraftingStationInRange', () => {
  it('finds the nearest in-range workbench, furnace, or anvil tile and ignores farther matches', () => {
    const playerState = createPlayer();
    const world = createWorld({
      '0,-1': STARTER_WORKBENCH_TILE_ID,
      '2,-1': STARTER_FURNACE_TILE_ID,
      '4,-1': STARTER_ANVIL_TILE_ID,
      '5,-1': STARTER_WORKBENCH_TILE_ID,
      '6,-1': STARTER_FURNACE_TILE_ID
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
    expect(
      findNearestPlayerCraftingStationInRange({
        stationId: 'furnace',
        world,
        playerState
      })
    ).toMatchObject({
      stationId: 'furnace',
      tileX: 2,
      tileY: -1
    });
    expect(
      findNearestPlayerCraftingStationInRange({
        stationId: 'anvil',
        world,
        playerState
      })
    ).toMatchObject({
      stationId: 'anvil',
      tileX: 4,
      tileY: -1
    });
  });
});

describe('evaluatePlayerCraftingRecipe', () => {
  it('blocks the workbench recipe when the hotbar has no room for the output', () => {
    const evaluation = evaluatePlayerCraftingRecipe({
      inventoryState: createPlayerInventoryState({
        hotbar: [
          { itemId: 'dirt-block', amount: 21 },
          ...Array.from({ length: 9 }, () => ({
            itemId: 'torch' as const,
            amount: 1
          }))
        ]
      }),
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

  it('blocks station recipes until the matching nearby station is placed', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'gel', amount: 2 },
        { itemId: 'copper-ore', amount: 3 },
        { itemId: 'copper-bar', amount: 12 },
        ...Array.from({ length: 7 }, () => null)
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
    const copperBarWithoutFurnace = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'copper-bar',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });
    const copperBarWithFurnace = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'copper-bar',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_FURNACE_TILE_ID
      })
    });
    const pickaxeWithoutAnvil = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'pickaxe',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });
    const pickaxeWithAnvil = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'pickaxe',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_ANVIL_TILE_ID
      })
    });
    const spearWithoutAnvil = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'spear',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });
    const spearWithAnvil = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'spear',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_ANVIL_TILE_ID
      })
    });
    const swordWithoutAnvil = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'sword',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });
    const swordWithAnvil = evaluatePlayerCraftingRecipe({
      inventoryState,
      recipeId: 'sword',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_ANVIL_TILE_ID
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
    expect(copperBarWithoutFurnace).toMatchObject({
      hasIngredients: true,
      stationInRange: false,
      blocker: 'missing-station',
      craftable: false
    });
    expect(copperBarWithFurnace).toMatchObject({
      hasIngredients: true,
      stationInRange: true,
      blocker: null,
      craftable: true
    });
    expect(pickaxeWithoutAnvil).toMatchObject({
      hasIngredients: true,
      stationInRange: false,
      blocker: 'missing-station',
      craftable: false
    });
    expect(pickaxeWithAnvil).toMatchObject({
      hasIngredients: true,
      stationInRange: true,
      blocker: null,
      craftable: true
    });
    expect(spearWithoutAnvil).toMatchObject({
      hasIngredients: true,
      stationInRange: false,
      blocker: 'missing-station',
      craftable: false
    });
    expect(spearWithAnvil).toMatchObject({
      hasIngredients: true,
      stationInRange: true,
      blocker: null,
      craftable: true
    });
    expect(swordWithoutAnvil).toMatchObject({
      hasIngredients: true,
      stationInRange: false,
      blocker: 'missing-station',
      craftable: false
    });
    expect(swordWithAnvil).toMatchObject({
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

  it('crafts a furnace only when a nearby workbench is available', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'stone-block', amount: 20 },
        { itemId: 'torch', amount: 4 },
        ...Array.from({ length: 8 }, () => null)
      ]
    });

    const blocked = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'furnace',
      playerState: createPlayer(),
      world: createWorld()
    });
    const crafted = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'furnace',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });

    expect(blocked.crafted).toBe(false);
    expect(blocked.nextInventoryState).toEqual(inventoryState);
    expect(crafted.crafted).toBe(true);
    expect(getPlayerInventoryItemAmount(crafted.nextInventoryState, 'stone-block')).toBe(0);
    expect(getPlayerInventoryItemAmount(crafted.nextInventoryState, 'torch')).toBe(0);
    expect(getPlayerInventoryItemAmount(crafted.nextInventoryState, 'furnace')).toBe(1);
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

  it('smelts one copper bar from three copper ore only when a nearby furnace is available', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'copper-ore', amount: 3 },
        null,
        ...Array.from({ length: 8 }, () => null)
      ]
    });

    const blocked = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'copper-bar',
      playerState: createPlayer(),
      world: createWorld()
    });
    const crafted = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'copper-bar',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_FURNACE_TILE_ID
      })
    });

    expect(blocked.crafted).toBe(false);
    expect(blocked.nextInventoryState).toEqual(inventoryState);
    expect(crafted.crafted).toBe(true);
    expect(crafted.nextInventoryState.hotbar[0]).toEqual({
      itemId: 'copper-bar',
      amount: 1
    });
  });

  it('crafts an anvil from copper bars only when a nearby workbench is available', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'copper-bar', amount: 5 },
        null,
        ...Array.from({ length: 8 }, () => null)
      ]
    });

    const blocked = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'anvil',
      playerState: createPlayer(),
      world: createWorld()
    });
    const crafted = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'anvil',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_WORKBENCH_TILE_ID
      })
    });

    expect(blocked.crafted).toBe(false);
    expect(blocked.nextInventoryState).toEqual(inventoryState);
    expect(crafted.crafted).toBe(true);
    expect(crafted.nextInventoryState.hotbar[0]).toEqual({
      itemId: 'anvil',
      amount: 1
    });
  });

  it('crafts a starter pickaxe from copper bars only when a nearby anvil is available', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'copper-bar', amount: 12 },
        null,
        ...Array.from({ length: 8 }, () => null)
      ]
    });

    const blocked = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'pickaxe',
      playerState: createPlayer(),
      world: createWorld()
    });
    const crafted = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'pickaxe',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_ANVIL_TILE_ID
      })
    });

    expect(blocked.crafted).toBe(false);
    expect(blocked.nextInventoryState).toEqual(inventoryState);
    expect(crafted.crafted).toBe(true);
    expect(crafted.nextInventoryState.hotbar[0]).toEqual({
      itemId: 'pickaxe',
      amount: 1
    });
    expect(getPlayerInventoryItemAmount(crafted.nextInventoryState, 'copper-bar')).toBe(0);
  });

  it('crafts a starter spear from copper bars only when a nearby anvil is available', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'copper-bar', amount: 8 },
        null,
        ...Array.from({ length: 8 }, () => null)
      ]
    });

    const blocked = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'spear',
      playerState: createPlayer(),
      world: createWorld()
    });
    const crafted = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'spear',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_ANVIL_TILE_ID
      })
    });

    expect(blocked.crafted).toBe(false);
    expect(blocked.nextInventoryState).toEqual(inventoryState);
    expect(crafted.crafted).toBe(true);
    expect(crafted.nextInventoryState.hotbar[0]).toEqual({
      itemId: 'spear',
      amount: 1
    });
    expect(getPlayerInventoryItemAmount(crafted.nextInventoryState, 'copper-bar')).toBe(0);
  });

  it('crafts a starter sword from copper bars only when a nearby anvil is available', () => {
    const inventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'copper-bar', amount: 10 },
        null,
        ...Array.from({ length: 8 }, () => null)
      ]
    });

    const blocked = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'sword',
      playerState: createPlayer(),
      world: createWorld()
    });
    const crafted = tryCraftPlayerRecipe({
      inventoryState,
      recipeId: 'sword',
      playerState: createPlayer(),
      world: createWorld({
        '0,-1': STARTER_ANVIL_TILE_ID
      })
    });

    expect(blocked.crafted).toBe(false);
    expect(blocked.nextInventoryState).toEqual(inventoryState);
    expect(crafted.crafted).toBe(true);
    expect(crafted.nextInventoryState.hotbar[0]).toEqual({
      itemId: 'sword',
      amount: 1
    });
    expect(getPlayerInventoryItemAmount(crafted.nextInventoryState, 'copper-bar')).toBe(0);
  });
});
