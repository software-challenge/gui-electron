import { Server } from './Server';
import { GameState, PLAYERCOLOR, Action } from '../rules/HaseUndIgel';
import { AsyncGameManager } from './AsyncGameManager';
export class AsyncApi {
  private static server: Server;
  private static asyncGameManager: AsyncGameManager;

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

  public static getAction(state: GameState, color: PLAYERCOLOR, isFirstAction: boolean, callback: (status: "action" | "cancel" | "send", action?: Action) => void) {

  }
}