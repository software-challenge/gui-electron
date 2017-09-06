///  <reference path="../../babylon.d.ts" />
///  <reference path="../../babylon-sky-material.d.ts" />

import { Engine } from './Engine';
import { FIELDTYPE, Board } from '../../api/HaseUndIgel';

export class MaterialBuilder {

  private grassMaterial: BABYLON.StandardMaterial;
  private blueMaterial: BABYLON.StandardMaterial;
  private redMaterial: BABYLON.StandardMaterial;

  private highlightMaterialRed: BABYLON.StandardMaterial;
  private highlightMaterialBlue: BABYLON.StandardMaterial;

  private transparentMaterial: BABYLON.StandardMaterial;

  private texturedFieldMaterials: Map<string, BABYLON.StandardMaterial>;

  private highlightedFields: BABYLON.HighlightLayer;

  constructor(scene: BABYLON.Scene) {

    this.grassMaterial = new BABYLON.StandardMaterial("grassPlane", scene);
    let grassTexture = new BABYLON.Texture("assets/grass.jpg", scene);
    grassTexture.uScale = 15.0;
    grassTexture.vScale = 15.0;
    this.grassMaterial.diffuseTexture = grassTexture;
    this.grassMaterial.backFaceCulling = false;//Always show the front and the back of an element

    this.redMaterial = new BABYLON.StandardMaterial("redMaterial", scene);
    this.redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);

    this.blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
    this.blueMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1);

    this.highlightMaterialRed = new BABYLON.StandardMaterial("highlightmaterialred", scene);
    let highlightTexture = new BABYLON.Texture("assets/highlight_field.png", scene);
    highlightTexture.uScale = 1.0;
    highlightTexture.vScale = 1.0;
    highlightTexture.hasAlpha = true;
    this.highlightMaterialRed.diffuseTexture = highlightTexture;
    this.highlightMaterialRed.useAlphaFromDiffuseTexture = true;

    this.highlightedFields = new BABYLON.HighlightLayer("field-highlight-layer", scene);

    this.highlightMaterialBlue = new BABYLON.StandardMaterial("highlightmaterialredblue", scene);
    this.highlightMaterialBlue.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
    this.highlightMaterialBlue.alpha = 0.5;

    this.transparentMaterial = new BABYLON.StandardMaterial("transparentmaterial", scene);
    this.transparentMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    this.transparentMaterial.alpha = 0;

    this.texturedFieldMaterials = new Map<string, BABYLON.StandardMaterial>();

    for (let fieldtype in Board.Fieldtype) {
      let fm = new BABYLON.StandardMaterial(Board.Fieldtype[fieldtype] + "material", scene);
      fm.diffuseTexture = new BABYLON.Texture("assets/" + fieldtype + ".png", scene);
      fm.specularTexture = fm.diffuseTexture;
      console.log("Loaded texture for " + Board.Fieldtype[fieldtype] + " (" + "assets/" + fieldtype + ".png" + ")");
      this.texturedFieldMaterials.set(Board.Fieldtype[fieldtype], fm);
    }

  }


  getGrassMaterial(): BABYLON.StandardMaterial {
    return this.grassMaterial;
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

  getHighlightingLayer(): BABYLON.HighlightLayer {
    return this.highlightedFields;
  }

  getTexturedFieldMaterial(fieldtype: FIELDTYPE) {
    if (!this.texturedFieldMaterials.get(fieldtype)) {
      console.log("UNKNOWN FIELDTYPE:  " + fieldtype);
    }
    return this.texturedFieldMaterials.get(fieldtype);
  }

}