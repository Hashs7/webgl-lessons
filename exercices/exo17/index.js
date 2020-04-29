import * as THREE from 'three';
import { setupWebGL } from '../../lib/webgl-utils';
import { createShaders } from '../../lib/webgl-shader-utils.js'
import { Matrix4 } from '../../lib/cuon-matrix.js';
import imageSrc from "../../images/wood-512x512.jpg";
import dat from 'dat.gui';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
const info = {
  animation:
    {
      period: 10,
      phase: 0,
      angleRad: 0,
      angleDeg: 0
    },
  objects: {
    cube: {
      program: null,
      uniforms: {
        modelMatrix: null,
        normalMatrix: null,
        viewMatrix: null,
        projectionMatrix: null,
        sampler: null,
        ambientLightColor: null,
        dirLightDirection: null,
        dirLightColor: null
      },
      vertexBuffer: null,
      indexBuffer: null,
      normalBuffer: null,
      texCoordBuffer: null,
      indices:0
    }
  },
  image: null,
  texture: null
};

const VERTEX_SHADER = `
  attribute vec4 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aTexCoord;
  
  varying vec2 vTexCoord;
  varying vec3 vLightColor;
  
  uniform mat4 uModelMatrix;
  uniform mat4 uNormalMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  uniform vec3 uAmbientLightColor;
  uniform vec3 uDirLightDirection;
  uniform vec3 uDirLightColor;
  
  void main() {
    // Compute gl_Position in clip space from aPosition in object space
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
  
    // Forward texcoord to fragment shader with varying interpolation
    vTexCoord = aTexCoord;
  
    // Transform normal attribute with the normal matrix
    vec3 transformNormal = (uNormalMatrix * vec4(aNormal, 1.)).xyz;
  
    // Directional light amount
    // Will be used to mix ambient and directional light
    // Eval cos of the angle between transformed normal and light direction
    // Clamp to positive values
    float cosTheta = dot(normalize(uDirLightDirection), normalize(transformNormal));
  
    // Forward light color to fragment shader with varying interpolation
    // On this vertex, it's the mix between ambient and directional light
    // Use the mix() function and the value computed before
    vLightColor = mix(uAmbientLightColor, uDirLightColor, cosTheta);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D uSampler;
  
  varying vec2 vTexCoord;
  varying vec3 vLightColor;
  
  void main() {
    vec4 texColor = texture2D(uSampler, vTexCoord);
    gl_FragColor.a = texColor.a;
    // Evaluate frag color rgb by multiplying texture color
    // with interpolated light color
    gl_FragColor.rgb = vLightColor * texColor.rgb;
  }
`;

/*
 * Graphical User Interface params function
 * Define params to control any runtime property
 */
const GUIParams = function() {
  this.lightX = 0.0;
  this.lightY = 0.0;
  this.lightZ = 1.0;

  this.ambientColor = "#204060";
  this.directionalColor = "#c0a000";
};

/*
 * Create GUI and params instances
 * Setup the interface with property association
 */
const params = new GUIParams();
const gui = new dat.GUI();

const dirF = gui.addFolder('Directional light');
dirF.open();
dirF.add(params, 'lightX', -15.0, 15.0, 0.25);
dirF.add(params, 'lightY', -15.0, 15.0, 0.25);
dirF.add(params, 'lightZ', 0.5, 50.0, 1);
dirF.addColor(params, 'directionalColor').name("color");

const ambF = gui.addFolder('Ambient light');
ambF.open();
ambF.addColor(params, 'ambientColor').name("color");


/*
 * Get vertex attribute in given program by name
 */
function getAttribute(program, name) {
  const attribute = gl.getAttribLocation(program, name);
  if (attribute < 0)
  {
    throw "Error while accessing attribute " + name;
  }

  return attribute;
}

/*
 * Get uniform location in given program by name
 */
function getUniform(program, name) {
  const uniform = gl.getUniformLocation(program, name);
  if (uniform === null) {
    throw "Error while accessing uniform uModelMatrix";
  }

  return uniform;
}

/*
 * Get model matrix
 * Defined as scaling, then rotation, then translation
 * Return matrix4
 */
function getModelMatrix() {
  const modelMatrix = new Matrix4();
  modelMatrix.rotate(info.animation.angleDeg, 0, 1, 0);
  modelMatrix.rotate(45 * Math.cos(info.animation.angleRad), 0, 0, 1);
  return modelMatrix;
}

/*
 * Get view matrix
 * Translated at position set by params
 * Always looking at the origin
 * Return matrix4
 */
function getViewMatrix() {
  const viewMatrix = new Matrix4();
  viewMatrix.setLookAt(0, 0, 4, 0, 0, 0, 0, 1, 0);
  return viewMatrix;
}

/*
 * Get projection matrix
 * Orthographic or perspective
 * Return matrix4
 */
function getProjectionMatrix() {
  const projectionMatrix = new Matrix4();
  projectionMatrix.setPerspective(90, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.001, 1000);
  return projectionMatrix;
}

/*
 * Create one buffer storing vertices positions, normals and texture coordinates
 */
function setupBuffers() {
  const positions = new Float32Array([
    // Front face
    -1.0, -1.0,  1.0,
    1.0, -1.0,  1.0,
    1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
    1.0,  1.0,  1.0,
    1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ]);

  info.objects.cube.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, info.objects.cube.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const aPosition = getAttribute(info.objects.cube.program, "aPosition");

  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);


  const textureCoords = new Float32Array([
    // Front face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,

    // Back face
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,

    // Top face
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,

    // Bottom face
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    // Right face
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,

    // Left face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
  ]);

  info.objects.cube.texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, info.objects.cube.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);

  const aTexCoord = getAttribute(info.objects.cube.program, "aTexCoord");

  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aTexCoord);


  // Compute normals for each face
  // Each vertex position matches with one vertex normal (both arrays have the same number of rows)

  const normals = new Float32Array([
    // Front face
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // Back face
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Top face
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Bottom face
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // Right face
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // Left face
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
  ]);

  info.objects.cube.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, info.objects.cube.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  const aNormal = getAttribute(info.objects.cube.program, "aNormal");

  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);


  const indices = new Uint8Array([
    // Front face
    0, 1, 2,
    0, 2, 3,

    // Back face
    4, 5, 6,
    4, 6, 7,

    // Top face
    8, 9, 10,
    8, 10, 11,

    // Bottom face
    12, 13, 14,
    12, 14, 15,

    // Right face
    16, 17, 18,
    16, 18, 19,

    // Left face
    20, 21, 22,
    20, 22, 23
  ]);

  info.objects.cube.indices = indices.length;
  info.objects.cube.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, info.objects.cube.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

function setupProgram() {
  info.objects.cube.program = createShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);

  // Get all uniforms for shader update
  // Matrices, texture and light values
  info.objects.cube.uniforms = {
    modelMatrix: getUniform(info.objects.cube.program, "uModelMatrix"),
    normalMatrix: getUniform(info.objects.cube.program, "uNormalMatrix"),
    viewMatrix: getUniform(info.objects.cube.program, "uViewMatrix"),
    projectionMatrix: getUniform(info.objects.cube.program, "uProjectionMatrix"),
    sampler: getUniform(info.objects.cube.program, "uSampler"),
    ambientLightColor: getUniform(info.objects.cube.program, "uAmbientLightColor"),
    dirLightDirection: getUniform(info.objects.cube.program, "uDirLightDirection"),
    dirLightColor: getUniform(info.objects.cube.program, "uDirLightColor")
  }
}

/*
 * Setup texture once image is loaded
 */
function setupTexture() {
  const texture = gl.createTexture();

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, info.image);

  gl.uniform1i(info.objects.cube.uniforms.sampler, 0);
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 */
function init() {
  setupProgram();
  setupBuffers();

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  info.image = loadImage()
}

function loadImage() {
  const img = new Image();
  img.addEventListener('load', () => onInitDone());
  img.addEventListener('error', (err) => console.error(err));
  img.src = imageSrc;
  return img;
}

/*
 * Init done callback
 * Everything is ready, start animation
 */
function onInitDone() {
  setupTexture();
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

  // Update phase and angles for animation
  info.animation.phase = ((Date.now() / 1000) % info.animation.period) / info.animation.period;
  info.animation.angleRad = 2 * Math.PI * info.animation.phase;
  info.animation.angleDeg = 360 * info.animation.phase;

  // Update matrices
  const mModel = getModelMatrix();
  gl.uniformMatrix4fv(info.objects.cube.uniforms.modelMatrix, false, mModel.elements);

  // Normal matrix is the transposed of the inverse of the model matrix
  const mNormal = getModelMatrix().invert().transpose();
  gl.uniformMatrix4fv(info.objects.cube.uniforms.normalMatrix, false, mNormal.elements);

  const mView = getViewMatrix();
  gl.uniformMatrix4fv(info.objects.cube.uniforms.viewMatrix, false, mView.elements);

  const mProjection = getProjectionMatrix();
  gl.uniformMatrix4fv(info.objects.cube.uniforms.projectionMatrix, false, mProjection.elements);

  // Update light settings
  const ambientColor = new THREE.Color(params.ambientColor);
  const directionalColor = new THREE.Color(params.directionalColor);

  gl.uniform3fv(info.objects.cube.uniforms.ambientLightColor, [ambientColor.r, ambientColor.g, ambientColor.b]);
  gl.uniform3fv(info.objects.cube.uniforms.dirLightDirection, [params.lightX, params.lightY, params.lightZ]);
  gl.uniform3fv(info.objects.cube.uniforms.dirLightColor, [directionalColor.r, directionalColor.g, directionalColor.b]);

  render();
}

/*
 * Render routine
 * Invoke draw calls
 */
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, info.objects.cube.indices, gl.UNSIGNED_BYTE, 0);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

init();
animate();
resize();

window.addEventListener('resize', resize);
