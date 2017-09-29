import { GameInfo } from './GameInfo';
import { GameCreationOptions } from '../rules/GameCreationOptions';
import { GameManagerWorkerInterface } from './GameManagerWorkerInterface';
import { GameState } from '../rules/HaseUndIgel';


export class GameManager {
  private gmwi: GameManagerWorkerInterface;

  private bufferedGameTitles: string[] = [];

  private games: GameInfo[] = [];

  constructor() {
    this.gmwi = new GameManagerWorkerInterface();
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
      this.games.push();
      callback(name);
    });
  }

  private getGame(name: string): GameInfo {
    let games = this.games.filter(game => game.name == name);
    if (games.length > 0) {
      return games[0];
    }
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
      callback(games_list.includes(name));
    })
  }

  private isReplay(name: string) {
    var g = this.getGame(name);
    return g && g.isReplay;
  }

  /*private getGameNameFromReplayPath(path: string): string { //TODO: extract into more suitable place
    var game = this.games.filter(g => g.isReplay && g.replayPath == path);
    if (game.length > 0) {
      return game[0].name;
    } else {
      
      return this.createReplayGame(path, replayName).name;
    }
  }*/

  private setCurrentDisplayStateOnGame(name: string, state: number) {
    var g = this.getGame(name);
    if (g) {
      g.currentTurn = state;
    }
  }

  private getCurrentDisplayStateOnGame(name: string) {
    var g = this.getGame(name);
    if (g) {
      return g.currentTurn;
    }
  }

  public stop() {
    this.gmwi.stop();
  }

}
