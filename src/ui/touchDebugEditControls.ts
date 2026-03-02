import type { TouchDebugEditMode } from '../input/controller';
import {
  getDesktopDebugOverlayHotkeyLabel,
  getDesktopRecenterCameraHotkeyLabel,
  getDebugBrushSlotHotkeyLabel,
  getDebugEditPanelToggleHotkeyLabel,
  getDebugOneShotToolHotkeyLabel,
  getTouchDebugEditModeHotkeyLabel
} from '../input/debugEditShortcuts';
import { installPointerClickFocusRelease } from './buttonFocus';

export interface DebugBrushOption {
  tileId: number;
  label: string;
}

export interface DebugEditHistoryControlState {
  undoStrokeCount: number;
  redoStrokeCount: number;
}

interface TouchDebugEditControlsOptions {
  initialMode?: TouchDebugEditMode;
  onModeChange?: (mode: TouchDebugEditMode) => void;
  brushOptions?: readonly DebugBrushOption[];
  initialBrushTileId?: number;
  onBrushTileIdChange?: (tileId: number) => void;
  initialArmedFloodFillKind?: 'place' | 'break' | null;
  onArmFloodFill?: (kind: 'place' | 'break') => void;
  initialArmedLineKind?: 'place' | 'break' | null;
  onArmLine?: (kind: 'place' | 'break') => void;
  initialArmedRectKind?: 'place' | 'break' | null;
  onArmRect?: (kind: 'place' | 'break') => void;
  initialArmedRectOutlineKind?: 'place' | 'break' | null;
  onArmRectOutline?: (kind: 'place' | 'break') => void;
  initialArmedEllipseKind?: 'place' | 'break' | null;
  onArmEllipse?: (kind: 'place' | 'break') => void;
  initialArmedEllipseOutlineKind?: 'place' | 'break' | null;
  onArmEllipseOutline?: (kind: 'place' | 'break') => void;
  initialCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetPrefs?: () => void;
  initialHistoryState?: DebugEditHistoryControlState;
}

const TOUCH_DEBUG_BUTTON_ORDER: readonly TouchDebugEditMode[] = ['pan', 'place', 'break'];

const buttonLabelForMode = (mode: TouchDebugEditMode): string => {
  if (mode === 'pan') return 'Pan';
  if (mode === 'place') return 'Place';
  return 'Break';
};

export class TouchDebugEditControls {
  private root: HTMLDivElement;
  private collapsedSummary: HTMLDivElement;
  private content: HTMLDivElement;
  private collapseToggleButton: HTMLButtonElement;
  private buttons = new Map<TouchDebugEditMode, HTMLButtonElement>();
  private brushButtons = new Map<number, HTMLButtonElement>();
  private mode: TouchDebugEditMode;
  private brushTileId: number;
  private collapsed: boolean;
  private brushOptions: readonly DebugBrushOption[];
  private activeBrushIndicator: HTMLDivElement;
  private undoButton: HTMLButtonElement;
  private redoButton: HTMLButtonElement;
  private fillPlaceButton: HTMLButtonElement;
  private fillBreakButton: HTMLButtonElement;
  private linePlaceButton: HTMLButtonElement;
  private lineBreakButton: HTMLButtonElement;
  private rectPlaceButton: HTMLButtonElement;
  private rectBreakButton: HTMLButtonElement;
  private rectOutlinePlaceButton: HTMLButtonElement;
  private rectOutlineBreakButton: HTMLButtonElement;
  private ellipsePlaceButton: HTMLButtonElement;
  private ellipseBreakButton: HTMLButtonElement;
  private ellipseOutlinePlaceButton: HTMLButtonElement;
  private ellipseOutlineBreakButton: HTMLButtonElement;
  private undoStrokeCount = 0;
  private redoStrokeCount = 0;
  private armedFloodFillKind: 'place' | 'break' | null;
  private armedLineKind: 'place' | 'break' | null;
  private armedRectKind: 'place' | 'break' | null;
  private armedRectOutlineKind: 'place' | 'break' | null;
  private armedEllipseKind: 'place' | 'break' | null;
  private armedEllipseOutlineKind: 'place' | 'break' | null;
  private onModeChange: (mode: TouchDebugEditMode) => void;
  private onBrushTileIdChange: (tileId: number) => void;
  private onArmFloodFill: (kind: 'place' | 'break') => void;
  private onArmLine: (kind: 'place' | 'break') => void;
  private onArmRect: (kind: 'place' | 'break') => void;
  private onArmRectOutline: (kind: 'place' | 'break') => void;
  private onArmEllipse: (kind: 'place' | 'break') => void;
  private onArmEllipseOutline: (kind: 'place' | 'break') => void;
  private onCollapsedChange: (collapsed: boolean) => void;
  private onUndo: () => void;
  private onRedo: () => void;
  private onResetPrefs: () => void;

  constructor(options: TouchDebugEditControlsOptions = {}) {
    this.mode = options.initialMode ?? 'pan';
    this.onModeChange = options.onModeChange ?? (() => {});
    this.brushOptions = options.brushOptions ?? [];
    const fallbackBrushTileId = this.brushOptions[0]?.tileId ?? 0;
    this.brushTileId = options.initialBrushTileId ?? fallbackBrushTileId;
    this.onBrushTileIdChange = options.onBrushTileIdChange ?? (() => {});
    this.armedFloodFillKind = options.initialArmedFloodFillKind ?? null;
    this.onArmFloodFill = options.onArmFloodFill ?? (() => {});
    this.armedLineKind = options.initialArmedLineKind ?? null;
    this.onArmLine = options.onArmLine ?? (() => {});
    this.armedRectKind = options.initialArmedRectKind ?? null;
    this.onArmRect = options.onArmRect ?? (() => {});
    this.armedRectOutlineKind = options.initialArmedRectOutlineKind ?? null;
    this.onArmRectOutline = options.onArmRectOutline ?? (() => {});
    this.armedEllipseKind = options.initialArmedEllipseKind ?? null;
    this.onArmEllipse = options.onArmEllipse ?? (() => {});
    this.armedEllipseOutlineKind = options.initialArmedEllipseOutlineKind ?? null;
    this.onArmEllipseOutline = options.onArmEllipseOutline ?? (() => {});
    this.collapsed = options.initialCollapsed ?? false;
    this.onCollapsedChange = options.onCollapsedChange ?? (() => {});
    this.onUndo = options.onUndo ?? (() => {});
    this.onRedo = options.onRedo ?? (() => {});
    this.onResetPrefs = options.onResetPrefs ?? (() => {});
    this.undoStrokeCount = Math.max(0, options.initialHistoryState?.undoStrokeCount ?? 0);
    this.redoStrokeCount = Math.max(0, options.initialHistoryState?.redoStrokeCount ?? 0);

    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.right = '12px';
    this.root.style.bottom = '12px';
    this.root.style.zIndex = '20';
    this.root.style.display = 'flex';
    this.root.style.flexDirection = 'column';
    this.root.style.gap = '6px';
    this.root.style.padding = '8px';
    this.root.style.borderRadius = '10px';
    this.root.style.background = 'rgba(0, 0, 0, 0.6)';
    this.root.style.border = '1px solid rgba(255, 255, 255, 0.12)';
    this.root.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
    this.root.style.fontFamily = 'monospace';
    this.root.style.pointerEvents = 'auto';
    this.root.style.userSelect = 'none';
    this.root.style.maxWidth = 'min(360px, calc(100vw - 24px))';

    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.alignItems = 'center';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.gap = '8px';
    this.root.append(headerRow);

    const title = document.createElement('div');
    title.textContent = 'Debug Edit';
    title.style.color = '#d6dde8';
    title.style.fontSize = '11px';
    title.style.letterSpacing = '0.04em';
    title.style.textTransform = 'uppercase';
    headerRow.append(title);

    const panelToggleHotkeyLabel = getDebugEditPanelToggleHotkeyLabel();
    this.collapseToggleButton = document.createElement('button');
    this.collapseToggleButton.type = 'button';
    this.collapseToggleButton.style.padding = '4px 8px';
    this.collapseToggleButton.style.borderRadius = '8px';
    this.collapseToggleButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.collapseToggleButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.collapseToggleButton.style.color = '#f3f7fb';
    this.collapseToggleButton.style.fontFamily = 'inherit';
    this.collapseToggleButton.style.fontSize = '11px';
    this.collapseToggleButton.style.cursor = 'pointer';
    this.collapseToggleButton.style.touchAction = 'manipulation';
    this.collapseToggleButton.addEventListener('click', () => this.setCollapsed(!this.collapsed));
    headerRow.append(this.collapseToggleButton);

    this.collapsedSummary = document.createElement('div');
    this.collapsedSummary.style.display = 'none';
    this.collapsedSummary.style.color = '#d6dde8';
    this.collapsedSummary.style.fontSize = '11px';
    this.collapsedSummary.style.lineHeight = '1.35';
    this.collapsedSummary.style.whiteSpace = 'nowrap';
    this.collapsedSummary.style.overflow = 'hidden';
    this.collapsedSummary.style.textOverflow = 'ellipsis';
    this.root.append(this.collapsedSummary);

    this.content = document.createElement('div');
    this.content.style.display = 'flex';
    this.content.style.flexDirection = 'column';
    this.content.style.gap = '6px';
    this.root.append(this.content);

    const modeLabel = document.createElement('div');
    modeLabel.textContent = 'Touch Mode';
    modeLabel.style.color = '#aab7c7';
    modeLabel.style.fontSize = '11px';
    this.content.append(modeLabel);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.gap = '6px';
    this.content.append(row);

    for (const mode of TOUCH_DEBUG_BUTTON_ORDER) {
      const modeLabel = buttonLabelForMode(mode);
      const modeHotkeyLabel = getTouchDebugEditModeHotkeyLabel(mode);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = modeLabel;
      button.title = `Touch mode: ${modeLabel} (${modeHotkeyLabel})`;
      button.addEventListener('click', () => this.setMode(mode));
      button.style.minWidth = '56px';
      button.style.padding = '6px 8px';
      button.style.borderRadius = '8px';
      button.style.border = '1px solid rgba(255, 255, 255, 0.16)';
      button.style.background = 'rgba(255, 255, 255, 0.06)';
      button.style.color = '#f3f7fb';
      button.style.fontFamily = 'inherit';
      button.style.fontSize = '12px';
      button.style.cursor = 'pointer';
      button.style.touchAction = 'manipulation';
      row.append(button);
      this.buttons.set(mode, button);
    }

    const historySection = document.createElement('div');
    historySection.style.display = 'flex';
    historySection.style.flexDirection = 'column';
    historySection.style.gap = '6px';
    this.content.append(historySection);

    const historyTitle = document.createElement('div');
    historyTitle.textContent = 'History';
    historyTitle.style.color = '#aab7c7';
    historyTitle.style.fontSize = '11px';
    historySection.append(historyTitle);

    const historyRow = document.createElement('div');
    historyRow.style.display = 'flex';
    historyRow.style.gap = '6px';
    historySection.append(historyRow);

    this.undoButton = document.createElement('button');
    this.undoButton.type = 'button';
    this.undoButton.addEventListener('click', () => this.onUndo());
    this.undoButton.style.padding = '6px 8px';
    this.undoButton.style.borderRadius = '8px';
    this.undoButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.undoButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.undoButton.style.color = '#f3f7fb';
    this.undoButton.style.fontFamily = 'inherit';
    this.undoButton.style.fontSize = '12px';
    this.undoButton.style.cursor = 'pointer';
    this.undoButton.style.touchAction = 'manipulation';
    this.undoButton.title = 'Undo last debug paint stroke (Ctrl/Cmd+Z or two-finger tap in Pan mode)';
    historyRow.append(this.undoButton);

    this.redoButton = document.createElement('button');
    this.redoButton.type = 'button';
    this.redoButton.addEventListener('click', () => this.onRedo());
    this.redoButton.style.padding = '6px 8px';
    this.redoButton.style.borderRadius = '8px';
    this.redoButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.redoButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.redoButton.style.color = '#f3f7fb';
    this.redoButton.style.fontFamily = 'inherit';
    this.redoButton.style.fontSize = '12px';
    this.redoButton.style.cursor = 'pointer';
    this.redoButton.style.touchAction = 'manipulation';
    this.redoButton.title =
      'Redo debug paint stroke (Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y or three-finger tap in Pan mode)';
    historyRow.append(this.redoButton);

    const touchHistoryShortcutLine = document.createElement('div');
    touchHistoryShortcutLine.textContent = 'Touch: two-finger tap undo, three-finger tap redo (Pan mode)';
    touchHistoryShortcutLine.style.color = '#d6dde8';
    touchHistoryShortcutLine.style.fontSize = '11px';
    touchHistoryShortcutLine.style.lineHeight = '1.35';
    historySection.append(touchHistoryShortcutLine);

    const floodFillSection = document.createElement('div');
    floodFillSection.style.display = 'flex';
    floodFillSection.style.flexDirection = 'column';
    floodFillSection.style.gap = '6px';
    this.content.append(floodFillSection);

    const floodFillTitle = document.createElement('div');
    floodFillTitle.textContent = 'Flood Fill';
    floodFillTitle.style.color = '#aab7c7';
    floodFillTitle.style.fontSize = '11px';
    floodFillSection.append(floodFillTitle);

    const floodFillRow = document.createElement('div');
    floodFillRow.style.display = 'flex';
    floodFillRow.style.flexWrap = 'wrap';
    floodFillRow.style.gap = '6px';
    floodFillSection.append(floodFillRow);

    this.fillPlaceButton = document.createElement('button');
    this.fillPlaceButton.type = 'button';
    this.fillPlaceButton.textContent = 'Fill Brush';
    this.fillPlaceButton.title = `Arm one flood fill with the active brush (keyboard: ${getDebugOneShotToolHotkeyLabel('flood-fill', 'place')})`;
    this.fillPlaceButton.addEventListener('click', () => this.onArmFloodFill('place'));
    this.fillPlaceButton.style.padding = '6px 8px';
    this.fillPlaceButton.style.borderRadius = '8px';
    this.fillPlaceButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.fillPlaceButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.fillPlaceButton.style.color = '#f3f7fb';
    this.fillPlaceButton.style.fontFamily = 'inherit';
    this.fillPlaceButton.style.fontSize = '12px';
    this.fillPlaceButton.style.cursor = 'pointer';
    this.fillPlaceButton.style.touchAction = 'manipulation';
    floodFillRow.append(this.fillPlaceButton);

    this.fillBreakButton = document.createElement('button');
    this.fillBreakButton.type = 'button';
    this.fillBreakButton.textContent = 'Fill Break';
    this.fillBreakButton.title = `Arm one flood fill that clears matching tiles (keyboard: ${getDebugOneShotToolHotkeyLabel('flood-fill', 'break')})`;
    this.fillBreakButton.addEventListener('click', () => this.onArmFloodFill('break'));
    this.fillBreakButton.style.padding = '6px 8px';
    this.fillBreakButton.style.borderRadius = '8px';
    this.fillBreakButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.fillBreakButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.fillBreakButton.style.color = '#f3f7fb';
    this.fillBreakButton.style.fontFamily = 'inherit';
    this.fillBreakButton.style.fontSize = '12px';
    this.fillBreakButton.style.cursor = 'pointer';
    this.fillBreakButton.style.touchAction = 'manipulation';
    floodFillRow.append(this.fillBreakButton);

    const floodFillHintLine = document.createElement('div');
    floodFillHintLine.textContent =
      'Arm Fill Brush/Break, then click or tap a world tile (one-shot; resident chunk bounds only)';
    floodFillHintLine.style.color = '#d6dde8';
    floodFillHintLine.style.fontSize = '11px';
    floodFillHintLine.style.lineHeight = '1.35';
    floodFillSection.append(floodFillHintLine);

    const lineToolSection = document.createElement('div');
    lineToolSection.style.display = 'flex';
    lineToolSection.style.flexDirection = 'column';
    lineToolSection.style.gap = '6px';
    this.content.append(lineToolSection);

    const lineToolTitle = document.createElement('div');
    lineToolTitle.textContent = 'Line Tool';
    lineToolTitle.style.color = '#aab7c7';
    lineToolTitle.style.fontSize = '11px';
    lineToolSection.append(lineToolTitle);

    const lineToolRow = document.createElement('div');
    lineToolRow.style.display = 'flex';
    lineToolRow.style.flexWrap = 'wrap';
    lineToolRow.style.gap = '6px';
    lineToolSection.append(lineToolRow);

    this.linePlaceButton = document.createElement('button');
    this.linePlaceButton.type = 'button';
    this.linePlaceButton.textContent = 'Line Brush';
    this.linePlaceButton.title = `Arm one line draw with the active brush (keyboard: ${getDebugOneShotToolHotkeyLabel('line', 'place')}; desktop drag or touch two-point)`;
    this.linePlaceButton.addEventListener('click', () => this.onArmLine('place'));
    this.linePlaceButton.style.padding = '6px 8px';
    this.linePlaceButton.style.borderRadius = '8px';
    this.linePlaceButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.linePlaceButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.linePlaceButton.style.color = '#f3f7fb';
    this.linePlaceButton.style.fontFamily = 'inherit';
    this.linePlaceButton.style.fontSize = '12px';
    this.linePlaceButton.style.cursor = 'pointer';
    this.linePlaceButton.style.touchAction = 'manipulation';
    lineToolRow.append(this.linePlaceButton);

    this.lineBreakButton = document.createElement('button');
    this.lineBreakButton.type = 'button';
    this.lineBreakButton.textContent = 'Line Break';
    this.lineBreakButton.title = `Arm one line draw that clears tiles (keyboard: ${getDebugOneShotToolHotkeyLabel('line', 'break')}; desktop drag or touch two-point)`;
    this.lineBreakButton.addEventListener('click', () => this.onArmLine('break'));
    this.lineBreakButton.style.padding = '6px 8px';
    this.lineBreakButton.style.borderRadius = '8px';
    this.lineBreakButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.lineBreakButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.lineBreakButton.style.color = '#f3f7fb';
    this.lineBreakButton.style.fontFamily = 'inherit';
    this.lineBreakButton.style.fontSize = '12px';
    this.lineBreakButton.style.cursor = 'pointer';
    this.lineBreakButton.style.touchAction = 'manipulation';
    lineToolRow.append(this.lineBreakButton);

    const lineToolHintLine = document.createElement('div');
    lineToolHintLine.textContent =
      `Desktop: ${getDebugOneShotToolHotkeyLabel('line', 'place')} arms Line Brush, ${getDebugOneShotToolHotkeyLabel('line', 'break')} arms Line Break, then drag on the canvas. Touch: tap start tile, then tap end tile.`;
    lineToolHintLine.style.color = '#d6dde8';
    lineToolHintLine.style.fontSize = '11px';
    lineToolHintLine.style.lineHeight = '1.35';
    lineToolSection.append(lineToolHintLine);

    const rectToolSection = document.createElement('div');
    rectToolSection.style.display = 'flex';
    rectToolSection.style.flexDirection = 'column';
    rectToolSection.style.gap = '6px';
    this.content.append(rectToolSection);

    const rectToolTitle = document.createElement('div');
    rectToolTitle.textContent = 'Rect Fill Tool';
    rectToolTitle.style.color = '#aab7c7';
    rectToolTitle.style.fontSize = '11px';
    rectToolSection.append(rectToolTitle);

    const rectToolRow = document.createElement('div');
    rectToolRow.style.display = 'flex';
    rectToolRow.style.flexWrap = 'wrap';
    rectToolRow.style.gap = '6px';
    rectToolSection.append(rectToolRow);

    this.rectPlaceButton = document.createElement('button');
    this.rectPlaceButton.type = 'button';
    this.rectPlaceButton.textContent = 'Rect Brush';
    this.rectPlaceButton.title =
      `Arm one rectangle fill with the active brush (keyboard: ${getDebugOneShotToolHotkeyLabel('rect-fill', 'place')}; desktop drag box or touch two-corner)`;
    this.rectPlaceButton.addEventListener('click', () => this.onArmRect('place'));
    this.rectPlaceButton.style.padding = '6px 8px';
    this.rectPlaceButton.style.borderRadius = '8px';
    this.rectPlaceButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.rectPlaceButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.rectPlaceButton.style.color = '#f3f7fb';
    this.rectPlaceButton.style.fontFamily = 'inherit';
    this.rectPlaceButton.style.fontSize = '12px';
    this.rectPlaceButton.style.cursor = 'pointer';
    this.rectPlaceButton.style.touchAction = 'manipulation';
    rectToolRow.append(this.rectPlaceButton);

    this.rectBreakButton = document.createElement('button');
    this.rectBreakButton.type = 'button';
    this.rectBreakButton.textContent = 'Rect Break';
    this.rectBreakButton.title =
      `Arm one rectangle fill that clears tiles (keyboard: ${getDebugOneShotToolHotkeyLabel('rect-fill', 'break')}; desktop drag box or touch two-corner)`;
    this.rectBreakButton.addEventListener('click', () => this.onArmRect('break'));
    this.rectBreakButton.style.padding = '6px 8px';
    this.rectBreakButton.style.borderRadius = '8px';
    this.rectBreakButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.rectBreakButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.rectBreakButton.style.color = '#f3f7fb';
    this.rectBreakButton.style.fontFamily = 'inherit';
    this.rectBreakButton.style.fontSize = '12px';
    this.rectBreakButton.style.cursor = 'pointer';
    this.rectBreakButton.style.touchAction = 'manipulation';
    rectToolRow.append(this.rectBreakButton);

    const rectToolHintLine = document.createElement('div');
    rectToolHintLine.textContent =
      `Desktop: ${getDebugOneShotToolHotkeyLabel('rect-fill', 'place')} arms Rect Brush, ${getDebugOneShotToolHotkeyLabel('rect-fill', 'break')} arms Rect Break, then drag a box. Touch: tap first corner, then tap opposite corner.`;
    rectToolHintLine.style.color = '#d6dde8';
    rectToolHintLine.style.fontSize = '11px';
    rectToolHintLine.style.lineHeight = '1.35';
    rectToolSection.append(rectToolHintLine);

    const rectOutlineToolSection = document.createElement('div');
    rectOutlineToolSection.style.display = 'flex';
    rectOutlineToolSection.style.flexDirection = 'column';
    rectOutlineToolSection.style.gap = '6px';
    this.content.append(rectOutlineToolSection);

    const rectOutlineToolTitle = document.createElement('div');
    rectOutlineToolTitle.textContent = 'Rect Outline Tool';
    rectOutlineToolTitle.style.color = '#aab7c7';
    rectOutlineToolTitle.style.fontSize = '11px';
    rectOutlineToolSection.append(rectOutlineToolTitle);

    const rectOutlineToolRow = document.createElement('div');
    rectOutlineToolRow.style.display = 'flex';
    rectOutlineToolRow.style.flexWrap = 'wrap';
    rectOutlineToolRow.style.gap = '6px';
    rectOutlineToolSection.append(rectOutlineToolRow);

    this.rectOutlinePlaceButton = document.createElement('button');
    this.rectOutlinePlaceButton.type = 'button';
    this.rectOutlinePlaceButton.textContent = 'Rect Outline Brush';
    this.rectOutlinePlaceButton.title =
      `Arm one rectangle outline with the active brush (keyboard: ${getDebugOneShotToolHotkeyLabel('rect-outline', 'place')}; desktop drag box or touch two-corner)`;
    this.rectOutlinePlaceButton.addEventListener('click', () => this.onArmRectOutline('place'));
    this.rectOutlinePlaceButton.style.padding = '6px 8px';
    this.rectOutlinePlaceButton.style.borderRadius = '8px';
    this.rectOutlinePlaceButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.rectOutlinePlaceButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.rectOutlinePlaceButton.style.color = '#f3f7fb';
    this.rectOutlinePlaceButton.style.fontFamily = 'inherit';
    this.rectOutlinePlaceButton.style.fontSize = '12px';
    this.rectOutlinePlaceButton.style.cursor = 'pointer';
    this.rectOutlinePlaceButton.style.touchAction = 'manipulation';
    rectOutlineToolRow.append(this.rectOutlinePlaceButton);

    this.rectOutlineBreakButton = document.createElement('button');
    this.rectOutlineBreakButton.type = 'button';
    this.rectOutlineBreakButton.textContent = 'Rect Outline Break';
    this.rectOutlineBreakButton.title =
      `Arm one rectangle outline that clears tiles (keyboard: ${getDebugOneShotToolHotkeyLabel('rect-outline', 'break')}; desktop drag box or touch two-corner)`;
    this.rectOutlineBreakButton.addEventListener('click', () => this.onArmRectOutline('break'));
    this.rectOutlineBreakButton.style.padding = '6px 8px';
    this.rectOutlineBreakButton.style.borderRadius = '8px';
    this.rectOutlineBreakButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.rectOutlineBreakButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.rectOutlineBreakButton.style.color = '#f3f7fb';
    this.rectOutlineBreakButton.style.fontFamily = 'inherit';
    this.rectOutlineBreakButton.style.fontSize = '12px';
    this.rectOutlineBreakButton.style.cursor = 'pointer';
    this.rectOutlineBreakButton.style.touchAction = 'manipulation';
    rectOutlineToolRow.append(this.rectOutlineBreakButton);

    const rectOutlineToolHintLine = document.createElement('div');
    rectOutlineToolHintLine.textContent =
      `Desktop: ${getDebugOneShotToolHotkeyLabel('rect-outline', 'place')} arms Rect Outline Brush, ${getDebugOneShotToolHotkeyLabel('rect-outline', 'break')} arms Rect Outline Break, then drag a box. Touch: tap first corner, then tap opposite corner.`;
    rectOutlineToolHintLine.style.color = '#d6dde8';
    rectOutlineToolHintLine.style.fontSize = '11px';
    rectOutlineToolHintLine.style.lineHeight = '1.35';
    rectOutlineToolSection.append(rectOutlineToolHintLine);

    const ellipseToolSection = document.createElement('div');
    ellipseToolSection.style.display = 'flex';
    ellipseToolSection.style.flexDirection = 'column';
    ellipseToolSection.style.gap = '6px';
    this.content.append(ellipseToolSection);

    const ellipseToolTitle = document.createElement('div');
    ellipseToolTitle.textContent = 'Ellipse Fill Tool';
    ellipseToolTitle.style.color = '#aab7c7';
    ellipseToolTitle.style.fontSize = '11px';
    ellipseToolSection.append(ellipseToolTitle);

    const ellipseToolRow = document.createElement('div');
    ellipseToolRow.style.display = 'flex';
    ellipseToolRow.style.flexWrap = 'wrap';
    ellipseToolRow.style.gap = '6px';
    ellipseToolSection.append(ellipseToolRow);

    this.ellipsePlaceButton = document.createElement('button');
    this.ellipsePlaceButton.type = 'button';
    this.ellipsePlaceButton.textContent = 'Ellipse Brush';
    this.ellipsePlaceButton.title =
      `Arm one ellipse fill with the active brush (keyboard: ${getDebugOneShotToolHotkeyLabel('ellipse-fill', 'place')}; desktop drag bounds or touch two-corner)`;
    this.ellipsePlaceButton.addEventListener('click', () => this.onArmEllipse('place'));
    this.ellipsePlaceButton.style.padding = '6px 8px';
    this.ellipsePlaceButton.style.borderRadius = '8px';
    this.ellipsePlaceButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.ellipsePlaceButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.ellipsePlaceButton.style.color = '#f3f7fb';
    this.ellipsePlaceButton.style.fontFamily = 'inherit';
    this.ellipsePlaceButton.style.fontSize = '12px';
    this.ellipsePlaceButton.style.cursor = 'pointer';
    this.ellipsePlaceButton.style.touchAction = 'manipulation';
    ellipseToolRow.append(this.ellipsePlaceButton);

    this.ellipseBreakButton = document.createElement('button');
    this.ellipseBreakButton.type = 'button';
    this.ellipseBreakButton.textContent = 'Ellipse Break';
    this.ellipseBreakButton.title =
      `Arm one ellipse fill that clears tiles (keyboard: ${getDebugOneShotToolHotkeyLabel('ellipse-fill', 'break')}; desktop drag bounds or touch two-corner)`;
    this.ellipseBreakButton.addEventListener('click', () => this.onArmEllipse('break'));
    this.ellipseBreakButton.style.padding = '6px 8px';
    this.ellipseBreakButton.style.borderRadius = '8px';
    this.ellipseBreakButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.ellipseBreakButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.ellipseBreakButton.style.color = '#f3f7fb';
    this.ellipseBreakButton.style.fontFamily = 'inherit';
    this.ellipseBreakButton.style.fontSize = '12px';
    this.ellipseBreakButton.style.cursor = 'pointer';
    this.ellipseBreakButton.style.touchAction = 'manipulation';
    ellipseToolRow.append(this.ellipseBreakButton);

    const ellipseToolHintLine = document.createElement('div');
    ellipseToolHintLine.textContent =
      `Desktop: ${getDebugOneShotToolHotkeyLabel('ellipse-fill', 'place')} arms Ellipse Brush, ${getDebugOneShotToolHotkeyLabel('ellipse-fill', 'break')} arms Ellipse Break, then drag bounds. Touch: tap first corner, then tap opposite corner.`;
    ellipseToolHintLine.style.color = '#d6dde8';
    ellipseToolHintLine.style.fontSize = '11px';
    ellipseToolHintLine.style.lineHeight = '1.35';
    ellipseToolSection.append(ellipseToolHintLine);

    const ellipseOutlineToolSection = document.createElement('div');
    ellipseOutlineToolSection.style.display = 'flex';
    ellipseOutlineToolSection.style.flexDirection = 'column';
    ellipseOutlineToolSection.style.gap = '6px';
    this.content.append(ellipseOutlineToolSection);

    const ellipseOutlineToolTitle = document.createElement('div');
    ellipseOutlineToolTitle.textContent = 'Ellipse Outline Tool';
    ellipseOutlineToolTitle.style.color = '#aab7c7';
    ellipseOutlineToolTitle.style.fontSize = '11px';
    ellipseOutlineToolSection.append(ellipseOutlineToolTitle);

    const ellipseOutlineToolRow = document.createElement('div');
    ellipseOutlineToolRow.style.display = 'flex';
    ellipseOutlineToolRow.style.flexWrap = 'wrap';
    ellipseOutlineToolRow.style.gap = '6px';
    ellipseOutlineToolSection.append(ellipseOutlineToolRow);

    this.ellipseOutlinePlaceButton = document.createElement('button');
    this.ellipseOutlinePlaceButton.type = 'button';
    this.ellipseOutlinePlaceButton.textContent = 'Ellipse Outline Brush';
    this.ellipseOutlinePlaceButton.title =
      `Arm one ellipse outline with the active brush (keyboard: ${getDebugOneShotToolHotkeyLabel('ellipse-outline', 'place')}; desktop drag bounds or touch two-corner)`;
    this.ellipseOutlinePlaceButton.addEventListener('click', () => this.onArmEllipseOutline('place'));
    this.ellipseOutlinePlaceButton.style.padding = '6px 8px';
    this.ellipseOutlinePlaceButton.style.borderRadius = '8px';
    this.ellipseOutlinePlaceButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.ellipseOutlinePlaceButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.ellipseOutlinePlaceButton.style.color = '#f3f7fb';
    this.ellipseOutlinePlaceButton.style.fontFamily = 'inherit';
    this.ellipseOutlinePlaceButton.style.fontSize = '12px';
    this.ellipseOutlinePlaceButton.style.cursor = 'pointer';
    this.ellipseOutlinePlaceButton.style.touchAction = 'manipulation';
    ellipseOutlineToolRow.append(this.ellipseOutlinePlaceButton);

    this.ellipseOutlineBreakButton = document.createElement('button');
    this.ellipseOutlineBreakButton.type = 'button';
    this.ellipseOutlineBreakButton.textContent = 'Ellipse Outline Break';
    this.ellipseOutlineBreakButton.title =
      `Arm one ellipse outline that clears tiles (keyboard: ${getDebugOneShotToolHotkeyLabel('ellipse-outline', 'break')}; desktop drag bounds or touch two-corner)`;
    this.ellipseOutlineBreakButton.addEventListener('click', () => this.onArmEllipseOutline('break'));
    this.ellipseOutlineBreakButton.style.padding = '6px 8px';
    this.ellipseOutlineBreakButton.style.borderRadius = '8px';
    this.ellipseOutlineBreakButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.ellipseOutlineBreakButton.style.background = 'rgba(255, 255, 255, 0.06)';
    this.ellipseOutlineBreakButton.style.color = '#f3f7fb';
    this.ellipseOutlineBreakButton.style.fontFamily = 'inherit';
    this.ellipseOutlineBreakButton.style.fontSize = '12px';
    this.ellipseOutlineBreakButton.style.cursor = 'pointer';
    this.ellipseOutlineBreakButton.style.touchAction = 'manipulation';
    ellipseOutlineToolRow.append(this.ellipseOutlineBreakButton);

    const ellipseOutlineToolHintLine = document.createElement('div');
    ellipseOutlineToolHintLine.textContent =
      `Desktop: ${getDebugOneShotToolHotkeyLabel('ellipse-outline', 'place')} arms Ellipse Outline Brush, ${getDebugOneShotToolHotkeyLabel('ellipse-outline', 'break')} arms Ellipse Outline Break, then drag bounds. Touch: tap first corner, then tap opposite corner.`;
    ellipseOutlineToolHintLine.style.color = '#d6dde8';
    ellipseOutlineToolHintLine.style.fontSize = '11px';
    ellipseOutlineToolHintLine.style.lineHeight = '1.35';
    ellipseOutlineToolSection.append(ellipseOutlineToolHintLine);

    const prefsSection = document.createElement('div');
    prefsSection.style.display = 'flex';
    prefsSection.style.flexDirection = 'column';
    prefsSection.style.gap = '6px';
    this.content.append(prefsSection);

    const prefsTitle = document.createElement('div');
    prefsTitle.textContent = 'Prefs';
    prefsTitle.style.color = '#aab7c7';
    prefsTitle.style.fontSize = '11px';
    prefsSection.append(prefsTitle);

    const resetPrefsButton = document.createElement('button');
    resetPrefsButton.type = 'button';
    resetPrefsButton.textContent = 'Reset Prefs';
    resetPrefsButton.title =
      'Restore default touch mode, brush, and panel visibility; clear saved debug edit control prefs';
    resetPrefsButton.addEventListener('click', () => this.onResetPrefs());
    resetPrefsButton.style.padding = '6px 8px';
    resetPrefsButton.style.borderRadius = '8px';
    resetPrefsButton.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    resetPrefsButton.style.background = 'rgba(255, 255, 255, 0.06)';
    resetPrefsButton.style.color = '#f3f7fb';
    resetPrefsButton.style.fontFamily = 'inherit';
    resetPrefsButton.style.fontSize = '12px';
    resetPrefsButton.style.cursor = 'pointer';
    resetPrefsButton.style.touchAction = 'manipulation';
    prefsSection.append(resetPrefsButton);

    const shortcutSection = document.createElement('div');
    shortcutSection.style.display = 'flex';
    shortcutSection.style.flexDirection = 'column';
    shortcutSection.style.gap = '4px';
    this.content.append(shortcutSection);

    const shortcutTitle = document.createElement('div');
    shortcutTitle.textContent = 'Keyboard';
    shortcutTitle.style.color = '#aab7c7';
    shortcutTitle.style.fontSize = '11px';
    shortcutSection.append(shortcutTitle);

    const modeShortcutLine = document.createElement('div');
    modeShortcutLine.textContent = `Modes: ${getTouchDebugEditModeHotkeyLabel('pan')} pan, ${getTouchDebugEditModeHotkeyLabel('place')} place, ${getTouchDebugEditModeHotkeyLabel('break')} break`;
    modeShortcutLine.style.color = '#d6dde8';
    modeShortcutLine.style.fontSize = '11px';
    modeShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(modeShortcutLine);

    const brushShortcutLine = document.createElement('div');
    brushShortcutLine.textContent = 'Brush: [ / ] cycle, 1-0 slots';
    brushShortcutLine.style.color = '#d6dde8';
    brushShortcutLine.style.fontSize = '11px';
    brushShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(brushShortcutLine);

    const historyShortcutLine = document.createElement('div');
    historyShortcutLine.textContent = 'History: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo';
    historyShortcutLine.style.color = '#d6dde8';
    historyShortcutLine.style.fontSize = '11px';
    historyShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(historyShortcutLine);

    const cameraShortcutLine = document.createElement('div');
    cameraShortcutLine.textContent = `Camera: ${getDesktopRecenterCameraHotkeyLabel()} recenter on the standalone player`;
    cameraShortcutLine.style.color = '#d6dde8';
    cameraShortcutLine.style.fontSize = '11px';
    cameraShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(cameraShortcutLine);

    const hudShortcutLine = document.createElement('div');
    hudShortcutLine.textContent = `HUD: ${getDesktopDebugOverlayHotkeyLabel()} toggle debug telemetry`;
    hudShortcutLine.style.color = '#d6dde8';
    hudShortcutLine.style.fontSize = '11px';
    hudShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(hudShortcutLine);

    const panelShortcutLine = document.createElement('div');
    panelShortcutLine.textContent = `Panel: ${panelToggleHotkeyLabel} collapse/expand`;
    panelShortcutLine.style.color = '#d6dde8';
    panelShortcutLine.style.fontSize = '11px';
    panelShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(panelShortcutLine);

    const eyedropperShortcutLine = document.createElement('div');
    eyedropperShortcutLine.textContent = 'Eyedropper: press I to pick hovered tile; touch long-press in Pan mode';
    eyedropperShortcutLine.style.color = '#d6dde8';
    eyedropperShortcutLine.style.fontSize = '11px';
    eyedropperShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(eyedropperShortcutLine);

    const floodFillShortcutLine = document.createElement('div');
    floodFillShortcutLine.textContent = 'Flood fill: F arm brush fill, Shift+F arm break fill; next canvas tap/click applies';
    floodFillShortcutLine.style.color = '#d6dde8';
    floodFillShortcutLine.style.fontSize = '11px';
    floodFillShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(floodFillShortcutLine);

    const oneShotShortcutLine = document.createElement('div');
    oneShotShortcutLine.textContent =
      'Shape tools: N line, R rect fill, T rect outline, E ellipse fill, O ellipse outline (Shift = break)';
    oneShotShortcutLine.style.color = '#d6dde8';
    oneShotShortcutLine.style.fontSize = '11px';
    oneShotShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(oneShotShortcutLine);

    const cancelShortcutLine = document.createElement('div');
    cancelShortcutLine.textContent = 'Cancel armed one-shot tools: Esc';
    cancelShortcutLine.style.color = '#d6dde8';
    cancelShortcutLine.style.fontSize = '11px';
    cancelShortcutLine.style.lineHeight = '1.35';
    shortcutSection.append(cancelShortcutLine);

    const brushSection = document.createElement('div');
    brushSection.style.display = 'flex';
    brushSection.style.flexDirection = 'column';
    brushSection.style.gap = '6px';
    this.content.append(brushSection);

    const brushTitle = document.createElement('div');
    brushTitle.textContent = 'Brush Palette';
    brushTitle.style.color = '#aab7c7';
    brushTitle.style.fontSize = '11px';
    brushSection.append(brushTitle);

    const brushTouchHint = document.createElement('div');
    brushTouchHint.textContent = 'Touch shortcut: long-press a tile in Pan mode to pick that brush';
    brushTouchHint.style.color = '#d6dde8';
    brushTouchHint.style.fontSize = '11px';
    brushTouchHint.style.lineHeight = '1.35';
    brushSection.append(brushTouchHint);

    this.activeBrushIndicator = document.createElement('div');
    this.activeBrushIndicator.style.color = '#f3f7fb';
    this.activeBrushIndicator.style.fontSize = '12px';
    brushSection.append(this.activeBrushIndicator);

    const brushGrid = document.createElement('div');
    brushGrid.style.display = 'flex';
    brushGrid.style.flexWrap = 'wrap';
    brushGrid.style.gap = '6px';
    brushSection.append(brushGrid);

    if (this.brushOptions.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.textContent = 'No brush tiles';
      emptyState.style.color = '#9fb0c2';
      emptyState.style.fontSize = '12px';
      brushGrid.append(emptyState);
    } else {
      if (!this.brushOptions.some((option) => option.tileId === this.brushTileId)) {
        this.brushTileId = this.brushOptions[0]!.tileId;
      }

      for (const [index, option] of this.brushOptions.entries()) {
        const slotHotkeyLabel = getDebugBrushSlotHotkeyLabel(index);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = slotHotkeyLabel ? `[${slotHotkeyLabel}] ${option.label}` : option.label;
        button.title = slotHotkeyLabel
          ? `Brush slot ${slotHotkeyLabel}: Tile ${option.tileId} (${option.label})`
          : `Tile ${option.tileId}: ${option.label}`;
        button.addEventListener('click', () => this.setBrushTileId(option.tileId));
        button.style.padding = '6px 8px';
        button.style.borderRadius = '8px';
        button.style.border = '1px solid rgba(255, 255, 255, 0.16)';
        button.style.background = 'rgba(255, 255, 255, 0.06)';
        button.style.color = '#f3f7fb';
        button.style.fontFamily = 'inherit';
        button.style.fontSize = '12px';
        button.style.cursor = 'pointer';
        button.style.touchAction = 'manipulation';
        button.style.whiteSpace = 'nowrap';
        brushGrid.append(button);
        this.brushButtons.set(option.tileId, button);
      }
    }

    this.syncButtonState();
    this.syncHistoryState();
    this.syncFloodFillState();
    this.syncLineToolState();
    this.syncRectToolState();
    this.syncRectOutlineToolState();
    this.syncEllipseToolState();
    this.syncEllipseOutlineToolState();
    this.syncBrushState();
    this.syncCollapsedState();
    this.installPointerButtonFocusRelease();
    document.body.append(this.root);
  }

  setMode(mode: TouchDebugEditMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.syncButtonState();
    this.onModeChange(mode);
  }

  setBrushTileId(tileId: number): void {
    if (!this.brushButtons.has(tileId)) return;
    if (this.brushTileId === tileId) return;
    this.brushTileId = tileId;
    this.syncBrushState();
    this.onBrushTileIdChange(tileId);
  }

  getBrushTileId(): number {
    return this.brushTileId;
  }

  isCollapsed(): boolean {
    return this.collapsed;
  }

  setCollapsed(collapsed: boolean): void {
    if (this.collapsed === collapsed) return;
    this.collapsed = collapsed;
    this.syncCollapsedState();
    this.onCollapsedChange(collapsed);
  }

  setHistoryState(historyState: DebugEditHistoryControlState): void {
    this.undoStrokeCount = Math.max(0, historyState.undoStrokeCount);
    this.redoStrokeCount = Math.max(0, historyState.redoStrokeCount);
    this.syncHistoryState();
  }

  setArmedFloodFillKind(kind: 'place' | 'break' | null): void {
    if (this.armedFloodFillKind === kind) return;
    this.armedFloodFillKind = kind;
    this.syncFloodFillState();
  }

  setArmedLineKind(kind: 'place' | 'break' | null): void {
    if (this.armedLineKind === kind) return;
    this.armedLineKind = kind;
    this.syncLineToolState();
  }

  setArmedRectKind(kind: 'place' | 'break' | null): void {
    if (this.armedRectKind === kind) return;
    this.armedRectKind = kind;
    this.syncRectToolState();
  }

  setArmedRectOutlineKind(kind: 'place' | 'break' | null): void {
    if (this.armedRectOutlineKind === kind) return;
    this.armedRectOutlineKind = kind;
    this.syncRectOutlineToolState();
  }

  setArmedEllipseKind(kind: 'place' | 'break' | null): void {
    if (this.armedEllipseKind === kind) return;
    this.armedEllipseKind = kind;
    this.syncEllipseToolState();
  }

  setArmedEllipseOutlineKind(kind: 'place' | 'break' | null): void {
    if (this.armedEllipseOutlineKind === kind) return;
    this.armedEllipseOutlineKind = kind;
    this.syncEllipseOutlineToolState();
  }

  private syncButtonState(): void {
    for (const [mode, button] of this.buttons) {
      const active = this.mode === mode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? 'rgba(90, 170, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(130, 200, 255, 0.7)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    }
    this.syncCollapsedSummary();
  }

  private syncHistoryState(): void {
    const canUndo = this.undoStrokeCount > 0;
    const canRedo = this.redoStrokeCount > 0;

    this.undoButton.textContent = `Undo (${this.undoStrokeCount})`;
    this.undoButton.disabled = !canUndo;
    this.undoButton.style.opacity = canUndo ? '1' : '0.5';
    this.undoButton.style.cursor = canUndo ? 'pointer' : 'default';

    this.redoButton.textContent = `Redo (${this.redoStrokeCount})`;
    this.redoButton.disabled = !canRedo;
    this.redoButton.style.opacity = canRedo ? '1' : '0.5';
    this.redoButton.style.cursor = canRedo ? 'pointer' : 'default';
    this.syncCollapsedSummary();
  }

  private syncFloodFillState(): void {
    const syncButton = (button: HTMLButtonElement, active: boolean, activeColor: string): void => {
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? activeColor : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    };

    syncButton(this.fillPlaceButton, this.armedFloodFillKind === 'place', 'rgba(120, 255, 180, 0.22)');
    syncButton(this.fillBreakButton, this.armedFloodFillKind === 'break', 'rgba(255, 130, 130, 0.24)');
    this.syncCollapsedSummary();
  }

  private syncLineToolState(): void {
    const syncButton = (button: HTMLButtonElement, active: boolean, activeColor: string): void => {
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? activeColor : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    };

    syncButton(this.linePlaceButton, this.armedLineKind === 'place', 'rgba(120, 210, 255, 0.24)');
    syncButton(this.lineBreakButton, this.armedLineKind === 'break', 'rgba(255, 180, 120, 0.24)');
    this.syncCollapsedSummary();
  }

  private syncRectToolState(): void {
    const syncButton = (button: HTMLButtonElement, active: boolean, activeColor: string): void => {
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? activeColor : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    };

    syncButton(this.rectPlaceButton, this.armedRectKind === 'place', 'rgba(120, 255, 180, 0.2)');
    syncButton(this.rectBreakButton, this.armedRectKind === 'break', 'rgba(255, 130, 130, 0.22)');
    this.syncCollapsedSummary();
  }

  private syncRectOutlineToolState(): void {
    const syncButton = (button: HTMLButtonElement, active: boolean, activeColor: string): void => {
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? activeColor : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    };

    syncButton(this.rectOutlinePlaceButton, this.armedRectOutlineKind === 'place', 'rgba(120, 210, 255, 0.22)');
    syncButton(this.rectOutlineBreakButton, this.armedRectOutlineKind === 'break', 'rgba(255, 180, 120, 0.22)');
    this.syncCollapsedSummary();
  }

  private syncEllipseToolState(): void {
    const syncButton = (button: HTMLButtonElement, active: boolean, activeColor: string): void => {
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? activeColor : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    };

    syncButton(this.ellipsePlaceButton, this.armedEllipseKind === 'place', 'rgba(185, 255, 120, 0.22)');
    syncButton(this.ellipseBreakButton, this.armedEllipseKind === 'break', 'rgba(255, 155, 120, 0.22)');
    this.syncCollapsedSummary();
  }

  private syncEllipseOutlineToolState(): void {
    const syncButton = (button: HTMLButtonElement, active: boolean, activeColor: string): void => {
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? activeColor : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    };

    syncButton(this.ellipseOutlinePlaceButton, this.armedEllipseOutlineKind === 'place', 'rgba(150, 225, 255, 0.22)');
    syncButton(this.ellipseOutlineBreakButton, this.armedEllipseOutlineKind === 'break', 'rgba(255, 195, 120, 0.22)');
    this.syncCollapsedSummary();
  }

  private syncCollapsedState(): void {
    this.content.style.display = this.collapsed ? 'none' : 'flex';
    this.collapsedSummary.style.display = this.collapsed ? 'block' : 'none';
    this.collapseToggleButton.textContent = this.collapsed ? 'Expand' : 'Collapse';
    const panelToggleHotkeyLabel = getDebugEditPanelToggleHotkeyLabel();
    this.collapseToggleButton.title = this.collapsed
      ? `Expand debug edit controls (${panelToggleHotkeyLabel})`
      : `Collapse debug edit controls (${panelToggleHotkeyLabel})`;
    this.collapseToggleButton.setAttribute('aria-expanded', this.collapsed ? 'false' : 'true');
    this.syncCollapsedSummary();
  }

  private syncBrushState(): void {
    const activeBrushOption = this.brushOptions.find((option) => option.tileId === this.brushTileId) ?? null;
    this.activeBrushIndicator.textContent = activeBrushOption
      ? `Active brush: ${activeBrushOption.label} (#${activeBrushOption.tileId})`
      : 'Active brush: n/a';

    for (const [tileId, button] of this.brushButtons) {
      const active = tileId === this.brushTileId;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.background = active ? 'rgba(120, 255, 180, 0.22)' : 'rgba(255, 255, 255, 0.06)';
      button.style.borderColor = active ? 'rgba(150, 255, 205, 0.7)' : 'rgba(255, 255, 255, 0.16)';
      button.style.color = active ? '#ffffff' : '#f3f7fb';
    }
    this.syncCollapsedSummary();
  }

  private syncCollapsedSummary(): void {
    const modeLabel = buttonLabelForMode(this.mode);
    const activeBrushOption = this.brushOptions.find((option) => option.tileId === this.brushTileId) ?? null;
    const brushSummary = activeBrushOption
      ? `${activeBrushOption.label} (#${activeBrushOption.tileId})`
      : `#${this.brushTileId}`;
    const armedFillSummary =
      this.armedFloodFillKind === null
        ? ''
        : this.armedFloodFillKind === 'place'
          ? ' | Fill:Brush'
          : ' | Fill:Break';
    const armedLineSummary =
      this.armedLineKind === null
        ? ''
        : this.armedLineKind === 'place'
          ? ' | Line:Brush'
          : ' | Line:Break';
    const armedRectFillSummary =
      this.armedRectKind === null
        ? ''
        : this.armedRectKind === 'place'
          ? ' | RectF:Brush'
          : ' | RectF:Break';
    const armedRectOutlineSummary =
      this.armedRectOutlineKind === null
        ? ''
        : this.armedRectOutlineKind === 'place'
          ? ' | RectO:Brush'
          : ' | RectO:Break';
    const armedEllipseSummary =
      this.armedEllipseKind === null
        ? ''
        : this.armedEllipseKind === 'place'
          ? ' | Ellipse:Brush'
          : ' | Ellipse:Break';
    const armedEllipseOutlineSummary =
      this.armedEllipseOutlineKind === null
        ? ''
        : this.armedEllipseOutlineKind === 'place'
          ? ' | EllipseO:Brush'
          : ' | EllipseO:Break';
    this.collapsedSummary.textContent = `${modeLabel} | Brush: ${brushSummary}${armedFillSummary}${armedLineSummary}${armedRectFillSummary}${armedRectOutlineSummary}${armedEllipseSummary}${armedEllipseOutlineSummary} | U:${this.undoStrokeCount} R:${this.redoStrokeCount}`;
  }

  private installPointerButtonFocusRelease(): void {
    const buttons = this.root.querySelectorAll<HTMLButtonElement>('button');
    for (const button of buttons) {
      installPointerClickFocusRelease(button);
    }
  }
}
