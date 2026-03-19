export const PLAYER_EQUIPMENT_SLOT_IDS = ['head', 'body', 'legs'] as const;

export type PlayerEquipmentSlotId = (typeof PLAYER_EQUIPMENT_SLOT_IDS)[number];

export type PlayerArmorItemId =
  | 'starter-helmet'
  | 'starter-breastplate'
  | 'starter-greaves';

export interface PlayerArmorItemDefinition {
  id: PlayerArmorItemId;
  slotId: PlayerEquipmentSlotId;
  label: string;
  defense: number;
}

export interface PlayerEquipmentState {
  head: PlayerArmorItemId | null;
  body: PlayerArmorItemId | null;
  legs: PlayerArmorItemId | null;
}

export interface CreatePlayerEquipmentStateOptions {
  head?: PlayerArmorItemId | null;
  body?: PlayerArmorItemId | null;
  legs?: PlayerArmorItemId | null;
}

const PLAYER_EQUIPMENT_SLOT_LABELS: Readonly<Record<PlayerEquipmentSlotId, string>> = {
  head: 'Head',
  body: 'Body',
  legs: 'Legs'
};

const PLAYER_ARMOR_ITEM_DEFINITIONS: Readonly<
  Record<PlayerArmorItemId, PlayerArmorItemDefinition>
> = {
  'starter-helmet': {
    id: 'starter-helmet',
    slotId: 'head',
    label: 'Starter Helmet',
    defense: 1
  },
  'starter-breastplate': {
    id: 'starter-breastplate',
    slotId: 'body',
    label: 'Starter Breastplate',
    defense: 2
  },
  'starter-greaves': {
    id: 'starter-greaves',
    slotId: 'legs',
    label: 'Starter Greaves',
    defense: 1
  }
};

const STARTER_ARMOR_ITEM_IDS_BY_SLOT: Readonly<Record<PlayerEquipmentSlotId, PlayerArmorItemId>> = {
  head: 'starter-helmet',
  body: 'starter-breastplate',
  legs: 'starter-greaves'
};

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const cloneEquippedArmorItemId = (itemId: PlayerArmorItemId | null): PlayerArmorItemId | null =>
  itemId;

const validateSlotItemId = (
  slotId: PlayerEquipmentSlotId,
  itemId: PlayerArmorItemId | null,
  label: string
): void => {
  if (itemId === null) {
    return;
  }

  const definition = getPlayerArmorItemDefinition(itemId);
  if (definition.slotId !== slotId) {
    throw new Error(`${label} must target the ${slotId} slot`);
  }
};

export const isPlayerEquipmentSlotId = (value: unknown): value is PlayerEquipmentSlotId =>
  typeof value === 'string' && value in PLAYER_EQUIPMENT_SLOT_LABELS;

export const isPlayerArmorItemId = (value: unknown): value is PlayerArmorItemId =>
  typeof value === 'string' && value in PLAYER_ARMOR_ITEM_DEFINITIONS;

export const getPlayerEquipmentSlotLabel = (slotId: PlayerEquipmentSlotId): string =>
  PLAYER_EQUIPMENT_SLOT_LABELS[slotId];

export const getPlayerArmorItemDefinition = (
  itemId: PlayerArmorItemId
): PlayerArmorItemDefinition => PLAYER_ARMOR_ITEM_DEFINITIONS[itemId];

export const getStarterArmorItemIdForSlot = (
  slotId: PlayerEquipmentSlotId
): PlayerArmorItemId => STARTER_ARMOR_ITEM_IDS_BY_SLOT[slotId];

export const createPlayerEquipmentState = (
  options: CreatePlayerEquipmentStateOptions = {}
): PlayerEquipmentState => {
  const state: PlayerEquipmentState = {
    head: cloneEquippedArmorItemId(options.head ?? null),
    body: cloneEquippedArmorItemId(options.body ?? null),
    legs: cloneEquippedArmorItemId(options.legs ?? null)
  };

  validateSlotItemId('head', state.head, 'head');
  validateSlotItemId('body', state.body, 'body');
  validateSlotItemId('legs', state.legs, 'legs');
  return state;
};

export const createDefaultPlayerEquipmentState = (): PlayerEquipmentState =>
  createPlayerEquipmentState();

export const clonePlayerEquipmentState = (state: PlayerEquipmentState): PlayerEquipmentState =>
  createPlayerEquipmentState(state);

export const setPlayerEquipmentSlot = (
  state: PlayerEquipmentState,
  slotId: PlayerEquipmentSlotId,
  itemId: PlayerArmorItemId | null
): PlayerEquipmentState =>
  createPlayerEquipmentState({
    ...state,
    [slotId]: itemId
  });

export const toggleStarterArmorForSlot = (
  state: PlayerEquipmentState,
  slotId: PlayerEquipmentSlotId
): PlayerEquipmentState => {
  const starterItemId = getStarterArmorItemIdForSlot(slotId);
  return setPlayerEquipmentSlot(state, slotId, state[slotId] === starterItemId ? null : starterItemId);
};

export const getPlayerEquipmentTotalDefense = (state: PlayerEquipmentState): number =>
  PLAYER_EQUIPMENT_SLOT_IDS.reduce((totalDefense, slotId) => {
    const itemId = state[slotId];
    return (
      totalDefense + (itemId === null ? 0 : getPlayerArmorItemDefinition(itemId).defense)
    );
  }, 0);

export const resolvePlayerArmorReducedDamage = (
  damage: number,
  state: PlayerEquipmentState,
  minimumDamage = 1
): number => {
  const normalizedDamage = expectNonNegativeFiniteNumber(damage, 'damage');
  const normalizedMinimumDamage = expectNonNegativeFiniteNumber(minimumDamage, 'minimumDamage');
  if (normalizedMinimumDamage > normalizedDamage) {
    return normalizedDamage;
  }

  return Math.max(
    normalizedMinimumDamage,
    normalizedDamage - getPlayerEquipmentTotalDefense(state)
  );
};
