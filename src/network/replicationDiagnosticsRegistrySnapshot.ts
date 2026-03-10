import {
  AuthoritativeClientReplicationDiagnosticsRegistry,
  type AuthoritativeReplicationClientId
} from './replicationDiagnosticsRegistry';
import type { AuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';

export interface AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry {
  clientId: AuthoritativeReplicationClientId;
  snapshot: AuthoritativeClientReplicationDiagnosticsSnapshot;
}

export type AuthoritativeClientReplicationDiagnosticsRegistrySnapshot =
  AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry[];

const compareAuthoritativeReplicationClientIds = (
  left: AuthoritativeReplicationClientId,
  right: AuthoritativeReplicationClientId
): number => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

export const createAuthoritativeClientReplicationDiagnosticsRegistrySnapshot = (
  registry: AuthoritativeClientReplicationDiagnosticsRegistry
): AuthoritativeClientReplicationDiagnosticsRegistrySnapshot => {
  const orderedClientIds = registry
    .getClientIds()
    .sort(compareAuthoritativeReplicationClientIds);

  const snapshotEntries: AuthoritativeClientReplicationDiagnosticsRegistrySnapshot = [];
  for (const clientId of orderedClientIds) {
    const snapshot = registry.getSnapshot(clientId);
    if (snapshot === null) {
      continue;
    }

    snapshotEntries.push({
      clientId,
      snapshot
    });
  }

  return snapshotEntries;
};
