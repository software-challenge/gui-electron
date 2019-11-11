import { GameCreationOptions } from '../rules/GameCreationOptions'
import { GameState, Move }     from '../rules/CurrentGame'
import { MessageContent }      from '../rules/Message'
import { Logger }              from '../Logger'
import { Backend }             from './Backend'
import * as path               from 'path'
import * as portfinder         from 'portfinder'
import * as child_process      from 'child_process'
import { ExecutableStatus }    from '../rules/ExecutableStatus'
import promiseRetry = require('promise-retry')

export interface GameServerInfo {
  status: ExecutableStatus.Status
  port: number
  error: String
}

export class GameManagerWorkerInterface {
  worker: child_process.ChildProcess
  private backend: Promise<Backend>

  constructor() {
    Logger.getLogger().log('GameManagerWorkerInterface', 'constructor', 'Forking GameManagerWorker.')
    const fork: any = child_process.fork  //disable typechecking, one faulty line causes everything to fail
    console.log('SGC_LOG_PATH:' + process.env.SGC_LOG_PATH)
    //this.worker = child_process.spawn(process.execPath, [path.join(__dirname, '/../asynchronous/GameManagerWorker.js')], { env: { "SGC_LOG_PATH": process.env.SGC_LOG_PATH } })
    this.backend = portfinder.getPortPromise({ port: 12000 })
      .then((port) => {
        return new Backend(port)
      })

    this.backend.then(backend => {
      this.worker = fork(
        path.join(__dirname, '/../asynchronous/GameManagerWorker.js'), {
          execArgv: process.execArgv,
          stdio:    ['inherit', 'inherit', 'inherit', 'ipc'],
          env:      {
            'SGC_LOG_PATH':             process.env.SGC_LOG_PATH,
            'GAME_MANAGER_WORKER_PORT': backend.getPort(),
          },
        },
      )
    })
  }

  private fetchBackend(query: string, init?: RequestInit) {
    return this.backend.then(backend => fetch(backend.urlFor('/' + query), init))
  }

  /** Requests a list of the names of the games currently loaded in the worker */
  getListOfGames(retries: number = 3) {
    return promiseRetry(retry => {
      return this.fetchBackend('list-games')
        .then(r => r.json())
        .catch(retry)
    }, {
      minTimeout: 150,
      retries:    retries,
    }).catch(e => Logger.getLogger().logError('GameManagerWorkerInterface', 'getListOfGames', 'Error getting list of games: ' + e, e))
  }

  /**
   * Requests the creation of a new game with the given options
   * @returns Promise containing the gameId
   */
  createGameWithOptions(options: GameCreationOptions) {
    console.log('Creating game ' + options.gameName + ' with id ' + options.gameId)
    return this.fetchBackend('start-game', {
      method:  'POST',
      body:    JSON.stringify(options),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    }).then(r => {
      return r.json().catch(() => r.text()).then(c => {
        if (r.ok) {
          return c
        } else {
          throw c
        }
      })
    }).then(t => {
      console.log('Created game with id ' + t)
      return parseInt(t)
    })
  }

  deleteGame(gameId: number) {
    this.fetchBackend('delete-game?id=' + gameId)
  }

  saveReplayOfGame(gameId: number, path: string) {
    console.log('Saving replay of game with id ' + gameId + ' to ' + path)
    this.fetchBackend('save-replay', {
      method:  'POST',
      body:    JSON.stringify({ gameId: gameId, path: path }),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .catch(e => Logger.getLogger().logError('GameManagerWorkerInterface', 'saveReplayOfGame', 'Error saving replay of a game: ' + e, e))
  }

  /** Requests the gameState for the given turn and game. */
  getState(gameId: number, turn: number) {
    return this.fetchBackend(`state?id=${gameId}&turn=${turn}`)
      .then(r => r.json())
      .then(state => {
        let gs = GameState.lift(state)
        console.log('Got gamestate from backend:', gs)
        return gs
      })
  }

  /**
   * Requests the status of a given game
   */
  getStatus(gameId: number): Promise<MessageContent.StatusReportContent> {
    return this.fetchBackend(`status?id=${gameId}`)
      .then(r => r.json())
      .catch(e => Logger.getLogger().logError('GameManagerWorkerInterface', 'getStatus', 'Error getting status: ' + e, e))
  }

  /**
   * Sends a Move for an action request with id to the worker
   * @returns a Promise containing the gameId
   */
  sendMove(gameId: number, id: number, move: Move): Promise<number> {
    return this.fetchBackend(`send-move?id=${gameId}&moveId=${id}`, {
      method:  'POST',
      body:    JSON.stringify(move),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    }).then(response => {
      response.text().then(value => {
        Logger.getLogger().log('GameManagerWorkerInterface', 'sendMove', 'Server response: ' + value)
        this.getGameServerStatus().then(serverStatus => {
          // Dieser Fall tritt anscheinend nie ein, da der Server keinen solchen Code sendet? if (serverStatus.status == ExecutableStatus.Status.ERROR) {
          if (serverStatus.error.toLowerCase().indexOf('error') > 0) {
            const ipc = require('electron').ipcRenderer
            ipc.send('showGameErrorBox', 'Spiel wurde beendet', gameId, 'Nach senden des Moves: \n' + JSON.stringify(move) + '\nkam es zu folgendem Fehler:\n\n' + serverStatus.error
              + '\n\nSollte dieser Fehler noch nicht auf Github unter: https://github.com/CAU-Kiel-Tech-Inf/socha-gui/issues/ gemeldet sein, melde doch bitte diesen Fehler.\nInfolge dieses Fehlers kam es zur Beendigung dieses Spiels.')
            return -1
          }
        })
      })
      return gameId
    })
  }

  stop() {
    return this.fetchBackend('stop', { method: 'POST' })
      .then(t => t.text())
      .then(t => Logger.getLogger().log('GameManagerWorkerInterface', 'stop', 'received server message: ' + t))
      .catch(e => Logger.getLogger().logError('GameManagerWorkerInterface', 'stop', 'Error stopping backend: ' + e, e))
  }

  getGameServerStatus(): Promise<GameServerInfo> {
    return this.fetchBackend('server-info')
      .then(t => t.json().then(j => {
        console.log('got getGameServerStatus ', j)
        return j as GameServerInfo
      }))
      .catch(e => {
        Logger.getLogger().logError('GameManagerWorkerInterface', 'getGameServerStatus', 'Error getting game server info: ' + e, e)
        return Promise.reject(e)
      })
  }
}