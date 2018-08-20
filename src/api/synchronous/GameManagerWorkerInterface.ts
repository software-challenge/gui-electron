import { GameCreationOptions } from '../rules/GameCreationOptions';
import { GameStatus } from '../rules/GameStatus';
import { GameState, Move } from '../rules/CurrentGame';
import { Message, MessageContent } from '../rules/Message';
import { ActionMethod } from '../rules/ActionMethod';
import { Logger } from '../Logger';
import { Backend } from './Backend';
import * as treekill from 'tree-kill';
import * as path from 'path';

import * as child_process from "child_process";
export class GameManagerWorkerInterface {
  worker: child_process.ChildProcess;
  constructor() {
    Logger.getLogger().log("GameManagerWorkerInterface", "constructor", "Forking GameManagerWorker.");
    var fork: any = child_process.fork; //disable typechecking, one faulty line causes everything to fail
    console.log("SGC_LOG_PATH:" + process.env.SGC_LOG_PATH);
    //this.worker = child_process.spawn(process.execPath, [path.join(__dirname, '/../asynchronous/GameManagerWorker.js')], { env: { "SGC_LOG_PATH": process.env.SGC_LOG_PATH } });

    this.worker = fork(path.join(__dirname, "/../asynchronous/GameManagerWorker.js"), { execArgv: process.execArgv, stdio: ['inherit', 'inherit', 'inherit', 'ipc'], env: { "SGC_LOG_PATH": process.env.SGC_LOG_PATH } });
    //console.log("Worker PID: " + this.worker.pid);
  }

  /**
   * Requests a list of the names of the games currently loaded in the worker
   * @param callback
   */
  getListOfGames(callback: (gameIds: number[]) => void, retries:number = 3) {
    fetch(Backend.urlFor('/list-games'))
      .then(r => r.json())
      .then(r => callback(r))
      .catch(e => {
        if (retries == 0) {
          Logger.getLogger().log("GameManagerWorkerInterface", "getListOfGames", "Error getting list of games: " + e)
          throw e;
        } else {
          setTimeout(() => this.getListOfGames(callback,retries - 1),250);
        }
      });
  }

  /**
   * Requests the creation of a new game with the given options
   * @param options
   * @param callback Callback to call with the name of the newly created game
   */
  createGameWithOptions(options: GameCreationOptions, callback: (gameId: number) => void) {
    console.log("Creating game " + options.gameName + " with id " + options.gameId);
    fetch(Backend.urlFor('/start-game'),
      {
        method: 'POST',
        body: JSON.stringify(options),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })
      .then(r => r.json())
      .then(t => { console.log("Created game with id " + t); callback(parseInt(t)); })
      .catch(e => Logger.getLogger().log("GameManagerWorkerInterface", "createGameWithOptions", "Error creating game: " + e));
  }

  deleteGame(gameId: number) {
    fetch(Backend.urlFor('/delete-game?id='+gameId))
  }

  saveReplayOfGame(gameId: number, path: string) {
    console.log("Saving replay of game with id " + gameId + " to " + path);
    fetch(Backend.urlFor('/save-replay'),
      {
        method: 'POST',
        body: JSON.stringify({gameId: gameId, path: path}),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })
      .then(r => r.json())
      .catch(e => Logger.getLogger().log("GameManagerWorkerInterface", "saveReplayOfGame", "Error saving replay of a game: " + e));
  }
  /**
   * Requests the gameState for the given turn and game
   * @param gameName
   * @param turn
   * @param callback
   */
  getState(gameId: number, turn: number, callback: (state: GameState) => void) {
    fetch(Backend.urlFor(`/state?id=${gameId}&turn=${turn}`))
      .then(r => r.json())
      .then(state => callback(GameState.lift(state)))
      .catch(e => Logger.getLogger().log("GameManagerWorkerInterface", "getState", "Error getting state: " + e));
  }


  /**
   * Requests the status of a given game
   * @param gameName
   * @param callback
   */
  getStatus(gameId: number, callback: (gs: MessageContent.StatusReportContent) => void) {
    fetch(Backend.urlFor(`/status?id=${gameId}`))
      .then(r => r.json())
      .then(status => callback(status))
      .catch(e => Logger.getLogger().log("GameManagerWorkerInterface", "getStatus", "Error getting status: " + e));
  }

  /**
   * Sends a tuple of (method, action) for an action request with id and gameName to the worker
   * @param gameName
   * @param id
   * @param method
   * @param action
   * @param callback
   */
  sendMove(gameId: number, id: number, move: Move, callback: (gameId: number) => void, ) {
    fetch(Backend.urlFor(`/send-move?id=${gameId}&moveId=${id}`),
      {
        method: 'POST',
        body: JSON.stringify(move),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })
      .then(r => r.text())
      .then(t => { callback(gameId); return t; })
      .then(t => Logger.getLogger().log("GameManagerWorkerInterface", "sendMove", "Server response: " + t))
      .catch(e => Logger.getLogger().log("GameManagerWorkerInterface", "createGameWithOptions", "Error creating game: " + e));
  }

  stop() {
    fetch(Backend.urlFor('/stop'), { method: "POST" })
      .then(t => t.text())
      .then(t => Logger.getLogger().log("GameManagerWorkerInterface", "stop", "received server message: " + t))
      .catch(e => Logger.getLogger().log("GameManagerWorkerInterface", "stop", "Error stopping backend: " + e));
  }

}
