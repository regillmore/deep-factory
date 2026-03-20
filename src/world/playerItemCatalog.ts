import {
  getPlayerInventoryItemDefinitions,
  type PlayerInventoryItemDefinition,
  type PlayerInventoryItemId
} from './playerInventory';

export interface PlayerItemCatalogEntry {
  itemId: PlayerInventoryItemId;
  label: string;
  hotbarLabel: string;
  maxStackSize: number;
}

interface CompiledPlayerItemCatalogEntry extends PlayerItemCatalogEntry {
  normalizedSearchText: string;
}

const compareCatalogEntries = (
  left: PlayerInventoryItemDefinition,
  right: PlayerInventoryItemDefinition
): number => {
  const labelOrder = left.label.localeCompare(right.label);
  return labelOrder !== 0 ? labelOrder : left.id.localeCompare(right.id);
};

const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const buildNormalizedSearchText = (definition: PlayerInventoryItemDefinition): string =>
  normalizeSearchText(
    [
      definition.id,
      definition.id.replace(/-/g, ' '),
      definition.label,
      definition.hotbarLabel
    ].join(' ')
  );

const PLAYER_ITEM_CATALOG_ENTRIES: readonly CompiledPlayerItemCatalogEntry[] =
  getPlayerInventoryItemDefinitions()
    .slice()
    .sort(compareCatalogEntries)
    .map((definition) => ({
      itemId: definition.id,
      label: definition.label,
      hotbarLabel: definition.hotbarLabel,
      maxStackSize: definition.maxStackSize,
      normalizedSearchText: buildNormalizedSearchText(definition)
    }));

const matchesCatalogQuery = (
  entry: CompiledPlayerItemCatalogEntry,
  normalizedQueryTokens: readonly string[]
): boolean =>
  normalizedQueryTokens.every((token) => entry.normalizedSearchText.includes(token));

export const getPlayerItemCatalogEntries = (): readonly PlayerItemCatalogEntry[] =>
  PLAYER_ITEM_CATALOG_ENTRIES;

export const searchPlayerItemCatalog = (query: string): readonly PlayerItemCatalogEntry[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length === 0) {
    return PLAYER_ITEM_CATALOG_ENTRIES;
  }

  const queryTokens = normalizedQuery.split(' ').filter((token) => token.length > 0);
  return PLAYER_ITEM_CATALOG_ENTRIES.filter((entry) => matchesCatalogQuery(entry, queryTokens));
};
