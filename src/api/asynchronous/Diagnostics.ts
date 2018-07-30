import { AsyncApi } from './AsyncApi';
import { ExecutableStatus } from '../rules/ExecutableStatus';
import { ServerStatus } from './ServerStatus';

/** Functions to check aspects of the application and environment which are needed for proper operation. */
export class Diagnostics {

  /** Checks if java game server is reachable and responds to an observer request */
  public static getServerStatus(): ServerStatus {
    return AsyncApi.getServer().getStatus() == ExecutableStatus.Status.RUNNING ? ServerStatus.OK : ServerStatus.NOT_READY;
  }
  
}
