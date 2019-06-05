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
        let zlib = require('zlib')

        let buf = []
        let stream = fs.createReadStream(replay.path)
        if (replay.path.endsWith('.gz')) {
          stream = stream.pipe(zlib.createGunzip())
        }

        stream
          .on('error', function(error) { rej(error) })
          .on('data', function(data) { buf.push(data) })
          .on('end', function() { res(buf.join(''))})
      }).then(Parser.getJSONFromXML)
        .then(decoded => {
          const converted = Parser.convert(decoded)
          this.gameStates = converted.gameStates
          this.gameResult = converted.gameResult
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
