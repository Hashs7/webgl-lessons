import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import { randomNumber } from "../../utils";
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
let VERTEX_SHADER = `
  attribute vec4 aPosition;
  attribute float aPointSize;

  void main() {
    gl_Position = vec4(aPosition);
    gl_PointSize = aPointSize;
  }
`;
let FRAGMENT_SHADER = `
  precision mediump float;
  uniform vec3 uColor;

  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);

let aPosition = gl.getAttribLocation(gl.program, 'aPosition');
let aPointSize = gl.getAttribLocation(gl.program, 'aPointSize');
let uColor = gl.getUniformLocation(gl.program, 'uColor');

let POINTS_POSITION = [];

function drawPoint(e) {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = -(e.clientY / window.innerHeight) * 2 + 1;
  const size = randomNumber(5, 50);
  POINTS_POSITION.push({ position : { x, y }, size });
  // gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // gl.clear(gl.COLOR_BUFFER_BIT);
}

function animate() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  POINTS_POSITION = POINTS_POSITION.filter(point => point.size > 0.1);
  POINTS_POSITION = POINTS_POSITION.map(({ position, size }) => {
    const floatArray = new Float32Array([position.x, position.y, 0.0]);
    const color = position.x < 0 ? [1.0, 0.0, 0.0] : [0.0, 0.0, 1.0];
    gl.vertexAttrib3fv(aPosition, floatArray);
    size -= 0.2;
    gl.vertexAttrib1f(aPointSize, size);
    gl.uniform3fv(uColor, color);
    gl.drawArrays(gl.POINTS, 0, 1);
    return { position, size };
  });
  requestAnimationFrame(animate);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, 1);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.POINTS, 0, 1);

resize();
animate();
window.addEventListener('resize', resize);
window.addEventListener('mousemove', drawPoint);


