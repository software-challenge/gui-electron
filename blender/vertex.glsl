attribute vec3 pos;
attribute vec2 uv;
attribute vec3 nor;

varying vec2 v_uv;
varying vec3 v_nor;

uniform mat4 viewMatrix;
uniform mat4 worldMatrix;

void main () {
  v_uv = uv;
  v_nor = (worldMatrix * vec4(nor, 0.0)).xyz;
  gl_Position = viewMatrix * worldMatrix * vec4(pos, 1.0);
}