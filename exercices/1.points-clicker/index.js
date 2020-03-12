import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
let VERTEX_SHADER = `
  attribute vec4 aPosition;
  attribute float aPointSize;

  void main() {
    gl_Position = vec4(aPosition);
    gl_PointSize = 10.0;
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

function drawPoint(e) {
  const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  console.log({ mouseX, mouseY });

  const floatArray = new Float32Array([mouseX, mouseY, 0.0]);
  let color = mouseX < 0 ? [1.0, 0.0, 0.0] : [0.0, 0.0, 1.0];
  gl.vertexAttrib3fv(aPosition, floatArray);
  gl.uniform3fv(uColor, color);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, 1)
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, 1)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

gl.clearColor(1.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.POINTS, 0, 1);
resize();
window.addEventListener('resize', resize);
window.addEventListener('click', drawPoint);


