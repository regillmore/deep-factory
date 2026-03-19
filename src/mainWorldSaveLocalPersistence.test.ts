import { describe, expect, it } from 'vitest';

import { createWorldSaveEnvelope } from './mainWorldSave';
import {
  clearPersistedWorldSaveEnvelope,
  loadPersistedWorldSaveEnvelope,
  loadPersistedWorldSaveEnvelopeWithPersistenceAvailability,
  PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY,
  savePersistedWorldSaveEnvelope
} from './mainWorldSaveLocalPersistence';
import { createPlayerEquipmentState } from './world/playerEquipment';
import { createPlayerState } from './world/playerState';
import { TileWorld } from './world/world';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

const createMemoryStorage = (initialState?: string): FakeStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  if (initialState !== undefined) {
    values.set(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY, initialState);
  }

  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    }
  };
};

const createTestEnvelope = () => {
  const world = new TileWorld(0);
  expect(world.setTile(5, -20, 6)).toBe(true);

  return createWorldSaveEnvelope({
    worldSnapshot: world.createSnapshot(),
    standalonePlayerState: createPlayerState({
      position: { x: 72, y: 96 },
      velocity: { x: -14, y: 28 },
      grounded: false,
      facing: 'left',
      health: 62,
      lavaDamageTickSecondsRemaining: 0.5
    }),
    cameraFollowOffset: { x: 18, y: -12 }
  });
};

describe('loadPersistedWorldSaveEnvelopeWithPersistenceAvailability', () => {
  it('marks persistence unavailable when storage access is missing or throws', () => {
    expect(loadPersistedWorldSaveEnvelopeWithPersistenceAvailability(null)).toEqual({
      envelope: null,
      persistenceAvailable: false
    });

    const throwingStorage: FakeStorage = {
      getItem: () => {
        throw new Error('read blocked');
      },
      setItem: () => {}
    };

    expect(loadPersistedWorldSaveEnvelopeWithPersistenceAvailability(throwingStorage)).toEqual({
      envelope: null,
      persistenceAvailable: false
    });
  });

  it('returns a decoded persisted envelope when storage contains valid save data', () => {
    const envelope = createTestEnvelope();
    const storage = createMemoryStorage(JSON.stringify(envelope));

    expect(loadPersistedWorldSaveEnvelopeWithPersistenceAvailability(storage)).toEqual({
      envelope,
      persistenceAvailable: true
    });
  });

  it('clears malformed or invalid persisted values and falls back to no envelope', () => {
    const malformedStorage = createMemoryStorage('{not-json');
    expect(loadPersistedWorldSaveEnvelopeWithPersistenceAvailability(malformedStorage)).toEqual({
      envelope: null,
      persistenceAvailable: true
    });
    expect(malformedStorage.values.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(false);

    const invalidEnvelopeStorage = createMemoryStorage(
      JSON.stringify({
        kind: 'deep-factory.world-save',
        version: 1,
        migration: {
          migratedFromVersion: null,
          migratedAtEpochMs: null
        },
        session: {
          standalonePlayerState: null,
          standalonePlayerDeathState: null,
          cameraFollowOffset: { x: 0, y: 0 }
        },
        worldSnapshot: {
          liquidSimulationTick: 0,
          residentChunks: [{ chunkX: 0, chunkY: 0 }],
          editedChunks: []
        }
      })
    );

    expect(loadPersistedWorldSaveEnvelopeWithPersistenceAvailability(invalidEnvelopeStorage)).toEqual({
      envelope: null,
      persistenceAvailable: true
    });
    expect(invalidEnvelopeStorage.values.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(false);
  });
});

describe('loadPersistedWorldSaveEnvelope', () => {
  it('returns the decoded envelope or null when none is stored', () => {
    expect(loadPersistedWorldSaveEnvelope(createMemoryStorage())).toBeNull();

    const envelope = createTestEnvelope();
    expect(loadPersistedWorldSaveEnvelope(createMemoryStorage(JSON.stringify(envelope)))).toEqual(
      envelope
    );
  });
});

describe('savePersistedWorldSaveEnvelope', () => {
  it('writes a normalized persisted envelope through the storage key', () => {
    const storage = createMemoryStorage();
    const envelope = createTestEnvelope();

    expect(savePersistedWorldSaveEnvelope(storage, envelope)).toBe(true);
    expect(storage.values.get(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(
      JSON.stringify(envelope)
    );
  });

  it('preserves equipped armor when normalizing the persisted envelope before writing', () => {
    const storage = createMemoryStorage();
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: new TileWorld(0).createSnapshot(),
      standalonePlayerState: createPlayerState(),
      standalonePlayerEquipmentState: createPlayerEquipmentState({
        head: 'starter-helmet',
        body: 'starter-breastplate'
      })
    });

    expect(savePersistedWorldSaveEnvelope(storage, envelope)).toBe(true);
    expect(loadPersistedWorldSaveEnvelope(storage)?.session.standalonePlayerEquipmentState).toEqual(
      createPlayerEquipmentState({
        head: 'starter-helmet',
        body: 'starter-breastplate'
      })
    );
  });

  it('returns false when storage is unavailable, throws, or the envelope is invalid', () => {
    expect(savePersistedWorldSaveEnvelope(null, createTestEnvelope())).toBe(false);

    const throwingStorage: FakeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('write blocked');
      }
    };
    expect(savePersistedWorldSaveEnvelope(throwingStorage, createTestEnvelope())).toBe(false);

    const invalidEnvelope = {
      kind: 'deep-factory.world-save',
      version: 1,
      migration: {
        migratedFromVersion: null,
        migratedAtEpochMs: null
      },
      session: {
        standalonePlayerState: null,
        standalonePlayerDeathState: null,
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: {
        liquidSimulationTick: 0,
        residentChunks: [{ chunkX: 0, chunkY: 0 }],
        editedChunks: []
      }
    } as unknown as ReturnType<typeof createTestEnvelope>;

    expect(savePersistedWorldSaveEnvelope(createMemoryStorage(), invalidEnvelope)).toBe(false);
  });
});

describe('clearPersistedWorldSaveEnvelope', () => {
  it('removes the persisted world-save entry', () => {
    const storage = createMemoryStorage(JSON.stringify(createTestEnvelope()));

    expect(clearPersistedWorldSaveEnvelope(storage)).toBe(true);
    expect(storage.values.has(PERSISTED_WORLD_SAVE_ENVELOPE_STORAGE_KEY)).toBe(false);
  });

  it('returns false when storage is unavailable, missing remove support, or throws', () => {
    expect(clearPersistedWorldSaveEnvelope(null)).toBe(false);

    const storageWithoutRemove: FakeStorage = {
      getItem: () => null,
      setItem: () => {}
    };
    expect(clearPersistedWorldSaveEnvelope(storageWithoutRemove)).toBe(false);

    const throwingStorage: FakeStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new Error('remove blocked');
      }
    };
    expect(clearPersistedWorldSaveEnvelope(throwingStorage)).toBe(false);
  });
});
