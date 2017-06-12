import { Component } from './Component.js';
import { Engine } from '../Engine/Engine.js';

export class Board implements Component {
  init(engine: Engine) {
    var ground: BABYLON.Mesh = BABYLON.Mesh.CreateGround("ground", 100, 100, 10, engine.scene, false);
    var groundmaterial = new BABYLON.StandardMaterial("groundmaterial", engine.scene);
    groundmaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    ground.material = groundmaterial;
    console.log(ground);
  }
}