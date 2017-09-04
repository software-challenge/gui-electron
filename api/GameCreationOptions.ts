
export type PlayerType =
  "Human" |
  "Computer" |
  "External";

export type StartType =
  "Java" | "Direct";

export class GameCreationOptions {
  firstPlayerType: PlayerType;
  secondPlayerType: PlayerType;
  firstPlayerName: string;
  secondPlayerName: string;
  firstPlayerPath: string;
  secondPlayerPath: string;
  firstPlayerStartType: StartType;
  secondPlayerStartType: StartType;
  constructor(firstPlayerType: PlayerType, firstPlayerName: string, firstPlayerPath: string, firstPlayerStartType: StartType, secondPlayerType: PlayerType, secondPlayerName: string, secondPlayerPath: string, secondPlayerStartType: StartType) {
    this.firstPlayerType = firstPlayerType;
    this.firstPlayerName = firstPlayerName;
    this.firstPlayerPath = firstPlayerPath;
    this.firstPlayerStartType = firstPlayerStartType;
    this.secondPlayerType = secondPlayerType;
    this.secondPlayerName = secondPlayerName;
    this.secondPlayerPath = secondPlayerPath;
    this.secondPlayerStartType = secondPlayerStartType;
  }
}