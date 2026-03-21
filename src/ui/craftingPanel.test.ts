import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CraftingPanel } from './craftingPanel';

class FakeElement {
  style: Record<string, string> = {};
  children: FakeElement[] = [];
  textContent = '';
  title = '';
  type = '';
  disabled = false;
  blurCallCount = 0;
  private attributes = new Map<string, string>();
  private listeners = new Map<string, Array<(event?: { detail: number }) => void>>();

  append(...children: FakeElement[]): void {
    this.children.push(...children);
  }

  replaceChildren(...children: FakeElement[]): void {
    this.children = [...children];
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type: string, listener: (event?: { detail: number }) => void): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  click(detail = 1): void {
    for (const listener of this.listeners.get('click') ?? []) {
      listener({ detail });
    }
  }

  blur(): void {
    this.blurCallCount += 1;
  }
}

describe('CraftingPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: () => new FakeElement()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createHost = (): HTMLElement => document.createElement('div') as unknown as HTMLElement;
  const getRecipeList = (panel: CraftingPanel): FakeElement =>
    (((panel.getRootElement() as unknown as FakeElement).children[2] as FakeElement).children[1] ??
      null) as FakeElement;
  const getStationList = (panel: CraftingPanel): FakeElement =>
    (((panel.getRootElement() as unknown as FakeElement).children[1] as FakeElement).children[1] ??
      null) as FakeElement;

  it('renders station status lines and recipe cards', () => {
    const host = createHost();
    const panel = new CraftingPanel({ host });

    panel.setVisible(true);
    panel.update({
      stations: [
        {
          stationId: 'workbench',
          label: 'Workbench',
          inRange: false
        },
        {
          stationId: 'furnace',
          label: 'Furnace',
          inRange: true
        }
      ],
      recipes: [
        {
          recipeId: 'workbench',
          label: 'Workbench',
          ingredientsLabel: '20 Dirt Block',
          outputLabel: '+1 BENCH',
          availabilityLabel: 'Ready to craft',
          enabled: true
        },
        {
          recipeId: 'healing-potion',
          label: 'Healing Potion',
          ingredientsLabel: '2 Gel',
          outputLabel: '+1 POTION',
          availabilityLabel: 'Blocked: Requires nearby workbench',
          enabled: false,
          disabledReason: 'Requires nearby workbench'
        }
      ]
    });

    const root = panel.getRootElement() as unknown as FakeElement;
    const stationList = getStationList(panel);
    const recipeList = getRecipeList(panel);
    const firstRecipe = recipeList.children[0]!;
    const secondRecipe = recipeList.children[1]!;

    expect(root.style.display).toBe('flex');
    expect(stationList.children.map((child) => child.textContent)).toEqual([
      'Workbench not in range',
      'Furnace nearby'
    ]);
    expect(firstRecipe.title).toBe('Craft Workbench');
    expect(firstRecipe.getAttribute('aria-disabled')).toBe('false');
    expect(firstRecipe.children[3]?.textContent).toBe('Ready to craft');
    expect(secondRecipe.title).toContain('Requires nearby workbench');
    expect(secondRecipe.getAttribute('aria-disabled')).toBe('true');
    expect(secondRecipe.children[3]?.textContent).toBe('Blocked: Requires nearby workbench');
  });

  it('forwards enabled recipe clicks and ignores disabled ones', () => {
    const host = createHost();
    const onCraftRecipe = vi.fn();
    const panel = new CraftingPanel({ host, onCraftRecipe });

    panel.update({
      stations: [
        {
          stationId: 'workbench',
          label: 'Workbench',
          inRange: true
        }
      ],
      recipes: [
        {
          recipeId: 'workbench',
          label: 'Workbench',
          ingredientsLabel: '20 Dirt Block',
          outputLabel: '+1 BENCH',
          availabilityLabel: 'Ready to craft',
          enabled: true
        },
        {
          recipeId: 'healing-potion',
          label: 'Healing Potion',
          ingredientsLabel: '2 Gel',
          outputLabel: '+1 POTION',
          availabilityLabel: 'Blocked: Need 2 gel',
          enabled: false,
          disabledReason: 'Need 2 gel'
        }
      ]
    });

    const recipeList = getRecipeList(panel);
    recipeList.children[0]!.click();
    recipeList.children[1]!.click();

    expect(onCraftRecipe).toHaveBeenCalledTimes(1);
    expect(onCraftRecipe).toHaveBeenCalledWith('workbench');
  });

  it('reuses rendered recipe buttons when the state is unchanged across updates', () => {
    const host = createHost();
    const panel = new CraftingPanel({ host });
    const state = {
      stations: [
        {
          stationId: 'workbench',
          label: 'Workbench',
          inRange: true
        }
      ],
      recipes: [
        {
          recipeId: 'workbench',
          label: 'Workbench',
          ingredientsLabel: '20 Dirt Block',
          outputLabel: '+1 BENCH',
          availabilityLabel: 'Ready to craft',
          enabled: true,
          disabledReason: null
        }
      ]
    } satisfies Parameters<CraftingPanel['update']>[0];

    panel.update(state);
    const firstRecipeButton = getRecipeList(panel).children[0];

    panel.update({
      stations: state.stations.map((station) => ({ ...station })),
      recipes: state.recipes.map((recipe) => ({ ...recipe }))
    });

    expect(getRecipeList(panel).children[0]).toBe(firstRecipeButton);
  });

  it('can hide and show itself without removing the DOM root', () => {
    const host = createHost();
    const panel = new CraftingPanel({ host });

    panel.setVisible(false);
    expect((panel.getRootElement() as unknown as FakeElement).style.display).toBe('none');

    panel.setVisible(true);
    expect((panel.getRootElement() as unknown as FakeElement).style.display).toBe('flex');
    expect((host as unknown as FakeElement).children.length).toBe(1);
  });
});
