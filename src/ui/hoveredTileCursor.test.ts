import { describe, expect, it } from 'vitest';

import { Camera2D } from '../core/camera2d';
import { computeHoveredTileCursorClientRect } from './hoveredTileCursor';

describe('computeHoveredTileCursorClientRect', () => {
  it('maps a hovered tile to a CSS/client-space rectangle with DPR scaling', () => {
    const camera = new Camera2D();
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 2;

    const canvas = { width: 800, height: 600 };
    const rect = { left: 20, top: 40, width: 400, height: 300 };

    expect(computeHoveredTileCursorClientRect(0, 0, camera, canvas, rect)).toEqual({
      left: 220,
      top: 190,
      width: 16,
      height: 16
    });
  });

  it('tracks camera transforms for non-origin tiles', () => {
    const camera = new Camera2D();
    camera.x = 32;
    camera.y = 16;
    camera.zoom = 4;

    const canvas = { width: 1200, height: 600 };
    const rect = { left: 200, top: 100, width: 600, height: 300 };

    expect(computeHoveredTileCursorClientRect(2, 1, camera, canvas, rect)).toEqual({
      left: 500,
      top: 250,
      width: 32,
      height: 32
    });
  });

  it('returns a hidden-size rect when canvas dimensions are zero', () => {
    const camera = new Camera2D();
    const canvas = { width: 0, height: 0 };
    const rect = { left: 12, top: 34, width: 0, height: 0 };

    expect(computeHoveredTileCursorClientRect(0, 0, camera, canvas, rect)).toEqual({
      left: 12,
      top: 34,
      width: 0,
      height: 0
    });
  });
});
