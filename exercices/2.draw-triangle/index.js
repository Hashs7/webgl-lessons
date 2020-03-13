import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import { randomNumber } from "../../utils";
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
let VERTEX_SHADER = `
  attribute vec2 coordinates;

  void main(void) {
     gl_Position = vec4(coordinates, 0.0, 1.0);
  }
`;
let FRAGMENT_SHADER = `
  precision mediump float;
  uniform vec3 uColor;

  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 0.1);
  }
`;

initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);
const coord = gl.getAttribLocation(gl.program, 'coordinates');
let uColor = gl.getUniformLocation(gl.program, 'uColor');

let POINTS_POSITION = [];

function initTriangle() {
  const vertices = [
    -0.5,0.5,
    -0.5,-0.5,
    0.5,-0.5,
    -1,0.2,
    -1.0,-0.5,
    0.7,-0.3,
  ];

  const vertex_buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(coord);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function addPoint(e) {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = -(e.clientY / window.innerHeight) * 2 + 1;
  const size = randomNumber(5, 50);
  POINTS_POSITION.push({ position : { x, y }, size });
}

function animate() {
  POINTS_POSITION = POINTS_POSITION.filter(point => point.size > 0.1);
  POINTS_POSITION = POINTS_POSITION.map(({ position, size }) => ({ position, size: size - 0.4 }));
  render();
  requestAnimationFrame(animate);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  initTriangle();
  POINTS_POSITION.forEach(({ position, size }) => {
    const floatArray = new Float32Array([position.x, position.y, 0.0]);
    const color = position.x < 0 ? [1.0, 0.0, 0.0] : [0.0, 0.0, 1.0];
    gl.vertexAttrib3fv(aPosition, floatArray);
    gl.vertexAttrib1f(aPointSize, size);
    gl.uniform3fv(uColor, color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return { position, size };
  });
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
// window.addEventListener('click', addPoint);
