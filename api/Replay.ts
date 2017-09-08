import { Game } from './Game';
import { GameState, GameResult } from './HaseUndIgel';
import { Parser } from './Parser';

export class Replay extends Game {

  constructor(replayFilePath: string, name: string) {
    super(name);

    this.ready = new Promise((res, rej) => {
      let xml = "";
      new Promise((res: (string) => void, rej) => {
        let fs = require('fs')
        fs.readFile('/etc/hosts', 'utf8', function (err, data) {
          if (err) {
            rej(err);
          }
          res(data);
        });
      }).then(xml => {
        Parser.getJSONFromXML(xml).then(decoded => {
          if (decoded.room) {
            switch (decoded.room.data[0]['$'].class) {
              case 'memento':
                var state = decoded.room.data[0].state[0];
                this.gameStates.push(GameState.fromJSON(state));
                break;
              case 'result':
                var result = decoded.room.data[0];
                this.gameResult = GameResult.fromJSON(result);
                break;
            }
          }
        });
      });
    });
  }

  getState(n: number) {
    if (n >= 0 && n < this.gameStates.length) {
      return Promise.resolve(this.gameStates[n]);
    } else {
      throw "gamestate number out of range: " + n;
    }
  }
}
