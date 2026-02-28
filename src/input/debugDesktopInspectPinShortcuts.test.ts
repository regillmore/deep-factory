import { describe, expect, it } from 'vitest';

import { resolveDesktopDebugInspectPinShortcutActionForClick } from './debugDesktopInspectPinShortcuts';

describe('resolveDesktopDebugInspectPinShortcutActionForClick', () => {
  it('accepts a short stationary primary-button click when inspect pinning is armed', () => {
    expect(
      resolveDesktopDebugInspectPinShortcutActionForClick({
        durationMs: 180,
        maxPointerTravelPx: 3,
        gesturesEnabled: true,
        button: 0,
        shiftKey: false
      })
    ).toBe('pin-tile-inspect');
  });

  it('rejects clicks when desktop inspect pinning is not armed', () => {
    expect(
      resolveDesktopDebugInspectPinShortcutActionForClick({
        durationMs: 180,
        maxPointerTravelPx: 3,
        gesturesEnabled: false,
        button: 0,
        shiftKey: false
      })
    ).toBeNull();
  });

  it('rejects non-primary or modified clicks', () => {
    expect(
      resolveDesktopDebugInspectPinShortcutActionForClick({
        durationMs: 180,
        maxPointerTravelPx: 3,
        gesturesEnabled: true,
        button: 2,
        shiftKey: false
      })
    ).toBeNull();
    expect(
      resolveDesktopDebugInspectPinShortcutActionForClick({
        durationMs: 180,
        maxPointerTravelPx: 3,
        gesturesEnabled: true,
        button: 0,
        shiftKey: true
      })
    ).toBeNull();
  });

  it('rejects draggy or long clicks so panning does not repin accidentally', () => {
    expect(
      resolveDesktopDebugInspectPinShortcutActionForClick({
        durationMs: 320,
        maxPointerTravelPx: 3,
        gesturesEnabled: true,
        button: 0,
        shiftKey: false
      })
    ).toBeNull();
    expect(
      resolveDesktopDebugInspectPinShortcutActionForClick({
        durationMs: 180,
        maxPointerTravelPx: 9,
        gesturesEnabled: true,
        button: 0,
        shiftKey: false
      })
    ).toBeNull();
  });
});
