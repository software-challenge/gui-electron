import { GameClient } from './Game';
import { ExecutableStatus } from './Api';
import { spawn } from 'child_process';
import { EventEmitter } from "events";


export class ExecutableClient extends EventEmitter implements GameClient {
  ready: Promise<void>;
  status: ExecutableStatus.Status;
  private stdout: string[] = [];
  private stderr: string[] = [];
  private program: string;
  private options: string[];
  private process;

  constructor(program: string = 'java', options: string[] = ['-jar'], path: string, host: string = '127.0.0.1', port: number = 13050, reservation: string = "") {
    super();
    this.program = program;
    this.options = options;
    this.options.push(path);
    this.options.push('--host', host);
    this.options.push('--port', port.toString());
    if (reservation) {
      this.options.push('--reservation', reservation);
    }
    this.setStatus(ExecutableStatus.Status.NOT_STARTED);
  }

  start(): Promise<void> {
    var start = async function () {
      this.process = spawn(this.program, this.options);
      this.setStatus(ExecutableStatus.Status.RUNNING);
      this.process.stdout.on('data', (data) => {
        this.stdout.push(data);
        this.emit('stdout', data + '');
      });
      this.process.stderr.on('data', (data) => {
        this.stderr.push(data);
        this.emit('stderr', data + '');
      });
      this.process.on('error', () => {
        this.setStatus(ExecutableStatus.Status.ERROR);
      });
      this.process.on('close', () => {
        this.setStatus(ExecutableStatus.Status.EXITED);
      });

    }.bind(this);
    return start();
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
}