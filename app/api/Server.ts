import { ExecutableStatus } from './Api';

const SERVER_CWD = "./server";
const SERVER_NAME = "softwarechallenge-server.jar"

const cp = require('child_process');

export interface ServerEvent {
  time: Date;
  type: string,
  data: string
}

export class Server {
  private stdout: string[] = [];
  private stderr: string[] = [];
  private events: ServerEvent[] = [];
  private status: ExecutableStatus;
  private process;
  private listeners: ((ServerEvent) => void)[] = [];

  constructor() {
    this.status = ExecutableStatus.NOT_STARTED;
    this.start();
  }

  start() {
    this.stdout = [];
    this.stderr = [];
    this.events = [];
    this.stop();
    console.log("Starting server (server should reside in ./server directory)");
    this.process = cp.spawn('java', ['-jar', SERVER_NAME], { cwd: SERVER_CWD });
    this.process.stdout.on('data', (data) => {
      this.stdout.push(data);
      this.sendEvent('stdout', data);
    });
    this.process.stderr.on('data', (data) => {
      this.stderr.push(data);
      this.sendEvent('stdout', data);
    });
    this.process.on('error', () => this.status = ExecutableStatus.ERROR);
    this.process.on('close', () => this.status = ExecutableStatus.EXITED);
  }

  stop() {
    if (this.process != null) {
      console.log("Stopping server");
      this.process.kill();
      this.process = null;
    }
  }

  private sendEvent(type: string, data: string) {
    var e = {
      'time': new Date(),
      'type': type,
      'data': data + ""
    };
    this.events.push(e);
    this.listeners.forEach(l => {
      try {
        l(e);
      } catch (ex) {
        console.error(ex);
      }
    });
  }

  registerListener(listener: (ServerEvent) => void) {
    console.log("Adding listener");
    this.listeners.push(listener);
  }

  deregisterListener(listener: (ServerEvent) => void) {
    console.log("Removing listener");
    this.listeners = this.listeners.filter(l => l != listener);
  }

  getStdout(): string[] {
    return this.stdout;
  }

  getStderr(): string[] {
    return this.stderr;
  }

  getEvents(): ServerEvent[] {
    return this.events;
  }




}