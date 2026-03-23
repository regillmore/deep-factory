import { describe, expect, it } from 'vitest';

import { getDroppedItemPlaceholderPalette } from './droppedItemPlaceholder';

describe('droppedItemPlaceholder', () => {
  it('provides a dedicated placeholder palette for acorn pickups', () => {
    expect(getDroppedItemPlaceholderPalette('acorn')).toEqual({
      baseColor: [0.44, 0.29, 0.12],
      accentColor: [0.75, 0.62, 0.28]
    });
  });

  it('provides a dedicated placeholder palette for starter-axe pickups', () => {
    expect(getDroppedItemPlaceholderPalette('axe')).toEqual({
      baseColor: [0.56, 0.42, 0.24],
      accentColor: [0.86, 0.63, 0.31]
    });
  });

  it('provides a dedicated placeholder palette for stone-block pickups', () => {
    expect(getDroppedItemPlaceholderPalette('stone-block')).toEqual({
      baseColor: [0.41, 0.43, 0.47],
      accentColor: [0.67, 0.69, 0.74]
    });
  });

  it('provides a dedicated placeholder palette for dirt-wall pickups', () => {
    expect(getDroppedItemPlaceholderPalette('dirt-wall')).toEqual({
      baseColor: [0.39, 0.28, 0.17],
      accentColor: [0.61, 0.48, 0.31]
    });
  });

  it('provides a dedicated placeholder palette for wood-block pickups', () => {
    expect(getDroppedItemPlaceholderPalette('wood-block')).toEqual({
      baseColor: [0.46, 0.29, 0.13],
      accentColor: [0.75, 0.57, 0.3]
    });
  });

  it('provides a dedicated placeholder palette for wood-wall pickups', () => {
    expect(getDroppedItemPlaceholderPalette('wood-wall')).toEqual({
      baseColor: [0.4, 0.25, 0.12],
      accentColor: [0.65, 0.49, 0.27]
    });
  });

  it('provides a dedicated placeholder palette for copper-ore pickups', () => {
    expect(getDroppedItemPlaceholderPalette('copper-ore')).toEqual({
      baseColor: [0.65, 0.35, 0.17],
      accentColor: [0.94, 0.71, 0.38]
    });
  });

  it('provides a dedicated placeholder palette for copper-bar pickups', () => {
    expect(getDroppedItemPlaceholderPalette('copper-bar')).toEqual({
      baseColor: [0.71, 0.45, 0.24],
      accentColor: [0.98, 0.79, 0.52]
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

  it('provides a dedicated placeholder palette for wood pickups', () => {
    expect(getDroppedItemPlaceholderPalette('wood')).toEqual({
      baseColor: [0.52, 0.36, 0.19],
      accentColor: [0.84, 0.67, 0.4]
    });
  });

  it('provides a dedicated placeholder palette for umbrella pickups', () => {
    expect(getDroppedItemPlaceholderPalette('umbrella')).toEqual({
      baseColor: [0.53, 0.35, 0.16],
      accentColor: [0.96, 0.82, 0.48]
    });
  });

  it('provides a dedicated placeholder palette for bug-net and bunny pickups', () => {
    expect(getDroppedItemPlaceholderPalette('bug-net')).toEqual({
      baseColor: [0.39, 0.55, 0.31],
      accentColor: [0.86, 0.9, 0.57]
    });
    expect(getDroppedItemPlaceholderPalette('bunny')).toEqual({
      baseColor: [0.68, 0.61, 0.54],
      accentColor: [0.96, 0.9, 0.82]
    });
  });

  it('provides a dedicated placeholder palette for workbench pickups', () => {
    expect(getDroppedItemPlaceholderPalette('workbench')).toEqual({
      baseColor: [0.49, 0.34, 0.19],
      accentColor: [0.77, 0.64, 0.42]
    });
  });

  it('provides a dedicated placeholder palette for furnace pickups', () => {
    expect(getDroppedItemPlaceholderPalette('furnace')).toEqual({
      baseColor: [0.38, 0.36, 0.34],
      accentColor: [0.83, 0.58, 0.26]
    });
  });

  it('provides a dedicated placeholder palette for anvil pickups', () => {
    expect(getDroppedItemPlaceholderPalette('anvil')).toEqual({
      baseColor: [0.32, 0.35, 0.41],
      accentColor: [0.77, 0.81, 0.88]
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

  it('provides a dedicated placeholder palette for starter-wand pickups', () => {
    expect(getDroppedItemPlaceholderPalette('wand')).toEqual({
      baseColor: [0.29, 0.33, 0.68],
      accentColor: [0.94, 0.79, 0.38]
    });
  });
});
