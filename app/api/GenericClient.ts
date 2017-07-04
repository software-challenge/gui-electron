///<references path="../../node_modules/@types/node/index.d.ts" />
const net = require('net');
import * as events from "events"

const SERVER_PORT = 13050;

export class GenericClient extends events.EventEmitter {

  private clientSocket: any;

  constructor() {
    super();
    this.clientSocket = net.createConnection({ port: SERVER_PORT }, () => {
      console.log("connected");
    });
    this.clientSocket.on('data', (data) => {
      console.log("data: " + data);
    });
    this.clientSocket.on('end', () => {
      console.log("disconnected");
    });
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