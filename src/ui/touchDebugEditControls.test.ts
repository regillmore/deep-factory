import { describe, expect, it } from 'vitest';

import { resolveTouchDebugEditControlsDisplayState } from './touchDebugEditControls';

describe('resolveTouchDebugEditControlsDisplayState', () => {
  it('keeps the root hidden or shown independently from whether the panel is collapsed', () => {
    expect(resolveTouchDebugEditControlsDisplayState(false, true)).toEqual({
      rootDisplay: 'none',
      contentDisplay: 'none',
      collapsedSummaryDisplay: 'block',
      ariaExpanded: 'false',
      ariaHidden: 'true',
      collapseToggleLabel: 'Expand'
    });
    expect(resolveTouchDebugEditControlsDisplayState(true, true)).toEqual({
      rootDisplay: 'flex',
      contentDisplay: 'none',
      collapsedSummaryDisplay: 'block',
      ariaExpanded: 'false',
      ariaHidden: 'false',
      collapseToggleLabel: 'Expand'
    });
    expect(resolveTouchDebugEditControlsDisplayState(true, false)).toEqual({
      rootDisplay: 'flex',
      contentDisplay: 'flex',
      collapsedSummaryDisplay: 'none',
      ariaExpanded: 'true',
      ariaHidden: 'false',
      collapseToggleLabel: 'Collapse'
    });
  });
});
