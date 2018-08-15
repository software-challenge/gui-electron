import { Server } from './Server';
import { Move, GameState, PLAYERCOLOR } from '../rules/CurrentGame';
import { AsyncGameManager } from './AsyncGameManager';

export class AsyncApi {
  private static server: Server;
  private static asyncGameManager: AsyncGameManager;

  private static moveRequests: Map<number, Map<number, MoveRequest>> = new Map<number, Map<number, MoveRequest>>();
  private static nextKey: number = 0;

  public static getServer(): Server {
    if (!AsyncApi.server) {
      AsyncApi.server = new Server(true);
    }
    return AsyncApi.server;
  }

  public static getAsyncGameManager(): AsyncGameManager {
    if (!this.asyncGameManager) {
      this.asyncGameManager = new AsyncGameManager();
    }
    return this.asyncGameManager;
  }

  public static hasMoveRequest(gameId: number): boolean {
    if (this.moveRequests.has(gameId)) {
      console.log(`Game ${gameId} has request ID ${[...this.moveRequests.get(gameId).keys()].join(',')}`);
      return this.moveRequests.has(gameId) && this.moveRequests.get(gameId).size > 0;
    } else {
      return false;
    }
  }

  public static getMoveRequest(gameId: number): [number, MoveRequest] {
    return this.moveRequests.get(gameId).entries().next().value;
  }

  public static redeemMoveRequest(gameId: number, id: number, move: Move) {
    console.log(`redeemMoveRequest for game ${gameId}, id ${id}, map: `, this.moveRequests.get(gameId));
    console.log("Move:", move);
    let request = this.moveRequests.get(gameId).get(id);
    if (!request) {
      console.log(`found no request for id ${id}, map was`, this.moveRequests.get(gameId));
    } else {
      request.callback(move);//Handle things on the client side
      this.moveRequests.get(gameId).delete(id);//Remove request from list
    }
  }

  public static lodgeActionRequest(gameId: number, state: GameState, callback: (m: Move) => void) {
    console.log("new move request for " + gameId);
    if (!this.moveRequests.has(gameId)) {
      this.moveRequests.set(gameId, new Map<number, MoveRequest>());
    }

    this.moveRequests.get(gameId).set(this.nextKey, {
      state: state,
      callback: callback
    });
    this.nextKey++;
  }

}

interface MoveRequest {
  state: GameState;
  callback: (m: Move) => void;
}