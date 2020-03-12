/*
 * JavaScript WebGL Shader utils
 *
 * Copyright 2018, Yann Gilquin
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */


export function createShader(gl, source, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);

  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var log = gl.getShaderInfoLog(shader);
    throw "Shader compilation failed\n\n" + log + "\n\n" + dumpShaderSrc(source);
  }

  return shader;
}

export function initShaders(gl, vShaderSrc, fShaderSrc) {
  var vShader = createShader(gl, vShaderSrc, gl.VERTEX_SHADER);
  var fShader = createShader(gl, fShaderSrc, gl.FRAGMENT_SHADER);

  var program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);

  gl.linkProgram(program);
  gl.validateProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var log = gl.getProgramInfoLog(program);
    throw "Program link failed\n\n" + log;
  }

  gl.useProgram(program);

  // Expose program in gl context for any reference need
  gl.program = program;
}

export function dumpShaderSrc(source) {
  var formatLine = function (current, index, array) {
    return (index + 1).toString().padStart(3) + " " + current;
  };

  var lines = shaderStringToArray(source);
  return shaderArrayToString(lines.map(formatLine));
}

function shaderArrayToString(array) {
  return array.join("\n");
}

function shaderStringToArray(string) {
  return string.split("\n");
}
