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

export type DebugEditShortcutAction =
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'set-touch-mode'; mode: 'pan' | 'place' | 'break' }
  | { type: 'select-brush-slot'; slotIndex: number }
  | { type: 'cycle-brush'; delta: -1 | 1 };

const DEBUG_BRUSH_SLOT_HOTKEY_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;

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
  event: DebugEditShortcutKeyEventLike
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

  if (normalizedKey === 'p') {
    return { type: 'set-touch-mode', mode: 'pan' };
  }
  if (normalizedKey === 'l') {
    return { type: 'set-touch-mode', mode: 'place' };
  }
  if (normalizedKey === 'b') {
    return { type: 'set-touch-mode', mode: 'break' };
  }

  const code = event.code ?? '';
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
