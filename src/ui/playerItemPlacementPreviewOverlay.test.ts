import { describe, expect, it } from 'vitest';

import {
  resolvePlayerItemPlacementPreviewPresentation,
  resolvePlayerItemPlacementPreviewTone,
  type PlayerItemPlacementPreviewState
} from './playerItemPlacementPreviewOverlay';

const createPreviewState = (
  overrides: Partial<PlayerItemPlacementPreviewState> = {}
): PlayerItemPlacementPreviewState => ({
  tileX: 3,
  tileY: -2,
  canPlace: false,
  occupied: false,
  hasSolidFaceSupport: true,
  blockedByPlayer: false,
  ...overrides
});

describe('resolvePlayerItemPlacementPreviewTone', () => {
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

describe('resolvePlayerItemPlacementPreviewPresentation', () => {
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
