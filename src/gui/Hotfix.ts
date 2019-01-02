import { GameCreationOptions } from '../api/rules/GameCreationOptions'
import { Logger } from '../api/Logger'
import { Api } from '../api/Api'
/*
  Hotfix for problems with state: reload application between games, forcing all memory to be gced
*/

export let Hotfix = {
  __gameCreationFunction: null, //Private storage for the game creation function

  isGameReload: function () {
    return /game\_/.test(window.location.hash)
  },

  reloadIntoGame: function (gco: GameCreationOptions) {
    let logger = Logger.getLogger().focus('Hotfix', 'reloadIntoGame')
    if (/game\_/.test(window.location.hash)) {
      window.location.hash = 'game_' + encodeURIComponent(JSON.stringify(gco)) //Store game creation options in hash
      logger.log('Starting game by reloading (hash found)')
      Api.stop()
      window.location.reload()
    } else {
      window.location.hash = 'game_' + encodeURIComponent(JSON.stringify(gco)) //Store game creation options in hash
      logger.log('Starting game directly')
      Hotfix.__gameCreationFunction(gco)
    }
  },

  init(gameCreationFunction) {
    Hotfix.__gameCreationFunction = gameCreationFunction
    if (/game\_/.test(window.location.hash)) { //If there's a game to be started
      Logger.getLogger().log('Hotfix', 'init', 'Hash found, starting game')
      let gco = JSON.parse(decodeURIComponent(window.location.hash.substring('#game_'.length))) //Retrieve game creation options
      gameCreationFunction(gco) //Start game
    }
  }

}