/// <reference path="phaser.d.ts"/>

import 'phaser'
import { Board, Coordinates, FieldSelected, GameRuleLogic, GameState, InteractionEvent, Move, Piece, PIECETYPE, PLAYERCOLOR, RenderState, ScreenCoordinates, SelectDragTargetField, SelectPiece, SelectSetTargetField, SelectSkip, SHIFT, SkipSelected, UiState, UndeployedPieceSelected } from '../../api/rules/CurrentGame'

interface FieldGraphics {
  background: Phaser.GameObjects.Sprite;
  color: Phaser.GameObjects.Sprite;
  foreground: Phaser.GameObjects.Sprite;
}

// offsets for placing the board on the game canvas
const offsetX = 400
const offsetY = 400

const UNDEPLOYED_RED_PIECES_MARGIN = 40
const UNDEPLOYED_BLUE_PIECES_MARGIN = 760
const UNDEPLOYED_PIECES_TOP_MARGIN = 70

export class SimpleScene extends Phaser.Scene {

  public allObjects: Phaser.GameObjects.Sprite[] // references to all sprites (for clearing)
  public graphics: FieldGraphics[][] // graphics to render the board
  public undeployedPieceGraphics: FieldGraphics[][] // graphics to render pieces not on the board
  public markers: Phaser.GameObjects.Sprite[] // graphics to mark fields
  public selectedPiece: Coordinates // currently selected piece (if any)
  public skipMoveButton: Phaser.GameObjects.Sprite //
  public fieldClickHandler: (c: Coordinates) => void = (_) => { }
  public undeployedClickHandler: (targets: Undeployed) => void = (_) => { }
  public outsideClickHandler: (c: Coordinates) => void = (_) => { }
  public skipClickHandler: (c: Coordinates) => void = (_) => { }
  public animationTime: number = 200
  public animateWater: boolean
  public labelsCreated: boolean

  constructor() {
    super({ key: 'simple' })
  }

  preload() {
    this.load.image('field', 'resources/hive/hexagon.png')
    this.load.image('ant', 'resources/hive/ant.png')
    this.load.image('bee', 'resources/hive/bee.png')
    this.load.image('beetle', 'resources/hive/beetle.png')
    this.load.image('spider', 'resources/hive/spider.png')
    this.load.image('grasshopper', 'resources/hive/grasshopper.png')
    this.load.image('obstructed1', 'resources/hive/obstructed1.png')
    this.load.image('red', 'resources/hive/red.png')
    this.load.image('blue', 'resources/hive/blue.png')
    this.load.image('marker', 'resources/hive/highlight.png')
    this.load.image('skipButton', 'resources/hive/aussetzen.png')
  }

  create() {
    this.input.on('pointerdown', (e: any) => this.handleClick(e))

    this.graphics = []
    this.markers = []
    this.allObjects = []
    this.selectedPiece = null
    this.labelsCreated = false
  }

  createFieldLabels(board: Board) {
    board.fields.forEach(col => {
      col.forEach(field => {
        let sx = field.coordinates.screenCoordinates().x + offsetX
        let sy = field.coordinates.screenCoordinates().y + offsetY
        const coordTextStyle = { fontFamily: 'Arial', fontSize: 14, color: '#000000' }
        let lx: string
        let ly: string
        let lz: string
        if (field.coordinates.q == 0 && field.coordinates.r == 0 && field.coordinates.s == 0) {
          lx = 'x'
          ly = 'y'
          lz = 'z'
        } else {
          lx = field.coordinates.q.toString()
          ly = field.coordinates.r.toString()
          lz = field.coordinates.s.toString()
        }
        let tx = this.add.text(sx - 15, sy - 10, lx, coordTextStyle).setOrigin(0.5)
        let ty = this.add.text(sx, sy + 15, ly, coordTextStyle).setOrigin(0.5)
        let tz = this.add.text(sx + 15, sy - 10, lz, coordTextStyle).setOrigin(0.5)
        Array(tx, ty, tz).forEach(t => {
          t.depth = 60
          t.setStroke('#FFFFFF', 3)
        })
      })
    })
  }

  createPieceSprite(coordinates: ScreenCoordinates, ownerColor: PLAYERCOLOR, kind: PIECETYPE, factor = 1, lift = 0): Phaser.GameObjects.Sprite[] {
    let sprite = null
    let color = null
    let key: string
    let scale: number
    let sx = coordinates.x
    let sy = coordinates.y
    switch (kind) {
      case 'ANT':
        key = 'ant'
        scale = 0.08
        break
      case 'BEE':
        key = 'bee'
        scale = 0.1
        break
      case 'BEETLE':
        key = 'beetle'
        scale = 0.06
        break
      case 'GRASSHOPPER':
        key = 'grasshopper'
        scale = 0.18
        break
      case 'SPIDER':
        key = 'spider'
        scale = 0.12
        break
    }
    sprite = this.make.sprite(
      {
        key:   key,
        x:     sx,
        y:     sy,
        scale: scale * factor,
      },
    )
    sprite.depth = 20 + lift
    sprite.setData('fieldType', kind)

    color = this.make.sprite(
      {
        key:   ownerColor == 'RED' ? 'red' : 'blue',
        x:     sx,
        y:     sy,
        scale: factor,
      },
    )
    color.depth = 19 + lift

    return [color, sprite]
  }

  createFieldGraphic(coordinates: ScreenCoordinates, obstructed: boolean, ownerColor: PLAYERCOLOR, kind: PIECETYPE, underlying: [PIECETYPE, PLAYERCOLOR][]): FieldGraphics {
    let background = null
    let sprite = null
    let color = null
    let sx = coordinates.x
    let sy = coordinates.y
    background = this.make.sprite(
      {
        key:   'field',
        x:     sx,
        y:     sy,
        scale: 1,
      },
    )
    background.depth = 10
    this.allObjects.push(background)

    if (obstructed) {
      sprite = this.make.sprite(
        {
          key:   'obstructed1',
          x:     sx,
          y:     sy,
          scale: 0.09,
        },
      )
      sprite.depth = 20
      sprite.setData('obstructed', true)
    }
    if (kind != null) {
      let piece = this.createPieceSprite(coordinates, ownerColor, kind)
      color = piece[0]
      sprite = piece[1]
    }

    if (sprite) {
      this.allObjects.push(sprite)
    }
    if (color) {
      this.allObjects.push(color)
    }

    let uy = coordinates.y + 64 / 3
    let ux = coordinates.x - 64 / 3
    for (var i = 0; i < underlying.length; i++) {
      let u = underlying[i]
      let piece = this.createPieceSprite(new ScreenCoordinates(ux + (i * (64 / 3) * 2 / 3), uy), u[1], u[0], 0.4, 3 + i)
      this.allObjects.push(piece[0])
      this.allObjects.push(piece[1])
    }


    return {
      background: background,
      color:      color,
      foreground: sprite,
    }
  }

  // creates needed graphic objects to display the given board and associates them with the board fields.
  createBoardGraphics(board: Board): FieldGraphics[][] {
    if (!this.labelsCreated) {
      this.createFieldLabels(board)
      this.labelsCreated = true
    }
    // TODO: use map instead of Array.from
    return Array.from(board.fields, (col,
      x) => {
      return Array.from(col, (field, y) => {
        if (field != null) {
          let kind = null
          let ownerColor = null
          let sx = field.coordinates.screenCoordinates().x + offsetX
          let sy = field.coordinates.screenCoordinates().y + offsetY

          if (field.stack.length > 0) {
            let upmostPiece = field.stack[field.stack.length - 1]
            kind = upmostPiece.kind
            ownerColor = upmostPiece.color
          }

          if (field.obstructed) {
            return this.createFieldGraphic(new ScreenCoordinates(sx, sy), true, null, null, [])
          } else {
            return this.createFieldGraphic(new ScreenCoordinates(sx, sy), false, ownerColor, kind, field.stack.slice(0, -1)
              .map(p => [p.kind, p.color]))
          }
        }
      })
    })
  }

  createUndeployedPiecesGraphics(undeployedRedPieces: Piece[], undeployedBluePieces: Piece[]): FieldGraphics[][] {
    let undeployedPieceGraphics: FieldGraphics[][] = []
    undeployedPieceGraphics['RED'] = []
    undeployedRedPieces.forEach((p, i) => {
      undeployedPieceGraphics['RED'].push(this.createFieldGraphic(new ScreenCoordinates(UNDEPLOYED_RED_PIECES_MARGIN, UNDEPLOYED_PIECES_TOP_MARGIN + 64 * i), false, 'RED', p.kind, []))
    })
    undeployedPieceGraphics['BLUE'] = []
    undeployedBluePieces.forEach((p, i) => {
      undeployedPieceGraphics['BLUE'].push(this.createFieldGraphic(new ScreenCoordinates(UNDEPLOYED_BLUE_PIECES_MARGIN, UNDEPLOYED_PIECES_TOP_MARGIN + 64 * i), false, 'BLUE', p.kind, []))
    })
    return undeployedPieceGraphics
  }

  updateUndeployedPieces(undeployedRedPieces: Piece[], undeployedBluePieces: Piece[]) {
    this.undeployedPieceGraphics = this.createUndeployedPiecesGraphics(undeployedRedPieces, undeployedBluePieces)
  }

  updateBoardGraphics(board: Board) {
    this.graphics = this.createBoardGraphics(board)
  }

  undeployedPiece(x: number, y: number): Undeployed {
    let color = null
    let index = null
    if (x > UNDEPLOYED_RED_PIECES_MARGIN - (64 / 2) && x < UNDEPLOYED_RED_PIECES_MARGIN + (64 / 2)) {
      color = 'RED'
    } else if (x > UNDEPLOYED_BLUE_PIECES_MARGIN - (64 / 2) && x < UNDEPLOYED_BLUE_PIECES_MARGIN + (64 / 2)) {
      color = 'BLUE'
    }
    if (color) {
      let i = Math.round((y - UNDEPLOYED_PIECES_TOP_MARGIN) / 64)
      if (i >= 0 && i < this.undeployedPieceGraphics[color].length) {
        index = i
      }
    }
    if (color !== null && index !== null) {
      return { color: color, index: index }
    }
    return null
  }

  handleClick(event: any) {
    let pos = new ScreenCoordinates(event.position.x - offsetX, event.position.y - offsetY)
    let target = pos.boardCoordinates()
    let up = this.undeployedPiece(event.position.x, event.position.y)
    if (GameRuleLogic.isOnBoard(target)) {
      this.fieldClickHandler(target)
    } else if (up !== null) {
      this.undeployedClickHandler(up)
    } else if (this.skipMoveButton != null && event.position.y > 675 && event.position.y < 725 && (event.position.x > 120 && event.position.x < 240 || event.position.x > 560 && event.position.x < 680)) {
      this.skipClickHandler(target)
    } else {
      this.outsideClickHandler(target)
    }
  }

  destroySprites() {
    this.allObjects.forEach((obj) => {
      obj.destroy()
    })
    this.allObjects = []
    this.skipMoveButton == null
  }

  unmarkFields() {
    this.markers.forEach(m => m.destroy())
    this.markers = []
  }

  markFields(fields: Coordinates[]) {
    // using forEach instead of a direct fields.map because a fields.map
    // associates the reference to the fields array to the markers attribute
    // which results in problems when unmarking...
    // originally this was this.markers = fields.map(...)
    fields.forEach(f => {
      let c = f.screenCoordinates()
      this.markers.push(this.make.sprite({
        key:   'marker',
        x:     c.x + offsetX,
        y:     c.y + offsetY,
        scale: 1,
        depth: 50,
      }))
    })
  }

  markUndeployed(state: GameState, color: PLAYERCOLOR) {
    let x = color == 'RED' ? UNDEPLOYED_RED_PIECES_MARGIN : UNDEPLOYED_BLUE_PIECES_MARGIN
    if (state.turn > 5 && (color == 'RED' ? state.undeployedRedPieces.some(e => e.kind == 'BEE') : state.undeployedBluePieces.some(e => e.kind == 'BEE'))) {
      this.markers.push(this.make.sprite({
        key:   'marker',
        x:     x,
        y:     UNDEPLOYED_PIECES_TOP_MARGIN,
        scale: 1,
        depth: 50,
      }))
    } else {
      this.undeployedPieceGraphics[color].forEach((_u: FieldGraphics, i: number) => {
        this.markers.push(this.make.sprite({
          key:   'marker',
          x:     x,
          y:     UNDEPLOYED_PIECES_TOP_MARGIN + i * 64,
          scale: 1,
          depth: 50,
        }))
      })
    }
  }

  deselectFields() {
    if (this.selectedPiece) {
      let fieldCoordinates = this.selectedPiece.screenCoordinates()
      let sprite = this.graphics[fieldCoordinates.x][fieldCoordinates.y].foreground
      // if sprite was already moving, reset position
      if (sprite) {
        this.tweens.killTweensOf(sprite)
        sprite.x = fieldCoordinates.x
        sprite.y = fieldCoordinates.y
      }
      this.selectedPiece = null
    }
  }

  selectTarget(field: Coordinates) {
    this.deselectFields()
    this.selectedPiece = field
    let coordinates = this.selectedPiece
    let sprite = this.graphics[coordinates.q + SHIFT][coordinates.r + SHIFT].foreground
    this.tweens.add({
      targets:  [sprite],
      y:        sprite.y - 20,
      repeat:   -1, // infinite loop
      yoyo:     true,
      duration: 300,
      ease:     Phaser.Math.Easing.Back.In,
    })
  }

  updateBoard(gameState: GameState, move: Move) {
    console.log('updateBoard (animate) entry')
    if (move == null) {
      // added this check because of strange bug where a promise rejection
      // happened because of passing an undefined move into this method. The
      // promise rejection was silently ignored and it was hard to find.
      throw 'move is not defined'
    }
    this.boardEqualsView(gameState.board)
    let spriteToMove = this.graphics[move.fromField.screenCoordinates().x][move.fromField.screenCoordinates().y].foreground
    if (spriteToMove != null) {
      this.deselectFields()
      let targetGraphic = this.graphics[move.toField.screenCoordinates().x][move.toField.screenCoordinates().y].foreground
      this.graphics[move.toField.screenCoordinates().x][move.toField.screenCoordinates().y].foreground = this.graphics[move.fromField.screenCoordinates().x][move.fromField.screenCoordinates().y].foreground
      this.graphics[move.fromField.screenCoordinates().x][move.fromField.screenCoordinates().y].foreground = null
      this.tweens.add({
        targets:    [spriteToMove],
        x:          move.toField.screenCoordinates().x,
        y:          move.toField.screenCoordinates().y,
        duration:   this.animationTime,
        onComplete: () => {
          if (targetGraphic != null) {
            targetGraphic.destroy()
          }
          this.unmarkFields()
        },
      })
    } else {
      // TODO: This happens quite often when multiple updates run in parallel.
      // Animations and board updates should be serialized.
      console.warn('should animate move, but sprite was not present', move)
    }
    console.log('updateBoard (animate) leave')
  }

  update() {
  }

  /**
   * Checks if the board graphics represent the given board. Logs errors
   * and returns false if this is not the case.
   *
   * @param board The board to check against the current graphics.
   * @return True if the graphics show the given board, false otherwise.
   */
  boardEqualsView(board: Board) {
    /*
     let statesDoMatch = true
     let keyToFieldType = {
     'red': Board.Fieldtype.red,
     'blue': Board.Fieldtype.blue,
     'rock': Board.Fieldtype.obstructed,
     }
     this.graphics.forEach((col, x) => {
     col.forEach((field, y) => {
     let actual: FIELDTYPE
     if(field.foreground == null) {
     actual = Board.Fieldtype.empty
     } else {
     actual = field.foreground.getData('fieldType')
     }
     let expected = board.fields[x][y]
     if(actual != expected) {
     statesDoMatch = false
     console.warn(`got field difference on (${x},${y})`, {actual: actual, expected: expected})
     }
     let expectedCoordinates: Coordinates = this.fieldCoordinates({x: x, y: y})
     if(field.foreground != null) {
     if(expectedCoordinates.x != field.foreground.x || expectedCoordinates.y != field.foreground.y) {
     // NOTE that we are ignoring not matching coordinates (only logging
     //them) because the sprite may be on its way to the final position.
     //This enables adding animations on already animating sprites and
     //resolves the problem where an animation is nearly not finished but
     //the board has to be rendered for the next state, canceling all
     //animations.
     console.warn(`sprite was not on it's place on (${x},${y})`, field.foreground)
     }
     }
     })
     })
     return statesDoMatch
     TODO
     */
    return false
  }
}

export interface Undeployed {
  color: PLAYERCOLOR
  index: integer
}

export class HiveEngine {
  element: HTMLCanvasElement
  game: Phaser.Game
  scene: SimpleScene
  created: boolean = false
  selectableFields: Coordinates[] = []
  selectableUndeployed: Undeployed[] = []
  uiState: UiState

  constructor(element: HTMLCanvasElement, parent: HTMLElement) {
    this.element = element
    let gameConfig = {
      type:        Phaser.CANVAS,
      scale:       {
        width:      800,
        height:     800,
        mode:       Phaser.Scale.ScaleModes.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
//        zoom: Phaser.Scale.MAX_ZOOM,
      },
      width:       800,
      height:      800,
      transparent: true,
      canvas:      this.element,
      parent:      parent,
      fps:         {
        target: 10,
      },
    }
    this.game = new Phaser.Game(gameConfig)
    this.scene = new SimpleScene()
    this.game.scene.add('simple', this.scene, true)
  }

  clearUI() {
    if (this.scene) {
      this.scene.deselectFields()
      this.scene.unmarkFields()
      this.scene.skipMoveButton == null
    }
  }

  draw(state: RenderState) {
    this.uiState = state.uiState
    this.scene.destroySprites()
    this.scene.updateBoardGraphics(state.gameState.board)
    this.scene.updateUndeployedPieces(state.gameState.undeployedRedPieces, state.gameState.undeployedBluePieces)
    this.scene.unmarkFields()
    this.selectableFields = []
    this.selectableUndeployed = []
    this.scene.deselectFields()
    if (state.uiState instanceof SelectSkip) {
      this.scene.skipMoveButton = this.scene.make.sprite({
        key:   'skipButton',
        x:     state.gameState.currentPlayerColor == 'RED' ? 180 : 620,
        y:     700,
        scale: 0.4,
      })
    } else if (state.uiState instanceof SelectPiece) {
      this.selectableFields = state.uiState.selectableFieldCoordinates
      this.scene.markUndeployed(state.gameState, state.uiState.undeployedColor)
      if (state.gameState.turn > 5 && (state.uiState.undeployedColor == 'RED' ? state.gameState.undeployedRedPieces.some(e => e.kind == 'BEE') : state.gameState.undeployedBluePieces.some(e => e.kind == 'BEE'))) {
        this.selectableUndeployed = [{ color: state.gameState.currentPlayerColor, index: 0 }]
      } else {
        this.scene.undeployedPieceGraphics[state.gameState.currentPlayerColor].forEach((_u: FieldGraphics, i: number) => {
          this.selectableUndeployed.push({ color: state.gameState.currentPlayerColor, index: i })
        })
      }
    } else if (state.uiState instanceof SelectSetTargetField) {
      this.selectableFields = state.uiState.selectableFields
    } else if (state.uiState instanceof SelectDragTargetField) {
      this.selectableFields = state.uiState.selectableFields
    }
    this.scene.markFields(this.selectableFields)
  }

  animateMove(state: GameState, move: Move) {
    this.scene.updateBoard(state, move)
  }

  finishAnimations() {
    this.scene.tweens.each(tween => {
      tween.seek(1)
      tween.complete()
    })
  }

  animating(): boolean {
    return this.scene.tweens.getAllTweens().length > 0
  }

  cancelInteractions() {
    this.scene.fieldClickHandler = () => { }
    this.scene.unmarkFields()
  }

  interact(callback: (interaction: InteractionEvent) => void) {
    // interaction requested
    console.log('%cInteraction happend!', 'color: #006400')

    // activate callbacks...
    this.scene.fieldClickHandler = (target: Coordinates) => {
      console.log('clicked on', target)
      callback(this.selectableFields.some(s => target.equal(s))
        ? new FieldSelected(target)
        : 'cancelled')
    }
    this.scene.undeployedClickHandler = (target: Undeployed) => {
      console.log('clicked undeployed', target)
      callback(this.selectableUndeployed.some(s => s.color == target.color && target.index == s.index)
        ? new UndeployedPieceSelected(target)
        : 'cancelled')
    }
    this.scene.outsideClickHandler = (target: Coordinates) => {
      console.log('clicked outside of field', target)
      callback('cancelled')
    }
    this.scene.skipClickHandler = (target: Coordinates) => {
      console.log('clicked Zug aussetzen', target)
      callback(new SkipSelected())
    }
  }

  resize() {
    // Nothing to do here
  }

}
