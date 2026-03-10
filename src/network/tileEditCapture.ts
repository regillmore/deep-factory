import { createAuthoritativeChunkDiffMessages } from './chunkDiffBatching';
import type { AuthoritativeTileEdit } from './chunkDiffBatching';
import type { ChunkTileDiffMessage } from './protocol';

export type AuthoritativeTileEditNotification = AuthoritativeTileEdit;

const cloneAuthoritativeTileEditNotification = (
  notification: AuthoritativeTileEditNotification
): AuthoritativeTileEdit => ({
  worldTileX: notification.worldTileX,
  worldTileY: notification.worldTileY,
  previousTileId: notification.previousTileId,
  previousLiquidLevel: notification.previousLiquidLevel,
  tileId: notification.tileId,
  liquidLevel: notification.liquidLevel
});

export class AuthoritativeTileEditCapture {
  private pendingTileEdits: AuthoritativeTileEdit[] = [];

  recordTileEditNotification(notification: AuthoritativeTileEditNotification): void {
    this.pendingTileEdits.push(cloneAuthoritativeTileEditNotification(notification));
  }

  reset(): void {
    this.pendingTileEdits.length = 0;
  }

  drainChunkDiffMessages(tick: number): ChunkTileDiffMessage[] {
    const messages = createAuthoritativeChunkDiffMessages({
      tick,
      edits: this.pendingTileEdits
    });
    this.pendingTileEdits = [];
    return messages;
  }
}
