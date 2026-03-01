import { describe, expect, it } from 'vitest';

import type { ArmedDebugToolPreviewState } from '../input/controller';
import { buildDebugEditStatusStripModel, resolveActiveDebugToolStatus } from './debugEditStatusHelpers';

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
      detail: 'drag endpoint, release to apply - Esc cancel',
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
      detail: 'corner set, tap opposite corner - Esc cancel',
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
    expect(model.inspectText).toBe('Inspect: Hover only');
    expect(model.hoverText).toBe(
      'Hover: move cursor or touch a world tile to inspect gameplay flags. Pin Click keeps metadata visible.'
    );
    expect(model.inspectActionText).toBe('Pin Click');
    expect(model.clearActionText).toBeNull();
    expect(model.hintText).toContain('Touch: drag to paint');
    expect(model.hintText).toContain('Pin Click arms inspect pinning');
    expect(model.hintText).toContain('N line');
    expect(model.hintText).toContain('Esc cancels one-shot tools');
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
    expect(model.hintText).toBe('click/tap target tile - Esc cancel');
    expect(model.toolAccent).toBe('rgba(120, 255, 180, 0.95)');
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
    expect(model.previewText).toBe('Preview: anchor 4,7 | endpoint 12,-4 | span 9x12 tiles');
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
    expect(model.previewText).toBe('Preview: anchor -3,15 | endpoint pending | span pending');
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
    expect(model.previewText).toBe('Preview: anchor -5,8 | endpoint -2,2 | span 4x7 tiles');
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
        liquidKind: 'lava'
      }
    });

    expect(model.hoverText).toBe(
      'Hover: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava'
    );
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
        liquidKind: 'lava'
      }
    });

    expect(model.hoverText).toBe(
      'Pinned: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava'
    );
    expect(model.inspectText).toBe('Inspect: Pinned @ 12,-4');
    expect(model.inspectActionText).toBe('Repin Click');
    expect(model.clearActionText).toBe('Clear Pin');
    expect(model.hintText).toBe(
      'Pinned inspect active: use Repin Click or Clear Pin in the strip; touch can also tap another tile to repin or the same tile to clear.'
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
        liquidKind: 'lava'
      }
    });

    expect(model.hoverText).toBe(
      'Pinned: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava\n' +
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
        liquidKind: 'lava'
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
        liquidKind: 'lava'
      }
    });

    expect(model.hoverText).toBe(
      'Shared: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava'
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
      'Repin Click armed: click a world tile to move the pinned inspect target. Dragging still pans, Esc cancels.'
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
