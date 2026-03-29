import { describe, expect, it } from 'vitest';

import {
  resolvePlayerItemGrapplingHookPreviewPresentation,
  resolvePlayerItemGrapplingHookPreviewTone,
  type PlayerItemGrapplingHookPreviewState
} from './playerItemGrapplingHookPreviewOverlay';

const createPreviewState = (
  overrides: Partial<PlayerItemGrapplingHookPreviewState> = {}
): PlayerItemGrapplingHookPreviewState => ({
  tileX: 3,
  tileY: -2,
  withinRange: true,
  ...overrides
});

describe('resolvePlayerItemGrapplingHookPreviewTone', () => {
  it('reports aimed when the hovered hook target stays within maximum range', () => {
    expect(resolvePlayerItemGrapplingHookPreviewTone(createPreviewState())).toBe('aimed');
  });

  it('reports out-of-range when the hovered hook target exceeds maximum range', () => {
    expect(
      resolvePlayerItemGrapplingHookPreviewTone(
        createPreviewState({
          withinRange: false
        })
      )
    ).toBe('out-of-range');
  });
});

describe('resolvePlayerItemGrapplingHookPreviewPresentation', () => {
  it('uses a solid cyan presentation for aimed hook previews', () => {
    expect(resolvePlayerItemGrapplingHookPreviewPresentation(createPreviewState())).toMatchObject({
      tone: 'aimed',
      borderStyle: 'solid',
      borderColor: 'rgba(120, 210, 255, 0.95)',
      background: 'rgba(120, 210, 255, 0.14)'
    });
  });

  it('uses a dashed amber presentation for out-of-range hook previews', () => {
    expect(
      resolvePlayerItemGrapplingHookPreviewPresentation(
        createPreviewState({
          withinRange: false
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
