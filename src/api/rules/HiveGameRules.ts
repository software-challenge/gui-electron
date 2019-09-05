import { Board, Coordinates, FIELDSIZE, PIECETYPE, Move, Player, PLAYERCOLOR, Field, SHIFT, GameState, Piece } from './Hive'

export class GameRuleLogic {

  static getNeighbours(board: Board, field: Coordinates): Field[] {
    let tmp = []
    let coords = field.screenCoordinates()

    if (coords.x + 1 <= SHIFT) {
      tmp.push(board.fields[coords.x + 1][coords.y])
      if (coords.y + 1 <= SHIFT) {
        tmp.push(board.fields[coords.x + 1][coords.y + 1])
      }
      if (coords.y - 1 >= -SHIFT) {
        tmp.push(board.fields[coords.x + 1][coords.y - 1])
      }
    }
    if (coords.x - 1 >= -SHIFT) {
      tmp.push(board.fields[coords.x - 1][coords.y])
      if (coords.y + 1 <= SHIFT) {
        tmp.push(board.fields[coords.x - 1][coords.y + 1])
      }
      if (coords.y - 1 >= -SHIFT) {
        tmp.push(board.fields[coords.x - 1][coords.y - 1])
      }
    }
    if (coords.y + 1 <= SHIFT) {
      tmp.push(board.fields[coords.x][coords.y + 1])
    }
    if (coords.y - 1 >= -SHIFT) {
      tmp.push(board.fields[coords.x][coords.y - 1])
    }

    return tmp
  }

  static isNeighbour(a: Coordinates, b: Coordinates): boolean {
    let ca = a.screenCoordinates()
    let cb = b.screenCoordinates()
    return ca.x == cb.x && ca.y == cb.y - 1 || ca.x == cb.x && ca.y == cb.y + 1 || ca.x == cb.x + 1 && ca.y == cb.y || ca.x == cb.x + 1 && ca.y == cb.y - 1 || ca.x == cb.x + 1 && ca.y == cb.y + 1 || ca.x == cb.x - 1 && ca.y == cb.y || ca.x == cb.x - 1 && ca.y == cb.y - 1 || ca.x == cb.x - 1 && ca.y == cb.y + 1
  }

  static isQueenBlocked(board: Board, player: PLAYERCOLOR): boolean {
    let queen = this.findPiecesOfTypeAndPlayer(board, 'BEE', player)
    if (queen.length == 0) {
      return false
    }

    this.getNeighbours(board, queen[0]).forEach(field => {
      if (field.stack == null) {
        return false
      }
    })

    return true
  }

  static findPiecesOfTypeAndPlayer(board: Board, type: PIECETYPE, player: PLAYERCOLOR): Coordinates[] {
    let tmp = []
    this.fieldsOwnedByPlayer(board, player).forEach((field) => {
      if (field.stack[field.stack.length - 1].kind == type) {
        tmp.push(field.coordinates)
      }
    })

    return tmp
  }

  static fieldsOwnedByPlayer(board: Board, player: PLAYERCOLOR): Field[] {
    let fields= []
    board.fields.forEach((row) => {
      row.forEach((field) => {
        if (field.owner.toString() == player) {
          fields.push(field)
        }
      })
    })

    return fields
  }

  /** Determines whether or not given coordinate is adjacent to the swarm
   * if except is != null, the field of except will not be counted as part of the swarm
   * 
   * @param board
   * @param field
   * @param except
   */
  static fieldNextToSwarm(board: Board, field: Coordinates, except: Coordinates): boolean {
    let fields = this.getFieldsNextToSwarm(board, except)
    for (let f of fields) {
      if (f.coordinates.q == field.q || f.coordinates.r == field.r || f.coordinates.s == field.s) {
        return true
      }
    }

    return false
  }

  /** returns all fields adjacent to the swarm.
   * If except is != null the field of except is not counted as the swarm and fields only adjacent to this perticular field wont be listed within the return value
   * 
   * @param board
   * @param except
   */
  static getFieldsNextToSwarm(board: Board, except: Coordinates): Field[] {
    let pieces = []
    board.fields.forEach(row => row.forEach(field => {
      if (field.stack.length == 0 && !field.obstructed) {
        let tmp = this.getNeighbours(board, field.coordinates)
        tmp.forEach(f => {
          if (f.stack.length > 0 && (except == null || f.coordinates.q != except.q || f.coordinates.r != except.r || f.coordinates.s != except.s))
            pieces.push(field)
        })
      }
    }))

    return pieces
  }

  static isOnBoard(coord: Coordinates): boolean {
    let c = coord.screenCoordinates()
    return -SHIFT <= c.x && c.x <= SHIFT && -SHIFT <= c.y && c.y <= SHIFT
  }

  static validateMove(state: GameState, move: Move): boolean {
    // TODO
    return false
  }

  static validateAntMove(state: GameState, move: Move): boolean {
    if (!this.fieldNextToSwarm(state.board, move.toField, move.fromField)) {
      return false
    }

    // A-Star modified
    let fieldCounter = 0
    let fields = this.getFieldsNextToSwarm(state.board, move.fromField)
    let visitedFields = []
    let touchedFields = []
    let currentField = move.fromField
    let target = move.toField.screenCoordinates()
    while (currentField == move.fromField || visitedFields.length < fields.length && touchedFields.length > 0 && (currentField.q != move.toField.q || currentField.r != move.toField.r || currentField.s != move.toField.s)) {
      visitedFields.push({
        c: currentField,
        dist: Math.sqrt(Math.pow(target.x - currentField.screenCoordinates().x, 2) + Math.pow(target.y - currentField.screenCoordinates().y, 2))
      })
      let i = touchedFields.findIndex(e => e.c === currentField)
      if (i || i == 0) {
        delete touchedFields[i]
      }

      // find all valid adjacent fields
      for (let f of fields) {
        if (this.isNeighbour(f.coordinates, currentField)) {
          let tmp = {
            c: f.coordinates,
            dist: Math.sqrt(Math.pow(target.x - f.coordinates.screenCoordinates().x, 2) + Math.pow(target.y - f.coordinates.screenCoordinates().y, 2))
          }

          // prevent double-entrys
          if (!touchedFields.find(e => e.c === f.coordinates) && !visitedFields.find(e => e.c === f.coordinates)) {
            touchedFields.push(tmp)
          }
        }
      }

      // select cheapest cost
      let minCost = null
      for (let n of touchedFields) {
        if (minCost == null) {
          minCost = n
        }
        else if (minCost.dist > n.dist) {
          minCost = n
        }
      }

      currentField = minCost
    }

    return currentField.q == move.toField.q && currentField.r && move.toField.r && currentField.s == move.toField.s
  }

  static validateBeeMove(state: GameState, move: Move): boolean {
    let start = move.fromField.screenCoordinates()
    if (state.board[start.x][start.y].stack.length != 1 || state.board[start.x][start.y].stack[0].kind != 'BEE') {
      // this is not a BEE!!!
      return false
    }

    this.getNeighbours(state.board, move.fromField).forEach(field => {
      // field occupied ?
      if (field.stack.length == 0 && !field.obstructed) {
        // field equals target field ?
        let coords = field.coordinates.screenCoordinates()
        let end = move.toField.screenCoordinates()
        if (coords.x == end.x && coords.y == end.y) {
          return true
        }
      }
    })
    return false
  }

  static possibleMoves(board: Board, field: Coordinates): Move[] {
    // TODO
    return []
  }

  static moveTarget(move: Move, board: Board): Coordinates {
    // TODO
    return null
  }
}
