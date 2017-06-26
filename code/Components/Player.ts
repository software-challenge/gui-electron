import { Component } from './Component.js';
import { Engine } from '../Engine/Engine.js';

export class Player implements Component {
  mesh: BABYLON.Mesh;
  id: number;
  position: { x: number, y: number };

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.position = { x: x, y: y };
  }


  init(engine: Engine) {
    this.mesh = BABYLON.MeshBuilder.CreateBox("field-" + this.id, { 'width': 4, 'depth': 4, 'height': 1 }, engine.scene);
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.y;
    this.mesh.material = engine.materialBuilder.getFieldMaterial();
  }
}