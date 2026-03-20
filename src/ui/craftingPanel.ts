import { installPointerClickFocusRelease } from './buttonFocus';

export interface CraftingPanelRecipeViewModel {
  recipeId: string;
  label: string;
  ingredientsLabel: string;
  outputLabel: string;
  enabled: boolean;
  disabledReason?: string | null;
}

export interface CraftingPanelStationViewModel {
  stationId: string;
  label: string;
  inRange: boolean;
}

export interface CraftingPanelState {
  stations: readonly CraftingPanelStationViewModel[];
  recipes: readonly CraftingPanelRecipeViewModel[];
}

interface CraftingPanelOptions {
  host: HTMLElement;
  onCraftRecipe?: (recipeId: string) => void;
}

const createSectionLabel = (text: string): HTMLDivElement => {
  const label = document.createElement('div');
  label.textContent = text;
  label.style.color = '#aab7c7';
  label.style.fontSize = '11px';
  return label;
};

const areCraftingPanelRecipeViewModelsEqual = (
  left: readonly CraftingPanelRecipeViewModel[],
  right: readonly CraftingPanelRecipeViewModel[]
): boolean =>
  left.length === right.length &&
  left.every((recipe, index) => {
    const other = right[index];
    return (
      other !== undefined &&
      recipe.recipeId === other.recipeId &&
      recipe.label === other.label &&
      recipe.ingredientsLabel === other.ingredientsLabel &&
      recipe.outputLabel === other.outputLabel &&
      recipe.enabled === other.enabled &&
      (recipe.disabledReason ?? null) === (other.disabledReason ?? null)
    );
  });

const areCraftingPanelStatesEqual = (
  left: CraftingPanelState | null,
  right: CraftingPanelState
): boolean =>
  left !== null &&
  left.stations.length === right.stations.length &&
  left.stations.every((station, index) => {
    const other = right.stations[index];
    return (
      other !== undefined &&
      station.stationId === other.stationId &&
      station.label === other.label &&
      station.inRange === other.inRange
    );
  }) &&
  areCraftingPanelRecipeViewModelsEqual(left.recipes, right.recipes);

const cloneCraftingPanelState = (state: CraftingPanelState): CraftingPanelState => ({
  stations: state.stations.map((station) => ({
    stationId: station.stationId,
    label: station.label,
    inRange: station.inRange
  })),
  recipes: state.recipes.map((recipe) => ({
    recipeId: recipe.recipeId,
    label: recipe.label,
    ingredientsLabel: recipe.ingredientsLabel,
    outputLabel: recipe.outputLabel,
    enabled: recipe.enabled,
    disabledReason: recipe.disabledReason ?? null
  }))
});

export class CraftingPanel {
  private root: HTMLDivElement;
  private stationList: HTMLDivElement;
  private recipeList: HTMLDivElement;
  private onCraftRecipe: (recipeId: string) => void;
  private lastRenderedState: CraftingPanelState | null = null;

  constructor(options: CraftingPanelOptions) {
    this.onCraftRecipe = options.onCraftRecipe ?? (() => {});

    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.left = '12px';
    this.root.style.bottom = '12px';
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
    title.textContent = 'Crafting';
    title.style.color = '#d6dde8';
    title.style.fontSize = '11px';
    title.style.letterSpacing = '0.04em';
    title.style.textTransform = 'uppercase';
    this.root.append(title);

    const stationSection = document.createElement('div');
    stationSection.style.display = 'flex';
    stationSection.style.flexDirection = 'column';
    stationSection.style.gap = '4px';
    this.root.append(stationSection);

    stationSection.append(createSectionLabel('Stations'));

    this.stationList = document.createElement('div');
    this.stationList.style.display = 'flex';
    this.stationList.style.flexDirection = 'column';
    this.stationList.style.gap = '2px';
    stationSection.append(this.stationList);

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

  update(state: CraftingPanelState): void {
    if (areCraftingPanelStatesEqual(this.lastRenderedState, state)) {
      return;
    }

    const stationLines =
      state.stations.length > 0
        ? state.stations.map((station) => {
            const line = document.createElement('div');
            line.textContent = station.inRange
              ? `${station.label} nearby`
              : `${station.label} not in range`;
            line.style.color = station.inRange ? '#bfe7c8' : '#e6c88d';
            line.style.fontSize = '11px';
            line.style.lineHeight = '1.35';
            return line;
          })
        : [(() => {
            const line = document.createElement('div');
            line.textContent = 'No station requirements';
            line.style.color = '#aab7c7';
            line.style.fontSize = '11px';
            line.style.lineHeight = '1.35';
            return line;
          })()];
    this.stationList.replaceChildren(...stationLines);

    const recipeCards = state.recipes.map((recipe) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.display = 'flex';
      button.style.flexDirection = 'column';
      button.style.alignItems = 'flex-start';
      button.style.gap = '2px';
      button.style.padding = '8px';
      button.style.borderRadius = '8px';
      button.style.border = '1px solid rgba(255, 255, 255, 0.16)';
      button.style.background = recipe.enabled
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.04)';
      button.style.color = recipe.enabled ? '#f3f7fb' : '#aab7c7';
      button.style.fontFamily = 'inherit';
      button.style.fontSize = '12px';
      button.style.cursor = recipe.enabled ? 'pointer' : 'default';
      button.style.touchAction = 'manipulation';
      button.disabled = !recipe.enabled;
      button.setAttribute('aria-disabled', recipe.enabled ? 'false' : 'true');
      button.title =
        recipe.disabledReason === null || recipe.disabledReason === undefined
          ? `Craft ${recipe.label}`
          : `Craft ${recipe.label} (${recipe.disabledReason})`;
      button.addEventListener('click', () => {
        if (!recipe.enabled) {
          return;
        }
        this.onCraftRecipe(recipe.recipeId);
      });
      installPointerClickFocusRelease(button);

      const label = document.createElement('div');
      label.textContent = recipe.label;
      label.style.fontSize = '12px';
      label.style.fontWeight = '700';
      button.append(label);

      const ingredients = document.createElement('div');
      ingredients.textContent = recipe.ingredientsLabel;
      ingredients.style.fontSize = '11px';
      ingredients.style.color = '#d6dde8';
      button.append(ingredients);

      const output = document.createElement('div');
      output.textContent = recipe.outputLabel;
      output.style.fontSize = '11px';
      output.style.color = recipe.enabled ? '#bfe7c8' : '#aab7c7';
      button.append(output);

      return button;
    });

    this.recipeList.replaceChildren(...recipeCards);
    this.lastRenderedState = cloneCraftingPanelState(state);
  }

  getRootElement(): HTMLDivElement {
    return this.root;
  }
}
