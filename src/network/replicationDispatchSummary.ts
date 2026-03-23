import {
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
  AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED,
  AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED,
  type AuthoritativeReplicationDispatchResult
} from './replicationDispatch';
import { ENTITY_SNAPSHOT_MESSAGE_KIND } from './protocol';

export interface AuthoritativeReplicationDispatchStatusCounters {
  dropped: number;
  trimmed: number;
  applied: number;
  skipped: number;
}

export interface AuthoritativeReplicationDispatchSummary {
  chunks: AuthoritativeReplicationDispatchStatusCounters;
  entities: AuthoritativeReplicationDispatchStatusCounters;
}

const createAuthoritativeReplicationDispatchStatusCounters =
  (): AuthoritativeReplicationDispatchStatusCounters => ({
    dropped: 0,
    trimmed: 0,
    applied: 0,
    skipped: 0
  });

export const summarizeAuthoritativeReplicationDispatchResults = (
  results?: Iterable<AuthoritativeReplicationDispatchResult>
): AuthoritativeReplicationDispatchSummary => {
  const summary: AuthoritativeReplicationDispatchSummary = {
    chunks: createAuthoritativeReplicationDispatchStatusCounters(),
    entities: createAuthoritativeReplicationDispatchStatusCounters()
  };

  for (const result of results ?? []) {
    const counters =
      result.kind === ENTITY_SNAPSHOT_MESSAGE_KIND ? summary.entities : summary.chunks;

    if (result.filterStatus === AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED) {
      counters.dropped += 1;
    } else if (result.filterStatus === AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED) {
      counters.trimmed += 1;
    }

    if (result.replayStatus === AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED) {
      counters.applied += 1;
    } else if (result.replayStatus === AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED) {
      counters.skipped += 1;
    }
  }

  return summary;
};
