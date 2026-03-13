import { describe, expect, it } from 'vitest';

import {
  WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS,
  WORLD_SESSION_TELEMETRY_STATE_STORAGE_KEY,
  countEnabledWorldSessionTelemetryTypesForCollection,
  createDefaultWorldSessionTelemetryState,
  createWorldSessionTelemetryStatePersistenceSummary,
  decodeWorldSessionTelemetryState,
  isWorldSessionTelemetryTypeVisible,
  loadWorldSessionTelemetryState,
  loadWorldSessionTelemetryStateWithPersistenceAvailability,
  saveWorldSessionTelemetryState,
  toggleWorldSessionTelemetryCollection,
  toggleWorldSessionTelemetryType,
  type WorldSessionTelemetryState
} from './mainWorldSessionTelemetryState';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const createMemoryStorage = (initialState?: string): FakeStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  if (initialState !== undefined) {
    values.set(WORLD_SESSION_TELEMETRY_STATE_STORAGE_KEY, initialState);
  }

  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
};

describe('createDefaultWorldSessionTelemetryState', () => {
  it('starts with every collection and type enabled', () => {
    expect(createDefaultWorldSessionTelemetryState()).toEqual({
      collections: {
        player: true,
        'hostile-slime': true,
        world: true
      },
      types: {
        'player-motion': true,
        'player-presentation': true,
        'player-combat': true,
        'player-camera': true,
        'player-collision': true,
        'player-events': true,
        'hostile-slime-tracker': true,
        'world-lighting': true,
        'world-liquid': true
      }
    });
  });
});

describe('decodeWorldSessionTelemetryState', () => {
  it('accepts a full persisted telemetry state', () => {
    expect(
      decodeWorldSessionTelemetryState({
        collections: {
          player: false,
          'hostile-slime': true,
          world: false
        },
        types: {
          'player-motion': false,
          'player-presentation': true,
          'player-combat': false,
          'player-camera': true,
          'player-collision': false,
          'player-events': true,
          'hostile-slime-tracker': false,
          'world-lighting': true,
          'world-liquid': false
        }
      })
    ).toEqual({
      collections: {
        player: false,
        'hostile-slime': true,
        world: false
      },
      types: {
        'player-motion': false,
        'player-presentation': true,
        'player-combat': false,
        'player-camera': true,
        'player-collision': false,
        'player-events': true,
        'hostile-slime-tracker': false,
        'world-lighting': true,
        'world-liquid': false
      }
    });
  });

  it('defaults missing collections and types on so later telemetry slices can extend older saves', () => {
    expect(
      decodeWorldSessionTelemetryState({
        collections: {
          player: false
        },
        types: {
          'player-motion': false,
          'world-liquid': false
        }
      })
    ).toEqual({
      collections: {
        player: false,
        'hostile-slime': true,
        world: true
      },
      types: {
        'player-motion': false,
        'player-presentation': true,
        'player-combat': true,
        'player-camera': true,
        'player-collision': true,
        'player-events': true,
        'hostile-slime-tracker': true,
        'world-lighting': true,
        'world-liquid': false
      }
    });
  });

  it('rejects a non-object state payload', () => {
    expect(() => decodeWorldSessionTelemetryState(null)).toThrow(
      'telemetry state must be an object'
    );
  });

  it('rejects a non-boolean collection value', () => {
    expect(
      () =>
        decodeWorldSessionTelemetryState({
          collections: {
            player: 'yes'
          }
        })
    ).toThrow('telemetry state collection "player" must be boolean');
  });

  it('rejects a non-boolean type value', () => {
    expect(
      () =>
        decodeWorldSessionTelemetryState({
          types: {
            'world-liquid': 'yes'
          }
        })
    ).toThrow('telemetry state type "world-liquid" must be boolean');
  });
});

describe('createWorldSessionTelemetryStatePersistenceSummary', () => {
  it('summarizes the saved telemetry collections and type counts', () => {
    expect(createWorldSessionTelemetryStatePersistenceSummary()).toEqual({
      statusValue: 'Browser saved',
      descriptionLine:
        'Saved telemetry visibility resumes across paused sessions and fresh worlds until you change it again.',
      collectionLabels: WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS.map(
        (definition) => definition.label
      ),
      enabledCollectionLabels: ['Player', 'Hostile Slime', 'World'],
      disabledCollectionLabels: [],
      enabledTypeCount: 9,
      totalTypeCount: 9
    });
  });

  it('switches to session-only fallback copy when persistence is unavailable', () => {
    expect(
      createWorldSessionTelemetryStatePersistenceSummary(
        {
          collections: {
            player: true,
            'hostile-slime': false,
            world: false
          },
          types: {
            'player-motion': true,
            'player-presentation': true,
            'player-combat': false,
            'player-camera': false,
            'player-collision': false,
            'player-events': true,
            'hostile-slime-tracker': false,
            'world-lighting': false,
            'world-liquid': false
          }
        },
        false
      )
    ).toEqual({
      statusValue: 'Session-only fallback',
      descriptionLine:
        'Browser telemetry storage is unavailable or could not be updated, so this paused session keeps the current telemetry visibility only until a reload clears it.',
      collectionLabels: ['Player', 'Hostile Slime', 'World'],
      enabledCollectionLabels: ['Player'],
      disabledCollectionLabels: ['Hostile Slime', 'World'],
      enabledTypeCount: 3,
      totalTypeCount: 9
    });
  });
});

describe('toggle helpers and visibility', () => {
  const baseState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState();

  it('toggles one collection without mutating type flags', () => {
    expect(toggleWorldSessionTelemetryCollection(baseState, 'hostile-slime')).toEqual({
      collections: {
        player: true,
        'hostile-slime': false,
        world: true
      },
      types: baseState.types
    });
  });

  it('toggles one type without mutating collection flags', () => {
    expect(toggleWorldSessionTelemetryType(baseState, 'player-camera')).toEqual({
      collections: baseState.collections,
      types: {
        ...baseState.types,
        'player-camera': false
      }
    });
  });

  it('treats a type as hidden when its parent collection is disabled', () => {
    const collectionDisabledState = toggleWorldSessionTelemetryCollection(baseState, 'world');
    expect(isWorldSessionTelemetryTypeVisible(collectionDisabledState, 'world-liquid')).toBe(false);
  });

  it('counts enabled types within a collection', () => {
    const state = toggleWorldSessionTelemetryType(baseState, 'player-events');
    expect(countEnabledWorldSessionTelemetryTypesForCollection(state, 'player')).toBe(5);
  });
});

describe('loadWorldSessionTelemetryStateWithPersistenceAvailability', () => {
  const FALLBACK_STATE = createDefaultWorldSessionTelemetryState();

  it('returns the fallback state with unavailable persistence when storage is missing', () => {
    expect(loadWorldSessionTelemetryStateWithPersistenceAvailability(null, FALLBACK_STATE)).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: false
    });
  });

  it('returns the fallback state with unavailable persistence when storage throws on read', () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {}
    };

    expect(
      loadWorldSessionTelemetryStateWithPersistenceAvailability(throwingStorage, FALLBACK_STATE)
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: false
    });
  });

  it('returns the fallback state when no persisted telemetry state exists', () => {
    expect(
      loadWorldSessionTelemetryStateWithPersistenceAvailability(createMemoryStorage(), FALLBACK_STATE)
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: true
    });
  });

  it('loads a partial persisted telemetry state and defaults the rest on', () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        collections: {
          world: false
        },
        types: {
          'player-motion': false
        }
      })
    );

    expect(loadWorldSessionTelemetryStateWithPersistenceAvailability(storage, FALLBACK_STATE)).toEqual({
      state: {
        collections: {
          player: true,
          'hostile-slime': true,
          world: false
        },
        types: {
          'player-motion': false,
          'player-presentation': true,
          'player-combat': true,
          'player-camera': true,
          'player-collision': true,
          'player-events': true,
          'hostile-slime-tracker': true,
          'world-lighting': true,
          'world-liquid': true
        }
      },
      persistenceAvailable: true
    });
  });

  it('falls back when the persisted JSON is malformed', () => {
    const malformedStorage = createMemoryStorage('{oops');

    expect(
      loadWorldSessionTelemetryStateWithPersistenceAvailability(malformedStorage, FALLBACK_STATE)
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: true
    });
  });
});

describe('loadWorldSessionTelemetryState', () => {
  it('returns the loaded telemetry state without the availability wrapper', () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        collections: {
          player: false
        },
        types: {
          'player-camera': false
        }
      })
    );

    expect(loadWorldSessionTelemetryState(storage, createDefaultWorldSessionTelemetryState())).toEqual({
      collections: {
        player: false,
        'hostile-slime': true,
        world: true
      },
      types: {
        'player-motion': true,
        'player-presentation': true,
        'player-combat': true,
        'player-camera': false,
        'player-collision': true,
        'player-events': true,
        'hostile-slime-tracker': true,
        'world-lighting': true,
        'world-liquid': true
      }
    });
  });
});

describe('saveWorldSessionTelemetryState', () => {
  it('persists the telemetry state under the dedicated storage key', () => {
    const storage = createMemoryStorage();
    const state = toggleWorldSessionTelemetryType(
      createDefaultWorldSessionTelemetryState(),
      'hostile-slime-tracker'
    );

    expect(saveWorldSessionTelemetryState(storage, state)).toBe(true);
    expect(JSON.parse(storage.values.get(WORLD_SESSION_TELEMETRY_STATE_STORAGE_KEY) ?? 'null')).toEqual(
      state
    );
  });

  it('returns false when storage is missing', () => {
    expect(
      saveWorldSessionTelemetryState(null, createDefaultWorldSessionTelemetryState())
    ).toBe(false);
  });

  it('returns false when storage throws on write', () => {
    const throwingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      }
    };

    expect(
      saveWorldSessionTelemetryState(throwingStorage, createDefaultWorldSessionTelemetryState())
    ).toBe(false);
  });
});
