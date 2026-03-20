import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createPlayerInventoryItemStack,
  createPlayerInventoryState
} from '../world/playerInventory';
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
  const createHotbarState = (
    stacks: ReadonlyArray<readonly [number, ReturnType<typeof createPlayerInventoryItemStack>]>,
    selectedHotbarSlotIndex = 0
  ) => {
    const hotbar = Array.from({ length: 10 }, () => null) as Array<
      ReturnType<typeof createPlayerInventoryItemStack> | null
    >;
    for (const [slotIndex, stack] of stacks) {
      hotbar[slotIndex] = stack;
    }
    return createPlayerInventoryState({
      hotbar,
      selectedHotbarSlotIndex
    });
  };
  const getSlotRow = (overlay: HotbarOverlay): FakeElement =>
    (overlay.getRootElement() as unknown as FakeElement).children[1]! as FakeElement;
  const getSlotAmountLabel = (overlay: HotbarOverlay, slotIndex: number): FakeElement =>
    getSlotRow(overlay).children[slotIndex]!.children[2]! as FakeElement;
  const getSlotCooldownFill = (overlay: HotbarOverlay, slotIndex: number): FakeElement =>
    getSlotRow(overlay).children[slotIndex]!.children[3]! as FakeElement;
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

  it('renders a populated hotbar state and highlights the selected slot', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });
    const populatedState = createHotbarState([
      [0, createPlayerInventoryItemStack('pickaxe', 1)],
      [1, createPlayerInventoryItemStack('dirt-block', 64)],
      [4, createPlayerInventoryItemStack('healing-potion', 3)],
      [5, createPlayerInventoryItemStack('heart-crystal', 1)],
      [8, createPlayerInventoryItemStack('bug-net', 1)]
    ]);

    overlay.setVisible(true);
    overlay.update(populatedState);

    const root = overlay.getRootElement() as unknown as FakeElement;
    const slotRow = getSlotRow(overlay);
    const firstSlot = slotRow.children[0]!;
    const secondSlot = slotRow.children[1]!;
    const heartCrystalSlot = slotRow.children[5]!;
    const bugNetSlot = slotRow.children[8]!;
    const moveLeftButton = getMoveLeftButton(overlay);
    const dropOneButton = getDropOneButton(overlay);
    const dropStackButton = getDropStackButton(overlay);
    const moveRightButton = getMoveRightButton(overlay);

    expect(root.style.display).toBe('flex');
    expect(firstSlot.title).toContain('Starter Pickaxe');
    expect(firstSlot.getAttribute('aria-pressed')).toBe('true');
    expect(secondSlot.title).toContain('Dirt Block');
    expect(heartCrystalSlot.title).toContain('Heart Crystal');
    expect(heartCrystalSlot.children[1]!.textContent).toBe('HEART');
    expect(bugNetSlot.title).toContain('Bug Net');
    expect(bugNetSlot.children[1]!.textContent).toBe('NET');
    expect(getSlotCooldownFill(overlay, 4).style.opacity).toBe('0');
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

    overlay.update(
      createHotbarState([[2, createPlayerInventoryItemStack('torch', 20)]], 2)
    );
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

    overlay.update(
      createHotbarState([
        [0, createPlayerInventoryItemStack('pickaxe', 1)],
        [1, createPlayerInventoryItemStack('dirt-block', 64)]
      ])
    );
    getMoveLeftButton(overlay).click();
    getMoveRightButton(overlay).click();

    expect(onMoveSelectedLeft).toHaveBeenCalledTimes(0);
    expect(onMoveSelectedRight).toHaveBeenCalledTimes(1);

    overlay.update(
      createPlayerInventoryState({
        hotbar: createHotbarState([
          [0, createPlayerInventoryItemStack('pickaxe', 1)],
          [1, createPlayerInventoryItemStack('dirt-block', 64)]
        ]).hotbar,
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

    overlay.update(createHotbarState([[0, createPlayerInventoryItemStack('pickaxe', 1)]]));
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

    overlay.update(createHotbarState([[0, createPlayerInventoryItemStack('pickaxe', 1)]]));
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

    overlay.update(createHotbarState([[0, createPlayerInventoryItemStack('pickaxe', 1)]]));

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

  it('shows and clears a healing-potion cooldown fill on potion slots without affecting other tiles', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });

    overlay.update(
      createHotbarState([[4, createPlayerInventoryItemStack('healing-potion', 3)]], 4),
      {
      healingPotionCooldownFillNormalized: 0.5
      }
    );

    expect(getSlotCooldownFill(overlay, 4).style.height).toBe('50.0%');
    expect(getSlotCooldownFill(overlay, 4).style.opacity).toBe('1');
    expect(getSlotRow(overlay).children[4]!.title).toContain('cooldown active');
    expect(getSlotCooldownFill(overlay, 0).style.height).toBe('0.0%');
    expect(getSlotCooldownFill(overlay, 0).style.opacity).toBe('0');

    overlay.update(createHotbarState([[4, createPlayerInventoryItemStack('healing-potion', 3)]], 4));

    expect(getSlotCooldownFill(overlay, 4).style.height).toBe('0.0%');
    expect(getSlotCooldownFill(overlay, 4).style.opacity).toBe('0');
    expect(getSlotRow(overlay).children[4]!.title).not.toContain('cooldown active');
  });

  it('shows and clears visible heart-crystal blocked feedback for dead and max-cap states', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });

    overlay.update(
      createHotbarState([[5, createPlayerInventoryItemStack('heart-crystal', 1)]], 5),
      {
      heartCrystalBlockedReason: 'max-health-cap'
      }
    );

    expect(getSlotAmountLabel(overlay, 5).textContent).toBe('MAX');
    expect(getSlotAmountLabel(overlay, 5).style.color).toBe('#cdeaff');
    expect(getSlotCooldownFill(overlay, 5).style.height).toBe('100.0%');
    expect(getSlotCooldownFill(overlay, 5).style.opacity).toBe('1');
    expect(getSlotRow(overlay).children[5]!.title).toContain('already at 400 max health');
    expect(getSlotCooldownFill(overlay, 0).style.opacity).toBe('0');

    overlay.update(
      createHotbarState([[5, createPlayerInventoryItemStack('heart-crystal', 1)]], 5),
      {
      heartCrystalBlockedReason: 'dead'
      }
    );

    expect(getSlotAmountLabel(overlay, 5).textContent).toBe('DEAD');
    expect(getSlotAmountLabel(overlay, 5).style.color).toBe('#ffd2d2');
    expect(getSlotRow(overlay).children[5]!.title).toContain('player is dead');

    overlay.update(createHotbarState([[5, createPlayerInventoryItemStack('heart-crystal', 1)]], 5));

    expect(getSlotAmountLabel(overlay, 5).textContent).toBe('');
    expect(getSlotAmountLabel(overlay, 5).style.color).toBe('#ffe7a3');
    expect(getSlotCooldownFill(overlay, 5).style.height).toBe('0.0%');
    expect(getSlotCooldownFill(overlay, 5).style.opacity).toBe('0');
    expect(getSlotRow(overlay).children[5]!.title).not.toContain('blocked:');
  });

  it('shows and clears selected starter-pickaxe phase timing feedback without affecting other slots', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });
    const pickaxeSelectedState = createHotbarState(
      [[0, createPlayerInventoryItemStack('pickaxe', 1)]],
      0
    );

    overlay.update(pickaxeSelectedState, {
      starterPickaxeSwingFeedback: {
        phase: 'windup',
        timingFillNormalized: 0.75
      }
    });

    expect(getSlotAmountLabel(overlay, 0).textContent).toBe('WIND');
    expect(getSlotAmountLabel(overlay, 0).style.color).toBe('#ffe5ad');
    expect(getSlotCooldownFill(overlay, 0).style.height).toBe('75.0%');
    expect(getSlotCooldownFill(overlay, 0).style.opacity).toBe('1');
    expect(getSlotRow(overlay).children[0]!.title).toContain('windup active');
    expect(getSlotCooldownFill(overlay, 4).style.opacity).toBe('0');

    overlay.update(pickaxeSelectedState, {
      starterPickaxeSwingFeedback: {
        phase: 'active',
        timingFillNormalized: 0.5
      }
    });

    expect(getSlotAmountLabel(overlay, 0).textContent).toBe('ACT');
    expect(getSlotAmountLabel(overlay, 0).style.color).toBe('#ffd4c7');
    expect(getSlotCooldownFill(overlay, 0).style.height).toBe('50.0%');
    expect(getSlotRow(overlay).children[0]!.title).toContain('swing active');

    overlay.update(pickaxeSelectedState);

    expect(getSlotAmountLabel(overlay, 0).textContent).toBe('');
    expect(getSlotAmountLabel(overlay, 0).style.color).toBe('#ffe7a3');
    expect(getSlotCooldownFill(overlay, 0).style.height).toBe('0.0%');
    expect(getSlotCooldownFill(overlay, 0).style.opacity).toBe('0');
    expect(getSlotRow(overlay).children[0]!.title).not.toContain('active');
  });

  it('shows and clears selected starter-sword phase timing feedback without affecting other slots', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });
    const swordSelectedState = createHotbarState(
      [[6, createPlayerInventoryItemStack('sword', 1)]],
      6
    );

    overlay.update(swordSelectedState, {
      starterMeleeWeaponSwingFeedback: {
        phase: 'windup',
        timingFillNormalized: 0.75
      }
    });

    expect(getSlotAmountLabel(overlay, 6).textContent).toBe('WIND');
    expect(getSlotAmountLabel(overlay, 6).style.color).toBe('#ffe5ad');
    expect(getSlotCooldownFill(overlay, 6).style.height).toBe('75.0%');
    expect(getSlotCooldownFill(overlay, 6).style.opacity).toBe('1');
    expect(getSlotRow(overlay).children[6]!.title).toContain('windup active');
    expect(getSlotCooldownFill(overlay, 4).style.opacity).toBe('0');

    overlay.update(swordSelectedState, {
      starterMeleeWeaponSwingFeedback: {
        phase: 'active',
        timingFillNormalized: 0.5
      }
    });

    expect(getSlotAmountLabel(overlay, 6).textContent).toBe('ACT');
    expect(getSlotAmountLabel(overlay, 6).style.color).toBe('#ffd4c7');
    expect(getSlotCooldownFill(overlay, 6).style.height).toBe('50.0%');
    expect(getSlotRow(overlay).children[6]!.title).toContain('swing active');

    overlay.update(swordSelectedState);

    expect(getSlotAmountLabel(overlay, 6).textContent).toBe('');
    expect(getSlotAmountLabel(overlay, 6).style.color).toBe('#ffe7a3');
    expect(getSlotCooldownFill(overlay, 6).style.height).toBe('0.0%');
    expect(getSlotCooldownFill(overlay, 6).style.opacity).toBe('0');
    expect(getSlotRow(overlay).children[6]!.title).not.toContain('active');
  });

  it('shows and clears selected starter-spear phase timing feedback without affecting other slots', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });
    const spearSelectedState = createHotbarState(
      [[9, createPlayerInventoryItemStack('spear', 1)]],
      9
    );

    overlay.update(spearSelectedState, {
      starterSpearThrustFeedback: {
        phase: 'windup',
        timingFillNormalized: 0.75
      }
    });

    expect(getSlotAmountLabel(overlay, 9).textContent).toBe('WIND');
    expect(getSlotAmountLabel(overlay, 9).style.color).toBe('#ffe5ad');
    expect(getSlotCooldownFill(overlay, 9).style.height).toBe('75.0%');
    expect(getSlotCooldownFill(overlay, 9).style.opacity).toBe('1');
    expect(getSlotRow(overlay).children[9]!.title).toContain('windup active');
    expect(getSlotCooldownFill(overlay, 4).style.opacity).toBe('0');

    overlay.update(spearSelectedState, {
      starterSpearThrustFeedback: {
        phase: 'recovery',
        timingFillNormalized: 0.25
      }
    });

    expect(getSlotAmountLabel(overlay, 9).textContent).toBe('REC');
    expect(getSlotAmountLabel(overlay, 9).style.color).toBe('#cdeaff');
    expect(getSlotCooldownFill(overlay, 9).style.height).toBe('25.0%');
    expect(getSlotRow(overlay).children[9]!.title).toContain('recovery active');

    overlay.update(spearSelectedState);

    expect(getSlotAmountLabel(overlay, 9).textContent).toBe('');
    expect(getSlotAmountLabel(overlay, 9).style.color).toBe('#ffe7a3');
    expect(getSlotCooldownFill(overlay, 9).style.height).toBe('0.0%');
    expect(getSlotCooldownFill(overlay, 9).style.opacity).toBe('0');
    expect(getSlotRow(overlay).children[9]!.title).not.toContain('active');
  });

  it('shows and clears selected bug-net phase timing feedback without affecting other slots', () => {
    const host = createHost();
    const overlay = new HotbarOverlay({ host });
    const bugNetSelectedState = createHotbarState(
      [[8, createPlayerInventoryItemStack('bug-net', 1)]],
      8
    );

    overlay.update(bugNetSelectedState, {
      starterBugNetSwingFeedback: {
        phase: 'windup',
        timingFillNormalized: 0.75
      }
    });

    expect(getSlotAmountLabel(overlay, 8).textContent).toBe('WIND');
    expect(getSlotAmountLabel(overlay, 8).style.color).toBe('#ffe5ad');
    expect(getSlotCooldownFill(overlay, 8).style.height).toBe('75.0%');
    expect(getSlotCooldownFill(overlay, 8).style.opacity).toBe('1');
    expect(getSlotRow(overlay).children[8]!.title).toContain('windup active');
    expect(getSlotCooldownFill(overlay, 4).style.opacity).toBe('0');

    overlay.update(bugNetSelectedState, {
      starterBugNetSwingFeedback: {
        phase: 'recovery',
        timingFillNormalized: 0.25
      }
    });

    expect(getSlotAmountLabel(overlay, 8).textContent).toBe('REC');
    expect(getSlotAmountLabel(overlay, 8).style.color).toBe('#cdeaff');
    expect(getSlotCooldownFill(overlay, 8).style.height).toBe('25.0%');
    expect(getSlotRow(overlay).children[8]!.title).toContain('recovery active');

    overlay.update(bugNetSelectedState);

    expect(getSlotAmountLabel(overlay, 8).textContent).toBe('');
    expect(getSlotAmountLabel(overlay, 8).style.color).toBe('#ffe7a3');
    expect(getSlotCooldownFill(overlay, 8).style.height).toBe('0.0%');
    expect(getSlotCooldownFill(overlay, 8).style.opacity).toBe('0');
    expect(getSlotRow(overlay).children[8]!.title).not.toContain('active');
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
