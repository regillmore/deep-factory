import { describe, expect, it } from 'vitest';

import { evaluateStarterTorchPlacement } from './starterTorchPlacement';
import { TileWorld } from './world';

describe('evaluateStarterTorchPlacement', () => {
  it('allows placement into an empty tile that touches a solid face', () => {
    const world = new TileWorld(0);

    expect(evaluateStarterTorchPlacement(world, 1, -3)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
  });

  it('rejects placement into an already occupied tile', () => {
    const world = new TileWorld(0);

    expect(evaluateStarterTorchPlacement(world, 1, -2)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });

  it('rejects empty tiles that do not touch any solid face', () => {
    const world = new TileWorld(0);

    expect(evaluateStarterTorchPlacement(world, 3, -10)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });
});
