///  <reference path="..//babylon.d.ts" />
import { Helpers } from "./Helpers.js";
import { Board } from './Components/Board.js';
import { Engine } from './Engine/Engine.js';

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
  engine: Engine;

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

    //Initialize engine
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('viewerCanvas');
    element.appendChild(this.canvas);
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




    this.engine = new Engine(this.canvas);



    if (element.hasAttribute('fxaa')) {
      var fxaa_level: number = parseInt(element.getAttribute('fxaa'));
      this.engine.enableFXAA(fxaa_level);
    }


    var b: Board = new Board();
    b.init(this.engine);

    //
    //Attempt startup
    this.engine.startEngine();

    console.log("initializing viewer took " + (performance.now() - this.startup_timestamp) + "ms");
  }






  render(state: GameState, animated: boolean) {

  }
}

class GameState {
  something: number;
}