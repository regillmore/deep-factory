import { describe, expect, it } from 'vitest';

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

describe('pickWorldSaveEnvelopeFromJsonPicker', () => {
  it('returns cancelled when the browser picker closes without a selected file', async () => {
    const browser: WorldSaveImportBrowser = {
      pickJsonFile: async () => null
    };

    await expect(pickWorldSaveEnvelopeFromJsonPicker({ browser })).resolves.toEqual({
      status: 'cancelled'
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
});
