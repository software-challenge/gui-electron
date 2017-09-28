import { GameCreationOptions } from './GameCreationOptions';
import { GameState, Action } from './HaseUndIgel';
import { GameStatus } from './GameStatus';

export class Message {
  message_type: "start game" | "get state" | "report status" | "send move" | "game started" | "gamestate" | "status report" | "move sent" | "stop" | "stopped" | "error";
  gameName: string;
  message_content: any;
}

interface MessageContentInterface { };

export module MessageContent {
  export class StartGameContent implements MessageContentInterface {
    options: GameCreationOptions;
  }

  export class GetStateContent implements MessageContentInterface {
    turn: number;
  }

  export class SendMoveContent implements MessageContentInterface {
    move: Action[];
  }

  export class GameStateContent implements MessageContentInterface {
    gameState: GameState;
  }

  export class StatusReportContent implements MessageContentInterface {
    gameStatus: GameStatus;
  }
}