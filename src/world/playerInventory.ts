export const PLAYER_INVENTORY_HOTBAR_SLOT_COUNT = 10;

export type PlayerInventoryItemId =
  | 'axe'
  | 'acorn'
  | 'pickaxe'
  | 'dirt-block'
  | 'dirt-wall'
  | 'stone-block'
  | 'wood-block'
  | 'wood-wall'
  | 'copper-ore'
  | 'copper-bar'
  | 'gel'
  | 'wood'
  | 'workbench'
  | 'furnace'
  | 'anvil'
  | 'torch'
  | 'rope'
  | 'platform'
  | 'umbrella'
  | 'bug-net'
  | 'bunny'
  | 'healing-potion'
  | 'heart-crystal'
  | 'sword'
  | 'spear'
  | 'wand';

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

export interface ConsumePlayerInventoryHotbarSlotItemResult {
  state: PlayerInventoryState;
  consumed: boolean;
}

export interface RemovePlayerInventoryItemAmountResult {
  state: PlayerInventoryState;
  removedAmount: number;
  remainingAmount: number;
}

export type MovePlayerInventorySelectedHotbarSlotDirection = -1 | 1;

export const PLAYER_INVENTORY_ITEM_IDS: readonly PlayerInventoryItemId[] = [
  'axe',
  'acorn',
  'pickaxe',
  'dirt-block',
  'dirt-wall',
  'stone-block',
  'wood-block',
  'wood-wall',
  'copper-ore',
  'copper-bar',
  'gel',
  'wood',
  'workbench',
  'furnace',
  'anvil',
  'torch',
  'rope',
  'platform',
  'umbrella',
  'bug-net',
  'bunny',
  'healing-potion',
  'heart-crystal',
  'sword',
  'spear',
  'wand'
] as const;

const PLAYER_INVENTORY_ITEM_DEFINITIONS: Readonly<
  Record<PlayerInventoryItemId, PlayerInventoryItemDefinition>
> = {
  axe: {
    id: 'axe',
    label: 'Starter Axe',
    hotbarLabel: 'AXE',
    maxStackSize: 1
  },
  acorn: {
    id: 'acorn',
    label: 'Acorn',
    hotbarLabel: 'ACORN',
    maxStackSize: 999
  },
  pickaxe: {
    id: 'pickaxe',
    label: 'Starter Pickaxe',
    hotbarLabel: 'PICK',
    maxStackSize: 1
  },
  'dirt-block': {
    id: 'dirt-block',
    label: 'Dirt Block',
    hotbarLabel: 'DIRT',
    maxStackSize: 999
  },
  'dirt-wall': {
    id: 'dirt-wall',
    label: 'Dirt Wall',
    hotbarLabel: 'DWALL',
    maxStackSize: 999
  },
  'stone-block': {
    id: 'stone-block',
    label: 'Stone Block',
    hotbarLabel: 'STONE',
    maxStackSize: 999
  },
  'wood-block': {
    id: 'wood-block',
    label: 'Wood Block',
    hotbarLabel: 'WBLK',
    maxStackSize: 999
  },
  'wood-wall': {
    id: 'wood-wall',
    label: 'Wood Wall',
    hotbarLabel: 'WWALL',
    maxStackSize: 999
  },
  'copper-ore': {
    id: 'copper-ore',
    label: 'Copper Ore',
    hotbarLabel: 'COPPER',
    maxStackSize: 999
  },
  'copper-bar': {
    id: 'copper-bar',
    label: 'Copper Bar',
    hotbarLabel: 'CBAR',
    maxStackSize: 999
  },
  gel: {
    id: 'gel',
    label: 'Gel',
    hotbarLabel: 'GEL',
    maxStackSize: 999
  },
  wood: {
    id: 'wood',
    label: 'Wood',
    hotbarLabel: 'WOOD',
    maxStackSize: 999
  },
  workbench: {
    id: 'workbench',
    label: 'Workbench',
    hotbarLabel: 'BENCH',
    maxStackSize: 99
  },
  furnace: {
    id: 'furnace',
    label: 'Furnace',
    hotbarLabel: 'FURN',
    maxStackSize: 99
  },
  anvil: {
    id: 'anvil',
    label: 'Anvil',
    hotbarLabel: 'ANVIL',
    maxStackSize: 99
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
  },
  platform: {
    id: 'platform',
    label: 'Platform',
    hotbarLabel: 'PLAT',
    maxStackSize: 999
  },
  umbrella: {
    id: 'umbrella',
    label: 'Umbrella',
    hotbarLabel: 'UMBR',
    maxStackSize: 1
  },
  'bug-net': {
    id: 'bug-net',
    label: 'Bug Net',
    hotbarLabel: 'NET',
    maxStackSize: 1
  },
  bunny: {
    id: 'bunny',
    label: 'Bunny',
    hotbarLabel: 'BUNNY',
    maxStackSize: 999
  },
  'healing-potion': {
    id: 'healing-potion',
    label: 'Healing Potion',
    hotbarLabel: 'POTION',
    maxStackSize: 30
  },
  'heart-crystal': {
    id: 'heart-crystal',
    label: 'Heart Crystal',
    hotbarLabel: 'HEART',
    maxStackSize: 1
  },
  sword: {
    id: 'sword',
    label: 'Starter Sword',
    hotbarLabel: 'SWORD',
    maxStackSize: 1
  },
  spear: {
    id: 'spear',
    label: 'Starter Spear',
    hotbarLabel: 'SPEAR',
    maxStackSize: 1
  },
  wand: {
    id: 'wand',
    label: 'Starter Wand',
    hotbarLabel: 'WAND',
    maxStackSize: 1
  }
};

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

export const getPlayerInventoryItemDefinitions = (): readonly PlayerInventoryItemDefinition[] =>
  PLAYER_INVENTORY_ITEM_IDS.map((itemId) => PLAYER_INVENTORY_ITEM_DEFINITIONS[itemId]);

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

export const createDefaultPlayerInventoryState = (): PlayerInventoryState =>
  createEmptyPlayerInventoryState();

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

export const swapPlayerInventoryHotbarSlots = (
  state: PlayerInventoryState,
  sourceSlotIndex: number,
  targetSlotIndex: number
): PlayerInventoryState => {
  validateHotbarSlotIndex(sourceSlotIndex, 'sourceSlotIndex');
  validateHotbarSlotIndex(targetSlotIndex, 'targetSlotIndex');
  if (sourceSlotIndex === targetSlotIndex) {
    return clonePlayerInventoryState(state);
  }

  const nextHotbar = state.hotbar.map((entry) => clonePlayerInventoryItemStack(entry));
  const sourceStack = nextHotbar[sourceSlotIndex] ?? null;
  nextHotbar[sourceSlotIndex] = nextHotbar[targetSlotIndex] ?? null;
  nextHotbar[targetSlotIndex] = sourceStack;

  let selectedHotbarSlotIndex = state.selectedHotbarSlotIndex;
  if (selectedHotbarSlotIndex === sourceSlotIndex) {
    selectedHotbarSlotIndex = targetSlotIndex;
  } else if (selectedHotbarSlotIndex === targetSlotIndex) {
    selectedHotbarSlotIndex = sourceSlotIndex;
  }

  return createPlayerInventoryState({
    hotbar: nextHotbar,
    selectedHotbarSlotIndex
  });
};

export const movePlayerInventorySelectedHotbarSlot = (
  state: PlayerInventoryState,
  direction: MovePlayerInventorySelectedHotbarSlotDirection
): PlayerInventoryState => {
  if (direction !== -1 && direction !== 1) {
    throw new Error('direction must be -1 or 1');
  }

  const targetSlotIndex = state.selectedHotbarSlotIndex + direction;
  if (targetSlotIndex < 0 || targetSlotIndex >= PLAYER_INVENTORY_HOTBAR_SLOT_COUNT) {
    return clonePlayerInventoryState(state);
  }

  return swapPlayerInventoryHotbarSlots(
    state,
    state.selectedHotbarSlotIndex,
    targetSlotIndex
  );
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

export const getPlayerInventoryItemAmount = (
  state: PlayerInventoryState,
  itemId: PlayerInventoryItemId
): number =>
  state.hotbar.reduce((total, stack) => total + (stack?.itemId === itemId ? stack.amount : 0), 0);

export const removePlayerInventoryItemAmount = (
  state: PlayerInventoryState,
  itemId: PlayerInventoryItemId,
  amount: number
): RemovePlayerInventoryItemAmountResult => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer');
  }

  const nextState = clonePlayerInventoryState(state);
  let remainingAmount = amount;

  for (let slotIndex = 0; slotIndex < nextState.hotbar.length; slotIndex += 1) {
    const stack = nextState.hotbar[slotIndex];
    if (stack === null || stack.itemId !== itemId) {
      continue;
    }

    const removedAmount = Math.min(stack.amount, remainingAmount);
    const nextAmount = stack.amount - removedAmount;
    nextState.hotbar[slotIndex] =
      nextAmount > 0
        ? {
            itemId: stack.itemId,
            amount: nextAmount
          }
        : null;
    remainingAmount -= removedAmount;
    if (remainingAmount === 0) {
      break;
    }
  }

  return {
    state: nextState,
    removedAmount: amount - remainingAmount,
    remainingAmount
  };
};

export const consumePlayerInventoryHotbarSlotItem = (
  state: PlayerInventoryState,
  slotIndex: number
): ConsumePlayerInventoryHotbarSlotItemResult => {
  validateHotbarSlotIndex(slotIndex, 'slotIndex');
  const stack = state.hotbar[slotIndex] ?? null;
  if (stack === null) {
    return {
      state: clonePlayerInventoryState(state),
      consumed: false
    };
  }

  const nextAmount = stack.amount - 1;
  return {
    state:
      nextAmount > 0
        ? setPlayerInventoryHotbarSlot(state, slotIndex, {
            itemId: stack.itemId,
            amount: nextAmount
          })
        : setPlayerInventoryHotbarSlot(state, slotIndex, null),
    consumed: true
  };
};
