///  <reference path="../../babylonjs/babylon.2.5.d.ts" />
///  <reference path="../../babylonjs/materialsLibrary/babylon.skyMaterial.d.ts" />


export class Engine {
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;
  camera: BABYLON.FollowCamera;
  canvas: HTMLCanvasElement;
  shadow: BABYLON.ShadowGenerator;
  cameraFocus: BABYLON.Mesh;

  skyMaterial: BABYLON.SkyMaterial;
  sunPosition: BABYLON.Vector3;

  rerenderControlActive: boolean;
  needsRerender: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new BABYLON.Engine(this.canvas, true);

    this.scene = new BABYLON.Scene(this.engine);

    this.setupCamera();

    this.setupSky();

    this.setupLighting();
  }

  setupCamera() {
    this.camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 0, 0), this.scene, this.cameraFocus);
    this.camera.radius = 60;
    this.camera.heightOffset = 60;
    this.camera.rotationOffset = 180;
    this.camera.cameraAcceleration = 0.03;
    this.camera.maxCameraSpeed = 20;

    this.scene.activeCamera = this.camera;
    this.scene.activeCamera.attachControl(this.canvas);
    this.cameraFocus = BABYLON.Mesh.CreateSphere("cameraFocus", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);

  }

  enableFXAA(FXAALevel: number) {
    var postProcess = new BABYLON.FxaaPostProcess("fxaa", FXAALevel, this.camera, null, this.engine, true);
    console.log("Activated " + FXAALevel + "x FXAA post-processing");
  }

  setupSky() {
    //Set up sky
    var luminance = Math.abs(Math.sin((new Date().getHours() / 24 * Math.PI) + Math.PI));
    luminance = 0.2;
    this.skyMaterial = new BABYLON.SkyMaterial("skyMaterial", this.scene);
    this.skyMaterial.backFaceCulling = false;
    this.skyMaterial.turbidity = 10;
    this.skyMaterial.luminance = (1.179 - (1.179 * luminance)) + 0.1;
    this.skyMaterial.rayleigh = luminance * 2;
    this.skyMaterial.useSunPosition = true;
    this.sunPosition = new BABYLON.Vector3(0, 0, 0);
    this.sunPosition.y = 1000 * luminance;
    this.sunPosition.x = -1500 + (1000 * luminance);
    this.skyMaterial.sunPosition = this.sunPosition;
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000, this.scene);
    skybox.material = this.skyMaterial;
  }

  setupLighting() {
    //Set up scene lighting
    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 100, 0), this.scene);
    //var light = new BABYLON.DirectionalLight('sun',new BABYLON.Vector3(0,-1,0),this.scene);
    light.specular = new BABYLON.Color3(0.7, 0.7, 0.7);
    light.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
    var radius = 1, inclination = this.skyMaterial.luminance * Math.PI, azimuth = this.skyMaterial.azimuth * Math.PI * 2;
    var x = radius * Math.sin(inclination) * Math.cos(azimuth), y = radius * Math.sin(inclination) * Math.sin(azimuth), z = radius * Math.cos(inclination);

    var light0 = new BABYLON.DirectionalLight("Dir0", BABYLON.Vector3.Zero().subtract(this.sunPosition), this.scene);
    light0.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
    light0.specular = new BABYLON.Color3(0.9, 0.9, 0.9);
    this.shadow = new BABYLON.ShadowGenerator(1024, light0);
    this.shadow.filter = 0.2;
  }

  startEngine() {
    this.engine.runRenderLoop(() => {
      if (this.needsRerender || (!this.rerenderControlActive)) {
        this.scene.render();
      }
    });

    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }


}