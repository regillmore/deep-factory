import { describe, expect, it } from 'vitest';

import { createHostileSlimeState, DEFAULT_HOSTILE_SLIME_HEALTH } from './hostileSlimeState';
import { createPlayerState } from './playerState';
import {
  createStarterSpearState,
  DEFAULT_STARTER_SPEAR_DAMAGE,
  DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED,
  STARTER_SPEAR_THRUST_ACTIVE_SECONDS,
  STARTER_SPEAR_THRUST_RECOVERY_SECONDS,
  STARTER_SPEAR_THRUST_WINDUP_SECONDS,
  stepStarterSpearState,
  tryStartStarterSpearThrust
} from './starterSpear';

describe('starterSpear', () => {
  it('starts one thrust at a time and normalizes the requested aim direction', () => {
    const started = tryStartStarterSpearThrust(createStarterSpearState(), {
      x: 4,
      y: -3
    });
    const blocked = tryStartStarterSpearThrust(started.state, {
      x: -1,
      y: 0
    });

    expect(started).toEqual({
      state: {
        activeThrust: {
          phase: 'windup',
          secondsRemaining: STARTER_SPEAR_THRUST_WINDUP_SECONDS,
          direction: {
            x: 0.8,
            y: -0.6
          },
          hitEntityIds: []
        }
      },
      started: true
    });
    expect(blocked).toEqual({
      state: started.state,
      started: false
    });
  });

  it('steps thrusts through windup, active, and recovery before returning to idle', () => {
    const playerState = createPlayerState();
    const started = tryStartStarterSpearThrust(createStarterSpearState(), {
      x: 1,
      y: 0
    });

    const afterHalfWindup = stepStarterSpearState(started.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_SPEAR_THRUST_WINDUP_SECONDS * 0.5
    });
    const afterWindup = stepStarterSpearState(afterHalfWindup.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_SPEAR_THRUST_WINDUP_SECONDS * 0.5
    });
    const afterHalfActive = stepStarterSpearState(afterWindup.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_SPEAR_THRUST_ACTIVE_SECONDS * 0.5
    });
    const afterActive = stepStarterSpearState(afterHalfActive.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_SPEAR_THRUST_ACTIVE_SECONDS * 0.5
    });
    const afterRecovery = stepStarterSpearState(afterActive.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_SPEAR_THRUST_RECOVERY_SECONDS
    });

    expect(afterHalfWindup.hitEvents).toEqual([]);
    expect(afterHalfWindup.state.activeThrust).toEqual({
      phase: 'windup',
      secondsRemaining: STARTER_SPEAR_THRUST_WINDUP_SECONDS * 0.5,
      direction: {
        x: 1,
        y: 0
      },
      hitEntityIds: []
    });
    expect(afterWindup.state.activeThrust).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_SPEAR_THRUST_ACTIVE_SECONDS,
      direction: {
        x: 1,
        y: 0
      },
      hitEntityIds: []
    });
    expect(afterHalfActive.state.activeThrust).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_SPEAR_THRUST_ACTIVE_SECONDS * 0.5,
      direction: {
        x: 1,
        y: 0
      },
      hitEntityIds: []
    });
    expect(afterActive.state.activeThrust).toEqual({
      phase: 'recovery',
      secondsRemaining: STARTER_SPEAR_THRUST_RECOVERY_SECONDS,
      direction: {
        x: 1,
        y: 0
      },
      hitEntityIds: []
    });
    expect(afterRecovery.state.activeThrust).toBeNull();
  });

  it('hits only slimes intersecting the aimed thrust path and applies directional knockback', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const started = tryStartStarterSpearThrust(createStarterSpearState(), {
      x: 4,
      y: -3
    });

    const stepResult = stepStarterSpearState(started.state, {
      playerState,
      hostileSlimes: [
        {
          entityId: 1,
          state: createHostileSlimeState({
            position: { x: 32, y: 2 },
            grounded: true,
            facing: 'left'
          })
        },
        {
          entityId: 2,
          state: createHostileSlimeState({
            position: { x: 32, y: 40 },
            grounded: true,
            facing: 'left'
          })
        }
      ],
      fixedDtSeconds: STARTER_SPEAR_THRUST_WINDUP_SECONDS
    });

    expect(stepResult.hitEvents).toEqual([
      {
        entityId: 1,
        nextHostileSlimeState: createHostileSlimeState({
          position: { x: 32, y: 2 },
          velocity: {
            x: DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED * 0.8,
            y: -DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED * 0.6
          },
          health: DEFAULT_HOSTILE_SLIME_HEALTH - DEFAULT_STARTER_SPEAR_DAMAGE,
          grounded: false,
          facing: 'right',
          launchKind: null
        })
      }
    ]);
    expect(stepResult.state.activeThrust).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_SPEAR_THRUST_ACTIVE_SECONDS,
      direction: {
        x: 0.8,
        y: -0.6
      },
      hitEntityIds: [1]
    });
  });

  it('does not hit slimes beyond the maximum spear reach', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      facing: 'right'
    });
    const started = tryStartStarterSpearThrust(createStarterSpearState(), {
      x: 1,
      y: 0
    });

    const stepResult = stepStarterSpearState(started.state, {
      playerState,
      hostileSlimes: [
        {
          entityId: 1,
          state: createHostileSlimeState({
            position: { x: 70, y: 0 },
            grounded: true,
            facing: 'left'
          })
        }
      ],
      fixedDtSeconds: STARTER_SPEAR_THRUST_WINDUP_SECONDS
    });

    expect(stepResult.hitEvents).toEqual([]);
    expect(stepResult.state.activeThrust?.hitEntityIds).toEqual([]);
  });

  it('hits each target at most once per active thrust and allows a later thrust to hit again', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      facing: 'right'
    });
    const hostileSlime = {
      entityId: 1,
      state: createHostileSlimeState({
        position: { x: 24, y: 0 },
        grounded: true,
        facing: 'left'
      })
    };

    const firstHit = stepStarterSpearState(
      tryStartStarterSpearThrust(createStarterSpearState(), {
        x: 1,
        y: 0
      }).state,
      {
        playerState,
        hostileSlimes: [hostileSlime],
        fixedDtSeconds: STARTER_SPEAR_THRUST_WINDUP_SECONDS
      }
    );
    const blockedRepeatHit = stepStarterSpearState(firstHit.state, {
      playerState,
      hostileSlimes: [
        {
          entityId: hostileSlime.entityId,
          state: firstHit.hitEvents[0]!.nextHostileSlimeState
        }
      ],
      fixedDtSeconds: STARTER_SPEAR_THRUST_ACTIVE_SECONDS * 0.5
    });
    const finishedFirstThrust = stepStarterSpearState(blockedRepeatHit.state, {
      playerState,
      hostileSlimes: [
        {
          entityId: hostileSlime.entityId,
          state: firstHit.hitEvents[0]!.nextHostileSlimeState
        }
      ],
      fixedDtSeconds:
        STARTER_SPEAR_THRUST_ACTIVE_SECONDS * 0.5 + STARTER_SPEAR_THRUST_RECOVERY_SECONDS
    });
    const secondHit = stepStarterSpearState(
      tryStartStarterSpearThrust(finishedFirstThrust.state, {
        x: 1,
        y: 0
      }).state,
      {
        playerState,
        hostileSlimes: [
          {
            entityId: hostileSlime.entityId,
            state: firstHit.hitEvents[0]!.nextHostileSlimeState
          }
        ],
        fixedDtSeconds: STARTER_SPEAR_THRUST_WINDUP_SECONDS
      }
    );

    expect(firstHit.hitEvents).toHaveLength(1);
    expect(blockedRepeatHit.hitEvents).toEqual([]);
    expect(blockedRepeatHit.state.activeThrust?.hitEntityIds).toEqual([1]);
    expect(secondHit.hitEvents).toHaveLength(1);
  });
});
