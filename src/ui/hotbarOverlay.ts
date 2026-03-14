import { getHotbarSlotShortcutLabel } from '../input/hotbarShortcuts';
import {
  getPlayerInventoryItemDefinition,
  type PlayerInventoryState
} from '../world/playerInventory';

interface HotbarOverlayOptions {
  host: HTMLElement;
  onSelectSlot?: (slotIndex: number) => void;
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
  private slots: HotbarSlotElements[] = [];

  constructor(options: HotbarOverlayOptions) {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '50%';
    this.root.style.bottom = '18px';
    this.root.style.transform = 'translateX(-50%)';
    this.root.style.zIndex = '22';
    this.root.style.display = 'none';
    this.root.style.alignItems = 'flex-end';
    this.root.style.gap = '6px';
    this.root.style.pointerEvents = 'none';
    this.root.style.maxWidth = 'calc(100vw - 24px)';

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

      this.root.append(button);
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
  }

  dispose(): void {
    this.root.remove();
  }
}
