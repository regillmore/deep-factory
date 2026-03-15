import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDefaultPlayerInventoryState, createPlayerInventoryState } from '../world/playerInventory';
import { HotbarOverlay } from './hotbarOverlay';

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
  const getSlotRow = (overlay: HotbarOverlay): FakeElement =>
    (overlay.getRootElement() as unknown as FakeElement).children[1]! as FakeElement;
  const getActionRow = (overlay: HotbarOverlay): FakeElement =>
    (overlay.getRootElement() as unknown as FakeElement).children[0]! as FakeElement;
  const getMoveLeftButton = (overlay: HotbarOverlay): FakeElement =>
    getActionRow(overlay).children[0]! as FakeElement;
  const getDropOneButton = (overlay: HotbarOverlay): FakeElement =>
    getActionRow(overlay).children[1]! as FakeElement;
  const getDropStackButton = (overlay: HotbarOverlay): FakeElement =>
    getActionRow(overlay).children[2]! as FakeElement;
  const getMoveRightButton = (overlay: HotbarOverlay): FakeElement =>
    getActionRow(overlay).children[3]! as FakeElement;

  it('renders the starter hotbar state and highlights the selected slot', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });

    overlay.setVisible(true);
    overlay.update(createDefaultPlayerInventoryState());

    const root = overlay.getRootElement() as unknown as FakeElement;
    const slotRow = getSlotRow(overlay);
    const firstSlot = slotRow.children[0]!;
    const secondSlot = slotRow.children[1]!;
    const emptySlot = slotRow.children[4]!;
    const moveLeftButton = getMoveLeftButton(overlay);
    const dropOneButton = getDropOneButton(overlay);
    const dropStackButton = getDropStackButton(overlay);
    const moveRightButton = getMoveRightButton(overlay);

    expect(root.style.display).toBe('flex');
    expect(firstSlot.title).toContain('Starter Pickaxe');
    expect(firstSlot.getAttribute('aria-pressed')).toBe('true');
    expect(secondSlot.title).toContain('Dirt Block');
    expect(emptySlot.children[1]!.textContent).toBe('EMPTY');
    expect(moveLeftButton.title).toContain('leftmost slot');
    expect(moveLeftButton.getAttribute('aria-disabled')).toBe('true');
    expect(dropOneButton.title).toContain('Drop one Starter Pickaxe');
    expect(dropOneButton.getAttribute('aria-disabled')).toBe('false');
    expect(dropStackButton.title).toContain('Drop Starter Pickaxe stack');
    expect(dropStackButton.getAttribute('aria-disabled')).toBe('false');
    expect(moveRightButton.title).toContain('Move selected hotbar slot right');
    expect(moveRightButton.getAttribute('aria-disabled')).toBe('false');
  });

  it('forwards slot clicks through the selection callback', () => {
    const host = createHost();
    const onSelectSlot = vi.fn();
    const overlay = new HotbarOverlay({ host, onSelectSlot });

    overlay.update(createDefaultPlayerInventoryState());
    getSlotRow(overlay).children[2]!.click();

    expect(onSelectSlot).toHaveBeenCalledWith(2);
  });

  it('forwards move-left and move-right clicks only when those actions are available', () => {
    const host = createHost();
    const onMoveSelectedLeft = vi.fn();
    const onMoveSelectedRight = vi.fn();
    const overlay = new HotbarOverlay({
      host,
      onMoveSelectedLeft,
      onMoveSelectedRight
    });

    overlay.update(createDefaultPlayerInventoryState());
    getMoveLeftButton(overlay).click();
    getMoveRightButton(overlay).click();

    expect(onMoveSelectedLeft).toHaveBeenCalledTimes(0);
    expect(onMoveSelectedRight).toHaveBeenCalledTimes(1);

    overlay.update(
      createPlayerInventoryState({
        hotbar: createDefaultPlayerInventoryState().hotbar,
        selectedHotbarSlotIndex: 9
      })
    );
    getMoveRightButton(overlay).click();
    expect(onMoveSelectedRight).toHaveBeenCalledTimes(1);
    expect(getMoveRightButton(overlay).getAttribute('aria-disabled')).toBe('true');
  });

  it('forwards drop-stack button clicks only when the selected slot is populated', () => {
    const host = createHost();
    const onDropSelectedStack = vi.fn();
    const overlay = new HotbarOverlay({ host, onDropSelectedStack });

    overlay.update(createDefaultPlayerInventoryState());
    getDropStackButton(overlay).click();
    expect(onDropSelectedStack).toHaveBeenCalledTimes(1);

    overlay.update(createPlayerInventoryState({ hotbar: Array.from({ length: 10 }, () => null) }));
    getDropStackButton(overlay).click();
    expect(onDropSelectedStack).toHaveBeenCalledTimes(1);
    expect(getDropStackButton(overlay).getAttribute('aria-disabled')).toBe('true');
  });

  it('forwards drop-one button clicks only when the selected slot is populated', () => {
    const host = createHost();
    const onDropSelectedOne = vi.fn();
    const overlay = new HotbarOverlay({ host, onDropSelectedOne });

    overlay.update(createDefaultPlayerInventoryState());
    getDropOneButton(overlay).click();
    expect(onDropSelectedOne).toHaveBeenCalledTimes(1);

    overlay.update(createPlayerInventoryState({ hotbar: Array.from({ length: 10 }, () => null) }));
    getDropOneButton(overlay).click();
    expect(onDropSelectedOne).toHaveBeenCalledTimes(1);
    expect(getDropOneButton(overlay).getAttribute('aria-disabled')).toBe('true');
  });

  it('releases focus after pointer clicks on hotbar buttons so gameplay keys do not retrigger them', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });

    overlay.update(createDefaultPlayerInventoryState());

    const moveLeftButton = getMoveLeftButton(overlay);
    const dropOneButton = getDropOneButton(overlay);
    const dropStackButton = getDropStackButton(overlay);
    const slotButton = getSlotRow(overlay).children[0]!;
    const moveRightButton = getMoveRightButton(overlay);

    moveLeftButton.click(1);
    dropOneButton.click(1);
    dropStackButton.click(1);
    slotButton.click(1);
    moveRightButton.click(1);

    expect(moveLeftButton.blurCallCount).toBe(1);
    expect(dropOneButton.blurCallCount).toBe(1);
    expect(dropStackButton.blurCallCount).toBe(1);
    expect(slotButton.blurCallCount).toBe(1);
    expect(moveRightButton.blurCallCount).toBe(1);
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
