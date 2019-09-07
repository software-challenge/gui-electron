/// <reference path="phaser.d.ts"/>

import 'phaser'
import { remote } from 'electron'
import { Board, Piece, Coordinates, FieldSelected, FIELDSIZE, SHIFT, PLAYERCOLOR, PIECETYPE, FIELDPIXELWIDTH, GameRuleLogic, GameState, InteractionEvent, Move, RenderState, SelectPiece, UndeployedPieceSelected, SelectDragTargetField, SelectSetTargetField, UiState, ScreenCoordinates } from '../../api/rules/CurrentGame'

const dialog = remote.dialog

//const initialBoard = GameRuleLogic.addBlockedFields(new Board())

interface FieldGraphics {
  background: Phaser.GameObjects.Sprite;
  color: Phaser.GameObjects.Sprite;
  foreground: Phaser.GameObjects.Sprite;
}

// offsets for placing the board on the game canvas
const offsetX = 400
const offsetY = 400

export class SimpleScene extends Phaser.Scene {

  public allObjects: Phaser.GameObjects.Sprite[] // references to all sprites (for clearing)
  public graphics: FieldGraphics[][] // graphics to render the board
  public undeployedPieceGraphics: FieldGraphics[][] // graphics to render pieces not on the board
  public markers: Phaser.GameObjects.Sprite[] // graphics to mark fields
  public selectedPiece: Coordinates // currently selected fish (if any)
  public fieldClickHandler: (c: Coordinates) => void = (_) => {}
  public undeployedClickHandler: (color: PLAYERCOLOR, index: number) => void = (_) => {}
  public animationTime: number = 200
  public animateWater: boolean

  constructor() {
    super({key: 'simple'})
  }

  preload() {
    this.load.image('field', 'resources/hive/hexagon.png')
    this.load.image('ant', 'resources/hive/ant.png')
    this.load.image('bee', 'resources/hive/bee.png')
    this.load.image('beetle', 'resources/hive/beetle.png')
    this.load.image('spider', 'resources/hive/spider.png')
    this.load.image('grasshopper', 'resources/hive/grasshopper.png')
    this.load.image('red', 'resources/hive/red.png')
    this.load.image('blue', 'resources/hive/blue.png')
    this.load.image('marker', 'resources/hive/highlight.png')
  }

  create() {
    this.input.on('pointerdown', (e: any) => this.handleClick(e))

    this.graphics = []
    this.markers = []
    this.allObjects = []
    this.selectedPiece = null
    this.createFieldLabels()
  }

  createFieldLabels() {
    const coordTextStyle = {fontFamily: 'Arial', fontSize: 15, color: '#aaaaaa'}
    const labelTextStyle = {fontFamily: 'Arial', fontSize: 20, color: '#aaaaaa'}
    const textOffset = 50
    const characters = 'ABCDEFGHIJ'
    Array.from(Array(FIELDSIZE), (_, x) => {
      Array.from(Array(FIELDSIZE), (_, y) => {
        // TODO
        //  this.add.text(fieldCoordinates.x - textOffset * 1.2, fieldCoordinates.y, `y = ${y}`, coordTextStyle).setOrigin(0.5)
      })
    })
  }

  createFieldGraphic(coordinates: ScreenCoordinates, ownerColor: PLAYERCOLOR, kind: PIECETYPE): FieldGraphics {
    let background = null
    let sprite = null
    let color = null
    let sx = coordinates.x
    let sy = coordinates.y
    background = this.make.sprite(
      {
        key: 'field',
        x: sx,
        y: sy,
        scale: 1,
      },
    )
    background.depth = 10
    this.allObjects.push(background)

    if (kind != null) {
      let key: string
      let scale: number
      switch(kind) {
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
          key: key,
          x: sx,
          y: sy,
          scale: scale,
        },
      )
      sprite.depth = 20
      sprite.setData('fieldType', kind)

      color = this.make.sprite(
        {
          key: ownerColor == 'RED' ? 'red' : 'blue',
          x: sx,
          y: sy,
          scale: 1,
        },
      )
      color.depth = 19
    }

    if(sprite) {
      this.allObjects.push(sprite)
    }
    if (color) {
      this.allObjects.push(color)
    }


    return {
      background: background,
      color: color,
      foreground: sprite,
    }
  }

  // creates needed graphic objects to display the given board and associates them with the board fields.
  createBoardGraphics(board: Board): FieldGraphics[][] {
    // TODO: use map instead of Array.from
    return Array.from(board.fields, (col, x) => {
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

          // labels, TODO, move into createFieldLabels
          const coordTextStyle = {fontFamily: 'Arial', fontSize: 15, color: '#ffffff'}
          let text = this.add.text(sx, sy, `(${field.coordinates.q},${field.coordinates.r})`, coordTextStyle).setOrigin(0.5)
          text.depth = 60

          return this.createFieldGraphic(new ScreenCoordinates(sx, sy), ownerColor, kind)
        }
      })
    })
  }

  createUndeployedPiecesGraphics(undeployedRedPieces: Piece[], undeployedBluePieces: Piece[]): FieldGraphics[][] {
    let undeployedPieceGraphics: FieldGraphics[][] = []
    undeployedPieceGraphics['RED'] = []
    undeployedRedPieces.forEach((p, i) => {
      undeployedPieceGraphics['RED'].push(this.createFieldGraphic(new ScreenCoordinates(60, 90 + 64*i), 'RED', p.kind))
    })
    undeployedPieceGraphics['BLUE'] = []
    undeployedBluePieces.forEach((p, i) => {
      undeployedPieceGraphics['BLUE'].push(this.createFieldGraphic(new ScreenCoordinates(740, 90 + 64*i), 'BLUE', p.kind))
    })
    return undeployedPieceGraphics
  }

  updateUndeployedPieces(undeployedRedPieces: Piece[], undeployedBluePieces: Piece[]) {
    this.undeployedPieceGraphics = this.createUndeployedPiecesGraphics(undeployedRedPieces, undeployedBluePieces)
  }

  updateBoardGraphics(board: Board) {
    this.graphics = this.createBoardGraphics(board)
  }

  insideBoard(c: Coordinates) {
    return (Math.abs(c.q) <= SHIFT && Math.abs(c.r) <= SHIFT)
  }

  undeployedPiece(x: number, y: number) {
    let color = null
    let index = null
    if (x > 28 && x < 92) {
      color = 'RED'
    } else if (x > 708 && x < 772) {
      color = 'BLUE'
    }
    if (color) {
      let i = Math.round((y - 90) / 64)
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
    if (this.insideBoard(target)) {
      this.fieldClickHandler(target)
    }
    let up = this.undeployedPiece(event.position.x, event.position.y)
    if (up !== null) {
      this.undeployedClickHandler(up.color, up.index)
    }
  }

  destroySprites() {
    this.allObjects.forEach((obj) => {
      obj.destroy()
    })
    this.allObjects = []
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
        key: 'marker',
        x: c.x + offsetX,
        y: c.y + offsetY,
        scale: 1,
        depth: 50,
      }))
    })
  }

  markUndeployed(color: PLAYERCOLOR) {
    let x = color == 'RED' ? 60 : 740
    this.undeployedPieceGraphics[color].forEach((_u: FieldGraphics, i: number) => {
      this.markers.push(this.make.sprite({
        key: 'marker',
        x: x,
        y: 90 + i * 64,
        scale: 1,
        depth: 50,
      }))
    })
  }

  deselectFields() {
    if(this.selectedPiece) {
      let fieldCoordinates = this.selectedPiece.screenCoordinates()
      let sprite = this.graphics[fieldCoordinates.x][fieldCoordinates.y].foreground
      // if sprite was already moving, reset position
      if(sprite) {
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
    let sprite = this.graphics[coordinates.q+SHIFT][coordinates.r+SHIFT].foreground
    this.tweens.add({
      targets: [sprite],
      y: sprite.y - 20,
      repeat: -1, // infinite loop
      yoyo: true,
      duration: 300,
      ease: Phaser.Math.Easing.Back.In,
    })
  }

  selectUndeployedPiece(color, index) {

  }

  updateBoard(gameState: GameState, move: Move) {
    console.log('updateBoard (animate) entry')
    if(move == null) {
      // added this check because of strange bug where a promise rejection
      // happened because of passing an undefined move into this method. The
      // promise rejection was silently ignored and it was hard to find.
      throw 'move is not defined'
    }
    this.boardEqualsView(gameState.board)
    let spriteToMove = this.graphics[move.fromField.screenCoordinates().x][move.fromField.screenCoordinates().y].foreground
    if(spriteToMove != null) {
      this.deselectFields()
      let targetGraphic = this.graphics[move.toField.screenCoordinates().x][move.toField.screenCoordinates().y].foreground
      this.graphics[move.toField.screenCoordinates().x][move.toField.screenCoordinates().y].foreground = this.graphics[move.fromField.screenCoordinates().x][move.fromField.screenCoordinates().y].foreground
      this.graphics[move.fromField.screenCoordinates().x][move.fromField.screenCoordinates().y].foreground = null
      this.tweens.add({
        targets: [spriteToMove],
        x: move.toField.screenCoordinates().x,
        y: move.toField.screenCoordinates().y,
        duration: this.animationTime,
        onComplete: () => {
          if(targetGraphic != null) {
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

export class HiveEngine {
  element: HTMLCanvasElement
  game: Phaser.Game
  scene: SimpleScene
  created: boolean = false
  selectableFields: Coordinates[] = []
  uiState: UiState

  constructor(element: HTMLCanvasElement) {
    this.element = element
    let gameConfig = {
      width: 800,
      height: 800,
      pixelArt: false,
      canvas: this.element,
      fps: {
        target: 10,
      },
    }
    this.game = new Phaser.Game(gameConfig)
    this.scene = new SimpleScene()
    this.game.scene.add('simple', this.scene, true)
  }

  clearUI() {
    if(this.scene) {
      this.scene.deselectFields()
      this.scene.unmarkFields()
    }
  }

  draw(state: RenderState) {
    this.uiState = state.uiState
    this.scene.destroySprites()
    this.scene.updateBoardGraphics(state.gameState.board)
    this.scene.updateUndeployedPieces(state.gameState.undeployedRedPieces, state.gameState.undeployedBluePieces)
    this.scene.unmarkFields()
    this.selectableFields = []
    this.scene.deselectFields()
    if(state.uiState instanceof SelectPiece) {
      this.selectableFields = state.uiState.selectableFieldCoordinates
      this.scene.markUndeployed(state.uiState.undeployedColor)
    } else if(state.uiState instanceof SelectSetTargetField) {
      this.selectableFields = state.uiState.selectableFields
    } else if(state.uiState instanceof SelectDragTargetField) {
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
    this.scene.fieldClickHandler = () => {}
    this.scene.unmarkFields()
  }

  interact(callback: (interaction: InteractionEvent) => void) {
    // interaction requested

    // activate callbacks...
    this.scene.fieldClickHandler = (target: Coordinates) => {
      console.log("clicked on", target)
      callback(this.selectableFields.some(s => s.q == target.q && s.r == target.r)
        ? new FieldSelected(target)
        : 'cancelled')
    }
    this.scene.undeployedClickHandler = (color: PLAYERCOLOR, index: number) => {
      console.log("clicked undeployed", color, index)
      callback(new UndeployedPieceSelected(color, index))
    }

  }

  resize() {
    // Nothing to do here
  }

}