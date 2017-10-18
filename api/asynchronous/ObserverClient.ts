///<references path="../../node_modules/@types/node/index.d.ts" />

import { GenericClient } from './GenericClient';
import { PlayerClientOptions } from './PlayerClient';
import { Parser } from './Parser';
import { Helpers } from '../Helpers';
import { GameState, GameResult } from '../rules/HaseUndIgel';
import { Logger } from '../Logger';

const PASSPHRASE = "examplepassword"; // TODO read from server.properties file (in server directory)

export class ObserverClient extends GenericClient {
  log: string;
  constructor() {
    super(true, "Observer");
    this.log = "";
  }

  prepareRoom(player1: PlayerClientOptions, player2: PlayerClientOptions): Promise<RoomReservation> {
    return new Promise<RoomReservation>((resolve, reject) => {
      this.writeData(`
        <authenticate passphrase="${PASSPHRASE}" />
        <prepare gameType="swc_2018_hase_und_igel">
          <slot displayName="${player1.displayName}" canTimeout="${player1.canTimeout}" shouldBePaused="${player1.shouldBePaused}"/>
          <slot displayName="${player2.displayName}" canTimeout="${player2.canTimeout}" shouldBePaused="${player2.shouldBePaused}"/>
        </prepare>
      `, () => {
        });

      this.once('message', d => {
        d = d.toString(); //Stringify buffer
        if (/\<prepared/.test(d.toString())) { //Check if it's actually a message something was prepared
          d = d.replace('<protocol>', ''); //Strip unmatched protocol tag
          Parser.getJSONFromXML(d).then(res => {//Convert to JSON object
            res = res.prepared;//strip outer tag
            resolve({//Resolve promise
              roomId: res['$'].roomId,
              reservation1: res.reservation[0],
              reservation2: res.reservation[1]
            });
          })
        }
      });

      this.on('message', m => {
        m = m.toString();
        if (/joinedGameRoom/.test(m)) {
          m = m.replace('<protocol>', ''); //Strip unmatched protocol tag
          Parser.getJSONFromXML(m).then(res => {//Convert to JSON object
            console.log("Got joinedGameRoom: " + res);
          });
        }
      });





    });
  }

  awaitJoinGameRoom(): Promise<string> {
    this.writeData(`<authenticate passphrase="${PASSPHRASE}" />`, () => { });
    return new Promise((res, rej) => {
      let l = (m) => {
        m = m.toString();
        console.log("m");
        if (/joinedGameRoom/.test(m)) {
          this.removeListener('message', l);
          m = m.replace('<protocol>', ''); //Strip unmatched protocol tag
          Parser.getJSONFromXML(m).then(result => {//Convert to JSON object
            let roomId = result.joinedGameRoom.$.roomId
            console.log("joined game room " + roomId);
            res(roomId);
          });
        }
      };
      this.on('message', l);
    });
  }

  observeRoom(roomId: string): Promise<void> {
    return new Promise((res, rej) => {
      this.writeData(`<observe roomId="${roomId}" passphrase="${PASSPHRASE}" />`);//Send request
      this.once('message', d => {//Wait for answer
        d = d.toString(); //Stringify buffer
        Parser.getJSONFromXML(d).then(ans => {
          if (ans.observed.$.roomId == roomId) {
            res();
          } else {
            rej(`Expected to observe room ${roomId} but got confirmation for room ${ans.observed.$.roomId}!`);
          }
        }).then(val => {
          this.on('message', async function (msg) {
            // this.emit('message', msg);
            var decoded = await Parser.getJSONFromXML(msg);
            if (decoded.room) {
              switch (decoded.room.data[0]['$'].class) {
                case 'memento':
                  var state = decoded.room.data[0].state[0];
                  var gs = GameState.fromJSON(state);
                  this.emit('state', gs);
                  break;
                case 'result':
                  var result = decoded.room.data[0];
                  var gr = GameResult.fromJSON(result);
                  this.emit('result', gr);
                  break;
              }
            }
          });
        });
      });
    });
  }

  requestStep(roomId: string, forced: boolean = true): Promise<void> {
    Logger.getLogger().log("ObserverClient", "requestStep", "Requesting next step for room with id " + roomId + "(forced=" + forced + ")");
    return new Promise((res, rej) => {
      this.writeData(`<step roomId="${roomId}" forced="${forced}" />`);//Send request
      this.once('state', () => res()); //Wait for state
    });
  }

  setPaused(roomId: string, pause: boolean) {
    Logger.getLogger().log("ObserverClient", "setPaused", `Setting room ${roomId} to ${pause ? 'paused' : 'unpaused'}`);
    this.writeData(`<pause roomId="${roomId}" pause="${pause}" />`);//Send request
  }
}

export interface RoomReservation {
  roomId: string;
  reservation1: string;
  reservation2: string;
}
