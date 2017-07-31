///  <reference path="..//babylon.d.ts" />
import { Helpers } from "./Helpers";
import { Board } from './Components/Board.js';
import { Player } from './Components/Player';
import { Engine } from './Engine/Engine';
import { GameState } from '../api/HaseUndIgel';
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
  board: Board;
  red: Player;
  blue: Player;
  initialization_steps_remaining: number;
  startup_timestamp: number;

  //Rendering
  rerenderControlActive: boolean;
  animationsPlayed: number = 0;
  lastRoundRendered: boolean = false;
  endscreenRendered: boolean = false;
  needsRerender: number;
  currentMove: number = 0;

  //
  constructor(element: Element, document: Document, window: Window, rerenderControl: boolean) {
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
    this.engine.rerenderControlActive = rerenderControl;



    if (element.hasAttribute('fxaa')) {
      var fxaa_level: number = parseInt(element.getAttribute('fxaa'));
      this.engine.enableFXAA(fxaa_level);
    }


    this.board = new Board();
    this.board.init(this.engine);

    this.red = new Player(0, 0, this.board.grid);
    this.blue = new Player(1, 0, this.board.grid);
    this.red.init(this.engine);
    this.blue.init(this.engine);

    //
    //Attempt startup
    this.engine.startEngine();

    console.log("initializing viewer took " + (performance.now() - this.startup_timestamp) + "ms");
  }






  render(state: GameState, animated: boolean) {
    this.engine.needsRerender = true;
    this.board.update(state.board, animated);
    this.red.update(state.red.index, animated);
    this.blue.update(state.blue.index, animated);
    console.log("updated state");
    setTimeout(() => this.engine.needsRerender = false, 2000);
  }

  stop() {
    this.engine.rerenderControlActive = true;
    this.engine.needsRerender = false;
  }
}