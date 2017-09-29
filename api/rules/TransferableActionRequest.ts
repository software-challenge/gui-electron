import { GameState, PLAYERCOLOR } from './HaseUndIgel';
import { UIHint } from './UIHint';

export interface TransferableActionRequest {
  state: GameState,
  color: PLAYERCOLOR,
  isFirstAction: boolean,
  id: number,
  uiHints: UIHint[]
}