import { describe, expect, it } from 'vitest';

import {
  cloneHostileSlimeState,
  createHostileSlimeState,
  createHostileSlimeStateFromSpawn,
  DEFAULT_HOSTILE_SLIME_HEIGHT,
  DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
  DEFAULT_HOSTILE_SLIME_WIDTH,
  getHostileSlimeAabb
} from './hostileSlimeState';

describe('hostileSlimeState', () => {
  it('creates a grounded hostile slime with default size and zeroed velocity', () => {
    expect(
      createHostileSlimeState({
        position: { x: 40, y: 32 }
      })
    ).toEqual({
      position: { x: 40, y: 32 },
      velocity: { x: 0, y: 0 },
      size: {
        width: DEFAULT_HOSTILE_SLIME_WIDTH,
        height: DEFAULT_HOSTILE_SLIME_HEIGHT
      },
      grounded: true,
      facing: 'left',
      hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
      launchKind: null
    });
  });

  it('creates a hostile slime from grounded spawn output while preserving spawn size', () => {
    const state = createHostileSlimeStateFromSpawn(
      {
        anchorTileX: 12,
        standingTileY: 0,
        x: 200,
        y: 0,
        aabb: {
          minX: 190,
          minY: -12,
          maxX: 210,
          maxY: 0
        },
        support: {
          tileX: 12,
          tileY: 0,
          tileId: 3
        }
      },
      {
        facing: 'right'
      }
    );

    expect(state).toEqual({
      position: { x: 200, y: 0 },
      velocity: { x: 0, y: 0 },
      size: {
        width: DEFAULT_HOSTILE_SLIME_WIDTH,
        height: DEFAULT_HOSTILE_SLIME_HEIGHT
      },
      grounded: true,
      facing: 'right',
      hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
      launchKind: null
    });
    expect(getHostileSlimeAabb(state)).toEqual({
      minX: 190,
      minY: -12,
      maxX: 210,
      maxY: 0
    });
  });

  it('clones hostile slime state into detached nested vectors and size objects', () => {
    const state = createHostileSlimeState({
      position: { x: -24, y: -8 },
      velocity: { x: 18, y: -42 },
      size: { width: 22, height: 14 },
      grounded: false,
      facing: 'right',
      hopCooldownTicksRemaining: 6,
      launchKind: 'step-hop'
    });

    const cloned = cloneHostileSlimeState(state);

    expect(cloned).toEqual(state);
    expect(cloned).not.toBe(state);
    expect(cloned.position).not.toBe(state.position);
    expect(cloned.velocity).not.toBe(state.velocity);
    expect(cloned.size).not.toBe(state.size);
  });
});
