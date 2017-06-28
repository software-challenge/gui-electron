import { Component } from './Component.js';
import { Engine } from '../Engine/Engine.js';
import { Grid } from './Grid.js';

export class Player implements Component {
  mesh: BABYLON.Mesh;
  id: number;
  position: number;
  grid: Grid;

  constructor(id: number, position: number, grid: Grid) {
    this.id = id;
    this.position = position;
    this.grid = grid;
  }


  init(engine: Engine) {
    this.mesh = BABYLON.Mesh.CreateSphere('player-' + this.id, 16, 3, engine.scene);
    var s = this.grid.getGridCoordsFromFieldId(this.position);
    var c = this.grid.getScreenCoordsFromGrid(s.x, s.y);
    this.mesh.position.x = c.x;
    this.mesh.position.z = c.y;
    this.mesh.position.y = 1.5;
    this.mesh.material = (this.id == 0) ? engine.materialBuilder.getRedMaterial() : engine.materialBuilder.getBlueMaterial();
    console.log("Created player " + this.id);
  }
}