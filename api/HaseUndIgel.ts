import { GameRuleLogic } from './HaseUndIgelGameRules';
import { watch } from 'fs';


export class GameState {
  // REMEMBER to extend clone method when adding attributes here!
  red: Player;
  blue: Player;
  turn: number;
  startPlayer: PLAYERCOLOR;
  currentPlayer: PLAYERCOLOR;
  board: Board;
  //  lastMove: TODO

  constructor() {
    this.red = new Player(Player.COLOR.RED);
    this.blue = new Player(Player.COLOR.BLUE);
    this.startPlayer = Player.COLOR.RED;
    this.currentPlayer = Player.COLOR.RED;
    this.turn = 0;
    this.board = new Board();
  }

  static fromJSON(json: any): GameState {
    var gs = new GameState();
    gs.startPlayer = Player.ColorFromString(json.$.startPlayer);
    gs.currentPlayer = Player.ColorFromString(json.$.currentPlayer);
    gs.turn = parseInt(json.$.turn);
    gs.red = Player.fromJSON(json.red[0]);
    gs.blue = Player.fromJSON(json.blue[0]);
    gs.board = Board.fromJSON(json.board[0]);
    return gs;
  }

  clone(): GameState {
    let clone = new GameState();
    clone.turn = this.turn;
    clone.startPlayer = this.startPlayer;
    clone.currentPlayer = this.currentPlayer;
    clone.red = this.red.clone();
    clone.blue = this.blue.clone();
    clone.board = this.board.clone();
    return clone;
  }

  getCurrentPlayer(): Player {
    return this.getPlayerByColor(this.currentPlayer)
  }

  getOtherPlayer(): Player {
    return this.getPlayerByColor(Player.OtherColor(this.currentPlayer));
  }

  getPlayerByColor(color: PLAYERCOLOR) {
    if (color == Player.COLOR.RED) {
      return this.red;
    } else {
      return this.blue;
    }
  }

  isOccupied(position: number): boolean {
    return this.red.index == position || this.blue.index == position;
  }

  isOnHareField(): boolean {
    return this.board.fields[this.getCurrentPlayer().index] == "HARE"
  }

  isFirst(player: Player): boolean {
    return player.index > this.getPlayerByColor(Player.OtherColor(player.color)).index
  }

  getTypeAt(index: number): FIELDTYPE {
    return this.board.fields[index]
  }

  setLastAction(action: Action) {
    if (action.type != "SKIP") {
      this.getCurrentPlayer().lastNonSkipAction = action;
    }
  }

  getStartPlayer() {
    return this.getPlayerByColor(this.startPlayer);
  }
}


export type FIELDTYPE = "CARROT" | "SALAD" | "POSITION_1" | "POSITION_2" | "HEDGEHOG" | "HARE" | "START" | "GOAL";


export class Board {
  static Fieldtype: {
    carrot: FIELDTYPE,
    salad: FIELDTYPE,
    position_1: FIELDTYPE,
    position_2: FIELDTYPE,
    hedgehog: FIELDTYPE,
    hare: FIELDTYPE,
    start: FIELDTYPE,
    goal: FIELDTYPE
  } = {
    carrot: "CARROT",
    salad: "SALAD",
    position_1: "POSITION_1",
    position_2: "POSITION_2",
    hedgehog: "HEDGEHOG",
    hare: "HARE",
    start: "START",
    goal: "GOAL"
  }
  // REMEMBER to extend clone method when adding attributes here!
  fields: FIELDTYPE[];
  static fromJSON(json: any): Board {
    var b = new Board();
    var sorted_fields = json.fields.sort((a, b) => a.$.index - b.$.index);
    b.fields = sorted_fields.map(f => f.$.type);
    return b;
  }

  constructor() {
    let segment: FIELDTYPE[];
    let F = Board.Fieldtype;
    this.fields = [];
    let addFields = (array: FIELDTYPE[]) => {
      Array.prototype.push.apply(this.fields, array);
    }
    let shuffle = (array: Array<any>): Array<any> => {
      var currentIndex = array.length, temporaryValue, randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    addFields([F.start])
    segment = [F.hare, F.carrot, F.hare, F.carrot, F.carrot, F.hare, F.position_1, F.position_2, F.carrot]
    shuffle(segment)
    addFields(segment)
    addFields([F.salad, F.hedgehog])
    segment = [F.carrot, F.carrot, F.hare]
    shuffle(segment)
    addFields(segment)
    addFields([F.hedgehog])
    segment = [F.position_1, F.position_2, F.carrot]
    shuffle(segment)
    addFields(segment)
    addFields([F.hedgehog])
    segment = [F.carrot, F.carrot, F.position_2]
    shuffle(segment)
    addFields([segment.shift()])
    addFields([segment.shift()])
    addFields([F.salad])
    addFields([segment.shift()])
    addFields([F.hedgehog])
    segment = [F.hare, F.carrot, F.carrot, F.carrot, F.position_2]
    shuffle(segment)
    addFields(segment)
    addFields([F.hedgehog])
    segment = [F.hare, F.position_1, F.carrot, F.hare, F.position_2, F.carrot]
    shuffle(segment)
    addFields(segment)
    addFields([F.hedgehog])
    segment = [F.carrot, F.hare, F.carrot, F.position_2]
    shuffle(segment)
    addFields(segment)
    addFields([F.salad, F.hedgehog])
    segment = [F.carrot, F.carrot, F.hare, F.position_2, F.position_1, F.carrot]
    shuffle(segment)
    addFields(segment)
    addFields([F.hedgehog])
    segment = [F.hare, F.carrot, F.position_2, F.carrot, F.carrot]
    shuffle(segment)
    addFields(segment)
    addFields([F.salad, F.hedgehog])
    segment = [F.hare, F.carrot, F.position_1, F.carrot, F.hare, F.carrot]
    shuffle(segment)
    addFields(segment)
    addFields([F.goal])
  }

  getNextFieldByType(type: FIELDTYPE, startIndex: number = 0): number {
    for (let i = startIndex + 1; i <= this.fields.length; i++) {
      if (this.fields[i] == type) {
        return i;
      }
    }
    return -1;
  }

  getPreviousFieldByType(type: FIELDTYPE, startIndex: number): number {
    for (let i = startIndex - 1; i >= 0; i--) {
      if (this.fields[i] == type) {
        return i;
      }
    }
    return -1;
  }

  clone(): Board {
    let clone = new Board()
    let clonedFields = []
    for (let f of this.fields) {
      clonedFields.push(f)
    }
    clone.fields = clonedFields;
    return clone;
  }
}



export type PLAYERCOLOR = 0 | 1;


export class Player {
  // REMEMBER to extend clone method when adding attributes here!
  displayName: string;
  color: PLAYERCOLOR;
  index: number;
  carrots: number;
  salads: number;
  cards: Card[]
  lastNonSkipAction: Action;
  mustPlayCard: boolean;

  static COLOR: { RED: PLAYERCOLOR, BLUE: PLAYERCOLOR } = { RED: 0, BLUE: 1 };

  static ColorFromString(s: string): PLAYERCOLOR {
    if (s.match(/RED/i)) {
      return Player.COLOR.RED;
    }
    if (s.match(/BLUE/i)) {
      return Player.COLOR.BLUE;
    }
    throw "Unknown color value: " + s;
  }

  static OtherColor(c: PLAYERCOLOR): PLAYERCOLOR {
    return c == Player.COLOR.RED ? Player.COLOR.BLUE : Player.COLOR.RED;
  }

  static fromJSON(json: any): Player {
    var p = new Player(Player.ColorFromString(json.$.color));
    p.displayName = json.$.displayName;
    p.index = Number(json.$.index);
    p.carrots = Number(json.$.carrots);
    p.salads = Number(json.$.salads);
    p.cards = json.cards[0].type ? json.cards[0].type.map(t => Card.fromString(t)) : [];
    if (json.lastNonSkipAction != undefined) {
      p.lastNonSkipAction = Action.fromJSON(json.lastNonSkipAction[0]);
    }
    return p;
  }

  constructor(color: PLAYERCOLOR) {
    this.color = color;
    this.index = 0;
    this.carrots = 68;
    this.salads = 5;
    this.cards = [Card.TakeOrDropCarrots(), Card.EatSalat(), Card.HurryAhead(), Card.FallBack()];
  }

  ownsCardOfType(card: Card): boolean {
    return this.cards.find((c) => { return c.cardType == card.cardType }) != undefined
  }

  cardsWithout(card: Card): Card[] {
    return this.cards.filter((c) => { c.type != card.cardType });
  }

  removeCard(card: Card) {
    this.cards = this.cardsWithout(card)
  }

  eatSalad(): void {
    if (this.salads > 0) {
      this.salads -= 1;
    } else {
      throw "Can't eat salad. No salads left!"
    }
  }

  changeCarrotsBy(value: number) {
    if (this.carrots + value >= 0) {
      this.carrots += value;
    } else {
      throw "Can't change carrots by " + value + ". Current carrots: " + this.carrots;
    }
  }

  clone(): Player {
    let clone = new Player(this.color);
    clone.displayName = this.displayName;
    clone.index = this.index;
    clone.carrots = this.carrots;
    clone.salads = this.salads;
    let clonedCards = [];
    for (let c of this.cards) {
      clonedCards.push(new Card(c.cardType, c.value))
    }
    clone.cards = clonedCards;
    if (this.lastNonSkipAction != undefined) {
      clone.lastNonSkipAction = this.lastNonSkipAction.clone();
    }
    clone.mustPlayCard = this.mustPlayCard;
    return clone;
  }
}

export type ActionType = "ADVANCE" | "CARD" | "EAT_SALAD" | "EXCHANGE_CARROTS" | "FALL_BACK" | "SKIP";
export class Action {
  // REMEMBER to extend clone method when adding attributes here!
  type: ActionType;
  value: number; // distance for ADVANCE, number of carrots for EXCHANGE_CARROTS

  constructor(type: ActionType, value: number = 0) {
    this.type = type;
    this.value = value;
  }

  perform(state: GameState): void {
    switch (this.type) {
      case "ADVANCE":
        if (GameRuleLogic.isValidToAdvance(state, this.value)) {
          state.getCurrentPlayer().changeCarrotsBy(-GameRuleLogic.calculateCarrots(this.value));
          state.getCurrentPlayer().index = state.getCurrentPlayer().index + this.value
          if (state.board.fields[state.getCurrentPlayer().index] == Board.Fieldtype.hare) {
            state.getCurrentPlayer().mustPlayCard = true
          }
        } else {
          throw "Vorwaertszug um " + this.value + " Felder nicht moeglich!"
        }
        break;
      case "EAT_SALAD":
        if (GameRuleLogic.isValidToEat(state)) {
          state.getCurrentPlayer().eatSalad();
          // when eating salad the carrots are increased
          if (state.getCurrentPlayer().index > state.getOtherPlayer().index) {
            state.getCurrentPlayer().changeCarrotsBy(10);
          } else {
            state.getCurrentPlayer().changeCarrotsBy(30);
          }
        } else {
          throw "Es kann gerade kein Salat (mehr) gegessen werden.";
        }
      case "EXCHANGE_CARROTS":
        if (GameRuleLogic.isValidToExchangeCarrots(state, this.value)) {
          state.getCurrentPlayer().changeCarrotsBy(this.value);
          state.setLastAction(this);
        } else {
          throw "Es können nicht " + this.value + " Karotten aufgenommen werden.";
        }
      case "FALL_BACK":
        if (GameRuleLogic.isValidToFallBack(state)) {
          let previousFieldIndex = state.getCurrentPlayer().index;
          state.getCurrentPlayer().index = state.board.getPreviousFieldByType(Board.Fieldtype.hedgehog, state.getCurrentPlayer().index);
          state.getCurrentPlayer().changeCarrotsBy(10 * (previousFieldIndex - state.getCurrentPlayer().index));
        } else {
          throw "Es kann gerade kein Rückzug gemacht werden.";
        }
      case "SKIP":
        // do nothing
        break;
      default:
        throw "Unknown action " + this.type;
    }
    state.setLastAction(this);
  }

  static fromJSON(json: any) {
    switch (json.$.class) {
      case "card":
        return new Card(json.$.type, json.$.value)
      case "advance":
        return new Action(json.$.class, json.$.distance)
      case "exchangeCarrots":
        return new Action(json.$.class, json.$.value)
      case "eatSalad":
      case "fallBack":
      case "skip":
        return new Action(json.$.class)
      default:
        throw "unknown action type " + json.$.class
    }
  }

  static toJSON(): string {
    //TODO: implement
    throw "Not implemented!";
  }

  clone(): Action {
    return new Action(this.type, this.value);
  }
}

export class Card extends Action {
  static TAKE_OR_DROP_CARROTS = 'TAKE_OR_DROP_CARROTS';
  static EAT_SALAD = 'EAT_SALAD';
  static HURRY_AHEAD = 'HURRY_AHEAD';
  static FALL_BACK = 'FALL_BACK';

  // REMEMBER to extend clone method when adding attributes here!
  cardType: string;
  value: number; // for take or drop carrots, may be -10, 0 or 10

  constructor(cardType: string, value: number = 0) {
    super("CARD")
    this.cardType = cardType;
    this.value = value;
  }

  static fromString(s: string): Card {
    return new Card(s);
  }

  static TakeOrDropCarrots(): Card {
    return Card.fromString(Card.TAKE_OR_DROP_CARROTS)
  }

  static EatSalat(): Card {
    return Card.fromString(Card.EAT_SALAD)
  }

  static HurryAhead(): Card {
    return Card.fromString(Card.HURRY_AHEAD)
  }

  static FallBack(): Card {
    return Card.fromString(Card.FALL_BACK)
  }

  clone(): Card {
    return new Card(this.cardType, this.value);
  }

  perform(state: GameState): void {
    state.getCurrentPlayer().mustPlayCard = false;
    switch (this.cardType) {
      case Card.EAT_SALAD:
        if (GameRuleLogic.isValidToPlayEatSalad(state)) {
          state.getCurrentPlayer().eatSalad();
          if (state.isFirst(state.getCurrentPlayer())) {
            state.getCurrentPlayer().changeCarrotsBy(10);
          } else {
            state.getCurrentPlayer().changeCarrotsBy(30);
          }
        } else {
          throw "Das Ausspielen der EAT_SALAD Karte ist nicht möglich.";
        }
        break;
      case Card.FALL_BACK:
        if (GameRuleLogic.isValidToPlayFallBack(state)) {
          state.getCurrentPlayer().index = state.getOtherPlayer().index - 1;
          if (state.getTypeAt(state.getCurrentPlayer().index) == Board.Fieldtype.hare) {
            state.getCurrentPlayer().mustPlayCard = true;
          }
        } else {
          throw "Das Ausspielen der FALL_BACK Karte ist nicht möglich.";
        }
        break;
      case Card.HURRY_AHEAD:
        if (GameRuleLogic.isValidToPlayHurryAhead(state)) {
          state.getCurrentPlayer().index = state.getOtherPlayer().index + 1;
          if (state.getTypeAt(state.getCurrentPlayer().index) == Board.Fieldtype.hare) {
            state.getCurrentPlayer().mustPlayCard = true;
          }
        } else {
          throw "Das Ausspielen der FALL_BACK Karte ist nicht möglich.";
        }
        break;
      case Card.TAKE_OR_DROP_CARROTS:
        if (GameRuleLogic.isValidToPlayTakeOrDropCarrots(state, this.value)) {
          state.getCurrentPlayer().changeCarrotsBy(this.value);
        } else {
          throw "Das Ausspielen der TAKE_OR_DROP_CARROTS Karte ist nicht möglich.";
        }
        break;
      default:
        throw "Unknown card type " + this.cardType;
    }
    state.setLastAction(this);
    state.getCurrentPlayer().removeCard(this);
  }
}

export class GameResult {
  cause: "REGULAR";
  reason: string;
  winner: Player;

  static fromJSON(json: any): GameResult {
    console.log("Result:");
    var util = require('util');
    console.log(util.inspect(json));

    var gr = new GameResult();
    gr.cause = json.score[0].$.cause;
    gr.reason = json.score[0].$.reason;

    gr.winner = Player.fromJSON(json.winner[0]);

    return gr;
  }
}
