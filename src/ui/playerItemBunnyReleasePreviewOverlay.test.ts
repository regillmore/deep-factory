import { describe, expect, it } from 'vitest';

import {
  resolvePlayerItemBunnyReleasePreviewPresentation,
  resolvePlayerItemBunnyReleasePreviewTone,
  type PlayerItemBunnyReleasePreviewState
} from './playerItemBunnyReleasePreviewOverlay';

const createPreviewState = (
  overrides: Partial<PlayerItemBunnyReleasePreviewState> = {}
): PlayerItemBunnyReleasePreviewState => ({
  tileX: 3,
  tileY: -2,
  canRelease: false,
  placementRangeWithinReach: true,
  ...overrides
});

describe('resolvePlayerItemBunnyReleasePreviewTone', () => {
  it('reports releasable when the selected bunny stack can spawn onto nearby valid ground', () => {
    expect(resolvePlayerItemBunnyReleasePreviewTone(createPreviewState({ canRelease: true }))).toBe(
      'releasable'
    );
  });

  it('reports out-of-range before other blocked states when the hovered tile is beyond shared reach', () => {
    expect(
      resolvePlayerItemBunnyReleasePreviewTone(
        createPreviewState({
          placementRangeWithinReach: false
        })
      )
    ).toBe('out-of-range');
  });

  it('reports blocked when the target is in range but no nearby release ground is valid', () => {
    expect(resolvePlayerItemBunnyReleasePreviewTone(createPreviewState())).toBe('blocked');
  });
});

describe('resolvePlayerItemBunnyReleasePreviewPresentation', () => {
  it('uses a solid green presentation for releasable preview targets', () => {
    expect(
      resolvePlayerItemBunnyReleasePreviewPresentation(createPreviewState({ canRelease: true }))
    ).toMatchObject({
      tone: 'releasable',
      borderStyle: 'solid',
      borderColor: 'rgba(120, 255, 180, 0.96)',
      background: 'rgba(120, 255, 180, 0.16)'
    });
  });

  it('uses a dashed amber presentation for out-of-range preview targets', () => {
    expect(
      resolvePlayerItemBunnyReleasePreviewPresentation(
        createPreviewState({
          placementRangeWithinReach: false
        })
      )
    ).toMatchObject({
      tone: 'out-of-range',
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 195, 120, 0.96)',
      background: 'rgba(255, 195, 120, 0.14)'
    });
  });
});
