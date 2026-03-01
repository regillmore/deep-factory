import { describe, expect, it } from 'vitest';

import { Camera2D } from '../core/camera2d';
import { createPlayerState } from '../world/playerState';
import { computeStandalonePlayerOverlayClientGeometry } from './standalonePlayerOverlay';

describe('standalonePlayerOverlay', () => {
  it('maps the standalone player AABB and feet anchor into client space', () => {
    const camera = new Camera2D();
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 2;

    const canvas = { width: 800, height: 600 };
    const rect = { left: 20, top: 40, width: 400, height: 300 };
    const state = createPlayerState({
      position: { x: 8, y: 0 },
      size: { width: 12, height: 28 }
    });

    expect(computeStandalonePlayerOverlayClientGeometry(state, camera, canvas, rect)).toEqual({
      aabbRect: {
        left: 222,
        top: 162,
        width: 12,
        height: 28
      },
      anchorPoint: {
        x: 228,
        y: 190
      }
    });
  });

  it('returns hidden geometry when the canvas backbuffer is zero-sized', () => {
    const camera = new Camera2D();
    const canvas = { width: 0, height: 0 };
    const rect = { left: 12, top: 34, width: 0, height: 0 };
    const state = createPlayerState({
      position: { x: 8, y: 0 },
      size: { width: 12, height: 12 }
    });

    expect(computeStandalonePlayerOverlayClientGeometry(state, camera, canvas, rect)).toEqual({
      aabbRect: {
        left: 12,
        top: 34,
        width: 0,
        height: 0
      },
      anchorPoint: {
        x: 12,
        y: 34
      }
    });
  });
});
