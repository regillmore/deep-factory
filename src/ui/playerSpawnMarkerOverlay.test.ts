import { describe, expect, it } from 'vitest';

import { Camera2D } from '../core/camera2d';
import {
  computePlayerSpawnMarkerClientGeometry,
  computeWorldAabbClientRect
} from './playerSpawnMarkerOverlay';

describe('playerSpawnMarkerOverlay', () => {
  it('maps the resolved spawn AABB, support tile, and feet anchor into client space', () => {
    const camera = new Camera2D();
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 2;

    const canvas = { width: 800, height: 600 };
    const rect = { left: 20, top: 40, width: 400, height: 300 };
    const spawn = {
      anchorTileX: 0,
      standingTileY: 0,
      x: 8,
      y: 0,
      aabb: {
        minX: 2,
        minY: -28,
        maxX: 14,
        maxY: 0
      },
      support: {
        tileX: 0,
        tileY: 0,
        tileId: 3
      }
    };

    expect(computeWorldAabbClientRect(spawn.aabb, camera, canvas, rect)).toEqual({
      left: 222,
      top: 162,
      width: 12,
      height: 28
    });
    expect(computePlayerSpawnMarkerClientGeometry(spawn, camera, canvas, rect)).toEqual({
      aabbRect: {
        left: 222,
        top: 162,
        width: 12,
        height: 28
      },
      supportRect: {
        left: 220,
        top: 190,
        width: 16,
        height: 16
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

    expect(
      computeWorldAabbClientRect(
        {
          minX: 0,
          minY: -16,
          maxX: 16,
          maxY: 0
        },
        camera,
        canvas,
        rect
      )
    ).toEqual({
      left: 12,
      top: 34,
      width: 0,
      height: 0
    });
  });
});
