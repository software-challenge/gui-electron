import { Server } from './Server';

import { GameManager } from './GameManager';

import { Logger } from './Logger';

export class Api {
  private static server: Server;
  private static gameManager: GameManager;
  private static logger: Logger;

  static getServer(autostart: boolean = true): Server {
    if (!this.server) {
      this.server = new Server(autostart);
    }
    return this.server;
  }

  static getGameManager(): GameManager {
    if (!this.gameManager) {
      this.gameManager = new GameManager();
    }
    return this.gameManager;
  }

  static getLogger(): Logger {
    if (!this.logger) {
      var d = new Date();
      this.logger = new Logger(false, /*`sgc_log_${d.getFullYear()}.${d.getMonth()}.${d.getDay()}_${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}.log`*/ 'sgc.log');
    }
    return this.logger;
  }


}

export module ExecutableStatus {
  export enum Status {
    NOT_STARTED,
    RUNNING,
    EXITED,
    ERROR
  }

  export function toString(s: ExecutableStatus.Status): string {
    switch (s) {
      case ExecutableStatus.Status.RUNNING:
        return "RUNNING";
      case ExecutableStatus.Status.EXITED:
        return "EXITED";
      case ExecutableStatus.Status.ERROR:
        return "ERROR";
      case ExecutableStatus.Status.NOT_STARTED:
        return "NOT STARTED";
    }
  }
}

export interface ConsoleMessage {
  sender: "server" | "observer" | "red" | "blue",
  type: "output" | "error",
  text: string
}