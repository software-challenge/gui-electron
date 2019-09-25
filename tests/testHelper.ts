import { Board, Piece, Coordinates, FIELDSIZE, SHIFT, PLAYERCOLOR, GameRuleLogic, GameState, Field } from '../src/api/rules/CurrentGame'

export class TestHelper {
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
        throw new Error('Expected piecetype character to be one of Q,B,G,S or A, was: $c')
    }
  }

  static createCustomBoard(boardString: String): Board {
    let boardStringWithoutWhitespace = boardString.replace(/ /g, '')

    let n = 1 + 6 * (Math.pow(SHIFT, 2) + SHIFT) / 2
    if ((n * 2) !== boardStringWithoutWhitespace.length) {
      throw 'Length of boardString (' + boardStringWithoutWhitespace.length + ') does not match size of the Board (' + (n * 2) + '), SHIFT: ' + SHIFT
    }

    let i = 0
    let b = new Board()
    for (let q = -SHIFT; q <= SHIFT; q++) {
      for (let r = Math.max(-SHIFT, -q - SHIFT); r <= Math.min(SHIFT, -q + SHIFT); r++) {
        switch (boardStringWithoutWhitespace.charAt(i * 2)) {
          case 'R':
            b.getField(new Coordinates(r, Coordinates.calcS(q, r), q)).stack = [this.parsePiece('RED', boardStringWithoutWhitespace.charAt(i * 2 + 1))]
            break
          case 'B':
            b.getField(new Coordinates(r, Coordinates.calcS(q, r), q)).stack = [this.parsePiece('BLUE', boardStringWithoutWhitespace.charAt(i * 2 + 1))]
            break
          case 'O':
            b.getField(new Coordinates(r, Coordinates.calcS(q, r), q)).obstructed = true
            break
          case '-':
            break
          default:
            throw new Error('Expected first character to be either B (blue), R (red) or O (obstructed), was: ' + boardStringWithoutWhitespace.charAt(i * 2))
        }
        i++
      }
    }

    return b
  }

  static updateUndeployedPiecesFromBoard(gs: GameState) {
    let deployedRed = gs.board.getPiecesFor('RED')
    gs.undeployedRedPieces = gs.undeployedRedPieces.filter(p => deployedRed.indexOf(p) !== -1)
    let deployedBlue = gs.board.getPiecesFor('BLUE')
    gs.undeployedRedPieces = gs.undeployedRedPieces.filter(p => deployedBlue.indexOf(p) !== -1)
  }

  static updateGamestateWithBoard(gs: GameState, customBoard: String) {
    let board = this.createCustomBoard(customBoard)
    gs.board = board
    this.updateUndeployedPiecesFromBoard(gs)
  }
}
