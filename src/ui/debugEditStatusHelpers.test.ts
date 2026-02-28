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
      preview: createEmptyPreviewState()
    });

    expect(model.modeText).toBe('Mode: Place');
    expect(model.brushText).toBe('Brush: debug brick (#3)');
    expect(model.toolText).toBe('Tool: No one-shot armed');
    expect(model.hintText).toContain('Touch: drag to paint');
    expect(model.hintText).toContain('Esc cancels one-shot tools');
  });

  it('surfaces active flood-fill guidance directly in the status-strip model', () => {
    const model = buildDebugEditStatusStripModel({
      mode: 'pan',
      brushLabel: 'debug brick',
      brushTileId: 3,
      preview: {
        ...createEmptyPreviewState(),
        armedFloodFillKind: 'place'
      }
    });

    expect(model.toolText).toBe('Tool: Fill Brush armed');
    expect(model.hintText).toBe('click/tap target tile - Esc cancel');
    expect(model.toolAccent).toBe('rgba(120, 255, 180, 0.95)');
  });
});
