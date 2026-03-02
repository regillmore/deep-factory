import { describe, expect, it } from 'vitest';

import { formatDebugOverlayText, type DebugOverlayStats } from './debugOverlay';

const baseStats: DebugOverlayStats = {
  atlasSourceKind: 'authored',
  atlasWidth: 96,
  atlasHeight: 64,
  atlasValidationWarningCount: 0,
  atlasValidationFirstWarning: null,
  residentAnimatedChunkMeshes: 0,
  residentAnimatedChunkQuadCount: 0,
  animatedChunkUvUploadCount: 0,
  animatedChunkUvUploadQuadCount: 0,
  animatedChunkUvUploadBytes: 0,
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
    expect(text).toContain('\nAtlas: authored | 96x64');
    expect(text).toContain('\nAtlasWarn: none');
    expect(text).toContain('\nSpawn: unresolved');
    expect(text).toContain('\nPlayer: n/a');
    expect(text).toContain('\nContact: n/a');
    expect(text).toContain('\nIntent: n/a');
    expect(text).toContain('\nAnimMesh: chunks:0 | quads:0');
    expect(text).toContain('\nAnimUV: uploads:0 | quads:0 | bytes:0');
    expect(text).toContain('Draws: 4/256 (OK)');
    expect(text).toContain('\nPtr: n/a');
  });

  it('shows when the renderer is using the placeholder atlas fallback', () => {
    const text = formatDebugOverlayText(
      60,
      { ...baseStats, atlasSourceKind: 'placeholder', atlasWidth: 64, atlasHeight: 64 },
      null
    );

    expect(text).toContain('\nAtlas: placeholder | 64x64');
  });

  it('omits atlas dimensions while atlas initialization is still pending', () => {
    const text = formatDebugOverlayText(
      60,
      {
        ...baseStats,
        atlasSourceKind: 'pending',
        atlasWidth: null,
        atlasHeight: null,
        atlasValidationWarningCount: null,
        atlasValidationFirstWarning: null
      },
      null
    );

    expect(text).toContain('\nAtlas: pending');
    expect(text).not.toContain('pending |');
    expect(text).toContain('\nAtlasWarn: pending');
  });

  it('shows the first atlas uvRect warning when runtime validation finds issues', () => {
    const text = formatDebugOverlayText(
      60,
      {
        ...baseStats,
        atlasValidationWarningCount: 2,
        atlasValidationFirstWarning: 'tile 4 "debug_panel" render.uvRect'
      },
      null
    );

    expect(text).toContain('\nAtlasWarn: 2 | tile 4 "debug_panel" render.uvRect');
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
      spawn: {
        tile: { x: 0, y: -2 },
        world: { x: 8, y: -32 }
      },
      playerIntent: {
        moveX: 1,
        jumpHeld: true,
        jumpPressed: false
      },
      player: null,
      pinned: null
    });

    expect(text).toContain('Spawn: T:0,-2 | W:8.00,-32.00');
    expect(text).toContain('Intent: move:1 | jumpHeld:on | jumpPressed:off');
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

  it('shows live standalone player position, velocity, grounded state, and facing', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      spawn: null,
      playerIntent: {
        moveX: -1,
        jumpHeld: true,
        jumpPressed: true
      },
      player: {
        position: { x: 24.5, y: -12.25 },
        velocity: { x: -180, y: 60 },
        grounded: false,
        facing: 'left',
        contacts: {
          support: null,
          wall: { tileX: 0, tileY: -1, tileId: 3 },
          ceiling: { tileX: 1, tileY: -3, tileId: 5 }
        }
      },
      pinned: null
    });

    expect(text).toContain('\nPlayer: Pos:24.50,-12.25 | Vel:-180.00,60.00 | grounded:off | facing:left');
    expect(text).toContain('\nContact: support:none | wall:0,-1 (#3) | ceiling:1,-3 (#5)');
    expect(text).toContain('\nIntent: move:-1 | jumpHeld:on | jumpPressed:on');
  });

  it('shows animated chunk uv upload cost telemetry', () => {
    const text = formatDebugOverlayText(
      60,
      {
        ...baseStats,
        animatedChunkUvUploadCount: 2,
        animatedChunkUvUploadQuadCount: 5,
        animatedChunkUvUploadBytes: 3072
      },
      null
    );

    expect(text).toContain('\nAnimUV: uploads:2 | quads:5 | bytes:3072');
  });

  it('shows resident animated chunk mesh footprint telemetry even without uv uploads', () => {
    const text = formatDebugOverlayText(
      60,
      {
        ...baseStats,
        residentAnimatedChunkMeshes: 3,
        residentAnimatedChunkQuadCount: 11
      },
      null
    );

    expect(text).toContain('\nAnimMesh: chunks:3 | quads:11');
    expect(text).toContain('\nAnimUV: uploads:0 | quads:0 | bytes:0');
  });

  it('shows pinned tile metadata even when no live pointer snapshot is available', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      spawn: null,
      playerIntent: null,
      player: null,
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
      spawn: {
        tile: { x: -1, y: 0 },
        world: { x: -8, y: 0 }
      },
      playerIntent: {
        moveX: 0,
        jumpHeld: false,
        jumpPressed: false
      },
      player: null,
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
    expect(text).toContain('Spawn: T:-1,0 | W:-8.00,0.00');
    expect(text).toContain('Intent: move:0 | jumpHeld:off | jumpPressed:off');
    expect(text).toContain('Tile:dirt (#3)');
    expect(text).toContain('\nPin: Tile:lava (#4)');
    expect(text).toContain('T:-1,65');
    expect(text).toContain('Ch:-1,2');
    expect(text).toContain('L:31,1');
    expect(text).toContain('liquid:lava');
  });
});
