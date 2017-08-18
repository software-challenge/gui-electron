import { ObserverClient, RoomReservation } from './ObserverClient';
import { GameState } from './HaseUndIgel';
import { GameCreationOptions } from './GameCreationOptions';
import { Api, ExecutableStatus, ConsoleMessage } from './Api';
import { ExecutableClient } from './ExecutableClient';
import { PlayerClientOptions } from './PlayerClient';
import { EventEmitter } from "events";
import { Helpers } from './Helpers';

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
  messages: ConsoleMessage[];


  constructor(gco: GameCreationOptions, name: string) {
    super();
    let Logger = Api.getLogger().focus("Game", "constructor");
    this.name = name;
    this.messages = [];
    this.gameStates = [];
    this.currentState = 0;
    Logger.log("Creating game " + name);
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

      Logger.log("API Server is ready");

      //Create observer
      Logger.log("Creating Observer Client");
      this.observer = new ObserverClient();

      this.observer.on('state', s => {
        this.gameStates.push(s);
        this.emit('state' + (this.gameStates.length - 1), s);
      });

      this.observer.on('result', r => {
        console.log(r);
        this.is_live = false;
      })

      this.observer.on('message', msg => {
        let m: ConsoleMessage = {
          sender: "observer",
          type: "output",
          text: msg
        };
        this.messages.push(m);
        // this.emit('message', m);
      });

      await this.observer.ready;

      Logger.log("Observer ready");

      //Create room
      var p1 = new PlayerClientOptions(gco.player1path, false, true);
      var p2 = new PlayerClientOptions(gco.player2path, false, true);

      var reservation: RoomReservation = await this.observer.prepareRoom(p1, p2);
      this.roomId = reservation.roomId;

      Logger.log("Reserved room with id " + this.roomId);

      //Observe room
      await this.observer.observeRoom(reservation.roomId);
      Logger.log("Observing room with id " + this.roomId);

      //Create players
      this.client1 = new ExecutableClient('java', ['-jar'], gco.player1path, '127.0.0.1', 13050, reservation.reservation1);
      this.client2 = new ExecutableClient('java', ['-jar'], gco.player2path, '127.0.0.1', 13050, reservation.reservation2);

      this.client1.on('stdout', msg => {
        let m: ConsoleMessage = {
          sender: "red",
          type: "output",
          text: msg
        };
        this.messages.push(m);
        this.emit('message', m);
      });

      this.client1.on('stderr', msg => {
        let m: ConsoleMessage = {
          sender: "red",
          type: "error",
          text: msg
        };
        this.messages.push(m);
        this.emit('message', m);
      });

      this.client2.on('stdout', msg => {
        let m: ConsoleMessage = {
          sender: "blue",
          type: "output",
          text: msg
        };
        this.messages.push(m);
        this.emit('message', m);
      });

      this.client2.on('stderr', msg => {
        let m: ConsoleMessage = {
          sender: "blue",
          type: "error",
          text: msg
        };
        this.messages.push(m);
        this.emit('message', m);
      });

      await this.client1.start();
      await Helpers.awaitEventOnce(Api.getServer(), 'newclient');
      Logger.log("Client 1 ready (reservation: " + reservation.reservation1 + ")");

      await this.client2.start();
      await Helpers.awaitEventOnce(Api.getServer(), 'newclient');
      Logger.log("Client 2 ready (reservation: " + reservation.reservation2 + ")");

      this.emit('ready');
      //setTimeout(() => this.emit('ready'), 750);//FIXME: Dirty hack since the server doesn't actually tell us when a client has successfully connected
    }).bind(this);

    this.ready = new Promise((res, rej) => {
      this.once('ready', () => {
        res();
      });
    });

    construct();
  }

  getMessages(): ConsoleMessage[] {
    return this.messages;
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
