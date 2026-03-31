import { describe, expect, it } from 'vitest';

import { Camera2D } from '../core/camera2d';
import { computeHoveredTileCursorClientRect } from './hoveredTileCursor';
import {
  resolvePlayerItemPlacementPreviewPresentation,
  resolvePlayerItemPlacementPreviewClientRect,
  resolvePlayerItemPlacementPreviewTone,
  type PlayerItemPlacementPreviewState
} from './playerItemPlacementPreviewOverlay';

const createPreviewState = (
  overrides: Partial<PlayerItemPlacementPreviewState> = {}
): PlayerItemPlacementPreviewState => ({
  tileX: 3,
  tileY: -2,
  placementTileX: 3,
  placementTileY: -2,
  canPlace: false,
  occupied: false,
  hasSolidFaceSupport: true,
  blockedByPlayer: false,
  ...overrides
});

describe('resolvePlayerItemPlacementPreviewTone', () => {
  it('reports toggle-ready when a selected door hovers a nearby complete paired door', () => {
    expect(
      resolvePlayerItemPlacementPreviewTone(
        createPreviewState({
          occupied: true,
          doorToggleStatus: 'toggle-ready'
        })
      )
    ).toBe('toggle-ready');
  });

  it('reports toggle-blocked when a selected door hovers a complete paired door beyond reach', () => {
    expect(
      resolvePlayerItemPlacementPreviewTone(
        createPreviewState({
          occupied: true,
          doorToggleStatus: 'toggle-blocked'
        })
      )
    ).toBe('toggle-blocked');
  });

  it('reports placeable when the preview target can accept the selected item', () => {
    expect(resolvePlayerItemPlacementPreviewTone(createPreviewState({ canPlace: true }))).toBe('placeable');
  });

  it('reports player overlap before other blocked states', () => {
    expect(
      resolvePlayerItemPlacementPreviewTone(
        createPreviewState({
          blockedByPlayer: true,
          occupied: true
        })
      )
    ).toBe('blocked-by-player');
  });

  it('reports occupied tiles when the target already contains a block', () => {
    expect(
      resolvePlayerItemPlacementPreviewTone(
        createPreviewState({
          occupied: true,
          hasSolidFaceSupport: false
        })
      )
    ).toBe('occupied');
  });

  it('reports unsupported tiles when they lack a solid face to attach to', () => {
    expect(
      resolvePlayerItemPlacementPreviewTone(
        createPreviewState({
          hasSolidFaceSupport: false
        })
      )
    ).toBe('unsupported');
  });
});

describe('resolvePlayerItemPlacementPreviewClientRect', () => {
  it('expands selected-door toggle previews across the full paired doorway footprint', () => {
    const camera = new Camera2D();
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 2;

    const canvas = { width: 800, height: 600 };
    const rect = { left: 20, top: 40, width: 400, height: 300 };
    const topHalfRect = computeHoveredTileCursorClientRect(3, -2, camera, canvas, rect);
    const bottomHalfRect = computeHoveredTileCursorClientRect(3, -1, camera, canvas, rect);

    expect(
      resolvePlayerItemPlacementPreviewClientRect(
        createPreviewState({
          tileX: 3,
          tileY: -1,
          placementTileX: 3,
          placementTileY: -1,
          occupied: true,
          doorToggleStatus: 'toggle-blocked'
        }),
        camera,
        canvas,
        rect
      )
    ).toEqual({
      left: topHalfRect.left,
      top: topHalfRect.top,
      width: topHalfRect.width,
      height: bottomHalfRect.top + bottomHalfRect.height - topHalfRect.top
    });
  });

  it('keeps ordinary placement previews on the hovered tile footprint', () => {
    const camera = new Camera2D();
    camera.x = 32;
    camera.y = 16;
    camera.zoom = 4;

    const canvas = { width: 1200, height: 600 };
    const rect = { left: 200, top: 100, width: 600, height: 300 };

    expect(
      resolvePlayerItemPlacementPreviewClientRect(
        createPreviewState({
          tileX: 2,
          tileY: 1,
          placementTileX: 2,
          placementTileY: 5,
          canPlace: true
        }),
        camera,
        canvas,
        rect
      )
    ).toEqual(computeHoveredTileCursorClientRect(2, 1, camera, canvas, rect));
  });
});

describe('resolvePlayerItemPlacementPreviewPresentation', () => {
  it('uses a solid cyan presentation for toggle-ready door interactions', () => {
    expect(
      resolvePlayerItemPlacementPreviewPresentation(
        createPreviewState({
          occupied: true,
          doorToggleStatus: 'toggle-ready'
        })
      )
    ).toMatchObject({
      tone: 'toggle-ready',
      borderStyle: 'solid',
      borderColor: 'rgba(120, 210, 255, 0.95)',
      background: 'rgba(120, 210, 255, 0.14)'
    });
  });

  it('uses a dashed coral presentation for blocked door interactions', () => {
    expect(
      resolvePlayerItemPlacementPreviewPresentation(
        createPreviewState({
          occupied: true,
          doorToggleStatus: 'toggle-blocked'
        })
      )
    ).toMatchObject({
      tone: 'toggle-blocked',
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 166, 144, 0.96)',
      background: 'rgba(255, 166, 144, 0.16)'
    });
  });

  it('uses a solid green presentation for placeable tiles', () => {
    expect(resolvePlayerItemPlacementPreviewPresentation(createPreviewState({ canPlace: true }))).toMatchObject({
      tone: 'placeable',
      borderStyle: 'solid',
      borderColor: 'rgba(120, 255, 180, 0.96)',
      background: 'rgba(120, 255, 180, 0.18)'
    });
  });

  it('uses a dashed amber presentation for unsupported tiles', () => {
    expect(
      resolvePlayerItemPlacementPreviewPresentation(
        createPreviewState({
          hasSolidFaceSupport: false
        })
      )
    ).toMatchObject({
      tone: 'unsupported',
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 195, 120, 0.96)',
      background: 'rgba(255, 195, 120, 0.14)'
    });
  });
});
