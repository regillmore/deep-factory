import { installPointerClickFocusRelease } from './buttonFocus';
import {
  getDesktopDebugOverlayHotkeyLabel,
  getDesktopDebugEditControlsHotkeyLabel,
  getDesktopDebugEditOverlaysHotkeyLabel,
  getDesktopFreshWorldHotkeyLabel,
  getDesktopPlayerSpawnMarkerHotkeyLabel,
  getDesktopShortcutsOverlayHotkeyLabel,
  getDesktopRecenterCameraHotkeyLabel,
  getDesktopResumeWorldHotkeyLabel,
  getDesktopReturnToMainMenuHotkeyLabel
} from '../input/debugEditShortcuts';
import {
  createDefaultShellActionKeybindingState,
  matchesDefaultShellActionKeybindingState,
  type ShellActionKeybindingState
} from '../input/shellActionKeybindings';
import {
  createDefaultWorldSessionShellState,
  createWorldSessionShellStatePersistenceSummary,
  type WorldSessionShellState
} from '../mainWorldSessionShellState';

export type AppShellScreen = 'boot' | 'main-menu' | 'in-world';

export type AppShellMenuSectionTone = 'default' | 'accent' | 'warning';

export interface AppShellMenuSectionMetadataRow {
  label: string;
  value: string;
}

export interface AppShellMenuSection {
  title: string;
  lines: readonly string[];
  metadataRows?: readonly AppShellMenuSectionMetadataRow[];
  tone?: AppShellMenuSectionTone;
}

export interface PausedMainMenuAcceptedImportResult {
  status: 'accepted';
  fileName: string | null;
}

export interface PausedMainMenuRejectedImportResult {
  status: 'rejected';
  fileName: string | null;
  reason: string;
}

export interface PausedMainMenuRestoreFailedImportResult {
  status: 'restore-failed';
  fileName: string | null;
  reason: string;
}

export interface PausedMainMenuPersistenceFailedImportResult {
  status: 'persistence-failed';
  fileName: string | null;
  reason: string;
}

export interface PausedMainMenuCancelledImportResult {
  status: 'cancelled';
}

export interface PausedMainMenuPickerStartFailedImportResult {
  status: 'picker-start-failed';
  reason: string;
}

export type PausedMainMenuImportResult =
  | PausedMainMenuCancelledImportResult
  | PausedMainMenuPickerStartFailedImportResult
  | PausedMainMenuAcceptedImportResult
  | PausedMainMenuRejectedImportResult
  | PausedMainMenuRestoreFailedImportResult
  | PausedMainMenuPersistenceFailedImportResult;

export type PausedMainMenuSavedWorldStatus = 'cleared' | 'import-persistence-failed';

export interface PausedMainMenuDownloadedExportResult {
  status: 'downloaded';
  fileName: string | null;
}

export interface PausedMainMenuFailedExportResult {
  status: 'failed';
  reason: string;
}

export type PausedMainMenuExportResult =
  | PausedMainMenuDownloadedExportResult
  | PausedMainMenuFailedExportResult;

export interface PausedMainMenuFailedClearSavedWorldResult {
  status: 'failed';
  reason: string;
}

export type PausedMainMenuClearSavedWorldResult = PausedMainMenuFailedClearSavedWorldResult;

export interface AppShellState {
  screen: AppShellScreen;
  statusText?: string;
  detailLines?: readonly string[];
  menuSections?: readonly AppShellMenuSection[];
  primaryActionLabel?: string | null;
  secondaryActionLabel?: string | null;
  tertiaryActionLabel?: string | null;
  quaternaryActionLabel?: string | null;
  quinaryActionLabel?: string | null;
  senaryActionLabel?: string | null;
  debugOverlayVisible?: boolean;
  debugEditControlsVisible?: boolean;
  debugEditOverlaysVisible?: boolean;
  playerSpawnMarkerVisible?: boolean;
  shortcutsOverlayVisible?: boolean;
  shellActionKeybindings?: ShellActionKeybindingState;
  pausedMainMenuExportResult?: PausedMainMenuExportResult;
  pausedMainMenuImportResult?: PausedMainMenuImportResult;
  pausedMainMenuClearSavedWorldResult?: PausedMainMenuClearSavedWorldResult;
}

export interface InWorldShellStateOptions {
  debugOverlayVisible?: boolean;
  debugEditControlsVisible?: boolean;
  debugEditOverlaysVisible?: boolean;
  playerSpawnMarkerVisible?: boolean;
  shortcutsOverlayVisible?: boolean;
  shellActionKeybindings?: ShellActionKeybindingState;
}

export const DEFAULT_PAUSED_MAIN_MENU_STATUS = 'World session paused.';
export const DEFAULT_PAUSED_MAIN_MENU_DETAIL_LINES = [] as const;
const formatMenuSectionMetadataRowValue = (labels: readonly string[]): string =>
  labels.length > 0 ? labels.join(', ') : 'None';
const resolvePausedMainMenuShellActionKeybindingSummaryLine = (
  shellActionKeybindingsDefaultedFromPersistedState = false
): string =>
  shellActionKeybindingsDefaultedFromPersistedState
    ? 'Saved in-world shell-action keybindings fell back to the default set during load, so the rows below show the safe defaults until remap settings land.'
    : 'Current in-world shell hotkeys preview the active binding set until remap settings land.';
const resolvePausedMainMenuShellActionKeybindingSetValue = (
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string =>
  matchesDefaultShellActionKeybindingState(shellActionKeybindings)
    ? 'Default set'
    : 'Custom set';
const resolvePausedMainMenuResultFileNameValue = (fileName: string | null): string => {
  const trimmedFileName = fileName?.trim() ?? '';
  return trimmedFileName.length > 0 ? trimmedFileName : 'Unknown file';
};
const resolvePausedMainMenuResultReasonValue = (reason: string): string => {
  const trimmedReason = reason.trim();
  return trimmedReason.length > 0 ? trimmedReason : 'Unknown error';
};
const createPausedMainMenuExportResultMenuSection = (
  exportResult: PausedMainMenuExportResult
): AppShellMenuSection => {
  switch (exportResult.status) {
    case 'downloaded':
      return {
        title: 'Export Result',
        lines: [
          'The paused session stayed unchanged, and the last JSON world-save download used the filename below.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Downloaded'
          },
          {
            label: 'File',
            value: resolvePausedMainMenuResultFileNameValue(exportResult.fileName)
          }
        ],
        tone: 'accent'
      };
    case 'failed':
      return {
        title: 'Export Result',
        lines: [
          'The paused session stayed unchanged because the JSON world-save download failed before the browser accepted it.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Failed'
          },
          {
            label: 'Reason',
            value: resolvePausedMainMenuResultReasonValue(exportResult.reason)
          }
        ],
        tone: 'warning'
      };
  }
};
const createPausedMainMenuSavedWorldStatusMenuSection = (
  savedWorldStatus: PausedMainMenuSavedWorldStatus
): AppShellMenuSection => {
  switch (savedWorldStatus) {
    case 'cleared':
      return {
        title: 'Saved World Status',
        lines: [
          'This paused session is no longer browser-saved because Clear Saved World removed its local resume envelope.',
          'Resume World or a replacement save path writes a new browser save for the current session.'
        ],
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
      };
    case 'import-persistence-failed':
      return {
        title: 'Saved World Status',
        lines: [
          'This imported paused session is still live in the current tab, but it is not browser-saved because rewriting its local resume envelope failed after restore.',
          'This warning clears after a later browser-save rewrite succeeds for the current session.'
        ],
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
      };
  }
};
const createPausedMainMenuClearSavedWorldResultMenuSection = (
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult
): AppShellMenuSection => {
  switch (clearSavedWorldResult.status) {
    case 'failed':
      return {
        title: 'Clear Saved World Result',
        lines: [
          'The paused session stayed browser-saved because Clear Saved World could not delete its local resume envelope.',
          'Resume World and reload still use the last browser-saved session until deletion succeeds.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Failed'
          },
          {
            label: 'Reason',
            value: resolvePausedMainMenuResultReasonValue(clearSavedWorldResult.reason)
          }
        ],
        tone: 'warning'
      };
  }
};
const createPausedMainMenuShellActionKeybindingSummaryRows = (
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): readonly AppShellMenuSectionMetadataRow[] => [
  {
    label: 'Binding Set',
    value: resolvePausedMainMenuShellActionKeybindingSetValue(shellActionKeybindings)
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
] as const;
const createPausedMainMenuImportMenuSection = (
  importResult: PausedMainMenuImportResult
): AppShellMenuSection => {
  switch (importResult.status) {
    case 'cancelled':
      return {
        title: 'Import Result',
        lines: [
          'The paused session stayed unchanged because the JSON picker closed without selecting a world save file.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Canceled'
          }
        ]
      };
    case 'picker-start-failed':
      return {
        title: 'Import Result',
        lines: [
          'The paused session stayed unchanged because the browser JSON picker failed before any world save file could be selected.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Picker failed'
          },
          {
            label: 'Reason',
            value: resolvePausedMainMenuResultReasonValue(importResult.reason)
          }
        ],
        tone: 'warning'
      };
    case 'accepted':
      return {
        title: 'Import Result',
        lines: [
          'The paused session now reflects the selected JSON world save because its top-level envelope validated and restored successfully.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Accepted'
          },
          {
            label: 'File',
            value: resolvePausedMainMenuResultFileNameValue(importResult.fileName)
          }
        ],
        tone: 'accent'
      };
    case 'rejected':
      return {
        title: 'Import Result',
        lines: [
          'The paused session stayed unchanged because the selected JSON world save did not pass top-level envelope validation.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Rejected'
          },
          {
            label: 'File',
            value: resolvePausedMainMenuResultFileNameValue(importResult.fileName)
          },
          {
            label: 'Reason',
            value: resolvePausedMainMenuResultReasonValue(importResult.reason)
          }
        ],
        tone: 'warning'
      };
    case 'restore-failed':
      return {
        title: 'Import Result',
        lines: [
          'The selected JSON world save passed top-level envelope validation, but runtime restore still failed.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Restore failed'
          },
          {
            label: 'File',
            value: resolvePausedMainMenuResultFileNameValue(importResult.fileName)
          },
          {
            label: 'Reason',
            value: resolvePausedMainMenuResultReasonValue(importResult.reason)
          }
        ],
        tone: 'warning'
      };
    case 'persistence-failed':
      return {
        title: 'Import Result',
        lines: [
          'The paused session now reflects the selected JSON world save in this tab, but browser-resume persistence failed after restore.',
          'Resume World keeps the imported session live here, but reload may not restore it until a later save succeeds.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Restored, not browser saved'
          },
          {
            label: 'File',
            value: resolvePausedMainMenuResultFileNameValue(importResult.fileName)
          },
          {
            label: 'Reason',
            value: resolvePausedMainMenuResultReasonValue(importResult.reason)
          }
        ],
        tone: 'warning'
      };
  }
};

export const createPausedMainMenuMenuSections = (
  worldSessionShellState: WorldSessionShellState = createDefaultWorldSessionShellState(),
  worldSessionShellPersistenceAvailable = true,
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState(),
  shellActionKeybindingsDefaultedFromPersistedState = false,
  importResult: PausedMainMenuImportResult | null = null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null = null,
  exportResult: PausedMainMenuExportResult | null = null,
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null = null
): readonly AppShellMenuSection[] => {
  const persistenceSummary = createWorldSessionShellStatePersistenceSummary(
    worldSessionShellState,
    worldSessionShellPersistenceAvailable
  );
  return [
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
    ...(exportResult === null ? [] : [createPausedMainMenuExportResultMenuSection(exportResult)]),
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
    ...(importResult === null ? [] : [createPausedMainMenuImportMenuSection(importResult)]),
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
    ...(clearSavedWorldResult === null
      ? []
      : [createPausedMainMenuClearSavedWorldResultMenuSection(clearSavedWorldResult)]),
    ...(savedWorldStatus === null
      ? []
      : [createPausedMainMenuSavedWorldStatusMenuSection(savedWorldStatus)]),
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
        persistenceSummary.descriptionLine,
        resolvePausedMainMenuShellActionKeybindingSummaryLine(
          shellActionKeybindingsDefaultedFromPersistedState
        )
      ],
      metadataRows: [
        {
          label: 'Status',
          value: persistenceSummary.statusValue
        },
        {
          label: 'Resumes',
          value: formatMenuSectionMetadataRowValue(persistenceSummary.resumedToggleLabels)
        },
        {
          label: 'Saved On',
          value: formatMenuSectionMetadataRowValue(persistenceSummary.savedOnToggleLabels)
        },
        {
          label: 'Saved Off',
          value: formatMenuSectionMetadataRowValue(persistenceSummary.savedOffToggleLabels)
        },
        {
          label: 'Cleared by',
          value: formatMenuSectionMetadataRowValue(persistenceSummary.clearedByActionLabels)
        },
        ...createPausedMainMenuShellActionKeybindingSummaryRows(shellActionKeybindings)
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
  ] as const;
};

export const DEFAULT_PAUSED_MAIN_MENU_MENU_SECTIONS = createPausedMainMenuMenuSections();

export const createPausedMainMenuShellState = (
  worldSessionShellState: WorldSessionShellState = createDefaultWorldSessionShellState(),
  worldSessionShellPersistenceAvailable = true,
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState(),
  shellActionKeybindingsDefaultedFromPersistedState = false,
  importResult: PausedMainMenuImportResult | null = null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null = null,
  exportResult: PausedMainMenuExportResult | null = null,
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null = null
): AppShellState => ({
  screen: 'main-menu',
  statusText: DEFAULT_PAUSED_MAIN_MENU_STATUS,
  detailLines: DEFAULT_PAUSED_MAIN_MENU_DETAIL_LINES,
  menuSections: createPausedMainMenuMenuSections(
    worldSessionShellState,
    worldSessionShellPersistenceAvailable,
    shellActionKeybindings,
    shellActionKeybindingsDefaultedFromPersistedState,
    importResult,
    savedWorldStatus,
    exportResult,
    clearSavedWorldResult
  ),
  primaryActionLabel: 'Resume World',
  secondaryActionLabel: 'Export World Save',
  tertiaryActionLabel: 'Import World Save',
  quaternaryActionLabel: 'Clear Saved World',
  quinaryActionLabel: 'Reset Shell Toggles',
  senaryActionLabel: 'New World',
  ...(exportResult === null ? {} : { pausedMainMenuExportResult: exportResult }),
  ...(importResult === null ? {} : { pausedMainMenuImportResult: importResult }),
  ...(clearSavedWorldResult === null
    ? {}
    : { pausedMainMenuClearSavedWorldResult: clearSavedWorldResult })
});

export interface AppShellViewModel {
  screen: AppShellScreen;
  overlayVisible: boolean;
  chromeVisible: boolean;
  stageLabel: string;
  title: string;
  statusText: string;
  detailLines: readonly string[];
  menuSections: readonly AppShellMenuSection[];
  primaryActionLabel: string | null;
  secondaryActionLabel: string | null;
  tertiaryActionLabel: string | null;
  quaternaryActionLabel: string | null;
  quinaryActionLabel: string | null;
  senaryActionLabel: string | null;
  returnToMainMenuActionLabel: string | null;
  recenterCameraActionLabel: string | null;
  debugOverlayToggleLabel: string | null;
  debugOverlayTogglePressed: boolean;
  debugEditControlsToggleLabel: string | null;
  debugEditControlsTogglePressed: boolean;
  debugEditOverlaysToggleLabel: string | null;
  debugEditOverlaysTogglePressed: boolean;
  playerSpawnMarkerToggleLabel: string | null;
  playerSpawnMarkerTogglePressed: boolean;
  shortcutsToggleLabel: string | null;
  shortcutsTogglePressed: boolean;
  shortcutsOverlayVisible: boolean;
}

interface AppShellOptions {
  onPrimaryAction?: (screen: AppShellScreen) => void;
  onSecondaryAction?: (screen: AppShellScreen) => void;
  onTertiaryAction?: (screen: AppShellScreen) => void;
  onQuaternaryAction?: (screen: AppShellScreen) => void;
  onQuinaryAction?: (screen: AppShellScreen) => void;
  onSenaryAction?: (screen: AppShellScreen) => void;
  onReturnToMainMenu?: (screen: AppShellScreen) => void;
  onRecenterCamera?: (screen: AppShellScreen) => void;
  onToggleDebugOverlay?: (screen: AppShellScreen) => void;
  onToggleDebugEditControls?: (screen: AppShellScreen) => void;
  onToggleDebugEditOverlays?: (screen: AppShellScreen) => void;
  onTogglePlayerSpawnMarker?: (screen: AppShellScreen) => void;
  onToggleShortcutsOverlay?: (screen: AppShellScreen) => void;
}

const DEFAULT_BOOT_STATUS = 'Preparing renderer, controls, and spawn state.';
const DEFAULT_BOOT_DETAIL_LINES = [
  'Boot runs before the fixed-step simulation starts so later shell work has a stable entry point.'
] as const;
const DEFAULT_WEBGL_UNAVAILABLE_BOOT_STATUS = 'WebGL2 is not available in this browser.';
const DEFAULT_WEBGL_UNAVAILABLE_BOOT_DETAIL_LINES = [
  'Use a current Chrome, Firefox, or Safari build to continue.'
] as const;
const DEFAULT_RENDERER_INITIALIZATION_FAILED_BOOT_STATUS = 'Renderer initialization failed.';
const DEFAULT_RENDERER_INITIALIZATION_FAILED_BOOT_DETAIL_LINE =
  'Reload the page after confirming WebGL2 is available.';
const DEFAULT_FIRST_LAUNCH_MAIN_MENU_STATUS = 'Renderer ready.';
const DEFAULT_FIRST_LAUNCH_MAIN_MENU_DETAIL_LINES = [] as const;
const DEFAULT_FIRST_LAUNCH_MAIN_MENU_MENU_SECTIONS: readonly AppShellMenuSection[] = [
  {
    title: 'Enter World',
    lines: ['Start the fixed-step simulation, standalone player, and live in-world controls.'],
    tone: 'accent'
  },
  {
    title: 'Mixed-Device Runtime',
    lines: [
      'Desktop keeps movement, zoom, pan, and debug editing on the same world session.',
      'Touch keeps the on-screen edit controls and player pad aligned with that same runtime state.'
    ]
  }
] as const;

export const createFirstLaunchMainMenuShellState = (): AppShellState => ({
  screen: 'main-menu',
  statusText: DEFAULT_FIRST_LAUNCH_MAIN_MENU_STATUS,
  detailLines: DEFAULT_FIRST_LAUNCH_MAIN_MENU_DETAIL_LINES,
  menuSections: DEFAULT_FIRST_LAUNCH_MAIN_MENU_MENU_SECTIONS,
  primaryActionLabel: 'Enter World',
  secondaryActionLabel: null,
  tertiaryActionLabel: null
});

export const createMainMenuShellState = (
  hasResumableWorldSession: boolean,
  worldSessionShellState: WorldSessionShellState = createDefaultWorldSessionShellState(),
  worldSessionShellPersistenceAvailable = true,
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState(),
  shellActionKeybindingsDefaultedFromPersistedState = false,
  importResult: PausedMainMenuImportResult | null = null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null = null,
  exportResult: PausedMainMenuExportResult | null = null,
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null = null
): AppShellState =>
  hasResumableWorldSession
    ? createPausedMainMenuShellState(
        worldSessionShellState,
        worldSessionShellPersistenceAvailable,
        shellActionKeybindings,
        shellActionKeybindingsDefaultedFromPersistedState,
        importResult,
        savedWorldStatus,
        exportResult,
        clearSavedWorldResult
      )
    : createFirstLaunchMainMenuShellState();

export const createDefaultBootShellState = (): AppShellState => ({
  screen: 'boot',
  statusText: DEFAULT_BOOT_STATUS,
  detailLines: DEFAULT_BOOT_DETAIL_LINES
});

export const createWebGlUnavailableBootShellState = (): AppShellState => ({
  screen: 'boot',
  statusText: DEFAULT_WEBGL_UNAVAILABLE_BOOT_STATUS,
  detailLines: DEFAULT_WEBGL_UNAVAILABLE_BOOT_DETAIL_LINES
});

const resolveRendererInitializationFailedBootDetailLine = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return DEFAULT_RENDERER_INITIALIZATION_FAILED_BOOT_DETAIL_LINE;
};

export const createRendererInitializationFailedBootShellState = (
  error?: unknown
): AppShellState => ({
  screen: 'boot',
  statusText: DEFAULT_RENDERER_INITIALIZATION_FAILED_BOOT_STATUS,
  detailLines: [resolveRendererInitializationFailedBootDetailLine(error)]
});

export const createInWorldShellState = (
  options: InWorldShellStateOptions = {}
): AppShellState => ({
  screen: 'in-world',
  debugOverlayVisible: options.debugOverlayVisible ?? false,
  debugEditControlsVisible: options.debugEditControlsVisible ?? false,
  debugEditOverlaysVisible: options.debugEditOverlaysVisible ?? false,
  playerSpawnMarkerVisible: options.playerSpawnMarkerVisible ?? false,
  shortcutsOverlayVisible: options.shortcutsOverlayVisible ?? false,
  shellActionKeybindings:
    options.shellActionKeybindings ?? createDefaultShellActionKeybindingState()
});

export const resolveAppShellRegionDisplay = (
  visible: boolean,
  visibleDisplay: 'flex' | 'grid'
): 'flex' | 'grid' | 'none' => (visible ? visibleDisplay : 'none');

const resolveMainMenuPrimaryActionLabel = (label: string): string =>
  label === 'Resume World' ? `${label} (${getDesktopResumeWorldHotkeyLabel()})` : label;

const resolveMainMenuSecondaryActionLabel = (label: string): string => label;

const resolveMainMenuTertiaryActionLabel = (label: string): string => label;

const resolveMainMenuQuaternaryActionLabel = (label: string): string => label;

const resolveMainMenuQuinaryActionLabel = (label: string): string => label;

const resolveMainMenuSenaryActionLabel = (label: string): string =>
  label === 'New World' ? `${label} (${getDesktopFreshWorldHotkeyLabel()})` : label;

export const resolvePausedMainMenuExportWorldSaveTitle = (): string =>
  'Download a JSON world-save copy of the paused session without changing the current world, player, or camera state';

export const resolvePausedMainMenuImportWorldSaveTitle = (): string =>
  'Choose a JSON world-save file and replace the paused session only when its top-level envelope validates and runtime restore succeeds';

export const resolvePausedMainMenuClearSavedWorldTitle = (): string =>
  'Delete the browser-saved paused session while keeping the current world open in this tab until it is saved again';

export const resolvePausedMainMenuFreshWorldTitle = (): string =>
  `Discard the paused session, camera state, and undo history, then boot a fresh world (${getDesktopFreshWorldHotkeyLabel()})`;

export const resolvePausedMainMenuResumeWorldTitle = (): string =>
  `Resume the paused world session with current player, camera state, and debug edits intact (${getDesktopResumeWorldHotkeyLabel()})`;

export const resolvePausedMainMenuResetShellTogglesTitle = (): string =>
  'Clear saved in-world shell visibility preferences and restore the paused session to the default-off shell layout before the next resume';

export const resolveMainMenuPrimaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.primaryActionLabel === 'Resume World'
    ? resolvePausedMainMenuResumeWorldTitle()
    : '';

export const resolveMainMenuSecondaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.secondaryActionLabel === 'Export World Save'
    ? resolvePausedMainMenuExportWorldSaveTitle()
    : '';

export const resolveMainMenuTertiaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.tertiaryActionLabel === 'Import World Save'
    ? resolvePausedMainMenuImportWorldSaveTitle()
    : '';

export const resolveMainMenuQuaternaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.quaternaryActionLabel === 'Clear Saved World'
    ? resolvePausedMainMenuClearSavedWorldTitle()
    : '';

export const resolveMainMenuQuinaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.quinaryActionLabel === 'Reset Shell Toggles'
    ? resolvePausedMainMenuResetShellTogglesTitle()
    : '';

export const resolveMainMenuSenaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.senaryActionLabel === 'New World'
    ? resolvePausedMainMenuFreshWorldTitle()
    : '';

const resolveInWorldReturnToMainMenuActionLabel = (
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => `Main Menu (${getDesktopReturnToMainMenuHotkeyLabel(shellActionKeybindings)})`;

const resolveInWorldRecenterCameraActionLabel = (
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => `Recenter Camera (${getDesktopRecenterCameraHotkeyLabel(shellActionKeybindings)})`;

const resolveInWorldDebugOverlayToggleLabel = (
  visible: boolean,
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => `${visible ? 'Hide' : 'Show'} Debug HUD (${getDesktopDebugOverlayHotkeyLabel(shellActionKeybindings)})`;

const resolveInWorldDebugEditControlsToggleLabel = (
  visible: boolean,
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string =>
  `${visible ? 'Hide' : 'Show'} Edit Panel (${getDesktopDebugEditControlsHotkeyLabel(shellActionKeybindings)})`;

const resolveInWorldDebugEditOverlaysToggleLabel = (
  visible: boolean,
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string =>
  `${visible ? 'Hide' : 'Show'} Edit Overlays (${getDesktopDebugEditOverlaysHotkeyLabel(shellActionKeybindings)})`;

const resolveInWorldPlayerSpawnMarkerToggleLabel = (
  visible: boolean,
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string =>
  `${visible ? 'Hide' : 'Show'} Spawn Marker (${getDesktopPlayerSpawnMarkerHotkeyLabel(shellActionKeybindings)})`;

const resolveInWorldShortcutsToggleLabel = (): string =>
  `Shortcuts (${getDesktopShortcutsOverlayHotkeyLabel()})`;

export const resolveInWorldDebugEditControlsToggleTitle = (
  visible: boolean,
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string =>
  `${visible ? 'Hide' : 'Show'} the full debug-edit control panel (${getDesktopDebugEditControlsHotkeyLabel(shellActionKeybindings)})`;

interface InWorldShortcutsSection {
  title: string;
  lines: readonly string[];
}

const resolveInWorldShortcutsSections = (
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): readonly InWorldShortcutsSection[] => [
  {
    title: 'Desktop',
    lines: [
      `Move: A or D, or Left or Right Arrow`,
      'Jump: W, Up Arrow, or Space',
      `Session: ${getDesktopReturnToMainMenuHotkeyLabel(shellActionKeybindings)} return to main menu; ${getDesktopResumeWorldHotkeyLabel()} resume paused world; ${getDesktopFreshWorldHotkeyLabel()} new world from paused menu`,
      `Camera + shell: ${getDesktopRecenterCameraHotkeyLabel(shellActionKeybindings)} recenter, ${getDesktopDebugOverlayHotkeyLabel(shellActionKeybindings)} HUD, ${getDesktopDebugEditControlsHotkeyLabel(shellActionKeybindings)} edit panel, ${getDesktopDebugEditOverlaysHotkeyLabel(shellActionKeybindings)} edit overlays, ${getDesktopPlayerSpawnMarkerHotkeyLabel(shellActionKeybindings)} spawn marker`,
      `Brush + tools: 1-0 brush slots, [ and ] cycle brush, Esc cancel armed tools`,
      'History: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo'
    ]
  },
  {
    title: 'Touch',
    lines: [
      'Player: hold Left, Right, and Jump on the touch player pad',
      'Pan mode: one-finger drag camera, two-finger tap undo, three-finger tap redo',
      'Place and Break modes: one-finger drag paints or breaks tiles',
      'Pinch: two-finger pinch zoom while editing stays active',
      'Inspect: tap to pin in Pan mode, long-press eyedropper in Pan mode'
    ]
  }
];

const createShortcutsSectionElement = (section: InWorldShortcutsSection): HTMLElement => {
  const sectionElement = document.createElement('section');
  sectionElement.className = 'app-shell__shortcuts-section';

  const heading = document.createElement('h3');
  heading.className = 'app-shell__shortcuts-section-title';
  heading.textContent = section.title;
  sectionElement.append(heading);

  const list = document.createElement('ul');
  list.className = 'app-shell__shortcuts-list';
  list.replaceChildren(
    ...section.lines.map((line) => {
      const item = document.createElement('li');
      item.textContent = line;
      return item;
    })
  );
  sectionElement.append(list);

  return sectionElement;
};

const createMenuSectionElement = (section: AppShellMenuSection): HTMLElement => {
  const sectionElement = document.createElement('section');
  sectionElement.className = 'app-shell__menu-section';
  sectionElement.setAttribute('data-tone', section.tone ?? 'default');

  const heading = document.createElement('h3');
  heading.className = 'app-shell__menu-section-title';
  heading.textContent = section.title;
  sectionElement.append(heading);

  const lines = document.createElement('div');
  lines.className = 'app-shell__menu-section-lines';
  lines.replaceChildren(
    ...section.lines.map((line) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      return paragraph;
    })
  );
  sectionElement.append(lines);

  const metadataRows = section.metadataRows ?? [];
  if (metadataRows.length > 0) {
    const metadata = document.createElement('dl');
    metadata.className = 'app-shell__menu-section-metadata';
    metadata.replaceChildren(
      ...metadataRows.map((row) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'app-shell__menu-section-metadata-row';

        const label = document.createElement('dt');
        label.className = 'app-shell__menu-section-metadata-label';
        label.textContent = row.label;
        rowElement.append(label);

        const value = document.createElement('dd');
        value.className = 'app-shell__menu-section-metadata-value';
        value.textContent = row.value;
        rowElement.append(value);

        return rowElement;
      })
    );
    sectionElement.append(metadata);
  }

  return sectionElement;
};

export const resolveAppShellViewModel = (state: AppShellState): AppShellViewModel => {
  switch (state.screen) {
    case 'boot': {
      const defaultBootState = createDefaultBootShellState();
      return {
        screen: 'boot',
        overlayVisible: true,
        chromeVisible: false,
        stageLabel: 'Boot',
        title: 'Deep Factory',
        statusText: state.statusText ?? defaultBootState.statusText ?? '',
        detailLines: state.detailLines ?? defaultBootState.detailLines ?? [],
        menuSections: state.menuSections ?? [],
        primaryActionLabel: state.primaryActionLabel ?? null,
        secondaryActionLabel: state.secondaryActionLabel ?? null,
        tertiaryActionLabel: state.tertiaryActionLabel ?? null,
        quaternaryActionLabel: state.quaternaryActionLabel ?? null,
        quinaryActionLabel: state.quinaryActionLabel ?? null,
        senaryActionLabel: state.senaryActionLabel ?? null,
        returnToMainMenuActionLabel: null,
        recenterCameraActionLabel: null,
        debugOverlayToggleLabel: null,
        debugOverlayTogglePressed: false,
        debugEditControlsToggleLabel: null,
        debugEditControlsTogglePressed: false,
        debugEditOverlaysToggleLabel: null,
        debugEditOverlaysTogglePressed: false,
        playerSpawnMarkerToggleLabel: null,
        playerSpawnMarkerTogglePressed: false,
        shortcutsToggleLabel: null,
        shortcutsTogglePressed: false,
        shortcutsOverlayVisible: false
      };
    }
    case 'main-menu': {
      const firstLaunchMainMenuState = createFirstLaunchMainMenuShellState();
      return {
        screen: 'main-menu',
        overlayVisible: true,
        chromeVisible: false,
        stageLabel: 'Main Menu',
        title: 'Deep Factory',
        statusText: state.statusText ?? firstLaunchMainMenuState.statusText ?? '',
        detailLines: state.detailLines ?? firstLaunchMainMenuState.detailLines ?? [],
        menuSections: state.menuSections ?? firstLaunchMainMenuState.menuSections ?? [],
        primaryActionLabel: resolveMainMenuPrimaryActionLabel(
          state.primaryActionLabel ?? firstLaunchMainMenuState.primaryActionLabel ?? 'Enter World'
        ),
        secondaryActionLabel:
          (state.secondaryActionLabel ?? firstLaunchMainMenuState.secondaryActionLabel) == null
            ? null
            : resolveMainMenuSecondaryActionLabel(
                state.secondaryActionLabel ?? firstLaunchMainMenuState.secondaryActionLabel ?? ''
              ),
        tertiaryActionLabel:
          (state.tertiaryActionLabel ?? firstLaunchMainMenuState.tertiaryActionLabel) == null
            ? null
            : resolveMainMenuTertiaryActionLabel(
                state.tertiaryActionLabel ?? firstLaunchMainMenuState.tertiaryActionLabel ?? ''
              ),
        quaternaryActionLabel:
          (state.quaternaryActionLabel ?? firstLaunchMainMenuState.quaternaryActionLabel) == null
            ? null
            : resolveMainMenuQuaternaryActionLabel(
                state.quaternaryActionLabel ??
                  firstLaunchMainMenuState.quaternaryActionLabel ??
                  ''
              ),
        quinaryActionLabel:
          (state.quinaryActionLabel ?? firstLaunchMainMenuState.quinaryActionLabel) == null
            ? null
            : resolveMainMenuQuinaryActionLabel(
                state.quinaryActionLabel ?? firstLaunchMainMenuState.quinaryActionLabel ?? ''
              ),
        senaryActionLabel:
          (state.senaryActionLabel ?? firstLaunchMainMenuState.senaryActionLabel) == null
            ? null
            : resolveMainMenuSenaryActionLabel(
                state.senaryActionLabel ?? firstLaunchMainMenuState.senaryActionLabel ?? ''
              ),
        returnToMainMenuActionLabel: null,
        recenterCameraActionLabel: null,
        debugOverlayToggleLabel: null,
        debugOverlayTogglePressed: false,
        debugEditControlsToggleLabel: null,
        debugEditControlsTogglePressed: false,
        debugEditOverlaysToggleLabel: null,
        debugEditOverlaysTogglePressed: false,
        playerSpawnMarkerToggleLabel: null,
        playerSpawnMarkerTogglePressed: false,
        shortcutsToggleLabel: null,
        shortcutsTogglePressed: false,
        shortcutsOverlayVisible: false
      };
    }
    case 'in-world': {
      const inWorldState = createInWorldShellState({
        debugOverlayVisible: state.debugOverlayVisible,
        debugEditControlsVisible: state.debugEditControlsVisible,
        debugEditOverlaysVisible: state.debugEditOverlaysVisible,
        playerSpawnMarkerVisible: state.playerSpawnMarkerVisible,
        shortcutsOverlayVisible: state.shortcutsOverlayVisible,
        shellActionKeybindings: state.shellActionKeybindings
      });
      return {
        screen: 'in-world',
        overlayVisible: false,
        chromeVisible: true,
        stageLabel: 'In World',
        title: 'Deep Factory',
        statusText: state.statusText ?? '',
        detailLines: state.detailLines ?? [],
        menuSections: state.menuSections ?? [],
        primaryActionLabel: null,
        secondaryActionLabel: null,
        tertiaryActionLabel: null,
        quaternaryActionLabel: null,
        quinaryActionLabel: null,
        senaryActionLabel: null,
        returnToMainMenuActionLabel: resolveInWorldReturnToMainMenuActionLabel(
          inWorldState.shellActionKeybindings
        ),
        recenterCameraActionLabel: resolveInWorldRecenterCameraActionLabel(
          inWorldState.shellActionKeybindings
        ),
        debugOverlayToggleLabel: resolveInWorldDebugOverlayToggleLabel(
          inWorldState.debugOverlayVisible === true,
          inWorldState.shellActionKeybindings
        ),
        debugOverlayTogglePressed: inWorldState.debugOverlayVisible === true,
        debugEditControlsToggleLabel: resolveInWorldDebugEditControlsToggleLabel(
          inWorldState.debugEditControlsVisible === true,
          inWorldState.shellActionKeybindings
        ),
        debugEditControlsTogglePressed: inWorldState.debugEditControlsVisible === true,
        debugEditOverlaysToggleLabel: resolveInWorldDebugEditOverlaysToggleLabel(
          inWorldState.debugEditOverlaysVisible === true,
          inWorldState.shellActionKeybindings
        ),
        debugEditOverlaysTogglePressed: inWorldState.debugEditOverlaysVisible === true,
        playerSpawnMarkerToggleLabel: resolveInWorldPlayerSpawnMarkerToggleLabel(
          inWorldState.playerSpawnMarkerVisible === true,
          inWorldState.shellActionKeybindings
        ),
        playerSpawnMarkerTogglePressed: inWorldState.playerSpawnMarkerVisible === true,
        shortcutsToggleLabel: resolveInWorldShortcutsToggleLabel(),
        shortcutsTogglePressed: inWorldState.shortcutsOverlayVisible === true,
        shortcutsOverlayVisible: inWorldState.shortcutsOverlayVisible === true
      };
    }
  }
};

export class AppShell {
  private root: HTMLDivElement;
  private worldHost: HTMLDivElement;
  private overlay: HTMLDivElement;
  private overlayActions: HTMLDivElement;
  private chrome: HTMLDivElement;
  private returnToMainMenuActionButton: HTMLButtonElement;
  private recenterCameraActionButton: HTMLButtonElement;
  private debugOverlayToggleButton: HTMLButtonElement;
  private debugEditControlsToggleButton: HTMLButtonElement;
  private debugEditOverlaysToggleButton: HTMLButtonElement;
  private playerSpawnMarkerToggleButton: HTMLButtonElement;
  private shortcutsToggleButton: HTMLButtonElement;
  private shortcutsOverlay: HTMLDivElement;
  private shortcutsSections: HTMLDivElement;
  private stageLabel: HTMLSpanElement;
  private title: HTMLHeadingElement;
  private status: HTMLParagraphElement;
  private menuSections: HTMLDivElement;
  private detailList: HTMLUListElement;
  private primaryButton: HTMLButtonElement;
  private secondaryButton: HTMLButtonElement;
  private tertiaryButton: HTMLButtonElement;
  private quaternaryButton: HTMLButtonElement;
  private quinaryButton: HTMLButtonElement;
  private senaryButton: HTMLButtonElement;
  private onPrimaryAction: (screen: AppShellScreen) => void;
  private onSecondaryAction: (screen: AppShellScreen) => void;
  private onTertiaryAction: (screen: AppShellScreen) => void;
  private onQuaternaryAction: (screen: AppShellScreen) => void;
  private onQuinaryAction: (screen: AppShellScreen) => void;
  private onSenaryAction: (screen: AppShellScreen) => void;
  private onReturnToMainMenu: (screen: AppShellScreen) => void;
  private onRecenterCamera: (screen: AppShellScreen) => void;
  private onToggleDebugOverlay: (screen: AppShellScreen) => void;
  private onToggleDebugEditControls: (screen: AppShellScreen) => void;
  private onToggleDebugEditOverlays: (screen: AppShellScreen) => void;
  private onTogglePlayerSpawnMarker: (screen: AppShellScreen) => void;
  private onToggleShortcutsOverlay: (screen: AppShellScreen) => void;
  private currentState: AppShellState = createDefaultBootShellState();

  constructor(container: HTMLElement, options: AppShellOptions = {}) {
    this.onPrimaryAction = options.onPrimaryAction ?? (() => {});
    this.onSecondaryAction = options.onSecondaryAction ?? (() => {});
    this.onTertiaryAction = options.onTertiaryAction ?? (() => {});
    this.onQuaternaryAction = options.onQuaternaryAction ?? (() => {});
    this.onQuinaryAction = options.onQuinaryAction ?? (() => {});
    this.onSenaryAction = options.onSenaryAction ?? (() => {});
    this.onReturnToMainMenu = options.onReturnToMainMenu ?? (() => {});
    this.onRecenterCamera = options.onRecenterCamera ?? (() => {});
    this.onToggleDebugOverlay = options.onToggleDebugOverlay ?? (() => {});
    this.onToggleDebugEditControls = options.onToggleDebugEditControls ?? (() => {});
    this.onToggleDebugEditOverlays = options.onToggleDebugEditOverlays ?? (() => {});
    this.onTogglePlayerSpawnMarker = options.onTogglePlayerSpawnMarker ?? (() => {});
    this.onToggleShortcutsOverlay = options.onToggleShortcutsOverlay ?? (() => {});

    this.root = document.createElement('div');
    this.root.className = 'app-shell';

    this.worldHost = document.createElement('div');
    this.worldHost.className = 'app-shell__world';
    this.root.append(this.worldHost);

    this.chrome = document.createElement('div');
    this.chrome.className = 'app-shell__chrome';
    this.root.append(this.chrome);

    this.returnToMainMenuActionButton = document.createElement('button');
    this.returnToMainMenuActionButton.type = 'button';
    this.returnToMainMenuActionButton.className = 'app-shell__chrome-button';
    this.returnToMainMenuActionButton.addEventListener('click', () =>
      this.onReturnToMainMenu(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.returnToMainMenuActionButton);
    this.chrome.append(this.returnToMainMenuActionButton);

    this.recenterCameraActionButton = document.createElement('button');
    this.recenterCameraActionButton.type = 'button';
    this.recenterCameraActionButton.className = 'app-shell__chrome-button';
    this.recenterCameraActionButton.addEventListener('click', () =>
      this.onRecenterCamera(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.recenterCameraActionButton);
    this.chrome.append(this.recenterCameraActionButton);

    this.debugOverlayToggleButton = document.createElement('button');
    this.debugOverlayToggleButton.type = 'button';
    this.debugOverlayToggleButton.className = 'app-shell__chrome-button';
    this.debugOverlayToggleButton.addEventListener('click', () =>
      this.onToggleDebugOverlay(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.debugOverlayToggleButton);
    this.chrome.append(this.debugOverlayToggleButton);

    this.debugEditControlsToggleButton = document.createElement('button');
    this.debugEditControlsToggleButton.type = 'button';
    this.debugEditControlsToggleButton.className = 'app-shell__chrome-button';
    this.debugEditControlsToggleButton.addEventListener('click', () =>
      this.onToggleDebugEditControls(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.debugEditControlsToggleButton);
    this.chrome.append(this.debugEditControlsToggleButton);

    this.debugEditOverlaysToggleButton = document.createElement('button');
    this.debugEditOverlaysToggleButton.type = 'button';
    this.debugEditOverlaysToggleButton.className = 'app-shell__chrome-button';
    this.debugEditOverlaysToggleButton.addEventListener('click', () =>
      this.onToggleDebugEditOverlays(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.debugEditOverlaysToggleButton);
    this.chrome.append(this.debugEditOverlaysToggleButton);

    this.playerSpawnMarkerToggleButton = document.createElement('button');
    this.playerSpawnMarkerToggleButton.type = 'button';
    this.playerSpawnMarkerToggleButton.className = 'app-shell__chrome-button';
    this.playerSpawnMarkerToggleButton.addEventListener('click', () =>
      this.onTogglePlayerSpawnMarker(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.playerSpawnMarkerToggleButton);
    this.chrome.append(this.playerSpawnMarkerToggleButton);

    this.shortcutsToggleButton = document.createElement('button');
    this.shortcutsToggleButton.type = 'button';
    this.shortcutsToggleButton.className = 'app-shell__chrome-button';
    this.shortcutsToggleButton.addEventListener('click', () =>
      this.onToggleShortcutsOverlay(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.shortcutsToggleButton);
    this.chrome.append(this.shortcutsToggleButton);

    this.shortcutsOverlay = document.createElement('div');
    this.shortcutsOverlay.className = 'app-shell__shortcuts-overlay';
    this.root.append(this.shortcutsOverlay);

    const shortcutsPanel = document.createElement('section');
    shortcutsPanel.className = 'app-shell__shortcuts-panel';
    this.shortcutsOverlay.append(shortcutsPanel);

    const shortcutsTitle = document.createElement('h2');
    shortcutsTitle.className = 'app-shell__shortcuts-title';
    shortcutsTitle.textContent = 'Shortcuts';
    shortcutsPanel.append(shortcutsTitle);

    const shortcutsSubtitle = document.createElement('p');
    shortcutsSubtitle.className = 'app-shell__shortcuts-subtitle';
    shortcutsSubtitle.textContent = 'Current desktop and touch controls for this session.';
    shortcutsPanel.append(shortcutsSubtitle);

    this.shortcutsSections = document.createElement('div');
    this.shortcutsSections.className = 'app-shell__shortcuts-sections';
    this.shortcutsSections.replaceChildren(
      ...resolveInWorldShortcutsSections().map((section) => createShortcutsSectionElement(section))
    );
    shortcutsPanel.append(this.shortcutsSections);

    this.overlay = document.createElement('div');
    this.overlay.className = 'app-shell__overlay';
    this.root.append(this.overlay);

    const panel = document.createElement('section');
    panel.className = 'app-shell__panel';
    this.overlay.append(panel);

    this.stageLabel = document.createElement('span');
    this.stageLabel.className = 'app-shell__stage';
    panel.append(this.stageLabel);

    this.title = document.createElement('h1');
    this.title.className = 'app-shell__title';
    panel.append(this.title);

    this.status = document.createElement('p');
    this.status.className = 'app-shell__status';
    panel.append(this.status);

    this.menuSections = document.createElement('div');
    this.menuSections.className = 'app-shell__menu-sections';
    panel.append(this.menuSections);

    this.detailList = document.createElement('ul');
    this.detailList.className = 'app-shell__detail-list';
    panel.append(this.detailList);

    this.overlayActions = document.createElement('div');
    this.overlayActions.className = 'app-shell__actions';
    panel.append(this.overlayActions);

    this.primaryButton = document.createElement('button');
    this.primaryButton.type = 'button';
    this.primaryButton.className = 'app-shell__primary';
    this.primaryButton.addEventListener('click', () => this.onPrimaryAction(this.currentState.screen));
    installPointerClickFocusRelease(this.primaryButton);
    this.overlayActions.append(this.primaryButton);

    this.secondaryButton = document.createElement('button');
    this.secondaryButton.type = 'button';
    this.secondaryButton.className = 'app-shell__secondary';
    this.secondaryButton.addEventListener('click', () => this.onSecondaryAction(this.currentState.screen));
    installPointerClickFocusRelease(this.secondaryButton);
    this.overlayActions.append(this.secondaryButton);

    this.tertiaryButton = document.createElement('button');
    this.tertiaryButton.type = 'button';
    this.tertiaryButton.className = 'app-shell__secondary';
    this.tertiaryButton.addEventListener('click', () => this.onTertiaryAction(this.currentState.screen));
    installPointerClickFocusRelease(this.tertiaryButton);
    this.overlayActions.append(this.tertiaryButton);

    this.quaternaryButton = document.createElement('button');
    this.quaternaryButton.type = 'button';
    this.quaternaryButton.className = 'app-shell__secondary';
    this.quaternaryButton.addEventListener('click', () =>
      this.onQuaternaryAction(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.quaternaryButton);
    this.overlayActions.append(this.quaternaryButton);

    this.quinaryButton = document.createElement('button');
    this.quinaryButton.type = 'button';
    this.quinaryButton.className = 'app-shell__secondary';
    this.quinaryButton.addEventListener('click', () => this.onQuinaryAction(this.currentState.screen));
    installPointerClickFocusRelease(this.quinaryButton);
    this.overlayActions.append(this.quinaryButton);

    this.senaryButton = document.createElement('button');
    this.senaryButton.type = 'button';
    this.senaryButton.className = 'app-shell__secondary';
    this.senaryButton.addEventListener('click', () => this.onSenaryAction(this.currentState.screen));
    installPointerClickFocusRelease(this.senaryButton);
    this.overlayActions.append(this.senaryButton);

    container.replaceChildren(this.root);
    this.setState(this.currentState);
  }

  getWorldHost(): HTMLDivElement {
    return this.worldHost;
  }

  setState(state: AppShellState): void {
    this.currentState = state;
    const viewModel = resolveAppShellViewModel(state);
    const shellActionKeybindings =
      state.screen === 'in-world'
        ? createInWorldShellState({
            shellActionKeybindings: state.shellActionKeybindings
          }).shellActionKeybindings
        : createDefaultShellActionKeybindingState();

    this.root.dataset.screen = viewModel.screen;
    this.overlay.hidden = !viewModel.overlayVisible;
    this.overlay.style.display = resolveAppShellRegionDisplay(viewModel.overlayVisible, 'grid');
    this.chrome.hidden = !viewModel.chromeVisible;
    this.chrome.style.display = resolveAppShellRegionDisplay(viewModel.chromeVisible, 'flex');
    this.stageLabel.textContent = viewModel.stageLabel;
    this.title.textContent = viewModel.title;
    this.status.textContent = viewModel.statusText;
    this.menuSections.replaceChildren(
      ...viewModel.menuSections.map((section) => createMenuSectionElement(section))
    );
    this.menuSections.hidden = viewModel.menuSections.length === 0;
    this.menuSections.style.display = resolveAppShellRegionDisplay(
      viewModel.menuSections.length > 0,
      'grid'
    );
    this.detailList.replaceChildren(
      ...viewModel.detailLines.map((line) => {
        const item = document.createElement('li');
        item.textContent = line;
        return item;
      })
    );
    this.detailList.hidden = viewModel.detailLines.length === 0;
    this.detailList.style.display = resolveAppShellRegionDisplay(viewModel.detailLines.length > 0, 'grid');
    this.primaryButton.textContent = viewModel.primaryActionLabel ?? '';
    this.primaryButton.hidden = viewModel.primaryActionLabel === null;
    this.primaryButton.title = resolveMainMenuPrimaryActionTitle(state);
    this.secondaryButton.textContent = viewModel.secondaryActionLabel ?? '';
    this.secondaryButton.hidden = viewModel.secondaryActionLabel === null;
    this.secondaryButton.title = resolveMainMenuSecondaryActionTitle(state);
    this.tertiaryButton.textContent = viewModel.tertiaryActionLabel ?? '';
    this.tertiaryButton.hidden = viewModel.tertiaryActionLabel === null;
    this.tertiaryButton.title = resolveMainMenuTertiaryActionTitle(state);
    this.quaternaryButton.textContent = viewModel.quaternaryActionLabel ?? '';
    this.quaternaryButton.hidden = viewModel.quaternaryActionLabel === null;
    this.quaternaryButton.title = resolveMainMenuQuaternaryActionTitle(state);
    this.quinaryButton.textContent = viewModel.quinaryActionLabel ?? '';
    this.quinaryButton.hidden = viewModel.quinaryActionLabel === null;
    this.quinaryButton.title = resolveMainMenuQuinaryActionTitle(state);
    this.senaryButton.textContent = viewModel.senaryActionLabel ?? '';
    this.senaryButton.hidden = viewModel.senaryActionLabel === null;
    this.senaryButton.title = resolveMainMenuSenaryActionTitle(state);
    const overlayActionsVisible =
      viewModel.primaryActionLabel !== null ||
      viewModel.secondaryActionLabel !== null ||
      viewModel.tertiaryActionLabel !== null ||
      viewModel.quaternaryActionLabel !== null ||
      viewModel.quinaryActionLabel !== null ||
      viewModel.senaryActionLabel !== null;
    this.overlayActions.hidden = !overlayActionsVisible;
    this.overlayActions.style.display = resolveAppShellRegionDisplay(overlayActionsVisible, 'flex');
    this.returnToMainMenuActionButton.textContent = viewModel.returnToMainMenuActionLabel ?? '';
    this.returnToMainMenuActionButton.hidden = viewModel.returnToMainMenuActionLabel === null;
    this.returnToMainMenuActionButton.title =
      `Return to the main menu without discarding the current world session (${getDesktopReturnToMainMenuHotkeyLabel(shellActionKeybindings)})`;
    this.recenterCameraActionButton.textContent = viewModel.recenterCameraActionLabel ?? '';
    this.recenterCameraActionButton.hidden = viewModel.recenterCameraActionLabel === null;
    this.recenterCameraActionButton.title =
      `Center the camera on the standalone player and clear manual follow offset (${getDesktopRecenterCameraHotkeyLabel(shellActionKeybindings)})`;
    this.debugOverlayToggleButton.textContent = viewModel.debugOverlayToggleLabel ?? '';
    this.debugOverlayToggleButton.hidden = viewModel.debugOverlayToggleLabel === null;
    this.debugOverlayToggleButton.setAttribute(
      'aria-pressed',
      viewModel.debugOverlayTogglePressed ? 'true' : 'false'
    );
    this.debugOverlayToggleButton.title = viewModel.debugOverlayTogglePressed
      ? `Hide debug HUD telemetry (${getDesktopDebugOverlayHotkeyLabel(shellActionKeybindings)})`
      : `Show debug HUD telemetry (${getDesktopDebugOverlayHotkeyLabel(shellActionKeybindings)})`;
    this.debugEditControlsToggleButton.textContent = viewModel.debugEditControlsToggleLabel ?? '';
    this.debugEditControlsToggleButton.hidden = viewModel.debugEditControlsToggleLabel === null;
    this.debugEditControlsToggleButton.setAttribute(
      'aria-pressed',
      viewModel.debugEditControlsTogglePressed ? 'true' : 'false'
    );
    this.debugEditControlsToggleButton.title = resolveInWorldDebugEditControlsToggleTitle(
      viewModel.debugEditControlsTogglePressed,
      shellActionKeybindings
    );
    this.debugEditOverlaysToggleButton.textContent = viewModel.debugEditOverlaysToggleLabel ?? '';
    this.debugEditOverlaysToggleButton.hidden = viewModel.debugEditOverlaysToggleLabel === null;
    this.debugEditOverlaysToggleButton.setAttribute(
      'aria-pressed',
      viewModel.debugEditOverlaysTogglePressed ? 'true' : 'false'
    );
    this.debugEditOverlaysToggleButton.title = viewModel.debugEditOverlaysTogglePressed
      ? `Hide compact debug-edit overlays (${getDesktopDebugEditOverlaysHotkeyLabel(shellActionKeybindings)})`
      : `Show compact debug-edit overlays (${getDesktopDebugEditOverlaysHotkeyLabel(shellActionKeybindings)})`;
    this.playerSpawnMarkerToggleButton.textContent = viewModel.playerSpawnMarkerToggleLabel ?? '';
    this.playerSpawnMarkerToggleButton.hidden = viewModel.playerSpawnMarkerToggleLabel === null;
    this.playerSpawnMarkerToggleButton.setAttribute(
      'aria-pressed',
      viewModel.playerSpawnMarkerTogglePressed ? 'true' : 'false'
    );
    this.playerSpawnMarkerToggleButton.title = viewModel.playerSpawnMarkerTogglePressed
      ? `Hide standalone player spawn marker overlay (${getDesktopPlayerSpawnMarkerHotkeyLabel(shellActionKeybindings)})`
      : `Show standalone player spawn marker overlay (${getDesktopPlayerSpawnMarkerHotkeyLabel(shellActionKeybindings)})`;
    this.shortcutsToggleButton.textContent = viewModel.shortcutsToggleLabel ?? '';
    this.shortcutsToggleButton.hidden = viewModel.shortcutsToggleLabel === null;
    this.shortcutsToggleButton.setAttribute(
      'aria-pressed',
      viewModel.shortcutsTogglePressed ? 'true' : 'false'
    );
    this.shortcutsToggleButton.title = viewModel.shortcutsTogglePressed
      ? `Hide current desktop and touch controls (${getDesktopShortcutsOverlayHotkeyLabel()})`
      : `Show current desktop and touch controls (${getDesktopShortcutsOverlayHotkeyLabel()})`;
    this.shortcutsSections.replaceChildren(
      ...resolveInWorldShortcutsSections(shellActionKeybindings).map((section) =>
        createShortcutsSectionElement(section)
      )
    );
    this.shortcutsOverlay.hidden = !viewModel.shortcutsOverlayVisible;
    this.shortcutsOverlay.style.display = resolveAppShellRegionDisplay(
      viewModel.shortcutsOverlayVisible,
      'grid'
    );
    this.shortcutsOverlay.setAttribute('aria-hidden', viewModel.shortcutsOverlayVisible ? 'false' : 'true');
  }
}
