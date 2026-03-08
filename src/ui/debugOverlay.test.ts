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
  residentAnimatedLiquidChunkQuadCount: 0,
  animatedChunkUvUploadCount: 0,
  animatedChunkUvUploadQuadCount: 0,
  animatedChunkUvUploadLiquidQuadCount: 0,
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
  residentDirtyLightChunks: 20,
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
    expect(text).toContain('\nSpawnSupport: unresolved');
    expect(text).toContain('\nSpawnLiquid: unresolved');
    expect(text).toContain('\nPlayer: n/a');
    expect(text).toContain('\nPose: n/a');
    expect(text).toContain('\nBonkHold: n/a');
    expect(text).toContain('\nLightSample: n/a');
    expect(text).toContain('\nGroundEvt: none');
    expect(text).toContain('\nFaceEvt: none');
    expect(text).toContain('\nRespawnEvt: none');
    expect(text).toContain('\nWallEvt: none');
    expect(text).toContain('\nCeilEvt: none');
    expect(text).toContain('\nAABB: n/a');
    expect(text).toContain('\nFollow: n/a');
    expect(text).toContain('\nContact: n/a');
    expect(text).toContain('\nIntent: n/a');
    expect(text).toContain('\nAnimMesh: chunks:0 | quads:0 | nonLiquid:0 | liquid:0');
    expect(text).toContain('\nAnimUV: uploads:0 | quads:0 | nonLiquid:0 | liquid:0 | bytes:0');
    expect(text).toContain('LightDirty: 20');
    expect(text).toContain('Draws: 4/256 (OK)');
    expect(text).toContain('\nPtr: n/a');
  });

  it('shows standalone-player nearby-light sampling telemetry when available', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      pinned: null,
      spawn: null,
      player: null,
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerNearbyLightLevel: 9,
      playerNearbyLightFactor: 0.6,
      playerNearbyLightSourceTile: { x: 2, y: 2 },
      playerNearbyLightSourceChunk: { x: 0, y: 0 },
      playerNearbyLightSourceLocalTile: { x: 2, y: 2 },
      playerIntent: null,
      playerCameraFollow: null,
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null
    });

    expect(text).toContain(
      '\nLightSample: 9/15 | factor:0.60 | source:2,2 | sourceChunk:0,0 | sourceLocal:2,2'
    );
  });

  it('uses renderer-provided nearby-light source chunk-local telemetry for negative-world source tiles', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      pinned: null,
      spawn: null,
      player: null,
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerNearbyLightLevel: 12,
      playerNearbyLightFactor: 0.8,
      playerNearbyLightSourceTile: { x: -33, y: -1 },
      playerNearbyLightSourceChunk: { x: -5, y: 4 },
      playerNearbyLightSourceLocalTile: { x: 9, y: 10 },
      playerIntent: null,
      playerCameraFollow: null,
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null
    });

    expect(text).toContain(
      '\nLightSample: 12/15 | factor:0.80 | source:-33,-1 | sourceChunk:-5,4 | sourceLocal:9,10'
    );
  });

  it('shows when the renderer is using the placeholder atlas fallback', () => {
    const text = formatDebugOverlayText(
      60,
      { ...baseStats, atlasSourceKind: 'placeholder', atlasWidth: 96, atlasHeight: 64 },
      null
    );

    expect(text).toContain('\nAtlas: placeholder | 96x64');
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
        world: { x: 8, y: -32 },
        supportTile: {
          x: 0,
          y: -1,
          id: 1,
          chunk: { x: 0, y: -1 },
          local: { x: 0, y: 31 }
        },
        liquidSafetyStatus: 'safe'
      },
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerIntent: {
        moveX: 1,
        jumpHeld: true,
        jumpPressed: false
      },
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null,
      playerCameraFollow: null,
      player: null,
      pinned: null
    });

    expect(text).toContain('Spawn: T:0,-2 | W:8.00,-32.00');
    expect(text).toContain('SpawnSupport: T:0,-1 (#1) | Ch:0,-1 | L:0,31');
    expect(text).toContain('SpawnLiquid: safe');
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

  it('shows the resolved liquid cardinal mask for hovered liquid tiles', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: {
        client: { x: 48, y: 80 },
        canvas: { x: 96, y: 160 },
        world: { x: 32, y: -16 },
        tile: { x: 2, y: -1 },
        pointerType: 'mouse',
        tileId: 7,
        tileLabel: 'water',
        solid: false,
        blocksLight: false,
        liquidKind: 'water',
        liquidLevel: 3,
        liquidSurfaceNorthLevel: 0,
        liquidSurfaceWestLevel: 5,
        liquidSurfaceCenterLevel: 3,
        liquidSurfaceEastLevel: 0,
        liquidSurfaceBranch: 'exposed',
        liquidSurfaceTopLeft: 0.5,
        liquidSurfaceTopRight: 0.375,
        liquidFrameTopV: 0,
        liquidFrameTopPixelY: 0,
        liquidFrameBottomV: 0.25,
        liquidFrameBottomPixelY: 16,
        liquidFrameHeightV: 0.25,
        liquidFramePixelHeight: 16,
        liquidBottomLeftV: 0.125,
        liquidBottomRightV: 0.09375,
        liquidBottomLeftPixelY: 8,
        liquidBottomRightPixelY: 6,
        liquidVisibleLeftV: 0.125,
        liquidVisibleRightV: 0.09375,
        liquidVisibleLeftPixelHeight: 8,
        liquidVisibleRightPixelHeight: 6,
        liquidRemainderLeftV: 0.125,
        liquidRemainderRightV: 0.15625,
        liquidRemainderLeftPercentage: 50,
        liquidRemainderRightPercentage: 62.5,
        liquidRemainderLeftPixelHeight: 8,
        liquidRemainderRightPixelHeight: 10,
        liquidConnectivityGroupLabel: 'water',
        liquidCardinalMask: 11,
        liquidVariantSource: 'uvRect 0.667,0..0.75,0.25',
        liquidVariantUvRect: '0.667,0..0.75,0.25',
        liquidVariantPixelBounds: '64,0..72,16'
      },
      spawn: null,
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerIntent: null,
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null,
      playerCameraFollow: null,
      player: null,
      pinned: null
    });

    expect(text).toContain('Tile:water (#7)');
    expect(text).toContain('liquid:water');
    expect(text).toContain('liquidLevel:3/8');
    expect(text).toContain('liquidSurfaceIn:north=0/8 west=5/8 center=3/8 east=0/8');
    expect(text).toContain('liquidSurfaceBranch:exposed');
    expect(text).toContain('liquidTopLeft:0.5');
    expect(text).toContain('liquidTopRight:0.375');
    expect(text).toContain('liquidFrameTopV:0');
    expect(text).toContain('liquidFrameTopPxY:0');
    expect(text).toContain('liquidFrameBottomV:0.25');
    expect(text).toContain('liquidFrameBottomPxY:16');
    expect(text).toContain('liquidFrameHeightV:0.25');
    expect(text).toContain('liquidFramePxH:16');
    expect(text).toContain('liquidBottomLeftV:0.125');
    expect(text).toContain('liquidBottomRightV:0.094');
    expect(text).toContain('liquidBottomLeftPxY:8');
    expect(text).toContain('liquidBottomRightPxY:6');
    expect(text).toContain('liquidVisibleLeftV:0.125');
    expect(text).toContain('liquidVisibleRightV:0.094');
    expect(text).toContain('liquidVisibleLeftPxH:8');
    expect(text).toContain('liquidVisibleRightPxH:6');
    expect(text).toContain('liquidRemainderLeftV:0.125');
    expect(text).toContain('liquidRemainderRightV:0.156');
    expect(text).toContain('liquidRemainderLeftPct:50%');
    expect(text).toContain('liquidRemainderRightPct:62.5%');
    expect(text).toContain('liquidRemainderLeftPxH:8');
    expect(text).toContain('liquidRemainderRightPxH:10');
    expect(text).toContain('liquidGroup:water');
    expect(text).toContain('liquidMask:NE-W (11)');
    expect(text).toContain('liquidSrc:uvRect 0.667,0..0.75,0.25');
    expect(text).toContain('liquidUv:0.667,0..0.75,0.25');
    expect(text).toContain('liquidPx:64,0..72,16');
  });

  it('shows the resolved liquid animation frame index for hovered animated liquid tiles', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: {
        client: { x: 48, y: 80 },
        canvas: { x: 96, y: 160 },
        world: { x: 32, y: -16 },
        tile: { x: 2, y: -1 },
        pointerType: 'mouse',
        tileId: 7,
        tileLabel: 'water',
        solid: false,
        blocksLight: false,
        liquidKind: 'water',
        liquidLevel: 5,
        liquidSurfaceTopLeft: 0.625,
        liquidSurfaceTopRight: 0.25,
        liquidFrameTopV: 0,
        liquidFrameTopPixelY: 0,
        liquidFrameBottomV: 0.25,
        liquidFrameBottomPixelY: 16,
        liquidFrameHeightV: 0.25,
        liquidFramePixelHeight: 16,
        liquidBottomLeftV: 0.15625,
        liquidBottomRightV: 0.0625,
        liquidBottomLeftPixelY: 10,
        liquidBottomRightPixelY: 4,
        liquidVisibleLeftV: 0.15625,
        liquidVisibleRightV: 0.0625,
        liquidVisibleLeftPixelHeight: 10,
        liquidVisibleRightPixelHeight: 4,
        liquidRemainderLeftV: 0.09375,
        liquidRemainderRightV: 0.1875,
        liquidRemainderLeftPercentage: 37.5,
        liquidRemainderRightPercentage: 75,
        liquidRemainderLeftPixelHeight: 6,
        liquidRemainderRightPixelHeight: 12,
        liquidConnectivityGroupLabel: 'water',
        liquidCardinalMask: 11,
        liquidAnimationFrameIndex: 1,
        liquidAnimationFrameCount: 2,
        liquidAnimationFrameDurationMs: 180,
        liquidAnimationFrameElapsedMs: 60,
        liquidAnimationFrameProgressNormalized: 60 / 180,
        liquidAnimationFrameRemainingMs: 120,
        liquidAnimationLoopDurationMs: 360,
        liquidAnimationLoopElapsedMs: 240,
        liquidAnimationLoopProgressNormalized: 240 / 360,
        liquidAnimationLoopRemainingMs: 120,
        liquidVariantSource: 'uvRect 0.75,0..0.833,0.25',
        liquidVariantUvRect: '0.75,0..0.833,0.25',
        liquidVariantPixelBounds: '72,0..80,16'
      },
      spawn: null,
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerIntent: null,
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null,
      playerCameraFollow: null,
      player: null,
      pinned: null
    });

    expect(text).toContain('liquidMask:NE-W (11)');
    expect(text).toContain('liquidLevel:5/8');
    expect(text).toContain('liquidTopLeft:0.625');
    expect(text).toContain('liquidTopRight:0.25');
    expect(text).toContain('liquidFrameTopV:0');
    expect(text).toContain('liquidFrameTopPxY:0');
    expect(text).toContain('liquidFrameBottomV:0.25');
    expect(text).toContain('liquidFrameBottomPxY:16');
    expect(text).toContain('liquidFrameHeightV:0.25');
    expect(text).toContain('liquidFramePxH:16');
    expect(text).toContain('liquidBottomLeftV:0.156');
    expect(text).toContain('liquidBottomRightV:0.063');
    expect(text).toContain('liquidBottomLeftPxY:10');
    expect(text).toContain('liquidBottomRightPxY:4');
    expect(text).toContain('liquidVisibleLeftV:0.156');
    expect(text).toContain('liquidVisibleRightV:0.063');
    expect(text).toContain('liquidVisibleLeftPxH:10');
    expect(text).toContain('liquidVisibleRightPxH:4');
    expect(text).toContain('liquidRemainderLeftV:0.094');
    expect(text).toContain('liquidRemainderRightV:0.188');
    expect(text).toContain('liquidRemainderLeftPct:37.5%');
    expect(text).toContain('liquidRemainderRightPct:75%');
    expect(text).toContain('liquidRemainderLeftPxH:6');
    expect(text).toContain('liquidRemainderRightPxH:12');
    expect(text).toContain('liquidFrame:1/2');
    expect(text).toContain('liquidFrameDur:180ms');
    expect(text).toContain('liquidFrameElapsed:60ms');
    expect(text).toContain('liquidFrameRemain:120ms');
    expect(text).toContain('liquidFramePct:33.3%');
    expect(text).toContain('liquidLoopDur:360ms');
    expect(text).toContain('liquidLoopElapsed:240ms');
    expect(text).toContain('liquidLoopPct:66.7%');
    expect(text).toContain('liquidLoopRemain:120ms');
    expect(text).toContain('liquidSrc:uvRect 0.75,0..0.833,0.25');
    expect(text).toContain('liquidUv:0.75,0..0.833,0.25');
    expect(text).toContain('liquidPx:72,0..80,16');
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
      playerGroundedTransition: {
        kind: 'jump',
        position: { x: 24.5, y: -12.25 },
        velocity: { x: -180, y: -220 }
      },
      playerPlaceholderPoseLabel: 'wall-slide',
      playerCeilingBonkHoldActive: false,
      playerFacingTransition: {
        kind: 'left',
        previousFacing: 'right',
        nextFacing: 'left',
        position: { x: 24.5, y: -12.25 },
        velocity: { x: -180, y: 60 }
      },
      playerRespawn: {
        kind: 'embedded',
        spawnTile: { x: 1, y: -2 },
        supportChunk: { x: 0, y: -1 },
        supportLocal: { x: 1, y: 31 },
        supportTileId: 4,
        liquidSafetyStatus: 'safe',
        position: { x: 24.5, y: -12.25 },
        velocity: { x: 0, y: 0 }
      },
      playerWallContactTransition: {
        kind: 'blocked',
        tile: { x: 0, y: -1, id: 3, side: 'right' },
        position: { x: 24.5, y: -12.25 },
        velocity: { x: -180, y: 60 }
      },
      playerCeilingContactTransition: {
        kind: 'blocked',
        tile: { x: 1, y: -3, id: 5 },
        position: { x: 24.5, y: -12.25 },
        velocity: { x: -180, y: 0 }
      },
      playerCameraFollow: {
        cameraPosition: { x: 40.5, y: -26.25 },
        cameraTile: { x: 2, y: -2 },
        cameraLocal: { x: 2, y: 30 },
        cameraZoom: 1.25,
        focus: { x: 24.5, y: -26.25 },
        focusTile: { x: 1, y: -2 },
        focusChunk: { x: 0, y: -1 },
        focusLocal: { x: 1, y: 30 },
        offset: { x: 18, y: -6 }
      },
      player: {
        position: { x: 24.5, y: -12.25 },
        velocity: { x: -180, y: 60 },
        aabb: {
          min: { x: 18.5, y: -40.25 },
          max: { x: 30.5, y: -12.25 },
          size: { x: 12, y: 28 }
        },
        grounded: false,
        facing: 'left',
        contacts: {
          support: null,
          wall: { tileX: 0, tileY: -1, tileId: 3, side: 'right' },
          ceiling: { tileX: 1, tileY: -3, tileId: 5 }
        }
      },
      pinned: null
    });

    expect(text).toContain(
      '\nPlayer: Pos:24.50,-12.25 | Tile:1,-1 | Chunk:0,-1 | Local:1,31 | Vel:-180.00,60.00 | grounded:off | facing:left'
    );
    expect(text).toContain('\nPose: wall-slide');
    expect(text).toContain('\nBonkHold: off');
    expect(text).toContain('\nGroundEvt: jump | Pos:24.50,-12.25 | Vel:-180.00,-220.00');
    expect(text).toContain('\nFaceEvt: right->left | Pos:24.50,-12.25 | Vel:-180.00,60.00');
    expect(text).toContain(
      '\nRespawnEvt: embedded | SpawnT:1,-2 | SupportCh:0,-1 | SupportL:1,31 | SupportId:#4 | SpawnLiquid:safe | Pos:24.50,-12.25 | Vel:0.00,0.00'
    );
    expect(text).toContain(
      '\nWallEvt: blocked | Tile:0,-1 (#3, right) | Pos:24.50,-12.25 | Vel:-180.00,60.00'
    );
    expect(text).toContain('\nCeilEvt: blocked | Tile:1,-3 (#5) | Pos:24.50,-12.25 | Vel:-180.00,0.00');
    expect(text).toContain('\nAABB: min:18.50,-40.25 | max:30.50,-12.25 | size:12.00,28.00');
    expect(text).toContain(
      '\nFollow: cam:40.50,-26.25 | camTile:2,-2 | camChunk:0,-1 | camLocal:2,30 | zoom:1.25 | focus:24.50,-26.25 | focusTile:1,-2 | focusChunk:0,-1 | focusLocal:1,30 | offset:18.00,-6.00'
    );
    expect(text).toContain('\nContact: support:none | wall:0,-1 (#3, right) | ceiling:1,-3 (#5)');
    expect(text).toContain('\nIntent: move:-1 | jumpHeld:on | jumpPressed:on');
  });

  it('derives standalone-player world tile coordinates from negative body positions', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      spawn: null,
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerIntent: null,
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null,
      playerCameraFollow: null,
      player: {
        position: { x: -0.1, y: -16.01 },
        velocity: { x: 0, y: 0 },
        aabb: {
          min: { x: -6.1, y: -44.01 },
          max: { x: 5.9, y: -16.01 },
          size: { x: 12, y: 28 }
        },
        grounded: false,
        facing: 'right',
        contacts: {
          support: null,
          wall: null,
          ceiling: null
        }
      },
      pinned: null
    });

    expect(text).toContain(
      '\nPlayer: Pos:-0.10,-16.01 | Tile:-1,-2 | Chunk:-1,-1 | Local:31,30 | Vel:0.00,0.00 | grounded:off | facing:right'
    );
  });

  it('derives negative-world camera chunk coordinates from the live camera tile telemetry', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      spawn: null,
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerIntent: null,
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null,
      playerCameraFollow: {
        cameraPosition: { x: -520, y: -8 },
        cameraTile: { x: -33, y: -1 },
        cameraLocal: { x: 31, y: 31 },
        cameraZoom: 0.75,
        focus: { x: -520, y: -8 },
        focusTile: { x: -33, y: -1 },
        focusChunk: { x: -2, y: -1 },
        focusLocal: { x: 31, y: 31 },
        offset: { x: 0, y: 0 }
      },
      player: null,
      pinned: null
    });

    expect(text).toContain(
      '\nFollow: cam:-520.00,-8.00 | camTile:-33,-1 | camChunk:-2,-1 | camLocal:31,31 | zoom:0.75 | focus:-520.00,-8.00 | focusTile:-33,-1 | focusChunk:-2,-1 | focusLocal:31,31 | offset:0.00,0.00'
    );
  });

  it('shows animated chunk uv upload cost telemetry', () => {
    const text = formatDebugOverlayText(
      60,
      {
        ...baseStats,
        animatedChunkUvUploadCount: 2,
        animatedChunkUvUploadQuadCount: 5,
        animatedChunkUvUploadLiquidQuadCount: 2,
        animatedChunkUvUploadBytes: 3072
      },
      null
    );

    expect(text).toContain('\nAnimUV: uploads:2 | quads:5 | nonLiquid:3 | liquid:2 | bytes:3072');
  });

  it('shows resident animated chunk mesh footprint telemetry even without uv uploads', () => {
    const text = formatDebugOverlayText(
      60,
      {
        ...baseStats,
        residentAnimatedChunkMeshes: 3,
        residentAnimatedChunkQuadCount: 11,
        residentAnimatedLiquidChunkQuadCount: 4
      },
      null
    );

    expect(text).toContain('\nAnimMesh: chunks:3 | quads:11 | nonLiquid:7 | liquid:4');
    expect(text).toContain('\nAnimUV: uploads:0 | quads:0 | nonLiquid:0 | liquid:0 | bytes:0');
  });

  it('shows pinned tile metadata even when no live pointer snapshot is available', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      spawn: null,
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerIntent: null,
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null,
      playerCameraFollow: null,
      player: null,
      pinned: {
        tile: { x: 40, y: -2 },
        tileId: 2,
        tileLabel: 'grass',
        solid: true,
        blocksLight: false,
        liquidKind: 'water',
        liquidLevel: 4,
        liquidSurfaceNorthLevel: 0,
        liquidSurfaceWestLevel: 8,
        liquidSurfaceCenterLevel: 4,
        liquidSurfaceEastLevel: 6,
        liquidSurfaceTopLeft: 0.75,
        liquidSurfaceTopRight: 0.625,
        liquidFrameTopV: 0.5,
        liquidFrameTopPixelY: 32,
        liquidFrameBottomV: 0.75,
        liquidFrameBottomPixelY: 48,
        liquidFrameHeightV: 0.25,
        liquidFramePixelHeight: 16,
        liquidBottomLeftV: 0.6875,
        liquidBottomRightV: 0.65625,
        liquidBottomLeftPixelY: 44,
        liquidBottomRightPixelY: 42,
        liquidVisibleLeftV: 0.1875,
        liquidVisibleRightV: 0.15625,
        liquidVisibleLeftPixelHeight: 12,
        liquidVisibleRightPixelHeight: 10,
        liquidRemainderLeftV: 0.0625,
        liquidRemainderRightV: 0.09375,
        liquidRemainderLeftPercentage: 25,
        liquidRemainderRightPercentage: 37.5,
        liquidRemainderLeftPixelHeight: 4,
        liquidRemainderRightPixelHeight: 6,
        liquidConnectivityGroupLabel: 'water',
        liquidCardinalMask: 13,
        liquidVariantSource: 'uvRect 0.667,0.5..0.75,0.75',
        liquidVariantUvRect: '0.667,0.5..0.75,0.75',
        liquidVariantPixelBounds: '64,32..72,48'
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
    expect(text).toContain('liquidLevel:4/8');
    expect(text).toContain('liquidSurfaceIn:north=0/8 west=8/8 center=4/8 east=6/8');
    expect(text).toContain('liquidTopLeft:0.75');
    expect(text).toContain('liquidTopRight:0.625');
    expect(text).toContain('liquidFrameTopV:0.5');
    expect(text).toContain('liquidFrameTopPxY:32');
    expect(text).toContain('liquidFrameBottomV:0.75');
    expect(text).toContain('liquidFrameBottomPxY:48');
    expect(text).toContain('liquidFrameHeightV:0.25');
    expect(text).toContain('liquidFramePxH:16');
    expect(text).toContain('liquidBottomLeftV:0.688');
    expect(text).toContain('liquidBottomRightV:0.656');
    expect(text).toContain('liquidBottomLeftPxY:44');
    expect(text).toContain('liquidBottomRightPxY:42');
    expect(text).toContain('liquidVisibleLeftV:0.188');
    expect(text).toContain('liquidVisibleRightV:0.156');
    expect(text).toContain('liquidVisibleLeftPxH:12');
    expect(text).toContain('liquidVisibleRightPxH:10');
    expect(text).toContain('liquidRemainderLeftV:0.063');
    expect(text).toContain('liquidRemainderRightV:0.094');
    expect(text).toContain('liquidRemainderLeftPct:25%');
    expect(text).toContain('liquidRemainderRightPct:37.5%');
    expect(text).toContain('liquidRemainderLeftPxH:4');
    expect(text).toContain('liquidRemainderRightPxH:6');
    expect(text).toContain('liquidGroup:water');
    expect(text).toContain('liquidMask:N-SW (13)');
    expect(text).toContain('liquidSrc:uvRect 0.667,0.5..0.75,0.75');
    expect(text).toContain('liquidUv:0.667,0.5..0.75,0.75');
    expect(text).toContain('liquidPx:64,32..72,48');
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
        world: { x: -8, y: 0 },
        supportTile: {
          x: -2,
          y: 1,
          id: 6,
          chunk: { x: -1, y: 0 },
          local: { x: 30, y: 1 }
        },
        liquidSafetyStatus: 'overlap'
      },
      playerPlaceholderPoseLabel: null,
      playerCeilingBonkHoldActive: null,
      playerIntent: {
        moveX: 0,
        jumpHeld: false,
        jumpPressed: false
      },
      playerGroundedTransition: {
        kind: 'landing',
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: 0 }
      },
      playerFacingTransition: {
        kind: 'right',
        previousFacing: 'left',
        nextFacing: 'right',
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: 0 }
      },
      playerRespawn: {
        kind: 'embedded',
        spawnTile: { x: -1, y: 0 },
        supportChunk: { x: -1, y: 0 },
        supportLocal: { x: 31, y: 1 },
        supportTileId: 9,
        liquidSafetyStatus: 'overlap',
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: 0 }
      },
      playerWallContactTransition: {
        kind: 'cleared',
        tile: { x: 4, y: 6, id: 3, side: 'left' },
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: 0 }
      },
      playerCeilingContactTransition: {
        kind: 'cleared',
        tile: { x: 4, y: 5, id: 7 },
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: 0 }
      },
      playerCameraFollow: null,
      player: null,
      pinned: {
        tile: { x: -1, y: 65 },
        tileId: 4,
        tileLabel: 'lava',
        solid: false,
        blocksLight: false,
        liquidKind: 'lava',
        liquidConnectivityGroupLabel: 'lava',
        liquidCardinalMask: 6,
        liquidAnimationFrameIndex: 1,
        liquidAnimationFrameCount: 2,
        liquidAnimationFrameDurationMs: 180,
        liquidAnimationFrameElapsedMs: 60,
        liquidAnimationFrameProgressNormalized: 60 / 180,
        liquidAnimationFrameRemainingMs: 120,
        liquidAnimationLoopDurationMs: 360,
        liquidAnimationLoopElapsedMs: 240,
        liquidAnimationLoopProgressNormalized: 240 / 360,
        liquidAnimationLoopRemainingMs: 120,
        liquidVariantSource: 'atlasIndex 15',
        liquidVariantUvRect: '0.5,0.75..0.667,1',
        liquidVariantPixelBounds: '48,48..64,64'
      }
    });

    expect(text).toContain('Ptr(touch)');
    expect(text).toContain('Spawn: T:-1,0 | W:-8.00,0.00');
    expect(text).toContain('SpawnLiquid: overlap');
    expect(text).toContain('Intent: move:0 | jumpHeld:off | jumpPressed:off');
    expect(text).toContain('GroundEvt: landing | Pos:12.00,0.00 | Vel:0.00,0.00');
    expect(text).toContain('FaceEvt: left->right | Pos:12.00,0.00 | Vel:0.00,0.00');
    expect(text).toContain(
      'RespawnEvt: embedded | SpawnT:-1,0 | SupportCh:-1,0 | SupportL:31,1 | SupportId:#9 | SpawnLiquid:overlap | Pos:12.00,0.00 | Vel:0.00,0.00'
    );
    expect(text).toContain('WallEvt: cleared | Tile:4,6 (#3, left) | Pos:12.00,0.00 | Vel:0.00,0.00');
    expect(text).toContain('CeilEvt: cleared | Tile:4,5 (#7) | Pos:12.00,0.00 | Vel:0.00,0.00');
    expect(text).toContain('Tile:dirt (#3)');
    expect(text).toContain('\nPin: Tile:lava (#4)');
    expect(text).toContain('T:-1,65');
    expect(text).toContain('Ch:-1,2');
    expect(text).toContain('L:31,1');
    expect(text).toContain('liquid:lava');
    expect(text).toContain('liquidGroup:lava');
    expect(text).toContain('liquidMask:-ES- (6)');
    expect(text).toContain('liquidFrame:1/2');
    expect(text).toContain('liquidFrameDur:180ms');
    expect(text).toContain('liquidFrameElapsed:60ms');
    expect(text).toContain('liquidFrameRemain:120ms');
    expect(text).toContain('liquidFramePct:33.3%');
    expect(text).toContain('liquidLoopDur:360ms');
    expect(text).toContain('liquidLoopElapsed:240ms');
    expect(text).toContain('liquidLoopPct:66.7%');
    expect(text).toContain('liquidLoopRemain:120ms');
    expect(text).toContain('liquidSrc:atlasIndex 15');
    expect(text).toContain('liquidUv:0.5,0.75..0.667,1');
    expect(text).toContain('liquidPx:48,48..64,64');
  });

  it('shows when the renderer-side ceiling-bonk hold latch stays active after live contact clears', () => {
    const text = formatDebugOverlayText(60, baseStats, {
      pointer: null,
      pinned: null,
      spawn: null,
      player: {
        position: { x: 12, y: -8 },
        velocity: { x: 0, y: 24 },
        aabb: {
          min: { x: 6, y: -36 },
          max: { x: 18, y: -8 },
          size: { x: 12, y: 28 }
        },
        grounded: false,
        facing: 'right',
        contacts: {
          support: null,
          wall: null,
          ceiling: null
        }
      },
      playerPlaceholderPoseLabel: 'ceiling-bonk',
      playerCeilingBonkHoldActive: true,
      playerIntent: {
        moveX: 0,
        jumpHeld: false,
        jumpPressed: false
      },
      playerCameraFollow: null,
      playerGroundedTransition: null,
      playerFacingTransition: null,
      playerRespawn: null,
      playerWallContactTransition: null,
      playerCeilingContactTransition: null
    });

    expect(text).toContain('\nPose: ceiling-bonk');
    expect(text).toContain('\nBonkHold: on');
    expect(text).toContain('\nContact: support:none | wall:none | ceiling:none');
  });
});
