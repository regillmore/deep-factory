import { Camera2D } from '../core/camera2d';
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

export interface DebugTileStrokeEditRequest extends DebugTileEditRequest {
  strokeId: number;
}

export interface CompletedDebugTileEditStroke {
  strokeId: number;
  kind: DebugTileEditKind;
  pointerType: 'mouse' | 'touch';
}

interface ActiveDebugPaintStroke {
  id: number;
  pointerId: number;
  pointerType: 'mouse' | 'touch';
  kind: DebugTileEditKind;
  paintedTileKeys: Set<string>;
  lastPaintedTile: { x: number; y: number } | null;
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
  private completedDebugTileStrokeQueue: CompletedDebugTileEditStroke[] = [];
  private activeMouseDebugPaintStroke: ActiveDebugPaintStroke | null = null;
  private activeTouchDebugPaintStroke: ActiveDebugPaintStroke | null = null;
  private touchDebugEditMode: TouchDebugEditMode = 'pan';
  private nextDebugPaintStrokeId = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: Camera2D
  ) {
    this.bind();
  }

  update(dtSeconds: number): void {
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

  consumeCompletedDebugTileStrokes(): CompletedDebugTileEditStroke[] {
    if (this.completedDebugTileStrokeQueue.length === 0) return [];
    const completedStrokes = this.completedDebugTileStrokeQueue;
    this.completedDebugTileStrokeQueue = [];
    return completedStrokes;
  }

  getTouchDebugEditMode(): TouchDebugEditMode {
    return this.touchDebugEditMode;
  }

  setTouchDebugEditMode(mode: TouchDebugEditMode): void {
    if (this.touchDebugEditMode === mode) return;
    this.touchDebugEditMode = mode;
    this.completeDebugPaintStroke(this.activeTouchDebugPaintStroke);
    this.activeTouchDebugPaintStroke = null;
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
      const startedMouseDebugPaint = this.tryStartMouseDebugPaintStroke(event);
      const startedTouchDebugPaint = this.tryStartTouchDebugPaintStroke(event);
      if (this.pointers.size === 1) {
        if (startedMouseDebugPaint || startedTouchDebugPaint) {
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

      const activeMouseDebugPaintStroke = this.activeMouseDebugPaintStroke;
      const activeTouchDebugPaintStroke = this.activeTouchDebugPaintStroke;
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

    const release = (event: PointerEvent): void => {
      this.pointers.delete(event.pointerId);
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
    };

    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
    this.canvas.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse' && this.pointers.size === 0) {
        this.completeDebugPaintStroke(this.activeMouseDebugPaintStroke);
        this.activeMouseDebugPaintStroke = null;
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

  private completeDebugPaintStroke(stroke: ActiveDebugPaintStroke | null): void {
    if (!stroke) return;
    this.completedDebugTileStrokeQueue.push({
      strokeId: stroke.id,
      kind: stroke.kind,
      pointerType: stroke.pointerType
    });
  }
}
