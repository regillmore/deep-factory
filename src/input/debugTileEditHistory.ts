export type DebugTileEditLayer = 'tile' | 'wall';

export interface DebugTileStrokeEditChange {
  worldTileX: number;
  worldTileY: number;
  layer: DebugTileEditLayer;
  previousId: number;
  id: number;
}

export interface DebugTileEditHistoryStatus {
  canUndo: boolean;
  canRedo: boolean;
  undoStrokeCount: number;
  redoStrokeCount: number;
}

interface PendingDebugTileStroke {
  changes: DebugTileStrokeEditChange[];
  changeIndexesByTileKey: Map<string, number>;
}

const changeKey = (worldTileX: number, worldTileY: number, layer: DebugTileEditLayer): string =>
  `${layer}:${worldTileX},${worldTileY}`;

export class DebugTileEditHistory {
  private pendingStrokes = new Map<number, PendingDebugTileStroke>();
  private undoStack: DebugTileStrokeEditChange[][] = [];
  private redoStack: DebugTileStrokeEditChange[][] = [];

  constructor(private readonly maxUndoStrokes = 64) {}

  recordAppliedEdit(
    strokeId: number,
    worldTileX: number,
    worldTileY: number,
    previousId: number,
    id: number,
    layer: DebugTileEditLayer = 'tile'
  ): void {
    if (previousId === id) return;

    let pending = this.pendingStrokes.get(strokeId);
    if (!pending) {
      pending = {
        changes: [],
        changeIndexesByTileKey: new Map<string, number>()
      };
      this.pendingStrokes.set(strokeId, pending);
    }

    const key = changeKey(worldTileX, worldTileY, layer);
    const existingChangeIndex = pending.changeIndexesByTileKey.get(key);
    if (existingChangeIndex !== undefined) {
      pending.changes[existingChangeIndex]!.id = id;
      return;
    }

    pending.changeIndexesByTileKey.set(key, pending.changes.length);
    pending.changes.push({
      worldTileX,
      worldTileY,
      layer,
      previousId,
      id
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

  undo(
    applyEdit: (worldTileX: number, worldTileY: number, layer: DebugTileEditLayer, id: number) => void
  ): boolean {
    const stroke = this.undoStack.pop();
    if (!stroke) return false;

    for (let index = stroke.length - 1; index >= 0; index -= 1) {
      const change = stroke[index]!;
      applyEdit(change.worldTileX, change.worldTileY, change.layer, change.previousId);
    }

    this.redoStack.push(stroke);
    return true;
  }

  redo(
    applyEdit: (worldTileX: number, worldTileY: number, layer: DebugTileEditLayer, id: number) => void
  ): boolean {
    const stroke = this.redoStack.pop();
    if (!stroke) return false;

    for (const change of stroke) {
      applyEdit(change.worldTileX, change.worldTileY, change.layer, change.id);
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
