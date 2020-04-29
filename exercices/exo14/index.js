import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import { Matrix4 } from '../../lib/cuon-matrix.js';
import dat from 'dat.gui';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
/*
 * Globals
 */

const PERIOD = 10;
let angle, uTransformMatrix, uColor;

/*
 * Graphical User Interface params function
 * Define params to control any runtime property
 */
const GUIParams = function() {
  this.blending = false;
  this.blendingModeSrc = "SRC_ALPHA";
  this.blendingModeDst = "ONE";
};

/*
 * Create GUI and params instances
 * Setup the interface with property association
 */
const params = new GUIParams();
const gui = new dat.GUI();
const blendModes = ["SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "ONE", "ZERO"];

gui.add(params, 'blending', false);
gui.add(params, 'blendingModeSrc', blendModes).name("src blending").setValue("SRC_ALPHA");
gui.add(params, 'blendingModeDst', blendModes).name("dst blending").setValue("ONE_MINUS_SRC_ALPHA");

/*
 * Get transform matrix
 * Transform is defined as scaling, then rotation, then translation
 * Return matrix4
 */
function getTransformMatrix(angle) {
  return new Matrix4().rotate(20 * Math.sin(angle), 1, 1, 0);
}

/*
 * Create a buffer storing vertices positions
 * Setup data for aPosition attributes with the buffer as source
 */
function setupBuffers() {
  const positions = new Float32Array([
    0.5,  0.4, 0.0,
    -0.5,  0.4, 0.0,
    0.0, -0.6, 0.0,

    0.0,  0.5, -0.3,
    -0.5, -0.5, -0.3,
    0.5, -0.5, -0.3
  ]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(gl.program, "aPosition");

  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 */
function init() {
  const VERTEX_SHADER = `
    attribute vec3 aPosition;
    varying vec3 vPosition;
    uniform mat4 uTransformMatrix;
    
    void main() {
      vPosition = aPosition;
      gl_Position = uTransformMatrix * vec4(aPosition, 1.);
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    varying vec3 vPosition;
    uniform vec3 uColor;
    
    void main() {
      float alpha = 2.0 * vPosition.y + 1.0;
      gl_FragColor = vec4(uColor.rgb, alpha);
    }
  `;

  initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  setupBuffers();

  uTransformMatrix = gl.getUniformLocation(gl.program, "uTransformMatrix");
  uColor = gl.getUniformLocation(gl.program, "uColor");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
  // Update phase for animation (ramp from 0 to 1 during PERIOD interval)
  window.requestAnimationFrame(animate);

  // If blending is enabled in params
  // Enable blend
  // Set blend equation : gl.FUNC_ADD
  // Set blend func using params
  if (params.blending) {
    gl.enable( gl.BLEND );
    gl.blendEquation( gl.FUNC_ADD );
    gl.blendFunc(gl[params.blendingModeSrc], gl[params.blendingModeDst]);
    // gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
  } else {
    gl.disable( gl.BLEND );
  }

  // Update phase for animation (ramp from 0 to 1 during PERIOD interval)
  const phase = ((Date.now() / 1000) % PERIOD) / PERIOD;

  const mTransform = getTransformMatrix(2 * Math.PI * phase);
  gl.uniformMatrix4fv(uTransformMatrix, false, mTransform.elements);

  render();
}

/*
 * Render routine
 * Invoke draw calls
 */
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw 2 triangles with 2 different colors
  gl.uniform3fv(uColor, [1.0, 1.0, 0.0]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.uniform3fv(uColor, [0.0, 0.4, 1.0]);
  gl.drawArrays(gl.TRIANGLES, 3, 3);
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
