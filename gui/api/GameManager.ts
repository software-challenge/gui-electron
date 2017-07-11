import { Game } from './Game';

export class GameManager {
  private games: Map<string, Game>;

  addGame(title: string, game: Game): boolean {
    if (this.games.has(title)) {
      return false;
    }
  }

}