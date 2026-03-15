import { describe, expect, it } from 'vitest';

import { evaluateStarterRopePlacement, STARTER_ROPE_TILE_ID } from './starterRopePlacement';
import { TileWorld } from './world';

describe('evaluateStarterRopePlacement', () => {
  it('allows placement into an empty tile directly below a solid anchor', () => {
    const world = new TileWorld(0);
    expect(world.setTile(3, -6, 3)).toBe(true);

    expect(evaluateStarterRopePlacement(world, 3, -5)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
  });

  it('allows placement into an empty tile directly below an existing rope segment', () => {
    const world = new TileWorld(0);
    expect(world.setTile(3, -6, STARTER_ROPE_TILE_ID)).toBe(true);

    expect(evaluateStarterRopePlacement(world, 3, -5)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
  });

  it('rejects placement into an already occupied tile', () => {
    const world = new TileWorld(0);
    expect(world.setTile(1, -1, STARTER_ROPE_TILE_ID)).toBe(true);

    expect(evaluateStarterRopePlacement(world, 1, -1)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });

  it('rejects empty tiles that do not have a solid or rope anchor above them', () => {
    const world = new TileWorld(0);

    expect(evaluateStarterRopePlacement(world, 3, -10)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });
});
