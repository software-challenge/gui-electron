import { GameCreationOptions } from '../rules/GameCreationOptions'
import { GameServerInfo, GameManagerWorkerInterface } from './GameManagerWorkerInterface'
import { Move } from '../rules/CurrentGame'
import { GameInfo } from './GameInfo'

export class GameManager {
  private gmwi: GameManagerWorkerInterface

  private nextID: number
  private gameInfos: Map<number, GameInfo>

  constructor() {
    this.gmwi = new GameManagerWorkerInterface()
    this.gameInfos = new Map<number, GameInfo>()
    this.nextID = 0
  }

  public createGameId(gameName: string, isReplay: boolean): number {
    let newGameId = this.nextID++
    this.gameInfos.set(newGameId, {
      id: newGameId,
      name: gameName,
      isReplay: isReplay,
      currentTurn: 0
    })
    console.log("Created game", newGameId, this.getGameInfo(newGameId))
    return newGameId
  }

  public getGameId(gameName: string): number {
    this.gameInfos.forEach((value, key, map) => { if (value.name == gameName) return key })
    throw Error("A Game with name '" + gameName + "' does not exist!")
  }

  /** Returns the buffered GameInfo for the game with this id */
  public getGameInfo(gameId: number): GameInfo {
    return this.gameInfos.get(gameId)
  }

  /**
   * Creates a game with the given options
   * @returns a Promise containing the information of the created game
   */
  public createGame(options: GameCreationOptions): Promise<GameInfo> {
    return this.gmwi.createGameWithOptions(options).then(id => this.getGameInfo(id));
  }

  public saveReplayOfGame(gameId: number, path: string) {
    this.gmwi.saveReplayOfGame(gameId, path)
  }

  /** Gets the state for the game with the id corresponding to the name and the specific turn */
  private getState(gameName: string, turn: number) {
    return this.gmwi.getState(this.getGameId(gameName), turn)
  }

  /** Returns a list of GameInfos */
  public getGameInfos(): GameInfo[] {
    console.log(this.gameInfos)
    return Array.from(this.gameInfos.values())
  }

  /** returns whether a game with that name exists */
  public hasGame(name: string) {
    const games_list = this.getGameInfos()
    let hasGame = games_list.map(game => game.name).includes(name)
    console.log("hasGame " + name + ":", hasGame)
    return hasGame
  }

  public setCurrentDisplayStateOnGame(gameId: number, turn: number) {
    this.getGameInfo(gameId).currentTurn = turn
  }

  public getCurrentDisplayStateOnGame(gameId: number) {
    return this.getGameInfo(gameId).currentTurn;
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
    this.gameInfos[gameId].name = newName
  }

  public deleteGame(gameId: number) {
    this.gameInfos.delete(gameId)
    this.gmwi.deleteGame(gameId)
  }

  public stop() {
    this.gmwi.stop();
  }

  public getGameServerStatus() {
    return this.gmwi.getGameServerStatus()
  }

}
