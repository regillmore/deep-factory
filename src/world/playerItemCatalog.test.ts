import { describe, expect, it } from 'vitest';

import { getPlayerItemCatalogEntries, searchPlayerItemCatalog } from './playerItemCatalog';

describe('playerItemCatalog', () => {
  it('lists every inventory item once in alphabetical label order', () => {
    expect(getPlayerItemCatalogEntries().map((entry) => entry.label)).toEqual([
      'Acorn',
      'Anvil',
      'Arrow',
      'Bomb',
      'Bow',
      'Bug Net',
      'Bunny',
      'Copper Bar',
      'Copper Ore',
      'Dirt Block',
      'Dirt Wall',
      'Furnace',
      'Gel',
      'Grappling Hook',
      'Healing Potion',
      'Heart Crystal',
      'Mana Crystal',
      'Platform',
      'Rope',
      'Starter Axe',
      'Starter Pickaxe',
      'Starter Spear',
      'Starter Sword',
      'Starter Wand',
      'Stone Block',
      'Torch',
      'Umbrella',
      'Wood',
      'Wood Block',
      'Wood Wall',
      'Workbench'
    ]);
  });

  it('matches label, item-id, and hotbar-label search terms', () => {
    expect(searchPlayerItemCatalog('healing potion').map((entry) => entry.itemId)).toEqual([
      'healing-potion'
    ]);
    expect(searchPlayerItemCatalog('acorn').map((entry) => entry.itemId)).toEqual(['acorn']);
    expect(searchPlayerItemCatalog('bow').map((entry) => entry.itemId)).toEqual(['bow']);
    expect(searchPlayerItemCatalog('arrow').map((entry) => entry.itemId)).toEqual(['arrow']);
    expect(searchPlayerItemCatalog('bomb').map((entry) => entry.itemId)).toEqual(['bomb']);
    expect(searchPlayerItemCatalog('grappling hook').map((entry) => entry.itemId)).toEqual([
      'grappling-hook'
    ]);
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
    expect(searchPlayerItemCatalog('wood block').map((entry) => entry.itemId)).toEqual([
      'wood-block'
    ]);
    expect(searchPlayerItemCatalog('wood wall').map((entry) => entry.itemId)).toEqual([
      'wood-wall'
    ]);
    expect(searchPlayerItemCatalog('dirt wall').map((entry) => entry.itemId)).toEqual([
      'dirt-wall'
    ]);
    expect(searchPlayerItemCatalog('plat').map((entry) => entry.itemId)).toEqual([
      'platform'
    ]);
    expect(searchPlayerItemCatalog('potion').map((entry) => entry.itemId)).toEqual([
      'healing-potion'
    ]);
    expect(searchPlayerItemCatalog('mana crystal').map((entry) => entry.itemId)).toEqual([
      'mana-crystal'
    ]);
    expect(searchPlayerItemCatalog('starter wand').map((entry) => entry.itemId)).toEqual([
      'wand'
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
