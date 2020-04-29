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

const PERIOD = 6;
let uTransformMatrix, uColor;

/*
 * Graphical User Interface params function
 * Define params to control any runtime property
 */
const GUIParams = function() {
  this.polygonOffset = false;
};

/*
 * Create GUI and params instances
 * Setup the interface with property association
 */
const params = new GUIParams();
const gui = new dat.GUI();

function polygonOffsetToggle() {
  if (params.polygonOffset) {
    gl.enable(gl.POLYGON_OFFSET_FILL);
    return
  }
  gl.disable(gl.POLYGON_OFFSET_FILL)
}


gui.add(params, 'polygonOffset', false).name("Polygon offset").onChange(polygonOffsetToggle);

/*
 * Get transform matrix
 * Transform is defined as scaling, then rotation, then translation
 * Return matrix4
 */
function getTransformMatrix(angle) {
  // Rotation : oscillate -+45° around axis X and Y
  return new Matrix4().rotate(45 * Math.sin(angle), 1, 1, 0);
}

/*
 * Set 6 positions defining 2 triangles facing up and down, and sharing same Z coordinate
 * Create one buffer storing vertices positions
 */
function setupBuffers(coord) {
  const positions = new Float32Array([
    -0.5, 0.5, 0,
    0.5, 0.5, 0,
    0, -0.5, 0,
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
    0, 0.5, 0,
  ]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(coord);
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 */
function init() {
  const VERTEX_SHADER = `
    attribute vec3 aPosition;
    uniform mat4 uTransformMatrix;
    
    void main() {
      gl_Position = uTransformMatrix * vec4(aPosition, 1.);
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec3 uColor;
    
    void main() {
      gl_FragColor.rgb = uColor;
      gl_FragColor.a = 1.0;
    }
  `;

  initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const coord = gl.getAttribLocation(gl.program, 'aPosition');
  setupBuffers(coord);

  uTransformMatrix = gl.getUniformLocation(gl.program, "uTransformMatrix");
  uColor = gl.getUniformLocation(gl.program, "uColor");

  gl.enable(gl.DEPTH_TEST);

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
  const phase = ((Date.now() / 1000) % PERIOD) / PERIOD;

  // angle = 0;
  const angle = Math.PI * 2 * phase;

  const mTransform = getTransformMatrix(angle);
  gl.uniformMatrix4fv(uTransformMatrix, false, mTransform.elements);

  // Render
  render();
  window.requestAnimationFrame(animate);
}

/*
 * Render routine
 * Invoke draw calls
 */
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (params.polygonOffset) {
    gl.polygonOffset(1, 1);
  }
  gl.uniform3fv(uColor, [1.0, 0.0, 0.0]);
  gl.drawArrays(gl.TRIANGLES, 0,  3);


  if (params.polygonOffset) {
    gl.polygonOffset(0, 1);
  }
  gl.uniform3fv(uColor, [0.0, 0.0, 1.0]);
  gl.drawArrays(gl.TRIANGLES, 3,  3);
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
