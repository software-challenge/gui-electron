import { Game } from '../rules/Game'
import { GameResult, GameState } from '../rules/CurrentGame'
import { Replay as GCO_Replay } from '../rules/GameCreationOptions'
import { Parser } from './Parser'
import { Logger } from '../Logger'

export class Replay extends Game {
  constructor(replay: GCO_Replay) {
    super(replay.gameId)
    this.isReplay = true
    this.replayPath = replay.path
    this.ready = new Promise<void>((gameReady, gameError) => {
      new Promise((res: (string) => void, rej) => {
        let fs = require('fs')
        fs.readFile(replay.path, 'utf8', function(err, data) {
          if(err) {
            rej(err)
          }
          res(data)
        })
      }).then(Parser.getJSONFromXML)
        .then(decoded => {
          if(decoded.protocol) {
            if(decoded.protocol.room) {
              for(let room of decoded.protocol.room) {
                if(room.data[0].state) {
                  const state = room.data[0].state[0]
                  this.gameStates.push(GameState.fromJSON(state))
                } else if(room.data[0].score) {
                  const result = room.data[0]
                  this.gameResult = GameResult.fromJSON(result)
                }
              }
              Logger.getLogger().log('Replay', 'constructor', `loaded ${this.gameStates.length} states from ${replay.path}`)
            }
          }
          gameReady()
        })
    })
  }

  getState(n: number) {
    if(n >= 0 && n < this.gameStates.length) {
      return Promise.resolve(this.gameStates[n])
    } else {
      return Promise.resolve(this.gameStates[this.gameStates.length - 1])
    }
  }
}
