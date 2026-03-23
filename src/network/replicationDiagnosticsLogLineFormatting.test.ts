import { describe, expect, it } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsAggregate
} from './replicationDiagnosticsAggregate';
import {
  accumulateAuthoritativeClientReplicationDiagnostics
} from './replicationDiagnostics';
import {
  formatAuthoritativeClientReplicationDiagnosticsLogLines,
  formatAuthoritativeClientReplicationDiagnosticsLogAggregateLines,
  formatAuthoritativeClientReplicationDiagnosticsLogClientLines
} from './replicationDiagnosticsLogLineFormatting';
import { createAuthoritativeClientReplicationDiagnosticsLogPayload } from './replicationDiagnosticsLogPayload';
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
        world: {
          replacedTiles: seed + 17,
          replacedWalls: seed + 18
        },
        entities: {
          spawned: seed + 14,
          updated: seed + 15,
          removed: seed + 16
        }
      }
    })
  });

describe('formatAuthoritativeClientReplicationDiagnosticsLogAggregateLines', () => {
  it('renders zeroed aggregate totals when no aggregate was provided', () => {
    expect(formatAuthoritativeClientReplicationDiagnosticsLogAggregateLines()).toEqual([
      'Aggregate: clients=0',
      'AggregateReplayChunks: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      'AggregateReplayEntities: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      'AggregateSendChunks: dropped=0 | trimmed=0 | forwarded=0',
      'AggregateSendEntities: dropped=0 | trimmed=0 | forwarded=0',
      'AggregateResync: replacedTiles=0 | replacedWalls=0 | spawned=0 | updated=0 | removed=0'
    ]);
  });

  it('renders one aggregate summary into deterministic labeled header lines', () => {
    const aggregate = createAuthoritativeClientReplicationDiagnosticsAggregate([
      {
        clientId: 'client-zulu',
        snapshot: createPopulatedSnapshot(30)
      },
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(10)
      },
      {
        clientId: 'client-bravo',
        snapshot: createAuthoritativeClientReplicationDiagnosticsSnapshot()
      }
    ]);

    expect(formatAuthoritativeClientReplicationDiagnosticsLogAggregateLines(aggregate)).toEqual([
      'Aggregate: clients=3',
      'AggregateReplayChunks: dropped=40 | trimmed=42 | applied=44 | skipped=46',
      'AggregateReplayEntities: dropped=48 | trimmed=50 | applied=52 | skipped=54',
      'AggregateSendChunks: dropped=56 | trimmed=58 | forwarded=60',
      'AggregateSendEntities: dropped=62 | trimmed=64 | forwarded=66',
      'AggregateResync: replacedTiles=74 | replacedWalls=76 | spawned=68 | updated=70 | removed=72'
    ]);
  });
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
      '  ResyncTotals: replacedTiles=0 | replacedWalls=0 | spawned=0 | updated=0 | removed=0'
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
      '  ResyncLastAppliedBaseline: tick=32 | entityCount=33 | replacedTiles=29 | replacedWalls=30',
      '  ResyncTotals: replacedTiles=29 | replacedWalls=30 | spawned=26 | updated=27 | removed=28'
    ]);
  });
});

describe('formatAuthoritativeClientReplicationDiagnosticsLogLines', () => {
  it('renders the root log lines with an explicit no-clients line when no payload was provided', () => {
    expect(formatAuthoritativeClientReplicationDiagnosticsLogLines()).toEqual([
      'ReplicationDiagnostics',
      'Aggregate: clients=0',
      'AggregateReplayChunks: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      'AggregateReplayEntities: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      'AggregateSendChunks: dropped=0 | trimmed=0 | forwarded=0',
      'AggregateSendEntities: dropped=0 | trimmed=0 | forwarded=0',
      'AggregateResync: replacedTiles=0 | replacedWalls=0 | spawned=0 | updated=0 | removed=0',
      'Clients: none'
    ]);
  });

  it('renders aggregate lines first and then appends client sections in payload order', () => {
    const payload = createAuthoritativeClientReplicationDiagnosticsLogPayload([
      {
        clientId: 'client-charlie',
        snapshot: createPopulatedSnapshot(30)
      },
      {
        clientId: 'client-alpha',
        snapshot: createPopulatedSnapshot(10)
      },
      {
        clientId: 'client-bravo',
        snapshot: createAuthoritativeClientReplicationDiagnosticsSnapshot()
      }
    ]);

    expect(formatAuthoritativeClientReplicationDiagnosticsLogLines(payload)).toEqual([
      'ReplicationDiagnostics',
      'Aggregate: clients=3',
      'AggregateReplayChunks: dropped=40 | trimmed=42 | applied=44 | skipped=46',
      'AggregateReplayEntities: dropped=48 | trimmed=50 | applied=52 | skipped=54',
      'AggregateSendChunks: dropped=56 | trimmed=58 | forwarded=60',
      'AggregateSendEntities: dropped=62 | trimmed=64 | forwarded=66',
      'AggregateResync: replacedTiles=74 | replacedWalls=76 | spawned=68 | updated=70 | removed=72',
      'Clients:',
      'Client: client-charlie',
      '  ReplayLastProcessed: 30',
      '  ReplayChunks: dropped=30 | trimmed=31 | applied=32 | skipped=33',
      '  ReplayEntities: dropped=34 | trimmed=35 | applied=36 | skipped=37',
      '  SendLastStaged: 40',
      '  SendChunks: dropped=38 | trimmed=39 | forwarded=40',
      '  SendEntities: dropped=41 | trimmed=42 | forwarded=43',
      '  ResyncLastAppliedBaseline: tick=50 | entityCount=51 | replacedTiles=47 | replacedWalls=48',
      '  ResyncTotals: replacedTiles=47 | replacedWalls=48 | spawned=44 | updated=45 | removed=46',
      'Client: client-alpha',
      '  ReplayLastProcessed: 10',
      '  ReplayChunks: dropped=10 | trimmed=11 | applied=12 | skipped=13',
      '  ReplayEntities: dropped=14 | trimmed=15 | applied=16 | skipped=17',
      '  SendLastStaged: 20',
      '  SendChunks: dropped=18 | trimmed=19 | forwarded=20',
      '  SendEntities: dropped=21 | trimmed=22 | forwarded=23',
      '  ResyncLastAppliedBaseline: tick=30 | entityCount=31 | replacedTiles=27 | replacedWalls=28',
      '  ResyncTotals: replacedTiles=27 | replacedWalls=28 | spawned=24 | updated=25 | removed=26',
      'Client: client-bravo',
      '  ReplayLastProcessed: n/a',
      '  ReplayChunks: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      '  ReplayEntities: dropped=0 | trimmed=0 | applied=0 | skipped=0',
      '  SendLastStaged: n/a',
      '  SendChunks: dropped=0 | trimmed=0 | forwarded=0',
      '  SendEntities: dropped=0 | trimmed=0 | forwarded=0',
      '  ResyncLastAppliedBaseline: n/a',
      '  ResyncTotals: replacedTiles=0 | replacedWalls=0 | spawned=0 | updated=0 | removed=0'
    ]);
  });
});
