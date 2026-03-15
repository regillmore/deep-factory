import { describe, expect, it } from 'vitest';

import type { ArmedDebugToolPreviewState } from '../input/controller';
import {
  createDefaultWorldSessionTelemetryState,
  type WorldSessionTelemetryState
} from '../mainWorldSessionTelemetryState';
import {
  buildActiveDebugToolPreviewBadgeText,
  buildDebugEditStatusStripModel,
  buildPendingTouchAnchorLabelText,
  resolveActiveDebugToolStatus
} from './debugEditStatusHelpers';

const createEmptyPreviewState = (): ArmedDebugToolPreviewState => ({
  armedFloodFillKind: null,
  armedLineKind: null,
  armedRectKind: null,
  armedRectOutlineKind: null,
  armedEllipseKind: null,
  armedEllipseOutlineKind: null,
  activeMouseLineDrag: null,
  pendingTouchLineStart: null,
  activeMouseRectDrag: null,
  activeMouseRectOutlineDrag: null,
  activeMouseEllipseDrag: null,
  activeMouseEllipseOutlineDrag: null,
  pendingTouchRectStart: null,
  pendingTouchRectOutlineStart: null,
  pendingTouchEllipseStart: null,
  pendingTouchEllipseOutlineStart: null
});

describe('resolveActiveDebugToolStatus', () => {
  it('prioritizes active mouse drag previews over idle armed-tool state', () => {
    const status = resolveActiveDebugToolStatus({
      ...createEmptyPreviewState(),
      armedLineKind: 'break',
      activeMouseLineDrag: {
        kind: 'place',
        startTileX: 4,
        startTileY: 7
      }
    });

    expect(status).toEqual({
      title: 'Line Brush armed',
      detail: 'drag endpoint | release to apply | Esc cancel',
      accent: 'rgba(120, 210, 255, 0.95)'
    });
  });

  it('describes anchored touch ellipse-outline tools with the next-step hint', () => {
    const status = resolveActiveDebugToolStatus({
      ...createEmptyPreviewState(),
      pendingTouchEllipseOutlineStart: {
        kind: 'break',
        tileX: 8,
        tileY: 9
      }
    });

    expect(status).toEqual({
      title: 'Ellipse Outline Break armed',
      detail: 'corner set | tap opposite corner | Esc cancel',
      accent: 'rgba(255, 195, 120, 0.95)'
    });
  });
});

describe('buildDebugEditStatusStripModel', () => {
  it('formats an idle place-mode summary with shared mixed-device hints', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'place',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false
    });

    expect(model.modeText).toBe('Mode: Place');
    expect(model.brushText).toBe('Brush: debug brick (#3)');
    expect(model.toolText).toBe('Tool: No one-shot armed');
    expect(model.previewText).toBeNull();
    expect(model.playerText).toBeNull();
    expect(model.eventText).toBeNull();
    expect(model.inspectText).toBe('Inspect: Hover only');
    expect(model.hoverText).toBe(
      'Hover: move cursor | touch a world tile | inspect gameplay flags | Pin Click keeps metadata visible'
    );
    expect(model.inspectActionText).toBe('Pin Click');
    expect(model.clearActionText).toBeNull();
    expect(model.hintText).toBe(
      'Touch: drag to paint | pinch zoom\n' +
        'Desktop: left paint | right break | Shift-drag pan | wheel zoom | Pin Click arms inspect pinning\n' +
        'Desktop one-shot: F fill | N line | R rect fill | T rect outline | E ellipse fill | O ellipse outline | Shift = break | Esc cancels one-shot tools'
    );
  });

  it('omits gated spawn, combat, hostile-slime, world-liquid, and inspect lines when telemetry visibility hides them', () => {
    const telemetryState: WorldSessionTelemetryState = {
      collections: {
        player: true,
        'hostile-slime': false,
        world: true,
        inspect: true
      },
      types: {
        'player-motion': true,
        'player-presentation': true,
        'player-combat': false,
        'player-camera': true,
        'player-collision': true,
        'player-events': true,
        'player-spawn': false,
        'hostile-slime-tracker': true,
        'world-atlas': true,
        'world-animated-mesh': true,
        'world-lighting': true,
        'world-liquid': false,
        'inspect-pointer': false,
        'inspect-pinned': false
      }
    };

    const model = buildDebugEditStatusStripModel({
      mode: 'place',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      hoveredTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava'
      },
      pinnedTile: {
        tileX: 8,
        tileY: -6,
        chunkX: 0,
        chunkY: -1,
        localX: 8,
        localY: 26,
        tileId: 2,
        tileLabel: 'dirt',
        solid: true,
        blocksLight: true,
        liquidKind: null
      },
      desktopInspectPinArmed: false,
      playerSpawn: {
        liquidSafetyStatus: 'safe',
        tile: { x: 4, y: -2 },
        world: { x: 72, y: -32 },
        supportTile: {
          x: 4,
          y: -1,
          id: 3,
          chunk: { x: 0, y: -1 },
          local: { x: 4, y: 31 }
        }
      },
      playerCameraWorldPosition: { x: 90.5, y: -54.25 },
      playerNearbyLightLevel: 9,
      playerNearbyLightFactor: 0.6,
      playerNearbyLightSourceTile: { x: 2, y: 2 },
      playerNearbyLightSourceChunk: { x: 0, y: 0 },
      playerNearbyLightSourceLocalTile: { x: 2, y: 2 },
      playerHealth: 62,
      playerFallDamageRecoverySecondsRemaining: 0.35,
      playerLandingDamageEvent: {
        damageApplied: 3
      },
      hostileSlimeActiveCount: 2,
      residentActiveLiquidChunks: 4,
      residentSleepingLiquidChunks: 2,
      residentActiveLiquidMinChunkX: -2,
      residentActiveLiquidMinChunkY: -1,
      residentActiveLiquidMaxChunkX: 3,
      residentActiveLiquidMaxChunkY: 5,
      residentSleepingLiquidMinChunkX: -4,
      residentSleepingLiquidMinChunkY: 0,
      residentSleepingLiquidMaxChunkX: -1,
      residentSleepingLiquidMaxChunkY: 2,
      telemetryState
    });

    expect(model.playerText).toBe(
      'CamPosNow: 90.50,-54.25\n' +
        'LightSampleNow: 9/15 | factor:0.60 | source:2,2 | sourceChunk:0,0 | sourceLocal:2,2'
    );
    expect(model.hoverText).toBe('Inspect details hidden by telemetry controls');
    expect(model.inspectText).toBe('Inspect: Pinned @ 8,-6');
    expect(model.playerText).not.toContain('HealthNow');
    expect(model.playerText).not.toContain('FallRecoveryNow');
    expect(model.playerText).not.toContain('SpawnNow');
    expect(model.playerText).not.toContain('SpawnSupportNow');
    expect(model.playerText).not.toContain('SlimeActiveNow');
    expect(model.playerText).not.toContain('LiquidChunksNow');
    expect(model.eventText).toBeNull();
  });

  it('restores gated spawn, combat, hostile-slime, world-liquid, and inspect lines when telemetry resets to the default catalog', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'place',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      hoveredTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava'
      },
      pinnedTile: {
        tileX: 8,
        tileY: -6,
        chunkX: 0,
        chunkY: -1,
        localX: 8,
        localY: 26,
        tileId: 2,
        tileLabel: 'dirt',
        solid: true,
        blocksLight: true,
        liquidKind: null
      },
      desktopInspectPinArmed: false,
      playerSpawn: {
        liquidSafetyStatus: 'safe',
        tile: { x: 4, y: -2 },
        world: { x: 72, y: -32 },
        supportTile: {
          x: 4,
          y: -1,
          id: 3,
          chunk: { x: 0, y: -1 },
          local: { x: 4, y: 31 }
        }
      },
      playerCameraWorldPosition: { x: 90.5, y: -54.25 },
      playerNearbyLightLevel: 9,
      playerNearbyLightFactor: 0.6,
      playerNearbyLightSourceTile: { x: 2, y: 2 },
      playerNearbyLightSourceChunk: { x: 0, y: 0 },
      playerNearbyLightSourceLocalTile: { x: 2, y: 2 },
      playerHealth: 62,
      playerFallDamageRecoverySecondsRemaining: 0.35,
      playerLandingDamageEvent: {
        damageApplied: 3
      },
      hostileSlimeActiveCount: 2,
      residentActiveLiquidChunks: 4,
      residentSleepingLiquidChunks: 2,
      residentActiveLiquidMinChunkX: -2,
      residentActiveLiquidMinChunkY: -1,
      residentActiveLiquidMaxChunkX: 3,
      residentActiveLiquidMaxChunkY: 5,
      residentSleepingLiquidMinChunkX: -4,
      residentSleepingLiquidMinChunkY: 0,
      residentSleepingLiquidMaxChunkX: -1,
      residentSleepingLiquidMaxChunkY: 2,
      telemetryState: createDefaultWorldSessionTelemetryState()
    });

    expect(model.playerText).toContain('HealthNow: 62');
    expect(model.playerText).toContain('FallRecoveryNow: 0.35s');
    expect(model.playerText).toContain('SpawnNow: safe | tile 4,-2');
    expect(model.playerText).toContain('SpawnSupportNow: tile 4,-1');
    expect(model.playerText).toContain('SlimeActiveNow: 2');
    expect(model.playerText).toContain('LiquidChunksNow: awake:4');
    expect(model.eventText).toBe('LandingHit: damage 3');
    expect(model.hoverText).toContain('Hover: lava pool (#9)');
    expect(model.inspectText).toBe('Inspect: Pinned @ 8,-6');
  });

  it('surfaces active flood-fill guidance directly in the status-strip model', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      preview: {
        ...createEmptyPreviewState(),
        armedFloodFillKind: 'place'
      }
    });

    expect(model.toolText).toBe('Tool: Fill Brush armed');
    expect(model.previewText).toBeNull();
    expect(model.hintText).toBe('click/tap target tile | Esc cancel');
    expect(model.toolAccent).toBe('rgba(120, 255, 180, 0.95)');
  });

  it('formats the current standalone player placeholder pose label for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'wall-slide',
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: wall-slide');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player grounded flag for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerGrounded: true,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('GroundedNow: on');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player world position for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerWorldPosition: {
        x: 72.5,
        y: -48.25
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('PosNow: 72.50,-48.25');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player world tile, chunk, and chunk-local coordinates for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerWorldTile: {
        x: 4,
        y: -4
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('TileNow: 4,-4\nChunkNow: 0,-1\nLocalNow: 4,28');
    expect(model.eventText).toBeNull();
  });

  it("formats the latest resolved spawn's support chunk, local, and liquid-safety status for the compact strip when provided", () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerSpawn: {
        liquidSafetyStatus: 'safe',
        tile: {
          x: -4,
          y: -2
        },
        world: {
          x: -56,
          y: -32
        },
        supportTile: {
          x: -5,
          y: -1,
          id: 7,
          chunk: {
            x: -1,
            y: -1
          },
          local: {
            x: 27,
            y: 31
          }
        }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'SpawnNow: safe | tile -4,-2 | pos -56.00,-32.00\n' +
        'SpawnSupportNow: tile -5,-1 (#7) | chunk -1,-1 | local 27,31'
    );
    expect(model.eventText).toBeNull();
  });

  it("formats an unresolved latest spawn's liquid-safety status for the compact strip", () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerSpawn: {
        liquidSafetyStatus: 'unresolved'
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('SpawnNow: unresolved');
    expect(model.eventText).toBeNull();
  });

  it('derives negative-world standalone player chunk and chunk-local coordinates from the live body tile telemetry', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerWorldTile: {
        x: -1,
        y: -2
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('TileNow: -1,-2\nChunkNow: -1,-1\nLocalNow: 31,30');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player collision AABB min/max and size for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerAabb: {
        min: { x: 18.5, y: -40.25 },
        max: { x: 30.5, y: -12.25 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('AABBNow: min 18.50,-40.25 | max 30.50,-12.25 | size 12.00,28.00');
    expect(model.eventText).toBeNull();
  });

  it('formats the live camera world position for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraWorldPosition: {
        x: 90.5,
        y: -54.25
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('CamPosNow: 90.50,-54.25');
    expect(model.eventText).toBeNull();
  });

  it('formats the live camera world tile coordinates for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraWorldTile: {
        x: 5,
        y: -4
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('CamTileNow: 5,-4');
    expect(model.eventText).toBeNull();
  });

  it('formats the live camera world chunk coordinates for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraWorldChunk: {
        x: 0,
        y: -1
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('CamChunkNow: 0,-1');
    expect(model.eventText).toBeNull();
  });

  it('formats the live camera chunk-local tile coordinates for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraWorldLocalTile: {
        x: 31,
        y: 28
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('CamLocalNow: 31,28');
    expect(model.eventText).toBeNull();
  });

  it('formats the live camera-follow focus point for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraFocusPoint: {
        x: 72.5,
        y: -62.25
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('FocusPosNow: 72.50,-62.25');
    expect(model.eventText).toBeNull();
  });

  it('formats the live camera-follow focus-point world tile coordinates for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraFocusTile: {
        x: 4,
        y: -4
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('FocusTileNow: 4,-4');
    expect(model.eventText).toBeNull();
  });

  it('formats the live camera-follow focus-point world chunk coordinates for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraFocusChunk: {
        x: 0,
        y: -1
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('FocusChunkNow: 0,-1');
    expect(model.eventText).toBeNull();
  });

  it('formats the live camera-follow focus-point chunk-local tile coordinates for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraFocusLocalTile: {
        x: 4,
        y: 28
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('FocusLocalNow: 4,28');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player camera-follow offset for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraFollowOffset: {
        x: 18,
        y: -6
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('OffsetNow: x:+18.00 | y:-6.00');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player camera zoom for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCameraZoom: 2.5,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('ZoomNow: 2.50x');
    expect(model.eventText).toBeNull();
  });

  it('formats resident dirty-light chunk counts for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      residentDirtyLightChunks: 7,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('LightDirtyNow: 7');
    expect(model.eventText).toBeNull();
  });

  it('formats awake and sleeping liquid chunk counts plus awake and sleeping bounds for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      residentActiveLiquidChunks: 4,
      residentSleepingLiquidChunks: 2,
      residentActiveLiquidMinChunkX: -2,
      residentActiveLiquidMinChunkY: -1,
      residentActiveLiquidMaxChunkX: 3,
      residentActiveLiquidMaxChunkY: 5,
      residentSleepingLiquidMinChunkX: -4,
      residentSleepingLiquidMinChunkY: 0,
      residentSleepingLiquidMaxChunkX: -1,
      residentSleepingLiquidMaxChunkY: 2,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'LiquidChunksNow: awake:4 | sleeping:2 | bounds:-2,-1..3,5 | sleepBounds:-4,0..-1,2'
    );
    expect(model.eventText).toBeNull();
  });

  it('shows dry-world active-liquid telemetry with a none bounds label in the compact strip', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      residentActiveLiquidChunks: 0,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('LiquidChunksNow: awake:0 | sleeping:0 | bounds:none | sleepBounds:none');
    expect(model.eventText).toBeNull();
  });

  it('formats split liquid-step transfer counters alongside the phase summary for the compact strip', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      liquidStepSidewaysCandidateMinChunkX: -2,
      liquidStepSidewaysCandidateMinChunkY: -1,
      liquidStepSidewaysCandidateMaxChunkX: 4,
      liquidStepSidewaysCandidateMaxChunkY: 0,
      liquidStepPhaseSummary: 'sideways',
      liquidStepDownwardActiveChunksScanned: 80,
      liquidStepSidewaysCandidateChunksScanned: 7,
      liquidStepSidewaysPairsTested: 1504,
      liquidStepDownwardTransfersApplied: 0,
      liquidStepSidewaysTransfersApplied: 1,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'LiquidStepNow: sideBounds:-2,-1..4,0 | phase:sideways | downChunks:80 | sideChunks:7 | sidePairs:1504 | sideDensity:214.9/chunk | downTransfers:0 | sideTransfers:1'
    );
    expect(model.eventText).toBeNull();
  });

  it('shows dry-world active-liquid telemetry plus split zero-transfer liquid-step summary in the compact strip', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      residentActiveLiquidChunks: 0,
      liquidStepPhaseSummary: 'none',
      liquidStepDownwardActiveChunksScanned: 0,
      liquidStepSidewaysCandidateChunksScanned: 0,
      liquidStepSidewaysPairsTested: 0,
      liquidStepDownwardTransfersApplied: 0,
      liquidStepSidewaysTransfersApplied: 0,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'LiquidChunksNow: awake:0 | sleeping:0 | bounds:none | sleepBounds:none\n' +
        'LiquidStepNow: sideBounds:none | phase:none | downChunks:0 | sideChunks:0 | sidePairs:0 | sideDensity:0/chunk | downTransfers:0 | sideTransfers:0'
    );
    expect(model.eventText).toBeNull();
  });

  it('formats sideways candidate-band bounds even when the compact strip only has liquid-step coverage telemetry', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      liquidStepSidewaysCandidateMinChunkX: -3,
      liquidStepSidewaysCandidateMinChunkY: -2,
      liquidStepSidewaysCandidateMaxChunkX: 5,
      liquidStepSidewaysCandidateMaxChunkY: 1,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('LiquidStepNow: sideBounds:-3,-2..5,1 | phase:n/a');
    expect(model.eventText).toBeNull();
  });

  it('formats standalone-player nearby-light sampling for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerNearbyLightLevel: 9,
      playerNearbyLightFactor: 0.6,
      playerNearbyLightSourceTile: { x: 2, y: 2 },
      playerNearbyLightSourceChunk: { x: 0, y: 0 },
      playerNearbyLightSourceLocalTile: { x: 2, y: 2 },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'LightSampleNow: 9/15 | factor:0.60 | source:2,2 | sourceChunk:0,0 | sourceLocal:2,2'
    );
    expect(model.eventText).toBeNull();
  });

  it('uses renderer-provided standalone-player nearby-light source chunk-local telemetry for negative-world source tiles', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerNearbyLightLevel: 12,
      playerNearbyLightFactor: 0.8,
      playerNearbyLightSourceTile: { x: -33, y: -1 },
      playerNearbyLightSourceChunk: { x: -5, y: 4 },
      playerNearbyLightSourceLocalTile: { x: 9, y: 10 },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'LightSampleNow: 12/15 | factor:0.80 | source:-33,-1 | sourceChunk:-5,4 | sourceLocal:9,10'
    );
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player facing direction for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerFacing: 'left',
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('FacingNow: left');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player horizontal move input axis for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerMoveX: -1,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('MoveXNow: -1');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player horizontal velocity for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerVelocityX: -180.25,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('VelXNow: -180.25');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player vertical velocity for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerVelocityY: 96.5,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('VelYNow: 96.50');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player speed magnitude for the compact strip when both velocity components are provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerVelocityX: 3,
      playerVelocityY: 4,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('VelXNow: 3.00\nVelYNow: 4.00\nSpeedNow: 5.00');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player jump-held input state for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerJumpHeld: true,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('JumpHeldNow: on');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player jump-pressed input edge state for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerJumpPressed: true,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('JumpPressedNow: on');
    expect(model.eventText).toBeNull();
  });

  it('formats live rope-drop active and window-arm telemetry for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerRopeDropActive: true,
      playerRopeDropWindowArmed: false,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('RopeDropActiveNow: on\nRopeDropWindowNow: off');
    expect(model.eventText).toBeNull();
  });

  it('formats the renderer-side standalone player ceiling-bonk hold state for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCeilingBonkHoldActive: true,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('BonkHold: on');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player wall-contact tile and side for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerWallContact: {
        tile: { x: 5, y: -3, id: 7, side: 'right' }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('WallNow: tile 5,-3 (#7, right)');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player support-contact tile for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerSupportContact: {
        tile: { x: 4, y: -1, id: 6 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('SupportNow: tile 4,-1 (#6)');
    expect(model.eventText).toBeNull();
  });

  it('formats the live standalone player ceiling-contact tile for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCeilingContact: {
        tile: { x: 2, y: -6, id: 8 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('CeilingNow: tile 2,-6 (#8)');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live wall-contact telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'wall-slide',
      playerWallContact: {
        tile: { x: 5, y: -3, id: 7, side: 'right' }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: wall-slide\nWallNow: tile 5,-3 (#7, right)');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live support-contact telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerSupportContact: {
        tile: { x: 4, y: -1, id: 6 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nSupportNow: tile 4,-1 (#6)');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live grounded telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerGrounded: true,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nGroundedNow: on');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live world-position telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerWorldPosition: {
        x: 56,
        y: -32
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nPosNow: 56.00,-32.00');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose plus live world-tile, chunk, and chunk-local telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerWorldTile: {
        x: 3,
        y: -2
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nTileNow: 3,-2\nChunkNow: 0,-1\nLocalNow: 3,30');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live collision AABB min/max and size telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerAabb: {
        min: { x: 18.5, y: -40.25 },
        max: { x: 30.5, y: -12.25 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: grounded-idle\nAABBNow: min 18.50,-40.25 | max 30.50,-12.25 | size 12.00,28.00'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera-follow offset telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraFollowOffset: {
        x: 18,
        y: -6
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nOffsetNow: x:+18.00 | y:-6.00');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera world-position telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraWorldPosition: {
        x: 90.5,
        y: -54.25
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nCamPosNow: 90.50,-54.25');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera world-tile telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraWorldTile: {
        x: 5,
        y: -4
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nCamTileNow: 5,-4');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera world-chunk telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraWorldChunk: {
        x: 0,
        y: -1
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nCamChunkNow: 0,-1');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera chunk-local tile telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraWorldLocalTile: {
        x: 31,
        y: 28
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nCamLocalNow: 31,28');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera-follow focus-point telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraFocusPoint: {
        x: 72.5,
        y: -62.25
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nFocusPosNow: 72.50,-62.25');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera-follow focus-point world-tile telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraFocusTile: {
        x: 4,
        y: -4
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nFocusTileNow: 4,-4');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera-follow focus-point world-chunk telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraFocusChunk: {
        x: 0,
        y: -1
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nFocusChunkNow: 0,-1');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera-follow focus-point chunk-local tile telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraFocusLocalTile: {
        x: 4,
        y: 28
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nFocusLocalNow: 4,28');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live camera zoom telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerCameraZoom: 2.5,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nZoomNow: 2.50x');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and resident dirty-light chunk telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      residentDirtyLightChunks: 14,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nLightDirtyNow: 14');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and resident active-liquid telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      residentActiveLiquidChunks: 2,
      residentSleepingLiquidChunks: 1,
      residentActiveLiquidMinChunkX: -1,
      residentActiveLiquidMinChunkY: 0,
      residentActiveLiquidMaxChunkX: 1,
      residentActiveLiquidMaxChunkY: 0,
      residentSleepingLiquidMinChunkX: -3,
      residentSleepingLiquidMinChunkY: -1,
      residentSleepingLiquidMaxChunkX: -2,
      residentSleepingLiquidMaxChunkY: 1,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: grounded-idle\nLiquidChunksNow: awake:2 | sleeping:1 | bounds:-1,0..1,0 | sleepBounds:-3,-1..-2,1'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and split liquid-step summary telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      liquidStepSidewaysCandidateMinChunkX: -1,
      liquidStepSidewaysCandidateMinChunkY: 0,
      liquidStepSidewaysCandidateMaxChunkX: 2,
      liquidStepSidewaysCandidateMaxChunkY: 0,
      liquidStepPhaseSummary: 'both',
      liquidStepDownwardActiveChunksScanned: 80,
      liquidStepSidewaysCandidateChunksScanned: 3,
      liquidStepSidewaysPairsTested: 1504,
      liquidStepDownwardTransfersApplied: 2,
      liquidStepSidewaysTransfersApplied: 3,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: grounded-idle\n' +
        'LiquidStepNow: sideBounds:-1,0..2,0 | phase:both | downChunks:80 | sideChunks:3 | sidePairs:1504 | sideDensity:501.3/chunk | downTransfers:2 | sideTransfers:3'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and nearby-light sample telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerNearbyLightLevel: 12,
      playerNearbyLightFactor: 0.8,
      playerNearbyLightSourceTile: { x: 4, y: -1 },
      playerNearbyLightSourceChunk: { x: 0, y: -1 },
      playerNearbyLightSourceLocalTile: { x: 4, y: 31 },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: grounded-idle\nLightSampleNow: 12/15 | factor:0.80 | source:4,-1 | sourceChunk:0,-1 | sourceLocal:4,31'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live facing telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerFacing: 'right',
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-idle\nFacingNow: right');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live horizontal move-axis telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-walk',
      playerMoveX: 1,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-walk\nMoveXNow: 1');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live horizontal velocity telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-walk',
      playerVelocityX: 160,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: grounded-walk\nVelXNow: 160.00');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live vertical velocity telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'jump-rise',
      playerVelocityY: -210.5,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: jump-rise\nVelYNow: -210.50');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose, live velocity, and live speed-magnitude telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'jump-rise',
      playerVelocityX: 120,
      playerVelocityY: -160,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: jump-rise\nVelXNow: 120.00\nVelYNow: -160.00\nSpeedNow: 200.00'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live jump-held telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'jump-rise',
      playerJumpHeld: true,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: jump-rise\nJumpHeldNow: on');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live jump-pressed telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'jump-rise',
      playerJumpPressed: true,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: jump-rise\nJumpPressedNow: on');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose and live ceiling-bonk hold telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'ceiling-bonk',
      playerCeilingBonkHoldActive: true,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe('Pose: ceiling-bonk\nBonkHold: on');
    expect(model.eventText).toBeNull();
  });

  it('keeps pose, live death-hold, breath, survival cooldowns, and hostile-contact invulnerability telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'grounded-idle',
      playerHealth: 85,
      playerRespawnSecondsRemaining: 0.75,
      playerDeathHoldStatus: 'holding',
      playerBreathSecondsRemaining: 0.25,
      playerDrowningDamageTickSecondsRemaining: 0.5,
      playerFallDamageRecoverySecondsRemaining: 0.35,
      playerHostileContactInvulnerabilitySecondsRemaining: 0.75,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: grounded-idle\n' +
        'HealthNow: 85\n' +
        'RespawnIn: 0.75s\n' +
        'DeathHold: holding\n' +
        'BreathNow: 0.25s\n' +
        'DrownCooldownNow: 0.50s\n' +
        'FallRecoveryNow: 0.35s\n' +
        'ContactInvulnNow: 0.75s'
    );
    expect(model.eventText).toBeNull();
  });

  it('shows the latest hard-landing hit on its own event line', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerLandingDamageEvent: {
        damageApplied: 3
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBeNull();
    expect(model.eventText).toBe('LandingHit: damage 3');
  });

  it('shows the latest hostile-contact hit event on its own event line', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerHostileContactEvent: {
        damageApplied: 15,
        blockedByInvulnerability: false,
        sourceWorldTile: { x: 3, y: -1 },
        sourceFacing: 'left'
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBeNull();
    expect(model.eventText).toBe('SlimeHit: damage 15 | blocked off | tile 3,-1 | facing left');
  });

  it('shows when the latest hostile-contact overlap was blocked by invulnerability', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerHostileContactEvent: {
        damageApplied: 0,
        blockedByInvulnerability: true,
        sourceWorldTile: { x: -2, y: 4 },
        sourceFacing: 'right'
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBeNull();
    expect(model.eventText).toBe('SlimeHit: damage 0 | blocked on | tile -2,4 | facing right');
  });

  it('keeps hostile-slime tile, velocity, locomotion, and launch telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      hostileSlimeWorldTile: { x: 3, y: -1 },
      hostileSlimeVelocity: { x: 35, y: -60 },
      hostileSlimeGrounded: false,
      hostileSlimeFacing: 'right',
      hostileSlimeHopCooldownTicksRemaining: 7,
      hostileSlimeLaunchKind: 'step-hop',
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'SlimeTileNow: 3,-1\n' +
        'SlimeVelNow: 35.00,-60.00\n' +
        'SlimeGroundedNow: off\n' +
        'SlimeFacingNow: right\n' +
        'SlimeHopCooldownNow: 7t\n' +
        'SlimeLaunchNow: step-hop'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps hostile-slime spawn telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      hostileSlimeActiveCount: 2,
      hostileSlimeNextSpawnTicksRemaining: 119,
      hostileSlimeNextSpawnWindowIndex: 1,
      hostileSlimeNextSpawnWindowOffsetTiles: -12,
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'SlimeActiveNow: 2\n' +
        'SlimeSpawnCooldownNow: 119t\n' +
        'SlimeSpawnWindowNow: 1\n' +
        'SlimeSpawnOffsetNow: -12 tiles'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose, live wall-contact, and live ceiling-contact telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'ceiling-bonk',
      playerWallContact: {
        tile: { x: 5, y: -3, id: 7, side: 'right' }
      },
      playerCeilingContact: {
        tile: { x: 2, y: -6, id: 8 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: ceiling-bonk\nWallNow: tile 5,-3 (#7, right)\nCeilingNow: tile 2,-6 (#8)'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose, live grounded, facing, move-axis, horizontal velocity, support-contact, wall-contact, and ceiling-contact telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'ceiling-bonk',
      playerGrounded: false,
      playerFacing: 'left',
      playerMoveX: -1,
      playerVelocityX: -180,
      playerSupportContact: {
        tile: { x: 4, y: -1, id: 6 }
      },
      playerWallContact: {
        tile: { x: 5, y: -3, id: 7, side: 'right' }
      },
      playerCeilingContact: {
        tile: { x: 2, y: -6, id: 8 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: ceiling-bonk\n' +
        'GroundedNow: off\n' +
        'FacingNow: left\n' +
        'MoveXNow: -1\n' +
        'VelXNow: -180.00\n' +
        'SupportNow: tile 4,-1 (#6)\n' +
        'WallNow: tile 5,-3 (#7, right)\n' +
        'CeilingNow: tile 2,-6 (#8)'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose, bonk-hold, live grounded, facing, move-axis, horizontal velocity, support-contact, wall-contact, and ceiling-contact telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'ceiling-bonk',
      playerCeilingBonkHoldActive: true,
      playerGrounded: false,
      playerFacing: 'right',
      playerMoveX: 1,
      playerVelocityX: 180,
      playerSupportContact: {
        tile: { x: 4, y: -1, id: 6 }
      },
      playerWallContact: {
        tile: { x: 5, y: -3, id: 7, side: 'right' }
      },
      playerCeilingContact: {
        tile: { x: 2, y: -6, id: 8 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: ceiling-bonk\n' +
        'BonkHold: on\n' +
        'GroundedNow: off\n' +
        'FacingNow: right\n' +
        'MoveXNow: 1\n' +
        'VelXNow: 180.00\n' +
        'SupportNow: tile 4,-1 (#6)\n' +
        'WallNow: tile 5,-3 (#7, right)\n' +
        'CeilingNow: tile 2,-6 (#8)'
    );
    expect(model.eventText).toBeNull();
  });

  it('keeps pose, world-position, world-tile, body chunk/local, collision AABB, grounded, facing, velocity, jump telemetry, and contact telemetry on separate player lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerPlaceholderPoseLabel: 'ceiling-bonk',
      playerWorldPosition: {
        x: 72,
        y: -48
      },
      playerWorldTile: {
        x: 4,
        y: -3
      },
      playerAabb: {
        min: { x: 66, y: -76 },
        max: { x: 78, y: -48 }
      },
      playerGrounded: false,
      playerFacing: 'right',
      playerMoveX: 1,
      playerVelocityX: 180,
      playerVelocityY: -210,
      playerJumpHeld: true,
      playerJumpPressed: true,
      playerSupportContact: {
        tile: { x: 4, y: -1, id: 6 }
      },
      playerWallContact: {
        tile: { x: 5, y: -3, id: 7, side: 'right' }
      },
      playerCeilingContact: {
        tile: { x: 2, y: -6, id: 8 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.playerText).toBe(
      'Pose: ceiling-bonk\n' +
        'PosNow: 72.00,-48.00\n' +
        'TileNow: 4,-3\n' +
        'ChunkNow: 0,-1\n' +
        'LocalNow: 4,29\n' +
        'AABBNow: min 66.00,-76.00 | max 78.00,-48.00 | size 12.00,28.00\n' +
        'GroundedNow: off\n' +
        'FacingNow: right\n' +
        'MoveXNow: 1\n' +
        'VelXNow: 180.00\n' +
        'VelYNow: -210.00\n' +
        'SpeedNow: 276.59\n' +
        'JumpHeldNow: on\n' +
        'JumpPressedNow: on\n' +
        'SupportNow: tile 4,-1 (#6)\n' +
        'WallNow: tile 5,-3 (#7, right)\n' +
        'CeilingNow: tile 2,-6 (#8)'
    );
    expect(model.eventText).toBeNull();
  });

  it('formats the latest auto-respawn event for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerRespawn: {
        kind: 'embedded',
        spawnTile: { x: 3, y: -2 },
        supportChunk: { x: 0, y: -1 },
        supportLocal: { x: 3, y: 31 },
        supportTileId: 4,
        liquidSafetyStatus: 'safe',
        position: { x: 56, y: -32 },
        velocity: { x: 0, y: 0 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.eventText).toBe(
      'Respawn: embedded | spawn 3,-2 | supportCh 0,-1 | supportL 3,31 | supportId #4 | spawnLiquid safe | pos 56.00,-32.00 | vel 0.00,0.00'
    );
  });

  it('formats the latest grounded-transition event for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerGroundedTransition: {
        kind: 'landing',
        position: { x: 80, y: -16 },
        velocity: { x: 30, y: 0 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.eventText).toBe('Ground: landing | pos 80.00,-16.00 | vel 30.00,0.00');
  });

  it('formats the latest facing-transition event for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerFacingTransition: {
        kind: 'right',
        previousFacing: 'left',
        nextFacing: 'right',
        position: { x: 84, y: -20 },
        velocity: { x: 120, y: 0 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.eventText).toBe('Facing: left->right | pos 84.00,-20.00 | vel 120.00,0.00');
  });

  it('formats the latest wall-contact transition event for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerWallContactTransition: {
        kind: 'blocked',
        tile: { x: 5, y: -3, id: 7, side: 'right' },
        position: { x: 88, y: -24 },
        velocity: { x: -180, y: 60 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.eventText).toBe(
      'Wall: blocked | tile 5,-3 (#7, right) | pos 88.00,-24.00 | vel -180.00,60.00'
    );
  });

  it('formats the latest ceiling-contact transition event for the compact strip when provided', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerCeilingContactTransition: {
        kind: 'blocked',
        tile: { x: 2, y: -6, id: 8 },
        position: { x: 72, y: -48 },
        velocity: { x: 15, y: -210 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.eventText).toBe('Ceiling: blocked | tile 2,-6 (#8) | pos 72.00,-48.00 | vel 15.00,-210.00');
  });

  it('keeps grounded, facing, and respawn telemetry on separate wrap-friendly event lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerGroundedTransition: {
        kind: 'fall',
        position: { x: 40, y: -8 },
        velocity: { x: 60, y: 90 }
      },
      playerFacingTransition: {
        kind: 'right',
        previousFacing: 'left',
        nextFacing: 'right',
        position: { x: 48, y: -8 },
        velocity: { x: 120, y: 90 }
      },
      playerRespawn: {
        kind: 'embedded',
        spawnTile: { x: 3, y: -2 },
        supportChunk: { x: 0, y: -1 },
        supportLocal: { x: 3, y: 31 },
        supportTileId: 4,
        liquidSafetyStatus: 'safe',
        position: { x: 56, y: -32 },
        velocity: { x: 0, y: 0 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.eventText).toBe(
      'Ground: fall | pos 40.00,-8.00 | vel 60.00,90.00\n' +
        'Facing: left->right | pos 48.00,-8.00 | vel 120.00,90.00\n' +
        'Respawn: embedded | spawn 3,-2 | supportCh 0,-1 | supportL 3,31 | supportId #4 | spawnLiquid safe | pos 56.00,-32.00 | vel 0.00,0.00'
    );
  });

  it('keeps grounded, facing, respawn, and wall-contact telemetry on separate wrap-friendly event lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerGroundedTransition: {
        kind: 'fall',
        position: { x: 40, y: -8 },
        velocity: { x: 60, y: 90 }
      },
      playerFacingTransition: {
        kind: 'left',
        previousFacing: 'right',
        nextFacing: 'left',
        position: { x: 52, y: -10 },
        velocity: { x: -140, y: 80 }
      },
      playerRespawn: {
        kind: 'embedded',
        spawnTile: { x: 3, y: -2 },
        supportChunk: { x: 0, y: -1 },
        supportLocal: { x: 3, y: 31 },
        supportTileId: 4,
        liquidSafetyStatus: 'safe',
        position: { x: 56, y: -32 },
        velocity: { x: 0, y: 0 }
      },
      playerWallContactTransition: {
        kind: 'cleared',
        tile: { x: -1, y: -2, id: 4, side: 'left' },
        position: { x: 64, y: -16 },
        velocity: { x: 120, y: 0 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.eventText).toBe(
      'Ground: fall | pos 40.00,-8.00 | vel 60.00,90.00\n' +
        'Facing: right->left | pos 52.00,-10.00 | vel -140.00,80.00\n' +
        'Respawn: embedded | spawn 3,-2 | supportCh 0,-1 | supportL 3,31 | supportId #4 | spawnLiquid safe | pos 56.00,-32.00 | vel 0.00,0.00\n' +
        'Wall: cleared | tile -1,-2 (#4, left) | pos 64.00,-16.00 | vel 120.00,0.00'
    );
  });

  it('keeps grounded, facing, respawn, wall-contact, and ceiling-contact telemetry on separate wrap-friendly event lines', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      hoveredTile: null,
      pinnedTile: null,
      desktopInspectPinArmed: false,
      playerGroundedTransition: {
        kind: 'jump',
        position: { x: 56, y: -48 },
        velocity: { x: 20, y: -180 }
      },
      playerFacingTransition: {
        kind: 'right',
        previousFacing: 'left',
        nextFacing: 'right',
        position: { x: 60, y: -42 },
        velocity: { x: 110, y: -170 }
      },
      playerRespawn: {
        kind: 'embedded',
        spawnTile: { x: 3, y: -2 },
        supportChunk: { x: 0, y: -1 },
        supportLocal: { x: 3, y: 31 },
        supportTileId: 4,
        liquidSafetyStatus: 'safe',
        position: { x: 56, y: -32 },
        velocity: { x: 0, y: 0 }
      },
      playerWallContactTransition: {
        kind: 'cleared',
        tile: { x: -1, y: -2, id: 4, side: 'left' },
        position: { x: 64, y: -16 },
        velocity: { x: 120, y: 0 }
      },
      playerCeilingContactTransition: {
        kind: 'blocked',
        tile: { x: 2, y: -6, id: 8 },
        position: { x: 72, y: -48 },
        velocity: { x: 15, y: -210 }
      },
      preview: createEmptyPreviewState()
    });

    expect(model.eventText).toBe(
      'Ground: jump | pos 56.00,-48.00 | vel 20.00,-180.00\n' +
        'Facing: left->right | pos 60.00,-42.00 | vel 110.00,-170.00\n' +
        'Respawn: embedded | spawn 3,-2 | supportCh 0,-1 | supportL 3,31 | supportId #4 | spawnLiquid safe | pos 56.00,-32.00 | vel 0.00,0.00\n' +
        'Wall: cleared | tile -1,-2 (#4, left) | pos 64.00,-16.00 | vel 120.00,0.00\n' +
        'Ceiling: blocked | tile 2,-6 (#8) | pos 72.00,-48.00 | vel 15.00,-210.00'
    );
  });

  it('shows active mouse-drag preview anchor and endpoint coordinates in the status-strip model', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      desktopInspectPinArmed: false,
      pinnedTile: null,
      preview: {
        ...createEmptyPreviewState(),
        activeMouseLineDrag: {
          kind: 'place',
          startTileX: 4,
          startTileY: 7
        }
      },
      hoveredTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava'
      }
    });

    expect(model.toolText).toBe('Tool: Line Brush armed');
    expect(model.previewText).toBe('Preview: anchor 4,7 | endpoint 12,-4 | span 9x12 tiles | affects 12 tiles');
  });

  it('shows anchored touch preview coordinates while the endpoint is still pending', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      desktopInspectPinArmed: false,
      pinnedTile: null,
      hoveredTile: null,
      preview: {
        ...createEmptyPreviewState(),
        pendingTouchRectOutlineStart: {
          kind: 'break',
          tileX: -3,
          tileY: 15
        }
      }
    });

    expect(model.toolText).toBe('Tool: Rect Outline Break armed');
    expect(model.previewText).toBe('Preview: anchor -3,15 | endpoint pending | span pending | affects pending');
  });

  it('shows rectangle fill preview affected tile counts from the inclusive preview bounds', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      desktopInspectPinArmed: false,
      pinnedTile: null,
      preview: {
        ...createEmptyPreviewState(),
        activeMouseRectDrag: {
          kind: 'place',
          startTileX: 1,
          startTileY: 2
        }
      },
      hoveredTile: {
        tileX: 3,
        tileY: 4,
        chunkX: 0,
        chunkY: 0,
        localX: 3,
        localY: 4,
        tileId: 2,
        tileLabel: 'dirt',
        solid: true,
        blocksLight: true,
        liquidKind: null
      }
    });

    expect(model.previewText).toBe('Preview: anchor 1,2 | endpoint 3,4 | span 3x3 tiles | affects 9 tiles');
  });

  it('shows rectangle outline preview affected tile counts from the perimeter tiles', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      desktopInspectPinArmed: false,
      pinnedTile: null,
      preview: {
        ...createEmptyPreviewState(),
        activeMouseRectOutlineDrag: {
          kind: 'break',
          startTileX: 1,
          startTileY: 2
        }
      },
      hoveredTile: {
        tileX: 3,
        tileY: 4,
        chunkX: 0,
        chunkY: 0,
        localX: 3,
        localY: 4,
        tileId: 0,
        tileLabel: 'air',
        solid: false,
        blocksLight: false,
        liquidKind: null
      }
    });

    expect(model.previewText).toBe('Preview: anchor 1,2 | endpoint 3,4 | span 3x3 tiles | affects 8 tiles');
  });

  it('shows ellipse fill preview affected tile counts from the resolved ellipse area', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      desktopInspectPinArmed: false,
      pinnedTile: null,
      preview: {
        ...createEmptyPreviewState(),
        activeMouseEllipseDrag: {
          kind: 'place',
          startTileX: 0,
          startTileY: 0
        }
      },
      hoveredTile: {
        tileX: 4,
        tileY: 4,
        chunkX: 0,
        chunkY: 0,
        localX: 4,
        localY: 4,
        tileId: 2,
        tileLabel: 'dirt',
        solid: true,
        blocksLight: true,
        liquidKind: null
      }
    });

    expect(model.previewText).toBe('Preview: anchor 0,0 | endpoint 4,4 | span 5x5 tiles | affects 21 tiles');
  });

  it('shows active shape preview span dimensions from the inclusive tile bounds', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      desktopInspectPinArmed: false,
      pinnedTile: null,
      preview: {
        ...createEmptyPreviewState(),
        activeMouseEllipseOutlineDrag: {
          kind: 'break',
          startTileX: -5,
          startTileY: 8
        }
      },
      hoveredTile: {
        tileX: -2,
        tileY: 2,
        chunkX: -1,
        chunkY: 0,
        localX: 30,
        localY: 2,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava'
      }
    });

    expect(model.toolText).toBe('Tool: Ellipse Outline Break armed');
    expect(model.previewText).toBe('Preview: anchor -5,8 | endpoint -2,2 | span 4x7 tiles | affects 14 tiles');
  });

  it('formats hovered tile metadata with compact gameplay flag readouts', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      pinnedTile: null,
      desktopInspectPinArmed: false,
      hoveredTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava',
        liquidLevel: 3,
        liquidSurfaceNorthLevel: 0,
        liquidSurfaceWestLevel: 5,
        liquidSurfaceCenterLevel: 3,
        liquidSurfaceEastLevel: 0,
        liquidSurfaceBranch: 'exposed',
        liquidSurfaceTopLeft: 0.5,
        liquidSurfaceTopRight: 0.375,
        liquidFrameTopV: 0.75,
        liquidFrameTopPixelY: 48,
        liquidFrameBottomV: 0.875,
        liquidFrameBottomPixelY: 56,
        liquidFrameHeightV: 0.125,
        liquidFramePixelHeight: 8,
        liquidBottomLeftV: 0.8125,
        liquidBottomRightV: 0.796875,
        liquidBottomLeftPixelY: 52,
        liquidBottomRightPixelY: 51,
        liquidVisibleLeftV: 0.0625,
        liquidVisibleRightV: 0.046875,
        liquidVisibleLeftPercentage: 50,
        liquidVisibleRightPercentage: 37.5,
        liquidVisibleLeftPixelHeight: 4,
        liquidVisibleRightPixelHeight: 3,
        liquidRemainderLeftV: 0.0625,
        liquidRemainderRightV: 0.078125,
        liquidRemainderLeftPercentage: 50,
        liquidRemainderRightPercentage: 62.5,
        liquidRemainderLeftPixelHeight: 4,
        liquidRemainderRightPixelHeight: 5,
        liquidCoverageLeftTotalPercentage: 100,
        liquidCoverageRightTotalPercentage: 100,
        liquidCoverageLeftTotalPixelHeight: 8,
        liquidCoverageRightTotalPixelHeight: 8,
        liquidConnectivityGroupLabel: 'lava',
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
        liquidVariantSource: 'uvRect 0.333,0.75..0.5,0.875',
        liquidVariantUvRect: '0.333,0.75..0.5,0.875',
        liquidVariantPixelBounds: '32,48..48,56'
      }
    });

    expect(model.hoverText).toBe(
      'Hover: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava | liquidLevel:3/8 | liquidSurfaceIn:north=0/8 west=5/8 center=3/8 east=0/8 | liquidSurfaceBranch:exposed | liquidTopLeft:0.5 | liquidTopRight:0.375 | liquidFrameTopV:0.75 | liquidFrameTopPxY:48 | liquidFrameBottomV:0.875 | liquidFrameBottomPxY:56 | liquidFrameHeightV:0.125 | liquidFramePxH:8 | liquidBottomLeftV:0.813 | liquidBottomRightV:0.797 | liquidBottomLeftPxY:52 | liquidBottomRightPxY:51 | liquidVisibleLeftV:0.063 | liquidVisibleRightV:0.047 | liquidVisibleLeftPct:50% | liquidVisibleRightPct:37.5% | liquidVisibleLeftPxH:4 | liquidVisibleRightPxH:3 | liquidRemainderLeftV:0.063 | liquidRemainderRightV:0.078 | liquidRemainderLeftPct:50% | liquidRemainderRightPct:62.5% | liquidRemainderLeftPxH:4 | liquidRemainderRightPxH:5 | liquidCoverageLeftPct:50%+50%=100% | liquidCoverageRightPct:37.5%+62.5%=100% | liquidCoverageLeftPxH:4+4=8 | liquidCoverageRightPxH:3+5=8 | liquidGroup:lava | liquidMask:NE-W (11) | liquidFrame:1/2 | liquidFrameDur:180ms | liquidFrameElapsed:60ms | liquidFrameRemain:120ms | liquidFramePct:33.3% | liquidLoopDur:360ms | liquidLoopElapsed:240ms | liquidLoopPct:66.7% | liquidLoopRemain:120ms | liquidSrc:uvRect 0.333,0.75..0.5,0.875 | liquidUv:0.333,0.75..0.5,0.875 | liquidPx:32,48..48,56'
    );
  });

  it('shows zero-valued liquid frame-top origins instead of dropping them from inspect text', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      desktopInspectPinArmed: false,
      hoveredTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
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
        liquidVisibleLeftPercentage: 50,
        liquidVisibleRightPercentage: 37.5,
        liquidVisibleLeftPixelHeight: 8,
        liquidVisibleRightPixelHeight: 6,
        liquidRemainderLeftV: 0.125,
        liquidRemainderRightV: 0.15625,
        liquidRemainderLeftPercentage: 50,
        liquidRemainderRightPercentage: 62.5,
        liquidRemainderLeftPixelHeight: 8,
        liquidRemainderRightPixelHeight: 10,
        liquidCoverageLeftTotalPercentage: 100,
        liquidCoverageRightTotalPercentage: 100,
        liquidCoverageLeftTotalPixelHeight: 16,
        liquidCoverageRightTotalPixelHeight: 16,
        liquidConnectivityGroupLabel: 'water',
        liquidCardinalMask: 11,
        liquidVariantSource: 'uvRect 0.667,0..0.75,0.25',
        liquidVariantUvRect: '0.667,0..0.75,0.25',
        liquidVariantPixelBounds: '64,0..72,16'
      },
      pinnedTile: null
    });

    expect(model.hoverText).toContain('liquidFrameTopV:0');
    expect(model.hoverText).toContain('liquidFrameTopPxY:0');
    expect(model.hoverText).toContain('liquidFrameBottomV:0.25');
    expect(model.hoverText).toContain('liquidFrameBottomPxY:16');
    expect(model.hoverText).toContain('liquidFrameHeightV:0.25');
    expect(model.hoverText).toContain('liquidVisibleLeftPct:50%');
    expect(model.hoverText).toContain('liquidVisibleRightPct:37.5%');
    expect(model.hoverText).toContain('liquidFramePxH:16');
    expect(model.hoverText).toContain('liquidRemainderLeftV:0.125');
    expect(model.hoverText).toContain('liquidRemainderRightV:0.156');
    expect(model.hoverText).toContain('liquidRemainderLeftPct:50%');
    expect(model.hoverText).toContain('liquidRemainderRightPct:62.5%');
    expect(model.hoverText).toContain('liquidRemainderLeftPxH:8');
    expect(model.hoverText).toContain('liquidRemainderRightPxH:10');
    expect(model.hoverText).toContain('liquidCoverageLeftPct:50%+50%=100%');
    expect(model.hoverText).toContain('liquidCoverageRightPct:37.5%+62.5%=100%');
    expect(model.hoverText).toContain('liquidCoverageLeftPxH:8+8=16');
    expect(model.hoverText).toContain('liquidCoverageRightPxH:6+10=16');
  });

  it('shows pinned inspect metadata with a repin hint when no separate hover target is present', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      desktopInspectPinArmed: false,
      hoveredTile: null,
      pinnedTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava',
        liquidLevel: 5,
        liquidSurfaceNorthLevel: 0,
        liquidSurfaceWestLevel: 7,
        liquidSurfaceCenterLevel: 5,
        liquidSurfaceEastLevel: 0,
        liquidSurfaceTopLeft: 0.75,
        liquidSurfaceTopRight: 0.625,
        liquidFrameTopV: 0.75,
        liquidFrameTopPixelY: 48,
        liquidFrameBottomV: 0.875,
        liquidFrameBottomPixelY: 56,
        liquidFrameHeightV: 0.125,
        liquidFramePixelHeight: 8,
        liquidBottomLeftV: 0.84375,
        liquidBottomRightV: 0.828125,
        liquidBottomLeftPixelY: 54,
        liquidBottomRightPixelY: 53,
        liquidVisibleLeftV: 0.09375,
        liquidVisibleRightV: 0.078125,
        liquidVisibleLeftPercentage: 75,
        liquidVisibleRightPercentage: 62.5,
        liquidVisibleLeftPixelHeight: 6,
        liquidVisibleRightPixelHeight: 5,
        liquidRemainderLeftV: 0.03125,
        liquidRemainderRightV: 0.046875,
        liquidRemainderLeftPercentage: 25,
        liquidRemainderRightPercentage: 37.5,
        liquidRemainderLeftPixelHeight: 2,
        liquidRemainderRightPixelHeight: 3,
        liquidCoverageLeftTotalPercentage: 100,
        liquidCoverageRightTotalPercentage: 100,
        liquidCoverageLeftTotalPixelHeight: 8,
        liquidCoverageRightTotalPixelHeight: 8,
        liquidConnectivityGroupLabel: 'lava',
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
        liquidVariantSource: 'uvRect 0.5,0.75..0.667,0.875',
        liquidVariantUvRect: '0.5,0.75..0.667,0.875',
        liquidVariantPixelBounds: '48,48..64,56'
      }
    });

    expect(model.hoverText).toBe(
      'Pinned: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava | liquidLevel:5/8 | liquidSurfaceIn:north=0/8 west=7/8 center=5/8 east=0/8 | liquidTopLeft:0.75 | liquidTopRight:0.625 | liquidFrameTopV:0.75 | liquidFrameTopPxY:48 | liquidFrameBottomV:0.875 | liquidFrameBottomPxY:56 | liquidFrameHeightV:0.125 | liquidFramePxH:8 | liquidBottomLeftV:0.844 | liquidBottomRightV:0.828 | liquidBottomLeftPxY:54 | liquidBottomRightPxY:53 | liquidVisibleLeftV:0.094 | liquidVisibleRightV:0.078 | liquidVisibleLeftPct:75% | liquidVisibleRightPct:62.5% | liquidVisibleLeftPxH:6 | liquidVisibleRightPxH:5 | liquidRemainderLeftV:0.031 | liquidRemainderRightV:0.047 | liquidRemainderLeftPct:25% | liquidRemainderRightPct:37.5% | liquidRemainderLeftPxH:2 | liquidRemainderRightPxH:3 | liquidCoverageLeftPct:75%+25%=100% | liquidCoverageRightPct:62.5%+37.5%=100% | liquidCoverageLeftPxH:6+2=8 | liquidCoverageRightPxH:5+3=8 | liquidGroup:lava | liquidMask:NE-W (11) | liquidFrame:1/2 | liquidFrameDur:180ms | liquidFrameElapsed:60ms | liquidFrameRemain:120ms | liquidFramePct:33.3% | liquidLoopDur:360ms | liquidLoopElapsed:240ms | liquidLoopPct:66.7% | liquidLoopRemain:120ms | liquidSrc:uvRect 0.5,0.75..0.667,0.875 | liquidUv:0.5,0.75..0.667,0.875 | liquidPx:48,48..64,56'
    );
    expect(model.inspectText).toBe('Inspect: Pinned @ 12,-4');
    expect(model.inspectActionText).toBe('Repin Click');
    expect(model.clearActionText).toBe('Clear Pin');
    expect(model.hintText).toBe(
      'Pinned inspect active | strip: Repin Click or Clear Pin\n' +
        'Touch: tap another tile to repin or the same tile to clear'
    );
  });

  it('shows separate pinned and hovered metadata lines when inspect targets differ', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      desktopInspectPinArmed: false,
      hoveredTile: {
        tileX: 4,
        tileY: 7,
        chunkX: 0,
        chunkY: 0,
        localX: 4,
        localY: 7,
        tileId: 2,
        tileLabel: 'dirt',
        solid: true,
        blocksLight: true,
        liquidKind: null
      },
      pinnedTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava',
        liquidLevel: 5,
        liquidConnectivityGroupLabel: 'lava',
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
        liquidVariantSource: 'uvRect 0.5,0.75..0.667,0.875',
        liquidVariantUvRect: '0.5,0.75..0.667,0.875',
        liquidVariantPixelBounds: '48,48..64,56'
      }
    });

    expect(model.hoverText).toBe(
      'Pinned: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava | liquidLevel:5/8 | liquidGroup:lava | liquidMask:NE-W (11) | liquidFrame:1/2 | liquidFrameDur:180ms | liquidFrameElapsed:60ms | liquidFrameRemain:120ms | liquidFramePct:33.3% | liquidLoopDur:360ms | liquidLoopElapsed:240ms | liquidLoopPct:66.7% | liquidLoopRemain:120ms | liquidSrc:uvRect 0.5,0.75..0.667,0.875 | liquidUv:0.5,0.75..0.667,0.875 | liquidPx:48,48..64,56\n' +
        'Hover: dirt (#2) @ 4,7 chunk:0,0 local:4,7 | solid:on | light:on | liquid:none\n' +
        'Offset: Hover->Pinned x:+8 y:-11'
    );
  });

  it('deduplicates compact inspect metadata when hovered and pinned targets match', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      desktopInspectPinArmed: false,
      hoveredTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava',
        liquidLevel: 5,
        liquidConnectivityGroupLabel: 'lava',
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
        liquidVariantSource: 'uvRect 0.5,0.75..0.667,0.875',
        liquidVariantUvRect: '0.5,0.75..0.667,0.875',
        liquidVariantPixelBounds: '48,48..64,56'
      },
      pinnedTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava',
        liquidLevel: 5,
        liquidConnectivityGroupLabel: 'lava',
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
        liquidVariantSource: 'uvRect 0.5,0.75..0.667,0.875',
        liquidVariantUvRect: '0.5,0.75..0.667,0.875',
        liquidVariantPixelBounds: '48,48..64,56'
      }
    });

    expect(model.hoverText).toBe(
      'Shared: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava | liquidLevel:5/8 | liquidGroup:lava | liquidMask:NE-W (11) | liquidFrame:1/2 | liquidFrameDur:180ms | liquidFrameElapsed:60ms | liquidFrameRemain:120ms | liquidFramePct:33.3% | liquidLoopDur:360ms | liquidLoopElapsed:240ms | liquidLoopPct:66.7% | liquidLoopRemain:120ms | liquidSrc:uvRect 0.5,0.75..0.667,0.875 | liquidUv:0.5,0.75..0.667,0.875 | liquidPx:48,48..64,56'
    );
    expect(model.inspectText).toBe('Inspect: Shared @ 12,-4');
  });

  it('surfaces armed desktop repin guidance separately from the pinned idle state', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      hoveredTile: null,
      pinnedTile: {
        tileX: 12,
        tileY: -4,
        chunkX: 0,
        chunkY: -1,
        localX: 12,
        localY: 28,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava'
      },
      desktopInspectPinArmed: true
    });

    expect(model.inspectText).toBe('Inspect: Click-to-pin armed');
    expect(model.inspectActionText).toBe('Cancel Pin Click');
    expect(model.clearActionText).toBe('Clear Pin');
    expect(model.hintText).toBe(
      'Repin Click armed | click a world tile to move the pinned inspect target | dragging still pans | Esc cancels'
    );
  });

  it('formats chunk-local inspect coordinates for negative-world tiles', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      pinnedTile: null,
      desktopInspectPinArmed: false,
      hoveredTile: {
        tileX: -33,
        tileY: -1,
        chunkX: -2,
        chunkY: -1,
        localX: 31,
        localY: 31,
        tileId: 2,
        tileLabel: 'dirt',
        solid: true,
        blocksLight: true,
        liquidKind: null
      }
    });

    expect(model.hoverText).toBe(
      'Hover: dirt (#2) @ -33,-1 chunk:-2,-1 local:31,31 | solid:on | light:on | liquid:none'
    );
  });
});

describe('buildActiveDebugToolPreviewBadgeText', () => {
  it('shows active mouse-drag preview coordinates alongside span and affected counts', () => {
    expect(
      buildActiveDebugToolPreviewBadgeText(
        {
          ...createEmptyPreviewState(),
          activeMouseLineDrag: {
            kind: 'place',
            startTileX: 4,
            startTileY: 7
          }
        },
        {
          tileX: 12,
          tileY: -4
        }
      )
    ).toBe('Preview: anchor 4,7 | endpoint 12,-4 | span 9x12 tiles | affects 12 tiles');
  });

  it('shows pending touch preview coordinates while the endpoint is still pending', () => {
    expect(
      buildActiveDebugToolPreviewBadgeText(
        {
          ...createEmptyPreviewState(),
          pendingTouchEllipseOutlineStart: {
            kind: 'break',
            tileX: -3,
            tileY: 15
          }
        },
        null
      )
    ).toBe('Preview: anchor -3,15 | endpoint pending | span pending | affects pending');
  });

  it('returns no badge estimate when a one-shot tool is armed but no preview overlay is active', () => {
    expect(
      buildActiveDebugToolPreviewBadgeText(
        {
          ...createEmptyPreviewState(),
          armedRectKind: 'place'
        },
        {
          tileX: 8,
          tileY: 9
        }
      )
    ).toBeNull();
  });
});

describe('buildPendingTouchAnchorLabelText', () => {
  it('includes touch line anchor coordinates in the persistent anchor label text', () => {
    expect(
      buildPendingTouchAnchorLabelText({
        ...createEmptyPreviewState(),
        pendingTouchLineStart: {
          kind: 'place',
          tileX: 4,
          tileY: 7
        }
      })
    ).toBe('Line Brush start @ 4,7');
  });

  it('includes touch shape anchor coordinates and break action text in the persistent anchor label text', () => {
    expect(
      buildPendingTouchAnchorLabelText({
        ...createEmptyPreviewState(),
        pendingTouchEllipseOutlineStart: {
          kind: 'break',
          tileX: -3,
          tileY: 15
        }
      })
    ).toBe('Ellipse Outline Break corner @ -3,15');
  });

  it('returns null when no anchored touch preview is pending', () => {
    expect(buildPendingTouchAnchorLabelText(createEmptyPreviewState())).toBeNull();
  });
});
