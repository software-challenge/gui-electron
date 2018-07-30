///<references path="../../node_modules/@types/node/index.d.ts" />
import { ExecutableStatus } from '../rules/ExecutableStatus';
import { Helpers } from '../Helpers';
import { Logger } from '../Logger';

//import * as events from "events"
import { EventEmitter } from "events";
import { remote } from "electron";
require('hazardous'); // important to get the paths right in distributed app
import path = require("path");

//const EventEmitter: NodeJS.EventEmitter = require('events');

const SERVER_CWD = "server"; // naked directory name NOTE: don't use any paths here! They change when the app is distributed and break server spawning
const SERVER_NAME = "software-challenge-server.jar";

import { spawn } from 'child_process';
import * as treekill from 'tree-kill';

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
  private logbuffer: string;
  ready: Promise<void>;
  //private listeners: ((ServerEvent) => void)[] = [];

  constructor(autostart: boolean = true) {
    super();
    this.logbuffer = "";
    setInterval(() => {
      if (this.logbuffer != "") {
        Logger.getLogger().log("server", "stdout", this.logbuffer);
        this.logbuffer = "";
      }
    }, 500);
    this.status = ExecutableStatus.Status.NOT_STARTED;

    this.ready = new Promise((resolve, reject) => {
      try {
        this.on("stdout", s => {
          this.logbuffer += s + "\n";
          if (/ClientManager running/.test(s)) {
            Helpers.log("Server ready");
            resolve();
          }

          if (/sc.server.network.NewClientListener/.test(s)) {
            this.emit('newclient');
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
    this.hasExited = false;
    this.stdout = [];
    this.stderr = [];
    this.events = [];
    this.stop();
    Logger.getLogger().log("Server", "start", "Starting server (server should reside in ./server directory)");
    // NOTE that the path will be different when the app is distributed!
    var cwd = path.join(__dirname, "..", "..", "..", SERVER_CWD);
    Logger.getLogger().log("Server", "start", "cwd: " + cwd);
    this.process = spawn('java', ['-jar', SERVER_NAME], { cwd: cwd });
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

  private hasExited = false;

  stop() {
    if (this.process != null) {
      Logger.getLogger().log("Server", "stop", "Stopping server. Current Status: " + ExecutableStatus.toString(this.getStatus()) + " current pid: " + this.process.pid);

      this.process.stdin.pause();
      this.process.stdout.pause();
      this.process.stderr.pause();

      let pid = this.process.pid;

      treekill(pid);

      this.setStatus(ExecutableStatus.Status.EXITED);


      this.process = null;
      Logger.getLogger().log("Server", "stop", "terminated");
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
