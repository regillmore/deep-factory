import {
  createAuthoritativeClientReplicationDiagnosticsSnapshot,
  type AuthoritativeClientReplicationDiagnosticsSnapshot
} from './replicationDiagnosticsSnapshot';

export const resetAuthoritativeClientReplicationDiagnosticsSnapshot = (
  diagnostics: AuthoritativeClientReplicationDiagnosticsSnapshot = createAuthoritativeClientReplicationDiagnosticsSnapshot()
): AuthoritativeClientReplicationDiagnosticsSnapshot => ({
  replay: {
    ...diagnostics.replay,
    lastProcessed: null,
    totals: {
      chunks: {
        ...diagnostics.replay.totals.chunks,
        dropped: 0,
        trimmed: 0,
        applied: 0,
        skipped: 0
      },
      entities: {
        ...diagnostics.replay.totals.entities,
        dropped: 0,
        trimmed: 0,
        applied: 0,
        skipped: 0
      }
    }
  },
  send: {
    ...diagnostics.send,
    lastStaged: null,
    totals: {
      chunks: {
        ...diagnostics.send.totals.chunks,
        dropped: 0,
        trimmed: 0,
        forwarded: 0
      },
      entities: {
        ...diagnostics.send.totals.entities,
        dropped: 0,
        trimmed: 0,
        forwarded: 0
      }
    }
  },
  resync: {
    ...diagnostics.resync,
    lastAppliedBaseline: null,
    totals: {
      ...diagnostics.resync.totals,
      spawned: 0,
      updated: 0,
      removed: 0
    }
  }
});
