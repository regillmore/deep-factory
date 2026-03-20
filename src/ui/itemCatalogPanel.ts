import { installPointerClickFocusRelease } from './buttonFocus';

export interface ItemCatalogPanelItemViewModel {
  itemId: string;
  label: string;
  detailsLabel: string;
  inventoryLabel: string;
  enabled: boolean;
  disabledReason?: string | null;
}

export interface ItemCatalogPanelRecipeViewModel {
  recipeId: string;
  label: string;
  outputLabel: string;
  ingredientsLabel: string;
  stationRequirementLabel: string;
}

export interface ItemCatalogPanelState {
  searchQuery: string;
  resultSummaryLabel: string;
  itemEmptyLabel: string;
  items: readonly ItemCatalogPanelItemViewModel[];
  recipeEmptyLabel: string;
  recipes: readonly ItemCatalogPanelRecipeViewModel[];
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
  private recipeList: HTMLDivElement;
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
    this.root.style.overflowY = 'auto';
    this.root.style.overflowX = 'hidden';

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
    this.searchInput.placeholder = 'Filter items, recipes, ingredients, or requirements';
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

    this.resultSummaryLine = document.createElement('div');
    this.resultSummaryLine.style.color = '#d6dde8';
    this.resultSummaryLine.style.fontSize = '11px';
    this.resultSummaryLine.style.lineHeight = '1.35';
    this.root.append(this.resultSummaryLine);

    const itemSection = document.createElement('div');
    itemSection.style.display = 'flex';
    itemSection.style.flexDirection = 'column';
    itemSection.style.gap = '6px';
    this.root.append(itemSection);

    itemSection.append(createSectionLabel('Items'));

    this.itemList = document.createElement('div');
    this.itemList.style.display = 'flex';
    this.itemList.style.flexDirection = 'column';
    this.itemList.style.gap = '6px';
    itemSection.append(this.itemList);

    const recipeSection = document.createElement('div');
    recipeSection.style.display = 'flex';
    recipeSection.style.flexDirection = 'column';
    recipeSection.style.gap = '6px';
    this.root.append(recipeSection);

    recipeSection.append(createSectionLabel('Recipes'));

    this.recipeList = document.createElement('div');
    this.recipeList.style.display = 'flex';
    this.recipeList.style.flexDirection = 'column';
    this.recipeList.style.gap = '6px';
    recipeSection.append(this.recipeList);

    options.host.append(this.root);
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? 'flex' : 'none';
  }

  update(state: ItemCatalogPanelState): void {
    this.searchInput.value = state.searchQuery;
    this.resultSummaryLine.textContent = state.resultSummaryLabel;

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

    this.itemList.replaceChildren(
      ...(itemCards.length > 0 ? itemCards : [this.createEmptyStateCard(state.itemEmptyLabel)])
    );

    const recipeCards = state.recipes.map((recipe) => {
      const card = document.createElement('div');
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'flex-start';
      card.style.gap = '2px';
      card.style.padding = '8px';
      card.style.borderRadius = '8px';
      card.style.border = '1px solid rgba(255, 255, 255, 0.08)';
      card.style.background = 'rgba(255, 255, 255, 0.04)';

      const label = document.createElement('div');
      label.textContent = recipe.label;
      label.style.fontSize = '12px';
      label.style.fontWeight = '700';
      label.style.color = '#f3f7fb';
      card.append(label);

      const output = document.createElement('div');
      output.textContent = recipe.outputLabel;
      output.style.fontSize = '11px';
      output.style.color = '#bfe7c8';
      card.append(output);

      const ingredients = document.createElement('div');
      ingredients.textContent = recipe.ingredientsLabel;
      ingredients.style.fontSize = '11px';
      ingredients.style.color = '#d6dde8';
      card.append(ingredients);

      const stationRequirement = document.createElement('div');
      stationRequirement.textContent = recipe.stationRequirementLabel;
      stationRequirement.style.fontSize = '11px';
      stationRequirement.style.color = '#aab7c7';
      card.append(stationRequirement);

      return card;
    });

    this.recipeList.replaceChildren(
      ...(recipeCards.length > 0 ? recipeCards : [this.createEmptyStateCard(state.recipeEmptyLabel)])
    );
  }

  getRootElement(): HTMLDivElement {
    return this.root;
  }

  private createEmptyStateCard(label: string): HTMLDivElement {
    const emptyState = document.createElement('div');
    emptyState.textContent = label;
    emptyState.style.padding = '8px';
    emptyState.style.borderRadius = '8px';
    emptyState.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    emptyState.style.background = 'rgba(255, 255, 255, 0.04)';
    emptyState.style.color = '#aab7c7';
    emptyState.style.fontSize = '11px';
    emptyState.style.lineHeight = '1.35';
    return emptyState;
  }
}
