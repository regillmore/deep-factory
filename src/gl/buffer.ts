export const createStaticVertexBuffer = (
  gl: WebGL2RenderingContext,
  data: Float32Array
): WebGLBuffer => {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('Unable to create vertex buffer');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
};

export const createVertexArray = (
  gl: WebGL2RenderingContext,
  buffer: WebGLBuffer,
  strideFloats: number
): WebGLVertexArrayObject => {
  const vao = gl.createVertexArray();
  if (!vao) throw new Error('Unable to create VAO');

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, strideFloats * 4, 0);

  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, strideFloats * 4, 2 * 4);

  gl.bindVertexArray(null);
  return vao;
};
