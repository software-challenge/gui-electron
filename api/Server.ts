///<references path="../../node_modules/@types/node/index.d.ts" />
import { ExecutableStatus } from './Api';
import { Helpers } from './Helpers';

//import * as events from "events"
import { EventEmitter } from "events";

//const EventEmitter: NodeJS.EventEmitter = require('events');

const SERVER_CWD = "./server";
const SERVER_NAME = "softwarechallenge-server.jar"

import { spawn } from 'child_process';

const cp = require('child_process');

export class ServerEvent {
  time: Date;
  type: string;
  data: string;
  constructor(type: string, data: string) {
    this.type = type;
    this.data = data;
    this.time = new Date();
  }

  toString() {
    return Helpers.getLogLine(this.data + '', this.time);
  }
}

export class Server extends EventEmitter {
  private stdout: string[] = [];
  private stderr: string[] = [];
  private events: ServerEvent[] = [];
  private status: ExecutableStatus.Status;
  private process;
  ready: Promise<void>;
  //private listeners: ((ServerEvent) => void)[] = [];

  constructor(autostart: boolean = true) {
    super();
    this.status = ExecutableStatus.Status.NOT_STARTED;

    this.ready = new Promise((resolve, reject) => {
      try {
        this.on("stdout", s => {
          if (/ClientManager running/.test(s)) {
            Helpers.log("Server ready");
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });

    if (autostart) {
      this.start();
    }
  }

  start() {
    this.stdout = [];
    this.stderr = [];
    this.events = [];
    this.stop();
    console.log("Starting server (server should reside in ./server directory)");
    this.process = spawn('java', ['-jar', SERVER_NAME], { cwd: SERVER_CWD });
    this.setStatus(ExecutableStatus.Status.RUNNING);
    this.process.stdout.on('data', (data) => {
      // XXX
      //Helpers.log("Server: " + data);
      this.stdout.push(data);
      this.emit('stdout', data + '');
      this.emit('event', new ServerEvent('stdout', data + ''));
    });
    this.process.stderr.on('data', (data) => {
      this.stderr.push(data);
      this.emit('stderr', data + '');
      this.emit('event', new ServerEvent('stderr', data + ''));
    });
    this.process.on('error', () => {
      this.setStatus(ExecutableStatus.Status.ERROR);
    });
    this.process.on('close', () => {
      this.setStatus(ExecutableStatus.Status.EXITED);
    });
  }

  stop() {
    if (this.process != null) {
      console.log("Stopping server");
      this.process.kill();
      this.setStatus(ExecutableStatus.Status.EXITED);
      this.process = null;
    }
  }

  private setStatus(s: ExecutableStatus.Status) {
    this.status = s;
    this.emit('status', s);
  }

  getEvents(): ServerEvent[] {
    return this.events;
  }

  getStatus(): ExecutableStatus.Status {
    return this.status;
  }



}