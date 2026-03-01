import {
  AUTHORED_ATLAS_HEIGHT,
  AUTHORED_ATLAS_REGIONS,
  AUTHORED_ATLAS_WIDTH
} from '../world/authoredAtlasLayout';

export interface AtlasImageLoadResult {
  imageSource: TexImageSource;
  sourceKind: 'authored' | 'placeholder';
  sourceUrl: string;
  width: number;
  height: number;
}

interface AtlasImageLoaderOptions {
  fetchImpl?: typeof fetch;
  decodeBitmap?: typeof createImageBitmap;
  loadImage?: (source: string) => Promise<HTMLImageElement>;
  buildFallbackAtlas?: () => string;
}

const loadImageElement = async (source: string): Promise<HTMLImageElement> => {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Unable to load texture: ${source}`));
    img.src = source;
  });
};

const getDefaultFetch = (): typeof fetch | null => {
  return typeof fetch === 'function' ? fetch.bind(globalThis) : null;
};

const getDefaultDecodeBitmap = (): typeof createImageBitmap | null => {
  return typeof createImageBitmap === 'function' ? createImageBitmap.bind(globalThis) : null;
};

const getImageSourceDimensions = (
  imageSource: TexImageSource
): { width: number; height: number } => {
  const dimensionSource = imageSource as {
    width?: number;
    height?: number;
    naturalWidth?: number;
    naturalHeight?: number;
  };
  const width = dimensionSource.naturalWidth ?? dimensionSource.width;
  const height = dimensionSource.naturalHeight ?? dimensionSource.height;

  if (!Number.isFinite(width) || width === undefined || width <= 0) {
    throw new Error('Atlas image source width must be a positive finite number');
  }
  if (!Number.isFinite(height) || height === undefined || height <= 0) {
    throw new Error('Atlas image source height must be a positive finite number');
  }

  return { width, height };
};

export const loadAtlasImageSource = async (
  atlasAssetUrl: string,
  options: AtlasImageLoaderOptions = {}
): Promise<AtlasImageLoadResult> => {
  const fetchImpl = options.fetchImpl ?? getDefaultFetch();
  const decodeBitmap = options.decodeBitmap ?? getDefaultDecodeBitmap();

  if (fetchImpl && decodeBitmap) {
    try {
      const response = await fetchImpl(atlasAssetUrl);
      if (!response.ok) {
        throw new Error(`Unable to fetch atlas asset: ${atlasAssetUrl} (${response.status})`);
      }

      const atlasBlob = await response.blob();
      const imageSource = await decodeBitmap(atlasBlob);
      const { width, height } = getImageSourceDimensions(imageSource);
      return {
        imageSource,
        sourceKind: 'authored',
        sourceUrl: atlasAssetUrl,
        width,
        height
      };
    } catch {
      // Fallback keeps renderer boot robust when the authored atlas cannot be fetched or decoded.
    }
  }

  const placeholderSourceUrl = (options.buildFallbackAtlas ?? buildPlaceholderAtlas)();
  const imageSource = await (options.loadImage ?? loadImageElement)(placeholderSourceUrl);
  const { width, height } = getImageSourceDimensions(imageSource);
  return {
    imageSource,
    sourceKind: 'placeholder',
    sourceUrl: placeholderSourceUrl,
    width,
    height
  };
};

export const createTextureFromImageSource = (
  gl: WebGL2RenderingContext,
  imageSource: TexImageSource
): WebGLTexture => {
  const texture = gl.createTexture();
  if (!texture) throw new Error('Unable to create texture');

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageSource);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
};

export const loadTexture = async (
  gl: WebGL2RenderingContext,
  source: string
): Promise<WebGLTexture> => {
  const image = await loadImageElement(source);
  return createTextureFromImageSource(gl, image);
};

export const buildPlaceholderAtlas = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = AUTHORED_ATLAS_WIDTH;
  canvas.height = AUTHORED_ATLAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for atlas generation');

  const colors = ['#4e7d2f', '#739b3d', '#755642', '#3e6ea3', '#b6d97a', '#9c7f65'];
  for (const [atlasIndex, region] of AUTHORED_ATLAS_REGIONS.entries()) {
    ctx.fillStyle = colors[atlasIndex % colors.length]!;
    ctx.fillRect(region.x, region.y, region.width, region.height);
    ctx.strokeStyle = '#00000022';
    ctx.strokeRect(
      region.x + 0.5,
      region.y + 0.5,
      Math.max(region.width - 1, 0),
      Math.max(region.height - 1, 0)
    );
  }

  return canvas.toDataURL('image/png');
};
