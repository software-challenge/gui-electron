
import { Engine } from './Engine';
import { Board } from '../Components/Board';
import { Field } from '../Components/Field';
import * as events from "events"

import { GameState, GameResult, Player as SC_Player, PLAYERCOLOR, Card, Action } from '../../api/HaseUndIgel';
import { GameRuleLogic } from '../../api/HaseUndIgelGameRules';
import { Viewer } from '../Viewer';

const INVISIBLE = 'invisible';
const HIGHLIGHT_CARD = 'highlight-card';

export class UI {
  interactive: "off" | "red" | "blue";
  private engine: Engine;
  private board: Board;
  private viewer: Viewer;

  private eventProxy = new class extends events.EventEmitter { }();

  chosenAction: Action = null;

  private carrotPickupDialogue: {
    root: HTMLDivElement,
    takeTen: HTMLDivElement,
    takeZero: HTMLDivElement,
    giveTen: HTMLDivElement,
    cancel: HTMLDivElement
  }

  private display: {
    root: HTMLDivElement,
    red: {
      root: HTMLDivElement,
      name: HTMLDivElement,
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
      name: HTMLDivElement,
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
    cancel: HTMLDivElement,
    send: HTMLDivElement,
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


  constructor(viewer: Viewer, engine: Engine, board: Board, canvas: HTMLCanvasElement, element: Element, window: Window) {
    this.engine = engine;
    this.board = board;
    this.viewer = viewer;


    engine.scene.onPointerObservable.add((ed, es) => {
      console.log("clicked!", engine.scene.pointerX, engine.scene.pointerY);
      var pickResult = engine.scene.pick(engine.scene.pointerX, engine.scene.pointerY);
      if (pickResult.hit) {
        let pickedID = pickResult.pickedMesh.id;
        if (pickedID.startsWith('highlight-field')) {
          pickedID = pickedID.split('-')[2];
          let pickedIndex = Number(pickedID);
          if (this.board.fields[pickedIndex].highlight) {
            this.eventProxy.emit('field', Number(pickedIndex));
          }
        }
      }
      console.log("pointer event", engine.scene.pointerX, engine.scene.pointerY);
    }, BABYLON.PointerEventTypes.POINTERPICK);

    var root = cdiv(['display'], element);
    var redroot = cdiv(['red'], root);
    var blueroot = cdiv(['blue'], root);

    var progressbox = cdiv(['progressbox'], element);



    this.display = {
      root: root,
      red: {
        root: redroot,
        name: cdiv(['name'], redroot),
        carrots: cdiv(['carrots'], redroot),
        salads: cdiv(['salads'], redroot),
        cards: null
      },
      blue: {
        root: blueroot,
        name: cdiv(['name'], blueroot),
        carrots: cdiv(['carrots'], blueroot),
        salads: cdiv(['salads'], blueroot),
        cards: null
      },
      round: cdiv(['round'], root),
      progress: {
        box: progressbox,
        bar: cdiv(['progressbar'], progressbox)
      },
      cancel: cdiv(['cancel', 'button', 'invisible'], element, 'Cancel'),
      send: cdiv(['send', 'button', 'invisible'], element, 'Send')
    };
    //TODO: Make Cancel and Send actual button elements for UI consistency (add cbtn method)
    this.display.cancel.addEventListener('click', () => this.eventProxy.emit('cancel'));
    this.display.send.addEventListener('click', () => this.eventProxy.emit('send'));


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
        this.eventProxy.emit('card', name);
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

    var carrotPickupRoot = cdiv(['carrotPickup', 'root', 'invisible'], element);
    this.carrotPickupDialogue = {
      root: carrotPickupRoot,
      takeTen: cdiv(['carrotPickup', 'takeTen', 'clickable'], carrotPickupRoot, "+10"),
      takeZero: cdiv(['carrotPickup', 'takeZero', 'clickable'], carrotPickupRoot, '0'),
      giveTen: cdiv(['carrotPickup', 'giveTen', 'clickable'], carrotPickupRoot, '-10'),
      cancel: cdiv(['carrotPickup', 'carrot-cancel', 'clickable'], carrotPickupRoot, 'Cancel')
    }
    this.carrotPickupDialogue.takeTen.addEventListener('click', () => this.eventProxy.emit('carrotPickup', 10));
    this.carrotPickupDialogue.takeZero.addEventListener('click', () => this.eventProxy.emit('carrotPickup', 0));
    this.carrotPickupDialogue.giveTen.addEventListener('click', () => this.eventProxy.emit('carrotPickup', -10));
    this.carrotPickupDialogue.cancel.addEventListener('click', () => this.carrotPickupDialogue.root.classList.add('invisible'));

  }

  private setInteractive(interactive: "off" | "red" | "blue") {
    this.interactive = interactive;
    console.log("INTERACTIVE MODE: " + interactive);
    if (this.interactive == "off") {
      this.disableSend();
      this.disableCancel();
    }
  }

  disableSend() {
    if (!this.display.send.classList.contains(INVISIBLE)) {
      this.display.send.classList.add(INVISIBLE);
    }
  }

  enableSend() {
    this.display.send.classList.remove(INVISIBLE);
  }

  disableCancel() {
    if (!this.display.cancel.classList.contains(INVISIBLE)) {
      this.display.cancel.classList.add(INVISIBLE);
    }
  }

  enableCancel() {
    this.display.cancel.classList.remove(INVISIBLE);
  }

  setEndscreenVisible(visible: boolean) {
    this.endscreen.root.style.opacity = visible ? "1" : "0";
  }

  interact(state: GameState, color: PLAYERCOLOR, is_first_action: boolean): Promise<"action" | "cancel" | "send"> {
    this.setInteractive(color == SC_Player.COLOR.RED ? "red" : "blue");
    if (this.interactive != "off" && state != null) {
      if (is_first_action) {
        this.highlightPossibleFieldsForGamestate(state);
      }
      this.highlightPossibleCardsForGameState(state);
    }
    this.viewer.render(state);
    let p = new Promise<"action" | "cancel" | "send">((res, rej) => {
      var clear_events = () => {//Prevent memory leak
        this.eventProxy.removeAllListeners("send");
        this.eventProxy.removeAllListeners("cancel");
        this.eventProxy.removeAllListeners("field");
        this.eventProxy.removeAllListeners("carrotPickup");
        this.eventProxy.removeAllListeners("card");
      }
      this.eventProxy.once("send", () => res("send"))
      this.eventProxy.once("cancel", () => res("cancel"))
      this.eventProxy.once("field", (fieldNumber) => {
        console.log("got field event!", fieldNumber)
        this.chosenAction = new Action("ADVANCE", fieldNumber - state.getPlayerByColor(color).index);
        clear_events();
        res("action");
      });
    });

    return p;
  }

  highlightPossibleCardsForGameState(gamestate: GameState) {
    let color = gamestate.getCurrentPlayer().color == SC_Player.COLOR.RED ? "red" : "blue";
    let cards = this.display[color].cards
    if (cards != null && cards != undefined) {
      if (GameRuleLogic.isValidToPlayEatSalad(gamestate)) {
        cards['eat_salad'].classList.add(HIGHLIGHT_CARD)
      }
      if (GameRuleLogic.isValidToPlayHurryAhead(gamestate)) {
        cards['hurry_ahead'].classList.add(HIGHLIGHT_CARD)
      }
      if (GameRuleLogic.isValidToPlayFallBack(gamestate)) {
        cards['fall_back'].classList.add(HIGHLIGHT_CARD)
      }
      if (GameRuleLogic.isValidToPlayTakeOrDropCarrots(gamestate, 0)) {
        cards['take_or_drop_carrots'].classList.add(HIGHLIGHT_CARD)
      }
    }
  }

  showCarrotPickupDialogue() {

  }

  highlightPossibleFieldsForGamestate(gamestate: GameState) {
    this.board.fields.forEach(f => f.setHighlight(false));
    if (GameRuleLogic.canAdvanceToAnyField(gamestate) &&
      (gamestate.currentPlayer == SC_Player.COLOR.RED && this.interactive == "red") ||
      (gamestate.currentPlayer == SC_Player.COLOR.BLUE && this.interactive == "blue")) {
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
    this.display.red.name.innerText = state.red.displayName;
    this.display.red.salads.innerText = state.red.salads.toString();
    this.display.red.carrots.innerText = state.red.carrots.toString();
    this.display.blue.name.innerText = state.blue.displayName;
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

export let cdiv = (classnames: string[], parent: any, innerText: string = ""): HTMLDivElement => {
  var div = document.createElement('div');
  div.innerText = innerText;
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