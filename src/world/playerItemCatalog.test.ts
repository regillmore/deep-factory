import { describe, expect, it } from 'vitest';

import { getPlayerItemCatalogEntries, searchPlayerItemCatalog } from './playerItemCatalog';

describe('playerItemCatalog', () => {
  it('lists every inventory item once in alphabetical label order', () => {
    expect(getPlayerItemCatalogEntries().map((entry) => entry.label)).toEqual([
      'Bug Net',
      'Bunny',
      'Dirt Block',
      'Gel',
      'Healing Potion',
      'Heart Crystal',
      'Rope',
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
    expect(searchPlayerItemCatalog('bug net').map((entry) => entry.itemId)).toEqual(['bug-net']);
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
