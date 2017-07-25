///  <reference path="../../babylonjs/babylon.2.5.d.ts" />
///  <reference path="../../babylonjs/materialsLibrary/babylon.skyMaterial.d.ts" />

import { Engine } from './Engine.js';

export class Camera {
  camera: BABYLON.FollowCamera;
  cameraFocus: BABYLON.Mesh;
  engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
    this.cameraFocus = BABYLON.Mesh.CreateSphere("cameraFocus", 15, 0.1, this.engine.scene, false, BABYLON.Mesh.DEFAULTSIDE);

    this.camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 0, 0), this.engine.scene, this.cameraFocus);
    this.camera.radius = 120;
    this.camera.heightOffset = 100;
    this.camera.rotationOffset = 0;
    this.camera.cameraAcceleration = 0.03;
    this.camera.maxCameraSpeed = 20;

    this.engine.scene.activeCamera = this.camera;
    this.engine.scene.activeCamera.attachControl(this.engine.canvas);
  }
}