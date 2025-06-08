const canvas = document.getElementById('glCanvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl');
if (!gl) {
  alert('WebGL not supported');
  throw new Error('WebGL not supported');
}

function createShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const vertexSrc = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSrc = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_center;
uniform float u_scale;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  uv -= u_center;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  angle += u_time;
  radius *= u_scale;
  float spiral = sin(angle * 5.0 - radius * 10.0);
  float intensity = exp(-radius * 3.0);
  vec3 color = vec3(0.2, 0.4, 0.8) * intensity + vec3(1.0, 1.0, 1.0) * spiral * intensity;
  gl_FragColor = vec4(color, 1.0);
}`;

const program = createProgram(gl, vertexSrc, fragmentSrc);
if (!program) throw new Error('Program creation failed');

gl.useProgram(program);

const positionLoc = gl.getAttribLocation(program, 'position');
const resLoc = gl.getUniformLocation(program, 'u_resolution');
const timeLoc = gl.getUniformLocation(program, 'u_time');
const centerLoc = gl.getUniformLocation(program, 'u_center');
const scaleLoc = gl.getUniformLocation(program, 'u_scale');

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
const vertices = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1
]);

gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

gl.uniform2f(resLoc, canvas.width, canvas.height);

let centerX = 0.0;
let centerY = 0.0;
let velX = 0.2;
let velY = 0.1;
let lastTime = 0;

function render(time: number) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  centerX += velX * dt;
  centerY += velY * dt;
  if (centerX > 1.0 || centerX < -1.0) velX *= -1;
  if (centerY > 1.0 || centerY < -1.0) velY *= -1;

  gl.uniform1f(timeLoc, time * 0.001);
  gl.uniform2f(centerLoc, centerX, centerY);
  gl.uniform1f(scaleLoc, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
