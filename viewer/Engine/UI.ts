
import { Engine } from './Engine';
import { Board } from '../Components/Board';
import { Field } from '../Components/Field';
import * as events from "events"

import { GameState, GameResult, Player as SC_Player, PLAYERCOLOR, Card, Action } from '../../api/HaseUndIgel';
import { GameRuleLogic } from '../../api/HaseUndIgelGameRules';
import { Viewer } from '../Viewer';

const INVISIBLE = 'invisible';
const HIGHLIGHT_CARD = 'highlight-card';
const CURRENT_PLAYER = 'current-player';

export class UI {
  interactive: "off" | "red" | "blue";
  private engine: Engine;
  private board: Board;
  private viewer: Viewer;
  private replayViewerElement: HTMLElement;

  private eventProxy = new class extends events.EventEmitter { }();

  chosenAction: Action = null;

  private exchangeCarrotsDialogue: {
    root: HTMLDivElement,
    takeTen: HTMLDivElement,
    giveTen: HTMLDivElement,
  }

  private takeOrDropCarrotsCardDialogue: {
    root: HTMLDivElement,
    takeTwenty: HTMLDivElement,
    takeZero: HTMLDivElement,
    giveTwenty: HTMLDivElement,
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
    skip: HTMLDivElement,
    eatSalad: HTMLDivElement,
    round: HTMLDivElement,
    progress: {
      box: HTMLDivElement,
      bar: HTMLDivElement
    },
    info: HTMLDivElement
  };

  private endscreen: {
    root: HTMLDivElement,
    picture: HTMLImageElement,
    winner: HTMLDivElement,
    reason: HTMLDivElement
  }


  constructor(viewer: Viewer, engine: Engine, board: Board, canvas: HTMLCanvasElement, element: HTMLElement, window: Window) {
    this.engine = engine;
    this.board = board;
    this.viewer = viewer;


    this.replayViewerElement = element;

    this.engine.addClickListener((fieldName) => {
      if (fieldName.startsWith('field')) {
        fieldName = fieldName.split('-')[1];
        let pickedIndex = Number(fieldName);
        if (this.board.fields[pickedIndex].highlight) {
          this.eventProxy.emit('field', Number(pickedIndex));
        }
      }
    })

    this.engine.addHoverListener((fieldName) => {
      if (fieldName.startsWith('field')) {
        fieldName = fieldName.split('-')[1];
        let pickedIndex = Number(fieldName);
        this.display.info.classList.remove(INVISIBLE);
        this.display.info.innerText = "Feld " + pickedIndex;
      } else {
        this.display.info.classList.add(INVISIBLE);
      }
    })

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
      cancel: cdiv(['cancel', 'button', 'invisible'], element, 'Abbrechen'),
      send: cdiv(['send', 'button', 'invisible'], element, 'Senden'),
      skip: cdiv(['skip', 'button', 'invisible'], element, 'Aussetzen'),
      eatSalad: cdiv(['eatSalad', 'button', 'invisible'], element, 'Salat essen'),
      info: cdiv(['info'], element, '')
    };
    //TODO: Make Cancel and Send actual button elements for UI consistency (add cbtn method)
    this.display.cancel.addEventListener('click', () => this.eventProxy.emit('cancel'));
    this.display.send.addEventListener('click', () => this.eventProxy.emit('send'));
    this.display.skip.addEventListener('click', () => this.eventProxy.emit('skip'));
    this.display.eatSalad.addEventListener('click', () => this.eventProxy.emit('eatSalad'));


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

    // Dialogue for selecting carrots when executing action "exchange carrots"
    var exchangeCarrotsRoot = cdiv(['exchangeCarrots', 'root', 'invisible'], element);
    this.exchangeCarrotsDialogue = {
      root: exchangeCarrotsRoot,
      takeTen: cdiv(['exchangeCarrots', 'takeTen', 'clickable', 'button'], exchangeCarrotsRoot, "+10 Karotten"),
      giveTen: cdiv(['exchangeCarrots', 'giveTen', 'clickable', 'button'], exchangeCarrotsRoot, '-10 Karotten'),
    }
    let addCarrotExchangeEvent = (element, value) => {
      element.addEventListener('click', () => {
        this.hide(this.exchangeCarrotsDialogue.root);
        this.eventProxy.emit('carrotPickup', value)
      });
    }
    addCarrotExchangeEvent(this.exchangeCarrotsDialogue.takeTen, 10);
    addCarrotExchangeEvent(this.exchangeCarrotsDialogue.giveTen, -10);

    // Dialogue for selecting carrots when playing card "take or drop carrots"
    var takeOrDropCarrotsCardRoot = cdiv(['takeOrDropCarrotsCard', 'root', 'invisible'], element);
    this.takeOrDropCarrotsCardDialogue = {
      root: takeOrDropCarrotsCardRoot,
      takeTwenty: cdiv(['takeOrDropCarrotsCard', 'takeTwenty', 'clickable', 'button'], takeOrDropCarrotsCardRoot, "+20"),
      takeZero: cdiv(['takeOrDropCarrotsCard', 'takeZero', 'clickable', 'button'], takeOrDropCarrotsCardRoot, '0'),
      giveTwenty: cdiv(['takeOrDropCarrotsCard', 'giveTwenty', 'clickable', 'button'], takeOrDropCarrotsCardRoot, '-20'),
      cancel: cdiv(['takeOrDropCarrotsCard', 'carrot-cancel', 'clickable', 'button'], takeOrDropCarrotsCardRoot, 'Cancel')
    }
    let addCarrotCardEvent = (element, value) => {
      element.addEventListener('click', () => {
        this.hide(this.takeOrDropCarrotsCardDialogue.root);
        this.eventProxy.emit('carrotValue', value)
      });
    }
    addCarrotCardEvent(this.takeOrDropCarrotsCardDialogue.takeTwenty, 20);
    addCarrotCardEvent(this.takeOrDropCarrotsCardDialogue.takeZero, 0);
    addCarrotCardEvent(this.takeOrDropCarrotsCardDialogue.giveTwenty, -20);
    this.takeOrDropCarrotsCardDialogue.cancel.addEventListener('click', () => {
      this.hide(this.takeOrDropCarrotsCardDialogue.root);
      this.eventProxy.emit('cancel');
    });
  }

  private setInteractive(interactive: "off" | "red" | "blue") {
    this.interactive = interactive;

    this.replayViewerElement.classList.remove("current-red")
    this.replayViewerElement.classList.remove("current-blue")

    this.display.red.root.classList.remove(CURRENT_PLAYER);
    this.display.blue.root.classList.remove(CURRENT_PLAYER);
    if (this.interactive == "red") {
      this.display.red.root.classList.add(CURRENT_PLAYER);
      this.replayViewerElement.classList.add("current-red")
    }
    if (this.interactive == "blue") {
      this.display.blue.root.classList.add(CURRENT_PLAYER);
      this.replayViewerElement.classList.add("current-blue")
    }
    if (this.interactive == "off") {
      this.disableSend();
      this.disableCancel();
      this.disableSkip();
    }
  }

  private hide(element: HTMLElement) {
    if (!element.classList.contains(INVISIBLE)) {
      element.classList.add(INVISIBLE);
    }
  }
  private show(element: HTMLElement) {
    element.classList.remove(INVISIBLE);
  }

  disableSend() {
    this.hide(this.display.send);
  }

  enableSend() {
    this.show(this.display.send);
  }

  enableSkip() {
    this.show(this.display.skip);
  }

  disableSkip() {
    this.hide(this.display.skip);
  }

  disableCancel() {
    this.hide(this.display.cancel);
  }

  enableCancel() {
    this.show(this.display.cancel);
  }

  setEndscreenVisible(visible: boolean) {
    this.endscreen.root.style.opacity = visible ? "1" : "0";
  }

  interact(state: GameState, color: PLAYERCOLOR, isFirstAction: boolean): Promise<"action" | "cancel" | "send"> {
    let interactColor: "red" | "blue" = color == SC_Player.COLOR.RED ? "red" : "blue";
    this.setInteractive(interactColor);
    this.viewer.render(state);

    if (GameRuleLogic.isValidToSkip(state)) {
      this.enableSkip();
    }

    // this also removes highlights if not first action

    if (isFirstAction) { // Advance, exchange carrots, fall back and eat salad have to be first action
      this.highlightPossibleFieldsForGamestate(state);
      if (GameRuleLogic.isValidToExchangeCarrots(state, 10)) {
        this.showCarrotPickupDialogue(false);
      }
      if (GameRuleLogic.isValidToFallBack(state)) {
        let fieldIndex: number = state.board.getPreviousFieldByType("HEDGEHOG", state.getCurrentPlayer().index);
        this.board.fields[fieldIndex].setHighlight(true, interactColor);
      }
      if (GameRuleLogic.isValidToEat(state)) {
        this.show(this.display.eatSalad);
      }
    } else {
      this.hideCarrotPickupDialogue();
      this.hide(this.display.eatSalad);
      this.unhighlightFields();
    }

    this.highlightPossibleCardsForGameState(state);

    let p = new Promise<"action" | "cancel" | "send">((res, rej) => {
      var clear_events = () => {//Prevent memory leak
        this.eventProxy.removeAllListeners("send");
        this.eventProxy.removeAllListeners("cancel");
        this.eventProxy.removeAllListeners("field");
        this.eventProxy.removeAllListeners("carrotPickup"); // for exchange action
        this.eventProxy.removeAllListeners("carrotValue"); // for card
        this.eventProxy.removeAllListeners("card");
        this.eventProxy.removeAllListeners("skip");
        this.eventProxy.removeAllListeners("eatSalad");
      }


      this.eventProxy.once("send", () => { clear_events(); res("send"); })

      this.eventProxy.once("cancel", () => { clear_events(); res("cancel"); })

      this.eventProxy.once("field", (fieldNumber) => {
        if (fieldNumber < state.getPlayerByColor(color).index) {
          this.chosenAction = new Action("FALL_BACK");
        } else {
          this.chosenAction = new Action("ADVANCE", fieldNumber - state.getPlayerByColor(color).index);
        }
        clear_events();
        res("action");
      });

      this.eventProxy.once("skip", () => {
        clear_events();
        this.chosenAction = new Action("SKIP");
        res("action");
      })

      this.eventProxy.once('carrotPickup', value => {
        this.chosenAction = new Action("EXCHANGE_CARROTS", value);
        clear_events();
        res("action");
      });

      this.eventProxy.once('eatSalad', () => {
        this.chosenAction = new Action("EAT_SALAD");
        clear_events();
        res("action");
      });

      this.eventProxy.once("card", card => {
        if (card == Card.TAKE_OR_DROP_CARROTS) {
          this.showCarrotPickupDialogue(true);
          this.eventProxy.once('carrotValue', value => {
            this.chosenAction = new Card(Card.TAKE_OR_DROP_CARROTS, value);
            clear_events();
            res("action");
          });
        } else {
          this.chosenAction = new Card(card);
          clear_events();
          res("action");
        }
      });
    });

    return p;
  }

  highlightPossibleCardsForGameState(gamestate: GameState) {
    let color = gamestate.getCurrentPlayer().color == SC_Player.COLOR.RED ? "red" : "blue";
    let cards = this.display[color].cards;
    if (cards != null && cards != undefined) {
      if (GameRuleLogic.isValidToPlayEatSalad(gamestate)) {
        cards['eat_salad'].classList.add('highlight');
      }
      if (GameRuleLogic.isValidToPlayHurryAhead(gamestate)) {
        cards['hurry_ahead'].classList.add('highlight')

      }
      if (GameRuleLogic.isValidToPlayFallBack(gamestate)) {
        cards['fall_back'].classList.add('highlight')
      }
      if (GameRuleLogic.isValidToPlayTakeOrDropCarrots(gamestate, 0)) {
        cards['take_or_drop_carrots'].classList.add('highlight')
      }
    }
  }

  /*
   * show the dialog to exchange carrots. Is used for the exchange carrots action and
   * for the take or drop carrots card. For playing the card, possible values are
   * -20, 0 and 20, in the case of the exchange carrots action, possible values are -10
   * and 10.
   */
  showCarrotPickupDialogue(forCard = false) {
    if (forCard) {
      this.show(this.takeOrDropCarrotsCardDialogue.root);
    } else {
      this.show(this.exchangeCarrotsDialogue.root);
    }
  }

  hideCarrotPickupDialogue() {
    this.hide(this.exchangeCarrotsDialogue.root);
  }

  unhighlightFields() {
    this.board.fields.forEach(f => f.setHighlight(false));
  }

  highlightPossibleFieldsForGamestate(gamestate: GameState) {
    this.unhighlightFields();
    if (GameRuleLogic.canAdvanceToAnyField(gamestate) &&
      (gamestate.currentPlayer == SC_Player.COLOR.RED && this.interactive == "red") ||
      (gamestate.currentPlayer == SC_Player.COLOR.BLUE && this.interactive == "blue")) {
      let fieldsBeforePlayer = gamestate.board.fields.length - 1 - gamestate.getCurrentPlayer().index
      let distance = Math.min(
        GameRuleLogic.calculateMoveableFields(gamestate.getCurrentPlayer().carrots),
        fieldsBeforePlayer
      );
      for (let i: number = 0; i <= distance; i++) {
        if (GameRuleLogic.isValidToAdvance(gamestate, i)) {
          let fieldIndex: number = gamestate.getCurrentPlayer().index + i;
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
        this.display[color].cards[card.toLowerCase()].classList.remove('highlight');
        if (cards.indexOf(card) != -1) {
          this.show(this.display[color].cards[card.toLowerCase()]);
        } else {
          this.hide(this.display[color].cards[card.toLowerCase()]);
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