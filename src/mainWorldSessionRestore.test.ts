import { describe, expect, it, vi } from 'vitest';

import { createWorldSaveEnvelope } from './mainWorldSave';
import { restoreWorldSessionFromSaveEnvelope } from './mainWorldSessionRestore';
import { createPlayerDeathState, type PlayerDeathState } from './world/playerDeathState';
import { createDroppedItemState, type DroppedItemState } from './world/droppedItem';
import {
  createDefaultPlayerInventoryState,
  createPlayerInventoryState,
  type PlayerInventoryState
} from './world/playerInventory';
import {
  createDefaultPlayerEquipmentState,
  createPlayerEquipmentState,
  type PlayerEquipmentState
} from './world/playerEquipment';
import { createPlayerState, type PlayerState } from './world/playerState';
import { CHUNK_SIZE } from './world/constants';
import { STARTER_DIRT_WALL_ID } from './world/starterWallPlacement';
import { TileWorld } from './world/world';

describe('restoreWorldSessionFromSaveEnvelope', () => {
  it('loads cloned world and session state into the target in restore order', () => {
    const world = new TileWorld(0);
    expect(world.setTile(0, 0, 6)).toBe(true);
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
      body: 'starter-breastplate'
    });
    const droppedItemStates = [
      createDroppedItemState({
        position: { x: 24, y: -14 },
        itemId: 'torch',
        amount: 6
      })
    ];
    const cameraFollowOffset = { x: 18, y: -12 };
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: world.createSnapshot(),
      standalonePlayerState,
      standalonePlayerDeathState,
      standalonePlayerInventoryState,
      standalonePlayerEquipmentState,
      droppedItemStates,
      cameraFollowOffset
    });
    const callOrder: string[] = [];
    let restoredWorldSnapshot: ReturnType<TileWorld['createSnapshot']> | null = null;
    let restoredPlayerState: PlayerState | null = null;
    let restoredPlayerDeathState: PlayerDeathState | null = null;
    let restoredPlayerInventoryState: PlayerInventoryState | null = null;
    let restoredPlayerEquipmentState: PlayerEquipmentState | null = null;
    let restoredDroppedItemStates: DroppedItemState[] | null = null;
    let restoredCameraFollowOffset: typeof cameraFollowOffset | null = null;
    const target = {
      loadWorldSnapshot: vi.fn((snapshot) => {
        callOrder.push('world');
        restoredWorldSnapshot = snapshot;
      }),
      restoreStandalonePlayerDeathState: vi.fn((deathState) => {
        callOrder.push('death');
        restoredPlayerDeathState = deathState;
      }),
      restoreStandalonePlayerState: vi.fn((playerState) => {
        callOrder.push('player');
        restoredPlayerState = playerState;
      }),
      restoreStandalonePlayerInventoryState: vi.fn((inventoryState) => {
        callOrder.push('inventory');
        restoredPlayerInventoryState = inventoryState;
      }),
      restoreStandalonePlayerEquipmentState: vi.fn((equipmentState) => {
        callOrder.push('equipment');
        restoredPlayerEquipmentState = equipmentState;
      }),
      restoreDroppedItemStates: vi.fn((nextDroppedItemStates) => {
        callOrder.push('drops');
        restoredDroppedItemStates = nextDroppedItemStates;
      }),
      restoreCameraFollowOffset: vi.fn((offset) => {
        callOrder.push('camera');
        restoredCameraFollowOffset = offset;
      })
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    expect(callOrder).toEqual([
      'world',
      'death',
      'player',
      'inventory',
      'equipment',
      'drops',
      'camera'
    ]);
    expect(target.loadWorldSnapshot).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerState).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerDeathState).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerInventoryState).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerEquipmentState).toHaveBeenCalledTimes(1);
    expect(target.restoreDroppedItemStates).toHaveBeenCalledTimes(1);
    expect(target.restoreCameraFollowOffset).toHaveBeenCalledTimes(1);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.restoredEnvelope).toEqual(envelope);
    expect(restoreResult.restoredEnvelope).not.toBe(envelope);

    envelope.worldSnapshot.residentChunks[0]!.payload.tiles[0] = 99;
    envelope.session.standalonePlayerState!.position.x = 999;
    envelope.session.standalonePlayerDeathState!.respawnSecondsRemaining = 999;
    envelope.session.standalonePlayerInventoryState.hotbar[0]!.amount = 1;
    envelope.session.standalonePlayerEquipmentState.body = null;
    envelope.session.droppedItemStates[0]!.amount = 1;
    envelope.session.cameraFollowOffset.x = 999;

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(restoredWorldSnapshot!);
    expect(restoredWorld.getTile(0, 0)).toBe(6);
    expect(restoredPlayerState).toEqual(standalonePlayerState);
    if (restoredPlayerState === null) {
      throw new Error('expected restored standalone-player state');
    }
    expect((restoredPlayerState as PlayerState).position.x).toBe(72);
    expect(restoredPlayerDeathState).toEqual(standalonePlayerDeathState);
    expect(restoredPlayerInventoryState).toEqual(standalonePlayerInventoryState);
    expect(restoredPlayerEquipmentState).toEqual(standalonePlayerEquipmentState);
    expect(restoredDroppedItemStates).toEqual(droppedItemStates);
    expect(restoredCameraFollowOffset).toEqual({ x: 18, y: -12 });
  });

  it('preserves null standalone-player session state while still restoring world and camera data', () => {
    const world = new TileWorld(0);
    expect(world.setTile(0, 0, 0)).toBe(true);
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: world.createSnapshot(),
      standalonePlayerState: null,
      standalonePlayerDeathState: null,
      cameraFollowOffset: { x: -24, y: 10 }
    });
    const target = {
      loadWorldSnapshot: vi.fn(),
      restoreStandalonePlayerState: vi.fn(),
      restoreStandalonePlayerDeathState: vi.fn(),
      restoreStandalonePlayerInventoryState: vi.fn(),
      restoreStandalonePlayerEquipmentState: vi.fn(),
      restoreDroppedItemStates: vi.fn(),
      restoreCameraFollowOffset: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    expect(target.loadWorldSnapshot).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerState).toHaveBeenCalledWith(null);
    expect(target.restoreStandalonePlayerDeathState).toHaveBeenCalledWith(null);
    expect(target.restoreStandalonePlayerInventoryState).toHaveBeenCalledWith(
      createDefaultPlayerInventoryState()
    );
    expect(target.restoreStandalonePlayerEquipmentState).toHaveBeenCalledWith(
      createDefaultPlayerEquipmentState()
    );
    expect(target.restoreDroppedItemStates).toHaveBeenCalledWith([]);
    expect(target.restoreCameraFollowOffset).toHaveBeenCalledWith({ x: -24, y: 10 });
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.restoredEnvelope).toEqual(envelope);
  });

  it('consolidates overlapping matching dropped-item restore payloads before applying them to the session target', () => {
    const world = new TileWorld(0);
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: world.createSnapshot(),
      standalonePlayerState: createPlayerState(),
      standalonePlayerDeathState: null,
      standalonePlayerInventoryState: createPlayerInventoryState(),
      standalonePlayerEquipmentState: createPlayerEquipmentState({
        head: 'starter-helmet'
      }),
      droppedItemStates: [
        createDroppedItemState({
          position: { x: 24, y: -14 },
          itemId: 'torch',
          amount: 600
        }),
        createDroppedItemState({
          position: { x: 28, y: -14 },
          itemId: 'torch',
          amount: 500
        }),
        createDroppedItemState({
          position: { x: 28, y: -14 },
          itemId: 'rope',
          amount: 3
        })
      ],
      cameraFollowOffset: { x: 0, y: 0 }
    });
    let restoredDroppedItemStates: DroppedItemState[] | null = null;
    const target = {
      loadWorldSnapshot: vi.fn(),
      restoreStandalonePlayerState: vi.fn(),
      restoreStandalonePlayerDeathState: vi.fn(),
      restoreStandalonePlayerInventoryState: vi.fn(),
      restoreStandalonePlayerEquipmentState: vi.fn(),
      restoreDroppedItemStates: vi.fn((nextDroppedItemStates) => {
        restoredDroppedItemStates = nextDroppedItemStates;
      }),
      restoreCameraFollowOffset: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    expect(target.restoreDroppedItemStates).toHaveBeenCalledWith([
      {
        position: { x: 24, y: -14 },
        itemId: 'torch',
        amount: 999
      },
      {
        position: { x: 28, y: -14 },
        itemId: 'torch',
        amount: 101
      },
      {
        position: { x: 28, y: -14 },
        itemId: 'rope',
        amount: 3
      }
    ]);
    expect(restoredDroppedItemStates).not.toBe(envelope.session.droppedItemStates);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(true);
    expect(restoreResult.restoredEnvelope.session.droppedItemStates).toEqual([
      {
        position: { x: 24, y: -14 },
        itemId: 'torch',
        amount: 999
      },
      {
        position: { x: 28, y: -14 },
        itemId: 'torch',
        amount: 101
      },
      {
        position: { x: 28, y: -14 },
        itemId: 'rope',
        amount: 3
      }
    ]);
  });

  it('restores placed dirt-wall runs together with the remaining dirt-wall hotbar stack count', () => {
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
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: world.createSnapshot(),
      standalonePlayerState: createPlayerState(),
      standalonePlayerDeathState: null,
      standalonePlayerInventoryState,
      droppedItemStates: [],
      cameraFollowOffset: { x: 0, y: 0 }
    });
    let restoredWorldSnapshot: ReturnType<TileWorld['createSnapshot']> | null = null;
    let restoredPlayerInventoryState: PlayerInventoryState | null = null;
    const target = {
      loadWorldSnapshot: vi.fn((snapshot) => {
        restoredWorldSnapshot = snapshot;
      }),
      restoreStandalonePlayerState: vi.fn(),
      restoreStandalonePlayerDeathState: vi.fn(),
      restoreStandalonePlayerInventoryState: vi.fn((inventoryState) => {
        restoredPlayerInventoryState = inventoryState;
      }),
      restoreStandalonePlayerEquipmentState: vi.fn(),
      restoreDroppedItemStates: vi.fn(),
      restoreCameraFollowOffset: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(restoredWorldSnapshot!);
    for (const [worldTileX, worldTileY] of dirtWallRun) {
      expect(restoredWorld.getWall(worldTileX, worldTileY)).toBe(STARTER_DIRT_WALL_ID);
    }
    expect(restoredPlayerInventoryState).toEqual(standalonePlayerInventoryState);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.restoredEnvelope.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-wall',
      amount: 9
    });
  });

  it('restores crafted wood-wall inventory stacks through the session restore path', () => {
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [
        { itemId: 'wood-wall', amount: 4 },
        { itemId: 'wood', amount: 1 },
        ...Array.from({ length: 8 }, () => null)
      ],
      selectedHotbarSlotIndex: 0
    });
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: new TileWorld(0).createSnapshot(),
      standalonePlayerState: createPlayerState(),
      standalonePlayerDeathState: null,
      standalonePlayerInventoryState,
      droppedItemStates: [],
      cameraFollowOffset: { x: 0, y: 0 }
    });
    let restoredPlayerInventoryState: PlayerInventoryState | null = null;
    const target = {
      loadWorldSnapshot: vi.fn(),
      restoreStandalonePlayerState: vi.fn(),
      restoreStandalonePlayerDeathState: vi.fn(),
      restoreStandalonePlayerInventoryState: vi.fn((inventoryState) => {
        restoredPlayerInventoryState = inventoryState;
      }),
      restoreStandalonePlayerEquipmentState: vi.fn(),
      restoreDroppedItemStates: vi.fn(),
      restoreCameraFollowOffset: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    expect(restoredPlayerInventoryState).toEqual(standalonePlayerInventoryState);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.restoredEnvelope.session.standalonePlayerInventoryState).toEqual(
      standalonePlayerInventoryState
    );
  });
});
