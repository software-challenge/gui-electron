import { GameCreationOptions } from '../rules/GameCreationOptions'
import { GameServerInfo, GameManagerWorkerInterface } from './GameManagerWorkerInterface'
import { Move } from '../rules/CurrentGame'
import { GameInfo } from './GameInfo'

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
    this.gameIDsToNames.forEach((value, key, map) => { if (value == gameName) return key })
    throw Error("A Game with name '" + gameName + "' does not exist!")
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
   * Creates a game with the given options
   * @returns a Promise containing the information of the created game
   */
  public createGame(options: GameCreationOptions) {
    return this.gmwi.createGameWithOptions(options).then(id => {
      let gameInfo = this.getGameInfo(id)
      if (!this.bufferedGameInfo.map(i => i.id).includes(id)) {
        this.bufferedGameInfo.push(gameInfo)
      }
      return gameInfo
    });
  }

  public saveReplayOfGame(gameId: number, path: string) {
    this.gmwi.saveReplayOfGame(gameId, path)
  }

  /** Gets the state for the game with the id corresponding to the name and the specific turn */
  private getState(gameName: string, turn: number) {
    return this.gmwi.getState(this.getGameId(gameName), turn);
  }

  /** Requests a fresh list of games from the worker, updates the buffer and calls the callback */
  private getListOfGames(callback?: (games_list: GameInfo[]) => void) {
    this.gmwi.getListOfGames((gameIds: number[]) => {
      var gameInfos = gameIds.map(e => this.getGameInfo(e));
      this.bufferedGameInfo = gameInfos;
      if (callback) {
        callback(gameInfos);
      }
    });
  }

  /** Returns a list of game titles from the buffer of the last request */
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

  public getGameStatus(gameId: number) {
    return this.gmwi.getStatus(gameId);
  }

  public sendMove(gameId: number, id: number, move: Move) {
    return this.gmwi.sendMove(gameId, id, move);
  }

  public getGameState(gameId: number, turn: number) {
    return this.gmwi.getState(gameId, turn);
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

  public getGameServerStatus() {
    return this.gmwi.getGameServerStatus()
  }

}
