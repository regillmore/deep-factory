import { describe, expect, it } from 'vitest';
import { Camera2D } from './camera2d';

describe('Camera2D zoomAt', () => {
  it('keeps the anchor world point under the same screen point when zooming in', () => {
    const camera = new Camera2D();
    camera.x = 100;
    camera.y = 50;
    camera.zoom = 2;

    const viewportWidth = 1200;
    const viewportHeight = 800;
    const screenX = 900;
    const screenY = 200;

    const worldX = camera.x + (screenX - viewportWidth * 0.5) / camera.zoom;
    const worldY = camera.y + (screenY - viewportHeight * 0.5) / camera.zoom;

    camera.zoomAt(1.5, worldX, worldY);

    const screenXAfter = (worldX - camera.x) * camera.zoom + viewportWidth * 0.5;
    const screenYAfter = (worldY - camera.y) * camera.zoom + viewportHeight * 0.5;

    expect(screenXAfter).toBeCloseTo(screenX, 8);
    expect(screenYAfter).toBeCloseTo(screenY, 8);
  });
});

describe('Camera2D screen/world conversion', () => {
  it('round-trips world and screen coordinates for a viewport', () => {
    const camera = new Camera2D();
    camera.x = -80;
    camera.y = 120;
    camera.zoom = 2.5;

    const viewportWidth = 1440;
    const viewportHeight = 900;
    const worldPoint = { x: 32.25, y: -16.5 };

    const screenPoint = camera.worldToScreen(
      worldPoint.x,
      worldPoint.y,
      viewportWidth,
      viewportHeight
    );
    const worldPointAfter = camera.screenToWorld(
      screenPoint.x,
      screenPoint.y,
      viewportWidth,
      viewportHeight
    );

    expect(worldPointAfter.x).toBeCloseTo(worldPoint.x, 8);
    expect(worldPointAfter.y).toBeCloseTo(worldPoint.y, 8);
  });
});
