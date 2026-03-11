import { describe, expect, it, vi } from 'vitest';

import { createDefaultShellActionKeybindingState } from './input/shellActionKeybindings';
import { createDefaultWorldSessionShellState } from './mainWorldSessionShellState';
import {
  downloadWorldSessionShellProfileEnvelope,
  resolveWorldSessionShellProfileDownloadFilename,
  WORLD_SESSION_SHELL_PROFILE_DOWNLOAD_FILENAME_PREFIX,
  type WorldSessionShellProfileDownloadBrowser
} from './mainWorldSessionShellProfileDownload';
import { createWorldSessionShellProfileEnvelope } from './mainWorldSessionShellProfile';

const createTestEnvelope = () =>
  createWorldSessionShellProfileEnvelope({
    shellState: {
      ...createDefaultWorldSessionShellState(),
      debugOverlayVisible: true,
      shortcutsOverlayVisible: true
    },
    shellActionKeybindings: {
      ...createDefaultShellActionKeybindingState(),
      'toggle-debug-overlay': 'U'
    }
  });

describe('resolveWorldSessionShellProfileDownloadFilename', () => {
  it('formats a UTC timestamp into a filesystem-safe json filename', () => {
    expect(
      resolveWorldSessionShellProfileDownloadFilename(new Date('2026-03-11T05:06:07.890Z'))
    ).toBe(`${WORLD_SESSION_SHELL_PROFILE_DOWNLOAD_FILENAME_PREFIX}-2026-03-11T05-06-07Z.json`);
  });
});

describe('downloadWorldSessionShellProfileEnvelope', () => {
  it('downloads a pretty-printed json shell profile and revokes the object url after the click', async () => {
    const clickedAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    };
    let capturedBlobTextPromise: Promise<string> | null = null;
    const browser: WorldSessionShellProfileDownloadBrowser = {
      createAnchor: () => clickedAnchor,
      createObjectUrl: (blob) => {
        capturedBlobTextPromise = blob.text();
        return 'blob:test-shell-profile';
      },
      revokeObjectUrl: vi.fn()
    };

    const filename = downloadWorldSessionShellProfileEnvelope({
      envelope: createTestEnvelope(),
      timestamp: new Date('2026-03-11T05:06:07.890Z'),
      browser
    });

    expect(filename).toBe(`${WORLD_SESSION_SHELL_PROFILE_DOWNLOAD_FILENAME_PREFIX}-2026-03-11T05-06-07Z.json`);
    expect(clickedAnchor.href).toBe('blob:test-shell-profile');
    expect(clickedAnchor.download).toBe(filename);
    expect(clickedAnchor.click).toHaveBeenCalledTimes(1);
    expect(browser.revokeObjectUrl).toHaveBeenCalledWith('blob:test-shell-profile');
    expect(capturedBlobTextPromise).not.toBeNull();
    if (capturedBlobTextPromise === null) {
      throw new Error('expected shell-profile download blob text');
    }
    expect(await capturedBlobTextPromise).toBe(`${JSON.stringify(createTestEnvelope(), null, 2)}\n`);
  });

  it('still revokes the object url when the browser click throws', () => {
    const browser: WorldSessionShellProfileDownloadBrowser = {
      createAnchor: () => ({
        href: '',
        download: '',
        click: () => {
          throw new Error('blocked download');
        }
      }),
      createObjectUrl: () => 'blob:test-shell-profile',
      revokeObjectUrl: vi.fn()
    };

    expect(() =>
      downloadWorldSessionShellProfileEnvelope({
        envelope: createTestEnvelope(),
        browser
      })
    ).toThrowError(/blocked download/);
    expect(browser.revokeObjectUrl).toHaveBeenCalledWith('blob:test-shell-profile');
  });
});
