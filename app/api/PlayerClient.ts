import { GenericClient } from './GenericClient';
import { Parser } from './Parser';

export class PlayerClientOptions {
  constructor(displayName: string, canTimeout: boolean, shouldBePaused: boolean) {
    this.displayName = displayName;
    this.canTimeout = canTimeout;
    this.shouldBePaused = shouldBePaused;
  }
  displayName: string;
  canTimeout: boolean;
  shouldBePaused: boolean;
}

export class GenericPlayer extends GenericClient {
  constructor() {
    super();
  }

  joinPrepared(reservation: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.clientSocket.write(`<joinPrepared reservationCode="${reservation}" />`);
      this.clientSocket.on('data', d => {
        d = d.toString(); //Stringify data
        if (/\<joined/.test(d)) {//If we got the message that we joined
          console.log(Parser.getJSONFromXML(d));
        } else {
          console.log("Debug: " + d);//Output for debug purposes
        }
      })
    });
  }
}