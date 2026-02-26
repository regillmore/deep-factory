export interface DebugTileStrokeTileChange {
  worldTileX: number;
  worldTileY: number;
  previousTileId: number;
  tileId: number;
}

export interface DebugTileEditHistoryStatus {
  canUndo: boolean;
  canRedo: boolean;
  undoStrokeCount: number;
  redoStrokeCount: number;
}

interface PendingDebugTileStroke {
  changes: DebugTileStrokeTileChange[];
  changeIndexesByTileKey: Map<string, number>;
}

const tileKey = (worldTileX: number, worldTileY: number): string => `${worldTileX},${worldTileY}`;

export class DebugTileEditHistory {
  private pendingStrokes = new Map<number, PendingDebugTileStroke>();
  private undoStack: DebugTileStrokeTileChange[][] = [];
  private redoStack: DebugTileStrokeTileChange[][] = [];

  constructor(private readonly maxUndoStrokes = 64) {}

  recordAppliedEdit(
    strokeId: number,
    worldTileX: number,
    worldTileY: number,
    previousTileId: number,
    tileId: number
  ): void {
    if (previousTileId === tileId) return;

    let pending = this.pendingStrokes.get(strokeId);
    if (!pending) {
      pending = {
        changes: [],
        changeIndexesByTileKey: new Map<string, number>()
      };
      this.pendingStrokes.set(strokeId, pending);
    }

    const key = tileKey(worldTileX, worldTileY);
    const existingChangeIndex = pending.changeIndexesByTileKey.get(key);
    if (existingChangeIndex !== undefined) {
      pending.changes[existingChangeIndex]!.tileId = tileId;
      return;
    }

    pending.changeIndexesByTileKey.set(key, pending.changes.length);
    pending.changes.push({
      worldTileX,
      worldTileY,
      previousTileId,
      tileId
    });
  }

  completeStroke(strokeId: number): boolean {
    const pending = this.pendingStrokes.get(strokeId);
    if (!pending) return false;

    this.pendingStrokes.delete(strokeId);
    if (pending.changes.length === 0) return false;

    this.undoStack.push(pending.changes);
    this.redoStack = [];

    if (this.undoStack.length > this.maxUndoStrokes) {
      this.undoStack.splice(0, this.undoStack.length - this.maxUndoStrokes);
    }

    return true;
  }

  undo(applyTile: (worldTileX: number, worldTileY: number, tileId: number) => void): boolean {
    const stroke = this.undoStack.pop();
    if (!stroke) return false;

    for (let index = stroke.length - 1; index >= 0; index -= 1) {
      const change = stroke[index]!;
      applyTile(change.worldTileX, change.worldTileY, change.previousTileId);
    }

    this.redoStack.push(stroke);
    return true;
  }

  redo(applyTile: (worldTileX: number, worldTileY: number, tileId: number) => void): boolean {
    const stroke = this.redoStack.pop();
    if (!stroke) return false;

    for (const change of stroke) {
      applyTile(change.worldTileX, change.worldTileY, change.tileId);
    }

    this.undoStack.push(stroke);
    return true;
  }

  getStatus(): DebugTileEditHistoryStatus {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoStrokeCount: this.undoStack.length,
      redoStrokeCount: this.redoStack.length
    };
  }
}
