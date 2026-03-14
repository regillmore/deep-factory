import { getHotbarSlotShortcutLabel } from '../input/hotbarShortcuts';
import { getDropSelectedHotbarStackShortcutLabel } from '../input/playerInventoryShortcuts';
import {
  getPlayerInventoryItemDefinition,
  type PlayerInventoryState
} from '../world/playerInventory';

interface HotbarOverlayOptions {
  host: HTMLElement;
  onSelectSlot?: (slotIndex: number) => void;
  onDropSelectedStack?: () => void;
}

interface HotbarSlotElements {
  button: HTMLButtonElement;
  shortcutLabel: HTMLDivElement;
  itemLabel: HTMLDivElement;
  amountLabel: HTMLDivElement;
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

export class HotbarOverlay {
  private root: HTMLDivElement;
  private slotRow: HTMLDivElement;
  private dropButton: HTMLButtonElement;
  private dropEnabled = false;
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

    this.dropButton = document.createElement('button');
    this.dropButton.type = 'button';
    this.dropButton.textContent = 'DROP';
    this.dropButton.style.minWidth = '92px';
    this.dropButton.style.height = '32px';
    this.dropButton.style.padding = '0 12px';
    this.dropButton.style.borderRadius = '999px';
    this.dropButton.style.border = '1px solid rgba(255, 255, 255, 0.18)';
    this.dropButton.style.background = 'rgba(10, 14, 20, 0.72)';
    this.dropButton.style.color = '#f5f7fa';
    this.dropButton.style.font = '700 12px/1 system-ui, sans-serif';
    this.dropButton.style.letterSpacing = '0.08em';
    this.dropButton.style.cursor = 'pointer';
    this.dropButton.style.backdropFilter = 'blur(8px)';
    this.dropButton.style.pointerEvents = 'auto';
    this.dropButton.style.transition =
      'transform 120ms ease, border-color 120ms ease, background 120ms ease, opacity 120ms ease';
    this.dropButton.addEventListener('click', () => {
      if (!this.dropEnabled) {
        return;
      }
      options.onDropSelectedStack?.();
    });
    this.root.append(this.dropButton);

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
      shortcutLabel.style.font = '600 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      shortcutLabel.style.color = 'rgba(255, 255, 255, 0.76)';
      shortcutLabel.style.textAlign = 'left';
      shortcutLabel.textContent = getHotbarSlotShortcutLabel(slotIndex) ?? '';
      button.append(shortcutLabel);

      const itemLabel = document.createElement('div');
      itemLabel.style.font = '700 12px/1.1 system-ui, sans-serif';
      itemLabel.style.letterSpacing = '0.05em';
      itemLabel.style.textAlign = 'center';
      itemLabel.style.wordBreak = 'break-word';
      button.append(itemLabel);

      const amountLabel = document.createElement('div');
      amountLabel.style.font = '600 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      amountLabel.style.textAlign = 'right';
      amountLabel.style.color = '#ffe7a3';
      button.append(amountLabel);

      button.addEventListener('click', () => {
        options.onSelectSlot?.(slotIndex);
      });

      this.slotRow.append(button);
      this.slots.push({
        button,
        shortcutLabel,
        itemLabel,
        amountLabel
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

  update(state: PlayerInventoryState): void {
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
        continue;
      }

      const definition = getPlayerInventoryItemDefinition(stack.itemId);
      slotElements.button.title = `Select ${definition.label} in hotbar slot ${slotIndex + 1}`;
      slotElements.itemLabel.textContent = definition.hotbarLabel;
      slotElements.itemLabel.style.color = '#f5f7fa';
      slotElements.amountLabel.textContent = stack.amount > 1 ? String(stack.amount) : '';
    }

    const selectedStack = state.hotbar[state.selectedHotbarSlotIndex] ?? null;
    this.dropEnabled = selectedStack !== null;
    this.dropButton.setAttribute('aria-disabled', this.dropEnabled ? 'false' : 'true');
    this.dropButton.style.opacity = this.dropEnabled ? '1' : '0.45';
    this.dropButton.style.transform = this.dropEnabled ? 'translateY(0)' : 'translateY(0)';
    this.dropButton.style.background = this.dropEnabled
      ? 'rgba(45, 25, 18, 0.9)'
      : 'rgba(10, 14, 20, 0.72)';
    this.dropButton.style.borderColor = this.dropEnabled
      ? 'rgba(255, 170, 120, 0.5)'
      : 'rgba(255, 255, 255, 0.18)';
    this.dropButton.title =
      selectedStack === null
        ? 'Selected hotbar slot is empty'
        : `Drop ${getPlayerInventoryItemDefinition(selectedStack.itemId).label} stack (${getDropSelectedHotbarStackShortcutLabel()})`;
  }

  dispose(): void {
    this.root.remove();
  }
}
