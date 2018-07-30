// this is forked from the main node process in GameManagerWorkerInterface.ts
import { AsyncGameManager } from './AsyncGameManager';
import { AsyncApi } from './AsyncApi';
import { Logger } from '../Logger';

//Logger.injectLineNumbersIntoConsoleLog();
console.log("SGC_LOG_PATH:" + process.env.SGC_LOG_PATH);

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
  process.exitCode = 1;
})


Logger.getLogger().log("GameManagerWorker", "main", "GameManagerWorker coming online.");
AsyncApi.getAsyncGameManager();
