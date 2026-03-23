import { describe, expect, it } from 'vitest';

import {
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
  AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED,
  AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED,
  type AuthoritativeReplicationDispatchResult
} from './replicationDispatch';
import { summarizeAuthoritativeReplicationDispatchResults } from './replicationDispatchSummary';
import {
  AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
  type AuthoritativeChunkTileDiffReplayResult,
  type AuthoritativeChunkWallDiffReplayResult,
  type AuthoritativeEntitySnapshotReplayResult
} from './stateReplay';

describe('summarizeAuthoritativeReplicationDispatchResults', () => {
  it('returns zeroed chunk and entity counters when no results were dispatched', () => {
    expect(summarizeAuthoritativeReplicationDispatchResults()).toEqual({
      chunks: {
        dropped: 0,
        trimmed: 0,
        applied: 0,
        skipped: 0
      },
      entities: {
        dropped: 0,
        trimmed: 0,
        applied: 0,
        skipped: 0
      }
    });
  });

  it('reduces mixed filter and replay outcomes into deterministic chunk and entity counters', () => {
    const results: AuthoritativeReplicationDispatchResult[] = [
      {
        kind: 'entity-snapshot',
        tick: 9,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
        replayStatus: AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED,
        receivedEntityCount: 4,
        forwardedEntityCount: 2,
        replayResult: {
          kind: 'entity-snapshot',
          tick: 9,
          skipped: true,
          reason: AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
          lastAppliedTick: 10,
          receivedEntityCount: 2
        } satisfies AuthoritativeEntitySnapshotReplayResult
      },
      {
        kind: 'chunk-tile-diff',
        tick: 6,
        chunk: {
          x: 2,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
        replayStatus: AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED,
        receivedTileCount: 3,
        forwardedTileCount: 3,
        replayResult: {
          kind: 'chunk-tile-diff',
          tick: 6,
          chunk: {
            x: 2,
            y: 0
          },
          appliedTileCount: 3,
          changedTileCount: 2
        } satisfies AuthoritativeChunkTileDiffReplayResult
      },
      {
        kind: 'chunk-wall-diff',
        tick: 6,
        chunk: {
          x: 2,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
        replayStatus: AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED,
        receivedWallCount: 1,
        forwardedWallCount: 1,
        replayResult: {
          kind: 'chunk-wall-diff',
          tick: 6,
          chunk: {
            x: 2,
            y: 0
          },
          appliedWallCount: 1,
          changedWallCount: 1
        } satisfies AuthoritativeChunkWallDiffReplayResult
      },
      {
        kind: 'chunk-tile-diff',
        tick: 7,
        chunk: {
          x: 5,
          y: 1
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
        replayStatus: null,
        receivedTileCount: 1,
        forwardedTileCount: 0
      },
      {
        kind: 'entity-snapshot',
        tick: 11,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
        replayStatus: null,
        receivedEntityCount: 2,
        forwardedEntityCount: 0
      },
      {
        kind: 'entity-snapshot',
        tick: 12,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
        replayStatus: AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED,
        receivedEntityCount: 3,
        forwardedEntityCount: 1,
        replayResult: {
          kind: 'entity-snapshot',
          tick: 12,
          entityCount: 1,
          spawnedEntityIds: [8],
          updatedEntityIds: [],
          removedEntityIds: [2]
        } satisfies AuthoritativeEntitySnapshotReplayResult
      },
      {
        kind: 'chunk-tile-diff',
        tick: 8,
        chunk: {
          x: 2,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
        replayStatus: AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED,
        receivedTileCount: 2,
        forwardedTileCount: 2,
        replayResult: {
          kind: 'chunk-tile-diff',
          tick: 8,
          chunk: {
            x: 2,
            y: 0
          },
          skipped: true,
          reason: AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK,
          lastAppliedTick: 9,
          receivedTileCount: 2
        } satisfies AuthoritativeChunkTileDiffReplayResult
      }
    ];

    expect(summarizeAuthoritativeReplicationDispatchResults(results)).toEqual({
      chunks: {
        dropped: 1,
        trimmed: 0,
        applied: 2,
        skipped: 1
      },
      entities: {
        dropped: 1,
        trimmed: 2,
        applied: 1,
        skipped: 1
      }
    });
    expect(summarizeAuthoritativeReplicationDispatchResults([...results].reverse())).toEqual({
      chunks: {
        dropped: 1,
        trimmed: 0,
        applied: 2,
        skipped: 1
      },
      entities: {
        dropped: 1,
        trimmed: 2,
        applied: 1,
        skipped: 1
      }
    });
  });
});
