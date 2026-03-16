import { describe, expect, it } from 'vitest';

import {
  resolvePlayerItemMiningPreviewPresentation,
  resolvePlayerItemMiningPreviewTone,
  type PlayerItemMiningPreviewState
} from './playerItemMiningPreviewOverlay';

const createPreviewState = (
  overrides: Partial<PlayerItemMiningPreviewState> = {}
): PlayerItemMiningPreviewState => ({
  tileX: 3,
  tileY: -2,
  canMine: false,
  occupied: true,
  breakableTarget: true,
  withinRange: true,
  progressNormalized: 0,
  ...overrides
});

describe('resolvePlayerItemMiningPreviewTone', () => {
  it('reports mineable when the targeted terrain is valid and in range', () => {
    expect(resolvePlayerItemMiningPreviewTone(createPreviewState({ canMine: true }))).toBe('mineable');
  });

  it('reports empty targets before other blocked states', () => {
    expect(
      resolvePlayerItemMiningPreviewTone(
        createPreviewState({
          occupied: false,
          breakableTarget: false,
          withinRange: false
        })
      )
    ).toBe('empty');
  });

  it('reports unbreakable occupied tiles before out-of-range terrain', () => {
    expect(
      resolvePlayerItemMiningPreviewTone(
        createPreviewState({
          breakableTarget: false,
          withinRange: false
        })
      )
    ).toBe('unbreakable');
  });

  it('reports out-of-range when the tile is still breakable terrain', () => {
    expect(
      resolvePlayerItemMiningPreviewTone(
        createPreviewState({
          withinRange: false
        })
      )
    ).toBe('out-of-range');
  });
});

describe('resolvePlayerItemMiningPreviewPresentation', () => {
  it('uses a solid green presentation for mineable terrain', () => {
    expect(
      resolvePlayerItemMiningPreviewPresentation(createPreviewState({ canMine: true }))
    ).toMatchObject({
      tone: 'mineable',
      borderStyle: 'solid',
      borderColor: 'rgba(120, 255, 180, 0.96)',
      progressFill: 'rgba(120, 255, 180, 0.32)'
    });
  });

  it('uses a dashed amber presentation for out-of-range terrain', () => {
    expect(
      resolvePlayerItemMiningPreviewPresentation(
        createPreviewState({
          withinRange: false
        })
      )
    ).toMatchObject({
      tone: 'out-of-range',
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 195, 120, 0.96)',
      progressFill: 'rgba(255, 195, 120, 0.26)'
    });
  });
});
