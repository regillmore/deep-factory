import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TouchPlayerControls } from './touchPlayerControls';

class FakeElement {
  style = {
    setProperty: (name: string, value: string) => {
      (this.style as Record<string, string>)[name] = value;
    }
  } as Record<string, string> & {
    setProperty(name: string, value: string): void;
  };
  children: FakeElement[] = [];
  textContent = '';
  title = '';
  type = '';
  private pointerCaptureId: number | null = null;
  private attributes = new Map<string, string>();
  private listeners = new Map<string, Array<(event: FakePointerEvent) => void>>();

  append(...children: FakeElement[]): void {
    this.children.push(...children);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type: string, listener: (event: FakePointerEvent) => void): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  setPointerCapture(pointerId: number): void {
    this.pointerCaptureId = pointerId;
  }

  releasePointerCapture(pointerId: number): void {
    if (this.pointerCaptureId === pointerId) {
      this.pointerCaptureId = null;
    }
  }

  hasPointerCapture(pointerId: number): boolean {
    return this.pointerCaptureId === pointerId;
  }

  dispatch(type: string, event: FakePointerEvent): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  remove(): void {}
}

interface FakePointerEvent {
  pointerId: number;
  preventDefault(): void;
}

describe('TouchPlayerControls', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: () => new FakeElement(),
      body: new FakeElement()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders left, down, right, and jump controls in the touch player pad', () => {
    const controls = new TouchPlayerControls();
    const root = controls.getRootElement() as unknown as FakeElement;

    expect(root.children.map((child) => child.textContent)).toEqual(['<', 'v', '>', '^']);
  });

  it('forwards hold changes from the climb-down button', () => {
    const onClimbDownHeldChange = vi.fn();
    const controls = new TouchPlayerControls({ onClimbDownHeldChange });
    const root = controls.getRootElement() as unknown as FakeElement;
    const downButton = root.children[1]!;
    const event = {
      pointerId: 7,
      preventDefault: vi.fn()
    };

    downButton.dispatch('pointerdown', event);
    expect(onClimbDownHeldChange).toHaveBeenLastCalledWith(true);
    expect(downButton.getAttribute('aria-pressed')).toBe('true');

    downButton.dispatch('pointerup', event);
    expect(onClimbDownHeldChange).toHaveBeenLastCalledWith(false);
    expect(downButton.getAttribute('aria-pressed')).toBe('false');
  });
});
