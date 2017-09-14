import { GameClient } from './LiveGame';
import { ExecutableStatus } from './Api';
import * as child_process from 'child_process';
import { EventEmitter } from "events";
import { Api } from './Api';

const pathLib = require('path');


export class ExecutableClient extends EventEmitter implements GameClient {
  ready: Promise<void>;
  status: ExecutableStatus.Status;
  private stdout: string[] = [];
  private stderr: string[] = [];
  private program: string;
  private arguments: string[];
  private workingDirectory: string = "";
  private process: child_process.ChildProcess;

  constructor(program: string = 'java', options: string[] = ['-jar'], path: string, host: string = '127.0.0.1', port: number = 13050, reservation: string = "") {
    super();
    this.program = program;
    this.workingDirectory = pathLib.dirname(program);
    this.arguments = options;
    if (path) {
      this.arguments.push(path);
      this.workingDirectory = pathLib.dirname(path);
    }
    this.arguments.push('--host', host);
    this.arguments.push('--port', port.toString());
    if (reservation) {
      this.arguments.push('--reservation', reservation);
    }
    this.setStatus(ExecutableStatus.Status.NOT_STARTED);
  }

  start(): Promise<void> {
    this.ready = new Promise((res, rej) => {
      console.log("Starting", this.program, this.arguments)
      Api.getLogger().log("ExecutableClient", "spawn", `${this.program} ${this.arguments.join(' ')} (cwd: ${this.workingDirectory})`);
      let options = {
        cwd: this.workingDirectory,
        shell: false /* do not set to true, security risk! */
      };
      this.process = child_process.spawn(this.program, this.arguments, options);
      this.setStatus(ExecutableStatus.Status.RUNNING);
      this.process.stdout.on('data', (data) => {
        this.stdout.push(data.toString());
        this.emit('stdout', data + '');
      });
      this.process.stderr.on('data', (data) => {
        this.stderr.push(data.toString());
        this.emit('stderr', data + '');
      });
      this.process.on('error', () => {
        this.setStatus(ExecutableStatus.Status.ERROR);
      });
      this.process.on('exit', () => {
        this.setStatus(ExecutableStatus.Status.EXITED);
      });
      this.emit('ready');
      if (this.status == ExecutableStatus.Status.RUNNING) {
        res();
      } else {
        rej("Client did not start");
      }
    })
    return this.ready;
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
    console.log("Status change of " + this.program + ": " + ExecutableStatus.toString(s));
    this.status = s;
    this.emit('status', s);
  }
}