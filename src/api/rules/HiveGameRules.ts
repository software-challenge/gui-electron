import { Board, Coordinates, FIELDSIZE, PIECETYPE, Move, Player, PLAYERCOLOR } from './Hive'

export class GameRuleLogic {
  static possibleMoves(board: Board, field: Coordinates): Move[] {
    // TODO
    return []
  }

  static addBlockedFields(board: Board) {
    // TODO
    return board
  }

  static moveTarget(move: Move, board: Board): Board {
    // TODO
    return board
  }

  static playerFieldType(player: PLAYERCOLOR) {
    // TODO
    return null
  }
}
