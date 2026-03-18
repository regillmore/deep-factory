import { describe, expect, it } from 'vitest';

import {
  resolvePlayerItemSpearPreviewPresentation,
  resolvePlayerItemSpearPreviewTone,
  type PlayerItemSpearPreviewState
} from './playerItemSpearPreviewOverlay';

const createPreviewState = (
  overrides: Partial<PlayerItemSpearPreviewState> = {}
): PlayerItemSpearPreviewState => ({
  startWorldX: 8,
  startWorldY: 14,
  endWorldX: 41.6,
  endWorldY: -11.2,
  activeThrust: false,
  clampedByReach: false,
  ...overrides
});

describe('resolvePlayerItemSpearPreviewTone', () => {
  it('reports active while a thrust is already in progress', () => {
    expect(
      resolvePlayerItemSpearPreviewTone(createPreviewState({ activeThrust: true, clampedByReach: true }))
    ).toBe('active');
  });

  it('reports clamped when the requested aim extends beyond the spear reach', () => {
    expect(
      resolvePlayerItemSpearPreviewTone(createPreviewState({ clampedByReach: true }))
    ).toBe('clamped');
  });

  it('reports aimed when the preview is idle and the requested direction stays within reach', () => {
    expect(resolvePlayerItemSpearPreviewTone(createPreviewState())).toBe('aimed');
  });
});

describe('resolvePlayerItemSpearPreviewPresentation', () => {
  it('uses a cool cyan presentation for ordinary aimed previews', () => {
    expect(resolvePlayerItemSpearPreviewPresentation(createPreviewState())).toMatchObject({
      tone: 'aimed',
      lineColor: 'rgba(120, 210, 255, 0.94)',
      endpointBorderColor: 'rgba(120, 210, 255, 0.95)'
    });
  });

  it('uses an amber presentation when the preview is clamped by the spear reach', () => {
    expect(
      resolvePlayerItemSpearPreviewPresentation(createPreviewState({ clampedByReach: true }))
    ).toMatchObject({
      tone: 'clamped',
      lineColor: 'rgba(255, 195, 120, 0.96)',
      endpointBorderColor: 'rgba(255, 195, 120, 0.96)'
    });
  });

  it('uses a brighter active presentation while the thrust is already underway', () => {
    expect(
      resolvePlayerItemSpearPreviewPresentation(createPreviewState({ activeThrust: true }))
    ).toMatchObject({
      tone: 'active',
      lineColor: 'rgba(120, 255, 180, 0.96)',
      endpointBorderColor: 'rgba(120, 255, 180, 0.96)'
    });
  });
});
