import { describe, expect, it } from 'vitest';

import { formatDebugOverlayText, type DebugOverlayStats } from './debugOverlay';

const baseStats: DebugOverlayStats = {
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
    expect(text).toContain('Draws: 4/256 (OK)');
    expect(text).toContain('\nPtr: n/a');
  });

  it('formats pointer client/canvas/world/tile readout with tile identity and gameplay flags', () => {
    const text = formatDebugOverlayText(120.25, baseStats, {
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
});
