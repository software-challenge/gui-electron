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
    let tmp = []

    for (let c of this.getDirections(field)) {
      if (board.getField(c) == null) {
        continue
      }
      tmp.push(board.getField(c))
    }

    return tmp
  }

  static isNeighbour(a: Coordinates, b: Coordinates): boolean {
    for (let t of this.getDirections(a)) {
      if (b.equal(t)) {
        return true
      }
    }

    return false
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

  static fieldsOwnedByPlayer(board: Board, color: PLAYERCOLOR): Field[] {
    let fields = []

    board.fields.forEach((row) => {
      row.forEach((field) => {
        if (field != null && field.stack.length > 0 && field.stack[field.stack.length - 1].color == color) {
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
    let fields = this.getFieldsNextToSwarm(board, except)
    for (let f of fields) {
      if (field.equal(f.coordinates)) {
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
    let tiles = []
    board.fields.forEach((row, i) => row.forEach((field, ii) => {
      if (field != null && field.stack.length > 0 && !field.obstructed && (except == null || !except.equal(field.coordinates))) {
        if (!field.coordinates.equal(new ArrayCoordinates(i, ii).boardCoordinates())) {
          console.log("Da ist was schief gegangen.... das Feld: ", field, " hat den Index [" + i + "][" + ii + "] im 2d-array, was den Coordinaten: ", new ArrayCoordinates(i, ii).boardCoordinates(), " entspricht, jedoch als Attribut einen abweichenden Wert")
        }

        this.getNeighbours(board, field.coordinates).forEach(f => {
          if (f.stack.length == 0 && !field.obstructed && (except == null || !except.equal(f.coordinates))) {
            let bereitsEnthalten = false
            for (let enthalten of tiles) {
              if (f.coordinates.equal(enthalten.coordinates)) {
                bereitsEnthalten = true
                break
              }
            }

            if (!bereitsEnthalten) {
              tiles.push(f)
            }
          }
        })
      }
    }))

    return tiles
  }

  static isOnBoard(coord: Coordinates): boolean {
    return -SHIFT <= coord.q && coord.q <= SHIFT && -SHIFT <= coord.r && coord.r <= SHIFT && -SHIFT <= coord.s && coord.s <= SHIFT
  }

  static isSwarmConnected(board: Board, from: Coordinates, to: Coordinates): boolean {
    let connected = this.getNeighbours(board, to).filter(e => e.stack.length > 0 && !e.coordinates.equal(from))
    let currentField: Field = null
    let visitedFields = [board.getField(from)]
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
    console.log("%cHa ", 'color: #f00')
    console.log("Validiere move from: ", from, " to: ", to)
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

    if (!this.fieldNextToSwarm(board, to, from) || !this.isSwarmConnected(board, from, to)) {
      console.log("Das Feld ist nicht neben dem Schwarm: ", !this.fieldNextToSwarm(board, to, from), " oder nicht als 1 Schwarm verbunden: ", !this.isSwarmConnected(board, from, to))
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

    let moves = []
    let allFields = this.getFieldsNextToSwarm(state.board, field)
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
