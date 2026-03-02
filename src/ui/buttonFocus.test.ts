import { describe, expect, it } from 'vitest';

import { shouldReleaseButtonFocusAfterClick } from './buttonFocus';

describe('shouldReleaseButtonFocusAfterClick', () => {
  it('releases focus after pointer-generated button clicks', () => {
    expect(shouldReleaseButtonFocusAfterClick(1)).toBe(true);
    expect(shouldReleaseButtonFocusAfterClick(2)).toBe(true);
  });

  it('keeps focus for keyboard-generated button clicks', () => {
    expect(shouldReleaseButtonFocusAfterClick(0)).toBe(false);
  });
});
