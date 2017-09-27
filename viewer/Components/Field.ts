import { Component } from './Component';
import { Engine } from '../Engine/Engine';
import { MaterialBuilder } from '../Engine/MaterialBuilder';
import { FIELDTYPE, Board } from '../../api/rules/HaseUndIgel';

export class Field implements Component {
  private mesh: BABYLON.Mesh;
  id: number;
  position: { x: number, y: number };
  type: FIELDTYPE;
  materialBuilder: MaterialBuilder;
  highlight: boolean;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.position = { x: x, y: y };
    this.highlight = false;
  }


  init(scene: BABYLON.Scene, materialBuilder: MaterialBuilder) {
    this.mesh = BABYLON.MeshBuilder.CreateBox("field-" + this.id, { 'width': 4, 'depth': 4, 'height': 0.01 }, scene);
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.y;
    this.mesh.rotation.y = (Math.PI / 2) * 3;
    this.mesh.material = materialBuilder.getTransparentMaterial();

    this.materialBuilder = materialBuilder;
    this.setHighlight(false);
  }

  update(type: FIELDTYPE) {
    if (this.type != type) {
      this.type = type;
      this.mesh.material = this.materialBuilder.getTexturedFieldMaterial(this.type);
    }
  }

  setHighlight(active: boolean, color: "red" | "blue" = "red") {
    if (this.highlight != active) {
      let highlightColor = color == "red" ? BABYLON.Color3.Red() : BABYLON.Color3.Blue();
      this.highlight = active;
      if (this.highlight == true) {
        this.materialBuilder.getHighlightingLayer().addMesh(this.mesh, highlightColor);
      } else {
        this.materialBuilder.getHighlightingLayer().removeMesh(this.mesh);
      }
    }
  }
}