export type DebugTouchHistoryShortcutAction = 'undo' | 'redo';

export interface CompletedTouchDebugHistoryTapGestureSample {
  pointerCount: number;
  durationMs: number;
  maxPointerTravelPx: number;
  maxPinchDistanceDeltaPx: number;
  timeSinceLastGestureMs: number;
  gesturesEnabled: boolean;
}

export const TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_DURATION_MS = 260;
export const TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_POINTER_TRAVEL_PX = 16;
export const TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_PINCH_DISTANCE_DELTA_PX = 12;
export const TOUCH_DEBUG_HISTORY_SHORTCUT_DEBOUNCE_MS = 250;

export const resolveTouchDebugHistoryShortcutActionForTap = (
  sample: CompletedTouchDebugHistoryTapGestureSample
): DebugTouchHistoryShortcutAction | null => {
  if (!sample.gesturesEnabled) return null;
  if (sample.pointerCount !== 2 && sample.pointerCount !== 3) return null;
  if (sample.durationMs < 0 || sample.durationMs > TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_DURATION_MS) {
    return null;
  }
  if (sample.maxPointerTravelPx > TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_POINTER_TRAVEL_PX) return null;
  if (
    sample.pointerCount === 2 &&
    sample.maxPinchDistanceDeltaPx > TOUCH_DEBUG_HISTORY_SHORTCUT_TAP_MAX_PINCH_DISTANCE_DELTA_PX
  ) {
    return null;
  }
  if (sample.timeSinceLastGestureMs < TOUCH_DEBUG_HISTORY_SHORTCUT_DEBOUNCE_MS) return null;

  return sample.pointerCount === 2 ? 'undo' : 'redo';
};
