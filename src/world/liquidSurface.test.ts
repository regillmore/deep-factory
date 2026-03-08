import { describe, expect, it } from 'vitest';

import { TILE_METADATA } from './tileMetadata';
import {
  resolveConnectedLiquidNeighborLevel,
  resolveLiquidSurfaceBottomAtlasPixelRows,
  resolveLiquidSurfaceBottomVCrops,
  resolveLiquidSurfaceBranchKind,
  resolveLiquidSurfaceCroppedFrameAtlasPixelHeights,
  resolveLiquidSurfaceCroppedFrameRemainders,
  resolveLiquidSurfaceFrameAtlasPixelHeight,
  resolveLiquidSurfaceFrameBottomAtlasPixelRow,
  resolveLiquidSurfaceFrameBottomV,
  resolveLiquidSurfaceFrameHeightV,
  resolveLiquidSurfaceFrameTopAtlasPixelRow,
  resolveLiquidSurfaceFrameTopV,
  resolveLiquidSurfaceVisibleFrameAtlasPixelHeights,
  resolveLiquidSurfaceVisibleFrameHeights,
  resolveLiquidSurfaceTopHeights
} from './liquidSurface';

describe('resolveLiquidSurfaceBranchKind', () => {
  it('classifies empty tiles when the clamped center fill is zero', () => {
    expect(
      resolveLiquidSurfaceBranchKind({
        center: -3,
        north: 8,
        east: 8,
        west: 8
      })
    ).toBe('empty');
  });

  it('classifies north-covered tiles when same-kind liquid continues above', () => {
    expect(
      resolveLiquidSurfaceBranchKind({
        center: 3,
        north: 2,
        east: 8,
        west: 0
      })
    ).toBe('north-covered');
  });

  it('classifies exposed tiles when liquid remains in the center without a north cover tile', () => {
    expect(
      resolveLiquidSurfaceBranchKind({
        center: 4,
        north: 0,
        east: 2,
        west: 8
      })
    ).toBe('exposed');
  });
});

describe('resolveLiquidSurfaceTopHeights', () => {
  it('returns zero heights when the center tile has no liquid after clamping', () => {
    expect(
      resolveLiquidSurfaceTopHeights({
        center: -3,
        north: 8,
        east: 8,
        west: 8
      })
    ).toEqual({
      topLeft: 0,
      topRight: 0
    });
  });

  it('clamps out-of-range exposed fill levels before resolving corner heights', () => {
    expect(
      resolveLiquidSurfaceTopHeights({
        center: 4,
        north: 0,
        east: 99,
        west: -12
      })
    ).toEqual({
      topLeft: 0.5,
      topRight: 0.75
    });
  });

  it('forces a full-height top when same-kind liquid continues above the tile', () => {
    expect(
      resolveLiquidSurfaceTopHeights({
        center: 3,
        north: 2,
        east: 8,
        west: 0
      })
    ).toEqual({
      topLeft: 1,
      topRight: 1
    });
  });

  it('resolves asymmetric exposed slopes from same-kind side neighbors', () => {
    expect(
      resolveLiquidSurfaceTopHeights({
        center: 4,
        north: 0,
        east: 2,
        west: 8
      })
    ).toEqual({
      topLeft: 0.75,
      topRight: 0.375
    });
  });

  it('keeps shared boundary heights continuous across neighboring tiles', () => {
    const leftTile = resolveLiquidSurfaceTopHeights({
      center: 4,
      north: 0,
      east: 8,
      west: 0
    });
    const rightTile = resolveLiquidSurfaceTopHeights({
      center: 8,
      north: 0,
      east: 0,
      west: 4
    });

    expect(leftTile.topRight).toBe(0.75);
    expect(rightTile.topLeft).toBe(0.75);
    expect(leftTile.topRight).toBe(rightTile.topLeft);
  });
});

describe('resolveConnectedLiquidNeighborLevel', () => {
  const waterTileId =
    TILE_METADATA.tiles.find((tile) => tile.gameplay?.liquidKind === 'water')?.id ?? null;
  const lavaTileId =
    TILE_METADATA.tiles.find((tile) => tile.gameplay?.liquidKind === 'lava')?.id ?? null;

  it('ignores non-connected liquid neighbors while preserving same-kind levels', () => {
    if (waterTileId === null || lavaTileId === null) {
      throw new Error('expected water and lava tile metadata');
    }

    expect(resolveConnectedLiquidNeighborLevel(waterTileId, waterTileId, 6)).toBe(6);
    expect(resolveConnectedLiquidNeighborLevel(waterTileId, lavaTileId, 6)).toBe(0);
  });
});

describe('resolveLiquidSurfaceBottomVCrops', () => {
  it('maps resolved liquid top heights onto bottom-edge variant v coordinates', () => {
    expect(
      resolveLiquidSurfaceBottomVCrops(
        {
          v0: 0.75,
          v1: 0.875
        },
        {
          topLeft: 0.5,
          topRight: 0.375
        }
      )
    ).toEqual({
      bottomLeftV: 0.8125,
      bottomRightV: 0.796875
    });
  });

  it('clamps invalid top heights before resolving bottom-edge crops', () => {
    expect(
      resolveLiquidSurfaceBottomVCrops(
        {
          v0: 0.5,
          v1: 0.75
        },
        {
          topLeft: 99,
          topRight: -4
        }
      )
    ).toEqual({
      bottomLeftV: 0.75,
      bottomRightV: 0.5
    });
  });
});

describe('resolveLiquidSurfaceFrameTopV', () => {
  it('returns the clamped current liquid-variant frame top v0', () => {
    expect(
      resolveLiquidSurfaceFrameTopV({
        v0: 0.75
      })
    ).toBe(0.75);
  });

  it('clamps invalid frame-top v0 values before exposing them', () => {
    expect(
      resolveLiquidSurfaceFrameTopV({
        v0: -2
      })
    ).toBe(0);
    expect(
      resolveLiquidSurfaceFrameTopV({
        v0: 3
      })
    ).toBe(1);
  });
});

describe('resolveLiquidSurfaceFrameTopAtlasPixelRow', () => {
  it('maps the clamped current liquid-variant frame top v0 onto an atlas pixel row', () => {
    expect(
      resolveLiquidSurfaceFrameTopAtlasPixelRow(64, {
        v0: 0.75
      })
    ).toBe(48);
  });

  it('clamps invalid frame-top v0 values before resolving atlas pixel rows', () => {
    expect(
      resolveLiquidSurfaceFrameTopAtlasPixelRow(64, {
        v0: -2
      })
    ).toBe(0);
    expect(
      resolveLiquidSurfaceFrameTopAtlasPixelRow(64, {
        v0: 3
      })
    ).toBe(64);
  });
});

describe('resolveLiquidSurfaceFrameBottomV', () => {
  it('returns the clamped current liquid-variant frame bottom v1', () => {
    expect(
      resolveLiquidSurfaceFrameBottomV({
        v1: 0.875
      })
    ).toBe(0.875);
  });

  it('clamps invalid frame-bottom v1 values before exposing them', () => {
    expect(
      resolveLiquidSurfaceFrameBottomV({
        v1: -2
      })
    ).toBe(0);
    expect(
      resolveLiquidSurfaceFrameBottomV({
        v1: 3
      })
    ).toBe(1);
  });
});

describe('resolveLiquidSurfaceFrameBottomAtlasPixelRow', () => {
  it('maps the clamped current liquid-variant frame bottom v1 onto an atlas pixel row', () => {
    expect(
      resolveLiquidSurfaceFrameBottomAtlasPixelRow(64, {
        v1: 0.875
      })
    ).toBe(56);
  });

  it('clamps invalid frame-bottom v1 values before resolving atlas pixel rows', () => {
    expect(
      resolveLiquidSurfaceFrameBottomAtlasPixelRow(64, {
        v1: -2
      })
    ).toBe(0);
    expect(
      resolveLiquidSurfaceFrameBottomAtlasPixelRow(64, {
        v1: 3
      })
    ).toBe(64);
  });
});

describe('resolveLiquidSurfaceFrameHeightV', () => {
  it('resolves the clamped current liquid-variant frame height in normalized v units', () => {
    expect(
      resolveLiquidSurfaceFrameHeightV({
        v0: 0.75,
        v1: 0.875
      })
    ).toBe(0.125);
  });

  it('clamps invalid frame bounds before resolving frame height', () => {
    expect(
      resolveLiquidSurfaceFrameHeightV({
        v0: -2,
        v1: 3
      })
    ).toBe(1);
    expect(
      resolveLiquidSurfaceFrameHeightV({
        v0: 4,
        v1: -2
      })
    ).toBe(0);
  });
});

describe('resolveLiquidSurfaceFrameAtlasPixelHeight', () => {
  it('maps the clamped current liquid-variant frame height onto atlas pixels', () => {
    expect(
      resolveLiquidSurfaceFrameAtlasPixelHeight(64, {
        v0: 0.75,
        v1: 0.875
      })
    ).toBe(8);
  });

  it('clamps invalid frame bounds before resolving atlas-pixel frame height', () => {
    expect(
      resolveLiquidSurfaceFrameAtlasPixelHeight(64, {
        v0: -2,
        v1: 3
      })
    ).toBe(64);
    expect(
      resolveLiquidSurfaceFrameAtlasPixelHeight(64, {
        v0: 4,
        v1: -2
      })
    ).toBe(0);
  });
});

describe('resolveLiquidSurfaceBottomAtlasPixelRows', () => {
  it('maps resolved bottom-edge v crops onto atlas pixel rows', () => {
    expect(
      resolveLiquidSurfaceBottomAtlasPixelRows(64, {
        bottomLeftV: 0.8125,
        bottomRightV: 0.796875
      })
    ).toEqual({
      bottomLeftPixelY: 52,
      bottomRightPixelY: 51
    });
  });

  it('clamps invalid bottom-edge v crops before resolving atlas pixel rows', () => {
    expect(
      resolveLiquidSurfaceBottomAtlasPixelRows(64, {
        bottomLeftV: 4,
        bottomRightV: -2
      })
    ).toEqual({
      bottomLeftPixelY: 64,
      bottomRightPixelY: 0
    });
  });
});

describe('resolveLiquidSurfaceVisibleFrameHeights', () => {
  it('resolves per-side visible frame-height deltas from the current variant top edge', () => {
    expect(
      resolveLiquidSurfaceVisibleFrameHeights(
        {
          v0: 0.75,
          v1: 0.875
        },
        {
          bottomLeftV: 0.8125,
          bottomRightV: 0.796875
        }
      )
    ).toEqual({
      visibleLeftV: 0.0625,
      visibleRightV: 0.046875
    });
  });

  it('clamps invalid frame and crop inputs before resolving visible frame heights', () => {
    expect(
      resolveLiquidSurfaceVisibleFrameHeights(
        {
          v0: 0.5,
          v1: 0.75
        },
        {
          bottomLeftV: 4,
          bottomRightV: -2
        }
      )
    ).toEqual({
      visibleLeftV: 0.25,
      visibleRightV: 0
    });
  });
});

describe('resolveLiquidSurfaceVisibleFrameAtlasPixelHeights', () => {
  it('maps visible frame-height deltas onto atlas-pixel heights', () => {
    expect(
      resolveLiquidSurfaceVisibleFrameAtlasPixelHeights(
        64,
        {
          v0: 0.75,
          v1: 0.875
        },
        {
          bottomLeftV: 0.8125,
          bottomRightV: 0.796875
        }
      )
    ).toEqual({
      visibleLeftPixelHeight: 4,
      visibleRightPixelHeight: 3
    });
  });

  it('reuses clamped bottom-pixel rows when resolving visible frame pixel heights', () => {
    expect(
      resolveLiquidSurfaceVisibleFrameAtlasPixelHeights(
        64,
        {
          v0: 0.5,
          v1: 0.75
        },
        {
          bottomLeftV: 4,
          bottomRightV: -2
        }
      )
    ).toEqual({
      visibleLeftPixelHeight: 16,
      visibleRightPixelHeight: 0
    });
  });
});

describe('resolveLiquidSurfaceCroppedFrameRemainders', () => {
  it('resolves per-side cropped remainder deltas from the current variant bottom edge', () => {
    expect(
      resolveLiquidSurfaceCroppedFrameRemainders(
        {
          v0: 0.75,
          v1: 0.875
        },
        {
          bottomLeftV: 0.8125,
          bottomRightV: 0.796875
        }
      )
    ).toEqual({
      remainderLeftV: 0.0625,
      remainderRightV: 0.078125
    });
  });

  it('clamps invalid frame and crop inputs before resolving cropped remainder deltas', () => {
    expect(
      resolveLiquidSurfaceCroppedFrameRemainders(
        {
          v0: 0.5,
          v1: 0.75
        },
        {
          bottomLeftV: 4,
          bottomRightV: -2
        }
      )
    ).toEqual({
      remainderLeftV: 0,
      remainderRightV: 0.25
    });
  });
});

describe('resolveLiquidSurfaceCroppedFrameAtlasPixelHeights', () => {
  it('maps cropped remainder deltas onto atlas-pixel heights', () => {
    expect(
      resolveLiquidSurfaceCroppedFrameAtlasPixelHeights(
        64,
        {
          v0: 0.75,
          v1: 0.875
        },
        {
          bottomLeftV: 0.8125,
          bottomRightV: 0.796875
        }
      )
    ).toEqual({
      remainderLeftPixelHeight: 4,
      remainderRightPixelHeight: 5
    });
  });

  it('reuses clamped bottom-pixel rows when resolving cropped remainder pixel heights', () => {
    expect(
      resolveLiquidSurfaceCroppedFrameAtlasPixelHeights(
        64,
        {
          v0: 0.5,
          v1: 0.75
        },
        {
          bottomLeftV: 4,
          bottomRightV: -2
        }
      )
    ).toEqual({
      remainderLeftPixelHeight: 0,
      remainderRightPixelHeight: 16
    });
  });
});
