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

  void main(void) {
    gl_FragColor = vec4(vColor, 1);
  }
`;

initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);

const coord = gl.getAttribLocation(gl.program, 'coordinates');
const aColor = gl.getAttribLocation(gl.program, 'aColor');

function initTriangle() {
  const vertices = [
    -0.5, 0.5, 1, 0.5, 0.5,
    -0.5, -0.5, 0.5, 0.0, 1,
    0.5, -0.5, 1, 0.5, 0.5,
    -1, 0.2, 1, 0.5, 0.5,
    -1.0, -0.5, 0.5, 1, 0.5,
    0.7, -0.3, 0.5, 0.0, 1,
  ];

  const bpe = Float32Array.BYTES_PER_ELEMENT;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 5 * bpe, 0);
  gl.enableVertexAttribArray(coord);

  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 5 * bpe, 2 * bpe);
  gl.enableVertexAttribArray(aColor);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function animate() {
  render();
  requestAnimationFrame(animate);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  initTriangle();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

resize();
animate();
initTriangle();

window.addEventListener('resize', resize);
