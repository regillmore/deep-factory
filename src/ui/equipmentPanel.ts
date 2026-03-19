import type { PlayerEquipmentSlotId } from '../world/playerEquipment';
import { installPointerClickFocusRelease } from './buttonFocus';

export interface EquipmentPanelSlotViewModel {
  slotId: PlayerEquipmentSlotId;
  slotLabel: string;
  itemLabel: string;
  defenseLabel: string;
  equipped: boolean;
}

export interface EquipmentPanelState {
  totalDefense: number;
  slots: readonly EquipmentPanelSlotViewModel[];
}

interface EquipmentPanelOptions {
  host: HTMLElement;
  onToggleSlot?: (slotId: PlayerEquipmentSlotId) => void;
}

const createSectionLabel = (text: string): HTMLDivElement => {
  const label = document.createElement('div');
  label.textContent = text;
  label.style.color = '#aab7c7';
  label.style.fontSize = '11px';
  return label;
};

export class EquipmentPanel {
  private root: HTMLDivElement;
  private statusLine: HTMLDivElement;
  private slotList: HTMLDivElement;
  private onToggleSlot: (slotId: PlayerEquipmentSlotId) => void;

  constructor(options: EquipmentPanelOptions) {
    this.onToggleSlot = options.onToggleSlot ?? (() => {});

    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '12px';
    this.root.style.bottom = '198px';
    this.root.style.zIndex = '20';
    this.root.style.display = 'none';
    this.root.style.flexDirection = 'column';
    this.root.style.gap = '8px';
    this.root.style.padding = '8px';
    this.root.style.borderRadius = '10px';
    this.root.style.background = 'rgba(0, 0, 0, 0.6)';
    this.root.style.border = '1px solid rgba(255, 255, 255, 0.12)';
    this.root.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
    this.root.style.fontFamily = 'monospace';
    this.root.style.pointerEvents = 'auto';
    this.root.style.userSelect = 'none';
    this.root.style.maxWidth = 'min(320px, calc(100vw - 24px))';

    const title = document.createElement('div');
    title.textContent = 'Equipment';
    title.style.color = '#d6dde8';
    title.style.fontSize = '11px';
    title.style.letterSpacing = '0.04em';
    title.style.textTransform = 'uppercase';
    this.root.append(title);

    const statusSection = document.createElement('div');
    statusSection.style.display = 'flex';
    statusSection.style.flexDirection = 'column';
    statusSection.style.gap = '4px';
    this.root.append(statusSection);

    statusSection.append(createSectionLabel('Defense'));

    this.statusLine = document.createElement('div');
    this.statusLine.style.color = '#d6dde8';
    this.statusLine.style.fontSize = '11px';
    this.statusLine.style.lineHeight = '1.35';
    statusSection.append(this.statusLine);

    const slotSection = document.createElement('div');
    slotSection.style.display = 'flex';
    slotSection.style.flexDirection = 'column';
    slotSection.style.gap = '6px';
    this.root.append(slotSection);

    slotSection.append(createSectionLabel('Slots'));

    this.slotList = document.createElement('div');
    this.slotList.style.display = 'flex';
    this.slotList.style.flexDirection = 'column';
    this.slotList.style.gap = '6px';
    slotSection.append(this.slotList);

    options.host.append(this.root);
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? 'flex' : 'none';
  }

  update(state: EquipmentPanelState): void {
    this.statusLine.textContent =
      state.totalDefense > 0 ? `Total defense: ${state.totalDefense}` : 'No armor equipped';
    this.statusLine.style.color = state.totalDefense > 0 ? '#bfe7c8' : '#e6c88d';

    const slotCards = state.slots.map((slot) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.display = 'flex';
      button.style.flexDirection = 'column';
      button.style.alignItems = 'flex-start';
      button.style.gap = '2px';
      button.style.padding = '8px';
      button.style.borderRadius = '8px';
      button.style.border = '1px solid rgba(255, 255, 255, 0.16)';
      button.style.background = slot.equipped
        ? 'rgba(66, 112, 84, 0.22)'
        : 'rgba(255, 255, 255, 0.05)';
      button.style.color = '#f3f7fb';
      button.style.fontFamily = 'inherit';
      button.style.fontSize = '12px';
      button.style.cursor = 'pointer';
      button.style.touchAction = 'manipulation';
      button.title = `${slot.equipped ? 'Unequip' : 'Equip'} ${slot.itemLabel} (${slot.slotLabel})`;
      button.addEventListener('click', () => {
        this.onToggleSlot(slot.slotId);
      });
      installPointerClickFocusRelease(button);

      const slotLabel = document.createElement('div');
      slotLabel.textContent = slot.slotLabel;
      slotLabel.style.fontSize = '11px';
      slotLabel.style.color = '#aab7c7';
      button.append(slotLabel);

      const itemLabel = document.createElement('div');
      itemLabel.textContent = slot.itemLabel;
      itemLabel.style.fontSize = '12px';
      itemLabel.style.fontWeight = '700';
      button.append(itemLabel);

      const details = document.createElement('div');
      details.textContent = `${slot.defenseLabel} | ${slot.equipped ? 'Equipped' : 'Unequipped'}`;
      details.style.fontSize = '11px';
      details.style.color = slot.equipped ? '#bfe7c8' : '#d6dde8';
      button.append(details);

      return button;
    });

    this.slotList.replaceChildren(...slotCards);
  }

  getRootElement(): HTMLDivElement {
    return this.root;
  }
}
