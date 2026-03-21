import { describe, expect, it } from 'vitest';

import { getPlayerRecipeCatalogEntries, searchPlayerRecipeCatalog } from './playerRecipeCatalog';

describe('playerRecipeCatalog', () => {
  it('lists every recipe once in alphabetical label order with shared display labels', () => {
    expect(getPlayerRecipeCatalogEntries()).toEqual([
      {
        recipeId: 'anvil',
        label: 'Anvil',
        outputItemId: 'anvil',
        outputLabel: 'Output: +1 ANVIL',
        ingredientsLabel: 'Ingredients: 5 Copper Bar',
        stationRequirementLabel: 'Requirement: Nearby Workbench',
        requiredStationId: 'workbench',
        ingredients: [{ itemId: 'copper-bar', label: 'Copper Bar', amount: 5 }]
      },
      {
        recipeId: 'copper-bar',
        label: 'Copper Bar',
        outputItemId: 'copper-bar',
        outputLabel: 'Output: +1 CBAR',
        ingredientsLabel: 'Ingredients: 3 Copper Ore',
        stationRequirementLabel: 'Requirement: Nearby Furnace',
        requiredStationId: 'furnace',
        ingredients: [{ itemId: 'copper-ore', label: 'Copper Ore', amount: 3 }]
      },
      {
        recipeId: 'furnace',
        label: 'Furnace',
        outputItemId: 'furnace',
        outputLabel: 'Output: +1 FURN',
        ingredientsLabel: 'Ingredients: 20 Stone Block + 4 Torch',
        stationRequirementLabel: 'Requirement: Nearby Workbench',
        requiredStationId: 'workbench',
        ingredients: [
          { itemId: 'stone-block', label: 'Stone Block', amount: 20 },
          { itemId: 'torch', label: 'Torch', amount: 4 }
        ]
      },
      {
        recipeId: 'healing-potion',
        label: 'Healing Potion',
        outputItemId: 'healing-potion',
        outputLabel: 'Output: +1 POTION',
        ingredientsLabel: 'Ingredients: 2 Gel',
        stationRequirementLabel: 'Requirement: Nearby Workbench',
        requiredStationId: 'workbench',
        ingredients: [{ itemId: 'gel', label: 'Gel', amount: 2 }]
      },
      {
        recipeId: 'spear',
        label: 'Starter Spear',
        outputItemId: 'spear',
        outputLabel: 'Output: +1 SPEAR',
        ingredientsLabel: 'Ingredients: 8 Copper Bar',
        stationRequirementLabel: 'Requirement: Nearby Anvil',
        requiredStationId: 'anvil',
        ingredients: [{ itemId: 'copper-bar', label: 'Copper Bar', amount: 8 }]
      },
      {
        recipeId: 'workbench',
        label: 'Workbench',
        outputItemId: 'workbench',
        outputLabel: 'Output: +1 BENCH',
        ingredientsLabel: 'Ingredients: 20 Dirt Block',
        stationRequirementLabel: 'Requirement: None',
        requiredStationId: null,
        ingredients: [{ itemId: 'dirt-block', label: 'Dirt Block', amount: 20 }]
      }
    ]);
  });

  it('matches recipe label, output, ingredient, and station requirement search terms', () => {
    expect(searchPlayerRecipeCatalog('healing potion').map((entry) => entry.recipeId)).toEqual([
      'healing-potion'
    ]);
    expect(searchPlayerRecipeCatalog('potion').map((entry) => entry.recipeId)).toEqual([
      'healing-potion'
    ]);
    expect(searchPlayerRecipeCatalog('copper bar').map((entry) => entry.recipeId)).toEqual([
      'anvil',
      'copper-bar',
      'spear'
    ]);
    expect(searchPlayerRecipeCatalog('gel').map((entry) => entry.recipeId)).toEqual([
      'healing-potion'
    ]);
    expect(searchPlayerRecipeCatalog('stone torch').map((entry) => entry.recipeId)).toEqual([
      'furnace'
    ]);
    expect(searchPlayerRecipeCatalog('nearby workbench').map((entry) => entry.recipeId)).toEqual([
      'anvil',
      'furnace',
      'healing-potion'
    ]);
    expect(searchPlayerRecipeCatalog('nearby furnace').map((entry) => entry.recipeId)).toEqual([
      'copper-bar',
      'furnace'
    ]);
    expect(searchPlayerRecipeCatalog('nearby anvil').map((entry) => entry.recipeId)).toEqual([
      'anvil',
      'spear'
    ]);
  });

  it('requires every normalized query token to match the same catalog entry', () => {
    expect(searchPlayerRecipeCatalog('dirt bench').map((entry) => entry.recipeId)).toEqual([
      'workbench'
    ]);
    expect(searchPlayerRecipeCatalog('gel furnace')).toEqual([]);
    expect(searchPlayerRecipeCatalog('gel dirt')).toEqual([]);
  });

  it('treats blank or punctuation-only queries as an unfiltered catalog search', () => {
    expect(searchPlayerRecipeCatalog('   ')).toEqual(getPlayerRecipeCatalogEntries());
    expect(searchPlayerRecipeCatalog('---')).toEqual(getPlayerRecipeCatalogEntries());
  });
});
