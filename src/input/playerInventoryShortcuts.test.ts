import { describe, expect, it } from 'vitest';

import {
  getDropOneSelectedHotbarItemShortcutLabel,
  getDropSelectedHotbarStackShortcutLabel,
  resolveDropOneSelectedHotbarItemShortcut,
  resolveDropSelectedHotbarStackShortcut
} from './playerInventoryShortcuts';

describe('playerInventoryShortcuts', () => {
  it('matches the Backspace hotbar-drop shortcut without modifiers', () => {
    expect(
      resolveDropSelectedHotbarStackShortcut({
        key: 'Backspace',
        code: 'Backspace',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBe(true);
  });

  it('matches Shift+Backspace for dropping one hotbar item', () => {
    expect(
      resolveDropOneSelectedHotbarItemShortcut({
        key: 'Backspace',
        code: 'Backspace',
        ctrlKey: false,
        metaKey: false,
        shiftKey: true,
        altKey: false
      })
    ).toBe(true);
  });

  it('rejects modified or non-Backspace keys', () => {
    expect(
      resolveDropSelectedHotbarStackShortcut({
        key: 'Backspace',
        code: 'Backspace',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBe(false);
    expect(
      resolveDropOneSelectedHotbarItemShortcut({
        key: 'Backspace',
        code: 'Backspace',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBe(false);
    expect(
      resolveDropSelectedHotbarStackShortcut({
        key: 'x',
        code: 'KeyX',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBe(false);
  });

  it('exposes a stable keyboard label for UI copy', () => {
    expect(getDropSelectedHotbarStackShortcutLabel()).toBe('Backspace');
    expect(getDropOneSelectedHotbarItemShortcutLabel()).toBe('Shift+Backspace');
  });
});
