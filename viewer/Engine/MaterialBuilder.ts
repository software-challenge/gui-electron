///  <reference path="../../babylonjs/babylon.2.5.d.ts" />
///  <reference path="../../babylonjs/materialsLibrary/babylon.skyMaterial.d.ts" />

import { Engine } from './Engine.js';

export class MaterialBuilder {

  engine: Engine;

  private greenMaterial: BABYLON.StandardMaterial;
  private blueMaterial: BABYLON.StandardMaterial;
  private redMaterial: BABYLON.StandardMaterial;

  private fieldMaterial: BABYLON.StandardMaterial;

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

}