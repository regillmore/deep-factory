import {
  createAuthoritativeClientReplicationDiagnostics,
  type AuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import {
  createAuthoritativeClientResyncDiagnostics,
  type AuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  createAuthoritativeClientSendDiagnostics,
  type AuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';

export interface AuthoritativeClientReplicationDiagnosticsSnapshot {
  replay: AuthoritativeClientReplicationDiagnostics;
  send: AuthoritativeClientSendDiagnostics;
  resync: AuthoritativeClientResyncDiagnostics;
}

export interface CreateAuthoritativeClientReplicationDiagnosticsSnapshotOptions {
  replayDiagnostics?: AuthoritativeClientReplicationDiagnostics;
  sendDiagnostics?: AuthoritativeClientSendDiagnostics;
  resyncDiagnostics?: AuthoritativeClientResyncDiagnostics;
}

const cloneAuthoritativeClientReplicationDiagnostics = (
  diagnostics: AuthoritativeClientReplicationDiagnostics
): AuthoritativeClientReplicationDiagnostics => ({
  lastProcessed:
    diagnostics.lastProcessed === null
      ? null
      : {
          tick: diagnostics.lastProcessed.tick
        },
  totals: {
    chunks: {
      dropped: diagnostics.totals.chunks.dropped,
      trimmed: diagnostics.totals.chunks.trimmed,
      applied: diagnostics.totals.chunks.applied,
      skipped: diagnostics.totals.chunks.skipped
    },
    entities: {
      dropped: diagnostics.totals.entities.dropped,
      trimmed: diagnostics.totals.entities.trimmed,
      applied: diagnostics.totals.entities.applied,
      skipped: diagnostics.totals.entities.skipped
    }
  }
});

const cloneAuthoritativeClientSendDiagnostics = (
  diagnostics: AuthoritativeClientSendDiagnostics
): AuthoritativeClientSendDiagnostics => ({
  lastStaged:
    diagnostics.lastStaged === null
      ? null
      : {
          tick: diagnostics.lastStaged.tick
        },
  totals: {
    chunks: {
      dropped: diagnostics.totals.chunks.dropped,
      trimmed: diagnostics.totals.chunks.trimmed,
      forwarded: diagnostics.totals.chunks.forwarded
    },
    entities: {
      dropped: diagnostics.totals.entities.dropped,
      trimmed: diagnostics.totals.entities.trimmed,
      forwarded: diagnostics.totals.entities.forwarded
    }
  }
});

const cloneAuthoritativeClientResyncDiagnostics = (
  diagnostics: AuthoritativeClientResyncDiagnostics
): AuthoritativeClientResyncDiagnostics => ({
  lastAppliedBaseline:
    diagnostics.lastAppliedBaseline === null
      ? null
      : {
          tick: diagnostics.lastAppliedBaseline.tick,
          entityCount: diagnostics.lastAppliedBaseline.entityCount
        },
  totals: {
    spawned: diagnostics.totals.spawned,
    updated: diagnostics.totals.updated,
    removed: diagnostics.totals.removed
  }
});

export const createAuthoritativeClientReplicationDiagnosticsSnapshot = ({
  replayDiagnostics,
  sendDiagnostics,
  resyncDiagnostics
}: CreateAuthoritativeClientReplicationDiagnosticsSnapshotOptions = {}): AuthoritativeClientReplicationDiagnosticsSnapshot => ({
  replay: cloneAuthoritativeClientReplicationDiagnostics(
    replayDiagnostics ?? createAuthoritativeClientReplicationDiagnostics()
  ),
  send: cloneAuthoritativeClientSendDiagnostics(
    sendDiagnostics ?? createAuthoritativeClientSendDiagnostics()
  ),
  resync: cloneAuthoritativeClientResyncDiagnostics(
    resyncDiagnostics ?? createAuthoritativeClientResyncDiagnostics()
  )
});
