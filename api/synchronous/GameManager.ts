import { GameInfo } from './GameInfo';
import { GameCreationOptions } from '../rules/GameCreationOptions';
import { GameManagerWorkerInterface } from './GameManagerWorkerInterface';
import { GameState } from '../rules/HaseUndIgel';


export class GameManager {
  private gmwi: GameManagerWorkerInterface;
  private games: GameInfo[] = [];

  constructor() {
    this.gmwi = new GameManagerWorkerInterface();
  }

  public createGame(options: GameCreationOptions, callback: (gameName: string) => void) {
    this.gmwi.createGameWithOptions(options, name => {
      var gi = new GameInfo(name);
      gi.isReplay = options.firstPlayerStartType == "Replay";
      this.games.push();
      callback(name);
    });
  }

  public getGame(name: string): GameInfo {
    let games = this.games.filter(game => game.name == name);
    if (games.length > 0) {
      return games[0];
    }
  }

  public getState(gameName: string, turn: number, callback: (s: GameState) => void) {
    this.gmwi.getState(gameName, turn, state => {
      callback(state);
    });
  }

  public getGameTitles(): string[] {
    return this.games.map(g => g.name);
  }

  public hasGame(name: string): boolean {
    return this.games.some(g => g.name == name);
  }

  public isReplay(name: string) {
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

  public setCurrentDisplayStateOnGame(name: string, state: number) {
    var g = this.getGame(name);
    if (g) {
      g.currentTurn = state;
    }
  }

  public getCurrentDisplayStateOnGame(name: string) {
    var g = this.getGame(name);
    if (g) {
      return g.currentTurn;
    }
  }

  public stop() {
    this.gmwi.stop();
  }

}
