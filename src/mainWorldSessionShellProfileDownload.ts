import type { WorldSessionShellProfileEnvelope } from './mainWorldSessionShellProfile';

export const WORLD_SESSION_SHELL_PROFILE_DOWNLOAD_FILENAME_PREFIX = 'deep-factory-shell-profile';

interface WorldSessionShellProfileDownloadAnchor {
  href: string;
  download: string;
  click(): void;
}

export interface WorldSessionShellProfileDownloadBrowser {
  createAnchor(): WorldSessionShellProfileDownloadAnchor;
  createObjectUrl(blob: Blob): string;
  revokeObjectUrl(url: string): void;
}

const resolveWorldSessionShellProfileDownloadBrowser =
  (): WorldSessionShellProfileDownloadBrowser => {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      throw new Error('Shell-profile download requires document.createElement()');
    }
    if (
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function' ||
      typeof URL.revokeObjectURL !== 'function'
    ) {
      throw new Error('Shell-profile download requires URL.createObjectURL() support');
    }

    return {
      createAnchor: () => document.createElement('a'),
      createObjectUrl: (blob) => URL.createObjectURL(blob),
      revokeObjectUrl: (url) => URL.revokeObjectURL(url)
    };
  };

const serializeWorldSessionShellProfileEnvelope = (
  envelope: WorldSessionShellProfileEnvelope
): string => `${JSON.stringify(envelope, null, 2)}\n`;

export const resolveWorldSessionShellProfileDownloadFilename = (timestamp = new Date()): string =>
  `${WORLD_SESSION_SHELL_PROFILE_DOWNLOAD_FILENAME_PREFIX}-${timestamp
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '-')}.json`;

export interface DownloadWorldSessionShellProfileEnvelopeOptions {
  envelope: WorldSessionShellProfileEnvelope;
  timestamp?: Date;
  browser?: WorldSessionShellProfileDownloadBrowser;
}

export const downloadWorldSessionShellProfileEnvelope = ({
  envelope,
  timestamp = new Date(),
  browser = resolveWorldSessionShellProfileDownloadBrowser()
}: DownloadWorldSessionShellProfileEnvelopeOptions): string => {
  const blob = new Blob([serializeWorldSessionShellProfileEnvelope(envelope)], {
    type: 'application/json'
  });
  const objectUrl = browser.createObjectUrl(blob);
  const filename = resolveWorldSessionShellProfileDownloadFilename(timestamp);
  const anchor = browser.createAnchor();

  try {
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    return filename;
  } finally {
    browser.revokeObjectUrl(objectUrl);
  }
};
