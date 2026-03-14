export const PLAYER_INVENTORY_HOTBAR_SLOT_COUNT = 10;

export type PlayerInventoryItemId = 'dirt-block' | 'torch' | 'rope';

export interface PlayerInventoryItemDefinition {
  id: PlayerInventoryItemId;
  label: string;
  hotbarLabel: string;
  maxStackSize: number;
}

export interface PlayerInventoryItemStack {
  itemId: PlayerInventoryItemId;
  amount: number;
}

export interface PlayerInventoryState {
  hotbar: Array<PlayerInventoryItemStack | null>;
  selectedHotbarSlotIndex: number;
}

export interface CreatePlayerInventoryStateOptions {
  hotbar?: ReadonlyArray<PlayerInventoryItemStack | null>;
  selectedHotbarSlotIndex?: number;
}

export interface AddPlayerInventoryItemStackResult {
  state: PlayerInventoryState;
  addedAmount: number;
  remainingAmount: number;
}

const PLAYER_INVENTORY_ITEM_DEFINITIONS: Readonly<
  Record<PlayerInventoryItemId, PlayerInventoryItemDefinition>
> = {
  'dirt-block': {
    id: 'dirt-block',
    label: 'Dirt Block',
    hotbarLabel: 'DIRT',
    maxStackSize: 999
  },
  torch: {
    id: 'torch',
    label: 'Torch',
    hotbarLabel: 'TORCH',
    maxStackSize: 999
  },
  rope: {
    id: 'rope',
    label: 'Rope',
    hotbarLabel: 'ROPE',
    maxStackSize: 999
  }
};

const DEFAULT_STARTER_HOTBAR_STACKS: readonly PlayerInventoryItemStack[] = [
  { itemId: 'dirt-block', amount: 64 },
  { itemId: 'torch', amount: 20 },
  { itemId: 'rope', amount: 24 }
];

const createEmptyHotbar = (): Array<PlayerInventoryItemStack | null> =>
  Array.from({ length: PLAYER_INVENTORY_HOTBAR_SLOT_COUNT }, () => null);

const validateHotbarSlotIndex = (slotIndex: number, label: string): void => {
  if (
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >= PLAYER_INVENTORY_HOTBAR_SLOT_COUNT
  ) {
    throw new Error(
      `${label} must be an integer between 0 and ${PLAYER_INVENTORY_HOTBAR_SLOT_COUNT - 1}`
    );
  }
};

const validatePlayerInventoryItemAmount = (
  itemId: PlayerInventoryItemId,
  amount: number,
  label: string
): void => {
  const maxStackSize = getPlayerInventoryItemDefinition(itemId).maxStackSize;
  if (!Number.isInteger(amount) || amount <= 0 || amount > maxStackSize) {
    throw new Error(`${label} must be an integer between 1 and ${maxStackSize}`);
  }
};

const clonePlayerInventoryItemStack = (
  stack: PlayerInventoryItemStack | null
): PlayerInventoryItemStack | null =>
  stack === null
    ? null
    : {
        itemId: stack.itemId,
        amount: stack.amount
      };

export const isPlayerInventoryItemId = (value: unknown): value is PlayerInventoryItemId =>
  typeof value === 'string' && value in PLAYER_INVENTORY_ITEM_DEFINITIONS;

export const getPlayerInventoryItemDefinition = (
  itemId: PlayerInventoryItemId
): PlayerInventoryItemDefinition => PLAYER_INVENTORY_ITEM_DEFINITIONS[itemId];

export const createPlayerInventoryItemStack = (
  itemId: PlayerInventoryItemId,
  amount: number
): PlayerInventoryItemStack => {
  validatePlayerInventoryItemAmount(itemId, amount, 'amount');
  return {
    itemId,
    amount
  };
};

export const clonePlayerInventoryState = (state: PlayerInventoryState): PlayerInventoryState => ({
  hotbar: state.hotbar.map((stack) => clonePlayerInventoryItemStack(stack)),
  selectedHotbarSlotIndex: state.selectedHotbarSlotIndex
});

export const createPlayerInventoryState = (
  options: CreatePlayerInventoryStateOptions = {}
): PlayerInventoryState => {
  const hotbar = options.hotbar ?? createEmptyHotbar();
  if (hotbar.length !== PLAYER_INVENTORY_HOTBAR_SLOT_COUNT) {
    throw new Error(`hotbar must contain exactly ${PLAYER_INVENTORY_HOTBAR_SLOT_COUNT} slots`);
  }

  const selectedHotbarSlotIndex = options.selectedHotbarSlotIndex ?? 0;
  validateHotbarSlotIndex(selectedHotbarSlotIndex, 'selectedHotbarSlotIndex');

  return {
    hotbar: hotbar.map((stack, slotIndex) => {
      if (stack === null) {
        return null;
      }
      if (!isPlayerInventoryItemId(stack.itemId)) {
        throw new Error(`hotbar[${slotIndex}].itemId must be a known player inventory item id`);
      }

      validatePlayerInventoryItemAmount(
        stack.itemId,
        stack.amount,
        `hotbar[${slotIndex}].amount`
      );
      return clonePlayerInventoryItemStack(stack);
    }),
    selectedHotbarSlotIndex
  };
};

export const createEmptyPlayerInventoryState = (): PlayerInventoryState =>
  createPlayerInventoryState();

export const createDefaultPlayerInventoryState = (): PlayerInventoryState => {
  let inventoryState = createEmptyPlayerInventoryState();
  for (const stack of DEFAULT_STARTER_HOTBAR_STACKS) {
    const addResult = addPlayerInventoryItemStack(inventoryState, stack.itemId, stack.amount);
    inventoryState = addResult.state;
  }
  return inventoryState;
};

export const setPlayerInventorySelectedHotbarSlot = (
  state: PlayerInventoryState,
  slotIndex: number
): PlayerInventoryState => {
  validateHotbarSlotIndex(slotIndex, 'slotIndex');
  return createPlayerInventoryState({
    hotbar: state.hotbar,
    selectedHotbarSlotIndex: slotIndex
  });
};

export const setPlayerInventoryHotbarSlot = (
  state: PlayerInventoryState,
  slotIndex: number,
  stack: PlayerInventoryItemStack | null
): PlayerInventoryState => {
  validateHotbarSlotIndex(slotIndex, 'slotIndex');
  const nextHotbar = state.hotbar.map((entry) => clonePlayerInventoryItemStack(entry));
  nextHotbar[slotIndex] = stack === null ? null : clonePlayerInventoryItemStack(stack);
  return createPlayerInventoryState({
    hotbar: nextHotbar,
    selectedHotbarSlotIndex: state.selectedHotbarSlotIndex
  });
};

export const addPlayerInventoryItemStack = (
  state: PlayerInventoryState,
  itemId: PlayerInventoryItemId,
  amount: number
): AddPlayerInventoryItemStackResult => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer');
  }

  const maxStackSize = getPlayerInventoryItemDefinition(itemId).maxStackSize;
  const nextState = clonePlayerInventoryState(state);
  let remainingAmount = amount;

  for (const slot of nextState.hotbar) {
    if (slot === null || slot.itemId !== itemId || slot.amount >= maxStackSize) {
      continue;
    }

    const capacity = maxStackSize - slot.amount;
    const addedAmount = Math.min(capacity, remainingAmount);
    slot.amount += addedAmount;
    remainingAmount -= addedAmount;
    if (remainingAmount === 0) {
      break;
    }
  }

  if (remainingAmount > 0) {
    for (let slotIndex = 0; slotIndex < nextState.hotbar.length; slotIndex += 1) {
      if (nextState.hotbar[slotIndex] !== null) {
        continue;
      }

      const slotAmount = Math.min(maxStackSize, remainingAmount);
      nextState.hotbar[slotIndex] = createPlayerInventoryItemStack(itemId, slotAmount);
      remainingAmount -= slotAmount;
      if (remainingAmount === 0) {
        break;
      }
    }
  }

  return {
    state: nextState,
    addedAmount: amount - remainingAmount,
    remainingAmount
  };
};
