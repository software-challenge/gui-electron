///<references path="../../node_modules/@types/node/index.d.ts" />
///<references path="../../node_modules/@types/sax/index.d.ts" />
const net = require('net');
import * as events from "events"
import { Helpers } from './Helpers';
import { SAXParser } from 'sax';
import { Api } from './Api';

const SERVER_PORT = 13050;

export class GenericClient extends events.EventEmitter {

  private clientSocket: any;
  private name: string;
  status: ClientStatus.Status = ClientStatus.Status.NOT_CONNECTED;
  ready: Promise<void>;
  private allData: string = ""; // all data received (for saving to a replay file)
  private dataSoFar: string = ""; // all data received after the last completed message
  private currentData: string; // all data received at the current data-event
  private firstTagOfMessage: string = undefined; // the first opening tag of a message
  private firstTagPosition: number;
  private messageLevel: number = 0; // to keep track of the xml nesting, if this drops to zero, we found a matching closing tag for the first opened tag of the message
  private offset: number = 0; // the position of the first character in the dataSoFar buffer as far as the parser is concerned (the parser parsed all messages)
  // TODO: this parser is only used to find the start and end of a xml message. The message string is then emitted as message and parsed AGAIN. This should be merged in the future.
  private parser = new SAXParser(true, {});

  constructor(sendProtocol: boolean = true, name?: string) {
    super();
    this.name = name;
    this.clientSocket = net.createConnection({ port: SERVER_PORT }, () => {
      if (sendProtocol) {
        this.writeData('<protocol>', () => {
          this.setStatus(ClientStatus.Status.CONNECTED); //NodeJS Sockets don't have flush, so this will have to do
        });
      } else {
        this.setStatus(ClientStatus.Status.CONNECTED);
      }
    });
    this.parser.onopentag = (tag) => {
      if (tag.name != "protocol") {
        if (this.firstTagOfMessage == undefined) {
          this.firstTagOfMessage = tag.name;
          this.firstTagPosition = this.parser.startTagPosition - 1; // one character more for the <
          this.messageLevel = 0;
        }
        if (tag.name == this.firstTagOfMessage) {
          this.messageLevel++;
        }
      }
    }
    this.parser.onclosetag = (tagName) => {
      if (tagName == this.firstTagOfMessage) {
        this.messageLevel--;
      }
      if (this.messageComplete()) {
        var msg = this.dataSoFar.substring(this.firstTagPosition - this.offset, this.parser.position - this.offset);
        Api.getLogger().log(this.name ? this.name : "GenericClient", "emitMessage", msg);
        this.emit('message', msg);
        var nextStart = this.parser.position - this.offset;
        this.offset = this.parser.position;
        this.dataSoFar = this.dataSoFar.substring(nextStart)
        this.firstTagOfMessage = undefined;
      }
    }
    this.clientSocket.on('data', (data) => {
      var clientName = this.name ? this.name : "unnamed client";
      this.allData += data;
      this.currentData = data;
      this.dataSoFar += data;
      this.parser.write(this.currentData);
      Api.getLogger().log(this.name ? this.name : "GenericClient", "receiveData", data);
    });
    this.clientSocket.on('end', () => {
      this.setStatus(ClientStatus.Status.DISCONNECTED);
    });
    this.ready = new Promise((res, rej) => {
      this.on('status', s => {
        var clientName = this.name ? this.name : "unnamed client";
        if (s == ClientStatus.Status.CONNECTED) {
          res();
        }
      })
    });
  }

  writeData(data: string, callback?: () => void) {
    Api.getLogger().log(this.name ? this.name : "GenericClient", "writeData", data);
    this.clientSocket.write(data, callback);
  }

  private messageComplete(): boolean {
    return (this.firstTagOfMessage != undefined && this.messageLevel == 0);
  }

  private setStatus(s: ClientStatus.Status) {
    this.status = s;
    this.emit('status', s);
  }

  public getAllData() {
    return this.allData;
  }
}

export module ClientStatus {
  export enum Status {
    NOT_CONNECTED,
    CONNECTED,
    DISCONNECTED,
    ERROR
  }

  export function toString(s: ClientStatus.Status): string {
    switch (s) {
      case ClientStatus.Status.NOT_CONNECTED:
        return "NOT CONNECTED";
      case ClientStatus.Status.CONNECTED:
        return "CONNECTED";
      case ClientStatus.Status.ERROR:
        return "ERROR";
      case ClientStatus.Status.DISCONNECTED:
        return "DISCONNECTED";
    }
  }
}
