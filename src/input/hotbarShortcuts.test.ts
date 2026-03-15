import { describe, expect, it } from 'vitest';

import {
  getHotbarSlotShortcutLabel,
  getMoveSelectedHotbarSlotLeftShortcutLabel,
  getMoveSelectedHotbarSlotRightShortcutLabel,
  resolveHotbarSlotShortcut,
  resolveMoveSelectedHotbarSlotShortcut
} from './hotbarShortcuts';

describe('hotbarShortcuts', () => {
  it('maps top-row digits into hotbar slot indices', () => {
    expect(
      resolveHotbarSlotShortcut({
        key: '1',
        code: 'Digit1',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBe(0);
    expect(
      resolveHotbarSlotShortcut({
        key: '0',
        code: 'Digit0',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBe(9);
  });

  it('falls back to raw key values when the platform does not supply a code', () => {
    expect(
      resolveHotbarSlotShortcut({
        key: '4',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBe(3);
  });

  it('ignores modified keys and non-top-row numpad digits', () => {
    expect(
      resolveHotbarSlotShortcut({
        key: '!',
        code: 'Digit1',
        ctrlKey: false,
        metaKey: false,
        shiftKey: true,
        altKey: false
      })
    ).toBeNull();
    expect(
      resolveHotbarSlotShortcut({
        key: '1',
        code: 'Numpad1',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBeNull();
  });

  it('maps Shift+[ and Shift+] into selected-slot move directions', () => {
    expect(
      resolveMoveSelectedHotbarSlotShortcut({
        key: '{',
        code: 'BracketLeft',
        ctrlKey: false,
        metaKey: false,
        shiftKey: true,
        altKey: false
      })
    ).toBe(-1);
    expect(
      resolveMoveSelectedHotbarSlotShortcut({
        key: '}',
        code: 'BracketRight',
        ctrlKey: false,
        metaKey: false,
        shiftKey: true,
        altKey: false
      })
    ).toBe(1);
  });

  it('ignores unmodified or command-modified bracket keys for hotbar reordering', () => {
    expect(
      resolveMoveSelectedHotbarSlotShortcut({
        key: '[',
        code: 'BracketLeft',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false
      })
    ).toBeNull();
    expect(
      resolveMoveSelectedHotbarSlotShortcut({
        key: '{',
        code: 'BracketLeft',
        ctrlKey: true,
        metaKey: false,
        shiftKey: true,
        altKey: false
      })
    ).toBeNull();
  });

  it('exposes stable shortcut labels for the hotbar overlay', () => {
    expect(getHotbarSlotShortcutLabel(0)).toBe('1');
    expect(getHotbarSlotShortcutLabel(9)).toBe('0');
    expect(getHotbarSlotShortcutLabel(10)).toBeNull();
    expect(getMoveSelectedHotbarSlotLeftShortcutLabel()).toBe('Shift+[');
    expect(getMoveSelectedHotbarSlotRightShortcutLabel()).toBe('Shift+]');
  });
});
