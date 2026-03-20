import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ItemCatalogPanel } from './itemCatalogPanel';

class FakeElement {
  style: Record<string, string> = {};
  children: FakeElement[] = [];
  textContent = '';
  title = '';
  type = '';
  value = '';
  placeholder = '';
  autocomplete = '';
  spellcheck = true;
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

  input(value: string): void {
    this.value = value;
    for (const listener of this.listeners.get('input') ?? []) {
      listener({ detail: 0 });
    }
  }

  blur(): void {
    this.blurCallCount += 1;
  }
}

describe('ItemCatalogPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: () => new FakeElement()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createHost = (): HTMLElement => document.createElement('div') as unknown as HTMLElement;
  const getSearchInput = (panel: ItemCatalogPanel): FakeElement =>
    (((panel.getRootElement() as unknown as FakeElement).children[1] as FakeElement).children[1] ??
      null) as FakeElement;
  const getSummaryLine = (panel: ItemCatalogPanel): FakeElement =>
    (((panel.getRootElement() as unknown as FakeElement).children[2] as FakeElement).children[1] ??
      null) as FakeElement;
  const getItemList = (panel: ItemCatalogPanel): FakeElement =>
    (((panel.getRootElement() as unknown as FakeElement).children[2] as FakeElement).children[2] ??
      null) as FakeElement;

  it('renders the search query, result summary, and spawn cards', () => {
    const host = createHost();
    const panel = new ItemCatalogPanel({ host });

    panel.setVisible(true);
    panel.update({
      searchQuery: 'bench',
      resultSummaryLabel: '1 matching item',
      emptyLabel: 'No items match "bench"',
      items: [
        {
          itemId: 'workbench',
          label: 'Workbench',
          detailsLabel: 'Id: workbench | Hotbar: BENCH | Max stack: 99',
          inventoryLabel: 'Have: 0 | Spawn +1',
          enabled: true
        },
        {
          itemId: 'sword',
          label: 'Starter Sword',
          detailsLabel: 'Id: sword | Hotbar: SWORD | Max stack: 1',
          inventoryLabel: 'Have: 1 | Inventory full',
          enabled: false,
          disabledReason: 'Inventory full'
        }
      ]
    });

    const root = panel.getRootElement() as unknown as FakeElement;
    const searchInput = getSearchInput(panel);
    const itemList = getItemList(panel);

    expect(root.style.display).toBe('flex');
    expect(searchInput.value).toBe('bench');
    expect(getSummaryLine(panel).textContent).toBe('1 matching item');
    expect(itemList.children[0]!.title).toBe('Spawn Workbench');
    expect(itemList.children[0]!.getAttribute('aria-disabled')).toBe('false');
    expect(itemList.children[1]!.title).toContain('Inventory full');
    expect(itemList.children[1]!.getAttribute('aria-disabled')).toBe('true');
  });

  it('forwards search updates and enabled spawn clicks while ignoring disabled cards', () => {
    const host = createHost();
    const onSearchQueryChange = vi.fn();
    const onSpawnItem = vi.fn();
    const panel = new ItemCatalogPanel({ host, onSearchQueryChange, onSpawnItem });

    panel.update({
      searchQuery: '',
      resultSummaryLabel: '2 items',
      emptyLabel: 'No catalog items available',
      items: [
        {
          itemId: 'bug-net',
          label: 'Bug Net',
          detailsLabel: 'Id: bug-net | Hotbar: NET | Max stack: 1',
          inventoryLabel: 'Have: 0 | Spawn +1',
          enabled: true
        },
        {
          itemId: 'sword',
          label: 'Starter Sword',
          detailsLabel: 'Id: sword | Hotbar: SWORD | Max stack: 1',
          inventoryLabel: 'Have: 1 | Inventory full',
          enabled: false,
          disabledReason: 'Inventory full'
        }
      ]
    });

    getSearchInput(panel).input('bug');
    const itemList = getItemList(panel);
    itemList.children[0]!.click();
    itemList.children[1]!.click();

    expect(onSearchQueryChange).toHaveBeenCalledTimes(1);
    expect(onSearchQueryChange).toHaveBeenCalledWith('bug');
    expect(onSpawnItem).toHaveBeenCalledTimes(1);
    expect(onSpawnItem).toHaveBeenCalledWith('bug-net');
  });

  it('shows an empty-state card when no search results remain', () => {
    const host = createHost();
    const panel = new ItemCatalogPanel({ host });

    panel.update({
      searchQuery: 'zzz',
      resultSummaryLabel: '0 matching items',
      emptyLabel: 'No items match "zzz"',
      items: []
    });

    expect(getItemList(panel).children[0]!.textContent).toBe('No items match "zzz"');
  });

  it('can hide and show itself without removing the DOM root', () => {
    const host = createHost();
    const panel = new ItemCatalogPanel({ host });

    panel.setVisible(false);
    expect((panel.getRootElement() as unknown as FakeElement).style.display).toBe('none');

    panel.setVisible(true);
    expect((panel.getRootElement() as unknown as FakeElement).style.display).toBe('flex');
    expect((host as unknown as FakeElement).children.length).toBe(1);
  });
});
