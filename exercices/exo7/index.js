import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import dat from 'dat.gui';
import Stats from 'stats.js';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);

let uTranslate, uScale;

/*
 * Graphical User Interface params function
 * Define params to control any runtime property
 */
let GUIParams = function () {
  this.scale = 1;
  this.translateX = 0.0;
  this.translateY = 0.0;
};

/*
 * Create GUI and params instances
 * Setup the interface with property association
 */
let params = new GUIParams();
let gui = new dat.GUI();

gui.add(params, 'scale', 0.1, 1);
gui.add(params, 'translateX', -0.5, 0.5);
gui.add(params, 'translateY', -0.5, 0.5);

/*
 * Create stats monitoring object and append it to DOM
 */
let stats = new Stats();
document.body.appendChild(stats.dom);


/*
 * Create one buffer storing vertices positions and colors
 * Setup data for aPosition and aColor attributes with the buffer as source
 */
function setupBuffersAndAttributes() {
  // Setup vertices positions and colors (x,y, r,g,b)
  let vertices = new Float32Array([
    -0.5, -0.5, 1.0, 0.0, 0.0, // 1st vertex position and color
    0.0, 0.5, 0.0, 1.0, 0.0, // 2nd vertex position and color
    0.5, -0.5, 0.0, 0.0, 1.0  // 3rd vertex position and color
  ]);

  let elementBytes = vertices.BYTES_PER_ELEMENT;

  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let aPosition = gl.getAttribLocation(gl.program, "aPosition");

  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 5 * elementBytes, 0);
  gl.enableVertexAttribArray(aPosition);

  let aColor = gl.getAttribLocation(gl.program, "aColor");

  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 5 * elementBytes, 2 * elementBytes);
  gl.enableVertexAttribArray(aColor);
}

function setupProgram() {
  let VERTEX_SHADER = `
    attribute vec2 aPosition;
    attribute vec3 aColor;
    varying vec3 vColor;
    uniform vec2 uTranslate;
    uniform float uScale;
    
    void main() {
      gl_Position = vec4(((aPosition * uScale) + uTranslate), 0.0, 1.0);
      vColor = aColor;
    }
`;
 let FRAGMENT_SHADER = `
    precision mediump float;
    varying vec3 vColor;
    
    void main() {
       gl_FragColor = vec4(vColor, 1.0);
    }
`;

  initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);

  uTranslate = gl.getUniformLocation(gl.program, 'uTranslate');
  uScale = gl.getUniformLocation(gl.program, 'uScale');
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
  // Schedule next frame
  window.requestAnimationFrame(animate);

  stats.begin();

  gl.uniform2f(uTranslate, params.translateX, params.translateY);
  gl.uniform1f(uScale, params.scale);

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
