import { describe, expect, it } from 'vitest';

import { getDroppedItemPlaceholderPalette } from './droppedItemPlaceholder';

describe('droppedItemPlaceholder', () => {
  it('provides a dedicated placeholder palette for stone-block pickups', () => {
    expect(getDroppedItemPlaceholderPalette('stone-block')).toEqual({
      baseColor: [0.41, 0.43, 0.47],
      accentColor: [0.67, 0.69, 0.74]
    });
  });
});
