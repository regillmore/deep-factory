import { describe, expect, it } from 'vitest';

import { resolvePlayerDeathCauseFromDamageSequence } from './playerDeathCause';

describe('resolvePlayerDeathCauseFromDamageSequence', () => {
  it('returns null when the player survives the damage sequence', () => {
    expect(
      resolvePlayerDeathCauseFromDamageSequence(30, 5, [
        { source: 'lava', damageApplied: 25 }
      ])
    ).toBeNull();
  });

  it('resolves the latest lethal source from the ordered fixed-step damage sequence', () => {
    expect(
      resolvePlayerDeathCauseFromDamageSequence(30, 0, [
        { source: 'lava', damageApplied: 25 },
        { source: 'drowning', damageApplied: 5 },
        { source: 'fall', damageApplied: 12 }
      ])
    ).toEqual({
      source: 'drowning',
      damageApplied: 5
    });
  });

  it('resolves hostile contact when it is the lethal follow-up after earlier nonlethal damage', () => {
    expect(
      resolvePlayerDeathCauseFromDamageSequence(5, 0, [
        { source: 'hostile-contact', damageApplied: 15 }
      ])
    ).toEqual({
      source: 'hostile-contact',
      damageApplied: 15
    });
  });

  it('falls back to unknown when a lethal health drop has no matching known source', () => {
    expect(resolvePlayerDeathCauseFromDamageSequence(8, 0, [])).toEqual({
      source: 'unknown',
      damageApplied: 8
    });
  });
});
