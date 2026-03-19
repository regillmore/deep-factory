import { describe, expect, it } from 'vitest';
import {
  resolvePlayerItemBunnyReleaseLandingMarkerTarget,
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
  landingTile: null,
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
      resolvePlayerItemBunnyReleasePreviewPresentation(
        createPreviewState({
          canRelease: true,
          landingTile: { tileX: 3, tileY: -2 }
        })
      )
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

describe('resolvePlayerItemBunnyReleaseLandingMarkerTarget', () => {
  it('returns no separate landing marker when the hovered tile already matches the resolved release ground', () => {
    expect(
      resolvePlayerItemBunnyReleaseLandingMarkerTarget(
        createPreviewState({
          canRelease: true,
          landingTile: { tileX: 3, tileY: -2 }
        })
      )
    ).toBeNull();
  });

  it('returns the resolved nearby-ground tile when fallback landing differs from the hovered tile', () => {
    expect(
      resolvePlayerItemBunnyReleaseLandingMarkerTarget(
        createPreviewState({
          tileX: 2,
          tileY: 0,
          canRelease: true,
          landingTile: { tileX: 1, tileY: -1 }
        })
      )
    ).toEqual({
      tileX: 1,
      tileY: -1
    });
  });
});
