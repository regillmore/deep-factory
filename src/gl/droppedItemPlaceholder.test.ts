import { describe, expect, it } from 'vitest';

import { getDroppedItemPlaceholderPalette } from './droppedItemPlaceholder';

describe('droppedItemPlaceholder', () => {
  it('provides a dedicated placeholder palette for stone-block pickups', () => {
    expect(getDroppedItemPlaceholderPalette('stone-block')).toEqual({
      baseColor: [0.41, 0.43, 0.47],
      accentColor: [0.67, 0.69, 0.74]
    });
  });

  it('provides a dedicated placeholder palette for heart-crystal pickups', () => {
    expect(getDroppedItemPlaceholderPalette('heart-crystal')).toEqual({
      baseColor: [0.76, 0.23, 0.31],
      accentColor: [0.99, 0.73, 0.82]
    });
  });
});
