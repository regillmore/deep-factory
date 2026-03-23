import { describe, expect, it } from 'vitest';

import {
  resolveDebugBreakPreviewMarkerPresentation,
  resolveStatusBadgePlacement,
  resolveTouchAnchorLabelPlacement
} from './armedDebugToolPreviewOverlay';

describe('resolveStatusBadgePlacement', () => {
  it('keeps the badge inset from the canvas top-left corner when the canvas has room', () => {
    expect(
      resolveStatusBadgePlacement({
        left: 100,
        top: 120,
        width: 320,
        height: 180
      })
    ).toEqual({
      left: 110,
      top: 130,
      maxWidth: 300,
      maxHeight: 160
    });
  });

  it('shrinks the badge bounds to stay inside a small offset canvas', () => {
    expect(
      resolveStatusBadgePlacement({
        left: 240,
        top: 320,
        width: 96,
        height: 52
      })
    ).toEqual({
      left: 250,
      top: 330,
      maxWidth: 76,
      maxHeight: 32
    });
  });
});

describe('resolveTouchAnchorLabelPlacement', () => {
  it('keeps the touch anchor label aligned to the anchor when the label already fits inside the canvas', () => {
    expect(
      resolveTouchAnchorLabelPlacement(
        {
          left: 180,
          top: 220,
          width: 16,
          height: 16
        },
        {
          left: 100,
          top: 120,
          width: 320,
          height: 180
        },
        {
          width: 96,
          height: 20
        }
      )
    ).toEqual({
      left: 180,
      top: 196,
      maxWidth: 312
    });
  });

  it('clamps the touch anchor label horizontally inside the visible canvas bounds', () => {
    expect(
      resolveTouchAnchorLabelPlacement(
        {
          left: 392,
          top: 240,
          width: 16,
          height: 16
        },
        {
          left: 100,
          top: 120,
          width: 320,
          height: 180
        },
        {
          width: 80,
          height: 20
        }
      )
    ).toEqual({
      left: 336,
      top: 216,
      maxWidth: 312
    });
  });

  it('clamps the touch anchor label to the canvas top edge instead of the viewport top edge', () => {
    expect(
      resolveTouchAnchorLabelPlacement(
        {
          left: 104,
          top: 308,
          width: 16,
          height: 16
        },
        {
          left: 100,
          top: 300,
          width: 320,
          height: 180
        },
        {
          width: 120,
          height: 20
        }
      )
    ).toEqual({
      left: 104,
      top: 304,
      maxWidth: 312
    });
  });
});

describe('resolveDebugBreakPreviewMarkerPresentation', () => {
  it('uses a solid warm highlight for foreground break targets', () => {
    expect(resolveDebugBreakPreviewMarkerPresentation('tile')).toEqual({
      borderColor: 'rgba(255, 140, 120, 0.96)',
      borderStyle: 'solid',
      background: 'rgba(255, 140, 120, 0.14)',
      boxShadow: '0 0 0 1px rgba(33, 12, 12, 0.34), 0 0 14px rgba(255, 140, 120, 0.14)'
    });
  });

  it('uses a dashed striped highlight for wall-only break targets', () => {
    expect(resolveDebugBreakPreviewMarkerPresentation('wall')).toEqual({
      borderColor: 'rgba(255, 195, 120, 0.96)',
      borderStyle: 'dashed',
      background:
        'repeating-linear-gradient(135deg, rgba(255, 195, 120, 0.12) 0 4px, rgba(255, 195, 120, 0.04) 4px 8px)',
      boxShadow: '0 0 0 1px rgba(33, 24, 8, 0.32), 0 0 14px rgba(255, 195, 120, 0.12)'
    });
  });
});
