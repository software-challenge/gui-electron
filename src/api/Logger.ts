import * as fs from 'fs'
import * as path from 'path'
import { log } from '../helpers/Helpers'

export class Logger {
  private static logger: Logger

  public static getLogger() {
    if(!this.logger) {
      let logPath = process.env.SGC_LOG_PATH
      if(!fs.existsSync(logPath))
        fs.mkdirSync(logPath)
      const d = new Date()
      let logFile = path.join(logPath, `software-challenge-gui-${d.getFullYear()}.${d.getUTCMonth() + 1}.${d.getUTCDate()}.log`)
      log('logging to ' + logFile)
      this.logger = new Logger(false, true, logFile)
    }
    return this.logger
  }

  private logFile: string
  private logToConsole: boolean
  private logToHTML: boolean

  private static StringToColor = (str: string) => {
    const colours = 32
    let clr = 0
    for(let i = 0; i < str.length; i++) {
      clr += str.charCodeAt(i)
      clr %= colours
    }
    return 'hsl(' + (360 / 32 * clr) + ',90%,25%)'
  }

  constructor(logToConsole: boolean, logToHTML: boolean = true, logFile?: string) {
    this.logToHTML = logToHTML
    this.logFile = logFile
    this.logToConsole = logToConsole
    if(logToHTML) {
      this.logFile = this.logFile + '.html'
    }
    try {
      if(!fs.existsSync(this.logFile)) {
        this.createLogFile()
      } else {
        if(!fs.existsSync(this.logFile)) {
          fs.writeFileSync(this.logFile, '')
        }
      }
    } catch(err) {
      console.log('Could not create log file, falling back to console logging.')
      this.logToHTML = false
      this.logFile = null
      this.logToConsole = true
    }
  }

  private __log(timestamp: string, actor: string, focus: string, message: string) {
    if(this.logToConsole) {
      console.log(`[${timestamp}] ${actor}:${focus}:\n${message}\n\n`)
    }
    if(this.logFile) {
      if(this.logToHTML) {
        fs.appendFile(this.logFile, `
          <div class="message" actor="${actor.replace(/\W/g, '')}" focus="${focus.replace(/\W/g, '')}">
            <div class="header" style="color: ${Logger.StringToColor(actor)};">
              <span class="timestamp">${timestamp}</span>
              <span class="actor">${actor}</span>
              <span class="focus" style="color: ${Logger.StringToColor(focus)}">${focus}</span>
            </div>
            <pre class="message-content">${(message + '').replace(/\</g, '&lt;').replace(/\>/g, '&gt;').trim()}</pre>
          </div>
        `, (err) => { if(err) { console.error(err) } })
      } else {
        fs.appendFile(this.logFile, message, (err) => { if(err) { console.error(err) } })
      }
    }
  }

  public log(actor: string, focus: string, message: string) {
    let d = new Date()
    this.__log(d.toLocaleString('de-DE') + '.' + ('000' + d.getMilliseconds()).slice(-3, -2), actor, focus, message)
  }

  public logObject(actor: string, focus: string, message: string, object: any) {
    this.log(actor, focus, message + '\n' + JSON.stringify(object, null, 4))
  }

  public logError(actor: string, focus: string, message: string, error: any) {
    this.log(actor, focus, message)
    console.error(error)
  }

  public clearLog() {
    this.createLogFile()
  }

  public focus(actor: string, focus: string) {
    return {log: (message) => this.log(actor, focus, message)}
  }

  public getLogFilePath(): string {
    return this.logFile
  }

  public getCompleteLog(): string {
    if(this.logFile) {
      return fs.readFileSync(this.logFile).toString()
    } else {
      return ''
    }
  }

  /**
   * Debug function for finding console.log where Logger.log should have been used
   */
  public static injectLineNumbersIntoConsoleLog() {
    let clog = console.log
    console.log = (t) => clog(new Error().stack.split('\n')[3].trim().substring(3) + ':  ' + t)
  }

  private createLogFile() {
    fs.writeFileSync(this.logFile, `
    <html>
    <head>
    <meta charset="utf-8"/>
    <style>
    input {
      margin: 4px;
      background-color: #fff;
      border: 1px solid #fff;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    #log {
      font-family: sans-serif;
      width: 90%;
      margin-left: auto;
      margin-right: auto;
      margin-top: 76px;
    }
    .hidden {
      display: none;
    }
    .message {
      margin: 8px;
      background-color: #eee;
      padding: 6px;
      border-radius: 4px;
    }
    .message-content {
      overflow: scroll;
      font-size: 12px;
      max-height: 40vh;
    }
    .header {
      font-size: 12px;
      font-family: monospace;
    }
    .actor {
      font-weight: 900;
    }
    .timestamp {
      opacity: .7;
    }
    #filter {
      position: fixed;
      font-family: sans;
      background-color: #eee;
      top: 0px;
      padding: 8px;
      text-align: right;
      font-size: 12px;
      height: 52px;
      right: 0px;
      border-bottom-left-radius: 4px;
    }
    body {
      margin: 0;
    }
    </style>
    <script type="text/javascript">
      function escape(str){
        return str.replace(/\W/g, '');
      }
      function filter(){
        let actorName = escape(document.getElementById('actor-filter').value.trim());
        let focusName = escape(document.getElementById('focus-filter').value.trim());

        const nodes = document.querySelectorAll('.message')
        for(let i = 0; i < nodes.length; i++){
          if((actorName == "" || nodes[i].getAttribute('actor').indexOf(actorName) != -1) && (focusName == "" || nodes[i].getAttribute('focus').indexOf(focusName) != -1)){
            nodes[i].classList.remove('hidden');
          } else {
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
    `)
  }

}
