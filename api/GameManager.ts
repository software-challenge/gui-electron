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

}
