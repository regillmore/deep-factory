export class DebugOverlay {
  private root: HTMLDivElement;
  private fps = 0;
  private smoothDelta = 16;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.top = '12px';
    this.root.style.left = '12px';
    this.root.style.padding = '8px 10px';
    this.root.style.background = 'rgba(0, 0, 0, 0.6)';
    this.root.style.color = '#fff';
    this.root.style.fontFamily = 'monospace';
    this.root.style.fontSize = '12px';
    this.root.style.borderRadius = '8px';
    document.body.append(this.root);
  }

  update(deltaMs: number, renderedChunks: number): void {
    this.smoothDelta = this.smoothDelta * 0.9 + deltaMs * 0.1;
    this.fps = 1000 / this.smoothDelta;
    this.root.textContent = `FPS: ${this.fps.toFixed(1)} | Rendered chunks: ${renderedChunks}`;
  }
}
