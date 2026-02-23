export interface DebugOverlayStats {
  renderedChunks: number;
  drawCalls: number;
  drawCallBudget: number;
  meshBuilds: number;
  meshBuildTimeMs: number;
  residentWorldChunks: number;
  cachedChunkMeshes: number;
  evictedWorldChunks: number;
  evictedMeshEntries: number;
}

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

  update(deltaMs: number, stats: DebugOverlayStats): void {
    this.smoothDelta = this.smoothDelta * 0.9 + deltaMs * 0.1;
    this.fps = 1000 / this.smoothDelta;
    const budgetState = stats.drawCalls > stats.drawCallBudget ? 'OVER' : 'OK';
    this.root.textContent =
      `FPS: ${this.fps.toFixed(1)} | ` +
      `Chunks: ${stats.renderedChunks} | ` +
      `Draws: ${stats.drawCalls}/${stats.drawCallBudget} (${budgetState}) | ` +
      `Mesh builds: ${stats.meshBuilds} (${stats.meshBuildTimeMs.toFixed(2)} ms) | ` +
      `Cache W/M: ${stats.residentWorldChunks}/${stats.cachedChunkMeshes} | ` +
      `Evict W/M: ${stats.evictedWorldChunks}/${stats.evictedMeshEntries}`;
  }
}
