import { ObserverClient, RoomReservation } from './ObserverClient';
import { GameState } from './HaseUndIgel';
import { GameCreationOptions } from './GameCreationOptions';
import { Api, ExecutableStatus } from './Api';
import { ExecutableClient } from './ExecutableClient';
import { PlayerClientOptions } from './PlayerClient';
import { EventEmitter } from "events";

export class Game {
  name: string;
  observer: ObserverClient;
  client1: GameClient;
  client2: GameClient;
  gameStates: GameState[];
  private is_live: boolean;
  ready: Promise<void>;
  private roomId: string;


  constructor(gco: GameCreationOptions, name: string) {
    this.name = name;
    var construct = (async function () {

      //Register hook to go offline
      Api.getServer().on('status', s => {
        if (s == ExecutableStatus.Status.EXITED) {
          //Server exited.
          //Stop client processes, set game to not live
          this.is_live = false;
        }
      });
      //Wait for server to start
      await Api.getServer().ready;

      //Create observer
      this.observer = new ObserverClient();

      await this.observer.ready;

      //Create room
      var p1 = new PlayerClientOptions(gco.player1path, false, true);
      var p2 = new PlayerClientOptions(gco.player2path, false, true);

      var reservation: RoomReservation = await this.observer.prepareRoom(p1, p2);
      this.roomId = reservation.roomId;
      //Observe room
      await this.observer.observeRoom(reservation.roomId);

      //Create players
      this.client1 = new ExecutableClient('java', ['-jar'], gco.player1path, 'localhost', 13050, reservation.reservation1);
      this.client2 = new ExecutableClient('java', ['-jar'], gco.player2path, 'localhost', 13050, reservation.reservation2);

      this.client1.on('stdout', msg => {
        console.log("[CLIENT1] " + msg);
      });

      this.client1.on('stderr', msg => {
        console.log("[CLIENT1] ERROR:" + msg);
      });

      this.client2.on('stdout', msg => {
        console.log("[CLIENT2] " + msg);
      });

      this.client2.on('stderr', msg => {
        console.log("[CLIENT2] ERROR:" + msg);
      });

      await this.client1.start();
      await this.client2.start();


    }).bind(this);

    this.ready = construct();
  }

  /**
   * Returns true, if the game is currently running
   */
  getLive(): boolean {
    return this.is_live;
  }

  next() {
    this.observer.requestStep(this.roomId);
  }

}



export interface GameClient {
  ready: Promise<void>;
  start(): Promise<void>;
  stop();
}