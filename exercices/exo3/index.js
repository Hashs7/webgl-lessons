import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import dat from 'dat.gui';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);

let VERTEX_SHADER = `
    attribute vec2 aPosition;
    void main() {
       gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`;
let FRAGMENT_SHADER = `
    precision mediump float;
    void main()
    {
       gl_FragColor = vec4(1.0, 0.2, 0.0, 1.0);
    }
`;


const onParamChange = () => {
  setupGeometry();
  render();
};

const gui = new dat.GUI();
const GUIParams = function() {
  this.sides = 6;
  this.radius = 1.0;
};

let params = new GUIParams();
gui.add(params, 'sides', 3, 50, 1).onChange(onParamChange);
gui.add(params, 'radius', 0, 1, 0.05).onChange(onParamChange);

let nIndices = 6;
let radius = 1;
let vertices;
let indices;

/*
 * Get WebGL rendering context
 */
function computePolygonGeometry() {
  vertices = [0, 0];
  indices = [];
  const deg = 360 / nIndices;
  for (let i = 0; i < nIndices; i++) {
    const rad = ((deg * i) / 180) * Math.PI;

    vertices.push(
      Math.cos(rad) * radius,
      Math.sin(rad) * radius
    );
    indices.push(0, i + 1, i !== nIndices - 1 ? i + 2 : 1);
  }
}

initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);
const aPosition = gl.getAttribLocation(gl.program, 'aPosition');

function setupGeometry() {
  nIndices = params.sides;
  radius = params.radius;
  computePolygonGeometry();

  // Clear previous buffers with
  // gl.bindBuffer(..., null);
  // gl.deleteBuffer();

  // Create new buffers (gl.ARRAY_BUFFER and gl.ELEMENT_ARRAY_BUFFER) and bind them

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  const bufferIndices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferIndices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 * Actions will end up with the onInitDone callback
 */
function init() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  setupGeometry();
  render();
}

/*
 * Render routine
 * Invoke draw calls
 */
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

resize();
init();

window.addEventListener('resize', resize);
