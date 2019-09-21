import { GameClient }                from './LiveGame'
import { ExecutableStatus }          from '../rules/ExecutableStatus'
import * as child_process            from 'child_process'
import { EventEmitter }              from 'events'
import { Logger }                    from '../Logger'
import { ComputerPlayer, StartType } from '../rules/GameCreationOptions'

const pathLib = require('path')


export class ExecutableClient extends EventEmitter implements GameClient {
  ready: Promise<void>
  status: ExecutableStatus.Status
  private program: string
  private arguments: string[] = []
  private workingDirectory: string = ''
  private process: child_process.ChildProcess
  private stderr: string[] = []

  constructor(player: ComputerPlayer, reservation: string, host: string, port: number) {
    /*program: string = 'java', options: string[] = ['-jar'], path: string, host: string = '127.0.0.1', port: number = 13050, reservation: string = ""*/
    super()
    this.workingDirectory = pathLib.dirname(player.path)
    switch (player.startType) {
      case StartType.Java:
        this.program = 'java'
        this.arguments = ['-jar', player.path]
        break
      case StartType.Direct:
        this.program = player.path
        this.arguments = []
        break
    }
    this.arguments.push('--host', host)
    this.arguments.push('--port', port.toString())
    if (reservation) {
      this.arguments.push('--reservation', reservation)
    }
    this.setStatus(ExecutableStatus.Status.NOT_STARTED)
  }

  start(): Promise<void> {
    this.ready = new Promise((res, rej) => {
      Logger.getLogger().log('ExecutableClient', 'spawn', `${this.program} ${this.arguments.join(' ')} (workdir: ${this.workingDirectory})`)
      let options = {
        cwd:   this.workingDirectory,
        shell: false, /* do not set to true, security risk! */
      }
      this.process = child_process.spawn(this.program, this.arguments, options)
      this.setStatus(ExecutableStatus.Status.RUNNING)
      this.process.stdout.on('data', (data) => {
        Logger.getLogger().log('ExecutableClient', 'stdout', data.toString())
      })
      this.process.stderr.on('data', (data) => {
        this.stderr.push(data.toString())
        Logger.getLogger().log('ExecutableClient', 'stderr', data.toString())
      })
      this.process.on('error', () => {
        this.setStatus(ExecutableStatus.Status.ERROR)
        rej(this.stderr)
      })
      this.process.on('exit', () => {
        this.setStatus(ExecutableStatus.Status.EXITED)
        rej(this.stderr)
      })
      this.emit('ready')
      setTimeout(() => {
        if (this.status == ExecutableStatus.Status.RUNNING) {
          res()
        }
      }, 1000)
    })
    return this.ready
  }

  stop() {
    if (this.process != null) {
      Logger.getLogger().log('ExecutableClient', 'stop', 'Stopping client')
      this.process.kill()
      this.setStatus(ExecutableStatus.Status.EXITED)
      this.process = null
    }
  }

  private setStatus(s: ExecutableStatus.Status) {
    Logger.getLogger().log('ExecutableClient', 'setStatus', 'Status change of ' + this.program + ': ' + ExecutableStatus.toString(s))
    this.status = s
    this.emit('status', s)
  }
}
