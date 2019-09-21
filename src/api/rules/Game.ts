import { EventEmitter }          from 'events'
import { GameResult, GameState } from './CurrentGame'
import { ConsoleMessage }        from './ConsoleMessage'

export abstract class Game extends EventEmitter {
  id: number
  gameStates: GameState[] = []
  gameResult: GameResult
  messages: ConsoleMessage[] = []
  ready: Promise<void>
  isReplay: boolean
  replayPath: string

  abstract getState(n: number): Promise<GameState>;

  constructor(id: number) {
    super()
    this.id = id
  }

  getStateCount(): number {
    return this.gameStates.length
  }

  getStateNumber(state: GameState): number {
    return this.gameStates.findIndex((s: GameState) => { return s.turn == state.turn })
  }

  getMessages(): ConsoleMessage[] {
    return this.messages
  }

  stateHasResult(stateNumber: number): boolean {
    return this.gameResult && (stateNumber == this.gameStates.length - 1)
  }

  getResult() {
    return this.gameResult
  }

  isLastState(turn: number) {
    return turn == this.gameStates.length - 1
  }

}
