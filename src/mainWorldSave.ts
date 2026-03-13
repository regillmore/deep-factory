import type { CameraFollowOffset } from './core/cameraFollow';
import {
  clonePlayerState,
  DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_MAX_BREATH_SECONDS,
  type PlayerState
} from './world/playerState';
import { TileWorld, type TileWorldSnapshot } from './world/world';

export const WORLD_SAVE_ENVELOPE_KIND = 'deep-factory.world-save';
export const WORLD_SAVE_ENVELOPE_VERSION = 1;

export interface WorldSaveEnvelopeMigrationMetadata {
  migratedFromVersion: number | null;
  migratedAtEpochMs: number | null;
}

export interface WorldSaveSessionState {
  standalonePlayerState: PlayerState | null;
  cameraFollowOffset: CameraFollowOffset;
}

export interface WorldSaveEnvelope {
  kind: typeof WORLD_SAVE_ENVELOPE_KIND;
  version: typeof WORLD_SAVE_ENVELOPE_VERSION;
  migration: WorldSaveEnvelopeMigrationMetadata;
  session: WorldSaveSessionState;
  worldSnapshot: TileWorldSnapshot;
}

export interface CreateWorldSaveEnvelopeOptions {
  worldSnapshot: TileWorldSnapshot;
  standalonePlayerState?: PlayerState | null;
  cameraFollowOffset?: CameraFollowOffset;
  migration?: WorldSaveEnvelopeMigrationMetadata;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const expectFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectPositiveFiniteNumber = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return normalizedValue;
};

const expectNonNegativeFiniteNumber = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return normalizedValue;
};

const expectBoolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
};

const expectNullableNonNegativeInteger = (value: unknown, label: string): number | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = expectFiniteNumber(value, label);
  if (!Number.isInteger(normalizedValue) || normalizedValue < 0) {
    throw new Error(`${label} must be null or a non-negative integer`);
  }

  return normalizedValue;
};

const normalizeCameraFollowOffset = (value: unknown, label: string): CameraFollowOffset => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    x: expectFiniteNumber(value.x, `${label}.x`),
    y: expectFiniteNumber(value.y, `${label}.y`)
  };
};

const normalizePlayerState = (value: unknown, label: string): PlayerState => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }
  if (!isRecord(value.position)) {
    throw new Error(`${label}.position must be an object`);
  }
  if (!isRecord(value.velocity)) {
    throw new Error(`${label}.velocity must be an object`);
  }
  if (!isRecord(value.size)) {
    throw new Error(`${label}.size must be an object`);
  }

  const facing = value.facing;
  if (facing !== 'left' && facing !== 'right') {
    throw new Error(`${label}.facing must be "left" or "right"`);
  }

  return clonePlayerState({
    position: {
      x: expectFiniteNumber(value.position.x, `${label}.position.x`),
      y: expectFiniteNumber(value.position.y, `${label}.position.y`)
    },
    velocity: {
      x: expectFiniteNumber(value.velocity.x, `${label}.velocity.x`),
      y: expectFiniteNumber(value.velocity.y, `${label}.velocity.y`)
    },
    size: {
      width: expectPositiveFiniteNumber(value.size.width, `${label}.size.width`),
      height: expectPositiveFiniteNumber(value.size.height, `${label}.size.height`)
    },
    grounded: expectBoolean(value.grounded, `${label}.grounded`),
    facing,
    health: expectNonNegativeFiniteNumber(value.health, `${label}.health`),
    breathSecondsRemaining: expectNonNegativeFiniteNumber(
      value.breathSecondsRemaining ?? DEFAULT_PLAYER_MAX_BREATH_SECONDS,
      `${label}.breathSecondsRemaining`
    ),
    lavaDamageTickSecondsRemaining: expectNonNegativeFiniteNumber(
      value.lavaDamageTickSecondsRemaining,
      `${label}.lavaDamageTickSecondsRemaining`
    ),
    drowningDamageTickSecondsRemaining: expectNonNegativeFiniteNumber(
      value.drowningDamageTickSecondsRemaining ?? DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
      `${label}.drowningDamageTickSecondsRemaining`
    ),
    fallDamageRecoverySecondsRemaining: expectNonNegativeFiniteNumber(
      value.fallDamageRecoverySecondsRemaining ?? 0,
      `${label}.fallDamageRecoverySecondsRemaining`
    )
  });
};

const normalizeStandalonePlayerState = (value: unknown, label: string): PlayerState | null =>
  value === null ? null : normalizePlayerState(value, label);

export const createDefaultWorldSaveEnvelopeMigrationMetadata =
  (): WorldSaveEnvelopeMigrationMetadata => ({
    migratedFromVersion: null,
    migratedAtEpochMs: null
  });

const normalizeMigrationMetadata = (
  value: unknown,
  label: string
): WorldSaveEnvelopeMigrationMetadata => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  const migratedFromVersion = expectNullableNonNegativeInteger(
    value.migratedFromVersion,
    `${label}.migratedFromVersion`
  );
  const migratedAtEpochMs = expectNullableNonNegativeInteger(
    value.migratedAtEpochMs,
    `${label}.migratedAtEpochMs`
  );
  if ((migratedFromVersion === null) !== (migratedAtEpochMs === null)) {
    throw new Error(
      `${label} must provide migratedFromVersion and migratedAtEpochMs together or leave both null`
    );
  }

  return {
    migratedFromVersion,
    migratedAtEpochMs
  };
};

const normalizeWorldSnapshot = (snapshot: unknown, label: string): TileWorldSnapshot => {
  if (!isRecord(snapshot)) {
    throw new Error(`${label} must be an object`);
  }

  const normalizedWorld = new TileWorld(0);
  normalizedWorld.loadSnapshot(snapshot as unknown as TileWorldSnapshot);
  return normalizedWorld.createSnapshot();
};

export const createWorldSaveEnvelope = ({
  worldSnapshot,
  standalonePlayerState = null,
  cameraFollowOffset = { x: 0, y: 0 },
  migration = createDefaultWorldSaveEnvelopeMigrationMetadata()
}: CreateWorldSaveEnvelopeOptions): WorldSaveEnvelope => ({
  kind: WORLD_SAVE_ENVELOPE_KIND,
  version: WORLD_SAVE_ENVELOPE_VERSION,
  migration: normalizeMigrationMetadata(migration, 'migration'),
  session: {
    standalonePlayerState: normalizeStandalonePlayerState(
      standalonePlayerState,
      'standalonePlayerState'
    ),
    cameraFollowOffset: normalizeCameraFollowOffset(cameraFollowOffset, 'cameraFollowOffset')
  },
  worldSnapshot: normalizeWorldSnapshot(worldSnapshot, 'worldSnapshot')
});

export const decodeWorldSaveEnvelope = (value: unknown): WorldSaveEnvelope => {
  if (!isRecord(value)) {
    throw new Error('world save envelope must be an object');
  }
  if (value.kind !== WORLD_SAVE_ENVELOPE_KIND) {
    throw new Error(`world save envelope kind must be "${WORLD_SAVE_ENVELOPE_KIND}"`);
  }
  if (value.version !== WORLD_SAVE_ENVELOPE_VERSION) {
    throw new Error(`world save envelope version must be ${WORLD_SAVE_ENVELOPE_VERSION}`);
  }
  if (!isRecord(value.session)) {
    throw new Error('session must be an object');
  }

  return {
    kind: WORLD_SAVE_ENVELOPE_KIND,
    version: WORLD_SAVE_ENVELOPE_VERSION,
    migration: normalizeMigrationMetadata(value.migration, 'migration'),
    session: {
      standalonePlayerState: normalizeStandalonePlayerState(
        value.session.standalonePlayerState,
        'session.standalonePlayerState'
      ),
      cameraFollowOffset: normalizeCameraFollowOffset(
        value.session.cameraFollowOffset,
        'session.cameraFollowOffset'
      )
    },
    worldSnapshot: normalizeWorldSnapshot(value.worldSnapshot, 'worldSnapshot')
  };
};
