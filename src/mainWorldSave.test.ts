import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './world/constants';
import { encodeResidentChunkSnapshot } from './world/chunkSnapshot';
import {
  createPlayerState,
  DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_MAX_BREATH_SECONDS
} from './world/playerState';
import { TileWorld } from './world/world';
import {
  createDefaultWorldSaveEnvelopeMigrationMetadata,
  createWorldSaveEnvelope,
  decodeWorldSaveEnvelope,
  WORLD_SAVE_ENVELOPE_KIND,
  WORLD_SAVE_ENVELOPE_VERSION
} from './mainWorldSave';

describe('createWorldSaveEnvelope', () => {
  it('creates a versioned world-save envelope with cloned session and world snapshots', () => {
    const world = new TileWorld(0);
    expect(world.setTile(CHUNK_SIZE + 2, -20, 5)).toBe(true);
    const worldSnapshot = world.createSnapshot();
    const standalonePlayerState = createPlayerState({
      position: { x: 64, y: 80 },
      velocity: { x: 12, y: -34 },
      grounded: false,
      facing: 'left',
      health: 75,
      breathSecondsRemaining: 5.5,
      lavaDamageTickSecondsRemaining: 0.25,
      drowningDamageTickSecondsRemaining: 0.3,
      fallDamageRecoverySecondsRemaining: 0.2
    });
    const cameraFollowOffset = { x: 24, y: -12 };

    const envelope = createWorldSaveEnvelope({
      worldSnapshot,
      standalonePlayerState,
      cameraFollowOffset
    });

    expect(envelope.kind).toBe(WORLD_SAVE_ENVELOPE_KIND);
    expect(envelope.version).toBe(WORLD_SAVE_ENVELOPE_VERSION);
    expect(envelope.migration).toEqual(createDefaultWorldSaveEnvelopeMigrationMetadata());
    expect(envelope.session).toEqual({
      standalonePlayerState,
      cameraFollowOffset
    });
    expect(envelope.worldSnapshot).toEqual(worldSnapshot);

    worldSnapshot.residentChunks[0]!.payload.tiles[0] = 99;
    standalonePlayerState.position.x = 512;
    cameraFollowOffset.x = 128;

    expect(envelope.worldSnapshot.residentChunks[0]!.payload.tiles[0]).not.toBe(99);
    expect(envelope.session.standalonePlayerState?.position.x).toBe(64);
    expect(envelope.session.cameraFollowOffset.x).toBe(24);
  });
});

describe('decodeWorldSaveEnvelope', () => {
  it('decodes a valid envelope with null standalone-player state and explicit migration metadata', () => {
    const world = new TileWorld(0);
    expect(world.setTile(3, -20, 6)).toBe(true);
    const envelope = {
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: {
        migratedFromVersion: 0,
        migratedAtEpochMs: 1234
      },
      session: {
        standalonePlayerState: null,
        cameraFollowOffset: {
          x: -18,
          y: 9
        }
      },
      worldSnapshot: world.createSnapshot()
    };

    const decoded = decodeWorldSaveEnvelope(JSON.parse(JSON.stringify(envelope)));

    expect(decoded).toEqual(envelope);
    expect(decoded).not.toBe(envelope);
    expect(decoded.worldSnapshot).not.toBe(envelope.worldSnapshot);
  });

  it('round-trips standalone-player breath, health, and recovery state through save decode', () => {
    const world = new TileWorld(0);
    expect(world.setTile(1, 0, 3)).toBe(true);
    const standalonePlayerState = createPlayerState({
      position: { x: 72, y: 96 },
      velocity: { x: 0, y: 0 },
      grounded: true,
      health: 37,
      breathSecondsRemaining: 1.5,
      drowningDamageTickSecondsRemaining: 0.4,
      fallDamageRecoverySecondsRemaining: 0.2
    });

    const decoded = decodeWorldSaveEnvelope(
      JSON.parse(
        JSON.stringify(
          createWorldSaveEnvelope({
            worldSnapshot: world.createSnapshot(),
            standalonePlayerState,
            cameraFollowOffset: { x: 0, y: 0 }
          })
        )
      )
    );

    expect(decoded.session.standalonePlayerState).toEqual(standalonePlayerState);
  });

  it('defaults missing breath and fall-recovery state on older standalone-player save payloads', () => {
    const world = new TileWorld(0);
    const standalonePlayerState = createPlayerState({
      position: { x: 72, y: 96 },
      velocity: { x: -14, y: 28 },
      grounded: false,
      facing: 'left',
      health: 62,
      breathSecondsRemaining: 3,
      lavaDamageTickSecondsRemaining: 0.5
    });
    const {
      breathSecondsRemaining: _omittedBreath,
      drowningDamageTickSecondsRemaining: _omittedDrowningTick,
      fallDamageRecoverySecondsRemaining: _omittedFallRecovery,
      ...legacyStandalonePlayerState
    } = standalonePlayerState;

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
      session: {
        standalonePlayerState: legacyStandalonePlayerState,
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerState).toEqual({
      ...standalonePlayerState,
      breathSecondsRemaining: DEFAULT_PLAYER_MAX_BREATH_SECONDS,
      drowningDamageTickSecondsRemaining: DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
      fallDamageRecoverySecondsRemaining: 0
    });
  });

  it('rejects invalid standalone-player session state', () => {
    const world = new TileWorld(0);
    const playerState = createPlayerState();

    expect(() =>
      decodeWorldSaveEnvelope({
        kind: WORLD_SAVE_ENVELOPE_KIND,
        version: WORLD_SAVE_ENVELOPE_VERSION,
        migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
        session: {
          standalonePlayerState: {
            ...playerState,
            facing: 'up'
          },
          cameraFollowOffset: { x: 0, y: 0 }
        },
        worldSnapshot: world.createSnapshot()
      })
    ).toThrowError(/session\.standalonePlayerState\.facing must be "left" or "right"/);
  });

  it('rejects migration metadata that only provides one migration field', () => {
    const world = new TileWorld(0);

    expect(() =>
      decodeWorldSaveEnvelope({
        kind: WORLD_SAVE_ENVELOPE_KIND,
        version: WORLD_SAVE_ENVELOPE_VERSION,
        migration: {
          migratedFromVersion: 0,
          migratedAtEpochMs: null
        },
        session: {
          standalonePlayerState: null,
          cameraFollowOffset: { x: 0, y: 0 }
        },
        worldSnapshot: world.createSnapshot()
      })
    ).toThrowError(/migration must provide migratedFromVersion and migratedAtEpochMs together/);
  });

  it('reuses TileWorld snapshot validation and rejects duplicate resident chunks', () => {
    const sourceWorld = new TileWorld(0);
    const residentChunkSnapshot = encodeResidentChunkSnapshot(sourceWorld.ensureChunk(0, 0));

    expect(() =>
      decodeWorldSaveEnvelope({
        kind: WORLD_SAVE_ENVELOPE_KIND,
        version: WORLD_SAVE_ENVELOPE_VERSION,
        migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
        session: {
          standalonePlayerState: null,
          cameraFollowOffset: { x: 0, y: 0 }
        },
        worldSnapshot: {
          liquidSimulationTick: 0,
          residentChunks: [residentChunkSnapshot, residentChunkSnapshot],
          editedChunks: []
        }
      })
    ).toThrowError(/residentChunks must not contain duplicate chunk coord 0,0/);
  });
});
