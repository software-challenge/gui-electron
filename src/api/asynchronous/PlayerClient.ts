import { GenericClient }                      from './GenericClient'
import { Parser }                             from './Parser'
import { GAME_IDENTIFIER, GameState, Player } from '../rules/CurrentGame'
import { Logger }                             from '../Logger'


export class PlayerClientOptions {
  constructor(displayName: string, canTimeout: boolean) {
    this.displayName = displayName
    this.canTimeout = canTimeout
  }

  displayName: string
  canTimeout: boolean
}

export class GenericPlayer extends GenericClient {

  private joinRequest: Promise<Array<any>>
  private joined: () => void

  constructor(host: string, port: number, name: string) {
    super(host, port, false, name)
    this.on('message', msg => this.handleMessage(msg))
  }

  private async handleMessage(msg: string) {
    msg = msg.replace('<protocol>', '') //Strip unmatched protocol tag. Really dirty hack, but a problem of the specification
    Logger.getLogger().log('GenericPlayer', 'handleMessage', msg)
    Parser.getJSONFromXML(msg).then(decoded => {
      Logger.getLogger().log('GenericPlayer', 'handleMessage', JSON.stringify(decoded))
      if (decoded.joined || !decoded.room || !decoded.room.data) {
        return //Forgot that this happens
      }
      switch (decoded.room.data[0]['$'].class.trim()) {//Sometimes, extra linebreaks end up here
        case 'memento':
          const state = decoded.room.data[0].state[0]
          if (state == null || typeof state == 'undefined') {
            const ipc = require('electron').ipcRenderer
            ipc.send('showErrorBox', 'Server antwortet nicht', 'Der Server hat eine ungültige Antwort gesendet, wahrscheinlich ist er gestorben...')
          }
          const gs = GameState.fromJSON(state)
          this.emit('state', gs)
          break
        case 'sc.framework.plugins.protocol.MoveRequest':
          this.emit('moverequest')
          break
        case 'welcomeMessage':
          if (this.joined) {
            this.joined()
          }
          this.emit(
            'welcome', {
              mycolor: Player.ColorFromString(decoded.room.data[0]['$'].color),
              roomId:  decoded.room['$'].roomId,
            },
          )
          break
        case 'error':
          const message = decoded.room.data[0].$.message
          Logger.getLogger().logObject('PlayerClient', 'handleMessage', 'Received Error:', decoded.room)
          this.emit('error', message)
          break
        case 'result':
          // ignore results
          break
        default:
          throw `Unknown data class: ${decoded.room.data[0]['$'].class}\n\n${JSON.stringify(decoded)}`
      }
    }).catch(error => Logger.getLogger().logError('PlayerClient', 'handleMessage', 'Error in Parser.getJSONFromXML: ' + error, error))
  }

  joinPrepared(reservation: string): Promise<Array<any>> {
    let requestJoin = new Promise((resolve, reject) => {
      if (reservation) {
        this.writeData(`<protocol><joinPrepared reservationCode="${reservation}" />`, resolve)
      } else {
        this.writeData(`<protocol><join gameType="${GAME_IDENTIFIER}"/>`, resolve)
      }
    })
    this.joinRequest = Promise.all([requestJoin, new Promise((resolve, reject) => { this.joined = resolve })])
    return this.joinRequest
  }


}
