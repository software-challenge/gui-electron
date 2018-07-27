export const enum PlayerType {
  Human = "Human",
  Computer = "Computer",
  Manual = "Manual"
}

export const enum StartType {
  Java = "Java",
  Direct = "Direct"
}

export interface IPlayer {
  readonly kind: PlayerType;
  readonly name: string;
  readonly timeoutPossible: boolean;
}

export interface HumanPlayer extends IPlayer {
  readonly kind: PlayerType.Human;
  readonly timeoutPossible: false;
}

export interface ComputerPlayer extends IPlayer {
  readonly kind: PlayerType.Computer;
  readonly path: string;
  readonly startType: StartType;
}

export interface ManualPlayer extends IPlayer {
  readonly kind: PlayerType.Manual;
}

export type Player = HumanPlayer | ComputerPlayer | ManualPlayer;

export const enum GameType {
  Versus = "Versus",
  Replay = "Replay"
}

export interface IGame {
  readonly kind: GameType;
  readonly gameName: string;
  readonly gameId: number;
}

export interface Replay extends IGame {
  readonly kind: GameType.Replay;
  readonly path: string;
}

export interface Versus extends IGame {
  readonly kind: GameType.Versus;
  readonly firstPlayer: Player;
  readonly secondPlayer: Player;
}

export type GameCreationOptions = Versus | Replay;
