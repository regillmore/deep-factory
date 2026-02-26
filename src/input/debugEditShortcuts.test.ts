import { describe, expect, it } from 'vitest';

import {
  cycleDebugBrushTileId,
  getDebugBrushSlotHotkeyLabel,
  getDebugBrushTileIdForShortcutSlot,
  resolveDebugEditShortcutAction,
  type DebugEditShortcutKeyEventLike
} from './debugEditShortcuts';

const keyboardEventLike = (
  overrides: Partial<DebugEditShortcutKeyEventLike>
): DebugEditShortcutKeyEventLike => ({
  key: '',
  code: '',
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...overrides
});

describe('resolveDebugEditShortcutAction', () => {
  it('maps Ctrl/Cmd+Z to undo', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'z', ctrlKey: true }))).toEqual({
      type: 'undo'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'Z', metaKey: true }))).toEqual({
      type: 'undo'
    });
  });

  it('maps Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y to redo', () => {
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: 'z', ctrlKey: true, shiftKey: true }))
    ).toEqual({ type: 'redo' });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'y', metaKey: true }))).toEqual({
      type: 'redo'
    });
  });

  it('maps bracket keys to brush cycling', () => {
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: '[', code: 'BracketLeft' }))
    ).toEqual({ type: 'cycle-brush', delta: -1 });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: ']', code: 'BracketRight' }))
    ).toEqual({ type: 'cycle-brush', delta: 1 });
  });

  it('maps digit and numpad keys to brush slots', () => {
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: '1', code: 'Digit1' }))
    ).toEqual({ type: 'select-brush-slot', slotIndex: 0 });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: '0', code: 'Digit0' }))
    ).toEqual({ type: 'select-brush-slot', slotIndex: 9 });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: '3', code: 'Numpad3' }))
    ).toEqual({ type: 'select-brush-slot', slotIndex: 2 });
  });

  it('ignores shifted digit symbols for slot selection', () => {
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: '!', code: 'Digit1', shiftKey: true }))
    ).toBeNull();
  });

  it('ignores unsupported or alt-modified shortcuts', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'p' }))).toBeNull();
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: 'z', ctrlKey: true, altKey: true }))
    ).toBeNull();
  });
});

describe('brush shortcut helpers', () => {
  const brushOptions = [{ tileId: 7 }, { tileId: 9 }, { tileId: 12 }];

  it('returns slot hotkey labels for the first ten slots', () => {
    expect(getDebugBrushSlotHotkeyLabel(0)).toBe('1');
    expect(getDebugBrushSlotHotkeyLabel(8)).toBe('9');
    expect(getDebugBrushSlotHotkeyLabel(9)).toBe('0');
    expect(getDebugBrushSlotHotkeyLabel(10)).toBeNull();
  });

  it('maps slot indexes to brush tile IDs', () => {
    expect(getDebugBrushTileIdForShortcutSlot(brushOptions, 0)).toBe(7);
    expect(getDebugBrushTileIdForShortcutSlot(brushOptions, 2)).toBe(12);
    expect(getDebugBrushTileIdForShortcutSlot(brushOptions, 3)).toBeNull();
  });

  it('cycles brush tile IDs with wraparound', () => {
    expect(cycleDebugBrushTileId(brushOptions, 7, 1)).toBe(9);
    expect(cycleDebugBrushTileId(brushOptions, 7, -1)).toBe(12);
    expect(cycleDebugBrushTileId(brushOptions, 12, 1)).toBe(7);
  });

  it('falls back to ends when the active brush tile is missing', () => {
    expect(cycleDebugBrushTileId(brushOptions, 999, 1)).toBe(7);
    expect(cycleDebugBrushTileId(brushOptions, 999, -1)).toBe(12);
  });

  it('returns null when cycling with no brush options', () => {
    expect(cycleDebugBrushTileId([], 7, 1)).toBeNull();
  });
});
