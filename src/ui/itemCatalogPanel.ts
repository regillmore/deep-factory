import { installPointerClickFocusRelease } from './buttonFocus';

export interface ItemCatalogPanelItemViewModel {
  itemId: string;
  label: string;
  detailsLabel: string;
  inventoryLabel: string;
  enabled: boolean;
  disabledReason?: string | null;
}

export interface ItemCatalogPanelState {
  searchQuery: string;
  resultSummaryLabel: string;
  emptyLabel: string;
  items: readonly ItemCatalogPanelItemViewModel[];
}

interface ItemCatalogPanelOptions {
  host: HTMLElement;
  onSearchQueryChange?: (query: string) => void;
  onSpawnItem?: (itemId: string) => void;
}

const createSectionLabel = (text: string): HTMLDivElement => {
  const label = document.createElement('div');
  label.textContent = text;
  label.style.color = '#aab7c7';
  label.style.fontSize = '11px';
  return label;
};

export class ItemCatalogPanel {
  private root: HTMLDivElement;
  private searchInput: HTMLInputElement;
  private resultSummaryLine: HTMLDivElement;
  private itemList: HTMLDivElement;
  private onSearchQueryChange: (query: string) => void;
  private onSpawnItem: (itemId: string) => void;

  constructor(options: ItemCatalogPanelOptions) {
    this.onSearchQueryChange = options.onSearchQueryChange ?? (() => {});
    this.onSpawnItem = options.onSpawnItem ?? (() => {});

    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '12px';
    this.root.style.top = '12px';
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
    this.root.style.maxHeight = 'min(260px, calc(100vh - 24px))';
    this.root.style.overflow = 'hidden';

    const title = document.createElement('div');
    title.textContent = 'Item Catalog';
    title.style.color = '#d6dde8';
    title.style.fontSize = '11px';
    title.style.letterSpacing = '0.04em';
    title.style.textTransform = 'uppercase';
    this.root.append(title);

    const searchSection = document.createElement('div');
    searchSection.style.display = 'flex';
    searchSection.style.flexDirection = 'column';
    searchSection.style.gap = '4px';
    this.root.append(searchSection);

    searchSection.append(createSectionLabel('Search'));

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Filter by id, label, or hotbar tag';
    this.searchInput.autocomplete = 'off';
    this.searchInput.spellcheck = false;
    this.searchInput.style.width = '100%';
    this.searchInput.style.minWidth = '0';
    this.searchInput.style.padding = '6px 8px';
    this.searchInput.style.borderRadius = '8px';
    this.searchInput.style.border = '1px solid rgba(255, 255, 255, 0.16)';
    this.searchInput.style.background = 'rgba(255, 255, 255, 0.05)';
    this.searchInput.style.color = '#f3f7fb';
    this.searchInput.style.fontFamily = 'inherit';
    this.searchInput.style.fontSize = '12px';
    this.searchInput.addEventListener('input', () => {
      this.onSearchQueryChange(this.searchInput.value);
    });
    searchSection.append(this.searchInput);

    const resultSection = document.createElement('div');
    resultSection.style.display = 'flex';
    resultSection.style.flexDirection = 'column';
    resultSection.style.gap = '6px';
    resultSection.style.minHeight = '0';
    this.root.append(resultSection);

    resultSection.append(createSectionLabel('Items'));

    this.resultSummaryLine = document.createElement('div');
    this.resultSummaryLine.style.color = '#d6dde8';
    this.resultSummaryLine.style.fontSize = '11px';
    this.resultSummaryLine.style.lineHeight = '1.35';
    resultSection.append(this.resultSummaryLine);

    this.itemList = document.createElement('div');
    this.itemList.style.display = 'flex';
    this.itemList.style.flexDirection = 'column';
    this.itemList.style.gap = '6px';
    this.itemList.style.overflowY = 'auto';
    this.itemList.style.minHeight = '0';
    resultSection.append(this.itemList);

    options.host.append(this.root);
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? 'flex' : 'none';
  }

  update(state: ItemCatalogPanelState): void {
    this.searchInput.value = state.searchQuery;
    this.resultSummaryLine.textContent = state.resultSummaryLabel;

    if (state.items.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.textContent = state.emptyLabel;
      emptyState.style.padding = '8px';
      emptyState.style.borderRadius = '8px';
      emptyState.style.border = '1px solid rgba(255, 255, 255, 0.08)';
      emptyState.style.background = 'rgba(255, 255, 255, 0.04)';
      emptyState.style.color = '#aab7c7';
      emptyState.style.fontSize = '11px';
      emptyState.style.lineHeight = '1.35';
      this.itemList.replaceChildren(emptyState);
      return;
    }

    const itemCards = state.items.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.display = 'flex';
      button.style.flexDirection = 'column';
      button.style.alignItems = 'flex-start';
      button.style.gap = '2px';
      button.style.padding = '8px';
      button.style.borderRadius = '8px';
      button.style.border = '1px solid rgba(255, 255, 255, 0.16)';
      button.style.background = item.enabled
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.04)';
      button.style.color = item.enabled ? '#f3f7fb' : '#aab7c7';
      button.style.fontFamily = 'inherit';
      button.style.fontSize = '12px';
      button.style.cursor = item.enabled ? 'pointer' : 'default';
      button.style.touchAction = 'manipulation';
      button.disabled = !item.enabled;
      button.setAttribute('aria-disabled', item.enabled ? 'false' : 'true');
      button.title =
        item.disabledReason === null || item.disabledReason === undefined
          ? `Spawn ${item.label}`
          : `Spawn ${item.label} (${item.disabledReason})`;
      button.addEventListener('click', () => {
        if (!item.enabled) {
          return;
        }
        this.onSpawnItem(item.itemId);
      });
      installPointerClickFocusRelease(button);

      const label = document.createElement('div');
      label.textContent = item.label;
      label.style.fontSize = '12px';
      label.style.fontWeight = '700';
      button.append(label);

      const details = document.createElement('div');
      details.textContent = item.detailsLabel;
      details.style.fontSize = '11px';
      details.style.color = '#d6dde8';
      button.append(details);

      const inventory = document.createElement('div');
      inventory.textContent = item.inventoryLabel;
      inventory.style.fontSize = '11px';
      inventory.style.color = item.enabled ? '#bfe7c8' : '#e6c88d';
      button.append(inventory);

      return button;
    });

    this.itemList.replaceChildren(...itemCards);
  }

  getRootElement(): HTMLDivElement {
    return this.root;
  }
}
