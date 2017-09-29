import { GameInfo } from './GameInfo';
import { GameCreationOptions } from '../rules/GameCreationOptions';
import { GameManagerWorkerInterface } from './GameManagerWorkerInterface';
import { GameState, Action } from '../rules/HaseUndIgel';
import { MessageContent } from '../rules/Message';
import { ActionMethod } from '../rules/ActionMethod';

export class GameManager {
  private gmwi: GameManagerWorkerInterface;

  private bufferedGameTitles: string[];

  private displayStates: Map<string, number>;

  constructor() {
    this.gmwi = new GameManagerWorkerInterface();
    this.bufferedGameTitles = [];
    this.displayStates = new Map<string, number>();
  }

  /**
   * Creates a game with the given options, then calls the callback
   * @param options 
   * @param callback 
   */
  public createGame(options: GameCreationOptions, callback: (gameName: string) => void) {
    this.gmwi.createGameWithOptions(options, name => {
      var gi = new GameInfo(name);
      gi.isReplay = options.firstPlayerStartType == "Replay";
      if (!this.bufferedGameTitles.includes(name)) {
        this.bufferedGameTitles.push(name);
      }
      callback(name);
    });
  }

  private getState(gameName: string, turn: number, callback: (s: GameState) => void) {
    this.gmwi.getState(gameName, turn, state => {
      callback(state);
    });
  }

  /**
   * Requests a fresh list of games from the worker, updates the buffered list and calls the callback
   * @param callback 
   */
  private getListOfGames(callback?: (games_list) => void) {
    this.gmwi.getListOfGames(games_list => {
      this.bufferedGameTitles = games_list;
      if (callback) {
        callback(games_list);
      }
    });
  }

  /**
   * Returns a buffered list of game titles from the last time 
   */
  public getBufferedGameTitles(): string[] {
    this.getListOfGames();
    return this.bufferedGameTitles;
  }

  public hasGame(name: string, callback: (has_game: boolean) => void) {
    this.getListOfGames(games_list => {
      this.bufferedGameTitles = games_list;
      console.log("has game " + name + " : " + games_list.includes(name));
      callback(games_list.includes(name));
    })
  }

  public setCurrentDisplayStateOnGame(name: string, turn: number) {
    this.displayStates.set(name, turn);
  }

  public getCurrentDisplayStateOnGame(name: string) {
    if (!this.displayStates.has(name)) {
      this.displayStates.set(name, 0);
    }
    return this.displayStates.get(name);
  }

  public getGameStatus(name: string, callback: (status: MessageContent.StatusReportContent) => void) {
    this.gmwi.getStatus(name, callback);
  }

  public sendAction(gameName: string, id: number, method: ActionMethod, action: Action, callback: (gameName: string) => void) {
    this.gmwi.sendAction(gameName, id, method, action, callback);
  }

  public getGameState(gameName: string, turn: number, callback: (state: GameState) => void) {
    this.gmwi.getState(gameName, turn, callback);
  }


  public stop() {
    this.gmwi.stop();
  }

}
