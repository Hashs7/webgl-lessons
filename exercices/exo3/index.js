import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
let VERTEX_SHADER = `
  precision mediump float;
  attribute vec2 coordinates;
  attribute vec3 aColor;
  varying vec3 vColor;

  void main(void) {
     gl_Position = vec4(coordinates, 0.0, 1.0);
     vColor = aColor;
  }
`;
let FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 vColor;
  uniform float intensity;

  void main(void) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.1);
  }
`;

initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);

const coord = gl.getAttribLocation(gl.program, 'coordinates');
const intensity = gl.getUniformLocation(gl.program, 'intensity');

function initSquare() {
  const vertices = [
    0.5, 0.5,
    -0.5, 0.5,
    -0.5, -0.5,
    0.5, -0.5,
  ];

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(coord);

  const indices = new Uint8Array([
    0, 2, 1,
    0, 3, 2,
  ]);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
}

function animate() {
  const phase = ((Date.now() / 1000) % 4) / 4;
  const intVal = 0.5 + 0.5 * Math.sin(2 * Math.PI * phase);

  gl.uniform1f(intensity, intVal);
  render();
  requestAnimationFrame(animate);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  initSquare();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

resize();
animate();
initSquare();

window.addEventListener('resize', resize);
