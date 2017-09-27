import { Game } from '../rules/Game';
import { GameState, GameResult } from '../rules/HaseUndIgel';
import { Parser } from './Parser';

export class Replay extends Game {
  constructor(replayFilePath: string, name: string) {
    super(name);
    this.isReplay = true;
    this.replayPath = replayFilePath;
    this.ready = new Promise<void>((gameReady, gameError) => {
      new Promise((res: (string) => void, rej) => {
        let fs = require('fs')
        fs.readFile(replayFilePath, 'utf8', function (err, data) {
          if (err) {
            rej(err);
          }
          res(data);
        });
      }).then(Parser.getJSONFromXML)
        .then(decoded => {
          if (decoded.protocol) {
            if (decoded.protocol.room) {
              for (let room of decoded.protocol.room) {
                if (room.data[0].state) {
                  var state = room.data[0].state[0];
                  this.gameStates.push(GameState.fromJSON(state));
                } else if (room.data[0].score) {
                  var result = room.data[0];
                  this.gameResult = GameResult.fromJSON(result);
                }
              }
              console.log(`loaded ${this.gameStates.length} states from ${replayFilePath}`);
            }
          }
          gameReady();
        });
    });
  }

  getState(n: number) {
    if (n >= 0 && n < this.gameStates.length) {
      return Promise.resolve(this.gameStates[n]);
    } else {
      return Promise.resolve(this.gameStates[this.gameStates.length - 1]);
    }
  }
}
