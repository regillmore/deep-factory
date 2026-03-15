const HOTBAR_SLOT_SHORTCUT_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;
const MOVE_SELECTED_HOTBAR_SLOT_LEFT_SHORTCUT_LABEL = 'Shift+[';
const MOVE_SELECTED_HOTBAR_SLOT_RIGHT_SHORTCUT_LABEL = 'Shift+]';

export type MoveSelectedHotbarSlotShortcutDirection = -1 | 1;

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

export const getMoveSelectedHotbarSlotLeftShortcutLabel = (): string =>
  MOVE_SELECTED_HOTBAR_SLOT_LEFT_SHORTCUT_LABEL;

export const getMoveSelectedHotbarSlotRightShortcutLabel = (): string =>
  MOVE_SELECTED_HOTBAR_SLOT_RIGHT_SHORTCUT_LABEL;

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

export const resolveMoveSelectedHotbarSlotShortcut = (
  event: HotbarShortcutKeyEventLike
): MoveSelectedHotbarSlotShortcutDirection | null => {
  if (event.ctrlKey || event.metaKey || event.altKey || !event.shiftKey) {
    return null;
  }

  const code = event.code ?? '';
  if (code === 'BracketLeft') {
    return -1;
  }
  if (code === 'BracketRight') {
    return 1;
  }

  if (event.key === '[' || event.key === '{') {
    return -1;
  }
  if (event.key === ']' || event.key === '}') {
    return 1;
  }

  return null;
};
