import { GameCreationOptions, GameType } from '../rules/GameCreationOptions'
import { Game }                          from '../rules/Game'
import { LiveGame }                      from './LiveGame'
import { Replay }                        from './Replay'
import { AsyncApi }                      from './AsyncApi'
import { GameStatus }                    from '../rules/GameStatus'
import { TransferableMoveRequest }       from '../rules/TransferableMoveRequest'
import { Logger }                        from '../Logger'
import { GameResult }                    from '../rules/CurrentGame'
import express                      from 'express'
import child_process from 'child_process'
import * as WebSocket from 'ws'
import * as bodyParser                   from 'body-parser'
import * as http from 'http'
import { log, stringify }                from '../../helpers/Utils'
import { GameServerInfo }                from '../synchronous/GameManagerWorkerInterface'


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
      } catch (e) {
        // TODO extract exception handling (DRY)
        res.status(500).send(e)
      }
    })

    this.server.get('/list-games', (req, res) => {
      try {
        res.json(Array.from(this.games.keys()))
      } catch (e) {
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
      } catch (e) {
        res.status(500).send(e.toString())
      }
    })

    this.server.post('/save-replay', (req, res) => {
      try {
        let options = req.body
        let g: Game = this.games.get(options.gameId)
        if (g instanceof LiveGame) {
          g.saveReplay(options.path)
        }
      } catch (e) {
        res.status(500).send(e.toString())
      }
    })

    this.server.get('/delete-game', (req, res) => {
      try {
        let gameId = parseInt(req.query.id)
        let game: Game = this.games.get(gameId)
        if (game instanceof LiveGame) {
          game.cancel()
        }
        this.games.delete(gameId)
      } catch (e) {
        res.status(500).send(e.toString())
      }
    })

    this.server.get('/status', (req, res) => {
      try {
        let gameId = parseInt(req.query.id)
        if (this.games.has(gameId)) {//check if this game even exists
          let game: any = this.games.get(gameId)//Fetch game, prepare answer
          res.send(this.report_status(game, gameId))
        } else {
          res.status(404).send('No game with id ' + gameId)
        }
      } catch (e) {
        res.status(500).send(e)
      }
    })

    this.server.get('/state', (req, res) => {
      try {
        let gameId = parseInt(req.query.id)
        let turn = parseInt(req.query.turn)
        if (this.games.has(gameId)) {
          this.games.get(gameId).getState(turn).then(gs => {
            res.send(gs)
          })
        } else {
          res.status(404).send('No game with id ' + gameId)
        }
      } catch (e) {
        res.status(500).send(e)
      }
    })

    this.server.post('/send-move', (req, res) => {
      try {
        let gameId = parseInt(req.query.id)
        let moveId = parseInt(req.query.moveId)
        if (this.games.has(gameId)) {
          AsyncApi.redeemMoveRequest(gameId, moveId, req.body)
          res.send(`Sent move with id ${moveId} for game ${gameId}`)
        } else {
          res.status(404).send('No game with id ' + gameId)
        }
      } catch (e) {
        res.status(500).send(e)
      }
    })

    this.server.get('/server-info', (req, res) => {
      AsyncApi.getServer()
        .then(server => {
          res.send({
            status: server.getStatus(),
            port:   server.getPort(),
            error:  server.stderr.join(),
          } as GameServerInfo)
        })
        .catch(e => res.status(500).send(e))
    })

    const server = http.createServer(this.server)
    const wss = new WebSocket.Server({ server })

    wss.on('connection', (ws, req) => {

      // TODO extract filename
      /*
      let match = req.url.match(/^\/rtmp\/(.*)$/);

      const rtmpUrl = decodeURIComponent(match[1]);
      console.log('Target RTMP URL:', rtmpUrl);
      */

      // Launch FFmpeg to handle all appropriate transcoding, muxing, and RTMP.
      // If 'ffmpeg' isn't in your path, specify the full path to the ffmpeg binary.
      const ffmpeg = child_process.spawn('ffmpeg', [
        // Facebook requires an audio track, so we create a silent one here.
        // Remove this line, as well as `-shortest`, if you send audio from the browser.
        '-f', 'lavfi', '-i', 'anullsrc',

        // FFmpeg will read input video from STDIN
        '-i', '-',

        // Because we're using a generated audio source which never ends,
        // specify that we'll stop at end of other input.  Remove this line if you
        // send audio from the browser.
        '-shortest',

        // If we're encoding H.264 in-browser, we can set the video codec to 'copy'
        // so that we don't waste any CPU and quality with unnecessary transcoding.
        // If the browser doesn't support H.264, set the video codec to 'libx264'
        // or similar to transcode it to H.264 here on the server.
        '-vcodec', 'copy',

        // AAC audio is required for Facebook Live.  No browser currently supports
        // encoding AAC, so we must transcode the audio to AAC here on the server.
        '-acodec', 'aac',

        // FLV is the container format used in conjunction with RTMP
        '-f', 'flv',

        // The output RTMP URL.
        // For debugging, you could set this to a filename like 'test.flv', and play
        // the resulting file with VLC.  Please also read the security considerations
        // later on in this tutorial.
        'test.flv'
      ]);

      // If FFmpeg stops for any reason, close the WebSocket connection.
      ffmpeg.on('close', (code, signal) => {
        console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal);
        ws.terminate();
      });

      // Handle STDIN pipe errors by logging to the console.
      // These errors most commonly occur when FFmpeg closes and there is still
      // data to write.  If left unhandled, the server will crash.
      ffmpeg.stdin.on('error', (e) => {
        console.log('FFmpeg STDIN Error', e);
      });

      // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
      ffmpeg.stderr.on('data', (data) => {
        console.log('FFmpeg STDERR:', data.toString());
      });

      // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
      ws.on('message', (msg) => {
        console.log('DATA', msg);
        ffmpeg.stdin.write(msg);
      });

      // If the client disconnects, stop FFmpeg.
      ws.on('close', (e) => {
        ffmpeg.kill('SIGINT');
      });

    });

    server.listen(8999, () => {
      console.log("Websocket server started on port 8999")
    })

  }

  private report_status(game: Game, gameId: number): { numberOfStates: number, gameStatus: GameStatus, moveRequest?: TransferableMoveRequest, gameResult?: GameResult } {
    let resp: any = {}

    resp.numberOfStates = game.getStateCount()

    if (game.isReplay) {//Game is a replay, all states should be loaded, report so
      resp.gameStatus = 'REPLAY'
      resp.gameResult = game.getResult()
    } else if (game instanceof LiveGame) { //Game is a live game and might or might not be finished, let's find out
      let lg: LiveGame = game
      if (lg.isLive()) {
        if (AsyncApi.hasMoveRequest(gameId)) {//If there's an action request currently lodged with the API
          resp.gameStatus = 'REQUIRES INPUT'
          let [id, mr] = AsyncApi.getMoveRequest(gameId)//Get the request and assemble the response. We can request this ActionRequest many times, but only redeem it once
          resp.moveRequest = {
            state: mr.state,
            id:    id,
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
