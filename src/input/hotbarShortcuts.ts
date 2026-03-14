const HOTBAR_SLOT_SHORTCUT_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;

export interface HotbarShortcutKeyEventLike {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

const parseHotbarSlotIndexFromNumericKey = (key: string): number | null => {
  if (key.length !== 1 || key < '0' || key > '9') {
    return null;
  }

  return key === '0' ? 9 : Number(key) - 1;
};

export const getHotbarSlotShortcutLabel = (slotIndex: number): string | null =>
  HOTBAR_SLOT_SHORTCUT_LABELS[slotIndex] ?? null;

export const resolveHotbarSlotShortcut = (
  event: HotbarShortcutKeyEventLike
): number | null => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return null;
  }

  const code = event.code ?? '';
  if (code.startsWith('Digit')) {
    return parseHotbarSlotIndexFromNumericKey(code.slice('Digit'.length));
  }
  if (code.startsWith('Numpad')) {
    return null;
  }

  return parseHotbarSlotIndexFromNumericKey(event.key);
};
