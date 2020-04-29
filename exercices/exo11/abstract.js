import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import { Matrix4 } from '../../lib/cuon-matrix.js';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
const PERIOD = 10;
let angle, nIndices, uModelMatrix;

/*
 * Get model matrix
 * Model matrix is the combination of scaling, rotation and translation
 * Return matrix4
 */
function getModelMatrix() {
  const model = new Matrix4();
  model.setRotate(30 * Math.sin(angle * Math.PI / 180.0), 1, 0, 0);
  model.rotate(angle, 0, 1, 0);
  return model;
}

/*
 * Create one buffer storing vertices positions and colors
 * Setup data for aPosition and aColor attributes with the buffer as source
 */
function setupBuffers() {
  const vertices = new Float32Array([
    -1.0, -1.0,  1.0,    0.0, 1.0, 1.0,
    1.0, -1.0,  1.0,    0.0, 1.0, 1.0,
    1.0,  1.0,  1.0,    0.0, 1.0, 1.0,
    -1.0,  1.0,  1.0,    0.0, 1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0,    1.0, 0.0, 1.0,
    -1.0,  1.0, -1.0,    1.0, 0.0, 1.0,
    1.0,  1.0, -1.0,    1.0, 0.0, 1.0,
    1.0, -1.0, -1.0,    1.0, 0.0, 1.0,

    // Top face
    -1.0,  1.0, -1.0,       1.0, 0.0, 1.0,
    -1.0,  1.0,  1.0,       1.0, 0.0, 1.0,
    1.0,  1.0,  1.0,       1.0, 0.0, 1.0,
    1.0,  1.0, -1.0,       1.0, 0.0, 1.0,

    // Bottom face
    -1.0, -1.0, -1.0,       0.25, 0.0, 0.6,
    1.0, -1.0, -1.0,       0.25, 0.0, 0.6,
    1.0, -1.0,  1.0,       0.25, 0.0, 0.6,
    -1.0, -1.0,  1.0,       0.25, 0.0, 0.6,

    // Right face
    1.0, -1.0, -1.0,       0.25, 0.0, 0.6,
    1.0,  1.0, -1.0,       0.25, 0.0, 0.6,
    1.0,  1.0,  1.0,       0.25, 0.0, 0.6,
    1.0, -1.0,  1.0,       0.25, 0.0, 0.6,

    // Left face
    -1.0, -1.0, -1.0,       0.25, 0.8, 0.6,
    -1.0, -1.0,  1.0,       0.25, 0.8, 0.6,
    -1.0,  1.0,  1.0,       0.25, 0.8, 0.6,
    -1.0,  1.0, -1.0,       0.25, 0.8, 0.6,
  ]);

  const bpe = vertices.BYTES_PER_ELEMENT;

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(gl.program, "aPosition");

  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 6 * bpe, 0);
  gl.enableVertexAttribArray(aPosition);

  const aColor = gl.getAttribLocation(gl.program, "aColor");

  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 6 * bpe, 3 * bpe);
  gl.enableVertexAttribArray(aColor);

  const indices = new Uint8Array([
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ]);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 */
function init() {
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
  nIndices = setupBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  animate();
}


/*
 * Animation routine
 * Called once per frame
 *
 * Schedule next frame
 * Update the current state
 * Call render routine
 */
function animate() {
  // Schedule next frame
  window.requestAnimationFrame(animate);

  // Update phase for animation (ramp from 0 to 1 during PERIOD interval)
  const phase = ((Date.now() / 1000) % PERIOD) / PERIOD;

  angle = 360 * phase;

  const mTransform = getModelMatrix();
  gl.uniformMatrix4fv(uModelMatrix, false, mTransform.elements);

  render();
}

/*
 * Render routine
 * Invoke draw calls
 */
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, nIndices, gl.UNSIGNED_BYTE, 0);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}


init();
resize();



window.addEventListener('resize', resize);
