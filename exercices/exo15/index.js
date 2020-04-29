import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import { Matrix4 } from '../../lib/cuon-matrix.js';
import dat from 'dat.gui';
import './style.scss';
import { crossVector, substractVector, Vector3 } from "../../lib/cuon-matrix";
import { Vector2 } from "three";

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
/*
 * Globals
 */
const PERIOD = 10;
let nIndices, uModelMatrix, uViewMatrix, uProjectionMatrix;

/*
 * Graphical User Interface params function
 * Define params to control any runtime property
 */
const GUIParams = function() {
  this.cameraX = 0.0;
  this.cameraY = 0.0;
  this.cameraZ = 5.0;
  this.fov = 45;
  this.projection = "orthographic";
  this.pauseModelAnimation = false;
};

/*
 * Create GUI and params instances
 * Setup the interface with property association
 */
const params = new GUIParams();
const gui = new dat.GUI();

gui.add(params, 'cameraX', -5.0, 5.0, 0.1);
gui.add(params, 'cameraY', -5.0, 5.0, 0.1);
gui.add(params, 'cameraZ', 0, 20.0, 0.1);
gui.add(params, 'fov', 5, 150.0, 5);
gui.add(params, 'pauseModelAnimation').name("pause animation");
gui.add(params, 'projection', ["orthographic", "perspective"]);

/*
 * Get model matrix, rotation of the model
 * Rotation should be: -30/+30° around X axis and angle around Y axis
 * Return matrix4
 */
function getModelMatrix(angle) {
  const modelMatrix = new Matrix4();

  modelMatrix.setRotate(angle, 0, 1, 0);

  return modelMatrix;
}

function lookAt(eye, target, up) {
  // Create vectors with input arrays
  const vEye = new Vector3(eye);
  const vTarget = new Vector3(target);
  const vUp = new Vector3(up);

  // Compute 3 axis x, y, z
  // You will need to add functions to compute vectors substraction and cross product between 2 vectors
  const z = substractVector(vEye, vTarget);
  const x = crossVector(vUp, z);
  const y = crossVector(z, x);

  // Create the translation matrix
  // ..
  const mTranslation = new Matrix4({elements: [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    -vEye.elements[0], -vEye.elements[1], -vEye.elements[2], 1,
  ]});

  // Create the orientation matrix
  const mOrientation = new Matrix4({elements: [
      x.elements[0], y.elements[0], z.elements[0], 0,
      x.elements[1], y.elements[1], z.elements[1], 0,
      x.elements[2], y.elements[2], z.elements[2], 0,
      0, 0, 0, 1,
    ]});

  // Return product of both matrices
  // ..
  return mOrientation.multiply(mTranslation);
}

/*
 * Get view matrix
 * Eye position, direction and up orientation
 * Return matrix4
 */
function getViewMatrix() {
  // let viewMatrix = new Matrix4();

  // Define eye and target positions and up vector
  const eye = [params.cameraX, params.cameraY, params.cameraZ];
  const target = [0, 0, 0];
  const up = [0, 1, 0];

  // Then use setLookAt function to create the view matrix
  // ..
  return new Matrix4().lookAt(eye, target, up);
  // return new Matrix4().setLookAt(eye[0], eye[1], eye[2], target[0], target[1], target[2], up[0], up[1], up[2]);
}

/*
 * Get projection matrix
 * Orthographic or perspective
 * Return matrix4
 */
function getProjectionMatrix() {
  const projectionMatrix = new Matrix4();

  // Use library setPerspective or setOrtho to create a projection matrix depending on param
  if (params.projection === "perspective") {
    projectionMatrix.setPerspective(params.fov, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  } else {
    projectionMatrix.setOrtho(-1, 1, -1, 1, 0.1, 1000);
  }

  return projectionMatrix;
}

/*
 * Create one buffer storing vertices positions and colors
 * Setup data for aPosition and aColor attributes with the buffer as source
 */
function setupBuffers() {
  const verticesAndColors = new Float32Array([
    -0.5, -0.5,  0.5,       1.0, 1.0, 1.0,
    -0.5,  0.5,  0.5,       1.0, 0.0, 0.0,
    0.5,  0.5,  0.5,       1.0, 0.0, 1.0,
    0.5, -0.5,  0.5,       1.0, 1.0, 0.0,

    -0.5, -0.5, -0.5,       0.0, 1.0, 1.0,
    -0.5,  0.5, -0.5,       0.0, 0.0, 0.0,
    0.5,  0.5, -0.5,       0.0, 0.0, 1.0,
    0.5, -0.5, -0.5,       0.0, 1.0, 0.0
  ]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesAndColors, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(gl.program, "aPosition");
  const elementBytes = verticesAndColors.BYTES_PER_ELEMENT;

  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 6 * elementBytes, 0);
  gl.enableVertexAttribArray(aPosition);

  const aColor = gl.getAttribLocation(gl.program, "aColor");

  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 6 * elementBytes, 3 * elementBytes);
  gl.enableVertexAttribArray(aColor);

  const indices = new Uint8Array([
    // front
    0, 2, 1,
    0, 3, 2,

    // right
    3, 6, 2,
    3, 7, 6,

    // back
    7, 5, 6,
    7, 4, 5,

    // left
    4, 1, 5,
    4, 0, 1,

    // top
    1, 6, 5,
    1, 2, 6,

    // down
    0, 7, 4,
    0, 3, 7
  ]);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  nIndices = indices.length;
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 * Actions will end up with the onInitDone callback
 */
function init() {
  const VERTEX_SHADER = `
    attribute vec4 aPosition;
    attribute vec3 aColor;
    uniform mat4 uModelMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    varying vec3 vColor;
    
    void main() {
      // Apply 3 matrices to the vertex position to transform it from object space to clip space, applying model rotation, then camera space translation and finally camera projection
       vColor = aColor;
       gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    uniform sampler2D uSampler;
    
    varying vec3 vColor;
    
    void main() {
       gl_FragColor = vec4(vColor, 1.0);
    }
  `;

  initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);

  uModelMatrix = gl.getUniformLocation(gl.program, 'uModelMatrix');
  uProjectionMatrix = gl.getUniformLocation(gl.program, 'uProjectionMatrix');
  uViewMatrix = gl.getUniformLocation(gl.program, 'uViewMatrix');

  setupBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
}

/*
 * Animation routine
 * Called once per frame
 *
 * Schedule next frame
 * Update the current state
 * Call render routine
 */
let angle;

function animate() {
  // Schedule next frame
  window.requestAnimationFrame(animate);

  // Update phase for animation (ramp from 0 to 1 during PERIOD interval)
  const phase = ((Date.now() / 1000) % PERIOD) / PERIOD;

  if (params.pauseModelAnimation === false) {
    angle = 360 * phase;
  }


  /*
   Get model, view and projection matrices and set them as uniforms to be used in vertex shader to transform each vertex position attribute from the object space to the clip space

   Model Matrix: object space -> world space
   View Matrix: world space -> eye space
   Projection Matrix: eye space -> clip space
   */
  gl.uniformMatrix4fv(uModelMatrix, false, getModelMatrix(angle).elements);
  gl.uniformMatrix4fv(uViewMatrix, false, getViewMatrix().elements);
  gl.uniformMatrix4fv(uProjectionMatrix, false, getProjectionMatrix().elements);

  // Render
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

init();
animate();
resize();


function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

window.addEventListener('resize', resize);
