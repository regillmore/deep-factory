import type { WorldAabb } from './collision';
import { getHostileSlimeAabb, type HostileSlimeState } from './hostileSlimeState';
import { clonePlayerState, getPlayerAabb, type PlayerState } from './playerState';

export interface ResolveHostileSlimePlayerContactOptions {
  contactDamage?: number;
  invulnerabilitySeconds?: number;
  minimumHealth?: number;
}

export interface HostileSlimePlayerContactEvent {
  damageApplied: number;
  blockedByInvulnerability: boolean;
}

export interface HostileSlimePlayerContactResolution {
  nextPlayerState: PlayerState;
  event: HostileSlimePlayerContactEvent | null;
}

export const DEFAULT_HOSTILE_SLIME_CONTACT_DAMAGE = 15;
export const DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS = 0.75;
export const DEFAULT_HOSTILE_SLIME_CONTACT_MINIMUM_HEALTH = 0;

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const doesAabbOverlap = (aabb: WorldAabb, other: WorldAabb): boolean =>
  aabb.minX < other.maxX &&
  aabb.maxX > other.minX &&
  aabb.minY < other.maxY &&
  aabb.maxY > other.minY;

export const doesHostileSlimeOverlapPlayer = (
  playerState: PlayerState,
  slimeState: HostileSlimeState
): boolean => doesAabbOverlap(getPlayerAabb(playerState), getHostileSlimeAabb(slimeState));

export const resolveHostileSlimePlayerContact = (
  playerState: PlayerState,
  hostileSlimes: readonly HostileSlimeState[],
  options: ResolveHostileSlimePlayerContactOptions = {}
): PlayerState =>
  resolveHostileSlimePlayerContactWithEvent(playerState, hostileSlimes, options).nextPlayerState;

export const resolveHostileSlimePlayerContactWithEvent = (
  playerState: PlayerState,
  hostileSlimes: readonly HostileSlimeState[],
  options: ResolveHostileSlimePlayerContactOptions = {}
): HostileSlimePlayerContactResolution => {
  const contactDamage = expectNonNegativeFiniteNumber(
    options.contactDamage ?? DEFAULT_HOSTILE_SLIME_CONTACT_DAMAGE,
    'options.contactDamage'
  );
  const invulnerabilitySeconds = expectNonNegativeFiniteNumber(
    options.invulnerabilitySeconds ?? DEFAULT_HOSTILE_SLIME_CONTACT_INVULNERABILITY_SECONDS,
    'options.invulnerabilitySeconds'
  );
  const minimumHealth = expectNonNegativeFiniteNumber(
    options.minimumHealth ?? DEFAULT_HOSTILE_SLIME_CONTACT_MINIMUM_HEALTH,
    'options.minimumHealth'
  );
  const hostileContactInvulnerabilitySecondsRemaining = expectNonNegativeFiniteNumber(
    playerState.hostileContactInvulnerabilitySecondsRemaining,
    'playerState.hostileContactInvulnerabilitySecondsRemaining'
  );
  const health = expectNonNegativeFiniteNumber(playerState.health, 'playerState.health');
  const playerAabb = getPlayerAabb(playerState);
  const isOverlappingAnySlime = hostileSlimes.some((slimeState) =>
    doesAabbOverlap(playerAabb, getHostileSlimeAabb(slimeState))
  );

  if (!isOverlappingAnySlime) {
    return {
      nextPlayerState: playerState,
      event: null
    };
  }

  if (hostileContactInvulnerabilitySecondsRemaining > 0) {
    return {
      nextPlayerState: playerState,
      event: {
        damageApplied: 0,
        blockedByInvulnerability: true
      }
    };
  }

  const nextPlayerState = clonePlayerState(playerState);
  nextPlayerState.health = Math.max(Math.min(health, minimumHealth), health - contactDamage);
  nextPlayerState.hostileContactInvulnerabilitySecondsRemaining = invulnerabilitySeconds;
  return {
    nextPlayerState,
    event: {
      damageApplied: Math.max(0, health - nextPlayerState.health),
      blockedByInvulnerability: false
    }
  };
};
