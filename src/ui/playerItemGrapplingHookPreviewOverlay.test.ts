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
  latchReady: false,
  ...overrides
});

describe('resolvePlayerItemGrapplingHookPreviewTone', () => {
  it('reports latch-ready when the hovered hook target stays within range and hits a solid tile', () => {
    expect(
      resolvePlayerItemGrapplingHookPreviewTone(
        createPreviewState({
          latchReady: true
        })
      )
    ).toBe('latch-ready');
  });

  it('reports neutral when the hovered hook target stays within range but remains empty', () => {
    expect(resolvePlayerItemGrapplingHookPreviewTone(createPreviewState())).toBe('neutral');
  });

  it('reports out-of-range when the hovered hook target exceeds maximum range', () => {
    expect(
      resolvePlayerItemGrapplingHookPreviewTone(
        createPreviewState({
          withinRange: false,
          latchReady: true
        })
      )
    ).toBe('out-of-range');
  });
});

describe('resolvePlayerItemGrapplingHookPreviewPresentation', () => {
  it('uses a solid cyan presentation for latch-ready hook previews', () => {
    expect(
      resolvePlayerItemGrapplingHookPreviewPresentation(
        createPreviewState({
          latchReady: true
        })
      )
    ).toMatchObject({
      tone: 'latch-ready',
      borderStyle: 'solid',
      borderColor: 'rgba(120, 210, 255, 0.95)',
      background: 'rgba(120, 210, 255, 0.14)'
    });
  });

  it('uses a muted dashed presentation for neutral in-range hook previews', () => {
    expect(resolvePlayerItemGrapplingHookPreviewPresentation(createPreviewState())).toMatchObject({
      tone: 'neutral',
      borderStyle: 'dashed',
      borderColor: 'rgba(176, 190, 208, 0.92)',
      background: 'rgba(176, 190, 208, 0.12)'
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
