import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './world/constants';
import { encodeResidentChunkSnapshot } from './world/chunkSnapshot';
import { createPlayerDeathState } from './world/playerDeathState';
import { createDroppedItemState } from './world/droppedItem';
import { createDefaultPlayerInventoryState, createPlayerInventoryState } from './world/playerInventory';
import {
  createDefaultPlayerEquipmentState,
  createPlayerEquipmentState
} from './world/playerEquipment';
import {
  createPlayerState,
  DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS,
  DEFAULT_PLAYER_MAX_BREATH_SECONDS,
  DEFAULT_PLAYER_MAX_HEALTH
} from './world/playerState';
import { STARTER_ROPE_TILE_ID } from './world/starterRopePlacement';
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
    const standalonePlayerEquipmentState = createPlayerEquipmentState({
      head: 'starter-helmet',
      legs: 'starter-greaves'
    });
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
      standalonePlayerEquipmentState,
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
      standalonePlayerEquipmentState,
      droppedItemStates,
      cameraFollowOffset
    });
    expect(envelope.worldSnapshot).toEqual(worldSnapshot);

    worldSnapshot.residentChunks[0]!.payload.tiles[0] = 99;
    standalonePlayerState.position.x = 512;
    standalonePlayerDeathState.respawnSecondsRemaining = 999;
    standalonePlayerInventoryState.hotbar[0]!.amount = 1;
    standalonePlayerEquipmentState.head = null;
    droppedItemStates[0]!.amount = 1;
    cameraFollowOffset.x = 128;

    expect(envelope.worldSnapshot.residentChunks[0]!.payload.tiles[0]).not.toBe(99);
    expect(envelope.session.standalonePlayerState?.position.x).toBe(64);
    expect(envelope.session.standalonePlayerDeathState?.respawnSecondsRemaining).toBe(0.5);
    expect(envelope.session.standalonePlayerInventoryState.hotbar[0]).toEqual({
      itemId: 'pickaxe',
      amount: 1
    });
    expect(envelope.session.standalonePlayerEquipmentState).toEqual(
      createPlayerEquipmentState({
        head: 'starter-helmet',
        legs: 'starter-greaves'
      })
    );
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
    standalonePlayerInventoryState.hotbar[1]!.amount = 63;

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
    expect(decoded.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-block',
      amount: 63
    });
  });

  it('preserves a placed stone block together with the consumed stone-block hotbar stack count', () => {
    const world = new TileWorld(0);
    expect(world.setTile(1, -10, 1)).toBe(true);
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'stone-block', amount: 11 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        ...Array.from({ length: 3 }, () => null)
      ],
      selectedHotbarSlotIndex: 1
    });

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
    expect(restoredWorld.getTile(1, -10)).toBe(1);
    expect(decoded.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'stone-block',
      amount: 11
    });
  });

  it('preserves a placed rope tile together with the consumed rope stack count', () => {
    const world = new TileWorld(0);
    expect(world.setTile(1, -1, STARTER_ROPE_TILE_ID)).toBe(true);
    const standalonePlayerInventoryState = createDefaultPlayerInventoryState();
    standalonePlayerInventoryState.hotbar[3]!.amount = 23;

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
    expect(restoredWorld.getTile(1, -1)).toBe(STARTER_ROPE_TILE_ID);
    expect(decoded.session.standalonePlayerInventoryState.hotbar[3]).toEqual({
      itemId: 'rope',
      amount: 23
    });
  });

  it('round-trips a returned rope pickup stack after a placed rope tile is removed', () => {
    const world = new TileWorld(0);
    expect(world.setTile(1, -1, STARTER_ROPE_TILE_ID)).toBe(true);
    expect(world.setTile(1, -1, 0)).toBe(true);
    const droppedItemStates = [
      createDroppedItemState({
        position: { x: 24, y: -8 },
        itemId: 'rope',
        amount: 1
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

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(decoded.worldSnapshot);
    expect(restoredWorld.getTile(1, -1)).toBe(0);
    expect(decoded.session.droppedItemStates).toEqual(droppedItemStates);
  });

  it('round-trips reordered hotbar slot order and selection through save decode', () => {
    const world = new TileWorld(0);
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        { itemId: 'umbrella', amount: 1 },
        { itemId: 'bug-net', amount: 1 },
        { itemId: 'spear', amount: 1 }
      ],
      selectedHotbarSlotIndex: 3
    });

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

    expect(decoded.session.standalonePlayerInventoryState).toEqual(standalonePlayerInventoryState);
  });

  it('round-trips dropped-item entity stacks including mined dirt-block refunds through save decode', () => {
    const world = new TileWorld(0);
    const droppedItemStates = [
      createDroppedItemState({
        position: { x: 24, y: 8 },
        itemId: 'dirt-block',
        amount: 1
      }),
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

  it('round-trips stone-block inventory stacks and mined stone-block refunds through save decode', () => {
    const world = new TileWorld(0);
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'stone-block', amount: 12 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        { itemId: 'umbrella', amount: 1 },
        { itemId: 'bug-net', amount: 1 },
        null,
        { itemId: 'spear', amount: 1 }
      ],
      selectedHotbarSlotIndex: 1
    });
    const droppedItemStates = [
      createDroppedItemState({
        position: { x: 24, y: 8 },
        itemId: 'stone-block',
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
            standalonePlayerInventoryState,
            droppedItemStates,
            cameraFollowOffset: { x: 0, y: 0 }
          })
        )
      )
    );

    expect(decoded.session.standalonePlayerInventoryState).toEqual(standalonePlayerInventoryState);
    expect(decoded.session.droppedItemStates).toEqual(droppedItemStates);
  });

  it('round-trips crafted workbench inventory stacks through save decode', () => {
    const world = new TileWorld(0);
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 44 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        { itemId: 'workbench', amount: 2 },
        { itemId: 'umbrella', amount: 1 },
        { itemId: 'spear', amount: 1 }
      ],
      selectedHotbarSlotIndex: 7
    });

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

    expect(decoded.session.standalonePlayerInventoryState).toEqual(standalonePlayerInventoryState);
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
        standalonePlayerEquipmentState: createDefaultPlayerEquipmentState(),
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

  it('round-trips equipped starter armor through save decode', () => {
    const world = new TileWorld(0);

    const decoded = decodeWorldSaveEnvelope(
      JSON.parse(
        JSON.stringify(
          createWorldSaveEnvelope({
            worldSnapshot: world.createSnapshot(),
            standalonePlayerState: createPlayerState(),
            standalonePlayerDeathState: null,
            standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
            standalonePlayerEquipmentState: createPlayerEquipmentState({
              body: 'starter-breastplate'
            }),
            droppedItemStates: [],
            cameraFollowOffset: { x: 0, y: 0 }
          })
        )
      )
    );

    expect(decoded.session.standalonePlayerEquipmentState).toEqual(
      createPlayerEquipmentState({
        body: 'starter-breastplate'
      })
    );
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

  it('round-trips healing-potion stacks together with current player health through save decode', () => {
    const world = new TileWorld(0);
    const standalonePlayerState = createPlayerState({
      health: 42,
      breathSecondsRemaining: 6
    });
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'healing-potion', amount: 2 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        ...Array.from({ length: 3 }, () => null)
      ],
      selectedHotbarSlotIndex: 4
    });

    const decoded = decodeWorldSaveEnvelope(
      JSON.parse(
        JSON.stringify(
          createWorldSaveEnvelope({
            worldSnapshot: world.createSnapshot(),
            standalonePlayerState,
            standalonePlayerDeathState: null,
            standalonePlayerInventoryState,
            droppedItemStates: [],
            cameraFollowOffset: { x: 0, y: 0 }
          })
        )
      )
    );

    expect(decoded.session.standalonePlayerState?.health).toBe(42);
    expect(decoded.session.standalonePlayerInventoryState.hotbar[4]).toEqual({
      itemId: 'healing-potion',
      amount: 2
    });
  });

  it('round-trips upgraded player max health through save decode', () => {
    const world = new TileWorld(0);
    const standalonePlayerState = createPlayerState({
      maxHealth: 140,
      health: 118,
      breathSecondsRemaining: 6
    });

    const decoded = decodeWorldSaveEnvelope(
      JSON.parse(
        JSON.stringify(
          createWorldSaveEnvelope({
            worldSnapshot: world.createSnapshot(),
            standalonePlayerState,
            standalonePlayerDeathState: null,
            standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
            droppedItemStates: [],
            cameraFollowOffset: { x: 0, y: 0 }
          })
        )
      )
    );

    expect(decoded.session.standalonePlayerState).toEqual(standalonePlayerState);
  });

  it('defaults missing max health, breath, hostile-contact invulnerability, fall-recovery, and death state on older standalone-player save payloads', () => {
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
      maxHealth: _omittedMaxHealth,
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
      maxHealth: DEFAULT_PLAYER_MAX_HEALTH,
      breathSecondsRemaining: DEFAULT_PLAYER_MAX_BREATH_SECONDS,
      drowningDamageTickSecondsRemaining: DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
      fallDamageRecoverySecondsRemaining: 0,
      hostileContactInvulnerabilitySecondsRemaining:
        DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS
    });
    expect(decoded.session.standalonePlayerDeathState).toBeNull();
    expect(decoded.session.standalonePlayerInventoryState).toEqual(createDefaultPlayerInventoryState());
    expect(decoded.session.standalonePlayerEquipmentState).toEqual(
      createDefaultPlayerEquipmentState()
    );
    expect(decoded.session.droppedItemStates).toEqual([]);
  });

  it('adds a starter pickaxe into the first empty slot when older save payloads lack one', () => {
    const world = new TileWorld(0);

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
      session: {
        standalonePlayerState: createPlayerState(),
        standalonePlayerDeathState: null,
        standalonePlayerInventoryState: {
          hotbar: [
            { itemId: 'dirt-block', amount: 64 },
            { itemId: 'torch', amount: 20 },
            { itemId: 'rope', amount: 24 },
            ...Array.from({ length: 7 }, () => null)
          ],
          selectedHotbarSlotIndex: 2
        },
        droppedItemStates: [],
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerInventoryState).toEqual({
      hotbar: [
        { itemId: 'dirt-block', amount: 64 },
        { itemId: 'torch', amount: 20 },
        { itemId: 'rope', amount: 24 },
        { itemId: 'pickaxe', amount: 1 },
        { itemId: 'healing-potion', amount: 3 },
        { itemId: 'heart-crystal', amount: 1 },
        { itemId: 'sword', amount: 1 },
        { itemId: 'umbrella', amount: 1 },
        { itemId: 'bug-net', amount: 1 },
        { itemId: 'spear', amount: 1 }
      ],
      selectedHotbarSlotIndex: 2
    });
  });

  it('adds starter healing potions into the first empty slot when older save payloads lack them', () => {
    const world = new TileWorld(0);

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
      session: {
        standalonePlayerState: createPlayerState(),
        standalonePlayerDeathState: null,
        standalonePlayerInventoryState: {
          hotbar: [
            { itemId: 'pickaxe', amount: 1 },
            { itemId: 'dirt-block', amount: 64 },
            { itemId: 'torch', amount: 20 },
            { itemId: 'rope', amount: 24 },
            null,
            ...Array.from({ length: 5 }, () => null)
          ],
          selectedHotbarSlotIndex: 0
        },
        droppedItemStates: [],
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerInventoryState.hotbar[4]).toEqual({
      itemId: 'healing-potion',
      amount: 3
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[5]).toEqual({
      itemId: 'heart-crystal',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[6]).toEqual({
      itemId: 'sword',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[7]).toEqual({
      itemId: 'umbrella',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[8]).toEqual({
      itemId: 'bug-net',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[9]).toEqual({
      itemId: 'spear',
      amount: 1
    });
  });

  it('adds a starter heart crystal into the first empty slot when older save payloads lack one', () => {
    const world = new TileWorld(0);

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
      session: {
        standalonePlayerState: createPlayerState(),
        standalonePlayerDeathState: null,
        standalonePlayerInventoryState: {
          hotbar: [
            { itemId: 'pickaxe', amount: 1 },
            { itemId: 'dirt-block', amount: 64 },
            { itemId: 'torch', amount: 20 },
            { itemId: 'rope', amount: 24 },
            { itemId: 'healing-potion', amount: 3 },
            null,
            ...Array.from({ length: 4 }, () => null)
          ],
          selectedHotbarSlotIndex: 0
        },
        droppedItemStates: [],
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerInventoryState.hotbar[5]).toEqual({
      itemId: 'heart-crystal',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[6]).toEqual({
      itemId: 'sword',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[7]).toEqual({
      itemId: 'umbrella',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[8]).toEqual({
      itemId: 'bug-net',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[9]).toEqual({
      itemId: 'spear',
      amount: 1
    });
  });

  it('adds a starter sword into the first empty slot when older save payloads lack one', () => {
    const world = new TileWorld(0);

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
      session: {
        standalonePlayerState: createPlayerState(),
        standalonePlayerDeathState: null,
        standalonePlayerInventoryState: {
          hotbar: [
            { itemId: 'pickaxe', amount: 1 },
            { itemId: 'dirt-block', amount: 64 },
            { itemId: 'torch', amount: 20 },
            { itemId: 'rope', amount: 24 },
            { itemId: 'healing-potion', amount: 3 },
            { itemId: 'heart-crystal', amount: 1 },
            null,
            ...Array.from({ length: 3 }, () => null)
          ],
          selectedHotbarSlotIndex: 0
        },
        droppedItemStates: [],
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerInventoryState.hotbar[6]).toEqual({
      itemId: 'sword',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[7]).toEqual({
      itemId: 'umbrella',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[8]).toEqual({
      itemId: 'bug-net',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[9]).toEqual({
      itemId: 'spear',
      amount: 1
    });
  });

  it('adds a starter umbrella into the first empty slot when older save payloads lack one', () => {
    const world = new TileWorld(0);

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
      session: {
        standalonePlayerState: createPlayerState(),
        standalonePlayerDeathState: null,
        standalonePlayerInventoryState: {
          hotbar: [
            { itemId: 'pickaxe', amount: 1 },
            { itemId: 'dirt-block', amount: 64 },
            { itemId: 'torch', amount: 20 },
            { itemId: 'rope', amount: 24 },
            { itemId: 'healing-potion', amount: 3 },
            { itemId: 'heart-crystal', amount: 1 },
            { itemId: 'sword', amount: 1 },
            null,
            { itemId: 'gel', amount: 2 },
            null
          ],
          selectedHotbarSlotIndex: 8
        },
        droppedItemStates: [],
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerInventoryState.hotbar[7]).toEqual({
      itemId: 'umbrella',
      amount: 1
    });
    expect(decoded.session.standalonePlayerInventoryState.hotbar[9]).toEqual({
      itemId: 'spear',
      amount: 1
    });
  });

  it('adds a starter spear into the last empty slot when older save payloads lack one', () => {
    const world = new TileWorld(0);

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
      session: {
        standalonePlayerState: createPlayerState(),
        standalonePlayerDeathState: null,
        standalonePlayerInventoryState: {
          hotbar: [
            { itemId: 'pickaxe', amount: 1 },
            { itemId: 'dirt-block', amount: 64 },
            { itemId: 'torch', amount: 20 },
            { itemId: 'rope', amount: 24 },
            { itemId: 'healing-potion', amount: 3 },
            { itemId: 'heart-crystal', amount: 1 },
            { itemId: 'sword', amount: 1 },
            { itemId: 'umbrella', amount: 1 },
            { itemId: 'gel', amount: 2 },
            null
          ],
          selectedHotbarSlotIndex: 8
        },
        droppedItemStates: [],
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerInventoryState.hotbar[9]).toEqual({
      itemId: 'spear',
      amount: 1
    });
  });

  it('adds a starter bug net into the first empty slot when older save payloads lack one', () => {
    const world = new TileWorld(0);

    const decoded = decodeWorldSaveEnvelope({
      kind: WORLD_SAVE_ENVELOPE_KIND,
      version: WORLD_SAVE_ENVELOPE_VERSION,
      migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
      session: {
        standalonePlayerState: createPlayerState(),
        standalonePlayerDeathState: null,
        standalonePlayerInventoryState: {
          hotbar: [
            { itemId: 'pickaxe', amount: 1 },
            { itemId: 'dirt-block', amount: 64 },
            { itemId: 'torch', amount: 20 },
            { itemId: 'rope', amount: 24 },
            { itemId: 'healing-potion', amount: 3 },
            { itemId: 'heart-crystal', amount: 1 },
            { itemId: 'sword', amount: 1 },
            { itemId: 'umbrella', amount: 1 },
            null,
            { itemId: 'spear', amount: 1 }
          ],
          selectedHotbarSlotIndex: 7
        },
        droppedItemStates: [],
        cameraFollowOffset: { x: 0, y: 0 }
      },
      worldSnapshot: world.createSnapshot()
    });

    expect(decoded.session.standalonePlayerInventoryState.hotbar[8]).toEqual({
      itemId: 'bug-net',
      amount: 1
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
