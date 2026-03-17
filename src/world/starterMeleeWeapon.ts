import type { WorldAabb } from './collision';
import {
  applyHostileSlimeDamage,
  cloneHostileSlimeState,
  getHostileSlimeAabb,
  type HostileSlimeFacing,
  type HostileSlimeState
} from './hostileSlimeState';
import { getPlayerAabb, type PlayerState } from './playerState';

export const STARTER_MELEE_WEAPON_ITEM_ID = 'sword';
export const STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS = 0.08;
export const STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS = 0.1;
export const STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS = 0.14;
export const DEFAULT_STARTER_MELEE_WEAPON_DAMAGE = 10;
export const DEFAULT_STARTER_MELEE_WEAPON_TARGET_HIT_COOLDOWN_SECONDS = 0.2;
export const DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_X = 180;
export const DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_Y = 140;
export const DEFAULT_STARTER_MELEE_WEAPON_REACH = 26;
export const DEFAULT_STARTER_MELEE_WEAPON_FRONT_OVERLAP = 2;
export const DEFAULT_STARTER_MELEE_WEAPON_VERTICAL_INSET = 4;

export type StarterMeleeWeaponSwingPhase = 'windup' | 'active' | 'recovery';

export interface StarterMeleeWeaponSwingState {
  phase: StarterMeleeWeaponSwingPhase;
  secondsRemaining: number;
  facing: HostileSlimeFacing;
}

export interface StarterMeleeWeaponTargetHitCooldownState {
  entityId: number;
  secondsRemaining: number;
}

export interface StarterMeleeWeaponState {
  activeSwing: StarterMeleeWeaponSwingState | null;
  targetHitCooldowns: StarterMeleeWeaponTargetHitCooldownState[];
}

export interface StarterMeleeWeaponHostileSlimeTarget {
  entityId: number;
  state: HostileSlimeState;
}

export interface StarterMeleeWeaponHitEvent {
  entityId: number;
  nextHostileSlimeState: HostileSlimeState;
}

export interface TryStartStarterMeleeWeaponSwingResult {
  state: StarterMeleeWeaponState;
  started: boolean;
}

export interface StepStarterMeleeWeaponStateOptions {
  playerState: PlayerState | null;
  hostileSlimes: readonly StarterMeleeWeaponHostileSlimeTarget[];
  fixedDtSeconds: number;
  damage?: number;
  targetHitCooldownSeconds?: number;
  knockbackSpeedX?: number;
  knockbackSpeedY?: number;
  reach?: number;
  frontOverlap?: number;
  verticalInset?: number;
}

export interface StepStarterMeleeWeaponStateResult {
  state: StarterMeleeWeaponState;
  hitEvents: StarterMeleeWeaponHitEvent[];
}

const expectFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return normalizedValue;
};

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return normalizedValue;
};

const cloneStarterMeleeWeaponSwingState = (
  swing: StarterMeleeWeaponSwingState | null
): StarterMeleeWeaponSwingState | null =>
  swing === null
    ? null
    : {
        phase: swing.phase,
        secondsRemaining: swing.secondsRemaining,
        facing: swing.facing
      };

const cloneStarterMeleeWeaponTargetHitCooldownState = (
  cooldown: StarterMeleeWeaponTargetHitCooldownState
): StarterMeleeWeaponTargetHitCooldownState => ({
  entityId: cooldown.entityId,
  secondsRemaining: cooldown.secondsRemaining
});

const createStarterMeleeWeaponSwingState = (
  facing: HostileSlimeFacing
): StarterMeleeWeaponSwingState => ({
  phase: 'windup',
  secondsRemaining: STARTER_MELEE_WEAPON_SWING_WINDUP_SECONDS,
  facing
});

const stepTargetHitCooldowns = (
  cooldowns: readonly StarterMeleeWeaponTargetHitCooldownState[],
  fixedDtSeconds: number
): StarterMeleeWeaponTargetHitCooldownState[] =>
  cooldowns
    .map((cooldown) => ({
      entityId: cooldown.entityId,
      secondsRemaining: Math.max(
        0,
        cooldown.secondsRemaining - expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds')
      )
    }))
    .filter((cooldown) => cooldown.secondsRemaining > 0);

const doesAabbOverlap = (left: WorldAabb, right: WorldAabb): boolean =>
  left.minX < right.maxX &&
  left.maxX > right.minX &&
  left.minY < right.maxY &&
  left.maxY > right.minY;

const createStarterMeleeWeaponHitbox = (
  playerState: PlayerState,
  facing: HostileSlimeFacing,
  reach: number,
  frontOverlap: number,
  verticalInset: number
): WorldAabb => {
  const playerAabb = getPlayerAabb(playerState);
  const minY = playerAabb.minY + verticalInset;
  const maxY = playerAabb.maxY - verticalInset;
  if (facing === 'left') {
    return {
      minX: playerAabb.minX - reach,
      maxX: playerAabb.minX + frontOverlap,
      minY,
      maxY
    };
  }

  return {
    minX: playerAabb.maxX - frontOverlap,
    maxX: playerAabb.maxX + reach,
    minY,
    maxY
  };
};

const applyStarterMeleeWeaponKnockback = (
  slimeState: HostileSlimeState,
  facing: HostileSlimeFacing,
  knockbackSpeedX: number,
  knockbackSpeedY: number
): HostileSlimeState => {
  const nextSlimeState = cloneHostileSlimeState(slimeState);
  const horizontalSign = facing === 'left' ? -1 : 1;
  nextSlimeState.velocity = {
    x: horizontalSign * knockbackSpeedX,
    y: -knockbackSpeedY
  };
  nextSlimeState.grounded = false;
  nextSlimeState.facing = facing;
  nextSlimeState.launchKind = null;
  return nextSlimeState;
};

const applyStarterMeleeWeaponHit = (
  slimeState: HostileSlimeState,
  facing: HostileSlimeFacing,
  knockbackSpeedX: number,
  knockbackSpeedY: number,
  damage: number
): HostileSlimeState =>
  applyHostileSlimeDamage(
    applyStarterMeleeWeaponKnockback(slimeState, facing, knockbackSpeedX, knockbackSpeedY),
    damage
  );

const resolveStarterMeleeWeaponHitEvents = (
  playerState: PlayerState,
  facing: HostileSlimeFacing,
  hostileSlimes: readonly StarterMeleeWeaponHostileSlimeTarget[],
  targetHitCooldowns: StarterMeleeWeaponTargetHitCooldownState[],
  damage: number,
  targetHitCooldownSeconds: number,
  knockbackSpeedX: number,
  knockbackSpeedY: number,
  reach: number,
  frontOverlap: number,
  verticalInset: number
): StarterMeleeWeaponHitEvent[] => {
  const hitbox = createStarterMeleeWeaponHitbox(
    playerState,
    facing,
    reach,
    frontOverlap,
    verticalInset
  );
  const hitEvents: StarterMeleeWeaponHitEvent[] = [];

  for (const hostileSlime of hostileSlimes) {
    if (targetHitCooldowns.some((cooldown) => cooldown.entityId === hostileSlime.entityId)) {
      continue;
    }
    if (!doesAabbOverlap(hitbox, getHostileSlimeAabb(hostileSlime.state))) {
      continue;
    }

    hitEvents.push({
      entityId: hostileSlime.entityId,
      nextHostileSlimeState: applyStarterMeleeWeaponHit(
        hostileSlime.state,
        facing,
        knockbackSpeedX,
        knockbackSpeedY,
        damage
      )
    });
    targetHitCooldowns.push({
      entityId: hostileSlime.entityId,
      secondsRemaining: targetHitCooldownSeconds
    });
  }

  return hitEvents;
};

export const createStarterMeleeWeaponState = (): StarterMeleeWeaponState => ({
  activeSwing: null,
  targetHitCooldowns: []
});

export const cloneStarterMeleeWeaponState = (
  state: StarterMeleeWeaponState
): StarterMeleeWeaponState => ({
  activeSwing: cloneStarterMeleeWeaponSwingState(state.activeSwing),
  targetHitCooldowns: state.targetHitCooldowns.map(cloneStarterMeleeWeaponTargetHitCooldownState)
});

export const tryStartStarterMeleeWeaponSwing = (
  state: StarterMeleeWeaponState,
  facing: HostileSlimeFacing
): TryStartStarterMeleeWeaponSwingResult => {
  if (state.activeSwing !== null) {
    return {
      state: cloneStarterMeleeWeaponState(state),
      started: false
    };
  }

  return {
    state: {
      activeSwing: createStarterMeleeWeaponSwingState(facing),
      targetHitCooldowns: state.targetHitCooldowns.map(cloneStarterMeleeWeaponTargetHitCooldownState)
    },
    started: true
  };
};

export const stepStarterMeleeWeaponState = (
  state: StarterMeleeWeaponState,
  options: StepStarterMeleeWeaponStateOptions
): StepStarterMeleeWeaponStateResult => {
  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  const damage = expectPositiveFiniteNumber(
    options.damage ?? DEFAULT_STARTER_MELEE_WEAPON_DAMAGE,
    'options.damage'
  );
  const targetHitCooldownSeconds = expectPositiveFiniteNumber(
    options.targetHitCooldownSeconds ?? DEFAULT_STARTER_MELEE_WEAPON_TARGET_HIT_COOLDOWN_SECONDS,
    'options.targetHitCooldownSeconds'
  );
  const knockbackSpeedX = expectPositiveFiniteNumber(
    options.knockbackSpeedX ?? DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_X,
    'options.knockbackSpeedX'
  );
  const knockbackSpeedY = expectPositiveFiniteNumber(
    options.knockbackSpeedY ?? DEFAULT_STARTER_MELEE_WEAPON_KNOCKBACK_SPEED_Y,
    'options.knockbackSpeedY'
  );
  const reach = expectPositiveFiniteNumber(
    options.reach ?? DEFAULT_STARTER_MELEE_WEAPON_REACH,
    'options.reach'
  );
  const frontOverlap = expectNonNegativeFiniteNumber(
    options.frontOverlap ?? DEFAULT_STARTER_MELEE_WEAPON_FRONT_OVERLAP,
    'options.frontOverlap'
  );
  const verticalInset = expectNonNegativeFiniteNumber(
    options.verticalInset ?? DEFAULT_STARTER_MELEE_WEAPON_VERTICAL_INSET,
    'options.verticalInset'
  );

  const nextState = cloneStarterMeleeWeaponState(state);
  nextState.targetHitCooldowns = stepTargetHitCooldowns(nextState.targetHitCooldowns, fixedDtSeconds);

  if (options.playerState === null) {
    nextState.activeSwing = null;
    return {
      state: nextState,
      hitEvents: []
    };
  }

  let activeSwing = nextState.activeSwing;
  if (activeSwing === null) {
    return {
      state: nextState,
      hitEvents: []
    };
  }

  let remainingDtSeconds = fixedDtSeconds;
  let didResolveActiveHitsThisStep = false;
  const hitEvents: StarterMeleeWeaponHitEvent[] = [];
  while (activeSwing !== null && remainingDtSeconds > 0) {
    if (activeSwing.phase === 'windup') {
      if (remainingDtSeconds < activeSwing.secondsRemaining) {
        activeSwing.secondsRemaining -= remainingDtSeconds;
        remainingDtSeconds = 0;
        break;
      }

      remainingDtSeconds -= activeSwing.secondsRemaining;
      activeSwing = {
        phase: 'active',
        secondsRemaining: STARTER_MELEE_WEAPON_SWING_ACTIVE_SECONDS,
        facing: activeSwing.facing
      };
      nextState.activeSwing = activeSwing;
      continue;
    }

    if (activeSwing.phase === 'active') {
      if (!didResolveActiveHitsThisStep) {
        hitEvents.push(
          ...resolveStarterMeleeWeaponHitEvents(
            options.playerState,
            activeSwing.facing,
            options.hostileSlimes,
            nextState.targetHitCooldowns,
            damage,
            targetHitCooldownSeconds,
            knockbackSpeedX,
            knockbackSpeedY,
            reach,
            frontOverlap,
            verticalInset
          )
        );
        didResolveActiveHitsThisStep = true;
      }

      if (remainingDtSeconds < activeSwing.secondsRemaining) {
        activeSwing.secondsRemaining -= remainingDtSeconds;
        remainingDtSeconds = 0;
        break;
      }

      remainingDtSeconds -= activeSwing.secondsRemaining;
      activeSwing = {
        phase: 'recovery',
        secondsRemaining: STARTER_MELEE_WEAPON_SWING_RECOVERY_SECONDS,
        facing: activeSwing.facing
      };
      nextState.activeSwing = activeSwing;
      continue;
    }

    if (remainingDtSeconds < activeSwing.secondsRemaining) {
      activeSwing.secondsRemaining -= remainingDtSeconds;
      remainingDtSeconds = 0;
      break;
    }

    remainingDtSeconds -= activeSwing.secondsRemaining;
    activeSwing = null;
    nextState.activeSwing = null;
  }

  if (
    activeSwing !== null &&
    activeSwing.phase === 'active' &&
    !didResolveActiveHitsThisStep &&
    fixedDtSeconds > 0
  ) {
    hitEvents.push(
      ...resolveStarterMeleeWeaponHitEvents(
        options.playerState,
        activeSwing.facing,
        options.hostileSlimes,
        nextState.targetHitCooldowns,
        damage,
        targetHitCooldownSeconds,
        knockbackSpeedX,
        knockbackSpeedY,
        reach,
        frontOverlap,
        verticalInset
      )
    );
  }

  nextState.activeSwing = activeSwing;
  return {
    state: nextState,
    hitEvents
  };
};
