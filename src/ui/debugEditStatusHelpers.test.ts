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
    expect(model.hintText).toBe('click/tap target tile - Esc cancel');
    expect(model.toolAccent).toBe('rgba(120, 255, 180, 0.95)');
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
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava'
      }
    });

    expect(model.hoverText).toBe(
      'Hover: lava pool (#9) @ 12,-4 | solid:off | light:on | liquid:lava'
    );
  });

  it('prioritizes pinned inspect metadata with a repin hint', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: createEmptyPreviewState(),
      desktopInspectPinArmed: false,
      hoveredTile: {
        tileX: 4,
        tileY: 7,
        tileId: 2,
        tileLabel: 'dirt',
        solid: true,
        blocksLight: true,
        liquidKind: null
      },
      pinnedTile: {
        tileX: 12,
        tileY: -4,
        tileId: 9,
        tileLabel: 'lava pool',
        solid: false,
        blocksLight: true,
        liquidKind: 'lava'
      }
    });

    expect(model.hoverText).toBe(
      'Pinned: lava pool (#9) @ 12,-4 | solid:off | light:on | liquid:lava'
    );
    expect(model.inspectText).toBe('Inspect: Pinned @ 12,-4');
    expect(model.inspectActionText).toBe('Repin Click');
    expect(model.clearActionText).toBe('Clear Pin');
    expect(model.hintText).toBe(
      'Pinned inspect active: use Repin Click or Clear Pin in the strip; touch can also tap another tile to repin or the same tile to clear.'
    );
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
});
