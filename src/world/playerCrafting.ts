import { TILE_SIZE } from './constants';
import {
  addPlayerInventoryItemStack,
  clonePlayerInventoryState,
  getPlayerInventoryItemAmount,
  removePlayerInventoryItemAmount,
  type PlayerInventoryItemId,
  type PlayerInventoryState
} from './playerInventory';
import {
  DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE,
  evaluatePlayerHotbarTilePlacementRange
} from './playerHotbarPlacementRange';
import type { PlayerState } from './playerState';
import {
  STARTER_WORKBENCH_TILE_ID
} from './starterWorkbenchPlacement';
import { STARTER_FURNACE_TILE_ID } from './starterFurnacePlacement';
import { STARTER_ANVIL_TILE_ID } from './starterAnvilPlacement';

export type PlayerCraftingStationId = 'workbench' | 'furnace' | 'anvil';
export type PlayerCraftingRecipeId =
  | 'workbench'
  | 'furnace'
  | 'healing-potion'
  | 'copper-bar'
  | 'anvil'
  | 'spear';

export interface PlayerCraftingStationDefinition {
  id: PlayerCraftingStationId;
  label: string;
}

export interface PlayerCraftingRecipeStack {
  itemId: PlayerInventoryItemId;
  amount: number;
}

export interface PlayerCraftingRecipeDefinition {
  id: PlayerCraftingRecipeId;
  label: string;
  ingredients: readonly PlayerCraftingRecipeStack[];
  output: PlayerCraftingRecipeStack;
  requiredStationId: PlayerCraftingStationId | null;
}

export interface PlayerCraftingWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface PlayerCraftingIngredientEvaluation extends PlayerCraftingRecipeStack {
  availableAmount: number;
  missingAmount: number;
}

export interface PlayerCraftingStationMatch {
  stationId: PlayerCraftingStationId;
  tileX: number;
  tileY: number;
  distanceSquared: number;
}

export interface EvaluatePlayerCraftingRecipeOptions {
  inventoryState: PlayerInventoryState;
  recipeId: PlayerCraftingRecipeId;
  playerState?: Pick<PlayerState, 'position' | 'size'> | null;
  world?: PlayerCraftingWorldView | null;
  maxStationDistance?: number;
}

export interface PlayerCraftingRecipeEvaluation {
  recipe: PlayerCraftingRecipeDefinition;
  ingredients: readonly PlayerCraftingIngredientEvaluation[];
  hasIngredients: boolean;
  stationInRange: boolean;
  stationMatch: PlayerCraftingStationMatch | null;
  outputFitsInInventory: boolean;
  blocker: 'missing-ingredients' | 'missing-station' | 'inventory-full' | null;
  craftable: boolean;
}

export interface TryCraftPlayerRecipeResult {
  crafted: boolean;
  nextInventoryState: PlayerInventoryState;
  evaluation: PlayerCraftingRecipeEvaluation;
}

const PLAYER_CRAFTING_STATION_TILE_IDS: Readonly<Record<PlayerCraftingStationId, number>> = {
  workbench: STARTER_WORKBENCH_TILE_ID,
  furnace: STARTER_FURNACE_TILE_ID,
  anvil: STARTER_ANVIL_TILE_ID
};

const PLAYER_CRAFTING_STATION_LABELS: Readonly<Record<PlayerCraftingStationId, string>> = {
  workbench: 'Workbench',
  furnace: 'Furnace',
  anvil: 'Anvil'
};

const PLAYER_CRAFTING_STATION_IDS = ['workbench', 'furnace', 'anvil'] as const;

const PLAYER_CRAFTING_RECIPE_DEFINITIONS: readonly PlayerCraftingRecipeDefinition[] = [
  {
    id: 'workbench',
    label: 'Workbench',
    ingredients: [{ itemId: 'dirt-block', amount: 20 }],
    output: { itemId: 'workbench', amount: 1 },
    requiredStationId: null
  },
  {
    id: 'furnace',
    label: 'Furnace',
    ingredients: [
      { itemId: 'stone-block', amount: 20 },
      { itemId: 'torch', amount: 4 }
    ],
    output: { itemId: 'furnace', amount: 1 },
    requiredStationId: 'workbench'
  },
  {
    id: 'healing-potion',
    label: 'Healing Potion',
    ingredients: [{ itemId: 'gel', amount: 2 }],
    output: { itemId: 'healing-potion', amount: 1 },
    requiredStationId: 'workbench'
  },
  {
    id: 'copper-bar',
    label: 'Copper Bar',
    ingredients: [{ itemId: 'copper-ore', amount: 3 }],
    output: { itemId: 'copper-bar', amount: 1 },
    requiredStationId: 'furnace'
  },
  {
    id: 'anvil',
    label: 'Anvil',
    ingredients: [{ itemId: 'copper-bar', amount: 5 }],
    output: { itemId: 'anvil', amount: 1 },
    requiredStationId: 'workbench'
  },
  {
    id: 'spear',
    label: 'Starter Spear',
    ingredients: [{ itemId: 'copper-bar', amount: 8 }],
    output: { itemId: 'spear', amount: 1 },
    requiredStationId: 'anvil'
  }
] as const;
const PLAYER_CRAFTING_RECIPE_IDS = new Set<PlayerCraftingRecipeId>(
  PLAYER_CRAFTING_RECIPE_DEFINITIONS.map((recipe) => recipe.id)
);

const getPlayerCraftingStationTileId = (stationId: PlayerCraftingStationId): number =>
  PLAYER_CRAFTING_STATION_TILE_IDS[stationId];

const getPlayerBodyAabb = (playerState: Pick<PlayerState, 'position' | 'size'>) => {
  const halfWidth = playerState.size.width * 0.5;
  return {
    minX: playerState.position.x - halfWidth,
    minY: playerState.position.y - playerState.size.height,
    maxX: playerState.position.x + halfWidth,
    maxY: playerState.position.y
  };
};

const getCandidateStationTileBounds = (
  playerState: Pick<PlayerState, 'position' | 'size'>,
  maxDistance: number
) => {
  const playerAabb = getPlayerBodyAabb(playerState);
  const normalizedDistance = Math.max(0, maxDistance);
  return {
    minTileX: Math.floor((playerAabb.minX - normalizedDistance) / TILE_SIZE),
    maxTileX: Math.floor((playerAabb.maxX + normalizedDistance) / TILE_SIZE),
    minTileY: Math.floor((playerAabb.minY - normalizedDistance) / TILE_SIZE),
    maxTileY: Math.floor((playerAabb.maxY + normalizedDistance) / TILE_SIZE)
  };
};

const getPlayerCraftingRecipeDefinitionIndex = (recipeId: PlayerCraftingRecipeId): number =>
  PLAYER_CRAFTING_RECIPE_DEFINITIONS.findIndex((recipe) => recipe.id === recipeId);

export const getPlayerCraftingRecipeDefinitions = (): readonly PlayerCraftingRecipeDefinition[] =>
  PLAYER_CRAFTING_RECIPE_DEFINITIONS;

export const getPlayerCraftingStationDefinitions = (): readonly PlayerCraftingStationDefinition[] =>
  PLAYER_CRAFTING_STATION_IDS.map((stationId) => ({
    id: stationId,
    label: PLAYER_CRAFTING_STATION_LABELS[stationId]
  }));

export const isPlayerCraftingRecipeId = (value: string): value is PlayerCraftingRecipeId =>
  PLAYER_CRAFTING_RECIPE_IDS.has(value as PlayerCraftingRecipeId);

export const getPlayerCraftingStationLabel = (
  stationId: PlayerCraftingStationId
): string => PLAYER_CRAFTING_STATION_LABELS[stationId];

export const getPlayerCraftingRecipeDefinition = (
  recipeId: PlayerCraftingRecipeId
): PlayerCraftingRecipeDefinition => {
  const recipeIndex = getPlayerCraftingRecipeDefinitionIndex(recipeId);
  if (recipeIndex < 0) {
    throw new Error(`Unknown player crafting recipe id "${recipeId}"`);
  }

  const recipe = PLAYER_CRAFTING_RECIPE_DEFINITIONS[recipeIndex];
  if (recipe === undefined) {
    throw new Error(`Unknown player crafting recipe id "${recipeId}"`);
  }
  return recipe;
};

export const findNearestPlayerCraftingStationInRange = ({
  stationId,
  world,
  playerState,
  maxStationDistance = DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE
}: {
  stationId: PlayerCraftingStationId;
  world: PlayerCraftingWorldView;
  playerState: Pick<PlayerState, 'position' | 'size'>;
  maxStationDistance?: number;
}): PlayerCraftingStationMatch | null => {
  const targetTileId = getPlayerCraftingStationTileId(stationId);
  const candidateBounds = getCandidateStationTileBounds(playerState, maxStationDistance);
  let nearestMatch: PlayerCraftingStationMatch | null = null;

  for (let tileY = candidateBounds.minTileY; tileY <= candidateBounds.maxTileY; tileY += 1) {
    for (let tileX = candidateBounds.minTileX; tileX <= candidateBounds.maxTileX; tileX += 1) {
      if (world.getTile(tileX, tileY) !== targetTileId) {
        continue;
      }

      const rangeEvaluation = evaluatePlayerHotbarTilePlacementRange(
        playerState,
        tileX,
        tileY,
        maxStationDistance
      );
      if (!rangeEvaluation.withinRange) {
        continue;
      }

      const match: PlayerCraftingStationMatch = {
        stationId,
        tileX,
        tileY,
        distanceSquared: rangeEvaluation.distanceSquared
      };
      if (
        nearestMatch === null ||
        match.distanceSquared < nearestMatch.distanceSquared ||
        (match.distanceSquared === nearestMatch.distanceSquared &&
          (match.tileY < nearestMatch.tileY ||
            (match.tileY === nearestMatch.tileY && match.tileX < nearestMatch.tileX)))
      ) {
        nearestMatch = match;
      }
    }
  }

  return nearestMatch;
};

const evaluatePlayerCraftingIngredients = (
  inventoryState: PlayerInventoryState,
  recipe: PlayerCraftingRecipeDefinition
): PlayerCraftingIngredientEvaluation[] =>
  recipe.ingredients.map((ingredient) => {
    const availableAmount = getPlayerInventoryItemAmount(inventoryState, ingredient.itemId);
    return {
      ...ingredient,
      availableAmount,
      missingAmount: Math.max(0, ingredient.amount - availableAmount)
    };
  });

const simulatePlayerCraftingOutputCapacity = (
  inventoryState: PlayerInventoryState,
  recipe: PlayerCraftingRecipeDefinition
): boolean => {
  let nextInventoryState = clonePlayerInventoryState(inventoryState);
  for (const ingredient of recipe.ingredients) {
    nextInventoryState = removePlayerInventoryItemAmount(
      nextInventoryState,
      ingredient.itemId,
      ingredient.amount
    ).state;
  }
  return (
    addPlayerInventoryItemStack(
      nextInventoryState,
      recipe.output.itemId,
      recipe.output.amount
    ).remainingAmount === 0
  );
};

export const evaluatePlayerCraftingRecipe = ({
  inventoryState,
  recipeId,
  playerState = null,
  world = null,
  maxStationDistance = DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE
}: EvaluatePlayerCraftingRecipeOptions): PlayerCraftingRecipeEvaluation => {
  const recipe = getPlayerCraftingRecipeDefinition(recipeId);
  const ingredients = evaluatePlayerCraftingIngredients(inventoryState, recipe);
  const hasIngredients = ingredients.every((ingredient) => ingredient.missingAmount === 0);
  const stationMatch =
    recipe.requiredStationId !== null && world !== null && playerState !== null
      ? findNearestPlayerCraftingStationInRange({
          stationId: recipe.requiredStationId,
          world,
          playerState,
          maxStationDistance
        })
      : null;
  const stationInRange = recipe.requiredStationId === null || stationMatch !== null;
  const outputFitsInInventory = hasIngredients
    ? simulatePlayerCraftingOutputCapacity(inventoryState, recipe)
    : false;
  const blocker = !hasIngredients
    ? 'missing-ingredients'
    : !stationInRange
      ? 'missing-station'
      : !outputFitsInInventory
        ? 'inventory-full'
        : null;

  return {
    recipe,
    ingredients,
    hasIngredients,
    stationInRange,
    stationMatch,
    outputFitsInInventory,
    blocker,
    craftable: blocker === null
  };
};

export const tryCraftPlayerRecipe = (
  options: EvaluatePlayerCraftingRecipeOptions
): TryCraftPlayerRecipeResult => {
  const evaluation = evaluatePlayerCraftingRecipe(options);
  if (!evaluation.craftable) {
    return {
      crafted: false,
      nextInventoryState: clonePlayerInventoryState(options.inventoryState),
      evaluation
    };
  }

  let nextInventoryState = clonePlayerInventoryState(options.inventoryState);
  for (const ingredient of evaluation.recipe.ingredients) {
    nextInventoryState = removePlayerInventoryItemAmount(
      nextInventoryState,
      ingredient.itemId,
      ingredient.amount
    ).state;
  }

  const addResult = addPlayerInventoryItemStack(
    nextInventoryState,
    evaluation.recipe.output.itemId,
    evaluation.recipe.output.amount
  );
  if (addResult.remainingAmount > 0) {
    return {
      crafted: false,
      nextInventoryState: clonePlayerInventoryState(options.inventoryState),
      evaluation: {
        ...evaluation,
        outputFitsInInventory: false,
        blocker: 'inventory-full',
        craftable: false
      }
    };
  }

  return {
    crafted: true,
    nextInventoryState: addResult.state,
    evaluation
  };
};
