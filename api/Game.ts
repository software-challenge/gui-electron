import { GenericClient } from './GenericClient';
import { ObserverClient, RoomReservation } from './ObserverClient';
import { GameState, GameResult } from './HaseUndIgel';
import { GameCreationOptions, PlayerType, StartType } from './GameCreationOptions';
import { Api, ExecutableStatus, ConsoleMessage } from './Api';
import { ExecutableClient } from './ExecutableClient';
import { PlayerClientOptions } from './PlayerClient';
import { HumanClient } from './HumanClient';
import { EventEmitter } from "events";
import { Helpers } from './Helpers';

export class Game extends EventEmitter {
  name: string;
  observer: ObserverClient;
  client1: GameClient;
  client2: GameClient;
  gameStates: GameState[];
  gameResult: GameResult;
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
        this.gameResult = r;
        this.emit('result', r);
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

      /* 
       * Only activate pause (stepping required) if both players are automated, because not pausing
       * in this situation would just playback the game very fast. Pausing in other cases is not
       * necessary because the GUI waits for input when the human player is the current player.
       */
      let pause = gco.firstPlayerType != "Human" && gco.secondPlayerType != "Human";

      //Create room
      let firstCanTimeout = gco.firstPlayerType != "Human";
      let firstShouldBePaused = pause;
      let secondCanTimeout = gco.secondPlayerType != "Human";
      let secondShouldBePaused = pause;
      var p1 = new PlayerClientOptions(gco.firstPlayerName, firstCanTimeout, firstShouldBePaused);
      var p2 = new PlayerClientOptions(gco.secondPlayerName, secondCanTimeout, secondShouldBePaused);

      var reservation: RoomReservation = await this.observer.prepareRoom(p1, p2);
      this.roomId = reservation.roomId;

      Logger.log("Reserved room with id " + this.roomId);

      //Observe room
      await this.observer.observeRoom(reservation.roomId);
      Logger.log("Observing room with id " + this.roomId);

      let configureClient = (type: PlayerType, startType: StartType, name: string, path: string, reservation: string): GameClient => {
        switch (type) {
          case "Computer":
            let executableClient;
            switch (startType) {
              case "Java":
                executableClient = new ExecutableClient('java', ['-jar'], path, '127.0.0.1', 13050, reservation);
                break;
              case "Direct":
                executableClient = new ExecutableClient(path, [], null, '127.0.0.1', 13050, reservation);
                break;
            }

            executableClient.on('stdout', msg => {
              let m: ConsoleMessage = {
                sender: "red",
                type: "output",
                text: msg
              };
              this.messages.push(m);
              this.emit('message', m);
            });

            executableClient.on('stderr', msg => {
              let m: ConsoleMessage = {
                sender: "red",
                type: "error",
                text: msg
              };
              this.messages.push(m);
              this.emit('message', m);
            });
            return executableClient;
          case "Human":
            let humanClient = new HumanClient(name, Api.getCurrentViewer().ui, reservation)
            return humanClient;
          case "External":
            throw "TODO";
        }
      }

      this.client1 = configureClient(gco.firstPlayerType, gco.firstPlayerStartType, gco.firstPlayerName, gco.firstPlayerPath, reservation.reservation1)
      this.client2 = configureClient(gco.secondPlayerType, gco.secondPlayerStartType, gco.secondPlayerName, gco.secondPlayerPath, reservation.reservation2)

      await this.client1.start();
      await Helpers.awaitEventOnce(Api.getServer(), 'newclient');
      Logger.log("Client 1 ready (reservation: " + reservation.reservation1 + ")");

      await this.client2.start();
      await Helpers.awaitEventOnce(Api.getServer(), 'newclient');
      Logger.log("Client 2 ready (reservation: " + reservation.reservation2 + ")");

      this.is_live = true;

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
    if (this.is_live) {
      this.currentState++;
      this.requestNext();
      return this.getState(this.currentState);
    } else {
      if (this.currentState < (this.gameStates.length - 1)) {
        this.currentState++;
      } else {
        if (this.gameResult) {
          this.emit('result', this.gameResult);
        }
      }
      return this.getState(this.currentState);
    }
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
    if (this.is_live) {
      this.observer.requestStep(this.roomId);
    }
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
