///  <reference path="../node_modules/babylonjs/babylon.d.ts" />
import {Replay} from "./Replay";
import {Helpers} from "./Helpers";

export class Viewer{
    replay: Replay;
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene:  BABYLON.Scene;
    camera: BABYLON.ArcRotateCamera;

    debug: HTMLDivElement;

    fields: BABYLON.Mesh[];

    constructor(replay: Replay, element: Element, document: Document, window: Window){
        //Save replay for later
        this.replay = replay;
        //Initialize engine
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('viewerCanvas');
        this.debug = document.createElement('div');
        this.debug.classList.add('debug');
        element.appendChild(this.canvas);
        element.appendChild(this.debug);
        this.engine = new BABYLON.Engine(this.canvas, true);
        //Initialize scene
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.ArcRotateCamera('camera1',Math.PI, Math.PI, 10,new BABYLON.Vector3(0,0,0),this.scene);
        this.camera.attachControl(this.canvas, false);
        this.camera.setPosition(new BABYLON.Vector3(3,3,15));
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0),this.scene);
        var sphere = BABYLON.Mesh.CreateSphere('sphere1',6,2,this.scene);
        sphere.position.y = 1;
        var cyl = BABYLON.Mesh.CreateCylinder('cyl',1.5,1.5,1.5,6,1,this.scene, false,BABYLON.Mesh.DEFAULTSIDE);
        cyl.position.x = 0.7;
        var ground = BABYLON.Mesh.CreateGround('ground1', 400,400,1,this.scene);
        var groundmaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene);
        groundmaterial.diffuseColor = new BABYLON.Color3(0.1,0.1,0.2);
        groundmaterial.specularColor = new BABYLON.Color3(1,1,1);
        ground.material = groundmaterial;
        this.camera.beta  = 1;
        this.engine.runRenderLoop(() =>{
            this.scene.render();
            this.camera.alpha += 0.003;
            this.debug.innerText = "α: " + this.camera.alpha.toString() + ", β: " + this.camera.beta.toString();
        });
        window.addEventListener('resize', () => {
            this.engine.resize();
        })
    }


}