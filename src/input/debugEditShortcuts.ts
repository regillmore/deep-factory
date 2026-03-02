export interface DebugBrushShortcutOption {
  tileId: number;
}

export interface DebugEditShortcutKeyEventLike {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface DebugEditShortcutContext {
  pausedMainMenuFreshWorldAvailable?: boolean;
}

export type DebugEditShortcutAction =
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'start-fresh-world-session' }
  | { type: 'return-to-main-menu' }
  | { type: 'recenter-camera' }
  | { type: 'toggle-debug-overlay' }
  | { type: 'toggle-debug-edit-overlays' }
  | { type: 'toggle-player-spawn-marker' }
  | { type: 'cancel-armed-tools' }
  | { type: 'toggle-panel-collapsed' }
  | { type: 'set-touch-mode'; mode: 'pan' | 'place' | 'break' }
  | { type: 'arm-flood-fill'; kind: 'place' | 'break' }
  | { type: 'arm-line'; kind: 'place' | 'break' }
  | { type: 'arm-rect'; kind: 'place' | 'break' }
  | { type: 'arm-rect-outline'; kind: 'place' | 'break' }
  | { type: 'arm-ellipse'; kind: 'place' | 'break' }
  | { type: 'arm-ellipse-outline'; kind: 'place' | 'break' }
  | { type: 'eyedropper' }
  | { type: 'select-brush-slot'; slotIndex: number }
  | { type: 'cycle-brush'; delta: -1 | 1 };

export type DebugOneShotToolShortcutId =
  | 'flood-fill'
  | 'line'
  | 'rect-fill'
  | 'rect-outline'
  | 'ellipse-fill'
  | 'ellipse-outline';

const DEBUG_BRUSH_SLOT_HOTKEY_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;
const DEBUG_ONE_SHOT_TOOL_SHORTCUT_KEYS: Readonly<Record<DebugOneShotToolShortcutId, string>> = {
  'flood-fill': 'F',
  line: 'N',
  'rect-fill': 'R',
  'rect-outline': 'T',
  'ellipse-fill': 'E',
  'ellipse-outline': 'O'
};

export const DEBUG_BRUSH_SLOT_SHORTCUT_COUNT = DEBUG_BRUSH_SLOT_HOTKEY_LABELS.length;

const parseBrushSlotIndexFromNumericKey = (key: string): number | null => {
  if (key.length !== 1 || key < '0' || key > '9') return null;
  return key === '0' ? 9 : Number(key) - 1;
};

const parseBrushSlotIndexFromCode = (code: string | undefined): number | null => {
  if (!code) return null;

  if (code.startsWith('Digit')) {
    return parseBrushSlotIndexFromNumericKey(code.slice('Digit'.length));
  }

  if (code.startsWith('Numpad')) {
    return parseBrushSlotIndexFromNumericKey(code.slice('Numpad'.length));
  }

  return null;
};

export const getDebugBrushSlotHotkeyLabel = (slotIndex: number): string | null =>
  DEBUG_BRUSH_SLOT_HOTKEY_LABELS[slotIndex] ?? null;

export const getTouchDebugEditModeHotkeyLabel = (mode: 'pan' | 'place' | 'break'): string => {
  if (mode === 'pan') return 'P';
  if (mode === 'place') return 'L';
  return 'B';
};

export const getDesktopReturnToMainMenuHotkeyLabel = (): string => 'Q';
export const getDesktopFreshWorldHotkeyLabel = (): string => 'N';
export const getDesktopRecenterCameraHotkeyLabel = (): string => 'C';
export const getDesktopDebugOverlayHotkeyLabel = (): string => 'H';
export const getDesktopDebugEditOverlaysHotkeyLabel = (): string => 'V';
export const getDesktopPlayerSpawnMarkerHotkeyLabel = (): string => 'M';

export const getDebugEditPanelToggleHotkeyLabel = (): string => '\\';

export const getDebugOneShotToolHotkeyLabel = (
  tool: DebugOneShotToolShortcutId,
  kind: 'place' | 'break'
): string => {
  const baseLabel = DEBUG_ONE_SHOT_TOOL_SHORTCUT_KEYS[tool];
  return kind === 'place' ? baseLabel : `Shift+${baseLabel}`;
};

export const getDebugBrushTileIdForShortcutSlot = (
  brushOptions: readonly DebugBrushShortcutOption[],
  slotIndex: number
): number | null => brushOptions[slotIndex]?.tileId ?? null;

export const cycleDebugBrushTileId = (
  brushOptions: readonly DebugBrushShortcutOption[],
  activeBrushTileId: number,
  delta: -1 | 1
): number | null => {
  if (brushOptions.length === 0) return null;

  const currentIndex = brushOptions.findIndex((option) => option.tileId === activeBrushTileId);
  if (currentIndex < 0) {
    return delta > 0 ? brushOptions[0]!.tileId : brushOptions[brushOptions.length - 1]!.tileId;
  }

  const nextIndex = (currentIndex + delta + brushOptions.length) % brushOptions.length;
  return brushOptions[nextIndex]!.tileId;
};

export const resolveDebugEditShortcutAction = (
  event: DebugEditShortcutKeyEventLike,
  context: DebugEditShortcutContext = {}
): DebugEditShortcutAction | null => {
  const normalizedKey = event.key.toLowerCase();
  const hasCommandModifier = event.ctrlKey || event.metaKey;

  if (hasCommandModifier) {
    if (event.altKey) return null;

    if (normalizedKey === 'z') {
      return event.shiftKey ? { type: 'redo' } : { type: 'undo' };
    }

    if (normalizedKey === 'y' && !event.shiftKey) {
      return { type: 'redo' };
    }

    return null;
  }

  if (event.altKey) return null;

  if (normalizedKey === 'escape' || normalizedKey === 'esc') {
    return { type: 'cancel-armed-tools' };
  }

  if (normalizedKey === getDesktopReturnToMainMenuHotkeyLabel().toLowerCase()) {
    return { type: 'return-to-main-menu' };
  }

  if (normalizedKey === getDesktopRecenterCameraHotkeyLabel().toLowerCase()) {
    return { type: 'recenter-camera' };
  }

  if (normalizedKey === getDesktopDebugOverlayHotkeyLabel().toLowerCase()) {
    return { type: 'toggle-debug-overlay' };
  }

  if (normalizedKey === getDesktopDebugEditOverlaysHotkeyLabel().toLowerCase()) {
    return { type: 'toggle-debug-edit-overlays' };
  }

  if (normalizedKey === getDesktopPlayerSpawnMarkerHotkeyLabel().toLowerCase()) {
    return { type: 'toggle-player-spawn-marker' };
  }

  if (
    context.pausedMainMenuFreshWorldAvailable === true &&
    normalizedKey === getDesktopFreshWorldHotkeyLabel().toLowerCase()
  ) {
    return { type: 'start-fresh-world-session' };
  }

  const code = event.code ?? '';
  if (code === 'Backslash' || (!code && event.key === getDebugEditPanelToggleHotkeyLabel())) {
    return { type: 'toggle-panel-collapsed' };
  }

  if (normalizedKey === 'p') {
    return { type: 'set-touch-mode', mode: 'pan' };
  }
  if (normalizedKey === 'l') {
    return { type: 'set-touch-mode', mode: 'place' };
  }
  if (normalizedKey === 'b') {
    return { type: 'set-touch-mode', mode: 'break' };
  }
  if (normalizedKey === 'i') {
    return { type: 'eyedropper' };
  }
  if (normalizedKey === 'f') {
    return { type: 'arm-flood-fill', kind: event.shiftKey ? 'break' : 'place' };
  }
  if (normalizedKey === 'n') {
    return { type: 'arm-line', kind: event.shiftKey ? 'break' : 'place' };
  }
  if (normalizedKey === 'r') {
    return { type: 'arm-rect', kind: event.shiftKey ? 'break' : 'place' };
  }
  if (normalizedKey === 't') {
    return { type: 'arm-rect-outline', kind: event.shiftKey ? 'break' : 'place' };
  }
  if (normalizedKey === 'e') {
    return { type: 'arm-ellipse', kind: event.shiftKey ? 'break' : 'place' };
  }
  if (normalizedKey === 'o') {
    return { type: 'arm-ellipse-outline', kind: event.shiftKey ? 'break' : 'place' };
  }

  if (code === 'BracketLeft' || (!code && event.key === '[')) {
    return { type: 'cycle-brush', delta: -1 };
  }
  if (code === 'BracketRight' || (!code && event.key === ']')) {
    return { type: 'cycle-brush', delta: 1 };
  }

  if (event.shiftKey) return null;

  const slotIndex = parseBrushSlotIndexFromCode(event.code) ?? parseBrushSlotIndexFromNumericKey(event.key);
  if (slotIndex !== null) {
    return { type: 'select-brush-slot', slotIndex };
  }

  return null;
};
