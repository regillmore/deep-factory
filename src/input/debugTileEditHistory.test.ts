import { describe, expect, it } from 'vitest';

import { DebugTileEditHistory } from './debugTileEditHistory';

describe('DebugTileEditHistory', () => {
  it('undos and redoes committed strokes as grouped tile batches', () => {
    const history = new DebugTileEditHistory();
    const applied: Array<{ x: number; y: number; layer: 'tile' | 'wall'; id: number }> = [];
    const applyEdit = (x: number, y: number, layer: 'tile' | 'wall', id: number): void => {
      applied.push({ x, y, layer, id });
    };

    history.recordAppliedEdit(1, 4, 5, 2, 7);
    history.recordAppliedEdit(1, 5, 5, 3, 8);
    expect(history.completeStroke(1)).toBe(true);

    history.recordAppliedEdit(2, 9, -1, 0, 6);
    expect(history.completeStroke(2)).toBe(true);

    expect(history.undo(applyEdit)).toBe(true);
    expect(applied).toEqual([{ x: 9, y: -1, layer: 'tile', id: 0 }]);

    applied.length = 0;
    expect(history.undo(applyEdit)).toBe(true);
    expect(applied).toEqual([
      { x: 5, y: 5, layer: 'tile', id: 3 },
      { x: 4, y: 5, layer: 'tile', id: 2 }
    ]);

    applied.length = 0;
    expect(history.redo(applyEdit)).toBe(true);
    expect(applied).toEqual([
      { x: 4, y: 5, layer: 'tile', id: 7 },
      { x: 5, y: 5, layer: 'tile', id: 8 }
    ]);
  });

  it('clears redo history when a new stroke is committed', () => {
    const history = new DebugTileEditHistory();
    const applyTile = (): void => {};

    history.recordAppliedEdit(1, 0, 0, 1, 2);
    history.completeStroke(1);
    history.undo(applyTile);
    expect(history.getStatus().redoStrokeCount).toBe(1);

    history.recordAppliedEdit(2, 1, 0, 2, 3);
    history.completeStroke(2);

    expect(history.getStatus()).toEqual({
      canUndo: true,
      canRedo: false,
      undoStrokeCount: 1,
      redoStrokeCount: 0
    });
  });

  it('ignores empty completions and merges repeated edits to the same tile within a stroke', () => {
    const history = new DebugTileEditHistory();
    const applied: Array<{ x: number; y: number; layer: 'tile' | 'wall'; id: number }> = [];

    expect(history.completeStroke(99)).toBe(false);

    history.recordAppliedEdit(1, 2, 3, 4, 5);
    history.recordAppliedEdit(1, 2, 3, 5, 7);
    expect(history.completeStroke(1)).toBe(true);

    history.undo((x, y, layer, id) => applied.push({ x, y, layer, id }));
    expect(applied).toEqual([{ x: 2, y: 3, layer: 'tile', id: 4 }]);

    applied.length = 0;
    history.redo((x, y, layer, id) => applied.push({ x, y, layer, id }));
    expect(applied).toEqual([{ x: 2, y: 3, layer: 'tile', id: 7 }]);
  });

  it('keeps tile and wall edits for the same cell as separate stroke history entries', () => {
    const history = new DebugTileEditHistory();
    const applied: Array<{ x: number; y: number; layer: 'tile' | 'wall'; id: number }> = [];

    history.recordAppliedEdit(1, 2, 3, 9, 0, 'tile');
    history.recordAppliedEdit(1, 2, 3, 4, 0, 'wall');
    expect(history.completeStroke(1)).toBe(true);

    expect(
      history.undo((x, y, layer, id) => {
        applied.push({ x, y, layer, id });
      })
    ).toBe(true);
    expect(applied).toEqual([
      { x: 2, y: 3, layer: 'wall', id: 4 },
      { x: 2, y: 3, layer: 'tile', id: 9 }
    ]);

    applied.length = 0;
    expect(
      history.redo((x, y, layer, id) => {
        applied.push({ x, y, layer, id });
      })
    ).toBe(true);
    expect(applied).toEqual([
      { x: 2, y: 3, layer: 'tile', id: 0 },
      { x: 2, y: 3, layer: 'wall', id: 0 }
    ]);
  });
});
