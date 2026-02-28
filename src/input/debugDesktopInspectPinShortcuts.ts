export type DebugDesktopInspectPinShortcutAction = 'pin-tile-inspect';

export interface ActiveDesktopDebugInspectPinClickSample {
  durationMs: number;
  maxPointerTravelPx: number;
  gesturesEnabled: boolean;
  button: number;
  shiftKey: boolean;
}

export const DESKTOP_DEBUG_INSPECT_PIN_CLICK_MAX_DURATION_MS = 260;
export const DESKTOP_DEBUG_INSPECT_PIN_CLICK_MAX_POINTER_TRAVEL_PX = 6;
export const DESKTOP_DEBUG_INSPECT_PIN_MOUSE_BUTTON = 0;

export const resolveDesktopDebugInspectPinShortcutActionForClick = (
  sample: ActiveDesktopDebugInspectPinClickSample
): DebugDesktopInspectPinShortcutAction | null => {
  if (!sample.gesturesEnabled) return null;
  if (sample.button !== DESKTOP_DEBUG_INSPECT_PIN_MOUSE_BUTTON) return null;
  if (sample.shiftKey) return null;
  if (sample.durationMs > DESKTOP_DEBUG_INSPECT_PIN_CLICK_MAX_DURATION_MS) return null;
  if (sample.maxPointerTravelPx > DESKTOP_DEBUG_INSPECT_PIN_CLICK_MAX_POINTER_TRAVEL_PX) return null;
  return 'pin-tile-inspect';
};
