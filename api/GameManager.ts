import { Game } from './Game';
import { LiveGame } from './LiveGame';
import { Replay } from './Replay';
import { GameCreationOptions } from './GameCreationOptions';

export class GameManager {
  private games: Game[] = [];

  public createLiveGame(gco: GameCreationOptions, name: string): LiveGame {
    var g = new LiveGame(gco, name);
    this.games.push(g);
    return g;
  }

  public createReplayGame(replayPath: string, name: string): Replay {
    var g = new Replay(replayPath, name);
    this.games.push(g);
    return g;
  }

  public getGame(name: string): Game {
    let games = this.games.filter(game => game.name == name);
    if (games.length > 0) {
      return games[0];
    }
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

  public getGameNameFromReplayPath(path: string): string {
    var game = this.games.filter(g => g.isReplay && g.replayPath == path);
    if (game.length > 0) {
      return game[0].name;
    } else {
      var liofs = path.lastIndexOf('/');
      if (liofs == -1) {
        liofs = path.lastIndexOf('\\');
      }
      var replayName = path;
      if (liofs != -1) {
        replayName = replayName.substring(liofs + 1);
      }
      var liofp = replayName.lastIndexOf('.');
      if (liofp != -1) {
        replayName = replayName.substring(0, liofp);
      }
      return this.createReplayGame(path, replayName).name;
    }
  }

  public setCurrentDisplayStateOnGame(name: string, state: number) {
    var g = this.getGame(name);
    if (g) {
      g.currentDisplayState = state;
    }
  }

  public getCurrentDisplayStateOnGame(name: string) {
    var g = this.getGame(name);
    if (g) {
      return g.currentDisplayState;
    }
  }

}
