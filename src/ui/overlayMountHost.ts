export interface OverlayMountOptions {
  host?: HTMLElement;
}

export const appendOverlayMount = <T extends HTMLElement>(
  element: T,
  options: OverlayMountOptions = {}
): T => {
  (options.host ?? document.body).append(element);
  return element;
};
