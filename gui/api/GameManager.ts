import { Game } from './Game';
import { GameCreationOptions } from './GameCreationOptions';

export class GameManager {
  private games: Game[] = [];

  public createGame(gco: GameCreationOptions, name: string): Game {
    var g = new Game(gco, name);
    this.games.push(g);
    return g;
  }

}