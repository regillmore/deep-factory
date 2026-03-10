import { resetAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsReset';
import {
  createAuthoritativeClientReplicationDiagnosticsSnapshot,
  type AuthoritativeClientReplicationDiagnosticsSnapshot
} from './replicationDiagnosticsSnapshot';

export type AuthoritativeReplicationClientId = string;

const cloneAuthoritativeClientReplicationDiagnosticsSnapshot = (
  snapshot: AuthoritativeClientReplicationDiagnosticsSnapshot
): AuthoritativeClientReplicationDiagnosticsSnapshot =>
  createAuthoritativeClientReplicationDiagnosticsSnapshot({
    replayDiagnostics: snapshot.replay,
    sendDiagnostics: snapshot.send,
    resyncDiagnostics: snapshot.resync
  });

export class AuthoritativeClientReplicationDiagnosticsRegistry {
  private snapshotsByClientId = new Map<
    AuthoritativeReplicationClientId,
    AuthoritativeClientReplicationDiagnosticsSnapshot
  >();

  has(clientId: AuthoritativeReplicationClientId): boolean {
    return this.snapshotsByClientId.has(clientId);
  }

  getClientCount(): number {
    return this.snapshotsByClientId.size;
  }

  getClientIds(): AuthoritativeReplicationClientId[] {
    return Array.from(this.snapshotsByClientId.keys());
  }

  getSnapshot(
    clientId: AuthoritativeReplicationClientId
  ): AuthoritativeClientReplicationDiagnosticsSnapshot | null {
    const snapshot = this.snapshotsByClientId.get(clientId);
    return snapshot ? cloneAuthoritativeClientReplicationDiagnosticsSnapshot(snapshot) : null;
  }

  setSnapshot(
    clientId: AuthoritativeReplicationClientId,
    snapshot: AuthoritativeClientReplicationDiagnosticsSnapshot
  ): void {
    this.snapshotsByClientId.set(
      clientId,
      cloneAuthoritativeClientReplicationDiagnosticsSnapshot(snapshot)
    );
  }

  reset(clientId: AuthoritativeReplicationClientId): AuthoritativeClientReplicationDiagnosticsSnapshot {
    const nextSnapshot = resetAuthoritativeClientReplicationDiagnosticsSnapshot(
      this.snapshotsByClientId.get(clientId)
    );
    this.snapshotsByClientId.set(clientId, nextSnapshot);
    return cloneAuthoritativeClientReplicationDiagnosticsSnapshot(nextSnapshot);
  }

  remove(clientId: AuthoritativeReplicationClientId): boolean {
    return this.snapshotsByClientId.delete(clientId);
  }
}
