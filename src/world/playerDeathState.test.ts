import { describe, expect, it } from 'vitest';

import {
  createPlayerDeathState,
  DEFAULT_PLAYER_DEATH_RESPAWN_SECONDS,
  isPlayerDeathStateRespawnReady,
  stepPlayerDeathState
} from './playerDeathState';

describe('createPlayerDeathState', () => {
  it('defaults to the shared short respawn countdown', () => {
    expect(createPlayerDeathState()).toEqual({
      respawnSecondsRemaining: DEFAULT_PLAYER_DEATH_RESPAWN_SECONDS
    });
  });

  it('rejects negative countdown values', () => {
    expect(() => createPlayerDeathState(-0.1)).toThrowError(
      /respawnSecondsRemaining must be a non-negative finite number/
    );
  });
});

describe('stepPlayerDeathState', () => {
  it('counts down toward zero without going negative', () => {
    const stepped = stepPlayerDeathState(createPlayerDeathState(0.75), 0.5);
    expect(stepped).toEqual({
      respawnSecondsRemaining: 0.25
    });
    expect(isPlayerDeathStateRespawnReady(stepped)).toBe(false);

    const clamped = stepPlayerDeathState(stepped, 1);
    expect(clamped).toEqual({
      respawnSecondsRemaining: 0
    });
    expect(isPlayerDeathStateRespawnReady(clamped)).toBe(true);
  });
});
