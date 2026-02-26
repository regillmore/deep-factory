import { describe, expect, it } from 'vitest';

import {
  TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MAX_POINTER_TRAVEL_PX,
  TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MIN_DURATION_MS,
  resolveTouchDebugEyedropperShortcutActionForLongPress
} from './debugTouchEyedropperShortcuts';

describe('resolveTouchDebugEyedropperShortcutActionForLongPress', () => {
  it('returns pick-brush for an enabled stationary long-press', () => {
    expect(
      resolveTouchDebugEyedropperShortcutActionForLongPress({
        durationMs: TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MIN_DURATION_MS,
        maxPointerTravelPx: TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MAX_POINTER_TRAVEL_PX,
        gesturesEnabled: true
      })
    ).toBe('pick-brush');
  });

  it('rejects samples when gestures are disabled', () => {
    expect(
      resolveTouchDebugEyedropperShortcutActionForLongPress({
        durationMs: TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MIN_DURATION_MS + 50,
        maxPointerTravelPx: 0,
        gesturesEnabled: false
      })
    ).toBeNull();
  });

  it('rejects short presses and panning movement', () => {
    expect(
      resolveTouchDebugEyedropperShortcutActionForLongPress({
        durationMs: TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MIN_DURATION_MS - 1,
        maxPointerTravelPx: 0,
        gesturesEnabled: true
      })
    ).toBeNull();

    expect(
      resolveTouchDebugEyedropperShortcutActionForLongPress({
        durationMs: TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MIN_DURATION_MS + 50,
        maxPointerTravelPx: TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MAX_POINTER_TRAVEL_PX + 0.01,
        gesturesEnabled: true
      })
    ).toBeNull();
  });
});
