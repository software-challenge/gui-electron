
import * as fs from "fs";

//import { remote } from 'electron';


export class Logger {
  private static logger: Logger;

  public static getLogger() {
    if (!this.logger) {
      let path = process.env.SGC_LOG_PATH;
      console.log("creating log in ", path)
      this.logger = new Logger(false, true, path);
    }
    return this.logger;
  }

  private logFile: string;
  private logToConsole: boolean;
  private logToHTML: boolean;

  private static StringToColor = (str: string) => {
    const colours = 32;
    let clr = 0;
    for (let i = 0; i < str.length; i++) {
      clr += str.charCodeAt(i);
      clr %= colours;
    }
    return 'hsl(' + (360 / 32 * clr) + ',60%,40%)';
  }


  constructor(logToConsole: boolean, logToHTML: boolean = true, logFile?: string) {
    if (logFile) {
      this.logFile = logFile;
    }
    this.logToHTML = logToHTML;
    if (logToHTML) {
      this.logFile = this.logFile + ".html";
      if (!fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, `
        <html>
        <head>
        <meta charset="utf-8"/>
        <style>
        #log{
          font-family: sans-serif;
          width: 90%;
          margin-left: auto;
          margin-right: auto;
          margin-top: auto;
        }
        .hidden{
          display: none;
        }
        .message{
          margin: 8px;
          background-color: #eee;
          padding: 6px;
          border-radius: 4px;
        }
        .message-content{
          overflow: scroll;
          font-size: 12px;
          max-height: 40vh;
        }
        .header{
          font-size: 12px;
          font-family: monospace;
        }
        .actor{
          font-weight: 900;
        }
        .timestamp{
          opacity: .7;
        }
        #filter {
          background-color: #eee;
          top: 0px;
          padding: 8px;
          width: 100vw;
        }
        body {
          margin: 0px;
          padding: 0px;
          width: 100vw;
          height: 100vh;
          overflow-x: hidden;
        }
        </style>
        <script type="text/javascript">
          function escape(str){
            return str.replace(/\W/g, '');
          }
          function filter(){
            let actorName = escape(document.getElementById('actor-filter').value.trim());
            let focusName = escape(document.getElementById('focus-filter').value.trim());

            var nodes = document.querySelectorAll('.message');
            for(var i = 0; i < nodes.length; i++){
              if((actorName == "" || nodes[i].getAttribute('actor').indexOf(actorName) != -1) && (focusName == "" || nodes[i].getAttribute('focus').indexOf(focusName) != -1)){
                nodes[i].classList.remove('hidden');
              }else{
                nodes[i].classList.add('hidden');
              }
            }
          }
        </script>
        </head>
        <body>
        <div id="filter">
          Actor: <input type="text" id="actor-filter" onkeydown="filter();" onblur="filter();" /><br/>
          Focus: <input type="text" id="focus-filter" onkeydown="filter();" onblur="filter();"/>
        </div>
        <div id="log">
        `);
      }
    }
    this.logToConsole = logToConsole;
  }

  private __log(timestamp: string, actor: string, focus: string, message: string) {
    if (this.logToConsole) {
      console.log(`[${timestamp}] ${actor}:${focus}:\n${message}\n\n`);
    }
    if (this.logFile) {
      if (this.logToHTML) {
        fs.appendFile(this.logFile, `
          <div class="message" actor="${actor.replace(/\W/g, '')}" focus="${focus.replace(/\W/g, '')}">
            <div class="header" style="color: ${Logger.StringToColor(actor)};">
              <span class="timestamp">${timestamp}</span>
              <span class="actor">${actor}</span>
              <span class="focus" style="color: ${Logger.StringToColor(focus)}">${focus}</span>
            </div>
            <pre class="message-content">${(message + "").replace(/\</g, '&lt;').replace(/\>/g, '&gt;').trim()}</pre>
          </div>
        `, () => { });
      } else {
        fs.appendFile(this.logFile, message, () => { });
      }
    }
  }

  public log(actor: string, focus: string, message: string) {
    let d = new Date();
    this.__log(d.toLocaleString() + '.' + ('000' + d.getMilliseconds()).slice(-3), actor, focus, message);
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