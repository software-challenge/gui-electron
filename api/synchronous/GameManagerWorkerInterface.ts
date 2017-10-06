import { GameCreationOptions } from '../rules/GameCreationOptions';
import { GameStatus } from '../rules/GameStatus';
import { GameState, Action } from '../rules/HaseUndIgel';
import { Message, MessageContent } from '../rules/Message';
import { ActionMethod } from '../rules/ActionMethod';

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

  /**
   * Requests a list of the names of the games currently loaded in the worker
   * @param callback 
   */
  getListOfGames(callback: (gameNames: string[]) => void) {
    let m = new Message();
    m.message_type = "list games";
    this.worker.send(m);
    var l = (m: Message) => {
      if (m.message_type == "games list") {
        this.worker.removeListener('message', l);
        callback(m.message_content.gameNames);
      }
    };
    this.worker.on('message', l);
  }

  /**
   * Requests the creation of a new game with the given options
   * @param options 
   * @param callback Callback to call with the name of the newly created game
   */
  createGameWithOptions(options: GameCreationOptions, callback: (gameName: string) => void) {
    console.log("Creating game");
    let m = new Message();
    m.gameName = options.gameName;
    m.message_type = "start game";
    let ct = new MessageContent.StartGameContent();
    ct.options = options;
    m.message_content = ct;
    this.worker.send(m);
    var l = (m: Message) => {
      if (m.message_type == "game started" && m.gameName == options.gameName) {
        this.worker.removeListener('message', l);
        callback(m.gameName);
      }
    };
    this.worker.on('message', l);
  }

  /**
   * Requests the gameState for the given turn and game
   * @param gameName 
   * @param turn 
   * @param callback 
   */
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
        callback(GameState.lift(m.message_content.gameState));
      }
    }
    this.worker.on('message', l);
  }


  /**
   * Requests the status of a given game
   * @param gameName 
   * @param callback 
   */
  getStatus(gameName: string, callback: (gs: MessageContent.StatusReportContent) => void) {
    let m = new Message();
    m.gameName = gameName;
    m.message_type = "report status";
    this.worker.send(m);
    var l = (m: Message) => {
      if (m.message_type == "status report" && m.gameName == gameName) {
        this.worker.removeListener('message', l);
        callback(m.message_content);
      }
    }
    this.worker.on('message', l);
  }

  /**
   * Sends a tuple of (method, action) for an action request with id and gameName to the worker
   * @param gameName 
   * @param id 
   * @param method 
   * @param action 
   * @param callback 
   */
  sendAction(gameName: string, id: number, method: ActionMethod, action: Action, callback: (gameName: string) => void, ) {
    let m = new Message();
    m.gameName = gameName;
    m.message_type = "send action";
    let ct = new MessageContent.SendActionContent();
    ct.actionMethod = method;
    ct.action = action;
    ct.id = id;
    m.message_content = ct;
    this.worker.send(m);
    var l = (m: Message) => {
      if (m.message_type == "game started" && m.gameName == gameName) {
        this.worker.removeListener('message', l);
        callback(gameName);
      }
    };
    this.worker.on('message', l);
  }

  stop() {
    let m = new Message();
    m.message_type = "stop";
    this.worker.send(m);
  }

}

