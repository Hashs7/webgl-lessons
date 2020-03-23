import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import './style.scss';
import { randomNumber } from "../../utils";

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  attribute float aCounter;  
  varying float vCounter;

  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 20.;
    vCounter = aCounter;
  }
`;

const POINT_FRAGMENT_SHADER = `
  #define center vec2(0.5)
  #define d distance(gl_PointCoord.xy, center)
  precision mediump float;
 
  void main() {
    gl_FragColor.rgb = vec3(1. - smoothstep(0.1, 0.5, d));
    gl_FragColor.a = 1.0;
  }
`;

const LINE_FRAGMENT_SHADER = `  
  precision mediump float;
  varying float vCounter;

  void main() {
    float d = 1.0 - smoothstep(0.05, 0.45, abs(vCounter - 0.5));
    gl_FragColor = vec4(vec3(d), 1.0);
  }
`;

let POINTS_POSITION = [];
let pointsBuffer;
let pointsArray;
let bpe;

initShaders(gl, VERTEX_SHADER, POINT_FRAGMENT_SHADER);

const aPosition = gl.getAttribLocation(gl.program, "aPosition");
const aCounter = gl.getAttribLocation(gl.program, "aCounter");

function addPoint(e) {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = -(e.clientY / window.innerHeight) * 2 + 1;
  POINTS_POSITION.push(x, y, (POINTS_POSITION.length / 3) % 2);
  render()
}

function animate() {
  requestAnimationFrame(animate);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // gl.clearColor(0.0, 0.0, 0.0, 1.0);

  pointsBuffer = gl.createBuffer();
  pointsArray = new Float32Array(POINTS_POSITION);
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pointsArray, gl.STATIC_DRAW);

  bpe = pointsArray.BYTES_PER_ELEMENT;
  initShaders(gl, VERTEX_SHADER, LINE_FRAGMENT_SHADER);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 3 * bpe, 0 * bpe);
  gl.vertexAttribPointer(aCounter, 1, gl.FLOAT, false, 3 * bpe, 2 * bpe);
  gl.enableVertexAttribArray(aPosition);
  gl.enableVertexAttribArray(aCounter);

  if (POINTS_POSITION.length) {
    gl.drawArrays(gl.LINE_STRIP, 0, POINTS_POSITION.length / 3);
  }

  initShaders(gl, VERTEX_SHADER, POINT_FRAGMENT_SHADER);
  gl.drawArrays(gl.POINTS, 0, POINTS_POSITION.length / 3);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, POINTS_POSITION.length / 2);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

resize();
// animate();

window.addEventListener('click', addPoint);
window.addEventListener('resize', resize);
