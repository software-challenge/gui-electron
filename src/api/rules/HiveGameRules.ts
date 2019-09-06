import { Board, Coordinates, FIELDSIZE, PIECETYPE, Move, Player, PLAYERCOLOR, Field, SHIFT, GameState, Piece } from './Hive'

export class GameRuleLogic {

  static addBlockedFields(board: Board): Board {
    let x, y = 0
    for (let i = 0; i < 3; i++) {
      do {
        x = this.randomIntFromInterval(0, board.fields.length)
        y = this.randomIntFromInterval(0, board.fields[x].length)
      } while (board.fields[x][y] == null || board.fields[x][y].obstructed)
      board.fields[x][y].obstructed = true
    }

    return board
  }

  static randomIntFromInterval(min: integer, max: integer): integer {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

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

  /** Validates whether nor not the path to the neighbour via adjacent tiles is obstructed or not
   * 
   * @param board
   * @param a
   * @param b
   */
  static isNeighbourObstructed(board: Board, a: Coordinates, b: Coordinates): boolean {
    if (this.isNeighbour(a, b)) {
      console.log("Feld a ist kein Nachbar von b", a, b)
      return true
    }

    let shared = this.sharedNeighboursOfTwoCoords(board, a, b)
    // 2 benachbarte Felder müssen mindestens 1 und höchstens 2 weiteren gemeinsamen Nachbarn haben
    if (shared.length > 2 && shared.length < 1) {
      console.log("Unerwartete Anzahl an gemeinsamen Nachbarfeldern von a, b, shared", a, b, shared)
      return true
    }

    let blocked = 0
    for (let tile of shared) {
      if (tile.obstructed || tile.stack.length > 0) {
        blocked++
      }
    }
    return shared.length - blocked > 0
  }

  static sharedNeighboursOfTwoCoords(board: Board, a: Coordinates, b: Coordinates): Field[] {
    let tmp = []
    let nb = this.getNeighbours(board, b)

    for (let na of this.getNeighbours(board, a)) {
      if (nb.indexOf(na)) {
        tmp.push(na)
      }
    }

    return tmp
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
    return -SHIFT <= coord.q && coord.q <= SHIFT && -SHIFT <= coord.r && coord.r <= SHIFT
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
        if (this.isNeighbour(f.coordinates, currentField) && !this.isNeighbourObstructed(state.board, f.coordinates, currentField)) {
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

    return this.isNeighbour(move.fromField, move.toField) && !this.isNeighbourObstructed(state.board, move.fromField, move.toField)
  }

  static validateBeetleMove(state: GameState, move: Move): boolean {
    let start = move.fromField.screenCoordinates()
    if (state.board[start.x][start.y].stack.length < 1 || state.board[start.x][start.y].stack[state.board[start.x][start.y].stack.length - 1].kind != 'BEETLE') {
      // this is not a BEETLE!!!
      return false
    }

    return this.isNeighbour(move.fromField, move.toField) && !this.isNeighbourObstructed(state.board, move.fromField, move.toField)
  }

  static validateSpiderMove(state: GameState, move: Move): boolean {
    // TODO..... benötigt wahrscheinlich eine Kombination von validateAntMove und einem Strecken-Counter
    return false
  }

  static possibleMoves(board: Board, field: Coordinates): Move[] {
    // TODO
    return []
  }

  static performMove(state: GameState, move: Move): void {
    // validate move TODO
    // apply move
    if (move.moveType == 'SET') {
      let piece = null

      // Rot
      if (state.currentPlayerColor == 'RED') {
        for (let p of state.undeployedRedPieces) {
          if (p.kind == move.undeployedPiece) {
            piece = p
            delete state.undeployedRedPieces[state.undeployedRedPieces.indexOf(p)]
            break
          }
        }
      }
      // Blau
      else {
        for (let p of state.undeployedBluePieces) {
          if (p.kind == move.undeployedPiece) {
            piece = p
            delete state.undeployedBluePieces[state.undeployedBluePieces.indexOf(p)]
            break
          }
        }
      }

      if (piece == null) {
        console.log("Zu setzendes piece konnte nicht gefunden werden in move", move)
        return null
      }

      state.board.fields[move.toField.screenCoordinates().x][move.toField.screenCoordinates().y].stack.push(piece)
    }
    else if (move.moveType == 'DRAG') {
      let oldStack = state.board.fields[move.fromField.screenCoordinates().x][move.fromField.screenCoordinates().y].stack
      let newStack = state.board.fields[move.toField.screenCoordinates().x][move.toField.screenCoordinates().y].stack
      let piece = oldStack.pop()      
      newStack.push(piece)
    }
    else {
      console.log("Unbekannter moveType....", move)
    }

    // change active player
    state.currentPlayerColor = state.getOtherPlayer().color
    return null
  }
}
