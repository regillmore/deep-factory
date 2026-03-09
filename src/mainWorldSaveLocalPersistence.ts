import {
  createWorldSaveEnvelope,
  decodeWorldSaveEnvelope,
  type WorldSaveEnvelope
} from './mainWorldSave';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface PersistedWorldSaveEnvelopeLoadResult {
  envelope: WorldSaveEnvelope | null;
  persistenceAvailable: boolean;
}

const STORAGE_KEY = 'deep-factory.persistedWorldSaveEnvelope.v1';

const clearInvalidPersistedWorldSaveEnvelope = (
  storage: StorageLike | null | undefined
): void => {
  if (!storage || typeof storage.removeItem !== 'function') {
    return;
  }

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Keep invalid values isolated to load fallback behavior when storage cleanup fails.
  }
};

export const loadPersistedWorldSaveEnvelopeWithPersistenceAvailability = (
  storage: StorageLike | null | undefined
): PersistedWorldSaveEnvelopeLoadResult => {
  if (!storage) {
    return {
      envelope: null,
      persistenceAvailable: false
    };
  }

  let rawEnvelope: string | null;
  try {
    rawEnvelope = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      envelope: null,
      persistenceAvailable: false
    };
  }

  if (!rawEnvelope) {
    return {
      envelope: null,
      persistenceAvailable: true
    };
  }

  let parsedEnvelope: unknown;
  try {
    parsedEnvelope = JSON.parse(rawEnvelope);
  } catch {
    clearInvalidPersistedWorldSaveEnvelope(storage);
    return {
      envelope: null,
      persistenceAvailable: true
    };
  }

  try {
    return {
      envelope: decodeWorldSaveEnvelope(parsedEnvelope),
      persistenceAvailable: true
    };
  } catch {
    clearInvalidPersistedWorldSaveEnvelope(storage);
    return {
      envelope: null,
      persistenceAvailable: true
    };
  }
};

export const loadPersistedWorldSaveEnvelope = (
  storage: StorageLike | null | undefined
): WorldSaveEnvelope | null =>
  loadPersistedWorldSaveEnvelopeWithPersistenceAvailability(storage).envelope;

export const savePersistedWorldSaveEnvelope = (
  storage: StorageLike | null | undefined,
  envelope: WorldSaveEnvelope
): boolean => {
  if (!storage) {
    return false;
  }

  let normalizedEnvelope: WorldSaveEnvelope;
  try {
    normalizedEnvelope = createWorldSaveEnvelope({
      worldSnapshot: envelope.worldSnapshot,
      standalonePlayerState: envelope.session.standalonePlayerState,
      cameraFollowOffset: envelope.session.cameraFollowOffset,
      migration: envelope.migration
    });
  } catch {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizedEnvelope));
    return true;
  } catch {
    return false;
  }
};

export const clearPersistedWorldSaveEnvelope = (
  storage: StorageLike | null | undefined
): boolean => {
  if (!storage || typeof storage.removeItem !== 'function') {
    return false;
  }

  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

export const PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY = STORAGE_KEY;
