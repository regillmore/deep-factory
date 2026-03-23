import { describe, expect, it } from 'vitest';

import { Camera2D } from '../core/camera2d';
import {
  computeHoveredTileCursorClientRect,
  resolveHoveredTileCursorPresentation,
  resolveHoveredTileCursorTargets
} from './hoveredTileCursor';

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

  it('keeps separate hovered and pinned cursor targets for different tiles', () => {
    expect(
      resolveHoveredTileCursorTargets(
        { tileX: 12, tileY: -4 },
        { tileX: 7, tileY: 3 }
      )
    ).toEqual({
      hovered: { tileX: 12, tileY: -4 },
      pinned: { tileX: 7, tileY: 3 }
    });
  });

  it('deduplicates the hovered target when it matches the pinned inspect tile', () => {
    expect(
      resolveHoveredTileCursorTargets(
        { tileX: 5, tileY: 8 },
        { tileX: 5, tileY: 8 }
      )
    ).toEqual({
      hovered: null,
      pinned: { tileX: 5, tileY: 8 }
    });
  });
});

describe('resolveHoveredTileCursorPresentation', () => {
  it('uses a warm solid presentation for foreground debug-break targets', () => {
    expect(
      resolveHoveredTileCursorPresentation('hovered', {
        tileX: 4,
        tileY: -2,
        previewTone: 'debug-break-tile'
      })
    ).toEqual({
      borderColor: 'rgba(255, 140, 120, 0.96)',
      borderStyle: 'solid',
      background: 'rgba(255, 140, 120, 0.14)',
      boxShadow: '0 0 0 1px rgba(33, 12, 12, 0.38), 0 0 18px rgba(255, 140, 120, 0.16)'
    });
  });

  it('uses a dashed striped presentation for wall-only debug-break targets', () => {
    expect(
      resolveHoveredTileCursorPresentation('hovered', {
        tileX: 4,
        tileY: -2,
        previewTone: 'debug-break-wall'
      })
    ).toEqual({
      borderColor: 'rgba(255, 195, 120, 0.96)',
      borderStyle: 'dashed',
      background:
        'repeating-linear-gradient(135deg, rgba(255, 195, 120, 0.12) 0 4px, rgba(255, 195, 120, 0.04) 4px 8px)',
      boxShadow: '0 0 0 1px rgba(33, 24, 8, 0.36), 0 0 18px rgba(255, 195, 120, 0.14)'
    });
  });

  it('keeps pinned inspect targets on the pinned palette even when a hovered tone is present', () => {
    expect(
      resolveHoveredTileCursorPresentation('pinned', {
        tileX: 1,
        tileY: 2,
        previewTone: 'debug-break-wall'
      })
    ).toEqual({
      borderColor: 'rgba(120, 210, 255, 0.95)',
      borderStyle: 'solid',
      background: 'rgba(120, 210, 255, 0.12)',
      boxShadow: '0 0 0 1px rgba(8, 14, 24, 0.32), 0 0 14px rgba(120, 210, 255, 0.12)'
    });
  });
});
