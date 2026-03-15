export interface DropSelectedHotbarStackShortcutKeyEventLike {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export const DROP_SELECTED_HOTBAR_STACK_SHORTCUT_LABEL = 'Backspace';
export const DROP_ONE_SELECTED_HOTBAR_ITEM_SHORTCUT_LABEL = 'Shift+Backspace';

export const getDropSelectedHotbarStackShortcutLabel = (): string =>
  DROP_SELECTED_HOTBAR_STACK_SHORTCUT_LABEL;

export const getDropOneSelectedHotbarItemShortcutLabel = (): string =>
  DROP_ONE_SELECTED_HOTBAR_ITEM_SHORTCUT_LABEL;

const isBackspaceShortcut = (event: DropSelectedHotbarStackShortcutKeyEventLike): boolean =>
  event.key === 'Backspace' || event.code === 'Backspace';

export const resolveDropOneSelectedHotbarItemShortcut = (
  event: DropSelectedHotbarStackShortcutKeyEventLike
): boolean => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  return event.shiftKey && isBackspaceShortcut(event);
};

export const resolveDropSelectedHotbarStackShortcut = (
  event: DropSelectedHotbarStackShortcutKeyEventLike
): boolean => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return false;
  }

  return isBackspaceShortcut(event);
};
