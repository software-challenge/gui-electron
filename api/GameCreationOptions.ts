
export type PlayerType =
  "Human" |
  "Computer" |
  "External";

export class GameCreationOptions {
  firstPlayerType: PlayerType;
  secondPlayerType: PlayerType;
  firstPlayerName: string;
  secondPlayerName: string;
  firstPlayerPath: string;
  secondPlayerPath: string;
  constructor(firstPlayerType: PlayerType, firstPlayerName: string, firstPlayerPath: string, secondPlayerType: PlayerType, secondPlayerName: string, secondPlayerPath: string) {
    this.firstPlayerType = firstPlayerType;
    this.firstPlayerName = firstPlayerName;
    this.firstPlayerPath = firstPlayerPath;
    this.secondPlayerType = secondPlayerType;
    this.secondPlayerName = secondPlayerName;
    this.secondPlayerPath = secondPlayerPath;
  }
}