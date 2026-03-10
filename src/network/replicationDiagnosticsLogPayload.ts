import {
  createAuthoritativeClientReplicationDiagnosticsAggregate,
  type AuthoritativeClientReplicationDiagnosticsAggregate
} from './replicationDiagnosticsAggregate';
import type {
  AuthoritativeClientReplicationDiagnosticsRegistrySnapshot,
  AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry
} from './replicationDiagnosticsRegistrySnapshot';
import {
  createAuthoritativeClientReplicationDiagnosticsSnapshot,
  type AuthoritativeClientReplicationDiagnosticsSnapshot
} from './replicationDiagnosticsSnapshot';

export interface AuthoritativeClientReplicationDiagnosticsLogPayload {
  aggregate: AuthoritativeClientReplicationDiagnosticsAggregate;
  clients: AuthoritativeClientReplicationDiagnosticsRegistrySnapshot;
}

const cloneAuthoritativeClientReplicationDiagnosticsSnapshot = (
  snapshot: AuthoritativeClientReplicationDiagnosticsSnapshot
): AuthoritativeClientReplicationDiagnosticsSnapshot =>
  createAuthoritativeClientReplicationDiagnosticsSnapshot({
    replayDiagnostics: snapshot.replay,
    sendDiagnostics: snapshot.send,
    resyncDiagnostics: snapshot.resync
  });

const cloneAuthoritativeClientReplicationDiagnosticsSnapshotEntry = ({
  clientId,
  snapshot
}: AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry): AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry => ({
  clientId,
  snapshot: cloneAuthoritativeClientReplicationDiagnosticsSnapshot(snapshot)
});

export const createAuthoritativeClientReplicationDiagnosticsLogPayload = (
  snapshotEntries: AuthoritativeClientReplicationDiagnosticsRegistrySnapshot = []
): AuthoritativeClientReplicationDiagnosticsLogPayload => {
  const clients = snapshotEntries.map(
    cloneAuthoritativeClientReplicationDiagnosticsSnapshotEntry
  );

  return {
    aggregate: createAuthoritativeClientReplicationDiagnosticsAggregate(clients),
    clients
  };
};

export const cloneAuthoritativeClientReplicationDiagnosticsLogPayload = (
  payload: AuthoritativeClientReplicationDiagnosticsLogPayload
): AuthoritativeClientReplicationDiagnosticsLogPayload =>
  createAuthoritativeClientReplicationDiagnosticsLogPayload(payload.clients);
