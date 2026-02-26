import { describe, expect, it } from 'vitest';

import {
  TOUCH_DEBUG_HISTORY_SHORTCUT_DEBOUNCE_MS,
  TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_DURATION_MS,
  TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_PINCH_DISTANCE_DELTA_PX,
  TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_POINTER_TRAVEL_PX,
  resolveTouchDebugHistoryShortcutActionForTap,
  type CompletedTouchDebugHistoryTapGestureSample
} from './debugTouchHistoryShortcuts';

const tapSample = (
  overrides: Partial<CompletedTouchDebugHistoryTapGestureSample>
): CompletedTouchDebugHistoryTapGestureSample => ({
  pointerCount: 2,
  durationMs: 120,
  maxPointerTravelPx: 4,
  maxPinchDistanceDeltaPx: 2,
  timeSinceLastGestureMs: TOUCH_DEBUG_HISTORY_SHORTCUT_DEBOUNCE_MS,
  gesturesEnabled: true,
  ...overrides
});

describe('resolveTouchDebugHistoryShortcutActionForTap', () => {
  it('maps a two-finger tap to undo', () => {
    expect(resolveTouchDebugHistoryShortcutActionForTap(tapSample({ pointerCount: 2 }))).toBe('undo');
  });

  it('maps a three-finger tap to redo', () => {
    expect(resolveTouchDebugHistoryShortcutActionForTap(tapSample({ pointerCount: 3 }))).toBe('redo');
  });

  it('rejects taps when gestures are disabled', () => {
    expect(resolveTouchDebugHistoryShortcutActionForTap(tapSample({ gesturesEnabled: false }))).toBeNull();
  });

  it('rejects taps that exceed the duration limit', () => {
    expect(
      resolveTouchDebugHistoryShortcutActionForTap(
        tapSample({ durationMs: TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_DURATION_MS + 1 })
      )
    ).toBeNull();
  });

  it('rejects taps with excessive pointer travel', () => {
    expect(
      resolveTouchDebugHistoryShortcutActionForTap(
        tapSample({ maxPointerTravelPx: TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_POINTER_TRAVEL_PX + 0.01 })
      )
    ).toBeNull();
  });

  it('rejects two-finger taps that look like a pinch', () => {
    expect(
      resolveTouchDebugHistoryShortcutActionForTap(
        tapSample({
          pointerCount: 2,
          maxPinchDistanceDeltaPx: TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_PINCH_DISTANCE_DELTA_PX + 0.01
        })
      )
    ).toBeNull();
  });

  it('does not apply pinch-distance filtering to three-finger taps', () => {
    expect(
      resolveTouchDebugHistoryShortcutActionForTap(
        tapSample({
          pointerCount: 3,
          maxPinchDistanceDeltaPx: TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_PINCH_DISTANCE_DELTA_PX + 100
        })
      )
    ).toBe('redo');
  });

  it('debounces repeated gestures', () => {
    expect(
      resolveTouchDebugHistoryShortcutActionForTap(
        tapSample({ timeSinceLastGestureMs: TOUCH_DEBUG_HISTORY_SHORTCUT_DEBOUNCE_MS - 1 })
      )
    ).toBeNull();
  });
});
