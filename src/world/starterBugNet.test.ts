import { describe, expect, it } from 'vitest';

import { createPassiveBunnyState } from './passiveBunnyState';
import { createPlayerState } from './playerState';
import {
  createStarterBugNetState,
  STARTER_BUG_NET_SWING_ACTIVE_SECONDS,
  STARTER_BUG_NET_SWING_RECOVERY_SECONDS,
  STARTER_BUG_NET_SWING_WINDUP_SECONDS,
  stepStarterBugNetState,
  tryStartStarterBugNetSwing
} from './starterBugNet';

describe('starterBugNet', () => {
  it('starts one swing at a time and preserves the chosen facing', () => {
    const started = tryStartStarterBugNetSwing(createStarterBugNetState(), 'right');
    const blocked = tryStartStarterBugNetSwing(started.state, 'left');

    expect(started).toEqual({
      state: {
        activeSwing: {
          phase: 'windup',
          secondsRemaining: STARTER_BUG_NET_SWING_WINDUP_SECONDS,
          facing: 'right',
          capturedEntityId: null
        }
      },
      started: true
    });
    expect(blocked).toEqual({
      state: started.state,
      started: false
    });
  });

  it('steps swings through windup, active, and recovery before returning to idle', () => {
    const playerState = createPlayerState();
    const started = tryStartStarterBugNetSwing(createStarterBugNetState(), 'right');

    const afterHalfWindup = stepStarterBugNetState(started.state, {
      playerState,
      passiveBunnies: [],
      fixedDtSeconds: STARTER_BUG_NET_SWING_WINDUP_SECONDS * 0.5
    });
    const afterWindup = stepStarterBugNetState(afterHalfWindup.state, {
      playerState,
      passiveBunnies: [],
      fixedDtSeconds: STARTER_BUG_NET_SWING_WINDUP_SECONDS * 0.5
    });
    const afterHalfActive = stepStarterBugNetState(afterWindup.state, {
      playerState,
      passiveBunnies: [],
      fixedDtSeconds: STARTER_BUG_NET_SWING_ACTIVE_SECONDS * 0.5
    });
    const afterActive = stepStarterBugNetState(afterHalfActive.state, {
      playerState,
      passiveBunnies: [],
      fixedDtSeconds: STARTER_BUG_NET_SWING_ACTIVE_SECONDS * 0.5
    });
    const afterRecovery = stepStarterBugNetState(afterActive.state, {
      playerState,
      passiveBunnies: [],
      fixedDtSeconds: STARTER_BUG_NET_SWING_RECOVERY_SECONDS
    });

    expect(afterHalfWindup.captureEvents).toEqual([]);
    expect(afterHalfWindup.state.activeSwing).toEqual({
      phase: 'windup',
      secondsRemaining: STARTER_BUG_NET_SWING_WINDUP_SECONDS * 0.5,
      facing: 'right',
      capturedEntityId: null
    });
    expect(afterWindup.state.activeSwing).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_BUG_NET_SWING_ACTIVE_SECONDS,
      facing: 'right',
      capturedEntityId: null
    });
    expect(afterHalfActive.state.activeSwing).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_BUG_NET_SWING_ACTIVE_SECONDS * 0.5,
      facing: 'right',
      capturedEntityId: null
    });
    expect(afterActive.state.activeSwing).toEqual({
      phase: 'recovery',
      secondsRemaining: STARTER_BUG_NET_SWING_RECOVERY_SECONDS,
      facing: 'right',
      capturedEntityId: null
    });
    expect(afterRecovery.state.activeSwing).toBeNull();
  });

  it('captures only the nearest bunny in front of the player during the active window', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      facing: 'right'
    });
    const started = tryStartStarterBugNetSwing(createStarterBugNetState(), 'right');

    const stepResult = stepStarterBugNetState(started.state, {
      playerState,
      passiveBunnies: [
        {
          entityId: 2,
          state: createPassiveBunnyState({
            position: { x: 34, y: 0 },
            facing: 'left'
          })
        },
        {
          entityId: 1,
          state: createPassiveBunnyState({
            position: { x: 24, y: 0 },
            facing: 'left'
          })
        }
      ],
      fixedDtSeconds: STARTER_BUG_NET_SWING_WINDUP_SECONDS + 0.01
    });

    expect(stepResult.captureEvents).toEqual([{ entityId: 1 }]);
    expect(stepResult.state.activeSwing).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_BUG_NET_SWING_ACTIVE_SECONDS - 0.01,
      facing: 'right',
      capturedEntityId: 1
    });
  });

  it('does not capture bunnies behind the player or outside the bug-net reach', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      facing: 'right'
    });
    const started = tryStartStarterBugNetSwing(createStarterBugNetState(), 'right');

    const stepResult = stepStarterBugNetState(started.state, {
      playerState,
      passiveBunnies: [
        {
          entityId: 1,
          state: createPassiveBunnyState({
            position: { x: -8, y: 0 },
            facing: 'right'
          })
        },
        {
          entityId: 2,
          state: createPassiveBunnyState({
            position: { x: 72, y: 0 },
            facing: 'left'
          })
        }
      ],
      fixedDtSeconds: STARTER_BUG_NET_SWING_WINDUP_SECONDS
    });

    expect(stepResult.captureEvents).toEqual([]);
    expect(stepResult.state.activeSwing).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_BUG_NET_SWING_ACTIVE_SECONDS,
      facing: 'right',
      capturedEntityId: null
    });
  });

  it('captures at most one bunny per swing and allows a later swing to capture another', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      facing: 'right'
    });
    const nearbyBunnies = [
      {
        entityId: 1,
        state: createPassiveBunnyState({
          position: { x: 24, y: 0 },
          facing: 'left'
        })
      },
      {
        entityId: 2,
        state: createPassiveBunnyState({
          position: { x: 28, y: 0 },
          facing: 'left'
        })
      }
    ];

    const firstHit = stepStarterBugNetState(
      tryStartStarterBugNetSwing(createStarterBugNetState(), 'right').state,
      {
        playerState,
        passiveBunnies: nearbyBunnies,
        fixedDtSeconds: STARTER_BUG_NET_SWING_WINDUP_SECONDS
      }
    );
    const blockedRepeatHit = stepStarterBugNetState(firstHit.state, {
      playerState,
      passiveBunnies: nearbyBunnies,
      fixedDtSeconds: STARTER_BUG_NET_SWING_ACTIVE_SECONDS * 0.5
    });
    const finishedFirstSwing = stepStarterBugNetState(blockedRepeatHit.state, {
      playerState,
      passiveBunnies: nearbyBunnies,
      fixedDtSeconds:
        STARTER_BUG_NET_SWING_ACTIVE_SECONDS * 0.5 + STARTER_BUG_NET_SWING_RECOVERY_SECONDS
    });
    const secondHit = stepStarterBugNetState(
      tryStartStarterBugNetSwing(finishedFirstSwing.state, 'right').state,
      {
        playerState,
        passiveBunnies: nearbyBunnies.slice(1),
        fixedDtSeconds: STARTER_BUG_NET_SWING_WINDUP_SECONDS
      }
    );

    expect(firstHit.captureEvents).toEqual([{ entityId: 1 }]);
    expect(blockedRepeatHit.captureEvents).toEqual([]);
    expect(blockedRepeatHit.state.activeSwing?.capturedEntityId).toBe(1);
    expect(secondHit.captureEvents).toEqual([{ entityId: 2 }]);
  });
});
