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

  init(engine: Engine) {
    //Create ground mesh
    var ground: BABYLON.Mesh = BABYLON.Mesh.CreateGround("ground", 100, 100, 10, engine.scene, false);
    ground.material = engine.materialBuilder.getGreenMaterial();


    this.fields = new Array(65).fill(0, 0, 65).map((o, i) => {
      let s = this.grid.getGridCoordsFromFieldId(i);
      let c = this.grid.getScreenCoordsFromGrid(s.x, s.y);
      //console.log(`i: ${i}, s:(${s.x},${s.y}), c:(${c.x},${c.y})`);
      return new Field(i, c.x, c.y);
    });
    //Init all fields
    this.fields.forEach(f => f.init(engine));



  }

  update(board: SC_Board, animated: boolean) {

  }


}