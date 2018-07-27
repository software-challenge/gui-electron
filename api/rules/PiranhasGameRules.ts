import { ALL_DIRECTIONS, LineDirection, FIELDSIZE, Board, FIELDTYPE, Coordinates, Direction, Move, GameState, Player, PLAYERCOLOR } from './Piranhas';

// an iterator with all field-coordinates on the line given by a field on it and a direction
export class Line implements IterableIterator<Coordinates> {

  private xi: number;
  private yi: number;

  constructor(public start: Coordinates, public direction: LineDirection) {
    // we will iterate from left to right, so find the leftmost field on the line inside the field
    // note that (0,0) is the lowest, leftmost point, x-axis goes to the right, y-axis goes up
    var leftmostX,leftmostY;
    switch (this.direction) {
      case "HORIZONTAL":
        leftmostX = 0;
        leftmostY = this.start.y;
        break;
      case "VERTICAL":
        leftmostX = this.start.x;
        leftmostY = FIELDSIZE - 1;
        break;
      case "RISING_DIAGONAL":
        // for rising diagonals, we have to decrease x and y
        var shift = Math.min(this.start.x, this.start.y);
        leftmostX = this.start.x - shift;
        leftmostY = this.start.y - shift;
        break;
      case "FALLING_DIAGONAL":
        // for falling diagonals, we have to decrease x and increase y
        var shift = Math.min(this.start.x, (FIELDSIZE - 1) - this.start.y);
        leftmostX = this.start.x - shift;
        leftmostY = this.start.y + shift;
        break;
    }
    this.xi = leftmostX;
    this.yi = leftmostY;
  }

  [Symbol.iterator]() {
    return this;
  }

  public next(): IteratorResult<Coordinates> {
    var result: IteratorResult<Coordinates>;
    if (this.xi >= 0 && this.yi >= 0 && this.xi < FIELDSIZE && this.yi < FIELDSIZE) {
      result = { done: false, value: {x: this.xi, y: this.yi}};
      // horizontal lines and diagonals move right
      if (this.direction == "HORIZONTAL" || this.direction == "RISING_DIAGONAL" || this.direction == "FALLING_DIAGONAL") {
        this.xi += 1;
      }
      // vertical lines and falling diagonals move down
      if (this.direction == "VERTICAL" || this.direction == "FALLING_DIAGONAL") {
        this.yi -= 1;
      } else if (this.direction == "RISING_DIAGONAL") { // rising diagonals move up
        this.yi += 1;
      }
      return result;
    } else {
      return { done: true, value: null }
    }
  }

  // limits a line to fields between the given start and end (excluding)
  // to be used as a filter
  // e.g. [...new Line(2,3, HORIZONTAL)].filter(between(2, 3, 5, 3, HORIZONTAL))
  static between(start: Coordinates, end: Coordinates, direction: LineDirection) {
    var lowerX = Math.min(start.x, end.x);
    var lowerY = Math.min(start.y, end.y);
    var higherX = Math.max(start.x, end.x);
    var higherY = Math.max(start.y, end.y);
    return (f: Coordinates) => {
      switch (direction) {
        case "HORIZONTAL":
          return f.x > lowerX && f.x < higherX;
        case "VERTICAL":
          return f.y > lowerY && f.y < higherY;
        case "RISING_DIAGONAL":
        case "FALLING_DIAGONAL":
          return f.x > lowerX && f.x < higherX && f.y > lowerY && f.y < higherY;
        default:
          throw `unknown direction ${direction}`;
      }
    };
  }

  static directionsForLineDirection(lineDirection: LineDirection):Direction[] {
    switch (lineDirection) {
      case "HORIZONTAL":
        return ["LEFT", "RIGHT"];
      case "VERTICAL":
        return ["UP", "DOWN"];
      case "RISING_DIAGONAL":
        return ["UP_RIGHT", "DOWN_LEFT"];
      case "FALLING_DIAGONAL":
        return ["UP_LEFT", "DOWN_RIGHT"];
    }
  }

  static lineDirectionForDirection(direction: Direction): LineDirection {
    switch (direction) {
      case "LEFT":
      case "RIGHT":
        return "HORIZONTAL";
      case "UP":
      case "DOWN":
        return "VERTICAL";
      case "UP_RIGHT":
      case "DOWN_LEFT":
        return "RISING_DIAGONAL";
      case "UP_LEFT":
      case "DOWN_RIGHT":
        return "FALLING_DIAGONAL";
    }
  }
}

export class GameRuleLogic {

  static addBlockedFields(board:Board) {
    var numberOfBlockedFields = 2;
    var start = 2; // first row or column, in which blocked fields are allowed
    var end = 7; // last row or column, in which blocked fields are allowed

    // create a list of coordinates for fields which may be blocked
    var blockableFieldCoordinates = Array.from({length: end - start + 1}, (_, k) => {
      var x = k + start;
      return Array.from({length: end - start + 1}, (_, i) => ({x: x, y: i + start}));
    }).reduce((a, c) => a.concat(c)); // flatten

    // set fields with randomly selected coordinates to blocked
    // coordinates may not lay on same horizontal, vertical or diagonal lines with other selected coordinates
    for (var i = 0; i < numberOfBlockedFields; i++) {
      var indexOfFieldToBlock = Math.floor(Math.random() * blockableFieldCoordinates.length);
      var selectedCoords = blockableFieldCoordinates[indexOfFieldToBlock];
      board.setField(selectedCoords, Board.Fieldtype.obstructed);
      // remove field coordinates and fields on horizontal, vertical and diagonal lines:
      var coordinatesToRemove = ALL_DIRECTIONS.map(
        direction => [...new Line(selectedCoords, direction)]
      ).reduce((a, c) => a.concat(c)); // flatten
      blockableFieldCoordinates = blockableFieldCoordinates.filter(c => !coordinatesToRemove.some(toRemove => c.x == toRemove.x && c.y == toRemove.y));
    }
    return board;
  }

  static countFish(board: Board, start: Coordinates, direction: LineDirection) {
    // filter function for fish field type
    let fish = (t: FIELDTYPE) => (t == Board.Fieldtype.red || t == Board.Fieldtype.blue);
    return Array.from(
      [...new Line(start, direction)],
      (p) => board.field(p)
    ).filter(fish).length;
  }

  static opponentColor(color: PLAYERCOLOR) {
    return Player.OtherColor(color);
  }

  static playerFieldType(color: PLAYERCOLOR):FIELDTYPE {
    switch(color) {
      case Player.COLOR.RED: return "RED";
      case Player.COLOR.BLUE: return "BLUE";
    }
  }

  static fieldTypePlayer(fieldType: FIELDTYPE):PLAYERCOLOR {
    switch(fieldType) {
      case Board.Fieldtype.red: return Player.COLOR.RED;
      case Board.Fieldtype.blue: return Player.COLOR.BLUE;
      default: return null;
    }
  }

  static moveTarget(move: Move, board: Board):Coordinates {
    let speed = GameRuleLogic.countFish(board, move.fromField, Line.lineDirectionForDirection(move.direction));
    return move.targetField(speed);
  }

  static insideBounds(c: Coordinates):boolean {
    return (c.x >= 0 && c.x < FIELDSIZE && c.y >= 0 && c.y < FIELDSIZE);
  }

  static isObstacle(fieldType: FIELDTYPE, movingPlayerColor: PLAYERCOLOR):boolean {
    return (fieldType == GameRuleLogic.playerFieldType(GameRuleLogic.opponentColor(movingPlayerColor)))

  }
  static noObstacle(fromField: Coordinates, direction: LineDirection, toField: Coordinates, color: PLAYERCOLOR, board: Board):boolean {
    return !([...new Line(fromField, direction)]
             .filter(Line.between(fromField, toField, direction))
             .some(f => GameRuleLogic.isObstacle(board.field(f), color)));
  }

  static validMoveTarget(target: Coordinates, movingPlayerColor: PLAYERCOLOR, board: Board):boolean {
    let targetFieldType = board.field(target);
    return (targetFieldType == Board.Fieldtype.empty ||
            targetFieldType == GameRuleLogic.playerFieldType(GameRuleLogic.opponentColor(movingPlayerColor)));
  }

  static validMove(move: Move, board: Board):boolean {
    var movingPlayerColor: PLAYERCOLOR;
    if (board.field(move.fromField) == Board.Fieldtype.red) {
      movingPlayerColor = Player.COLOR.RED;
    } else if (board.field(move.fromField) == Board.Fieldtype.blue) {
      movingPlayerColor = Player.COLOR.BLUE;
    } else {
      // moving from a field which is not occupied by a fish is invalid
      return false;
    }

    let target = GameRuleLogic.moveTarget(move, board);
    return (GameRuleLogic.insideBounds(target) &&
            GameRuleLogic.validMoveTarget(target, movingPlayerColor, board) &&
            GameRuleLogic.noObstacle(move.fromField, Line.lineDirectionForDirection(move.direction), target, movingPlayerColor, board));
  }

  static possibleMoves(board: Board, field: Coordinates):Move[] {
    var fishColorToMove = board.field(field);
    return ALL_DIRECTIONS.map((direction) => {
      return Line.directionsForLineDirection(direction)
        // create two moves for every line direction
        .map(d => new Move(field, d))
        // remove invalid moves
        .filter(m => GameRuleLogic.validMove(m, board));
    }).reduce((a, c) => a.concat(c), []) // flatten
  }

}
