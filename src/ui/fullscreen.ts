export interface FullscreenDocumentLike {
  readonly fullscreenEnabled?: boolean;
  readonly fullscreenElement?: Element | null;
  readonly documentElement: {
    requestFullscreen?: () => Promise<void> | void;
  };
  exitFullscreen?: () => Promise<void> | void;
}

export interface BrowserFullscreenState {
  supported: boolean;
  active: boolean;
}

export const readBrowserFullscreenState = (
  documentLike: FullscreenDocumentLike
): BrowserFullscreenState => {
  const supported =
    documentLike.fullscreenEnabled === true &&
    typeof documentLike.documentElement.requestFullscreen === 'function' &&
    typeof documentLike.exitFullscreen === 'function';

  return {
    supported,
    active: supported && documentLike.fullscreenElement != null
  };
};

export const toggleBrowserFullscreen = async (
  documentLike: FullscreenDocumentLike
): Promise<BrowserFullscreenState> => {
  const currentState = readBrowserFullscreenState(documentLike);
  if (!currentState.supported) {
    return currentState;
  }

  if (currentState.active) {
    await documentLike.exitFullscreen?.();
  } else {
    await documentLike.documentElement.requestFullscreen?.();
  }

  return readBrowserFullscreenState(documentLike);
};
