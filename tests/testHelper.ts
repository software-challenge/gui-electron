import { Board, Piece, Coordinates, FieldSelected, FIELDSIZE, SHIFT, PLAYERCOLOR, PIECETYPE, FIELDPIXELWIDTH, GameRuleLogic, GameState, InteractionEvent, Move, RenderState, SelectPiece, UndeployedPieceSelected, SelectDragTargetField, SelectSetTargetField, UiState, ScreenCoordinates, Field } from '../src/api/rules/CurrentGame'

export class TestHelper {
  static parsePiece(pc: PLAYERCOLOR, c: String): Piece {
    switch(c) {
      case 'Q': return new Piece('BEE', pc)
      case 'B': return new Piece('BEETLE', pc)
      case 'G': return new Piece('GRASSHOPPER', pc)
      case 'S': return new Piece('SPIDER', pc)
      case 'A': return new Piece('ANT', pc)
      default: throw new Error("Expected piecetype character to be one of Q,B,G,S or A, was: $c")
    }
  }

  static createCustomBoard(boardString: String): Board {//Hardcoded auf Feldgröße von 9
    let boardStringWithoutWhitespace = boardString.replace(/ /g, "")
    if ((61 * 2) !== boardStringWithoutWhitespace.length)
      throw "Length of boardString does not match size of the Board"

    let fields: number[][] = [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0], [-1, 4], [0, 3], [1, 2], [2, 1], [3, 0], [4, -1], [-2, 4], [-1, 3], [0, 2], [1, 1], [2, 0], [3, -1], [4, -2], [-3, 4], [-2, 3], [-1, 2], [0, 1], [1, 0], [2, -1], [3, -2], [4, -3], [-4, 4], [-3, 3], [-2, 2], [-1, 1], [0, 0], [1, -1], [2, -2], [3, -3], [4, -4], [-4, 3], [-3, 2], [-2, 1], [-1, 0], [0, -1], [1, -2], [2, -3], [3, -4], [-4, 2], [-3, 1], [-2, 0], [-1, -1], [0, -2], [1, -3], [2, -4], [-4, 1], [-3, 0], [-2, -1], [-1, -2], [0, -3], [1, -4], [-4, 0], [-3, -1], [-2, -2], [-1, -3], [0, -4]]
    let b = new Board()
    for (var i = 0; i < fields.length; i++) {
      var f: Field
      switch (boardStringWithoutWhitespace.charAt(i * 2)) {
        case 'R':
          f = new Field([this.parsePiece('RED', boardStringWithoutWhitespace.charAt(i * 2 + 1))], new Coordinates(fields[i][0], fields[i][1], Coordinates.calcS(fields[i][0], fields[i][1])), false)
          break;
        case 'B':
          f = new Field([this.parsePiece('BLUE', boardStringWithoutWhitespace.charAt(i * 2 + 1))], new Coordinates(fields[i][0], fields[i][1], Coordinates.calcS(fields[i][0], fields[i][1])), false)
          break;
        case 'O':
          f = new Field([], new Coordinates(fields[i][0], fields[i][1], Coordinates.calcS(fields[i][0], fields[i][1])), true)
          break;
        case '-':
          f = new Field([], new Coordinates(fields[i][0], fields[i][1], Coordinates.calcS(fields[i][0], fields[i][1])), false)
          break;
        default: throw new Error("Expected first character to be either B (blue), R (red) or O (obstructed), was: " + boardStringWithoutWhitespace.charAt(i * 2))
      }
      b.fields[fields[i][0]+SHIFT][fields[i][1]+SHIFT] = f
    }
    return b
  }

  static updateUndeployedPiecesFromBoard(gs: GameState) {
    let deployedRed = gs.board.getPiecesFor('RED')
    gs.undeployedRedPieces = gs.undeployedRedPieces.filter(p => deployedRed.indexOf(p) !== -1 )
    let deployedBlue = gs.board.getPiecesFor('BLUE')
    gs.undeployedRedPieces = gs.undeployedRedPieces.filter(p => deployedBlue.indexOf(p) !== -1 )
  }

  static updateGamestateWithBoard(gs: GameState, customBoard: String) {
    let board = this.createCustomBoard(customBoard)
    gs.board = board
    this.updateUndeployedPiecesFromBoard(gs)
  }
}
