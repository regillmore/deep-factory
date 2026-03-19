import { describe, expect, it, vi } from 'vitest';

import {
  downloadWorldSaveEnvelope,
  resolveWorldSaveDownloadFilename,
  WORLD_SAVE_DOWNLOAD_FILENAME_PREFIX,
  type WorldSaveDownloadBrowser
} from './mainWorldSaveDownload';
import { createDefaultWorldSaveEnvelopeMigrationMetadata, type WorldSaveEnvelope } from './mainWorldSave';
import { createDefaultPlayerInventoryState } from './world/playerInventory';
import { createDefaultPlayerEquipmentState } from './world/playerEquipment';

const createTestEnvelope = (): WorldSaveEnvelope => ({
  kind: 'deep-factory.world-save',
  version: 1,
  migration: createDefaultWorldSaveEnvelopeMigrationMetadata(),
  session: {
    standalonePlayerState: null,
    standalonePlayerDeathState: null,
    standalonePlayerInventoryState: createDefaultPlayerInventoryState(),
    standalonePlayerEquipmentState: createDefaultPlayerEquipmentState(),
    droppedItemStates: [],
    cameraFollowOffset: {
      x: 12,
      y: -6
    }
  },
  worldSnapshot: {
    liquidSimulationTick: 4,
    residentChunks: [],
    editedChunks: []
  }
});

describe('resolveWorldSaveDownloadFilename', () => {
  it('formats a UTC timestamp into a filesystem-safe json filename', () => {
    expect(resolveWorldSaveDownloadFilename(new Date('2026-03-08T05:06:07.890Z'))).toBe(
      `${WORLD_SAVE_DOWNLOAD_FILENAME_PREFIX}-2026-03-08T05-06-07Z.json`
    );
  });
});

describe('downloadWorldSaveEnvelope', () => {
  it('downloads a pretty-printed json save file and revokes the object url after the click', async () => {
    const clickedAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    };
    let capturedBlobTextPromise: Promise<string> | null = null;
    const browser: WorldSaveDownloadBrowser = {
      createAnchor: () => clickedAnchor,
      createObjectUrl: (blob) => {
        capturedBlobTextPromise = blob.text();
        return 'blob:test-save';
      },
      revokeObjectUrl: vi.fn()
    };

    const filename = downloadWorldSaveEnvelope({
      envelope: createTestEnvelope(),
      timestamp: new Date('2026-03-08T05:06:07.890Z'),
      browser
    });

    expect(filename).toBe(`${WORLD_SAVE_DOWNLOAD_FILENAME_PREFIX}-2026-03-08T05-06-07Z.json`);
    expect(clickedAnchor.href).toBe('blob:test-save');
    expect(clickedAnchor.download).toBe(filename);
    expect(clickedAnchor.click).toHaveBeenCalledTimes(1);
    expect(browser.revokeObjectUrl).toHaveBeenCalledWith('blob:test-save');
    expect(capturedBlobTextPromise).not.toBeNull();
    if (capturedBlobTextPromise === null) {
      throw new Error('expected download blob text');
    }
    expect(await capturedBlobTextPromise).toBe(`${JSON.stringify(createTestEnvelope(), null, 2)}\n`);
  });

  it('still revokes the object url when the browser click throws', () => {
    const browser: WorldSaveDownloadBrowser = {
      createAnchor: () => ({
        href: '',
        download: '',
        click: () => {
          throw new Error('blocked download');
        }
      }),
      createObjectUrl: () => 'blob:test-save',
      revokeObjectUrl: vi.fn()
    };

    expect(() =>
      downloadWorldSaveEnvelope({
        envelope: createTestEnvelope(),
        browser
      })
    ).toThrowError(/blocked download/);
    expect(browser.revokeObjectUrl).toHaveBeenCalledWith('blob:test-save');
  });
});
