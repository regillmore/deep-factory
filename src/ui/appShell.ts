import {
  installPointerClickFocusRelease,
  shouldReleaseButtonFocusAfterClick
} from './buttonFocus';
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
  getDropOneSelectedHotbarItemShortcutLabel,
  getDropSelectedHotbarStackShortcutLabel
} from '../input/playerInventoryShortcuts';
import {
  getMoveSelectedHotbarSlotLeftShortcutLabel,
  getMoveSelectedHotbarSlotRightShortcutLabel
} from '../input/hotbarShortcuts';
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
import {
  createDefaultWorldSessionGameplayState,
  type WorldSessionGameplayState
} from '../mainWorldSessionGameplayState';
import {
  WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS,
  countEnabledWorldSessionTelemetryTypesForCollection,
  createDefaultWorldSessionTelemetryState,
  createWorldSessionTelemetryStatePersistenceSummary,
  getWorldSessionTelemetryTypeDefinitionsForCollection,
  isWorldSessionTelemetryCollectionEnabled,
  isWorldSessionTelemetryTypeEnabled,
  matchesDefaultWorldSessionTelemetryState,
  type WorldSessionTelemetryCollectionId,
  type WorldSessionTelemetryState,
  type WorldSessionTelemetryTypeId
} from '../mainWorldSessionTelemetryState';

export type AppShellScreen = 'boot' | 'main-menu' | 'in-world';

export type AppShellMenuSectionTone = 'default' | 'accent' | 'warning';

export interface AppShellMenuSectionMetadataBadge {
  text: string;
  tone?: AppShellMenuSectionTone;
}

export interface AppShellMenuSectionMetadataRow {
  label: string;
  value: string;
  badge?: AppShellMenuSectionMetadataBadge;
}

export interface AppShellMenuSectionDetailGroup {
  title: string;
  items: readonly string[];
  emptyText?: string;
}

export interface AppShellMenuSection {
  title: string;
  lines: readonly string[];
  metadataRows?: readonly AppShellMenuSectionMetadataRow[];
  detailGroups?: readonly AppShellMenuSectionDetailGroup[];
  tone?: AppShellMenuSectionTone;
}

export interface PausedMainMenuOverviewSectionViewModel {
  resumeWorld: AppShellMenuSection;
}

export interface PausedMainMenuWorldSaveSectionViewModel {
  exportWorldSave: AppShellMenuSection;
  importWorldSave: AppShellMenuSection;
  clearSavedWorld: AppShellMenuSection;
  newWorld: AppShellMenuSection;
  savedWorldStatus: AppShellMenuSection | null;
}

export interface PausedMainMenuWorldSaveSectionState {
  visible: boolean;
  summaryLine: string | null;
  metadataRows: readonly AppShellMenuSectionMetadataRow[];
  actionSections: readonly AppShellMenuSection[];
  tone: AppShellMenuSectionTone;
}

export interface PausedMainMenuShellSectionViewModel {
  persistenceSummary: AppShellMenuSection;
  gameplayControls: PausedMainMenuShellGameplayControlsViewModel;
  telemetryControls: PausedMainMenuShellTelemetryControlsViewModel;
  shellProfilePreview: AppShellMenuSection | null;
}

export interface PausedMainMenuShellTelemetryTypeViewModel {
  id: WorldSessionTelemetryTypeId;
  label: string;
  description: string;
  enabled: boolean;
  buttonLabel: string;
  buttonTitle: string;
}

export interface PausedMainMenuShellTelemetryCollectionViewModel {
  id: WorldSessionTelemetryCollectionId;
  label: string;
  description: string;
  enabled: boolean;
  toggleLabel: string;
  toggleTitle: string;
  metadataRows: readonly AppShellMenuSectionMetadataRow[];
  types: readonly PausedMainMenuShellTelemetryTypeViewModel[];
}

export interface PausedMainMenuShellTelemetryControlsViewModel {
  summaryLine: string;
  metadataRows: readonly AppShellMenuSectionMetadataRow[];
  resetButtonDisabled: boolean;
  collections: readonly PausedMainMenuShellTelemetryCollectionViewModel[];
}

export interface PausedMainMenuShellGameplayControlsViewModel {
  summaryLine: string;
  metadataRows: readonly AppShellMenuSectionMetadataRow[];
  toggleButtonLabel: string;
  toggleButtonTitle: string;
  toggleButtonPressed: boolean;
}

export interface PausedMainMenuRecentActivitySectionViewModel {
  exportResult: AppShellMenuSection | null;
  importResult: AppShellMenuSection | null;
  clearSavedWorldResult: AppShellMenuSection | null;
  resetShellTogglesResult: AppShellMenuSection | null;
  resetShellTelemetryResult: AppShellMenuSection | null;
}

export interface PausedMainMenuSectionViewModel {
  overview: PausedMainMenuOverviewSectionViewModel;
  worldSave: PausedMainMenuWorldSaveSectionViewModel;
  shell: PausedMainMenuShellSectionViewModel;
  recentActivity: PausedMainMenuRecentActivitySectionViewModel;
}

export interface PausedMainMenuShellSectionState {
  visible: boolean;
  summaryLine: string | null;
  metadataRows: readonly AppShellMenuSectionMetadataRow[];
  gameplayControls: PausedMainMenuShellGameplayControlsViewModel | null;
  telemetryControls: PausedMainMenuShellTelemetryControlsViewModel | null;
  previewSection: AppShellMenuSection | null;
}

export interface PausedMainMenuRecentActivitySectionState {
  visible: boolean;
  summaryLine: string | null;
  tone: AppShellMenuSectionTone;
  menuSections: readonly AppShellMenuSection[];
}

export interface PausedMainMenuMenuSectionGroups {
  overviewSections: readonly AppShellMenuSection[];
  worldSaveSections: readonly AppShellMenuSection[];
  shellSections: readonly AppShellMenuSection[];
  recentActivitySections: readonly AppShellMenuSection[];
  primarySections: readonly AppShellMenuSection[];
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

export interface PausedMainMenuSavedResetShellTelemetryResult {
  status: 'saved';
}

export interface PausedMainMenuSessionOnlyResetShellTelemetryResult {
  status: 'session-only';
}

export type PausedMainMenuResetShellTelemetryResult =
  | PausedMainMenuSavedResetShellTelemetryResult
  | PausedMainMenuSessionOnlyResetShellTelemetryResult;

export type PausedMainMenuRecentActivityAction =
  | 'export-world-save'
  | 'import-world-save'
  | 'clear-saved-world'
  | 'reset-shell-toggles'
  | 'reset-shell-telemetry';

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

type MainMenuVariant = 'first-start' | 'paused-session';

export interface AppShellState {
  screen: AppShellScreen;
  mainMenuVariant?: MainMenuVariant;
  worldSavePersistenceAvailable?: boolean;
  statusText?: string;
  detailLines?: readonly string[];
  menuSections?: readonly AppShellMenuSection[];
  pausedMainMenuSections?: PausedMainMenuSectionViewModel;
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
  pausedMainMenuSavedWorldStatus?: PausedMainMenuSavedWorldStatus;
  pausedMainMenuWorldSeed?: number;
  pausedMainMenuClearSavedWorldResult?: PausedMainMenuClearSavedWorldResult;
  pausedMainMenuResetShellTogglesResult?: PausedMainMenuResetShellTogglesResult;
  pausedMainMenuResetShellTelemetryResult?: PausedMainMenuResetShellTelemetryResult;
  pausedMainMenuRecentActivityAction?: PausedMainMenuRecentActivityAction;
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
const DEFAULT_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE =
  'Manage downloads, imports, fresh-world replacement, and browser-resume storage for the current paused session.';
const DEFAULT_FIRST_START_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE =
  'Preview imports and exports or reroll a fresh world before the first run. Browser resume appears after the first saved session.';
const STORAGE_UNAVAILABLE_FIRST_START_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE =
  'Browser resume is unavailable in this browser context, but imports, exports, and fresh-world rerolls still work in this tab.';
const CLEARED_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE =
  'Browser resume was cleared for this paused session. Resume World or another save path must rewrite it before reload can restore the session.';
const IMPORT_PERSISTENCE_FAILED_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE =
  'The imported paused session stays live in this tab, but reload will miss it until a later browser-save rewrite succeeds.';
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
  menuSection: AppShellMenuSection | null | undefined,
  rowLabel: string
): string | undefined =>
  menuSection?.metadataRows?.find((row) => row.label === rowLabel)?.value;
const menuSectionIncludesLine = (
  menuSection: AppShellMenuSection | null | undefined,
  line: string
): boolean => menuSection?.lines.includes(line) ?? false;
const resolvePausedMainMenuSectionViewModel = (
  state: AppShellState
): PausedMainMenuSectionViewModel | null =>
  isPausedMainMenuState(state) ? state.pausedMainMenuSections ?? null : null;
const resolvePausedMainMenuOverviewMenuSections = (
  sectionViewModel: PausedMainMenuSectionViewModel
): readonly AppShellMenuSection[] => [sectionViewModel.overview.resumeWorld];
const resolvePausedMainMenuWorldSaveMenuSections = (
  state: AppShellState,
  sectionViewModel: PausedMainMenuSectionViewModel
): readonly AppShellMenuSection[] =>
  isFirstStartMainMenuState(state)
    ? [
        sectionViewModel.worldSave.exportWorldSave,
        sectionViewModel.worldSave.importWorldSave,
        sectionViewModel.worldSave.newWorld
      ]
    : [
        sectionViewModel.worldSave.exportWorldSave,
        sectionViewModel.worldSave.importWorldSave,
        sectionViewModel.worldSave.clearSavedWorld,
        sectionViewModel.worldSave.newWorld
      ];
const resolvePausedMainMenuShellMenuSections = (
  _sectionViewModel: PausedMainMenuSectionViewModel
): readonly AppShellMenuSection[] => [];
const resolvePausedMainMenuRecentActivityMenuSections = (
  state: AppShellState
): readonly AppShellMenuSection[] => resolvePausedMainMenuRecentActivitySectionState(state).menuSections;
const resolvePausedMainMenuMenuSectionGroupsFromState = (
  state: AppShellState,
  sectionViewModel: PausedMainMenuSectionViewModel
): PausedMainMenuMenuSectionGroups => {
  const overviewSections = resolvePausedMainMenuOverviewMenuSections(sectionViewModel);
  const worldSaveSections = resolvePausedMainMenuWorldSaveMenuSections(state, sectionViewModel);
  const shellSections = resolvePausedMainMenuShellMenuSections(sectionViewModel);
  const recentActivitySections = resolvePausedMainMenuRecentActivityMenuSections(state);

  return {
    overviewSections,
    worldSaveSections,
    shellSections,
    recentActivitySections,
    primarySections: [...overviewSections, ...shellSections]
  };
};
export const resolvePausedMainMenuMenuSectionGroups = (
  state: AppShellState
): PausedMainMenuMenuSectionGroups => {
  const sectionViewModel = resolvePausedMainMenuSectionViewModel(state);
  if (sectionViewModel === null) {
    return {
      overviewSections: [],
      worldSaveSections: [],
      shellSections: [],
      recentActivitySections: [],
      primarySections: []
    };
  }

  return resolvePausedMainMenuMenuSectionGroupsFromState(state, sectionViewModel);
};
export const resolvePausedMainMenuWorldSaveSectionState = (
  state: AppShellState
): PausedMainMenuWorldSaveSectionState => {
  const visible = isPausedMainMenuState(state);
  const sectionViewModel = resolvePausedMainMenuSectionViewModel(state);
  if (!visible || sectionViewModel === null) {
    return {
      visible: false,
      summaryLine: null,
      metadataRows: [],
      actionSections: [],
      tone: 'default'
    };
  }

  if (isFirstStartMainMenuState(state)) {
    const worldSavePersistenceAvailable = state.worldSavePersistenceAvailable !== false;
    return {
      visible: true,
      summaryLine: resolveFirstStartMainMenuWorldSaveSummaryLine(worldSavePersistenceAvailable),
      metadataRows: createFirstStartMainMenuWorldSaveSummaryRows(
        state.pausedMainMenuImportResult ?? null,
        state.pausedMainMenuExportResult ?? null,
        worldSavePersistenceAvailable,
        state.pausedMainMenuWorldSeed ?? null
      ),
      actionSections: resolvePausedMainMenuWorldSaveMenuSections(state, sectionViewModel),
      tone:
        !worldSavePersistenceAvailable
          ? 'warning'
          : resolvePausedMainMenuWorldSaveSectionTone(
              state.pausedMainMenuImportResult ?? null,
              null,
              state.pausedMainMenuExportResult ?? null,
              null
            )
    };
  }

  return {
    visible: true,
    summaryLine: resolvePausedMainMenuWorldSaveSummaryLine(state.pausedMainMenuSavedWorldStatus ?? null),
    metadataRows: createPausedMainMenuWorldSaveSummaryRows(
      state.pausedMainMenuImportResult ?? null,
      state.pausedMainMenuSavedWorldStatus ?? null,
      state.pausedMainMenuExportResult ?? null,
      state.pausedMainMenuClearSavedWorldResult ?? null,
      state.pausedMainMenuWorldSeed ?? null
    ),
    actionSections: resolvePausedMainMenuWorldSaveMenuSections(state, sectionViewModel),
    tone: resolvePausedMainMenuWorldSaveSectionTone(
      state.pausedMainMenuImportResult ?? null,
      state.pausedMainMenuSavedWorldStatus ?? null,
      state.pausedMainMenuExportResult ?? null,
      state.pausedMainMenuClearSavedWorldResult ?? null
    )
  };
};
type PausedMainMenuRecentActivityResultCategory = 'world-save' | 'shell-settings';

const createPausedMainMenuClearedSavedWorldRecentActivityMenuSection = (): AppShellMenuSection => ({
  title: 'Clear Saved World',
  lines: [
    'Clear Saved World removed the browser-resume envelope while keeping this paused session open in the current tab.'
  ],
  metadataRows: [
    {
      label: 'Status',
      value: 'Cleared from browser storage'
    },
    {
      label: 'Session',
      value: 'Still open in this tab'
    }
  ],
  tone: 'accent'
});

const resolvePausedMainMenuRecentActivityCategory = (
  action: PausedMainMenuRecentActivityAction
): PausedMainMenuRecentActivityResultCategory =>
  action === 'reset-shell-toggles' || action === 'reset-shell-telemetry'
    ? 'shell-settings'
    : 'world-save';

const hasPausedMainMenuRecentActivityAction = (
  state: AppShellState,
  action: PausedMainMenuRecentActivityAction
): boolean => {
  switch (action) {
    case 'export-world-save':
      return state.pausedMainMenuExportResult != null;
    case 'import-world-save':
      return state.pausedMainMenuImportResult != null;
    case 'clear-saved-world':
      return (
        state.pausedMainMenuClearSavedWorldResult != null ||
        state.pausedMainMenuSavedWorldStatus === 'cleared'
      );
    case 'reset-shell-toggles':
      return state.pausedMainMenuResetShellTogglesResult != null;
    case 'reset-shell-telemetry':
      return state.pausedMainMenuResetShellTelemetryResult != null;
  }
};

const resolvePausedMainMenuFallbackRecentActivityAction = (
  state: AppShellState
): PausedMainMenuRecentActivityAction | null => {
  const availableActions = (
    [
      'export-world-save',
      'import-world-save',
      'clear-saved-world',
      'reset-shell-toggles',
      'reset-shell-telemetry'
    ] as const
  ).filter((action) => hasPausedMainMenuRecentActivityAction(state, action));

  return availableActions.length === 1 ? availableActions[0] : null;
};

const resolvePausedMainMenuRecentActivityAction = (
  state: AppShellState
): PausedMainMenuRecentActivityAction | null => {
  const preferredAction = state.pausedMainMenuRecentActivityAction ?? null;
  if (preferredAction !== null && hasPausedMainMenuRecentActivityAction(state, preferredAction)) {
    return preferredAction;
  }

  return resolvePausedMainMenuFallbackRecentActivityAction(state);
};

const resolvePausedMainMenuLatestRecentActivityMenuSection = (
  state: AppShellState,
  sectionViewModel: PausedMainMenuSectionViewModel,
  action: PausedMainMenuRecentActivityAction
): AppShellMenuSection | null => {
  switch (action) {
    case 'export-world-save':
      return sectionViewModel.recentActivity.exportResult;
    case 'import-world-save':
      return sectionViewModel.recentActivity.importResult;
    case 'clear-saved-world':
      return (
        sectionViewModel.recentActivity.clearSavedWorldResult ??
        (state.pausedMainMenuSavedWorldStatus === 'cleared'
          ? createPausedMainMenuClearedSavedWorldRecentActivityMenuSection()
          : null)
      );
    case 'reset-shell-toggles':
      return sectionViewModel.recentActivity.resetShellTogglesResult;
    case 'reset-shell-telemetry':
      return sectionViewModel.recentActivity.resetShellTelemetryResult;
  }
};

const resolvePausedMainMenuRecentActivityFollowUpMenuSections = (
  state: AppShellState,
  sectionViewModel: PausedMainMenuSectionViewModel,
  action: PausedMainMenuRecentActivityAction
): readonly AppShellMenuSection[] => {
  if (
    resolvePausedMainMenuRecentActivityCategory(action) !== 'world-save' ||
    sectionViewModel.worldSave.savedWorldStatus === null ||
    state.pausedMainMenuSavedWorldStatus === null
  ) {
    return [];
  }

  return [sectionViewModel.worldSave.savedWorldStatus];
};

const resolvePausedMainMenuRecentActivitySummaryLine = (
  state: AppShellState,
  action: PausedMainMenuRecentActivityAction,
  followUpMenuSections: readonly AppShellMenuSection[]
): string | null => {
  const latestSummary = (() => {
    switch (action) {
      case 'export-world-save':
        switch (state.pausedMainMenuExportResult?.status) {
          case 'downloaded':
            return 'Latest world-save activity: Export World Save downloaded successfully.';
          case 'failed':
            return 'Latest world-save activity: Export World Save failed before the browser accepted the download.';
          default:
            return null;
        }
      case 'import-world-save':
        switch (state.pausedMainMenuImportResult?.status) {
          case 'cancelled':
            return 'Latest world-save activity: Import World Save was canceled before a file was selected.';
          case 'picker-start-failed':
            return 'Latest world-save activity: Import World Save could not open the browser picker.';
          case 'accepted':
            return 'Latest world-save activity: Import World Save restored the paused session successfully.';
          case 'rejected':
            return 'Latest world-save activity: Import World Save was rejected during envelope validation.';
          case 'restore-failed':
            return 'Latest world-save activity: Import World Save passed validation, but runtime restore failed.';
          case 'persistence-failed':
            return 'Latest world-save activity: Import World Save restored this tab, but browser resume was not rewritten.';
          default:
            return null;
        }
      case 'clear-saved-world':
        if (state.pausedMainMenuClearSavedWorldResult?.status === 'failed') {
          return 'Latest world-save activity: Clear Saved World failed before browser resume was deleted.';
        }
        if (state.pausedMainMenuSavedWorldStatus === 'cleared') {
          return 'Latest world-save activity: Clear Saved World removed browser resume for this paused session.';
        }
        return null;
      case 'reset-shell-toggles':
        switch (state.pausedMainMenuResetShellTogglesResult?.status) {
          case 'cleared':
            return 'Latest shell-setting activity: Reset Shell Toggles cleared saved shell visibility for the next resume.';
          case 'persistence-failed':
            return 'Latest shell-setting activity: Reset Shell Toggles applies only to this paused session.';
          default:
            return null;
        }
      case 'reset-shell-telemetry':
        switch (state.pausedMainMenuResetShellTelemetryResult?.status) {
          case 'saved':
            return 'Latest shell-setting activity: Reset Telemetry restored the default catalog and saved it for future resumes.';
          case 'session-only':
            return 'Latest shell-setting activity: Reset Telemetry restored the default catalog for this paused session only.';
          default:
            return null;
        }
    }
  })();

  if (latestSummary === null) {
    return null;
  }

  return followUpMenuSections.length > 0
    ? `${latestSummary} A follow-up warning still needs attention below.`
    : latestSummary;
};

const resolvePausedMainMenuRecentActivitySectionTone = (
  menuSections: readonly AppShellMenuSection[]
): AppShellMenuSectionTone =>
  menuSections.some((section) => section.tone === 'warning') ? 'warning' : 'default';

export const resolvePausedMainMenuRecentActivitySectionState = (
  state: AppShellState
): PausedMainMenuRecentActivitySectionState => {
  if (!isPausedMainMenuState(state)) {
    return {
      visible: false,
      summaryLine: null,
      tone: 'default',
      menuSections: []
    };
  }

  const sectionViewModel = resolvePausedMainMenuSectionViewModel(state);
  if (sectionViewModel === null) {
    return {
      visible: false,
      summaryLine: null,
      tone: 'default',
      menuSections: []
    };
  }

  const action = resolvePausedMainMenuRecentActivityAction(state);
  if (action === null) {
    return {
      visible: false,
      summaryLine: null,
      tone: 'default',
      menuSections: []
    };
  }

  const latestMenuSection = resolvePausedMainMenuLatestRecentActivityMenuSection(
    state,
    sectionViewModel,
    action
  );
  if (latestMenuSection === null) {
    return {
      visible: false,
      summaryLine: null,
      tone: 'default',
      menuSections: []
    };
  }

  const followUpMenuSections = resolvePausedMainMenuRecentActivityFollowUpMenuSections(
    state,
    sectionViewModel,
    action
  );
  const menuSections = [latestMenuSection, ...followUpMenuSections];

  return {
    visible: true,
    summaryLine: resolvePausedMainMenuRecentActivitySummaryLine(
      state,
      action,
      followUpMenuSections
    ),
    tone: resolvePausedMainMenuRecentActivitySectionTone(menuSections),
    menuSections
  };
};

const resolvePausedMainMenuShellProfilePreviewChangeCategory = (
  sectionViewModel: PausedMainMenuSectionViewModel | null
): PausedMainMenuShellProfileApplyChangeCategory => {
  const toggleChanges = parseMenuSectionMetadataRowValue(
    findMenuSectionMetadataRowValue(sectionViewModel?.shell.shellProfilePreview, 'Toggle Changes')
  );
  const hotkeyChanges = parseMenuSectionMetadataRowValue(
    findMenuSectionMetadataRowValue(sectionViewModel?.shell.shellProfilePreview, 'Hotkey Changes')
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
const resolvePausedMainMenuShellLayoutSummaryValue = (
  sectionViewModel: PausedMainMenuSectionViewModel | null
): string => {
  const savedOnToggleLabels = parseMenuSectionMetadataRowValue(
    findMenuSectionMetadataRowValue(sectionViewModel?.shell.persistenceSummary, 'Saved On')
  );
  const persistenceStatusValue = findMenuSectionMetadataRowValue(
    sectionViewModel?.shell.persistenceSummary,
    'Status'
  );
  let layoutValue = 'Unavailable';

  if (savedOnToggleLabels.length === 0) {
    layoutValue = 'All hidden';
  } else if (savedOnToggleLabels.length === 5) {
    layoutValue = 'All shown';
  } else {
    layoutValue = `${formatMenuSectionSummaryListValue(savedOnToggleLabels)} shown`;
  }

  if (persistenceStatusValue === 'Session-only fallback') {
    return `${layoutValue} (session only)`;
  }

  if (persistenceStatusValue === 'Browser saved') {
    return `${layoutValue} (browser saved)`;
  }

  return layoutValue;
};
const resolvePausedMainMenuShellBindingSetSummaryValue = (
  sectionViewModel: PausedMainMenuSectionViewModel | null,
  shellActionKeybindingsCurrentSessionOnly = false
): string => {
  const bindingSetValue =
    findMenuSectionMetadataRowValue(sectionViewModel?.shell.persistenceSummary, 'Binding Set') ??
    'Unavailable';
  const qualifiers: string[] = [];

  if (
    menuSectionIncludesLine(
      sectionViewModel?.shell.persistenceSummary,
      DEFAULTED_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_SUMMARY_LINE
    )
  ) {
    qualifiers.push('recovered safe-set fallback');
  }

  if (shellActionKeybindingsCurrentSessionOnly) {
    qualifiers.push('current session only');
  }

  return qualifiers.length > 0 ? `${bindingSetValue} (${qualifiers.join(', ')})` : bindingSetValue;
};
const resolvePausedMainMenuShellPreviewSummaryValue = (
  sectionViewModel: PausedMainMenuSectionViewModel | null
): string => {
  const previewFileValue = findMenuSectionMetadataRowValue(
    sectionViewModel?.shell.shellProfilePreview,
    'File'
  );

  if (previewFileValue === undefined) {
    return 'No staged preview';
  }

  const previewLabel =
    previewFileValue === 'Unknown file' ? 'Validated preview' : previewFileValue;

  switch (resolvePausedMainMenuShellProfilePreviewChangeCategory(sectionViewModel)) {
    case 'toggle-only':
      return `${previewLabel}: Layout changes only`;
    case 'hotkey-only':
      return `${previewLabel}: Hotkey changes only`;
    case 'mixed':
      return `${previewLabel}: Layout + hotkey changes`;
    case 'none':
      return `${previewLabel}: No live changes`;
  }
};
const formatPausedMainMenuTelemetryLabelListValue = (
  labels: readonly string[],
  totalLabelCount: number
): string => {
  if (labels.length === 0) {
    return 'None';
  }

  if (labels.length === totalLabelCount) {
    return 'All';
  }

  return formatMenuSectionMetadataRowValue(labels);
};
const formatPausedMainMenuTelemetryTypeCountValue = (enabledTypeCount: number, totalTypeCount: number): string =>
  `${enabledTypeCount}/${totalTypeCount}`;
const resolvePausedMainMenuShellTelemetrySummaryLine = (
  worldSessionTelemetryPersistenceAvailable = true
): string =>
  worldSessionTelemetryPersistenceAvailable
    ? 'Choose which runtime telemetry stays visible in the full debug HUD or compact status strip.'
    : 'Choose which runtime telemetry stays visible in the full debug HUD or compact status strip while this tab stays open.';
const resolvePausedMainMenuShellGameplaySummaryLine = (
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState()
): string =>
  worldSessionGameplayState.peacefulModeEnabled
    ? 'Peaceful mode is on, so active slimes clear out and new hostile spawns stay blocked until you turn it off.'
    : 'Peaceful mode is off, so hostile slimes can still spawn, move, and deal contact damage during play.';
const resolvePausedMainMenuShellGameplayToggleLabel = (
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState()
): string =>
  worldSessionGameplayState.peacefulModeEnabled
    ? 'Disable Peaceful Mode'
    : 'Enable Peaceful Mode';
export const resolvePausedMainMenuTogglePeacefulModeTitle = (
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState()
): string =>
  worldSessionGameplayState.peacefulModeEnabled
    ? 'Return hostile slimes to normal spawning, movement, and contact-damage behavior.'
    : 'Clear active slimes and block new hostile spawns until peaceful mode is turned off.';
const resolvePausedMainMenuShellTelemetryCollectionToggleLabel = (enabled: boolean): string =>
  enabled ? 'Collection On' : 'Collection Off';
export const resolvePausedMainMenuResetShellTelemetryTitle = (): string =>
  'Restore every telemetry collection and type to the default visible state.';
export const createPausedMainMenuShellGameplayControlsViewModel = (
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState(),
  worldSessionGameplayPersistenceAvailable = true
): PausedMainMenuShellGameplayControlsViewModel => ({
  summaryLine: resolvePausedMainMenuShellGameplaySummaryLine(worldSessionGameplayState),
  metadataRows: [
    {
      label: 'Mode',
      value: worldSessionGameplayState.peacefulModeEnabled ? 'Peaceful' : 'Normal',
      badge: {
        text: worldSessionGameplayState.peacefulModeEnabled ? 'On' : 'Off',
        tone: worldSessionGameplayState.peacefulModeEnabled ? 'accent' : 'warning'
      }
    },
    {
      label: 'Hostiles',
      value: worldSessionGameplayState.peacefulModeEnabled
        ? 'Active slimes clear and new spawns stay blocked'
        : 'Spawns, movement, and contact damage stay enabled'
    },
    {
      label: 'Persistence',
      value: worldSessionGameplayPersistenceAvailable ? 'Browser saved' : 'Session-only fallback',
      badge: {
        text: worldSessionGameplayPersistenceAvailable ? 'Saved' : 'Session only',
        tone: worldSessionGameplayPersistenceAvailable ? 'accent' : 'warning'
      }
    },
    {
      label: 'Scope',
      value: worldSessionGameplayPersistenceAvailable
        ? 'Current paused session and future fresh worlds'
        : 'Current tab until reload'
    }
  ],
  toggleButtonLabel: resolvePausedMainMenuShellGameplayToggleLabel(worldSessionGameplayState),
  toggleButtonTitle: resolvePausedMainMenuTogglePeacefulModeTitle(worldSessionGameplayState),
  toggleButtonPressed: worldSessionGameplayState.peacefulModeEnabled
});
export const createPausedMainMenuShellTelemetryControlsViewModel = (
  worldSessionTelemetryState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  worldSessionTelemetryPersistenceAvailable = true
): PausedMainMenuShellTelemetryControlsViewModel => {
  const persistenceSummary = createWorldSessionTelemetryStatePersistenceSummary(
    worldSessionTelemetryState,
    worldSessionTelemetryPersistenceAvailable
  );

  return {
    summaryLine: resolvePausedMainMenuShellTelemetrySummaryLine(
      worldSessionTelemetryPersistenceAvailable
    ),
    metadataRows: [
      {
        label: 'Persistence',
        value: persistenceSummary.statusValue,
        badge: {
          text: worldSessionTelemetryPersistenceAvailable ? 'Saved' : 'Session only',
          tone: worldSessionTelemetryPersistenceAvailable ? 'accent' : 'warning'
        }
      },
      {
        label: 'Collections',
        value: formatMenuSectionMetadataRowValue(persistenceSummary.collectionLabels)
      },
      {
        label: 'Collections On',
        value: formatMenuSectionMetadataRowValue(persistenceSummary.enabledCollectionLabels)
      },
      {
        label: 'Collections Off',
        value: formatMenuSectionMetadataRowValue(persistenceSummary.disabledCollectionLabels)
      },
      {
        label: 'Types On',
        value: formatPausedMainMenuTelemetryTypeCountValue(
          persistenceSummary.enabledTypeCount,
          persistenceSummary.totalTypeCount
        )
      }
    ],
    resetButtonDisabled: matchesDefaultWorldSessionTelemetryState(worldSessionTelemetryState),
    collections: WORLD_SESSION_TELEMETRY_COLLECTION_DEFINITIONS.map((collectionDefinition) => {
      const enabled = isWorldSessionTelemetryCollectionEnabled(
        worldSessionTelemetryState,
        collectionDefinition.id
      );
      const typeDefinitions = getWorldSessionTelemetryTypeDefinitionsForCollection(
        collectionDefinition.id
      );
      const enabledTypeLabels = typeDefinitions
        .filter((typeDefinition) =>
          isWorldSessionTelemetryTypeEnabled(worldSessionTelemetryState, typeDefinition.id)
        )
        .map((typeDefinition) => typeDefinition.label);
      const disabledTypeLabels = typeDefinitions
        .filter(
          (typeDefinition) =>
            !isWorldSessionTelemetryTypeEnabled(worldSessionTelemetryState, typeDefinition.id)
        )
        .map((typeDefinition) => typeDefinition.label);
      const enabledTypeCount = countEnabledWorldSessionTelemetryTypesForCollection(
        worldSessionTelemetryState,
        collectionDefinition.id
      );

      return {
        id: collectionDefinition.id,
        label: collectionDefinition.label,
        description: collectionDefinition.description,
        enabled,
        toggleLabel: resolvePausedMainMenuShellTelemetryCollectionToggleLabel(enabled),
        toggleTitle: enabled
          ? `Hide every ${collectionDefinition.label.toLowerCase()} telemetry readout.`
          : `Show every ${collectionDefinition.label.toLowerCase()} telemetry readout whose type toggle stays enabled.`,
        metadataRows: [
          {
            label: 'Collection',
            value: enabled ? 'Visible' : 'Hidden',
            badge: {
              text: enabled ? 'On' : 'Off',
              tone: enabled ? 'accent' : 'warning'
            }
          },
          {
            label: 'Types On',
            value: formatPausedMainMenuTelemetryLabelListValue(
              enabledTypeLabels,
              typeDefinitions.length
            )
          },
          {
            label: 'Types Off',
            value: formatPausedMainMenuTelemetryLabelListValue(
              disabledTypeLabels,
              typeDefinitions.length
            )
          },
          {
            label: 'Visible Types',
            value: formatPausedMainMenuTelemetryTypeCountValue(
              enabledTypeCount,
              typeDefinitions.length
            )
          }
        ],
        types: typeDefinitions.map((typeDefinition) => {
          const typeEnabled = isWorldSessionTelemetryTypeEnabled(
            worldSessionTelemetryState,
            typeDefinition.id
          );
          return {
            id: typeDefinition.id,
            label: typeDefinition.label,
            description: typeDefinition.description,
            enabled: typeEnabled,
            buttonLabel: typeDefinition.label,
            buttonTitle: typeEnabled
              ? `Hide ${collectionDefinition.label.toLowerCase()} ${typeDefinition.label.toLowerCase()} telemetry.`
              : `Show ${collectionDefinition.label.toLowerCase()} ${typeDefinition.label.toLowerCase()} telemetry.`
          };
        })
      };
    })
  };
};
export const createPausedMainMenuShellSummaryRows = (
  sectionViewModel: PausedMainMenuSectionViewModel | null,
  shellActionKeybindingsCurrentSessionOnly = false
): readonly AppShellMenuSectionMetadataRow[] => [
  {
    label: 'Active Layout',
    value: resolvePausedMainMenuShellLayoutSummaryValue(sectionViewModel)
  },
  {
    label: 'Binding Set',
    value: resolvePausedMainMenuShellBindingSetSummaryValue(
      sectionViewModel,
      shellActionKeybindingsCurrentSessionOnly
    )
  },
  {
    label: 'Staged Preview',
    value: resolvePausedMainMenuShellPreviewSummaryValue(sectionViewModel)
  }
] as const;
const DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_LINE =
  'Adjust shell layout, gameplay controls, telemetry, hotkeys, and shell-profile tools for the current paused session.';
export const resolvePausedMainMenuShellSectionState = (
  state: AppShellState
): PausedMainMenuShellSectionState => {
  const visible = isPausedMainMenuState(state);
  const sectionViewModel = resolvePausedMainMenuSectionViewModel(state);

  return {
    visible: visible && sectionViewModel !== null,
    summaryLine:
      visible && sectionViewModel !== null ? DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_LINE : null,
    metadataRows:
      visible && sectionViewModel !== null
        ? createPausedMainMenuShellSummaryRows(
            sectionViewModel,
            state.shellActionKeybindingsCurrentSessionOnly === true
          )
        : [],
    gameplayControls:
      visible && sectionViewModel !== null ? sectionViewModel.shell.gameplayControls : null,
    telemetryControls:
      visible && sectionViewModel !== null ? sectionViewModel.shell.telemetryControls : null,
    previewSection:
      visible && sectionViewModel !== null
        ? sectionViewModel.shell.shellProfilePreview
        : null
  };
};
const resolvePausedMainMenuShellActionKeybindingSummaryLine = (
  shellActionKeybindingsDefaultedFromPersistedState = false
): string =>
  shellActionKeybindingsDefaultedFromPersistedState
    ? DEFAULTED_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_SUMMARY_LINE
    : DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_SUMMARY_LINE;
const PAUSED_MAIN_MENU_SAVED_RESULT_BADGE = {
  text: 'Saved',
  tone: 'accent'
} as const satisfies AppShellMenuSectionMetadataBadge;
const PAUSED_MAIN_MENU_SESSION_ONLY_RESULT_BADGE = {
  text: 'Session only',
  tone: 'warning'
} as const satisfies AppShellMenuSectionMetadataBadge;
const DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS = [
  {
    label: 'Keys',
    value: 'Unique A-Z letters'
  },
  {
    label: 'Persistence',
    value: 'Browser saved on change',
    badge: PAUSED_MAIN_MENU_SAVED_RESULT_BADGE
  }
] as const satisfies readonly AppShellMenuSectionMetadataRow[];
const SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS = [
  {
    label: 'Keys',
    value: 'Unique A-Z letters'
  },
  {
    label: 'Persistence',
    value: 'Current session only until reload or reset',
    badge: PAUSED_MAIN_MENU_SESSION_ONLY_RESULT_BADGE
  }
] as const satisfies readonly AppShellMenuSectionMetadataRow[];
export const createPausedMainMenuShellActionKeybindingEditorMetadataRows = (
  worldSessionShellPersistenceAvailable = true
): readonly AppShellMenuSectionMetadataRow[] =>
  worldSessionShellPersistenceAvailable
    ? DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS
    : SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS;
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
}): {
  tone: 'accent' | 'warning';
  text: string;
  badge?: AppShellMenuSectionMetadataBadge;
} => {
  switch (result.status) {
    case 'saved':
      return {
        tone: 'accent',
        badge: PAUSED_MAIN_MENU_SAVED_RESULT_BADGE,
        text: changed
          ? `${actionLabel} now uses ${nextKey}, and the current shell hotkey set was saved.`
          : `${actionLabel} stayed on ${nextKey}, and the current shell hotkey set was saved.`
      };
    case 'session-only':
      return {
        tone: 'warning',
        badge: PAUSED_MAIN_MENU_SESSION_ONLY_RESULT_BADGE,
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
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Downloaded'
          },
          {
            label: 'File',
            value: resolvePausedMainMenuResultFileNameValue(exportResult.fileName)
          },
          {
            label: 'Session',
            value: 'Kept unchanged'
          }
        ],
        tone: 'accent'
      };
    case 'failed':
      return {
        title: 'Export Result',
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Failed'
          },
          {
            label: 'Session',
            value: 'Kept unchanged'
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
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Not browser saved'
          },
          {
            label: 'Reload',
            value: 'Rewrite browser resume before reload'
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
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Not browser saved'
          },
          {
            label: 'Reload',
            value: 'Later browser save required'
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
const resolvePausedMainMenuWorldSaveSummaryLine = (
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): string => {
  switch (savedWorldStatus) {
    case null:
      return DEFAULT_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE;
    case 'cleared':
      return CLEARED_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE;
    case 'import-persistence-failed':
      return IMPORT_PERSISTENCE_FAILED_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE;
  }
};
const resolveFirstStartMainMenuWorldSaveSummaryLine = (
  worldSessionShellPersistenceAvailable: boolean
): string =>
  worldSessionShellPersistenceAvailable
    ? DEFAULT_FIRST_START_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE
    : STORAGE_UNAVAILABLE_FIRST_START_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE;
const resolvePausedMainMenuWorldSaveBrowserResumeValue = (
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): string => (savedWorldStatus === null ? 'Available' : 'Missing');
const resolveFirstStartMainMenuWorldSaveBrowserResumeValue = (
  worldSessionShellPersistenceAvailable: boolean
): string => (worldSessionShellPersistenceAvailable ? 'Missing' : 'Unavailable');
const resolvePausedMainMenuWorldSaveSeedValue = (worldSeed: number | null): string =>
  String(worldSeed ?? 0);
const createPausedMainMenuWorldSaveBrowserResumeBadge = (
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): AppShellMenuSectionMetadataBadge =>
  savedWorldStatus === null
    ? {
        text: 'Saved',
        tone: 'accent'
      }
    : {
        text: 'Missing',
        tone: 'warning'
      };
const createFirstStartMainMenuWorldSaveBrowserResumeBadge = (
  worldSessionShellPersistenceAvailable: boolean
): AppShellMenuSectionMetadataBadge =>
  worldSessionShellPersistenceAvailable
    ? {
        text: 'Missing',
        tone: 'warning'
      }
    : {
        text: 'Unavailable',
        tone: 'warning'
      };
const resolvePausedMainMenuWorldSaveSavedAgainByValue = (
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): string => {
  switch (savedWorldStatus) {
    case null:
      return 'None needed';
    case 'cleared':
      return 'Resume World, Import World Save, New World';
    case 'import-persistence-failed':
      return 'Later pause or page hide, Import World Save, New World';
  }
};
const createFirstStartMainMenuWorldSaveCreationRow = (
  worldSessionShellPersistenceAvailable: boolean
): AppShellMenuSectionMetadataRow =>
  worldSessionShellPersistenceAvailable
    ? {
        label: 'Created By',
        value: 'Enter World, Import World Save, or New World'
      }
    : {
        label: 'Requires',
        value: 'Working browser storage access'
      };
const resolvePausedMainMenuWorldSaveExportStatusValue = (
  exportResult: PausedMainMenuExportResult | null
): string => {
  if (exportResult === null) {
    return 'No recent export';
  }

  switch (exportResult.status) {
    case 'downloaded':
      return `Downloaded ${resolvePausedMainMenuResultFileNameValue(exportResult.fileName)}`;
    case 'failed':
      return `Failed: ${resolvePausedMainMenuResultReasonValue(exportResult.reason)}`;
  }
};
const createPausedMainMenuWorldSaveExportStatusBadge = (
  exportResult: PausedMainMenuExportResult | null
): AppShellMenuSectionMetadataBadge | undefined => {
  if (exportResult === null) {
    return undefined;
  }

  switch (exportResult.status) {
    case 'downloaded':
      return {
        text: 'Downloaded',
        tone: 'accent'
      };
    case 'failed':
      return {
        text: 'Failed',
        tone: 'warning'
      };
  }
};
const resolvePausedMainMenuWorldSaveImportStatusValue = (
  importResult: PausedMainMenuImportResult | null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): string => {
  if (importResult === null) {
    return savedWorldStatus === 'import-persistence-failed'
      ? 'Restored in this tab only'
      : 'No recent import';
  }

  switch (importResult.status) {
    case 'cancelled':
      return 'Canceled';
    case 'picker-start-failed':
      return `Picker failed: ${resolvePausedMainMenuResultReasonValue(importResult.reason)}`;
    case 'accepted':
      return `Accepted ${resolvePausedMainMenuResultFileNameValue(importResult.fileName)}`;
    case 'rejected':
      return `Rejected ${resolvePausedMainMenuResultFileNameValue(importResult.fileName)}`;
    case 'restore-failed':
      return `Restore failed for ${resolvePausedMainMenuResultFileNameValue(importResult.fileName)}`;
    case 'persistence-failed':
      return `Restored in this tab only from ${resolvePausedMainMenuResultFileNameValue(importResult.fileName)}`;
  }
};
const createPausedMainMenuWorldSaveImportStatusBadge = (
  importResult: PausedMainMenuImportResult | null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): AppShellMenuSectionMetadataBadge | undefined => {
  if (importResult === null) {
    return savedWorldStatus === 'import-persistence-failed'
      ? {
          text: 'Session only',
          tone: 'warning'
        }
      : undefined;
  }

  switch (importResult.status) {
    case 'cancelled':
      return {
        text: 'Canceled'
      };
    case 'picker-start-failed':
    case 'restore-failed':
      return {
        text: 'Failed',
        tone: 'warning'
      };
    case 'accepted':
      return {
        text: 'Restored',
        tone: 'accent'
      };
    case 'rejected':
      return {
        text: 'Rejected',
        tone: 'warning'
      };
    case 'persistence-failed':
      return {
        text: 'Session only',
        tone: 'warning'
      };
  }
};
const resolvePausedMainMenuWorldSaveClearStatusValue = (
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): string => {
  if (clearSavedWorldResult !== null) {
    return `Failed: ${resolvePausedMainMenuResultReasonValue(clearSavedWorldResult.reason)}`;
  }

  return savedWorldStatus === 'cleared' ? 'Cleared from browser storage' : 'No recent clear';
};
const createPausedMainMenuWorldSaveClearStatusBadge = (
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): AppShellMenuSectionMetadataBadge | undefined => {
  if (clearSavedWorldResult !== null) {
    return {
      text: 'Failed',
      tone: 'warning'
    };
  }

  return savedWorldStatus === 'cleared'
    ? {
        text: 'Cleared',
        tone: 'warning'
      }
    : undefined;
};
const resolvePausedMainMenuWorldSaveSectionTone = (
  importResult: PausedMainMenuImportResult | null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null,
  exportResult: PausedMainMenuExportResult | null,
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null
): AppShellMenuSectionTone => {
  if (savedWorldStatus !== null || clearSavedWorldResult !== null) {
    return 'warning';
  }

  if (exportResult?.status === 'failed') {
    return 'warning';
  }

  switch (importResult?.status) {
    case 'picker-start-failed':
    case 'rejected':
    case 'restore-failed':
    case 'persistence-failed':
      return 'warning';
    default:
      return 'default';
  }
};
const createPausedMainMenuWorldSaveSummaryRows = (
  importResult: PausedMainMenuImportResult | null,
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null,
  exportResult: PausedMainMenuExportResult | null,
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult | null,
  worldSeed: number | null
): readonly AppShellMenuSectionMetadataRow[] => [
  {
    label: 'Browser Resume',
    value: resolvePausedMainMenuWorldSaveBrowserResumeValue(savedWorldStatus),
    badge: createPausedMainMenuWorldSaveBrowserResumeBadge(savedWorldStatus)
  },
  {
    label: 'World Seed',
    value: resolvePausedMainMenuWorldSaveSeedValue(worldSeed)
  },
  {
    label: 'Saved Again By',
    value: resolvePausedMainMenuWorldSaveSavedAgainByValue(savedWorldStatus)
  },
  {
    label: 'Last Export',
    value: resolvePausedMainMenuWorldSaveExportStatusValue(exportResult),
    badge: createPausedMainMenuWorldSaveExportStatusBadge(exportResult)
  },
  {
    label: 'Last Import',
    value: resolvePausedMainMenuWorldSaveImportStatusValue(importResult, savedWorldStatus),
    badge: createPausedMainMenuWorldSaveImportStatusBadge(importResult, savedWorldStatus)
  },
  {
    label: 'Last Clear',
    value: resolvePausedMainMenuWorldSaveClearStatusValue(clearSavedWorldResult, savedWorldStatus),
    badge: createPausedMainMenuWorldSaveClearStatusBadge(clearSavedWorldResult, savedWorldStatus)
  }
] as const;
const createFirstStartMainMenuWorldSaveSummaryRows = (
  importResult: PausedMainMenuImportResult | null,
  exportResult: PausedMainMenuExportResult | null,
  worldSessionShellPersistenceAvailable: boolean,
  worldSeed: number | null
): readonly AppShellMenuSectionMetadataRow[] => [
  {
    label: 'Browser Resume',
    value: resolveFirstStartMainMenuWorldSaveBrowserResumeValue(
      worldSessionShellPersistenceAvailable
    ),
    badge: createFirstStartMainMenuWorldSaveBrowserResumeBadge(
      worldSessionShellPersistenceAvailable
    )
  },
  {
    label: 'World Seed',
    value: resolvePausedMainMenuWorldSaveSeedValue(worldSeed)
  },
  createFirstStartMainMenuWorldSaveCreationRow(worldSessionShellPersistenceAvailable),
  {
    label: 'Last Export',
    value: resolvePausedMainMenuWorldSaveExportStatusValue(exportResult),
    badge: createPausedMainMenuWorldSaveExportStatusBadge(exportResult)
  },
  {
    label: 'Last Import',
    value: resolvePausedMainMenuWorldSaveImportStatusValue(importResult, null),
    badge: createPausedMainMenuWorldSaveImportStatusBadge(importResult, null)
  }
] as const;
const resolvePausedMainMenuOverviewSessionSaveValue = (
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): string => (savedWorldStatus === null ? 'Browser saved' : 'Not browser saved');
const resolvePausedMainMenuOverviewAttentionValue = (
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): string => {
  switch (savedWorldStatus) {
    case null:
      return 'None';
    case 'cleared':
      return 'Resume World or another save path must rewrite browser resume.';
    case 'import-persistence-failed':
      return 'Reload will miss the imported session until a later browser save succeeds.';
  }
};
const resolvePausedMainMenuOverviewResumeWorldTone = (
  savedWorldStatus: PausedMainMenuSavedWorldStatus | null
): AppShellMenuSectionTone => (savedWorldStatus === null ? 'accent' : 'warning');
const createPausedMainMenuClearSavedWorldResultMenuSection = (
  clearSavedWorldResult: PausedMainMenuClearSavedWorldResult
): AppShellMenuSection => {
  switch (clearSavedWorldResult.status) {
    case 'failed':
      return {
        title: 'Clear Saved World Result',
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Failed'
          },
          {
            label: 'Session',
            value: 'Still browser saved'
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
        lines: [],
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
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Current session only'
          },
          {
            label: 'Reload',
            value: 'Later shell save required'
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
const createPausedMainMenuResetShellTelemetryResultMenuSection = (
  resetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult
): AppShellMenuSection => {
  const persistenceAvailable = resetShellTelemetryResult.status === 'saved';
  const persistenceSummary = createWorldSessionTelemetryStatePersistenceSummary(
    createDefaultWorldSessionTelemetryState(),
    persistenceAvailable
  );

  return {
    title: 'Reset Telemetry Result',
    lines: [],
    metadataRows: [
      {
        label: 'Status',
        value: 'Default catalog restored'
      },
      {
        label: 'Persistence',
        value: persistenceSummary.statusValue,
        badge: persistenceAvailable
          ? PAUSED_MAIN_MENU_SAVED_RESULT_BADGE
          : PAUSED_MAIN_MENU_SESSION_ONLY_RESULT_BADGE
      },
      {
        label: 'Visibility',
        value: 'All collections and types enabled'
      }
    ],
    tone: persistenceAvailable ? 'accent' : 'warning'
  };
};
const createPausedMainMenuShellProfilePreviewMenuSection = (
  worldSessionShellState: WorldSessionShellState,
  liveShellActionKeybindings: ShellActionKeybindingState,
  shellProfilePreview: PausedMainMenuShellProfilePreview
): AppShellMenuSection => {
  const shellStateSummary = createWorldSessionShellStatePersistenceSummary(
    shellProfilePreview.shellState
  );
  const toggleChangeLabels = createWorldSessionShellStateToggleChanges(
    worldSessionShellState,
    shellProfilePreview.shellState
  ).map(
    ({ label, previousVisible, nextVisible }) =>
      `${label} ${previousVisible ? 'on' : 'off'} -> ${nextVisible ? 'on' : 'off'}`
  );
  const hotkeyDiffs = IN_WORLD_SHELL_ACTION_KEYBINDING_IDS.map((actionType) => {
    const actionLabel = getInWorldShellActionKeybindingActionLabel(actionType);
    const previousHotkey = liveShellActionKeybindings[actionType];
    const nextHotkey = shellProfilePreview.shellActionKeybindings[actionType];

    return {
      actionLabel,
      previousHotkey,
      nextHotkey,
      changed: previousHotkey !== nextHotkey
    };
  });
  const changedHotkeyDiffs = hotkeyDiffs.filter(({ changed }) => changed);
  const matchingHotkeyDiffs = hotkeyDiffs.filter(({ changed }) => !changed);

  return {
    title: 'Shell Profile Preview',
    lines: [],
    metadataRows: [
      {
        label: 'File',
        value: resolvePausedMainMenuResultFileNameValue(shellProfilePreview.fileName)
      },
      {
        label: 'Toggle Changes',
        value: formatMenuSectionMetadataRowValue(toggleChangeLabels)
      },
      {
        label: 'Hotkey Changes',
        value: formatMenuSectionMetadataRowValue(
          changedHotkeyDiffs.map(({ actionLabel }) => actionLabel)
        )
      },
      {
        label: 'Saved On',
        value: formatMenuSectionMetadataRowValue(shellStateSummary.savedOnToggleLabels)
      },
      {
        label: 'Saved Off',
        value: formatMenuSectionMetadataRowValue(shellStateSummary.savedOffToggleLabels)
      }
    ],
    detailGroups: [
      {
        title: 'Changed From Live',
        items: changedHotkeyDiffs.map(
          ({ actionLabel, previousHotkey, nextHotkey }) =>
            `${actionLabel}: ${previousHotkey} -> ${nextHotkey}`
        ),
        emptyText: changedHotkeyDiffs.length === 0 ? 'No hotkey changes' : undefined
      },
      {
        title: 'Matching Live',
        items: matchingHotkeyDiffs.map(
          ({ actionLabel, nextHotkey }) => `${actionLabel}: ${nextHotkey}`
        ),
        emptyText: matchingHotkeyDiffs.length === 0 ? 'All hotkeys changed' : undefined
      }
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
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Canceled'
          },
          {
            label: 'Session',
            value: 'Kept unchanged'
          }
        ]
      };
    case 'picker-start-failed':
      return {
        title: 'Import Result',
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Picker failed'
          },
          {
            label: 'Session',
            value: 'Kept unchanged'
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
        lines: [],
        metadataRows: [
          {
            label: 'Status',
            value: 'Accepted'
          },
          {
            label: 'File',
            value: resolvePausedMainMenuResultFileNameValue(importResult.fileName)
          },
          {
            label: 'Session',
            value: 'Replaced'
          }
        ],
        tone: 'accent'
      };
    case 'rejected':
      return {
        title: 'Import Result',
        lines: [],
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
            label: 'Session',
            value: 'Kept unchanged'
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
        lines: [],
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
            label: 'Session',
            value: 'Kept unchanged'
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
        lines: [],
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
            label: 'Reload',
            value: 'Later browser save required'
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

export const createPausedMainMenuSectionViewModel = (
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
  worldSessionTelemetryState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  worldSessionTelemetryPersistenceAvailable = true,
  resetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult | null = null,
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState(),
  worldSessionGameplayPersistenceAvailable = true,
  mainMenuVariant: MainMenuVariant = 'paused-session'
): PausedMainMenuSectionViewModel => {
  const firstStart = mainMenuVariant === 'first-start';
  const persistenceSummary = createWorldSessionShellStatePersistenceSummary(
    worldSessionShellState,
    worldSessionShellPersistenceAvailable
  );
  return {
    overview: {
      resumeWorld: {
        title: firstStart ? 'Enter World' : `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
        lines: [],
        metadataRows: firstStart
          ? [
              {
                label: 'Shortcut',
                value: 'Button only'
              },
              {
                label: 'Readiness',
                value: 'Renderer ready; starts on click.'
              },
              {
                label: 'Session Save',
                value: worldSessionShellPersistenceAvailable
                  ? 'Not browser saved yet'
                  : 'Browser storage unavailable'
              }
            ]
          : [
              {
                label: 'Keeps',
                value: 'World, player, camera, and debug edits intact'
              },
              {
                label: 'Session Save',
                value: resolvePausedMainMenuOverviewSessionSaveValue(savedWorldStatus)
              },
              {
                label: 'Needs Attention',
                value: resolvePausedMainMenuOverviewAttentionValue(savedWorldStatus)
              },
              {
                label: 'Shortcut',
                value: getDesktopResumeWorldHotkeyLabel()
              }
            ],
        tone: firstStart ? 'accent' : resolvePausedMainMenuOverviewResumeWorldTone(savedWorldStatus)
      }
    },
    worldSave: {
      exportWorldSave: {
        title: 'Export World Save',
        lines: [],
        metadataRows: [
          {
            label: 'Shortcut',
            value: 'Button only'
          },
          {
            label: 'Session',
            value: 'Kept unchanged'
          }
        ]
      },
      importWorldSave: {
        title: 'Import World Save',
        lines: [],
        metadataRows: [
          {
            label: 'Shortcut',
            value: 'Button only'
          },
          {
            label: 'Replaces',
            value: 'Current session only after validation and restore'
          }
        ]
      },
      clearSavedWorld: {
        title: 'Clear Saved World',
        lines: [],
        metadataRows: [
          {
            label: 'Shortcut',
            value: 'Button only'
          },
          {
            label: 'Session',
            value: 'Kept in this tab'
          },
          {
            label: 'Reload',
            value: 'Clears browser resume'
          }
        ]
      },
      newWorld: {
        title: firstStart ? 'New World' : `New World (${getDesktopFreshWorldHotkeyLabel()})`,
        lines: [],
        metadataRows: [
          {
            label: 'Shortcut',
            value: firstStart ? 'Button only' : getDesktopFreshWorldHotkeyLabel()
          },
          {
            label: 'Replaces',
            value: firstStart ? 'Seeded start world with a fresh world' : 'Paused session with a fresh world'
          },
          {
            label: 'Resets',
            value: 'Player, camera, undo, and shell layout'
          }
        ],
        tone: 'warning'
      },
      savedWorldStatus:
        savedWorldStatus === null
          ? null
          : createPausedMainMenuSavedWorldStatusMenuSection(savedWorldStatus)
    },
    shell: {
      persistenceSummary: {
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
      gameplayControls: createPausedMainMenuShellGameplayControlsViewModel(
        worldSessionGameplayState,
        worldSessionGameplayPersistenceAvailable
      ),
      telemetryControls: createPausedMainMenuShellTelemetryControlsViewModel(
        worldSessionTelemetryState,
        worldSessionTelemetryPersistenceAvailable
      ),
      shellProfilePreview:
        shellProfilePreview === null
          ? null
          : createPausedMainMenuShellProfilePreviewMenuSection(
              worldSessionShellState,
              shellActionKeybindings,
              shellProfilePreview
            )
    },
    recentActivity: {
      exportResult:
        exportResult === null ? null : createPausedMainMenuExportResultMenuSection(exportResult),
      importResult:
        importResult === null ? null : createPausedMainMenuImportMenuSection(importResult),
      clearSavedWorldResult:
        clearSavedWorldResult === null
          ? null
          : createPausedMainMenuClearSavedWorldResultMenuSection(clearSavedWorldResult),
      resetShellTogglesResult:
        resetShellTogglesResult === null
          ? null
          : createPausedMainMenuResetShellTogglesResultMenuSection(resetShellTogglesResult),
      resetShellTelemetryResult:
        resetShellTelemetryResult === null
          ? null
          : createPausedMainMenuResetShellTelemetryResultMenuSection(resetShellTelemetryResult)
    }
  };
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
  shellProfilePreview: PausedMainMenuShellProfilePreview | null = null,
  shellActionKeybindingsCurrentSessionOnly = false,
  recentActivityAction: PausedMainMenuRecentActivityAction | null = null,
  worldSessionTelemetryState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  worldSessionTelemetryPersistenceAvailable = true,
  resetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult | null = null,
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState(),
  worldSessionGameplayPersistenceAvailable = true,
  pausedMainMenuWorldSeed: number | null = null
): readonly AppShellMenuSection[] =>
  createPausedMainMenuShellState(
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
    shellActionKeybindingsCurrentSessionOnly,
    recentActivityAction,
    worldSessionTelemetryState,
    worldSessionTelemetryPersistenceAvailable,
    resetShellTelemetryResult,
    worldSessionGameplayState,
    worldSessionGameplayPersistenceAvailable,
    pausedMainMenuWorldSeed
  ).menuSections ?? [];

const createStandardMainMenuBaseShellState = (
  mainMenuVariant: MainMenuVariant,
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
  shellActionKeybindingsCurrentSessionOnly = false,
  recentActivityAction: PausedMainMenuRecentActivityAction | null = null,
  worldSessionTelemetryState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  worldSessionTelemetryPersistenceAvailable = true,
  resetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult | null = null,
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState(),
  worldSessionGameplayPersistenceAvailable = true,
  pausedMainMenuWorldSeed: number | null = null
): AppShellState => {
  const firstStart = mainMenuVariant === 'first-start';
  const pausedMainMenuSections = createPausedMainMenuSectionViewModel(
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
    worldSessionTelemetryState,
    worldSessionTelemetryPersistenceAvailable,
    resetShellTelemetryResult,
    worldSessionGameplayState,
    worldSessionGameplayPersistenceAvailable,
    mainMenuVariant
  );

  return {
    screen: 'main-menu',
    mainMenuVariant,
    ...(firstStart ? { worldSavePersistenceAvailable: worldSessionShellPersistenceAvailable } : {}),
    statusText: firstStart ? DEFAULT_FIRST_LAUNCH_MAIN_MENU_STATUS : DEFAULT_PAUSED_MAIN_MENU_STATUS,
    detailLines: firstStart
      ? DEFAULT_FIRST_LAUNCH_MAIN_MENU_DETAIL_LINES
      : DEFAULT_PAUSED_MAIN_MENU_DETAIL_LINES,
    pausedMainMenuSections,
    primaryActionLabel: firstStart ? 'Enter World' : 'Resume World',
    secondaryActionLabel: 'Export World Save',
    tertiaryActionLabel: 'Import World Save',
    quaternaryActionLabel: firstStart ? null : 'Clear Saved World',
    quinaryActionLabel: 'Reset Shell Toggles',
    senaryActionLabel: 'New World',
    shellActionKeybindings,
    worldSessionShellPersistenceAvailable,
    ...(shellActionKeybindingsCurrentSessionOnly
      ? { shellActionKeybindingsCurrentSessionOnly: true }
      : {}),
    ...(exportResult === null ? {} : { pausedMainMenuExportResult: exportResult }),
    ...(importResult === null ? {} : { pausedMainMenuImportResult: importResult }),
    ...(savedWorldStatus === null ? {} : { pausedMainMenuSavedWorldStatus: savedWorldStatus }),
    ...(pausedMainMenuWorldSeed === null ? {} : { pausedMainMenuWorldSeed }),
    ...(clearSavedWorldResult === null
      ? {}
      : { pausedMainMenuClearSavedWorldResult: clearSavedWorldResult }),
    ...(resetShellTogglesResult === null
      ? {}
      : { pausedMainMenuResetShellTogglesResult: resetShellTogglesResult }),
    ...(resetShellTelemetryResult === null
      ? {}
      : { pausedMainMenuResetShellTelemetryResult: resetShellTelemetryResult }),
    ...(recentActivityAction === null
      ? {}
      : { pausedMainMenuRecentActivityAction: recentActivityAction }),
    ...(shellProfilePreview === null
      ? {}
      : { pausedMainMenuShellProfilePreview: shellProfilePreview })
  };
};

export const createFirstLaunchMainMenuShellState = (
  worldSessionShellPersistenceAvailable = true,
  worldSessionShellState: WorldSessionShellState = createDefaultWorldSessionShellState(),
  shellActionKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState(),
  shellActionKeybindingsDefaultedFromPersistedState = false,
  importResult: PausedMainMenuImportResult | null = null,
  exportResult: PausedMainMenuExportResult | null = null,
  resetShellTogglesResult: PausedMainMenuResetShellTogglesResult | null = null,
  shellProfilePreview: PausedMainMenuShellProfilePreview | null = null,
  shellActionKeybindingsCurrentSessionOnly = false,
  recentActivityAction: PausedMainMenuRecentActivityAction | null = null,
  worldSessionTelemetryState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  worldSessionTelemetryPersistenceAvailable = worldSessionShellPersistenceAvailable,
  resetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult | null = null,
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState(),
  worldSessionGameplayPersistenceAvailable = worldSessionShellPersistenceAvailable,
  pausedMainMenuWorldSeed: number | null = null,
  worldSavePersistenceAvailable = worldSessionShellPersistenceAvailable
): AppShellState => {
  const baseState = createStandardMainMenuBaseShellState(
    'first-start',
    worldSessionShellState,
    worldSessionShellPersistenceAvailable,
    shellActionKeybindings,
    shellActionKeybindingsDefaultedFromPersistedState,
    importResult,
    null,
    exportResult,
    null,
    resetShellTogglesResult,
    shellProfilePreview,
    shellActionKeybindingsCurrentSessionOnly,
    recentActivityAction,
    worldSessionTelemetryState,
    worldSessionTelemetryPersistenceAvailable,
    resetShellTelemetryResult,
    worldSessionGameplayState,
    worldSessionGameplayPersistenceAvailable,
    pausedMainMenuWorldSeed
  );
  const menuSectionGroups = resolvePausedMainMenuMenuSectionGroups(baseState);

  return {
    ...baseState,
    worldSavePersistenceAvailable,
    menuSections: [...menuSectionGroups.primarySections, ...menuSectionGroups.recentActivitySections]
  };
};

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
  shellActionKeybindingsCurrentSessionOnly = false,
  recentActivityAction: PausedMainMenuRecentActivityAction | null = null,
  worldSessionTelemetryState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  worldSessionTelemetryPersistenceAvailable = true,
  resetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult | null = null,
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState(),
  worldSessionGameplayPersistenceAvailable = true,
  pausedMainMenuWorldSeed: number | null = null
): AppShellState => {
  const baseState = createStandardMainMenuBaseShellState(
    'paused-session',
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
    shellActionKeybindingsCurrentSessionOnly,
    recentActivityAction,
    worldSessionTelemetryState,
    worldSessionTelemetryPersistenceAvailable,
    resetShellTelemetryResult,
    worldSessionGameplayState,
    worldSessionGameplayPersistenceAvailable,
    pausedMainMenuWorldSeed
  );
  const menuSectionGroups = resolvePausedMainMenuMenuSectionGroups(baseState);

  return {
    ...baseState,
    menuSections: [...menuSectionGroups.primarySections, ...menuSectionGroups.recentActivitySections]
  };
};

export interface AppShellViewModel {
  screen: AppShellScreen;
  overlayVisible: boolean;
  chromeVisible: boolean;
  stageLabel: string;
  title: string;
  statusText: string;
  detailLines: readonly string[];
  menuSections: readonly AppShellMenuSection[];
  pausedMainMenuSections: PausedMainMenuSectionViewModel | null;
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
  badge?: AppShellMenuSectionMetadataBadge;
}

interface AppShellOptions {
  onPrimaryAction?: (screen: AppShellScreen) => void;
  onSecondaryAction?: (screen: AppShellScreen) => void;
  onTertiaryAction?: (screen: AppShellScreen) => void;
  onImportWorldSave?: (screen: AppShellScreen) => Promise<unknown> | unknown;
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
  onToggleShellTelemetryCollection?: (
    screen: AppShellScreen,
    collectionId: WorldSessionTelemetryCollectionId
  ) => void;
  onToggleShellTelemetryType?: (
    screen: AppShellScreen,
    typeId: WorldSessionTelemetryTypeId
  ) => void;
  onResetShellTelemetry?: (screen: AppShellScreen) => void;
  onTogglePeacefulMode?: (screen: AppShellScreen) => void;
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
  shellActionKeybindingsCurrentSessionOnly = false,
  recentActivityAction: PausedMainMenuRecentActivityAction | null = null,
  worldSessionTelemetryState: WorldSessionTelemetryState = createDefaultWorldSessionTelemetryState(),
  worldSessionTelemetryPersistenceAvailable = true,
  resetShellTelemetryResult: PausedMainMenuResetShellTelemetryResult | null = null,
  worldSessionGameplayState: WorldSessionGameplayState = createDefaultWorldSessionGameplayState(),
  worldSessionGameplayPersistenceAvailable = true,
  pausedMainMenuWorldSeed: number | null = null
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
        shellActionKeybindingsCurrentSessionOnly,
        recentActivityAction,
        worldSessionTelemetryState,
        worldSessionTelemetryPersistenceAvailable,
        resetShellTelemetryResult,
        worldSessionGameplayState,
        worldSessionGameplayPersistenceAvailable,
        pausedMainMenuWorldSeed
      )
    : createFirstLaunchMainMenuShellState(
        worldSessionShellPersistenceAvailable,
        worldSessionShellState,
        shellActionKeybindings,
        shellActionKeybindingsDefaultedFromPersistedState,
        importResult,
        exportResult,
        resetShellTogglesResult,
        shellProfilePreview,
        shellActionKeybindingsCurrentSessionOnly,
        recentActivityAction,
        worldSessionTelemetryState,
        worldSessionTelemetryPersistenceAvailable,
        resetShellTelemetryResult,
        worldSessionGameplayState,
        worldSessionGameplayPersistenceAvailable,
        pausedMainMenuWorldSeed,
        firstLaunchWorldSavePersistenceAvailable
      );

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

const PAUSED_MAIN_MENU_BUSY_IMPORT_WORLD_SAVE_TITLE =
  'Wait for the current world-save file picker to finish before starting another paused-session import.';

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

const PAUSED_MAIN_MENU_BUSY_IMPORT_SHELL_PROFILE_TITLE =
  'Wait for the current shell-profile file picker to finish before starting another import.';

const PAUSED_MAIN_MENU_BUSY_APPLY_SHELL_PROFILE_TITLE =
  'Wait for the current shell-profile preview apply to finish before applying it again.';

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
): {
  tone: 'accent' | 'warning';
  text: string;
  badge?: AppShellMenuSectionMetadataBadge;
} => {
  switch (importResult.status) {
    case 'applied': {
      const fileName = resolvePausedMainMenuResultFileNameValue(importResult.fileName);
      return {
        tone: 'accent',
        badge: PAUSED_MAIN_MENU_SAVED_RESULT_BADGE,
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
        badge: PAUSED_MAIN_MENU_SESSION_ONLY_RESULT_BADGE,
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
  state.screen === 'main-menu' &&
  (state.mainMenuVariant === 'paused-session' || state.mainMenuVariant === 'first-start');
const isFirstStartMainMenuState = (state: AppShellState): boolean =>
  state.screen === 'main-menu' && state.mainMenuVariant === 'first-start';

export const DEFAULT_PAUSED_MAIN_MENU_MENU_SECTIONS = createPausedMainMenuMenuSections();

const resolveFirstStartMainMenuEnterWorldTitle = (): string =>
  'Start the fixed-step simulation, standalone player, and live in-world controls.';
const resolveFirstStartMainMenuExportWorldSaveTitle = (): string =>
  'Download a JSON world-save copy of the seeded start world before entering it.';
const resolveFirstStartMainMenuImportWorldSaveTitle = (): string =>
  'Choose a JSON world-save file and load it into the main-menu preview before entering the world.';
const resolveFirstStartMainMenuResetShellTogglesTitle = (): string =>
  'Clear saved in-world shell visibility preferences and restore the default-off shell layout before the first session starts.';
const resolveFirstStartMainMenuFreshWorldTitle = (): string =>
  'Discard the seeded start world, camera state, and undo history, then boot a fresh world.';

export const resolveMainMenuPrimaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu'
    ? state.primaryActionLabel === 'Resume World'
      ? resolvePausedMainMenuResumeWorldTitle()
      : state.primaryActionLabel === 'Enter World'
        ? resolveFirstStartMainMenuEnterWorldTitle()
        : ''
    : '';

export const resolveMainMenuSecondaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.secondaryActionLabel === 'Export World Save'
    ? isFirstStartMainMenuState(state)
      ? resolveFirstStartMainMenuExportWorldSaveTitle()
      : resolvePausedMainMenuExportWorldSaveTitle()
    : '';

export const resolveMainMenuTertiaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.tertiaryActionLabel === 'Import World Save'
    ? isFirstStartMainMenuState(state)
      ? resolveFirstStartMainMenuImportWorldSaveTitle()
      : resolvePausedMainMenuImportWorldSaveTitle()
    : '';

export const resolveMainMenuQuaternaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.quaternaryActionLabel === 'Clear Saved World'
    ? resolvePausedMainMenuClearSavedWorldTitle()
    : '';

export const resolveMainMenuQuinaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.quinaryActionLabel === 'Reset Shell Toggles'
    ? isFirstStartMainMenuState(state)
      ? resolveFirstStartMainMenuResetShellTogglesTitle()
      : resolvePausedMainMenuResetShellTogglesTitle()
    : '';

export const resolveMainMenuSenaryActionTitle = (state: AppShellState): string =>
  state.screen === 'main-menu' && state.senaryActionLabel === 'New World'
    ? isFirstStartMainMenuState(state)
      ? resolveFirstStartMainMenuFreshWorldTitle()
      : resolvePausedMainMenuFreshWorldTitle()
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
      'Jump or climb up: W, Up Arrow, or Space; descend ropes: S or Down Arrow; double tap and hold S or Down Arrow on a rope to drop to the bottom; jump off ropes: Jump plus Left or Right',
      `Session: ${getDesktopReturnToMainMenuHotkeyLabel(shellActionKeybindings)} return to main menu; ${getDesktopResumeWorldHotkeyLabel()} resume paused world; ${getDesktopFreshWorldHotkeyLabel()} new world from paused menu`,
      `Camera + shell: middle-drag pan, ${getDesktopRecenterCameraHotkeyLabel(shellActionKeybindings)} recenter, ${getDesktopDebugOverlayHotkeyLabel(shellActionKeybindings)} HUD, ${getDesktopDebugEditControlsHotkeyLabel(shellActionKeybindings)} edit panel, ${getDesktopDebugEditOverlaysHotkeyLabel(shellActionKeybindings)} edit overlays, ${getDesktopPlayerSpawnMarkerHotkeyLabel(shellActionKeybindings)} spawn marker`,
      `Hotbar: 1-0 select slots while the full Debug Edit panel is hidden, click a slot, click Left or Right to reorder the selected slot, press ${getMoveSelectedHotbarSlotLeftShortcutLabel()} or ${getMoveSelectedHotbarSlotRightShortcutLabel()} to move it from the keyboard, click Drop 1 or Drop, press ${getDropOneSelectedHotbarItemShortcutLabel()} to drop one item, or press ${getDropSelectedHotbarStackShortcutLabel()} to drop the selected stack`,
      'Build: left-click an empty tile with a solid neighbor while the full Debug Edit panel is hidden',
      `Brush + tools: 1-0 brush slots while the full Debug Edit panel is open, [ and ] cycle brush, Esc cancel armed tools`,
      'History: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo'
    ]
  },
  {
    title: 'Touch',
    lines: [
      'Player: hold Left, Down, Right, and Jump on the touch player pad; double tap and hold Down on a rope to drop to the bottom; combine Jump with Left or Right to jump off ropes',
      'Hotbar: tap a bottom hotbar slot to select it, then tap Left or Right to reorder that slot or tap Drop 1 or Drop to toss items',
      'Build: tap an empty tile with a solid neighbor while the full Debug Edit panel is hidden',
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

interface PausedMainMenuSectionLandmarkTarget {
  sectionId: string;
  headingId: string;
}

type PausedMainMenuSectionAnchorKey = keyof typeof PAUSED_MAIN_MENU_SECTION_LANDMARK_TARGETS;
type PausedMainMenuPageId = 'overview' | 'world-save' | 'shell';

const PAUSED_MAIN_MENU_SECTION_LANDMARK_TARGETS = {
  overview: {
    sectionId: 'app-shell-paused-overview-section',
    headingId: 'app-shell-paused-overview-title'
  },
  worldSave: {
    sectionId: 'app-shell-paused-world-save-section',
    headingId: 'app-shell-paused-world-save-title'
  },
  shell: {
    sectionId: 'app-shell-paused-shell-section',
    headingId: 'app-shell-paused-shell-title'
  },
  recentActivity: {
    sectionId: 'app-shell-paused-recent-activity-section',
    headingId: 'app-shell-paused-recent-activity-title'
  }
} as const satisfies Record<string, PausedMainMenuSectionLandmarkTarget>;

const PAUSED_MAIN_MENU_SECTION_ANCHOR_ORDER = [
  'overview',
  'worldSave',
  'shell',
  'recentActivity'
] as const satisfies readonly PausedMainMenuSectionAnchorKey[];

const DEFAULT_PAUSED_MAIN_MENU_PAGE_ID: PausedMainMenuPageId = 'overview';
const PAUSED_MAIN_MENU_WORLD_SAVE_TILE_TITLE = 'World Save';
const PAUSED_MAIN_MENU_WORLD_SAVE_TILE_OPEN_TITLE =
  'Open the paused World Save page for downloads, imports, fresh-world replacement, and browser-resume controls.';
const PAUSED_MAIN_MENU_SHELL_TILE_TITLE = 'Shell';
const PAUSED_MAIN_MENU_SHELL_TILE_OPEN_TITLE =
  'Open the paused Shell page for shell layout, gameplay, telemetry, hotkey, and shell-profile tools.';
const PAUSED_MAIN_MENU_WORLD_SAVE_BACK_LABEL = 'Back to Overview';
const PAUSED_MAIN_MENU_WORLD_SAVE_BACK_TITLE = 'Return to the paused Overview page.';
const PAUSED_MAIN_MENU_SHELL_BACK_LABEL = 'Back to Overview';
const PAUSED_MAIN_MENU_SHELL_BACK_TITLE = 'Return to the paused Overview page.';
const PAUSED_MAIN_MENU_TOP_JUMP_LINK_TEXT = 'Jump to Overview';
const PAUSED_MAIN_MENU_TOP_JUMP_LINK_TITLE =
  'Move focus back to the Overview section at the top of the paused dashboard.';

const applyPausedMainMenuSectionLandmarkTarget = (
  sectionElement: HTMLElement,
  headingElement: HTMLHeadingElement,
  target: PausedMainMenuSectionLandmarkTarget
): void => {
  sectionElement.setAttribute('id', target.sectionId);
  sectionElement.setAttribute('role', 'region');
  sectionElement.setAttribute('aria-labelledby', target.headingId);
  sectionElement.setAttribute('tabindex', '-1');
  headingElement.setAttribute('id', target.headingId);
};

const focusPausedMainMenuSectionAnchor = (sectionElement: HTMLElement): void => {
  sectionElement.focus();
  sectionElement.scrollIntoView?.({
    block: 'start'
  });
};

const createPausedMainMenuTopJumpLink = (overviewSection: HTMLElement): HTMLAnchorElement => {
  const jumpLink = document.createElement('a');
  jumpLink.className = 'app-shell__section-top-jump-link';
  jumpLink.textContent = PAUSED_MAIN_MENU_TOP_JUMP_LINK_TEXT;
  jumpLink.title = PAUSED_MAIN_MENU_TOP_JUMP_LINK_TITLE;
  jumpLink.setAttribute('href', `#${PAUSED_MAIN_MENU_SECTION_LANDMARK_TARGETS.overview.sectionId}`);
  jumpLink.addEventListener('click', (event) => {
    event.preventDefault();
    focusPausedMainMenuSectionAnchor(overviewSection);
  });
  return jumpLink;
};

interface MenuSectionElementOptions {
  showStatusBadge?: boolean;
}

const resolveMenuSectionStatusBadgeText = (
  section: AppShellMenuSection,
  options: MenuSectionElementOptions
): string | null => {
  if (options.showStatusBadge !== true) {
    return null;
  }

  switch (section.tone ?? 'default') {
    case 'default':
      return 'Info';
    case 'accent':
      return 'Success';
    case 'warning':
      return 'Attention';
  }
};

const createMenuSectionElement = (
  section: AppShellMenuSection,
  options: MenuSectionElementOptions = {}
): HTMLElement => {
  const sectionElement = document.createElement('section');
  sectionElement.className = 'app-shell__menu-section';
  sectionElement.setAttribute('data-tone', section.tone ?? 'default');

  const headingRow = document.createElement('div');
  headingRow.className = 'app-shell__menu-section-heading';
  sectionElement.append(headingRow);

  const heading = document.createElement('h3');
  heading.className = 'app-shell__menu-section-title';
  heading.textContent = section.title;
  headingRow.append(heading);

  const statusBadgeText = resolveMenuSectionStatusBadgeText(section, options);
  if (statusBadgeText !== null) {
    const statusBadge = document.createElement('span');
    statusBadge.className = 'app-shell__menu-section-status-badge';
    statusBadge.setAttribute('data-tone', section.tone ?? 'default');
    statusBadge.textContent = statusBadgeText;
    headingRow.append(statusBadge);
  }

  if (section.lines.length > 0) {
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
    sectionElement.append(createMenuSectionMetadataElement(metadataRows));
  }

  const detailGroups = section.detailGroups ?? [];
  if (detailGroups.length > 0) {
    sectionElement.append(createMenuSectionDetailGroupsElement(detailGroups));
  }

  return sectionElement;
};

const createMenuSectionMetadataElement = (
  metadataRows: readonly AppShellMenuSectionMetadataRow[]
): HTMLDListElement => {
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

      const valueText = document.createElement('span');
      valueText.className = 'app-shell__menu-section-metadata-value-text';
      valueText.textContent = row.value;
      value.append(valueText);

      if (row.badge !== undefined) {
        const badge = document.createElement('span');
        badge.className = 'app-shell__menu-section-metadata-status-badge';
        badge.dataset.tone = row.badge.tone ?? 'default';
        badge.textContent = row.badge.text;
        value.append(badge);
      }

      rowElement.append(value);

      return rowElement;
    })
  );

  return metadata;
};

const createPausedMainMenuShellTelemetryCollectionElement = (
  collection: PausedMainMenuShellTelemetryCollectionViewModel,
  onToggleCollection: () => void,
  onToggleType: (typeId: WorldSessionTelemetryTypeId) => void
): HTMLElement => {
  const collectionElement = document.createElement('section');
  collectionElement.className = 'app-shell__shell-telemetry-collection';
  collectionElement.dataset.enabled = collection.enabled ? 'true' : 'false';

  const header = document.createElement('div');
  header.className = 'app-shell__shell-telemetry-collection-header';
  collectionElement.append(header);

  const copy = document.createElement('div');
  copy.className = 'app-shell__shell-telemetry-collection-copy';
  header.append(copy);

  const title = document.createElement('h3');
  title.className = 'app-shell__shell-telemetry-collection-title';
  title.textContent = collection.label;
  copy.append(title);

  const description = document.createElement('p');
  description.className = 'app-shell__shell-telemetry-collection-description';
  description.textContent = collection.description;
  copy.append(description);

  const collectionButton = document.createElement('button');
  collectionButton.type = 'button';
  collectionButton.className = 'app-shell__shell-telemetry-button app-shell__shell-telemetry-button--collection';
  collectionButton.textContent = collection.toggleLabel;
  collectionButton.title = collection.toggleTitle;
  collectionButton.setAttribute('aria-pressed', collection.enabled ? 'true' : 'false');
  collectionButton.addEventListener('click', onToggleCollection);
  installPointerClickFocusRelease(collectionButton);
  header.append(collectionButton);

  const metadata = createMenuSectionMetadataElement(collection.metadataRows);
  metadata.classList.add('app-shell__shell-telemetry-collection-metadata');
  collectionElement.append(metadata);

  const typeButtons = document.createElement('div');
  typeButtons.className = 'app-shell__shell-telemetry-types';
  typeButtons.replaceChildren(
    ...collection.types.map((type) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'app-shell__shell-telemetry-button';
      button.textContent = type.buttonLabel;
      button.title = type.buttonTitle;
      button.setAttribute('aria-pressed', type.enabled ? 'true' : 'false');
      button.dataset.enabled = type.enabled ? 'true' : 'false';
      button.addEventListener('click', () => {
        onToggleType(type.id);
      });
      installPointerClickFocusRelease(button);
      return button;
    })
  );
  collectionElement.append(typeButtons);

  return collectionElement;
};

const createMenuSectionDetailGroupsElement = (
  detailGroups: readonly AppShellMenuSectionDetailGroup[]
): HTMLDivElement => {
  const groups = document.createElement('div');
  groups.className = 'app-shell__menu-section-detail-groups';
  groups.replaceChildren(
    ...detailGroups.map((group) => {
      const groupElement = document.createElement('section');
      groupElement.className = 'app-shell__menu-section-detail-group';

      const title = document.createElement('h4');
      title.className = 'app-shell__menu-section-group-title';
      title.textContent = group.title;
      groupElement.append(title);

      if (group.items.length > 0) {
        const list = document.createElement('ul');
        list.className = 'app-shell__menu-section-group-list';
        list.replaceChildren(
          ...group.items.map((item) => {
            const listItem = document.createElement('li');
            listItem.className = 'app-shell__menu-section-group-item';
            listItem.textContent = item;
            return listItem;
          })
        );
        groupElement.append(list);
      } else if (group.emptyText !== undefined) {
        const emptyState = document.createElement('span');
        emptyState.className =
          'app-shell__menu-section-group-empty app-shell__menu-section-group-empty-badge';
        emptyState.textContent = group.emptyText;
        groupElement.append(emptyState);
      }

      return groupElement;
    })
  );

  return groups;
};

interface MenuSectionActionStatusBadgeContent {
  text: string;
  tone: AppShellMenuSectionTone;
}

interface MenuSectionActionHeadingContent {
  titleText: string;
  statusBadge: MenuSectionActionStatusBadgeContent | null;
  shortcutBadgeText: string | null;
  affordanceBadgeText: string | null;
}

interface MenuSectionActionButtonOptions {
  busy?: boolean;
  disabled?: boolean;
  headingStatusBadge?: MenuSectionActionStatusBadgeContent | null;
}

const PAUSED_MAIN_MENU_SECTION_ACTION_SHORTCUT_BADGES = new Map<string, string>([
  [
    `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
    getDesktopResumeWorldHotkeyLabel()
  ],
  [`New World (${getDesktopFreshWorldHotkeyLabel()})`, getDesktopFreshWorldHotkeyLabel()]
]);

const resolveMenuSectionActionAffordanceBadgeText = (
  section: AppShellMenuSection,
  className: string
): string | null => {
  if (className !== 'app-shell__world-save-action') {
    return null;
  }

  const shortcutMetadataRow =
    section.metadataRows?.find((row) => row.label === 'Shortcut') ?? null;
  return shortcutMetadataRow?.value === 'Button only' ? 'Button only' : null;
};

const resolveMenuSectionActionStatusBadge = (
  section: AppShellMenuSection,
  className: string,
  options: MenuSectionActionButtonOptions = {}
): MenuSectionActionStatusBadgeContent | null => {
  const headingStatusBadge = options.headingStatusBadge ?? null;
  if (headingStatusBadge !== null) {
    return headingStatusBadge;
  }

  if (className !== 'app-shell__danger-zone-action') {
    return null;
  }

  return {
    text: 'Warning',
    tone: section.tone ?? 'warning'
  };
};

const resolveMenuSectionActionHeadingContent = (
  section: AppShellMenuSection,
  className: string,
  options: MenuSectionActionButtonOptions = {}
): MenuSectionActionHeadingContent => {
  const title = section.title;
  const statusBadge = resolveMenuSectionActionStatusBadge(section, className, options);
  const shortcutBadgeText = PAUSED_MAIN_MENU_SECTION_ACTION_SHORTCUT_BADGES.get(title) ?? null;
  if (shortcutBadgeText === null) {
    return {
      titleText: title,
      statusBadge,
      shortcutBadgeText: null,
      affordanceBadgeText: resolveMenuSectionActionAffordanceBadgeText(section, className)
    };
  }

  const shortcutSuffix = ` (${shortcutBadgeText})`;
  return {
    titleText: title.endsWith(shortcutSuffix) ? title.slice(0, -shortcutSuffix.length) : title,
    statusBadge,
    shortcutBadgeText,
    affordanceBadgeText: resolveMenuSectionActionAffordanceBadgeText(section, className)
  };
};

const appendMenuSectionActionContent = (
  actionElement: HTMLElement,
  section: AppShellMenuSection,
  className: string,
  options: MenuSectionActionButtonOptions = {}
): void => {
  const headingContent = resolveMenuSectionActionHeadingContent(section, className, options);
  const headingRow = document.createElement('div');
  headingRow.className = 'app-shell__section-action-heading';
  actionElement.append(headingRow);

  const heading = document.createElement('h3');
  heading.className = `${className}-title`;
  heading.textContent = headingContent.titleText;
  headingRow.append(heading);

  const hasBadgeGroup =
    headingContent.statusBadge !== null ||
    headingContent.shortcutBadgeText !== null ||
    headingContent.affordanceBadgeText !== null;

  if (hasBadgeGroup) {
    const badgeGroup = document.createElement('div');
    badgeGroup.className = 'app-shell__section-action-badges';
    headingRow.append(badgeGroup);

    if (headingContent.statusBadge !== null) {
      const statusBadge = document.createElement('span');
      statusBadge.className = 'app-shell__section-action-status-badge';
      statusBadge.setAttribute('data-tone', headingContent.statusBadge.tone);
      statusBadge.textContent = headingContent.statusBadge.text;
      badgeGroup.append(statusBadge);
    }

    if (headingContent.shortcutBadgeText !== null) {
      const shortcutBadge = document.createElement('span');
      shortcutBadge.className = 'app-shell__section-action-shortcut-badge';
      shortcutBadge.textContent = headingContent.shortcutBadgeText;
      badgeGroup.append(shortcutBadge);
    }

    if (headingContent.affordanceBadgeText !== null) {
      const affordanceBadge = document.createElement('span');
      affordanceBadge.className = 'app-shell__section-action-affordance-badge';
      affordanceBadge.textContent = headingContent.affordanceBadgeText;
      badgeGroup.append(affordanceBadge);
    }
  }

  if (section.lines.length > 0) {
    const lines = document.createElement('div');
    lines.className = `${className}-lines`;
    lines.replaceChildren(
      ...section.lines.map((line) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        return paragraph;
      })
    );
    actionElement.append(lines);
  }

  const metadataRows = section.metadataRows ?? [];
  if (metadataRows.length > 0) {
    const metadata = createMenuSectionMetadataElement(metadataRows);
    metadata.classList.add(`${className}-metadata`);
    actionElement.append(metadata);
  }
};

const createMenuSectionActionButton = (
  section: AppShellMenuSection,
  className: string,
  title: string,
  onClick: () => void,
  options: MenuSectionActionButtonOptions = {}
): HTMLButtonElement => {
  const actionButton = document.createElement('button');
  actionButton.type = 'button';
  actionButton.className = `app-shell__section-action-button ${className}`;
  actionButton.title = title;
  actionButton.disabled = options.disabled === true;
  actionButton.setAttribute('data-tone', section.tone ?? 'default');
  actionButton.setAttribute('data-busy', options.busy === true ? 'true' : 'false');
  actionButton.setAttribute('aria-busy', options.busy === true ? 'true' : 'false');
  actionButton.addEventListener('click', onClick);
  installPointerClickFocusRelease(actionButton);
  appendMenuSectionActionContent(actionButton, section, className, options);
  return actionButton;
};

const createOverviewActionButton = (
  section: AppShellMenuSection,
  title: string,
  onClick: () => void
): HTMLButtonElement =>
  createMenuSectionActionButton(section, 'app-shell__overview-action', title, onClick);

const createWorldSaveActionButton = (
  section: AppShellMenuSection,
  title: string,
  onClick: () => void,
  options: MenuSectionActionButtonOptions = {}
): HTMLButtonElement =>
  createMenuSectionActionButton(section, 'app-shell__world-save-action', title, onClick, options);

const createBusyPausedMainMenuImportWorldSaveActionSection = (
  section: AppShellMenuSection
): AppShellMenuSection => ({
  ...section,
  metadataRows: [
    {
      label: 'Status',
      value: 'Waiting for file picker'
    },
    ...(section.metadataRows ?? [])
  ],
  tone: 'accent'
});

const PAUSED_MAIN_MENU_BUSY_IMPORT_WORLD_SAVE_HEADING_BADGE = {
  text: 'Busy',
  tone: 'accent'
} as const satisfies MenuSectionActionStatusBadgeContent;

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
        pausedMainMenuSections: null,
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
      const pausedMainMenuVisible = isPausedMainMenuState(state);
      return {
        screen: 'main-menu',
        overlayVisible: true,
        chromeVisible: false,
        stageLabel: 'Main Menu',
        title: 'Deep Factory',
        statusText: state.statusText ?? firstLaunchMainMenuState.statusText ?? '',
        detailLines: state.detailLines ?? firstLaunchMainMenuState.detailLines ?? [],
        menuSections: state.menuSections ?? firstLaunchMainMenuState.menuSections ?? [],
        pausedMainMenuSections: state.pausedMainMenuSections ?? null,
        primaryActionLabel: pausedMainMenuVisible
          ? null
          : resolveMainMenuPrimaryActionLabel(
              state.primaryActionLabel ?? firstLaunchMainMenuState.primaryActionLabel ?? 'Enter World'
            ),
        secondaryActionLabel:
          pausedMainMenuVisible ||
          (state.secondaryActionLabel ?? firstLaunchMainMenuState.secondaryActionLabel) == null
            ? null
            : resolveMainMenuSecondaryActionLabel(
                state.secondaryActionLabel ?? firstLaunchMainMenuState.secondaryActionLabel ?? ''
              ),
        tertiaryActionLabel:
          pausedMainMenuVisible ||
          (state.tertiaryActionLabel ?? firstLaunchMainMenuState.tertiaryActionLabel) == null
            ? null
            : resolveMainMenuTertiaryActionLabel(
                state.tertiaryActionLabel ?? firstLaunchMainMenuState.tertiaryActionLabel ?? ''
              ),
        quaternaryActionLabel:
          pausedMainMenuVisible ||
          (state.quaternaryActionLabel ?? firstLaunchMainMenuState.quaternaryActionLabel) == null
            ? null
            : resolveMainMenuQuaternaryActionLabel(
                state.quaternaryActionLabel ??
                  firstLaunchMainMenuState.quaternaryActionLabel ??
                  ''
              ),
        quinaryActionLabel:
          pausedMainMenuVisible ||
          (state.quinaryActionLabel ?? firstLaunchMainMenuState.quinaryActionLabel) == null
            ? null
            : resolveMainMenuQuinaryActionLabel(
                state.quinaryActionLabel ?? firstLaunchMainMenuState.quinaryActionLabel ?? ''
              ),
        senaryActionLabel:
          pausedMainMenuVisible ||
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
        pausedMainMenuSections: null,
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
  private overlayPanel: HTMLElement;
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
  private pausedMainMenuDashboard: HTMLDivElement;
  private pausedMainMenuPrimarySections: HTMLDivElement;
  private pausedMainMenuSecondarySections: HTMLDivElement;
  private overviewSection: HTMLElement;
  private overviewBody: HTMLDivElement;
  private overviewNavigation: HTMLDivElement;
  private worldSaveNavigationTile: HTMLButtonElement;
  private worldSaveNavigationSummary: HTMLParagraphElement;
  private worldSaveNavigationMetadata: HTMLDListElement;
  private shellNavigationTile: HTMLButtonElement;
  private shellNavigationSummary: HTMLParagraphElement;
  private shellNavigationMetadata: HTMLDListElement;
  private worldSaveSection: HTMLElement;
  private worldSaveBackButton: HTMLButtonElement;
  private worldSaveSummary: HTMLParagraphElement;
  private worldSaveMetadata: HTMLDListElement;
  private worldSaveActions: HTMLDivElement;
  private menuSections: HTMLDivElement;
  private recentActivitySection: HTMLElement;
  private recentActivitySummary: HTMLParagraphElement;
  private recentActivityBody: HTMLDivElement;
  private recentActivityTopJumpLink: HTMLAnchorElement;
  private shellSection: HTMLElement;
  private shellBackButton: HTMLButtonElement;
  private shellSummary: HTMLParagraphElement;
  private shellMetadata: HTMLDListElement;
  private shellBody: HTMLDivElement;
  private shellActionKeybindingEditor: HTMLDivElement;
  private shellActionKeybindingEditorMetadata: HTMLDListElement;
  private shellGameplayControls: HTMLDivElement;
  private shellGameplaySummary: HTMLParagraphElement;
  private shellGameplayMetadata: HTMLDListElement;
  private shellGameplayToggleButton: HTMLButtonElement;
  private shellTelemetryControls: HTMLDivElement;
  private shellTelemetrySummary: HTMLParagraphElement;
  private shellTelemetryMetadata: HTMLDListElement;
  private shellTelemetryResetButton: HTMLButtonElement;
  private shellTelemetryCollections: HTMLDivElement;
  private shellActionKeybindingInputs = new Map<
    InWorldShellActionKeybindingActionType,
    HTMLInputElement
  >();
  private shellActionKeybindingEditorActions: HTMLDivElement;
  private shellProfilePreviewDetails: HTMLDivElement;
  private resetShellTogglesButton: HTMLButtonElement;
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
  private onImportWorldSave: (screen: AppShellScreen) => Promise<unknown> | unknown;
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
  private onToggleShellTelemetryCollection: (
    screen: AppShellScreen,
    collectionId: WorldSessionTelemetryCollectionId
  ) => void;
  private onToggleShellTelemetryType: (
    screen: AppShellScreen,
    typeId: WorldSessionTelemetryTypeId
  ) => void;
  private onResetShellTelemetry: (screen: AppShellScreen) => void;
  private onTogglePeacefulMode: (screen: AppShellScreen) => void;
  private currentShellActionKeybindingEditorStatus: AppShellShellActionKeybindingEditorStatus | null =
    null;
  private pausedMainMenuActivePage: PausedMainMenuPageId = DEFAULT_PAUSED_MAIN_MENU_PAGE_ID;
  private pausedMainMenuImportWorldSaveBusy = false;
  private pausedMainMenuImportShellProfileBusy = false;
  private pausedMainMenuApplyShellProfileBusy = false;
  private currentState: AppShellState = createDefaultBootShellState();

  constructor(container: HTMLElement, options: AppShellOptions = {}) {
    this.onPrimaryAction = options.onPrimaryAction ?? (() => {});
    this.onSecondaryAction = options.onSecondaryAction ?? (() => {});
    this.onTertiaryAction = options.onTertiaryAction ?? (() => {});
    this.onImportWorldSave = options.onImportWorldSave ?? ((screen) => this.onTertiaryAction(screen));
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
    this.onToggleShellTelemetryCollection =
      options.onToggleShellTelemetryCollection ?? (() => {});
    this.onToggleShellTelemetryType = options.onToggleShellTelemetryType ?? (() => {});
    this.onResetShellTelemetry = options.onResetShellTelemetry ?? (() => {});
    this.onTogglePeacefulMode = options.onTogglePeacefulMode ?? (() => {});

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

    this.overlayPanel = document.createElement('section');
    this.overlayPanel.className = 'app-shell__panel';
    this.overlay.append(this.overlayPanel);

    this.stageLabel = document.createElement('span');
    this.stageLabel.className = 'app-shell__stage';
    this.overlayPanel.append(this.stageLabel);

    this.title = document.createElement('h1');
    this.title.className = 'app-shell__title';
    this.overlayPanel.append(this.title);

    this.status = document.createElement('p');
    this.status.className = 'app-shell__status';
    this.overlayPanel.append(this.status);

    this.pausedMainMenuDashboard = document.createElement('div');
    this.pausedMainMenuDashboard.className = 'app-shell__paused-dashboard';
    this.overlayPanel.append(this.pausedMainMenuDashboard);

    this.pausedMainMenuPrimarySections = document.createElement('div');
    this.pausedMainMenuPrimarySections.className = 'app-shell__paused-primary';
    this.pausedMainMenuDashboard.append(this.pausedMainMenuPrimarySections);

    this.overviewSection = document.createElement('section');
    this.overviewSection.className = 'app-shell__overview';
    this.pausedMainMenuPrimarySections.append(this.overviewSection);

    const overviewHeader = document.createElement('div');
    overviewHeader.className = 'app-shell__overview-header';
    this.overviewSection.append(overviewHeader);

    const overviewTitle = document.createElement('h2');
    overviewTitle.className = 'app-shell__overview-title';
    overviewTitle.textContent = 'Overview';
    overviewHeader.append(overviewTitle);
    applyPausedMainMenuSectionLandmarkTarget(
      this.overviewSection,
      overviewTitle,
      PAUSED_MAIN_MENU_SECTION_LANDMARK_TARGETS.overview
    );

    this.overviewBody = document.createElement('div');
    this.overviewBody.className = 'app-shell__overview-body';
    this.overviewSection.append(this.overviewBody);

    this.overviewNavigation = document.createElement('div');
    this.overviewNavigation.className = 'app-shell__paused-navigation';
    this.overviewSection.append(this.overviewNavigation);

    this.worldSaveNavigationTile = document.createElement('button');
    this.worldSaveNavigationTile.type = 'button';
    this.worldSaveNavigationTile.className = 'app-shell__paused-navigation-tile';
    this.worldSaveNavigationTile.title = PAUSED_MAIN_MENU_WORLD_SAVE_TILE_OPEN_TITLE;
    this.worldSaveNavigationTile.addEventListener('click', (event) =>
      this.setPausedMainMenuPage(
        'world-save',
        !shouldReleaseButtonFocusAfterClick(event.detail)
      )
    );
    installPointerClickFocusRelease(this.worldSaveNavigationTile);
    this.overviewNavigation.append(this.worldSaveNavigationTile);

    const worldSaveNavigationHeading = document.createElement('div');
    worldSaveNavigationHeading.className = 'app-shell__paused-navigation-tile-heading';
    this.worldSaveNavigationTile.append(worldSaveNavigationHeading);

    const worldSaveNavigationTitle = document.createElement('h3');
    worldSaveNavigationTitle.className = 'app-shell__paused-navigation-tile-title';
    worldSaveNavigationTitle.textContent = PAUSED_MAIN_MENU_WORLD_SAVE_TILE_TITLE;
    worldSaveNavigationHeading.append(worldSaveNavigationTitle);

    this.worldSaveNavigationSummary = document.createElement('p');
    this.worldSaveNavigationSummary.className = 'app-shell__paused-navigation-tile-summary';
    this.worldSaveNavigationTile.append(this.worldSaveNavigationSummary);

    this.worldSaveNavigationMetadata = document.createElement('dl');
    this.worldSaveNavigationMetadata.className =
      'app-shell__menu-section-metadata app-shell__paused-navigation-tile-metadata';
    this.worldSaveNavigationTile.append(this.worldSaveNavigationMetadata);

    this.shellNavigationTile = document.createElement('button');
    this.shellNavigationTile.type = 'button';
    this.shellNavigationTile.className = 'app-shell__paused-navigation-tile';
    this.shellNavigationTile.title = PAUSED_MAIN_MENU_SHELL_TILE_OPEN_TITLE;
    this.shellNavigationTile.addEventListener('click', (event) =>
      this.setPausedMainMenuPage(
        'shell',
        !shouldReleaseButtonFocusAfterClick(event.detail)
      )
    );
    installPointerClickFocusRelease(this.shellNavigationTile);
    this.overviewNavigation.append(this.shellNavigationTile);

    const shellNavigationHeading = document.createElement('div');
    shellNavigationHeading.className = 'app-shell__paused-navigation-tile-heading';
    this.shellNavigationTile.append(shellNavigationHeading);

    const shellNavigationTitle = document.createElement('h3');
    shellNavigationTitle.className = 'app-shell__paused-navigation-tile-title';
    shellNavigationTitle.textContent = PAUSED_MAIN_MENU_SHELL_TILE_TITLE;
    shellNavigationHeading.append(shellNavigationTitle);

    this.shellNavigationSummary = document.createElement('p');
    this.shellNavigationSummary.className = 'app-shell__paused-navigation-tile-summary';
    this.shellNavigationTile.append(this.shellNavigationSummary);

    this.shellNavigationMetadata = document.createElement('dl');
    this.shellNavigationMetadata.className =
      'app-shell__menu-section-metadata app-shell__paused-navigation-tile-metadata';
    this.shellNavigationTile.append(this.shellNavigationMetadata);

    this.worldSaveSection = document.createElement('section');
    this.worldSaveSection.className = 'app-shell__world-save';
    this.pausedMainMenuPrimarySections.append(this.worldSaveSection);

    const worldSaveHeader = document.createElement('div');
    worldSaveHeader.className = 'app-shell__world-save-header';
    this.worldSaveSection.append(worldSaveHeader);

    const worldSaveCopy = document.createElement('div');
    worldSaveCopy.className = 'app-shell__world-save-copy';
    worldSaveHeader.append(worldSaveCopy);

    const worldSaveTitle = document.createElement('h2');
    worldSaveTitle.className = 'app-shell__world-save-title';
    worldSaveTitle.textContent = 'World Save';
    worldSaveCopy.append(worldSaveTitle);
    applyPausedMainMenuSectionLandmarkTarget(
      this.worldSaveSection,
      worldSaveTitle,
      PAUSED_MAIN_MENU_SECTION_LANDMARK_TARGETS.worldSave
    );

    this.worldSaveBackButton = document.createElement('button');
    this.worldSaveBackButton.type = 'button';
    this.worldSaveBackButton.className = 'app-shell__submenu-back';
    this.worldSaveBackButton.textContent = PAUSED_MAIN_MENU_WORLD_SAVE_BACK_LABEL;
    this.worldSaveBackButton.title = PAUSED_MAIN_MENU_WORLD_SAVE_BACK_TITLE;
    this.worldSaveBackButton.addEventListener('click', (event) =>
      this.setPausedMainMenuPage(
        'overview',
        !shouldReleaseButtonFocusAfterClick(event.detail)
      )
    );
    installPointerClickFocusRelease(this.worldSaveBackButton);
    worldSaveHeader.append(this.worldSaveBackButton);

    this.worldSaveSummary = document.createElement('p');
    this.worldSaveSummary.className = 'app-shell__world-save-summary';
    worldSaveCopy.append(this.worldSaveSummary);

    const worldSaveBody = document.createElement('div');
    worldSaveBody.className = 'app-shell__world-save-body';
    this.worldSaveSection.append(worldSaveBody);

    this.worldSaveMetadata = document.createElement('dl');
    this.worldSaveMetadata.className = 'app-shell__menu-section-metadata app-shell__world-save-metadata';
    worldSaveBody.append(this.worldSaveMetadata);

    this.worldSaveActions = document.createElement('div');
    this.worldSaveActions.className = 'app-shell__world-save-actions';
    worldSaveBody.append(this.worldSaveActions);

    this.shellSection = document.createElement('section');
    this.shellSection.className = 'app-shell__shell';
    this.pausedMainMenuPrimarySections.append(this.shellSection);

    const shellHeader = document.createElement('div');
    shellHeader.className = 'app-shell__shell-header';
    this.shellSection.append(shellHeader);

    const shellCopy = document.createElement('div');
    shellCopy.className = 'app-shell__shell-copy';
    shellHeader.append(shellCopy);

    const shellTitle = document.createElement('h2');
    shellTitle.className = 'app-shell__shell-title';
    shellTitle.textContent = 'Shell';
    shellCopy.append(shellTitle);
    applyPausedMainMenuSectionLandmarkTarget(
      this.shellSection,
      shellTitle,
      PAUSED_MAIN_MENU_SECTION_LANDMARK_TARGETS.shell
    );

    this.shellBackButton = document.createElement('button');
    this.shellBackButton.type = 'button';
    this.shellBackButton.className = 'app-shell__submenu-back';
    this.shellBackButton.textContent = PAUSED_MAIN_MENU_SHELL_BACK_LABEL;
    this.shellBackButton.title = PAUSED_MAIN_MENU_SHELL_BACK_TITLE;
    this.shellBackButton.addEventListener('click', (event) =>
      this.setPausedMainMenuPage(
        'overview',
        !shouldReleaseButtonFocusAfterClick(event.detail)
      )
    );
    installPointerClickFocusRelease(this.shellBackButton);
    shellHeader.append(this.shellBackButton);

    this.shellSummary = document.createElement('p');
    this.shellSummary.className = 'app-shell__shell-summary';
    shellCopy.append(this.shellSummary);

    this.shellBody = document.createElement('div');
    this.shellBody.className = 'app-shell__shell-body';
    this.shellSection.append(this.shellBody);

    this.shellMetadata = document.createElement('dl');
    this.shellMetadata.className = 'app-shell__menu-section-metadata app-shell__shell-metadata';
    this.shellBody.append(this.shellMetadata);

    this.pausedMainMenuSecondarySections = document.createElement('div');
    this.pausedMainMenuSecondarySections.className = 'app-shell__paused-secondary';
    this.pausedMainMenuDashboard.append(this.pausedMainMenuSecondarySections);

    this.shellActionKeybindingEditor = document.createElement('div');
    this.shellActionKeybindingEditor.className = 'app-shell__shell-keybindings';
    this.shellBody.append(this.shellActionKeybindingEditor);

    const shellActionKeybindingEditorTitle = document.createElement('h2');
    shellActionKeybindingEditorTitle.className = 'app-shell__shell-keybindings-title';
    shellActionKeybindingEditorTitle.textContent = 'Shell Hotkeys';
    this.shellActionKeybindingEditor.append(shellActionKeybindingEditorTitle);

    this.shellActionKeybindingEditorMetadata = createMenuSectionMetadataElement(
      createPausedMainMenuShellActionKeybindingEditorMetadataRows()
    );
    this.shellActionKeybindingEditorMetadata.classList.add('app-shell__shell-keybindings-metadata');
    this.shellActionKeybindingEditor.append(this.shellActionKeybindingEditorMetadata);

    this.shellProfilePreviewDetails = document.createElement('div');
    this.shellProfilePreviewDetails.className = 'app-shell__shell-preview';
    this.shellActionKeybindingEditor.append(this.shellProfilePreviewDetails);

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

    this.resetShellTogglesButton = document.createElement('button');
    this.resetShellTogglesButton.type = 'button';
    this.resetShellTogglesButton.className = 'app-shell__shell-keybindings-button';
    this.resetShellTogglesButton.textContent = 'Reset Shell Toggles';
    this.resetShellTogglesButton.title = resolvePausedMainMenuResetShellTogglesTitle();
    this.resetShellTogglesButton.addEventListener('click', () =>
      this.onQuinaryAction(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.resetShellTogglesButton);
    this.shellActionKeybindingEditorActions.append(this.resetShellTogglesButton);

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

    this.shellGameplayControls = document.createElement('div');
    this.shellGameplayControls.className = 'app-shell__shell-keybindings app-shell__shell-gameplay';
    this.shellBody.append(this.shellGameplayControls);

    const shellGameplayTitle = document.createElement('h2');
    shellGameplayTitle.className = 'app-shell__shell-keybindings-title';
    shellGameplayTitle.textContent = 'Gameplay Controls';
    this.shellGameplayControls.append(shellGameplayTitle);

    this.shellGameplaySummary = document.createElement('p');
    this.shellGameplaySummary.className = 'app-shell__shell-telemetry-summary';
    this.shellGameplayControls.append(this.shellGameplaySummary);

    this.shellGameplayMetadata = document.createElement('dl');
    this.shellGameplayMetadata.className =
      'app-shell__menu-section-metadata app-shell__shell-keybindings-metadata';
    this.shellGameplayControls.append(this.shellGameplayMetadata);

    const shellGameplayActions = document.createElement('div');
    shellGameplayActions.className = 'app-shell__shell-keybindings-actions';
    this.shellGameplayControls.append(shellGameplayActions);

    this.shellGameplayToggleButton = document.createElement('button');
    this.shellGameplayToggleButton.type = 'button';
    this.shellGameplayToggleButton.className = 'app-shell__shell-keybindings-button';
    this.shellGameplayToggleButton.addEventListener('click', () =>
      this.onTogglePeacefulMode(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.shellGameplayToggleButton);
    shellGameplayActions.append(this.shellGameplayToggleButton);

    this.shellTelemetryControls = document.createElement('div');
    this.shellTelemetryControls.className = 'app-shell__shell-keybindings app-shell__shell-telemetry';
    this.shellBody.append(this.shellTelemetryControls);

    const shellTelemetryTitle = document.createElement('h2');
    shellTelemetryTitle.className = 'app-shell__shell-keybindings-title';
    shellTelemetryTitle.textContent = 'Telemetry Controls';
    this.shellTelemetryControls.append(shellTelemetryTitle);

    this.shellTelemetrySummary = document.createElement('p');
    this.shellTelemetrySummary.className = 'app-shell__shell-telemetry-summary';
    this.shellTelemetryControls.append(this.shellTelemetrySummary);

    this.shellTelemetryMetadata = document.createElement('dl');
    this.shellTelemetryMetadata.className =
      'app-shell__menu-section-metadata app-shell__shell-keybindings-metadata';
    this.shellTelemetryControls.append(this.shellTelemetryMetadata);

    const shellTelemetryActions = document.createElement('div');
    shellTelemetryActions.className = 'app-shell__shell-keybindings-actions';
    this.shellTelemetryControls.append(shellTelemetryActions);

    this.shellTelemetryResetButton = document.createElement('button');
    this.shellTelemetryResetButton.type = 'button';
    this.shellTelemetryResetButton.className = 'app-shell__shell-keybindings-button';
    this.shellTelemetryResetButton.textContent = 'Reset Telemetry';
    this.shellTelemetryResetButton.title = resolvePausedMainMenuResetShellTelemetryTitle();
    this.shellTelemetryResetButton.addEventListener('click', () =>
      this.onResetShellTelemetry(this.currentState.screen)
    );
    installPointerClickFocusRelease(this.shellTelemetryResetButton);
    shellTelemetryActions.append(this.shellTelemetryResetButton);

    this.shellTelemetryCollections = document.createElement('div');
    this.shellTelemetryCollections.className = 'app-shell__shell-telemetry-collections';
    this.shellTelemetryControls.append(this.shellTelemetryCollections);

    this.recentActivitySection = document.createElement('section');
    this.recentActivitySection.className = 'app-shell__recent-activity';
    this.pausedMainMenuSecondarySections.append(this.recentActivitySection);

    const recentActivityHeader = document.createElement('div');
    recentActivityHeader.className = 'app-shell__recent-activity-header';
    this.recentActivitySection.append(recentActivityHeader);

    const recentActivityCopy = document.createElement('div');
    recentActivityCopy.className = 'app-shell__recent-activity-copy';
    recentActivityHeader.append(recentActivityCopy);

    const recentActivityTitle = document.createElement('h2');
    recentActivityTitle.className = 'app-shell__recent-activity-title';
    recentActivityTitle.textContent = 'Recent Activity';
    recentActivityCopy.append(recentActivityTitle);
    applyPausedMainMenuSectionLandmarkTarget(
      this.recentActivitySection,
      recentActivityTitle,
      PAUSED_MAIN_MENU_SECTION_LANDMARK_TARGETS.recentActivity
    );

    this.recentActivitySummary = document.createElement('p');
    this.recentActivitySummary.className = 'app-shell__recent-activity-summary';
    recentActivityCopy.append(this.recentActivitySummary);

    this.recentActivityBody = document.createElement('div');
    this.recentActivityBody.className = 'app-shell__recent-activity-body';
    this.recentActivitySection.append(this.recentActivityBody);

    this.recentActivityTopJumpLink = createPausedMainMenuTopJumpLink(this.overviewSection);
    this.recentActivitySection.append(this.recentActivityTopJumpLink);

    this.menuSections = document.createElement('div');
    this.menuSections.className = 'app-shell__menu-sections';
    this.overlayPanel.append(this.menuSections);

    this.detailList = document.createElement('ul');
    this.detailList.className = 'app-shell__detail-list';
    this.overlayPanel.append(this.detailList);

    this.overlayActions = document.createElement('div');
    this.overlayActions.className = 'app-shell__actions';
    this.overlayPanel.append(this.overlayActions);

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

  private syncShellActionKeybindingEditorMetadata(
    worldSessionShellPersistenceAvailable = true
  ): void {
    const metadataRows = createPausedMainMenuShellActionKeybindingEditorMetadataRows(
      worldSessionShellPersistenceAvailable
    );
    this.shellActionKeybindingEditorMetadata.replaceChildren(
      ...createMenuSectionMetadataElement(metadataRows).childNodes
    );
    if (worldSessionShellPersistenceAvailable) {
      delete this.shellActionKeybindingEditorMetadata.dataset.tone;
      return;
    }

    this.shellActionKeybindingEditorMetadata.dataset.tone = 'warning';
  }

  private syncShellTelemetryControls(
    telemetryControls: PausedMainMenuShellTelemetryControlsViewModel | null,
    visible: boolean
  ): void {
    const controlsVisible = visible && telemetryControls !== null;
    this.shellTelemetryControls.hidden = !controlsVisible;
    this.shellTelemetryControls.style.display = resolveAppShellRegionDisplay(
      controlsVisible,
      'grid'
    );
    if (!controlsVisible || telemetryControls === null) {
      this.shellTelemetrySummary.textContent = '';
      this.shellTelemetryMetadata.replaceChildren();
      this.shellTelemetryResetButton.disabled = false;
      this.shellTelemetryCollections.replaceChildren();
      return;
    }

    this.shellTelemetrySummary.textContent = telemetryControls.summaryLine;
    this.shellTelemetryMetadata.replaceChildren(
      ...createMenuSectionMetadataElement(telemetryControls.metadataRows).childNodes
    );
    this.shellTelemetryResetButton.disabled = telemetryControls.resetButtonDisabled;
    this.shellTelemetryCollections.replaceChildren(
      ...telemetryControls.collections.map((collection) =>
        createPausedMainMenuShellTelemetryCollectionElement(
          collection,
          () =>
            this.onToggleShellTelemetryCollection(this.currentState.screen, collection.id),
          (typeId) => this.onToggleShellTelemetryType(this.currentState.screen, typeId)
        )
      )
    );
  }

  private syncShellGameplayControls(
    gameplayControls: PausedMainMenuShellGameplayControlsViewModel | null,
    visible: boolean
  ): void {
    const controlsVisible = visible && gameplayControls !== null;
    this.shellGameplayControls.hidden = !controlsVisible;
    this.shellGameplayControls.style.display = resolveAppShellRegionDisplay(controlsVisible, 'grid');
    if (!controlsVisible || gameplayControls === null) {
      this.shellGameplaySummary.textContent = '';
      this.shellGameplayMetadata.replaceChildren();
      this.shellGameplayToggleButton.textContent = '';
      this.shellGameplayToggleButton.title = '';
      this.shellGameplayToggleButton.setAttribute('aria-pressed', 'false');
      return;
    }

    this.shellGameplaySummary.textContent = gameplayControls.summaryLine;
    this.shellGameplayMetadata.replaceChildren(
      ...createMenuSectionMetadataElement(gameplayControls.metadataRows).childNodes
    );
    this.shellGameplayToggleButton.textContent = gameplayControls.toggleButtonLabel;
    this.shellGameplayToggleButton.title = gameplayControls.toggleButtonTitle;
    this.shellGameplayToggleButton.setAttribute(
      'aria-pressed',
      gameplayControls.toggleButtonPressed ? 'true' : 'false'
    );
  }

  private setShellActionKeybindingEditorStatus(
    status: AppShellShellActionKeybindingEditorStatus | null
  ): void {
    this.currentShellActionKeybindingEditorStatus = status;
    this.shellActionKeybindingEditorStatus.hidden = status === null;
    this.shellActionKeybindingEditorStatus.textContent = status?.text ?? '';
    this.shellActionKeybindingEditorStatus.replaceChildren();
    if (status === null) {
      delete this.shellActionKeybindingEditorStatus.dataset.tone;
      return;
    }

    this.shellActionKeybindingEditorStatus.dataset.tone = status.tone;
    const children: HTMLElement[] = [];
    if (status.badge !== undefined) {
      const badge = document.createElement('span');
      badge.className = 'app-shell__shell-keybindings-status-badge';
      badge.dataset.tone = status.badge.tone ?? status.tone;
      badge.textContent = status.badge.text;
      children.push(badge);
    }

    const text = document.createElement('span');
    text.className = 'app-shell__shell-keybindings-status-text';
    text.textContent = status.text;
    children.push(text);
    this.shellActionKeybindingEditorStatus.replaceChildren(...children);
  }

  private setPausedMainMenuImportWorldSaveBusy(busy: boolean): void {
    if (this.pausedMainMenuImportWorldSaveBusy === busy) {
      return;
    }

    this.pausedMainMenuImportWorldSaveBusy = busy;
    this.setState(this.currentState);
  }

  private setPausedMainMenuImportShellProfileBusy(busy: boolean): void {
    if (this.pausedMainMenuImportShellProfileBusy === busy) {
      return;
    }

    this.pausedMainMenuImportShellProfileBusy = busy;
    this.setState(this.currentState);
  }

  private setPausedMainMenuApplyShellProfileBusy(busy: boolean): void {
    if (this.pausedMainMenuApplyShellProfileBusy === busy) {
      return;
    }

    this.pausedMainMenuApplyShellProfileBusy = busy;
    this.setState(this.currentState);
  }

  private resolvePausedMainMenuPageSection(pageId: PausedMainMenuPageId): HTMLElement {
    switch (pageId) {
      case 'overview':
        return this.overviewSection;
      case 'world-save':
        return this.worldSaveSection;
      case 'shell':
        return this.shellSection;
    }
  }

  private setPausedMainMenuPage(
    pageId: PausedMainMenuPageId,
    preserveSectionFocus = false
  ): void {
    if (!isPausedMainMenuState(this.currentState)) {
      return;
    }

    const pageChanged = this.pausedMainMenuActivePage !== pageId;
    this.pausedMainMenuActivePage = pageId;
    if (pageChanged) {
      this.setState(this.currentState);
    }

    if (preserveSectionFocus) {
      focusPausedMainMenuSectionAnchor(this.resolvePausedMainMenuPageSection(pageId));
    }
  }

  private resolvePausedMainMenuSectionAnchorElement(
    sectionKey: PausedMainMenuSectionAnchorKey
  ): HTMLElement {
    switch (sectionKey) {
      case 'overview':
        return this.overviewSection;
      case 'worldSave':
        return this.worldSaveSection;
      case 'shell':
        return this.shellSection;
      case 'recentActivity':
        return this.recentActivitySection;
    }
  }

  private resolveFocusedPausedMainMenuSectionAnchorKey(): PausedMainMenuSectionAnchorKey | null {
    const activeElement = document.activeElement;
    for (const sectionKey of PAUSED_MAIN_MENU_SECTION_ANCHOR_ORDER) {
      if (activeElement === this.resolvePausedMainMenuSectionAnchorElement(sectionKey)) {
        return sectionKey;
      }
    }

    return null;
  }

  private resolveNearestVisiblePausedMainMenuSectionAnchor(
    sectionKey: PausedMainMenuSectionAnchorKey
  ): HTMLElement | null {
    const sectionIndex = PAUSED_MAIN_MENU_SECTION_ANCHOR_ORDER.indexOf(sectionKey);
    if (sectionIndex < 0) {
      return null;
    }

    for (let offset = 0; offset < PAUSED_MAIN_MENU_SECTION_ANCHOR_ORDER.length; offset += 1) {
      const forwardIndex = sectionIndex + offset;
      if (forwardIndex < PAUSED_MAIN_MENU_SECTION_ANCHOR_ORDER.length) {
        const forwardSection = this.resolvePausedMainMenuSectionAnchorElement(
          PAUSED_MAIN_MENU_SECTION_ANCHOR_ORDER[forwardIndex]
        );
        if (!forwardSection.hidden) {
          return forwardSection;
        }
      }

      if (offset === 0) {
        continue;
      }

      const backwardIndex = sectionIndex - offset;
      if (backwardIndex >= 0) {
        const backwardSection = this.resolvePausedMainMenuSectionAnchorElement(
          PAUSED_MAIN_MENU_SECTION_ANCHOR_ORDER[backwardIndex]
        );
        if (!backwardSection.hidden) {
          return backwardSection;
        }
      }
    }

    return null;
  }

  private restorePausedMainMenuSectionAnchorAfterRecentActivityVisibilityChange(
    focusedSectionKey: PausedMainMenuSectionAnchorKey | null,
    recentActivityVisibilityChanged: boolean
  ): void {
    if (!recentActivityVisibilityChanged || focusedSectionKey === null) {
      return;
    }

    const targetSection = this.resolveNearestVisiblePausedMainMenuSectionAnchor(focusedSectionKey);
    if (targetSection === null) {
      return;
    }

    focusPausedMainMenuSectionAnchor(targetSection);
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

  private async tryImportWorldSave(): Promise<void> {
    if (this.pausedMainMenuImportWorldSaveBusy) {
      return;
    }

    this.setPausedMainMenuImportWorldSaveBusy(true);
    try {
      await this.onImportWorldSave(this.currentState.screen);
    } finally {
      this.setPausedMainMenuImportWorldSaveBusy(false);
    }
  }

  private async tryImportShellProfile(): Promise<void> {
    if (this.pausedMainMenuImportShellProfileBusy) {
      return;
    }

    this.setPausedMainMenuImportShellProfileBusy(true);
    try {
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
    } finally {
      this.setPausedMainMenuImportShellProfileBusy(false);
    }
  }

  private async tryApplyShellProfilePreview(): Promise<void> {
    if (this.pausedMainMenuApplyShellProfileBusy) {
      return;
    }

    this.setPausedMainMenuApplyShellProfileBusy(true);
    try {
      const importResult = await this.onApplyShellProfilePreview(this.currentState.screen);
      this.setShellActionKeybindingEditorStatus(
        resolvePausedMainMenuApplyShellProfileEditorStatus(importResult)
      );
    } finally {
      this.setPausedMainMenuApplyShellProfileBusy(false);
    }
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
    const focusedPausedMainMenuSectionKey = wasPausedMainMenuVisible
      ? this.resolveFocusedPausedMainMenuSectionAnchorKey()
      : null;
    const wasRecentActivityVisible = !this.recentActivitySection.hidden;
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
      this.pausedMainMenuActivePage = DEFAULT_PAUSED_MAIN_MENU_PAGE_ID;
    }
    const pausedMainMenuOverviewPageVisible =
      pausedMainMenuVisible && this.pausedMainMenuActivePage === 'overview';
    const pausedMainMenuWorldSavePageVisible =
      pausedMainMenuVisible && this.pausedMainMenuActivePage === 'world-save';
    const pausedMainMenuShellPageVisible =
      pausedMainMenuVisible && this.pausedMainMenuActivePage === 'shell';
    const pausedMainMenuShellActionKeybindings = pausedMainMenuVisible
      ? state.shellActionKeybindings ?? defaultShellActionKeybindings
      : defaultShellActionKeybindings;
    const pausedMainMenuShellPersistenceAvailable =
      pausedMainMenuVisible ? state.worldSessionShellPersistenceAvailable !== false : true;
    const pausedMainMenuHasShellProfilePreview =
      pausedMainMenuVisible && state.pausedMainMenuShellProfilePreview != null;
    const pausedMainMenuRecentActivitySection = resolvePausedMainMenuRecentActivitySectionState(
      state
    );
    const pausedMainMenuShellSection = resolvePausedMainMenuShellSectionState(state);
    const pausedMainMenuWorldSaveSection = resolvePausedMainMenuWorldSaveSectionState(state);
    const pausedMainMenuMenuSectionGroups = resolvePausedMainMenuMenuSectionGroups(state);
    const pausedMainMenuSecondarySections = pausedMainMenuVisible ? [] : viewModel.menuSections;
    const pausedMainMenuSectionViewModel =
      pausedMainMenuVisible ? state.pausedMainMenuSections ?? null : null;
    const pausedMainMenuOverviewActionButtons =
      pausedMainMenuSectionViewModel === null
        ? []
        : [
            createOverviewActionButton(
              pausedMainMenuSectionViewModel.overview.resumeWorld,
              resolveMainMenuPrimaryActionTitle(state),
              () => this.onPrimaryAction(this.currentState.screen)
            )
          ];
    const pausedMainMenuWorldSaveActionButtons =
      pausedMainMenuSectionViewModel === null
        ? []
        : [
            createWorldSaveActionButton(
              pausedMainMenuSectionViewModel.worldSave.exportWorldSave,
              resolveMainMenuSecondaryActionTitle(state),
              () => this.onSecondaryAction(this.currentState.screen)
            ),
            createWorldSaveActionButton(
              this.pausedMainMenuImportWorldSaveBusy
                ? createBusyPausedMainMenuImportWorldSaveActionSection(
                    pausedMainMenuSectionViewModel.worldSave.importWorldSave
                  )
                : pausedMainMenuSectionViewModel.worldSave.importWorldSave,
              this.pausedMainMenuImportWorldSaveBusy
                ? PAUSED_MAIN_MENU_BUSY_IMPORT_WORLD_SAVE_TITLE
                : resolveMainMenuTertiaryActionTitle(state),
              () => {
                void this.tryImportWorldSave();
              },
              {
                busy: this.pausedMainMenuImportWorldSaveBusy,
                disabled: this.pausedMainMenuImportWorldSaveBusy,
                headingStatusBadge: this.pausedMainMenuImportWorldSaveBusy
                  ? PAUSED_MAIN_MENU_BUSY_IMPORT_WORLD_SAVE_HEADING_BADGE
                  : null
              }
            ),
            ...(!isFirstStartMainMenuState(state)
              ? [
                  createWorldSaveActionButton(
                    pausedMainMenuSectionViewModel.worldSave.clearSavedWorld,
                    resolveMainMenuQuaternaryActionTitle(state),
                    () => this.onQuaternaryAction(this.currentState.screen)
                  )
                ]
              : []),
            createWorldSaveActionButton(
              pausedMainMenuSectionViewModel.worldSave.newWorld,
              resolveMainMenuSenaryActionTitle(state),
              () => this.onSenaryAction(this.currentState.screen)
            )
          ];
    const pausedMainMenuWorldSaveNavigationRows = pausedMainMenuWorldSaveSection.metadataRows.filter(
      (row) => row.label === 'Browser Resume' || row.label === 'World Seed'
    );
    const pausedMainMenuShellNavigationRows = pausedMainMenuShellSection.metadataRows;
    this.root.dataset.screen = viewModel.screen;
    this.overlayPanel.dataset.layout = pausedMainMenuVisible ? 'paused-dashboard' : 'default';
    this.overlay.hidden = !viewModel.overlayVisible;
    this.overlay.style.display = resolveAppShellRegionDisplay(viewModel.overlayVisible, 'grid');
    this.chrome.hidden = !viewModel.chromeVisible;
    this.chrome.style.display = resolveAppShellRegionDisplay(viewModel.chromeVisible, 'flex');
    this.stageLabel.textContent = viewModel.stageLabel;
    this.title.textContent = viewModel.title;
    this.status.textContent = viewModel.statusText;
    this.pausedMainMenuDashboard.hidden = !pausedMainMenuVisible;
    this.pausedMainMenuDashboard.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuVisible,
      'grid'
    );
    this.pausedMainMenuPrimarySections.hidden = !pausedMainMenuVisible;
    this.pausedMainMenuPrimarySections.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuVisible,
      'grid'
    );
    this.pausedMainMenuSecondarySections.hidden = !pausedMainMenuOverviewPageVisible;
    this.pausedMainMenuSecondarySections.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuOverviewPageVisible,
      'grid'
    );
    this.overviewSection.hidden =
      !pausedMainMenuOverviewPageVisible ||
      pausedMainMenuMenuSectionGroups.overviewSections.length === 0;
    this.overviewSection.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuOverviewPageVisible &&
        pausedMainMenuMenuSectionGroups.overviewSections.length > 0,
      'grid'
    );
    this.overviewBody.replaceChildren(...pausedMainMenuOverviewActionButtons);
    this.overviewBody.hidden = pausedMainMenuOverviewActionButtons.length === 0;
    this.overviewBody.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuOverviewActionButtons.length > 0,
      'grid'
    );
    this.overviewNavigation.hidden = !pausedMainMenuOverviewPageVisible;
    this.overviewNavigation.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuOverviewPageVisible,
      'grid'
    );
    this.worldSaveNavigationTile.dataset.tone = pausedMainMenuWorldSaveSection.tone;
    this.worldSaveNavigationSummary.textContent = pausedMainMenuWorldSaveSection.summaryLine ?? '';
    this.worldSaveNavigationMetadata.replaceChildren(
      ...createMenuSectionMetadataElement(pausedMainMenuWorldSaveNavigationRows).childNodes
    );
    this.shellNavigationTile.dataset.tone = 'default';
    this.shellNavigationSummary.textContent = pausedMainMenuShellSection.summaryLine ?? '';
    this.shellNavigationMetadata.replaceChildren(
      ...createMenuSectionMetadataElement(pausedMainMenuShellNavigationRows).childNodes
    );
    this.worldSaveSection.hidden =
      !pausedMainMenuWorldSavePageVisible || !pausedMainMenuWorldSaveSection.visible;
    this.worldSaveSection.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuWorldSavePageVisible && pausedMainMenuWorldSaveSection.visible,
      'grid'
    );
    this.worldSaveSection.dataset.tone = pausedMainMenuWorldSaveSection.tone;
    this.worldSaveBackButton.hidden = !pausedMainMenuWorldSavePageVisible;
    this.worldSaveBackButton.style.display = pausedMainMenuWorldSavePageVisible
      ? 'inline-flex'
      : 'none';
    this.worldSaveSummary.textContent = pausedMainMenuWorldSaveSection.summaryLine ?? '';
    this.worldSaveMetadata.replaceChildren(
      ...createMenuSectionMetadataElement(pausedMainMenuWorldSaveSection.metadataRows).childNodes
    );
    this.worldSaveActions.replaceChildren(...pausedMainMenuWorldSaveActionButtons);
    this.shellSection.hidden =
      !pausedMainMenuShellPageVisible || !pausedMainMenuShellSection.visible;
    this.shellSection.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuShellPageVisible && pausedMainMenuShellSection.visible,
      'grid'
    );
    this.shellBackButton.hidden = !pausedMainMenuShellPageVisible;
    this.shellBackButton.style.display = pausedMainMenuShellPageVisible ? 'inline-flex' : 'none';
    this.shellSummary.textContent = pausedMainMenuShellSection.summaryLine ?? '';
    this.shellMetadata.replaceChildren(
      ...createMenuSectionMetadataElement(pausedMainMenuShellSection.metadataRows).childNodes
    );
    this.shellBody.hidden = !pausedMainMenuShellPageVisible || !pausedMainMenuShellSection.visible;
    this.shellBody.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuShellPageVisible && pausedMainMenuShellSection.visible,
      'grid'
    );
    this.shellActionKeybindingEditor.hidden =
      !pausedMainMenuShellPageVisible || !pausedMainMenuShellSection.visible;
    this.shellActionKeybindingEditor.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuShellPageVisible && pausedMainMenuShellSection.visible,
      'grid'
    );
    this.syncShellGameplayControls(
      pausedMainMenuShellSection.gameplayControls,
      pausedMainMenuShellPageVisible && pausedMainMenuShellSection.visible
    );
    this.syncShellTelemetryControls(
      pausedMainMenuShellSection.telemetryControls,
      pausedMainMenuShellPageVisible && pausedMainMenuShellSection.visible
    );
    this.resetShellTogglesButton.title = resolveMainMenuQuinaryActionTitle(state);
    this.syncShellActionKeybindingEditorMetadata(pausedMainMenuShellPersistenceAvailable);
    this.shellProfilePreviewDetails.replaceChildren(
      ...(pausedMainMenuShellSection.previewSection === null
        ? []
        : [createMenuSectionElement(pausedMainMenuShellSection.previewSection)])
    );
    this.shellProfilePreviewDetails.hidden =
      !pausedMainMenuShellPageVisible ||
      !pausedMainMenuShellSection.visible ||
      pausedMainMenuShellSection.previewSection === null;
    this.shellProfilePreviewDetails.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuShellPageVisible &&
        pausedMainMenuShellSection.visible &&
        pausedMainMenuShellSection.previewSection !== null,
      'grid'
    );
    this.syncShellActionKeybindingEditorInputs(pausedMainMenuShellActionKeybindings);
    this.importShellProfileButton.disabled = this.pausedMainMenuImportShellProfileBusy;
    this.importShellProfileButton.textContent = this.pausedMainMenuImportShellProfileBusy
      ? 'Import Shell Profile...'
      : 'Import Shell Profile';
    this.importShellProfileButton.title = this.pausedMainMenuImportShellProfileBusy
      ? PAUSED_MAIN_MENU_BUSY_IMPORT_SHELL_PROFILE_TITLE
      : resolvePausedMainMenuImportShellProfileTitle();
    this.importShellProfileButton.setAttribute(
      'data-busy',
      this.pausedMainMenuImportShellProfileBusy ? 'true' : 'false'
    );
    this.importShellProfileButton.setAttribute(
      'aria-busy',
      this.pausedMainMenuImportShellProfileBusy ? 'true' : 'false'
    );
    this.applyShellProfilePreviewButton.disabled = this.pausedMainMenuApplyShellProfileBusy;
    this.applyShellProfilePreviewButton.textContent = this.pausedMainMenuApplyShellProfileBusy
      ? 'Apply Shell Profile...'
      : 'Apply Shell Profile';
    this.applyShellProfilePreviewButton.title = this.pausedMainMenuApplyShellProfileBusy
      ? PAUSED_MAIN_MENU_BUSY_APPLY_SHELL_PROFILE_TITLE
      : resolvePausedMainMenuApplyShellProfileTitle();
    this.applyShellProfilePreviewButton.setAttribute(
      'data-busy',
      this.pausedMainMenuApplyShellProfileBusy ? 'true' : 'false'
    );
    this.applyShellProfilePreviewButton.setAttribute(
      'aria-busy',
      this.pausedMainMenuApplyShellProfileBusy ? 'true' : 'false'
    );
    this.applyShellProfilePreviewButton.hidden = !pausedMainMenuHasShellProfilePreview;
    this.clearShellProfilePreviewButton.hidden = !pausedMainMenuHasShellProfilePreview;
    this.recentActivitySection.hidden = !pausedMainMenuRecentActivitySection.visible;
    this.recentActivitySection.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuRecentActivitySection.visible,
      'grid'
    );
    this.recentActivitySection.dataset.tone = pausedMainMenuRecentActivitySection.tone;
    this.recentActivitySummary.textContent = pausedMainMenuRecentActivitySection.summaryLine ?? '';
    this.recentActivityBody.replaceChildren(
      ...pausedMainMenuRecentActivitySection.menuSections.map((section) =>
        createMenuSectionElement(section, {
          showStatusBadge: true
        })
      )
    );
    this.recentActivityBody.hidden = !pausedMainMenuRecentActivitySection.visible;
    this.recentActivityBody.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuRecentActivitySection.visible,
      'grid'
    );
    this.recentActivityTopJumpLink.hidden = !pausedMainMenuRecentActivitySection.visible;
    this.recentActivityTopJumpLink.style.display = pausedMainMenuRecentActivitySection.visible
      ? 'inline-flex'
      : 'none';
    this.menuSections.replaceChildren(
      ...pausedMainMenuSecondarySections.map((section) => createMenuSectionElement(section))
    );
    this.menuSections.hidden = pausedMainMenuSecondarySections.length === 0;
    this.menuSections.style.display = resolveAppShellRegionDisplay(
      pausedMainMenuSecondarySections.length > 0,
      'grid'
    );
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
    this.restorePausedMainMenuSectionAnchorAfterRecentActivityVisibilityChange(
      pausedMainMenuVisible ? focusedPausedMainMenuSectionKey : null,
      wasRecentActivityVisible !== pausedMainMenuRecentActivitySection.visible
    );
  }
}
