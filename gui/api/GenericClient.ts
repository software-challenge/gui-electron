///<references path="../../node_modules/@types/node/index.d.ts" />
const net = require('net');
import * as events from "events"
import { Helpers } from './Helpers';

const SERVER_PORT = 13050;

export class GenericClient extends events.EventEmitter {

  private clientSocket: any;
  private name: string;
  status: ClientStatus.Status;
  ready: Promise<void>;
  private dataSoFar: string;

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
    this.clientSocket.on('data', (data) => {
      //console.log("data: " + data);
      this.dataSoFar += data;
      if (this.bracketsMatch()) {
        var msg = this.dataSoFar;
        this.emit('message', msg);
        this.dataSoFar = "";
      }
    });
    this.clientSocket.on('end', () => {
      this.setStatus(ClientStatus.Status.DISCONNECTED);
    });
    this.ready = new Promise((res, rej) => {
      this.on('status', s => {
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

  private bracketsMatch(): boolean {
    let opening: number = 0;
    let closing: number = 0;
    for (let i = 0; i < this.dataSoFar.length; i++) {
      if (this.dataSoFar[i] == '<') {
        opening++;
      } else if (this.dataSoFar[i] == '>') {
        closing++;
      }
    }
    return (opening == closing);
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