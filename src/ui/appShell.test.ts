import { describe, expect, it } from 'vitest';

import {
  createDefaultShellActionKeybindingState,
  matchesDefaultShellActionKeybindingState,
  type ShellActionKeybindingState
} from '../input/shellActionKeybindings';
import {
  getDesktopDebugEditOverlaysHotkeyLabel,
  getDesktopDebugOverlayHotkeyLabel,
  getDesktopDebugEditControlsHotkeyLabel,
  getDesktopFreshWorldHotkeyLabel,
  getDesktopPlayerSpawnMarkerHotkeyLabel,
  getDesktopShortcutsOverlayHotkeyLabel,
  getDesktopRecenterCameraHotkeyLabel,
  getDesktopResumeWorldHotkeyLabel,
  getDesktopReturnToMainMenuHotkeyLabel
} from '../input/debugEditShortcuts';
import {
  createDefaultBootShellState,
  createFirstLaunchMainMenuShellState,
  createInWorldShellState,
  createMainMenuShellState,
  createPausedMainMenuShellState,
  createRendererInitializationFailedBootShellState,
  createWebGlUnavailableBootShellState,
  resolveMainMenuPrimaryActionTitle,
  resolveMainMenuQuinaryActionTitle,
  resolveMainMenuQuaternaryActionTitle,
  resolveMainMenuSenaryActionTitle,
  resolveMainMenuSecondaryActionTitle,
  resolveMainMenuTertiaryActionTitle,
  resolveAppShellRegionDisplay,
  resolvePausedMainMenuClearSavedWorldTitle,
  resolvePausedMainMenuExportWorldSaveTitle,
  resolvePausedMainMenuExportShellProfileTitle,
  resolvePausedMainMenuFreshWorldTitle,
  resolvePausedMainMenuApplyShellProfileTitle,
  resolvePausedMainMenuImportShellProfileTitle,
  resolvePausedMainMenuImportWorldSaveTitle,
  resolvePausedMainMenuShellActionKeybindingEditorIntro,
  resolvePausedMainMenuResetShellTogglesTitle,
  resolvePausedMainMenuResumeWorldTitle,
  resolveInWorldDebugEditControlsToggleTitle,
  resolveAppShellViewModel
} from './appShell';

const CUSTOM_SHELL_ACTION_KEYBINDINGS: ShellActionKeybindingState = {
  'return-to-main-menu': 'X',
  'recenter-camera': 'Z',
  'toggle-debug-overlay': 'U',
  'toggle-debug-edit-controls': 'J',
  'toggle-debug-edit-overlays': 'K',
  'toggle-player-spawn-marker': 'Y'
};
const PAUSED_MAIN_MENU_KEYBINDING_SUMMARY_LINE =
  'Current in-world shell hotkeys preview the active binding set and can be remapped below.';
const PAUSED_MAIN_MENU_KEYBINDING_DEFAULTED_SUMMARY_LINE =
  'Saved in-world shell-action keybindings fell back to a recovered safe set during load. Review or remap the rows below before resuming.';
const DEFAULT_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES = [
  'Saved in-world shell visibility resumes with the paused session until a reset path clears it.',
  PAUSED_MAIN_MENU_KEYBINDING_SUMMARY_LINE
] as const;
const DEFAULTED_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES = [
  'Saved in-world shell visibility resumes with the paused session until a reset path clears it.',
  PAUSED_MAIN_MENU_KEYBINDING_DEFAULTED_SUMMARY_LINE
] as const;
const ACCEPTED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES = [
  'The paused session now reflects the selected JSON world save because its top-level envelope validated and restored successfully.'
] as const;
const RESTORE_FAILED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES = [
  'The selected JSON world save passed top-level envelope validation, but runtime restore still failed.'
] as const;
const PERSISTENCE_FAILED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES = [
  'The paused session now reflects the selected JSON world save in this tab, but browser-resume persistence failed after restore.',
  'Resume World keeps the imported session live here, but reload may not restore it until a later save succeeds.'
] as const;
const DOWNLOADED_PAUSED_MAIN_MENU_EXPORT_RESULT_LINES = [
  'The paused session stayed unchanged, and the last JSON world-save download used the filename below.'
] as const;
const FAILED_PAUSED_MAIN_MENU_EXPORT_RESULT_LINES = [
  'The paused session stayed unchanged because the JSON world-save download failed before the browser accepted it.'
] as const;
const CANCELLED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES = [
  'The paused session stayed unchanged because the JSON picker closed without selecting a world save file.'
] as const;
const PICKER_START_FAILED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES = [
  'The paused session stayed unchanged because the browser JSON picker failed before any world save file could be selected.'
] as const;
const REJECTED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES = [
  'The paused session stayed unchanged because the selected JSON world save did not pass top-level envelope validation.'
] as const;
const FAILED_PAUSED_MAIN_MENU_CLEAR_SAVED_WORLD_RESULT_LINES = [
  'The paused session stayed browser-saved because Clear Saved World could not delete its local resume envelope.',
  'Resume World and reload still use the last browser-saved session until deletion succeeds.'
] as const;
const CLEARED_PAUSED_MAIN_MENU_RESET_SHELL_TOGGLES_RESULT_LINES = [
  'This paused session now resumes from the default-off shell layout because its saved shell visibility preferences were cleared.',
  'The next Resume World starts with Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden.'
] as const;
const PERSISTENCE_FAILED_PAUSED_MAIN_MENU_RESET_SHELL_TOGGLES_RESULT_LINES = [
  'This paused session still resumes from the default-off shell layout in this tab, but browser shell storage could not be cleared.',
  'Resume World keeps the reset live here, but reload may still restore the last browser-saved shell layout until a later shell save succeeds.'
] as const;
const CLEARED_PAUSED_MAIN_MENU_WORLD_SAVE_STATUS_LINES = [
  'This paused session is no longer browser-saved because Clear Saved World removed its local resume envelope.',
  'Resume World or a replacement save path writes a new browser save for the current session.'
] as const;
const IMPORTED_SESSION_PERSISTENCE_FAILED_SAVED_WORLD_STATUS_LINES = [
  'This imported paused session is still live in the current tab, but it is not browser-saved because rewriting its local resume envelope failed after restore.',
  'This warning clears after a later browser-save rewrite succeeds for the current session.'
] as const;
const SESSION_ONLY_FALLBACK_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES = [
  'Browser shell storage is unavailable or could not be updated, so this paused session keeps the current shell layout only until a reset path or reload clears it.',
  PAUSED_MAIN_MENU_KEYBINDING_SUMMARY_LINE
] as const;
const PAUSED_MAIN_MENU_SHELL_PROFILE_PREVIEW_LINES = [
  'The selected shell profile validated successfully and is ready to apply to this paused session.',
  'Review its saved-on shell visibility and replacement hotkey set below before applying it.'
] as const;
const DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_INTRO =
  'Use unique A-Z letters for the in-world shell actions. Changes save immediately when browser storage is available.';
const SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_INTRO =
  'Use unique A-Z letters for the in-world shell actions. Browser shell storage is unavailable, so remaps only affect this paused session until reload or a reset path clears them.';
const STORAGE_UNAVAILABLE_FIRST_LAUNCH_PERSISTENCE_PREVIEW_LINES = [
  'Browser resume is unavailable here because browser storage could not be opened during boot.',
  'Enter World still starts a live session in this tab, but returning to the main menu cannot create a browser resume save until storage access works again.'
] as const;

const createPausedMainMenuShellActionKeybindingSummaryRows = (
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
) => [
  {
    label: 'Binding Set',
    value: matchesDefaultShellActionKeybindingState(shellActionKeybindings)
      ? 'Default set'
      : 'Custom set'
  },
  {
    label: 'Main Menu',
    value: getDesktopReturnToMainMenuHotkeyLabel(shellActionKeybindings)
  },
  {
    label: 'Recenter',
    value: getDesktopRecenterCameraHotkeyLabel(shellActionKeybindings)
  },
  {
    label: 'Debug HUD',
    value: getDesktopDebugOverlayHotkeyLabel(shellActionKeybindings)
  },
  {
    label: 'Edit Panel',
    value: getDesktopDebugEditControlsHotkeyLabel(shellActionKeybindings)
  },
  {
    label: 'Edit Overlays',
    value: getDesktopDebugEditOverlaysHotkeyLabel(shellActionKeybindings)
  },
  {
    label: 'Spawn Marker',
    value: getDesktopPlayerSpawnMarkerHotkeyLabel(shellActionKeybindings)
  }
];

describe('resolveAppShellRegionDisplay', () => {
  it('returns the requested visible display mode when the shell region should be shown', () => {
    expect(resolveAppShellRegionDisplay(true, 'grid')).toBe('grid');
    expect(resolveAppShellRegionDisplay(true, 'flex')).toBe('flex');
  });

  it('forces display none when the shell region should be hidden', () => {
    expect(resolveAppShellRegionDisplay(false, 'grid')).toBe('none');
    expect(resolveAppShellRegionDisplay(false, 'flex')).toBe('none');
  });
});

describe('resolveAppShellViewModel', () => {
  it('keeps the overlay visible during boot without a default action button', () => {
    const viewModel = resolveAppShellViewModel(createDefaultBootShellState());

    expect(viewModel.overlayVisible).toBe(true);
    expect(viewModel.chromeVisible).toBe(false);
    expect(viewModel.stageLabel).toBe('Boot');
    expect(viewModel.primaryActionLabel).toBeNull();
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.quaternaryActionLabel).toBeNull();
    expect(viewModel.quinaryActionLabel).toBeNull();
    expect(viewModel.senaryActionLabel).toBeNull();
    expect(viewModel.returnToMainMenuActionLabel).toBeNull();
    expect(viewModel.recenterCameraActionLabel).toBeNull();
    expect(viewModel.debugOverlayToggleLabel).toBeNull();
    expect(viewModel.debugEditControlsToggleLabel).toBeNull();
    expect(viewModel.debugEditOverlaysToggleLabel).toBeNull();
    expect(viewModel.playerSpawnMarkerToggleLabel).toBeNull();
    expect(viewModel.shortcutsToggleLabel).toBeNull();
    expect(viewModel.shortcutsTogglePressed).toBe(false);
    expect(viewModel.shortcutsOverlayVisible).toBe(false);
    expect(viewModel.menuSections).toEqual([]);
    expect(viewModel.statusText).toContain('Preparing renderer');
    expect(viewModel.detailLines).toEqual([
      'Boot runs before the fixed-step simulation starts so later shell work has a stable entry point.'
    ]);
  });

  it('shows the first-launch main menu with structured enter-world, controls-preview, mixed-device, and persistence-preview guidance cards', () => {
    const viewModel = resolveAppShellViewModel(createFirstLaunchMainMenuShellState());

    expect(viewModel.overlayVisible).toBe(true);
    expect(viewModel.chromeVisible).toBe(false);
    expect(viewModel.stageLabel).toBe('Main Menu');
    expect(viewModel.primaryActionLabel).toBe('Enter World');
    expect(viewModel.statusText).toBe('Renderer ready.');
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.quaternaryActionLabel).toBeNull();
    expect(viewModel.quinaryActionLabel).toBeNull();
    expect(viewModel.senaryActionLabel).toBeNull();
    expect(viewModel.returnToMainMenuActionLabel).toBeNull();
    expect(viewModel.recenterCameraActionLabel).toBeNull();
    expect(viewModel.debugOverlayToggleLabel).toBeNull();
    expect(viewModel.debugEditControlsToggleLabel).toBeNull();
    expect(viewModel.debugEditOverlaysToggleLabel).toBeNull();
    expect(viewModel.playerSpawnMarkerToggleLabel).toBeNull();
    expect(viewModel.shortcutsToggleLabel).toBeNull();
    expect(viewModel.shortcutsTogglePressed).toBe(false);
    expect(viewModel.shortcutsOverlayVisible).toBe(false);
    expect(viewModel.detailLines).toEqual([]);
    expect(viewModel.menuSections).toEqual([
      {
        title: 'Enter World',
        lines: ['Start the fixed-step simulation, standalone player, and live in-world controls.'],
        metadataRows: [
          {
            label: 'Shortcut',
            value: 'Button only'
          },
          {
            label: 'Readiness',
            value: 'Renderer ready; starts on click.'
          }
        ],
        tone: 'accent'
      },
      {
        title: 'Controls Preview',
        lines: [
          'Desktop: move with A or D, or Left or Right Arrow; jump with W, Up Arrow, or Space.',
          'Touch: the in-world player pad appears after Enter World with Left, Right, and Jump buttons.'
        ],
        metadataRows: [
          {
            label: 'Desktop',
            value: 'Movement + jump use the keyboard.'
          },
          {
            label: 'Touch',
            value: 'Player pad appears after Enter World.'
          }
        ]
      },
      {
        title: 'Mixed-Device Runtime',
        lines: [
          'Desktop keeps movement, zoom, pan, and debug editing on the same world session.',
          'Touch keeps the on-screen edit controls and player pad aligned with that same runtime state.'
        ],
        metadataRows: [
          {
            label: 'Readiness',
            value: 'Desktop and touch share one live session.'
          }
        ]
      },
      {
        title: 'Persistence Preview',
        lines: [
          'Browser resume is not available yet because no paused world session has been saved yet.',
          'After Enter World starts the first session, returning to the main menu creates the paused browser save that later boot can resume.'
        ],
        metadataRows: [
          {
            label: 'Current Resume',
            value: 'Not available until the first pause.'
          },
          {
            label: 'Created by',
            value: 'Enter World, then return to main menu.'
          }
        ]
      }
    ]);
  });

  it('surfaces destructive fresh-world guidance in the paused main-menu copy', () => {
    const viewModel = resolveAppShellViewModel(createPausedMainMenuShellState());

    expect(viewModel.overlayVisible).toBe(true);
    expect(viewModel.chromeVisible).toBe(false);
    expect(viewModel.primaryActionLabel).toBe(
      `Resume World (${getDesktopResumeWorldHotkeyLabel()})`
    );
    expect(viewModel.secondaryActionLabel).toBe('Export World Save');
    expect(viewModel.tertiaryActionLabel).toBe('Import World Save');
    expect(viewModel.quaternaryActionLabel).toBe('Clear Saved World');
    expect(viewModel.quinaryActionLabel).toBe('Reset Shell Toggles');
    expect(viewModel.senaryActionLabel).toBe(`New World (${getDesktopFreshWorldHotkeyLabel()})`);
    expect(viewModel.returnToMainMenuActionLabel).toBeNull();
    expect(viewModel.statusText).toBe('World session paused.');
    expect(viewModel.detailLines).toEqual([]);
    expect(viewModel.menuSections).toEqual([
      {
        title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
        lines: ['Continue with the current world, player state, and debug edits intact.'],
        metadataRows: [
          {
            label: 'Shortcut',
            value: getDesktopResumeWorldHotkeyLabel()
          },
          {
            label: 'Consequence',
            value: 'Keeps current world, player, camera, and edits.'
          }
        ],
        tone: 'accent'
      },
      {
        title: 'Export World Save',
        lines: [
          'Download a JSON save file for the current world, player, and camera session state without changing the paused session.'
        ],
        metadataRows: [
          {
            label: 'Shortcut',
            value: 'Button only'
          },
          {
            label: 'Consequence',
            value: 'Keeps the current paused session unchanged.'
          }
        ]
      },
      {
        title: 'Import World Save',
        lines: [
          'Choose a JSON world-save file and replace the paused world, player, and camera session only after the top-level envelope validates and runtime restore succeeds.'
        ],
        metadataRows: [
          {
            label: 'Shortcut',
            value: 'Button only'
          },
          {
            label: 'Consequence',
            value:
              'Validated imports replace the paused session only when runtime restore succeeds; canceled picks, picker failures, invalid saves, or failed restores do not.'
          }
        ]
      },
      {
        title: 'Clear Saved World',
        lines: [
          'Delete the browser-saved world, player, and camera envelope while keeping this paused session active in the current tab until it is saved again.'
        ],
        metadataRows: [
          {
            label: 'Shortcut',
            value: 'Button only'
          },
          {
            label: 'Consequence',
            value: 'Keeps the session but clears browser resume.'
          }
        ]
      },
      {
        title: 'Reset Shell Toggles',
        lines: [
          `Keep the paused session intact while clearing saved shell visibility and restoring the default-off shell layout before the next Resume World (${getDesktopResumeWorldHotkeyLabel()}).`
        ],
        metadataRows: [
          {
            label: 'Shortcut',
            value: 'Button only'
          },
          {
            label: 'Consequence',
            value: 'Keeps the session but clears saved shell visibility.'
          }
        ]
      },
      {
        title: 'Persistence Summary',
        lines: [...DEFAULT_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
        metadataRows: [
          {
            label: 'Status',
            value: 'Browser saved'
          },
          {
            label: 'Resumes',
            value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
          },
          {
            label: 'Saved On',
            value: 'None'
          },
          {
            label: 'Saved Off',
            value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
          },
          {
            label: 'Cleared by',
            value: 'Reset Shell Toggles, New World'
          },
          ...createPausedMainMenuShellActionKeybindingSummaryRows()
        ]
      },
      {
        title: `New World (${getDesktopFreshWorldHotkeyLabel()})`,
        lines: ['Discard the paused session, camera state, and undo history before a fresh world boots.'],
        metadataRows: [
          {
            label: 'Shortcut',
            value: getDesktopFreshWorldHotkeyLabel()
          },
          {
            label: 'Consequence',
            value: 'Replaces the current world, player, camera, and undo state.'
          }
        ],
        tone: 'warning'
      }
    ]);
  });

  it('adds a paused-menu import-result card when the last selected world save was accepted', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        {
          status: 'accepted',
          fileName: 'restore.json'
        }
      )
    );

    expect(viewModel.menuSections[3]).toEqual({
      title: 'Import Result',
      lines: [...ACCEPTED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Accepted'
        },
        {
          label: 'File',
          value: 'restore.json'
        }
      ],
      tone: 'accent'
    });
  });

  it('adds a paused-menu export-result card when the last world-save download succeeded', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        null,
        {
          status: 'downloaded',
          fileName: 'deep-factory-world-save-2026-03-09T05-46-40Z.json'
        }
      )
    );

    expect(viewModel.menuSections[2]).toEqual({
      title: 'Export Result',
      lines: [...DOWNLOADED_PAUSED_MAIN_MENU_EXPORT_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Downloaded'
        },
        {
          label: 'File',
          value: 'deep-factory-world-save-2026-03-09T05-46-40Z.json'
        }
      ],
      tone: 'accent'
    });
  });

  it('adds a paused-menu export-result card when the last world-save download failed', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        null,
        {
          status: 'failed',
          reason: 'blocked download'
        }
      )
    );

    expect(viewModel.menuSections[2]).toEqual({
      title: 'Export Result',
      lines: [...FAILED_PAUSED_MAIN_MENU_EXPORT_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Failed'
        },
        {
          label: 'Reason',
          value: 'blocked download'
        }
      ],
      tone: 'warning'
    });
  });

  it('adds a paused-menu import-result card when the json picker closes without a selected file', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        {
          status: 'cancelled'
        }
      )
    );

    expect(viewModel.menuSections[3]).toEqual({
      title: 'Import Result',
      lines: [...CANCELLED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Canceled'
        }
      ]
    });
  });

  it('adds a paused-menu import-result card when the browser json picker fails before any file is selected', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        {
          status: 'picker-start-failed',
          reason: 'picker blocked'
        }
      )
    );

    expect(viewModel.menuSections[3]).toEqual({
      title: 'Import Result',
      lines: [...PICKER_START_FAILED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Picker failed'
        },
        {
          label: 'Reason',
          value: 'picker blocked'
        }
      ],
      tone: 'warning'
    });
  });

  it('adds a paused-menu import-result card when the last selected world save was rejected', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        {
          status: 'rejected',
          fileName: 'broken.json',
          reason: 'world save envelope kind must be "deep-factory.world-save"'
        }
      )
    );

    expect(viewModel.menuSections[3]).toEqual({
      title: 'Import Result',
      lines: [...REJECTED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Rejected'
        },
        {
          label: 'File',
          value: 'broken.json'
        },
        {
          label: 'Reason',
          value: 'world save envelope kind must be "deep-factory.world-save"'
        }
      ],
      tone: 'warning'
    });
  });

  it('adds a paused-menu import-result card when the selected world save validated but runtime restore failed', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        {
          status: 'restore-failed',
          fileName: 'restore.json',
          reason: 'renderer load failed'
        }
      )
    );

    expect(viewModel.menuSections[3]).toEqual({
      title: 'Import Result',
      lines: [...RESTORE_FAILED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Restore failed'
        },
        {
          label: 'File',
          value: 'restore.json'
        },
        {
          label: 'Reason',
          value: 'renderer load failed'
        }
      ],
      tone: 'warning'
    });
  });

  it('adds a paused-menu import-result card when the selected world save restored but browser persistence rewrite failed', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        {
          status: 'persistence-failed',
          fileName: 'restore.json',
          reason: 'Browser resume data was not updated.'
        }
      )
    );

    expect(viewModel.menuSections[3]).toEqual({
      title: 'Import Result',
      lines: [...PERSISTENCE_FAILED_PAUSED_MAIN_MENU_IMPORT_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Restored, not browser saved'
        },
        {
          label: 'File',
          value: 'restore.json'
        },
        {
          label: 'Reason',
          value: 'Browser resume data was not updated.'
        }
      ],
      tone: 'warning'
    });
  });

  it('adds a paused-menu saved-world-status card when Clear Saved World removed browser resume data', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        'cleared'
      )
    );

    expect(viewModel.menuSections[4]).toEqual({
      title: 'Saved World Status',
      lines: [...CLEARED_PAUSED_MAIN_MENU_WORLD_SAVE_STATUS_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Not browser saved'
        },
        {
          label: 'Saved again by',
          value: 'Resume World, Import World Save, New World'
        }
      ],
      tone: 'warning'
    });
  });

  it('adds a paused-menu clear-saved-world result card when deleting browser resume data fails', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        null,
        null,
        {
          status: 'failed',
          reason: 'Browser resume data was not deleted.'
        }
      )
    );

    expect(viewModel.menuSections[4]).toEqual({
      title: 'Clear Saved World Result',
      lines: [...FAILED_PAUSED_MAIN_MENU_CLEAR_SAVED_WORLD_RESULT_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Failed'
        },
        {
          label: 'Reason',
          value: 'Browser resume data was not deleted.'
        }
      ],
      tone: 'warning'
    });
  });

  it('adds a paused-menu saved-world-status card when an imported session is still not browser-saved after restore persistence failure', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        'import-persistence-failed'
      )
    );

    expect(viewModel.menuSections[4]).toEqual({
      title: 'Saved World Status',
      lines: [...IMPORTED_SESSION_PERSISTENCE_FAILED_SAVED_WORLD_STATUS_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Not browser saved'
        },
        {
          label: 'Saved again by',
          value: 'Later pause or page hide, Import World Save, New World'
        }
      ],
      tone: 'warning'
    });
  });

  it('adds a paused-menu persistence-summary card that inventories resumed toggles plus the saved on and off layout preview', () => {
    const viewModel = resolveAppShellViewModel(createPausedMainMenuShellState());

    expect(viewModel.menuSections[5]).toEqual({
      title: 'Persistence Summary',
      lines: [...DEFAULT_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Browser saved'
        },
        {
          label: 'Resumes',
          value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
        },
        {
          label: 'Saved On',
          value: 'None'
        },
        {
          label: 'Saved Off',
          value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
        },
        {
          label: 'Cleared by',
          value: 'Reset Shell Toggles, New World'
        },
        ...createPausedMainMenuShellActionKeybindingSummaryRows()
      ]
    });
  });

  it('derives paused-menu saved on and saved off rows from the current persisted shell layout', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState({
        debugOverlayVisible: true,
        debugEditControlsVisible: false,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: false,
        shortcutsOverlayVisible: true
      })
    );

    expect(viewModel.menuSections[5]).toEqual({
      title: 'Persistence Summary',
      lines: [...DEFAULT_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Browser saved'
        },
        {
          label: 'Resumes',
          value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
        },
        {
          label: 'Saved On',
          value: 'Debug HUD, Edit Overlays, Shortcuts'
        },
        {
          label: 'Saved Off',
          value: 'Edit Panel, Spawn Marker'
        },
        {
          label: 'Cleared by',
          value: 'Reset Shell Toggles, New World'
        },
        ...createPausedMainMenuShellActionKeybindingSummaryRows()
      ]
    });
  });

  it('uses configured in-world shell-action keybinding labels in the paused-menu persistence summary', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(undefined, true, CUSTOM_SHELL_ACTION_KEYBINDINGS)
    );

    expect(viewModel.menuSections[5]).toEqual({
      title: 'Persistence Summary',
      lines: [...DEFAULT_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Browser saved'
        },
        {
          label: 'Resumes',
          value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
        },
        {
          label: 'Saved On',
          value: 'None'
        },
        {
          label: 'Saved Off',
          value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
        },
        {
          label: 'Cleared by',
          value: 'Reset Shell Toggles, New World'
        },
        ...createPausedMainMenuShellActionKeybindingSummaryRows(CUSTOM_SHELL_ACTION_KEYBINDINGS)
      ]
    });
  });

  it('explains when saved shell-action keybindings defaulted back to the safe set during load', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(undefined, true, createDefaultShellActionKeybindingState(), true)
    );

    expect(viewModel.menuSections[5]).toEqual({
      title: 'Persistence Summary',
      lines: [...DEFAULTED_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Browser saved'
        },
        {
          label: 'Resumes',
          value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
        },
        {
          label: 'Saved On',
          value: 'None'
        },
        {
          label: 'Saved Off',
          value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
        },
        {
          label: 'Cleared by',
          value: 'Reset Shell Toggles, New World'
        },
        ...createPausedMainMenuShellActionKeybindingSummaryRows()
      ]
    });
  });

  it('marks the paused-menu persistence summary as session-only fallback when browser shell storage is unavailable', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        {
          debugOverlayVisible: true,
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: true,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: true
        },
        false
      )
    );

    expect(viewModel.menuSections[5]).toEqual({
      title: 'Persistence Summary',
      lines: [...SESSION_ONLY_FALLBACK_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
      metadataRows: [
        {
          label: 'Status',
          value: 'Session-only fallback'
        },
        {
          label: 'Resumes',
          value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
        },
        {
          label: 'Saved On',
          value: 'Debug HUD, Edit Overlays, Shortcuts'
        },
        {
          label: 'Saved Off',
          value: 'Edit Panel, Spawn Marker'
        },
        {
          label: 'Cleared by',
          value: 'Reset Shell Toggles, New World'
        },
        ...createPausedMainMenuShellActionKeybindingSummaryRows()
      ]
    });
  });

  it('adds a paused-menu shell-profile preview card that summarizes the selected profile before apply', () => {
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        null,
        null,
        null,
        null,
        {
          fileName: 'preview-shell-profile.json',
          shellState: {
            debugOverlayVisible: true,
            debugEditControlsVisible: false,
            debugEditOverlaysVisible: true,
            playerSpawnMarkerVisible: true,
            shortcutsOverlayVisible: false
          },
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        }
      )
    );

    expect(viewModel.menuSections[6]).toEqual({
      title: 'Shell Profile Preview',
      lines: [...PAUSED_MAIN_MENU_SHELL_PROFILE_PREVIEW_LINES],
      metadataRows: [
        {
          label: 'File',
          value: 'preview-shell-profile.json'
        },
        {
          label: 'Saved On',
          value: 'Debug HUD, Edit Overlays, Spawn Marker'
        },
        {
          label: 'Saved Off',
          value: 'Edit Panel, Shortcuts'
        },
        ...createPausedMainMenuShellActionKeybindingSummaryRows(CUSTOM_SHELL_ACTION_KEYBINDINGS)
      ],
      tone: 'accent'
    });
  });

  it('swaps the boot overlay for in-world chrome once the shell enters the world', () => {
    const viewModel = resolveAppShellViewModel(createInWorldShellState());

    expect(viewModel.overlayVisible).toBe(false);
    expect(viewModel.chromeVisible).toBe(true);
    expect(viewModel.stageLabel).toBe('In World');
    expect(viewModel.primaryActionLabel).toBeNull();
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.quaternaryActionLabel).toBeNull();
    expect(viewModel.quinaryActionLabel).toBeNull();
    expect(viewModel.senaryActionLabel).toBeNull();
    expect(viewModel.returnToMainMenuActionLabel).toBe(
      `Main Menu (${getDesktopReturnToMainMenuHotkeyLabel()})`
    );
    expect(viewModel.recenterCameraActionLabel).toBe(
      `Recenter Camera (${getDesktopRecenterCameraHotkeyLabel()})`
    );
    expect(viewModel.debugOverlayToggleLabel).toBe(
      `Show Debug HUD (${getDesktopDebugOverlayHotkeyLabel()})`
    );
    expect(viewModel.debugOverlayTogglePressed).toBe(false);
    expect(viewModel.debugEditControlsToggleLabel).toBe(
      `Show Edit Panel (${getDesktopDebugEditControlsHotkeyLabel()})`
    );
    expect(viewModel.debugEditControlsTogglePressed).toBe(false);
    expect(viewModel.debugEditOverlaysToggleLabel).toBe(
      `Show Edit Overlays (${getDesktopDebugEditOverlaysHotkeyLabel()})`
    );
    expect(viewModel.debugEditOverlaysTogglePressed).toBe(false);
    expect(viewModel.playerSpawnMarkerToggleLabel).toBe(
      `Show Spawn Marker (${getDesktopPlayerSpawnMarkerHotkeyLabel()})`
    );
    expect(viewModel.playerSpawnMarkerTogglePressed).toBe(false);
    expect(viewModel.shortcutsToggleLabel).toBe(
      `Shortcuts (${getDesktopShortcutsOverlayHotkeyLabel()})`
    );
    expect(viewModel.shortcutsTogglePressed).toBe(false);
    expect(viewModel.shortcutsOverlayVisible).toBe(false);
    expect(viewModel.detailLines).toEqual([]);
    expect(viewModel.menuSections).toEqual([]);
  });

  it('reflects the in-world shortcuts overlay toggle state', () => {
    const viewModel = resolveAppShellViewModel(createInWorldShellState({
      shortcutsOverlayVisible: true
    }));

    expect(viewModel.shortcutsToggleLabel).toBe(
      `Shortcuts (${getDesktopShortcutsOverlayHotkeyLabel()})`
    );
    expect(viewModel.shortcutsTogglePressed).toBe(true);
    expect(viewModel.shortcutsOverlayVisible).toBe(true);
  });

  it('reflects the active debug hud toggle state while in-world', () => {
    const viewModel = resolveAppShellViewModel(
      createInWorldShellState({ debugOverlayVisible: true })
    );

    expect(viewModel.chromeVisible).toBe(true);
    expect(viewModel.returnToMainMenuActionLabel).toBe(
      `Main Menu (${getDesktopReturnToMainMenuHotkeyLabel()})`
    );
    expect(viewModel.recenterCameraActionLabel).toBe(
      `Recenter Camera (${getDesktopRecenterCameraHotkeyLabel()})`
    );
    expect(viewModel.debugOverlayToggleLabel).toBe(
      `Hide Debug HUD (${getDesktopDebugOverlayHotkeyLabel()})`
    );
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.debugOverlayTogglePressed).toBe(true);
    expect(viewModel.debugEditControlsToggleLabel).toBe(
      `Show Edit Panel (${getDesktopDebugEditControlsHotkeyLabel()})`
    );
    expect(viewModel.debugEditControlsTogglePressed).toBe(false);
    expect(viewModel.debugEditOverlaysToggleLabel).toBe(
      `Show Edit Overlays (${getDesktopDebugEditOverlaysHotkeyLabel()})`
    );
    expect(viewModel.debugEditOverlaysTogglePressed).toBe(false);
    expect(viewModel.playerSpawnMarkerToggleLabel).toBe(
      `Show Spawn Marker (${getDesktopPlayerSpawnMarkerHotkeyLabel()})`
    );
    expect(viewModel.playerSpawnMarkerTogglePressed).toBe(false);
  });

  it('reflects the full debug-edit panel toggle state while in-world', () => {
    const viewModel = resolveAppShellViewModel(createInWorldShellState({
      debugEditControlsVisible: true
    }));

    expect(viewModel.chromeVisible).toBe(true);
    expect(viewModel.returnToMainMenuActionLabel).toBe(
      `Main Menu (${getDesktopReturnToMainMenuHotkeyLabel()})`
    );
    expect(viewModel.recenterCameraActionLabel).toBe(
      `Recenter Camera (${getDesktopRecenterCameraHotkeyLabel()})`
    );
    expect(viewModel.debugOverlayToggleLabel).toBe(
      `Show Debug HUD (${getDesktopDebugOverlayHotkeyLabel()})`
    );
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.debugEditControlsToggleLabel).toBe(
      `Hide Edit Panel (${getDesktopDebugEditControlsHotkeyLabel()})`
    );
    expect(viewModel.debugEditControlsTogglePressed).toBe(true);
    expect(viewModel.debugEditOverlaysToggleLabel).toBe(
      `Show Edit Overlays (${getDesktopDebugEditOverlaysHotkeyLabel()})`
    );
    expect(viewModel.playerSpawnMarkerToggleLabel).toBe(
      `Show Spawn Marker (${getDesktopPlayerSpawnMarkerHotkeyLabel()})`
    );
  });

  it('reflects the compact edit overlay toggle state while in-world', () => {
    const viewModel = resolveAppShellViewModel(createInWorldShellState({
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: true
    }));

    expect(viewModel.chromeVisible).toBe(true);
    expect(viewModel.returnToMainMenuActionLabel).toBe(
      `Main Menu (${getDesktopReturnToMainMenuHotkeyLabel()})`
    );
    expect(viewModel.recenterCameraActionLabel).toBe(
      `Recenter Camera (${getDesktopRecenterCameraHotkeyLabel()})`
    );
    expect(viewModel.debugOverlayToggleLabel).toBe(
      `Show Debug HUD (${getDesktopDebugOverlayHotkeyLabel()})`
    );
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.debugEditControlsToggleLabel).toBe(
      `Show Edit Panel (${getDesktopDebugEditControlsHotkeyLabel()})`
    );
    expect(viewModel.debugEditOverlaysToggleLabel).toBe(
      `Show Edit Overlays (${getDesktopDebugEditOverlaysHotkeyLabel()})`
    );
    expect(viewModel.debugEditOverlaysTogglePressed).toBe(false);
    expect(viewModel.playerSpawnMarkerToggleLabel).toBe(
      `Hide Spawn Marker (${getDesktopPlayerSpawnMarkerHotkeyLabel()})`
    );
    expect(viewModel.playerSpawnMarkerTogglePressed).toBe(true);
  });

  it('reflects the spawn marker toggle state while in-world', () => {
    const viewModel = resolveAppShellViewModel(createInWorldShellState({
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: false
    }));

    expect(viewModel.chromeVisible).toBe(true);
    expect(viewModel.returnToMainMenuActionLabel).toBe(
      `Main Menu (${getDesktopReturnToMainMenuHotkeyLabel()})`
    );
    expect(viewModel.recenterCameraActionLabel).toBe(
      `Recenter Camera (${getDesktopRecenterCameraHotkeyLabel()})`
    );
    expect(viewModel.debugOverlayToggleLabel).toBe(
      `Show Debug HUD (${getDesktopDebugOverlayHotkeyLabel()})`
    );
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.debugEditControlsToggleLabel).toBe(
      `Show Edit Panel (${getDesktopDebugEditControlsHotkeyLabel()})`
    );
    expect(viewModel.debugEditOverlaysToggleLabel).toBe(
      `Hide Edit Overlays (${getDesktopDebugEditOverlaysHotkeyLabel()})`
    );
    expect(viewModel.playerSpawnMarkerToggleLabel).toBe(
      `Show Spawn Marker (${getDesktopPlayerSpawnMarkerHotkeyLabel()})`
    );
    expect(viewModel.playerSpawnMarkerTogglePressed).toBe(false);
  });

  it('uses configured in-world shell-action keybinding labels in chrome buttons', () => {
    const viewModel = resolveAppShellViewModel(
      createInWorldShellState({
        shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
      })
    );

    expect(viewModel.returnToMainMenuActionLabel).toBe('Main Menu (X)');
    expect(viewModel.recenterCameraActionLabel).toBe('Recenter Camera (Z)');
    expect(viewModel.debugOverlayToggleLabel).toBe('Show Debug HUD (U)');
    expect(viewModel.debugEditControlsToggleLabel).toBe('Show Edit Panel (J)');
    expect(viewModel.debugEditOverlaysToggleLabel).toBe('Show Edit Overlays (K)');
    expect(viewModel.playerSpawnMarkerToggleLabel).toBe('Show Spawn Marker (Y)');
  });

  it('keeps the boot overlay contract for the WebGL-unavailable boot helper', () => {
    const viewModel = resolveAppShellViewModel(createWebGlUnavailableBootShellState());

    expect(viewModel.overlayVisible).toBe(true);
    expect(viewModel.chromeVisible).toBe(false);
    expect(viewModel.primaryActionLabel).toBeNull();
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.returnToMainMenuActionLabel).toBeNull();
    expect(viewModel.recenterCameraActionLabel).toBeNull();
    expect(viewModel.statusText).toBe('WebGL2 is not available in this browser.');
    expect(viewModel.detailLines).toEqual(['Use a current Chrome, Firefox, or Safari build to continue.']);
    expect(viewModel.menuSections).toEqual([]);
    expect(viewModel.debugEditControlsToggleLabel).toBeNull();
    expect(viewModel.debugEditOverlaysToggleLabel).toBeNull();
    expect(viewModel.playerSpawnMarkerToggleLabel).toBeNull();
    expect(viewModel.shortcutsToggleLabel).toBeNull();
    expect(viewModel.shortcutsTogglePressed).toBe(false);
    expect(viewModel.shortcutsOverlayVisible).toBe(false);
  });
});

describe('createDefaultBootShellState', () => {
  it('returns the explicit default boot loading copy', () => {
    expect(createDefaultBootShellState()).toEqual({
      screen: 'boot',
      statusText: 'Preparing renderer, controls, and spawn state.',
      detailLines: [
        'Boot runs before the fixed-step simulation starts so later shell work has a stable entry point.'
      ]
    });
  });
});

describe('createInWorldShellState', () => {
  it('returns the explicit active-session shell state with all toggles defaulted off', () => {
    expect(createInWorldShellState()).toEqual({
      screen: 'in-world',
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false,
      shellActionKeybindings: createDefaultShellActionKeybindingState()
    });
  });
});

describe('createFirstLaunchMainMenuShellState', () => {
  it('returns an explicit first-launch main-menu state with structured guidance cards', () => {
    expect(createFirstLaunchMainMenuShellState()).toEqual({
      screen: 'main-menu',
      statusText: 'Renderer ready.',
      detailLines: [],
      menuSections: [
        {
          title: 'Enter World',
          lines: ['Start the fixed-step simulation, standalone player, and live in-world controls.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Readiness',
              value: 'Renderer ready; starts on click.'
            }
          ],
          tone: 'accent'
        },
        {
          title: 'Controls Preview',
          lines: [
            'Desktop: move with A or D, or Left or Right Arrow; jump with W, Up Arrow, or Space.',
            'Touch: the in-world player pad appears after Enter World with Left, Right, and Jump buttons.'
          ],
          metadataRows: [
            {
              label: 'Desktop',
              value: 'Movement + jump use the keyboard.'
            },
            {
              label: 'Touch',
              value: 'Player pad appears after Enter World.'
            }
          ]
        },
        {
          title: 'Mixed-Device Runtime',
          lines: [
            'Desktop keeps movement, zoom, pan, and debug editing on the same world session.',
            'Touch keeps the on-screen edit controls and player pad aligned with that same runtime state.'
          ],
          metadataRows: [
            {
              label: 'Readiness',
              value: 'Desktop and touch share one live session.'
            }
          ]
        },
        {
          title: 'Persistence Preview',
          lines: [
            'Browser resume is not available yet because no paused world session has been saved yet.',
            'After Enter World starts the first session, returning to the main menu creates the paused browser save that later boot can resume.'
          ],
          metadataRows: [
            {
              label: 'Current Resume',
              value: 'Not available until the first pause.'
            },
            {
              label: 'Created by',
              value: 'Enter World, then return to main menu.'
            }
          ]
        }
      ],
      primaryActionLabel: 'Enter World',
      secondaryActionLabel: null,
      tertiaryActionLabel: null
    });
  });

  it('returns warning persistence-preview guidance when browser resume storage is unavailable during boot', () => {
    expect(createFirstLaunchMainMenuShellState(false)).toEqual({
      screen: 'main-menu',
      statusText: 'Renderer ready.',
      detailLines: [],
      menuSections: [
        {
          title: 'Enter World',
          lines: ['Start the fixed-step simulation, standalone player, and live in-world controls.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Readiness',
              value: 'Renderer ready; starts on click.'
            }
          ],
          tone: 'accent'
        },
        {
          title: 'Controls Preview',
          lines: [
            'Desktop: move with A or D, or Left or Right Arrow; jump with W, Up Arrow, or Space.',
            'Touch: the in-world player pad appears after Enter World with Left, Right, and Jump buttons.'
          ],
          metadataRows: [
            {
              label: 'Desktop',
              value: 'Movement + jump use the keyboard.'
            },
            {
              label: 'Touch',
              value: 'Player pad appears after Enter World.'
            }
          ]
        },
        {
          title: 'Mixed-Device Runtime',
          lines: [
            'Desktop keeps movement, zoom, pan, and debug editing on the same world session.',
            'Touch keeps the on-screen edit controls and player pad aligned with that same runtime state.'
          ],
          metadataRows: [
            {
              label: 'Readiness',
              value: 'Desktop and touch share one live session.'
            }
          ]
        },
        {
          title: 'Persistence Preview',
          lines: [...STORAGE_UNAVAILABLE_FIRST_LAUNCH_PERSISTENCE_PREVIEW_LINES],
          metadataRows: [
            {
              label: 'Current Resume',
              value: 'Unavailable in this browser context.'
            },
            {
              label: 'Requires',
              value: 'Working browser storage access.'
            }
          ],
          tone: 'warning'
        }
      ],
      primaryActionLabel: 'Enter World',
      secondaryActionLabel: null,
      tertiaryActionLabel: null
    });
  });
});

describe('createMainMenuShellState', () => {
  it('returns the first-launch main menu when no resumable world session exists', () => {
    expect(createMainMenuShellState(false)).toEqual(createFirstLaunchMainMenuShellState());
  });

  it('returns the storage-unavailable first-launch main menu when resume persistence is unavailable', () => {
    expect(
      createMainMenuShellState(
        false,
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        null,
        null,
        null,
        null,
        false
      )
    ).toEqual(createFirstLaunchMainMenuShellState(false));
  });

  it('returns the paused main menu when a resumable world session exists', () => {
    expect(createMainMenuShellState(true)).toEqual(createPausedMainMenuShellState());
  });
});

describe('createWebGlUnavailableBootShellState', () => {
  it('returns the explicit boot-failure copy for missing WebGL2 support', () => {
    expect(createWebGlUnavailableBootShellState()).toEqual({
      screen: 'boot',
      statusText: 'WebGL2 is not available in this browser.',
      detailLines: ['Use a current Chrome, Firefox, or Safari build to continue.']
    });
  });
});

describe('createRendererInitializationFailedBootShellState', () => {
  it('preserves a non-empty renderer initialization error message in the boot failure copy', () => {
    expect(createRendererInitializationFailedBootShellState(new Error('GPU device lost'))).toEqual({
      screen: 'boot',
      statusText: 'Renderer initialization failed.',
      detailLines: ['GPU device lost']
    });
  });

  it('falls back to reload guidance when renderer initialization fails without a usable error message', () => {
    expect(createRendererInitializationFailedBootShellState(new Error('   '))).toEqual({
      screen: 'boot',
      statusText: 'Renderer initialization failed.',
      detailLines: ['Reload the page after confirming WebGL2 is available.']
    });
  });
});

describe('createPausedMainMenuShellState', () => {
  it('returns a concise paused headline plus structured session guidance cards', () => {
    expect(createPausedMainMenuShellState()).toEqual({
      screen: 'main-menu',
      statusText: 'World session paused.',
      detailLines: [],
      menuSections: [
        {
          title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
          lines: ['Continue with the current world, player state, and debug edits intact.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopResumeWorldHotkeyLabel()
            },
            {
              label: 'Consequence',
              value: 'Keeps current world, player, camera, and edits.'
            }
          ],
          tone: 'accent'
        },
        {
          title: 'Export World Save',
          lines: [
            'Download a JSON save file for the current world, player, and camera session state without changing the paused session.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the current paused session unchanged.'
            }
          ]
        },
        {
          title: 'Import World Save',
          lines: [
            'Choose a JSON world-save file and replace the paused world, player, and camera session only after the top-level envelope validates and runtime restore succeeds.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value:
                'Validated imports replace the paused session only when runtime restore succeeds; canceled picks, picker failures, invalid saves, or failed restores do not.'
            }
          ]
        },
        {
          title: 'Clear Saved World',
          lines: [
            'Delete the browser-saved world, player, and camera envelope while keeping this paused session active in the current tab until it is saved again.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the session but clears browser resume.'
            }
          ]
        },
        {
          title: 'Reset Shell Toggles',
          lines: [
            `Keep the paused session intact while clearing saved shell visibility and restoring the default-off shell layout before the next Resume World (${getDesktopResumeWorldHotkeyLabel()}).`
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the session but clears saved shell visibility.'
            }
          ]
        },
        {
          title: 'Persistence Summary',
          lines: [
            ...DEFAULT_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES
          ],
          metadataRows: [
            {
              label: 'Status',
              value: 'Browser saved'
            },
            {
              label: 'Resumes',
              value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
            },
            {
              label: 'Saved On',
              value: 'None'
            },
            {
              label: 'Saved Off',
              value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
            },
            {
              label: 'Cleared by',
              value: 'Reset Shell Toggles, New World'
            },
            ...createPausedMainMenuShellActionKeybindingSummaryRows()
          ]
        },
        {
          title: `New World (${getDesktopFreshWorldHotkeyLabel()})`,
          lines: ['Discard the paused session, camera state, and undo history before a fresh world boots.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopFreshWorldHotkeyLabel()
            },
            {
              label: 'Consequence',
              value: 'Replaces the current world, player, camera, and undo state.'
            }
          ],
          tone: 'warning'
        }
      ],
      primaryActionLabel: 'Resume World',
      secondaryActionLabel: 'Export World Save',
      tertiaryActionLabel: 'Import World Save',
      quaternaryActionLabel: 'Clear Saved World',
      quinaryActionLabel: 'Reset Shell Toggles',
      senaryActionLabel: 'New World',
      shellActionKeybindings: createDefaultShellActionKeybindingState(),
      worldSessionShellPersistenceAvailable: true
    });
  });

  it('adds saved-world status guidance after Clear Saved World removes browser resume data', () => {
    expect(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        'cleared'
      )
    ).toEqual({
      screen: 'main-menu',
      statusText: 'World session paused.',
      detailLines: [],
      menuSections: [
        {
          title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
          lines: ['Continue with the current world, player state, and debug edits intact.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopResumeWorldHotkeyLabel()
            },
            {
              label: 'Consequence',
              value: 'Keeps current world, player, camera, and edits.'
            }
          ],
          tone: 'accent'
        },
        {
          title: 'Export World Save',
          lines: [
            'Download a JSON save file for the current world, player, and camera session state without changing the paused session.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the current paused session unchanged.'
            }
          ]
        },
        {
          title: 'Import World Save',
          lines: [
            'Choose a JSON world-save file and replace the paused world, player, and camera session only after the top-level envelope validates and runtime restore succeeds.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value:
                'Validated imports replace the paused session only when runtime restore succeeds; canceled picks, picker failures, invalid saves, or failed restores do not.'
            }
          ]
        },
        {
          title: 'Clear Saved World',
          lines: [
            'Delete the browser-saved world, player, and camera envelope while keeping this paused session active in the current tab until it is saved again.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the session but clears browser resume.'
            }
          ]
        },
        {
          title: 'Saved World Status',
          lines: [...CLEARED_PAUSED_MAIN_MENU_WORLD_SAVE_STATUS_LINES],
          metadataRows: [
            {
              label: 'Status',
              value: 'Not browser saved'
            },
            {
              label: 'Saved again by',
              value: 'Resume World, Import World Save, New World'
            }
          ],
          tone: 'warning'
        },
        {
          title: 'Reset Shell Toggles',
          lines: [
            `Keep the paused session intact while clearing saved shell visibility and restoring the default-off shell layout before the next Resume World (${getDesktopResumeWorldHotkeyLabel()}).`
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the session but clears saved shell visibility.'
            }
          ]
        },
        {
          title: 'Persistence Summary',
          lines: [...DEFAULT_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
          metadataRows: [
            {
              label: 'Status',
              value: 'Browser saved'
            },
            {
              label: 'Resumes',
              value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
            },
            {
              label: 'Saved On',
              value: 'None'
            },
            {
              label: 'Saved Off',
              value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
            },
            {
              label: 'Cleared by',
              value: 'Reset Shell Toggles, New World'
            },
            ...createPausedMainMenuShellActionKeybindingSummaryRows()
          ]
        },
        {
          title: `New World (${getDesktopFreshWorldHotkeyLabel()})`,
          lines: ['Discard the paused session, camera state, and undo history before a fresh world boots.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopFreshWorldHotkeyLabel()
            },
            {
              label: 'Consequence',
              value: 'Replaces the current world, player, camera, and undo state.'
            }
          ],
          tone: 'warning'
        }
      ],
      primaryActionLabel: 'Resume World',
      secondaryActionLabel: 'Export World Save',
      tertiaryActionLabel: 'Import World Save',
      quaternaryActionLabel: 'Clear Saved World',
      quinaryActionLabel: 'Reset Shell Toggles',
      senaryActionLabel: 'New World',
      shellActionKeybindings: createDefaultShellActionKeybindingState(),
      worldSessionShellPersistenceAvailable: true
    });
  });

  it('adds reset-shell-toggles result guidance after clearing saved shell visibility for the next resume', () => {
    expect(
      createPausedMainMenuShellState(
        undefined,
        true,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        null,
        null,
        null,
        {
          status: 'cleared'
        }
      )
    ).toEqual({
      screen: 'main-menu',
      statusText: 'World session paused.',
      detailLines: [],
      menuSections: [
        {
          title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
          lines: ['Continue with the current world, player state, and debug edits intact.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopResumeWorldHotkeyLabel()
            },
            {
              label: 'Consequence',
              value: 'Keeps current world, player, camera, and edits.'
            }
          ],
          tone: 'accent'
        },
        {
          title: 'Export World Save',
          lines: [
            'Download a JSON save file for the current world, player, and camera session state without changing the paused session.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the current paused session unchanged.'
            }
          ]
        },
        {
          title: 'Import World Save',
          lines: [
            'Choose a JSON world-save file and replace the paused world, player, and camera session only after the top-level envelope validates and runtime restore succeeds.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value:
                'Validated imports replace the paused session only when runtime restore succeeds; canceled picks, picker failures, invalid saves, or failed restores do not.'
            }
          ]
        },
        {
          title: 'Clear Saved World',
          lines: [
            'Delete the browser-saved world, player, and camera envelope while keeping this paused session active in the current tab until it is saved again.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the session but clears browser resume.'
            }
          ]
        },
        {
          title: 'Reset Shell Toggles',
          lines: [
            `Keep the paused session intact while clearing saved shell visibility and restoring the default-off shell layout before the next Resume World (${getDesktopResumeWorldHotkeyLabel()}).`
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the session but clears saved shell visibility.'
            }
          ]
        },
        {
          title: 'Reset Shell Toggles Result',
          lines: [...CLEARED_PAUSED_MAIN_MENU_RESET_SHELL_TOGGLES_RESULT_LINES],
          metadataRows: [
            {
              label: 'Status',
              value: 'Cleared for next resume'
            },
            {
              label: 'Next Resume',
              value: 'Default-off shell layout'
            }
          ],
          tone: 'accent'
        },
        {
          title: 'Persistence Summary',
          lines: [...DEFAULT_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
          metadataRows: [
            {
              label: 'Status',
              value: 'Browser saved'
            },
            {
              label: 'Resumes',
              value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
            },
            {
              label: 'Saved On',
              value: 'None'
            },
            {
              label: 'Saved Off',
              value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
            },
            {
              label: 'Cleared by',
              value: 'Reset Shell Toggles, New World'
            },
            ...createPausedMainMenuShellActionKeybindingSummaryRows()
          ]
        },
        {
          title: `New World (${getDesktopFreshWorldHotkeyLabel()})`,
          lines: ['Discard the paused session, camera state, and undo history before a fresh world boots.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopFreshWorldHotkeyLabel()
            },
            {
              label: 'Consequence',
              value: 'Replaces the current world, player, camera, and undo state.'
            }
          ],
          tone: 'warning'
        }
      ],
      primaryActionLabel: 'Resume World',
      secondaryActionLabel: 'Export World Save',
      tertiaryActionLabel: 'Import World Save',
      quaternaryActionLabel: 'Clear Saved World',
      quinaryActionLabel: 'Reset Shell Toggles',
      senaryActionLabel: 'New World',
      shellActionKeybindings: createDefaultShellActionKeybindingState(),
      worldSessionShellPersistenceAvailable: true,
      pausedMainMenuResetShellTogglesResult: {
        status: 'cleared'
      }
    });
  });

  it('adds reset-shell-toggles warning guidance when browser shell storage could not be cleared', () => {
    expect(
      createPausedMainMenuShellState(
        undefined,
        false,
        createDefaultShellActionKeybindingState(),
        false,
        null,
        null,
        null,
        null,
        {
          status: 'persistence-failed',
          reason: 'remove blocked'
        }
      )
    ).toEqual({
      screen: 'main-menu',
      statusText: 'World session paused.',
      detailLines: [],
      menuSections: [
        {
          title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
          lines: ['Continue with the current world, player state, and debug edits intact.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopResumeWorldHotkeyLabel()
            },
            {
              label: 'Consequence',
              value: 'Keeps current world, player, camera, and edits.'
            }
          ],
          tone: 'accent'
        },
        {
          title: 'Export World Save',
          lines: [
            'Download a JSON save file for the current world, player, and camera session state without changing the paused session.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the current paused session unchanged.'
            }
          ]
        },
        {
          title: 'Import World Save',
          lines: [
            'Choose a JSON world-save file and replace the paused world, player, and camera session only after the top-level envelope validates and runtime restore succeeds.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value:
                'Validated imports replace the paused session only when runtime restore succeeds; canceled picks, picker failures, invalid saves, or failed restores do not.'
            }
          ]
        },
        {
          title: 'Clear Saved World',
          lines: [
            'Delete the browser-saved world, player, and camera envelope while keeping this paused session active in the current tab until it is saved again.'
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the session but clears browser resume.'
            }
          ]
        },
        {
          title: 'Reset Shell Toggles',
          lines: [
            `Keep the paused session intact while clearing saved shell visibility and restoring the default-off shell layout before the next Resume World (${getDesktopResumeWorldHotkeyLabel()}).`
          ],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Consequence',
              value: 'Keeps the session but clears saved shell visibility.'
            }
          ]
        },
        {
          title: 'Reset Shell Toggles Result',
          lines: [...PERSISTENCE_FAILED_PAUSED_MAIN_MENU_RESET_SHELL_TOGGLES_RESULT_LINES],
          metadataRows: [
            {
              label: 'Status',
              value: 'Current session only'
            },
            {
              label: 'Reason',
              value: 'remove blocked'
            }
          ],
          tone: 'warning'
        },
        {
          title: 'Persistence Summary',
          lines: [...SESSION_ONLY_FALLBACK_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES],
          metadataRows: [
            {
              label: 'Status',
              value: 'Session-only fallback'
            },
            {
              label: 'Resumes',
              value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
            },
            {
              label: 'Saved On',
              value: 'None'
            },
            {
              label: 'Saved Off',
              value: 'Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, Shortcuts'
            },
            {
              label: 'Cleared by',
              value: 'Reset Shell Toggles, New World'
            },
            ...createPausedMainMenuShellActionKeybindingSummaryRows()
          ]
        },
        {
          title: `New World (${getDesktopFreshWorldHotkeyLabel()})`,
          lines: ['Discard the paused session, camera state, and undo history before a fresh world boots.'],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopFreshWorldHotkeyLabel()
            },
            {
              label: 'Consequence',
              value: 'Replaces the current world, player, camera, and undo state.'
            }
          ],
          tone: 'warning'
        }
      ],
      primaryActionLabel: 'Resume World',
      secondaryActionLabel: 'Export World Save',
      tertiaryActionLabel: 'Import World Save',
      quaternaryActionLabel: 'Clear Saved World',
      quinaryActionLabel: 'Reset Shell Toggles',
      senaryActionLabel: 'New World',
      shellActionKeybindings: createDefaultShellActionKeybindingState(),
      worldSessionShellPersistenceAvailable: false,
      pausedMainMenuResetShellTogglesResult: {
        status: 'persistence-failed',
        reason: 'remove blocked'
      }
    });
  });
});

describe('resolveInWorldDebugEditControlsToggleTitle', () => {
  it('includes the edit-panel desktop shortcut when the panel is hidden', () => {
    expect(resolveInWorldDebugEditControlsToggleTitle(false)).toBe(
      `Show the full debug-edit control panel (${getDesktopDebugEditControlsHotkeyLabel()})`
    );
  });

  it('includes the edit-panel desktop shortcut when the panel is visible', () => {
    expect(resolveInWorldDebugEditControlsToggleTitle(true)).toBe(
      `Hide the full debug-edit control panel (${getDesktopDebugEditControlsHotkeyLabel()})`
    );
  });

  it('uses configured shell-action keybinding labels when provided', () => {
    expect(
      resolveInWorldDebugEditControlsToggleTitle(true, CUSTOM_SHELL_ACTION_KEYBINDINGS)
    ).toBe('Hide the full debug-edit control panel (J)');
  });
});

describe('resolvePausedMainMenuExportWorldSaveTitle', () => {
  it('explains that paused-menu export downloads a json save without mutating the session', () => {
    expect(resolvePausedMainMenuExportWorldSaveTitle()).toBe(
      'Download a JSON world-save copy of the paused session without changing the current world, player, or camera state'
    );
  });
});

describe('resolvePausedMainMenuImportWorldSaveTitle', () => {
  it('explains that paused-menu import replaces the session only after the selected envelope validates and restore succeeds', () => {
    expect(resolvePausedMainMenuImportWorldSaveTitle()).toBe(
      'Choose a JSON world-save file and replace the paused session only when its top-level envelope validates and runtime restore succeeds'
    );
  });
});

describe('resolvePausedMainMenuClearSavedWorldTitle', () => {
  it('explains that paused-menu clear removes the browser save without discarding the current paused session', () => {
    expect(resolvePausedMainMenuClearSavedWorldTitle()).toBe(
      'Delete the browser-saved paused session while keeping the current world open in this tab until it is saved again'
    );
  });
});

describe('resolvePausedMainMenuFreshWorldTitle', () => {
  it('includes the paused-menu New World desktop shortcut in the destructive tooltip copy', () => {
    expect(resolvePausedMainMenuFreshWorldTitle()).toBe(
      `Discard the paused session, camera state, and undo history, then boot a fresh world (${getDesktopFreshWorldHotkeyLabel()})`
    );
  });
});

describe('resolvePausedMainMenuResumeWorldTitle', () => {
  it('includes the paused-menu Resume World desktop shortcut in the resume tooltip copy', () => {
    expect(resolvePausedMainMenuResumeWorldTitle()).toBe(
      `Resume the paused world session with current player, camera state, and debug edits intact (${getDesktopResumeWorldHotkeyLabel()})`
    );
  });
});

describe('resolvePausedMainMenuResetShellTogglesTitle', () => {
  it('explains that paused-menu reset clears saved shell visibility and reapplies default-off layout', () => {
    expect(resolvePausedMainMenuResetShellTogglesTitle()).toBe(
      'Clear saved in-world shell visibility preferences and restore the paused session to the default-off shell layout before the next resume'
    );
  });
});

describe('resolvePausedMainMenuExportShellProfileTitle', () => {
  it('explains that paused-menu shell-profile export downloads shell toggles and hotkeys without mutating the session', () => {
    expect(resolvePausedMainMenuExportShellProfileTitle()).toBe(
      'Download a JSON shell-profile copy of the current shell visibility toggles and shell hotkeys without changing the paused session'
    );
  });
});

describe('resolvePausedMainMenuImportShellProfileTitle', () => {
  it('explains that paused-menu shell-profile import validates and previews shell toggles and hotkeys before apply', () => {
    expect(resolvePausedMainMenuImportShellProfileTitle()).toBe(
      'Choose a JSON shell-profile file, validate its shell toggles and shell hotkeys, and preview them before applying the profile to the current paused session'
    );
  });
});

describe('resolvePausedMainMenuApplyShellProfileTitle', () => {
  it('explains that paused-menu shell-profile apply commits the current preview into the paused session', () => {
    expect(resolvePausedMainMenuApplyShellProfileTitle()).toBe(
      'Apply the currently previewed shell-profile toggles and hotkeys to the current paused session'
    );
  });
});

describe('resolvePausedMainMenuShellActionKeybindingEditorIntro', () => {
  it('switches between browser-saved and session-only helper copy for the paused-menu shell-hotkey editor', () => {
    expect(resolvePausedMainMenuShellActionKeybindingEditorIntro()).toBe(
      DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_INTRO
    );
    expect(resolvePausedMainMenuShellActionKeybindingEditorIntro(false)).toBe(
      SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_INTRO
    );
  });
});

describe('paused main-menu tooltip-title resolution', () => {
  it('uses paused-session tooltip titles when resume, export, import, clear-saved-world, reset-shell, and fresh-world actions are active', () => {
    const pausedState = createPausedMainMenuShellState();

    expect(resolveMainMenuPrimaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuResumeWorldTitle()
    );
    expect(resolveMainMenuSecondaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuExportWorldSaveTitle()
    );
    expect(resolveMainMenuTertiaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuImportWorldSaveTitle()
    );
    expect(resolveMainMenuQuaternaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuClearSavedWorldTitle()
    );
    expect(resolveMainMenuQuinaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuResetShellTogglesTitle()
    );
    expect(resolveMainMenuSenaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuFreshWorldTitle()
    );
  });

  it('clears paused-session tooltip titles when first-launch main-menu copy is restored', () => {
    const pausedState = createPausedMainMenuShellState();

    expect(resolveMainMenuPrimaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuResumeWorldTitle()
    );
    expect(resolveMainMenuSecondaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuExportWorldSaveTitle()
    );
    expect(resolveMainMenuTertiaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuImportWorldSaveTitle()
    );
    expect(resolveMainMenuQuaternaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuClearSavedWorldTitle()
    );
    expect(resolveMainMenuQuinaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuResetShellTogglesTitle()
    );
    expect(resolveMainMenuSenaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuFreshWorldTitle()
    );

    const firstLaunchState = createFirstLaunchMainMenuShellState();
    expect(resolveMainMenuPrimaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuSecondaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuTertiaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuQuaternaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuQuinaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuSenaryActionTitle(firstLaunchState)).toBe('');
  });

  it('restores paused-session tooltip titles after first-launch main-menu copy transitions back to a resumable session', () => {
    const pausedState = createPausedMainMenuShellState();

    expect(resolveMainMenuPrimaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuResumeWorldTitle()
    );
    expect(resolveMainMenuSecondaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuExportWorldSaveTitle()
    );
    expect(resolveMainMenuTertiaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuImportWorldSaveTitle()
    );
    expect(resolveMainMenuQuaternaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuClearSavedWorldTitle()
    );
    expect(resolveMainMenuQuinaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuResetShellTogglesTitle()
    );
    expect(resolveMainMenuSenaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuFreshWorldTitle()
    );

    const firstLaunchState = createFirstLaunchMainMenuShellState();
    expect(resolveMainMenuPrimaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuSecondaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuTertiaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuQuaternaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuQuinaryActionTitle(firstLaunchState)).toBe('');
    expect(resolveMainMenuSenaryActionTitle(firstLaunchState)).toBe('');

    expect(resolveMainMenuPrimaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuResumeWorldTitle()
    );
    expect(resolveMainMenuSecondaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuExportWorldSaveTitle()
    );
    expect(resolveMainMenuTertiaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuImportWorldSaveTitle()
    );
    expect(resolveMainMenuQuaternaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuClearSavedWorldTitle()
    );
    expect(resolveMainMenuQuinaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuResetShellTogglesTitle()
    );
    expect(resolveMainMenuSenaryActionTitle(pausedState)).toBe(
      resolvePausedMainMenuFreshWorldTitle()
    );
  });
});
