///<references path="../../node_modules/@types/node/index.d.ts" />
const net = require('net');
import * as events from "events"
import { Helpers } from './Helpers';

const SERVER_PORT = 13050;

export class GenericClient extends events.EventEmitter {

  clientSocket: any;
  status: ClientStatus.Status;
  ready: Promise<void>;

  constructor(sendProtocol: boolean = true) {
    super();
    this.status = ClientStatus.Status.NOT_CONNECTED;
    this.clientSocket = net.createConnection({ port: SERVER_PORT }, () => {
      if (sendProtocol) {
        this.clientSocket.write('<protocol>', () => {
          Helpers.log('Protocol sent');
          this.setStatus(ClientStatus.Status.CONNECTED);
        });
      } else {
        this.setStatus(ClientStatus.Status.CONNECTED);
      }
    });
    this.clientSocket.on('data', (data) => {
      console.log("data: " + data);
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