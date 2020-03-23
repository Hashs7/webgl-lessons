import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);

let VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    gl_PointSize = 200.;
  }
`;

let FRAGMENT_SHADER = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(0.0, gl_PointCoord.xy, 1.0);
  }
`;

initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);


function animate() {
  render();
  requestAnimationFrame(animate);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.drawArrays(gl.POINTS, 0, 1);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, 1);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

resize();
animate();

window.addEventListener('resize', resize);
