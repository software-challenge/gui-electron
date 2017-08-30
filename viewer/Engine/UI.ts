
import { Engine } from './Engine';
import { Board } from '../Components/Board';
import { Field } from '../Components/Field';

import { GameState, GameResult, Player as SC_Player, Card, Action } from '../../api/HaseUndIgel';
import { GameRuleLogic } from '../../api/HaseUndIgelGameRules';

export class UI {
  interactive: "off" | "red" | "blue";
  private engine: Engine;
  private board: Board;

  chosenAction: Action = null;

  private display: {
    root: HTMLDivElement,
    red: {
      root: HTMLDivElement,
      carrots: HTMLDivElement,
      salads: HTMLDivElement,
      cards: {
        root: HTMLDivElement,
        take_or_drop_carrots: HTMLSpanElement,
        eat_salad: HTMLSpanElement,
        hurry_ahead: HTMLSpanElement,
        fall_back: HTMLSpanElement
      }
    },
    blue: {
      root: HTMLDivElement,
      carrots: HTMLDivElement,
      salads: HTMLDivElement,
      cards: {
        root: HTMLDivElement,
        take_or_drop_carrots: HTMLSpanElement,
        eat_salad: HTMLSpanElement,
        hurry_ahead: HTMLSpanElement,
        fall_back: HTMLSpanElement
      }
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
        cards: null
      },
      blue: {
        root: blueroot,
        carrots: cdiv(['carrots'], blueroot),
        salads: cdiv(['salads'], blueroot),
        cards: null
      },
      round: cdiv(['round'], root),
      progress: {
        box: progressbox,
        bar: cdiv(['progressbar'], progressbox)
      }
    };


    var redcardroot = cdiv(['cards'], redroot);
    var bluecardroot = cdiv(['cards'], blueroot);

    //Card creation helper function
    var ccard = (name, root) => {
      var cardToTex = (name) => {
        switch (name) {
          case Card.EAT_SALAD: return "hasenjoker_salad.png";
          case Card.FALL_BACK: return "hasenjoker_backward.png";
          case Card.HURRY_AHEAD: return "hasenjoker_forward.png";
          case Card.TAKE_OR_DROP_CARROTS: return "hasenjoker_carrots.png";
        }
      }

      var cardbox = document.createElement('span');
      cardbox.addEventListener('click', () => {
        this.interactCard(name);
      })
      cardbox.classList.add('cardbox');
      var card_image = cimg('assets/' + cardToTex(name), ['card', name], cardbox);
      var highlight_image = cimg('assets/highlight_' + cardToTex(name), ['highlight-card', name], cardbox);
      root.appendChild(cardbox);
      return cardbox;
    }

    this.display.red.cards = {
      root: redcardroot,
      eat_salad: ccard(Card.EAT_SALAD, redcardroot),
      fall_back: ccard(Card.FALL_BACK, redcardroot),
      hurry_ahead: ccard(Card.HURRY_AHEAD, redcardroot),
      take_or_drop_carrots: ccard(Card.TAKE_OR_DROP_CARROTS, redcardroot)
    };

    this.display.blue.cards = {
      root: bluecardroot,
      eat_salad: ccard(Card.EAT_SALAD, bluecardroot),
      fall_back: ccard(Card.FALL_BACK, bluecardroot),
      hurry_ahead: ccard(Card.HURRY_AHEAD, bluecardroot),
      take_or_drop_carrots: ccard(Card.TAKE_OR_DROP_CARROTS, bluecardroot)
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

  private interactCard(name: string) {
    console.log("interaction with card " + name);
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

  interact(state: GameState): Promise<"action" | "cancel" | "send"> {
    return new Promise((res, rej) => {
      res("send");
    });
  }

  highlightPossibleCardsForGameState(gamestate: GameState) {
    //TODO: Tomorrow morning :)
  }

  showCarrotPickupDialogue() {

  }

  highlightPossibleFieldsForGamestate(gamestate: GameState) {
    if ((gamestate.currentPlayer == SC_Player.COLOR.RED && this.interactive == "red") || (gamestate.currentPlayer == SC_Player.COLOR.BLUE && this.interactive == "blue")) {
      let fieldsBeforePlayer = gamestate.board.fields.length - 1 - gamestate.getCurrentPlayer().index
      let distance = Math.min(
        GameRuleLogic.calculateMoveableFields(gamestate.getCurrentPlayer().carrots),
        fieldsBeforePlayer
      );
      console.log("can advance " + distance + " fields");
      for (let i: number = 0; i <= distance; i++) {
        if (GameRuleLogic.isValidToAdvance(gamestate, i)) {
          let fieldIndex: number = gamestate.getCurrentPlayer().index + i;
          console.log("can advance to <" + fieldIndex + ">" + " " + gamestate.board.fields[fieldIndex]);
          this.board.fields[fieldIndex].setHighlight(true, this.interactive);
        }
      }
    }
  }

  updateDisplay(state: GameState) {
    this.display.round.innerText = state.turn.toString();
    this.display.red.salads.innerText = state.red.salads.toString();
    this.display.red.carrots.innerText = state.red.carrots.toString();
    this.display.blue.salads.innerText = state.blue.salads.toString();
    this.display.blue.carrots.innerText = state.blue.carrots.toString();
    this.display.progress.bar.style.width = ((state.turn / 60) * 100) + "%";


    //Update cards
    //TODO: There HAS to be a cleverer way to do this
    ['red', 'blue'].forEach(color => {
      var cards = [];
      state[color].cards.forEach(c => {
        cards.push(c.cardType);
      });

      [Card.EAT_SALAD, Card.FALL_BACK, Card.HURRY_AHEAD, Card.TAKE_OR_DROP_CARROTS].forEach(card => {
        if (cards.indexOf(card) != -1) {
          this.display[color].cards[card.toLowerCase()].classList.remove('invisible');
        } else {
          this.display[color].cards[card.toLowerCase()].classList.add('invisible');
        }
      });
    });

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