export const shouldReleaseButtonFocusAfterClick = (clickDetail: number): boolean => clickDetail > 0;

export const installPointerClickFocusRelease = (button: HTMLButtonElement): void => {
  button.addEventListener('click', (event) => {
    if (!shouldReleaseButtonFocusAfterClick(event.detail)) return;
    button.blur();
  });
};
