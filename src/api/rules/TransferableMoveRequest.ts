import { GameState } from './CurrentGame';

export interface TransferableMoveRequest {
  state: GameState;
  id: number;
}
