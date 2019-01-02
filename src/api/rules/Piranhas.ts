import * as deepEqual from 'deep-equal'

export type LineDirection = 'HORIZONTAL' | 'VERTICAL' | 'RISING_DIAGONAL' | 'FALLING_DIAGONAL';
export const ALL_DIRECTIONS: LineDirection[] = ['HORIZONTAL', 'VERTICAL', 'RISING_DIAGONAL', 'FALLING_DIAGONAL']

export const FIELDSIZE = 10

export class GameState {
  // REMEMBER to extend clone method when adding attributes here!
  red: Player
  blue: Player
  turn: number
  startPlayerColor: PLAYERCOLOR
  currentPlayerColor: PLAYERCOLOR
  board: Board
  has_result: boolean
  lastMove: Move

  constructor() {
    this.red = new Player(Player.COLOR.RED)
    this.blue = new Player(Player.COLOR.BLUE)
    this.startPlayerColor = Player.COLOR.RED
    this.currentPlayerColor = Player.COLOR.RED
    this.turn = 0
    this.board = new Board()
    this.has_result = false
  }

  static fromJSON(json: any): GameState {
    console.log('creating gamestate from json:', json)
    console.log('start color', json.$.startPlayerColor)
    console.log('current color', json.$.currentPlayerColor)
    const gs = new GameState()
    gs.startPlayerColor = Player.ColorFromString(json.$.startPlayerColor)
    gs.currentPlayerColor = Player.ColorFromString(json.$.currentPlayerColor)
    gs.turn = parseInt(json.$.turn)
    gs.red = Player.fromJSON(json.red[0])
    gs.blue = Player.fromJSON(json.blue[0])
    gs.board = Board.fromJSON(json.board[0])
    if (json.lastMove) {
      gs.lastMove = Move.fromJSON(json.lastMove[0])
    }
    return gs
  }

  clone(): GameState {
    let clone = new GameState()
    clone.turn = this.turn
    clone.startPlayerColor = this.startPlayerColor
    clone.currentPlayerColor = this.currentPlayerColor
    clone.red = this.red.clone()
    clone.blue = this.blue.clone()
    clone.board = this.board.clone()
    clone.has_result = this.has_result
    return clone
  }

  static lift(that: any): GameState {//Flat clone that adds methods to an object serialized to json
    let clone = new GameState()
    console.log('GameState lifting', that)
    Object.assign<GameState, GameState>(clone, that)
    clone.red = Player.lift(clone.red)
    clone.blue = Player.lift(clone.blue)
    clone.board = Board.lift(clone.board)
    if (clone.lastMove)
      clone.lastMove = Move.lift(clone.lastMove)
    return clone
  }

  getCurrentPlayer(): Player {
    return this.getPlayerByColor(this.currentPlayerColor)
  }

  getOtherPlayer(): Player {
    return this.getPlayerByColor(Player.OtherColor(this.currentPlayerColor))
  }

  getPlayerByColor(color: PLAYERCOLOR) {
    if (color == Player.COLOR.RED) {
      return this.red
    } else {
      return this.blue
    }
  }

  getStartPlayer() {
    return this.getPlayerByColor(this.startPlayerColor)
  }
}


export type FIELDTYPE = 'EMPTY' | 'OBSTRUCTED' | 'RED' | 'BLUE';

export class Board {
  static Fieldtype: {
    empty: FIELDTYPE,
    obstructed: FIELDTYPE,
    red: FIELDTYPE,
    blue: FIELDTYPE
  } = {
    empty: 'EMPTY',
    obstructed: 'OBSTRUCTED',
    red: 'RED',
    blue: 'BLUE'
  }
  // REMEMBER to extend clone method when adding attributes here!
  public fields: FIELDTYPE[][]

  static fromJSON(json: any): Board {
    const b = new Board()
    b.fields = []
    json.fields.forEach(row => {
      row.field.forEach(f => {
        let x = f.$.x
        let y = f.$.y
        let fieldType = f.$.state
        if (b.fields[x] == null) {
          b.fields[x] = []
        }
        b.fields[x][y] = fieldType
      })
    })
    return b
  }

  constructor() {
    this.fields = []
    Array.from(Array(FIELDSIZE), (_, x) => {
      this.fields[x] = []
      Array.from(Array(FIELDSIZE), (_, y) => {
        let t: FIELDTYPE
        if (x % (FIELDSIZE - 1) == 0 && y > 0 && y < FIELDSIZE - 1) {
          t = Board.Fieldtype.red
        } else if (y % (FIELDSIZE - 1) == 0 && x > 0 && x < FIELDSIZE - 1) {
          t = Board.Fieldtype.blue
        } else {
          t = Board.Fieldtype.empty
        }
        this.fields[x][y] = t
      })
    })
  }

  field(c: Coordinates) {
    return this.fields[c.x][c.y]
  }

  setField(c: Coordinates, t: FIELDTYPE): void {
    this.fields[c.x][c.y] = t
  }

  clone(): Board {
    let clone = new Board()
    let clonedFields: FIELDTYPE[][] = []
    this.fields.forEach((row, x) => {
      if (clonedFields[x] == null) {
        clonedFields[x] = []
      }
      row.forEach(f => {
        clonedFields[x].push(f)
      })
    })
    clone.fields = clonedFields
    return clone
  }

  // TODO: do we need this?
  static lift(that: any) {
    let clone = new Board()
    let clonedFields = []
    for (let f of that.fields) {
      clonedFields.push(f)
    }
    clone.fields = clonedFields
    return clone
  }
}

export type PLAYERCOLOR = 0 | 1;

export class Player {
  // REMEMBER to extend clone method when adding attributes here!
  displayName: string
  color: PLAYERCOLOR

  static COLOR: { RED: PLAYERCOLOR, BLUE: PLAYERCOLOR } = {RED: 0, BLUE: 1}

  static ColorFromString(s: string): PLAYERCOLOR {
    if (s.match(/RED/i)) {
      return Player.COLOR.RED
    }
    if (s.match(/BLUE/i)) {
      return Player.COLOR.BLUE
    }
    throw 'Unknown color value: ' + s
  }

  static OtherColor(c: PLAYERCOLOR): PLAYERCOLOR {
    return c == Player.COLOR.RED ? Player.COLOR.BLUE : Player.COLOR.RED
  }

  static fromJSON(json: any): Player {
    const p = new Player(Player.ColorFromString(json.$.color))
    p.displayName = json.$.displayName
    return p
  }

  constructor(color: PLAYERCOLOR) {
    this.color = color
  }

  clone(): Player {
    let clone = new Player(this.color)
    clone.displayName = this.displayName
    return clone
  }

  // TODO need this? . Yes! For communication with the worker, or else objects won't have their methods
  static lift(that: any) {
    let clone = new Player(that.color)
    Object.assign<Player, Player>(clone, that)
    return clone
  }
}

export type Direction = 'UP' | 'UP_RIGHT' | 'RIGHT' | 'DOWN_RIGHT' | 'DOWN' | 'DOWN_LEFT' | 'LEFT' | 'UP_LEFT';

export interface Coordinates {
  x: number;
  y: number;
}

export class Move {
  readonly fromField: Coordinates
  readonly direction: Direction

  constructor(fromField: Coordinates, direction: Direction) {
    this.fromField = fromField
    this.direction = direction
  }

  static fromJSON(json: any): Move {
    return new Move({x: parseInt(json.$.x), y: parseInt(json.$.y)}, Move.directionFromString(json.$.direction))
  }

  private static directionFromString(s: string): Direction {
    switch (s) {
      case 'UP':
        return 'UP'
      case 'UP_RIGHT':
        return 'UP_RIGHT'
      case 'RIGHT':
        return 'RIGHT'
      case 'DOWN_RIGHT':
        return 'DOWN_RIGHT'
      case 'DOWN':
        return 'DOWN'
      case 'DOWN_LEFT':
        return 'DOWN_LEFT'
      case 'LEFT':
        return 'LEFT'
      case 'UP_LEFT':
        return 'UP_LEFT'
      default:
        throw `unknown direction ${s}`
    }
  }

  targetField(fieldCount: number): Coordinates {
    const result = {x: this.fromField.x, y: this.fromField.y}
    switch (this.direction) {
      case 'RIGHT':
        result.x += fieldCount
        break
      case 'LEFT':
        result.x -= fieldCount
        break
      case 'UP':
        result.y += fieldCount
        break
      case 'DOWN':
        result.y -= fieldCount
        break
      case 'DOWN_RIGHT':
        result.x += fieldCount
        result.y -= fieldCount
        break
      case 'DOWN_LEFT':
        result.x -= fieldCount
        result.y -= fieldCount
        break
      case 'UP_RIGHT':
        result.x += fieldCount
        result.y += fieldCount
        break
      case 'UP_LEFT':
        result.x -= fieldCount
        result.y += fieldCount
        break
    }
    return result
  }

  static lift(that: any) {
    let clone = new Move(that.fromField, that.direction)
    Object.assign<Move, Move>(clone, that)
    return clone
  }
}

export class GameResult {
  cause: 'REGULAR'
  reason: string
  winner: Player

  static fromJSON(json: any): GameResult {
    const gr = new GameResult()
    // TODO should this really take element 0? And if yes, why are there even two scores?
    gr.cause = json.score[0].$.cause
    gr.reason = json.score[0].$.reason
    gr.winner = json.winner ? Player.fromJSON(json.winner[0]) : null
    return gr
  }
}

// we always need to know if we should display cancel and send buttons
class MoveInput {
  readonly cancellable: boolean
  readonly sendable: boolean

  constructor(sendable: boolean, cancellable: boolean) {
    this.sendable = sendable
    this.cancellable = cancellable
  }
}

// user should select a fish, this is the first thing to input a new move
export class SelectFish extends MoveInput {
  readonly selectableFieldCoordinates: Coordinates[]

  constructor(selectable: Coordinates[]) {
    super(false, false)
    this.selectableFieldCoordinates = selectable
  }
}

export interface DirectionWithCoordinates {
  direction: Direction
  target: Coordinates
}

// user should select a target direction to move, this is the second thing to input a new move
export class SelectTargetDirection extends MoveInput {
  readonly origin: Coordinates
  readonly selectableDirections: DirectionWithCoordinates[]

  constructor(o: Coordinates, selectable: DirectionWithCoordinates[]) {
    super(false, false)
    this.origin = o
    this.selectableDirections = selectable
  }
}

// user has completed the input of a move and may start over or send the move
export class FinishMove extends MoveInput {
  constructor() {
    super(true, true)
  }
}

export type None = 'none';
export type Skip = 'skip'

export type UiState = SelectFish | SelectTargetDirection | FinishMove | Skip | None;

// describes a gamestate and possible interactions, the gamestate may be modified to represent an incomplete move
export class RenderState {
  gameState: GameState
  uiState: UiState

  constructor(gameState: GameState, uiState: UiState) {
    this.gameState = gameState
    this.uiState = uiState
  }

  equals(other: RenderState): boolean {
    return deepEqual(this, other)
  }
}

// describes a interface action the user has performed, will be returned by the viewer if the user clicks on something interactive
export type InteractionEvent = FieldSelected | Sent | Cancelled | Skipped;

export type Sent = 'sent';
export type Cancelled = 'cancelled';
export type Skipped = 'skipped';

export class FieldSelected {
  readonly coordinates: Coordinates

  constructor(c: Coordinates) {
    this.coordinates = c
  }
}
