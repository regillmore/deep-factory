import { decodeWorldSaveEnvelope, type WorldSaveEnvelope } from './mainWorldSave';

export interface WorldSaveImportFile {
  name: string;
  text(): Promise<string>;
}

export interface WorldSaveImportBrowser {
  pickJsonFile(): Promise<WorldSaveImportFile | null>;
}

export interface SelectedWorldSaveEnvelopeImportResult {
  status: 'selected';
  fileName: string;
  envelope: WorldSaveEnvelope;
}

export interface CancelledWorldSaveEnvelopeImportResult {
  status: 'cancelled';
}

export interface RejectedWorldSaveEnvelopeImportResult {
  status: 'rejected';
  fileName: string | null;
  reason: string;
}

export type WorldSaveEnvelopeImportResult =
  | SelectedWorldSaveEnvelopeImportResult
  | CancelledWorldSaveEnvelopeImportResult
  | RejectedWorldSaveEnvelopeImportResult;

const resolveWorldSaveImportFailureReason = (error: unknown): string => {
  if (error instanceof Error) {
    const trimmedMessage = error.message.trim();
    if (trimmedMessage.length > 0) {
      return trimmedMessage;
    }
  }

  return 'World-save import failed.';
};

const resolveWorldSaveImportBrowser = (): WorldSaveImportBrowser => {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    throw new Error('World-save import requires document.createElement()');
  }
  if (
    typeof window === 'undefined' ||
    typeof window.addEventListener !== 'function' ||
    typeof window.removeEventListener !== 'function' ||
    typeof window.setTimeout !== 'function'
  ) {
    throw new Error('World-save import requires window focus and timeout support');
  }

  return {
    pickJsonFile: () =>
      new Promise<WorldSaveImportFile | null>((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.multiple = false;
        input.style.display = 'none';
        document.body?.append(input);

        let settled = false;
        const cleanup = () => {
          window.removeEventListener('focus', handleWindowFocus);
          input.remove();
        };
        const resolveOnce = (value: WorldSaveImportFile | null) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          resolve(value);
        };
        const rejectOnce = (error: unknown) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          reject(error);
        };
        const getPickedFile = (): WorldSaveImportFile | null => input.files?.item(0) ?? null;
        const handleWindowFocus = () => {
          window.setTimeout(() => {
            if (settled || getPickedFile() !== null) {
              return;
            }
            resolveOnce(null);
          }, 0);
        };

        input.addEventListener('change', () => {
          resolveOnce(getPickedFile());
        });
        (input as EventTarget).addEventListener('cancel', () => {
          resolveOnce(null);
        });
        window.addEventListener('focus', handleWindowFocus);

        try {
          input.click();
        } catch (error) {
          rejectOnce(error);
        }
      })
  };
};

export interface PickWorldSaveEnvelopeFromJsonPickerOptions {
  browser?: WorldSaveImportBrowser;
}

export const pickWorldSaveEnvelopeFromJsonPicker = async ({
  browser = resolveWorldSaveImportBrowser()
}: PickWorldSaveEnvelopeFromJsonPickerOptions = {}): Promise<WorldSaveEnvelopeImportResult> => {
  const file = await browser.pickJsonFile();
  if (file === null) {
    return {
      status: 'cancelled'
    };
  }

  try {
    const parsed = JSON.parse(await file.text());
    return {
      status: 'selected',
      fileName: file.name,
      envelope: decodeWorldSaveEnvelope(parsed)
    };
  } catch (error) {
    return {
      status: 'rejected',
      fileName: file.name,
      reason: resolveWorldSaveImportFailureReason(error)
    };
  }
};
