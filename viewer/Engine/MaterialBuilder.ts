///  <reference path="../../babylon.d.ts" />
///  <reference path="../../babylon-sky-material.d.ts" />

import { Engine } from './Engine';
import { FIELDTYPE, Board } from '../../api/HaseUndIgel';

export class MaterialBuilder {

  engine: Engine;

  private greenMaterial: BABYLON.StandardMaterial;
  private blueMaterial: BABYLON.StandardMaterial;
  private redMaterial: BABYLON.StandardMaterial;

  private fieldMaterial: BABYLON.StandardMaterial;

  private texturedFieldMaterials: Map<string, BABYLON.StandardMaterial>;

  constructor(engine: Engine) {
    this.engine = engine;

    this.greenMaterial = new BABYLON.StandardMaterial("greenMaterial", engine.scene);
    this.greenMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);

    this.redMaterial = new BABYLON.StandardMaterial("redMaterial", engine.scene);
    this.redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);

    this.blueMaterial = new BABYLON.StandardMaterial("blueMaterial", engine.scene);
    this.blueMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1);

    this.fieldMaterial = new BABYLON.StandardMaterial("groundmaterial", engine.scene);
    this.fieldMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    this.fieldMaterial.alpha = 0.7;

    this.texturedFieldMaterials = new Map<string, BABYLON.StandardMaterial>();

    for (let fieldtype in Board.Fieldtype) {
      let fm = new BABYLON.StandardMaterial(Board.Fieldtype[fieldtype] + "material", engine.scene);
      fm.diffuseTexture = new BABYLON.Texture("assets/" + fieldtype + ".png", engine.scene);
      fm.specularTexture = fm.diffuseTexture;
      console.log("Loaded texture for " + Board.Fieldtype[fieldtype] + " (" + "assets/" + fieldtype + ".png" + ")");
      this.texturedFieldMaterials.set(Board.Fieldtype[fieldtype], fm);
    }

  }


  getGreenMaterial(): BABYLON.StandardMaterial {
    return this.greenMaterial;
  }
  getRedMaterial(): BABYLON.StandardMaterial {
    return this.redMaterial;
  }
  getBlueMaterial(): BABYLON.StandardMaterial {
    return this.blueMaterial;
  }

  getFieldMaterial(): BABYLON.StandardMaterial {
    return this.fieldMaterial;
  }

  getHighlightAlpha(): number {
    return this.fieldMaterial.alpha;
  }

  getTexturedFieldMaterial(fieldtype: FIELDTYPE) {
    if (!this.texturedFieldMaterials.get(fieldtype)) {
      console.log("UNKNOWN FIELDTYPE:  " + fieldtype);
    }
    return this.texturedFieldMaterials.get(fieldtype);
  }

}