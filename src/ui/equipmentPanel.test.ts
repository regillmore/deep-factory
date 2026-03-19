import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EquipmentPanel } from './equipmentPanel';

class FakeElement {
  style: Record<string, string> = {};
  children: FakeElement[] = [];
  textContent = '';
  title = '';
  type = '';
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

describe('EquipmentPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: () => new FakeElement()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createHost = (): HTMLElement => document.createElement('div') as unknown as HTMLElement;
  const getSlotList = (panel: EquipmentPanel): FakeElement =>
    (((panel.getRootElement() as unknown as FakeElement).children[2] as FakeElement).children[1] ??
      null) as FakeElement;

  it('renders the total defense summary and slot cards', () => {
    const host = createHost();
    const panel = new EquipmentPanel({ host });

    panel.setVisible(true);
    panel.update({
      totalDefense: 3,
      slots: [
        {
          slotId: 'head',
          slotLabel: 'Head',
          itemLabel: 'Starter Helmet',
          defenseLabel: '+1 DEF',
          equipped: true
        },
        {
          slotId: 'body',
          slotLabel: 'Body',
          itemLabel: 'Starter Breastplate',
          defenseLabel: '+2 DEF',
          equipped: false
        }
      ]
    });

    const root = panel.getRootElement() as unknown as FakeElement;
    const slotList = getSlotList(panel);

    expect(root.style.display).toBe('flex');
    expect(((root.children[1] as FakeElement).children[1] as FakeElement).textContent).toBe(
      'Total defense: 3'
    );
    expect(slotList.children[0]!.title).toBe('Unequip Starter Helmet (Head)');
    expect((slotList.children[1]!.children[2] as FakeElement).textContent).toBe(
      '+2 DEF | Unequipped'
    );
  });

  it('forwards slot toggles through the configured handler', () => {
    const host = createHost();
    const onToggleSlot = vi.fn();
    const panel = new EquipmentPanel({ host, onToggleSlot });

    panel.update({
      totalDefense: 0,
      slots: [
        {
          slotId: 'legs',
          slotLabel: 'Legs',
          itemLabel: 'Starter Greaves',
          defenseLabel: '+1 DEF',
          equipped: false
        }
      ]
    });

    getSlotList(panel).children[0]!.click();

    expect(onToggleSlot).toHaveBeenCalledTimes(1);
    expect(onToggleSlot).toHaveBeenCalledWith('legs');
  });

  it('can hide and show itself without removing the DOM root', () => {
    const host = createHost();
    const panel = new EquipmentPanel({ host });

    panel.setVisible(false);
    expect((panel.getRootElement() as unknown as FakeElement).style.display).toBe('none');

    panel.setVisible(true);
    expect((panel.getRootElement() as unknown as FakeElement).style.display).toBe('flex');
    expect((host as unknown as FakeElement).children.length).toBe(1);
  });
});
