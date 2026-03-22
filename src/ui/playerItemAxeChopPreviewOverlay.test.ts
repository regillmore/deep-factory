import { describe, expect, it } from 'vitest';

import {
  resolvePlayerItemAxeChopPreviewPresentation,
  resolvePlayerItemAxeChopPreviewTone,
  type PlayerItemAxeChopPreviewState
} from './playerItemAxeChopPreviewOverlay';

const createPreviewState = (
  overrides: Partial<PlayerItemAxeChopPreviewState> = {}
): PlayerItemAxeChopPreviewState => ({
  tileX: 3,
  tileY: -2,
  canChop: false,
  occupied: true,
  chopTarget: false,
  withinRange: true,
  growthStage: null,
  activeSwing: false,
  ...overrides
});

describe('resolvePlayerItemAxeChopPreviewTone', () => {
  it('reports a planted-target tone when the selected axe can chop a sapling', () => {
    expect(
      resolvePlayerItemAxeChopPreviewTone(
        createPreviewState({
          canChop: true,
          chopTarget: true,
          growthStage: 'planted'
        })
      )
    ).toBe('sapling-target');
  });

  it('reports a grown-target tone when the selected axe can chop a grown tree', () => {
    expect(
      resolvePlayerItemAxeChopPreviewTone(
        createPreviewState({
          canChop: true,
          chopTarget: true,
          growthStage: 'grown'
        })
      )
    ).toBe('grown-target');
  });

  it('keeps the resolved growth-stage tone through active swings after the sampled tile clears', () => {
    expect(
      resolvePlayerItemAxeChopPreviewTone(
        createPreviewState({
          occupied: false,
          chopTarget: false,
          growthStage: 'grown',
          activeSwing: true
        })
      )
    ).toBe('grown-target');
  });

  it('reports blocked occupied non-tree tiles before empty targets', () => {
    expect(
      resolvePlayerItemAxeChopPreviewTone(
        createPreviewState({
          occupied: true,
          chopTarget: false
        })
      )
    ).toBe('blocked');
  });

  it('reports out-of-range when the hovered tile is still a tree target', () => {
    expect(
      resolvePlayerItemAxeChopPreviewTone(
        createPreviewState({
          occupied: true,
          chopTarget: true,
          withinRange: false,
          growthStage: 'planted'
        })
      )
    ).toBe('out-of-range');
  });
});

describe('resolvePlayerItemAxeChopPreviewPresentation', () => {
  it('uses a solid green presentation for planted sapling targets', () => {
    expect(
      resolvePlayerItemAxeChopPreviewPresentation(
        createPreviewState({
          canChop: true,
          chopTarget: true,
          growthStage: 'planted'
        })
      )
    ).toMatchObject({
      tone: 'sapling-target',
      borderStyle: 'solid',
      borderColor: 'rgba(132, 255, 176, 0.96)',
      background: 'rgba(132, 255, 176, 0.18)'
    });
  });

  it('uses a solid warm presentation for grown-tree targets', () => {
    expect(
      resolvePlayerItemAxeChopPreviewPresentation(
        createPreviewState({
          canChop: true,
          chopTarget: true,
          growthStage: 'grown'
        })
      )
    ).toMatchObject({
      tone: 'grown-target',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 183, 112, 0.96)',
      background: 'rgba(255, 183, 112, 0.18)'
    });
  });
});
