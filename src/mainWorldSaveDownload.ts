import type { WorldSaveEnvelope } from './mainWorldSave';

export const WORLD_SAVE_DOWNLOAD_FILENAME_PREFIX = 'deep-factory-world-save';

interface WorldSaveDownloadAnchor {
  href: string;
  download: string;
  click(): void;
}

export interface WorldSaveDownloadBrowser {
  createAnchor(): WorldSaveDownloadAnchor;
  createObjectUrl(blob: Blob): string;
  revokeObjectUrl(url: string): void;
}

const resolveWorldSaveDownloadBrowser = (): WorldSaveDownloadBrowser => {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    throw new Error('World-save download requires document.createElement()');
  }
  if (
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function' ||
    typeof URL.revokeObjectURL !== 'function'
  ) {
    throw new Error('World-save download requires URL.createObjectURL() support');
  }

  return {
    createAnchor: () => document.createElement('a'),
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url)
  };
};

const serializeWorldSaveEnvelope = (envelope: WorldSaveEnvelope): string =>
  `${JSON.stringify(envelope, null, 2)}\n`;

export const resolveWorldSaveDownloadFilename = (timestamp = new Date()): string =>
  `${WORLD_SAVE_DOWNLOAD_FILENAME_PREFIX}-${timestamp
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '-')}.json`;

export interface DownloadWorldSaveEnvelopeOptions {
  envelope: WorldSaveEnvelope;
  timestamp?: Date;
  browser?: WorldSaveDownloadBrowser;
}

export const downloadWorldSaveEnvelope = ({
  envelope,
  timestamp = new Date(),
  browser = resolveWorldSaveDownloadBrowser()
}: DownloadWorldSaveEnvelopeOptions): string => {
  const blob = new Blob([serializeWorldSaveEnvelope(envelope)], {
    type: 'application/json'
  });
  const objectUrl = browser.createObjectUrl(blob);
  const filename = resolveWorldSaveDownloadFilename(timestamp);
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
