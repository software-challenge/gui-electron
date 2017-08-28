///  <reference path="../../babylon.d.ts" />
///  <reference path="../../babylon-sky-material.d.ts" />

import { Engine } from './Engine';
import { FIELDTYPE, Board } from '../../api/HaseUndIgel';

export class MaterialBuilder {

  engine: Engine;

  private greenMaterial: BABYLON.StandardMaterial;
  private blueMaterial: BABYLON.StandardMaterial;
  private redMaterial: BABYLON.StandardMaterial;

  private highlightMaterialRed: BABYLON.StandardMaterial;
  private highlightMaterialBlue: BABYLON.StandardMaterial;

  private transparentMaterial: BABYLON.StandardMaterial;

  private texturedFieldMaterials: Map<string, BABYLON.StandardMaterial>;

  constructor(engine: Engine) {
    this.engine = engine;

    this.greenMaterial = new BABYLON.StandardMaterial("greenMaterial", engine.scene);
    this.greenMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);

    this.redMaterial = new BABYLON.StandardMaterial("redMaterial", engine.scene);
    this.redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);

    this.blueMaterial = new BABYLON.StandardMaterial("blueMaterial", engine.scene);
    this.blueMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1);

    this.highlightMaterialRed = new BABYLON.StandardMaterial("highlightmaterialred", engine.scene);
    this.highlightMaterialRed.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5);
    this.highlightMaterialRed.alpha = 0.5;


    this.highlightMaterialBlue = new BABYLON.StandardMaterial("highlightmaterialredblue", engine.scene);
    this.highlightMaterialBlue.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
    this.highlightMaterialBlue.alpha = 0.5;

    this.transparentMaterial = new BABYLON.StandardMaterial("transparentmaterial", engine.scene);
    this.transparentMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    this.transparentMaterial.alpha = 0;

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

  getHighlightMaterial(color: "red" | "blue"): BABYLON.StandardMaterial {
    if (color == "red") {
      return this.highlightMaterialRed;
    } else {
      return this.highlightMaterialRed;
    }
  }

  getTransparentMaterial(): BABYLON.StandardMaterial {
    return this.transparentMaterial;
  }


  getTexturedFieldMaterial(fieldtype: FIELDTYPE) {
    if (!this.texturedFieldMaterials.get(fieldtype)) {
      console.log("UNKNOWN FIELDTYPE:  " + fieldtype);
    }
    return this.texturedFieldMaterials.get(fieldtype);
  }

}