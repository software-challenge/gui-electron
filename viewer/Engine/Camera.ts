///  <reference path="../../babylon.d.ts" />

export class Camera {
  camera: BABYLON.FollowCamera;
  cameraFocus: BABYLON.Mesh;

  constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
    this.cameraFocus = BABYLON.Mesh.CreateSphere("cameraFocus", 15, 0.1, scene, false, BABYLON.Mesh.DEFAULTSIDE);
    //this.cameraFocus.material = engine.materialBuilder.getRedMaterial();

    this.camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 0, 0), scene, this.cameraFocus);
    this.camera.radius = 30;
    this.camera.heightOffset = 70;
    this.camera.rotationOffset = 0;
    this.camera.cameraAcceleration = 0.03;
    this.camera.maxCameraSpeed = 20;

    scene.activeCamera = this.camera;
    scene.activeCamera.attachControl(canvas);
  }
}