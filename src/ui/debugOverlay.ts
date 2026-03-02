import { worldToChunkCoord, worldToLocalTile } from '../world/chunkMath';
import type { PlayerCeilingContactTransitionKind } from '../world/playerCeilingContactTransition';
import type { PlayerFacingTransitionKind } from '../world/playerFacingTransition';
import type { PlayerGroundedTransitionKind } from '../world/playerGroundedTransition';
import type { PlayerWallContactTransitionKind } from '../world/playerWallContactTransition';
import type { TileLiquidKind } from '../world/tileMetadata';

export interface DebugOverlayStats {
  atlasSourceKind: 'pending' | 'authored' | 'placeholder';
  atlasWidth: number | null;
  atlasHeight: number | null;
  atlasValidationWarningCount: number | null;
  atlasValidationFirstWarning: string | null;
  residentAnimatedChunkMeshes: number;
  residentAnimatedChunkQuadCount: number;
  animatedChunkUvUploadCount: number;
  animatedChunkUvUploadQuadCount: number;
  animatedChunkUvUploadBytes: number;
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

export interface DebugOverlayPlayerSpawn {
  tile: { x: number; y: number };
  world: { x: number; y: number };
}

export interface DebugOverlayPlayerTelemetry {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  aabb: {
    min: { x: number; y: number };
    max: { x: number; y: number };
    size: { x: number; y: number };
  };
  grounded: boolean;
  facing: 'left' | 'right';
  contacts: {
    support: { tileX: number; tileY: number; tileId: number } | null;
    wall: { tileX: number; tileY: number; tileId: number } | null;
    ceiling: { tileX: number; tileY: number; tileId: number } | null;
  };
}

export interface DebugOverlayPlayerIntentTelemetry {
  moveX: number;
  jumpHeld: boolean;
  jumpPressed: boolean;
}

export interface DebugOverlayPlayerCameraFollowTelemetry {
  focus: { x: number; y: number };
  offset: { x: number; y: number };
}

export interface DebugOverlayPlayerGroundedTransitionTelemetry {
  kind: PlayerGroundedTransitionKind;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayPlayerFacingTransitionTelemetry {
  kind: PlayerFacingTransitionKind;
  previousFacing: 'left' | 'right';
  nextFacing: 'left' | 'right';
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayPlayerWallContactTransitionTelemetry {
  kind: PlayerWallContactTransitionKind;
  tile: { x: number; y: number; id: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayPlayerCeilingContactTransitionTelemetry {
  kind: PlayerCeilingContactTransitionKind;
  tile: { x: number; y: number; id: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DebugOverlayInspectState {
  pointer: DebugOverlayPointerInspect | null;
  pinned: DebugOverlayTileInspect | null;
  spawn: DebugOverlayPlayerSpawn | null;
  player: DebugOverlayPlayerTelemetry | null;
  playerIntent: DebugOverlayPlayerIntentTelemetry | null;
  playerCameraFollow: DebugOverlayPlayerCameraFollowTelemetry | null;
  playerGroundedTransition: DebugOverlayPlayerGroundedTransitionTelemetry | null;
  playerFacingTransition: DebugOverlayPlayerFacingTransitionTelemetry | null;
  playerWallContactTransition: DebugOverlayPlayerWallContactTransitionTelemetry | null;
  playerCeilingContactTransition: DebugOverlayPlayerCeilingContactTransitionTelemetry | null;
}

const formatFloat = (value: number, digits: number): string => value.toFixed(digits);
const formatInt = (value: number): string => Math.round(value).toString();
const formatGameplayFlag = (value: boolean): string => (value ? 'on' : 'off');
const formatAtlasLine = (stats: DebugOverlayStats): string => {
  if (stats.atlasWidth === null || stats.atlasHeight === null) {
    return `Atlas: ${stats.atlasSourceKind}`;
  }

  return `Atlas: ${stats.atlasSourceKind} | ${stats.atlasWidth}x${stats.atlasHeight}`;
};

const formatAtlasValidationLine = (stats: DebugOverlayStats): string => {
  if (stats.atlasValidationWarningCount === null) {
    return 'AtlasWarn: pending';
  }
  if (stats.atlasValidationWarningCount === 0) {
    return 'AtlasWarn: none';
  }

  const firstWarning = stats.atlasValidationFirstWarning
    ? ` | ${stats.atlasValidationFirstWarning}`
    : '';
  return `AtlasWarn: ${stats.atlasValidationWarningCount}${firstWarning}`;
};

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

const formatSpawnLine = (spawn: DebugOverlayPlayerSpawn | null): string => {
  if (!spawn) {
    return 'Spawn: unresolved';
  }

  return (
    `Spawn: T:${spawn.tile.x},${spawn.tile.y} | ` +
    `W:${formatFloat(spawn.world.x, 2)},${formatFloat(spawn.world.y, 2)}`
  );
};

const formatPlayerLine = (player: DebugOverlayPlayerTelemetry | null): string => {
  if (!player) {
    return 'Player: n/a';
  }

  return (
    `Player: Pos:${formatFloat(player.position.x, 2)},${formatFloat(player.position.y, 2)} | ` +
    `Vel:${formatFloat(player.velocity.x, 2)},${formatFloat(player.velocity.y, 2)} | ` +
    `grounded:${formatGameplayFlag(player.grounded)} | ` +
    `facing:${player.facing}`
  );
};

const formatPlayerAabbLine = (player: DebugOverlayPlayerTelemetry | null): string => {
  if (!player) {
    return 'AABB: n/a';
  }

  return (
    `AABB: min:${formatFloat(player.aabb.min.x, 2)},${formatFloat(player.aabb.min.y, 2)} | ` +
    `max:${formatFloat(player.aabb.max.x, 2)},${formatFloat(player.aabb.max.y, 2)} | ` +
    `size:${formatFloat(player.aabb.size.x, 2)},${formatFloat(player.aabb.size.y, 2)}`
  );
};

const formatPlayerCameraFollowLine = (
  playerCameraFollow: DebugOverlayPlayerCameraFollowTelemetry | null
): string => {
  if (!playerCameraFollow) {
    return 'Follow: n/a';
  }

  return (
    `Follow: focus:${formatFloat(playerCameraFollow.focus.x, 2)},` +
    `${formatFloat(playerCameraFollow.focus.y, 2)} | ` +
    `offset:${formatFloat(playerCameraFollow.offset.x, 2)},` +
    `${formatFloat(playerCameraFollow.offset.y, 2)}`
  );
};

const formatPlayerContact = (
  contact: { tileX: number; tileY: number; tileId: number } | null
): string => {
  if (!contact) {
    return 'none';
  }

  return `${contact.tileX},${contact.tileY} (#${contact.tileId})`;
};

const formatPlayerContactsLine = (player: DebugOverlayPlayerTelemetry | null): string => {
  if (!player) {
    return 'Contact: n/a';
  }

  return (
    `Contact: support:${formatPlayerContact(player.contacts.support)} | ` +
    `wall:${formatPlayerContact(player.contacts.wall)} | ` +
    `ceiling:${formatPlayerContact(player.contacts.ceiling)}`
  );
};

const formatPlayerIntentLine = (playerIntent: DebugOverlayPlayerIntentTelemetry | null): string => {
  if (!playerIntent) {
    return 'Intent: n/a';
  }

  return (
    `Intent: move:${playerIntent.moveX} | ` +
    `jumpHeld:${formatGameplayFlag(playerIntent.jumpHeld)} | ` +
    `jumpPressed:${formatGameplayFlag(playerIntent.jumpPressed)}`
  );
};

const formatPlayerGroundedTransitionLine = (
  playerGroundedTransition: DebugOverlayPlayerGroundedTransitionTelemetry | null
): string => {
  if (!playerGroundedTransition) {
    return 'GroundEvt: none';
  }

  return (
    `GroundEvt: ${playerGroundedTransition.kind} | ` +
    `Pos:${formatFloat(playerGroundedTransition.position.x, 2)},` +
    `${formatFloat(playerGroundedTransition.position.y, 2)} | ` +
    `Vel:${formatFloat(playerGroundedTransition.velocity.x, 2)},` +
    `${formatFloat(playerGroundedTransition.velocity.y, 2)}`
  );
};

const formatPlayerFacingTransitionLine = (
  playerFacingTransition: DebugOverlayPlayerFacingTransitionTelemetry | null
): string => {
  if (!playerFacingTransition) {
    return 'FaceEvt: none';
  }

  return (
    `FaceEvt: ${playerFacingTransition.previousFacing}->${playerFacingTransition.nextFacing} | ` +
    `Pos:${formatFloat(playerFacingTransition.position.x, 2)},` +
    `${formatFloat(playerFacingTransition.position.y, 2)} | ` +
    `Vel:${formatFloat(playerFacingTransition.velocity.x, 2)},` +
    `${formatFloat(playerFacingTransition.velocity.y, 2)}`
  );
};

const formatPlayerWallContactTransitionLine = (
  playerWallContactTransition: DebugOverlayPlayerWallContactTransitionTelemetry | null
): string => {
  if (!playerWallContactTransition) {
    return 'WallEvt: none';
  }

  return (
    `WallEvt: ${playerWallContactTransition.kind} | ` +
    `Tile:${playerWallContactTransition.tile.x},${playerWallContactTransition.tile.y} ` +
    `(#${playerWallContactTransition.tile.id}) | ` +
    `Pos:${formatFloat(playerWallContactTransition.position.x, 2)},` +
    `${formatFloat(playerWallContactTransition.position.y, 2)} | ` +
    `Vel:${formatFloat(playerWallContactTransition.velocity.x, 2)},` +
    `${formatFloat(playerWallContactTransition.velocity.y, 2)}`
  );
};

const formatPlayerCeilingContactTransitionLine = (
  playerCeilingContactTransition: DebugOverlayPlayerCeilingContactTransitionTelemetry | null
): string => {
  if (!playerCeilingContactTransition) {
    return 'CeilEvt: none';
  }

  return (
    `CeilEvt: ${playerCeilingContactTransition.kind} | ` +
    `Tile:${playerCeilingContactTransition.tile.x},${playerCeilingContactTransition.tile.y} ` +
    `(#${playerCeilingContactTransition.tile.id}) | ` +
    `Pos:${formatFloat(playerCeilingContactTransition.position.x, 2)},` +
    `${formatFloat(playerCeilingContactTransition.position.y, 2)} | ` +
    `Vel:${formatFloat(playerCeilingContactTransition.velocity.x, 2)},` +
    `${formatFloat(playerCeilingContactTransition.velocity.y, 2)}`
  );
};

const formatAnimatedChunkUvUploadLine = (stats: DebugOverlayStats): string =>
  `AnimUV: uploads:${stats.animatedChunkUvUploadCount} | ` +
  `quads:${stats.animatedChunkUvUploadQuadCount} | ` +
  `bytes:${stats.animatedChunkUvUploadBytes}`;

const formatAnimatedChunkResidencyLine = (stats: DebugOverlayStats): string =>
  `AnimMesh: chunks:${stats.residentAnimatedChunkMeshes} | ` +
  `quads:${stats.residentAnimatedChunkQuadCount}`;

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
  const spawn = inspect?.spawn ?? null;
  const player = inspect?.player ?? null;
  const playerIntent = inspect?.playerIntent ?? null;
  const playerCameraFollow = inspect?.playerCameraFollow ?? null;
  const playerGroundedTransition = inspect?.playerGroundedTransition ?? null;
  const playerFacingTransition = inspect?.playerFacingTransition ?? null;
  const playerWallContactTransition = inspect?.playerWallContactTransition ?? null;
  const playerCeilingContactTransition = inspect?.playerCeilingContactTransition ?? null;
  const lines = [
    summaryLine,
    formatAtlasLine(stats),
    formatAtlasValidationLine(stats),
    formatSpawnLine(spawn),
    formatPlayerLine(player),
    formatPlayerGroundedTransitionLine(playerGroundedTransition),
    formatPlayerFacingTransitionLine(playerFacingTransition),
    formatPlayerWallContactTransitionLine(playerWallContactTransition),
    formatPlayerCeilingContactTransitionLine(playerCeilingContactTransition),
    formatPlayerAabbLine(player),
    formatPlayerCameraFollowLine(playerCameraFollow),
    formatPlayerContactsLine(player),
    formatPlayerIntentLine(playerIntent),
    formatAnimatedChunkResidencyLine(stats),
    formatAnimatedChunkUvUploadLine(stats)
  ];

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
  private visible = false;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.top = '12px';
    this.root.style.left = '12px';
    this.root.style.display = 'none';
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

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.style.display = this.visible ? 'block' : 'none';
  }

  update(
    deltaMs: number,
    stats: DebugOverlayStats,
    inspect: DebugOverlayInspectState | null = null
  ): void {
    this.smoothDelta = this.smoothDelta * 0.9 + deltaMs * 0.1;
    this.fps = 1000 / this.smoothDelta;
    this.root.style.display = this.visible ? 'block' : 'none';
    this.root.textContent = formatDebugOverlayText(this.fps, stats, inspect);
  }
}
