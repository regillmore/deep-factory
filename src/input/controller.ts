import { Camera2D } from '../core/camera2d';
import {
  resolveTouchDebugHistoryShortcutActionForTap,
  type DebugTouchHistoryShortcutAction
} from './debugTouchHistoryShortcuts';
import { resolveTouchDebugEyedropperShortcutActionForLongPress } from './debugTouchEyedropperShortcuts';
import { clientToWorldPoint, pickScreenWorldTileFromCanvas } from './picking';

const DEBUG_TILE_PLACE_MOUSE_BUTTON = 0;
const DEBUG_TILE_BREAK_MOUSE_BUTTON = 2;

export interface PointerInspectSnapshot {
  client: { x: number; y: number };
  canvas: { x: number; y: number };
  world: { x: number; y: number };
  tile: { x: number; y: number };
  pointerType: string;
}

export type DebugTileEditKind = 'place' | 'break';
export type TouchDebugEditMode = 'pan' | DebugTileEditKind;

export interface DebugTileEditRequest {
  worldTileX: number;
  worldTileY: number;
  kind: DebugTileEditKind;
}

export interface DebugBrushEyedropperRequest {
  worldTileX: number;
  worldTileY: number;
  pointerType: 'touch';
}

export interface DebugTileStrokeEditRequest extends DebugTileEditRequest {
  strokeId: number;
}

export interface DebugFloodFillRequest extends DebugTileEditRequest {
  strokeId: number;
  pointerType: 'mouse' | 'touch';
}

export interface DebugLineRequest {
  startTileX: number;
  startTileY: number;
  endTileX: number;
  endTileY: number;
  kind: DebugTileEditKind;
  strokeId: number;
  pointerType: 'mouse' | 'touch';
}

export interface DebugRectFillRequest {
  startTileX: number;
  startTileY: number;
  endTileX: number;
  endTileY: number;
  kind: DebugTileEditKind;
  strokeId: number;
  pointerType: 'mouse' | 'touch';
}

export interface CompletedDebugTileEditStroke {
  strokeId: number;
  kind: DebugTileEditKind;
  pointerType: 'mouse' | 'touch';
}

export type DebugEditHistoryShortcutAction = DebugTouchHistoryShortcutAction;

interface ActiveDebugPaintStroke {
  id: number;
  pointerId: number;
  pointerType: 'mouse' | 'touch';
  kind: DebugTileEditKind;
  paintedTileKeys: Set<string>;
  lastPaintedTile: { x: number; y: number } | null;
}

interface ActiveMouseDebugLineDrag {
  pointerId: number;
  kind: DebugTileEditKind;
  startTileX: number;
  startTileY: number;
}

interface PendingTouchDebugLineStart {
  kind: DebugTileEditKind;
  tileX: number;
  tileY: number;
}

interface ActiveMouseDebugRectDrag {
  pointerId: number;
  kind: DebugTileEditKind;
  startTileX: number;
  startTileY: number;
}

interface PendingTouchDebugRectStart {
  kind: DebugTileEditKind;
  tileX: number;
  tileY: number;
}

export interface ArmedDebugToolPreviewState {
  armedFloodFillKind: DebugTileEditKind | null;
  armedLineKind: DebugTileEditKind | null;
  armedRectKind: DebugTileEditKind | null;
  activeMouseLineDrag: {
    kind: DebugTileEditKind;
    startTileX: number;
    startTileY: number;
  } | null;
  pendingTouchLineStart: {
    kind: DebugTileEditKind;
    tileX: number;
    tileY: number;
  } | null;
  activeMouseRectDrag: {
    kind: DebugTileEditKind;
    startTileX: number;
    startTileY: number;
  } | null;
  pendingTouchRectStart: {
    kind: DebugTileEditKind;
    tileX: number;
    tileY: number;
  } | null;
}

interface ActiveTouchHistoryTapGestureCandidate {
  pointerCount: 2 | 3;
  startedAtMs: number;
  pointerIds: Set<number>;
  startPositionsByPointerId: Map<number, { x: number; y: number }>;
  initialPinchDistancePx: number | null;
  maxPointerTravelPx: number;
  maxPinchDistanceDeltaPx: number;
}

interface ActiveTouchEyedropperLongPressCandidate {
  pointerId: number;
  startedAtMs: number;
  startClientX: number;
  startClientY: number;
  maxPointerTravelPx: number;
}

export const buildDebugTileEditRequest = (
  pointerInspect: PointerInspectSnapshot | null,
  kind: DebugTileEditKind
): DebugTileEditRequest | null => {
  if (!pointerInspect || pointerInspect.pointerType !== 'mouse') return null;
  return {
    worldTileX: pointerInspect.tile.x,
    worldTileY: pointerInspect.tile.y,
    kind
  };
};

export const getDesktopDebugPaintKindForPointerDown = (
  pointerType: string,
  button: number,
  shiftKey: boolean
): DebugTileEditKind | null => {
  if (pointerType !== 'mouse' || shiftKey) return null;
  if (button === DEBUG_TILE_PLACE_MOUSE_BUTTON) return 'place';
  if (button === DEBUG_TILE_BREAK_MOUSE_BUTTON) return 'break';
  return null;
};

export const getTouchDebugPaintKindForPointerDown = (
  pointerType: string,
  touchDebugEditMode: TouchDebugEditMode
): DebugTileEditKind | null => {
  if (pointerType !== 'touch' || touchDebugEditMode === 'pan') return null;
  return touchDebugEditMode;
};

export const markDebugPaintTileSeen = (
  worldTileX: number,
  worldTileY: number,
  seenTiles: Set<string>
): boolean => {
  const key = `${worldTileX},${worldTileY}`;
  if (seenTiles.has(key)) return false;
  seenTiles.add(key);
  return true;
};

export const walkLineSteppedTilePath = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number,
  visit: (tileX: number, tileY: number) => void
): void => {
  let x = startTileX;
  let y = startTileY;
  const dx = Math.abs(endTileX - x);
  const dy = -Math.abs(endTileY - y);
  const stepX = x < endTileX ? 1 : -1;
  const stepY = y < endTileY ? 1 : -1;
  let error = dx + dy;

  while (true) {
    visit(x, y);
    if (x === endTileX && y === endTileY) return;

    const doubledError = error * 2;
    if (doubledError >= dy) {
      error += dy;
      x += stepX;
    }
    if (doubledError <= dx) {
      error += dx;
      y += stepY;
    }
  }
};

export const walkFilledRectangleTileArea = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number,
  visit: (tileX: number, tileY: number) => void
): void => {
  const minTileX = Math.min(startTileX, endTileX);
  const maxTileX = Math.max(startTileX, endTileX);
  const minTileY = Math.min(startTileY, endTileY);
  const maxTileY = Math.max(startTileY, endTileY);
  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      visit(tileX, tileY);
    }
  }
};

export class InputController {
  private keys = new Set<string>();
  private pointerActive = false;
  private pointerId: number | null = null;
  private lastX = 0;
  private lastY = 0;
  private pinchDistance = 0;
  private pointers = new Map<number, PointerEvent>();
  private pointerInspect: PointerInspectSnapshot | null = null;
  private debugTileEditQueue: DebugTileStrokeEditRequest[] = [];
  private debugFloodFillQueue: DebugFloodFillRequest[] = [];
  private debugLineQueue: DebugLineRequest[] = [];
  private debugRectFillQueue: DebugRectFillRequest[] = [];
  private debugBrushEyedropperQueue: DebugBrushEyedropperRequest[] = [];
  private completedDebugTileStrokeQueue: CompletedDebugTileEditStroke[] = [];
  private debugEditHistoryShortcutQueue: DebugEditHistoryShortcutAction[] = [];
  private activeMouseDebugPaintStroke: ActiveDebugPaintStroke | null = null;
  private activeTouchDebugPaintStroke: ActiveDebugPaintStroke | null = null;
  private activeMouseDebugLineDrag: ActiveMouseDebugLineDrag | null = null;
  private pendingTouchDebugLineStart: PendingTouchDebugLineStart | null = null;
  private activeMouseDebugRectDrag: ActiveMouseDebugRectDrag | null = null;
  private pendingTouchDebugRectStart: PendingTouchDebugRectStart | null = null;
  private activeTouchHistoryTapGestureCandidate: ActiveTouchHistoryTapGestureCandidate | null = null;
  private activeTouchEyedropperLongPressCandidate: ActiveTouchEyedropperLongPressCandidate | null = null;
  private lastTouchHistoryTapGestureTimeMs = Number.NEGATIVE_INFINITY;
  private touchDebugEditMode: TouchDebugEditMode = 'pan';
  private armedDebugFloodFillKind: DebugTileEditKind | null = null;
  private armedDebugLineKind: DebugTileEditKind | null = null;
  private armedDebugRectKind: DebugTileEditKind | null = null;
  private nextDebugPaintStrokeId = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: Camera2D
  ) {
    this.bind();
  }

  update(dtSeconds: number): void {
    this.maybeQueueTouchEyedropperLongPressShortcut(performance.now());

    const speed = 450 * dtSeconds / this.camera.zoom;
    if (this.keys.has('w') || this.keys.has('arrowup')) this.camera.pan(0, -speed);
    if (this.keys.has('s') || this.keys.has('arrowdown')) this.camera.pan(0, speed);
    if (this.keys.has('a') || this.keys.has('arrowleft')) this.camera.pan(-speed, 0);
    if (this.keys.has('d') || this.keys.has('arrowright')) this.camera.pan(speed, 0);
  }

  getPointerInspect(): PointerInspectSnapshot | null {
    if (this.pointerInspect) {
      this.updatePointerInspect(
        this.pointerInspect.client.x,
        this.pointerInspect.client.y,
        this.pointerInspect.pointerType
      );
    }
    return this.pointerInspect;
  }

  consumeDebugTileEdits(): DebugTileStrokeEditRequest[] {
    if (this.debugTileEditQueue.length === 0) return [];
    const edits = this.debugTileEditQueue;
    this.debugTileEditQueue = [];
    return edits;
  }

  consumeDebugFloodFillRequests(): DebugFloodFillRequest[] {
    if (this.debugFloodFillQueue.length === 0) return [];
    const requests = this.debugFloodFillQueue;
    this.debugFloodFillQueue = [];
    return requests;
  }

  consumeDebugLineRequests(): DebugLineRequest[] {
    if (this.debugLineQueue.length === 0) return [];
    const requests = this.debugLineQueue;
    this.debugLineQueue = [];
    return requests;
  }

  consumeDebugRectFillRequests(): DebugRectFillRequest[] {
    if (this.debugRectFillQueue.length === 0) return [];
    const requests = this.debugRectFillQueue;
    this.debugRectFillQueue = [];
    return requests;
  }

  consumeDebugBrushEyedropperRequests(): DebugBrushEyedropperRequest[] {
    if (this.debugBrushEyedropperQueue.length === 0) return [];
    const requests = this.debugBrushEyedropperQueue;
    this.debugBrushEyedropperQueue = [];
    return requests;
  }

  consumeCompletedDebugTileStrokes(): CompletedDebugTileEditStroke[] {
    if (this.completedDebugTileStrokeQueue.length === 0) return [];
    const completedStrokes = this.completedDebugTileStrokeQueue;
    this.completedDebugTileStrokeQueue = [];
    return completedStrokes;
  }

  consumeDebugEditHistoryShortcutActions(): DebugEditHistoryShortcutAction[] {
    if (this.debugEditHistoryShortcutQueue.length === 0) return [];
    const actions = this.debugEditHistoryShortcutQueue;
    this.debugEditHistoryShortcutQueue = [];
    return actions;
  }

  getTouchDebugEditMode(): TouchDebugEditMode {
    return this.touchDebugEditMode;
  }

  setTouchDebugEditMode(mode: TouchDebugEditMode): void {
    if (this.touchDebugEditMode === mode) return;
    this.touchDebugEditMode = mode;
    this.activeTouchHistoryTapGestureCandidate = null;
    this.activeTouchEyedropperLongPressCandidate = null;
    this.pendingTouchDebugLineStart = null;
    this.pendingTouchDebugRectStart = null;
    this.completeDebugPaintStroke(this.activeTouchDebugPaintStroke);
    this.activeTouchDebugPaintStroke = null;
  }

  getArmedDebugFloodFillKind(): DebugTileEditKind | null {
    return this.armedDebugFloodFillKind;
  }

  setArmedDebugFloodFillKind(kind: DebugTileEditKind | null): void {
    this.armedDebugFloodFillKind = kind;
  }

  getArmedDebugLineKind(): DebugTileEditKind | null {
    return this.armedDebugLineKind;
  }

  setArmedDebugLineKind(kind: DebugTileEditKind | null): void {
    if (this.armedDebugLineKind === kind && (kind !== null || this.pendingTouchDebugLineStart === null)) {
      return;
    }
    this.armedDebugLineKind = kind;
    if (kind === null || this.pendingTouchDebugLineStart?.kind !== kind) {
      this.pendingTouchDebugLineStart = null;
    }
    if (kind === null) {
      this.activeMouseDebugLineDrag = null;
    }
  }

  getArmedDebugRectKind(): DebugTileEditKind | null {
    return this.armedDebugRectKind;
  }

  setArmedDebugRectKind(kind: DebugTileEditKind | null): void {
    if (this.armedDebugRectKind === kind && (kind !== null || this.pendingTouchDebugRectStart === null)) {
      return;
    }
    this.armedDebugRectKind = kind;
    if (kind === null || this.pendingTouchDebugRectStart?.kind !== kind) {
      this.pendingTouchDebugRectStart = null;
    }
    if (kind === null) {
      this.activeMouseDebugRectDrag = null;
    }
  }

  cancelArmedDebugTools(): boolean {
    const hadArmedTools =
      this.armedDebugFloodFillKind !== null ||
      this.armedDebugLineKind !== null ||
      this.armedDebugRectKind !== null ||
      this.activeMouseDebugLineDrag !== null ||
      this.pendingTouchDebugLineStart !== null ||
      this.activeMouseDebugRectDrag !== null ||
      this.pendingTouchDebugRectStart !== null;
    if (!hadArmedTools) return false;

    this.armedDebugFloodFillKind = null;
    this.armedDebugLineKind = null;
    this.armedDebugRectKind = null;
    this.activeMouseDebugLineDrag = null;
    this.pendingTouchDebugLineStart = null;
    this.activeMouseDebugRectDrag = null;
    this.pendingTouchDebugRectStart = null;
    return true;
  }

  getArmedDebugToolPreviewState(): ArmedDebugToolPreviewState {
    const activeMouseLineDrag = this.activeMouseDebugLineDrag;
    const pendingTouchLineStart = this.pendingTouchDebugLineStart;
    const activeMouseRectDrag = this.activeMouseDebugRectDrag;
    const pendingTouchRectStart = this.pendingTouchDebugRectStart;
    return {
      armedFloodFillKind: this.armedDebugFloodFillKind,
      armedLineKind: this.armedDebugLineKind,
      armedRectKind: this.armedDebugRectKind,
      activeMouseLineDrag: activeMouseLineDrag
        ? {
            kind: activeMouseLineDrag.kind,
            startTileX: activeMouseLineDrag.startTileX,
            startTileY: activeMouseLineDrag.startTileY
          }
        : null,
      pendingTouchLineStart: pendingTouchLineStart
        ? {
            kind: pendingTouchLineStart.kind,
            tileX: pendingTouchLineStart.tileX,
            tileY: pendingTouchLineStart.tileY
          }
        : null,
      activeMouseRectDrag: activeMouseRectDrag
        ? {
            kind: activeMouseRectDrag.kind,
            startTileX: activeMouseRectDrag.startTileX,
            startTileY: activeMouseRectDrag.startTileY
          }
        : null,
      pendingTouchRectStart: pendingTouchRectStart
        ? {
            kind: pendingTouchRectStart.kind,
            tileX: pendingTouchRectStart.tileX,
            tileY: pendingTouchRectStart.tileY
          }
        : null
    };
  }

  private bind(): void {
    window.addEventListener('keydown', (event) => this.keys.add(event.key.toLowerCase()));
    window.addEventListener('keyup', (event) => this.keys.delete(event.key.toLowerCase()));

    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      this.zoomAtScreenPoint(factor, event.clientX, event.clientY);
      this.updatePointerInspect(event.clientX, event.clientY, 'mouse');
    });

    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    this.canvas.addEventListener('pointerdown', (event) => {
      this.canvas.setPointerCapture(event.pointerId);
      this.pointers.set(event.pointerId, event);
      this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
      const queuedArmedDebugFloodFill = this.tryQueueArmedDebugFloodFill(event);
      const handledArmedDebugLine = queuedArmedDebugFloodFill ? false : this.tryHandleArmedDebugLinePointerDown(event);
      const handledArmedDebugRect =
        queuedArmedDebugFloodFill || handledArmedDebugLine
          ? false
          : this.tryHandleArmedDebugRectPointerDown(event);
      if (queuedArmedDebugFloodFill || handledArmedDebugLine || handledArmedDebugRect) {
        this.activeTouchHistoryTapGestureCandidate = null;
        this.activeTouchEyedropperLongPressCandidate = null;
      } else {
        this.refreshTouchHistoryTapGestureCandidateOnPointerDown(event);
        this.refreshTouchEyedropperLongPressCandidateOnPointerDown(event);
      }
      const startedMouseDebugPaint = queuedArmedDebugFloodFill || handledArmedDebugLine || handledArmedDebugRect
        ? false
        : this.tryStartMouseDebugPaintStroke(event);
      const startedTouchDebugPaint = queuedArmedDebugFloodFill || handledArmedDebugLine || handledArmedDebugRect
        ? false
        : this.tryStartTouchDebugPaintStroke(event);
      if (this.pointers.size === 1) {
        if (
          queuedArmedDebugFloodFill ||
          handledArmedDebugLine ||
          handledArmedDebugRect ||
          startedMouseDebugPaint ||
          startedTouchDebugPaint
        ) {
          this.pointerActive = false;
          this.pointerId = null;
        } else {
          this.pointerActive = true;
          this.pointerId = event.pointerId;
          this.lastX = event.clientX;
          this.lastY = event.clientY;
        }
      } else if (this.pointers.size === 2) {
        this.pinchDistance = this.currentPinchDistance();
      }
    });

    this.canvas.addEventListener('pointermove', (event) => {
      const isTrackedPointer = this.pointers.has(event.pointerId);
      if (!isTrackedPointer) {
        this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
        return;
      }

      this.pointers.set(event.pointerId, event);
      this.updateTouchHistoryTapGestureCandidateMetrics(event);
      this.updateTouchEyedropperLongPressCandidateMetrics(event);

      const activeMouseDebugPaintStroke = this.activeMouseDebugPaintStroke;
      const activeTouchDebugPaintStroke = this.activeTouchDebugPaintStroke;
      const activeMouseDebugLineDrag = this.activeMouseDebugLineDrag;
      const activeMouseDebugRectDrag = this.activeMouseDebugRectDrag;
      if (
        this.pointers.size === 1 &&
        activeMouseDebugPaintStroke &&
        activeMouseDebugPaintStroke.pointerId === event.pointerId
      ) {
        this.queuePointerDebugTileStrokeEdits(event, activeMouseDebugPaintStroke);
      } else if (
        this.pointers.size === 1 &&
        activeTouchDebugPaintStroke &&
        activeTouchDebugPaintStroke.pointerId === event.pointerId
      ) {
        this.queuePointerDebugTileStrokeEdits(event, activeTouchDebugPaintStroke);
      } else if (
        this.pointers.size === 1 &&
        activeMouseDebugLineDrag &&
        activeMouseDebugLineDrag.pointerId === event.pointerId
      ) {
        // Reserved for one-shot line drag endpoint capture on pointerup.
      } else if (
        this.pointers.size === 1 &&
        activeMouseDebugRectDrag &&
        activeMouseDebugRectDrag.pointerId === event.pointerId
      ) {
        // Reserved for one-shot rectangle drag endpoint capture on pointerup.
      } else if (this.pointers.size === 1 && this.pointerActive && this.pointerId === event.pointerId) {
        const dx = event.clientX - this.lastX;
        const dy = event.clientY - this.lastY;
        const worldDelta = this.camera.screenDeltaToWorld(dx, dy);
        this.camera.pan(-worldDelta.x, -worldDelta.y);
        this.lastX = event.clientX;
        this.lastY = event.clientY;
      }

      if (this.pointers.size === 2) {
        const distance = this.currentPinchDistance();
        if (this.pinchDistance > 0 && distance > 0) {
          this.zoomAtScreenPoint(distance / this.pinchDistance, event.clientX, event.clientY);
        }
        this.pinchDistance = distance;
      }

      this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
    });

    const release = (event: PointerEvent, canceled = false): void => {
      if (this.pointers.has(event.pointerId)) {
        this.pointers.set(event.pointerId, event);
      }
      this.updateTouchHistoryTapGestureCandidateMetrics(event);
      this.updateTouchEyedropperLongPressCandidateMetrics(event);
      if (this.activeMouseDebugLineDrag?.pointerId === event.pointerId) {
        if (!canceled) {
          this.commitMouseDebugLineDrag(event, this.activeMouseDebugLineDrag);
        }
        this.activeMouseDebugLineDrag = null;
      }
      if (this.activeMouseDebugRectDrag?.pointerId === event.pointerId) {
        if (!canceled) {
          this.commitMouseDebugRectDrag(event, this.activeMouseDebugRectDrag);
        }
        this.activeMouseDebugRectDrag = null;
      }
      this.pointers.delete(event.pointerId);
      this.clearTouchEyedropperLongPressCandidateForPointer(event.pointerId);
      if (this.activeMouseDebugPaintStroke?.pointerId === event.pointerId) {
        this.completeDebugPaintStroke(this.activeMouseDebugPaintStroke);
        this.activeMouseDebugPaintStroke = null;
      }
      if (this.activeTouchDebugPaintStroke?.pointerId === event.pointerId) {
        this.completeDebugPaintStroke(this.activeTouchDebugPaintStroke);
        this.activeTouchDebugPaintStroke = null;
      }
      if (this.pointerId === event.pointerId) {
        this.pointerActive = false;
        this.pointerId = null;
      }
      if (this.pointers.size < 2) {
        this.pinchDistance = 0;
      }
      if (this.pointers.size === 0 && event.pointerType !== 'mouse') {
        this.pointerInspect = null;
      }

      this.maybeQueueTouchHistoryTapGestureShortcutOnPointerRelease(event, canceled);
    };

    this.canvas.addEventListener('pointerup', (event) => release(event, false));
    this.canvas.addEventListener('pointercancel', (event) => release(event, true));
    this.canvas.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse' && this.pointers.size === 0) {
        this.completeDebugPaintStroke(this.activeMouseDebugPaintStroke);
        this.activeMouseDebugPaintStroke = null;
        this.activeMouseDebugLineDrag = null;
        this.activeMouseDebugRectDrag = null;
        this.pointerInspect = null;
      } else if (event.pointerType === 'touch' && this.pointers.size === 0) {
        this.completeDebugPaintStroke(this.activeTouchDebugPaintStroke);
        this.activeTouchDebugPaintStroke = null;
      }
    });
    this.canvas.style.touchAction = 'none';
  }

  private tryStartMouseDebugPaintStroke(event: PointerEvent): boolean {
    const kind = getDesktopDebugPaintKindForPointerDown(event.pointerType, event.button, event.shiftKey);
    if (!kind || this.pointers.size !== 1) return false;

    const stroke: ActiveDebugPaintStroke = {
      id: this.nextDebugPaintStrokeId++,
      pointerId: event.pointerId,
      pointerType: 'mouse',
      kind,
      paintedTileKeys: new Set<string>(),
      lastPaintedTile: null
    };
    this.activeMouseDebugPaintStroke = stroke;
    this.queuePointerDebugTileStrokeEdits(event, stroke);
    return true;
  }

  private tryStartTouchDebugPaintStroke(event: PointerEvent): boolean {
    const kind = getTouchDebugPaintKindForPointerDown(event.pointerType, this.touchDebugEditMode);
    if (!kind || this.pointers.size !== 1) return false;

    const stroke: ActiveDebugPaintStroke = {
      id: this.nextDebugPaintStrokeId++,
      pointerId: event.pointerId,
      pointerType: 'touch',
      kind,
      paintedTileKeys: new Set<string>(),
      lastPaintedTile: null
    };
    this.activeTouchDebugPaintStroke = stroke;
    this.queuePointerDebugTileStrokeEdits(event, stroke);
    return true;
  }

  private refreshTouchHistoryTapGestureCandidateOnPointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;

    const touchPointers = this.getTrackedTouchPointers();
    if (touchPointers.length > 3) {
      this.activeTouchHistoryTapGestureCandidate = null;
      return;
    }

    if (this.touchDebugEditMode !== 'pan') {
      this.activeTouchHistoryTapGestureCandidate = null;
      return;
    }

    if (touchPointers.length !== 2 && touchPointers.length !== 3) return;

    const pointerCount = touchPointers.length;
    const pointerIds = new Set<number>();
    const startPositionsByPointerId = new Map<number, { x: number; y: number }>();
    for (const touchPointer of touchPointers) {
      pointerIds.add(touchPointer.pointerId);
      startPositionsByPointerId.set(touchPointer.pointerId, {
        x: touchPointer.clientX,
        y: touchPointer.clientY
      });
    }

    let initialPinchDistancePx: number | null = null;
    if (pointerCount === 2) {
      const [a, b] = touchPointers;
      if (a && b) {
        initialPinchDistancePx = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      }
    }

    this.activeTouchHistoryTapGestureCandidate = {
      pointerCount,
      startedAtMs: event.timeStamp,
      pointerIds,
      startPositionsByPointerId,
      initialPinchDistancePx,
      maxPointerTravelPx: 0,
      maxPinchDistanceDeltaPx: 0
    };
  }

  private updateTouchHistoryTapGestureCandidateMetrics(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;
    const candidate = this.activeTouchHistoryTapGestureCandidate;
    if (!candidate || !candidate.pointerIds.has(event.pointerId)) return;

    const startPosition = candidate.startPositionsByPointerId.get(event.pointerId);
    if (startPosition) {
      const pointerTravelPx = Math.hypot(event.clientX - startPosition.x, event.clientY - startPosition.y);
      if (pointerTravelPx > candidate.maxPointerTravelPx) {
        candidate.maxPointerTravelPx = pointerTravelPx;
      }
    }

    if (candidate.pointerCount !== 2 || candidate.initialPinchDistancePx === null) return;

    const [firstPointerId, secondPointerId] = Array.from(candidate.pointerIds.values());
    if (firstPointerId === undefined || secondPointerId === undefined) return;

    const firstPointer =
      firstPointerId === event.pointerId ? event : (this.pointers.get(firstPointerId) ?? null);
    const secondPointer =
      secondPointerId === event.pointerId ? event : (this.pointers.get(secondPointerId) ?? null);
    if (!firstPointer || !secondPointer) return;

    const pinchDistancePx = Math.hypot(
      firstPointer.clientX - secondPointer.clientX,
      firstPointer.clientY - secondPointer.clientY
    );
    const pinchDistanceDeltaPx = Math.abs(pinchDistancePx - candidate.initialPinchDistancePx);
    if (pinchDistanceDeltaPx > candidate.maxPinchDistanceDeltaPx) {
      candidate.maxPinchDistanceDeltaPx = pinchDistanceDeltaPx;
    }
  }

  private refreshTouchEyedropperLongPressCandidateOnPointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;

    if (this.touchDebugEditMode !== 'pan' || this.pointers.size !== 1) {
      this.activeTouchEyedropperLongPressCandidate = null;
      return;
    }

    this.activeTouchEyedropperLongPressCandidate = {
      pointerId: event.pointerId,
      startedAtMs: performance.now(),
      startClientX: event.clientX,
      startClientY: event.clientY,
      maxPointerTravelPx: 0
    };
  }

  private updateTouchEyedropperLongPressCandidateMetrics(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;

    const candidate = this.activeTouchEyedropperLongPressCandidate;
    if (!candidate || candidate.pointerId !== event.pointerId) return;

    if (this.touchDebugEditMode !== 'pan' || this.pointers.size !== 1) {
      this.activeTouchEyedropperLongPressCandidate = null;
      return;
    }

    const pointerTravelPx = Math.hypot(
      event.clientX - candidate.startClientX,
      event.clientY - candidate.startClientY
    );
    if (pointerTravelPx > candidate.maxPointerTravelPx) {
      candidate.maxPointerTravelPx = pointerTravelPx;
    }
  }

  private clearTouchEyedropperLongPressCandidateForPointer(pointerId: number): void {
    if (this.activeTouchEyedropperLongPressCandidate?.pointerId !== pointerId) return;
    this.activeTouchEyedropperLongPressCandidate = null;
  }

  private maybeQueueTouchEyedropperLongPressShortcut(nowMs: number): void {
    const candidate = this.activeTouchEyedropperLongPressCandidate;
    if (!candidate) return;

    const action = resolveTouchDebugEyedropperShortcutActionForLongPress({
      durationMs: Math.max(0, nowMs - candidate.startedAtMs),
      maxPointerTravelPx: candidate.maxPointerTravelPx,
      gesturesEnabled: this.touchDebugEditMode === 'pan' && this.pointers.size === 1
    });
    if (action !== 'pick-brush') return;

    const pointer = this.pointers.get(candidate.pointerId);
    if (!pointer || pointer.pointerType !== 'touch') {
      this.activeTouchEyedropperLongPressCandidate = null;
      return;
    }

    this.updatePointerInspect(pointer.clientX, pointer.clientY, pointer.pointerType);
    const pointerInspect = this.pointerInspect;
    if (pointerInspect?.pointerType === 'touch') {
      this.queueDebugBrushEyedropperRequest(pointerInspect.tile.x, pointerInspect.tile.y, 'touch');
    }

    if (this.pointerId === candidate.pointerId) {
      this.pointerActive = false;
      this.pointerId = null;
    }

    this.activeTouchEyedropperLongPressCandidate = null;
  }

  private maybeQueueTouchHistoryTapGestureShortcutOnPointerRelease(
    event: PointerEvent,
    canceled: boolean
  ): void {
    if (event.pointerType !== 'touch') return;

    const candidate = this.activeTouchHistoryTapGestureCandidate;
    if (!candidate || !candidate.pointerIds.has(event.pointerId)) return;

    if (canceled) {
      this.activeTouchHistoryTapGestureCandidate = null;
      return;
    }

    candidate.pointerIds.delete(event.pointerId);
    if (candidate.pointerIds.size > 0) return;

    this.activeTouchHistoryTapGestureCandidate = null;
    const action = resolveTouchDebugHistoryShortcutActionForTap({
      pointerCount: candidate.pointerCount,
      durationMs: Math.max(0, event.timeStamp - candidate.startedAtMs),
      maxPointerTravelPx: candidate.maxPointerTravelPx,
      maxPinchDistanceDeltaPx: candidate.maxPinchDistanceDeltaPx,
      timeSinceLastGestureMs: event.timeStamp - this.lastTouchHistoryTapGestureTimeMs,
      gesturesEnabled: this.touchDebugEditMode === 'pan'
    });
    if (!action) return;

    this.lastTouchHistoryTapGestureTimeMs = event.timeStamp;
    this.debugEditHistoryShortcutQueue.push(action);
  }

  private getTrackedTouchPointers(): PointerEvent[] {
    const touchPointers: PointerEvent[] = [];
    for (const pointer of this.pointers.values()) {
      if (pointer.pointerType === 'touch') {
        touchPointers.push(pointer);
      }
    }
    return touchPointers;
  }

  private currentPinchDistance(): number {
    const [a, b] = Array.from(this.pointers.values());
    if (!a || !b) return 0;
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  private zoomAtScreenPoint(factor: number, clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const world = clientToWorldPoint(clientX, clientY, this.canvas, rect, this.camera);
    this.camera.zoomAt(factor, world.x, world.y);
  }

  private updatePointerInspect(clientX: number, clientY: number, pointerType: string): void {
    const pick = pickScreenWorldTileFromCanvas(clientX, clientY, this.canvas, this.camera);
    this.pointerInspect = {
      client: { x: clientX, y: clientY },
      canvas: pick.canvas,
      world: pick.world,
      tile: pick.tile,
      pointerType
    };
  }

  private queuePointerDebugTileStrokeEdits(
    event: PointerEvent,
    stroke: ActiveDebugPaintStroke
  ): void {
    this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
    const pointerInspect = this.pointerInspect;
    if (!pointerInspect) return;

    const currentTileX = pointerInspect.tile.x;
    const currentTileY = pointerInspect.tile.y;
    const lastPaintedTile = stroke.lastPaintedTile;

    if (lastPaintedTile) {
      walkLineSteppedTilePath(
        lastPaintedTile.x,
        lastPaintedTile.y,
        currentTileX,
        currentTileY,
        (tileX, tileY) => {
          this.queueDebugTileEdit(tileX, tileY, stroke.kind, stroke.id, stroke.paintedTileKeys);
        }
      );
    } else {
      this.queueDebugTileEdit(currentTileX, currentTileY, stroke.kind, stroke.id, stroke.paintedTileKeys);
    }

    stroke.lastPaintedTile = { x: currentTileX, y: currentTileY };
  }

  private queueDebugTileEdit(
    worldTileX: number,
    worldTileY: number,
    kind: DebugTileEditKind,
    strokeId: number,
    seenTiles?: Set<string>
  ): void {
    if (seenTiles && !markDebugPaintTileSeen(worldTileX, worldTileY, seenTiles)) return;
    this.debugTileEditQueue.push({
      worldTileX,
      worldTileY,
      kind,
      strokeId
    });
  }

  private queueDebugBrushEyedropperRequest(
    worldTileX: number,
    worldTileY: number,
    pointerType: 'touch'
  ): void {
    this.debugBrushEyedropperQueue.push({
      worldTileX,
      worldTileY,
      pointerType
    });
  }

  private tryHandleArmedDebugLinePointerDown(event: PointerEvent): boolean {
    const kind = this.armedDebugLineKind;
    if (!kind || this.pointers.size !== 1) return false;
    if (event.pointerType !== 'mouse' && event.pointerType !== 'touch') return false;

    this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
    const pointerInspect = this.pointerInspect;
    if (!pointerInspect) return false;

    if (pointerInspect.pointerType === 'mouse') {
      if (event.button !== DEBUG_TILE_PLACE_MOUSE_BUTTON && event.button !== DEBUG_TILE_BREAK_MOUSE_BUTTON) {
        return false;
      }
      this.activeMouseDebugLineDrag = {
        pointerId: event.pointerId,
        kind,
        startTileX: pointerInspect.tile.x,
        startTileY: pointerInspect.tile.y
      };
      return true;
    }

    const pendingStart = this.pendingTouchDebugLineStart;
    if (!pendingStart || pendingStart.kind !== kind) {
      this.pendingTouchDebugLineStart = {
        kind,
        tileX: pointerInspect.tile.x,
        tileY: pointerInspect.tile.y
      };
      return true;
    }

    this.queueDebugLineRequest(
      pendingStart.tileX,
      pendingStart.tileY,
      pointerInspect.tile.x,
      pointerInspect.tile.y,
      kind,
      'touch'
    );
    this.pendingTouchDebugLineStart = null;
    this.armedDebugLineKind = null;
    return true;
  }

  private tryHandleArmedDebugRectPointerDown(event: PointerEvent): boolean {
    const kind = this.armedDebugRectKind;
    if (!kind || this.pointers.size !== 1) return false;
    if (event.pointerType !== 'mouse' && event.pointerType !== 'touch') return false;

    this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
    const pointerInspect = this.pointerInspect;
    if (!pointerInspect) return false;

    if (pointerInspect.pointerType === 'mouse') {
      if (event.button !== DEBUG_TILE_PLACE_MOUSE_BUTTON && event.button !== DEBUG_TILE_BREAK_MOUSE_BUTTON) {
        return false;
      }
      this.activeMouseDebugRectDrag = {
        pointerId: event.pointerId,
        kind,
        startTileX: pointerInspect.tile.x,
        startTileY: pointerInspect.tile.y
      };
      return true;
    }

    const pendingStart = this.pendingTouchDebugRectStart;
    if (!pendingStart || pendingStart.kind !== kind) {
      this.pendingTouchDebugRectStart = {
        kind,
        tileX: pointerInspect.tile.x,
        tileY: pointerInspect.tile.y
      };
      return true;
    }

    this.queueDebugRectFillRequest(
      pendingStart.tileX,
      pendingStart.tileY,
      pointerInspect.tile.x,
      pointerInspect.tile.y,
      kind,
      'touch'
    );
    this.pendingTouchDebugRectStart = null;
    this.armedDebugRectKind = null;
    return true;
  }

  private tryQueueArmedDebugFloodFill(event: PointerEvent): boolean {
    const kind = this.armedDebugFloodFillKind;
    if (!kind || this.pointers.size !== 1) return false;
    if (event.pointerType !== 'mouse' && event.pointerType !== 'touch') return false;

    this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
    const pointerInspect = this.pointerInspect;
    if (!pointerInspect) return false;

    const strokeId = this.nextDebugPaintStrokeId++;
    this.debugFloodFillQueue.push({
      worldTileX: pointerInspect.tile.x,
      worldTileY: pointerInspect.tile.y,
      kind,
      strokeId,
      pointerType: pointerInspect.pointerType === 'touch' ? 'touch' : 'mouse'
    });
    this.completedDebugTileStrokeQueue.push({
      strokeId,
      kind,
      pointerType: pointerInspect.pointerType === 'touch' ? 'touch' : 'mouse'
    });
    this.armedDebugFloodFillKind = null;
    return true;
  }

  private commitMouseDebugLineDrag(event: PointerEvent, drag: ActiveMouseDebugLineDrag): void {
    this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
    const pointerInspect = this.pointerInspect;
    if (!pointerInspect || pointerInspect.pointerType !== 'mouse') return;

    this.queueDebugLineRequest(
      drag.startTileX,
      drag.startTileY,
      pointerInspect.tile.x,
      pointerInspect.tile.y,
      drag.kind,
      'mouse'
    );
    this.armedDebugLineKind = null;
    this.pendingTouchDebugLineStart = null;
  }

  private commitMouseDebugRectDrag(event: PointerEvent, drag: ActiveMouseDebugRectDrag): void {
    this.updatePointerInspect(event.clientX, event.clientY, event.pointerType);
    const pointerInspect = this.pointerInspect;
    if (!pointerInspect || pointerInspect.pointerType !== 'mouse') return;

    this.queueDebugRectFillRequest(
      drag.startTileX,
      drag.startTileY,
      pointerInspect.tile.x,
      pointerInspect.tile.y,
      drag.kind,
      'mouse'
    );
    this.armedDebugRectKind = null;
    this.pendingTouchDebugRectStart = null;
  }

  private queueDebugLineRequest(
    startTileX: number,
    startTileY: number,
    endTileX: number,
    endTileY: number,
    kind: DebugTileEditKind,
    pointerType: 'mouse' | 'touch'
  ): void {
    const strokeId = this.nextDebugPaintStrokeId++;
    this.debugLineQueue.push({
      startTileX,
      startTileY,
      endTileX,
      endTileY,
      kind,
      strokeId,
      pointerType
    });
    this.completedDebugTileStrokeQueue.push({
      strokeId,
      kind,
      pointerType
    });
  }

  private queueDebugRectFillRequest(
    startTileX: number,
    startTileY: number,
    endTileX: number,
    endTileY: number,
    kind: DebugTileEditKind,
    pointerType: 'mouse' | 'touch'
  ): void {
    const strokeId = this.nextDebugPaintStrokeId++;
    this.debugRectFillQueue.push({
      startTileX,
      startTileY,
      endTileX,
      endTileY,
      kind,
      strokeId,
      pointerType
    });
    this.completedDebugTileStrokeQueue.push({
      strokeId,
      kind,
      pointerType
    });
  }

  private completeDebugPaintStroke(stroke: ActiveDebugPaintStroke | null): void {
    if (!stroke) return;
    this.completedDebugTileStrokeQueue.push({
      strokeId: stroke.id,
      kind: stroke.kind,
      pointerType: stroke.pointerType
    });
  }
}
