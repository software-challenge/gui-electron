///  <reference path="../babylonjs/babylon.2.5.d.ts" />
///  <reference path="../babylonjs/babylon.2.5.canvas2d.d.ts" />
///  <reference path="../babylonjs/materialsLibrary/babylon.skyMaterial.d.ts" />
///  <reference path="../babylonjs/materialsLibrary/babylon.waterMaterial.d.ts" />
import { Helpers } from "./Helpers.js";

export class Viewer {
  //Path constants
  static PATH_PREFIX: string = "";
  static ASSET_PATH: string = Viewer.PATH_PREFIX + "assets";
  static TEXTURE_PATH: string = Viewer.PATH_PREFIX + "textures";
  //Display settings
  static ANIMATION_FRAMES: number = 30;
  debugActive: boolean;
  //DOM Elements

  canvas: HTMLCanvasElement;
  debug: HTMLDivElement;
  //Engine
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;
  shadow: BABYLON.ShadowGenerator;
  cameraFocus: BABYLON.Mesh;
  camera: BABYLON.FollowCamera;
  initialization_steps_remaining: number;
  startup_timestamp: number;
  //Players
  player1: BABYLON.Mesh;
  player2: BABYLON.Mesh;
  //Passengers
  passengers: BABYLON.Mesh[];
  //Rendering
  rerenderControlActive: boolean;
  animationsPlayed: number = 0;
  lastRoundRendered: boolean = false;
  endscreenRendered: boolean = false;
  needsRerender: number;
  currentMove: number = 0;
  tiles_to_sink: BABYLON.AbstractMesh[] = [];
  sunk_passengers: number[] = [];

  //
  constructor(element: Element, document: Document, window: Window) {
    //Take time measurement for later performance analysis
    this.startup_timestamp = performance.now();

    //Initialize engine startup dependency management
    this.initialization_steps_remaining = 0;

    //Initialize engine
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('viewerCanvas');
    element.appendChild(this.canvas);
    this.engine = new BABYLON.Engine(this.canvas, true);
    //
    //Debug-Display
    this.debugActive = element.hasAttribute('debug');
    this.debug = document.createElement('div');
    this.debug.classList.add('replay-debug');
    if (!this.debugActive) {
      this.debug.style.display = 'none';
    }
    window['printDebug'] = () => console.log(this);
    //
    //Rerender-control
    this.rerenderControlActive = element.hasAttribute('rerender-control');
    this.needsRerender = 1;
    window.addEventListener('blur', () => {
      this.needsRerender = 0;
    });
    window.addEventListener('focus', () => {
      this.needsRerender = 1;
    });
    //


    element.appendChild(this.debug);
    //
    //Initialize scene...
    this.scene = new BABYLON.Scene(this.engine);
    this.cameraFocus = BABYLON.Mesh.CreateSphere("cameraFocus", 15, 0.1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
    //this.camera = new BABYLON.ArcFollowCamera('camera', - 2 * Math.PI, 1, 35, this.cameraFocus, this.scene);
    this.camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 15, -125), this.scene, this.cameraFocus);
    this.camera.radius = 20;
    this.camera.heightOffset = 30;
    this.camera.rotationOffset = 90;
    this.camera.cameraAcceleration = 0.03;
    this.camera.maxCameraSpeed = 20;
    window['resetCamera'] = () => {
      /*this.camera.beta = -2 * Math.PI;
      this.camera.alpha = 1;
      this.camera.radius = 35;
      this.cameraFocus.position = new BABYLON.Vector3(0, 0, 0);
      this.camera.target = this.cameraFocus;*/
      this.camera.update();
      console.log(this.camera.position);
      console.log(this.camera.rotation);
    }



    this.scene.activeCamera = this.camera;
    this.scene.activeCamera.attachControl(this.canvas);

    if (element.hasAttribute('fxaa')) {
      var fxaa_level: number = parseInt(element.getAttribute('fxaa'));
      var postProcess = new BABYLON.FxaaPostProcess("fxaa", fxaa_level, this.camera, null, this.engine, true);
      console.log("Activated " + fxaa_level + "x FXAA post-processing");
    }
    //
    //Set up sky
    var luminance = Math.abs(Math.sin((new Date().getHours() / 24 * Math.PI) + Math.PI));
    luminance = 0.2;
    var skyMaterial = new BABYLON.SkyMaterial("skyMaterial", this.scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.turbidity = 10;
    skyMaterial.luminance = (1.179 - (1.179 * luminance)) + 0.1;
    skyMaterial.rayleigh = luminance * 2;
    skyMaterial.useSunPosition = true;
    var sunPosition = new BABYLON.Vector3(0, 0, 0);
    sunPosition.y = 1000 * luminance;
    sunPosition.x = -1500 + (1000 * luminance);
    skyMaterial.sunPosition = sunPosition;
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000, this.scene);
    skybox.material = skyMaterial;
    //
    //Set up scene lighting
    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 100, 0), this.scene);
    //var light = new BABYLON.DirectionalLight('sun',new BABYLON.Vector3(0,-1,0),this.scene);
    light.specular = new BABYLON.Color3(0.7, 0.7, 0.7);
    light.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
    var radius = 1, inclination = skyMaterial.luminance * Math.PI, azimuth = skyMaterial.azimuth * Math.PI * 2;
    var x = radius * Math.sin(inclination) * Math.cos(azimuth), y = radius * Math.sin(inclination) * Math.sin(azimuth), z = radius * Math.cos(inclination);

    var light0 = new BABYLON.DirectionalLight("Dir0", BABYLON.Vector3.Zero().subtract(sunPosition), this.scene);
    light0.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
    light0.specular = new BABYLON.Color3(0.9, 0.9, 0.9);
    this.shadow = new BABYLON.ShadowGenerator(1024, light0);
    this.shadow.filter = 0.2;





    //
    //Attempt startup
    this.startEngine();
  }

  startEngine() {
    if (this.initialization_steps_remaining == 0) {
      this.initialization_steps_remaining = -1;
      this.engine.runRenderLoop(() => {
        if (this.needsRerender > 0 || (!this.rerenderControlActive)) {
          //this.needsRerender --;
          //this.focus();
          this.scene.render();
          //this.camera.alpha += 0.003;
          if (this.debugActive) {
            this.debug.innerText = "currentRound: " + this.currentMove /*+ ", α: " + this.camera.alpha.toString() + ", β: " + this.camera.beta.toString()*/ + ", (x,y,z): " + this.camera.position.x + "," + this.camera.position.y + "," + this.camera.position.z + ", needsRerender: " + this.needsRerender.toString();
          }
          if (this.scene.meshUnderPointer) {
            //this.debug.innerText = this.scene.meshUnderPointer.name;
          }
        }
      });
      window.addEventListener('resize', () => {
        this.engine.resize();
      });

      window.addEventListener("click", () => {
        var pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        if (pickResult.hit) {
          console.log(pickResult.pickedMesh.id);
        }
      });

      console.log("initializing viewer took " + (performance.now() - this.startup_timestamp) + "ms");
      this.render(null, false);
    }
  }





  render(state: GameState, animated: boolean) {

  }
}

class GameState {
  something: number;
}