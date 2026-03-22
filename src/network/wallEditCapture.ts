import { createAuthoritativeChunkWallDiffMessages } from './chunkWallDiffBatching';
import type { AuthoritativeWallEdit } from './chunkWallDiffBatching';
import type { ChunkWallDiffMessage } from './protocol';

export type AuthoritativeWallEditNotification = AuthoritativeWallEdit;

const cloneAuthoritativeWallEditNotification = (
  notification: AuthoritativeWallEditNotification
): AuthoritativeWallEdit => ({
  worldTileX: notification.worldTileX,
  worldTileY: notification.worldTileY,
  previousWallId: notification.previousWallId,
  wallId: notification.wallId
});

export class AuthoritativeWallEditCapture {
  private pendingWallEdits: AuthoritativeWallEdit[] = [];

  recordWallEditNotification(notification: AuthoritativeWallEditNotification): void {
    this.pendingWallEdits.push(cloneAuthoritativeWallEditNotification(notification));
  }

  reset(): void {
    this.pendingWallEdits.length = 0;
  }

  drainChunkWallDiffMessages(tick: number): ChunkWallDiffMessage[] {
    const messages = createAuthoritativeChunkWallDiffMessages({
      tick,
      edits: this.pendingWallEdits
    });
    this.pendingWallEdits = [];
    return messages;
  }
}
