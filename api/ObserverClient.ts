///<references path="../../node_modules/@types/node/index.d.ts" />

import { GenericClient } from './GenericClient';
import { PlayerClientOptions } from './PlayerClient';
import { Parser } from './Parser';
import { Helpers } from './Helpers';
import { GameState } from './HaseUndIgel';

const PASSPHRASE = "examplepassword"; // TODO read from server.properties file (in server directory)

export class ObserverClient extends GenericClient {

  constructor() {
    super(true, "Observer");
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
            var decoded = await Parser.getJSONFromXML(msg);
            if (decoded.room) {
              switch (decoded.room.data[0]['$'].class) {
                case 'memento':
                  var state = decoded.room.data[0].state[0];
                  var gs = GameState.fromJSON(state);
                  this.emit('state', gs);
                  break;
              }
            }
          });
        });
      });
    });
  }

  requestStep(roomId: string, forced: boolean = true): Promise<void> {
    return new Promise((res, rej) => {
      this.writeData(`<step roomId="${roomId}" forced="${forced}" />`, () => res());//Send request
    });
  }
}

export interface RoomReservation {
  roomId: string;
  reservation1: string;
  reservation2: string;
}