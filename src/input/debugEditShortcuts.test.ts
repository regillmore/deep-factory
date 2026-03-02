import { describe, expect, it } from 'vitest';

import {
  cycleDebugBrushTileId,
  getDesktopDebugOverlayHotkeyLabel,
  getDesktopDebugEditOverlaysHotkeyLabel,
  getDesktopFreshWorldHotkeyLabel,
  getDesktopPlayerSpawnMarkerHotkeyLabel,
  getDesktopRecenterCameraHotkeyLabel,
  getDesktopReturnToMainMenuHotkeyLabel,
  getDebugEditPanelToggleHotkeyLabel,
  getDebugBrushSlotHotkeyLabel,
  getDebugOneShotToolHotkeyLabel,
  getDebugBrushTileIdForShortcutSlot,
  getTouchDebugEditModeHotkeyLabel,
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

  it('maps C to recenter the camera', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'c' }))).toEqual({
      type: 'recenter-camera'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'C', shiftKey: true }))).toEqual({
      type: 'recenter-camera'
    });
  });

  it('maps Q to return to the main menu', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'q' }))).toEqual({
      type: 'return-to-main-menu'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'Q', shiftKey: true }))).toEqual({
      type: 'return-to-main-menu'
    });
  });

  it('maps N to a fresh-world action only when the paused main menu enables it', () => {
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: 'n' }), {
        pausedMainMenuFreshWorldAvailable: true
      })
    ).toEqual({
      type: 'start-fresh-world-session'
    });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: 'N', shiftKey: true }), {
        pausedMainMenuFreshWorldAvailable: true
      })
    ).toEqual({
      type: 'start-fresh-world-session'
    });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: 'n' }), {
        pausedMainMenuFreshWorldAvailable: false
      })
    ).toEqual({
      type: 'arm-line',
      kind: 'place'
    });
  });

  it('maps H to toggle the debug HUD', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'h' }))).toEqual({
      type: 'toggle-debug-overlay'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'H', shiftKey: true }))).toEqual({
      type: 'toggle-debug-overlay'
    });
  });

  it('maps V to toggle the compact edit overlays', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'v' }))).toEqual({
      type: 'toggle-debug-edit-overlays'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'V', shiftKey: true }))).toEqual({
      type: 'toggle-debug-edit-overlays'
    });
  });

  it('maps M to toggle the spawn marker overlay', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'm' }))).toEqual({
      type: 'toggle-player-spawn-marker'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'M', shiftKey: true }))).toEqual({
      type: 'toggle-player-spawn-marker'
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

  it('maps backslash to the debug-edit panel collapse toggle', () => {
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: '\\', code: 'Backslash' }))
    ).toEqual({ type: 'toggle-panel-collapsed' });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: '|', code: 'Backslash', shiftKey: true }))
    ).toEqual({ type: 'toggle-panel-collapsed' });
  });

  it('maps P/L/B to touch debug mode toggles', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'p' }))).toEqual({
      type: 'set-touch-mode',
      mode: 'pan'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'L' }))).toEqual({
      type: 'set-touch-mode',
      mode: 'place'
    });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: 'B', shiftKey: true }))
    ).toEqual({
      type: 'set-touch-mode',
      mode: 'break'
    });
  });

  it('maps I to the eyedropper action', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'i' }))).toEqual({
      type: 'eyedropper'
    });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: 'I', shiftKey: true }))
    ).toEqual({
      type: 'eyedropper'
    });
  });

  it('maps F and Shift+F to armed flood-fill actions', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'f' }))).toEqual({
      type: 'arm-flood-fill',
      kind: 'place'
    });
    expect(
      resolveDebugEditShortcutAction(keyboardEventLike({ key: 'F', shiftKey: true }))
    ).toEqual({
      type: 'arm-flood-fill',
      kind: 'break'
    });
  });

  it('maps one-shot shape tool shortcuts for brush and break variants', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'n' }))).toEqual({
      type: 'arm-line',
      kind: 'place'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'N', shiftKey: true }))).toEqual({
      type: 'arm-line',
      kind: 'break'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'r' }))).toEqual({
      type: 'arm-rect',
      kind: 'place'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'R', shiftKey: true }))).toEqual({
      type: 'arm-rect',
      kind: 'break'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 't' }))).toEqual({
      type: 'arm-rect-outline',
      kind: 'place'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'T', shiftKey: true }))).toEqual({
      type: 'arm-rect-outline',
      kind: 'break'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'e' }))).toEqual({
      type: 'arm-ellipse',
      kind: 'place'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'E', shiftKey: true }))).toEqual({
      type: 'arm-ellipse',
      kind: 'break'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'o' }))).toEqual({
      type: 'arm-ellipse-outline',
      kind: 'place'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'O', shiftKey: true }))).toEqual({
      type: 'arm-ellipse-outline',
      kind: 'break'
    });
  });

  it('maps Escape to armed-tool cancel', () => {
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'Escape' }))).toEqual({
      type: 'cancel-armed-tools'
    });
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'Esc' }))).toEqual({
      type: 'cancel-armed-tools'
    });
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
    expect(resolveDebugEditShortcutAction(keyboardEventLike({ key: 'x' }))).toBeNull();
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

  it('returns touch-mode hotkey labels', () => {
    expect(getTouchDebugEditModeHotkeyLabel('pan')).toBe('P');
    expect(getTouchDebugEditModeHotkeyLabel('place')).toBe('L');
    expect(getTouchDebugEditModeHotkeyLabel('break')).toBe('B');
  });

  it('returns the desktop recenter-camera hotkey label', () => {
    expect(getDesktopRecenterCameraHotkeyLabel()).toBe('C');
  });

  it('returns the desktop return-to-main-menu hotkey label', () => {
    expect(getDesktopReturnToMainMenuHotkeyLabel()).toBe('Q');
  });

  it('returns the desktop fresh-world hotkey label', () => {
    expect(getDesktopFreshWorldHotkeyLabel()).toBe('N');
  });

  it('returns the desktop debug-overlay hotkey label', () => {
    expect(getDesktopDebugOverlayHotkeyLabel()).toBe('H');
  });

  it('returns the desktop edit-overlays hotkey label', () => {
    expect(getDesktopDebugEditOverlaysHotkeyLabel()).toBe('V');
  });

  it('returns the desktop spawn-marker hotkey label', () => {
    expect(getDesktopPlayerSpawnMarkerHotkeyLabel()).toBe('M');
  });

  it('returns the panel toggle hotkey label', () => {
    expect(getDebugEditPanelToggleHotkeyLabel()).toBe('\\');
  });

  it('returns one-shot tool hotkey labels for brush and break actions', () => {
    expect(getDebugOneShotToolHotkeyLabel('flood-fill', 'place')).toBe('F');
    expect(getDebugOneShotToolHotkeyLabel('line', 'break')).toBe('Shift+N');
    expect(getDebugOneShotToolHotkeyLabel('rect-fill', 'place')).toBe('R');
    expect(getDebugOneShotToolHotkeyLabel('rect-outline', 'break')).toBe('Shift+T');
    expect(getDebugOneShotToolHotkeyLabel('ellipse-fill', 'place')).toBe('E');
    expect(getDebugOneShotToolHotkeyLabel('ellipse-outline', 'break')).toBe('Shift+O');
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
