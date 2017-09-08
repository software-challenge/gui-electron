import { EventEmitter } from 'events';
import { GameState, GameResult } from './HaseUndIgel'
import { ConsoleMessage } from './Api';

export abstract class Game extends EventEmitter {

  name: string;
  gameStates: GameState[] = [];
  gameResult: GameResult;
  messages: ConsoleMessage[] = [];
  ready: Promise<void>;

  abstract getState(n: number): Promise<GameState>;

  constructor(name: string) {
    super();
    this.name = name;
  }

  getStateNumber(state: GameState): number {
    return this.gameStates.findIndex((s: GameState) => { return s.turn == state.turn; })
  }

  getMessages(): ConsoleMessage[] {
    return this.messages;
  }

}
