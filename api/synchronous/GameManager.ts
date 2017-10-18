import { GameCreationOptions } from '../rules/GameCreationOptions';
import { GameManagerWorkerInterface } from './GameManagerWorkerInterface';
import { GameState, Action } from '../rules/HaseUndIgel';
import { MessageContent } from '../rules/Message';
import { ActionMethod } from '../rules/ActionMethod';

export class GameManager {
  private gmwi: GameManagerWorkerInterface;

  private bufferedGameTitles: string[];

  private displayStates: Map<string, number>;

  private gameNamesToIDs: Map<string, string>;
  private gameIDsToNames: Map<string, string>;

  private nextID: number;

  constructor() {
    this.gmwi = new GameManagerWorkerInterface();
    this.bufferedGameTitles = [];
    this.displayStates = new Map<string, number>();
    this.gameNamesToIDs = new Map<string, string>();
    this.gameIDsToNames = new Map<string, string>();
    this.nextID = 0;
  }

  /**
   * Creates a game with the given options, then calls the callback
   * @param options 
   * @param callback 
   */
  public createGame(options: GameCreationOptions, callback: (gameName: string) => void) {
    let currentGameID = this.nextID.toString();
    this.nextID++;
    this.gameNamesToIDs.set(options.gameName, currentGameID);
    this.gameIDsToNames.set(currentGameID, options.gameName);
    options.gameName = currentGameID;
    this.gmwi.createGameWithOptions(options, id => {
      if (!this.bufferedGameTitles.includes(this.gameIDsToNames.get(id))) {
        this.bufferedGameTitles.push(this.gameIDsToNames.get(id));
      }
      callback(this.gameIDsToNames.get(id));
    });
  }

  private getState(gameName: string, turn: number, callback: (s: GameState) => void) {
    this.gmwi.getState(this.gameNamesToIDs.get(gameName), turn, state => {
      callback(state);
    });
  }

  /**
   * Requests a fresh list of games from the worker, updates the buffered list and calls the callback
   * @param callback 
   */
  private getListOfGames(callback?: (games_list) => void) {
    this.gmwi.getListOfGames(games_list => {
      games_list = games_list.map(id => this.gameIDsToNames.get(id));
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
    this.displayStates.set(this.gameNamesToIDs.get(name), turn);
  }

  public getCurrentDisplayStateOnGame(name: string) {
    let id = this.gameNamesToIDs.get(name);
    if (!this.displayStates.has(id)) {
      this.displayStates.set(id, 0);
    }
    return this.displayStates.get(id);
  }

  public getGameStatus(name: string, callback: (status: MessageContent.StatusReportContent) => void) {
    this.gmwi.getStatus(this.gameNamesToIDs.get(name), callback);
  }

  public sendAction(gameName: string, id: number, method: ActionMethod, action: Action, callback: (gameName: string) => void) {
    this.gmwi.sendAction(this.gameNamesToIDs.get(gameName), id, method, action, callback);
  }

  public getGameState(gameName: string, turn: number, callback: (state: GameState) => void) {
    this.gmwi.getState(this.gameNamesToIDs.get(gameName), turn, callback);
  }

  public renameGame(oldName: string, newName: string) {
    if (oldName == newName) return;
    let counter = 2;
    if (this.gameNamesToIDs.has(newName)) {
      while (this.gameIDsToNames.has(newName + ` (${counter})`)) {
        counter++;
      }
      newName = newName + ` (${counter})`;
    }
    let id = this.gameNamesToIDs.get(oldName);
    this.gameNamesToIDs.delete(oldName);
    this.gameNamesToIDs.set(newName, id);
    this.gameIDsToNames.delete(id);
    this.gameIDsToNames.set(id, newName);
  }


  public stop() {
    this.gmwi.stop();
  }

}
