
import * as fs from "fs";

//import { remote } from 'electron';


export class Logger {
  private static logger: Logger;

  public static getLogger() {
    if (!this.logger) {
      let path = process.env.SGC_LOG_PATH;
      console.log("creating log in ", path)
      this.logger = new Logger(true, path);
    }
    return this.logger;
  }

  private logFile: string;
  private logToConsole: boolean;

  constructor(logToConsole: boolean, logFile?: string) {
    if (logFile) {
      this.logFile = logFile;
    }
    this.logToConsole = logToConsole;
  }

  private __log(message: string) {
    if (this.logToConsole) {
      console.log(message);
    }
    if (this.logFile) {
      fs.appendFileSync(this.logFile, message);
    }
  }

  public log(actor: string, focus: string, message: string) {
    this.__log(`[${new Date().toLocaleString()}] ${actor}:${focus}:\n${message}\n\n`);
  }

  public focus(actor: string, focus: string) {
    return { log: (message) => this.log(actor, focus, message) };
  }

  public getLogFilePath(): string {
    return this.logFile;
  }

  public getCompleteLog(): string {
    if (this.logFile) {
      return fs.readFileSync(this.logFile).toString();
    } else {
      return "";
    }
  }

}