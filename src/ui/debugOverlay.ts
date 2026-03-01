import { worldToChunkCoord, worldToLocalTile } from '../world/chunkMath';

export interface DebugOverlayStats {
  renderedChunks: number;
  drawCalls: number;
  drawCallBudget: number;
  meshBuilds: number;
  meshBuildBudget: number;
  meshBuildTimeMs: number;
  meshBuildQueueLength: number;
  residentWorldChunks: number;
  cachedChunkMeshes: number;
  evictedWorldChunks: number;
  evictedMeshEntries: number;
}

export interface DebugOverlayPointerInspect {
  client: { x: number; y: number };
  canvas: { x: number; y: number };
  world: { x: number; y: number };
  tile: { x: number; y: number };
  pointerType: string;
}

const formatFloat = (value: number, digits: number): string => value.toFixed(digits);
const formatInt = (value: number): string => Math.round(value).toString();

export const formatDebugOverlayText = (
  fps: number,
  stats: DebugOverlayStats,
  pointerInspect: DebugOverlayPointerInspect | null
): string => {
  const budgetState = stats.drawCalls > stats.drawCallBudget ? 'OVER' : 'OK';
  const summaryLine =
    `FPS: ${fps.toFixed(1)} | ` +
    `Chunks: ${stats.renderedChunks} | ` +
    `Draws: ${stats.drawCalls}/${stats.drawCallBudget} (${budgetState}) | ` +
    `Mesh builds: ${stats.meshBuilds}/${stats.meshBuildBudget} (${stats.meshBuildTimeMs.toFixed(2)} ms) | ` +
    `MeshQ: ${stats.meshBuildQueueLength} | ` +
    `Cache W/M: ${stats.residentWorldChunks}/${stats.cachedChunkMeshes} | ` +
    `Evict W/M: ${stats.evictedWorldChunks}/${stats.evictedMeshEntries}`;

  if (!pointerInspect) {
    return `${summaryLine}\nPtr: n/a`;
  }

  const { chunkX, chunkY } = worldToChunkCoord(pointerInspect.tile.x, pointerInspect.tile.y);
  const { localX, localY } = worldToLocalTile(pointerInspect.tile.x, pointerInspect.tile.y);
  const pointerLine =
    `Ptr(${pointerInspect.pointerType}) ` +
    `C:${formatInt(pointerInspect.client.x)},${formatInt(pointerInspect.client.y)} | ` +
    `Cv:${formatInt(pointerInspect.canvas.x)},${formatInt(pointerInspect.canvas.y)} | ` +
    `W:${formatFloat(pointerInspect.world.x, 2)},${formatFloat(pointerInspect.world.y, 2)} | ` +
    `T:${pointerInspect.tile.x},${pointerInspect.tile.y} | ` +
    `Ch:${chunkX},${chunkY} | ` +
    `L:${localX},${localY}`;

  return `${summaryLine}\n${pointerLine}`;
};

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
    this.root.style.whiteSpace = 'pre';
    this.root.style.lineHeight = '1.35';
    this.root.style.pointerEvents = 'none';
    this.root.style.borderRadius = '8px';
    document.body.append(this.root);
  }

  update(
    deltaMs: number,
    stats: DebugOverlayStats,
    pointerInspect: DebugOverlayPointerInspect | null = null
  ): void {
    this.smoothDelta = this.smoothDelta * 0.9 + deltaMs * 0.1;
    this.fps = 1000 / this.smoothDelta;
    this.root.textContent = formatDebugOverlayText(this.fps, stats, pointerInspect);
  }
}
