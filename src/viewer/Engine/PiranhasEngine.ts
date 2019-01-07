/// <reference path="phaser.d.ts"/>

import 'phaser'
import { remote } from 'electron'
import { Board, Coordinates, FieldSelected, FIELDSIZE, FIELDTYPE, GameRuleLogic, GameState, InteractionEvent, Move, RenderState, SelectFish, SelectTargetDirection, UiState } from '../../api/rules/CurrentGame'

const dialog = remote.dialog

const initialBoard = GameRuleLogic.addBlockedFields(new Board())

interface FieldGraphics {
  background: Phaser.GameObjects.Sprite;
  foreground: Phaser.GameObjects.Sprite;
}

// offsets for placing the board on the game canvas
const offsetX = 100
const offsetY = 100

export class SimpleScene extends Phaser.Scene {

  public allObjects: Phaser.GameObjects.Sprite[] // references to all sprites (for clearing)
  public graphics: FieldGraphics[][] // graphics to render the board
  public markers: Phaser.GameObjects.Sprite[] // graphics to mark fields
  public selectedFish: Coordinates // currently selected fish (if any)
  public fieldClickHandler: (c: Coordinates) => void = (_) => {}
  public animationTime: number = 200

  constructor() {
    super({key: 'simple'})
  }

  preload() {
    this.load.spritesheet('water', 'resources/piranhas/water.png', {frameWidth: 32, frameHeight: 32})
    this.load.image('fish_red', 'resources/piranhas/fish_red.png')
    this.load.image('fish_blue', 'resources/piranhas/fish_blue.png')
    this.load.image('octopus', 'resources/piranhas/octopus.png')
    this.load.image('marker', 'resources/select-field.png')
  }

  create() {
    this.input.on('pointerdown', (e: any) => this.handleClick(e))

    this.anims.create({
      key: 'waves',
      frames: this.anims.generateFrameNumbers('water', {start: 0, end: 1}),
      frameRate: 2,
      repeat: -1, // loop
    })

    this.graphics = []
    this.markers = []
    this.allObjects = []
    this.selectedFish = null
    this.createFieldLabels()
  }

  createFieldLabels() {
    const coordTextStyle = {fontFamily: 'Arial', fontSize: 15, color: '#aaaaaa'}
    const labelTextStyle = {fontFamily: 'Arial', fontSize: 20, color: '#aaaaaa'}
    const textOffset = 50
    const characters = 'ABCDEFGHIJ'
    Array.from(Array(FIELDSIZE), (_, x) => {
      Array.from(Array(FIELDSIZE), (_, y) => {
        let fieldCoordinates = this.fieldCoordinates({x: x, y: y})
        if(x == 0) {
          this.add.text(fieldCoordinates.x - textOffset * 1.2, fieldCoordinates.y, `y = ${y}`, coordTextStyle).setOrigin(0.5)
        }
        if(x == FIELDSIZE - 1) {
          this.add.text(fieldCoordinates.x + textOffset, fieldCoordinates.y, (FIELDSIZE - 1 - y).toString(), labelTextStyle).setOrigin(0.5)
        }
        if(y == 0) {
          this.add.text(fieldCoordinates.x, fieldCoordinates.y + textOffset, `x = ${x}`, coordTextStyle).setOrigin(0.5)
        }
        if(y == FIELDSIZE - 1) {
          this.add.text(fieldCoordinates.x, fieldCoordinates.y - textOffset, characters.charAt(x), labelTextStyle).setOrigin(0.5)
        }
      })
    })
  }

  // creates needed graphic objects to display the given board and associates them with the board fields.
  createBoardGraphics(board: Board): FieldGraphics[][] {
    // TODO: use map instead of Array.from
    return Array.from(board.fields, (col, x) => {
      return Array.from(col, (field, y) => {
        let fieldCoordinates = this.fieldCoordinates({x: x, y: y})
        const water = this.make.sprite({
          key: 'water',
          x: fieldCoordinates.x,
          y: fieldCoordinates.y,
          scale: 2,
          anims: 'waves',
        }).play('waves')
        water.depth = 10
        let sprite = null
        if(field != Board.Fieldtype.empty) {
          let key
          switch(field) {
            case Board.Fieldtype.red:
              key = 'fish_red'
              break
            case Board.Fieldtype.blue:
              key = 'fish_blue'
              break
            case Board.Fieldtype.obstructed:
              key = 'octopus'
              break
          }
          sprite = this.make.sprite(
            {
              key: key,
              x: fieldCoordinates.x,
              y: fieldCoordinates.y,
              scale: 1,
            },
          )
          sprite.depth = 20
          sprite.setData('fieldType', field)
        }

        this.allObjects.push(water)
        if(sprite) {
          this.allObjects.push(sprite)
        }

        return {
          background: water,
          foreground: sprite,
        }
      })
    })
  }

  updateBoardGraphics(board: Board) {
    this.destroySprites()
    this.graphics = this.createBoardGraphics(board)
  }

  handleClick(event: any) {
    let target = this.boardCoordinates(event.position)
    if(target) {
      this.fieldClickHandler(target)
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
      let c = this.fieldCoordinates(f)
      this.markers.push(this.make.sprite({
        key: 'marker',
        x: c.x,
        y: c.y,
        scale: 2,
        depth: 50,
      }))
    })
  }

  deselectFish() {
    if(this.selectedFish) {
      let sprite = this.graphics[this.selectedFish.x][this.selectedFish.y].foreground
      // if sprite was already moving, reset position
      if(sprite) {
        this.tweens.killTweensOf(sprite)
        let fieldCoordinates = this.fieldCoordinates(this.selectedFish)
        sprite.x = fieldCoordinates.x
        sprite.y = fieldCoordinates.y
      }
      this.selectedFish = null
    }
  }

  selectFish(field: Coordinates) {
    this.deselectFish()
    this.selectedFish = field
    let sprite = this.graphics[this.selectedFish.x][this.selectedFish.y].foreground
    this.tweens.add({
      targets: [sprite],
      y: sprite.y - 20,
      repeat: -1, // infinite loop
      yoyo: true,
      duration: 300,
      ease: Phaser.Math.Easing.Back.In,
    })
  }

  boardCoordinates(c: Coordinates): Coordinates {
    let resultX = Math.round((c.x - offsetX) / 66)
    let resultY = FIELDSIZE - 1 - Math.round((c.y - offsetY) / 66)
    if(resultX >= 0 && resultX < FIELDSIZE &&
      resultY >= 0 && resultY < FIELDSIZE) {
      return {x: resultX, y: resultY}
    } else {
      return null
    }
  }

  fieldCoordinates(c: Coordinates): Coordinates {
    return {
      x: offsetX + c.x * 66,
      y: offsetY + (FIELDSIZE - 1 - c.y) * 66,
    }
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
    let spriteToMove = this.graphics[move.fromField.x][move.fromField.y].foreground
    if(spriteToMove != null) {
      let destination = GameRuleLogic.moveTarget(move, gameState.board)
      let destinationFieldCoordinates = this.fieldCoordinates(destination)
      this.deselectFish()
      let targetGraphic = this.graphics[destination.x][destination.y].foreground
      this.graphics[destination.x][destination.y].foreground = this.graphics[move.fromField.x][move.fromField.y].foreground
      this.graphics[move.fromField.x][move.fromField.y].foreground = null
      this.tweens.add({
        targets: [spriteToMove],
        x: destinationFieldCoordinates.x,
        y: destinationFieldCoordinates.y,
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
  }
}

export class PiranhasEngine {
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
      pixelArt: true,
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
      this.scene.deselectFish()
      this.scene.unmarkFields()
    }
  }

  draw(state: RenderState) {
    this.uiState = state.uiState
    this.scene.updateBoardGraphics(state.gameState.board)
    this.scene.unmarkFields()
    this.selectableFields = []
    this.scene.deselectFish()
    if(state.uiState instanceof SelectFish) {
      this.selectableFields = state.uiState.selectableFieldCoordinates
    } else if(state.uiState instanceof SelectTargetDirection) {
      this.selectableFields = state.uiState.selectableDirections.map(sd => sd.target)
      this.scene.selectFish(state.uiState.origin)
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
      callback(this.selectableFields.some(s => s.x == target.x && s.y == target.y)
        ? new FieldSelected(target)
        : 'cancelled')
    }

  }

  resize() {
    // Nothing to do here
  }
}
