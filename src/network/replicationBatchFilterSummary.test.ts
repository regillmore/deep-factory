import { describe, expect, it } from 'vitest';

import {
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
  type AuthoritativeReplicationBatchFilterDiagnostic
} from './replicationBatchFilter';
import { summarizeAuthoritativeReplicationBatchFilterDiagnostics } from './replicationBatchFilterSummary';

describe('summarizeAuthoritativeReplicationBatchFilterDiagnostics', () => {
  it('returns zeroed counters and null staged metadata when no send-batch diagnostics were recorded', () => {
    expect(summarizeAuthoritativeReplicationBatchFilterDiagnostics()).toEqual({
      staged: null,
      chunks: {
        dropped: 0,
        trimmed: 0,
        forwarded: 0
      },
      entities: {
        dropped: 0,
        trimmed: 0,
        forwarded: 0
      }
    });
  });

  it('reduces one staged send batch into chunk and entity dropped, trimmed, and forwarded counts', () => {
    const diagnostics: AuthoritativeReplicationBatchFilterDiagnostic[] = [
      {
        kind: 'entity-snapshot',
        tick: 12,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
        receivedEntityCount: 4,
        forwardedEntityCount: 2
      },
      {
        kind: 'chunk-tile-diff',
        tick: 12,
        chunk: {
          x: 2,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
        receivedTileCount: 3,
        forwardedTileCount: 3
      },
      {
        kind: 'chunk-tile-diff',
        tick: 12,
        chunk: {
          x: 5,
          y: 1
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
        receivedTileCount: 1,
        forwardedTileCount: 0
      },
      {
        kind: 'entity-snapshot',
        tick: 12,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
        receivedEntityCount: 2,
        forwardedEntityCount: 2
      }
    ];

    expect(summarizeAuthoritativeReplicationBatchFilterDiagnostics(diagnostics)).toEqual({
      staged: {
        tick: 12
      },
      chunks: {
        dropped: 1,
        trimmed: 0,
        forwarded: 1
      },
      entities: {
        dropped: 0,
        trimmed: 1,
        forwarded: 2
      }
    });
    expect(
      summarizeAuthoritativeReplicationBatchFilterDiagnostics([...diagnostics].reverse())
    ).toEqual({
      staged: {
        tick: 12
      },
      chunks: {
        dropped: 1,
        trimmed: 0,
        forwarded: 1
      },
      entities: {
        dropped: 0,
        trimmed: 1,
        forwarded: 2
      }
    });
  });

  it('rejects diagnostics that span multiple staged ticks', () => {
    const diagnostics: AuthoritativeReplicationBatchFilterDiagnostic[] = [
      {
        kind: 'chunk-tile-diff',
        tick: 4,
        chunk: {
          x: 0,
          y: 0
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
        receivedTileCount: 1,
        forwardedTileCount: 1
      },
      {
        kind: 'entity-snapshot',
        tick: 5,
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
        receivedEntityCount: 3,
        forwardedEntityCount: 1
      }
    ];

    expect(() => summarizeAuthoritativeReplicationBatchFilterDiagnostics(diagnostics)).toThrow(
      'Expected one staged tick in authoritative batch-filter diagnostics but received 5 after 4.'
    );
  });
});
