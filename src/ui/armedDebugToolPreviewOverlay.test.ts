import { describe, expect, it } from 'vitest';

import { resolveTouchAnchorLabelPlacement } from './armedDebugToolPreviewOverlay';

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
