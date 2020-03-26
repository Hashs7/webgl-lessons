import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import { Matrix4 } from '../../lib/cuon-matrix.js';
import dat from 'dat.gui';
import Stats from 'stats.js';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);

let uModelMatrix;

const degreesToRad = (degrees) => degrees * Math.PI / 180;

/*
 * Graphical User Interface params function
 * Define params to control any runtime property
 */
let GUIParams = function () {
  this.scale = 1.0;
  this.translateX = 0.0;
  this.translateY = 0.0;
  this.rotation = 0;
};

/*
 * Create GUI and params instances
 * Setup the interface with property association
 */
let params = new GUIParams();
let gui = new dat.GUI();

gui.add(params, 'scale', 0.1, 1, 0.01);
gui.add(params, 'translateX', -0.5, 0.5, 0.01);
gui.add(params, 'translateY', -0.5, 0.5, 0.01);
gui.add(params, 'rotation', 0, 360, 1);

/*
 * Create stats monitoring object and append it to DOM
 */
const stats = new Stats();
document.body.appendChild(stats.dom);


/*
 * Create one buffer storing vertices positions and colors
 * Setup data for aPosition and aColor attributes with the buffer as source
 */
function setupBuffersAndAttributes() {
  // Setup vertices positions with a color
  // Compute positions for some equilateral triangle
  const h_2 = 0.5 * Math.sqrt(3) / 2;

  const vertices = new Float32Array([
    -0.5, -h_2, 1.0, 0.0, 0.0, // 1st vertex position and color
    0.0, h_2, 0.0, 1.0, 0.0, // 2nd vertex position and color
    0.5, -h_2, 0.0, 0.0, 1.0  // 3rd vertex position and color
  ]);

  const elementBytes = vertices.BYTES_PER_ELEMENT;

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(gl.program, "aPosition");
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 5 * elementBytes, 0);
  gl.enableVertexAttribArray(aPosition);

  const aColor = gl.getAttribLocation(gl.program, "aColor");
  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 5 * elementBytes, 2 * elementBytes);
  gl.enableVertexAttribArray(aColor);
}

// This time we create a mat4 typed uniform called uModelMatrix and multiply it with aPosition
function setupProgram() {
  const VERTEX_SHADER = `
    attribute vec4 aPosition;
    attribute vec3 aColor;
    uniform mat4 uModelMatrix;
    varying vec3 vColor;
    
    void main() {
      // gl_Position is the result of muliplying aPosition with the transform matrix
      gl_Position = uModelMatrix * aPosition; 
      vColor = aColor;
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
    `;

  initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);

  uModelMatrix = gl.getUniformLocation(gl.program, "uModelMatrix");
}

/*
 * Get transform matrix
 * Transform is defined as scaling, then rotation, then translation
 * Return matrix4
 */
function getModelMatrix() {
  // Compute and return modelMatrix

  // Compute scale with
  const scale = new Float32Array([
    params.scale, 0, 0, 0,
    0, params.scale, 0, 0,
    0, 0, params.scale, 0,
    0, 0, 0, 1
  ]);
  const matrixScale = new Matrix4(scale);

  // Compute rotation with
  const rotation = degreesToRad(params.rotation);
  const rotationZ = new Float32Array([
    Math.cos(rotation), Math.sin(rotation), 0, 0,
    -Math.sin(rotation), Math.cos(rotation), 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
  const matrixRotationZ = new Matrix4(rotationZ);

  // Compute translation with
  // ..
  const translation = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    params.translateX, params.translateY, 0, 1
  ]);
  const matrixTranslation = new Matrix4(translation);

  return matrixScale.multiply(matrixTranslation).multiply(matrixRotationZ);
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 * Actions will end up with the onInitDone callback
 */
function init() {
  setupProgram();
  setupBuffersAndAttributes();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

/*
 * Animation routine
 * Called once per frame
 *
 * Schedule next frame
 * Update the current state
 * Call render routine
 * Measure and display rendering stats
 */
function animate() {
  window.requestAnimationFrame(animate);
  stats.begin();

  // Get the up to date model matrix with the global transform (scaling + rotation + translation)
  const mModel = getModelMatrix();
  gl.uniformMatrix4fv(uModelMatrix, false, mModel.elements);

  render();
  stats.end();
}

/*
 * Render routine
 * Invoke draw calls
 */
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

init();
resize();
animate();

window.addEventListener('resize', resize);
