import { describe, expect, it } from 'vitest';

import { resolveAppShellViewModel } from './appShell';

describe('resolveAppShellViewModel', () => {
  it('keeps the overlay visible during boot without a default action button', () => {
    const viewModel = resolveAppShellViewModel({ screen: 'boot' });

    expect(viewModel.overlayVisible).toBe(true);
    expect(viewModel.stageLabel).toBe('Boot');
    expect(viewModel.primaryActionLabel).toBeNull();
    expect(viewModel.statusText).toContain('Preparing renderer');
    expect(viewModel.detailLines).toEqual([
      'Boot runs before the fixed-step simulation starts so later shell work has a stable entry point.'
    ]);
  });

  it('shows the main menu enter-world action with mixed-device runtime guidance', () => {
    const viewModel = resolveAppShellViewModel({ screen: 'main-menu' });

    expect(viewModel.overlayVisible).toBe(true);
    expect(viewModel.stageLabel).toBe('Main Menu');
    expect(viewModel.primaryActionLabel).toBe('Enter World');
    expect(viewModel.detailLines).toEqual([
      'Desktop keeps movement, zoom, pan, and debug editing on the same world session.',
      'Touch keeps the on-screen edit controls and player pad aligned with that same runtime state.'
    ]);
  });

  it('hides the overlay completely once the shell enters the world', () => {
    const viewModel = resolveAppShellViewModel({ screen: 'in-world' });

    expect(viewModel.overlayVisible).toBe(false);
    expect(viewModel.stageLabel).toBe('In World');
    expect(viewModel.primaryActionLabel).toBeNull();
    expect(viewModel.detailLines).toEqual([]);
  });

  it('honors explicit boot failure copy without changing the boot state contract', () => {
    const viewModel = resolveAppShellViewModel({
      screen: 'boot',
      statusText: 'WebGL2 is not available in this browser.',
      detailLines: ['Use a current Chrome, Firefox, or Safari build to continue.']
    });

    expect(viewModel.overlayVisible).toBe(true);
    expect(viewModel.primaryActionLabel).toBeNull();
    expect(viewModel.statusText).toBe('WebGL2 is not available in this browser.');
    expect(viewModel.detailLines).toEqual(['Use a current Chrome, Firefox, or Safari build to continue.']);
  });
});
