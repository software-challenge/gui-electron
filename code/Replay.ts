import { Helpers } from "./Helpers";
/**
 * Represents the parsed data from an xml replay
 */
export class Replay {
  public replayName: string;
  public states: GameState[];
  public passengers: Passenger[];
  public score: Score;
  /**
   * Initializes the Replay from a URL and calls the callback once done
   */
  constructor(name: string, xml: XMLDocument) {
    var now = performance.now();
    this.replayName = name;
    var stateQuery = xml.getElementsByTagName("state");
    this.states = [];
    for (var i = 0; i < stateQuery.length; i++) {//Iterate through all state nodes
      var g: GameState = new GameState();
      g.turn = parseInt(stateQuery[i].getAttribute("turn"));
      g.startPlayer = stateQuery[i].getAttribute("startPlayer") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
      g.currentPlayer = stateQuery[i].getAttribute("currentPlayer") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
      g.freeTurn = stateQuery[i].getAttribute("freeTurn") == "true";
      g.red = new Player(stateQuery[i].getElementsByTagName("red")[0]);
      g.blue = new Player(stateQuery[i].getElementsByTagName("blue")[0]);
      g.board = new Board(stateQuery[i].getElementsByTagName("board")[0]);
      var moves = stateQuery[i].getElementsByTagName("lastMove")[0];
      if (moves) {
        var tempmoves = [];
        //Parse moves
        for (var j = 0; j < moves.children.length; j++) {
          let move = new Move(moves.children[j]);
          tempmoves[move.order] = move;
        }
        //fill any gaps that might have occured
        tempmoves.forEach(o => g.moves.push(o));
        /*forEach iterates only over items that exists.
          So if, for example, we have an array that has elements at indices four and six, but nothing at five, it won't insert an undefined into our list.*/
      }
      this.states.push(g);
    }

    //All states read, find passengers
    this.findPassengers();

    console.log(this.passengers);

    //Finalize by adding animation hints
    for (var i = 1; i < this.states.length; i++) {
      this.states[i].addAnimationHints(this.states[i - 1], this.passengers);
    }

    this.states[0].animated = false;
    this.states[this.states.length - 1].last = true;
    this.score = new Score(xml.getElementsByTagName('result')[0], this.states[0].red.displayName, this.states[0].blue.displayName);

    console.log(this);
    console.log("parsing took " + (performance.now() - now) + "ms");
  }


  private findPassengers(): void {
    this.passengers = [];

    var processedTileIds = [];

    var hasPassengerAt = (x: number, y: number) => this.passengers.findIndex((passenger => passenger.x == x && passenger.y == y)) != -1;


    var next_passenger_id: number = 0;

    for (var i = 0; i < this.states.length; i++) {
      var tiles = this.states[i].board.tiles;
      //1. Find new passengers
      tiles.forEach(tile => {
        if (processedTileIds.indexOf(tile.index) == -1) {//We only need to go through each tile once for this, passengers get created at tile creation
          tile.fields.forEach(field => {
            if (field.isPassengerField && !hasPassengerAt(field.x, field.y)) {//New passenger, create
              var p: Passenger = new Passenger();
              p.id = next_passenger_id;
              next_passenger_id++;
              p.appears_turn = i;
              p.tile_id = tile.index;
              p.x = field.x;
              p.y = field.y;
              p.gets_picked_up = false;//Updated later
              p.pickup_tile = field.pickup_hints;
              this.passengers.push(p);
            }
          });
        }
      });
      //2. Check if any of the current passengers have been picked up
      this.passengers.forEach(passenger => {
        if (this.states[i].board.tileIndices.indexOf(passenger.tile_id) != -1) {
          if (!(this.states[i].board.getTileByIndex(passenger.tile_id).getFieldByIndex(passenger.x, passenger.y).isPassengerField)) { //Tile vanished, passenger picked up
            passenger.gets_picked_up = true;
            passenger.picked_up_turn = i;
            passenger.picked_up_by = this.states[i].currentPlayer;
          }
        }
      });
    }
  }
}

/**
 * Represents the result of a game
 */
export class Score {
  /** The color of the player who won */
  public winner: PLAYERCOLOR;
  /** The displayName of the winning player */
  public winnerName: string;
  /** The displayName of the losing player */
  public loserName: string;
  /** The reason why the game was terminated */
  public winReason: string;
  /** The resaon including the displayName of the winning player */
  public processedReason: string;

  /** The raw cause given in the replay */
  public cause: string;
  constructor(resultNode: Element, redName: string, blueName: string) {
    //Loop through score nodes, there might be multiple ones that don't all contain a reason attribute
    var scoreNodes = resultNode.getElementsByTagName('score');
    for (var i = 0; i < scoreNodes.length; i++) {
      if (scoreNodes[i].hasAttribute('cause')) {
        this.cause = scoreNodes[i].getAttribute('cause');
      }
      if (scoreNodes[i].hasAttribute('reason')) {
        this.winReason = scoreNodes[i].getAttribute('reason');
        break;
      }
    }
    if (!this.winReason) {
      this.winReason = "";
    }
    this.winner = resultNode.getElementsByTagName('winner')[0].getAttribute('color') == 'RED' ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
    this.winnerName = resultNode.getElementsByTagName('winner')[0].getAttribute('displayName');
    this.loserName = this.winner == PLAYERCOLOR.RED ? blueName : redName;
    if (/abgehängt/.test(this.winReason)) {
      this.processedReason = this.winReason.replace('Ein Spieler', this.loserName);
    } else {
      this.processedReason = this.winReason.replace('Ein Spieler', this.winnerName);
    }
    if (this.processedReason == "") {
      this.processedReason = "Das Spiel wurde vorzeitig beendet. " + this.winnerName + " gewinnt.";
    }
    if (this.cause == 'RULE_VIOLATION') {
      this.processedReason = 'Ungültiger Zug: ' + this.processedReason + "&#xa; " + this.winnerName + " gewinnt";
    }
  }
}

export const enum FIELDTYPE {
  WATER = 0,
  LOG,
  BLOCKED,
  PASSENGER0,
  PASSENGER1,
  PASSENGER2,
  PASSENGER3,
  PASSENGER4,
  PASSENGER5,
  PASSENGER6,
  SANDBANK,
  GOAL
}

export const enum DIRECTION {
  RIGHT = 0,
  UP_RIGHT = 1,
  UP_LEFT = 2,
  LEFT = 3,
  DOWN_LEFT = 4,
  DOWN_RIGHT = 5
}

export const enum PLAYERCOLOR {
  RED = 0,
  BLUE
}

export class Field {
  public type: FIELDTYPE;
  public x: number;
  public y: number;
  public id: number;
  public points: number;
  public pickup_hints: { x: number, y: number };
  public isPassengerField: boolean;
  constructor(type: FIELDTYPE, x: number, y: number, points: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.points = points;
    this.id = (x * 10000) + y;//TODO: find a better way to generate GUIDs
  }

  public static fromFieldNode(fieldNode: Element): Field {
    let f = new Field(FIELDTYPE.WATER, 0, 0, 0);
    switch (fieldNode.getAttribute("type")) {
      case "WATER": f.type = FIELDTYPE.WATER; break;
      case "LOG": f.type = FIELDTYPE.LOG; break;
      case "BLOCKED": f.type = FIELDTYPE.BLOCKED; break;
      case "PASSENGER0": f.type = FIELDTYPE.PASSENGER0; break;
      case "PASSENGER1": f.type = FIELDTYPE.PASSENGER1; break;
      case "PASSENGER2": f.type = FIELDTYPE.PASSENGER2; break;
      case "PASSENGER3": f.type = FIELDTYPE.PASSENGER3; break;
      case "PASSENGER4": f.type = FIELDTYPE.PASSENGER4; break;
      case "PASSENGER5": f.type = FIELDTYPE.PASSENGER5; break;
      case "PASSENGER6": f.type = FIELDTYPE.PASSENGER6; break;
      case "SANDBANK": f.type = FIELDTYPE.SANDBANK; break;
      case "GOAL": f.type = FIELDTYPE.GOAL; break;
      default: throw new RangeError("Fieldtype not parseable: " + fieldNode.getAttribute("type"));
    }
    f.x = parseInt(fieldNode.getAttribute("x"));
    f.y = parseInt(fieldNode.getAttribute("y"));
    f.id = (f.x * 10000) + f.y;
    f.points = parseInt(fieldNode.getAttribute("points"));
    f.isPassengerField = false;
    switch (f.type) {
      case FIELDTYPE.PASSENGER0:
        f.pickup_hints = Board.calculateNewPosition({ x: f.x, y: f.y }, DIRECTION.RIGHT, 1);
        f.isPassengerField = true;
        break;
      case FIELDTYPE.PASSENGER1:
        f.pickup_hints = Board.calculateNewPosition({ x: f.x, y: f.y }, DIRECTION.UP_RIGHT, 1);
        f.isPassengerField = true;
        break;
      case FIELDTYPE.PASSENGER2:
        f.pickup_hints = Board.calculateNewPosition({ x: f.x, y: f.y }, DIRECTION.UP_LEFT, 1);
        f.isPassengerField = true;
        break;
      case FIELDTYPE.PASSENGER3:
        f.pickup_hints = Board.calculateNewPosition({ x: f.x, y: f.y }, DIRECTION.LEFT, 1);
        f.isPassengerField = true;
        break;
      case FIELDTYPE.PASSENGER4:
        f.pickup_hints = Board.calculateNewPosition({ x: f.x, y: f.y }, DIRECTION.DOWN_LEFT, 1);
        f.isPassengerField = true;
        break;
      case FIELDTYPE.PASSENGER5:
        f.pickup_hints = Board.calculateNewPosition({ x: f.x, y: f.y }, DIRECTION.DOWN_RIGHT, 1);
        f.isPassengerField = true;
        break;
      case FIELDTYPE.PASSENGER6:
        f.pickup_hints = Board.calculateNewPosition({ x: f.x, y: f.y }, DIRECTION.RIGHT, 1);
        f.isPassengerField = true;
        break;
    }

    return f;
  }

  public toString(): string {
    return this.x.toString() + ";" + this.y.toString + "(" + this.points.toString() + "," + this.type.toString() + ")";
  }

}

export class Tile {
  public fields: Field[] = [];
  public visible: boolean;
  public index: number;
  public direction: number;
  public center_x: number;
  public center_y: number;
  constructor(tileNode: Element) {
    this.visible = tileNode.getAttribute("visible") == "true";
    this.index = parseInt(tileNode.getAttribute("index"));
    this.direction = parseInt(tileNode.getAttribute("direction"));
    let fields = tileNode.getElementsByTagName("field");
    this.center_x = 0; this.center_y = 0;
    for (var i = 0; i < fields.length; i++) {
      let f: Field = Field.fromFieldNode(fields[i]);
      this.center_x += f.x;
      this.center_y += f.y;
      this.fields.push(f);
    }
    this.center_x /= fields.length;
    this.center_y /= fields.length;
  }

  public getFieldByIndex(x: number, y: number) {
    return this.fields.find(field => field.x == x && field.y == y);
  }

}

export class Board {
  public tiles: Tile[];
  public tileIndices: number[];
  constructor(boardNode: Element) {
    //Descend into tiles-node, iterate for every tile
    let tiles = boardNode.getElementsByTagName("tile");
    this.tiles = [];
    this.tileIndices = [];
    for (var i = 0; i < tiles.length; i++) {
      this.tiles.push(new Tile(tiles[i]));
      this.tileIndices.push(this.tiles[this.tiles.length - 1].index);
    }
  }

  public getTileByIndex(index: number) {
    return this.tiles.find(t => t.index == index);
  }

  public getFieldByIndex(x: number, y: number) {
    return this.tiles.reduce((prev, curr) => prev != undefined ? prev : curr.getFieldByIndex(x, y), undefined);
  }

  public getFieldByObject(o: { x: number, y: number }) {
    return this.getFieldByIndex(o.x, o.y);
  }

  public getFieldCircleCenteredAt(x: number, y: number): Field[] {
    return [
      this.getFieldByObject(Board.calculateNewPosition({ x: x, y: y }, DIRECTION.DOWN_LEFT, 1)),
      this.getFieldByObject(Board.calculateNewPosition({ x: x, y: y }, DIRECTION.DOWN_RIGHT, 1)),
      this.getFieldByObject(Board.calculateNewPosition({ x: x, y: y }, DIRECTION.LEFT, 1)),
      this.getFieldByObject(Board.calculateNewPosition({ x: x, y: y }, DIRECTION.RIGHT, 1)),
      this.getFieldByObject(Board.calculateNewPosition({ x: x, y: y }, DIRECTION.UP_LEFT, 1)),
      this.getFieldByObject(Board.calculateNewPosition({ x: x, y: y }, DIRECTION.UP_RIGHT, 1))
    ].filter(f => f != undefined);
  }

  public static StringToDirection(d: string) {
    switch (d) {
      case "UP_LEFT": return DIRECTION.UP_LEFT;
      case "UP_RIGHT": return DIRECTION.UP_RIGHT;
      case "LEFT": return DIRECTION.LEFT;
      case "DOWN_LEFT": return DIRECTION.DOWN_LEFT;
      case "DOWN_RIGHT": return DIRECTION.DOWN_RIGHT;
      case "RIGHT": return DIRECTION.RIGHT;
      default: throw new RangeError("player direction was not parsable: " + d);
    }
  }

  public static NumberToDirection(d: number) {
    switch (d) {
      case 0: return DIRECTION.RIGHT;
      case 1: return DIRECTION.UP_RIGHT;
      case 2: return DIRECTION.UP_LEFT;
      case 3: return DIRECTION.LEFT;
      case 4: return DIRECTION.DOWN_LEFT;
      case 5: return DIRECTION.DOWN_RIGHT;
    }
  }

  public static DirectionToNumber(d: DIRECTION) {
    switch (d) {
      case DIRECTION.RIGHT: return 0;
      case DIRECTION.UP_RIGHT: return 1;
      case DIRECTION.UP_LEFT: return 2;
      case DIRECTION.LEFT: return 3;
      case DIRECTION.DOWN_LEFT: return 4;
      case DIRECTION.DOWN_RIGHT: return 5;
    }
  }

  public static DirectionToString(d: DIRECTION) {
    switch (d) {
      case DIRECTION.RIGHT: return "RIGHT";
      case DIRECTION.UP_RIGHT: return "UP_RIGHT";
      case DIRECTION.UP_LEFT: return "UP_LEFT";
      case DIRECTION.LEFT: return "LEFT";
      case DIRECTION.DOWN_LEFT: return "DOWN_LEFT";
      case DIRECTION.DOWN_RIGHT: return "DOWN_RIGHT";
    }
  }

  public static InvertDirection(d: DIRECTION) {
    switch (d) {
      case DIRECTION.LEFT: return DIRECTION.RIGHT;
      case DIRECTION.DOWN_LEFT: return DIRECTION.UP_RIGHT;
      case DIRECTION.DOWN_RIGHT: return DIRECTION.UP_LEFT;
      case DIRECTION.RIGHT: return DIRECTION.LEFT;
      case DIRECTION.UP_RIGHT: return DIRECTION.DOWN_LEFT;
      case DIRECTION.UP_LEFT: return DIRECTION.DOWN_RIGHT;
    }
  }

  public static RotateNumberDirectionBy(d: number, r: number) {//Rotates a direction given as the number d by the amount r
    return ((d + r + 6) % 6);
  }

  public static calculateNewPosition(start: { x: number, y: number }, direction: DIRECTION, steps: number): { x: number, y: number } {
    var target = { x: start.x, y: start.y };
    var even = x => (x % 2) == 0;
    var odd = x => (x % 2) != 0;
    if (steps < 0) {//Basically going backwards is turning 180° and going the same direction forwards
      steps = Math.abs(steps);
      direction = this.InvertDirection(direction);
    }
    while (steps > 0) {
      switch (direction) {
        case DIRECTION.RIGHT:
          target.x++;
          break;
        case DIRECTION.UP_LEFT:
          if (odd(target.y)) {
            target.x--;
          }
          target.y--;
          break;
        case DIRECTION.UP_RIGHT:
          if (even(target.y)) {
            target.x++;
          }
          target.y--;
          break;
        case DIRECTION.LEFT:
          target.x--;
          break;
        case DIRECTION.DOWN_RIGHT:
          if (even(target.y)) {
            target.x++;
          }
          target.y++;
          break;
        case DIRECTION.DOWN_LEFT:
          if (odd(target.y)) {
            target.x--;
          }
          target.y++;
          break;
      }
      steps--;
    }
    return target;
  }
}

class Player {
  public displayName: string;
  public color: PLAYERCOLOR;
  public points: number;
  public x: number;
  public y: number;
  public direction: DIRECTION;
  public speed: number;
  public coal: number;
  public tile: number;
  public passenger: number;
  public simulated_passengers: number = 0; //This attribute exists because the number in the XML files is often off by a bit (because it's per turn and not per move)
  constructor(playerNode: Element) {
    this.displayName = playerNode.getAttribute("displayName");
    this.color = playerNode.getAttribute("color") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
    this.points = parseInt(playerNode.getAttribute("points"));
    this.x = parseInt(playerNode.getAttribute("x"));
    this.y = parseInt(playerNode.getAttribute("y"));
    this.direction = Board.StringToDirection(playerNode.getAttribute("direction"));
    this.speed = parseInt(playerNode.getAttribute("speed"));
    this.coal = parseInt(playerNode.getAttribute("coal"));
    this.tile = parseInt(playerNode.getAttribute("tile"));
    this.passenger = parseInt(playerNode.getAttribute("passenger"));
  }
}

export const enum MOVETYPE {
  ACCELERATION,
  TURN,
  STEP,
  PUSH
}

export class Move {
  public type: MOVETYPE;
  public order: number;
  public attribute: number;
  public rawType: string;
  public activePlayer: PLAYERCOLOR;
  public animationHints: { [name: string]: number } = {};

  constructor(moveNode: Element) {
    this.order = parseInt(moveNode.getAttribute("order"));
    switch (moveNode.nodeName) {
      case "acceleration":
        this.type = MOVETYPE.ACCELERATION;
        this.attribute = parseInt(moveNode.getAttribute("acc"));
        break;
      case "turn":
        this.type = MOVETYPE.TURN;
        this.attribute = parseInt(moveNode.getAttribute("direction"));
        break;
      case "advance":
      case "step":
        this.type = MOVETYPE.STEP;
        this.attribute = parseInt(moveNode.getAttribute("distance"));
        break;
      case "push":
        this.type = MOVETYPE.PUSH;
        this.attribute = Board.DirectionToNumber(Board.StringToDirection(moveNode.getAttribute("direction")));
        break;
    }
    this.rawType = moveNode.nodeName;
    this.animationHints['animated'] = 0;
  }
}

export class Passenger {
  public id: number;
  public x: number;
  public y: number;
  public appears_turn: number;
  public gets_picked_up: boolean;
  public picked_up_by: PLAYERCOLOR;
  public picked_up_turn: number;
  public tile_id: number;
  public pickup_tile: { x: number, y: number };
}

export class GameState {
  public red: Player;
  public blue: Player;
  public turn: number;
  public last: boolean = false;
  public startPlayer: PLAYERCOLOR;
  public currentPlayer: PLAYERCOLOR;
  public freeTurn: boolean;
  public board: Board;
  public moves: Move[] = [];
  public animated: boolean = true;

  public addAnimationHints(previousState: GameState, passengers: Passenger[]) {//Calculates hints for the animation subsystem based on other information of this turn
    //0. carry over simulated passengers
    this.red.simulated_passengers = previousState.red.simulated_passengers;
    this.blue.simulated_passengers = previousState.blue.simulated_passengers;


    //1. Store old attributes, so we can add them as hints
    var player_attributes: { red: { x: number, y: number, direction: number, speed: number }, blue: { x: number, y: number, direction: number, speed: number } } = {
      red: {
        x: previousState.red.x,
        y: previousState.red.y,
        direction: previousState.red.direction,
        speed: previousState.red.speed
      },
      blue: {
        x: previousState.blue.x,
        y: previousState.blue.y,
        direction: previousState.blue.direction,
        speed: previousState.blue.speed
      }
    };
    //2. Iterate through moves and track values
    var activePlayer = (previousState.currentPlayer == PLAYERCOLOR.RED) ? 'red' : 'blue';
    var otherPlayer = (previousState.currentPlayer == PLAYERCOLOR.RED) ? 'blue' : 'red';

    for (var i = 0; i < this.moves.length; i++) {
      let move = this.moves[i];
      move.activePlayer = previousState.currentPlayer;
      switch (move.type) {
        case MOVETYPE.ACCELERATION:
          move.animationHints['startSpeed'] = player_attributes[activePlayer].speed;
          player_attributes[activePlayer].speed += move.attribute;//Keep up with the speed
          move.animationHints['targetSpeed'] = player_attributes[activePlayer].speed;
          break;
        case MOVETYPE.TURN:
          move.animationHints['startDirection'] = player_attributes[activePlayer].direction;
          player_attributes[activePlayer].direction = Board.RotateNumberDirectionBy(player_attributes[activePlayer].direction, move.attribute); //Keep up with the direction
          move.animationHints['animated'] = 1;
          move.animationHints['targetDirection'] = player_attributes[activePlayer].direction;
          move.animationHints['rotationDirection'] = move.attribute > 0 ? 1 : 0;//If this is positive, we rotate clockwise, otherwise anticlockwise
          break;
        case MOVETYPE.PUSH:
          move.animationHints['animated'] = 1;
          move.animationHints['startOtherX'] = player_attributes[otherPlayer].x;
          move.animationHints['startOtherY'] = player_attributes[otherPlayer].y;
          var otherPlayerTargetPosition = Board.calculateNewPosition({ x: player_attributes[otherPlayer].x, y: player_attributes[otherPlayer].y }, Board.NumberToDirection(move.attribute), 1);
          player_attributes[otherPlayer].x = otherPlayerTargetPosition.x;
          player_attributes[otherPlayer].y = otherPlayerTargetPosition.y;
          move.animationHints['targetOtherX'] = otherPlayerTargetPosition.x;
          move.animationHints['targetOtherY'] = otherPlayerTargetPosition.y;
          break;
        case MOVETYPE.STEP:

          var picked_up_passengers = passengers.filter(p => p.pickup_tile.x == player_attributes[activePlayer].x && p.pickup_tile.y == player_attributes[activePlayer].y);
          move.animationHints['picked_up_passengers'] = picked_up_passengers.length;
          picked_up_passengers.forEach((p, i) => { //SELECT * FROM PASSENGERS WHERE EXISTS FIELD AT SAME POSITION
            move.animationHints['picked_up_passenger_' + i] = p.id;
            this[activePlayer].simulated_passengers++;
            p.gets_picked_up = true;
            p.picked_up_turn = this.turn;
          });

          move.animationHints['rotation'] = player_attributes[activePlayer].direction;
          move.animationHints['animated'] = 1;
          move.animationHints['startX'] = player_attributes[activePlayer].x;
          move.animationHints['startY'] = player_attributes[activePlayer].y;
          var activePlayerTargetPosition = Board.calculateNewPosition({ x: player_attributes[activePlayer].x, y: player_attributes[activePlayer].y }, Board.NumberToDirection(player_attributes[activePlayer].direction), move.attribute);
          move.animationHints['targetX'] = activePlayerTargetPosition.x;
          move.animationHints['targetY'] = activePlayerTargetPosition.y;
          player_attributes[activePlayer].x = activePlayerTargetPosition.x;
          player_attributes[activePlayer].y = activePlayerTargetPosition.y;
          break;
      }
    }
  }
}