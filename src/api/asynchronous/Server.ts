import { ExecutableStatus } from '../rules/ExecutableStatus'
import { getLogLine, log } from '../../helpers/Helpers'
import { Logger } from '../Logger'
import { EventEmitter } from 'events'
import * as child_process from 'child_process'
import * as treekill from 'tree-kill'
import path = require('path')

require('hazardous') // important to get the paths right in distributed app

//const EventEmitter: NodeJS.EventEmitter = require('events');

const SERVER_CWD = 'server' // naked directory name - don't use any paths here! They change when the app is distributed and break server spawning
const SERVER_NAME = 'server.jar'

export class ServerEvent {
  time: Date
  type: string
  data: string

  constructor(type: string, data: string) {
    this.type = type
    this.data = data
    this.time = new Date()
  }

  toString() {
    return getLogLine(this.data, this.time)
  }
}

export class Server extends EventEmitter {
  private stdout: string[] = []
  public stderr: string[] = []
  private events: ServerEvent[] = []
  private status: ExecutableStatus.Status
  private process
  private logbuffer: string
  private port: number
  ready: Promise<void>

  //private listeners: ((ServerEvent) => void)[] = [];

  constructor(port: number, autostart: boolean = true) {
    super()
    this.port = port
    this.logbuffer = ''
    setInterval(() => {
      if (this.logbuffer != '') {
        Logger.getLogger().log('server', 'stdout', this.logbuffer)
        this.logbuffer = ''
      }
    }, 500)
    this.status = ExecutableStatus.Status.NOT_STARTED

    this.ready = new Promise((resolve, reject) => {
      try {
        this.on('stdout', s => {
          this.logbuffer += s + '\n'
          if (/ClientManager running/.test(s)) {
            log('Server ready')
            resolve()
          }

          if (/sc.server.network.NewClientListener/.test(s)) {
            this.emit('newclient')
          }
        })
      } catch (e) {
        reject(e)
      }
    })

    if (autostart) {
      this.start()
    }
  }

  getPort() {
    return this.port
  }

  getHost() {
    return '127.0.0.1'
  }

  start() {
    this.stdout = []
    this.stderr = []
    this.events = []
    this.stop()
    Logger.getLogger().log('Server', 'start', 'Starting server (server should reside in ./server directory)')
    // NOTE that the path will be different when the app is distributed!
    const cwd = path.join(__dirname, '..', '..', '..', SERVER_CWD)
    Logger.getLogger().log('Server', 'start', 'starting ' + SERVER_NAME + ' in ' + cwd + ', Port: ' + this.port)
    this.process = child_process.spawn('java', ['-jar', SERVER_NAME, '--port', this.port.toString()], {cwd: cwd})
    this.process.stderr.on('data', (data) => {
      log('Server stderr: ' + data)
      this.stderr.push(data)
      this.emit('stderr', data + '')
      this.emit('event', new ServerEvent('stderr', data + ''))
    })
    this.process.stdout.on('data', (data) => {
      this.stdout.push(data)
      this.emit('stdout', data + '')
      this.emit('event', new ServerEvent('stdout', data + ''))
    })
    this.process.on('error', () => {
      this.setStatus(ExecutableStatus.Status.ERROR)
    })
    this.process.on('close', () => {
      this.setStatus(ExecutableStatus.Status.EXITED)
    })
    this.setStatus(ExecutableStatus.Status.RUNNING)
  }

  stop() {
    if (this.process != null) {
      Logger.getLogger().log('Server', 'stop', 'Stopping server. Current Status: ' + ExecutableStatus.toString(this.getStatus()) + ' current pid: ' + this.process.pid)

      this.process.stdin.pause()
      this.process.stdout.pause()
      this.process.stderr.pause()

      let pid = this.process.pid

      treekill(pid)

      this.setStatus(ExecutableStatus.Status.EXITED)


      this.process = null
      Logger.getLogger().log('Server', 'stop', 'terminated')
    }
  }

  private setStatus(s: ExecutableStatus.Status) {
    this.status = s
    this.emit('status', s)
  }

  getEvents(): ServerEvent[] {
    return this.events
  }

  getStatus(): ExecutableStatus.Status {
    return this.status
  }

}
