import { MaterialBuilder } from '../Engine/MaterialBuilder';
import { Component } from './Component.js';
import { Engine } from '../Engine/Engine.js';
import { Field } from './Field.js';
import { Grid } from './Grid.js';
import { Player } from './Player.js';

import { Board as SC_Board } from '../../api/HaseUndIgel';

export class Board implements Component {
  grid: Grid;
  fields: Field[];



  constructor() {
    this.fields = [];
    this.grid = new Grid(4, -20.5, -20.5, 0.1);
  }

  init(scene: BABYLON.Scene, materialBuilder: MaterialBuilder) {
    //Create ground mesh
    var ground: BABYLON.Mesh = BABYLON.Mesh.CreateGround("ground", 200, 200, 10, scene, false);
    ground.material = materialBuilder.getGrassMaterial();


    this.fields = new Array(65).fill(0, 0, 65).map((o, i) => {
      let s = this.grid.getGridCoordsFromFieldId(i);
      let c = this.grid.getScreenCoordsFromGrid(s.x, s.y);
      //console.log(`i: ${i}, s:(${s.x},${s.y}), c:(${c.x},${c.y})`);
      return new Field(i, c.x, c.y);
    });
    //Init all fields
    this.fields.forEach(f => f.init(scene, materialBuilder));
  }

  update(board: SC_Board, animated: boolean) {
    board.fields.forEach((type, index) => this.fields[index].update(type));
  }


}