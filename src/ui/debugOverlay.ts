import { worldToChunkCoord, worldToLocalTile } from '../world/chunkMath';
import type { TileLiquidKind } from '../world/tileMetadata';

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
  tile: { x: number; y: number };
  tileId?: number;
  tileLabel?: string;
  solid?: boolean;
  blocksLight?: boolean;
  liquidKind?: TileLiquidKind | null;
  client: { x: number; y: number };
  canvas: { x: number; y: number };
  world: { x: number; y: number };
  pointerType: string;
}

export interface DebugOverlayTileInspect {
  tile: { x: number; y: number };
  tileId?: number;
  tileLabel?: string;
  solid?: boolean;
  blocksLight?: boolean;
  liquidKind?: TileLiquidKind | null;
}

export interface DebugOverlayInspectState {
  pointer: DebugOverlayPointerInspect | null;
  pinned: DebugOverlayTileInspect | null;
}

const formatFloat = (value: number, digits: number): string => value.toFixed(digits);
const formatInt = (value: number): string => Math.round(value).toString();
const formatGameplayFlag = (value: boolean): string => (value ? 'on' : 'off');
const formatTileIdentity = (tileInspect: DebugOverlayTileInspect): string | null => {
  if (tileInspect.tileLabel && typeof tileInspect.tileId === 'number') {
    return `Tile:${tileInspect.tileLabel} (#${tileInspect.tileId})`;
  }
  if (tileInspect.tileLabel) {
    return `Tile:${tileInspect.tileLabel}`;
  }
  if (typeof tileInspect.tileId === 'number') {
    return `Tile:#${tileInspect.tileId}`;
  }
  return null;
};

const formatTileGameplay = (tileInspect: DebugOverlayTileInspect): string =>
  typeof tileInspect.solid === 'boolean' && typeof tileInspect.blocksLight === 'boolean'
    ? ` | solid:${formatGameplayFlag(tileInspect.solid)}` +
      ` | light:${formatGameplayFlag(tileInspect.blocksLight)}` +
      ` | liquid:${tileInspect.liquidKind ?? 'none'}`
    : '';

const formatTileLocation = (tileInspect: DebugOverlayTileInspect): string => {
  const { chunkX, chunkY } = worldToChunkCoord(tileInspect.tile.x, tileInspect.tile.y);
  const { localX, localY } = worldToLocalTile(tileInspect.tile.x, tileInspect.tile.y);
  const tileIdentity = formatTileIdentity(tileInspect);

  return (
    (tileIdentity ? `${tileIdentity} | ` : '') +
    `T:${tileInspect.tile.x},${tileInspect.tile.y} | ` +
    `Ch:${chunkX},${chunkY} | ` +
    `L:${localX},${localY}` +
    formatTileGameplay(tileInspect)
  );
};

export const formatDebugOverlayText = (
  fps: number,
  stats: DebugOverlayStats,
  inspect: DebugOverlayInspectState | null
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

  const pointerInspect = inspect?.pointer ?? null;
  const pinnedInspect = inspect?.pinned ?? null;
  const lines = [summaryLine];

  if (!pointerInspect) {
    lines.push('Ptr: n/a');
  } else {
    lines.push(
      `Ptr(${pointerInspect.pointerType}) ` +
        `C:${formatInt(pointerInspect.client.x)},${formatInt(pointerInspect.client.y)} | ` +
        `Cv:${formatInt(pointerInspect.canvas.x)},${formatInt(pointerInspect.canvas.y)} | ` +
        `W:${formatFloat(pointerInspect.world.x, 2)},${formatFloat(pointerInspect.world.y, 2)} | ` +
        formatTileLocation(pointerInspect)
    );
  }

  if (pinnedInspect) {
    lines.push(`Pin: ${formatTileLocation(pinnedInspect)}`);
  }

  return lines.join('\n');
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
    inspect: DebugOverlayInspectState | null = null
  ): void {
    this.smoothDelta = this.smoothDelta * 0.9 + deltaMs * 0.1;
    this.fps = 1000 / this.smoothDelta;
    this.root.textContent = formatDebugOverlayText(this.fps, stats, inspect);
  }
}
