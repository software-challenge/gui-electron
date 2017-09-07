///  <reference path="../../babylon.d.ts" />
///  <reference path="../../babylon-sky-material.d.ts" />

import { Engine } from './Engine';
import { FIELDTYPE, Board } from '../../api/HaseUndIgel';

export class MaterialBuilder {

  private grassMaterial: BABYLON.StandardMaterial;
  private blueMaterial: BABYLON.StandardMaterial;
  private redMaterial: BABYLON.StandardMaterial;

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

    this.highlightedFields = new BABYLON.HighlightLayer("field-highlight-layer", scene);

    this.transparentMaterial = new BABYLON.StandardMaterial("transparentmaterial", scene);
    this.transparentMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    this.transparentMaterial.alpha = 0;

    this.texturedFieldMaterials = new Map<string, BABYLON.StandardMaterial>();

    for (let fieldtype in Board.Fieldtype) {
      let fm = new BABYLON.StandardMaterial(Board.Fieldtype[fieldtype] + "material", scene);
      fm.diffuseTexture = new BABYLON.Texture("assets/" + fieldtype + ".png", scene);
      fm.specularTexture = fm.diffuseTexture;
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