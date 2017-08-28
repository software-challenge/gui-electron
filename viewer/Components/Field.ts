import { Component } from './Component';
import { Engine } from '../Engine/Engine';
import { MaterialBuilder } from '../Engine/MaterialBuilder';
import { FIELDTYPE, Board } from '../../api/HaseUndIgel';

export class Field implements Component {
  highlight_mesh: BABYLON.Mesh;
  mesh: BABYLON.Mesh;
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


  init(engine: Engine) {
    this.highlight_mesh = BABYLON.MeshBuilder.CreateBox("highlight-field-" + this.id, { 'width': 4, 'depth': 4, 'height': 0.05 }, engine.scene);
    this.highlight_mesh.position.x = this.position.x;
    this.highlight_mesh.position.z = this.position.y;
    this.highlight_mesh.position.y = 0.01;
    this.highlight_mesh.material = engine.materialBuilder.getTransparentMaterial();

    this.mesh = BABYLON.MeshBuilder.CreateBox("field-" + this.id, { 'width': 4, 'depth': 4, 'height': 0.01 }, engine.scene);
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.y;
    this.mesh.rotation.y = (Math.PI / 2) * 3;
    this.mesh.material = engine.materialBuilder.getTransparentMaterial();

    this.materialBuilder = engine.materialBuilder;
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
      this.highlight = active;
      if (this.highlight == true) {
        this.highlight_mesh.material = this.materialBuilder.getHighlightMaterial(color);
      } else {
        this.highlight_mesh.material = this.materialBuilder.getTransparentMaterial();
      }
    }
  }
}