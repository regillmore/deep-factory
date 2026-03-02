import { describe, expect, it } from 'vitest';

import {
  absorbManualCameraDeltaIntoFollowOffset,
  createCameraFollowOffset,
  recenterCameraOnFollowTarget,
  resolveCameraPositionFromFollowTarget
} from './cameraFollow';

describe('cameraFollow', () => {
  it('creates a follow offset from the current camera position and follow target', () => {
    expect(createCameraFollowOffset({ x: 96, y: -24 }, { x: 80, y: -40 })).toEqual({
      x: 16,
      y: 16
    });
  });

  it('preserves manual pan or zoom deltas by folding them into the follow offset', () => {
    expect(
      absorbManualCameraDeltaIntoFollowOffset(
        { x: 12, y: -8 },
        { x: 100, y: 50 },
        { x: 124, y: 36 }
      )
    ).toEqual({
      x: 36,
      y: -22
    });
  });

  it('leaves the follow offset unchanged before a follow position has been applied', () => {
    expect(
      absorbManualCameraDeltaIntoFollowOffset({ x: 4, y: 6 }, null, { x: 120, y: -8 })
    ).toEqual({
      x: 4,
      y: 6
    });
  });

  it('resolves the next camera position from the follow target plus offset', () => {
    expect(resolveCameraPositionFromFollowTarget({ x: 48, y: -16 }, { x: -12, y: 20 })).toEqual({
      x: 36,
      y: 4
    });
  });

  it('recenters the camera on the follow target and clears any manual offset', () => {
    expect(recenterCameraOnFollowTarget({ x: 48, y: -16 })).toEqual({
      cameraPosition: {
        x: 48,
        y: -16
      },
      offset: {
        x: 0,
        y: 0
      }
    });
  });
});
