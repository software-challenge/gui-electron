import { GameCreationOptions } from '../rules/GameCreationOptions';
import { GameStatus } from '../rules/GameStatus';
import { GameState } from '../rules/HaseUndIgel';
import { Message, MessageContent } from '../rules/Message';
import * as child_process from "child_process";
export class GameManagerWorkerInterface {
  worker: child_process.ChildProcess;
  constructor() {
    console.log('starting worker');
    var fork: any = child_process.fork; //disable typechecking, one faulty line causes everything to fail
    this.worker = fork(`${__dirname}/../asynchronous/GameManagerWorker.js`, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
    this.worker.on('message', m => {
      console.log(m);
    });
  }

  createGameWithOptions(options: GameCreationOptions, callback: (gameName: string) => void) {
    let m = new Message();
    m.gameName = options.gameName;
    m.message_type = "start game";
    let ct = new MessageContent.StartGameContent();
    ct.options = options;
    m.message_content = ct;
    this.worker.send(m);
    var l = (m: Message) => {
      if (m.message_type == "game started") {
        this.worker.removeListener('message', l);
        callback(m.gameName);
      }
    };
    this.worker.on('message', l);
  }

  getNumberOfMoves(gameName: string): number {
    return null;
  }

  getState(gameName: string, turn: number, callback: (state: GameState) => void) {
    let m = new Message();
    m.gameName = gameName;
    m.message_type = "get state";
    let gsc = new MessageContent.GetStateContent();
    gsc.turn = turn;
    m.message_content = gsc;
    this.worker.send(m);
    var l = (m: Message) => {
      if (m.message_type == "gamestate" && m.gameName == gameName) {
        this.worker.removeListener('message', l);
        callback(m.message_content.gameState);
      }
    }
  }


  getStatus(gameName: string): GameStatus {
    return null;
  }

  stop() {
    let m = new Message();
    m.message_type = "stop";
    this.worker.send(m);
  }

}

