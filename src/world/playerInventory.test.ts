import { describe, expect, it } from 'vitest';

import {
  addPlayerInventoryItemStack,
  clonePlayerInventoryState,
  consumePlayerInventoryHotbarSlotItem,
  createDefaultPlayerInventoryState,
  createEmptyPlayerInventoryState,
  createPlayerInventoryItemStack,
  createPlayerInventoryState,
  ensurePlayerInventoryHasStarterHeartCrystal,
  ensurePlayerInventoryHasStarterHealingPotions,
  ensurePlayerInventoryHasStarterPickaxe,
  ensurePlayerInventoryHasStarterSpear,
  ensurePlayerInventoryHasStarterSword,
  getPlayerInventoryItemDefinition,
  getPlayerInventoryItemAmount,
  movePlayerInventorySelectedHotbarSlot,
  removePlayerInventoryItemAmount,
  setPlayerInventoryHotbarSlot,
  setPlayerInventorySelectedHotbarSlot,
  swapPlayerInventoryHotbarSlots,
  PLAYER_INVENTORY_HOTBAR_SLOT_COUNT
} from './playerInventory';

describe('playerInventory', () => {
  it('creates an empty hotbar inventory with ten slots and the first slot selected', () => {
    expect(createEmptyPlayerInventoryState()).toEqual({
      hotbar: Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT }, () => null),
      selectedHotbarSlotIndex: 0
    });
  });

  it('creates the default starter hotbar loadout', () => {
    expect(createDefaultPlayerInventoryState()).toEqual({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        null,
        null,
        { itemId: 'spear', amount: 1 }
      ],
      selectedHotbarSlotIndex: 0
    });
  });

  it('clones nested hotbar stacks when the inventory is copied', () => {
    const state = createDefaultPlayerInventoryState();
    const clone = clonePlayerInventoryState(state);

    state.hotbar[0]!.amount = 999;

    expect(clone.hotbar[0]).toEqual({ itemId: 'pickaxe', amount: 1 });
  });

  it('adds stacks by filling matching slots before empty slots', () => {
    const partiallyFilled = createPlayerInventoryState({
      hotbar: [
        { itemId: 'torch', amount: 998 },
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]
    });

    const result = addPlayerInventoryItemStack(partiallyFilled, 'torch', 3);

    expect(result).toEqual({
      state: {
        hotbar: [
          { itemId: 'torch', amount: 999 },
          { itemId: 'torch', amount: 2 },
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null
        ],
        selectedHotbarSlotIndex: 0
      },
      addedAmount: 3,
      remainingAmount: 0
    });
  });

  it('reports overflow when the hotbar cannot hold an entire stack', () => {
    const full = createPlayerInventoryState({
      hotbar: Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT }, () => ({
        itemId: 'rope' as const,
        amount: 999
      }))
    });

    const result = addPlayerInventoryItemStack(full, 'rope', 5);

    expect(result.addedAmount).toBe(0);
    expect(result.remainingAmount).toBe(5);
    expect(result.state).toEqual(full);
    expect(result.state).not.toBe(full);
  });

  it('counts matching items across the hotbar', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'gel', amount: 4 },
        { itemId: 'workbench', amount: 2 },
        { itemId: 'gel', amount: 7 },
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 3 }, () => null)
      ]
    });

    expect(getPlayerInventoryItemAmount(state, 'gel')).toBe(11);
    expect(getPlayerInventoryItemAmount(state, 'workbench')).toBe(2);
    expect(getPlayerInventoryItemAmount(state, 'torch')).toBe(0);
  });

  it('removes matching items from earlier hotbar slots before later ones', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'gel', amount: 4 },
        { itemId: 'workbench', amount: 2 },
        { itemId: 'gel', amount: 7 },
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 3 }, () => null)
      ],
      selectedHotbarSlotIndex: 2
    });

    const result = removePlayerInventoryItemAmount(state, 'gel', 6);

    expect(result).toEqual({
      state: {
        hotbar: [
          null,
          { itemId: 'workbench', amount: 2 },
          { itemId: 'gel', amount: 5 },
          null,
          null,
          null,
          null,
          null,
          null,
          null
        ],
        selectedHotbarSlotIndex: 2
      },
      removedAmount: 6,
      remainingAmount: 0
    });
    expect(state.hotbar[0]).toEqual({ itemId: 'gel', amount: 4 });
  });

  it('reports a remaining amount when removal exhausts all matching stacks', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'workbench', amount: 2 },
        null,
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 2 }, () => null)
      ]
    });

    const result = removePlayerInventoryItemAmount(state, 'workbench', 5);

    expect(result).toEqual({
      state: createPlayerInventoryState(),
      removedAmount: 2,
      remainingAmount: 3
    });
  });

  it('updates the selected hotbar slot without mutating the source state', () => {
    const state = createDefaultPlayerInventoryState();

    const nextState = setPlayerInventorySelectedHotbarSlot(state, 4);

    expect(nextState.selectedHotbarSlotIndex).toBe(4);
    expect(state.selectedHotbarSlotIndex).toBe(0);
  });

  it('replaces one hotbar slot with a detached stack clone', () => {
    const state = createEmptyPlayerInventoryState();
    const stack = createPlayerInventoryItemStack('torch', 8);

    const nextState = setPlayerInventoryHotbarSlot(state, 2, stack);
    stack.amount = 1;

    expect(nextState.hotbar[2]).toEqual({ itemId: 'torch', amount: 8 });
    expect(state.hotbar[2]).toBeNull();
  });

  it('swaps two hotbar slots and keeps the selection attached to the moved slot', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 3 }, () => null)
      ],
      selectedHotbarSlotIndex: 0
    });

    const nextState = swapPlayerInventoryHotbarSlots(state, 0, 1);

    expect(nextState).toEqual({
      hotbar: [
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'torch', amount: 20 },
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 1
    });
    expect(state.selectedHotbarSlotIndex).toBe(0);
    expect(state.hotbar[0]).toEqual({ itemId: 'pickaxe', amount: 1 });
  });

  it('moves the selected hotbar slot one step within bounds and leaves edge moves unchanged', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 4 }, () => null)
      ],
      selectedHotbarSlotIndex: 1
    });

    const movedLeft = movePlayerInventorySelectedHotbarSlot(state, -1);
    const movedRight = movePlayerInventorySelectedHotbarSlot(state, 1);
    const blockedAtLeft = movePlayerInventorySelectedHotbarSlot(
      createPlayerInventoryState({
        hotbar: state.hotbar,
        selectedHotbarSlotIndex: 0
      }),
      -1
    );

    expect(movedLeft).toEqual({
      hotbar: [
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 0
    });
    expect(movedRight).toEqual({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'rope', amount: 24 },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 2
    });
    expect(blockedAtLeft).toEqual({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 0
    });
    expect(blockedAtLeft).not.toBe(state);
  });

  it('consumes one item from a populated hotbar slot and clears depleted stacks', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'dirt-block', amount: 2 },
        { itemId: 'torch', amount: 1 },
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 2 }, () => null)
      ]
    });

    const firstConsume = consumePlayerInventoryHotbarSlotItem(state, 0);
    const secondConsume = consumePlayerInventoryHotbarSlotItem(firstConsume.state, 1);

    expect(firstConsume).toEqual({
      state: {
        hotbar: [
          { itemId: 'dirt-block', amount: 1 },
          { itemId: 'torch', amount: 1 },
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null
        ],
        selectedHotbarSlotIndex: 0
      },
      consumed: true
    });
    expect(secondConsume).toEqual({
      state: {
        hotbar: [
          { itemId: 'dirt-block', amount: 1 },
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null
        ],
        selectedHotbarSlotIndex: 0
      },
      consumed: true
    });
  });

  it('returns an unchanged clone when consuming from an empty hotbar slot', () => {
    const state = createEmptyPlayerInventoryState();

    const result = consumePlayerInventoryHotbarSlotItem(state, 4);

    expect(result).toEqual({
      state,
      consumed: false
    });
    expect(result.state).not.toBe(state);
  });

  it('exposes per-item labels for hotbar presentation', () => {
    expect(getPlayerInventoryItemDefinition('dirt-block')).toEqual({
      id: 'dirt-block',
      label: 'Dirt Block',
      hotbarLabel: 'DIRT',
      maxStackSize: 999
    });
    expect(getPlayerInventoryItemDefinition('stone-block')).toEqual({
      id: 'stone-block',
      label: 'Stone Block',
      hotbarLabel: 'STONE',
      maxStackSize: 999
    });
    expect(getPlayerInventoryItemDefinition('gel')).toEqual({
      id: 'gel',
      label: 'Gel',
      hotbarLabel: 'GEL',
      maxStackSize: 999
    });
    expect(getPlayerInventoryItemDefinition('workbench')).toEqual({
      id: 'workbench',
      label: 'Workbench',
      hotbarLabel: 'BENCH',
      maxStackSize: 99
    });
    expect(getPlayerInventoryItemDefinition('pickaxe')).toEqual({
      id: 'pickaxe',
      label: 'Starter Pickaxe',
      hotbarLabel: 'PICK',
      maxStackSize: 1
    });
    expect(getPlayerInventoryItemDefinition('healing-potion')).toEqual({
      id: 'healing-potion',
      label: 'Healing Potion',
      hotbarLabel: 'POTION',
      maxStackSize: 30
    });
    expect(getPlayerInventoryItemDefinition('heart-crystal')).toEqual({
      id: 'heart-crystal',
      label: 'Heart Crystal',
      hotbarLabel: 'HEART',
      maxStackSize: 1
    });
    expect(getPlayerInventoryItemDefinition('sword')).toEqual({
      id: 'sword',
      label: 'Starter Sword',
      hotbarLabel: 'SWORD',
      maxStackSize: 1
    });
    expect(getPlayerInventoryItemDefinition('spear')).toEqual({
      id: 'spear',
      label: 'Starter Spear',
      hotbarLabel: 'SPEAR',
      maxStackSize: 1
    });
  });

  it('fills the first empty slot with a starter pickaxe when one is missing', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        null,
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 3 }, () => null)
      ],
      selectedHotbarSlotIndex: 1
    });

    expect(ensurePlayerInventoryHasStarterPickaxe(state)).toEqual({
      hotbar: [
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'pickaxe', amount: 1 },
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 1
    });
  });

  it('leaves inventories unchanged when they already contain a pickaxe or have no empty slot', () => {
    const alreadyHasPickaxe = createDefaultPlayerInventoryState();
    const fullWithoutPickaxe = createPlayerInventoryState({
      hotbar: Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT }, (_, index) => ({
        itemId: index % 2 === 0 ? ('dirt-block' as const) : ('torch' as const),
        amount: 1
      }))
    });

    expect(ensurePlayerInventoryHasStarterPickaxe(alreadyHasPickaxe)).toEqual(alreadyHasPickaxe);
    expect(ensurePlayerInventoryHasStarterPickaxe(fullWithoutPickaxe)).toEqual(fullWithoutPickaxe);
  });

  it('fills the first empty slot with starter healing potions when they are missing', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        null,
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 5 }, () => null)
      ],
      selectedHotbarSlotIndex: 3
    });

    expect(ensurePlayerInventoryHasStarterHealingPotions(state)).toEqual({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        null,
        null,
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 3
    });
  });

  it('fills the first empty slot with a starter heart crystal when it is missing', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        null,
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 6 }, () => null)
      ],
      selectedHotbarSlotIndex: 4
    });

    expect(ensurePlayerInventoryHasStarterHeartCrystal(state)).toEqual({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        null,
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 4
    });
  });

  it('fills the first empty slot with a starter sword when it is missing', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        null,
        ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 7 }, () => null)
      ],
      selectedHotbarSlotIndex: 5
    });

    expect(ensurePlayerInventoryHasStarterSword(state)).toEqual({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 5
    });
  });

  it('fills the last empty slot with a starter spear when it is missing', () => {
    const state = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        null,
        { itemId: 'gel', amount: 2 },
        null
      ],
      selectedHotbarSlotIndex: 8
    });

    expect(ensurePlayerInventoryHasStarterSpear(state)).toEqual({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        null,
        { itemId: 'gel', amount: 2 },
        { itemId: 'spear', amount: 1 }
      ],
      selectedHotbarSlotIndex: 8
    });
  });

  it('rejects invalid hotbar lengths, slot indices, and stack amounts', () => {
    expect(() =>
      createPlayerInventoryState({
        hotbar: []
      })
    ).toThrowError(/hotbar must contain exactly 10 slots/);

    expect(() => setPlayerInventorySelectedHotbarSlot(createEmptyPlayerInventoryState(), 10)).toThrowError(
      /slotIndex must be an integer between 0 and 9/
    );

    expect(() =>
      createPlayerInventoryState({
        hotbar: [
          { itemId: 'torch', amount: 1000 },
          ...Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 1 }, () => null)
        ]
      })
    ).toThrowError(/hotbar\[0\]\.amount must be an integer between 1 and 999/);
    expect(() =>
      swapPlayerInventoryHotbarSlots(createEmptyPlayerInventoryState(), 0, 10)
    ).toThrowError(/targetSlotIndex must be an integer between 0 and 9/);
    expect(() =>
      movePlayerInventorySelectedHotbarSlot(createEmptyPlayerInventoryState(), 0 as -1 | 1)
    ).toThrowError(/direction must be -1 or 1/);
  });
});
