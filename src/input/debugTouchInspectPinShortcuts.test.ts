import { describe, expect, it } from 'vitest';

import { resolveTouchDebugInspectPinShortcutActionForTap } from './debugTouchInspectPinShortcuts';

describe('resolveTouchDebugInspectPinShortcutActionForTap', () => {
  it('accepts a short stationary tap when inspect pin gestures are enabled', () => {
    expect(
      resolveTouchDebugInspectPinShortcutActionForTap({
        durationMs: 180,
        maxPointerTravelPx: 6,
        gesturesEnabled: true
      })
    ).toBe('pin-tile-inspect');
  });

  it('rejects taps when pan-mode inspect pin gestures are disabled', () => {
    expect(
      resolveTouchDebugInspectPinShortcutActionForTap({
        durationMs: 180,
        maxPointerTravelPx: 6,
        gesturesEnabled: false
      })
    ).toBeNull();
  });

  it('rejects long presses so the eyedropper can own the hold gesture', () => {
    expect(
      resolveTouchDebugInspectPinShortcutActionForTap({
        durationMs: 420,
        maxPointerTravelPx: 6,
        gesturesEnabled: true
      })
    ).toBeNull();
  });

  it('rejects drags that should be treated as pan movement instead of a tap', () => {
    expect(
      resolveTouchDebugInspectPinShortcutActionForTap({
        durationMs: 180,
        maxPointerTravelPx: 24,
        gesturesEnabled: true
      })
    ).toBeNull();
  });
});
