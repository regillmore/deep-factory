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
  getInWorldShellActionKeybindingActionLabel,
  IN_WORLD_SHELL_ACTION_KEYBINDING_IDS,
  matchesDefaultShellActionKeybindingState,
  remapShellActionKeybinding,
  type InWorldShellActionKeybindingActionType,
  type ShellActionKeybindingState
} from '../input/shellActionKeybindings';
import {
  createDefaultWorldSessionShellState,
  createWorldSessionShellStatePersistenceSummary,
  createWorldSessionShellStateToggleChanges,
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

export interface PausedMainMenuShellSettingsSectionState {
  visible: boolean;
  expanded: boolean;
  summaryLine: string | null;
  toggleLabel: string | null;
  editorVisible: boolean;
}

export interface PausedMainMenuHelpCopySectionState {
  visible: boolean;
  expanded: boolean;
  summaryLine: string | null;
  toggleLabel: string | null;
  showMenuSectionLines: boolean;
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

export interface PausedMainMenuClearedResetShellTogglesResult {
  status: 'cleared';
}

export interface PausedMainMenuPersistenceFailedResetShellTogglesResult {
  status: 'persistence-failed';
  reason: string;
}

export type PausedMainMenuResetShellTogglesResult =
  | PausedMainMenuClearedResetShellTogglesResult
  | PausedMainMenuPersistenceFailedResetShellTogglesResult;

export interface PausedMainMenuSavedShellActionKeybindingRemapResult {
  status: 'saved';
}

export interface PausedMainMenuSessionOnlyShellActionKeybindingRemapResult {
  status: 'session-only';
}

export interface PausedMainMenuRejectedShellActionKeybindingRemapResult {
  status: 'rejected';
}

export type PausedMainMenuShellActionKeybindingRemapResult =
  | PausedMainMenuSavedShellActionKeybindingRemapResult
  | PausedMainMenuSessionOnlyShellActionKeybindingRemapResult
  | PausedMainMenuRejectedShellActionKeybindingRemapResult;

export type PausedMainMenuResetShellActionKeybindingsResultCategory =
  | 'default-set-reset'
  | 'load-fallback-recovery';

export interface PausedMainMenuResetShellActionKeybindingsResetResult {
  status: 'reset';
  category: PausedMainMenuResetShellActionKeybindingsResultCategory;
}

export interface PausedMainMenuResetShellActionKeybindingsNoopResult {
  status: 'noop';
}

export interface PausedMainMenuResetShellActionKeybindingsFailedResult {
  status: 'failed';
}

export type PausedMainMenuResetShellActionKeybindingsResult =
  | PausedMainMenuResetShellActionKeybindingsResetResult
  | PausedMainMenuResetShellActionKeybindingsNoopResult
  | PausedMainMenuResetShellActionKeybindingsFailedResult;

export interface PausedMainMenuDownloadedShellProfileExportResult {
  status: 'downloaded';
  fileName: string | null;
}

export interface PausedMainMenuFailedShellProfileExportResult {
  status: 'failed';
  reason: string;
}

export type PausedMainMenuShellProfileExportResult =
  | PausedMainMenuDownloadedShellProfileExportResult
  | PausedMainMenuFailedShellProfileExportResult;

export interface PausedMainMenuClearedShellProfilePreviewClearResult {
  status: 'cleared';
  fileName: string | null;
}

export interface PausedMainMenuFailedShellProfilePreviewClearResult {
  status: 'failed';
  reason: string;
}

export type PausedMainMenuShellProfilePreviewClearResult =
  | PausedMainMenuClearedShellProfilePreviewClearResult
  | PausedMainMenuFailedShellProfilePreviewClearResult;

export type PausedMainMenuShellProfileApplyChangeCategory =
  | 'none'
  | 'toggle-only'
  | 'hotkey-only'
  | 'mixed';

export interface PausedMainMenuAppliedShellProfileImportResult {
  status: 'applied';
  fileName: string | null;
  changeCategory: PausedMainMenuShellProfileApplyChangeCategory;
}

export interface PausedMainMenuPreviewedShellProfileImportResult {
  status: 'previewed';
  fileName: string | null;
}

export interface PausedMainMenuPersistenceFailedShellProfileImportResult {
  status: 'persistence-failed';
  fileName: string | null;
  reason: string;
  changeCategory: PausedMainMenuShellProfileApplyChangeCategory;
}

export interface PausedMainMenuRejectedShellProfileImportResult {
  status: 'rejected';
  fileName: string | null;
  reason: string;
}

export interface PausedMainMenuCancelledShellProfileImportResult {
  status: 'cancelled';
}

export interface PausedMainMenuPickerStartFailedShellProfileImportResult {
  status: 'picker-start-failed';
  reason: string;
}

export interface PausedMainMenuFailedShellProfileImportResult {
  status: 'failed';
  reason: string;
}

export type PausedMainMenuShellProfileImportResult =
  | PausedMainMenuPreviewedShellProfileImportResult
  | PausedMainMenuAppliedShellProfileImportResult
  | PausedMainMenuPersistenceFailedShellProfileImportResult
  | PausedMainMenuRejectedShellProfileImportResult
  | PausedMainMenuCancelledShellProfileImportResult
  | PausedMainMenuPickerStartFailedShellProfileImportResult
  | PausedMainMenuFailedShellProfileImportResult;

export interface PausedMainMenuShellProfilePreview {
  fileName: string | null;
  shellState: WorldSessionShellState;
  shellActionKeybindings: ShellActionKeybindingState;
}

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
  worldSessionShellPersistenceAvailable?: boolean;
  shellActionKeybindingsCurrentSessionOnly?: boolean;
  pausedMainMenuExportResult?: PausedMainMenuExportResult;
  pausedMainMenuImportResult?: PausedMainMenuImportResult;
  pausedMainMenuClearSavedWorldResult?: PausedMainMenuClearSavedWorldResult;
  pausedMainMenuResetShellTogglesResult?: PausedMainMenuResetShellTogglesResult;
  pausedMainMenuShellProfilePreview?: PausedMainMenuShellProfilePreview;
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
const DEFAULT_PAUSED_MAIN_MENU_HELP_COPY_SUMMARY_LINE =
  'Pause-menu cards keep shortcuts, consequences, and status rows visible below. Expand help text to read the longer descriptions.';
const DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_SUMMARY_LINE =
  'Current in-world shell hotkeys preview the active binding set and can be remapped below.';
const DEFAULTED_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_SUMMARY_LINE =
  'Saved in-world shell-action keybindings fell back to a recovered safe set during load. Review or remap the rows below before resuming.';
const formatMenuSectionMetadataRowValue = (labels: readonly string[]): string =>
  labels.length > 0 ? labels.join(', ') : 'None';
const formatMenuSectionSummaryListValue = (labels: readonly string[]): string => {
  if (labels.length === 0) {
    return 'None';
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
};
const parseMenuSectionMetadataRowValue = (value: string | undefined): readonly string[] => {
  const trimmedValue = value?.trim() ?? '';
  if (trimmedValue.length === 0 || trimmedValue === 'None') {
    return [];
  }

  return trimmedValue.split(', ');
};
const findMenuSectionMetadataRowValue = (
  menuSections: readonly AppShellMenuSection[],
  sectionTitle: string,
  rowLabel: string
): string | undefined =>
  menuSections
    .find((section) => section.title === sectionTitle)
    ?.metadataRows?.find((row) => row.label === rowLabel)?.value;
const findMenuSectionLines = (
  menuSections: readonly AppShellMenuSection[],
  sectionTitle: string
): readonly string[] =>
  menuSections.find((section) => section.title === sectionTitle)?.lines ?? [];
const resolvePausedMainMenuShellProfilePreviewChangeCategory = (
  menuSections: readonly AppShellMenuSection[] = []
): PausedMainMenuShellProfileApplyChangeCategory => {
  const toggleChanges = parseMenuSectionMetadataRowValue(
    findMenuSectionMetadataRowValue(menuSections, 'Shell Profile Preview', 'Toggle Changes')
  );
  const hotkeyChanges = parseMenuSectionMetadataRowValue(
    findMenuSectionMetadataRowValue(menuSections, 'Shell Profile Preview', 'Hotkey Changes')
  );

  if (toggleChanges.length === 0 && hotkeyChanges.length === 0) {
    return 'none';
  }

  if (toggleChanges.length === 0) {
    return 'hotkey-only';
  }

  if (hotkeyChanges.length === 0) {
    return 'toggle-only';
  }

  return 'mixed';
};
const resolvePausedMainMenuShellProfilePreviewSummaryLine = (
  menuSections: readonly AppShellMenuSection[] = []
): string | null => {
  const previewFileValue = findMenuSectionMetadataRowValue(
    menuSections,
    'Shell Profile Preview',
    'File'
  );

  if (previewFileValue === undefined) {
    return null;
  }

  const subject =
    previewFileValue === 'Unknown file'
      ? 'A validated shell profile preview'
      : `Shell profile preview from ${previewFileValue}`;

  switch (resolvePausedMainMenuShellProfilePreviewChangeCategory(menuSections)) {
    case 'toggle-only':
      return `${subject} is ready to apply with shell visibility toggle changes only.`;
    case 'hotkey-only':
      return `${subject} is ready to apply with shell hotkey changes only.`;
    case 'mixed':
      return `${subject} is ready to apply with both shell visibility toggle and hotkey changes.`;
    case 'none':
      return `${subject} already matches the paused session, so applying it would not change shell visibility toggles or hotkeys.`;
  }
};
const resolvePausedMainMenuShellSettingsPersistenceSummaryLine = (
  menuSections: readonly AppShellMenuSection[] = []
): string | null => {
  const persistenceStatusValue = findMenuSectionMetadataRowValue(
    menuSections,
    'Persistence Summary',
    'Status'
  );
  const bindingSetValue = findMenuSectionMetadataRowValue(
    menuSections,
    'Persistence Summary',
    'Binding Set'
  );
  const summaryLines: string[] = [];

  if (persistenceStatusValue !== undefined) {
    summaryLines.push(
      persistenceStatusValue === 'Session-only fallback'
        ? 'Shell settings are in session-only fallback.'
        : `Shell settings are ${persistenceStatusValue.toLowerCase()}.`
    );
  }

  if (bindingSetValue !== undefined) {
    summaryLines.push(`Current shell hotkeys use the ${bindingSetValue.toLowerCase()}.`);
  }

  return summaryLines.length > 0 ? summaryLines.join(' ') : null;
};
const resolvePausedMainMenuShellSettingsFallbackSummaryLine = (
  menuSections: readonly AppShellMenuSection[] = []
): string | null =>
  findMenuSectionLines(menuSections, 'Persistence Summary').includes(
    DEFAULTED_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_SUMMARY_LINE
  )
    ? 'The current default-looking hotkeys are a recovered safe-set fallback because invalid saved bindings were rejected during load.'
    : null;
const resolvePausedMainMenuShellSettingsCurrentSessionOnlySummaryLine = (
  shellActionKeybindingsCurrentSessionOnly = false
): string | null =>
  shellActionKeybindingsCurrentSessionOnly
    ? 'Current shell hotkeys are live only in this paused session because the latest browser hotkey save failed.'
    : null;
export const resolvePausedMainMenuShellSettingsSummaryLine = (
  menuSections: readonly AppShellMenuSection[] = [],
  shellActionKeybindingsCurrentSessionOnly = false
): string => {
  const savedOnToggleLabels = parseMenuSectionMetadataRowValue(
    findMenuSectionMetadataRowValue(menuSections, 'Persistence Summary', 'Saved On')
  );
  const savedOffToggleLabels = parseMenuSectionMetadataRowValue(
    findMenuSectionMetadataRowValue(menuSections, 'Persistence Summary', 'Saved Off')
  );
  let visibilitySummaryLine: string;

  if (savedOnToggleLabels.length === 0 && savedOffToggleLabels.length === 0) {
    visibilitySummaryLine = 'Review the paused session shell visibility, hotkeys, and profile controls.';
  } else if (savedOnToggleLabels.length === 0) {
    visibilitySummaryLine = `Resume World keeps ${formatMenuSectionSummaryListValue(savedOffToggleLabels)} hidden.`;
  } else if (savedOffToggleLabels.length === 0) {
    visibilitySummaryLine = `Resume World shows ${formatMenuSectionSummaryListValue(savedOnToggleLabels)}.`;
  } else {
    visibilitySummaryLine = `Resume World shows ${formatMenuSectionSummaryListValue(savedOnToggleLabels)}, while ${formatMenuSectionSummaryListValue(savedOffToggleLabels)} stay hidden.`;
  }

  const shellProfilePreviewSummaryLine =
    resolvePausedMainMenuShellProfilePreviewSummaryLine(menuSections);
  const shellSettingsPersistenceSummaryLine =
    resolvePausedMainMenuShellSettingsPersistenceSummaryLine(menuSections);
  const shellSettingsFallbackSummaryLine =
    resolvePausedMainMenuShellSettingsFallbackSummaryLine(menuSections);
  const shellSettingsCurrentSessionOnlySummaryLine =
    resolvePausedMainMenuShellSettingsCurrentSessionOnlySummaryLine(
      shellActionKeybindingsCurrentSessionOnly
    );

  return [
    shellProfilePreviewSummaryLine,
    visibilitySummaryLine,
    shellSettingsPersistenceSummaryLine,
    shellSettingsFallbackSummaryLine,
    shellSettingsCurrentSessionOnlySummaryLine
  ]
    .filter((line): line is string => line !== null)
    .join(' ');
};
export const resolvePausedMainMenuShellSettingsToggleLabel = (expanded = false): string =>
  expanded ? 'Hide Shell Settings' : 'Show Shell Settings';
export const resolvePausedMainMenuShellSettingsSectionState = (
  state: AppShellState,
  expanded = false
): PausedMainMenuShellSettingsSectionState => {
  const visible = isPausedMainMenuState(state);

  return {
    visible,
    expanded: visible && expanded,
    summaryLine: visible
      ? resolvePausedMainMenuShellSettingsSummaryLine(
          state.menuSections ?? [],
          state.shellActionKeybindingsCurrentSessionOnly === true
        )
      : null,
    toggleLabel: visible ? resolvePausedMainMenuShellSettingsToggleLabel(expanded) : null,
    editorVisible: visible && expanded
  };
};
export const resolvePausedMainMenuHelpCopyToggleLabel = (expanded = false): string =>
  expanded ? 'Hide Help Text' : 'Show Help Text';
export const resolvePausedMainMenuHelpCopySectionState = (
  state: AppShellState,
  expanded = false
): PausedMainMenuHelpCopySectionState => {
  const visible = isPausedMainMenuState(state);

  return {
    visible,
    expanded: visible && expanded,
    summaryLine: visible ? DEFAULT_PAUSED_MAIN_MENU_HELP_COPY_SUMMARY_LINE : null,
    toggleLabel: visible ? resolvePausedMainMenuHelpCopyToggleLabel(expanded) : null,
    showMenuSectionLines: !visible || expanded
  };
};
const resolvePausedMainMenuShellActionKeybindingSummaryLine = (
  shellActionKeybindingsDefaultedFromPersistedState = false
): string =>
  shellActionKeybindingsDefaultedFromPersistedState
    ? DEFAULTED_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_SUMMARY_LINE
    : DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_SUMMARY_LINE;
const DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_INTRO =
  'Use unique A-Z letters for the in-world shell actions. Changes save immediately when browser storage is available.';
const SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_INTRO =
  'Use unique A-Z letters for the in-world shell actions. Browser shell storage is unavailable, so remaps only affect this paused session until reload or a reset path clears them.';
export const resolvePausedMainMenuShellActionKeybindingEditorIntro = (
  worldSessionShellPersistenceAvailable = true
): string =>
  worldSessionShellPersistenceAvailable
    ? DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_INTRO
    : SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_INTRO;
export const resolvePausedMainMenuShellActionKeybindingRemapEditorStatus = ({
  result,
  actionLabel,
  currentKey,
  nextKey,
  changed
}: {
  result: PausedMainMenuShellActionKeybindingRemapResult;
  actionLabel: string;
  currentKey: string;
  nextKey: string;
  changed: boolean;
}): { tone: 'accent' | 'warning'; text: string } => {
  switch (result.status) {
    case 'saved':
      return {
        tone: 'accent',
        text: changed
          ? `${actionLabel} now uses ${nextKey}, and the current shell hotkey set was saved.`
          : `${actionLabel} stayed on ${nextKey}, and the current shell hotkey set was saved.`
      };
    case 'session-only':
      return {
        tone: 'warning',
        text: changed
          ? `${actionLabel} now uses ${nextKey} for this paused session only because browser storage was not updated.`
          : `${actionLabel} stayed on ${nextKey} for this paused session only because browser storage was not updated.`
      };
    case 'rejected':
      return {
        tone: 'warning',
        text: `That hotkey change could not be applied, so ${actionLabel} stayed on ${currentKey}.`
      };
  }
};
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
const createPausedMainMenuResetShellTogglesResultMenuSection = (
  resetShellTogglesResult: PausedMainMenuResetShellTogglesResult
): AppShellMenuSection => {
  switch (resetShellTogglesResult.status) {
    case 'cleared':
      return {
        title: 'Reset Shell Toggles Result',
        lines: [
          'This paused session now resumes from the default-off shell layout because its saved shell visibility preferences were cleared.',
          'The next Resume World starts with Debug HUD, Edit Panel, Edit Overlays, Spawn Marker, and Shortcuts hidden.'
        ],
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
      };
    case 'persistence-failed':
      return {
        title: 'Reset Shell Toggles Result',
        lines: [
          'This paused session still resumes from the default-off shell layout in this tab, but browser shell storage could not be cleared.',
          'Resume World keeps the reset live here, but reload may still restore the last browser-saved shell layout until a later shell save succeeds.'
        ],
        metadataRows: [
          {
            label: 'Status',
            value: 'Current session only'
          },
          {
            label: 'Reason',
            value: resolvePausedMainMenuResultReasonValue(resetShellTogglesResult.reason)
          }
        ],
        tone: 'warning'
      };
  }
};
const createPausedMainMenuShellProfilePreviewMenuSection = (
  worldSessionShellState: WorldSessionShellState,
  liveShellActionKeybindings: ShellActionKeybindingState,
  shellProfilePreview: PausedMainMenuShellProfilePreview
): AppShellMenuSection => {
  const shellStateSummary = createWorldSessionShellStatePersistenceSummary(
    shellProfilePreview.shellState
  );

  return {
    title: 'Shell Profile Preview',
    lines: [
      'The selected shell profile validated successfully and is ready to apply to this paused session.',
      'Review its live change summary, saved-on shell visibility, and replacement hotkey set below before applying it.'
    ],
    metadataRows: [
      {
        label: 'File',
        value: resolvePausedMainMenuResultFileNameValue(shellProfilePreview.fileName)
      },
      {
        label: 'Toggle Changes',
        value: formatMenuSectionMetadataRowValue(
          createWorldSessionShellStateToggleChanges(
            worldSessionShellState,
            shellProfilePreview.shellState
          ).map(
            ({ label, previousVisible, nextVisible }) =>
              `${label} ${previousVisible ? 'on' : 'off'} -> ${nextVisible ? 'on' : 'off'}`
          )
        )
      },
      {
        label: 'Hotkey Changes',
        value: formatMenuSectionMetadataRowValue(
          IN_WORLD_SHELL_ACTION_KEYBINDING_IDS.flatMap((actionType) => {
            const previousHotkey = liveShellActionKeybindings[actionType];
            const nextHotkey = shellProfilePreview.shellActionKeybindings[actionType];
            if (previousHotkey === nextHotkey) {
              return [];
            }

            return [
              `${getInWorldShellActionKeybindingActionLabel(actionType)} ${previousHotkey} -> ${nextHotkey}`
            ];
          })
        )
      },
      {
        label: 'Saved On',
        value: formatMenuSectionMetadataRowValue(shellStateSummary.savedOnToggleLabels)
      },
      {
        label: 'Saved Off',
        value: formatMenuSectionMetadataRowValue(shellStateSummary.savedOffToggleLabels)
      },
      ...createPausedMainMenuShellActionKeybindingSummaryRows(
        shellProfilePreview.shellActionKeybindings
      )
    ],
    tone: 'accent'
  };
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
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null = null,
  resetShellTogglesResult: PausedMainMenuResetShellTogglesResult | null = null,
  shellProfilePreview: PausedMainMenuShellProfilePreview | null = null
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
    ...(resetShellTogglesResult === null
      ? []
      : [createPausedMainMenuResetShellTogglesResultMenuSection(resetShellTogglesResult)]),
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
    ...(shellProfilePreview === null
      ? []
      : [
          createPausedMainMenuShellProfilePreviewMenuSection(
            worldSessionShellState,
            shellActionKeybindings,
            shellProfilePreview
          )
        ]),
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
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null = null,
  resetShellTogglesResult: PausedMainMenuResetShellTogglesResult | null = null,
  shellProfilePreview: PausedMainMenuShellProfilePreview | null = null,
  shellActionKeybindingsCurrentSessionOnly = false
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
    clearSavedWorldResult,
    resetShellTogglesResult,
    shellProfilePreview
  ),
  primaryActionLabel: 'Resume World',
  secondaryActionLabel: 'Export World Save',
  tertiaryActionLabel: 'Import World Save',
  quaternaryActionLabel: 'Clear Saved World',
  quinaryActionLabel: 'Reset Shell Toggles',
  senaryActionLabel: 'New World',
  shellActionKeybindings,
  worldSessionShellPersistenceAvailable,
  ...(shellActionKeybindingsCurrentSessionOnly
    ? { shellActionKeybindingsCurrentSessionOnly: true }
    : {}),
  ...(exportResult === null ? {} : { pausedMainMenuExportResult: exportResult }),
  ...(importResult === null ? {} : { pausedMainMenuImportResult: importResult }),
  ...(clearSavedWorldResult === null
    ? {}
    : { pausedMainMenuClearSavedWorldResult: clearSavedWorldResult }),
  ...(resetShellTogglesResult === null
    ? {}
    : { pausedMainMenuResetShellTogglesResult: resetShellTogglesResult }),
  ...(shellProfilePreview === null
    ? {}
    : { pausedMainMenuShellProfilePreview: shellProfilePreview })
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

type AppShellShellActionKeybindingEditorStatusTone = 'accent' | 'warning';

interface AppShellShellActionKeybindingEditorStatus {
  tone: AppShellShellActionKeybindingEditorStatusTone;
  text: string;
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
  onRemapShellActionKeybinding?: (
    actionType: InWorldShellActionKeybindingActionType,
    nextKey: string
  ) => PausedMainMenuShellActionKeybindingRemapResult;
  onResetShellActionKeybindings?: () => PausedMainMenuResetShellActionKeybindingsResult;
  onImportShellProfile?: (
    screen: AppShellScreen
  ) => Promise<PausedMainMenuShellProfileImportResult> | PausedMainMenuShellProfileImportResult;
  onApplyShellProfilePreview?: (
    screen: AppShellScreen
  ) => Promise<PausedMainMenuShellProfileImportResult> | PausedMainMenuShellProfileImportResult;
  onClearShellProfilePreview?: (
    screen: AppShellScreen
  ) => PausedMainMenuShellProfilePreviewClearResult;
  onExportShellProfile?: (screen: AppShellScreen) => PausedMainMenuShellProfileExportResult;
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

const createFirstLaunchMainMenuPersistencePreviewSection = (
  worldSavePersistenceAvailable = true
): AppShellMenuSection =>
  worldSavePersistenceAvailable
    ? {
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
    : {
        title: 'Persistence Preview',
        lines: [
          'Browser resume is unavailable here because browser storage could not be opened during boot.',
          'Enter World still starts a live session in this tab, but returning to the main menu cannot create a browser resume save until storage access works again.'
        ],
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
      };

const createFirstLaunchMainMenuMenuSections = (
  worldSavePersistenceAvailable = true
): readonly AppShellMenuSection[] =>
  [
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
    createFirstLaunchMainMenuPersistencePreviewSection(worldSavePersistenceAvailable)
  ] as const;

export const createFirstLaunchMainMenuShellState = (
  worldSavePersistenceAvailable = true
): AppShellState => ({
  screen: 'main-menu',
  statusText: DEFAULT_FIRST_LAUNCH_MAIN_MENU_STATUS,
  detailLines: DEFAULT_FIRST_LAUNCH_MAIN_MENU_DETAIL_LINES,
  menuSections: createFirstLaunchMainMenuMenuSections(worldSavePersistenceAvailable),
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
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null = null,
  resetShellTogglesResult: PausedMainMenuResetShellTogglesResult | null = null,
  firstLaunchWorldSavePersistenceAvailable = true,
  shellProfilePreview: PausedMainMenuShellProfilePreview | null = null,
  shellActionKeybindingsCurrentSessionOnly = false
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
        clearSavedWorldResult,
        resetShellTogglesResult,
        shellProfilePreview,
        shellActionKeybindingsCurrentSessionOnly
      )
    : createFirstLaunchMainMenuShellState(firstLaunchWorldSavePersistenceAvailable);

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

export const resolvePausedMainMenuImportShellProfileTitle = (): string =>
  'Choose a JSON shell-profile file, validate its shell toggles and shell hotkeys, and preview them before applying the profile to the current paused session';

export const resolvePausedMainMenuApplyShellProfileTitle = (): string =>
  'Apply the currently previewed shell-profile toggles and hotkeys to the current paused session';

export const resolvePausedMainMenuClearShellProfilePreviewTitle = (): string =>
  'Dismiss the currently previewed shell-profile toggles and hotkeys without applying them to the paused session';

export const resolvePausedMainMenuExportShellProfileTitle = (): string =>
  'Download a JSON shell-profile copy of the current shell visibility toggles and shell hotkeys without changing the paused session';

const resolvePausedMainMenuShellProfileApplyResultSubject = (fileName: string): string =>
  fileName === 'Unknown file' ? 'Shell profile' : `Shell profile from ${fileName}`;

const resolvePausedMainMenuShellProfileApplySuccessText = (
  fileName: string,
  changeCategory: PausedMainMenuShellProfileApplyChangeCategory
): string => {
  const subject = resolvePausedMainMenuShellProfileApplyResultSubject(fileName);
  switch (changeCategory) {
    case 'none':
      return `${subject} already matched the paused session, so no shell toggles or hotkeys changed.`;
    case 'toggle-only':
      return `${subject} applied to the paused session with shell visibility toggle changes only.`;
    case 'hotkey-only':
      return `${subject} applied to the paused session with shell hotkey changes only.`;
    case 'mixed':
      return `${subject} applied to the paused session with both shell visibility toggle and hotkey changes.`;
  }
};

const resolvePausedMainMenuShellProfileApplyPersistenceFailedText = (
  fileName: string,
  changeCategory: PausedMainMenuShellProfileApplyChangeCategory,
  reason: string
): string => {
  const subject = resolvePausedMainMenuShellProfileApplyResultSubject(fileName);
  switch (changeCategory) {
    case 'none':
      return `${subject} already matched this paused session, so no shell toggles or hotkeys changed, but browser storage still was not updated: ${reason}`;
    case 'toggle-only':
      return `${subject} applied for this paused session only with shell visibility toggle changes: ${reason}`;
    case 'hotkey-only':
      return `${subject} applied for this paused session only with shell hotkey changes: ${reason}`;
    case 'mixed':
      return `${subject} applied for this paused session only with both shell visibility toggle and hotkey changes: ${reason}`;
  }
};

export const resolvePausedMainMenuApplyShellProfileEditorStatus = (
  importResult: PausedMainMenuShellProfileImportResult
): { tone: 'accent' | 'warning'; text: string } => {
  switch (importResult.status) {
    case 'applied': {
      const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
      return {
        tone: 'accent',
        text: resolvePausedMainMenuShellProfileApplySuccessText(
          fileName,
          importResult.changeCategory
        )
      };
    }
    case 'persistence-failed': {
      const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
      const reason = resolvePausedMainMenuResultReasonValue(importResult.reason);
      return {
        tone: 'warning',
        text: resolvePausedMainMenuShellProfileApplyPersistenceFailedText(
          fileName,
          importResult.changeCategory,
          reason
        )
      };
    }
    case 'failed':
      return {
        tone: 'warning',
        text: `Shell-profile apply failed: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
      };
    case 'previewed': {
      const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
      return {
        tone: 'accent',
        text:
          fileName === 'Unknown file'
            ? 'Shell profile preview stayed ready. Review the saved-on toggles and hotkeys below before applying it.'
            : `Shell profile preview from ${fileName} stayed ready. Review the saved-on toggles and hotkeys below before applying it.`
      };
    }
    case 'rejected': {
      const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
      return {
        tone: 'warning',
        text:
          fileName === 'Unknown file'
            ? `Shell profile apply was blocked: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
            : `Shell profile ${fileName} could not be applied: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
      };
    }
    case 'cancelled':
      return {
        tone: 'warning',
        text: 'Shell-profile apply was canceled before any previewed profile was applied.'
      };
    case 'picker-start-failed':
      return {
        tone: 'warning',
        text: `Shell-profile apply failed: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
      };
  }
};

export const resolvePausedMainMenuResetShellActionKeybindingsEditorStatus = (
  result: PausedMainMenuResetShellActionKeybindingsResult
): { tone: 'accent' | 'warning'; text: string } => {
  switch (result.status) {
    case 'noop':
      return {
        tone: 'accent',
        text: 'Default Q, C, H, G, V, and M shell hotkeys were already active, so nothing changed.'
      };
    case 'failed':
      return {
        tone: 'warning',
        text: 'Browser storage rejected the default shell hotkey reset, so the current set stayed active.'
      };
    case 'reset':
      return {
        tone: 'accent',
        text:
          result.category === 'load-fallback-recovery'
            ? 'Recovered safe-set fallback saved as the default Q, C, H, G, V, and M hotkeys, clearing the stale load warning.'
            : 'Shell hotkeys reset to the default Q, C, H, G, V, and M set.'
      };
  }
};

const isPausedMainMenuState = (state: AppShellState): boolean =>
  state.screen === 'main-menu' && state.primaryActionLabel === 'Resume World';

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

const createMenuSectionElement = (
  section: AppShellMenuSection,
  showLines = true
): HTMLElement => {
  const sectionElement = document.createElement('section');
  sectionElement.className = 'app-shell__menu-section';
  sectionElement.setAttribute('data-tone', section.tone ?? 'default');

  const heading = document.createElement('h3');
  heading.className = 'app-shell__menu-section-title';
  heading.textContent = section.title;
  sectionElement.append(heading);

  if (showLines && section.lines.length > 0) {
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
  }

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
  private pausedMainMenuHelpCopySection: HTMLDivElement;
  private pausedMainMenuHelpCopySummary: HTMLParagraphElement;
  private pausedMainMenuHelpCopyToggleButton: HTMLButtonElement;
  private menuSections: HTMLDivElement;
  private shellSettingsSection: HTMLElement;
  private shellSettingsSummary: HTMLParagraphElement;
  private shellSettingsToggleButton: HTMLButtonElement;
  private shellSettingsBody: HTMLDivElement;
  private shellActionKeybindingEditor: HTMLDivElement;
  private shellActionKeybindingEditorIntro: HTMLParagraphElement;
  private shellActionKeybindingInputs = new Map<
    InWorldShellActionKeybindingActionType,
    HTMLInputElement
  >();
  private shellActionKeybindingEditorActions: HTMLDivElement;
  private resetShellActionKeybindingsButton: HTMLButtonElement;
  private importShellProfileButton: HTMLButtonElement;
  private applyShellProfilePreviewButton: HTMLButtonElement;
  private clearShellProfilePreviewButton: HTMLButtonElement;
  private exportShellProfileButton: HTMLButtonElement;
  private shellActionKeybindingEditorStatus: HTMLParagraphElement;
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
  private onRemapShellActionKeybinding: (
    actionType: InWorldShellActionKeybindingActionType,
    nextKey: string
  ) => PausedMainMenuShellActionKeybindingRemapResult;
  private onResetShellActionKeybindings: () => PausedMainMenuResetShellActionKeybindingsResult;
  private onImportShellProfile: (
    screen: AppShellScreen
  ) => Promise<PausedMainMenuShellProfileImportResult> | PausedMainMenuShellProfileImportResult;
  private onApplyShellProfilePreview: (
    screen: AppShellScreen
  ) => Promise<PausedMainMenuShellProfileImportResult> | PausedMainMenuShellProfileImportResult;
  private onClearShellProfilePreview: (
    screen: AppShellScreen
  ) => PausedMainMenuShellProfilePreviewClearResult;
  private onExportShellProfile: (screen: AppShellScreen) => PausedMainMenuShellProfileExportResult;
  private currentShellActionKeybindingEditorStatus: AppShellShellActionKeybindingEditorStatus | null =
    null;
  private pausedMainMenuHelpCopyExpanded = false;
  private pausedMainMenuShellSettingsExpanded = false;
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
    this.onRemapShellActionKeybinding =
      options.onRemapShellActionKeybinding ?? (() => ({ status: 'rejected' }));
    this.onResetShellActionKeybindings =
      options.onResetShellActionKeybindings ?? (() => ({ status: 'failed' }));
    this.onImportShellProfile =
      options.onImportShellProfile ??
      (() =>
        Promise.resolve({
          status: 'failed',
          reason: 'Shell-profile import is unavailable.'
        }));
    this.onApplyShellProfilePreview =
      options.onApplyShellProfilePreview ??
      (() =>
        Promise.resolve({
          status: 'failed',
          reason: 'Shell-profile apply is unavailable.'
        }));
    this.onClearShellProfilePreview =
      options.onClearShellProfilePreview ??
      (() => ({
        status: 'failed',
        reason: 'Shell-profile preview clear is unavailable.'
      }));
    this.onExportShellProfile =
      options.onExportShellProfile ??
      (() => ({
        status: 'failed',
        reason: 'Shell-profile export is unavailable.'
      }));

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

    this.pausedMainMenuHelpCopySection = document.createElement('div');
    this.pausedMainMenuHelpCopySection.className = 'app-shell__menu-help';
    panel.append(this.pausedMainMenuHelpCopySection);

    this.pausedMainMenuHelpCopySummary = document.createElement('p');
    this.pausedMainMenuHelpCopySummary.className = 'app-shell__menu-help-summary';
    this.pausedMainMenuHelpCopySection.append(this.pausedMainMenuHelpCopySummary);

    this.pausedMainMenuHelpCopyToggleButton = document.createElement('button');
    this.pausedMainMenuHelpCopyToggleButton.type = 'button';
    this.pausedMainMenuHelpCopyToggleButton.className = 'app-shell__menu-help-toggle';
    this.pausedMainMenuHelpCopyToggleButton.addEventListener('click', () =>
      this.togglePausedMainMenuHelpCopy()
    );
    installPointerClickFocusRelease(this.pausedMainMenuHelpCopyToggleButton);
    this.pausedMainMenuHelpCopySection.append(this.pausedMainMenuHelpCopyToggleButton);

    this.menuSections = document.createElement('div');
    this.menuSections.className = 'app-shell__menu-sections';
    panel.append(this.menuSections);

    this.shellSettingsSection = document.createElement('section');
    this.shellSettingsSection.className = 'app-shell__shell-settings';
    panel.append(this.shellSettingsSection);

    const shellSettingsHeader = document.createElement('div');
    shellSettingsHeader.className = 'app-shell__shell-settings-header';
    this.shellSettingsSection.append(shellSettingsHeader);

    const shellSettingsCopy = document.createElement('div');
    shellSettingsCopy.className = 'app-shell__shell-settings-copy';
    shellSettingsHeader.append(shellSettingsCopy);

    const shellSettingsTitle = document.createElement('h2');
    shellSettingsTitle.className = 'app-shell__shell-settings-title';
    shellSettingsTitle.textContent = 'Shell Settings';
    shellSettingsCopy.append(shellSettingsTitle);

    this.shellSettingsSummary = document.createElement('p');
    this.shellSettingsSummary.className = 'app-shell__shell-settings-summary';
    shellSettingsCopy.append(this.shellSettingsSummary);

    this.shellSettingsToggleButton = document.createElement('button');
    this.shellSettingsToggleButton.type = 'button';
    this.shellSettingsToggleButton.className = 'app-shell__shell-settings-toggle';
    this.shellSettingsToggleButton.addEventListener('click', () => this.togglePausedMainMenuShellSettings());
    installPointerClickFocusRelease(this.shellSettingsToggleButton);
    shellSettingsHeader.append(this.shellSettingsToggleButton);

    this.shellSettingsBody = document.createElement('div');
    this.shellSettingsBody.className = 'app-shell__shell-settings-body';
    this.shellSettingsBody.id = 'app-shell-shell-settings-body';
    this.shellSettingsSection.append(this.shellSettingsBody);
    this.shellSettingsToggleButton.setAttribute('aria-controls', this.shellSettingsBody.id);

    this.shellActionKeybindingEditor = document.createElement('div');
    this.shellActionKeybindingEditor.className = 'app-shell__shell-keybindings';
    this.shellSettingsBody.append(this.shellActionKeybindingEditor);

    const shellActionKeybindingEditorTitle = document.createElement('h2');
    shellActionKeybindingEditorTitle.className = 'app-shell__shell-keybindings-title';
    shellActionKeybindingEditorTitle.textContent = 'Shell Hotkeys';
    this.shellActionKeybindingEditor.append(shellActionKeybindingEditorTitle);

    this.shellActionKeybindingEditorIntro = document.createElement('p');
    this.shellActionKeybindingEditorIntro.className = 'app-shell__shell-keybindings-intro';
    this.shellActionKeybindingEditorIntro.textContent =
      resolvePausedMainMenuShellActionKeybindingEditorIntro();
    this.shellActionKeybindingEditor.append(this.shellActionKeybindingEditorIntro);

    this.shellActionKeybindingEditorActions = document.createElement('div');
    this.shellActionKeybindingEditorActions.className = 'app-shell__shell-keybindings-actions';
    this.shellActionKeybindingEditor.append(this.shellActionKeybindingEditorActions);

    this.resetShellActionKeybindingsButton = document.createElement('button');
    this.resetShellActionKeybindingsButton.type = 'button';
    this.resetShellActionKeybindingsButton.className = 'app-shell__shell-keybindings-button';
    this.resetShellActionKeybindingsButton.textContent = 'Reset Shell Hotkeys';
    this.resetShellActionKeybindingsButton.title =
      'Rewrite the default in-world shell hotkeys as Q, C, H, G, V, and M';
    this.resetShellActionKeybindingsButton.addEventListener('click', () =>
      this.tryResetShellActionKeybindings()
    );
    installPointerClickFocusRelease(this.resetShellActionKeybindingsButton);
    this.shellActionKeybindingEditorActions.append(this.resetShellActionKeybindingsButton);

    this.importShellProfileButton = document.createElement('button');
    this.importShellProfileButton.type = 'button';
    this.importShellProfileButton.className = 'app-shell__shell-keybindings-button';
    this.importShellProfileButton.textContent = 'Import Shell Profile';
    this.importShellProfileButton.title = resolvePausedMainMenuImportShellProfileTitle();
    this.importShellProfileButton.addEventListener('click', () => {
      void this.tryImportShellProfile();
    });
    installPointerClickFocusRelease(this.importShellProfileButton);
    this.shellActionKeybindingEditorActions.append(this.importShellProfileButton);

    this.applyShellProfilePreviewButton = document.createElement('button');
    this.applyShellProfilePreviewButton.type = 'button';
    this.applyShellProfilePreviewButton.className = 'app-shell__shell-keybindings-button';
    this.applyShellProfilePreviewButton.textContent = 'Apply Shell Profile';
    this.applyShellProfilePreviewButton.title = resolvePausedMainMenuApplyShellProfileTitle();
    this.applyShellProfilePreviewButton.addEventListener('click', () => {
      void this.tryApplyShellProfilePreview();
    });
    installPointerClickFocusRelease(this.applyShellProfilePreviewButton);
    this.shellActionKeybindingEditorActions.append(this.applyShellProfilePreviewButton);

    this.clearShellProfilePreviewButton = document.createElement('button');
    this.clearShellProfilePreviewButton.type = 'button';
    this.clearShellProfilePreviewButton.className = 'app-shell__shell-keybindings-button';
    this.clearShellProfilePreviewButton.textContent = 'Clear Shell Profile Preview';
    this.clearShellProfilePreviewButton.title = resolvePausedMainMenuClearShellProfilePreviewTitle();
    this.clearShellProfilePreviewButton.addEventListener('click', () => {
      this.tryClearShellProfilePreview();
    });
    installPointerClickFocusRelease(this.clearShellProfilePreviewButton);
    this.shellActionKeybindingEditorActions.append(this.clearShellProfilePreviewButton);

    this.exportShellProfileButton = document.createElement('button');
    this.exportShellProfileButton.type = 'button';
    this.exportShellProfileButton.className = 'app-shell__shell-keybindings-button';
    this.exportShellProfileButton.textContent = 'Export Shell Profile';
    this.exportShellProfileButton.title = resolvePausedMainMenuExportShellProfileTitle();
    this.exportShellProfileButton.addEventListener('click', () => this.tryExportShellProfile());
    installPointerClickFocusRelease(this.exportShellProfileButton);
    this.shellActionKeybindingEditorActions.append(this.exportShellProfileButton);

    const shellActionKeybindingEditorGrid = document.createElement('div');
    shellActionKeybindingEditorGrid.className = 'app-shell__shell-keybindings-grid';
    this.shellActionKeybindingEditor.append(shellActionKeybindingEditorGrid);

    for (const actionType of IN_WORLD_SHELL_ACTION_KEYBINDING_IDS) {
      const row = document.createElement('div');
      row.className = 'app-shell__shell-keybindings-row';
      shellActionKeybindingEditorGrid.append(row);

      const inputId = `app-shell-shell-keybinding-${actionType}`;
      const label = document.createElement('label');
      label.className = 'app-shell__shell-keybindings-label';
      label.htmlFor = inputId;
      label.textContent = getInWorldShellActionKeybindingActionLabel(actionType);
      row.append(label);

      const input = document.createElement('input');
      input.id = inputId;
      input.className = 'app-shell__shell-keybindings-input';
      input.type = 'text';
      input.inputMode = 'text';
      input.maxLength = 1;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('autocapitalize', 'characters');
      input.setAttribute('aria-label', `${getInWorldShellActionKeybindingActionLabel(actionType)} hotkey`);
      input.addEventListener('focus', () => {
        input.select();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        input.value = this.resolvePausedMainMenuShellActionKeybindings()[actionType];
        input.blur();
      });
      input.addEventListener('input', () => {
        const nextValue = input.value.trim();
        if (nextValue.length === 0) {
          input.value = this.resolvePausedMainMenuShellActionKeybindings()[actionType];
          return;
        }

        this.tryRemapShellActionKeybinding(actionType, nextValue);
      });
      row.append(input);
      this.shellActionKeybindingInputs.set(actionType, input);
    }

    this.shellActionKeybindingEditorStatus = document.createElement('p');
    this.shellActionKeybindingEditorStatus.className = 'app-shell__shell-keybindings-status';
    this.shellActionKeybindingEditor.append(this.shellActionKeybindingEditorStatus);

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

  private resolvePausedMainMenuShellActionKeybindings(): ShellActionKeybindingState {
    if (isPausedMainMenuState(this.currentState) && this.currentState.shellActionKeybindings) {
      return this.currentState.shellActionKeybindings;
    }

    return createDefaultShellActionKeybindingState();
  }

  private syncShellActionKeybindingEditorInputs(
    shellActionKeybindings: ShellActionKeybindingState = this.resolvePausedMainMenuShellActionKeybindings()
  ): void {
    for (const actionType of IN_WORLD_SHELL_ACTION_KEYBINDING_IDS) {
      const input = this.shellActionKeybindingInputs.get(actionType);
      if (!input) continue;
      input.value = shellActionKeybindings[actionType];
    }
  }

  private syncShellActionKeybindingEditorIntro(
    worldSessionShellPersistenceAvailable = true
  ): void {
    this.shellActionKeybindingEditorIntro.textContent =
      resolvePausedMainMenuShellActionKeybindingEditorIntro(
        worldSessionShellPersistenceAvailable
      );
    if (worldSessionShellPersistenceAvailable) {
      delete this.shellActionKeybindingEditorIntro.dataset.tone;
      return;
    }

    this.shellActionKeybindingEditorIntro.dataset.tone = 'warning';
  }

  private setShellActionKeybindingEditorStatus(
    status: AppShellShellActionKeybindingEditorStatus | null
  ): void {
    this.currentShellActionKeybindingEditorStatus = status;
    this.shellActionKeybindingEditorStatus.hidden = status === null;
    this.shellActionKeybindingEditorStatus.textContent = status?.text ?? '';
    if (status === null) {
      delete this.shellActionKeybindingEditorStatus.dataset.tone;
      return;
    }

    this.shellActionKeybindingEditorStatus.dataset.tone = status.tone;
  }

  private togglePausedMainMenuShellSettings(): void {
    if (!isPausedMainMenuState(this.currentState)) {
      return;
    }

    this.pausedMainMenuShellSettingsExpanded = !this.pausedMainMenuShellSettingsExpanded;
    this.setState(this.currentState);
  }

  private togglePausedMainMenuHelpCopy(): void {
    if (!isPausedMainMenuState(this.currentState)) {
      return;
    }

    this.pausedMainMenuHelpCopyExpanded = !this.pausedMainMenuHelpCopyExpanded;
    this.setState(this.currentState);
  }

  private tryRemapShellActionKeybinding(
    actionType: InWorldShellActionKeybindingActionType,
    nextValue: string
  ): void {
    const currentShellActionKeybindings = this.resolvePausedMainMenuShellActionKeybindings();
    const actionLabel = getInWorldShellActionKeybindingActionLabel(actionType);
    const remapResult = remapShellActionKeybinding(currentShellActionKeybindings, actionType, nextValue);
    if (!remapResult.ok) {
      const nextStatusText = (() => {
        switch (remapResult.reason) {
          case 'invalid-key':
            return `Use one letter A-Z for ${actionLabel}.`;
          case 'reserved-key':
            return `${remapResult.normalizedKey} is reserved by gameplay or debug-edit shortcuts. Choose another letter for ${actionLabel}.`;
          case 'duplicate-key':
            return `${remapResult.normalizedKey} already controls ${getInWorldShellActionKeybindingActionLabel(remapResult.conflictingActionType ?? actionType)}. Choose a unique letter for ${actionLabel}.`;
        }
      })();
      this.syncShellActionKeybindingEditorInputs(currentShellActionKeybindings);
      this.setShellActionKeybindingEditorStatus({
        tone: 'warning',
        text: nextStatusText
      });
      return;
    }

    const remapPersistenceResult = this.onRemapShellActionKeybinding(
      actionType,
      remapResult.normalizedKey
    );
    if (remapPersistenceResult.status === 'rejected') {
      this.syncShellActionKeybindingEditorInputs(currentShellActionKeybindings);
      this.setShellActionKeybindingEditorStatus(
        resolvePausedMainMenuShellActionKeybindingRemapEditorStatus({
          result: remapPersistenceResult,
          actionLabel,
          currentKey: currentShellActionKeybindings[actionType],
          nextKey: remapResult.normalizedKey,
          changed: remapResult.changed
        })
      );
      return;
    }

    this.syncShellActionKeybindingEditorInputs(remapResult.state);
    this.setShellActionKeybindingEditorStatus(
      resolvePausedMainMenuShellActionKeybindingRemapEditorStatus({
        result: remapPersistenceResult,
        actionLabel,
        currentKey: currentShellActionKeybindings[actionType],
        nextKey: remapResult.normalizedKey,
        changed: remapResult.changed
      })
    );
  }

  private tryResetShellActionKeybindings(): void {
    const defaultShellActionKeybindings = createDefaultShellActionKeybindingState();
    const resetResult = this.onResetShellActionKeybindings();
    if (resetResult.status === 'failed') {
      this.syncShellActionKeybindingEditorInputs();
      this.setShellActionKeybindingEditorStatus(
        resolvePausedMainMenuResetShellActionKeybindingsEditorStatus(resetResult)
      );
      return;
    }

    this.syncShellActionKeybindingEditorInputs(defaultShellActionKeybindings);
    this.setShellActionKeybindingEditorStatus(
      resolvePausedMainMenuResetShellActionKeybindingsEditorStatus(resetResult)
    );
  }

  private async tryImportShellProfile(): Promise<void> {
    const importResult = await this.onImportShellProfile(this.currentState.screen);
    switch (importResult.status) {
      case 'previewed': {
        const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
        this.setShellActionKeybindingEditorStatus({
          tone: 'accent',
          text:
            fileName === 'Unknown file'
              ? 'Shell profile preview ready. Review the saved-on toggles and hotkeys below, then apply it.'
              : `Shell profile preview ready from ${fileName}. Review the saved-on toggles and hotkeys below, then apply it.`
        });
        return;
      }
      case 'applied': {
        const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
        this.setShellActionKeybindingEditorStatus({
          tone: 'accent',
          text:
            fileName === 'Unknown file'
              ? 'Shell profile applied to the paused session.'
              : `Shell profile applied from ${fileName}.`
        });
        return;
      }
      case 'persistence-failed': {
        const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
        this.setShellActionKeybindingEditorStatus({
          tone: 'warning',
          text:
            fileName === 'Unknown file'
              ? `Shell profile applied for this paused session only: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
              : `Shell profile from ${fileName} applied for this paused session only: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
        });
        return;
      }
      case 'rejected': {
        const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
        this.setShellActionKeybindingEditorStatus({
          tone: 'warning',
          text:
            fileName === 'Unknown file'
              ? `Shell profile import rejected: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
              : `Shell profile ${fileName} was rejected: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
        });
        return;
      }
      case 'cancelled':
        this.setShellActionKeybindingEditorStatus({
          tone: 'warning',
          text: 'Shell-profile import canceled before any preview was loaded.'
        });
        return;
      case 'picker-start-failed':
        this.setShellActionKeybindingEditorStatus({
          tone: 'warning',
          text: `Shell-profile picker failed: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
        });
        return;
      case 'failed':
        this.setShellActionKeybindingEditorStatus({
          tone: 'warning',
          text: `Shell-profile import failed: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`
        });
        return;
    }
  }

  private async tryApplyShellProfilePreview(): Promise<void> {
    const importResult = await this.onApplyShellProfilePreview(this.currentState.screen);
    this.setShellActionKeybindingEditorStatus(
      resolvePausedMainMenuApplyShellProfileEditorStatus(importResult)
    );
  }

  private tryClearShellProfilePreview(): void {
    const clearResult = this.onClearShellProfilePreview(this.currentState.screen);
    switch (clearResult.status) {
      case 'cleared': {
        const fileName = resolvePausedMainMenuResultFileNameValue(clearResult.fileName);
        this.setShellActionKeybindingEditorStatus({
          tone: 'accent',
          text:
            fileName === 'Unknown file'
              ? 'Shell profile preview cleared without changing the paused session.'
              : `Shell profile preview from ${fileName} cleared without changing the paused session.`
        });
        return;
      }
      case 'failed':
        this.setShellActionKeybindingEditorStatus({
          tone: 'warning',
          text: `Shell-profile preview clear failed: ${resolvePausedMainMenuResultReasonValue(clearResult.reason)}`
        });
        return;
    }
  }

  private tryExportShellProfile(): void {
    const exportResult = this.onExportShellProfile(this.currentState.screen);
    switch (exportResult.status) {
      case 'downloaded': {
        const fileName = resolvePausedMainMenuResultFileNameValue(exportResult.fileName);
        this.setShellActionKeybindingEditorStatus({
          tone: 'accent',
          text:
            fileName === 'Unknown file'
              ? 'Shell profile downloaded.'
              : `Shell profile downloaded as ${fileName}.`
        });
        return;
      }
      case 'failed':
        this.setShellActionKeybindingEditorStatus({
          tone: 'warning',
          text: `Shell profile export failed: ${resolvePausedMainMenuResultReasonValue(exportResult.reason)}`
        });
        return;
    }
  }

  getWorldHost(): HTMLDivElement {
    return this.worldHost;
  }

  setState(state: AppShellState): void {
    const wasPausedMainMenuVisible = isPausedMainMenuState(this.currentState);
    this.currentState = state;
    const viewModel = resolveAppShellViewModel(state);
    const defaultShellActionKeybindings = createDefaultShellActionKeybindingState();
    const shellActionKeybindings =
      state.screen === 'in-world'
        ? createInWorldShellState({
            shellActionKeybindings: state.shellActionKeybindings
          }).shellActionKeybindings
        : defaultShellActionKeybindings;
    const pausedMainMenuVisible = isPausedMainMenuState(state);
    if (!pausedMainMenuVisible || !wasPausedMainMenuVisible) {
      this.pausedMainMenuHelpCopyExpanded = false;
      this.pausedMainMenuShellSettingsExpanded = false;
    }
    const pausedMainMenuShellActionKeybindings = pausedMainMenuVisible
      ? state.shellActionKeybindings ?? defaultShellActionKeybindings
      : defaultShellActionKeybindings;
    const pausedMainMenuShellPersistenceAvailable =
      pausedMainMenuVisible ? state.worldSessionShellPersistenceAvailable !== false : true;
    const pausedMainMenuHasShellProfilePreview =
      pausedMainMenuVisible && state.pausedMainMenuShellProfilePreview != null;
    const pausedMainMenuHelpCopySection = resolvePausedMainMenuHelpCopySectionState(
      state,
      this.pausedMainMenuHelpCopyExpanded
    );
    const pausedMainMenuShellSettingsSection = resolvePausedMainMenuShellSettingsSectionState(
      state,
      this.pausedMainMenuShellSettingsExpanded
    );

    this.root.dataset.screen = viewModel.screen;
    this.overlay.hidden = !viewModel.overlayVisible;
    this.overlay.style.display = resolveAppShellRegionDisplay(viewModel.overlayVisible, 'grid');
    this.chrome.hidden = !viewModel.chromeVisible;
    this.chrome.style.display = resolveAppShellRegionDisplay(viewModel.chromeVisible, 'flex');
    this.stageLabel.textContent = viewModel.stageLabel;
    this.title.textContent = viewModel.title;
    this.status.textContent = viewModel.statusText;
    this.pausedMainMenuHelpCopySection.hidden = !pausedMainMenuHelpCopySection.visible;
    this.pausedMainMenuHelpCopySection.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuHelpCopySection.visible,
      'flex'
    );
    this.pausedMainMenuHelpCopySection.dataset.expanded = pausedMainMenuHelpCopySection.expanded
      ? 'true'
      : 'false';
    this.pausedMainMenuHelpCopySummary.textContent = pausedMainMenuHelpCopySection.summaryLine ?? '';
    this.pausedMainMenuHelpCopyToggleButton.textContent =
      pausedMainMenuHelpCopySection.toggleLabel ?? '';
    this.pausedMainMenuHelpCopyToggleButton.hidden = !pausedMainMenuHelpCopySection.visible;
    this.pausedMainMenuHelpCopyToggleButton.title = pausedMainMenuHelpCopySection.expanded
      ? 'Hide paused-menu card help text while keeping titles and metadata visible.'
      : 'Show the longer paused-menu card help text.';
    this.pausedMainMenuHelpCopyToggleButton.setAttribute(
      'aria-expanded',
      pausedMainMenuHelpCopySection.expanded ? 'true' : 'false'
    );
    this.menuSections.replaceChildren(
      ...viewModel.menuSections.map((section) =>
        createMenuSectionElement(section, pausedMainMenuHelpCopySection.showMenuSectionLines)
      )
    );
    this.menuSections.hidden = viewModel.menuSections.length === 0;
    this.menuSections.style.display = resolveAppShellRegionDisplay(
      viewModel.menuSections.length > 0,
      'grid'
    );
    this.shellSettingsSection.hidden = !pausedMainMenuShellSettingsSection.visible;
    this.shellSettingsSection.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuShellSettingsSection.visible,
      'grid'
    );
    this.shellSettingsSection.dataset.expanded = pausedMainMenuShellSettingsSection.expanded
      ? 'true'
      : 'false';
    this.shellSettingsSummary.textContent = pausedMainMenuShellSettingsSection.summaryLine ?? '';
    this.shellSettingsToggleButton.textContent =
      pausedMainMenuShellSettingsSection.toggleLabel ?? '';
    this.shellSettingsToggleButton.hidden = !pausedMainMenuShellSettingsSection.visible;
    this.shellSettingsToggleButton.title = pausedMainMenuShellSettingsSection.expanded
      ? 'Hide the Shell Hotkeys editor and shell-profile controls.'
      : 'Show the Shell Hotkeys editor and shell-profile controls.';
    this.shellSettingsToggleButton.setAttribute(
      'aria-expanded',
      pausedMainMenuShellSettingsSection.expanded ? 'true' : 'false'
    );
    this.shellSettingsBody.hidden = !pausedMainMenuShellSettingsSection.editorVisible;
    this.shellSettingsBody.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuShellSettingsSection.editorVisible,
      'grid'
    );
    this.shellActionKeybindingEditor.hidden = !pausedMainMenuShellSettingsSection.editorVisible;
    this.shellActionKeybindingEditor.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuShellSettingsSection.editorVisible,
      'grid'
    );
    this.syncShellActionKeybindingEditorIntro(pausedMainMenuShellPersistenceAvailable);
    this.syncShellActionKeybindingEditorInputs(pausedMainMenuShellActionKeybindings);
    this.applyShellProfilePreviewButton.hidden = !pausedMainMenuHasShellProfilePreview;
    this.clearShellProfilePreviewButton.hidden = !pausedMainMenuHasShellProfilePreview;
    if (!pausedMainMenuVisible) {
      this.setShellActionKeybindingEditorStatus(null);
    } else {
      this.setShellActionKeybindingEditorStatus(this.currentShellActionKeybindingEditorStatus);
    }
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
