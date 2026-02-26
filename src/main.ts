import './style.css';

import { Camera2D } from './core/camera2d';
import { GameLoop } from './core/gameLoop';
import { Renderer } from './gl/renderer';
import { InputController } from './input/controller';
import { DebugOverlay } from './ui/debugOverlay';
import { HoveredTileCursorOverlay } from './ui/hoveredTileCursor';
import { TouchDebugEditControls, type DebugBrushOption } from './ui/touchDebugEditControls';
import { TILE_METADATA } from './world/tileMetadata';

const DEBUG_TILE_BREAK_ID = 0;
const PREFERRED_INITIAL_DEBUG_BRUSH_TILE_NAME = 'debug_brick';

const formatDebugBrushLabel = (tileName: string): string => tileName.replace(/_/g, ' ');

const DEBUG_BRUSH_TILE_OPTIONS: readonly DebugBrushOption[] = TILE_METADATA.tiles
  .filter((tile) => tile.id !== DEBUG_TILE_BREAK_ID)
  .map((tile) => ({
    tileId: tile.id,
    label: formatDebugBrushLabel(tile.name)
  }));

if (DEBUG_BRUSH_TILE_OPTIONS.length === 0) {
  throw new Error('Tile metadata must provide at least one non-empty tile for debug editing');
}

const INITIAL_DEBUG_BRUSH_TILE_ID =
  TILE_METADATA.tiles.find(
    (tile) => tile.id !== DEBUG_TILE_BREAK_ID && tile.name === PREFERRED_INITIAL_DEBUG_BRUSH_TILE_NAME
  )?.id ?? DEBUG_BRUSH_TILE_OPTIONS[0]!.tileId;

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
  const hoveredTileCursor = new HoveredTileCursorOverlay(canvas);
  let activeDebugBrushTileId = INITIAL_DEBUG_BRUSH_TILE_ID;
  new TouchDebugEditControls({
    initialMode: input.getTouchDebugEditMode(),
    onModeChange: (mode) => input.setTouchDebugEditMode(mode),
    brushOptions: DEBUG_BRUSH_TILE_OPTIONS,
    initialBrushTileId: activeDebugBrushTileId,
    onBrushTileIdChange: (tileId) => {
      activeDebugBrushTileId = tileId;
    }
  });

  await renderer.initialize();
  renderer.resize();

  window.addEventListener('resize', () => renderer.resize());

  const loop = new GameLoop(
    1000 / 60,
    (fixedDt) => {
      input.update(fixedDt);
      for (const edit of input.consumeDebugTileEdits()) {
        const tileId = edit.kind === 'place' ? activeDebugBrushTileId : DEBUG_TILE_BREAK_ID;
        renderer.setTile(edit.worldTileX, edit.worldTileY, tileId);
      }
    },
    (_alpha, frameDtMs) => {
      const pointerInspect = input.getPointerInspect();
      renderer.resize();
      renderer.render(camera);
      hoveredTileCursor.update(camera, pointerInspect);
      debug.update(frameDtMs, renderer.telemetry, pointerInspect);
    }
  );

  loop.start();
};

void bootstrap();
