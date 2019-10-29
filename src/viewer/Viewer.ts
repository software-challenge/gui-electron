import { HiveEngine }                                                                                                                                                                                                      from './Engine/HiveEngine'
import { Coordinates, FieldSelected, GameRuleLogic, GameState, InteractionEvent, Move, RenderState, SelectDragTargetField, SelectPiece, SelectSetTargetField, SelectSkip, SkipSelected, UiState, UndeployedPieceSelected } from '../api/rules/CurrentGame'

export class Viewer {
  //DOM Elements
  element: HTMLElement
  canvas: HTMLCanvasElement
  debug: HTMLDivElement

  //Engine
  engine: HiveEngine
  startup_timestamp: number

  //Rendering
  public animateMoves: boolean
  private endScreen: HTMLDivElement = null
  // the last rendered state (i.e. what is currently displayed)
  private currentState: RenderState

  constructor() {
    //Initialize container
    this.element = document.createElement('div')
    this.element.classList.add('viewer-container')
    //Take time measurement for later performance analysis
    this.startup_timestamp = performance.now()

    //Initialize engine
    this.canvas = document.createElement('canvas')
    this.canvas.classList.add('viewerCanvas')
    this.element.appendChild(this.canvas)

    this.engine = new HiveEngine(this.canvas, this.element)
  }

  getElement() {
    return this.element
  }

  dock(element: Element) {
    element.appendChild(this.element)
  }

  undock() {
    this.engine.clearUI()
  }

  render(state: RenderState) {
    if (this.engine == null) {
      return
    }
    console.log('Current ui-state: ', this.currentState, ' invoced render with state: ', state)
    if (this.currentState && this.currentState.equals(state)) {
      console.log('should render same state, doing nothing')
      return
    } else {
      console.log('rendering new state', { ui: state.uiState, turn: state.gameState.turn })
    }

    this.engine.clearUI()
    if (this.animateMoves) {
      if (state.gameState.lastMove &&
        this.currentState &&
        // !this.engine.animating() &&
        (state.gameState.turn === this.currentState.gameState.turn + 1) &&
        this.engine.scene.boardEqualsView(this.currentState.gameState.board)) {
        this.engine.animateMove(this.currentState.gameState, state.gameState.lastMove)
      } else {
        this.engine.finishAnimations()
        this.engine.scene.tweens.killAll()
        this.engine.draw(state)
      }
    } else {
      this.engine.draw(state)
    }
    this.currentState = state
  }

  // user interacted somehow
  userHasInteracted(state: GameState, actions: InteractionEvent[], move_callback: (move: Move) => void, interaction: InteractionEvent) {
    console.log('%cUser interacted', 'color: #006400')

    actions = actions.concat(interaction)

    if (interaction == 'cancelled') {
      // remove all interactions and request new input
      this.requestUserInteraction(state, [], move_callback)
    } else if (actions.length == 2) {
      if (actions[0] instanceof UndeployedPieceSelected && actions[1] instanceof UndeployedPieceSelected) {
        this.requestUserInteraction(state, [], move_callback)
      } else {
        // create move and send it
        let move = this.interactionsToMove(actions)
        move_callback(move)
      }
    } else if (interaction instanceof SkipSelected) {
      // create move and send it
      let move = this.interactionsToMove(actions)
      move_callback(move)
    } else {
      // we need more input to get a complete move
      this.requestUserInteraction(state, actions, move_callback)
    }
  }

  interactionsToMove(interactions: InteractionEvent[]): Move {
    let fromFieldOrPiece = interactions[0]
    if (fromFieldOrPiece instanceof SkipSelected) {
      return new Move(null, null)
    }
    let toField = interactions[1]
    if (fromFieldOrPiece instanceof FieldSelected && toField instanceof FieldSelected) {
      // DragMove
      return new Move(fromFieldOrPiece.coordinates, toField.coordinates)
    } else if (fromFieldOrPiece instanceof UndeployedPieceSelected && toField instanceof FieldSelected) {
      // SetMove
      return new Move(fromFieldOrPiece.kind, toField.coordinates)
    } else {
      throw 'got illegal list of interactions to create a move'
    }
  }

  // modifies the gamestate so that interactions are reflected
  applyInteractions(gameState: GameState, actions: InteractionEvent[]): GameState {
    return gameState // there are no steps between full moves in this game
  }

  // initialize ui to show the user where interaction is possible
  requestUserInteraction(state: GameState, actions: InteractionEvent[], move_callback: (move: Move) => void) {
    console.log('%cRequesting User-Interaction', 'color: #006400')
    // figure out which interactions are currently needed and put them into uistate
    let shouldSelectPiece: boolean = actions.length == 0
    let shouldSelectTarget: boolean = actions.length == 1

    let uiState: UiState
    if (shouldSelectPiece) {
      let ownPieceFields: Coordinates[] = []
      let beePlaced = GameRuleLogic.getQueen(state.board, state.currentPlayerColor) != null

      // Zwinge den Nutzer die Biene zu wählen, falls nötig
      /** turn | color | move of color
       * 0  red   # 1
       * 1  blue  # 1
       * 2  red   # 2
       * 3  blue  # 2
       * ...
       * 6  red   # 4
       * 7  blue  # 4
       */
      if (!beePlaced && state.turn > 5) {
        console.log('BEE-Zwang')
        ownPieceFields = []
      } else {
        ownPieceFields = GameRuleLogic.fieldsOwnedByPlayer(state.board, state.currentPlayerColor)
          .map(e => e.coordinates)
          .filter(e => GameRuleLogic.possibleMoves(state, e).length > 0)
      }

      if (!beePlaced && GameRuleLogic.fieldsOwnedByPlayer(state.board, state.currentPlayerColor).length > 0 && !GameRuleLogic.getFieldsNextToSwarm(state.board, null)
        .some(e => {
          let neighbours = GameRuleLogic.getNeighbours(state.board, e.coordinates)
          return neighbours.some(other => other.owner() == state.currentPlayerColor) && !neighbours.some(other => other.owner() == state.getOtherPlayer().color)
        })) {
        console.log('Es kann keine weitere Figur platziert werden, da kein benachbartes Feld frei ist')
        uiState = new SelectSkip(state.currentPlayerColor)
      } else if (beePlaced && ownPieceFields.length == 0) {
        console.log('Es kann keine Figur mehr bewegt werden')
        uiState = new SelectSkip(state.currentPlayerColor)
      } else if (state.currentPlayerColor == 'RED' ? state.undeployedRedPieces.length == 0 : state.undeployedBluePieces.length == 0) {
        console.log('Es kann keine weitere Figur mehr platziert werden')
        uiState = new SelectSkip(state.currentPlayerColor)
      } else {
        uiState = new SelectPiece(ownPieceFields, state.currentPlayerColor)
      }
    } else if (shouldSelectTarget) {
      let firstAction = actions[0]
      if (firstAction instanceof FieldSelected) {
        let piece = firstAction.coordinates
        console.log('Get possible moves of selected field', piece)
        let possibleMoves = GameRuleLogic.possibleMoves(state, piece)
        console.log('result', possibleMoves)
        if (possibleMoves == null) {
          return
        }
        uiState = new SelectDragTargetField(
          piece,
          possibleMoves,
        )
      }
      if (firstAction instanceof UndeployedPieceSelected) {
        if (firstAction.color == 'RED') {
          firstAction.setKind(state.undeployedRedPieces[firstAction.index].kind)
        } else {
          firstAction.setKind(state.undeployedBluePieces[firstAction.index].kind)
        }

        // Falls noch keine Spielfigur platziert wurde
        if (state.board.countPieces() == 0) {
          uiState = new SelectSetTargetField(
            firstAction.color,
            firstAction.index,
            state.board.fields.map(
              col => col.map(field => field.coordinates),
            ).reduce((a, c) => a.concat(c)),
          )
        }
        // Blau hat die freie Wahl um den 1. Stein
        else if (state.board.countPieces() == 1) {
          uiState = new SelectSetTargetField(
            firstAction.color,
            firstAction.index,
            GameRuleLogic.getFieldsNextToSwarm(state.board, null).map(f => f.coordinates),
          )
        } else {
          uiState = new SelectSetTargetField(
            firstAction.color,
            firstAction.index,
            GameRuleLogic.getFieldsNextToSwarm(state.board, null)
              .map(f => f.coordinates)
              .filter(f => GameRuleLogic.getNeighbours(state.board, f)
                .some(e => e.owner() == state.currentPlayerColor) && !GameRuleLogic.getNeighbours(state.board, f)
                .some(e => e.owner() == state.getOtherPlayer().color)),
          )
        }
      }
      if (!uiState) {
        throw 'first action was not of type FieldSelected or UndeployedPieceSelected'
      }
    } else {
      throw 'we should not interact at all'
    }

    // render gamestate with interactions
    this.render(new RenderState(this.applyInteractions(state, actions), uiState))
    // keep original gamestate in callback
    this.engine.interact((interaction) => this.userHasInteracted(state, actions, move_callback, interaction))
  }

  stop() {
    this.engine.cancelInteractions()
  }
}
