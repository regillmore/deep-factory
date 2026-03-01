import { describe, expect, it } from 'vitest';

import { formatDebugOverlayText, type DebugOverlayStats } from './debugOverlay';

const baseStats: DebugOverlayStats = {
  atlasSourceKind: 'authored',
  renderedChunks: 4,
  drawCalls: 4,
  drawCallBudget: 256,
  meshBuilds: 2,
  meshBuildBudget: 4,
  meshBuildTimeMs: 1.5,
  meshBuildQueueLength: 7,
  residentWorldChunks: 20,
  cachedChunkMeshes: 18,
  evictedWorldChunks: 1,
  evictedMeshEntries: 1
};

describe('formatDebugOverlayText', () => {
  it('includes a pointer n/a line when no pointer snapshot is available', () => {
    const text = formatDebugOverlayText(60, baseStats, null);

    expect(text).toContain('FPS: 60.0');
    expect(text).toContain('\nAtlas: authored');
    expect(text).toContain('Draws: 4/256 (OK)');
    expect(text).toContain('\nPtr: n/a');
  });

  it('shows when the renderer is using the placeholder atlas fallback', () => {
    const text = formatDebugOverlayText(60, { ...baseStats, atlasSourceKind: 'placeholder' }, null);

    expect(text).toContain('\nAtlas: placeholder');
  });

  it('formats pointer client/canvas/world/tile readout with tile identity and gameplay flags', () => {
    const text = formatDebugOverlayText(120.25, baseStats, {
      pointer: {
        client: { x: 500.4, y: 250.6 },
        canvas: { x: 1000.2, y: 501.8 },
        world: { x: -32.125, y: 16.5 },
        tile: { x: -3, y: 1 },
        pointerType: 'mouse',
        tileId: 1,
        tileLabel: 'stone',
        solid: true,
        blocksLight: true,
        liquidKind: null
      },
      pinned: null
    });

    expect(text).toContain('Ptr(mouse)');
    expect(text).toContain('C:500,251');
    expect(text).toContain('Cv:1000,502');
    expect(text).toContain('W:-32.13,16.50');
    expect(text).toContain('Tile:stone (#1)');
    expect(text).toContain('T:-3,1');
    expect(text).toContain('Ch:-1,0');
    expect(text).toContain('L:29,1');
    expect(text).toContain('solid:on');
    expect(text).toContain('light:on');
    expect(text).toContain('liquid:none');
  });

  it('shows pinned tile metadata even when no live pointer snapshot is available', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      pinned: {
        tile: { x: 40, y: -2 },
        tileId: 2,
        tileLabel: 'grass',
        solid: true,
        blocksLight: false,
        liquidKind: 'water'
      }
    });

    expect(text).toContain('\nPtr: n/a');
    expect(text).toContain('Pin: Tile:grass (#2)');
    expect(text).toContain('T:40,-2');
    expect(text).toContain('Ch:1,-1');
    expect(text).toContain('L:8,30');
    expect(text).toContain('solid:on');
    expect(text).toContain('light:off');
    expect(text).toContain('liquid:water');
  });

  it('renders separate pointer and pinned inspect lines when both are present', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: {
        client: { x: 12, y: 34 },
        canvas: { x: 24, y: 68 },
        world: { x: 80, y: 96 },
        tile: { x: 5, y: 6 },
        pointerType: 'touch',
        tileId: 3,
        tileLabel: 'dirt',
        solid: true,
        blocksLight: true,
        liquidKind: null
      },
      pinned: {
        tile: { x: -1, y: 65 },
        tileId: 4,
        tileLabel: 'lava',
        solid: false,
        blocksLight: false,
        liquidKind: 'lava'
      }
    });

    expect(text).toContain('Ptr(touch)');
    expect(text).toContain('Tile:dirt (#3)');
    expect(text).toContain('\nPin: Tile:lava (#4)');
    expect(text).toContain('T:-1,65');
    expect(text).toContain('Ch:-1,2');
    expect(text).toContain('L:31,1');
    expect(text).toContain('liquid:lava');
  });
});
