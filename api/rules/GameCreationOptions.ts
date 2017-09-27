
export type PlayerType =
  "Human" |
  "Computer" |
  "External";

export type StartType =
  "Java" | "Direct" | "Replay";

//Note: to start a replay, set the first player start type to "Replay" and the firstPlathPath to the path of the replay file

export class GameCreationOptions {
  firstPlayerType: PlayerType;
  secondPlayerType: PlayerType;
  firstPlayerName: string;
  secondPlayerName: string;
  firstPlayerPath: string;
  secondPlayerPath: string;
  firstPlayerStartType: StartType;
  secondPlayerStartType: StartType;
  gameName: string;
  constructor(firstPlayerType: PlayerType, firstPlayerName: string, firstPlayerPath: string, firstPlayerStartType: StartType, secondPlayerType: PlayerType, secondPlayerName: string, secondPlayerPath: string, secondPlayerStartType: StartType, gameName: string) {
    this.firstPlayerType = firstPlayerType;
    this.firstPlayerName = firstPlayerName;
    this.firstPlayerPath = firstPlayerPath;
    this.firstPlayerStartType = firstPlayerStartType;
    this.secondPlayerType = secondPlayerType;
    this.secondPlayerName = secondPlayerName;
    this.secondPlayerPath = secondPlayerPath;
    this.secondPlayerStartType = secondPlayerStartType;
  }

  isValid(): boolean {
    if (this.firstPlayerStartType == "Replay") {
      return this.firstPlayerPath != null;
    } else {
      return true; //TODO: extend this
    }
  }
}