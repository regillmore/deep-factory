export interface DropSelectedHotbarStackShortcutKeyEventLike {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export const DROP_SELECTED_HOTBAR_STACK_SHORTCUT_LABEL = 'Backspace';

export const getDropSelectedHotbarStackShortcutLabel = (): string =>
  DROP_SELECTED_HOTBAR_STACK_SHORTCUT_LABEL;

export const resolveDropSelectedHotbarStackShortcut = (
  event: DropSelectedHotbarStackShortcutKeyEventLike
): boolean => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return false;
  }

  return event.key === 'Backspace' || event.code === 'Backspace';
};
