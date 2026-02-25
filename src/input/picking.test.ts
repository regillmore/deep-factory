import { describe, expect, it } from 'vitest';

import { Camera2D } from '../core/camera2d';
import { TILE_SIZE } from '../world/constants';
import {
  canvasToWorldPoint,
  clientToCanvasPoint,
  clientToWorldPoint,
  pickScreenWorldTile,
  worldToTilePoint
} from './picking';

describe('picking', () => {
  it('converts client coordinates to canvas pixels with DPR scaling', () => {
    const canvas = { width: 1600, height: 900 };
    const rect = { left: 100, top: 50, width: 800, height: 450 };

    expect(clientToCanvasPoint(500, 275, canvas, rect)).toEqual({ x: 800, y: 450 });
  });

  it('falls back to 1:1 client-to-canvas scaling when rect dimensions are zero', () => {
    const canvas = { width: 1024, height: 768 };
    const rect = { left: 10, top: 20, width: 0, height: 0 };

    expect(clientToCanvasPoint(14, 29, canvas, rect)).toEqual({ x: 4, y: 9 });
  });

  it('converts canvas pixels to world coordinates using the camera viewport transform', () => {
    const camera = new Camera2D();
    camera.x = 100;
    camera.y = 50;
    camera.zoom = 2;

    const canvas = { width: 1600, height: 1200 };
    expect(canvasToWorldPoint(800, 600, canvas, camera)).toEqual({ x: 100, y: 50 });
    expect(canvasToWorldPoint(960, 680, canvas, camera)).toEqual({ x: 180, y: 90 });
  });

  it('converts client coordinates to world coordinates through canvas DPR scaling', () => {
    const camera = new Camera2D();
    camera.x = -32;
    camera.y = 16;
    camera.zoom = 4;

    const canvas = { width: 1200, height: 600 };
    const rect = { left: 200, top: 100, width: 600, height: 300 };

    const world = clientToWorldPoint(500, 250, canvas, rect, camera);
    expect(world.x).toBe(-32);
    expect(world.y).toBe(16);
  });

  it('floors world coordinates to tile coordinates across negative axes', () => {
    expect(worldToTilePoint(31.99, 32, TILE_SIZE)).toEqual({ x: 1, y: 2 });
    expect(worldToTilePoint(-0.01, -16.01, TILE_SIZE)).toEqual({ x: -1, y: -2 });
  });

  it('returns canvas, world, and tile coordinates from a single client pick', () => {
    const camera = new Camera2D();
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 2;

    const canvas = { width: 800, height: 600 };
    const rect = { left: 20, top: 40, width: 400, height: 300 };

    const pick = pickScreenWorldTile(220, 190, canvas, rect, camera);

    expect(pick.canvas).toEqual({ x: 400, y: 300 });
    expect(pick.world).toEqual({ x: 0, y: 0 });
    expect(pick.tile).toEqual({ x: 0, y: 0 });
  });
});
