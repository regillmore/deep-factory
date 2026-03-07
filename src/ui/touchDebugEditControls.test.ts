import { describe, expect, it } from 'vitest';

import {
  getDesktopDebugEditControlsHotkeyLabel,
  getDesktopShortcutsOverlayHotkeyLabel
} from '../input/debugEditShortcuts';
import {
  resolveTouchDebugEditControlsDisplayState,
  resolveTouchDebugKeyboardShortcutLines
} from './touchDebugEditControls';

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
});
