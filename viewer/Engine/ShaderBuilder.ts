///  <reference path="../../babylon.d.ts" />

import { Engine } from './Engine.js';

export class ShaderBuilder {

  engine: Engine;

  standardShaderMaterial: BABYLON.ShaderMaterial;

  constructor(engine: Engine) {
    this.engine = engine;
    this.standardShaderMaterial = this.createStandardShaderMaterial();
  }

  private createStandardShaderMaterial(): BABYLON.ShaderMaterial {
    this.appendShaderNode('vertexStandard', this.shaderTypes.vertex, this.standardVertexShaderString);
    this.appendShaderNode('fragmentStandard', this.shaderTypes.fragment, this.standardFragmentShaderString);
    var s = new BABYLON.ShaderMaterial('standardShader', this.engine.scene, {
      vertexElement: 'vertexStandard',
      fragmentElement: 'fragmentStandard'
    }, {
        attributes: ["position", "uv"],
        uniforms: ["worldViewProjection"]
      }
    );
    s.setVector4('vColor', new BABYLON.Vector4(0, 0, 1, 1));
    return s;
  }

  private appendShaderNode(name: string, type: string, content: string) {
    var document = window.document;
    var shaderNode = document.createElement('script');
    shaderNode.setAttribute('type', 'application/' + type);
    shaderNode.setAttribute('id', name);
    shaderNode.innerHTML = content;
    document.body.appendChild(shaderNode);
  }

  private shaderTypes = { vertex: 'vertexShader', fragment: 'fragmentShader' };

  private standardVertexShaderString = `
        precision highp float;
 
        // Attributes
        attribute vec3 position;
        attribute vec2 uv;
 
        // Uniforms
        uniform mat4 worldViewProjection;
 
        // Normal
        varying vec2 vUV;
        varying vec4 vColor;
 
        void main(void) {
          gl_Position = worldViewProjection * vec4(position, 1.0);
 
          vUV = uv;

        }
  `;

  private standardFragmentShaderString = `
        precision highp float;
        varying vec2 vUV;
        varying vec4 vColor;

        uniform sampler2D textureSampler;

        void main(void) {
          gl_FragColor = vColor;
        }
  `;
}