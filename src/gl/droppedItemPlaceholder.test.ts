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

  it('provides a dedicated placeholder palette for gel pickups', () => {
    expect(getDroppedItemPlaceholderPalette('gel')).toEqual({
      baseColor: [0.22, 0.58, 0.23],
      accentColor: [0.72, 0.93, 0.46]
    });
  });

  it('provides a dedicated placeholder palette for umbrella pickups', () => {
    expect(getDroppedItemPlaceholderPalette('umbrella')).toEqual({
      baseColor: [0.53, 0.35, 0.16],
      accentColor: [0.96, 0.82, 0.48]
    });
  });

  it('provides a dedicated placeholder palette for workbench pickups', () => {
    expect(getDroppedItemPlaceholderPalette('workbench')).toEqual({
      baseColor: [0.49, 0.34, 0.19],
      accentColor: [0.77, 0.64, 0.42]
    });
  });

  it('provides a dedicated placeholder palette for starter-sword pickups', () => {
    expect(getDroppedItemPlaceholderPalette('sword')).toEqual({
      baseColor: [0.62, 0.64, 0.7],
      accentColor: [0.97, 0.93, 0.62]
    });
  });

  it('provides a dedicated placeholder palette for starter-spear pickups', () => {
    expect(getDroppedItemPlaceholderPalette('spear')).toEqual({
      baseColor: [0.58, 0.49, 0.33],
      accentColor: [0.88, 0.82, 0.66]
    });
  });
});
