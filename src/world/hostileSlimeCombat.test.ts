import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HOSTILE_SLIME_CONTACT_DAMAGE,
  DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS,
  doesHostileSlimeOverlapPlayer,
  resolveHostileSlimePlayerContact,
  resolveHostileSlimePlayerContactWithEvent
} from './hostileSlimeCombat';
import { createHostileSlimeState } from './hostileSlimeState';
import { createPlayerState } from './playerState';

describe('hostileSlimeCombat', () => {
  it('treats hostile-slime edge contact as non-overlap and interior intersection as contact', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });

    const edgeTouchingSlime = createHostileSlimeState({
      position: { x: 24, y: 0 }
    });
    const overlappingSlime = createHostileSlimeState({
      position: { x: 23.5, y: 0 }
    });

    expect(doesHostileSlimeOverlapPlayer(playerState, edgeTouchingSlime)).toBe(false);
    expect(doesHostileSlimeOverlapPlayer(playerState, overlappingSlime)).toBe(true);
  });

  it('applies one hostile-slime contact hit, reports damage, and starts invulnerability when overlap begins', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      health: 80
    });
    const slimeState = createHostileSlimeState({
      position: { x: 8, y: 0 }
    });

    const resolution = resolveHostileSlimePlayerContactWithEvent(playerState, [slimeState]);
    const damagedPlayerState = resolveHostileSlimePlayerContact(playerState, [slimeState]);

    expect(resolution).toEqual({
      nextPlayerState: {
        ...playerState,
        health: 80 - DEFAULT_HOSTILE_SLIME_CONTACT_DAMAGE,
        hostileContactInvulnerabilitySecondsRemaining:
          DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS
      },
      event: {
        damageApplied: DEFAULT_HOSTILE_SLIME_CONTACT_DAMAGE,
        blockedByInvulnerability: false
      }
    });
    expect(damagedPlayerState).toEqual(resolution.nextPlayerState);
    expect(damagedPlayerState).not.toBe(playerState);
  });

  it('reports blocked overlap during invulnerability and still measures clamped nonlethal damage', () => {
    const slimeState = createHostileSlimeState({
      position: { x: 8, y: 0 }
    });
    const invulnerablePlayerState = createPlayerState({
      position: { x: 8, y: 0 },
      health: 80,
      hostileContactInvulnerabilitySecondsRemaining: 0.2
    });

    expect(resolveHostileSlimePlayerContactWithEvent(invulnerablePlayerState, [slimeState])).toEqual({
      nextPlayerState: invulnerablePlayerState,
      event: {
        damageApplied: 0,
        blockedByInvulnerability: true
      }
    });

    const nearLethalPlayerState = createPlayerState({
      position: { x: 8, y: 0 },
      health: 3
    });
    const clampedResolution = resolveHostileSlimePlayerContactWithEvent(nearLethalPlayerState, [
      slimeState,
      createHostileSlimeState({
        position: { x: 9, y: 0 }
      })
    ]);
    const clampedPlayerState = resolveHostileSlimePlayerContact(nearLethalPlayerState, [
      slimeState,
      createHostileSlimeState({
        position: { x: 9, y: 0 }
      })
    ]);

    expect(clampedPlayerState.health).toBe(1);
    expect(clampedPlayerState.hostileContactInvulnerabilitySecondsRemaining).toBe(
      DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS
    );
    expect(clampedResolution).toEqual({
      nextPlayerState: clampedPlayerState,
      event: {
        damageApplied: 2,
        blockedByInvulnerability: false
      }
    });
  });
});
