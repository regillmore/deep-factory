import { describe, expect, it, vi } from 'vitest';

import { CHUNK_SIZE } from './world/constants';
import { createPlayerDeathState } from './world/playerDeathState';
import { createDroppedItemState } from './world/droppedItem';
import { createPlayerInventoryState } from './world/playerInventory';
import { createPlayerEquipmentState } from './world/playerEquipment';
import { createPlayerState } from './world/playerState';
import { STARTER_DIRT_WALL_ID } from './world/starterWallPlacement';
import { TileWorld } from './world/world';
import { createWorldSessionSaveEnvelope } from './mainWorldSessionSave';

describe('createWorldSessionSaveEnvelope', () => {
  it('assembles the current world snapshot, standalone-player state, and camera follow offset', () => {
    const world = new TileWorld(0);
    const worldTileX = CHUNK_SIZE + 3;
    const worldTileY = -20;
    expect(world.setTile(worldTileX, worldTileY, 6)).toBe(true);

    const standalonePlayerState = createPlayerState({
      position: { x: 72, y: 96 },
      velocity: { x: -14, y: 28 },
      grounded: false,
      facing: 'left',
      health: 62,
      breathSecondsRemaining: 2.5,
      lavaDamageTickSecondsRemaining: 0.5,
      drowningDamageTickSecondsRemaining: 0.15,
      fallDamageRecoverySecondsRemaining: 0.2
    });
    const standalonePlayerDeathState = createPlayerDeathState(0.5);
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
    const cameraFollowOffset = { x: 18, y: -12 };
    const source = {
      createWorldSnapshot: vi.fn(() => world.createSnapshot()),
      getStandalonePlayerState: vi.fn(() => standalonePlayerState),
      getStandalonePlayerDeathState: vi.fn(() => standalonePlayerDeathState),
      getStandalonePlayerInventoryState: vi.fn(() => standalonePlayerInventoryState),
      getStandalonePlayerEquipmentState: vi.fn(() => standalonePlayerEquipmentState),
      getDroppedItemStates: vi.fn(() => droppedItemStates),
      getCameraFollowOffset: vi.fn(() => cameraFollowOffset)
    };

    const envelope = createWorldSessionSaveEnvelope({ source });

    expect(source.createWorldSnapshot).toHaveBeenCalledTimes(1);
    expect(source.getStandalonePlayerState).toHaveBeenCalledTimes(1);
    expect(source.getStandalonePlayerDeathState).toHaveBeenCalledTimes(1);
    expect(source.getStandalonePlayerInventoryState).toHaveBeenCalledTimes(1);
    expect(source.getStandalonePlayerEquipmentState).toHaveBeenCalledTimes(1);
    expect(source.getDroppedItemStates).toHaveBeenCalledTimes(1);
    expect(source.getCameraFollowOffset).toHaveBeenCalledTimes(1);
    expect(envelope.session).toEqual({
      standalonePlayerState,
      standalonePlayerDeathState,
      standalonePlayerInventoryState,
      standalonePlayerEquipmentState,
      droppedItemStates,
      cameraFollowOffset
    });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(envelope.worldSnapshot);
    expect(restoredWorld.getTile(worldTileX, worldTileY)).toBe(6);

    expect(world.setTile(worldTileX, worldTileY, 5)).toBe(true);
    standalonePlayerState.position.x = 999;
    standalonePlayerInventoryState.hotbar[0]!.amount = 1;
    standalonePlayerEquipmentState.head = null;
    cameraFollowOffset.x = 999;

    const restoredEnvelopeWorld = new TileWorld(0);
    restoredEnvelopeWorld.loadSnapshot(envelope.worldSnapshot);
    expect(restoredEnvelopeWorld.getTile(worldTileX, worldTileY)).toBe(6);
    expect(envelope.session.standalonePlayerState?.position.x).toBe(72);
    expect(envelope.session.standalonePlayerDeathState?.respawnSecondsRemaining).toBe(0.5);
    expect(envelope.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
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
      })
    );
    expect(envelope.session.standalonePlayerEquipmentState).toEqual(
      createPlayerEquipmentState({
        head: 'starter-helmet',
        legs: 'starter-greaves'
      })
    );
    expect(envelope.session.droppedItemStates).toEqual(droppedItemStates);
    expect(envelope.session.cameraFollowOffset.x).toBe(18);
  });

  it('preserves null standalone-player state and explicit migration metadata', () => {
    const source = {
      createWorldSnapshot: vi.fn(() => new TileWorld(0).createSnapshot()),
      getStandalonePlayerState: vi.fn(() => null),
      getStandalonePlayerDeathState: vi.fn(() => null),
      getStandalonePlayerInventoryState: vi.fn(() =>
        createPlayerInventoryState({
          hotbar: [{ itemId: 'pickaxe', amount: 1 }, ...Array.from({ length: 9 }, () => null)]
        })
      ),
      getStandalonePlayerEquipmentState: vi.fn(() =>
        createPlayerEquipmentState({
          body: 'starter-breastplate'
        })
      ),
      getDroppedItemStates: vi.fn(() => []),
      getCameraFollowOffset: vi.fn(() => ({ x: -24, y: 10 }))
    };
    const migration = {
      migratedFromVersion: 0,
      migratedAtEpochMs: 4321
    };

    const envelope = createWorldSessionSaveEnvelope({
      source,
      migration
    });

    expect(envelope.session.standalonePlayerState).toBeNull();
    expect(envelope.session.standalonePlayerDeathState).toBeNull();
    expect(envelope.session.standalonePlayerInventoryState).toEqual(
      createPlayerInventoryState({
        hotbar: [{ itemId: 'pickaxe', amount: 1 }, ...Array.from({ length: 9 }, () => null)]
      })
    );
    expect(envelope.session.standalonePlayerEquipmentState).toEqual(
      createPlayerEquipmentState({
        body: 'starter-breastplate'
      })
    );
    expect(envelope.session.droppedItemStates).toEqual([]);
    expect(envelope.session.cameraFollowOffset).toEqual({ x: -24, y: 10 });
    expect(envelope.migration).toEqual(migration);
  });

  it('captures placed dirt-wall runs together with the remaining dirt-wall hotbar stack count', () => {
    const world = new TileWorld(0);
    const dirtWallRun = [
      [CHUNK_SIZE - 1, -20],
      [CHUNK_SIZE, -20],
      [CHUNK_SIZE + 1, -20]
    ] as const;
    for (const [worldTileX, worldTileY] of dirtWallRun) {
      expect(world.setWall(worldTileX, worldTileY, STARTER_DIRT_WALL_ID)).toBe(true);
    }

    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [null, { itemId: 'dirt-wall', amount: 9 }, ...Array.from({ length: 8 }, () => null)],
      selectedHotbarSlotIndex: 1
    });
    const source = {
      createWorldSnapshot: vi.fn(() => world.createSnapshot()),
      getStandalonePlayerState: vi.fn(() => createPlayerState()),
      getStandalonePlayerDeathState: vi.fn(() => null),
      getStandalonePlayerInventoryState: vi.fn(() => standalonePlayerInventoryState),
      getStandalonePlayerEquipmentState: vi.fn(() => createPlayerEquipmentState()),
      getDroppedItemStates: vi.fn(() => []),
      getCameraFollowOffset: vi.fn(() => ({ x: 0, y: 0 }))
    };

    const envelope = createWorldSessionSaveEnvelope({ source });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(envelope.worldSnapshot);
    for (const [worldTileX, worldTileY] of dirtWallRun) {
      expect(restoredWorld.getWall(worldTileX, worldTileY)).toBe(STARTER_DIRT_WALL_ID);
    }
    expect(envelope.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-wall',
      amount: 9
    });
  });

  it('captures crafted wood-wall inventory stacks in the session save envelope', () => {
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'wood-wall', amount: 4 },
        { itemId: 'wood', amount: 1 },
        ...Array.from({ length: 8 }, () => null)
      ],
      selectedHotbarSlotIndex: 0
    });
    const source = {
      createWorldSnapshot: vi.fn(() => new TileWorld(0).createSnapshot()),
      getStandalonePlayerState: vi.fn(() => createPlayerState()),
      getStandalonePlayerDeathState: vi.fn(() => null),
      getStandalonePlayerInventoryState: vi.fn(() => standalonePlayerInventoryState),
      getStandalonePlayerEquipmentState: vi.fn(() => createPlayerEquipmentState()),
      getDroppedItemStates: vi.fn(() => []),
      getCameraFollowOffset: vi.fn(() => ({ x: 0, y: 0 }))
    };

    const envelope = createWorldSessionSaveEnvelope({ source });

    expect(envelope.session.standalonePlayerInventoryState).toEqual(standalonePlayerInventoryState);
  });
});
