export type DebugTouchEyedropperShortcutAction = 'pick-brush';

export interface ActiveTouchDebugEyedropperLongPressSample {
  durationMs: number;
  maxPointerTravelPx: number;
  gesturesEnabled: boolean;
}

export const TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MIN_DURATION_MS = 420;
export const TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MAX_POINTER_TRAVEL_PX = 14;

export const resolveTouchDebugEyedropperShortcutActionForLongPress = (
  sample: ActiveTouchDebugEyedropperLongPressSample
): DebugTouchEyedropperShortcutAction | null => {
  if (!sample.gesturesEnabled) return null;
  if (sample.durationMs < TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MIN_DURATION_MS) return null;
  if (sample.maxPointerTravelPx > TOUCH_DEBUG_EYEDROPPER_LONG_PRESS_MAX_POINTER_TRAVEL_PX) return null;
  return 'pick-brush';
};
