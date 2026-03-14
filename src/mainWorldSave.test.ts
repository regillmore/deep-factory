import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './world/constants';
import { encodeResidentChunkSnapshot } from './world/chunkSnapshot';
import { createPlayerDeathState } from './world/playerDeathState';
import { createDroppedItemState } from './world/droppedItem';
import { createDefaultPlayerInventoryState } from './world/playerInventory';
import {
  createPlayerState,
  DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS,
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
    const standalonePlayerDeathState = createPlayerDeathState(0.5);
    const standalonePlayerInventoryState = createDefaultPlayerInventoryState();
    const droppedItemStates = [
      createDroppedItemState({
        position: { x: 24, y: -14 },
        itemId: 'torch',
        amount: 6
      })
    ];
    const cameraFollowOffset = { x: 24, y: -12 };

    const envelope = createWorldSaveEnvelope({
      worldSnapshot,
      standalonePlayerState,
      standalonePlayerDeathState,
      standalonePlayerInventoryState,
      droppedItemStates,
      cameraFollowOffset
    });

    expect(envelope.kind).toBe(WORLD_SAVE_ENVELOPE_KIND);
    expect(envelope.version).toBe(WORLD_SAVE_ENVELOPE_VERSION);
    expect(envelope.migration).toEqual(createDefaultWorldSaveEnvelopeMigrationMetadata());
    expect(envelope.session).toEqual({
      standalonePlayerState,
      standalonePlayerDeathState,
      standalonePlayerInventoryState,
      droppedItemStates,
      cameraFollowOffset
    });
    expect(envelope.worldSnapshot).toEqual(worldSnapshot);

    worldSnapshot.residentChunks[0]!.payload.tiles[0] = 99;
    standalonePlayerState.position.x = 512;
    standalonePlayerDeathState.respawnSecondsRemaining = 999;
    standalonePlayerInventoryState.hotbar[0]!.amount = 1;
    droppedItemStates[0]!.amount = 1;
    cameraFollowOffset.x = 128;

    expect(envelope.worldSnapshot.residentChunks[0]!.payload.tiles[0]).not.toBe(99);
    expect(envelope.session.standalonePlayerState?.position.x).toBe(64);
    expect(envelope.session.standalonePlayerDeathState?.respawnSecondsRemaining).toBe(0.5);
    expect(envelope.session.standalonePlayerInventoryState.hotbar[0]).toEqual({
      itemId: 'dirt-block',
      amount: 64
    });
    expect(envelope.session.droppedItemStates[0]).toEqual({
      position: { x: 24, y: -14 },
      itemId: 'torch',
      amount: 6
    });
    expect(envelope.session.cameraFollowOffset.x).toBe(24);
  });

  it('preserves a placed starter dirt block together with the consumed hotbar stack count', () => {
    const world = new TileWorld(0);
    expect(world.setTile(1, -1, 9)).toBe(true);
    const standalonePlayerInventoryState = createDefaultPlayerInventoryState();
    standalonePlayerInventoryState.hotbar[0]!.amount = 63;

    const decoded = decodeWorldSaveEnvelope(
      JSON.parse(
        JSON.stringify(
          createWorldSaveEnvelope({
            worldSnapshot: world.createSnapshot(),
            standalonePlayerState: createPlayerState(),
            standalonePlayerDeathState: null,
            standalonePlayerInventoryState,
            droppedItemStates: [],
            cameraFollowOffset: { x: 0, y: 0 }
          })
        )
      )
    );

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(decoded.worldSnapshot);
    expect(restoredWorld.getTile(1, -1)).toBe(9);
    expect(decoded.session.standalonePlayerInventoryState.hotbar[0]).toEqual({
      itemId: 'dirt-block',
      amount: 63
    });
  });

  it('round-trips dropped-item entity stacks through save decode', () => {
    const world = new TileWorld(0);
    const droppedItemStates = [
      createDroppedItemState({
        position: { x: 24, y: -14 },
        itemId: 'torch',
        amount: 6
      }),
      createDroppedItemState({
        position: { x: -16, y: -14 },
        itemId: 'rope',
        amount: 3
      })
    ];

    const decoded = decodeWorldSaveEnvelope(
      JSON.parse(
        JSON.stringify(
          createWorldSaveEnvelope({
            worldSnapshot: world.createSnapshot(),
            standalonePlayerState: createPlayerState(),
            standalonePlayerDeathState: null,
            standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
            droppedItemStates,
            cameraFollowOffset: { x: 0, y: 0 }
          })
        )
      )
    );

    expect(decoded.session.droppedItemStates).toEqual(droppedItemStates);
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
        standalonePlayerDeathState: null,
        standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
        droppedItemStates: [],
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
    const standalonePlayerDeathState = createPlayerDeathState(0.25);

    const decoded = decodeWorldSaveEnvelope(
      JSON.parse(
        JSON.stringify(
          createWorldSaveEnvelope({
            worldSnapshot: world.createSnapshot(),
            standalonePlayerState,
            standalonePlayerDeathState,
            standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
            cameraFollowOffset: { x: 0, y: 0 }
          })
        )
      )
    );

    expect(decoded.session.standalonePlayerState).toEqual(standalonePlayerState);
    expect(decoded.session.standalonePlayerDeathState).toEqual(standalonePlayerDeathState);
  });

  it('defaults missing breath, hostile-contact invulnerability, fall-recovery, and death state on older standalone-player save payloads', () => {
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
      hostileContactInvulnerabilitySecondsRemaining: _omittedHostileContactInvulnerability,
      ...legacyStandalonePlayerState
    } = standalonePlayerState;

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
        session: {
          standalonePlayerState: legacyStandalonePlayerState,
          standalonePlayerDeathState: undefined,
          standalonePlayerInventoryState: undefined,
          droppedItemStates: undefined,
          cameraFollowOffset: { x: 0, y: 0 }
        },
        worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerState).toEqual({
      ...standalonePlayerState,
      breathSecondsRemaining: DEFAULT_PLAYER_MAX_BREATH_SECONDS,
      drowningDamageTickSecondsRemaining: DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
      fallDamageRecoverySecondsRemaining: 0,
      hostileContactInvulnerabilitySecondsRemaining:
        DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS
    });
    expect(decoded.session.standalonePlayerDeathState).toBeNull();
    expect(decoded.session.standalonePlayerInventoryState).toEqual(createDefaultPlayerInventoryState());
    expect(decoded.session.droppedItemStates).toEqual([]);
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
          standalonePlayerDeathState: null,
          standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
          droppedItemStates: [],
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
          standalonePlayerDeathState: null,
          standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
          droppedItemStates: [],
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
          standalonePlayerDeathState: null,
          standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
          droppedItemStates: [],
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

  it('rejects invalid standalone-player death state payloads', () => {
    const world = new TileWorld(0);

    expect(() =>
      decodeWorldSaveEnvelope({
        kind: WORLD_SAVE_ENVELOPE_KIND,
        version: WORLD_SAVE_ENVELOPE_VERSION,
        migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
        session: {
          standalonePlayerState: null,
          standalonePlayerDeathState: {
            respawnSecondsRemaining: -0.1
          },
          standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
          droppedItemStates: [],
          cameraFollowOffset: { x: 0, y: 0 }
        },
        worldSnapshot: world.createSnapshot()
      })
    ).toThrowError(
      /session\.standalonePlayerDeathState\.respawnSecondsRemaining must be a non-negative finite number/
    );
  });

  it('rejects invalid hotbar inventory payloads', () => {
    const world = new TileWorld(0);

    expect(() =>
      decodeWorldSaveEnvelope({
        kind: WORLD_SAVE_ENVELOPE_KIND,
        version: WORLD_SAVE_ENVELOPE_VERSION,
        migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
        session: {
          standalonePlayerState: null,
          standalonePlayerDeathState: null,
          standalonePlayerInventoryState: {
            hotbar: Array.from({ length: 10 }, () => null),
            selectedHotbarSlotIndex: 10
          },
          droppedItemStates: [],
          cameraFollowOffset: { x: 0, y: 0 }
        },
        worldSnapshot: world.createSnapshot()
      })
    ).toThrowError(
      /session\.standalonePlayerInventoryState\.selectedHotbarSlotIndex must be an integer between 0 and 9/
    );
  });

  it('rejects invalid dropped-item payloads', () => {
    const world = new TileWorld(0);

    expect(() =>
      decodeWorldSaveEnvelope({
        kind: WORLD_SAVE_ENVELOPE_KIND,
        version: WORLD_SAVE_ENVELOPE_VERSION,
        migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
        session: {
          standalonePlayerState: null,
          standalonePlayerDeathState: null,
          standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
          droppedItemStates: [
            {
              position: { x: 12, y: -4 },
              itemId: 'torch',
              amount: 0
            }
          ],
          cameraFollowOffset: { x: 0, y: 0 }
        },
        worldSnapshot: world.createSnapshot()
      })
    ).toThrowError(/session\.droppedItemStates\[0\]\.amount must be a positive integer/);
  });
});
