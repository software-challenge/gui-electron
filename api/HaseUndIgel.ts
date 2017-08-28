import { watch } from 'fs';


export class GameState {
  red: Player;
  blue: Player;
  turn: number;
  startPlayer: PLAYERCOLOR;
  currentPlayer: PLAYERCOLOR;
  board: Board;
  lastNonSkipAction: Action;

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
    return GameState.fromJSON(JSON.parse(JSON.stringify(this))); //Ugly, slow, horrible
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
      this.lastNonSkipAction = action;
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
}



export type PLAYERCOLOR = 0 | 1;


export class Player {
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
    return s == 'RED' ? Player.COLOR.RED : Player.COLOR.BLUE;
  }

  static OtherColor(c: PLAYERCOLOR): PLAYERCOLOR {
    return c == Player.COLOR.RED ? Player.COLOR.BLUE : Player.COLOR.RED;
  }

  static fromJSON(json: any): Player {
    var p = new Player(Player.ColorFromString(json.$.color));
    p.displayName = json.$.displayName;
    p.index = json.$.index;
    p.carrots = json.$.carrots;
    p.salads = json.$.salads;
    p.cards = json.cards[0].type ? json.cards[0].type.map(t => Card.fromString(t)) : [];
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
}

export class Action {
  type: "ADVANCE" | "CARD" | "EAT_SALAD" | "SKIP";
  distance: number;

  static getAdvanceAction(distance: number): Action {
    let a = new Action();
    a.type = "ADVANCE";
    a.distance = distance;
    return a;
  }
}

export class Card extends Action {
  static TAKE_OR_DROP_CARROTS = 'TAKE_OR_DROP_CARROTS';
  static EAT_SALAD = 'EAT_SALAD';
  static HURRY_AHEAD = 'HURRY_AHEAD';
  static FALL_BACK = 'FALL_BACK';

  cardType: string;
  value: number; // for take or drop carrots, may be -10, 0 or 10

  static fromString(s: string): Card {
    var c = new Card();
    c.type = "CARD"

    switch (s) {
      case Card.TAKE_OR_DROP_CARROTS:
        c.cardType = Card.TAKE_OR_DROP_CARROTS;
        break;
      case Card.EAT_SALAD:
        c.cardType = Card.EAT_SALAD;
        break;
      case Card.HURRY_AHEAD:
        c.cardType = Card.HURRY_AHEAD;
        break;
      case Card.FALL_BACK:
        c.cardType = Card.FALL_BACK;
        break;
      default:
        throw `Unknown card type: ${s}`;
    }

    return c;
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
