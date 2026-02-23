export const loadTexture = async (
  gl: WebGL2RenderingContext,
  source: string
): Promise<WebGLTexture> => {
  const texture = gl.createTexture();
  if (!texture) throw new Error('Unable to create texture');

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Unable to load texture: ${source}`));
    img.src = source;
  });

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
};

export const buildPlaceholderAtlas = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for atlas generation');

  const colors = ['#4e7d2f', '#739b3d', '#755642', '#3e6ea3', '#b6d97a', '#9c7f65'];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      ctx.fillStyle = colors[(x + y) % colors.length];
      ctx.fillRect(x * 16, y * 16, 16, 16);
      ctx.strokeStyle = '#00000022';
      ctx.strokeRect(x * 16 + 0.5, y * 16 + 0.5, 15, 15);
    }
  }

  return canvas.toDataURL('image/png');
};
