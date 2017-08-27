

export class GameState {
  red: Player;
  blue: Player;
  turn: number;
  startPlayer: PLAYERCOLOR;
  currentPlayer: PLAYERCOLOR;
  board: Board;
  lastNonSkipAction: Action;

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
    return (this.currentPlayer == Player.COLOR.RED) ? this.red : this.blue;
  }

  isOccupied(position: number): boolean {
    return this.red.index == position || this.blue.index == position;
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

  getClosestPreviousHedgehogField(position: number): number {
    for (let i = position; i <= 0; i++) {
      if (this.fields[i] == Board.Fieldtype.hedgehog) {
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

  static COLOR: { RED: PLAYERCOLOR, BLUE: PLAYERCOLOR } = { RED: 0, BLUE: 1 };

  static ColorFromString(s: string): PLAYERCOLOR {
    return s == 'RED' ? Player.COLOR.RED : Player.COLOR.BLUE;
  }

  static fromJSON(json: any): Player {
    var p = new Player();
    p.displayName = json.$.displayName;
    p.color = Player.ColorFromString(json.$.color);
    p.index = json.$.index;
    p.carrots = json.$.carrots;
    p.salads = json.$.salads;
    p.cards = json.cards[0].type ? json.cards[0].type.map(t => Card.fromString(t)) : [];
    return p;
  }
}


export class Card {
  static TAKE_OR_DROP_CARROTS = 'TAKE_OR_DROP_CARROTS';
  static EAT_SALAD = 'EAT_SALAD';
  static HURRY_AHEAD = 'HURRY_AHEAD';
  static FALL_BACK = 'FALL_BACK';

  value: string;

  static fromString(s: string): Card {
    var c = new Card();

    switch (s) {
      case Card.TAKE_OR_DROP_CARROTS:
        c.value = Card.TAKE_OR_DROP_CARROTS;
        break;
      case Card.EAT_SALAD:
        c.value = Card.EAT_SALAD;
        break;
      case Card.HURRY_AHEAD:
        c.value = Card.HURRY_AHEAD;
        break;
      case Card.FALL_BACK:
        c.value = Card.FALL_BACK;
        break;
      default:
        throw `Unknown card type: ${s}`;
    }

    return c;
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

export class Action {
  type: "ADVANCE" | "CARD" | "EAT_SALAD";
  distance: number;
  card: Card;

  static getAdvanceAction(distance: number): Action {
    let a = new Action();
    a.type = "ADVANCE";
    a.distance = distance;
    return a;
  }
}
