import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './world/constants';
import { encodeResidentChunkSnapshot } from './world/chunkSnapshot';
import { createPlayerState } from './world/playerState';
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
      lavaDamageTickSecondsRemaining: 0.25
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
