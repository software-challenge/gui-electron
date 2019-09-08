import { ArrayCoordinates, Board, Coordinates, Field, GameState, Move, PIECETYPE, PLAYERCOLOR, SHIFT } from './Hive'

export class GameRuleLogic {

  static getDirections(c: Coordinates): Coordinates[] {
    return[
      new Coordinates(c.q + 1, c.r - 1, c.s + 0),
      new Coordinates(c.q + 1, c.r + 0, c.s - 1),
      new Coordinates(c.q + 0, c.r + 1, c.s - 1),
      new Coordinates(c.q - 1, c.r + 1, c.s + 0),
      new Coordinates(c.q - 1, c.r + 0, c.s + 1),
      new Coordinates(c.q + 0, c.r - 1, c.s + 1)
    ]
  }

  static getNeighbours(board: Board, field: Coordinates): Field[] {
    return this.getDirections(field).filter(c => board.getField(c) != null).map(c => board.getField(c))
  }

  static isNeighbour(a: Coordinates, b: Coordinates): boolean {
    return this.getDirections(a).some(t => b.equal(t))
  }

  static getQueen(board: Board, color: PLAYERCOLOR): Field {
    let queen = this.findPiecesOfTypeAndPlayer(board, 'BEE', color)
    if (queen.length == 0) {
      return null
    }
    return queen[0]
  }

  static isQueenBlocked(board: Board, color: PLAYERCOLOR): boolean {
    return !this.getNeighbours(board, this.getQueen(board, color).coordinates).some(field => field.stack == null)
  }


  static findPiecesOfTypeAndPlayer(board: Board, type: PIECETYPE, color: PLAYERCOLOR): Field[] {
    return this.getFieldsWithPiece(board).filter(e => e.stack.some(p => p.kind == type && p.color == color))
  }

  static fieldsOwnedByPlayer(board: Board, color: PLAYERCOLOR): Field[] {
    return this.getFieldsWithPiece(board).filter(e => e.owner() == color)
  }

  static getFieldsWithPiece(board: Board): Field[] {
    let fields = []

    board.fields.forEach((row) => {
      row.forEach((field) => {
        if (field != null && field.stack.length > 0) {
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
  static isPathToNeighbourObstructed(board: Board, a: Coordinates, b: Coordinates): boolean {
    if (!this.isNeighbour(a, b)) {
      console.log("Feld a ist kein Nachbar von b", a, b)
      return true
    }

    let shared = this.sharedNeighboursOfTwoCoords(board, a, b)
    // 2 benachbarte Felder müssen mindestens 1 und höchstens 2 weiteren gemeinsamen Nachbarn haben
    if (shared.length > 2 || shared.length < 1) {
      console.log("Unerwartete Anzahl an gemeinsamen Nachbarfeldern von a, b, shared", a, b, shared)
      return true
    }

    let blocked = 0
    for (let tile of shared) {
      if (tile.obstructed || tile.stack.length > 0) {
        blocked++
      }
    }

    return shared.length - blocked == 0
  }

  static sharedNeighboursOfTwoCoords(board: Board, a: Coordinates, b: Coordinates): Field[] {
    let nb = this.getNeighbours(board, b)

    return this.getNeighbours(board, a).filter(tile => nb.some(e => tile.coordinates.equal(e.coordinates)))
  }

  /** Determines whether or not given coordinate is adjacent to the swarm
   * if except is != null, the field of except will not be counted as part of the swarm
   * 
   * @param board
   * @param field
   * @param except
   */
  static fieldNextToSwarm(board: Board, field: Coordinates, except: Coordinates): boolean {
    return this.getFieldsNextToSwarm(board, except).some(f => field.equal(f.coordinates))
  }

  /** returns all fields adjacent to the swarm.
   * If except is != null the field of except is not counted as the swarm and fields only adjacent to this perticular field wont be listed within the return value
   * 
   * @param board
   * @param except
   */
  static getFieldsNextToSwarm(board: Board, except: Coordinates): Field[] {
    let tiles: Field[] = []

    this.getFieldsWithPiece(board).filter(e => except == null || !except.equal(e.coordinates)).forEach(field => {
      tiles = tiles.concat(this.getNeighbours(board, field.coordinates).filter(e => e.stack.length == 0 && !e.obstructed && (except == null || !except.equal(e.coordinates)) && !tiles.some(f => e.coordinates.equal(f.coordinates))))
    })

    return tiles
  }

  static isOnBoard(coord: Coordinates): boolean {
    return -SHIFT <= coord.q && coord.q <= SHIFT && -SHIFT <= coord.r && coord.r <= SHIFT && -SHIFT <= coord.s && coord.s <= SHIFT
  }

  static isSwarmConnected(board: Board, from: Coordinates, to: Coordinates): boolean {
    let connected = this.getNeighbours(board, to).filter(e => e.stack.length > 0 && !e.coordinates.equal(from))
    let currentField: Field = null
    let visitedFields = [board.getField(from), board.getField(to)]
    let totalPieces = board.countPieces()

    while (connected.length > 0 && connected.reduce((prev, e) => prev + e.stack.length, 0) + visitedFields.reduce((prev, e) => prev + e.stack.length, 0) < totalPieces) {
      currentField = connected.pop()
      visitedFields.push(currentField)

      for (let f of this.getNeighbours(board, currentField.coordinates).filter(e => e.stack.length > 0 && !e.coordinates.equal(from))) {
        // no duplicated fields please
        if (!visitedFields.some(e => e.coordinates.equal(f.coordinates)) && !connected.some(e => e.coordinates.equal(f.coordinates))) {
          connected.push(f)
        }
      }
    }

    return connected.reduce((prev, e) => prev + e.stack.length, 0) + visitedFields.reduce((prev, e) => prev + e.stack.length, 0) == totalPieces
  }

  static validateMove(board: Board, from: Coordinates, to: Coordinates): boolean {
    console.log("%cValidiere move from: ", 'color: #f00', "", from, " to: ", to)
    if (!this.isOnBoard(from) || !this.isOnBoard(to)) {
      console.log("Korrumpierte Koordinaten gegeben (out of board): ", from, to)
      return false
    }

    if (board.getField(from).stack.length < 1) {
      console.log("Keine zu ziehende Figur auf dem Feld gefunden: ", from)
      return false
    }
    else if (board.getField(from).stack.length > 1 && board.getTopPiece(from).kind != 'BEETLE') {
      console.log("Beim Stack mit mehr als 1 piece auf dem Feld: ", board.getField(from), " ist das oberste Piece kein BEETLE!!")
      return false
    }

    // Beetle darf drauf
    if (board.getTopPiece(from).kind == 'BEETLE') {
      if (!this.getFieldsWithPiece(board).some(e => e.coordinates.equal(to)) && !this.fieldNextToSwarm(board, to, from)) {
        console.log("Das Ziel des Beetles ist weder auf einem anderen Insekt, noch neben dem Schwarm")
        return false
      }
    }
    else if (!this.fieldNextToSwarm(board, to, from)) {
      console.log("Das Feld ist nicht neben dem Schwarm: ", !this.fieldNextToSwarm(board, to, from))
      return false
    }

    if (!this.isSwarmConnected(board, from, to)) {
      console.log("Das Feld ist nicht als 1 Schwarm verbunden: ", !this.isSwarmConnected(board, from, to))
      return false
    }

    switch (board.getTopPiece(from).kind) {
      case 'ANT':
        console.log("Es ist eine Ameise")
        return this.validateAntMove(board, from, to)
      case 'BEE':
        console.log("Es ist eine Biene")
        return this.validateBeeMove(board, from, to)
      case 'BEETLE':
        console.log("Es ist ein Käfer")
        return this.validateBeetleMove(board, from, to)
      case 'GRASSHOPPER':
        console.log("Es ist ein Grashüpfer")
        return this.validateGrasshopperMove(board, from, to)
      case 'SPIDER':
        console.log("Es ist eine Spider")
        return this.validateSpiderMove(board, from, to)
      default:
        console.log("%cDa ist aber wirklich ordentlich was schief gegangen.... unbekannter typ: ", 'color: #f00')
        console.log(board.getTopPiece(from).kind)
        return false
    }
  }

  static validateAntMove(board: Board, from: Coordinates, to: Coordinates): boolean {
    // A-Star modified
    let fields = this.getFieldsNextToSwarm(board, from)
    let visitedFields = []
    let touchedFields = []
    let currentField = from
    let target = to.arrayCoordinates()

    while (currentField.equal(from) || visitedFields.length < fields.length && touchedFields.length > 0 && !currentField.equal(to)) {
      visitedFields.push({
        c: currentField,
        dist: Math.sqrt(Math.pow(target.x - currentField.arrayCoordinates().x, 2) + Math.pow(target.y - currentField.arrayCoordinates().y, 2))
      })
      let i = touchedFields.findIndex(e => e.c.equal(currentField))
      if (i || i == 0) {
        delete touchedFields[i]
      }

      // find all valid adjacent fields
      for (let f of fields) {
        if (this.isNeighbour(f.coordinates, currentField) && !this.isPathToNeighbourObstructed(board, f.coordinates, currentField)) {
          let tmp = {
            c: f.coordinates,
            dist: Math.sqrt(Math.pow(target.x - f.coordinates.arrayCoordinates().x, 2) + Math.pow(target.y - f.coordinates.arrayCoordinates().y, 2))
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

    return currentField.equal(to)
  }

  static validateBeeMove(board: Board, from: Coordinates, to: Coordinates): boolean {
    return this.isNeighbour(from, to) && !this.isPathToNeighbourObstructed(board, from, to)
  }

  static validateBeetleMove(board: Board, from: Coordinates, to: Coordinates): boolean {
    return this.isNeighbour(from, to) && !this.isPathToNeighbourObstructed(board, from, to)
  }

  static validateGrasshopperMove(board: Board, from: Coordinates, to: Coordinates): boolean {
    return from.isInLineWith(to)
  }

  static validateSpiderMove(board: Board, from: Coordinates, to: Coordinates): boolean {
    // TODO..... benötigt wahrscheinlich eine Kombination von validateAntMove und einem Strecken-Counter
    return false
  }

  static possibleMoves(state: GameState, field: Coordinates): Coordinates[] {
    console.log("Versuche possibleMoves herauszufinden für: ", field)
    if (state.board.getTopPiece(field) == null) {
      console.log("Irgendwas ist schief gegangen, das Feld hat nämlich keine pieces: ", field, state.board)
      return null
    }

    if (this.getQueen(state.board, state.currentPlayerColor) == null) {
      console.log("Ohne Queen geht hier nichts...")
      return []
    }

    let moves = []
    let allFields = this.getFieldsNextToSwarm(state.board, field).concat(this.getFieldsWithPiece(state.board).filter(e => !e.coordinates.equal(state.board.getField(field).coordinates)))
    console.log("Von den möglichen Felder zum ziehen, kommen in Frage: ", allFields)

    // fuers erste brute-force durch
    for (let f of allFields) {
      if (this.validateMove(state.board, field, f.coordinates)) {
        console.log("Valid move found", f.coordinates)
        moves.push(f.coordinates)
      }
    }
    
    console.log("Possible Moves outcome: ", moves)
    return moves
  }
}
