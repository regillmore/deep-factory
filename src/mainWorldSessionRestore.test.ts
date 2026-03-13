import { describe, expect, it, vi } from 'vitest';

import { createWorldSaveEnvelope } from './mainWorldSave';
import { restoreWorldSessionFromSaveEnvelope } from './mainWorldSessionRestore';
import { createPlayerState, type PlayerState } from './world/playerState';
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
      lavaDamageTickSecondsRemaining: 0.5,
      fallDamageRecoverySecondsRemaining: 0.2
    });
    const cameraFollowOffset = { x: 18, y: -12 };
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: world.createSnapshot(),
      standalonePlayerState,
      cameraFollowOffset
    });
    const callOrder: string[] = [];
    let restoredWorldSnapshot: ReturnType<TileWorld['createSnapshot']> | null = null;
    let restoredPlayerState: PlayerState | null = null;
    let restoredCameraFollowOffset: typeof cameraFollowOffset | null = null;
    const target = {
      loadWorldSnapshot: vi.fn((snapshot) => {
        callOrder.push('world');
        restoredWorldSnapshot = snapshot;
      }),
      restoreStandalonePlayerState: vi.fn((playerState) => {
        callOrder.push('player');
        restoredPlayerState = playerState;
      }),
      restoreCameraFollowOffset: vi.fn((offset) => {
        callOrder.push('camera');
        restoredCameraFollowOffset = offset;
      })
    };

    restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    expect(callOrder).toEqual(['world', 'player', 'camera']);
    expect(target.loadWorldSnapshot).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerState).toHaveBeenCalledTimes(1);
    expect(target.restoreCameraFollowOffset).toHaveBeenCalledTimes(1);

    envelope.worldSnapshot.residentChunks[0]!.payload.tiles[0] = 99;
    envelope.session.standalonePlayerState!.position.x = 999;
    envelope.session.cameraFollowOffset.x = 999;

    const restoredWorld = new TileWorld(0);
    restoredWorld.loadSnapshot(restoredWorldSnapshot!);
    expect(restoredWorld.getTile(0, 0)).toBe(6);
    expect(restoredPlayerState).toEqual(standalonePlayerState);
    if (restoredPlayerState === null) {
      throw new Error('expected restored standalone-player state');
    }
    expect((restoredPlayerState as PlayerState).position.x).toBe(72);
    expect(restoredCameraFollowOffset).toEqual({ x: 18, y: -12 });
  });

  it('preserves null standalone-player session state while still restoring world and camera data', () => {
    const world = new TileWorld(0);
    expect(world.setTile(0, 0, 0)).toBe(true);
    const envelope = createWorldSaveEnvelope({
      worldSnapshot: world.createSnapshot(),
      standalonePlayerState: null,
      cameraFollowOffset: { x: -24, y: 10 }
    });
    const target = {
      loadWorldSnapshot: vi.fn(),
      restoreStandalonePlayerState: vi.fn(),
      restoreCameraFollowOffset: vi.fn()
    };

    restoreWorldSessionFromSaveEnvelope({
      target,
      envelope
    });

    expect(target.loadWorldSnapshot).toHaveBeenCalledTimes(1);
    expect(target.restoreStandalonePlayerState).toHaveBeenCalledWith(null);
    expect(target.restoreCameraFollowOffset).toHaveBeenCalledWith({ x: -24, y: 10 });
  });
});
