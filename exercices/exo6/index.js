import { setupWebGL } from '../../lib/webgl-utils';
import { initShaders } from '../../lib/webgl-shader-utils';
import './style.scss';

const canvas = document.getElementById("canvas");
const gl = setupWebGL(canvas);

let VERTEX_SHADER = `
  attribute vec2 aPosition;

  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 200.0;
  }
`;

let FRAGMENT_SHADER = `
  #define center vec2(0.5)
  #define d distance(gl_PointCoord.xy, center)
  
  precision mediump float;
  uniform vec3 uColor;
  uniform float uSmooth;
 
  void main() {
    gl_FragColor.rgb = uColor * (1. - smoothstep(0.5 - uSmooth, 0.5, d));
    gl_FragColor.a = 1.0;
  }
`;

initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER);

const aPosition = gl.getAttribLocation(gl.program, "aPosition");
const uSmooth = gl.getUniformLocation(gl.program, "uSmooth");
const uColor = gl.getUniformLocation(gl.program, "uColor");

function animate() {
  render();
  requestAnimationFrame(animate);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.vertexAttrib2f(aPosition, -0.5, 0.0);
  gl.uniform1f(uSmooth, 0);
  gl.uniform3f(uColor, 0.0, 0.0, 0.8);
  gl.drawArrays(gl.POINTS, 0, 1);

  gl.vertexAttrib2f(aPosition, 0.5, 0.0);
  gl.uniform3f(uColor, 0.0, 0.8, 0.0);
  gl.uniform1f(uSmooth, 0.2);

  gl.drawArrays(gl.POINTS, 0, 1);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, 1);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

resize();
animate();

window.addEventListener('resize', resize);
