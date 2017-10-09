///  <reference path="../../babylon.d.ts" />
///  <reference path="../../babylon-sky-material.d.ts" />

import { Camera } from './Camera.js';
import { MaterialBuilder } from './MaterialBuilder.js';
import { ShaderBuilder } from './ShaderBuilder.js';

export class Engine {
  engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  canvas: HTMLCanvasElement;
  shadow: BABYLON.ShadowGenerator;

  materialBuilder: MaterialBuilder;
  shaderBuilder: ShaderBuilder;

  skyMaterial: BABYLON.SkyMaterial;
  sunPosition: BABYLON.Vector3;

  camera: Camera;

  rerenderControlActive: boolean;
  private needsRerender: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new BABYLON.Engine(this.canvas, true);

    this.scene = new BABYLON.Scene(this.engine);

    this.materialBuilder = new MaterialBuilder(this.scene);

    this.camera = new Camera(this.scene, this.canvas);

    this.setupSky();

    this.setupLighting();

    //this.setupPointers();

    /*this.shaderBuilder = new ShaderBuilder(this);

    var test = BABYLON.Mesh.CreateSphere('test', 128, 56, this.scene, false);
    test.material = this.materialBuilder.getTexturedFieldMaterial("CARROT");
    console.log(test.material);
    /*test.material = this.shaderBuilder.standardShaderMaterial;*/

  }


  public enableFXAA(FXAALevel: number) {
    var postProcess = new BABYLON.FxaaPostProcess("fxaa", FXAALevel, this.camera.camera, null, this.engine, true);
    console.log("Activated " + FXAALevel + "x FXAA post-processing");
  }

  private setupPointers() {
    var width: number = 1;
    var x_line = BABYLON.Mesh.CreateCylinder('x_line', 20, width, width, 50, 10, this.scene);
    x_line.position.x = 10;
    x_line.material = this.materialBuilder.getRedMaterial();
    x_line.rotation.z = Math.PI / 2;

    var y_line = BABYLON.Mesh.CreateCylinder('y_line', 20, width, width, 50, 10, this.scene);
    y_line.position.y = 10;
    y_line.material = this.materialBuilder.getGrassMaterial();


    var z_line = BABYLON.Mesh.CreateCylinder('z_line', 20, width, width, 50, 10, this.scene);
    z_line.position.z = 10;
    z_line.material = this.materialBuilder.getBlueMaterial();
    z_line.rotation.x = Math.PI / 2;

  }

  private setupSky() {
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

  private setupLighting() {
    //Set up scene lighting
    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 100, 0), this.scene);
    //var light = new BABYLON.DirectionalLight('sun',new BABYLON.Vector3(0,-1,0),this.scene);
    light.specular = new BABYLON.Color3(0.1, 0.1, 0.1);
    light.diffuse = new BABYLON.Color3(0.8, 0.8, 0.8);
    var radius = 1, inclination = this.skyMaterial.luminance * Math.PI, azimuth = this.skyMaterial.azimuth * Math.PI * 2;
    var x = radius * Math.sin(inclination) * Math.cos(azimuth), y = radius * Math.sin(inclination) * Math.sin(azimuth), z = radius * Math.cos(inclination);

    /* var light0 = new BABYLON.DirectionalLight("Dir0", BABYLON.Vector3.Zero().subtract(this.sunPosition), this.scene);
     light0.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
     light0.specular = new BABYLON.Color3(0.9, 0.9, 0.9);
     this.shadow = new BABYLON.ShadowGenerator(1024, light0);
     this.shadow.filter = 0.2;*/
  }

  public startEngine() {
    this.engine.runRenderLoop(() => {
      if (this.needsRerender || (!this.rerenderControlActive)) {
        this.scene.render();
      }
    });
  }

  public stopEngine() {
    this.engine.stopRenderLoop();
  }

  public startRerender() {
    this.engine.resize();
    this.needsRerender = true;
  }

  public stopRerender() {
    this.needsRerender = false;
  }

  public getScene() {
    return this.scene;
  }

  private addListener(listener: (pickedFieldName: string) => void, eventType: number) {
    this.scene.onPointerObservable.add((ed, es) => {
      var pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
      if (pickResult.hit) {
        let pickedID = pickResult.pickedMesh.id;
        listener(pickedID);
      }
    }, eventType);
  }

  public addClickListener(listener: (pickedFieldName: string) => void) {
    console.log("adding click listener")
    this.addListener(listener, BABYLON.PointerEventTypes.POINTERPICK)
  }

  public addHoverListener(listener: (pickedFieldName: string) => void) {
    this.addListener(listener, BABYLON.PointerEventTypes.POINTERMOVE)
  }

}
