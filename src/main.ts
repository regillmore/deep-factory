import './style.css';

import { Camera2D } from './core/camera2d';
import { GameLoop } from './core/gameLoop';
import { Renderer } from './gl/renderer';
import { InputController } from './input/controller';
import { DebugOverlay } from './ui/debugOverlay';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app root element');

const bootstrap = async (): Promise<void> => {
  const canvas = document.createElement('canvas');
  app.append(canvas);

  let renderer: Renderer;
  try {
    renderer = new Renderer(canvas);
  } catch {
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent =
      'WebGL2 is not available in this browser. Please use a modern Chrome, Firefox, or Safari build.';
    app.replaceChildren(message);
    return;
  }

  const camera = new Camera2D();
  const input = new InputController(canvas, camera);
  const debug = new DebugOverlay();

  await renderer.initialize();
  renderer.resize();

  window.addEventListener('resize', () => renderer.resize());

  const loop = new GameLoop(
    1000 / 60,
    (fixedDt) => {
      input.update(fixedDt);
    },
    (_alpha, frameDtMs) => {
      renderer.resize();
      renderer.render(camera);
      debug.update(frameDtMs, renderer.telemetry, input.getPointerInspect());
    }
  );

  loop.start();
};

void bootstrap();
