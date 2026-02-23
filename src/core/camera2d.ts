export class Camera2D {
  x = 0;
  y = 0;
  zoom = 2;

  minZoom = 0.5;
  maxZoom = 6;

  pan(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  zoomAt(factor: number, anchorX: number, anchorY: number): void {
    const nextZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
    const appliedFactor = nextZoom / this.zoom;
    this.x = anchorX - (anchorX - this.x) / appliedFactor;
    this.y = anchorY - (anchorY - this.y) / appliedFactor;
    this.zoom = nextZoom;
  }

  worldToClipMatrix(viewportWidth: number, viewportHeight: number): Float32Array {
    const sx = (2 * this.zoom) / viewportWidth;
    const sy = (-2 * this.zoom) / viewportHeight;
    return new Float32Array([
      sx,
      0,
      0,
      0,
      0,
      sy,
      0,
      0,
      0,
      0,
      1,
      0,
      -this.x * sx,
      -this.y * sy,
      0,
      1
    ]);
  }

  screenDeltaToWorld(dx: number, dy: number): { x: number; y: number } {
    return {
      x: dx / this.zoom,
      y: dy / this.zoom
    };
  }
}
