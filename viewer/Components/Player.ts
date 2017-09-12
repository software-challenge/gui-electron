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

  private getSubmovesNew(start: number, end: number): number[] {
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

  private getSubmoves(start: number, end: number): ({ direction: "UP" | "LEFT" | "RIGHT" | "DOWN", from: number, to: number }[]) {
    let moves = [];

    let mc = (c, d) => ({ corner: c, direction: d });
    let directions = [mc(0, "RIGHT"), mc(10, "UP"), mc(20, "LEFT"), mc(30, "DOWN"), mc(38, "RIGHT"), mc(46, "UP"), mc(52, "LEFT"), mc(55, "DOWN"), mc(59, "LEFT"), mc(62, "UP")];

    //Find direction of field to start with
    let start_index = 0;
    while (start > directions[start_index].corner) {
      start_index++;
      if (start_index == directions.length - 1) {
        break;
      }
    }

    //Push first move
    if (start != directions[start_index].corner) {
      moves.push({
        direction: directions[start_index].direction,
        from: start,
        to: directions[start_index].corner
      });
    };

    //Find next corner and iterate
    let current_position = directions[start_index].corner;
    start_index++;
    let next_corner = directions[start_index].corner;

    while (next_corner < end) {
      moves.push({
        direction: directions[start_index].direction,
        from: current_position,
        to: directions[start_index].corner
      });
      current_position = directions[start_index].corner;
      start_index++;
      next_corner = directions[start_index].corner;
    }

    //Add last bit
    moves.push({
      direction: directions[start_index - 1].direction,
      from: current_position,
      to: end
    });

    return moves;
  }

  update(position: number, animated: boolean, animation_callback?: () => void) {
    var start = this.position;
    this.position = position
    var s = this.grid.getGridCoordsFromFieldId(this.position);
    var c = this.grid.getScreenCoordsFromGrid(s.x, s.y);
    if (!animated) {//Not animated, set straight ahead
      this.mesh.position.x = c.x;
      this.mesh.position.z = c.y;
      this.mesh.position.y = 1.5;
    } else {
      //Animated
      this.mesh.animations = [];
      if (this.position <= start) {//Jump backwards, go diagonally if necessary
        let anim = BABYLON.Animation.CreateAndStartAnimation("move_player_" + this.id, this.mesh, "position", Settings.Animation_FPS, Settings.Animation_Frames, this.mesh.position, new BABYLON.Vector3(c.x, 1.5, c.y), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, undefined, animation_callback);
      } else {
        let moves = this.getSubmovesNew(start, this.position);
        console.log(JSON.stringify(moves));
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
            console.log(move, start);
            BABYLON.Animation.CreateAndStartAnimation("move_player_" + this.id, this.mesh, "position", Settings.Animation_FPS, (move - start) * Settings.Animation_Frames_Per_Field, this.mesh.position, new BABYLON.Vector3(c.x, 1.5, c.y), BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, undefined, cb);
            start = move;
          }
        };
        movefn(moves, animation_callback);
      }
    }
  }
}