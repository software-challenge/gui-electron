
import { Engine } from './Engine';
import { Board } from '../Components/Board';
import { Field } from '../Components/Field';

import { GameState, GameResult, Player as SC_Player, Card } from '../../api/HaseUndIgel';
import { GameRuleLogic } from '../../api/HaseUndIgelGameRules';

export class UI {
  interactive: "off" | "red" | "blue";
  private engine: Engine;
  private board: Board;
  private display: {
    root: HTMLDivElement,
    red: {
      root: HTMLDivElement,
      carrots: HTMLDivElement,
      salads: HTMLDivElement,
      cards: HTMLDivElement
    },
    blue: {
      root: HTMLDivElement,
      carrots: HTMLDivElement,
      salads: HTMLDivElement,
      cards: HTMLDivElement
    },
    round: HTMLDivElement,
    progress: {
      box: HTMLDivElement,
      bar: HTMLDivElement
    }
  };

  private endscreen: {
    root: HTMLDivElement,
    picture: HTMLImageElement,
    winner: HTMLDivElement,
    reason: HTMLDivElement
  }


  constructor(engine: Engine, board: Board, canvas: HTMLCanvasElement, element: Element, window: Window) {
    this.engine = engine;
    this.board = board;
    var root = cdiv(['display'], element);
    var redroot = cdiv(['red'], root);
    var blueroot = cdiv(['blue'], root);

    var progressbox = cdiv(['progressbox'], element);

    this.display = {
      root: root,
      red: {
        root: redroot,
        carrots: cdiv(['carrots'], redroot),
        salads: cdiv(['salads'], redroot),
        cards: cdiv(['cards'], redroot)
      },
      blue: {
        root: blueroot,
        carrots: cdiv(['carrots'], blueroot),
        salads: cdiv(['salads'], blueroot),
        cards: cdiv(['cards'], blueroot)
      },
      round: cdiv(['round'], root),
      progress: {
        box: progressbox,
        bar: cdiv(['progressbar'], progressbox)
      }
    };

    var endscreen_root = cdiv(['endscreen'], element);

    this.endscreen = {
      root: endscreen_root,
      picture: cimg("assets/pokal.svg", ['winPicture'], endscreen_root),
      winner: cdiv(['winName'], endscreen_root),
      reason: cdiv(['winReason'], endscreen_root)
    };

    window['ui'] = {
      handleCard: (card) => {
        console.log(card);
      }
    }

    this.setInteractive("red");
  }

  setInteractive(interactive: "off" | "red" | "blue") {
    this.interactive = interactive;
    console.log("INTERACTIVE MODE: " + interactive);
    if (this.interactive == "off") {
      this.board.fields.forEach(f => f.setHighlight(false));
    }
  }

  setEndscreenVisible(visible: boolean) {
    this.endscreen.root.style.opacity = visible ? "1" : "0";

  }

  highlightPossibleFieldsForGamestate(gamestate: GameState) {
    if ((gamestate.currentPlayer == SC_Player.COLOR.RED && this.interactive == "red") || (gamestate.currentPlayer == SC_Player.COLOR.BLUE && this.interactive == "blue")) {
      let fields = GameRuleLogic.calculateMoveableFields(gamestate.getCurrentPlayer().carrots);
      console.log("can advance " + fields + " fields");
      for (let i: number = 0; i <= fields; i++) {
        if (GameRuleLogic.isValidToAdvance(gamestate, i)) {
          let fieldIndex: number = (gamestate.getCurrentPlayer().index | 0) + (i | 0); //No idea why, but without the asmjs-integer-annotations it does a string-concat instead of an add
          console.log("can advance to <" + fieldIndex + ">");
          this.board.fields[fieldIndex].setHighlight(true, this.interactive);
        }
      }
    }
  }

  updateDisplay(state: GameState) {
    var cardFactory = (cards: Card[], isActivePlayer: boolean) => {
      var cardToTex = (name) => {
        switch (name) {
          case Card.EAT_SALAD: return "hasenjoker_salad.png";
          case Card.FALL_BACK: return "hasenjoker_backward.png";
          case Card.HURRY_AHEAD: return "hasenjoker_forward.png";
          case Card.TAKE_OR_DROP_CARROTS: return "hasenjoker_carrots.png";
        }
      }
      let interactive_class = this.interactive ? "interactive" : "";
      return cards.map(card => `<span class="cardbox" ${this.interactive && isActivePlayer ? 'onclick="window.ui.handleCard(\'' + card.cardType + '\');"' : ""}><img src="assets/${cardToTex(card.cardType)}" class="card ${card.cardType}"/><img src="assets/highlight_${cardToTex(card.cardType)}" class="highlight-card ${interactive_class} ${card.cardType}"/></span>`).join(" ");
    }

    this.display.round.innerText = state.turn.toString();
    this.display.red.salads.innerText = state.red.salads.toString();
    this.display.red.carrots.innerText = state.red.carrots.toString();
    this.display.red.cards.innerHTML = cardFactory(state.red.cards, this.interactive == "red");
    this.display.blue.salads.innerText = state.blue.salads.toString();
    this.display.blue.carrots.innerText = state.blue.carrots.toString();
    this.display.blue.cards.innerHTML = cardFactory(state.blue.cards, this.interactive == "blue");
    this.display.progress.bar.style.width = ((state.turn / 60) * 100) + "%";
  }

  updateEndscreen(result: GameResult) {
    this.endscreen.winner.innerHTML = result.winner.displayName;
    if (result.winner.color == SC_Player.COLOR.BLUE) {
      this.endscreen.winner.classList.remove("winRed");
      this.endscreen.winner.classList.add("winBlue");
    } else {
      this.endscreen.winner.classList.remove("winBlue");
      this.endscreen.winner.classList.add("winRed");
    }
    this.endscreen.reason.innerHTML = result.reason;
    this.endscreen.root.style.opacity = "1";
  }
}

export let cdiv = (classnames: string[], parent: any): HTMLDivElement => {
  var div = document.createElement('div');
  classnames.forEach(name => {
    div.classList.add(name);
  });
  parent.appendChild(div);
  return div;
}

export let cimg = (src: string, classnames: string[], parent: any): HTMLImageElement => {
  var img = document.createElement('img');
  classnames.forEach(name => {
    img.classList.add(name);
  });
  img.setAttribute('src', src);
  parent.appendChild(img);
  return img;
}