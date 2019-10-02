import * as deepEqual    from 'deep-equal'
import { GameRuleLogic } from './HiveGameRules'
import { Undeployed }    from '../../viewer/Engine/HiveEngine'

export type LineDirection = 'HORIZONTAL' | 'VERTICAL' | 'RISING_DIAGONAL' | 'FALLING_DIAGONAL';
export const ALL_DIRECTIONS: LineDirection[] = ['HORIZONTAL', 'VERTICAL', 'RISING_DIAGONAL', 'FALLING_DIAGONAL']

export const FIELDSIZE = 11 // diameter of the hexagon board
export const SHIFT = 5 // floor(FIELDSIZE/2)
export const FIELDPIXELWIDTH = 34
export const STARTING_PIECES = 'QSSSGGBBAAA'

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
  undeployedRedPieces: Piece[]
  undeployedBluePieces: Piece[]

  constructor() {
    this.red = new Player('RED')
    this.blue = new Player('BLUE')
    this.startPlayerColor = 'RED'
    this.currentPlayerColor = 'RED'
    this.turn = 0
    this.board = new Board()
    this.undeployedRedPieces = Array.from(STARTING_PIECES).map(c => GameState.parsePiece('RED', c))
    this.undeployedBluePieces = Array.from(STARTING_PIECES).map(c => GameState.parsePiece('BLUE', c))
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
    gs.undeployedRedPieces = []
    if (json.undeployedRedPieces[0].piece != null && typeof json.undeployedRedPieces[0].piece != 'undefined') {
      json.undeployedRedPieces[0].piece.forEach(p => {
        gs.undeployedRedPieces.push(Piece.fromJSON(p))
      })
    }
    gs.undeployedBluePieces = []
    if (json.undeployedBluePieces[0].piece != null && typeof json.undeployedRedPieces[0].piece != 'undefined') {
      json.undeployedBluePieces[0].piece.forEach(p => {
        gs.undeployedBluePieces.push(Piece.fromJSON(p))
      })
    }
    if (json.lastMove) {
      gs.lastMove = Move.fromJSON(json.lastMove[0])
    }
    return gs
  }

  static parsePiece(pc: PLAYERCOLOR, c: String): Piece {
    switch (c) {
      case 'Q':
        return new Piece('BEE', pc)
      case 'B':
        return new Piece('BEETLE', pc)
      case 'G':
        return new Piece('GRASSHOPPER', pc)
      case 'S':
        return new Piece('SPIDER', pc)
      case 'A':
        return new Piece('ANT', pc)
      default:
        throw 'Expected piecetype character to be one of Q,B,G,S or A, was: $c'
    }
  }

  clone(): GameState {
    let clone = new GameState()
    clone.turn = this.turn
    clone.startPlayerColor = this.startPlayerColor
    clone.currentPlayerColor = this.currentPlayerColor
    clone.red = this.red.clone()
    clone.blue = this.blue.clone()
    clone.board = this.board.clone()
    clone.undeployedRedPieces = this.undeployedRedPieces
    clone.undeployedBluePieces = this.undeployedBluePieces
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
    if (clone.lastMove) {
      clone.lastMove = Move.lift(clone.lastMove)
    }
    return clone
  }

  getCurrentPlayer(): Player {
    return this.getPlayerByColor(this.currentPlayerColor)
  }

  getOtherPlayer(): Player {
    return this.getPlayerByColor(Player.OtherColor(this.currentPlayerColor))
  }

  getPlayerByColor(color: PLAYERCOLOR) {
    if (color == 'RED') {
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
      rx = -ry - rz
    } else if (y_diff > z_diff) {
      ry = -rx - rz
    } else {
      rz = -rx - ry
    }

    return new Coordinates(rx, ry, rz)
  }

  boardCoordinates(): Coordinates {
    // calculate axial coordinates
    let aq = (Math.sqrt(3) / 3 * this.x - 1. / 3 * this.y) / FIELDPIXELWIDTH
    let ar = (2. / 3 * this.y) / FIELDPIXELWIDTH
    // convert to cube coordinates
    let x = aq
    let z = ar
    let y = -x - z
    let cube = new Coordinates(x, y, z)
    // round to whole integers
    return ScreenCoordinates.round(cube.q, cube.r, cube.s)
  }

  arrayCoordinates(): ArrayCoordinates {
    return this.boardCoordinates().arrayCoordinates()
  }
}

export class ArrayCoordinates {
  x: number // first index
  y: number // 2. index of 2d-array representation

  constructor(x: number, y: number) {
    if (x < 0 || y < 0 || x > FIELDSIZE - 1 || y > FIELDSIZE - 1) {
      console.log('Given 2d-coordinates are corrupted: {x: ' + x + ', y: ' + y + '}')
      return null
    }
    this.x = x
    this.y = y
  }

  boardCoordinates(): Coordinates {
    return new Coordinates(this.x - SHIFT, this.y - SHIFT, -(this.x - SHIFT) - (this.y - SHIFT))
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
    if (Math.round(q + r + s) != 0) {
      console.log('Given coordinates are corrupted: ' + this)
      return null
    }
    //if (!GameRuleLogic.isOnBoard(this)) {
    //  console.log('Given coordinates are out of field: ' + this)
    //}
  }

  screenCoordinates(): ScreenCoordinates {
    let axial = {
      q: this.q,
      r: this.s,
    }
    let x = FIELDPIXELWIDTH * (Math.sqrt(3.0) * axial.q + Math.sqrt(3.0) / 2 * axial.r)
    let y = FIELDPIXELWIDTH * (3.0 / 2 * axial.r)

    return new ScreenCoordinates(x, y)
  }

  arrayCoordinates(): ArrayCoordinates {
    return new ArrayCoordinates(this.q + SHIFT, this.r + SHIFT)
  }

  static calcS(q: number, r: number): number {
    return -q - r
  }

  equal(c: Coordinates): boolean {
    return this.q == c.q && this.r == c.r && this.s == c.s
  }

  isInLineWith(c: Coordinates): boolean {
    return this.q - c.q == -this.r + c.r && this.s == c.s || this.q - c.q == -this.s + c.s && this.r == c.r || this.s - c.s == -this.r + c.r && this.q == c.q
  }

  distanceTo(c: Coordinates): integer {
    return Math.floor((Math.abs(c.q - this.q) + Math.abs(c.r - this.r) + Math.abs(c.s - this.s)) / 2)
  }

  clone(): Coordinates {
    return new Coordinates(this.q, this.r, this.s)
  }

  toString(): string {
    return '{ q: ' + this.q + ', r: ' + this.r + ', s: ' + this.s + ' }'
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

  static fromJSON(json: any): Piece {
    // TODO its with $ when in gamestate and without when in move...? make consistent!
    if (json['$']) {
      return new Piece(
        json['$']['type'],
        json['$']['owner'],
      )
    } else {
      return new Piece(
        json['type'],
        json['owner'],
      )
    }
  }

  clone() {
    return new Piece(this.kind, this.color)
  }
}

export class Field {
  stack: Piece[]
  coordinates: Coordinates
  obstructed: boolean

  constructor(stack: Piece[], coordinates: Coordinates, obstructed: boolean = false) {
    this.stack = stack
    this.coordinates = coordinates
    this.obstructed = obstructed
  }

  static lift(that: any) {
    let c: Coordinates = new Coordinates(that.coordinates.q, that.coordinates.r, that.coordinates.s)
    let stack: Piece[] = []
    that.stack.forEach(p => {
      stack.push(new Piece(p.kind, p.color))
    })

    return new Field(stack, c, that.obstructed)
  }

  clone(): Field {
    let f = new Field([], this.coordinates.clone(), this.obstructed)
    this.stack.forEach(e => f.stack.push(new Piece(e.kind, e.color)))
    return f
  }

  owner(): PLAYERCOLOR {
    if (this.stack.length == 0) {
      return null
    }
    return this.stack[this.stack.length - 1].color
  }
}

export class Board {
  // REMEMBER to extend clone method when adding attributes here!
  public fields: Field[][]

  static fromJSON(json: any): Board {
    // weil ich die nulls brauche
    const b = new Board()
    b.fields = []
    for (let t = 0; t < FIELDSIZE; t++) {
      b.fields[t] = []
      for (let tt = 0; tt < FIELDSIZE; tt++) {
        b.fields[t].push(null)
      }
    }

    json.fields.forEach(row => {
      row.field.forEach(f => {
        let x: number = Number(f.$.x)
        let y: number = Number(f.$.y)
        let z: number = Number(f.$.z)
        let c: Coordinates = new Coordinates(x, y, z)
        if (b.fields[c.arrayCoordinates().x] == null) {
          b.fields[c.arrayCoordinates().x] = []
        }
        let stack = []
        if (f.piece) {
          f.piece.forEach(p => {
            stack.push(Piece.fromJSON(p))
          })
        }
        b.fields[c.arrayCoordinates().x][c.arrayCoordinates().y] = new Field(stack, c, f.$.isObstructed == 'true')
      })
    })
    return b
  }

  constructor() {
    this.fields = []
    for (let x: number = -SHIFT; x <= SHIFT; x++) {
      this.fields[x + SHIFT] = []
      for (let y: number = Math.max(-SHIFT, -x - SHIFT); y <= Math.min(SHIFT, -x + SHIFT); y++) {
        this.fields[x + SHIFT][y + SHIFT] = new Field([], new Coordinates(x, y, -x - y))
      }
    }
  }

  clone(): Board {
    let clone = new Board()
    let clonedFields: Field[][] = []
    for (let x: number = -SHIFT; x <= SHIFT; x++) {
      clonedFields[x + SHIFT] = []
      for (let y: number = Math.max(-SHIFT, -x - SHIFT); y <= Math.min(SHIFT, -x + SHIFT); y++) {
        let field = this.fields[x + SHIFT][y + SHIFT]
        if (field == null) {
          continue
        }
        let clonedStack = []
        field.stack.forEach(p => clonedStack.push(p.clone()))
        clonedFields[x + SHIFT][y + SHIFT] = new Field(clonedStack, field.coordinates, field.obstructed)
      }
    }
    clone.fields = clonedFields
    return clone
  }

  // Create real object (with methods) from data structure which was deserialized from JSON
  static lift(that: any) {
    let clone = new Board()
    let clonedFields: Field[][] = []
    that.fields.forEach((row, x) => {
      if (clonedFields[x] == null) {
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

  getField(c: Coordinates): Field {
    if (!GameRuleLogic.isOnBoard(c) || this.fields.length <= c.arrayCoordinates().x || c.arrayCoordinates().x < 0 || this.fields[c.arrayCoordinates().x].length <= c.arrayCoordinates().y || c.arrayCoordinates().y < 0) {
      return null
    }
    return this.fields[c.arrayCoordinates().x][c.arrayCoordinates().y]
  }

  getTopPiece(c: Coordinates): Piece {
    return this.fields[c.arrayCoordinates().x][c.arrayCoordinates().y].stack.length > 0 ? this.fields[c.arrayCoordinates().x][c.arrayCoordinates().y].stack[this.fields[c.arrayCoordinates().x][c.arrayCoordinates().y].stack.length - 1] : null
  }

  getPiecesFor(color: PLAYERCOLOR) {
    let pieces: Piece[] = []
    for (let col of this.fields) {
      for (let f of col) {
        if (f == null) {
          continue
        }
        pieces.concat(f.stack.filter(p => p.color == color))
      }
    }
    return pieces
  }

  countPieces(): integer {
    let placedPieces = 0
    for (let col of this.fields) {
      for (let f of col) {
        if (f == null) {
          continue
        }
        placedPieces += f.stack.length
      }
    }

    return placedPieces
  }

  countFields(): integer {
    let occupiedFields = 0
    for (let col of this.fields) {
      for (let f of col) {
        if (f == null) {
          continue
        }
        occupiedFields += f.stack.length > 0 ? 1 : 0
      }
    }

    return occupiedFields
  }

  toString(): string {
    let text = 'Board:\n'
    for (let row = 0; row < this.fields.length; row++) {
      for (let n = 0; n < Math.abs(SHIFT - row); n++) {
        text += ' '
      }

      for (let field of this.fields[row].filter(e => e != null)) {
        if (field.obstructed) {
          text += 'OO'
        } else if (field.stack.length == 0) {
          text += '--'
        } else {
          let piece = field.stack[field.stack.length - 1]
          switch (piece.kind) {
            case 'ANT':
              text += (piece.color == 'RED' ? 'R' : 'B') + 'A'
              break
            case 'BEE':
              text += (piece.color == 'RED' ? 'R' : 'B') + 'Q'
              break
            case 'BEETLE':
              text += (piece.color == 'RED' ? 'R' : 'B') + 'B'
              break
            case 'GRASSHOPPER':
              text += (piece.color == 'RED' ? 'R' : 'B') + 'G'
              break
            case 'SPIDER':
              text += (piece.color == 'RED' ? 'R' : 'B') + 'S'
              break
            default:
              console.log('Unkown piece-type: ', piece.kind)
              break
          }
        }

        text += '\n'
      }
    }

    text += '\n\nPieces:\n'
    for (let f of GameRuleLogic.getFieldsWithPiece(this)) {
      text += f.owner() + ':\t@' + f.coordinates + '\tPiece:\t' + f.stack[f.stack.length - 1].kind + '\n'
    }
    return text
  }
}

export type PLAYERCOLOR = 'RED' | 'BLUE'

export class Player {
  // REMEMBER to extend clone method when adding attributes here!
  displayName: string
  color: PLAYERCOLOR

  static ColorFromString(s: string): PLAYERCOLOR {
    if (s.match(/RED/i)) {
      return 'RED'
    }
    if (s.match(/BLUE/i)) {
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

export type MOVETYPE = 'SET' | 'DRAG' | 'MISS'

export class Move {
  readonly fromField: Coordinates
  readonly undeployedPiece: PIECETYPE
  readonly toField: Coordinates
  readonly moveType: MOVETYPE

  constructor(fromFieldOrPiece: Coordinates | PIECETYPE | null, toField: Coordinates) {
    if (fromFieldOrPiece instanceof Coordinates) {
      this.moveType = 'DRAG'
      this.fromField = fromFieldOrPiece
    } else if (typeof fromFieldOrPiece == 'undefined' || fromFieldOrPiece == null) {
      this.moveType = 'MISS'
    } else {
      this.moveType = 'SET'
      this.undeployedPiece = fromFieldOrPiece
    }
    this.toField = toField
  }

  static fromJSON(json: any): Move {
    // TODO
    let q = parseInt(json.$.x)
    let r = parseInt(json.$.y)
    return new Move(
      new Coordinates(q, r, Coordinates.calcS(q, r)),
      new Coordinates(q, r, Coordinates.calcS(q, r)),
    )
  }

  static lift(that: any) {
    let clone = new Move(that.fromField, that.toField)
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

// user should select a piece, this is the first thing to input a new move
export class SelectPiece extends MoveInput {
  readonly selectableFieldCoordinates: Coordinates[]
  readonly undeployedColor: PLAYERCOLOR

  constructor(selectable: Coordinates[], color: PLAYERCOLOR) {
    super(false, false)
    this.selectableFieldCoordinates = selectable
    this.undeployedColor = color
  }
}

// user should select
export class SelectMiss extends MoveInput {
  readonly color: PLAYERCOLOR

  constructor(color: PLAYERCOLOR) {
    super(false, false)
    this.color = color
  }
}

// user should select a target field to move a piece which is already on the board
export class SelectDragTargetField extends MoveInput {
  readonly origin: Coordinates
  readonly selectableFields: Coordinates[]

  constructor(o: Coordinates, selectable: Coordinates[]) {
    super(false, false)
    this.origin = o
    this.selectableFields = selectable
  }
}

// user should select a target field to put a piece from the undeployed pieces
export class SelectSetTargetField extends MoveInput {
  readonly color: PLAYERCOLOR
  readonly index: number
  readonly selectableFields: Coordinates[]

  constructor(color: PLAYERCOLOR, index: number, selectable: Coordinates[]) {
    super(false, false)
    this.color = color
    this.index = index
    this.selectableFields = selectable
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

export type UiState = SelectPiece | SelectSetTargetField | SelectDragTargetField | FinishMove | Skip | None;

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
export type InteractionEvent = FieldSelected | UndeployedPieceSelected | MissSelected | Sent | Cancelled | Skipped;

export type Sent = 'sent';
export type Cancelled = 'cancelled';
export type Skipped = 'skipped';

export class FieldSelected {
  readonly coordinates: Coordinates

  constructor(c: Coordinates) {
    this.coordinates = c
  }
}

export class UndeployedPieceSelected {
  readonly color: PLAYERCOLOR
  readonly index: number
  kind: PIECETYPE

  constructor(target: Undeployed) {
    this.color = target.color
    this.index = target.index
  }

  setKind(kind: PIECETYPE) {
    this.kind = kind
  }
}

export class MissSelected {

}
