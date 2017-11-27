import { AsyncGameManager } from './AsyncGameManager';
import { AsyncApi } from './AsyncApi';
import { Logger } from '../Logger';

//Logger.injectLineNumbersIntoConsoleLog();
console.log("SGC_LOG_PATH:" + process.env.SGC_LOG_PATH);


Logger.getLogger().log("GameManagerWorker", "main", "GameManagerWorker coming online.")
process.on('message' as any, (m: any) => AsyncApi.getAsyncGameManager().handleMessage(m));