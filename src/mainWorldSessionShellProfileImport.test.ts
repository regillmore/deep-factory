import { describe, expect, it } from 'vitest';

import { createWorldSessionShellProfileEnvelope } from './mainWorldSessionShellProfile';
import {
  pickWorldSessionShellProfileEnvelopeFromJsonPicker,
  type WorldSessionShellProfileImportBrowser
} from './mainWorldSessionShellProfileImport';

describe('pickWorldSessionShellProfileEnvelopeFromJsonPicker', () => {
  it('returns cancelled when the browser picker closes without a selected file', async () => {
    const browser: WorldSessionShellProfileImportBrowser = {
      pickJsonFile: async () => null
    };

    await expect(pickWorldSessionShellProfileEnvelopeFromJsonPicker({ browser })).resolves.toEqual({
      status: 'cancelled'
    });
  });

  it('returns a picker-start-failed result when the browser picker throws before any file is selected', async () => {
    const browser: WorldSessionShellProfileImportBrowser = {
      pickJsonFile: async () => {
        throw new Error('picker blocked');
      }
    };

    await expect(pickWorldSessionShellProfileEnvelopeFromJsonPicker({ browser })).resolves.toEqual(
      {
        status: 'picker-start-failed',
        reason: 'picker blocked'
      }
    );
  });

  it('decodes a selected json file into a validated shell-profile envelope', async () => {
    const envelope = createWorldSessionShellProfileEnvelope({
      shellState: {
        debugOverlayVisible: true,
        debugEditControlsVisible: false,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: false,
        shortcutsOverlayVisible: true
      },
      shellActionKeybindings: {
        'return-to-main-menu': 'X',
        'recenter-camera': 'Z',
        'toggle-debug-overlay': 'U',
        'toggle-debug-edit-controls': 'J',
        'toggle-debug-edit-overlays': 'K',
        'toggle-player-spawn-marker': 'Y'
      }
    });
    const browser: WorldSessionShellProfileImportBrowser = {
      pickJsonFile: async () => ({
        name: 'shell-profile.json',
        text: async () => JSON.stringify(envelope)
      })
    };

    const result = await pickWorldSessionShellProfileEnvelopeFromJsonPicker({ browser });

    expect(result.status).toBe('selected');
    if (result.status !== 'selected') {
      throw new Error('expected selected shell-profile import result');
    }
    expect(result.fileName).toBe('shell-profile.json');
    expect(result.envelope).toEqual(envelope);
    expect(result.envelope).not.toBe(envelope);
    expect(result.envelope.shellState).not.toBe(envelope.shellState);
    expect(result.envelope.shellActionKeybindings).not.toBe(envelope.shellActionKeybindings);
  });

  it('returns a rejected result when the selected file does not decode to a valid shell-profile envelope', async () => {
    const browser: WorldSessionShellProfileImportBrowser = {
      pickJsonFile: async () => ({
        name: 'broken-shell-profile.json',
        text: async () =>
          JSON.stringify({
            kind: 'wrong-kind',
            version: 1
          })
      })
    };

    const result = await pickWorldSessionShellProfileEnvelopeFromJsonPicker({ browser });

    expect(result).toEqual({
      status: 'rejected',
      fileName: 'broken-shell-profile.json',
      reason: 'shell profile envelope kind must be "deep-factory.shell-profile"'
    });
  });
});
