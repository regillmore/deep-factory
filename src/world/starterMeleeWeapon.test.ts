import { describe, expect, it } from 'vitest';

import { createHostileSlimeState } from './hostileSlimeState';
import { createPlayerState } from './playerState';
import {
  createStarterMeleeWeaponState,
  DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_X,
  DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_Y,
  STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS,
  STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS,
  STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS,
  stepStarterMeleeWeaponState,
  tryStartStarterMeleeWeaponSwing
} from './starterMeleeWeapon';

describe('starterMeleeWeapon', () => {
  it('starts one swing at a time and preserves the chosen facing', () => {
    const started = tryStartStarterMeleeWeaponSwing(createStarterMeleeWeaponState(), 'right');
    const blocked = tryStartStarterMeleeWeaponSwing(started.state, 'left');

    expect(started).toEqual({
      state: {
        activeSwing: {
          phase: 'windup',
          secondsRemaining: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS,
          facing: 'right'
        },
        targetHitCooldowns: []
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
    const started = tryStartStarterMeleeWeaponSwing(createStarterMeleeWeaponState(), 'right');

    const afterHalfWindup = stepStarterMeleeWeaponState(started.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS * 0.5
    });
    const afterWindup = stepStarterMeleeWeaponState(afterHalfWindup.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS * 0.5
    });
    const afterHalfActive = stepStarterMeleeWeaponState(afterWindup.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS * 0.5
    });
    const afterActive = stepStarterMeleeWeaponState(afterHalfActive.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS * 0.5
    });
    const afterRecovery = stepStarterMeleeWeaponState(afterActive.state, {
      playerState,
      hostileSlimes: [],
      fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS
    });

    expect(afterHalfWindup.hitEvents).toEqual([]);
    expect(afterHalfWindup.state.activeSwing).toEqual({
      phase: 'windup',
      secondsRemaining: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS * 0.5,
      facing: 'right'
    });
    expect(afterWindup.state.activeSwing).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS,
      facing: 'right'
    });
    expect(afterHalfActive.state.activeSwing).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS * 0.5,
      facing: 'right'
    });
    expect(afterActive.state.activeSwing).toEqual({
      phase: 'recovery',
      secondsRemaining: STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS,
      facing: 'right'
    });
    expect(afterRecovery.state.activeSwing).toBeNull();
  });

  it('hits only slimes in front of the player and applies directional knockback during the active window', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      facing: 'right'
    });
    const started = tryStartStarterMeleeWeaponSwing(createStarterMeleeWeaponState(), 'right');

    const stepResult = stepStarterMeleeWeaponState(started.state, {
      playerState,
      hostileSlimes: [
        {
          entityId: 1,
          state: createHostileSlimeState({
            position: { x: 24, y: 0 },
            grounded: true,
            facing: 'left'
          })
        },
        {
          entityId: 2,
          state: createHostileSlimeState({
            position: { x: -8, y: 0 },
            grounded: true,
            facing: 'right'
          })
        }
      ],
      fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS + 0.01
    });

    expect(stepResult.hitEvents).toEqual([
      {
        entityId: 1,
        nextHostileSlimeState: createHostileSlimeState({
          position: { x: 24, y: 0 },
          velocity: {
            x: DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_X,
            y: -DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_Y
          },
          grounded: false,
          facing: 'right',
          launchKind: null
        })
      }
    ]);
    expect(stepResult.state.targetHitCooldowns).toEqual([
      {
        entityId: 1,
        secondsRemaining: 0.2
      }
    ]);
    expect(stepResult.state.activeSwing).toEqual({
      phase: 'active',
      secondsRemaining: STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS - 0.01,
      facing: 'right'
    });
  });

  it('uses per-target cooldowns to block immediate repeat hits and allows later swings after expiry', () => {
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
    const targetHitCooldownSeconds = 1;
    const firstHit = stepStarterMeleeWeaponState(
      tryStartStarterMeleeWeaponSwing(createStarterMeleeWeaponState(), 'right').state,
      {
        playerState,
        hostileSlimes: [hostileSlime],
        fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS + 0.01,
        targetHitCooldownSeconds
      }
    );
    const finishedFirstSwing = stepStarterMeleeWeaponState(firstHit.state, {
      playerState,
      hostileSlimes: [hostileSlime],
      fixedDtSeconds:
        STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS -
        0.01 +
        STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS,
      targetHitCooldownSeconds
    });
    const secondSwingStart = tryStartStarterMeleeWeaponSwing(finishedFirstSwing.state, 'right');
    const blockedSecondHit = stepStarterMeleeWeaponState(secondSwingStart.state, {
      playerState,
      hostileSlimes: [hostileSlime],
      fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS + 0.01,
      targetHitCooldownSeconds
    });
    const finishedBlockedSecondSwing = stepStarterMeleeWeaponState(blockedSecondHit.state, {
      playerState,
      hostileSlimes: [hostileSlime],
      fixedDtSeconds:
        STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS -
        0.01 +
        STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS,
      targetHitCooldownSeconds
    });
    const afterCooldownExpiry = stepStarterMeleeWeaponState(finishedBlockedSecondSwing.state, {
      playerState,
      hostileSlimes: [hostileSlime],
      fixedDtSeconds: 0.46,
      targetHitCooldownSeconds
    });
    const thirdSwingStart = tryStartStarterMeleeWeaponSwing(afterCooldownExpiry.state, 'right');
    const thirdHit = stepStarterMeleeWeaponState(thirdSwingStart.state, {
      playerState,
      hostileSlimes: [hostileSlime],
      fixedDtSeconds: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS + 0.01,
      targetHitCooldownSeconds
    });

    expect(firstHit.hitEvents).toHaveLength(1);
    expect(blockedSecondHit.hitEvents).toEqual([]);
    expect(blockedSecondHit.state.targetHitCooldowns).toHaveLength(1);
    expect(blockedSecondHit.state.targetHitCooldowns[0]?.entityId).toBe(1);
    expect(blockedSecondHit.state.targetHitCooldowns[0]?.secondsRemaining).toBeCloseTo(0.68, 6);
    expect(thirdHit.hitEvents).toHaveLength(1);
  });
});
