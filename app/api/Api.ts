import { Server } from './Server';
export class Api {
  private static server;

  static getServer(): Server {
    if (!this.server) {
      this.server = new Server();
    }
    return this.server;
  }
}


export enum ExecutableStatus {
  NOT_STARTED,
  RUNNING,
  EXITED,
  ERROR
}