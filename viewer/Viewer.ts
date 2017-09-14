import { Game } from '../gui/Game';
///  <reference path="..//babylon.d.ts" />
import { Helpers } from "./Helpers";
import { Board } from './Components/Board';
import { Player } from './Components/Player';
import { Engine } from './Engine/Engine';
import { UI } from './Engine/UI';
import { GameState, PLAYERCOLOR } from '../api/HaseUndIgel';
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

  //UI
  ui: UI;
  gameFrame: Game;

  //Engine
  engine: Engine;
  board: Board;
  red: Player;
  blue: Player;
  initialization_steps_remaining: number;
  startup_timestamp: number;

  //Rendering
  rerenderControlActive: boolean;
  animating = false;
  lastRoundRendered: boolean = false;
  endscreenRendered: boolean = false;
  needsRerender: number;
  currentMove: number = 0;

  //
  constructor(element: HTMLElement, document: Document, window: Window, gameFrame: Game, rerenderControl: boolean = false, debug = false, framerateModifier = 1) {
    //Take time measurement for later performance analysis
    this.startup_timestamp = performance.now();
    this.gameFrame = gameFrame;

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

    //Debug
    element.appendChild(this.debug);

    this.engine = new Engine(this.canvas);
    this.engine.rerenderControlActive = rerenderControl;

    if (element.hasAttribute('fxaa')) {
      var fxaa_level: number = parseInt(element.getAttribute('fxaa'));
      this.engine.enableFXAA(fxaa_level);
    }


    this.board = new Board();
    this.board.init(this.engine.getScene(), this.engine.materialBuilder);

    this.red = new Player(0, 0, this.board.grid);
    this.blue = new Player(1, 0, this.board.grid);
    this.red.init(this.engine.getScene(), this.engine.materialBuilder);
    this.blue.init(this.engine.getScene(), this.engine.materialBuilder);

    //Display
    this.ui = new UI(this, this.engine, this.board, this.canvas, element, window, this.gameFrame);

    //
    //Attempt startup
    this.engine.startEngine();

    console.log("initializing viewer took " + (performance.now() - this.startup_timestamp) + "ms");
  }


  seekAndRender(state: GameState, animated: boolean = true) {
    this.gameFrame.setCurrentState(state);
    this.render(state, animated);
  }

  fatalGameError(message: string) {
    this.ui.showFatalError(message);
  }

  render(state: GameState, animated: boolean = true, animation_callback?: () => void) {
    this.ui.updateDisplay(state);
    this.board.update(state.board, animated);
    this.engine.startRerender();

    let done = {
      "red": false,
      "blue": false
    }

    let cb = (c: "red" | "blue") => {
      done[c] = true;
      if (done.red && done.blue && animation_callback) {
        animation_callback();
      }
    }

    this.red.update(state.red.index, animated, () => cb("red"));
    this.blue.update(state.blue.index, animated, () => cb("blue"));

    /*if (!this.gameFrame.isPlaying()) {
      // FIXME: setting this rerender stopper breaks the auto-playback
      setTimeout(() => this.engine.stopRerender(), 8000);
    }*/
  }

  stop() {
    this.engine.rerenderControlActive = true;
    this.engine.stopRerender();
  }


}
