import { setupWebGL } from '../../lib/webgl-utils';
import { Matrix4 } from '../../lib/cuon-matrix.js';
import { randomNumber } from "../../utils";
import { createShaders } from "../../lib/webgl-shader-utils";
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);
const info = {};

info.period = 20;
info.nCubes = 50;

// Fog definitions
info.fog = {
  near: -10,
  far: 15,
  color: [0.9, 0.9, 0.9],
};

function setupGL() {
  gl.clearColor(0.4, 0.8, 0.95, 1.0);

  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  gl.enable(gl.DEPTH_TEST);
}

/*
 * Create one buffer storing vertices positions for the reflective box
 */
function setupGeometryCube() {
  info.cubeDef.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, info.cubeDef.vertexBuffer);

  const vertices = new Float32Array([
    // Front Z+
    -1, -1,  1,
    1, -1,  1,
    1,  1,  1,
    -1,  1,  1,

    // Back Z-
    1, -1, -1,
    -1, -1, -1,
    -1,  1, -1,
    1,  1, -1,

    // Right X+
    1, -1,  1,
    1, -1, -1,
    1,  1, -1,
    1,  1,  1,

    // Left X-
    -1, -1, -1,
    -1, -1,  1,
    -1,  1,  1,
    -1,  1, -1,

    // Up Y+
    -1,  1,  1,
    1,  1,  1,
    1,  1, -1,
    -1,  1, -1,

    // Down Y-
    -1, -1, -1,
    1, -1, -1,
    1, -1,  1,
    -1, -1,  1
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);


  info.cubeDef.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, info.cubeDef.indexBuffer);

  const indices = new Uint8Array([
    0, 1, 2,
    0, 2, 3,

    4, 5, 6,
    4, 6, 7,

    8, 9, 10,
    8, 10, 11,

    12, 13, 14,
    12, 14, 15,

    16, 17, 18,
    16, 18, 19,

    20, 21, 22,
    20, 22, 23
  ]);
  info.cubeDef.indexCount = indices.length;
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

function setupGeometries() {
  setupGeometryCube();
}

function selectCube() {
  gl.useProgram(info.cubeDef.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, info.cubeDef.vertexBuffer);

  const aPosition = gl.getAttribLocation(info.cubeDef.program, "aPosition");
  const bpe = new Float32Array().BYTES_PER_ELEMENT;

  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);
}

/*
 * Setup shaders and program for reflective geometry
 */
function setupProgramCube() {
  const VERTEX_SHADER_CUBE = `
    attribute vec4 aPosition;
    uniform mat4 uWorldMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
 
    // Distance to camera varying
    //varying vec3 vColor;
    varying float vEyeVertexDepth;

    void main() {
      // vColor = aColor;
      gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * aPosition;
      vEyeVertexDepth = -(uViewMatrix * uWorldMatrix * aPosition).z;
      // Compute distance to camera for each vertex, this will be used in fragment shader to compute the fog amount
      // ..
    }
  `;

  const FRAGMENT_SHADER_CUBE = `
    precision mediump float;
    
    // Cube color and fog definition uniforms
    // ..
   
    // Distance to camera varying
    //varying vec3 vColor;
    varying float vEyeVertexDepth;
    
    void main() {
    // Compute fog amount (0% near, 100% far)
    // Use it to add fog to the cube color
    //  gl_FragColor.rgb = ..;
        gl_FragColor.rgb = vec3(1.0, 0., 0.);
        gl_FragColor.a = 1.0;
    //  gl_FragColor = mix(uColor, uFogColor, fogAmount);
    }
  `;

  info.cubeDef.program = createShaders(gl, VERTEX_SHADER_CUBE, FRAGMENT_SHADER_CUBE);
  info.cubeDef.uniforms = {
    uWorldMatrix: gl.getUniformLocation(gl.program, 'uWorldMatrix'),
    uProjectionMatrix: gl.getUniformLocation(gl.program, 'uProjectionMatrix'),
    uViewMatrix: gl.getUniformLocation(gl.program, 'uViewMatrix'),
    aColor: gl.getAttribLocation(gl.program, "aColor"),
  };
  // Setup every uniforms : cube color, matrices, fog definition
}

/*
 * Setup all programs
 */
function setupPrograms() {
  setupProgramCube();

  // Setup fog uniforms
  // ..
}


/*
 * Get view matrix looking at target from a given position
 * Return matrix4
 */
function getViewMatrix(position, target) {
  const viewMatrix = new Matrix4();

  const up = [0, 1, 0];

  viewMatrix.setLookAt(
    position[0], position[1], position[2],
    target[0],   target[1],   target[2],
    up[0],       up[1],       up[2]
  );

  return viewMatrix;
}

/*
 * Get projection matrix
 * Perspective camera, 90° fov
 * Return matrix4
 */
function getProjectionMatrix() {
  const projectionMatrix = new Matrix4();
  projectionMatrix.setPerspective(90, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  return projectionMatrix;
}

/*
 * Init function
 */
function init() {
  // Setup Context
  setupGL();

  // Create cube definition for drawing
  info.cubeDef = {};

  // Create and setup programs, geometries and textures
  setupPrograms();
  setupGeometries();

  // Compute cubes positions and color randomly, set a rotation offset to make all cubes' rotations out of sync
  info.cubes = [];
  for (let i = 0; i<info.nCubes; i++) {
    // Compute random color for each cube
    // ..

    info.cubes.push({
      position: {
        x: randomNumber(-15, 15),
        y: 0,
        z: randomNumber(-15, 15),
      },
      color: [1, 0, 0],
      angle: 0,
    });
  }
}

/*
 * Draw the cube
 * Get cube definition as param to set position, color and rotation offset (optionnal)
 */
function drawCube(phase, cube) {
  // Set cube translation and rotation (optionnal)
  const mWorld = new Matrix4();
  console.log(cube);
  mWorld.translate(cube.position.x, cube.position.y, cube.position.z);
  // gl.uniform3fv(info.cubeDef.uniforms.aColor, cube.color);
  gl.uniformMatrix4fv(info.cubeDef.uniforms.uWorldMatrix, false, mWorld.elements);

  selectCube();
  // gl.uniform3fv(info.cubeDef.uniforms.aPosition, cube.position);


  // Set all uniforms needed (cube color, matrices)
  // ..
  // info.cubeDef.aColor

  // Draw
  gl.drawElements(gl.TRIANGLES, info.cubeDef.indexCount, gl.UNSIGNED_BYTE, 0);
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
  render();
}


/*
 * Render routine
 * Invoke draw calls
 */
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Update angle for animation (ramp from 0 to 2.PI during info.period interval)
  const phase = ((Date.now() / 1000) % info.period) / info.period;

  // Move camera position continuously in [-20 .. 0], look far away on the Z axis (camera direction)
  const pz = Math.sin(2 * Math.PI * phase) * 10 - 10;

  const viewMatrix = getViewMatrix([0, 5, pz], [0, 0, 1000 + pz]);
  const projectionMatrix = getProjectionMatrix();
  gl.uniformMatrix4fv(info.cubeDef.uniforms.uViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(info.cubeDef.uniforms.uProjectionMatrix, false, projectionMatrix.elements);

  // Draw all the cubes cubes
  // drawCube(viewMatrix, projectionMatrix, phase)
  info.cubes.forEach(cube => drawCube(phase, cube))
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
