import { GameCreationOptions, GameType } from '../rules/GameCreationOptions'
import { Game } from '../rules/Game'
import { LiveGame } from './LiveGame'
import { Replay } from './Replay'
import { AsyncApi } from './AsyncApi'
import { GameStatus } from '../rules/GameStatus'
import { TransferableMoveRequest } from '../rules/TransferableMoveRequest'
import { Logger } from '../Logger'
import { GameState, GameResult, Piece } from '../rules/CurrentGame'
import * as express from 'express'
import * as bodyParser from 'body-parser'
import { log, stringify } from '../../helpers/Utils'
import { GameServerInfo } from '../synchronous/GameManagerWorkerInterface'


export class AsyncGameManager {
  private games: Map<number, Game>
  private server: express.Express
  private closer: any

  constructor(port: number) {
    AsyncApi.getServer()
    this.games = new Map<number, Game>()
    this.server = express()
    // parse request bodies as json. Enables access to attributes with req.body.someAttributeName
    this.server.use(bodyParser.json())
    this.setupMessages()
    this.closer = this.server.listen(port)
    log('AsyncGameManager listening')
  }

  private setupMessages() {
    this.server.post('/stop', (req, res) => {
      try {
        AsyncApi.getServer().then(server => {
          server.stop()
          this.closer.close()
          res.send('server stopped')
        })
      } catch(e) {
        // TODO extract exception handling (DRY)
        res.status(500).send(e)
      }
    })

    this.server.get('/list-games', (req, res) => {
      try {
        res.json(Array.from(this.games.keys()))
      } catch(e) {
        res.status(500).send(e)
      }
    })

    this.server.post('/start-game', (req, res) => {
      try {
        let options: GameCreationOptions = req.body
        let g: Game = options.kind == GameType.Replay ? new Replay(options) : new LiveGame(options)
        this.games.set(options.gameId, g)
        g.ready.then(() => {
          Logger.getLogger().log('AsyncGameManager', 'start_game', 'game ready - new game id: ' + options.gameId)
          res.json(options.gameId)
        }).catch(e => {
          log('Error while waiting for game to ready: ' + stringify(e))
          res.status(500).send(e)
        })
      } catch(e) {
        res.status(500).send(e.toString())
      }
    })

    this.server.post('/save-replay', (req, res) => {
      try {
        let options = req.body
        let g: Game = this.games.get(options.gameId)
        if(g instanceof LiveGame) {
          g.saveReplay(options.path)
        }
      } catch(e) {
        res.status(500).send(e.toString())
      }
    })

    this.server.get('/delete-game', (req, res) => {
      try {
        let gameId = parseInt(req.query.id)
        let game: Game = this.games.get(gameId)
        if(game instanceof LiveGame) {
          game.cancel()
        }
        this.games.delete(gameId)
      } catch(e) {
        res.status(500).send(e.toString())
      }
    })

    this.server.get('/status', (req, res) => {
      try {
        let gameId = parseInt(req.query.id)
        if(this.games.has(gameId)) {//check if this game even exists
          let game: any = this.games.get(gameId)//Fetch game, prepare answer
          res.send(this.report_status(game, gameId))
        } else {
          res.status(404).send('No game with id ' + gameId)
        }
      } catch(e) {
        res.status(500).send(e)
      }
    })

    this.server.get('/state', (req, res) => {
      try {
        let gameId = parseInt(req.query.id)
        let turn = parseInt(req.query.turn)
        if(this.games.has(gameId)) {
          this.games.get(gameId).getState(turn).then(gs => {
            res.send(gs)
          })
        } else {
          res.status(404).send('No game with id ' + gameId)
        }
      } catch(e) {
        res.status(500).send(e)
      }
    })

    this.server.post('/send-move', (req, res) => {
      try {
        let gameId = parseInt(req.query.id)
        let moveId = parseInt(req.query.moveId)
        if(this.games.has(gameId)) {
          AsyncApi.redeemMoveRequest(gameId, moveId, req.body)
          res.send(`Sent move with id ${moveId} for game ${gameId}`)
        } else {
          res.status(404).send('No game with id ' + gameId)
        }
      } catch(e) {
        res.status(500).send(e)
      }
    })

    this.server.get('/server-info', (req, res) => {
      AsyncApi.getServer()
        .then(server => {
          res.send({
            status: server.getStatus(),
            port: server.getPort(),
            error: server.stderr.join(),
          } as GameServerInfo)
        })
        .catch(e => res.status(500).send(e))
    })

  }

  private report_status(game: Game, gameId: number): { numberOfStates: number, gameStatus: GameStatus, moveRequest?: TransferableMoveRequest, gameResult?: GameResult } {
    let resp: any = {}

    resp.numberOfStates = game.getStateCount()

    if(game.isReplay) {//Game is a replay, all states should be loaded, report so
      resp.gameStatus = 'REPLAY'
      resp.gameResult = game.getResult()
    } else if(game instanceof LiveGame) { //Game is a live game and might or might not be finished, let's find out
      let lg: LiveGame = game
      if(lg.isLive()) {
        if(AsyncApi.hasMoveRequest(gameId)) {//If there's an action request currently lodged with the API
          resp.gameStatus = 'REQUIRES INPUT'
          let [id, mr] = AsyncApi.getMoveRequest(gameId)//Get the request and assemble the response. We can request this ActionRequest many times, but only redeem it once
          resp.moveRequest = {
            state: mr.state,
            id: id,
          }
        } else { //Game is live, but doesn't require input
          resp.gameStatus = 'RUNNING'
        }
      } else {//Game has finished
        resp.gameStatus = 'FINISHED'
        resp.gameResult = lg.getResult()
      }
    } else {
      throw new Error('got game which is not a replay and not a live game')
    }
    return resp
  }
}
