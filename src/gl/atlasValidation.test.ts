import { describe, expect, it } from 'vitest';

import { collectAtlasValidationWarnings } from './atlasValidation';
import type { TileMetadataEntry } from '../world/tileMetadata';
import type { WallMetadataEntry } from '../world/wallMetadata';

describe('collectAtlasValidationWarnings', () => {
  it('returns no warnings when tiles and walls only use atlas indices or in-bounds uv rects', () => {
    const tiles: TileMetadataEntry[] = [
      {
        id: 1,
        name: 'stone',
        render: { atlasIndex: 0 },
        terrainAutotile: {
          placeholderVariantAtlasByCardinalMask: Array.from({ length: 16 }, (_, index) => index)
        }
      },
      {
        id: 2,
        name: 'panel',
        render: {
          uvRect: { u0: 0.25, v0: 0.25, u1: 0.5, v1: 0.5 },
          frames: [
            { uvRect: { u0: 0.25, v0: 0.25, u1: 0.5, v1: 0.5 } },
            { atlasIndex: 3 }
          ],
          frameDurationMs: 120
        }
      }
    ];
    const walls: WallMetadataEntry[] = [
      {
        id: 0,
        name: 'empty'
      },
      {
        id: 1,
        name: 'dirt_wall',
        render: { atlasIndex: 0 }
      },
      {
        id: 2,
        name: 'panel_wall',
        render: {
          uvRect: { u0: 0.25, v0: 0.25, u1: 0.5, v1: 0.5 }
        }
      }
    ];

    expect(collectAtlasValidationWarnings(tiles, 96, 64, walls)).toEqual([]);
  });

  it('reports authored atlas-index sources when the loaded atlas is smaller than the authored layout', () => {
    const tiles: TileMetadataEntry[] = [
      {
        id: 3,
        name: 'brick',
        render: {
          atlasIndex: 15,
          frames: [{ atlasIndex: 15 }],
          frameDurationMs: 120
        }
      },
      {
        id: 4,
        name: 'ground',
        terrainAutotile: {
          placeholderVariantAtlasByCardinalMask: Array.from({ length: 16 }, (_, index) =>
            index === 15 ? 15 : 0
          )
        }
      }
    ];

    const warnings = collectAtlasValidationWarnings(tiles, 48, 48);

    expect(warnings).toHaveLength(3);
    expect(warnings[0]?.kind).toBe('bounds');
    expect(warnings[0]?.sourcePath).toBe('render.atlasIndex');
    expect(warnings[0]?.message).toContain('[48, 48]..[64, 64] outside atlas 48x48');
    expect(warnings[1]?.sourcePath).toBe('render.frames[0].atlasIndex');
    expect(warnings[2]?.sourcePath).toBe('terrainAutotile.placeholderVariantAtlasByCardinalMask[15]');
  });

  it('reports out-of-bounds static and animated uv rects with tile-specific source paths', () => {
    const tiles: TileMetadataEntry[] = [
      {
        id: 7,
        name: 'broken_panel',
        render: {
          uvRect: { u0: 0.75, v0: 0.75, u1: 1.25, v1: 1.0 },
          frames: [
            { uvRect: { u0: 0.75, v0: 0.75, u1: 1.25, v1: 1.0 } },
            { uvRect: { u0: -0.125, v0: 0, u1: 0.125, v1: 0.25 } }
          ],
          frameDurationMs: 120
        }
      }
    ];

    const warnings = collectAtlasValidationWarnings(tiles, 96, 64);

    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toMatchObject({
      entryKind: 'tile',
      entryId: 7,
      entryName: 'broken_panel',
      kind: 'bounds',
      sourcePath: 'render.uvRect',
      summary: 'tile 7 "broken_panel" render.uvRect'
    });
    expect(warnings[0]?.message).toContain('[72, 48]..[120, 64] outside atlas 96x64');
    expect(warnings[1]?.sourcePath).toBe('render.frames[0].uvRect');
    expect(warnings[2]?.sourcePath).toBe('render.frames[1].uvRect');
    expect(warnings[2]?.message).toContain('[-12, 0]..[12, 16]');
  });

  it('reports direct uv rects that do not land on whole atlas pixels', () => {
    const tiles: TileMetadataEntry[] = [
      {
        id: 8,
        name: 'misaligned_panel',
        render: {
          uvRect: { u0: 0.1, v0: 0.25, u1: 0.5, v1: 0.75 },
          frames: [
            { uvRect: { u0: 0.1, v0: 0.25, u1: 0.5, v1: 0.75 } },
            { uvRect: { u0: 0.5, v0: 0.125, u1: 0.9, v1: 0.625 } }
          ],
          frameDurationMs: 120
        }
      }
    ];

    const warnings = collectAtlasValidationWarnings(tiles, 96, 64);

    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toMatchObject({
      entryKind: 'tile',
      entryId: 8,
      entryName: 'misaligned_panel',
      kind: 'pixelAlignment',
      sourcePath: 'render.uvRect'
    });
    expect(warnings[0]?.message).toContain('[9.6, 16]..[48, 48] on non-integer atlas pixels');
    expect(warnings[1]).toMatchObject({
      entryKind: 'tile',
      entryId: 8,
      entryName: 'misaligned_panel',
      kind: 'pixelAlignment',
      sourcePath: 'render.frames[0].uvRect'
    });
    expect(warnings[1]?.message).toContain('[9.6, 16]..[48, 48] on non-integer atlas pixels');
    expect(warnings[2]).toMatchObject({
      entryKind: 'tile',
      entryId: 8,
      entryName: 'misaligned_panel',
      kind: 'pixelAlignment',
      sourcePath: 'render.frames[1].uvRect'
    });
    expect(warnings[2]?.message).toContain('[48, 8]..[86.4, 40] on non-integer atlas pixels');
  });

  it('reports liquid variant render sources with variant-specific source paths', () => {
    const tiles: TileMetadataEntry[] = [
      {
        id: 9,
        name: 'water',
        gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
        liquidRender: {
          variantRenderByCardinalMask: [
            { atlasIndex: 15 },
            {
              uvRect: { u0: 0.1, v0: 0.25, u1: 0.5, v1: 0.75 },
              frames: [
                { uvRect: { u0: 0.1, v0: 0.25, u1: 0.5, v1: 0.75 } },
                { uvRect: { u0: -0.125, v0: 0, u1: 0.125, v1: 0.25 } }
              ],
              frameDurationMs: 120
            },
            ...Array.from({ length: 14 }, () => ({ atlasIndex: 0 }))
          ]
        }
      }
    ];

    const warnings = collectAtlasValidationWarnings(tiles, 48, 48);

    expect(warnings).toHaveLength(4);
    expect(warnings[0]?.sourcePath).toBe('liquidRender.variantRenderByCardinalMask[0].atlasIndex');
    expect(warnings[0]?.message).toContain('[48, 48]..[64, 64] outside atlas 48x48');
    expect(warnings[1]?.sourcePath).toBe('liquidRender.variantRenderByCardinalMask[1].uvRect');
    expect(warnings[1]?.kind).toBe('pixelAlignment');
    expect(warnings[2]?.sourcePath).toBe(
      'liquidRender.variantRenderByCardinalMask[1].frames[0].uvRect'
    );
    expect(warnings[2]?.kind).toBe('pixelAlignment');
    expect(warnings[3]?.sourcePath).toBe(
      'liquidRender.variantRenderByCardinalMask[1].frames[1].uvRect'
    );
    expect(warnings[3]?.kind).toBe('bounds');
  });

  it('reports wall render sources with wall-specific summaries and source paths', () => {
    const walls: WallMetadataEntry[] = [
      {
        id: 1,
        name: 'misaligned_wall',
        render: {
          uvRect: { u0: 0.1, v0: 0.25, u1: 0.5, v1: 0.75 }
        }
      },
      {
        id: 2,
        name: 'overflow_wall',
        render: {
          atlasIndex: 15
        }
      }
    ];

    const warnings = collectAtlasValidationWarnings([], 48, 48, walls);

    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatchObject({
      entryKind: 'wall',
      entryId: 1,
      entryName: 'misaligned_wall',
      kind: 'pixelAlignment',
      sourcePath: 'render.uvRect',
      summary: 'wall 1 "misaligned_wall" render.uvRect'
    });
    expect(warnings[0]?.message).toContain('[4.8, 12]..[24, 36] on non-integer atlas pixels');
    expect(warnings[1]).toMatchObject({
      entryKind: 'wall',
      entryId: 2,
      entryName: 'overflow_wall',
      kind: 'bounds',
      sourcePath: 'render.atlasIndex',
      summary: 'wall 2 "overflow_wall" render.atlasIndex'
    });
    expect(warnings[1]?.message).toContain('[48, 48]..[64, 64] outside atlas 48x48');
  });
});
