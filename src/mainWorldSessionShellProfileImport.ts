import {
  decodeWorldSessionShellProfileEnvelope,
  type WorldSessionShellProfileEnvelope
} from './mainWorldSessionShellProfile';

export interface WorldSessionShellProfileImportFile {
  name: string;
  text(): Promise<string>;
}

export interface WorldSessionShellProfileImportBrowser {
  pickJsonFile(): Promise<WorldSessionShellProfileImportFile | null>;
}

export interface SelectedWorldSessionShellProfileEnvelopeImportResult {
  status: 'selected';
  fileName: string;
  envelope: WorldSessionShellProfileEnvelope;
}

export interface CancelledWorldSessionShellProfileEnvelopeImportResult {
  status: 'cancelled';
}

export interface PickerStartFailedWorldSessionShellProfileEnvelopeImportResult {
  status: 'picker-start-failed';
  reason: string;
}

export interface RejectedWorldSessionShellProfileEnvelopeImportResult {
  status: 'rejected';
  fileName: string | null;
  reason: string;
}

export type WorldSessionShellProfileEnvelopeImportResult =
  | SelectedWorldSessionShellProfileEnvelopeImportResult
  | CancelledWorldSessionShellProfileEnvelopeImportResult
  | PickerStartFailedWorldSessionShellProfileEnvelopeImportResult
  | RejectedWorldSessionShellProfileEnvelopeImportResult;

const WINDOW_FOCUS_PICKER_CANCEL_SETTLE_DELAY_MS = 250;

const resolveWorldSessionShellProfileImportFailureReason = (error: unknown): string => {
  if (error instanceof Error) {
    const trimmedMessage = error.message.trim();
    if (trimmedMessage.length > 0) {
      return trimmedMessage;
    }
  }

  return 'Shell-profile import failed.';
};

const resolveWorldSessionShellProfileImportBrowser = (): WorldSessionShellProfileImportBrowser => {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    throw new Error('Shell-profile import requires document.createElement()');
  }
  if (
    typeof window === 'undefined' ||
    typeof window.addEventListener !== 'function' ||
    typeof window.removeEventListener !== 'function' ||
    typeof window.setTimeout !== 'function'
  ) {
    throw new Error('Shell-profile import requires window focus and timeout support');
  }

  return {
    pickJsonFile: () =>
      new Promise<WorldSessionShellProfileImportFile | null>((resolve, reject) => {
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
        const resolveOnce = (value: WorldSessionShellProfileImportFile | null) => {
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
        const getPickedFile = (): WorldSessionShellProfileImportFile | null =>
          input.files?.item(0) ?? null;
        const handleWindowFocus = () => {
          window.setTimeout(() => {
            if (settled || getPickedFile() !== null) {
              return;
            }
            resolveOnce(null);
          }, WINDOW_FOCUS_PICKER_CANCEL_SETTLE_DELAY_MS);
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

export interface PickWorldSessionShellProfileEnvelopeFromJsonPickerOptions {
  browser?: WorldSessionShellProfileImportBrowser;
}

export const pickWorldSessionShellProfileEnvelopeFromJsonPicker = async ({
  browser = resolveWorldSessionShellProfileImportBrowser()
}: PickWorldSessionShellProfileEnvelopeFromJsonPickerOptions = {}): Promise<WorldSessionShellProfileEnvelopeImportResult> => {
  let file: WorldSessionShellProfileImportFile | null;
  try {
    file = await browser.pickJsonFile();
  } catch (error) {
    return {
      status: 'picker-start-failed',
      reason: resolveWorldSessionShellProfileImportFailureReason(error)
    };
  }
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
      envelope: decodeWorldSessionShellProfileEnvelope(parsed)
    };
  } catch (error) {
    return {
      status: 'rejected',
      fileName: file.name,
      reason: resolveWorldSessionShellProfileImportFailureReason(error)
    };
  }
};
