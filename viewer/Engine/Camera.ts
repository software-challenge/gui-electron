///  <reference path="../../babylon.d.ts" />

import { Engine } from './Engine.js';

export class Camera {
  camera: BABYLON.FollowCamera;
  cameraFocus: BABYLON.Mesh;
  engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
    this.cameraFocus = BABYLON.Mesh.CreateSphere("cameraFocus", 15, 0.1, this.engine.scene, false, BABYLON.Mesh.DEFAULTSIDE);
    //this.cameraFocus.material = engine.materialBuilder.getRedMaterial();

    this.camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 0, 0), this.engine.scene, this.cameraFocus);
    this.camera.radius = 30;
    this.camera.heightOffset = 70;
    this.camera.rotationOffset = 0;
    this.camera.cameraAcceleration = 0.03;
    this.camera.maxCameraSpeed = 20;

    this.engine.scene.activeCamera = this.camera;
    this.engine.scene.activeCamera.attachControl(this.engine.canvas);
  }
}