import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import { evaluateStarterBlockPlacement } from './starterBlockPlacement';
import { TileWorld } from './world';

describe('evaluateStarterBlockPlacement', () => {
  it('allows placement into an empty tile that touches a solid face and does not overlap the player', () => {
    const world = new TileWorld(0);
    const playerState = createPlayerState({
      position: { x: 40, y: 0 },
      grounded: true
    });

    expect(evaluateStarterBlockPlacement(world, playerState, 1, -3)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
  });

  it('rejects placement into an already occupied tile', () => {
    const world = new TileWorld(0);
    const playerState = createPlayerState({
      position: { x: 40, y: 0 },
      grounded: true
    });

    expect(evaluateStarterBlockPlacement(world, playerState, 1, -2)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });

  it('rejects empty tiles that do not touch any solid face', () => {
    const world = new TileWorld(0);
    const playerState = createPlayerState({
      position: { x: 56, y: 0 },
      grounded: true
    });

    expect(evaluateStarterBlockPlacement(world, playerState, 3, -10)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });

  it('rejects placements that would overlap the player body', () => {
    const world = new TileWorld(0);
    const playerState = createPlayerState({
      position: { x: 8, y: -32 },
      grounded: true
    });

    expect(evaluateStarterBlockPlacement(world, playerState, 0, -3)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: true,
      canPlace: false
    });
  });
});
