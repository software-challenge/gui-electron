

export class GameCreationOptions {
  player1path: string;
  player2path: string;
  constructor(player1path: string, player2path: string) {
    this.player1path = player1path;
    this.player2path = player2path;
  }
}