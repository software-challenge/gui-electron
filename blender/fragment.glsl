precision highp float;

varying vec2 v_uv;
varying vec3 v_nor;

uniform vec3 sun;

uniform sampler2D diffuse;

void main(){
  vec3 n_nor = normalize(v_nor);
  vec4 tex_col = texture2D(diffuse, v_uv);
  vec3 ilumination = vec3(clamp(dot(normalize(sun), -n_nor), 0.0, 1.0));
  gl_FragColor = vec4(tex_col.rgb * ilumination, 1.0);
}