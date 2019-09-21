// this is forked from the main node process in GameManagerWorkerInterface.ts
import { AsyncApi } from './AsyncApi'
import { Logger }   from '../Logger'

process.on('unhandledRejection', (reason, promise) => {
  // @ts-ignore
  console.log('Unhandled Rejection at:', reason.stack || reason)
  process.exitCode = 1
})


Logger.getLogger().log('GameManagerWorker', 'main', 'GameManagerWorker coming online.')
AsyncApi.getAsyncGameManager(parseInt(process.env.GAME_MANAGER_WORKER_PORT))
