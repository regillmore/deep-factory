import { describe, expect, it } from 'vitest';

import { DebugTileEditHistory } from './debugTileEditHistory';

describe('DebugTileEditHistory', () => {
  it('undos and redoes committed strokes as grouped tile batches', () => {
    const history = new DebugTileEditHistory();
    const applied: Array<{ x: number; y: number; tileId: number }> = [];
    const applyTile = (x: number, y: number, tileId: number): void => {
      applied.push({ x, y, tileId });
    };

    history.recordAppliedEdit(1, 4, 5, 2, 7);
    history.recordAppliedEdit(1, 5, 5, 3, 8);
    expect(history.completeStroke(1)).toBe(true);

    history.recordAppliedEdit(2, 9, -1, 0, 6);
    expect(history.completeStroke(2)).toBe(true);

    expect(history.undo(applyTile)).toBe(true);
    expect(applied).toEqual([{ x: 9, y: -1, tileId: 0 }]);

    applied.length = 0;
    expect(history.undo(applyTile)).toBe(true);
    expect(applied).toEqual([
      { x: 5, y: 5, tileId: 3 },
      { x: 4, y: 5, tileId: 2 }
    ]);

    applied.length = 0;
    expect(history.redo(applyTile)).toBe(true);
    expect(applied).toEqual([
      { x: 4, y: 5, tileId: 7 },
      { x: 5, y: 5, tileId: 8 }
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
    const applied: Array<{ x: number; y: number; tileId: number }> = [];

    expect(history.completeStroke(99)).toBe(false);

    history.recordAppliedEdit(1, 2, 3, 4, 5);
    history.recordAppliedEdit(1, 2, 3, 5, 7);
    expect(history.completeStroke(1)).toBe(true);

    history.undo((x, y, tileId) => applied.push({ x, y, tileId }));
    expect(applied).toEqual([{ x: 2, y: 3, tileId: 4 }]);

    applied.length = 0;
    history.redo((x, y, tileId) => applied.push({ x, y, tileId }));
    expect(applied).toEqual([{ x: 2, y: 3, tileId: 7 }]);
  });
});
