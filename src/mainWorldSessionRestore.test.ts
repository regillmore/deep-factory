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
import { createSmallTreeGrowthState, type SmallTreeGrowthState } from './world/smallTreeGrowth';
import { createPlayerState, type PlayerState } from './world/playerState';
import { CHUNK_SIZE } from './world/constants';
import {
  STARTER_BED_LEFT_TILE_ID,
  STARTER_BED_RIGHT_TILE_ID
} from './world/starterBedPlacement';
import {
  STARTER_DOOR_BOTTOM_TILE_ID,
  STARTER_DOOR_OPEN_BOTTOM_TILE_ID,
  STARTER_DOOR_OPEN_TOP_TILE_ID,
  STARTER_DOOR_TOP_TILE_ID
} from './world/starterDoorPlacement';
import { STARTER_DIRT_WALL_ID, STARTER_WOOD_WALL_ID } from './world/starterWallPlacement';
import { TileWorld } from './world/world';

describe('restoreWorldSessionFromSaveEnvelope', () => {
  it('loads cloned world and session state into the target in restore order', () => {
    const world = new TileWorld(0);
    expect(world.setTile(0, 0, 6)).toBe(true);
    expect(world.setTile(6, -1, STARTER_BED_LEFT_TILE_ID)).toBe(true);
    expect(world.setTile(7, -1, STARTER_BED_RIGHT_TILE_ID)).toBe(true);
    const standalonePlayerState = createPlayerState({
      position: { x: 72, y: 96 },
      velocity: { x: -14, y: 28 },
      grounded: false,
      facing: 'left',
      health: 62,
      maxMana: 40,
      mana: 18,
      manaRegenDelaySecondsRemaining: 0.6,
      manaRegenTickSecondsRemaining: 0.1,
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
    const claimedBedCheckpoint = {
      leftTileX: 6,
      tileY: -1
    };
    const cameraFollowOffset = { x: 18, y: -12 };
    const smallTreeGrowthState = {
      ticksUntilNextGrowth: 14,
      nextWindowIndex: 2
    };
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: world.createSnapshot(),
      standalonePlayerState,
      standalonePlayerDeathState,
      standalonePlayerInventoryState,
      standalonePlayerEquipmentState,
      droppedItemStates,
      claimedBedCheckpoint,
      cameraFollowOffset,
      smallTreeGrowthState
    });
    const callOrder: string[] = [];
    let restoredWorldSnapshot: ReturnType<TileWorld['createSnapshot']> | null = null;
    let restoredPlayerState: PlayerState | null = null;
    let restoredPlayerDeathState: PlayerDeathState | null = null;
    let restoredPlayerInventoryState: PlayerInventoryState | null = null;
    let restoredPlayerEquipmentState: PlayerEquipmentState | null = null;
    let restoredDroppedItemStates: DroppedItemState[] | null = null;
    let restoredClaimedBedCheckpoint: typeof claimedBedCheckpoint | null = null;
    let restoredCameraFollowOffset: typeof cameraFollowOffset | null = null;
    let restoredSmallTreeGrowthState: SmallTreeGrowthState | null = null;
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
      restoreClaimedBedCheckpoint: vi.fn((nextClaimedBedCheckpoint) => {
        callOrder.push('claimed-bed');
        restoredClaimedBedCheckpoint = nextClaimedBedCheckpoint;
      }),
      restoreCameraFollowOffset: vi.fn((offset) => {
        callOrder.push('camera');
        restoredCameraFollowOffset = offset;
      }),
      restoreSmallTreeGrowthState: vi.fn((nextSmallTreeGrowthState) => {
        callOrder.push('small-tree-growth');
        restoredSmallTreeGrowthState = nextSmallTreeGrowthState;
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
      'claimed-bed',
      'camera',
      'small-tree-growth'
    ]);
    expect(target.loadWorldSnapshot).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerState).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerDeathState).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerInventoryState).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerEquipmentState).toHaveBeenCalledTimes(1);
    expect(target.restoreDroppedItemStates).toHaveBeenCalledTimes(1);
    expect(target.restoreClaimedBedCheckpoint).toHaveBeenCalledTimes(1);
    expect(target.restoreCameraFollowOffset).toHaveBeenCalledTimes(1);
    expect(target.restoreSmallTreeGrowthState).toHaveBeenCalledTimes(1);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
    expect(restoreResult.restoredEnvelope).toEqual(envelope);
    expect(restoreResult.restoredEnvelope).not.toBe(envelope);

    envelope.worldSnapshot.residentChunks[0]!.payload.tiles[0] = 99;
    envelope.session.standalonePlayerState!.position.x = 999;
    envelope.session.standalonePlayerDeathState!.respawnSecondsRemaining = 999;
    envelope.session.standalonePlayerInventoryState.hotbar[0]!.amount = 1;
    envelope.session.standalonePlayerEquipmentState.body = null;
    envelope.session.droppedItemStates[0]!.amount = 1;
    claimedBedCheckpoint.leftTileX = 18;
    envelope.session.cameraFollowOffset.x = 999;
    envelope.session.smallTreeGrowthState.ticksUntilNextGrowth = 1;

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
    expect(restoredClaimedBedCheckpoint).toEqual({
      leftTileX: 6,
      tileY: -1
    });
    expect(restoredCameraFollowOffset).toEqual({ x: 18, y: -12 });
    expect(restoredSmallTreeGrowthState).toEqual({
      ticksUntilNextGrowth: 14,
      nextWindowIndex: 2
    });
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
      restoreClaimedBedCheckpoint: vi.fn(),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
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
    expect(target.restoreClaimedBedCheckpoint).toHaveBeenCalledWith(null);
    expect(target.restoreCameraFollowOffset).toHaveBeenCalledWith({ x: -24, y: 10 });
    expect(target.restoreSmallTreeGrowthState).toHaveBeenCalledWith(createSmallTreeGrowthState());
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
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
      restoreClaimedBedCheckpoint: vi.fn(),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
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
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
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
      restoreClaimedBedCheckpoint: vi.fn(),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
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
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
    expect(restoreResult.restoredEnvelope.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'dirt-wall',
      amount: 9
    });
  });

  it('restores placed wood-wall runs together with the remaining wood-wall hotbar stack count', () => {
    const world = new TileWorld(0);
    const woodWallRun = [
      [CHUNK_SIZE - 1, -24],
      [CHUNK_SIZE, -24],
      [CHUNK_SIZE + 1, -24]
    ] as const;
    for (const [worldTileX, worldTileY] of woodWallRun) {
      expect(world.setWall(worldTileX, worldTileY, STARTER_WOOD_WALL_ID)).toBe(true);
    }
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [null, { itemId: 'wood-wall', amount: 5 }, ...Array.from({ length: 8 }, () => null)],
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
      restoreClaimedBedCheckpoint: vi.fn(),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(restoredWorldSnapshot!);
    for (const [worldTileX, worldTileY] of woodWallRun) {
      expect(restoredWorld.getWall(worldTileX, worldTileY)).toBe(STARTER_WOOD_WALL_ID);
    }
    expect(restoredPlayerInventoryState).toEqual(standalonePlayerInventoryState);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
    expect(restoreResult.restoredEnvelope.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'wood-wall',
      amount: 5
    });
  });

  it('restores placed closed and open door pairs together with the remaining door stack count', () => {
    const world = new TileWorld(0);
    expect(world.setTile(5, -2, 1)).toBe(true);
    expect(world.setTile(5, -1, 1)).toBe(true);
    expect(world.setTile(7, -2, 1)).toBe(true);
    expect(world.setTile(7, -1, 1)).toBe(true);
    expect(world.setTile(9, -2, 1)).toBe(true);
    expect(world.setTile(9, -1, 1)).toBe(true);
    expect(world.setTile(6, 0, 1)).toBe(true);
    expect(world.setTile(8, 0, 1)).toBe(true);
    expect(world.setTile(6, -2, STARTER_DOOR_TOP_TILE_ID)).toBe(true);
    expect(world.setTile(6, -1, STARTER_DOOR_BOTTOM_TILE_ID)).toBe(true);
    expect(world.setTile(8, -2, STARTER_DOOR_OPEN_TOP_TILE_ID)).toBe(true);
    expect(world.setTile(8, -1, STARTER_DOOR_OPEN_BOTTOM_TILE_ID)).toBe(true);
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [null, { itemId: 'door', amount: 2 }, ...Array.from({ length: 8 }, () => null)],
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
      restoreClaimedBedCheckpoint: vi.fn(),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(restoredWorldSnapshot!);
    expect(restoredWorld.getTile(6, -2)).toBe(STARTER_DOOR_TOP_TILE_ID);
    expect(restoredWorld.getTile(6, -1)).toBe(STARTER_DOOR_BOTTOM_TILE_ID);
    expect(restoredWorld.getTile(8, -2)).toBe(STARTER_DOOR_OPEN_TOP_TILE_ID);
    expect(restoredWorld.getTile(8, -1)).toBe(STARTER_DOOR_OPEN_BOTTOM_TILE_ID);
    expect(restoredPlayerInventoryState).toEqual(standalonePlayerInventoryState);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
    expect(restoreResult.restoredEnvelope.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'door',
      amount: 2
    });
  });

  it('restores placed bed pairs together with the remaining bed stack count', () => {
    const world = new TileWorld(0);
    expect(world.setTile(6, -1, STARTER_BED_LEFT_TILE_ID)).toBe(true);
    expect(world.setTile(7, -1, STARTER_BED_RIGHT_TILE_ID)).toBe(true);
    const standalonePlayerInventoryState = createPlayerInventoryState({
      hotbar: [null, { itemId: 'bed', amount: 2 }, ...Array.from({ length: 8 }, () => null)],
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
      restoreClaimedBedCheckpoint: vi.fn(),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(restoredWorldSnapshot!);
    expect(restoredWorld.getTile(6, -1)).toBe(STARTER_BED_LEFT_TILE_ID);
    expect(restoredWorld.getTile(7, -1)).toBe(STARTER_BED_RIGHT_TILE_ID);
    expect(restoredPlayerInventoryState).toEqual(standalonePlayerInventoryState);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
    expect(restoreResult.restoredEnvelope.session.standalonePlayerInventoryState.hotbar[1]).toEqual({
      itemId: 'bed',
      amount: 2
    });
  });

  it('strips malformed door remnants from restored world snapshots while preserving complete pairs', () => {
    const malformedWorld = new TileWorld(0);
    const doorBottomWorldTileY = -20;

    expect(malformedWorld.setTile(2, doorBottomWorldTileY - 1, STARTER_DOOR_TOP_TILE_ID)).toBe(true);
    expect(malformedWorld.setTile(4, doorBottomWorldTileY - 1, STARTER_DOOR_OPEN_TOP_TILE_ID)).toBe(true);
    expect(malformedWorld.setTile(4, doorBottomWorldTileY, STARTER_DOOR_BOTTOM_TILE_ID)).toBe(true);
    expect(malformedWorld.setTile(6, doorBottomWorldTileY - 1, STARTER_DOOR_OPEN_TOP_TILE_ID)).toBe(true);
    expect(malformedWorld.setTile(6, doorBottomWorldTileY, STARTER_DOOR_OPEN_BOTTOM_TILE_ID)).toBe(true);

    const envelope = {
      ...createWorldSaveEnvelope({
        worldSnapshot: new TileWorld(0).createSnapshot(),
        standalonePlayerState: createPlayerState(),
        standalonePlayerDeathState: null,
        droppedItemStates: [],
        cameraFollowOffset: { x: 0, y: 0 }
      }),
      worldSnapshot: malformedWorld.createSnapshot()
    };

    let restoredWorldSnapshot: ReturnType<TileWorld['createSnapshot']> | null = null;
    const target = {
      loadWorldSnapshot: vi.fn((snapshot) => {
        restoredWorldSnapshot = snapshot;
      }),
      restoreStandalonePlayerState: vi.fn(),
      restoreStandalonePlayerDeathState: vi.fn(),
      restoreStandalonePlayerInventoryState: vi.fn(),
      restoreStandalonePlayerEquipmentState: vi.fn(),
      restoreDroppedItemStates: vi.fn(),
      restoreClaimedBedCheckpoint: vi.fn(),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(restoredWorldSnapshot!);
    expect(restoredWorld.getTile(2, doorBottomWorldTileY - 1)).toBe(0);
    expect(restoredWorld.getTile(4, doorBottomWorldTileY - 1)).toBe(0);
    expect(restoredWorld.getTile(4, doorBottomWorldTileY)).toBe(0);
    expect(restoredWorld.getTile(6, doorBottomWorldTileY - 1)).toBe(STARTER_DOOR_OPEN_TOP_TILE_ID);
    expect(restoredWorld.getTile(6, doorBottomWorldTileY)).toBe(STARTER_DOOR_OPEN_BOTTOM_TILE_ID);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
    expect(restoreResult.restoredEnvelope.worldSnapshot).toEqual(restoredWorldSnapshot);
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
      restoreClaimedBedCheckpoint: vi.fn(),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    expect(restoredPlayerInventoryState).toEqual(standalonePlayerInventoryState);
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(false);
    expect(restoreResult.restoredEnvelope.session.standalonePlayerInventoryState).toEqual(
      standalonePlayerInventoryState
    );
  });

  it('clears a restored claimed bed checkpoint when the loaded snapshot no longer contains that complete pair', () => {
    const world = new TileWorld(0);
    expect(world.setTile(6, -1, STARTER_BED_LEFT_TILE_ID)).toBe(true);
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: world.createSnapshot(),
      standalonePlayerState: createPlayerState(),
      standalonePlayerDeathState: null,
      droppedItemStates: [],
      claimedBedCheckpoint: {
        leftTileX: 6,
        tileY: -1
      },
      cameraFollowOffset: { x: 0, y: 0 }
    });
    let restoredClaimedBedCheckpoint: { leftTileX: number; tileY: number } | null = null;
    const target = {
      loadWorldSnapshot: vi.fn(),
      restoreStandalonePlayerState: vi.fn(),
      restoreStandalonePlayerDeathState: vi.fn(),
      restoreStandalonePlayerInventoryState: vi.fn(),
      restoreStandalonePlayerEquipmentState: vi.fn(),
      restoreDroppedItemStates: vi.fn(),
      restoreClaimedBedCheckpoint: vi.fn((nextClaimedBedCheckpoint) => {
        restoredClaimedBedCheckpoint = nextClaimedBedCheckpoint;
      }),
      restoreCameraFollowOffset: vi.fn(),
      restoreSmallTreeGrowthState: vi.fn()
    };

    const restoreResult = restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    expect(restoredClaimedBedCheckpoint).toBeNull();
    expect(restoreResult.didNormalizeDroppedItemStates).toBe(false);
    expect(restoreResult.didNormalizeClaimedBedCheckpoint).toBe(true);
    expect(restoreResult.restoredEnvelope.session.claimedBedCheckpoint).toBeNull();
  });
});
