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
