import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDefaultPlayerInventoryState } from '../world/playerInventory';
import { HotbarOverlay } from './hotbarOverlay';

class FakeElement {
  style: Record<string, string> = {};
  children: FakeElement[] = [];
  textContent = '';
  title = '';
  type = '';
  private attributes = new Map<string, string>();
  private listeners = new Map<string, Array<() => void>>();

  append(...children: FakeElement[]): void {
    this.children.push(...children);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type: string, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  click(): void {
    for (const listener of this.listeners.get('click') ?? []) {
      listener();
    }
  }

  remove(): void {}
}

describe('HotbarOverlay', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: () => new FakeElement()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createHost = (): HTMLElement => document.createElement('div') as unknown as HTMLElement;

  it('renders the starter hotbar state and highlights the selected slot', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });

    overlay.setVisible(true);
    overlay.update(createDefaultPlayerInventoryState());

    const root = overlay.getRootElement() as unknown as FakeElement;
    const firstSlot = root.children[0]!;
    const secondSlot = root.children[1]!;
    const emptySlot = root.children[3]!;

    expect(root.style.display).toBe('flex');
    expect(firstSlot.title).toContain('Dirt Block');
    expect(firstSlot.getAttribute('aria-pressed')).toBe('true');
    expect(secondSlot.title).toContain('Torch');
    expect(emptySlot.children[1]!.textContent).toBe('EMPTY');
  });

  it('forwards slot clicks through the selection callback', () => {
    const host = createHost();
    const onSelectSlot = vi.fn();
    const overlay = new HotbarOverlay({ host, onSelectSlot });

    overlay.update(createDefaultPlayerInventoryState());
    (overlay.getRootElement() as unknown as FakeElement).children[2]!.click();

    expect(onSelectSlot).toHaveBeenCalledWith(2);
  });

  it('can hide and show itself without removing the DOM root', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });

    overlay.setVisible(false);
    expect((overlay.getRootElement() as unknown as FakeElement).style.display).toBe('none');

    overlay.setVisible(true);
    expect((overlay.getRootElement() as unknown as FakeElement).style.display).toBe('flex');
    expect((host as unknown as FakeElement).children.length).toBe(1);
  });
});
