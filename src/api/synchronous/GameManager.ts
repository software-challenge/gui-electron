import { GameCreationOptions } from '../rules/GameCreationOptions';
import { GameManagerWorkerInterface } from './GameManagerWorkerInterface';
import { GameState, Move } from '../rules/CurrentGame';
import { MessageContent } from '../rules/Message';
import { ActionMethod } from '../rules/ActionMethod';
import { GameInfo } from './GameInfo';

export class GameManager {
  private gmwi: GameManagerWorkerInterface;

  private bufferedGameInfo: GameInfo[];


  // properties only saved in frontend:
  // FIXME: this is a mess and comes from the time where games were identified by name
  // better manage all state in the backend and only buffer in the frontend
  private gameIDsToNames: Map<number, string>;
  private gameIDsToIsReplay: Map<number, boolean>;
  private displayStates: Map<number, number>;

  private nextID: number;

  constructor() {
    this.gmwi = new GameManagerWorkerInterface();
    this.bufferedGameInfo = [];
    this.displayStates = new Map<number, number>();
    this.gameIDsToNames = new Map<number, string>();
    this.gameIDsToIsReplay = new Map<number, boolean>();
    this.nextID = 0;
  }

  public createGameId(gameName: string, isReplay: boolean): number {
    let currentGameID = this.nextID;
    this.nextID++;
    this.gameIDsToNames.set(currentGameID, gameName);
    this.gameIDsToIsReplay.set(currentGameID, isReplay);
    return currentGameID;
  }

  public getGameId(gameName: string): number {
    this.gameIDsToNames.forEach((value, key, map) => { if(value == gameName) return key })
    throw Error("A Game with name '"+gameName+"' does not exist!")
  }

  public getGameInfo(gameId: number): GameInfo {
    return {
      id: gameId,
      name: this.gameIDsToNames.get(gameId),
      isReplay: this.gameIDsToIsReplay.get(gameId),
      currentTurn: this.getCurrentDisplayStateOnGame(gameId)
    }
  }

  /**
   * Creates a game with the given options, then calls the callback
   * @param options
   * @param callback
   */
  public createGame(options: GameCreationOptions, callback: (gameInfo: GameInfo) => void) {
    this.gmwi.createGameWithOptions(options, id => {
      let gameInfo = this.getGameInfo(id)
      if (!this.bufferedGameInfo.map(i => i.id).includes(id)) {
        this.bufferedGameInfo.push(gameInfo)
      }
      callback(gameInfo);
    });
  }

  public saveReplayOfGame(gameId: number, path: string) {
    this.gmwi.saveReplayOfGame(gameId, path)
  }

  private getState(gameName: string, turn: number, callback: (s: GameState) => void) {
    this.gmwi.getState(this.getGameId(gameName), turn, state => {
      callback(state);
    });
  }

  /**
   * Requests a fresh list of games from the worker, updates the buffered list and calls the callback
   * @param callback
   */
  private getListOfGames(callback?: (games_list: GameInfo[]) => void) {
    this.gmwi.getListOfGames((gameIds: number[]) => {
      var gameInfos = gameIds.map(e => this.getGameInfo(e));
      this.bufferedGameInfo = gameInfos;
      if (callback) {
        callback(gameInfos);
      }
    });
  }

  /**
   * Returns a buffered list of game titles from the last time
   */
  public getBufferedGameTitles(): GameInfo[] {
    this.getListOfGames();
    return this.bufferedGameInfo;
  }

  public hasGame(name: string, callback: (has_game: boolean) => void) {
    this.getListOfGames(games_list => {
      this.bufferedGameInfo = games_list;
      let hasGame = games_list.map(i => i.name).includes(name);
      console.log("has game " + name + " : " + hasGame);
      callback(hasGame);
    });
  }

  public setCurrentDisplayStateOnGame(gameId: number, turn: number) {
    this.displayStates.set(gameId, turn);
  }

  public getCurrentDisplayStateOnGame(gameId: number) {
    if (!this.displayStates.has(gameId)) {
      this.displayStates.set(gameId, 0);
    }
    return this.displayStates.get(gameId);
  }

  public getGameStatus(gameId: number, callback: (status: MessageContent.StatusReportContent) => void) {
    this.gmwi.getStatus(gameId, callback);
  }

  public sendMove(gameId: number, id: number, move: Move, callback: (gameId: number) => void) {
    this.gmwi.sendMove(gameId, id, move, callback);
  }

  public getGameState(gameId: number, turn: number, callback: (state: GameState) => void) {
    this.gmwi.getState(gameId, turn, callback);
  }

  public renameGame(gameId: number, newName: string) {
    this.gameIDsToNames.delete(gameId);
    this.gameIDsToNames.set(gameId, newName);
  }

  public deleteGame(gameId: number) {
    this.gameIDsToNames.delete(gameId)
    this.gmwi.deleteGame(gameId)
    this.bufferedGameInfo = this.bufferedGameInfo.filter((value: GameInfo) => value.id != gameId)
  }

  public stop() {
    this.gmwi.stop();
  }

}
