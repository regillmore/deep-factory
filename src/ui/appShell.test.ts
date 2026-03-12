import { readFileSync } from 'node:fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  AppShell,
  type AppShellState,
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
  resolvePausedMainMenuDangerZoneSectionState,
  resolvePausedMainMenuRecentActivitySectionState,
  createPausedMainMenuShellSummaryRows,
  resolvePausedMainMenuShellSectionState,
  resolvePausedMainMenuShellToggleLabel,
  resolvePausedMainMenuWorldSaveSectionState,
  resolvePausedMainMenuShellActionKeybindingRemapEditorStatus,
  resolvePausedMainMenuResetShellActionKeybindingsEditorStatus,
  resolvePausedMainMenuApplyShellProfileTitle,
  resolvePausedMainMenuImportShellProfileTitle,
  resolvePausedMainMenuImportWorldSaveTitle,
  createPausedMainMenuShellActionKeybindingEditorMetadataRows,
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
const SESSION_ONLY_FALLBACK_PAUSED_MAIN_MENU_PERSISTENCE_SUMMARY_LINES = [
  'Browser shell storage is unavailable or could not be updated, so this paused session keeps the current shell layout only until a reset path or reload clears it.',
  PAUSED_MAIN_MENU_KEYBINDING_SUMMARY_LINE
] as const;
const CLEARED_PAUSED_MAIN_MENU_OVERVIEW_ATTENTION_VALUE =
  'Resume World or another save path must rewrite browser resume.';
const IMPORT_PERSISTENCE_FAILED_PAUSED_MAIN_MENU_OVERVIEW_ATTENTION_VALUE =
  'Reload will miss the imported session until a later browser save succeeds.';
const DEFAULT_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE =
  'Manage downloads, imports, and browser-resume storage for the current paused session.';
const CLEARED_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE =
  'Browser resume was cleared for this paused session. Resume World or another save path must rewrite it before reload can restore the session.';
const IMPORT_PERSISTENCE_FAILED_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE =
  'The imported paused session stays live in this tab, but reload will miss it until a later browser-save rewrite succeeds.';
const DEFAULT_PAUSED_MAIN_MENU_DANGER_ZONE_SUMMARY_LINE =
  'Use these only when you want to clear shell layout state or discard the current paused session.';
const DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  {
    label: 'Active Layout',
    value: 'All hidden (browser saved)'
  },
  {
    label: 'Binding Set',
    value: 'Default set'
  },
  {
    label: 'Staged Preview',
    value: 'No staged preview'
  }
] as const;
const REJECTED_IMPORT_PAUSED_MAIN_MENU_RECENT_ACTIVITY_SUMMARY_LINE =
  'Latest world-save activity: Import World Save was rejected during envelope validation.';
const CLEARED_SAVED_WORLD_PAUSED_MAIN_MENU_RECENT_ACTIVITY_SUMMARY_LINE =
  'Latest world-save activity: Clear Saved World removed browser resume for this paused session. A follow-up warning still needs attention below.';
const DOWNLOADED_EXPORT_WITH_FOLLOW_UP_PAUSED_MAIN_MENU_RECENT_ACTIVITY_SUMMARY_LINE =
  'Latest world-save activity: Export World Save downloaded successfully. A follow-up warning still needs attention below.';
const RESET_CLEARED_PAUSED_MAIN_MENU_RECENT_ACTIVITY_SUMMARY_LINE =
  'Latest shell-setting activity: Reset Shell Toggles cleared saved shell visibility for the next resume.';
const CLEARED_PAUSED_MAIN_MENU_CLEAR_SAVED_WORLD_ACTIVITY_LINES = [
  'Clear Saved World removed the browser-resume envelope while keeping this paused session open in the current tab.'
] as const;
const PREVIEWED_MIXED_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  ...DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS.slice(0, 2),
  {
    label: 'Staged Preview',
    value: 'preview-shell-profile.json: Layout + hotkey changes'
  }
] as const;
const PREVIEWED_TOGGLE_ONLY_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  ...DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS.slice(0, 2),
  {
    label: 'Staged Preview',
    value: 'toggle-only-shell-profile.json: Layout changes only'
  }
] as const;
const PREVIEWED_HOTKEY_ONLY_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  ...DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS.slice(0, 2),
  {
    label: 'Staged Preview',
    value: 'hotkey-only-shell-profile.json: Hotkey changes only'
  }
] as const;
const PREVIEWED_NOOP_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  ...DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS.slice(0, 2),
  {
    label: 'Staged Preview',
    value: 'matching-shell-profile.json: No live changes'
  }
] as const;
const PREVIEWED_DEFAULT_SET_WHILE_LIVE_CUSTOM_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  {
    label: 'Active Layout',
    value: 'All hidden (browser saved)'
  },
  {
    label: 'Binding Set',
    value: 'Custom set'
  },
  {
    label: 'Staged Preview',
    value: 'reset-to-default-shell-profile.json: Hotkey changes only'
  }
] as const;
const MIXED_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  {
    label: 'Active Layout',
    value: 'Debug HUD and Edit Overlays shown (browser saved)'
  },
  {
    label: 'Binding Set',
    value: 'Default set'
  },
  {
    label: 'Staged Preview',
    value: 'No staged preview'
  }
] as const;
const FULLY_VISIBLE_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  {
    label: 'Active Layout',
    value: 'All shown (browser saved)'
  },
  {
    label: 'Binding Set',
    value: 'Default set'
  },
  {
    label: 'Staged Preview',
    value: 'No staged preview'
  }
] as const;
const SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  {
    label: 'Active Layout',
    value: 'All hidden (session only)'
  },
  {
    label: 'Binding Set',
    value: 'Custom set'
  },
  {
    label: 'Staged Preview',
    value: 'No staged preview'
  }
] as const;
const DEFAULTED_DEFAULT_SET_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  {
    label: 'Active Layout',
    value: 'All hidden (browser saved)'
  },
  {
    label: 'Binding Set',
    value: 'Default set (recovered safe-set fallback)'
  },
  {
    label: 'Staged Preview',
    value: 'No staged preview'
  }
] as const;
const CURRENT_SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS = [
  {
    label: 'Active Layout',
    value: 'All hidden (browser saved)'
  },
  {
    label: 'Binding Set',
    value: 'Custom set (current session only)'
  },
  {
    label: 'Staged Preview',
    value: 'No staged preview'
  }
] as const;
const PAUSED_MAIN_MENU_SHELL_PROFILE_PREVIEW_LINES = [
  'The selected shell profile validated successfully and is ready to apply to this paused session.',
  'Review its live change summary, saved-on shell visibility, and replacement hotkey set below before applying it.'
] as const;
const DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS = [
  {
    label: 'Keys',
    value: 'Unique A-Z letters'
  },
  {
    label: 'Persistence',
    value: 'Browser saved on change'
  }
] as const;
const SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS = [
  {
    label: 'Keys',
    value: 'Unique A-Z letters'
  },
  {
    label: 'Persistence',
    value: 'Current session only until reload or reset'
  }
] as const;
const STORAGE_UNAVAILABLE_FIRST_LAUNCH_PERSISTENCE_PREVIEW_LINES = [
  'Browser resume is unavailable here because browser storage could not be opened during boot.',
  'Enter World still starts a live session in this tab, but returning to the main menu cannot create a browser resume save until storage access works again.'
] as const;
const APP_SHELL_STYLE_SOURCE = readFileSync(new URL('../style.css', import.meta.url), 'utf8');

class FakeClassList {
  constructor(private readonly element: FakeElement) {}

  add(...tokens: string[]): void {
    const nextTokens = new Set(this.element.className.split(/\s+/).filter(Boolean));
    for (const token of tokens) {
      nextTokens.add(token);
    }
    this.element.className = [...nextTokens].join(' ');
  }

  contains(token: string): boolean {
    return this.element.className.split(/\s+/).includes(token);
  }
}

class FakeElement {
  tagName: string;
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  children: FakeElement[] = [];
  hidden = false;
  className = '';
  textContent = '';
  title = '';
  id = '';
  type = '';
  value = '';
  inputMode = '';
  maxLength = 0;
  autocomplete = '';
  spellcheck = false;
  htmlFor = '';
  classList = new FakeClassList(this);
  private readonly attributes = new Map<string, string>();
  private readonly listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get childNodes(): FakeElement[] {
    return this.children;
  }

  append(...children: unknown[]): void {
    for (const child of children) {
      if (child instanceof FakeElement) {
        this.children.push(child);
      }
    }
  }

  replaceChildren(...children: unknown[]): void {
    this.children = [];
    this.append(...children);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'id') {
      this.id = value;
    }
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  click(): void {
    for (const listener of this.listeners.get('click') ?? []) {
      listener({
        type: 'click',
        currentTarget: this,
        target: this
      });
    }
  }

  blur(): void {}

  focus(): void {}

  select(): void {}
}

const createFakeDocument = () => ({
  createElement: (tagName: string) => new FakeElement(tagName)
});

const findElementByClass = (root: FakeElement, className: string): FakeElement | null => {
  if (root.classList.contains(className)) {
    return root;
  }

  for (const child of root.children) {
    const match = findElementByClass(child, className);
    if (match !== null) {
      return match;
    }
  }

  return null;
};

const findElementsByClass = (root: FakeElement, className: string): FakeElement[] => {
  const matches = root.classList.contains(className) ? [root] : [];
  for (const child of root.children) {
    matches.push(...findElementsByClass(child, className));
  }

  return matches;
};

const findElementById = (root: FakeElement, id: string): FakeElement | null => {
  if (root.id === id) {
    return root;
  }

  for (const child of root.children) {
    const match = findElementById(child, id);
    if (match !== null) {
      return match;
    }
  }

  return null;
};

const listChildClassNames = (element: FakeElement | null): string[] =>
  element?.children.map((child) => child.className) ?? [];

const readMetadataRows = (
  element: FakeElement | null
): Array<{ label: string; value: string }> =>
  element?.children.map((row) => ({
    label: row.children[0]?.textContent ?? '',
    value: row.children[1]?.textContent ?? ''
  })) ?? [];

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
  pausedMainMenuSections: ReturnType<typeof createPausedMainMenuSectionViewModel>,
  stateOverrides: Partial<AppShellState> = {}
) => {
  const { primarySections, recentActivitySections } = resolvePausedMainMenuMenuSectionGroups({
    screen: 'main-menu',
    primaryActionLabel: 'Resume World',
    pausedMainMenuSections,
    ...stateOverrides
  });

  return [...primarySections, ...recentActivitySections];
};

describe('paused main-menu dashboard layout', () => {
  beforeEach(() => {
    vi.stubGlobal('document', createFakeDocument());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('groups paused-menu sections into primary and secondary dashboard wrappers while hiding the legacy footer actions', () => {
    const container = new FakeElement('div');
    const shell = new AppShell(container as unknown as HTMLElement);

    shell.setState(
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
        null,
        null,
        false,
        'export-world-save'
      )
    );

    const root = container.children[0] ?? null;
    const panel = root === null ? null : findElementByClass(root, 'app-shell__panel');
    const dashboard = panel === null ? null : findElementByClass(panel, 'app-shell__paused-dashboard');
    const primary = dashboard === null ? null : findElementByClass(dashboard, 'app-shell__paused-primary');
    const secondary =
      dashboard === null ? null : findElementByClass(dashboard, 'app-shell__paused-secondary');
    const menuSections = panel === null ? null : findElementByClass(panel, 'app-shell__menu-sections');
    const footerActions = panel === null ? null : findElementByClass(panel, 'app-shell__actions');

    expect(panel?.dataset.layout).toBe('paused-dashboard');
    expect(dashboard?.hidden).toBe(false);
    expect(dashboard?.style.display).toBe('grid');
    expect(listChildClassNames(primary)).toEqual(['app-shell__overview', 'app-shell__world-save']);
    expect(listChildClassNames(secondary)).toEqual([
      'app-shell__shell',
      'app-shell__recent-activity',
      'app-shell__danger-zone'
    ]);
    expect(menuSections?.hidden).toBe(true);
    expect(menuSections?.style.display).toBe('none');
    expect(footerActions?.hidden).toBe(true);
    expect(footerActions?.style.display).toBe('none');
  });

  it('renders paused section-owned action buttons and routes them through the shared main-menu handlers', () => {
    const handledActions: string[] = [];
    const container = new FakeElement('div');
    const shell = new AppShell(container as unknown as HTMLElement, {
      onPrimaryAction: () => handledActions.push('resume-world'),
      onSecondaryAction: () => handledActions.push('export-world-save'),
      onTertiaryAction: () => handledActions.push('import-world-save'),
      onQuaternaryAction: () => handledActions.push('clear-saved-world'),
      onQuinaryAction: () => handledActions.push('reset-shell-toggles'),
      onSenaryAction: () => handledActions.push('new-world')
    });

    shell.setState(createPausedMainMenuShellState());

    const root = container.children[0] ?? null;
    expect(root).not.toBeNull();
    if (root === null) {
      return;
    }

    const overviewButtons = findElementsByClass(root, 'app-shell__overview-action');
    const worldSaveButtons = findElementsByClass(root, 'app-shell__world-save-action');
    const dangerZoneButtons = findElementsByClass(root, 'app-shell__danger-zone-action');

    expect(overviewButtons).toHaveLength(1);
    expect(worldSaveButtons).toHaveLength(3);
    expect(dangerZoneButtons).toHaveLength(2);
    expect(overviewButtons[0]?.title).toBe(resolvePausedMainMenuResumeWorldTitle());
    expect(worldSaveButtons.map((button) => button.title)).toEqual([
      resolvePausedMainMenuExportWorldSaveTitle(),
      resolvePausedMainMenuImportWorldSaveTitle(),
      resolvePausedMainMenuClearSavedWorldTitle()
    ]);
    expect(dangerZoneButtons.map((button) => button.title)).toEqual([
      resolvePausedMainMenuResetShellTogglesTitle(),
      resolvePausedMainMenuFreshWorldTitle()
    ]);

    overviewButtons[0]?.click();
    for (const button of worldSaveButtons) {
      button.click();
    }
    for (const button of dangerZoneButtons) {
      button.click();
    }

    expect(handledActions).toEqual([
      'resume-world',
      'export-world-save',
      'import-world-save',
      'clear-saved-world',
      'reset-shell-toggles',
      'new-world'
    ]);
  });

  it('shows inline shortcut badges on paused Resume World and New World action cards', () => {
    const container = new FakeElement('div');
    const shell = new AppShell(container as unknown as HTMLElement);

    shell.setState(createPausedMainMenuShellState());

    const root = container.children[0] ?? null;
    expect(root).not.toBeNull();
    if (root === null) {
      return;
    }

    const overviewButtons = findElementsByClass(root, 'app-shell__overview-action');
    const worldSaveButtons = findElementsByClass(root, 'app-shell__world-save-action');
    const dangerZoneButtons = findElementsByClass(root, 'app-shell__danger-zone-action');

    const resumeTitle = findElementByClass(overviewButtons[0]!, 'app-shell__overview-action-title');
    const resumeBadge = findElementByClass(
      overviewButtons[0]!,
      'app-shell__section-action-shortcut-badge'
    );
    const resetShellTogglesBadge = findElementByClass(
      dangerZoneButtons[0]!,
      'app-shell__section-action-shortcut-badge'
    );
    const newWorldTitle = findElementByClass(
      dangerZoneButtons[1]!,
      'app-shell__danger-zone-action-title'
    );
    const newWorldBadge = findElementByClass(
      dangerZoneButtons[1]!,
      'app-shell__section-action-shortcut-badge'
    );

    expect(resumeTitle?.textContent).toBe('Resume World');
    expect(resumeBadge?.textContent).toBe(getDesktopResumeWorldHotkeyLabel());
    expect(newWorldTitle?.textContent).toBe('New World');
    expect(newWorldBadge?.textContent).toBe(getDesktopFreshWorldHotkeyLabel());
    expect(resetShellTogglesBadge).toBeNull();
    expect(
      worldSaveButtons.every(
        (button) => findElementByClass(button, 'app-shell__section-action-shortcut-badge') === null
      )
    ).toBe(true);
  });

  it('hides the paused dashboard wrappers for the first-launch main menu layout', () => {
    const container = new FakeElement('div');
    const shell = new AppShell(container as unknown as HTMLElement);

    shell.setState(createFirstLaunchMainMenuShellState());

    const root = container.children[0] ?? null;
    const panel = root === null ? null : findElementByClass(root, 'app-shell__panel');
    const dashboard = panel === null ? null : findElementByClass(panel, 'app-shell__paused-dashboard');
    const menuSections = panel === null ? null : findElementByClass(panel, 'app-shell__menu-sections');

    expect(panel?.dataset.layout).toBe('default');
    expect(dashboard?.hidden).toBe(true);
    expect(dashboard?.style.display).toBe('none');
    expect(menuSections?.hidden).toBe(false);
    expect(menuSections?.style.display).toBe('grid');
  });

  it('adds stable labelled region landmarks and focus anchors to paused-dashboard sections', () => {
    const container = new FakeElement('div');
    const shell = new AppShell(container as unknown as HTMLElement);

    shell.setState(createPausedMainMenuShellState());

    const root = container.children[0] ?? null;
    const sectionExpectations = [
      {
        className: 'app-shell__overview',
        sectionId: 'app-shell-paused-overview-section',
        headingId: 'app-shell-paused-overview-title',
        title: 'Overview'
      },
      {
        className: 'app-shell__world-save',
        sectionId: 'app-shell-paused-world-save-section',
        headingId: 'app-shell-paused-world-save-title',
        title: 'World Save'
      },
      {
        className: 'app-shell__shell',
        sectionId: 'app-shell-paused-shell-section',
        headingId: 'app-shell-paused-shell-title',
        title: 'Shell'
      },
      {
        className: 'app-shell__recent-activity',
        sectionId: 'app-shell-paused-recent-activity-section',
        headingId: 'app-shell-paused-recent-activity-title',
        title: 'Recent Activity'
      },
      {
        className: 'app-shell__danger-zone',
        sectionId: 'app-shell-paused-danger-zone-section',
        headingId: 'app-shell-paused-danger-zone-title',
        title: 'Danger Zone'
      }
    ] as const;

    for (const sectionExpectation of sectionExpectations) {
      const section =
        root === null ? null : findElementByClass(root, sectionExpectation.className);
      const heading = section === null ? null : findElementById(section, sectionExpectation.headingId);

      expect(section?.id).toBe(sectionExpectation.sectionId);
      expect(section?.getAttribute('role')).toBe('region');
      expect(section?.getAttribute('aria-labelledby')).toBe(sectionExpectation.headingId);
      expect(section?.getAttribute('tabindex')).toBe('-1');
      expect(heading?.tagName).toBe('H2');
      expect(heading?.textContent).toBe(sectionExpectation.title);
    }
  });

  it('renders compact shell-hotkey metadata rows instead of a prose intro when the shell editor expands', () => {
    const container = new FakeElement('div');
    const shell = new AppShell(container as unknown as HTMLElement);

    shell.setState(createPausedMainMenuShellState());

    const root = container.children[0] ?? null;
    const shellToggleButton =
      root === null ? null : findElementByClass(root, 'app-shell__shell-toggle');
    shellToggleButton?.click();

    const shellEditorMetadata =
      root === null ? null : findElementByClass(root, 'app-shell__shell-keybindings-metadata');
    const shellEditorIntro =
      root === null ? null : findElementByClass(root, 'app-shell__shell-keybindings-intro');

    expect(readMetadataRows(shellEditorMetadata)).toEqual(
      DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS
    );
    expect(shellEditorIntro).toBeNull();
  });

  it('switches the expanded shell-hotkey metadata rows into warning-toned session-only copy when browser persistence is unavailable', () => {
    const container = new FakeElement('div');
    const shell = new AppShell(container as unknown as HTMLElement);

    shell.setState(createPausedMainMenuShellState(undefined, false));

    const root = container.children[0] ?? null;
    const shellToggleButton =
      root === null ? null : findElementByClass(root, 'app-shell__shell-toggle');
    shellToggleButton?.click();

    const shellEditorMetadata =
      root === null ? null : findElementByClass(root, 'app-shell__shell-keybindings-metadata');

    expect(shellEditorMetadata?.dataset.tone).toBe('warning');
    expect(readMetadataRows(shellEditorMetadata)).toEqual(
      SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS
    );
  });
});

describe('paused main-menu dashboard layout styling', () => {
  it('keeps dedicated paused-dashboard and desktop secondary-grid rules in style.css', () => {
    expect(APP_SHELL_STYLE_SOURCE).toContain(".app-shell__panel[data-layout='paused-dashboard']");
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__paused-dashboard');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__paused-primary');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__paused-secondary');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__section-action-button');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__section-action-heading');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__section-action-shortcut-badge');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__overview-action');
    expect(APP_SHELL_STYLE_SOURCE).toContain(
      '.app-shell__danger-zone-action .app-shell__section-action-shortcut-badge'
    );
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__shell-keybindings-metadata');
    expect(APP_SHELL_STYLE_SOURCE).toContain(
      ".app-shell__shell-keybindings-metadata[data-tone='warning'] .app-shell__menu-section-metadata-value"
    );
    expect(APP_SHELL_STYLE_SOURCE).toContain('@media (min-width: 960px)');
    expect(APP_SHELL_STYLE_SOURCE).toContain(
      ".app-shell__panel[data-layout='paused-dashboard'] .app-shell__paused-secondary"
    );
    expect(APP_SHELL_STYLE_SOURCE).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(APP_SHELL_STYLE_SOURCE).toContain(
      ".app-shell__panel[data-layout='paused-dashboard'] .app-shell__shell[data-expanded='true']"
    );
  });

  it('keeps paused-section focus-anchor rules in style.css', () => {
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__overview:focus-visible');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__world-save:focus-visible');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__recent-activity:focus-visible');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__shell:focus-visible');
    expect(APP_SHELL_STYLE_SOURCE).toContain('.app-shell__danger-zone:focus-visible');
  });
});

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
    expect(viewModel.primaryActionLabel).toBeNull();
    expect(viewModel.secondaryActionLabel).toBeNull();
    expect(viewModel.tertiaryActionLabel).toBeNull();
    expect(viewModel.quaternaryActionLabel).toBeNull();
    expect(viewModel.quinaryActionLabel).toBeNull();
    expect(viewModel.senaryActionLabel).toBeNull();
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
      lines: [],
      metadataRows: [
        {
          label: 'Status',
          value: 'Accepted'
        },
        {
          label: 'File',
          value: 'restore.json'
        },
        {
          label: 'Session',
          value: 'Replaced'
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
      lines: [],
      metadataRows: [
        {
          label: 'Status',
          value: 'Downloaded'
        },
        {
          label: 'File',
          value: 'deep-factory-world-save-2026-03-09T05-46-40Z.json'
        },
        {
          label: 'Session',
          value: 'Kept unchanged'
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
      lines: [],
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
          label: 'Session',
          value: 'Kept unchanged'
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
      lines: [],
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
          label: 'Session',
          value: 'Kept unchanged'
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
      lines: [],
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
          label: 'Reload',
          value: 'Later browser save required'
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
    });
  });

  it('keeps resume, session-save state, and attention metadata together in the paused-menu overview by default', () => {
    const viewModel = resolveAppShellViewModel(createPausedMainMenuShellState());

    expect(viewModel.pausedMainMenuSections?.overview.resumeWorld).toEqual({
      title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
      lines: [],
      metadataRows: [
        {
          label: 'Keeps',
          value: 'World, player, camera, and debug edits intact'
        },
        {
          label: 'Session Save',
          value: 'Browser saved'
        },
        {
          label: 'Needs Attention',
          value: 'None'
        },
        {
          label: 'Shortcut',
          value: getDesktopResumeWorldHotkeyLabel()
        }
      ],
      tone: 'accent'
    });
  });

  it('surfaces cleared browser-resume warnings in the paused-menu overview', () => {
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

    expect(viewModel.pausedMainMenuSections?.overview.resumeWorld).toEqual({
      title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
      lines: [],
      metadataRows: [
        {
          label: 'Keeps',
          value: 'World, player, camera, and debug edits intact'
        },
        {
          label: 'Session Save',
          value: 'Not browser saved'
        },
        {
          label: 'Needs Attention',
          value: CLEARED_PAUSED_MAIN_MENU_OVERVIEW_ATTENTION_VALUE
        },
        {
          label: 'Shortcut',
          value: getDesktopResumeWorldHotkeyLabel()
        }
      ],
      tone: 'warning'
    });
  });

  it('distinguishes imported-session persistence failures in the paused-menu overview attention row', () => {
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

    expect(viewModel.pausedMainMenuSections?.overview.resumeWorld).toEqual({
      title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
      lines: [],
      metadataRows: [
        {
          label: 'Keeps',
          value: 'World, player, camera, and debug edits intact'
        },
        {
          label: 'Session Save',
          value: 'Not browser saved'
        },
        {
          label: 'Needs Attention',
          value: IMPORT_PERSISTENCE_FAILED_PAUSED_MAIN_MENU_OVERVIEW_ATTENTION_VALUE
        },
        {
          label: 'Shortcut',
          value: getDesktopResumeWorldHotkeyLabel()
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
      menuSections: createPausedMainMenuMenuSectionsFromViewModel(pausedMainMenuSections, {
        pausedMainMenuSavedWorldStatus: 'cleared'
      }),
      pausedMainMenuSections,
      pausedMainMenuSavedWorldStatus: 'cleared',
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
      menuSections: createPausedMainMenuMenuSectionsFromViewModel(pausedMainMenuSections, {
        pausedMainMenuResetShellTogglesResult: {
          status: 'cleared'
        }
      }),
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
      menuSections: createPausedMainMenuMenuSectionsFromViewModel(pausedMainMenuSections, {
        pausedMainMenuResetShellTogglesResult: {
          status: 'persistence-failed',
          reason: 'remove blocked'
        }
      }),
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

describe('createPausedMainMenuShellActionKeybindingEditorMetadataRows', () => {
  it('switches between browser-saved and session-only metadata rows for the paused-menu shell-hotkey editor', () => {
    expect(createPausedMainMenuShellActionKeybindingEditorMetadataRows()).toEqual(
      DEFAULT_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS
    );
    expect(createPausedMainMenuShellActionKeybindingEditorMetadataRows(false)).toEqual(
      SESSION_ONLY_PAUSED_MAIN_MENU_SHELL_ACTION_KEYBINDING_EDITOR_METADATA_ROWS
    );
  });
});

describe('createPausedMainMenuShellSummaryRows', () => {
  it('summarizes a fully hidden browser-saved shell layout in three compact rows', () => {
    expect(
      createPausedMainMenuShellSummaryRows(createPausedMainMenuShellState().pausedMainMenuSections ?? null)
    ).toEqual(DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);
  });

  it('summarizes mixed and fully visible shell layouts through the active-layout row', () => {
    expect(
      createPausedMainMenuShellSummaryRows(
        createPausedMainMenuShellState({
          debugOverlayVisible: true,
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: true,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: false
        }).pausedMainMenuSections ?? null
      )
    ).toEqual(MIXED_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);

    expect(
      createPausedMainMenuShellSummaryRows(
        createPausedMainMenuShellState({
          debugOverlayVisible: true,
          debugEditControlsVisible: true,
          debugEditOverlaysVisible: true,
          playerSpawnMarkerVisible: true,
          shortcutsOverlayVisible: true
        }).pausedMainMenuSections ?? null
      )
    ).toEqual(FULLY_VISIBLE_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);
  });

  it('surfaces persistence, fallback, and current-session binding-set status in the binding row', () => {
    expect(
      createPausedMainMenuShellSummaryRows(
        createPausedMainMenuShellState(
          undefined,
          false,
          CUSTOM_SHELL_ACTION_KEYBINDINGS
        ).pausedMainMenuSections ?? null
      )
    ).toEqual(SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);

    expect(
      createPausedMainMenuShellSummaryRows(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          true
        ).pausedMainMenuSections ?? null
      )
    ).toEqual(DEFAULTED_DEFAULT_SET_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);

    expect(
      createPausedMainMenuShellSummaryRows(
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
    ).toEqual(CURRENT_SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);
  });

  it('summarizes staged shell-profile preview deltas without expanding the editor', () => {
    expect(
      createPausedMainMenuShellSummaryRows(
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
    ).toEqual(PREVIEWED_MIXED_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);

    expect(
      createPausedMainMenuShellSummaryRows(
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
    ).toEqual(PREVIEWED_TOGGLE_ONLY_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);

    expect(
      createPausedMainMenuShellSummaryRows(
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
    ).toEqual(PREVIEWED_HOTKEY_ONLY_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);

    expect(
      createPausedMainMenuShellSummaryRows(
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
    ).toEqual(PREVIEWED_NOOP_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);

    expect(
      createPausedMainMenuShellSummaryRows(
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
    ).toEqual(PREVIEWED_DEFAULT_SET_WHILE_LIVE_CUSTOM_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS);
  });
});

describe('resolvePausedMainMenuWorldSaveSectionState', () => {
  it('defaults the paused-menu world-save section to shared summary rows plus grouped actions', () => {
    expect(resolvePausedMainMenuWorldSaveSectionState(createPausedMainMenuShellState())).toEqual({
      visible: true,
      summaryLine: DEFAULT_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE,
      metadataRows: [
        {
          label: 'Browser Resume',
          value: 'Available'
        },
        {
          label: 'Saved Again By',
          value: 'None needed'
        },
        {
          label: 'Last Export',
          value: 'No recent export'
        },
        {
          label: 'Last Import',
          value: 'No recent import'
        },
        {
          label: 'Last Clear',
          value: 'No recent clear'
        }
      ],
      actionSections: [
        {
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
        {
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
        {
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
        }
      ],
      tone: 'default'
    });
  });

  it('surfaces missing browser resume plus latest world-save outcomes in the shared summary rows', () => {
    expect(
      resolvePausedMainMenuWorldSaveSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          null,
          'cleared'
        )
      )
    ).toMatchObject({
      visible: true,
      summaryLine: CLEARED_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE,
      metadataRows: [
        {
          label: 'Browser Resume',
          value: 'Missing'
        },
        {
          label: 'Saved Again By',
          value: 'Resume World, Import World Save, New World'
        },
        {
          label: 'Last Export',
          value: 'No recent export'
        },
        {
          label: 'Last Import',
          value: 'No recent import'
        },
        {
          label: 'Last Clear',
          value: 'Cleared from browser storage'
        }
      ],
      tone: 'warning'
    });
  });

  it('surfaces imported-session persistence warnings plus latest world-save outcomes in the shared summary rows', () => {
    expect(
      resolvePausedMainMenuWorldSaveSectionState(
        createPausedMainMenuShellState(
          undefined,
          true,
          createDefaultShellActionKeybindingState(),
          false,
          {
            status: 'persistence-failed',
            fileName: 'imported-session.json',
            reason: 'local resume envelope could not be rewritten'
          },
          'import-persistence-failed',
          {
            status: 'downloaded',
            fileName: 'paused-session.json'
          }
        )
      )
    ).toMatchObject({
      visible: true,
      summaryLine: IMPORT_PERSISTENCE_FAILED_PAUSED_MAIN_MENU_WORLD_SAVE_SUMMARY_LINE,
      metadataRows: [
        {
          label: 'Browser Resume',
          value: 'Missing'
        },
        {
          label: 'Saved Again By',
          value: 'Later pause or page hide, Import World Save, New World'
        },
        {
          label: 'Last Export',
          value: 'Downloaded paused-session.json'
        },
        {
          label: 'Last Import',
          value: 'Restored in this tab only from imported-session.json'
        },
        {
          label: 'Last Clear',
          value: 'No recent clear'
        }
      ],
      tone: 'warning'
    });
  });

  it('keeps the world-save section hidden outside the paused main menu', () => {
    expect(resolvePausedMainMenuWorldSaveSectionState(createFirstLaunchMainMenuShellState())).toEqual({
      visible: false,
      summaryLine: null,
      metadataRows: [],
      actionSections: [],
      tone: 'default'
    });
  });
});

describe('resolvePausedMainMenuDangerZoneSectionState', () => {
  it('collects Reset Shell Toggles and New World into one warning-toned danger zone', () => {
    expect(resolvePausedMainMenuDangerZoneSectionState(createPausedMainMenuShellState())).toEqual({
      visible: true,
      summaryLine: DEFAULT_PAUSED_MAIN_MENU_DANGER_ZONE_SUMMARY_LINE,
      actionSections: [
        {
          title: 'Reset Shell Toggles',
          lines: [],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Session',
              value: 'Kept unchanged'
            },
            {
              label: 'Next Resume',
              value: 'Default-off shell layout'
            }
          ],
          tone: 'warning'
        },
        {
          title: `New World (${getDesktopFreshWorldHotkeyLabel()})`,
          lines: [],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopFreshWorldHotkeyLabel()
            },
            {
              label: 'Replaces',
              value: 'Paused session with a fresh world'
            },
            {
              label: 'Resets',
              value: 'Player, camera, undo, and shell layout'
            }
          ],
          tone: 'warning'
        }
      ],
      tone: 'warning'
    });
  });

  it('keeps the danger zone hidden outside the paused main menu', () => {
    expect(resolvePausedMainMenuDangerZoneSectionState(createFirstLaunchMainMenuShellState())).toEqual({
      visible: false,
      summaryLine: null,
      actionSections: [],
      tone: 'default'
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
      },
      null,
      false,
      'clear-saved-world'
    );

    expect(resolvePausedMainMenuMenuSectionGroups(pausedState)).toEqual({
      overviewSections: [
        {
          title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
          lines: [],
          metadataRows: [
            {
              label: 'Keeps',
              value: 'World, player, camera, and debug edits intact'
            },
            {
              label: 'Session Save',
              value: 'Not browser saved'
            },
            {
              label: 'Needs Attention',
              value: CLEARED_PAUSED_MAIN_MENU_OVERVIEW_ATTENTION_VALUE
            },
            {
              label: 'Shortcut',
              value: getDesktopResumeWorldHotkeyLabel()
            }
          ],
          tone: 'warning'
        }
      ],
      worldSaveSections: [
        {
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
        {
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
        {
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
        }
      ],
      shellSections: [],
      recentActivitySections: [
        {
          title: 'Clear Saved World',
          lines: [...CLEARED_PAUSED_MAIN_MENU_CLEAR_SAVED_WORLD_ACTIVITY_LINES],
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
        },
        {
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
        }
      ],
      dangerZoneSections: [
        {
          title: 'Reset Shell Toggles',
          lines: [],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Session',
              value: 'Kept unchanged'
            },
            {
              label: 'Next Resume',
              value: 'Default-off shell layout'
            }
          ],
          tone: 'warning'
        },
        {
          title: `New World (${getDesktopFreshWorldHotkeyLabel()})`,
          lines: [],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopFreshWorldHotkeyLabel()
            },
            {
              label: 'Replaces',
              value: 'Paused session with a fresh world'
            },
            {
              label: 'Resets',
              value: 'Player, camera, undo, and shell layout'
            }
          ],
          tone: 'warning'
        }
      ],
      primarySections: [
        {
          title: `Resume World (${getDesktopResumeWorldHotkeyLabel()})`,
          lines: [],
          metadataRows: [
            {
              label: 'Keeps',
              value: 'World, player, camera, and debug edits intact'
            },
            {
              label: 'Session Save',
              value: 'Not browser saved'
            },
            {
              label: 'Needs Attention',
              value: CLEARED_PAUSED_MAIN_MENU_OVERVIEW_ATTENTION_VALUE
            },
            {
              label: 'Shortcut',
              value: getDesktopResumeWorldHotkeyLabel()
            }
          ],
          tone: 'warning'
        },
        {
          title: 'Reset Shell Toggles',
          lines: [],
          metadataRows: [
            {
              label: 'Shortcut',
              value: 'Button only'
            },
            {
              label: 'Session',
              value: 'Kept unchanged'
            },
            {
              label: 'Next Resume',
              value: 'Default-off shell layout'
            }
          ],
          tone: 'warning'
        },
        {
          title: `New World (${getDesktopFreshWorldHotkeyLabel()})`,
          lines: [],
          metadataRows: [
            {
              label: 'Shortcut',
              value: getDesktopFreshWorldHotkeyLabel()
            },
            {
              label: 'Replaces',
              value: 'Paused session with a fresh world'
            },
            {
              label: 'Resets',
              value: 'Player, camera, undo, and shell layout'
            }
          ],
          tone: 'warning'
        }
      ]
    });
  });
});

describe('resolvePausedMainMenuRecentActivitySectionState', () => {
  it('falls back to the only available paused-menu activity when no explicit latest action is stored', () => {
    expect(
      resolvePausedMainMenuRecentActivitySectionState(
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
      summaryLine: REJECTED_IMPORT_PAUSED_MAIN_MENU_RECENT_ACTIVITY_SUMMARY_LINE,
      tone: 'warning',
      menuSections: [
        {
          title: 'Import Result',
          lines: [],
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
              label: 'Session',
              value: 'Kept unchanged'
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

  it('shows only the latest clear-saved-world outcome plus its follow-up warning', () => {
    expect(
      resolvePausedMainMenuRecentActivitySectionState(
        createPausedMainMenuShellState(
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
          },
          null,
          false,
          'clear-saved-world'
        )
      )
    ).toEqual({
      visible: true,
      summaryLine: CLEARED_SAVED_WORLD_PAUSED_MAIN_MENU_RECENT_ACTIVITY_SUMMARY_LINE,
      tone: 'warning',
      menuSections: [
        {
          title: 'Clear Saved World',
          lines: [...CLEARED_PAUSED_MAIN_MENU_CLEAR_SAVED_WORLD_ACTIVITY_LINES],
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
        },
        {
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
        }
      ]
    });
  });

  it('keeps the latest export result visible while preserving an active world-save follow-up warning', () => {
    expect(
      resolvePausedMainMenuRecentActivitySectionState(
        createPausedMainMenuShellState(
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
          null,
          null,
          false,
          'export-world-save'
        )
      )
    ).toEqual({
      visible: true,
      summaryLine: DOWNLOADED_EXPORT_WITH_FOLLOW_UP_PAUSED_MAIN_MENU_RECENT_ACTIVITY_SUMMARY_LINE,
      tone: 'warning',
      menuSections: [
        {
          title: 'Export Result',
          lines: [],
          metadataRows: [
            {
              label: 'Status',
              value: 'Downloaded'
            },
            {
              label: 'File',
              value: 'paused-session.json'
            },
            {
              label: 'Session',
              value: 'Kept unchanged'
            }
          ],
          tone: 'accent'
        },
        {
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
        }
      ]
    });
  });

  it('keeps recent activity scoped to the latest shell-setting outcome when reset happened most recently', () => {
    expect(
      resolvePausedMainMenuRecentActivitySectionState(
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
          },
          null,
          false,
          'reset-shell-toggles'
        )
      )
    ).toEqual({
      visible: true,
      summaryLine: RESET_CLEARED_PAUSED_MAIN_MENU_RECENT_ACTIVITY_SUMMARY_LINE,
      tone: 'default',
      menuSections: [
        {
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
        }
      ]
    });
  });

  it('keeps recent activity hidden when no paused-menu world-save or shell-setting outcome is available', () => {
    expect(resolvePausedMainMenuRecentActivitySectionState(createPausedMainMenuShellState())).toEqual({
      visible: false,
      summaryLine: null,
      tone: 'default',
      menuSections: []
    });
  });

  it('keeps recent activity hidden outside the paused main menu', () => {
    expect(resolvePausedMainMenuRecentActivitySectionState(createFirstLaunchMainMenuShellState())).toEqual({
      visible: false,
      summaryLine: null,
      tone: 'default',
      menuSections: []
    });
  });
});

describe('resolvePausedMainMenuShellToggleLabel', () => {
  it('switches the paused-menu shell button label between collapsed and expanded copy', () => {
    expect(resolvePausedMainMenuShellToggleLabel()).toBe('Show Shell');
    expect(resolvePausedMainMenuShellToggleLabel(true)).toBe('Hide Shell');
  });
});

describe('resolvePausedMainMenuShellSectionState', () => {
  it('defaults paused-menu shell to a collapsed summary-row section', () => {
    expect(resolvePausedMainMenuShellSectionState(createPausedMainMenuShellState())).toEqual({
      visible: true,
      expanded: false,
      metadataRows: DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS,
      toggleLabel: 'Show Shell',
      editorVisible: false,
      previewSection: null
    });
  });

  it('reveals the shell editor only after the paused-menu shell section expands', () => {
    expect(resolvePausedMainMenuShellSectionState(createPausedMainMenuShellState(), true)).toEqual({
      visible: true,
      expanded: true,
      metadataRows: DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS,
      toggleLabel: 'Hide Shell',
      editorVisible: true,
      previewSection: null
    });
  });

  it('keeps staged shell-profile details ready for the expanded shell editor while summary rows stay compact', () => {
    expect(
      resolvePausedMainMenuShellSectionState(
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
        ),
        true
      )
    ).toMatchObject({
      visible: true,
      expanded: true,
      metadataRows: PREVIEWED_MIXED_DEFAULT_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS,
      toggleLabel: 'Hide Shell',
      editorVisible: true,
      previewSection: {
        title: 'Shell Profile Preview',
        lines: [...PAUSED_MAIN_MENU_SHELL_PROFILE_PREVIEW_LINES],
        tone: 'accent'
      }
    });
  });

  it('keeps current-session-only hotkey persistence warning in the collapsed shell section state', () => {
    expect(
      resolvePausedMainMenuShellSectionState(
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
      metadataRows: CURRENT_SESSION_ONLY_CUSTOM_SET_PAUSED_MAIN_MENU_SHELL_SUMMARY_ROWS,
      toggleLabel: 'Show Shell',
      editorVisible: false,
      previewSection: null
    });
  });

  it('keeps shell hidden outside the paused main menu', () => {
    expect(resolvePausedMainMenuShellSectionState(createFirstLaunchMainMenuShellState(), true)).toEqual({
      visible: false,
      expanded: false,
      metadataRows: [],
      toggleLabel: null,
      editorVisible: false,
      previewSection: null
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
