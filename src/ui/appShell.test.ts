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
  createPausedMainMenuSectionViewModel,
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
  resolvePausedMainMenuClearShellProfilePreviewTitle,
  resolvePausedMainMenuExportWorldSaveTitle,
  resolvePausedMainMenuExportShellProfileTitle,
  resolvePausedMainMenuFreshWorldTitle,
  resolvePausedMainMenuApplyShellProfileEditorStatus,
  resolvePausedMainMenuHelpCopySectionState,
  resolvePausedMainMenuHelpCopyToggleLabel,
  resolvePausedMainMenuResultsSectionState,
  resolvePausedMainMenuResultsToggleLabel,
  resolvePausedMainMenuShellSettingsSectionState,
  resolvePausedMainMenuShellSettingsSummaryLine,
  resolvePausedMainMenuShellSettingsToggleLabel,
  resolvePausedMainMenuShellActionKeybindingRemapEditorStatus,
  resolvePausedMainMenuResetShellActionKeybindingsEditorStatus,
  resolvePausedMainMenuApplyShellProfileTitle,
  resolvePausedMainMenuImportShellProfileTitle,
  resolvePausedMainMenuImportWorldSaveTitle,
  resolvePausedMainMenuShellActionKeybindingEditorIntro,
  resolvePausedMainMenuResetShellTogglesTitle,
  resolvePausedMainMenuResumeWorldTitle,
  resolveInWorldDebugEditControlsToggleTitle,
  resolveAppShellViewModel,
  resolvePausedMainMenuMenuSectionGroups
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
const DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are browser saved. Current shell hotkeys use the default set.';
const DEFAULT_PAUSED_MAIN_MENU_HELP_COPY_SUMMARY_LINE =
  'Pause-menu cards keep shortcuts, consequences, and status rows visible below. Expand help text to read the longer descriptions.';
const appendPausedMainMenuResultsDensitySummaryLine = (
  summaryLine: string,
  resultCount: number
): string => `${summaryLine} ${resultCount} result cards are currently grouped here.`;
const IMPORT_RESULT_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Import World Save. Only warning feedback is currently available here.';
const IMPORT_RESULT_ONLY_HIDDEN_HELP_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Import World Save. Only warning feedback is currently available here. Result-card paragraphs are hidden until Show Help Text is enabled.';
const RESET_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Reset Shell Toggles. Only shell-setting feedback is currently available here. Only confirmation feedback is currently available here.';
const RESET_SESSION_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Reset Shell Toggles. Only shell-setting feedback is currently available here. Only warning feedback is currently available here. This reset is current-session-only because browser shell storage could not be cleared.';
const RESET_SESSION_ONLY_HIDDEN_HELP_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE = `${RESET_SESSION_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE} Result-card paragraphs are hidden until Show Help Text is enabled.`;
const IMPORT_AND_CLEAR_WARNING_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Import World Save and Clear Saved World. Only world-save feedback is currently available here. Only warning feedback is currently available here.';
const IMPORT_AND_RESET_SESSION_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Import World Save and Reset Shell Toggles. World-save and shell-setting feedback are both currently available here. Only warning feedback is currently available here. This reset is current-session-only because browser shell storage could not be cleared.';
const EXPORT_AND_ACCEPTED_IMPORT_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Export World Save and Import World Save. Only world-save feedback is currently available here. Only confirmation feedback is currently available here.';
const EXPORT_AND_IMPORT_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Export World Save and Import World Save. Only world-save feedback is currently available here. Warning and confirmation feedback are both currently available here.';
const EXPORT_AND_IMPORT_HIDDEN_HELP_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Export World Save and Import World Save. Only world-save feedback is currently available here. Warning and confirmation feedback are both currently available here. Result-card paragraphs are hidden until Show Help Text is enabled.';
const IMPORT_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Import World Save and Reset Shell Toggles. World-save and shell-setting feedback are both currently available here. Warning and confirmation feedback are both currently available here.';
const EXPORT_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Export World Save and Reset Shell Toggles. World-save and shell-setting feedback are both currently available here. Only confirmation feedback is currently available here.';
const EXPORT_AND_RESET_HIDDEN_HELP_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Export World Save and Reset Shell Toggles. World-save and shell-setting feedback are both currently available here. Only confirmation feedback is currently available here. Result-card paragraphs are hidden until Show Help Text is enabled.';
const EXPORT_IMPORT_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Export World Save, Import World Save, and Reset Shell Toggles. World-save and shell-setting feedback are both currently available here. Warning and confirmation feedback are both currently available here.';
const EXPORT_IMPORT_CLEAR_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE =
  'Recent paused-menu feedback is available for Export World Save, Import World Save, Clear Saved World, and Reset Shell Toggles. World-save and shell-setting feedback are both currently available here. Warning and confirmation feedback are both currently available here.';
const PREVIEWED_MIXED_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Shell profile preview from preview-shell-profile.json is ready to apply with both shell visibility toggle and hotkey changes. If applied, that preview would use the custom set. If applied, that preview would resume with Debug HUD, Edit Overlays, and Spawn Marker shown. Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are browser saved. Current shell hotkeys use the default set.';
const PREVIEWED_TOGGLE_ONLY_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Shell profile preview from toggle-only-shell-profile.json is ready to apply with shell visibility toggle changes only. If applied, that preview would use the default set. If applied, that preview would resume with Debug HUD shown. Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are browser saved. Current shell hotkeys use the default set.';
const PREVIEWED_HOTKEY_ONLY_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Shell profile preview from hotkey-only-shell-profile.json is ready to apply with shell hotkey changes only. If applied, that preview would use the custom set. If applied, that preview would resume with all shell toggles hidden. Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are browser saved. Current shell hotkeys use the default set.';
const PREVIEWED_NOOP_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Shell profile preview from matching-shell-profile.json already matches the paused session, so applying it would not change shell visibility toggles or hotkeys. If applied, that preview would use the default set. If applied, that preview would resume with all shell toggles hidden. Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are browser saved. Current shell hotkeys use the default set.';
const PREVIEWED_DEFAULT_SET_WHILE_LIVE_CUSTOM_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Shell profile preview from reset-to-default-shell-profile.json is ready to apply with shell hotkey changes only. If applied, that preview would use the default set. If applied, that preview would resume with all shell toggles hidden. Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are browser saved. Current shell hotkeys use the custom set.';
const MIXED_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Resume World shows Debug HUD and Edit Overlays, while Edit Panel, Spawn Marker, and Shortcuts stay hidden. Shell settings are browser saved. Current shell hotkeys use the default set.';
const FULLY_VISIBLE_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Resume World shows Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts. Shell settings are browser saved. Current shell hotkeys use the default set.';
const SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are in session-only fallback. Current shell hotkeys use the custom set.';
const DEFAULTED_DEFAULT_SET_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are browser saved. Current shell hotkeys use the default set. The current default-looking hotkeys are a recovered safe-set fallback because invalid saved bindings were rejected during load.';
const CURRENT_SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE =
  'Resume World keeps Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden. Shell settings are browser saved. Current shell hotkeys use the custom set. Current shell hotkeys are live only in this paused session because the latest browser hotkey save failed.';
const PAUSED_MAIN_MENU_SHELL_PROFILE_PREVIEW_LINES = [
  'The selected shell profile validated successfully and is ready to apply to this paused session.',
  'Review its live change summary, saved-on shell visibility, and replacement hotkey set below before applying it.'
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
const createPausedMainMenuMenuSectionsFromViewModel = (
  pausedMainMenuSections: ReturnType<typeof createPausedMainMenuSectionViewModel>
) => {
  const { primarySections, recentActivitySections } = resolvePausedMainMenuMenuSectionGroups({
    screen: 'main-menu',
    primaryActionLabel: 'Resume World',
    pausedMainMenuSections
  });

  return [...primarySections, ...recentActivitySections];
};

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
    expect(viewModel.pausedMainMenuSections).toBeNull();
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
    expect(viewModel.pausedMainMenuSections).toBeNull();
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
    const pausedMainMenuSections = createPausedMainMenuSectionViewModel();

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
    expect(viewModel.menuSections).toEqual(
      createPausedMainMenuMenuSectionsFromViewModel(pausedMainMenuSections)
    );
    expect(viewModel.pausedMainMenuSections).toEqual(pausedMainMenuSections);
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.importResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.exportResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.exportResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.importResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.importResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.importResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.importResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.importResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.worldSave.savedWorldStatus).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.recentActivity.clearSavedWorldResult).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.worldSave.savedWorldStatus).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.shell.persistenceSummary).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.shell.persistenceSummary).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.shell.persistenceSummary).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.shell.persistenceSummary).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.shell.persistenceSummary).toEqual({
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

    expect(viewModel.pausedMainMenuSections?.shell.shellProfilePreview).toEqual({
      title: 'Shell Profile Preview',
      lines: [...PAUSED_MAIN_MENU_SHELL_PROFILE_PREVIEW_LINES],
      metadataRows: [
        {
          label: 'File',
          value: 'preview-shell-profile.json'
        },
        {
          label: 'Toggle Changes',
          value: 'Debug HUD off -> on, Edit Overlays off -> on, Spawn Marker off -> on'
        },
        {
          label: 'Hotkey Changes',
          value:
            'Main Menu Q -> X, Recenter Camera C -> Z, Debug HUD H -> U, Edit Panel G -> J, Edit Overlays V -> K, Spawn Marker M -> Y'
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

  it('shows no live preview changes when the imported shell profile already matches the paused session', () => {
    const matchingShellState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    };
    const viewModel = resolveAppShellViewModel(
      createPausedMainMenuShellState(
        matchingShellState,
        true,
        CUSTOM_SHELL_ACTION_KEYBINDINGS,
        false,
        null,
        null,
        null,
        null,
        null,
        {
          fileName: 'matching-shell-profile.json',
          shellState: matchingShellState,
          shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
        }
      )
    );

    expect(viewModel.pausedMainMenuSections?.shell.shellProfilePreview).toEqual({
      title: 'Shell Profile Preview',
      lines: [...PAUSED_MAIN_MENU_SHELL_PROFILE_PREVIEW_LINES],
      metadataRows: [
        {
          label: 'File',
          value: 'matching-shell-profile.json'
        },
        {
          label: 'Toggle Changes',
          value: 'None'
        },
        {
          label: 'Hotkey Changes',
          value: 'None'
        },
        {
          label: 'Saved On',
          value: 'Debug HUD, Edit Overlays, Shortcuts'
        },
        {
          label: 'Saved Off',
          value: 'Edit Panel, Spawn Marker'
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
    const pausedMainMenuSections = createPausedMainMenuSectionViewModel();

    expect(createPausedMainMenuShellState()).toEqual({
      screen: 'main-menu',
      statusText: 'World session paused.',
      detailLines: [],
      menuSections: createPausedMainMenuMenuSectionsFromViewModel(pausedMainMenuSections),
      pausedMainMenuSections,
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
    const pausedMainMenuSections = createPausedMainMenuSectionViewModel(
      undefined,
      true,
      createDefaultShellActionKeybindingState(),
      false,
      null,
      'cleared'
    );

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
      menuSections: createPausedMainMenuMenuSectionsFromViewModel(pausedMainMenuSections),
      pausedMainMenuSections,
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
    const pausedMainMenuSections = createPausedMainMenuSectionViewModel(
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
    );

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
      menuSections: createPausedMainMenuMenuSectionsFromViewModel(pausedMainMenuSections),
      pausedMainMenuSections,
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
    const pausedMainMenuSections = createPausedMainMenuSectionViewModel(
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
    );

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
      menuSections: createPausedMainMenuMenuSectionsFromViewModel(pausedMainMenuSections),
      pausedMainMenuSections,
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

describe('resolvePausedMainMenuApplyShellProfileEditorStatus', () => {
  it('uses explicit no-op copy when an applied shell profile already matches the paused session', () => {
    expect(
      resolvePausedMainMenuApplyShellProfileEditorStatus({
        status: 'applied',
        fileName: 'matching-shell-profile.json',
        changeCategory: 'none'
      })
    ).toEqual({
      tone: 'accent',
      text:
        'Shell profile from matching-shell-profile.json already matched the paused session, so no shell toggles or hotkeys changed.'
    });
  });

  it.each([
    [
      'toggle-only',
      'Shell profile from matching-shell-profile.json applied to the paused session with shell visibility toggle changes only.'
    ],
    [
      'hotkey-only',
      'Shell profile from matching-shell-profile.json applied to the paused session with shell hotkey changes only.'
    ],
    [
      'mixed',
      'Shell profile from matching-shell-profile.json applied to the paused session with both shell visibility toggle and hotkey changes.'
    ]
  ] as const)(
    'distinguishes %s live changes in applied shell-profile result copy',
    (changeCategory, text) => {
      expect(
        resolvePausedMainMenuApplyShellProfileEditorStatus({
          status: 'applied',
          fileName: 'matching-shell-profile.json',
          changeCategory
        })
      ).toEqual({
        tone: 'accent',
        text
      });
    }
  );

  it('keeps persistence-failure copy explicit when a no-op apply still could not rewrite browser storage', () => {
    expect(
      resolvePausedMainMenuApplyShellProfileEditorStatus({
        status: 'persistence-failed',
        fileName: 'matching-shell-profile.json',
        changeCategory: 'none',
        reason: 'Browser shell visibility preferences and hotkeys were not updated.'
      })
    ).toEqual({
      tone: 'warning',
      text:
        'Shell profile from matching-shell-profile.json already matched this paused session, so no shell toggles or hotkeys changed, but browser storage still was not updated: Browser shell visibility preferences and hotkeys were not updated.'
    });
  });

  it.each([
    [
      'toggle-only',
      'Shell profile from matching-shell-profile.json applied for this paused session only with shell visibility toggle changes: Browser shell visibility preferences and hotkeys were not updated.'
    ],
    [
      'hotkey-only',
      'Shell profile from matching-shell-profile.json applied for this paused session only with shell hotkey changes: Browser shell visibility preferences and hotkeys were not updated.'
    ],
    [
      'mixed',
      'Shell profile from matching-shell-profile.json applied for this paused session only with both shell visibility toggle and hotkey changes: Browser shell visibility preferences and hotkeys were not updated.'
    ]
  ] as const)(
    'distinguishes %s live changes in session-only shell-profile apply copy',
    (changeCategory, text) => {
      expect(
        resolvePausedMainMenuApplyShellProfileEditorStatus({
          status: 'persistence-failed',
          fileName: 'matching-shell-profile.json',
          changeCategory,
          reason: 'Browser shell visibility preferences and hotkeys were not updated.'
        })
      ).toEqual({
        tone: 'warning',
        text
      });
    }
  );
});

describe('resolvePausedMainMenuShellActionKeybindingRemapEditorStatus', () => {
  it('uses saved-result copy when a remapped shell hotkey was browser-saved', () => {
    expect(
      resolvePausedMainMenuShellActionKeybindingRemapEditorStatus({
        result: {
          status: 'saved'
        },
        actionLabel: 'Debug HUD',
        currentKey: 'H',
        nextKey: 'U',
        changed: true
      })
    ).toEqual({
      tone: 'accent',
      text: 'Debug HUD now uses U, and the current shell hotkey set was saved.'
    });
  });

  it('uses session-only fallback copy when a remapped shell hotkey could not be browser-saved', () => {
    expect(
      resolvePausedMainMenuShellActionKeybindingRemapEditorStatus({
        result: {
          status: 'session-only'
        },
        actionLabel: 'Debug HUD',
        currentKey: 'H',
        nextKey: 'U',
        changed: true
      })
    ).toEqual({
      tone: 'warning',
      text:
        'Debug HUD now uses U for this paused session only because browser storage was not updated.'
    });
  });

  it('keeps no-op remap saves explicit when the current hotkey was re-saved successfully', () => {
    expect(
      resolvePausedMainMenuShellActionKeybindingRemapEditorStatus({
        result: {
          status: 'saved'
        },
        actionLabel: 'Debug HUD',
        currentKey: 'U',
        nextKey: 'U',
        changed: false
      })
    ).toEqual({
      tone: 'accent',
      text: 'Debug HUD stayed on U, and the current shell hotkey set was saved.'
    });
  });

  it('keeps no-op session-only remaps explicit when storage still could not be updated', () => {
    expect(
      resolvePausedMainMenuShellActionKeybindingRemapEditorStatus({
        result: {
          status: 'session-only'
        },
        actionLabel: 'Debug HUD',
        currentKey: 'U',
        nextKey: 'U',
        changed: false
      })
    ).toEqual({
      tone: 'warning',
      text:
        'Debug HUD stayed on U for this paused session only because browser storage was not updated.'
    });
  });
});

describe('resolvePausedMainMenuResetShellActionKeybindingsEditorStatus', () => {
  it('uses explicit no-op copy when the default shell hotkey set is already active', () => {
    expect(
      resolvePausedMainMenuResetShellActionKeybindingsEditorStatus({
        status: 'noop'
      })
    ).toEqual({
      tone: 'accent',
      text: 'Default Q, C, H, G, V, and M shell hotkeys were already active, so nothing changed.'
    });
  });

  it('uses distinct success copy when reset saves the recovered safe set back to the default hotkeys', () => {
    expect(
      resolvePausedMainMenuResetShellActionKeybindingsEditorStatus({
        status: 'reset',
        category: 'load-fallback-recovery'
      })
    ).toEqual({
      tone: 'accent',
      text:
        'Recovered safe-set fallback saved as the default Q, C, H, G, V, and M hotkeys, clearing the stale load warning.'
    });
  });

  it('uses the ordinary default-reset copy when reset rewrites the standard hotkey set', () => {
    expect(
      resolvePausedMainMenuResetShellActionKeybindingsEditorStatus({
        status: 'reset',
        category: 'default-set-reset'
      })
    ).toEqual({
      tone: 'accent',
      text: 'Shell hotkeys reset to the default Q, C, H, G, V, and M set.'
    });
  });

  it('keeps the existing warning copy when browser storage rejects the reset', () => {
    expect(
      resolvePausedMainMenuResetShellActionKeybindingsEditorStatus({
        status: 'failed'
      })
    ).toEqual({
      tone: 'warning',
      text: 'Browser storage rejected the default shell hotkey reset, so the current set stayed active.'
    });
  });
});

describe('resolvePausedMainMenuClearShellProfilePreviewTitle', () => {
  it('explains that paused-menu shell-profile preview clear dismisses the preview without applying it', () => {
    expect(resolvePausedMainMenuClearShellProfilePreviewTitle()).toBe(
      'Dismiss the currently previewed shell-profile toggles and hotkeys without applying them to the paused session'
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

describe('resolvePausedMainMenuShellSettingsSummaryLine', () => {
  it('summarizes fully hidden paused-session shell toggles in one line', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
        createPausedMainMenuShellState().pausedMainMenuSections ?? null
      )
    ).toBe(DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('summarizes mixed paused-session shell visibility in one line', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
        createPausedMainMenuShellState({
          debugOverlayVisible: true,
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: true,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: false
        }).pausedMainMenuSections ?? null
      )
    ).toBe(MIXED_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('summarizes fully visible paused-session shell toggles in one line', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
        createPausedMainMenuShellState({
          debugOverlayVisible: true,
          debugEditControlsVisible: true,
          debugEditOverlaysVisible: true,
          playerSpawnMarkerVisible: true,
          shortcutsOverlayVisible: true
        }).pausedMainMenuSections ?? null
      )
    ).toBe(FULLY_VISIBLE_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('surfaces paused-session shell persistence mode and binding-set status in the collapsed summary', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
        createPausedMainMenuShellState(
          undefined,
          false,
          CUSTOM_SHELL_ACTION_KEYBINDINGS
        ).pausedMainMenuSections ?? null
      )
    ).toBe(SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('warns in the collapsed summary when saved hotkeys resumed from the recovered safe-set fallback', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          true
        ).pausedMainMenuSections ?? null
      )
    ).toBe(DEFAULTED_DEFAULT_SET_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('surfaces when the current hotkey set is live only for this session after the latest hotkey save failed', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
        createPausedMainMenuShellState(
          undefined,
          true,
          CUSTOM_SHELL_ACTION_KEYBINDINGS,
          false,
          null,
          null,
          null,
          null,
          null,
          null,
          true
        ).pausedMainMenuSections ?? null,
        true
      )
    ).toBe(CURRENT_SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('surfaces a staged shell-profile preview while keeping the current paused-session summary', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
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
        ).pausedMainMenuSections ?? null
      )
    ).toBe(PREVIEWED_MIXED_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('distinguishes toggle-only staged shell-profile previews in the collapsed summary', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
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
            fileName: 'toggle-only-shell-profile.json',
            shellState: {
              debugOverlayVisible: true,
              debugEditControlsVisible: false,
              debugEditOverlaysVisible: false,
              playerSpawnMarkerVisible: false,
              shortcutsOverlayVisible: false
            },
            shellActionKeybindings: createDefaultShellActionKeybindingState()
          }
        ).pausedMainMenuSections ?? null
      )
    ).toBe(PREVIEWED_TOGGLE_ONLY_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('distinguishes hotkey-only staged shell-profile previews in the collapsed summary', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
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
            fileName: 'hotkey-only-shell-profile.json',
            shellState: {
              debugOverlayVisible: false,
              debugEditControlsVisible: false,
              debugEditOverlaysVisible: false,
              playerSpawnMarkerVisible: false,
              shortcutsOverlayVisible: false
            },
            shellActionKeybindings: CUSTOM_SHELL_ACTION_KEYBINDINGS
          }
        ).pausedMainMenuSections ?? null
      )
    ).toBe(PREVIEWED_HOTKEY_ONLY_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('surfaces when a staged shell-profile preview already matches the paused session in the collapsed summary', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
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
            fileName: 'matching-shell-profile.json',
            shellState: {
              debugOverlayVisible: false,
              debugEditControlsVisible: false,
              debugEditOverlaysVisible: false,
              playerSpawnMarkerVisible: false,
              shortcutsOverlayVisible: false
            },
            shellActionKeybindings: createDefaultShellActionKeybindingState()
          }
        ).pausedMainMenuSections ?? null
      )
    ).toBe(PREVIEWED_NOOP_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });

  it('surfaces the previewed default-set hotkeys even when the live paused session currently uses a custom set', () => {
    expect(
      resolvePausedMainMenuShellSettingsSummaryLine(
        createPausedMainMenuShellState(
          undefined,
          true,
          CUSTOM_SHELL_ACTION_KEYBINDINGS,
          false,
          null,
          null,
          null,
          null,
          null,
          {
            fileName: 'reset-to-default-shell-profile.json',
            shellState: {
              debugOverlayVisible: false,
              debugEditControlsVisible: false,
              debugEditOverlaysVisible: false,
              playerSpawnMarkerVisible: false,
              shortcutsOverlayVisible: false
            },
            shellActionKeybindings: createDefaultShellActionKeybindingState()
          }
        ).pausedMainMenuSections ?? null
      )
    ).toBe(PREVIEWED_DEFAULT_SET_WHILE_LIVE_CUSTOM_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE);
  });
});

describe('resolvePausedMainMenuHelpCopyToggleLabel', () => {
  it('switches the paused-menu help button label between collapsed and expanded copy', () => {
    expect(resolvePausedMainMenuHelpCopyToggleLabel()).toBe('Show Help Text');
    expect(resolvePausedMainMenuHelpCopyToggleLabel(true)).toBe('Hide Help Text');
  });
});

describe('resolvePausedMainMenuHelpCopySectionState', () => {
  it('defaults paused-menu help text to a collapsed metadata-first view', () => {
    expect(resolvePausedMainMenuHelpCopySectionState(createPausedMainMenuShellState())).toEqual({
      visible: true,
      expanded: false,
      summaryLine: DEFAULT_PAUSED_MAIN_MENU_HELP_COPY_SUMMARY_LINE,
      toggleLabel: 'Show Help Text',
      showMenuSectionLines: false
    });
  });

  it('reveals paused-menu section help text only after the help toggle expands', () => {
    expect(
      resolvePausedMainMenuHelpCopySectionState(createPausedMainMenuShellState(), true)
    ).toEqual({
      visible: true,
      expanded: true,
      summaryLine: DEFAULT_PAUSED_MAIN_MENU_HELP_COPY_SUMMARY_LINE,
      toggleLabel: 'Hide Help Text',
      showMenuSectionLines: true
    });
  });

  it('keeps paused-menu help controls hidden outside the paused main menu', () => {
    expect(
      resolvePausedMainMenuHelpCopySectionState(createFirstLaunchMainMenuShellState(), true)
    ).toEqual({
      visible: false,
      expanded: false,
      summaryLine: null,
      toggleLabel: null,
      showMenuSectionLines: true
    });
  });
});

describe('resolvePausedMainMenuMenuSectionGroups', () => {
  it('routes paused-menu cards into explicit overview, world-save, shell, recent-activity, and danger-zone groups', () => {
    const pausedState = createPausedMainMenuShellState(
      undefined,
      true,
      createDefaultShellActionKeybindingState(),
      false,
      null,
      'cleared',
      {
        status: 'downloaded',
        fileName: 'paused-session.json'
      },
      null,
      {
        status: 'cleared'
      }
    );

    expect(resolvePausedMainMenuMenuSectionGroups(pausedState)).toEqual({
      overviewSections: [
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
        }
      ],
      worldSaveSections: [
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
        }
      ],
      shellSections: [
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
        }
      ],
      recentActivitySections: [
        {
          title: 'Export Result',
          lines: [...DOWNLOADED_PAUSED_MAIN_MENU_EXPORT_RESULT_LINES],
          metadataRows: [
            {
              label: 'Status',
              value: 'Downloaded'
            },
            {
              label: 'File',
              value: 'paused-session.json'
            }
          ],
          tone: 'accent'
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
        }
      ],
      dangerZoneSections: [
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
      primarySections: [
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
      ]
    });
  });
});

describe('resolvePausedMainMenuResultsToggleLabel', () => {
  it('switches the paused-menu results button label between collapsed and expanded copy', () => {
    expect(resolvePausedMainMenuResultsToggleLabel()).toBe('Show Results');
    expect(resolvePausedMainMenuResultsToggleLabel(true)).toBe('Hide Results');
  });
});

describe('resolvePausedMainMenuResultsSectionState', () => {
  it('keeps paused-menu results collapsed by default while summarizing the available feedback cards', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
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
      )
    ).toEqual({
      visible: true,
      expanded: false,
      summaryLine: IMPORT_RESULT_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results',
      menuSections: [
        {
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
        }
      ]
    });
  });

  it('reveals grouped paused-menu feedback cards only after the results section expands', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          null,
          null,
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          },
          null,
          {
            status: 'cleared'
          }
        ),
        true
      )
    ).toEqual({
      visible: true,
      expanded: true,
      summaryLine: EXPORT_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Hide Results',
      menuSections: [
        {
          title: 'Export Result',
          lines: [...DOWNLOADED_PAUSED_MAIN_MENU_EXPORT_RESULT_LINES],
          metadataRows: [
            {
              label: 'Status',
              value: 'Downloaded'
            },
            {
              label: 'File',
              value: 'paused-session.json'
            }
          ],
          tone: 'accent'
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
        }
      ]
    });
  });

  it('adds confirmation-only header copy when every paused-menu result card is confirmation toned', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          null,
          null,
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          },
          null,
          {
            status: 'cleared'
          }
        )
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: EXPORT_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('adds world-save-only category copy when multiple paused-menu result cards are all world-save feedback', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'accepted',
            fileName: 'restore.json'
          },
          null,
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          }
        )
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: EXPORT_AND_ACCEPTED_IMPORT_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('adds shell-setting-only category copy when reset-shell feedback is the only paused-menu result', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
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
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: RESET_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('adds current-session-only reset warning copy when mixed paused-menu results include reset-shell feedback', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'rejected',
            fileName: 'broken.json',
            reason: 'world save envelope kind must be "deep-factory.world-save"'
          },
          null,
          null,
          null,
          {
            status: 'persistence-failed',
            reason: 'browser shell storage could not be cleared'
          }
        )
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: IMPORT_AND_RESET_SESSION_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('keeps current-session-only reset warning copy when help text is hidden', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
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
            status: 'persistence-failed',
            reason: 'browser shell storage could not be cleared'
          }
        ),
        false,
        false
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: RESET_SESSION_ONLY_HIDDEN_HELP_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('adds density copy when three paused-menu result cards are grouped at once', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'rejected',
            fileName: 'broken.json',
            reason: 'world save envelope kind must be "deep-factory.world-save"'
          },
          null,
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          },
          null,
          {
            status: 'cleared'
          }
        )
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: appendPausedMainMenuResultsDensitySummaryLine(
        EXPORT_IMPORT_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
        3
      ),
      toggleLabel: 'Show Results'
    });
  });

  it('keeps density copy when four paused-menu result cards are grouped and help text is hidden', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'rejected',
            fileName: 'broken.json',
            reason: 'world save envelope kind must be "deep-factory.world-save"'
          },
          null,
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          },
          {
            status: 'failed',
            reason: 'local resume envelope could not be deleted'
          },
          {
            status: 'cleared'
          }
        ),
        false,
        false
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: `${appendPausedMainMenuResultsDensitySummaryLine(
        EXPORT_IMPORT_CLEAR_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
        4
      )} Result-card paragraphs are hidden until Show Help Text is enabled.`,
      toggleLabel: 'Show Results'
    });
  });

  it('adds header copy when the paused-menu help toggle hides result-card paragraphs', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
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
        ),
        true,
        false
      )
    ).toEqual({
      visible: true,
      expanded: true,
      summaryLine: IMPORT_RESULT_ONLY_HIDDEN_HELP_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Hide Results',
      menuSections: [
        {
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
        }
      ]
    });
  });

  it('keeps confirmation-only header copy when help text is hidden', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          null,
          null,
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          },
          null,
          {
            status: 'cleared'
          }
        ),
        false,
        false
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: EXPORT_AND_RESET_HIDDEN_HELP_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('adds warning-only header copy when every paused-menu result card is warning toned', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'rejected',
            fileName: 'broken.json',
            reason: 'world save envelope kind must be "deep-factory.world-save"'
          },
          null,
          null,
          {
            status: 'failed',
            reason: 'local resume envelope could not be deleted'
          }
        )
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: IMPORT_AND_CLEAR_WARNING_ONLY_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('adds category header copy when world-save and shell-setting feedback are both present', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'rejected',
            fileName: 'broken.json',
            reason: 'world save envelope kind must be "deep-factory.world-save"'
          },
          null,
          null,
          null,
          {
            status: 'cleared'
          }
        )
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: IMPORT_AND_RESET_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('adds mixed results header copy when accent and warning feedback are both present', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'rejected',
            fileName: 'broken.json',
            reason: 'world save envelope kind must be "deep-factory.world-save"'
          },
          null,
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          }
        )
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: EXPORT_AND_IMPORT_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('keeps mixed results header copy when help text is hidden', () => {
    expect(
      resolvePausedMainMenuResultsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'rejected',
            fileName: 'broken.json',
            reason: 'world save envelope kind must be "deep-factory.world-save"'
          },
          null,
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          }
        ),
        false,
        false
      )
    ).toMatchObject({
      visible: true,
      expanded: false,
      summaryLine: EXPORT_AND_IMPORT_HIDDEN_HELP_PAUSED_MAIN_MENU_RESULTS_SUMMARY_LINE,
      toggleLabel: 'Show Results'
    });
  });

  it('keeps the paused-menu results section hidden when no transient feedback cards are present', () => {
    expect(resolvePausedMainMenuResultsSectionState(createPausedMainMenuShellState(), true)).toEqual({
      visible: false,
      expanded: false,
      summaryLine: null,
      toggleLabel: null,
      menuSections: []
    });
  });

  it('keeps paused-menu results hidden outside the paused main menu', () => {
    expect(resolvePausedMainMenuResultsSectionState(createFirstLaunchMainMenuShellState(), true)).toEqual({
      visible: false,
      expanded: false,
      summaryLine: null,
      toggleLabel: null,
      menuSections: []
    });
  });
});

describe('resolvePausedMainMenuShellSettingsToggleLabel', () => {
  it('switches the paused-menu shell-settings button label between collapsed and expanded copy', () => {
    expect(resolvePausedMainMenuShellSettingsToggleLabel()).toBe('Show Shell Settings');
    expect(resolvePausedMainMenuShellSettingsToggleLabel(true)).toBe('Hide Shell Settings');
  });
});

describe('resolvePausedMainMenuShellSettingsSectionState', () => {
  it('defaults paused-menu shell settings to a collapsed summary-only section', () => {
    expect(resolvePausedMainMenuShellSettingsSectionState(createPausedMainMenuShellState())).toEqual({
      visible: true,
      expanded: false,
      summaryLine: DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE,
      toggleLabel: 'Show Shell Settings',
      editorVisible: false,
      editorHelpVisible: false
    });
  });

  it('reveals the shell editor only after the paused-menu shell-settings section expands', () => {
    expect(
      resolvePausedMainMenuShellSettingsSectionState(createPausedMainMenuShellState(), true)
    ).toEqual({
      visible: true,
      expanded: true,
      summaryLine: DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE,
      toggleLabel: 'Hide Shell Settings',
      editorVisible: true,
      editorHelpVisible: true
    });
  });

  it('hides shell-settings help copy when the paused-menu help toggle is collapsed', () => {
    expect(
      resolvePausedMainMenuShellSettingsSectionState(createPausedMainMenuShellState(), true, false)
    ).toEqual({
      visible: true,
      expanded: true,
      summaryLine: DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE,
      toggleLabel: 'Hide Shell Settings',
      editorVisible: true,
      editorHelpVisible: false
    });
  });

  it('keeps staged shell-profile preview copy in the collapsed shell-settings summary', () => {
    expect(
      resolvePausedMainMenuShellSettingsSectionState(
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
      )
    ).toEqual({
      visible: true,
      expanded: false,
      summaryLine: PREVIEWED_MIXED_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE,
      toggleLabel: 'Show Shell Settings',
      editorVisible: false,
      editorHelpVisible: false
    });
  });

  it('keeps no-op staged shell-profile preview copy in the collapsed shell-settings summary', () => {
    expect(
      resolvePausedMainMenuShellSettingsSectionState(
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
            fileName: 'matching-shell-profile.json',
            shellState: {
              debugOverlayVisible: false,
              debugEditControlsVisible: false,
              debugEditOverlaysVisible: false,
              playerSpawnMarkerVisible: false,
              shortcutsOverlayVisible: false
            },
            shellActionKeybindings: createDefaultShellActionKeybindingState()
          }
        )
      )
    ).toEqual({
      visible: true,
      expanded: false,
      summaryLine: PREVIEWED_NOOP_DEFAULT_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE,
      toggleLabel: 'Show Shell Settings',
      editorVisible: false,
      editorHelpVisible: false
    });
  });

  it('keeps preview binding-set copy in the collapsed shell-settings summary when the staged profile differs from the live hotkey set', () => {
    expect(
      resolvePausedMainMenuShellSettingsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          CUSTOM_SHELL_ACTION_KEYBINDINGS,
          false,
          null,
          null,
          null,
          null,
          null,
          {
            fileName: 'reset-to-default-shell-profile.json',
            shellState: {
              debugOverlayVisible: false,
              debugEditControlsVisible: false,
              debugEditOverlaysVisible: false,
              playerSpawnMarkerVisible: false,
              shortcutsOverlayVisible: false
            },
            shellActionKeybindings: createDefaultShellActionKeybindingState()
          }
        )
      )
    ).toEqual({
      visible: true,
      expanded: false,
      summaryLine: PREVIEWED_DEFAULT_SET_WHILE_LIVE_CUSTOM_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE,
      toggleLabel: 'Show Shell Settings',
      editorVisible: false,
      editorHelpVisible: false
    });
  });

  it('keeps current-session-only hotkey persistence warning in the collapsed shell-settings section state', () => {
    expect(
      resolvePausedMainMenuShellSettingsSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          CUSTOM_SHELL_ACTION_KEYBINDINGS,
          false,
          null,
          null,
          null,
          null,
          null,
          null,
          true
        )
      )
    ).toEqual({
      visible: true,
      expanded: false,
      summaryLine: CURRENT_SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SETTINGS_SUMMARY_LINE,
      toggleLabel: 'Show Shell Settings',
      editorVisible: false,
      editorHelpVisible: false
    });
  });

  it('keeps shell settings hidden outside the paused main menu', () => {
    expect(
      resolvePausedMainMenuShellSettingsSectionState(createFirstLaunchMainMenuShellState(), true)
    ).toEqual({
      visible: false,
      expanded: false,
      summaryLine: null,
      toggleLabel: null,
      editorVisible: false,
      editorHelpVisible: false
    });
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
