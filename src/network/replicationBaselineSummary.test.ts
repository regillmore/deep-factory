import { describe, expect, it } from 'vitest';

import { ENTITY_SNAPSHOT_MESSAGE_KIND } from './protocol';
import type { AppliedAuthoritativeReplicatedStateBaselineResult } from './replicationBaseline';
import { summarizeAppliedAuthoritativeReplicatedStateBaseline } from './replicationBaselineSummary';

describe('summarizeAppliedAuthoritativeReplicatedStateBaseline', () => {
  it('reduces baseline world and entity replacement results into counts while preserving baseline tick metadata', () => {
    const result: AppliedAuthoritativeReplicatedStateBaselineResult = {
      worldReplacementCounts: {
        replacedTiles: 7,
        replacedWalls: 3
      },
      entityReplacementSummary: {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        tick: 14,
        entityCount: 3,
        spawnedEntityIds: [9, 3],
        updatedEntityIds: [7],
        removedEntityIds: [5, 4]
      }
    };

    expect(summarizeAppliedAuthoritativeReplicatedStateBaseline(result)).toEqual({
      baseline: {
        tick: 14,
        entityCount: 3
      },
      world: {
        replacedTiles: 7,
        replacedWalls: 3
      },
      entities: {
        spawned: 2,
        updated: 1,
        removed: 2
      }
    });
  });

  it('returns zero entity counts for an empty applied baseline snapshot', () => {
    const result: AppliedAuthoritativeReplicatedStateBaselineResult = {
      worldReplacementCounts: {
        replacedTiles: 0,
        replacedWalls: 0
      },
      entityReplacementSummary: {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        tick: 4,
        entityCount: 0,
        spawnedEntityIds: [],
        updatedEntityIds: [],
        removedEntityIds: []
      }
    };

    expect(summarizeAppliedAuthoritativeReplicatedStateBaseline(result)).toEqual({
      baseline: {
        tick: 4,
        entityCount: 0
      },
      world: {
        replacedTiles: 0,
        replacedWalls: 0
      },
      entities: {
        spawned: 0,
        updated: 0,
        removed: 0
      }
    });
  });
});
