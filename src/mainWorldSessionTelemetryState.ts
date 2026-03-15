export const WORLD_SESSION_TELEMETRY_COLLECTION_IDS = [
  'player',
  'hostile-slime',
  'world',
  'inspect'
] as const;

export type WorldSessionTelemetryCollectionId =
  (typeof WORLD_SESSION_TELEMETRY_COLLECTION_IDS)[number];

export const WORLD_SESSION_TELEMETRY_TYPE_IDS = [
  'player-motion',
  'player-presentation',
  'player-combat',
  'player-camera',
  'player-collision',
  'player-events',
  'player-spawn',
  'hostile-slime-tracker',
  'world-atlas',
  'world-animated-mesh',
  'world-lighting',
  'world-liquid',
  'inspect-pointer',
  'inspect-pinned'
] as const;

export type WorldSessionTelemetryTypeId = (typeof WORLD_SESSION_TELEMETRY_TYPE_IDS)[number];

export interface WorldSessionTelemetryCollectionDefinition {
  id: WorldSessionTelemetryCollectionId;
  label: string;
  description: string;
  typeIds: readonly WorldSessionTelemetryTypeId[];
}

export interface WorldSessionTelemetryTypeDefinition {
  id: WorldSessionTelemetryTypeId;
  collectionId: WorldSessionTelemetryCollectionId;
  label: string;
  description: string;
}

export interface WorldSessionTelemetryState {
  collections: Record<WorldSessionTelemetryCollectionId, boolean>;
  types: Record<WorldSessionTelemetryTypeId, boolean>;
}

export interface WorldSessionTelemetryStatePersistenceSummary {
  statusValue: string;
  descriptionLine: string;
  collectionLabels: readonly string[];
  enabledCollectionLabels: readonly string[];
  disabledCollectionLabels: readonly string[];
  enabledTypeCount: number;
  totalTypeCount: number;
}

export interface WorldSessionTelemetryStateLoadResult {
  state: WorldSessionTelemetryState;
  persistenceAvailable: boolean;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'deep-factory.worldSessionTelemetryState.v1';

const WORLD_SESSION_TELEMETRY_STATE_PERSISTENCE_STATUS_BROWSER_SAVED = 'Browser saved';
const WORLD_SESSION_TELEMETRY_STATE_PERSISTENCE_STATUS_SESSION_ONLY_FALLBACK =
  'Session-only fallback';
const WORLD_SESSION_TELEMETRY_STATE_PERSISTENCE_DESCRIPTION_BROWSER_SAVED =
  'Saved telemetry visibility resumes across paused sessions and fresh worlds until you change it again.';
const WORLD_SESSION_TELEMETRY_STATE_PERSISTENCE_DESCRIPTION_SESSION_ONLY_FALLBACK =
  'Browser telemetry storage is unavailable or could not be updated, so this paused session keeps the current telemetry visibility only until a reload clears it.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

export const WORLD_SESSION_TELEMETRY_TYPE_DEFINITIONS = [
  {
    id: 'player-motion',
    collectionId: 'player',
    label: 'Motion',
    description: 'Position, velocity, facing, and input readouts.'
  },
  {
    id: 'player-presentation',
    collectionId: 'player',
    label: 'Presentation',
    description: 'Placeholder pose and ceiling-bonk hold readouts.'
  },
  {
    id: 'player-combat',
    collectionId: 'player',
    label: 'Combat',
    description:
      'Health, death-hold, respawn countdown, breath, water or lava overlap, drowning or lava cooldowns, survival damage-event readouts, and the latest lethal damage source.'
  },
  {
    id: 'player-camera',
    collectionId: 'player',
    label: 'Camera',
    description: 'Camera position, focus, zoom, and offset readouts.'
  },
  {
    id: 'player-collision',
    collectionId: 'player',
    label: 'Collision',
    description: 'Collision AABB and live support, wall, and ceiling contacts.'
  },
  {
    id: 'player-events',
    collectionId: 'player',
    label: 'Events',
    description: 'Latest grounded, facing, respawn, wall, and ceiling transition events.'
  },
  {
    id: 'player-spawn',
    collectionId: 'player',
    label: 'Spawn',
    description: 'Resolved player spawn tile, support, and liquid-safety readouts.'
  },
  {
    id: 'hostile-slime-tracker',
    collectionId: 'hostile-slime',
    label: 'Tracker',
    description: 'Tracked hostile-slime spawn-window, chase-offset, movement, and launch readouts.'
  },
  {
    id: 'world-atlas',
    collectionId: 'world',
    label: 'Atlas',
    description: 'Atlas source, size, and validation warning readouts.'
  },
  {
    id: 'world-animated-mesh',
    collectionId: 'world',
    label: 'Animated Mesh',
    description: 'Animated chunk mesh residency and UV upload readouts.'
  },
  {
    id: 'world-lighting',
    collectionId: 'world',
    label: 'Lighting',
    description: 'Nearby-light sample and dirty-light chunk readouts.'
  },
  {
    id: 'inspect-pointer',
    collectionId: 'inspect',
    label: 'Pointer',
    description: 'Hovered pointer-position and tile-inspect readouts.'
  },
  {
    id: 'inspect-pinned',
    collectionId: 'inspect',
    label: 'Pinned',
    description: 'Pinned tile-inspect readouts.'
  },
  {
    id: 'world-liquid',
    collectionId: 'world',
    label: 'Liquid',
    description: 'Liquid chunk residency and step-summary readouts.'
  }
] as const satisfies readonly WorldSessionTelemetryTypeDefinition[];

export const WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS = [
  {
    id: 'player',
    label: 'Player',
    description: 'Live standalone-player telemetry in the full HUD or compact strip.',
    typeIds: [
      'player-motion',
      'player-presentation',
      'player-combat',
      'player-camera',
      'player-collision',
      'player-events',
      'player-spawn'
    ]
  },
  {
    id: 'hostile-slime',
    label: 'Hostile Slime',
    description: 'Tracked hostile-slime spawn-window and locomotion telemetry.',
    typeIds: ['hostile-slime-tracker']
  },
  {
    id: 'world',
    label: 'World',
    description: 'Atlas, animated-mesh, lighting, and liquid-simulation telemetry.',
    typeIds: ['world-atlas', 'world-animated-mesh', 'world-lighting', 'world-liquid']
  },
  {
    id: 'inspect',
    label: 'Inspect',
    description: 'Pointer-hover and pinned tile-inspect telemetry.',
    typeIds: ['inspect-pointer', 'inspect-pinned']
  }
] as const satisfies readonly WorldSessionTelemetryCollectionDefinition[];

const WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS_BY_ID = new Map<
  WorldSessionTelemetryCollectionId,
  WorldSessionTelemetryCollectionDefinition
>(
  WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS.map((definition) => [definition.id, definition])
);

const WORLD_SESSION_TELEMETRY_TYPE_DEFINITIONS_BY_ID = new Map<
  WorldSessionTelemetryTypeId,
  WorldSessionTelemetryTypeDefinition
>(WORLD_SESSION_TELEMETRY_TYPE_DEFINITIONS.map((definition) => [definition.id, definition]));

const cloneWorldSessionTelemetryCollections = (
  collections: WorldSessionTelemetryState['collections']
): WorldSessionTelemetryState['collections'] => ({
  player: collections.player,
  'hostile-slime': collections['hostile-slime'],
  world: collections.world,
  inspect: collections.inspect
});

const cloneWorldSessionTelemetryTypes = (
  types: WorldSessionTelemetryState['types']
): WorldSessionTelemetryState['types'] => ({
  'player-motion': types['player-motion'],
  'player-presentation': types['player-presentation'],
  'player-combat': types['player-combat'],
  'player-camera': types['player-camera'],
  'player-collision': types['player-collision'],
  'player-events': types['player-events'],
  'player-spawn': types['player-spawn'],
  'hostile-slime-tracker': types['hostile-slime-tracker'],
  'world-atlas': types['world-atlas'],
  'world-animated-mesh': types['world-animated-mesh'],
  'world-lighting': types['world-lighting'],
  'world-liquid': types['world-liquid'],
  'inspect-pointer': types['inspect-pointer'],
  'inspect-pinned': types['inspect-pinned']
});

export const cloneWorldSessionTelemetryState = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState()
): WorldSessionTelemetryState => ({
  collections: cloneWorldSessionTelemetryCollections(state.collections),
  types: cloneWorldSessionTelemetryTypes(state.types)
});

export const createDefaultWorldSessionTelemetryState = (): WorldSessionTelemetryState => ({
  collections: {
    player: true,
    'hostile-slime': true,
    world: true,
    inspect: true
  },
  types: {
    'player-motion': true,
    'player-presentation': true,
    'player-combat': true,
    'player-camera': true,
    'player-collision': true,
    'player-events': true,
    'player-spawn': true,
    'hostile-slime-tracker': true,
    'world-atlas': true,
    'world-animated-mesh': true,
    'world-lighting': true,
    'world-liquid': true,
    'inspect-pointer': true,
    'inspect-pinned': true
  }
});

export const getWorldSessionTelemetryCollectionDefinition = (
  collectionId: WorldSessionTelemetryCollectionId
): WorldSessionTelemetryCollectionDefinition =>
  WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS_BY_ID.get(collectionId) ??
  WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS[0];

export const getWorldSessionTelemetryTypeDefinition = (
  typeId: WorldSessionTelemetryTypeId
): WorldSessionTelemetryTypeDefinition =>
  WORLD_SESSION_TELEMETRY_TYPE_DEFINITIONS_BY_ID.get(typeId) ??
  WORLD_SESSION_TELEMETRY_TYPE_DEFINITIONS[0];

export const getWorldSessionTelemetryTypeDefinitionsForCollection = (
  collectionId: WorldSessionTelemetryCollectionId
): readonly WorldSessionTelemetryTypeDefinition[] =>
  WORLD_SESSION_TELEMETRY_TYPE_DEFINITIONS.filter(
    (definition) => definition.collectionId === collectionId
  );

export const isWorldSessionTelemetryCollectionEnabled = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  collectionId: WorldSessionTelemetryCollectionId
): boolean => state.collections[collectionId];

export const isWorldSessionTelemetryTypeEnabled = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  typeId: WorldSessionTelemetryTypeId
): boolean => state.types[typeId];

export const isWorldSessionTelemetryTypeVisible = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  typeId: WorldSessionTelemetryTypeId
): boolean => {
  const definition = getWorldSessionTelemetryTypeDefinition(typeId);
  return state.collections[definition.collectionId] && state.types[typeId];
};

export const toggleWorldSessionTelemetryCollection = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  collectionId: WorldSessionTelemetryCollectionId
): WorldSessionTelemetryState => ({
  collections: {
    ...state.collections,
    [collectionId]: !state.collections[collectionId]
  },
  types: cloneWorldSessionTelemetryTypes(state.types)
});

export const toggleWorldSessionTelemetryType = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  typeId: WorldSessionTelemetryTypeId
): WorldSessionTelemetryState => ({
  collections: cloneWorldSessionTelemetryCollections(state.collections),
  types: {
    ...state.types,
    [typeId]: !state.types[typeId]
  }
});

export const countEnabledWorldSessionTelemetryTypesForCollection = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  collectionId: WorldSessionTelemetryCollectionId
): number =>
  getWorldSessionTelemetryTypeDefinitionsForCollection(collectionId).filter(
    (definition) => state.types[definition.id]
  ).length;

export const matchesDefaultWorldSessionTelemetryState = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  defaultState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState()
): boolean => {
  for (const collectionId of WORLD_SESSION_TELEMETRY_COLLECTION_IDS) {
    if (state.collections[collectionId] !== defaultState.collections[collectionId]) {
      return false;
    }
  }

  for (const typeId of WORLD_SESSION_TELEMETRY_TYPE_IDS) {
    if (state.types[typeId] !== defaultState.types[typeId]) {
      return false;
    }
  }

  return true;
};

export const decodeWorldSessionTelemetryState = (value: unknown): WorldSessionTelemetryState => {
  if (!isRecord(value)) {
    throw new Error('telemetry state must be an object');
  }

  const nextState = createDefaultWorldSessionTelemetryState();
  const collections = value.collections;
  if (collections !== undefined && !isRecord(collections)) {
    throw new Error('telemetry state collections must be an object');
  }
  if (isRecord(collections)) {
    for (const collectionId of WORLD_SESSION_TELEMETRY_COLLECTION_IDS) {
      const nextValue = collections[collectionId];
      if (nextValue === undefined) {
        continue;
      }
      if (!isBoolean(nextValue)) {
        throw new Error(`telemetry state collection "${collectionId}" must be boolean`);
      }
      nextState.collections[collectionId] = nextValue;
    }
  }

  const types = value.types;
  if (types !== undefined && !isRecord(types)) {
    throw new Error('telemetry state types must be an object');
  }
  if (isRecord(types)) {
    for (const typeId of WORLD_SESSION_TELEMETRY_TYPE_IDS) {
      const nextValue = types[typeId];
      if (nextValue === undefined) {
        continue;
      }
      if (!isBoolean(nextValue)) {
        throw new Error(`telemetry state type "${typeId}" must be boolean`);
      }
      nextState.types[typeId] = nextValue;
    }
  }

  return nextState;
};

export const createWorldSessionTelemetryStatePersistenceSummary = (
  state: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  persistenceAvailable = true
): WorldSessionTelemetryStatePersistenceSummary => {
  const enabledCollectionLabels: string[] = [];
  const disabledCollectionLabels: string[] = [];
  let enabledTypeCount = 0;

  for (const definition of WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS) {
    if (state.collections[definition.id]) {
      enabledCollectionLabels.push(definition.label);
      continue;
    }

    disabledCollectionLabels.push(definition.label);
  }

  for (const typeId of WORLD_SESSION_TELEMETRY_TYPE_IDS) {
    if (state.types[typeId]) {
      enabledTypeCount += 1;
    }
  }

  return {
    statusValue: persistenceAvailable
      ? WORLD_SESSION_TELEMETRY_STATE_PERSISTENCE_STATUS_BROWSER_SAVED
      : WORLD_SESSION_TELEMETRY_STATE_PERSISTENCE_STATUS_SESSION_ONLY_FALLBACK,
    descriptionLine: persistenceAvailable
      ? WORLD_SESSION_TELEMETRY_STATE_PERSISTENCE_DESCRIPTION_BROWSER_SAVED
      : WORLD_SESSION_TELEMETRY_STATE_PERSISTENCE_DESCRIPTION_SESSION_ONLY_FALLBACK,
    collectionLabels: WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS.map(
      (definition) => definition.label
    ),
    enabledCollectionLabels,
    disabledCollectionLabels,
    enabledTypeCount,
    totalTypeCount: WORLD_SESSION_TELEMETRY_TYPE_IDS.length
  };
};

export const loadWorldSessionTelemetryStateWithPersistenceAvailability = (
  storage: StorageLike | null | undefined,
  fallbackState: WorldSessionTelemetryState
): WorldSessionTelemetryStateLoadResult => {
  if (!storage) {
    return {
      state: cloneWorldSessionTelemetryState(fallbackState),
      persistenceAvailable: false
    };
  }

  let rawState: string | null;
  try {
    rawState = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: cloneWorldSessionTelemetryState(fallbackState),
      persistenceAvailable: false
    };
  }

  if (!rawState) {
    return {
      state: cloneWorldSessionTelemetryState(fallbackState),
      persistenceAvailable: true
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawState);
  } catch {
    return {
      state: cloneWorldSessionTelemetryState(fallbackState),
      persistenceAvailable: true
    };
  }

  try {
    return {
      state: decodeWorldSessionTelemetryState(parsed),
      persistenceAvailable: true
    };
  } catch {
    return {
      state: cloneWorldSessionTelemetryState(fallbackState),
      persistenceAvailable: true
    };
  }
};

export const loadWorldSessionTelemetryState = (
  storage: StorageLike | null | undefined,
  fallbackState: WorldSessionTelemetryState
): WorldSessionTelemetryState =>
  loadWorldSessionTelemetryStateWithPersistenceAvailability(storage, fallbackState).state;

export const saveWorldSessionTelemetryState = (
  storage: StorageLike | null | undefined,
  state: WorldSessionTelemetryState
): boolean => {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const WORLD_SESSION_TELEMETRY_STATE_STORAGE_KEY = STORAGE_KEY;
