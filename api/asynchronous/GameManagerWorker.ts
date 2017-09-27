import { AsyncGameManager } from './AsyncGameManager';
import { AsyncApi } from './AsyncApi';

process.on('message', m => AsyncApi.getAsyncGameManager().handleMessage(m));