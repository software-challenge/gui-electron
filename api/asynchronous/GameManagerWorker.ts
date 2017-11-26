import { AsyncGameManager } from './AsyncGameManager';
import { AsyncApi } from './AsyncApi';
import { Logger } from '../Logger';

Logger.getLogger().log("GameManagerWorker", "main", "GameManagerWorker coming online.")
process.on('message' as any, (m: any) => AsyncApi.getAsyncGameManager().handleMessage(m));