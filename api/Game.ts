import { ObserverClient, RoomReservation } from './ObserverClient';
import { GameState } from './HaseUndIgel';
import { GameCreationOptions } from './GameCreationOptions';
import { Api, ExecutableStatus } from './Api';
import { ExecutableClient } from './ExecutableClient';
import { PlayerClientOptions } from './PlayerClient';
import { EventEmitter } from "events";

export class Game extends EventEmitter {
  name: string;
  observer: ObserverClient;
  client1: GameClient;
  client2: GameClient;
  gameStates: GameState[];
  private currentState: number;
  private is_live: boolean;
  ready: Promise<void>;
  private roomId: string;


  constructor(gco: GameCreationOptions, name: string) {
    super();
    this.name = name;
    var construct = (async function () {

      this.gameStates = [];
      this.currentState = 0;

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

      console.log("API server ready");

      //Create observer
      this.observer = new ObserverClient();

      this.observer.on('state', s => {
        console.log('state');
        this.gameStates.push(s);
        this.emit('state' + (this.gameStates.length - 1), s);
      });

      await this.observer.ready;

      console.log("Observer ready");

      //Create room
      var p1 = new PlayerClientOptions(gco.player1path, false, true);
      var p2 = new PlayerClientOptions(gco.player2path, false, true);

      var reservation: RoomReservation = await this.observer.prepareRoom(p1, p2);
      this.roomId = reservation.roomId;
      console.log("Room reserved");
      console.log("this.roomid = " + this.roomId);
      //Observe room
      await this.observer.observeRoom(reservation.roomId);

      //Create players
      this.client1 = new ExecutableClient('java', ['-jar'], gco.player1path, '127.0.0.1', 13050, reservation.reservation1);
      this.client2 = new ExecutableClient('java', ['-jar'], gco.player2path, '127.0.0.1', 13050, reservation.reservation2);

      this.client1.on('stdout', msg => {
        this.emit("client1", {
          type: "output",
          message: msg
        });
      });

      this.client1.on('stderr', msg => {
        this.emit("client1", {
          type: "error",
          message: msg
        });
      });

      this.client2.on('stdout', msg => {
        this.emit("client2", {
          type: "output",
          message: msg
        });
      });

      this.client2.on('stderr', msg => {
        this.emit("client2", {
          type: "error",
          message: msg
        });
      });

      await this.client1.start();
      await this.client2.start();

      console.log("Clients started!");

    }).bind(this);

    this.ready = construct();
  }

  /**
   * Returns true, if the game is currently running
   */
  getLive(): boolean {
    return this.is_live;
  }

  getState(n: number): Promise<GameState> {
    if (this.gameStates[n]) { //If our next state is already buffered
      return Promise.resolve(this.gameStates[n]);
    } else {//Wait for new state to be emitted
      return new Promise((res, rej) => {
        this.once('state' + n, s => {
          res(s);
        })
      })
    }
  }

  getNextState(): Promise<GameState> {
    this.currentState++;
    this.requestNext();
    return this.getState(this.currentState);
  }

  getCurrentState(): Promise<GameState> {
    return this.getState(this.currentState);
  }

  getPreviousState(): Promise<GameState> {
    if (this.currentState == 0) {
      return Promise.reject("Tried to request state from before the beginning of the game");
    } else {
      this.currentState--;
      return this.getState(this.currentState);
    }
  }

  requestNext() {
    this.observer.requestStep(this.roomId);
  }

  getLog(): string {
    return this.observer.log;
  }

}



export interface GameClient {
  ready: Promise<void>;
  start(): Promise<void>;
  stop();
}