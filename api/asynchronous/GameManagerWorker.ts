import { AsyncGameManager } from './AsyncGameManager';
import { AsyncApi } from './AsyncApi';
import { Logger } from '../Logger';

Logger.getLogger().log("GameManagerWorker", "main", "GameManagerWorker coming online.")
process.on('message', m => AsyncApi.getAsyncGameManager().handleMessage(m));