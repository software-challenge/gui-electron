///<references path="../../node_modules/@types/node/index.d.ts" />
///<references path="../../node_modules/@types/sax/index.d.ts" />
const net = require('net');
import * as events from "events"
import { Helpers } from './Helpers';
import { SAXParser } from 'sax';

const SERVER_PORT = 13050;

export class GenericClient extends events.EventEmitter {

  private clientSocket: any;
  private name: string;
  status: ClientStatus.Status;
  ready: Promise<void>;
  private dataSoFar: string;
  private firstTagOfMessage: string; // the first opening tag of a message
  private messageLevel: number; // to keep track of the xml nesting, if this drops to zero, we found a matching closing tag for the first opened tag of the message
  private parser = new SAXParser(true, { lowercase: true });

  constructor(sendProtocol: boolean = true, name?: string) {
    super();
    this.name = name;
    this.dataSoFar = "";
    this.status = ClientStatus.Status.NOT_CONNECTED;
    this.clientSocket = net.createConnection({ port: SERVER_PORT }, () => {
      if (sendProtocol) {
        this.writeData('<protocol>', () => {
          Helpers.log('Protocol sent');
          this.setStatus(ClientStatus.Status.CONNECTED);
        });
      } else {
        this.setStatus(ClientStatus.Status.CONNECTED);
      }
    });
    this.parser.onopentag = (tag) => {
      if (tag.name != "protocol") {
        if (this.firstTagOfMessage == undefined) {
          this.firstTagOfMessage = tag.name;
          this.messageLevel = 0;
          Helpers.log("found first tag: " + this.firstTagOfMessage)
        }
        if (tag.name == this.firstTagOfMessage) {
          this.messageLevel++;
        }
      }
    }
    this.parser.onclosetag = (tagName) => {
      Helpers.log("END: " + tagName)
      Helpers.log("looking for " + this.firstTagOfMessage)
      if (tagName == this.firstTagOfMessage) {
        this.messageLevel--;
        Helpers.log("decreasing message level. it is now " + this.messageLevel)
      }
      if (this.messageComplete()) {
        Helpers.log("message complete!")
        // FIXME: the message may be completed by a tag which is in the middle of the corrent data chunk. In this case, we only have to attach the data until this position to the message and continue parsing the current chunk for a new message!
        var msg = this.dataSoFar;
        this.emit('message', msg);
        this.dataSoFar = "";
        this.firstTagOfMessage = undefined;
      }
    }
    this.clientSocket.on('data', (data) => {
      var clientName = this.name ? this.name : "unnamed client";
      Helpers.log(clientName + " received data: " + data);
      this.dataSoFar += data;
      this.parser.write(data);
    });
    this.clientSocket.on('end', () => {
      this.setStatus(ClientStatus.Status.DISCONNECTED);
    });
    this.ready = new Promise((res, rej) => {
      this.on('status', s => {
        var clientName = this.name ? this.name : "unnamed client";
        Helpers.log(clientName + ": new client connection status: " + s.toString);
        if (s == ClientStatus.Status.CONNECTED) {
          res();
        }
      })
    });
  }

  writeData(data: string, callback?: () => void) {
    if (this.name) {
      Helpers.log(`${this.name} writing data: ` + data);
      this.clientSocket.write(data, callback);
    }
    else {
      Helpers.log("Writing data: " + data);
      this.clientSocket.write(data, callback);
    }
  }

  private messageComplete(): boolean {
    var result = (this.firstTagOfMessage != undefined && this.messageLevel == 0);
    Helpers.log("checking for complete message " + (this.firstTagOfMessage != undefined) + "  " + (this.messageLevel == 0) + " => " + result + " | " + this.firstTagOfMessage + " " + this.messageLevel);
    return result;
  }

  private setStatus(s: ClientStatus.Status) {
    this.status = s;
    this.emit('status', s);
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