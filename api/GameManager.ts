import { Game } from './Game';
import { GameCreationOptions } from './GameCreationOptions';

export class GameManager {
  private games: Game[] = [];

  public createGame(gco: GameCreationOptions, name: string): Game {
    var g = new Game(gco, name);
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