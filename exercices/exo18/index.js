import * as THREE from 'three';
import { setupWebGL } from '../../lib/webgl-utils';
import { Matrix4 } from '../../lib/cuon-matrix.js';
import imageSrc from "../../images/wood-512x512.jpg";
import dat from 'dat.gui';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
var info = {
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
        pointLightPosition: null,
        pointLightColor: null
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

var VERTEX_SHADER =`
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
  uniform vec3 uPointLightPosition;
  uniform vec3 uPointLightColor;
  
  void main() {
  // Compute gl_Position in clip space from aPosition in object space
     gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;


  // Forward texcoord to fragment shader with varying interpolation
     vTexCoord = aTexCoord;

  // Transform normal attribute with the normal matrix
  // ..

  // Point light is defined by its world position
  // To compute the light direction received by a vertex, we need to substract the position of light and vertex, both in world space
  // World space is the result of applying model matrix to the vertex position in object space

  // Get the vertex position in world space
   vec3 vertexWorld = uModelMatrix * aPosition
   vec3 lightWorld = uPointLightPosition
  // Compute light direction
   vec3 lightDirection = vertexWorld - lightWorld
  // Compute angle between transformed normal and the light direction
   float cosTheta = ...

  // Compute diffuse and ambient colors
  //    vec3 diffuse = ... ;
  //    vec3 ambient = ... ;

  // Forward the light color to the fragment shader through varying interpolation
     vLightColor = max(ambient, diffuse);
  }
`

var FRAGMENT_SHADER = `
  precision mediump float;
  
  uniform sampler2D uSampler;
  
  varying vec2 vTexCoord;
  varying vec3 vLightColor;
  
  void main()
  {
     vec4 texColor = texture2D(uSampler, vTexCoord);

  // Evaluate fragment color rgb by multiplying texture color
  // with interpolated light color
  // ..

  // Keep alpha from texture
     gl_FragColor.a = texColor.a;
  }
`;

/*
 * Graphical User Interface params function
 * Define params to control any runtime property
 */
var GUIParams = function() {
  this.lightX = 0.0;
  this.lightY = 0.0;
  this.lightZ = 1.0;
  this.ambientColor = "#204060";
  this.pointlightColor = "#c0a000";
};

/*
 * Create GUI and params instances
 * Setup the interface with property association
 */
var params = new GUIParams();
var gui = new dat.GUI();

var dirF = gui.addFolder('Point light');
dirF.open();
dirF.add(params, 'lightX', -5.0, 5.0, 0.25);
dirF.add(params, 'lightY', -5.0, 5.0, 0.25);
dirF.add(params, 'lightZ', -5.0, 5.0, 0.25);
dirF.addColor(params, 'pointlightColor').name("color");

var ambF = gui.addFolder('Ambient light');
ambF.open();
ambF.addColor(params, 'ambientColor').name("color");


/*
 * Get vertex attribute in given program by name
 */
function getAttribute(program, name)
{
  var attribute = gl.getAttribLocation(program, name);
  if (attribute < 0)
  {
    throw "Error while accessing attribute " + name;
  }

  return attribute;
}

/*
 * Get uniform location in given program by name
 */
function getUniform(program, name)
{
  var uniform = gl.getUniformLocation(program, name);
  if (uniform === null)
  {
    // throw "Error while accessing uniform uModelMatrix";
  }

  return uniform;
}


/*
 * Get model matrix
 * Defined as scaling, then rotation, then translation
 * Return matrix4
 */
function getModelMatrix()
{
  var modelMatrix = new Matrix4();
  modelMatrix.rotate(30 * Math.sin(info.animation.angleRad), 1, 0, 0);
  modelMatrix.rotate(info.animation.angleDeg, 0, 1, 0);
  return modelMatrix;
}

/*
 * Get view matrix
 * Translated at position set by params
 * Always looking at the origin
 * Return matrix4
 */
function getViewMatrix()
{
  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(2, 2, 2, 0, 0, 0, 0, 1, 0);
  return viewMatrix;
}

/*
 * Get projection matrix
 * Orthographic or perspective
 * Return matrix4
 */
function getProjectionMatrix()
{
  var projectionMatrix = new Matrix4();
  projectionMatrix.setPerspective(90, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.001, 1000);
  return projectionMatrix;
}

function setupBuffers()
{
  var positions = new Float32Array([
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

  var aPosition = getAttribute(info.objects.cube.program, "aPosition");

  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);


  var textureCoords = new Float32Array([
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

  var aTexCoord = getAttribute(info.objects.cube.program, "aTexCoord");

  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aTexCoord);


  var normals = new Float32Array([
    // Front face
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,

    // Back face
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,

    // Top face
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,

    // Bottom face
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,

    // Right face
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,

    // Left face
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ]);

  info.objects.cube.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, info.objects.cube.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  var aNormal = getAttribute(info.objects.cube.program, "aNormal");

  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);


  var indices = new Uint8Array([
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

function setupProgram()
{
  info.objects.cube.program = createShader(gl, VERTEX_SHADER, FRAGMENT_SHADER);

  info.objects.cube.uniforms = {
    modelMatrix: getUniform(info.objects.cube.program, "uModelMatrix"),
    normalMatrix: getUniform(info.objects.cube.program, "uNormalMatrix"),
    viewMatrix: getUniform(info.objects.cube.program, "uViewMatrix"),
    projectionMatrix: getUniform(info.objects.cube.program, "uProjectionMatrix"),
    sampler: getUniform(info.objects.cube.program, "uSampler"),
    ambientLightColor: getUniform(info.objects.cube.program, "uAmbientLightColor"),
    pointLightPosition: getUniform(info.objects.cube.program, "uPointLightPosition"),
    pointLightColor: getUniform(info.objects.cube.program, "uPointLightColor")
  }
}


/*
 * Setup texture once image is loaded
 */
function setupTexture()
{
  var texture = gl.createTexture();

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(info.objects.cube.uniforms.sampler, 0);
}

/*
 * Init function
 * Setup globals, create instances and load ressources (sync/async)
 */
function init()
{
  console.log("Init ...");

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
function onInitDone(status)
{
  if (!status)
  {
    console.log("Init failure. Abort...");
    return;
  }

  console.log("Init done, start animation");

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
function animate()
{
  // Schedule next frame
  window.requestAnimationFrame(animate);

  // Update phase and angles for animation
  info.animation.phase = ((Date.now() / 1000) % info.animation.period) / info.animation.period;
  info.animation.angleRad = 2 * Math.PI * info.animation.phase;
  info.animation.angleDeg = 360 * info.animation.phase;

  // Update matrices
  var mModel = getModelMatrix();
  gl.uniformMatrix4fv(info.objects.cube.uniforms.modelMatrix, false, mModel.elements);

  var mNormal = new Matrix4(mModel).invert().transpose();
  gl.uniformMatrix4fv(info.objects.cube.uniforms.normalMatrix, false, mNormal.elements);

  var mView = getViewMatrix();
  gl.uniformMatrix4fv(info.objects.cube.uniforms.viewMatrix, false, mView.elements);

  var mProjection = getProjectionMatrix();
  gl.uniformMatrix4fv(info.objects.cube.uniforms.projectionMatrix, false, mProjection.elements);

  // Update light settings
  var ambientColor = new THREE.Color(params.ambientColor);
  gl.uniform3fv(info.objects.cube.uniforms.ambientLightColor, [ambientColor.r, ambientColor.g, ambientColor.b]);

  gl.uniform3fv(info.objects.cube.uniforms.pointLightPosition, [params.lightX, params.lightY, params.lightZ]);

  var pointLightColor = new THREE.Color(params.pointlightColor);
  gl.uniform3fv(info.objects.cube.uniforms.pointLightColor, [pointLightColor.r, pointLightColor.g, pointLightColor.b]);

  // Render
  render();
}

/*
 * Render routine
 * Invoke draw calls
 */
function render()
{
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
