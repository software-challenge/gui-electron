import { GameManager } from './synchronous/GameManager'

import { Logger } from './Logger'
import { Viewer } from '../viewer/Viewer'

export class Api {
  private static gameManager: GameManager
  private static logger: Logger
  private static viewer: Viewer

  static getGameManager(): GameManager {
    if (!this.gameManager) {
      this.gameManager = new GameManager()
    }
    return this.gameManager
  }


  static getViewer() {
    if (!this.viewer) {
      this.viewer = new Viewer()
    }
    return this.viewer
  }

  static stop() {
    this.getGameManager().stop()
  }


}
