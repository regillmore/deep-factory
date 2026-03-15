import { describe, expect, it } from 'vitest';

import type { ShellActionKeybindingState } from '../input/shellActionKeybindings';
import {
  getDesktopDebugEditControlsHotkeyLabel,
  getDesktopFreshWorldHotkeyLabel,
  getDesktopResumeWorldHotkeyLabel,
  getDesktopShortcutsOverlayHotkeyLabel
} from '../input/debugEditShortcuts';
import {
  resolveTouchDebugEditControlsDisplayState,
  resolveTouchDebugKeyboardShortcutLines
} from './touchDebugEditControls';

const CUSTOM_SHELL_ACTION_KEYBINDINGS: ShellActionKeybindingState = {
  'return-to-main-menu': 'X',
  'recenter-camera': 'Z',
  'toggle-debug-overlay': 'U',
  'toggle-debug-edit-controls': 'J',
  'toggle-debug-edit-overlays': 'K',
  'toggle-player-spawn-marker': 'Y'
};

describe('resolveTouchDebugEditControlsDisplayState', () => {
  it('keeps the root hidden or shown independently from whether the panel is collapsed', () => {
    expect(resolveTouchDebugEditControlsDisplayState(false, true)).toEqual({
      rootDisplay: 'none',
      contentDisplay: 'none',
      collapsedSummaryDisplay: 'block',
      ariaExpanded: 'false',
      ariaHidden: 'true',
      collapseToggleLabel: 'Expand'
    });
    expect(resolveTouchDebugEditControlsDisplayState(true, true)).toEqual({
      rootDisplay: 'flex',
      contentDisplay: 'none',
      collapsedSummaryDisplay: 'block',
      ariaExpanded: 'false',
      ariaHidden: 'false',
      collapseToggleLabel: 'Expand'
    });
    expect(resolveTouchDebugEditControlsDisplayState(true, false)).toEqual({
      rootDisplay: 'flex',
      contentDisplay: 'flex',
      collapsedSummaryDisplay: 'none',
      ariaExpanded: 'true',
      ariaHidden: 'false',
      collapseToggleLabel: 'Collapse'
    });
  });
});

describe('resolveTouchDebugKeyboardShortcutLines', () => {
  it('lists the hotbar selection shortcut in the keyboard reference', () => {
    expect(resolveTouchDebugKeyboardShortcutLines()).toContain(
      'Hotbar: 1-0 select slots while the full Debug Edit panel is hidden'
    );
    expect(resolveTouchDebugKeyboardShortcutLines()).toContain(
      'Inventory: Shift+[ / Shift+] move the selected hotbar slot; Shift+Backspace drops one hotbar item; Backspace drops the selected hotbar stack'
    );
  });

  it('lists the panel-hidden block placement shortcut in the keyboard reference', () => {
    expect(resolveTouchDebugKeyboardShortcutLines()).toContain(
      'Build: click or tap an empty tile with a solid neighbor while the full Debug Edit panel is hidden'
    );
  });

  it('lists the in-world edit-panel shortcut in the keyboard reference', () => {
    expect(resolveTouchDebugKeyboardShortcutLines()).toContain(
      `Edit panel: ${getDesktopDebugEditControlsHotkeyLabel()} toggle the full in-world Debug Edit panel`
    );
  });

  it('lists the in-world shortcuts overlay toggle in the keyboard reference', () => {
    expect(resolveTouchDebugKeyboardShortcutLines()).toContain(
      `Shortcuts: ${getDesktopShortcutsOverlayHotkeyLabel()} toggle the in-world desktop and touch controls reference`
    );
  });

  it('lists the paused main-menu resume and new-world shortcuts in the keyboard reference', () => {
    expect(resolveTouchDebugKeyboardShortcutLines()).toContain(
      `Paused menu: ${getDesktopResumeWorldHotkeyLabel()} resume the paused world session`
    );
    expect(resolveTouchDebugKeyboardShortcutLines()).toContain(
      `Paused menu: ${getDesktopFreshWorldHotkeyLabel()} start a fresh world from the paused main menu`
    );
  });

  it('uses configured in-world shell-action keybindings in the keyboard reference', () => {
    expect(
      resolveTouchDebugKeyboardShortcutLines('\\', CUSTOM_SHELL_ACTION_KEYBINDINGS)
    ).toContain('Session: X return to the main menu without discarding the current world');
    expect(
      resolveTouchDebugKeyboardShortcutLines('\\', CUSTOM_SHELL_ACTION_KEYBINDINGS)
    ).toContain('Camera: Z recenter on the standalone player');
    expect(
      resolveTouchDebugKeyboardShortcutLines('\\', CUSTOM_SHELL_ACTION_KEYBINDINGS)
    ).toContain('HUD: U toggle debug telemetry');
    expect(
      resolveTouchDebugKeyboardShortcutLines('\\', CUSTOM_SHELL_ACTION_KEYBINDINGS)
    ).toContain('Edit panel: J toggle the full in-world Debug Edit panel');
    expect(
      resolveTouchDebugKeyboardShortcutLines('\\', CUSTOM_SHELL_ACTION_KEYBINDINGS)
    ).toContain('Edit overlays: K toggle compact in-world overlays');
    expect(
      resolveTouchDebugKeyboardShortcutLines('\\', CUSTOM_SHELL_ACTION_KEYBINDINGS)
    ).toContain('Spawn marker: Y toggle the standalone player spawn overlay');
  });
});
