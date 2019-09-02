import * as deepEqual from 'deep-equal'

export type LineDirection = 'HORIZONTAL' | 'VERTICAL' | 'RISING_DIAGONAL' | 'FALLING_DIAGONAL';
export const ALL_DIRECTIONS: LineDirection[] = ['HORIZONTAL', 'VERTICAL', 'RISING_DIAGONAL', 'FALLING_DIAGONAL']

export const FIELDSIZE = 9 // diameter of the hexagon board
export const SHIFT = 4 // floor(FIELDSIZE/2)
export const FIELDPIXELWIDTH = 34

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
    this.red = new Player('RED')
    this.blue = new Player('BLUE')
    this.startPlayerColor = 'RED'
    this.currentPlayerColor = 'RED'
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
    if(json.lastMove) {
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

  /** Flat clone that adds methods to an object serialized to json */
  static lift(that: any): GameState {
    let clone = new GameState()
    Object.assign<GameState, GameState>(clone, that)
    clone.red = Player.lift(clone.red)
    clone.blue = Player.lift(clone.blue)
    clone.board = Board.lift(clone.board)
    if(clone.lastMove)
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
    if(color == 'RED') {
      return this.red
    } else {
      return this.blue
    }
  }

  getStartPlayer() {
    return this.getPlayerByColor(this.startPlayerColor)
  }
}

export class ScreenCoordinates {

  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  static round(q: number, r: number, s: number) {
    let rx = Math.round(q)
    let ry = Math.round(r)
    let rz = Math.round(s)

    let x_diff = Math.abs(rx - q)
    let y_diff = Math.abs(ry - r)
    let z_diff = Math.abs(rz - s)

    if (x_diff > y_diff && x_diff > z_diff) {
      rx = -ry-rz
    } else if (y_diff > z_diff) {
      ry = -rx-rz
    } else {
      rz = -rx-ry
    }

    return new Coordinates(rx, ry, rz)
  }

  boardCoordinates(): Coordinates {
    var q = ( 2./3 * this.x                        ) / FIELDPIXELWIDTH
    var r = (-1./3 * this.x  +  Math.sqrt(3)/3 * this.y) / FIELDPIXELWIDTH
    return ScreenCoordinates.round(q, r, Coordinates.calcS(q, r))
  }
}

export class Coordinates {

  q: number
  r: number
  s: number

  constructor(q: number, r: number, s: number) {
    this.q = q
    this.r = r
    this.s = s
  }

  screenCoordinates(): ScreenCoordinates {
    let x = FIELDPIXELWIDTH * (Math.sqrt(3.0)/2 * this.q - Math.sqrt(3.0)/2 * this.r)
    let y = FIELDPIXELWIDTH * (-3.0/2 * this.q -  3.0/2 * this.r)
    return new ScreenCoordinates(x, y)
  }

  static calcS(q: number, r: number): number {
    return -q - r
  }
}

export type PIECETYPE = 'ANT' | 'BEE' | 'BEETLE' | 'GRASSHOPPER' | 'SPIDER'

export class Piece {
  kind: PIECETYPE
  color: PLAYERCOLOR

  constructor(kind: PIECETYPE, color: PLAYERCOLOR) {
    this.kind = kind
    this.color = color
  }
}

export class Field {
  stack: Piece[]
  coordinates: Coordinates

  constructor(stack: Piece[], coordinates: Coordinates) {
    this.stack = stack
    this.coordinates = coordinates
  }

  static lift(that: any) {
    let c: Coordinates = new Coordinates(that.coordinates.q, that.coordinates.r, that.coordinates.s)
    let stack: Piece[] = []
    that.stack.forEach(p => {
      stack.push(new Piece(p.kind, p.color))
    })
    return new Field(stack, c)
  }
}

export class Board {
  // REMEMBER to extend clone method when adding attributes here!
  public fields: Field[][]

  static fromJSON(json: any): Board {
    const b = new Board()
    b.fields = []
    json.fields.forEach(row => {
      row.field.forEach(f => {
        let x: number = Number(f.$.x)
        let y: number = Number(f.$.y)
        let z: number = Number(f.$.z)
        let obstructed = f.$.obstructed
        if(b.fields[x+SHIFT] == null) {
          b.fields[x+SHIFT] = []
        }
        let stack = []
        if (f.piece) {
          stack.push(new Piece('BEE', 'RED'))
        }
        b.fields[x+SHIFT][y+SHIFT] = new Field(stack, new Coordinates(x, y, z))
      })
    })
    return b
  }

  constructor() {
    this.fields = []
    for (var x: number = -SHIFT; x <= SHIFT; x++) {
      this.fields[x+SHIFT] = []
      for (var y: number = Math.max(-SHIFT, -x-SHIFT); y <= Math.min(SHIFT, -x+SHIFT); y++) {
        this.fields[x+SHIFT][y+SHIFT] = new Field([], new Coordinates(x, y, -x-y))
      }
    }
  }

  field(c: Coordinates) {
    return this.fields[c.q][c.r]
  }

  clone(): Board {
    let clone = new Board()
    let clonedFields: Field[][] = []
    this.fields.forEach((row, x) => {
      if(clonedFields[x] == null) {
        clonedFields[x] = []
      }
      row.forEach(f => {
        clonedFields[x].push(f)
      })
    })
    clone.fields = clonedFields
    return clone
  }

  // Create real object (with methods) from data structure which was deserialized from JSON
  static lift(that: any) {
    let clone = new Board()
    let clonedFields: Field[][] = []
    that.fields.forEach((row, x) => {
      if(clonedFields[x] == null) {
        clonedFields[x] = []
      }
      row.forEach((f, y) => {
        if (f != null) {
          clonedFields[x][y] = Field.lift(f)
        }
      })
    })
    clone.fields = clonedFields
    return clone
  }
}

export type PLAYERCOLOR = 'RED' | 'BLUE'


export class Player {
  // REMEMBER to extend clone method when adding attributes here!
  displayName: string
  color: PLAYERCOLOR

  static ColorFromString(s: string): PLAYERCOLOR {
    if(s.match(/RED/i)) {
      return 'RED'
    }
    if(s.match(/BLUE/i)) {
      return 'BLUE'
    }
    throw 'Unknown color value: ' + s
  }

  static OtherColor(c: PLAYERCOLOR): PLAYERCOLOR {
    return c == 'RED' ? 'BLUE' : 'RED'
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

  // Create real object (with methods) from data structure which was deserialized from JSON
  static lift(that: any) {
    let clone = new Player(that.color)
    Object.assign<Player, Player>(clone, that)
    return clone
  }
}

export type Direction = 'UP' | 'UP_RIGHT' | 'RIGHT' | 'DOWN_RIGHT' | 'DOWN' | 'DOWN_LEFT' | 'LEFT' | 'UP_LEFT';

export class Move {
  readonly fromField: Coordinates
  readonly toField: Coordinates

  constructor(fromField: Coordinates, toField: Coordinates) {
    this.fromField = fromField
    this.toField = toField
  }

  static fromJSON(json: any): Move {
    // TODO
    let q = parseInt(json.$.x)
    let r = parseInt(json.$.y)
    return new Move(
      new Coordinates(q, r, Coordinates.calcS(q,r)),
      new Coordinates(q, r, Coordinates.calcS(q,r)),
    )
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
