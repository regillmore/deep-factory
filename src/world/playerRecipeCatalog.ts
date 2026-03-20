import {
  getPlayerInventoryItemDefinition,
  type PlayerInventoryItemId
} from './playerInventory';
import {
  getPlayerCraftingRecipeDefinitions,
  getPlayerCraftingStationLabel,
  type PlayerCraftingRecipeId,
  type PlayerCraftingStationId
} from './playerCrafting';

export interface PlayerRecipeCatalogIngredientEntry {
  itemId: PlayerInventoryItemId;
  label: string;
  amount: number;
}

export interface PlayerRecipeCatalogEntry {
  recipeId: PlayerCraftingRecipeId;
  label: string;
  outputItemId: PlayerInventoryItemId;
  outputLabel: string;
  ingredientsLabel: string;
  stationRequirementLabel: string;
  requiredStationId: PlayerCraftingStationId | null;
  ingredients: readonly PlayerRecipeCatalogIngredientEntry[];
}

interface CompiledPlayerRecipeCatalogEntry extends PlayerRecipeCatalogEntry {
  normalizedSearchText: string;
}

const compareCatalogEntries = (
  left: CompiledPlayerRecipeCatalogEntry,
  right: CompiledPlayerRecipeCatalogEntry
): number => {
  const labelOrder = left.label.localeCompare(right.label);
  return labelOrder !== 0 ? labelOrder : left.recipeId.localeCompare(right.recipeId);
};

const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const buildOutputLabel = (outputItemId: PlayerInventoryItemId, outputAmount: number): string =>
  `Output: +${outputAmount} ${getPlayerInventoryItemDefinition(outputItemId).hotbarLabel}`;

const buildIngredientsLabel = (
  ingredients: readonly PlayerRecipeCatalogIngredientEntry[]
): string =>
  `Ingredients: ${ingredients.map((ingredient) => `${ingredient.amount} ${ingredient.label}`).join(' + ')}`;

const buildStationRequirementLabel = (
  requiredStationId: PlayerCraftingStationId | null
): string =>
  requiredStationId === null
    ? 'Requirement: None'
    : `Requirement: Nearby ${getPlayerCraftingStationLabel(requiredStationId)}`;

const buildNormalizedSearchText = (
  entry: Omit<CompiledPlayerRecipeCatalogEntry, 'normalizedSearchText'>
): string =>
  normalizeSearchText(
    [
      entry.recipeId,
      entry.recipeId.replace(/-/g, ' '),
      entry.label,
      entry.outputItemId,
      entry.outputItemId.replace(/-/g, ' '),
      entry.outputLabel,
      entry.ingredientsLabel,
      entry.stationRequirementLabel,
      ...entry.ingredients.flatMap((ingredient) => [
        ingredient.itemId,
        ingredient.itemId.replace(/-/g, ' '),
        ingredient.label,
        String(ingredient.amount)
      ])
    ].join(' ')
  );

const PLAYER_RECIPE_CATALOG_ENTRIES: readonly CompiledPlayerRecipeCatalogEntry[] =
  getPlayerCraftingRecipeDefinitions()
    .map((recipe) => {
      const ingredients = recipe.ingredients.map((ingredient) => ({
        itemId: ingredient.itemId,
        label: getPlayerInventoryItemDefinition(ingredient.itemId).label,
        amount: ingredient.amount
      }));
      const entry = {
        recipeId: recipe.id,
        label: recipe.label,
        outputItemId: recipe.output.itemId,
        outputLabel: buildOutputLabel(recipe.output.itemId, recipe.output.amount),
        ingredientsLabel: buildIngredientsLabel(ingredients),
        stationRequirementLabel: buildStationRequirementLabel(recipe.requiredStationId),
        requiredStationId: recipe.requiredStationId,
        ingredients
      };
      return {
        ...entry,
        normalizedSearchText: buildNormalizedSearchText(entry)
      };
    })
    .slice()
    .sort(compareCatalogEntries);

const matchesCatalogQuery = (
  entry: CompiledPlayerRecipeCatalogEntry,
  normalizedQueryTokens: readonly string[]
): boolean =>
  normalizedQueryTokens.every((token) => entry.normalizedSearchText.includes(token));

const toPublicRecipeCatalogEntry = (
  entry: CompiledPlayerRecipeCatalogEntry
): PlayerRecipeCatalogEntry => {
  const { normalizedSearchText: _normalizedSearchText, ...publicEntry } = entry;
  return publicEntry;
};

export const getPlayerRecipeCatalogEntries = (): readonly PlayerRecipeCatalogEntry[] =>
  PLAYER_RECIPE_CATALOG_ENTRIES.map(toPublicRecipeCatalogEntry);

export const searchPlayerRecipeCatalog = (query: string): readonly PlayerRecipeCatalogEntry[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length === 0) {
    return getPlayerRecipeCatalogEntries();
  }

  const queryTokens = normalizedQuery.split(' ').filter((token) => token.length > 0);
  return PLAYER_RECIPE_CATALOG_ENTRIES.filter((entry) =>
    matchesCatalogQuery(entry, queryTokens)
  ).map(toPublicRecipeCatalogEntry);
};
