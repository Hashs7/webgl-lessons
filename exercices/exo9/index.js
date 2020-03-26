import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import imageSrc from "../../images/doge-600.png";
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
let img;
let uSampler;

/*
 * Create one buffer storing vertices positions and colors
 * Setup data for aPosition and aColor attributes with the buffer as source
 */
function setupTexture() {
  // Create a texture and  of type Sampler2D in fragment shader
  // WebGL API functions to use, check documentation:

  const texture = gl.createTexture(); // création de la texture
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Correction de l’orientation
  gl.activeTexture(gl.TEXTURE0); // Active le slot de texture 0
  gl.bindTexture(gl.TEXTURE_2D, texture); // Associe la texture au sampler 2D
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); // données

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // filtre de minification
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // comportement au bord
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Texture is accessed in fragment shader through some uniform uSampler, use uniform1i to set the sampler index
  gl.uniform1i(uSampler, 0);
}

/*
 * Create one buffer storing vertices positions and texture coordinates
 * Setup data for aPosition and aTexCoord attributes with the buffer as source
 */
function setupBuffersAndAttributes() {
  const verticesAndTexCoords = new Float32Array([
    0.5, -0.5, 0, 0, // bas à droite
    0.5, 0.5, 0, 1, // haut droite
    -0.5, 0.5, 1, 1, // haut gauche
    -0.5, -0.5, 1, 0, // bas gauche
  ]);
  const indices = new Uint8Array([
    0, 1, 2,
    0, 2, 3,
  ]);

  const elementBytes = verticesAndTexCoords.BYTES_PER_ELEMENT;

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesAndTexCoords, gl.STATIC_DRAW);

  const indiceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


  const aPosition = gl.getAttribLocation(gl.program, "aPosition");
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 4 * elementBytes, 0);
  gl.enableVertexAttribArray(aPosition);

  const aTexCoord = gl.getAttribLocation(gl.program, "aTexCoord");
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 4 * elementBytes, 2 * elementBytes);
  gl.enableVertexAttribArray(aTexCoord);
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 * Actions will end up with the onInitDone callback
 */
function init() {
  const VERTEX_SHADER = `
    attribute vec4 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    
    void main() {
      gl_Position = aPosition;
      vTexCoord = aTexCoord;
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    uniform sampler2D uSampler;
    varying vec2 vTexCoord;  

    void main() {
      gl_FragColor.rgb = texture2D(uSampler, vTexCoord.st).rgb;
      gl_FragColor.a = 1.0;
    }
  `;

  initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  uSampler = gl.getUniformLocation(gl.program, "uSampler");

  setupBuffersAndAttributes();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Create some image element, set its onload/onerror callbacks and load the image
  // When image is loaded, then setup the texture and begin the display
  loadImage();
}

/*
 * Init done callback
 * Everything is ready, start animation
 */
function onInitDone() {
  console.log('onInitDone');
  setupTexture();

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function loadImage() {
  img = new Image();
  img.addEventListener('load', () => onInitDone());
  img.addEventListener('error', (err) => console.error(err));
  img.src = imageSrc;
}

init();
resize();



window.addEventListener('resize', resize);
