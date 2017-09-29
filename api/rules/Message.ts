import { GameCreationOptions } from './GameCreationOptions';
import { GameState, Action, GameResult } from './HaseUndIgel';
import { GameStatus } from './GameStatus';
import { UIHint } from './UIHint';
import { TransferableActionRequest } from './TransferableActionRequest';
import { ActionMethod } from './ActionMethod';

type request_type = "list games" | "start game" | "get state" | "report status" | "send action" | "stop";
type response_type = "games list" | "game started" | "gamestate" | "status report" | "action sent" | "stopped" | "error";

export class Message {
  message_type: request_type | response_type;
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

  export class SendActionContent implements MessageContentInterface {
    action?: Action;
    actionMethod: ActionMethod;
    id: number;
  }

  export class GameStateContent implements MessageContentInterface {
    gameState: GameState;
  }

  export class StatusReportContent implements MessageContentInterface {
    gameStatus: GameStatus;
    actionRequest?: TransferableActionRequest;
    gameResult: GameResult;
    numberOfStates: number;
  }

  export class GamesListContent implements MessageContentInterface {
    gameNames: string[];
  }
}