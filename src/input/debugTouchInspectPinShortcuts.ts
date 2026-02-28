export type DebugTouchInspectPinShortcutAction = 'pin-tile-inspect';

export interface ActiveTouchDebugInspectPinTapSample {
  durationMs: number;
  maxPointerTravelPx: number;
  gesturesEnabled: boolean;
}

export const TOUCH_DEBUG_INSPECT_PIN_TAP_MAX_DURATION_MS = 260;
export const TOUCH_DEBUG_INSPECT_PIN_TAP_MAX_POINTER_TRAVEL_PX = 14;

export const resolveTouchDebugInspectPinShortcutActionForTap = (
  sample: ActiveTouchDebugInspectPinTapSample
): DebugTouchInspectPinShortcutAction | null => {
  if (!sample.gesturesEnabled) return null;
  if (sample.durationMs > TOUCH_DEBUG_INSPECT_PIN_TAP_MAX_DURATION_MS) return null;
  if (sample.maxPointerTravelPx > TOUCH_DEBUG_INSPECT_PIN_TAP_MAX_POINTER_TRAVEL_PX) return null;
  return 'pin-tile-inspect';
};
