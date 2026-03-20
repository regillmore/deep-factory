import { describe, expect, it } from 'vitest';

import { getPlayerRecipeCatalogEntries, searchPlayerRecipeCatalog } from './playerRecipeCatalog';

describe('playerRecipeCatalog', () => {
  it('lists every recipe once in alphabetical label order with shared display labels', () => {
    expect(getPlayerRecipeCatalogEntries()).toEqual([
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
    expect(searchPlayerRecipeCatalog('gel').map((entry) => entry.recipeId)).toEqual([
      'healing-potion'
    ]);
    expect(searchPlayerRecipeCatalog('nearby workbench').map((entry) => entry.recipeId)).toEqual([
      'healing-potion'
    ]);
  });

  it('requires every normalized query token to match the same catalog entry', () => {
    expect(searchPlayerRecipeCatalog('dirt bench').map((entry) => entry.recipeId)).toEqual([
      'workbench'
    ]);
    expect(searchPlayerRecipeCatalog('gel dirt')).toEqual([]);
  });

  it('treats blank or punctuation-only queries as an unfiltered catalog search', () => {
    expect(searchPlayerRecipeCatalog('   ')).toEqual(getPlayerRecipeCatalogEntries());
    expect(searchPlayerRecipeCatalog('---')).toEqual(getPlayerRecipeCatalogEntries());
  });
});
