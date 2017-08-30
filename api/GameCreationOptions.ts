
export type PlayerType =
  "Human" |
  "Computer" |
  "External";

export class GameCreationOptions {
  firstPlayerType: PlayerType;
  secondPlayerType: PlayerType;
  firstPlayerPath: string;
  secondPlayerPath: string;
  constructor(firstPlayerType: PlayerType, firstPlayerPath: string, secondPlayerType: PlayerType, secondPlayerPath: string) {
    this.firstPlayerType = firstPlayerType;
    this.firstPlayerPath = firstPlayerPath;
    this.secondPlayerType = secondPlayerType;
    this.secondPlayerPath = secondPlayerPath;
  }
}