import { afterEach, describe, expect, it, vi } from 'vitest';

import { createWorldSaveEnvelope } from './mainWorldSave';
import {
  pickWorldSaveEnvelopeFromJsonPicker,
  type WorldSaveImportBrowser
} from './mainWorldSaveImport';
import { createPlayerState } from './world/playerState';
import { TileWorld } from './world/world';

const createTestEnvelope = () => {
  const world = new TileWorld(0);
  expect(world.setTile(5, -20, 6)).toBe(true);
  return createWorldSaveEnvelope({
    worldSnapshot: world.createSnapshot(),
    standalonePlayerState: createPlayerState({
      position: { x: 72, y: 96 },
      velocity: { x: -14, y: 28 },
      grounded: false,
      facing: 'left',
      health: 62,
      lavaDamageTickSecondsRemaining: 0.5
    }),
    cameraFollowOffset: { x: 18, y: -12 }
  });
};

type TestEventListener = () => void;

class TestEventTarget {
  private readonly listeners = new Map<string, TestEventListener[]>();

  addEventListener(type: string, listener: TestEventListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: TestEventListener): void {
    const listeners = this.listeners.get(type);
    if (!listeners) {
      return;
    }

    const index = listeners.indexOf(listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }

  dispatch(type: string): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener();
    }
  }
}

class TestWindow extends TestEventTarget {
  private nextTimerId = 1;
  private readonly timers: Array<{ id: number; delayMs: number; callback: () => void }> = [];

  setTimeout(callback: () => void, delayMs = 0): number {
    const id = this.nextTimerId++;
    this.timers.push({
      id,
      delayMs,
      callback
    });
    return id;
  }

  advanceTimersBy(delayMs: number): void {
    for (const timer of this.timers) {
      timer.delayMs -= delayMs;
    }

    let readyTimers = this.timers.filter((timer) => timer.delayMs <= 0);
    while (readyTimers.length > 0) {
      this.timers.splice(
        0,
        this.timers.length,
        ...this.timers.filter((timer) => timer.delayMs > 0)
      );
      for (const timer of readyTimers) {
        timer.callback();
      }
      readyTimers = this.timers.filter((timer) => timer.delayMs <= 0);
    }
  }
}

class TestFileList {
  constructor(private readonly fileProvider: () => { name: string; text(): Promise<string> } | null) {}

  item(index: number) {
    return index === 0 ? this.fileProvider() : null;
  }
}

class TestInputElement extends TestEventTarget {
  type = '';
  accept = '';
  multiple = false;
  style = {
    display: ''
  };
  private selectedFile: { name: string; text(): Promise<string> } | null = null;
  readonly files = new TestFileList(() => this.selectedFile);

  clickHandler: (() => void) | null = null;

  click(): void {
    this.clickHandler?.();
  }

  remove(): void {}

  setSelectedFile(file: { name: string; text(): Promise<string> } | null): void {
    this.selectedFile = file;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pickWorldSaveEnvelopeFromJsonPicker', () => {
  it('returns cancelled when the browser picker closes without a selected file', async () => {
    const browser: WorldSaveImportBrowser = {
      pickJsonFile: async () => null
    };

    await expect(pickWorldSaveEnvelopeFromJsonPicker({ browser })).resolves.toEqual({
      status: 'cancelled'
    });
  });

  it('returns a picker-start-failed result when the browser picker throws before any file is selected', async () => {
    const browser: WorldSaveImportBrowser = {
      pickJsonFile: async () => {
        throw new Error('picker blocked');
      }
    };

    await expect(pickWorldSaveEnvelopeFromJsonPicker({ browser })).resolves.toEqual({
      status: 'picker-start-failed',
      reason: 'picker blocked'
    });
  });

  it('decodes a selected json file into a validated top-level world-save envelope', async () => {
    const envelope = createTestEnvelope();
    const browser: WorldSaveImportBrowser = {
      pickJsonFile: async () => ({
        name: 'restore.json',
        text: async () => JSON.stringify(envelope)
      })
    };

    const result = await pickWorldSaveEnvelopeFromJsonPicker({ browser });

    expect(result.status).toBe('selected');
    if (result.status !== 'selected') {
      throw new Error('expected selected world-save import result');
    }
    expect(result.fileName).toBe('restore.json');
    expect(result.envelope).toEqual(envelope);
    expect(result.envelope).not.toBe(envelope);
    expect(result.envelope.worldSnapshot).not.toBe(envelope.worldSnapshot);
  });

  it('returns a rejected result when the selected file does not decode to a valid top-level world-save envelope', async () => {
    const browser: WorldSaveImportBrowser = {
      pickJsonFile: async () => ({
        name: 'broken.json',
        text: async () =>
          JSON.stringify({
            kind: 'wrong-kind',
            version: 1
          })
      })
    };

    const result = await pickWorldSaveEnvelopeFromJsonPicker({ browser });

    expect(result).toEqual({
      status: 'rejected',
      fileName: 'broken.json',
      reason: 'world save envelope kind must be "deep-factory.world-save"'
    });
  });

  it('does not resolve as cancelled when the window refocuses before the file input change event arrives', async () => {
    const envelope = createTestEnvelope();
    const input = new TestInputElement();
    const testWindow = new TestWindow();
    vi.stubGlobal('document', {
      body: {
        append: () => {}
      },
      createElement: (tagName: string) => {
        if (tagName !== 'input') {
          throw new Error(`unexpected element request: ${tagName}`);
        }
        return input;
      }
    });
    vi.stubGlobal('window', testWindow);

    input.clickHandler = () => {
      testWindow.dispatch('focus');
      testWindow.advanceTimersBy(0);
      input.setSelectedFile({
        name: 'restore.json',
        text: async () => JSON.stringify(envelope)
      });
      input.dispatch('change');
      testWindow.advanceTimersBy(1000);
    };

    await expect(pickWorldSaveEnvelopeFromJsonPicker()).resolves.toEqual({
      status: 'selected',
      fileName: 'restore.json',
      envelope
    });
  });
});
