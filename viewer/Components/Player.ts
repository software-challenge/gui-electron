import { MaterialBuilder } from '../Engine/MaterialBuilder';
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


  init(scene: BABYLON.Scene, materialBuilder: MaterialBuilder) {
    //BABYLON.SceneLoader.ImportMesh("Suzanne", "assets", "hare.babylon", scene, (newMeshes, particleSystems) => {
    // this.mesh = <BABYLON.Mesh>newMeshes[0];
    this.mesh = BABYLON.Mesh.CreateSphere('player-' + this.id, 16, 3, scene);
    var s = this.grid.getGridCoordsFromFieldId(this.position);
    var c = this.grid.getScreenCoordsFromGrid(s.x, s.y);
    this.mesh.position.x = c.x;
    this.mesh.position.z = c.y;
    this.mesh.position.y = 1.5;
    this.mesh.material = (this.id == 0) ? materialBuilder.getRedMaterial() : materialBuilder.getBlueMaterial();
    console.log("Created player " + this.id);
  }

  update(position: number, animated: boolean) {
    this.position = position
    var s = this.grid.getGridCoordsFromFieldId(this.position);
    var c = this.grid.getScreenCoordsFromGrid(s.x, s.y);
    this.mesh.position.x = c.x;
    this.mesh.position.z = c.y;
    this.mesh.position.y = 1.5;
  }
}