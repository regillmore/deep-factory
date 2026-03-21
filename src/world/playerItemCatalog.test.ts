import { describe, expect, it } from 'vitest';

import { getPlayerItemCatalogEntries, searchPlayerItemCatalog } from './playerItemCatalog';

describe('playerItemCatalog', () => {
  it('lists every inventory item once in alphabetical label order', () => {
    expect(getPlayerItemCatalogEntries().map((entry) => entry.label)).toEqual([
      'Acorn',
      'Anvil',
      'Bug Net',
      'Bunny',
      'Copper Bar',
      'Copper Ore',
      'Dirt Block',
      'Furnace',
      'Gel',
      'Healing Potion',
      'Heart Crystal',
      'Rope',
      'Starter Axe',
      'Starter Pickaxe',
      'Starter Spear',
      'Starter Sword',
      'Stone Block',
      'Torch',
      'Umbrella',
      'Workbench'
    ]);
  });

  it('matches label, item-id, and hotbar-label search terms', () => {
    expect(searchPlayerItemCatalog('healing potion').map((entry) => entry.itemId)).toEqual([
      'healing-potion'
    ]);
    expect(searchPlayerItemCatalog('acorn').map((entry) => entry.itemId)).toEqual(['acorn']);
    expect(searchPlayerItemCatalog('bug net').map((entry) => entry.itemId)).toEqual(['bug-net']);
    expect(searchPlayerItemCatalog('starter axe').map((entry) => entry.itemId)).toEqual([
      'axe',
      'pickaxe'
    ]);
    expect(searchPlayerItemCatalog('copper ore').map((entry) => entry.itemId)).toEqual([
      'copper-ore'
    ]);
    expect(searchPlayerItemCatalog('copper bar').map((entry) => entry.itemId)).toEqual([
      'copper-bar'
    ]);
    expect(searchPlayerItemCatalog('potion').map((entry) => entry.itemId)).toEqual([
      'healing-potion'
    ]);
  });

  it('requires every normalized query token to match the same catalog entry', () => {
    expect(searchPlayerItemCatalog('starter sword').map((entry) => entry.itemId)).toEqual([
      'sword'
    ]);
    expect(searchPlayerItemCatalog('starter block')).toEqual([]);
  });

  it('treats blank or punctuation-only queries as an unfiltered catalog search', () => {
    expect(searchPlayerItemCatalog('   ')).toEqual(getPlayerItemCatalogEntries());
    expect(searchPlayerItemCatalog('---')).toEqual(getPlayerItemCatalogEntries());
  });
});
