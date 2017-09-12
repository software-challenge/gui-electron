import { MaterialBuilder } from '../Engine/MaterialBuilder';
import { Component } from './Component.js';
import { Engine } from '../Engine/Engine.js';
import { Grid } from './Grid.js';
import { Settings } from '../Settings';

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

  private getSubmoves(start: number, end: number): number[] {
    let corners = [0, 10, 20, 30, 38, 46, 52, 55, 59, 62];
    let moves = [];
    let position = start;
    while (position < end) {
      position++;
      if (corners.indexOf(position) != -1) {
        moves.push(position);
      }
    }
    if (moves[moves.length - 1] != end) {
      moves.push(end);
    }
    return moves;
  }


  update(position: number, animated: boolean, animation_callback?: () => void) {
    var start = this.position;
    this.position = position
    if (this.position == start) {
      if (animation_callback) {
        animation_callback();
      }
      return;
    }
    var s = this.grid.getGridCoordsFromFieldId(this.position);
    var c = this.grid.getScreenCoordsFromGrid(s.x, s.y);
    if (!animated) {//Not animated, set straight ahead
      this.mesh.position.x = c.x;
      this.mesh.position.z = c.y;
      this.mesh.position.y = 1.5;
      if (animation_callback) {
        animation_callback();
      }
    } else {
      //Animated
      this.mesh.animations = [];
      if (this.position <= start) {//Jump backwards, go diagonally if necessary
        console.log(`Jump backwards from ${start} to ${this.position}`);
        let anim = BABYLON.Animation.CreateAndStartAnimation("move_player_" + this.id, this.mesh, "position", Settings.Animation_FPS, Math.abs((this.position - start)) * Settings.Animation_Frames_Per_Field, this.mesh.position, new BABYLON.Vector3(c.x, 1.5, c.y), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, undefined, animation_callback);
      } else {
        let moves = this.getSubmoves(start, this.position);
        console.log(`Move forward from ${start} to ${this.position} has ${moves.length} submove${moves.length > 1 ? 's' : ''}`);
        let movefn = (moves, callback) => {
          if (moves.length == 0) {
            if (callback) {
              callback();
            }
          } else {
            var move = moves.shift();
            var s = this.grid.getGridCoordsFromFieldId(move);
            var c = this.grid.getScreenCoordsFromGrid(s.x, s.y);
            let cb = function () {
              movefn(moves, callback)
            }
            console.log(`Submove from ${start} to ${move}`);
            BABYLON.Animation.CreateAndStartAnimation("move_player_" + this.id + "_" + (new Date().getTime), this.mesh, "position", Settings.Animation_FPS, Math.abs((move - start)) * Settings.Animation_Frames_Per_Field, this.mesh.position, new BABYLON.Vector3(c.x, 1.5, c.y), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, undefined, cb);
            start = move;
          }
        };
        movefn(moves, animation_callback);
      }
    }
  }
}