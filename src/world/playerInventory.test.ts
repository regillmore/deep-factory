import { describe, expect, it } from 'vitest';

import {
  addPlayerInventoryItemStack,
  clonePlayerInventoryState,
  createDefaultPlayerInventoryState,
  createEmptyPlayerInventoryState,
  createPlayerInventoryItemStack,
  createPlayerInventoryState,
  getPlayerInventoryItemDefinition,
  setPlayerInventoryHotbarSlot,
  setPlayerInventorySelectedHotbarSlot,
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
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      selectedHotbarSlotIndex: 0
    });
  });

  it('clones nested hotbar stacks when the inventory is copied', () => {
    const state = createDefaultPlayerInventoryState();
    const clone = clonePlayerInventoryState(state);

    state.hotbar[0]!.amount = 999;

    expect(clone.hotbar[0]).toEqual({ itemId: 'dirt-block', amount: 64 });
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

  it('exposes per-item labels for hotbar presentation', () => {
    expect(getPlayerInventoryItemDefinition('dirt-block')).toEqual({
      id: 'dirt-block',
      label: 'Dirt Block',
      hotbarLabel: 'DIRT',
      maxStackSize: 999
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
  });
});
