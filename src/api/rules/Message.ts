import { GameCreationOptions }         from './GameCreationOptions'
import { GameResult, GameState, Move } from './CurrentGame'
import { GameStatus }                  from './GameStatus'
import { TransferableMoveRequest }     from './TransferableMoveRequest'

type request_type = 'list games' | 'start game' | 'get state' | 'report status' | 'send move' | 'stop';
type response_type = 'games list' | 'game started' | 'gamestate' | 'status report' | 'move sent' | 'stopped' | 'error';

export class Message {
  message_type: request_type | response_type
  gameId: number
  message_content: any
}

interface MessageContentInterface {}

export module MessageContent {
  export class StartGameContent implements MessageContentInterface {
    options: GameCreationOptions
  }

  export class GetStateContent implements MessageContentInterface {
    turn: number
  }

  export class SendMoveContent implements MessageContentInterface {
    move: Move
    id: number
  }

  export class GameStateContent implements MessageContentInterface {
    gameState: GameState
  }

  export class StatusReportContent implements MessageContentInterface {
    gameStatus: GameStatus
    moveRequest?: TransferableMoveRequest
    gameResult?: GameResult
    numberOfStates: number
  }

  export class GamesListContent implements MessageContentInterface {
    gameIds: number[]
  }
}
