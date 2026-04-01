import {
  getHotbarSlotShortcutLabel,
  getMoveSelectedHotbarSlotLeftShortcutLabel,
  getMoveSelectedHotbarSlotRightShortcutLabel
} from '../input/hotbarShortcuts';
import {
  getDropOneSelectedHotbarItemShortcutLabel,
  getDropSelectedHotbarStackShortcutLabel
} from '../input/playerInventoryShortcuts';
import {
  getPlayerInventoryItemDefinition,
  type PlayerInventoryState
} from '../world/playerInventory';
import type { StarterAxeSwingPhase } from '../world/starterAxeChopping';
import type { StarterBugNetSwingPhase } from '../world/starterBugNet';
import type { StarterMeleeWeaponSwingPhase } from '../world/starterMeleeWeapon';
import type { StarterPickaxeSwingPhase } from '../world/starterPickaxeMining';
import type { StarterSpearThrustPhase } from '../world/starterSpear';
import { installPointerClickFocusRelease } from './buttonFocus';

interface HotbarOverlayOptions {
  host: HTMLElement;
  onSelectSlot?: (slotIndex: number) => void;
  onMoveSelectedLeft?: () => void;
  onMoveSelectedRight?: () => void;
  onDropSelectedOne?: () => void;
  onDropSelectedStack?: () => void;
}

type SelectedGrapplingHookReadoutStatus =
  | 'active'
  | 'dead'
  | 'latch-ready'
  | 'range-blocked';
type SelectedBedReadoutStatus = 'claim-ready' | 'claim-blocked';
type SelectedDoorReadoutStatus = 'toggle-ready' | 'toggle-blocked';
type SelectedDoorReadoutVerb = 'open' | 'close';

interface HotbarOverlayUpdateOptions {
  starterAxeSwingFeedback?:
    | {
        phase: StarterAxeSwingPhase;
        timingFillNormalized: number;
      }
    | null;
  selectedBowDrawCooldownFillNormalized?: number | null;
  selectedBowAmmoReadout?:
    | {
        availableArrowCount: number;
        reservedArrowCount: number;
      }
    | null;
  selectedArrowDropReadout?:
    | {
        droppableArrowCount: number;
        reservedArrowCount: number;
      }
    | null;
  selectedGrapplingHookReadout?:
    | {
        status: SelectedGrapplingHookReadoutStatus;
      }
    | null;
  selectedBedReadout?:
    | {
        status: SelectedBedReadoutStatus;
      }
    | null;
  selectedDoorReadout?:
    | {
        status: SelectedDoorReadoutStatus;
        verb: SelectedDoorReadoutVerb;
      }
    | null;
  healingPotionCooldownFillNormalized?: number | null;
  starterWandManaReadout?:
    | {
        currentMana: number;
        maxMana: number;
        manaCost: number;
      }
    | null;
  starterWandCooldownFillNormalized?: number | null;
  manaCrystalBlockedReason?: 'dead' | 'max-mana-cap' | null;
  heartCrystalBlockedReason?: 'dead' | 'max-health-cap' | null;
  starterMeleeWeaponSwingFeedback?:
    | {
        phase: StarterMeleeWeaponSwingPhase;
        timingFillNormalized: number;
      }
    | null;
  starterPickaxeSwingFeedback?:
    | {
        phase: StarterPickaxeSwingPhase;
        timingFillNormalized: number;
      }
    | null;
  starterSpearThrustFeedback?:
    | {
        phase: StarterSpearThrustPhase;
        timingFillNormalized: number;
      }
    | null;
  starterBugNetSwingFeedback?:
    | {
        phase: StarterBugNetSwingPhase;
        timingFillNormalized: number;
      }
    | null;
}

interface HotbarSlotElements {
  button: HTMLButtonElement;
  shortcutLabel: HTMLDivElement;
  itemLabel: HTMLDivElement;
  amountLabel: HTMLDivElement;
  cooldownFill: HTMLDivElement;
}

const applySlotSelectionStyles = (button: HTMLButtonElement, selected: boolean, empty: boolean): void => {
  button.style.borderColor = selected ? 'rgba(255, 214, 120, 0.92)' : 'rgba(255, 255, 255, 0.18)';
  button.style.background = selected
    ? 'rgba(49, 40, 13, 0.92)'
    : empty
      ? 'rgba(10, 14, 20, 0.72)'
      : 'rgba(19, 27, 39, 0.88)';
  button.style.boxShadow = selected
    ? '0 0 0 1px rgba(255, 214, 120, 0.35), 0 10px 24px rgba(0, 0, 0, 0.34)'
    : '0 8px 18px rgba(0, 0, 0, 0.28)';
  button.style.transform = selected ? 'translateY(-2px)' : 'translateY(0)';
};

const clampUnitInterval = (value: number): number => Math.max(0, Math.min(1, value));

const HEALING_POTION_COOLDOWN_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(255, 217, 143, 0.04) 0%, rgba(255, 184, 96, 0.22) 35%, rgba(255, 150, 74, 0.62) 100%)';
const STARTER_WAND_COOLDOWN_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(219, 230, 255, 0.05) 0%, rgba(143, 181, 255, 0.24) 35%, rgba(77, 123, 255, 0.62) 100%)';
const STARTER_WAND_MANA_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(210, 255, 254, 0.05) 0%, rgba(113, 229, 255, 0.24) 35%, rgba(47, 178, 214, 0.62) 100%)';
const STARTER_WAND_COOLDOWN_TITLE_TEXT = 'cast cooldown active';
const STARTER_WAND_COOLDOWN_AMOUNT_TEXT = 'COOL';
const STARTER_WAND_COOLDOWN_AMOUNT_COLOR = '#d8e4ff';
const STARTER_WAND_MANA_AMOUNT_TEXT = 'MANA';
const STARTER_WAND_MANA_AMOUNT_COLOR = '#c9f6ff';
const SELECTED_BOW_DRAW_COOLDOWN_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(255, 232, 187, 0.05) 0%, rgba(232, 181, 104, 0.24) 35%, rgba(173, 108, 44, 0.62) 100%)';
const SELECTED_BOW_DRAW_COOLDOWN_TITLE_TEXT = 'draw cooldown active';
const SELECTED_BOW_DRAW_COOLDOWN_AMOUNT_TEXT = 'DRAW';
const SELECTED_BOW_DRAW_COOLDOWN_AMOUNT_COLOR = '#ffe5b7';
const SELECTED_BOW_EMPTY_AMOUNT_TEXT = 'EMPTY';
const SELECTED_BOW_EMPTY_AMOUNT_COLOR = '#ffd2d2';
const SELECTED_GRAPPLING_HOOK_ACTIVE_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(228, 250, 255, 0.05) 0%, rgba(149, 222, 255, 0.24) 35%, rgba(77, 165, 214, 0.62) 100%)';
const SELECTED_GRAPPLING_HOOK_ACTIVE_TITLE_TEXT = 'hook active';
const SELECTED_GRAPPLING_HOOK_ACTIVE_AMOUNT_TEXT = 'HOOK';
const SELECTED_GRAPPLING_HOOK_ACTIVE_AMOUNT_COLOR = '#d6efff';
const SELECTED_GRAPPLING_HOOK_DEAD_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(255, 170, 170, 0.08) 0%, rgba(255, 112, 112, 0.3) 35%, rgba(204, 52, 52, 0.68) 100%)';
const SELECTED_GRAPPLING_HOOK_DEAD_TITLE_TEXT = 'blocked: player is dead';
const SELECTED_GRAPPLING_HOOK_DEAD_AMOUNT_TEXT = 'DEAD';
const SELECTED_GRAPPLING_HOOK_DEAD_AMOUNT_COLOR = '#ffd2d2';
const SELECTED_GRAPPLING_HOOK_LATCH_READY_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(176, 255, 247, 0.05) 0%, rgba(102, 231, 222, 0.24) 35%, rgba(37, 176, 166, 0.62) 100%)';
const SELECTED_GRAPPLING_HOOK_LATCH_READY_TITLE_TEXT = 'ready: solid latch target in range';
const SELECTED_GRAPPLING_HOOK_LATCH_READY_AMOUNT_TEXT = 'READY';
const SELECTED_GRAPPLING_HOOK_LATCH_READY_AMOUNT_COLOR = '#c9fff8';
const SELECTED_GRAPPLING_HOOK_RANGE_BLOCK_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(255, 224, 173, 0.06) 0%, rgba(255, 181, 102, 0.28) 35%, rgba(214, 122, 52, 0.64) 100%)';
const SELECTED_GRAPPLING_HOOK_RANGE_BLOCK_TITLE_TEXT = 'blocked: beyond maximum range';
const SELECTED_GRAPPLING_HOOK_RANGE_BLOCK_AMOUNT_TEXT = 'RANGE';
const SELECTED_GRAPPLING_HOOK_RANGE_BLOCK_AMOUNT_COLOR = '#ffd7a6';
const SELECTED_GRAPPLING_HOOK_TITLE_TEXT: Record<SelectedGrapplingHookReadoutStatus, string> = {
  active: SELECTED_GRAPPLING_HOOK_ACTIVE_TITLE_TEXT,
  dead: SELECTED_GRAPPLING_HOOK_DEAD_TITLE_TEXT,
  'latch-ready': SELECTED_GRAPPLING_HOOK_LATCH_READY_TITLE_TEXT,
  'range-blocked': SELECTED_GRAPPLING_HOOK_RANGE_BLOCK_TITLE_TEXT
};
const SELECTED_GRAPPLING_HOOK_AMOUNT_TEXT: Record<SelectedGrapplingHookReadoutStatus, string> = {
  active: SELECTED_GRAPPLING_HOOK_ACTIVE_AMOUNT_TEXT,
  dead: SELECTED_GRAPPLING_HOOK_DEAD_AMOUNT_TEXT,
  'latch-ready': SELECTED_GRAPPLING_HOOK_LATCH_READY_AMOUNT_TEXT,
  'range-blocked': SELECTED_GRAPPLING_HOOK_RANGE_BLOCK_AMOUNT_TEXT
};
const SELECTED_GRAPPLING_HOOK_AMOUNT_COLOR: Record<SelectedGrapplingHookReadoutStatus, string> = {
  active: SELECTED_GRAPPLING_HOOK_ACTIVE_AMOUNT_COLOR,
  dead: SELECTED_GRAPPLING_HOOK_DEAD_AMOUNT_COLOR,
  'latch-ready': SELECTED_GRAPPLING_HOOK_LATCH_READY_AMOUNT_COLOR,
  'range-blocked': SELECTED_GRAPPLING_HOOK_RANGE_BLOCK_AMOUNT_COLOR
};
const SELECTED_GRAPPLING_HOOK_FILL_BACKGROUND: Record<
  SelectedGrapplingHookReadoutStatus,
  string
> = {
  active: SELECTED_GRAPPLING_HOOK_ACTIVE_FILL_BACKGROUND,
  dead: SELECTED_GRAPPLING_HOOK_DEAD_FILL_BACKGROUND,
  'latch-ready': SELECTED_GRAPPLING_HOOK_LATCH_READY_FILL_BACKGROUND,
  'range-blocked': SELECTED_GRAPPLING_HOOK_RANGE_BLOCK_FILL_BACKGROUND
};
const SELECTED_BED_CLAIM_READY_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(176, 255, 247, 0.05) 0%, rgba(102, 231, 222, 0.24) 35%, rgba(37, 176, 166, 0.62) 100%)';
const SELECTED_BED_CLAIM_READY_TITLE_TEXT = 'ready: claim placed bed checkpoint in range';
const SELECTED_BED_CLAIM_READY_AMOUNT_TEXT = 'READY';
const SELECTED_BED_CLAIM_READY_AMOUNT_COLOR = '#c9fff8';
const SELECTED_BED_CLAIM_BLOCKED_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(255, 212, 196, 0.08) 0%, rgba(255, 146, 122, 0.3) 35%, rgba(212, 88, 62, 0.66) 100%)';
const SELECTED_BED_CLAIM_BLOCKED_TITLE_TEXT =
  'blocked: claim placed bed checkpoint beyond reach';
const SELECTED_BED_CLAIM_BLOCKED_AMOUNT_TEXT = 'RANGE';
const SELECTED_BED_CLAIM_BLOCKED_AMOUNT_COLOR = '#ffd0c8';
const SELECTED_BED_TITLE_TEXT: Record<SelectedBedReadoutStatus, string> = {
  'claim-ready': SELECTED_BED_CLAIM_READY_TITLE_TEXT,
  'claim-blocked': SELECTED_BED_CLAIM_BLOCKED_TITLE_TEXT
};
const SELECTED_BED_AMOUNT_TEXT: Record<SelectedBedReadoutStatus, string> = {
  'claim-ready': SELECTED_BED_CLAIM_READY_AMOUNT_TEXT,
  'claim-blocked': SELECTED_BED_CLAIM_BLOCKED_AMOUNT_TEXT
};
const SELECTED_BED_AMOUNT_COLOR: Record<SelectedBedReadoutStatus, string> = {
  'claim-ready': SELECTED_BED_CLAIM_READY_AMOUNT_COLOR,
  'claim-blocked': SELECTED_BED_CLAIM_BLOCKED_AMOUNT_COLOR
};
const SELECTED_BED_FILL_BACKGROUND: Record<SelectedBedReadoutStatus, string> = {
  'claim-ready': SELECTED_BED_CLAIM_READY_FILL_BACKGROUND,
  'claim-blocked': SELECTED_BED_CLAIM_BLOCKED_FILL_BACKGROUND
};
const SELECTED_DOOR_TOGGLE_READY_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(176, 255, 247, 0.05) 0%, rgba(102, 231, 222, 0.24) 35%, rgba(37, 176, 166, 0.62) 100%)';
const SELECTED_DOOR_TOGGLE_READY_AMOUNT_TEXT = 'READY';
const SELECTED_DOOR_TOGGLE_READY_AMOUNT_COLOR = '#c9fff8';
const SELECTED_DOOR_TOGGLE_BLOCKED_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(255, 212, 196, 0.08) 0%, rgba(255, 146, 122, 0.3) 35%, rgba(212, 88, 62, 0.66) 100%)';
const SELECTED_DOOR_TOGGLE_BLOCKED_AMOUNT_TEXT = 'RANGE';
const SELECTED_DOOR_TOGGLE_BLOCKED_AMOUNT_COLOR = '#ffd0c8';
const SELECTED_DOOR_VERB_TEXT: Record<SelectedDoorReadoutVerb, string> = {
  open: 'Open',
  close: 'Close'
};
const SELECTED_DOOR_AMOUNT_TEXT: Record<SelectedDoorReadoutStatus, string> = {
  'toggle-ready': SELECTED_DOOR_TOGGLE_READY_AMOUNT_TEXT,
  'toggle-blocked': SELECTED_DOOR_TOGGLE_BLOCKED_AMOUNT_TEXT
};
const SELECTED_DOOR_AMOUNT_COLOR: Record<SelectedDoorReadoutStatus, string> = {
  'toggle-ready': SELECTED_DOOR_TOGGLE_READY_AMOUNT_COLOR,
  'toggle-blocked': SELECTED_DOOR_TOGGLE_BLOCKED_AMOUNT_COLOR
};
const SELECTED_DOOR_FILL_BACKGROUND: Record<SelectedDoorReadoutStatus, string> = {
  'toggle-ready': SELECTED_DOOR_TOGGLE_READY_FILL_BACKGROUND,
  'toggle-blocked': SELECTED_DOOR_TOGGLE_BLOCKED_FILL_BACKGROUND
};
const formatSelectedDoorTitleText = (
  status: SelectedDoorReadoutStatus,
  verb: SelectedDoorReadoutVerb
): string =>
  status === 'toggle-ready'
    ? `ready: ${SELECTED_DOOR_VERB_TEXT[verb]} placed door in range`
    : `blocked: ${SELECTED_DOOR_VERB_TEXT[verb]} placed door beyond reach`;
const MANA_CRYSTAL_DEAD_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(255, 170, 170, 0.08) 0%, rgba(255, 112, 112, 0.3) 35%, rgba(204, 52, 52, 0.68) 100%)';
const MANA_CRYSTAL_MAX_MANA_CAP_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(192, 241, 255, 0.08) 0%, rgba(92, 201, 255, 0.26) 35%, rgba(30, 132, 214, 0.66) 100%)';
const MANA_CRYSTAL_BLOCKED_TITLE_TEXT: Record<'dead' | 'max-mana-cap', string> = {
  dead: 'blocked: player is dead',
  'max-mana-cap': 'blocked: already at 200 max mana'
};
const MANA_CRYSTAL_BLOCKED_AMOUNT_TEXT: Record<'dead' | 'max-mana-cap', string> = {
  dead: 'DEAD',
  'max-mana-cap': 'MAX'
};
const MANA_CRYSTAL_BLOCKED_AMOUNT_COLOR: Record<'dead' | 'max-mana-cap', string> = {
  dead: '#ffd2d2',
  'max-mana-cap': '#c9f6ff'
};
const MANA_CRYSTAL_BLOCKED_FILL_BACKGROUND: Record<'dead' | 'max-mana-cap', string> = {
  dead: MANA_CRYSTAL_DEAD_FILL_BACKGROUND,
  'max-mana-cap': MANA_CRYSTAL_MAX_MANA_CAP_FILL_BACKGROUND
};
const HEART_CRYSTAL_DEAD_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(255, 170, 170, 0.08) 0%, rgba(255, 112, 112, 0.3) 35%, rgba(204, 52, 52, 0.68) 100%)';
const HEART_CRYSTAL_MAX_HEALTH_CAP_FILL_BACKGROUND =
  'linear-gradient(180deg, rgba(202, 235, 255, 0.08) 0%, rgba(124, 193, 255, 0.24) 35%, rgba(70, 142, 224, 0.62) 100%)';
const HEART_CRYSTAL_BLOCKED_TITLE_TEXT: Record<'dead' | 'max-health-cap', string> = {
  dead: 'blocked: player is dead',
  'max-health-cap': 'blocked: already at 400 max health'
};
const HEART_CRYSTAL_BLOCKED_AMOUNT_TEXT: Record<'dead' | 'max-health-cap', string> = {
  dead: 'DEAD',
  'max-health-cap': 'MAX'
};
const HEART_CRYSTAL_BLOCKED_AMOUNT_COLOR: Record<'dead' | 'max-health-cap', string> = {
  dead: '#ffd2d2',
  'max-health-cap': '#cdeaff'
};
const HEART_CRYSTAL_BLOCKED_FILL_BACKGROUND: Record<'dead' | 'max-health-cap', string> = {
  dead: HEART_CRYSTAL_DEAD_FILL_BACKGROUND,
  'max-health-cap': HEART_CRYSTAL_MAX_HEALTH_CAP_FILL_BACKGROUND
};
type HotbarTimedItemPhase =
  | StarterAxeSwingPhase
  | StarterBugNetSwingPhase
  | StarterMeleeWeaponSwingPhase
  | StarterPickaxeSwingPhase
  | StarterSpearThrustPhase;
const HOTBAR_TIMED_ITEM_AMOUNT_TEXT: Record<HotbarTimedItemPhase, string> = {
  windup: 'WIND',
  active: 'ACT',
  recovery: 'REC'
};
const HOTBAR_TIMED_ITEM_AMOUNT_COLOR: Record<HotbarTimedItemPhase, string> = {
  windup: '#ffe5ad',
  active: '#ffd4c7',
  recovery: '#cdeaff'
};
const HOTBAR_TIMED_ITEM_FILL_BACKGROUND: Record<HotbarTimedItemPhase, string> = {
  windup:
    'linear-gradient(180deg, rgba(255, 236, 176, 0.04) 0%, rgba(255, 204, 118, 0.24) 35%, rgba(255, 164, 82, 0.62) 100%)',
  active:
    'linear-gradient(180deg, rgba(255, 204, 190, 0.04) 0%, rgba(255, 144, 124, 0.24) 35%, rgba(224, 82, 62, 0.64) 100%)',
  recovery:
    'linear-gradient(180deg, rgba(214, 236, 255, 0.04) 0%, rgba(148, 198, 255, 0.2) 35%, rgba(86, 148, 224, 0.58) 100%)'
};
const STARTER_MELEE_WEAPON_SWING_TITLE_TEXT: Record<StarterMeleeWeaponSwingPhase, string> = {
  windup: 'windup active',
  active: 'swing active',
  recovery: 'recovery active'
};
const STARTER_AXE_SWING_TITLE_TEXT: Record<StarterAxeSwingPhase, string> = {
  windup: 'windup active',
  active: 'swing active',
  recovery: 'recovery active'
};
const STARTER_PICKAXE_SWING_TITLE_TEXT: Record<StarterPickaxeSwingPhase, string> = {
  windup: 'windup active',
  active: 'swing active',
  recovery: 'recovery active'
};
const STARTER_SPEAR_THRUST_TITLE_TEXT: Record<StarterSpearThrustPhase, string> = {
  windup: 'windup active',
  active: 'thrust active',
  recovery: 'recovery active'
};
const STARTER_BUG_NET_SWING_TITLE_TEXT: Record<StarterBugNetSwingPhase, string> = {
  windup: 'windup active',
  active: 'swing active',
  recovery: 'recovery active'
};

const applySlotFillStyles = (
  fill: HTMLDivElement,
  normalized: number | null,
  background: string | null
): void => {
  if (normalized === null || normalized <= 0 || background === null) {
    fill.style.height = '0.0%';
    fill.style.opacity = '0';
    return;
  }

  fill.style.height = `${(clampUnitInterval(normalized) * 100).toFixed(1)}%`;
  fill.style.opacity = '1';
  fill.style.background = background;
};

const formatStarterWandManaTitleText = (
  currentMana: number,
  maxMana: number,
  manaCost: number
): string => {
  const baseTitle = `mana: ${Math.round(currentMana)}/${Math.round(maxMana)}`;
  return currentMana < manaCost
    ? `${baseTitle} (need ${Math.round(manaCost)} to cast)`
    : baseTitle;
};

const formatSelectedBowAmmoCountLabel = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? '' : 's'}`;

const formatSelectedBowAmmoTitleText = (
  availableArrowCount: number,
  reservedArrowCount: number
): string => {
  const baseTitle =
    availableArrowCount > 0
      ? `ammo: ${formatSelectedBowAmmoCountLabel(availableArrowCount, 'arrow')} available`
      : 'ammo: empty';
  return reservedArrowCount > 0
    ? `${baseTitle} (${formatSelectedBowAmmoCountLabel(reservedArrowCount, 'arrow')} reserved in flight)`
    : baseTitle;
};

const formatSelectedArrowDropTitleText = (
  droppableArrowCount: number,
  reservedArrowCount: number
): string => {
  if (droppableArrowCount <= 0) {
    return `drop: blocked (${formatSelectedBowAmmoCountLabel(
      reservedArrowCount,
      'arrow'
    )} reserved in flight)`;
  }

  return `drop: ${formatSelectedBowAmmoCountLabel(
    droppableArrowCount,
    'arrow'
  )} droppable (${formatSelectedBowAmmoCountLabel(reservedArrowCount, 'arrow')} reserved in flight)`;
};

const formatSelectedArrowDropOneButtonTitleText = (
  shortcutLabel: string,
  droppableArrowCount: number,
  reservedArrowCount: number
): string =>
  droppableArrowCount <= 0
    ? `Drop one Arrow blocked (${formatSelectedBowAmmoCountLabel(
        reservedArrowCount,
        'arrow'
      )} reserved in flight)`
    : `Drop one Arrow (${shortcutLabel}; ${formatSelectedBowAmmoCountLabel(
        droppableArrowCount,
        'arrow'
      )} droppable, ${formatSelectedBowAmmoCountLabel(
        reservedArrowCount,
        'arrow'
      )} reserved in flight)`;

const formatSelectedArrowDropStackButtonTitleText = (
  shortcutLabel: string,
  droppableArrowCount: number,
  reservedArrowCount: number
): string =>
  droppableArrowCount <= 0
    ? `Drop Arrow stack blocked (${formatSelectedBowAmmoCountLabel(
        reservedArrowCount,
        'arrow'
      )} reserved in flight)`
    : `Drop ${formatSelectedBowAmmoCountLabel(
        droppableArrowCount,
        'unreserved arrow'
      )} (${shortcutLabel}; ${formatSelectedBowAmmoCountLabel(
        reservedArrowCount,
        'arrow'
      )} reserved in flight)`;

export class HotbarOverlay {
  private root: HTMLDivElement;
  private actionRow: HTMLDivElement;
  private slotRow: HTMLDivElement;
  private moveLeftButton: HTMLButtonElement;
  private dropOneButton: HTMLButtonElement;
  private dropStackButton: HTMLButtonElement;
  private moveRightButton: HTMLButtonElement;
  private dropEnabled = false;
  private moveSelectedLeftEnabled = false;
  private moveSelectedRightEnabled = false;
  private slots: HotbarSlotElements[] = [];

  constructor(options: HotbarOverlayOptions) {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '50%';
    this.root.style.bottom = '18px';
    this.root.style.transform = 'translateX(-50%)';
    this.root.style.zIndex = '22';
    this.root.style.display = 'none';
    this.root.style.flexDirection = 'column';
    this.root.style.alignItems = 'center';
    this.root.style.gap = '6px';
    this.root.style.pointerEvents = 'none';
    this.root.style.maxWidth = 'calc(100vw - 24px)';

    this.actionRow = document.createElement('div');
    this.actionRow.style.display = 'flex';
    this.actionRow.style.flexWrap = 'wrap';
    this.actionRow.style.justifyContent = 'center';
    this.actionRow.style.alignItems = 'center';
    this.actionRow.style.gap = '6px';
    this.actionRow.style.pointerEvents = 'none';
    this.root.append(this.actionRow);

    const createActionButton = (
      label: string,
      isEnabled: () => boolean,
      onClick?: () => void
    ): HTMLButtonElement => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.style.minWidth = '76px';
      button.style.height = '32px';
      button.style.padding = '0 12px';
      button.style.borderRadius = '999px';
      button.style.border = '1px solid rgba(255, 255, 255, 0.18)';
      button.style.background = 'rgba(10, 14, 20, 0.72)';
      button.style.color = '#f5f7fa';
      button.style.font = '700 12px/1 system-ui, sans-serif';
      button.style.letterSpacing = '0.08em';
      button.style.cursor = 'pointer';
      button.style.backdropFilter = 'blur(8px)';
      button.style.pointerEvents = 'auto';
      button.style.transition =
        'transform 120ms ease, border-color 120ms ease, background 120ms ease, opacity 120ms ease';
      button.addEventListener('click', () => {
        if (!isEnabled()) {
          return;
        }
        onClick?.();
      });
      installPointerClickFocusRelease(button);
      return button;
    };

    this.moveLeftButton = createActionButton(
      'LEFT',
      () => this.moveSelectedLeftEnabled,
      options.onMoveSelectedLeft
    );
    this.actionRow.append(this.moveLeftButton);

    this.dropOneButton = createActionButton(
      'DROP 1',
      () => this.dropEnabled,
      options.onDropSelectedOne
    );
    this.actionRow.append(this.dropOneButton);

    this.dropStackButton = createActionButton(
      'DROP',
      () => this.dropEnabled,
      options.onDropSelectedStack
    );
    this.actionRow.append(this.dropStackButton);

    this.moveRightButton = createActionButton(
      'RIGHT',
      () => this.moveSelectedRightEnabled,
      options.onMoveSelectedRight
    );
    this.actionRow.append(this.moveRightButton);

    this.slotRow = document.createElement('div');
    this.slotRow.style.display = 'flex';
    this.slotRow.style.alignItems = 'flex-end';
    this.slotRow.style.gap = '6px';
    this.slotRow.style.pointerEvents = 'none';
    this.slotRow.style.maxWidth = 'calc(100vw - 24px)';
    this.root.append(this.slotRow);

    for (let slotIndex = 0; slotIndex < 10; slotIndex += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.width = '60px';
      button.style.height = '72px';
      button.style.padding = '8px 6px 6px';
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.style.display = 'flex';
      button.style.flexDirection = 'column';
      button.style.justifyContent = 'space-between';
      button.style.alignItems = 'stretch';
      button.style.borderRadius = '14px';
      button.style.border = '1px solid rgba(255, 255, 255, 0.18)';
      button.style.cursor = 'pointer';
      button.style.color = '#f5f7fa';
      button.style.backdropFilter = 'blur(8px)';
      button.style.pointerEvents = 'auto';
      button.style.transition = 'transform 120ms ease, border-color 120ms ease, background 120ms ease';

      const shortcutLabel = document.createElement('div');
      shortcutLabel.style.position = 'relative';
      shortcutLabel.style.zIndex = '1';
      shortcutLabel.style.font = '600 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      shortcutLabel.style.color = 'rgba(255, 255, 255, 0.76)';
      shortcutLabel.style.textAlign = 'left';
      shortcutLabel.textContent = getHotbarSlotShortcutLabel(slotIndex) ?? '';
      button.append(shortcutLabel);

      const itemLabel = document.createElement('div');
      itemLabel.style.position = 'relative';
      itemLabel.style.zIndex = '1';
      itemLabel.style.font = '700 12px/1.1 system-ui, sans-serif';
      itemLabel.style.letterSpacing = '0.05em';
      itemLabel.style.textAlign = 'center';
      itemLabel.style.wordBreak = 'break-word';
      button.append(itemLabel);

      const amountLabel = document.createElement('div');
      amountLabel.style.position = 'relative';
      amountLabel.style.zIndex = '1';
      amountLabel.style.font = '600 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      amountLabel.style.textAlign = 'right';
      amountLabel.style.color = '#ffe7a3';
      button.append(amountLabel);

      const cooldownFill = document.createElement('div');
      cooldownFill.style.position = 'absolute';
      cooldownFill.style.left = '0';
      cooldownFill.style.right = '0';
      cooldownFill.style.bottom = '0';
      cooldownFill.style.height = '0.0%';
      cooldownFill.style.opacity = '0';
      cooldownFill.style.pointerEvents = 'none';
      cooldownFill.style.background = HEALING_POTION_COOLDOWN_FILL_BACKGROUND;
      cooldownFill.style.transition = 'height 120ms linear, opacity 120ms ease';
      button.append(cooldownFill);

      button.addEventListener('click', () => {
        options.onSelectSlot?.(slotIndex);
      });
      installPointerClickFocusRelease(button);

      this.slotRow.append(button);
      this.slots.push({
        button,
        shortcutLabel,
        itemLabel,
        amountLabel,
        cooldownFill
      });
    }

    options.host.append(this.root);
  }

  getRootElement(): HTMLDivElement {
    return this.root;
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? 'flex' : 'none';
    this.root.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  update(state: PlayerInventoryState, options: HotbarOverlayUpdateOptions = {}): void {
    const starterAxeSwingFeedback = options.starterAxeSwingFeedback ?? null;
    const selectedBowDrawCooldownFillNormalized =
      typeof options.selectedBowDrawCooldownFillNormalized === 'number'
        ? clampUnitInterval(options.selectedBowDrawCooldownFillNormalized)
        : null;
    const selectedBowAmmoReadout = options.selectedBowAmmoReadout ?? null;
    const selectedArrowDropReadout = options.selectedArrowDropReadout ?? null;
    const selectedGrapplingHookReadout = options.selectedGrapplingHookReadout ?? null;
    const selectedBedReadout = options.selectedBedReadout ?? null;
    const selectedDoorReadout = options.selectedDoorReadout ?? null;
    const healingPotionCooldownFillNormalized =
      typeof options.healingPotionCooldownFillNormalized === 'number'
        ? clampUnitInterval(options.healingPotionCooldownFillNormalized)
        : null;
    const starterWandManaReadout = options.starterWandManaReadout ?? null;
    const starterWandCooldownFillNormalized =
      typeof options.starterWandCooldownFillNormalized === 'number'
        ? clampUnitInterval(options.starterWandCooldownFillNormalized)
        : null;
    const heartCrystalBlockedReason = options.heartCrystalBlockedReason ?? null;
    const manaCrystalBlockedReason = options.manaCrystalBlockedReason ?? null;
    const starterMeleeWeaponSwingFeedback = options.starterMeleeWeaponSwingFeedback ?? null;
    const starterPickaxeSwingFeedback = options.starterPickaxeSwingFeedback ?? null;
    const starterSpearThrustFeedback = options.starterSpearThrustFeedback ?? null;
    const starterBugNetSwingFeedback = options.starterBugNetSwingFeedback ?? null;
    for (let slotIndex = 0; slotIndex < this.slots.length; slotIndex += 1) {
      const slotElements = this.slots[slotIndex]!;
      const stack = state.hotbar[slotIndex] ?? null;
      const selected = slotIndex === state.selectedHotbarSlotIndex;
      const empty = stack === null;

      applySlotSelectionStyles(slotElements.button, selected, empty);
      slotElements.button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      slotElements.shortcutLabel.textContent = getHotbarSlotShortcutLabel(slotIndex) ?? '';

      if (stack === null) {
        slotElements.button.title = `Select empty hotbar slot ${slotIndex + 1}`;
        slotElements.itemLabel.textContent = 'EMPTY';
        slotElements.itemLabel.style.color = 'rgba(255, 255, 255, 0.42)';
        slotElements.amountLabel.textContent = '';
        applySlotFillStyles(slotElements.cooldownFill, null, null);
        continue;
      }

      const definition = getPlayerInventoryItemDefinition(stack.itemId);
      const blockedConsumable =
        stack.itemId === 'mana-crystal' && manaCrystalBlockedReason !== null
          ? {
              titleText: MANA_CRYSTAL_BLOCKED_TITLE_TEXT[manaCrystalBlockedReason],
              amountText: MANA_CRYSTAL_BLOCKED_AMOUNT_TEXT[manaCrystalBlockedReason],
              amountColor: MANA_CRYSTAL_BLOCKED_AMOUNT_COLOR[manaCrystalBlockedReason],
              fillBackground: MANA_CRYSTAL_BLOCKED_FILL_BACKGROUND[manaCrystalBlockedReason]
            }
          : stack.itemId === 'heart-crystal' && heartCrystalBlockedReason !== null
            ? {
                titleText: HEART_CRYSTAL_BLOCKED_TITLE_TEXT[heartCrystalBlockedReason],
                amountText: HEART_CRYSTAL_BLOCKED_AMOUNT_TEXT[heartCrystalBlockedReason],
                amountColor: HEART_CRYSTAL_BLOCKED_AMOUNT_COLOR[heartCrystalBlockedReason],
                fillBackground:
                  HEART_CRYSTAL_BLOCKED_FILL_BACKGROUND[heartCrystalBlockedReason]
              }
            : null;
      const selectedBowCoolingDown =
        selected && stack.itemId === 'bow' && selectedBowDrawCooldownFillNormalized !== null;
      const selectedBowAmmo =
        selected &&
        stack.itemId === 'bow' &&
        selectedBowAmmoReadout !== null &&
        !selectedBowCoolingDown
          ? {
              availableArrowCount: Math.max(
                0,
                Math.floor(selectedBowAmmoReadout.availableArrowCount)
              ),
              reservedArrowCount: Math.max(
                0,
                Math.floor(selectedBowAmmoReadout.reservedArrowCount)
              )
            }
          : null;
      const selectedArrowDropLimit =
        selected &&
        stack.itemId === 'arrow' &&
        selectedArrowDropReadout !== null
          ? {
              droppableArrowCount: Math.max(
                0,
                Math.min(
                  stack.amount,
                  Math.floor(selectedArrowDropReadout.droppableArrowCount)
                )
              ),
              reservedArrowCount: Math.max(
                0,
                Math.floor(selectedArrowDropReadout.reservedArrowCount)
              )
            }
          : null;
      const selectedArrowShowingDropLimit =
        selectedArrowDropLimit !== null &&
        selectedArrowDropLimit.droppableArrowCount < stack.amount;
      const selectedGrapplingHookState =
        selected && stack.itemId === 'grappling-hook' && selectedGrapplingHookReadout !== null
          ? selectedGrapplingHookReadout
          : null;
      const selectedBedState =
        selected && stack.itemId === 'bed' && selectedBedReadout !== null
          ? selectedBedReadout
          : null;
      const selectedDoorState =
        selected && stack.itemId === 'door' && selectedDoorReadout !== null
          ? selectedDoorReadout
          : null;
      const selectedTimedItemFeedback =
        selected && stack.itemId === 'axe' && starterAxeSwingFeedback !== null
          ? {
              phase: starterAxeSwingFeedback.phase,
              timingFillNormalized: clampUnitInterval(
                starterAxeSwingFeedback.timingFillNormalized
              ),
              titleText: STARTER_AXE_SWING_TITLE_TEXT[starterAxeSwingFeedback.phase]
            }
          : selected && stack.itemId === 'sword' && starterMeleeWeaponSwingFeedback !== null
          ? {
              phase: starterMeleeWeaponSwingFeedback.phase,
              timingFillNormalized: clampUnitInterval(
                starterMeleeWeaponSwingFeedback.timingFillNormalized
              ),
              titleText:
                STARTER_MELEE_WEAPON_SWING_TITLE_TEXT[starterMeleeWeaponSwingFeedback.phase]
            }
          : selected && stack.itemId === 'pickaxe' && starterPickaxeSwingFeedback !== null
          ? {
              phase: starterPickaxeSwingFeedback.phase,
              timingFillNormalized: clampUnitInterval(
                starterPickaxeSwingFeedback.timingFillNormalized
              ),
              titleText: STARTER_PICKAXE_SWING_TITLE_TEXT[starterPickaxeSwingFeedback.phase]
            }
          : selected && stack.itemId === 'spear' && starterSpearThrustFeedback !== null
          ? {
              phase: starterSpearThrustFeedback.phase,
              timingFillNormalized: clampUnitInterval(
                starterSpearThrustFeedback.timingFillNormalized
              ),
              titleText: STARTER_SPEAR_THRUST_TITLE_TEXT[starterSpearThrustFeedback.phase]
            }
          : selected && stack.itemId === 'bug-net' && starterBugNetSwingFeedback !== null
          ? {
              phase: starterBugNetSwingFeedback.phase,
              timingFillNormalized: clampUnitInterval(
                starterBugNetSwingFeedback.timingFillNormalized
              ),
              titleText: STARTER_BUG_NET_SWING_TITLE_TEXT[starterBugNetSwingFeedback.phase]
            }
          : null;
      const selectedWandCoolingDown =
        selected && stack.itemId === 'wand' && starterWandCooldownFillNormalized !== null;
      const selectedWandShowingMana =
        selected &&
        stack.itemId === 'wand' &&
        starterWandManaReadout !== null &&
        !selectedWandCoolingDown &&
        starterWandManaReadout.maxMana > 0 &&
        starterWandManaReadout.currentMana < starterWandManaReadout.maxMana;
      const coolingDown =
        stack.itemId === 'healing-potion' && healingPotionCooldownFillNormalized !== null;
      slotElements.button.title = blockedConsumable !== null
          ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${blockedConsumable.titleText})`
        : selectedTimedItemFeedback !== null
          ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${selectedTimedItemFeedback.titleText})`
        : selectedGrapplingHookState !== null
          ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${SELECTED_GRAPPLING_HOOK_TITLE_TEXT[selectedGrapplingHookState.status]})`
        : selectedBedState !== null
          ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${SELECTED_BED_TITLE_TEXT[selectedBedState.status]})`
        : selectedDoorState !== null
          ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${formatSelectedDoorTitleText(
              selectedDoorState.status,
              selectedDoorState.verb
            )})`
        : selectedBowCoolingDown
          ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${SELECTED_BOW_DRAW_COOLDOWN_TITLE_TEXT})`
        : selectedBowAmmo !== null
          ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${formatSelectedBowAmmoTitleText(
              selectedBowAmmo.availableArrowCount,
              selectedBowAmmo.reservedArrowCount
            )})`
        : selectedArrowShowingDropLimit
          ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${formatSelectedArrowDropTitleText(
              selectedArrowDropLimit.droppableArrowCount,
              selectedArrowDropLimit.reservedArrowCount
            )})`
        : selectedWandCoolingDown
            ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${STARTER_WAND_COOLDOWN_TITLE_TEXT})`
          : selectedWandShowingMana
            ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (${formatStarterWandManaTitleText(
                starterWandManaReadout.currentMana,
                starterWandManaReadout.maxMana,
                starterWandManaReadout.manaCost
              )})`
          : coolingDown
            ? `Select ${definition.label} in hotbar slot ${slotIndex + 1} (cooldown active)`
          : `Select ${definition.label} in hotbar slot ${slotIndex + 1}`;
      slotElements.itemLabel.textContent = definition.hotbarLabel;
      slotElements.itemLabel.style.color = '#f5f7fa';
      slotElements.amountLabel.textContent = blockedConsumable !== null
        ? blockedConsumable.amountText
        : selectedTimedItemFeedback !== null
          ? HOTBAR_TIMED_ITEM_AMOUNT_TEXT[selectedTimedItemFeedback.phase]
        : selectedGrapplingHookState !== null
            ? SELECTED_GRAPPLING_HOOK_AMOUNT_TEXT[selectedGrapplingHookState.status]
          : selectedBedState !== null
            ? SELECTED_BED_AMOUNT_TEXT[selectedBedState.status]
          : selectedDoorState !== null
            ? SELECTED_DOOR_AMOUNT_TEXT[selectedDoorState.status]
          : selectedBowCoolingDown
            ? SELECTED_BOW_DRAW_COOLDOWN_AMOUNT_TEXT
          : selectedBowAmmo !== null
            ? selectedBowAmmo.availableArrowCount > 0
              ? String(selectedBowAmmo.availableArrowCount)
              : SELECTED_BOW_EMPTY_AMOUNT_TEXT
          : selectedWandCoolingDown
            ? STARTER_WAND_COOLDOWN_AMOUNT_TEXT
          : selectedWandShowingMana
            ? STARTER_WAND_MANA_AMOUNT_TEXT
          : stack.amount > 1
            ? String(stack.amount)
          : '';
      slotElements.amountLabel.style.color = blockedConsumable !== null
        ? blockedConsumable.amountColor
        : selectedTimedItemFeedback !== null
          ? HOTBAR_TIMED_ITEM_AMOUNT_COLOR[selectedTimedItemFeedback.phase]
        : selectedGrapplingHookState !== null
            ? SELECTED_GRAPPLING_HOOK_AMOUNT_COLOR[selectedGrapplingHookState.status]
          : selectedBedState !== null
            ? SELECTED_BED_AMOUNT_COLOR[selectedBedState.status]
          : selectedDoorState !== null
            ? SELECTED_DOOR_AMOUNT_COLOR[selectedDoorState.status]
          : selectedBowCoolingDown
            ? SELECTED_BOW_DRAW_COOLDOWN_AMOUNT_COLOR
          : selectedBowAmmo !== null && selectedBowAmmo.availableArrowCount <= 0
            ? SELECTED_BOW_EMPTY_AMOUNT_COLOR
          : selectedWandCoolingDown
            ? STARTER_WAND_COOLDOWN_AMOUNT_COLOR
          : selectedWandShowingMana
            ? STARTER_WAND_MANA_AMOUNT_COLOR
        : '#ffe7a3';
      applySlotFillStyles(
        slotElements.cooldownFill,
        blockedConsumable !== null
          ? 1
          : selectedTimedItemFeedback !== null
            ? selectedTimedItemFeedback.timingFillNormalized
            : selectedGrapplingHookState !== null
              ? 1
            : selectedBedState !== null
              ? 1
            : selectedDoorState !== null
              ? 1
            : selectedBowCoolingDown
              ? selectedBowDrawCooldownFillNormalized
            : selectedWandCoolingDown
              ? starterWandCooldownFillNormalized
            : selectedWandShowingMana
              ? starterWandManaReadout.currentMana / starterWandManaReadout.maxMana
            : stack.itemId === 'healing-potion'
              ? healingPotionCooldownFillNormalized
            : null,
        blockedConsumable !== null
          ? blockedConsumable.fillBackground
          : selectedTimedItemFeedback !== null
            ? HOTBAR_TIMED_ITEM_FILL_BACKGROUND[selectedTimedItemFeedback.phase]
            : selectedGrapplingHookState !== null
              ? SELECTED_GRAPPLING_HOOK_FILL_BACKGROUND[selectedGrapplingHookState.status]
            : selectedBedState !== null
              ? SELECTED_BED_FILL_BACKGROUND[selectedBedState.status]
            : selectedDoorState !== null
              ? SELECTED_DOOR_FILL_BACKGROUND[selectedDoorState.status]
            : selectedBowCoolingDown
              ? SELECTED_BOW_DRAW_COOLDOWN_FILL_BACKGROUND
            : selectedWandCoolingDown
              ? STARTER_WAND_COOLDOWN_FILL_BACKGROUND
            : selectedWandShowingMana
              ? STARTER_WAND_MANA_FILL_BACKGROUND
          : stack.itemId === 'healing-potion'
            ? HEALING_POTION_COOLDOWN_FILL_BACKGROUND
            : null
      );
    }

    const selectedStack = state.hotbar[state.selectedHotbarSlotIndex] ?? null;
    const selectedArrowButtonDropReadout =
      selectedStack !== null &&
      selectedStack.itemId === 'arrow' &&
      selectedArrowDropReadout !== null
        ? {
            droppableArrowCount: Math.max(
              0,
              Math.min(
                selectedStack.amount,
                Math.floor(selectedArrowDropReadout.droppableArrowCount)
              )
            ),
            reservedArrowCount: Math.max(0, Math.floor(selectedArrowDropReadout.reservedArrowCount))
          }
        : null;
    this.dropEnabled =
      selectedStack !== null &&
      (selectedArrowButtonDropReadout === null ||
        selectedArrowButtonDropReadout.droppableArrowCount > 0);
    this.moveSelectedLeftEnabled = state.selectedHotbarSlotIndex > 0;
    this.moveSelectedRightEnabled = state.selectedHotbarSlotIndex < this.slots.length - 1;

    const syncActionButton = (
      button: HTMLButtonElement,
      enabled: boolean,
      activeBackground: string,
      activeBorderColor: string
    ): void => {
      button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
      button.style.opacity = enabled ? '1' : '0.45';
      button.style.transform = 'translateY(0)';
      button.style.background = enabled ? activeBackground : 'rgba(10, 14, 20, 0.72)';
      button.style.borderColor = enabled ? activeBorderColor : 'rgba(255, 255, 255, 0.18)';
    };

    syncActionButton(
      this.moveLeftButton,
      this.moveSelectedLeftEnabled,
      'rgba(25, 35, 56, 0.9)',
      'rgba(150, 190, 255, 0.52)'
    );
    syncActionButton(
      this.dropOneButton,
      this.dropEnabled,
      'rgba(18, 42, 55, 0.9)',
      'rgba(120, 220, 255, 0.52)'
    );
    syncActionButton(
      this.dropStackButton,
      this.dropEnabled,
      'rgba(45, 25, 18, 0.9)',
      'rgba(255, 170, 120, 0.5)'
    );
    syncActionButton(
      this.moveRightButton,
      this.moveSelectedRightEnabled,
      'rgba(25, 35, 56, 0.9)',
      'rgba(150, 190, 255, 0.52)'
    );

    this.moveLeftButton.title = this.moveSelectedLeftEnabled
      ? `Move selected hotbar slot left (${getMoveSelectedHotbarSlotLeftShortcutLabel()})`
      : 'Selected hotbar slot is already the leftmost slot';
    this.moveRightButton.title = this.moveSelectedRightEnabled
      ? `Move selected hotbar slot right (${getMoveSelectedHotbarSlotRightShortcutLabel()})`
      : 'Selected hotbar slot is already the rightmost slot';

    this.dropOneButton.title =
      selectedStack === null
        ? 'Selected hotbar slot is empty'
        : selectedArrowButtonDropReadout !== null &&
            selectedArrowButtonDropReadout.droppableArrowCount < selectedStack.amount
          ? formatSelectedArrowDropOneButtonTitleText(
              getDropOneSelectedHotbarItemShortcutLabel(),
              selectedArrowButtonDropReadout.droppableArrowCount,
              selectedArrowButtonDropReadout.reservedArrowCount
            )
          : `Drop one ${getPlayerInventoryItemDefinition(selectedStack.itemId).label} (${getDropOneSelectedHotbarItemShortcutLabel()})`;
    this.dropStackButton.title =
      selectedStack === null
        ? 'Selected hotbar slot is empty'
        : selectedArrowButtonDropReadout !== null &&
            selectedArrowButtonDropReadout.droppableArrowCount < selectedStack.amount
          ? formatSelectedArrowDropStackButtonTitleText(
              getDropSelectedHotbarStackShortcutLabel(),
              selectedArrowButtonDropReadout.droppableArrowCount,
              selectedArrowButtonDropReadout.reservedArrowCount
            )
          : `Drop ${getPlayerInventoryItemDefinition(selectedStack.itemId).label} stack (${getDropSelectedHotbarStackShortcutLabel()})`;
  }

  dispose(): void {
    this.root.remove();
  }
}
