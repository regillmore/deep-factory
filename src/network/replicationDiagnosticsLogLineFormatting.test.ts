import { describe, expect, it } from 'vitest';

import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import {
  formatAuthoritativeClientReplicationDiagnosticsLogClientLines
} from './replicationDiagnosticsLogLineFormatting';
import { createAuthoritativeClientReplicationDiagnosticsSnapshot } from './replicationDiagnosticsSnapshot';
import {
  accumulateAuthoritativeClientResyncDiagnostics
} from './replicationResyncDiagnostics';
import {
  accumulateAuthoritativeClientSendDiagnostics
} from './replicationSendDiagnostics';

const createPopulatedSnapshot = (seed: number) =>
  createAuthoritativeClientReplicationDiagnosticsSnapshot({
    replayDiagnostics: accumulateAuthoritativeClientReplicationDiagnostics({
      tick: seed,
      dispatchSummary: {
        chunks: {
          dropped: seed,
          trimmed: seed + 1,
          applied: seed + 2,
          skipped: seed + 3
        },
        entities: {
          dropped: seed + 4,
          trimmed: seed + 5,
          applied: seed + 6,
          skipped: seed + 7
        }
      }
    }),
    sendDiagnostics: accumulateAuthoritativeClientSendDiagnostics({
      batchFilterSummary: {
        staged: {
          tick: seed + 10
        },
        chunks: {
          dropped: seed + 8,
          trimmed: seed + 9,
          forwarded: seed + 10
        },
        entities: {
          dropped: seed + 11,
          trimmed: seed + 12,
          forwarded: seed + 13
        }
      }
    }),
    resyncDiagnostics: accumulateAuthoritativeClientResyncDiagnostics({
      baselineSummary: {
        baseline: {
          tick: seed + 20,
          entityCount: seed + 21
        },
        entities: {
          spawned: seed + 14,
          updated: seed + 15,
          removed: seed + 16
        }
      }
    })
  });

describe('formatAuthoritativeClientReplicationDiagnosticsLogClientLines', () => {
  it('renders zeroed sections with explicit n/a metadata placeholders', () => {
    expect(
      formatAuthoritativeClientReplicationDiagnosticsLogClientLines({
        clientId: 'client-alpha',
        snapshot: createAuthoritativeClientReplicationDiagnosticsSnapshot()
      })
    ).toEqual([
      'Client: client-alpha',
      '  ReplayLastProcessed: n/a',
      '  ReplayChunks: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      '  ReplayEntities: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      '  SendLastStaged: n/a',
      '  SendChunks: dropped=0 | trimmed=0 | forwarded=0',
      '  SendEntities: dropped=0 | trimmed=0 | forwarded=0',
      '  ResyncLastAppliedBaseline: n/a',
      '  ResyncTotals: spawned=0 | updated=0 | removed=0'
    ]);
  });

  it('renders one client entry into deterministic labeled replay, send, and resync lines', () => {
    expect(
      formatAuthoritativeClientReplicationDiagnosticsLogClientLines({
        clientId: 'client-zulu',
        snapshot: createPopulatedSnapshot(12)
      })
    ).toEqual([
      'Client: client-zulu',
      '  ReplayLastProcessed: 12',
      '  ReplayChunks: dropped=12 | trimmed=13 | applied=14 | skipped=15',
      '  ReplayEntities: dropped=16 | trimmed=17 | applied=18 | skipped=19',
      '  SendLastStaged: 22',
      '  SendChunks: dropped=20 | trimmed=21 | forwarded=22',
      '  SendEntities: dropped=23 | trimmed=24 | forwarded=25',
      '  ResyncLastAppliedBaseline: tick=32 | entityCount=33',
      '  ResyncTotals: spawned=26 | updated=27 | removed=28'
    ]);
  });
});
